"""
WebSocket Handlers for Real-Time Chat
Socket.IO events: connect, disconnect, join_match, send_message, typing, read_message
"""
import socketio
from bson import ObjectId
from datetime import datetime
from typing import Dict, Set
import logging

from . import db
from .auth import decode_token

# Setup logging
logger = logging.getLogger(__name__)

# Online users tracking: user_id -> sid
online_users: Dict[str, str] = {}

# User to match room mapping: sid -> match_id
user_match_rooms: Dict[str, str] = {}

# Typing status: match_id -> user_id (who is typing)
typing_users: Dict[str, str] = {}


def register_socket_handlers(sio: socketio.AsyncServer):
    """Register all Socket.IO event handlers"""
    
    @sio.event
    async def connect(sid, environ, auth):
        """
        Handle client connection
        Client must send JWT token in auth dict: { 'token': 'jwt_token' }
        """
        try:
            # Extract token from auth
            if not auth or 'token' not in auth:
                logger.warning(f"❌ Connection rejected: No token provided")
                await sio.disconnect(sid)
                return False
            
            token = auth['token']
            
            # Verify JWT token
            payload = decode_token(token)
            if not payload:
                logger.warning(f"❌ Connection rejected: Invalid token")
                await sio.disconnect(sid)
                return False
            
            user_id = payload.get('sub')
            if not user_id:
                logger.warning(f"❌ Connection rejected: No user_id in token")
                await sio.disconnect(sid)
                return False
            
            # Get user from database
            try:
                user = await db.users.find_one({"_id": ObjectId(user_id)})
                if not user:
                    logger.warning(f"❌ Connection rejected: User not found {user_id}")
                    await sio.disconnect(sid)
                    return False
            except Exception as e:
                logger.error(f"❌ Database error in connect: {str(e)}")
                await sio.disconnect(sid)
                return False
            
            # Store user session
            online_users[user_id] = sid
            
            # Emit connection success to client
            await sio.emit('connected', {
                'userId': user_id,
                'userName': user.get('name', 'Anonymous'),
                'timestamp': datetime.utcnow().isoformat()
            }, room=sid)
            
            logger.info(f"✅ User connected: {user.get('name')} (ID: {user_id}, SID: {sid})")
            
            # Broadcast online status to all matches
            await broadcast_online_status(sio, user_id, online=True)
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error in connect handler: {str(e)}")
            await sio.disconnect(sid)
            return False
    
    
    @sio.event
    async def disconnect(sid):
        """Handle client disconnection"""
        try:
            # Find user by sid
            user_id = None
            for uid, user_sid in online_users.items():
                if user_sid == sid:
                    user_id = uid
                    break
            
            if user_id:
                # Remove from online users
                del online_users[user_id]
                
                # Remove from typing users
                if user_id in typing_users:
                    del typing_users[user_id]
                
                # Remove from match rooms
                if sid in user_match_rooms:
                    del user_match_rooms[sid]
                
                logger.info(f"✅ User disconnected: ID {user_id}, SID {sid}")
                
                # Broadcast offline status
                await broadcast_online_status(sio, user_id, online=False)
            
        except Exception as e:
            logger.error(f"❌ Error in disconnect handler: {str(e)}")
    
    
    @sio.event
    async def join_match(sid, data):
        """
        User joins a match room
        Data: { 'match_id': 'xxx' }
        """
        try:
            match_id = data.get('match_id')
            if not match_id:
                await sio.emit('error', {'message': 'match_id required'}, room=sid)
                return
            
            # Find user_id from sid
            user_id = None
            for uid, user_sid in online_users.items():
                if user_sid == sid:
                    user_id = uid
                    break
            
            if not user_id:
                await sio.emit('error', {'message': 'User not authenticated'}, room=sid)
                return
            
            # Verify user is part of this match
            try:
                match = await db.matches.find_one({"_id": ObjectId(match_id)})
                if not match:
                    await sio.emit('error', {'message': 'Match not found'}, room=sid)
                    return
                
                user_oid = ObjectId(user_id)
                if user_oid not in [match['user1'], match['user2']]:
                    await sio.emit('error', {'message': 'Not authorized for this match'}, room=sid)
                    return
                
            except Exception as e:
                logger.error(f"❌ Database error in join_match: {str(e)}")
                await sio.emit('error', {'message': 'Failed to join match'}, room=sid)
                return
            
            # Join Socket.IO room
            await sio.enter_room(sid, match_id)
            user_match_rooms[sid] = match_id
            
            logger.info(f"✅ User {user_id} joined match {match_id}")
            
            # Emit success to client
            await sio.emit('joined_match', {
                'match_id': match_id,
                'timestamp': datetime.utcnow().isoformat()
            }, room=sid)
            
            # Notify other user in match (if online)
            other_user_id = str(match['user1' if match['user2'] == user_oid else 'user2'])
            if other_user_id in online_users:
                other_sid = online_users[other_user_id]
                await sio.emit('user_joined', {
                    'user_id': user_id,
                    'match_id': match_id
                }, room=other_sid)
            
        except Exception as e:
            logger.error(f"❌ Error in join_match handler: {str(e)}")
            await sio.emit('error', {'message': 'Failed to join match'}, room=sid)
    
    
    @sio.event
    async def send_message(sid, data):
        """
        Send message to match
        Data: { 'match_id': 'xxx', 'content': 'Hello!' }
        """
        try:
            match_id = data.get('match_id')
            content = data.get('content', '').strip()
            
            if not match_id or not content:
                await sio.emit('error', {'message': 'match_id and content required'}, room=sid)
                return
            
            # Find user_id from sid
            user_id = None
            for uid, user_sid in online_users.items():
                if user_sid == sid:
                    user_id = uid
                    break
            
            if not user_id:
                await sio.emit('error', {'message': 'User not authenticated'}, room=sid)
                return
            
            # Get user info
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if not user:
                await sio.emit('error', {'message': 'User not found'}, room=sid)
                return
            
            # Validate message length
            if len(content) > 1000:
                await sio.emit('error', {'message': 'Message too long (max 1000 characters)'}, room=sid)
                return
            
            # Create message in database
            message_doc = {
                "matchId": ObjectId(match_id),
                "senderId": ObjectId(user_id),
                "content": content,
                "createdAt": datetime.utcnow(),
                "readAt": None
            }
            
            result = await db.messages.insert_one(message_doc)
            message_id = str(result.inserted_id)
            
            logger.info(f"✅ Message sent: {user_id} -> {match_id}")
            
            # Prepare broadcast message
            broadcast_data = {
                '_id': message_id,
                'matchId': match_id,
                'senderId': user_id,
                'senderName': user.get('name', 'Anonymous'),
                'content': content,
                'createdAt': message_doc['createdAt'].isoformat(),
                'readAt': None
            }
            
            # Emit to entire match room (both users)
            await sio.emit('new_message', broadcast_data, room=match_id)
            
            # Clear typing indicator
            if user_id in typing_users and typing_users[user_id] == match_id:
                del typing_users[user_id]
                await sio.emit('typing_stopped', {
                    'user_id': user_id,
                    'match_id': match_id
                }, room=match_id, skip_sid=sid)
            
        except Exception as e:
            logger.error(f"❌ Error in send_message handler: {str(e)}")
            await sio.emit('error', {'message': 'Failed to send message'}, room=sid)
    
    
    @sio.event
    async def typing(sid, data):
        """
        Broadcast typing indicator
        Data: { 'match_id': 'xxx', 'is_typing': true }
        """
        try:
            match_id = data.get('match_id')
            is_typing = data.get('is_typing', False)
            
            if not match_id:
                return
            
            # Find user_id from sid
            user_id = None
            for uid, user_sid in online_users.items():
                if user_sid == sid:
                    user_id = uid
                    break
            
            if not user_id:
                return
            
            if is_typing:
                typing_users[user_id] = match_id
                # Emit to other users in match (not sender)
                await sio.emit('user_typing', {
                    'user_id': user_id,
                    'match_id': match_id
                }, room=match_id, skip_sid=sid)
            else:
                if user_id in typing_users:
                    del typing_users[user_id]
                await sio.emit('typing_stopped', {
                    'user_id': user_id,
                    'match_id': match_id
                }, room=match_id, skip_sid=sid)
            
        except Exception as e:
            logger.error(f"❌ Error in typing handler: {str(e)}")
    
    
    @sio.event
    async def read_message(sid, data):
        """
        Mark message as read
        Data: { 'message_id': 'xxx', 'match_id': 'xxx' }
        """
        try:
            message_id = data.get('message_id')
            match_id = data.get('match_id')
            
            if not message_id or not match_id:
                return
            
            # Find user_id from sid
            user_id = None
            for uid, user_sid in online_users.items():
                if user_sid == sid:
                    user_id = uid
                    break
            
            if not user_id:
                return
            
            # Update message readAt timestamp
            result = await db.messages.update_one(
                {
                    "_id": ObjectId(message_id),
                    "matchId": ObjectId(match_id),
                    "readAt": None
                },
                {
                    "$set": {
                        "readAt": datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                # Emit read receipt to sender
                await sio.emit('message_read', {
                    'message_id': message_id,
                    'match_id': match_id,
                    'read_by': user_id,
                    'read_at': datetime.utcnow().isoformat()
                }, room=match_id, skip_sid=sid)
                
                logger.info(f"✅ Message read: {message_id} by {user_id}")
            
        except Exception as e:
            logger.error(f"❌ Error in read_message handler: {str(e)}")


async def broadcast_online_status(sio: socketio.AsyncServer, user_id: str, online: bool):
    """
    Broadcast user online/offline status to all their matches
    """
    try:
        # Get all matches for this user
        user_oid = ObjectId(user_id)
        matches = await db.matches.find({
            "$or": [
                {"user1": user_oid},
                {"user2": user_oid}
            ]
        }).to_list(length=100)
        
        # Broadcast to each match
        for match in matches:
            match_id = str(match['_id'])
            await sio.emit('user_online_status', {
                'user_id': user_id,
                'match_id': match_id,
                'online': online,
                'timestamp': datetime.utcnow().isoformat()
            }, room=match_id)
        
    except Exception as e:
        logger.error(f"❌ Error broadcasting online status: {str(e)}")

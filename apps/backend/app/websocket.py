from fastapi import WebSocket, WebSocketDisconnect, Query
from typing import Dict, Set
from .auth import decode_token
from .crud import create_message, verify_user_in_match, get_user_by_id
import json
from datetime import datetime


class ConnectionManager:
    """Manages WebSocket connections for real-time chat"""
    
    def __init__(self):
        # match_id -> set of WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, match_id: str):
        """Accept and register a WebSocket connection"""
        await websocket.accept()
        if match_id not in self.active_connections:
            self.active_connections[match_id] = set()
        self.active_connections[match_id].add(websocket)
    
    def disconnect(self, websocket: WebSocket, match_id: str):
        """Remove a WebSocket connection"""
        if match_id in self.active_connections:
            self.active_connections[match_id].discard(websocket)
            if not self.active_connections[match_id]:
                del self.active_connections[match_id]
    
    async def broadcast(self, match_id: str, message: dict):
        """Broadcast a message to all connections in a match"""
        if match_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[match_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.add(connection)
            
            # Clean up disconnected clients
            for conn in disconnected:
                self.active_connections[match_id].discard(conn)


manager = ConnectionManager()


async def websocket_endpoint(websocket: WebSocket, match_id: str, token: str = Query(...)):
    """
    WebSocket endpoint for real-time chat
    URL: /ws/{match_id}?token=<jwt_token>
    """
    # Validate token
    payload = decode_token(token)
    if not payload:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    user_id = payload.get("sub")
    if not user_id:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    # Verify user is part of this match
    if not await verify_user_in_match(match_id, user_id):
        await websocket.close(code=1008, reason="Not authorized")
        return
    
    # Get user info
    user = await get_user_by_id(user_id)
    if not user:
        await websocket.close(code=1008, reason="User not found")
        return
    
    # Connect
    await manager.connect(websocket, match_id)
    
    # Send connection confirmation
    await websocket.send_json({
        "type": "connected",
        "match_id": match_id,
        "user_id": user_id
    })
    
    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Create message in database
            message_doc = await create_message(
                match_id=match_id,
                sender_id=user_id,
                content=message_data.get("content", "")
            )
            
            # Prepare broadcast message
            broadcast_message = {
                "type": "message",
                "message": {
                    "_id": message_doc["_id"],
                    "match_id": message_doc["match_id"],
                    "sender": message_doc["sender"],
                    "sender_name": user["name"],
                    "content": message_doc["content"],
                    "created_at": message_doc["created_at"].isoformat()
                }
            }
            
            # Broadcast to all connections in this match
            await manager.broadcast(match_id, broadcast_message)
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, match_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, match_id)

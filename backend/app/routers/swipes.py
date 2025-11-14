"""
Swipe Router - Swipe system with automatic match detection
Handles like, pass, super_like actions with real-time notifications
"""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from bson import ObjectId
import logging

from ..auth import get_current_user
from ..db import get_db

router = APIRouter(prefix="/swipes", tags=["Swipes"])
logger = logging.getLogger(__name__)


# ===== REQUEST MODELS =====

class SwipeRequest(BaseModel):
    """Request model for swipe action"""
    target_user_id: str = Field(..., description="ID of user being swiped")
    action: Literal["like", "pass", "super_like"] = Field(..., description="Swipe action type")
    
    class Config:
        json_schema_extra = {
            "example": {
                "target_user_id": "507f1f77bcf86cd799439011",
                "action": "like"
            }
        }


# ===== RESPONSE MODELS =====

class UserPreview(BaseModel):
    """Minimal user data for match notification"""
    id: str
    name: str
    age: int
    field: str
    avatar: Optional[str] = None
    bio: Optional[str] = None


class LastMessage(BaseModel):
    """Last message in a match conversation"""
    content: str
    timestamp: datetime
    sender_id: str


class MatchedUserInfo(BaseModel):
    """User info for matches list"""
    id: str
    name: str
    avatar: Optional[str] = None
    is_online: bool = False
    last_seen: Optional[datetime] = None


class MatchListItem(BaseModel):
    """Single match item in matches list"""
    id: str
    matched_user: MatchedUserInfo
    last_message: Optional[LastMessage] = None
    unread_count: int = 0
    matched_at: datetime


class MatchesListResponse(BaseModel):
    """Response for GET /swipes/matches"""
    matches: list[MatchListItem]
    count: int


class MatchResponse(BaseModel):
    """Match object returned when users match"""
    id: str
    user1_id: str
    user2_id: str
    created_at: datetime
    matched_user: UserPreview  # The other person in the match
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "user1_id": "507f1f77bcf86cd799439012",
                "user2_id": "507f1f77bcf86cd799439013",
                "created_at": "2024-01-15T10:30:00Z",
                "matched_user": {
                    "id": "507f1f77bcf86cd799439013",
                    "name": "Alice",
                    "age": 25,
                    "field": "Photography",
                    "avatar": "https://example.com/avatar.jpg",
                    "bio": "Photographer based in Jakarta"
                }
            }
        }


class SwipeResponse(BaseModel):
    """Response after swipe action"""
    success: bool = True
    action: str
    is_match: bool = False
    match: Optional[MatchResponse] = None
    message: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "action": "like",
                "is_match": True,
                "match": {
                    "id": "507f1f77bcf86cd799439011",
                    "user1_id": "507f1f77bcf86cd799439012",
                    "user2_id": "507f1f77bcf86cd799439013",
                    "created_at": "2024-01-15T10:30:00Z",
                    "matched_user": {
                        "id": "507f1f77bcf86cd799439013",
                        "name": "Alice",
                        "age": 25,
                        "field": "Photography",
                        "avatar": "https://example.com/avatar.jpg"
                    }
                },
                "message": "It's a match!"
            }
        }


class SwipeStatsResponse(BaseModel):
    """User's swipe statistics"""
    total_swipes: int
    likes_sent: int
    super_likes_sent: int
    passes: int
    matches: int
    match_rate: float  # Percentage


# ===== HELPER FUNCTIONS =====

async def check_duplicate_swipe(user_id: str, target_user_id: str) -> bool:
    """Check if user already swiped on target"""
    db = get_db()
    
    existing_swipe = await db.swipes.find_one({
        "user_id": user_id,
        "target_user_id": target_user_id
    })
    
    return existing_swipe is not None


async def check_mutual_like(user_id: str, target_user_id: str) -> bool:
    """Check if target user also liked current user"""
    db = get_db()
    
    # Check if target_user has liked user (reverse swipe)
    reverse_swipe = await db.swipes.find_one({
        "user_id": target_user_id,
        "target_user_id": user_id,
        "action": {"$in": ["like", "super_like"]}  # Both like and super_like count
    })
    
    return reverse_swipe is not None


async def create_match(user1_id: str, user2_id: str) -> dict:
    """Create a match between two users"""
    db = get_db()
    
    # Check if match already exists (shouldn't happen, but safety check)
    existing_match = await db.matches.find_one({
        "$or": [
            {"user1_id": user1_id, "user2_id": user2_id},
            {"user1_id": user2_id, "user2_id": user1_id}
        ]
    })
    
    if existing_match:
        logger.warning(f"Match already exists between {user1_id} and {user2_id}")
        return existing_match
    
    # Create new match
    match_data = {
        "user1_id": user1_id,
        "user2_id": user2_id,
        "created_at": datetime.utcnow(),
        "last_message_at": None,
        "unread_count_user1": 0,
        "unread_count_user2": 0
    }
    
    result = await db.matches.insert_one(match_data)
    match_data["_id"] = result.inserted_id
    
    logger.info(f"[OK] Match created: {user1_id} <-> {user2_id}")
    
    return match_data


async def get_user_preview(user_id: str) -> Optional[dict]:
    """Get minimal user data for match notification"""
    db = get_db()
    
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        return None
    
    user = await db.users.find_one(
        {"_id": user_object_id},
        {
            "name": 1,
            "age": 1,
            "field": 1,
            "avatar": 1,
            "bio": 1
        }
    )
    
    if not user:
        return None
    
    return {
        "id": str(user["_id"]),
        "name": user.get("name", "Unknown"),
        "age": user.get("age", 0),
        "field": user.get("field", "Unknown"),
        "avatar": user.get("avatar"),
        "bio": user.get("bio")
    }


async def send_match_notification(user_id: str, matched_user_id: str, match_id: str):
    """Send real-time match notification via WebSocket"""
    try:
        # Import here to avoid circular dependency
        from ..websocket_handlers import sio
        
        # Get both users' data
        user1_preview = await get_user_preview(user_id)
        user2_preview = await get_user_preview(matched_user_id)
        
        if not user1_preview or not user2_preview:
            logger.warning(f"Could not get user previews for match notification")
            return
        
        # Send notification to user1
        await sio.emit('new_match', {
            'match_id': match_id,
            'matched_user': user2_preview,
            'message': f"You matched with {user2_preview['name']}!"
        }, room=user_id)
        
        # Send notification to user2
        await sio.emit('new_match', {
            'match_id': match_id,
            'matched_user': user1_preview,
            'message': f"You matched with {user1_preview['name']}!"
        }, room=matched_user_id)
        
        logger.info(f"[OK] Match notifications sent for match {match_id}")
        
    except Exception as e:
        # Don't fail the request if notification fails
        logger.error(f"[ERROR] Failed to send match notification: {e}")


# ===== ENDPOINTS =====

@router.post("", response_model=SwipeResponse, status_code=status.HTTP_201_CREATED)
async def swipe_user(
    swipe_request: SwipeRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Swipe on a user (like, pass, or super_like)
    
    **Business Rules:**
    - Cannot swipe on yourself
    - Cannot swipe on same person twice
    - Like/Super_like triggers match detection
    - Match creates bidirectional relationship
    
    **Match Detection:**
    - If you like someone who already liked you → MATCH!
    - Real-time notification sent via WebSocket
    
    **Returns:**
    - success: Always true if request succeeds
    - action: The action performed
    - is_match: True if this swipe created a match
    - match: Match object with matched user info (if match occurred)
    - message: Human-readable message
    """
    db = get_db()
    current_user_id = str(current_user["_id"])
    target_user_id = swipe_request.target_user_id
    action = swipe_request.action
    
    try:
        # Validate target_user_id format
        try:
            target_object_id = ObjectId(target_user_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid target_user_id format"
            )
        
        # Rule 1: Cannot swipe yourself
        if current_user_id == target_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot swipe on yourself"
            )
        
        # Rule 2: Check if target user exists
        target_user = await db.users.find_one({"_id": target_object_id})
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target user not found"
            )
        
        # Rule 3: Check for duplicate swipe
        if await check_duplicate_swipe(current_user_id, target_user_id):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already swiped on this user"
            )
        
        # Save swipe to database
        swipe_data = {
            "user_id": current_user_id,
            "target_user_id": target_user_id,
            "action": action,
            "created_at": datetime.utcnow()
        }
        
        await db.swipes.insert_one(swipe_data)
        logger.info(f"[OK] Swipe saved: {current_user_id} -> {target_user_id} ({action})")
        
        # Initialize response
        response = SwipeResponse(
            success=True,
            action=action,
            is_match=False,
            match=None,
            message=f"Successfully {action}d user"
        )
        
        # Match detection (only for like and super_like)
        if action in ["like", "super_like"]:
            is_mutual = await check_mutual_like(current_user_id, target_user_id)
            
            if is_mutual:
                # IT'S A MATCH!
                match_doc = await create_match(current_user_id, target_user_id)
                match_id = str(match_doc["_id"])
                
                # Get matched user info
                matched_user_preview = await get_user_preview(target_user_id)
                
                if matched_user_preview:
                    response.is_match = True
                    response.match = MatchResponse(
                        id=match_id,
                        user1_id=current_user_id,
                        user2_id=target_user_id,
                        created_at=match_doc["created_at"],
                        matched_user=UserPreview(**matched_user_preview)
                    )
                    response.message = "It's a match! 🎉"
                    
                    # Send real-time notification
                    await send_match_notification(current_user_id, target_user_id, match_id)
                    
                    logger.info(f"[SUCCESS] Match created: {current_user_id} <-> {target_user_id}")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Swipe failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process swipe"
        )


@router.get("/stats", response_model=SwipeStatsResponse)
async def get_swipe_stats(current_user: dict = Depends(get_current_user)):
    """
    Get current user's swipe statistics
    
    **Returns:**
    - total_swipes: Total number of swipes performed
    - likes_sent: Number of likes sent
    - super_likes_sent: Number of super likes sent
    - passes: Number of passes
    - matches: Number of matches created
    - match_rate: Percentage of likes that resulted in matches
    """
    db = get_db()
    current_user_id = str(current_user["_id"])
    
    try:
        # Count swipes by action
        pipeline = [
            {"$match": {"user_id": current_user_id}},
            {"$group": {
                "_id": "$action",
                "count": {"$sum": 1}
            }}
        ]
        
        swipe_counts = {}
        async for doc in db.swipes.aggregate(pipeline):
            swipe_counts[doc["_id"]] = doc["count"]
        
        # Get match count
        match_count = await db.matches.count_documents({
            "$or": [
                {"user1_id": current_user_id},
                {"user2_id": current_user_id}
            ]
        })
        
        # Calculate stats
        total_swipes = sum(swipe_counts.values())
        likes_sent = swipe_counts.get("like", 0)
        super_likes_sent = swipe_counts.get("super_like", 0)
        passes = swipe_counts.get("pass", 0)
        
        # Calculate match rate
        total_likes = likes_sent + super_likes_sent
        match_rate = (match_count / total_likes * 100) if total_likes > 0 else 0.0
        
        return SwipeStatsResponse(
            total_swipes=total_swipes,
            likes_sent=likes_sent,
            super_likes_sent=super_likes_sent,
            passes=passes,
            matches=match_count,
            match_rate=round(match_rate, 2)
        )
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to get swipe stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve swipe statistics"
        )


@router.get("/history")
async def get_swipe_history(
    limit: int = 50,
    skip: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's swipe history
    
    **Query Parameters:**
    - limit: Number of swipes to return (default: 50, max: 100)
    - skip: Number of swipes to skip for pagination (default: 0)
    
    **Returns:**
    List of swipes with target user information
    """
    db = get_db()
    current_user_id = str(current_user["_id"])
    
    # Validate limit
    if limit > 100:
        limit = 100
    
    try:
        # Get swipes with user info via aggregation
        pipeline = [
            {"$match": {"user_id": current_user_id}},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$lookup": {
                    "from": "users",
                    "let": {"target_id": {"$toObjectId": "$target_user_id"}},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$_id", "$$target_id"]}}},
                        {"$project": {
                            "name": 1,
                            "age": 1,
                            "field": 1,
                            "avatar": 1
                        }}
                    ],
                    "as": "target_user"
                }
            },
            {"$unwind": {"path": "$target_user", "preserveNullAndEmptyArrays": True}}
        ]
        
        swipes = []
        async for swipe in db.swipes.aggregate(pipeline):
            swipe_obj = {
                "id": str(swipe["_id"]),
                "target_user_id": swipe["target_user_id"],
                "action": swipe["action"],
                "created_at": swipe["created_at"],
                "target_user": None
            }
            
            if "target_user" in swipe and swipe["target_user"]:
                target = swipe["target_user"]
                swipe_obj["target_user"] = {
                    "id": str(target["_id"]),
                    "name": target.get("name", "Unknown"),
                    "age": target.get("age", 0),
                    "field": target.get("field", "Unknown"),
                    "avatar": target.get("avatar")
                }
            
            swipes.append(swipe_obj)
        
        return {
            "swipes": swipes,
            "count": len(swipes),
            "skip": skip,
            "limit": limit
        }
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to get swipe history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve swipe history"
        )


@router.delete("/{target_user_id}")
async def undo_swipe(
    target_user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Undo a swipe (delete swipe record)
    
    **Note:** This does NOT delete matches that were already created.
    Use unmatch endpoint to remove matches.
    
    **Path Parameters:**
    - target_user_id: ID of user to undo swipe on
    
    **Returns:**
    - success: True if swipe was deleted
    - message: Confirmation message
    """
    db = get_db()
    user_id = str(current_user["_id"])
    
    try:
        # Delete the swipe
        result = await db.swipes.delete_one({
            "user_id": user_id,
            "target_user_id": target_user_id
        })
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Swipe not found"
            )
        
        logger.info(f"[OK] User {user_id} undid swipe on {target_user_id}")
        
        return {
            "success": True,
            "message": "Swipe successfully undone"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Failed to undo swipe: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to undo swipe"
        )


@router.get("/matches", response_model=MatchesListResponse)
async def get_user_matches(
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """
    Get user's matches with last message and online status
    
    **Query Parameters:**
    - limit: Number of matches to return (default: 50, max: 100)
    - offset: Number of matches to skip for pagination (default: 0)
    
    **Returns:**
    - matches: List of matches sorted by last message time (most recent first)
    - count: Total number of matches returned
    
    **Match Object:**
    - id: Match ID
    - matched_user: User info (id, name, avatar, is_online, last_seen)
    - last_message: Last message in conversation (content, timestamp, sender_id)
    - unread_count: Number of unread messages for current user
    - matched_at: When the match was created
    """
    db = get_db()
    user_id = str(current_user["_id"])
    
    # Validate parameters
    if limit > 100:
        limit = 100
    if limit < 1:
        limit = 50
    if offset < 0:
        offset = 0
    
    try:
        # Aggregation pipeline to get matches with user info and last message
        pipeline = [
            # Match documents where current user is either user1 or user2
            {
                "$match": {
                    "$or": [
                        {"user1_id": user_id},
                        {"user2_id": user_id}
                    ]
                }
            },
            
            # Sort by last_message_at (most recent first), then by created_at
            {
                "$sort": {
                    "last_message_at": -1,
                    "created_at": -1
                }
            },
            
            # Pagination
            {"$skip": offset},
            {"$limit": limit},
            
            # Add matched_user_id field (the other user in the match)
            {
                "$addFields": {
                    "matched_user_id": {
                        "$cond": {
                            "if": {"$eq": ["$user1_id", user_id]},
                            "then": "$user2_id",
                            "else": "$user1_id"
                        }
                    }
                }
            },
            
            # Lookup matched user info
            {
                "$lookup": {
                    "from": "users",
                    "let": {"matched_id": {"$toObjectId": "$matched_user_id"}},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$_id", "$$matched_id"]}}},
                        {
                            "$project": {
                                "_id": 1,
                                "name": 1,
                                "avatar": 1,
                                "is_online": 1,
                                "last_seen": 1
                            }
                        }
                    ],
                    "as": "matched_user_data"
                }
            },
            
            # Lookup last message
            {
                "$lookup": {
                    "from": "messages",
                    "let": {"match_id": {"$toString": "$_id"}},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$match_id", "$$match_id"]}}},
                        {"$sort": {"created_at": -1}},
                        {"$limit": 1},
                        {
                            "$project": {
                                "content": 1,
                                "created_at": 1,
                                "sender_id": 1
                            }
                        }
                    ],
                    "as": "last_message_data"
                }
            },
            
            # Unwind arrays (handle empty results)
            {
                "$addFields": {
                    "matched_user_data": {"$arrayElemAt": ["$matched_user_data", 0]},
                    "last_message_data": {"$arrayElemAt": ["$last_message_data", 0]}
                }
            }
        ]
        
        # Execute aggregation
        cursor = db.matches.aggregate(pipeline)
        matches_data = await cursor.to_list(length=limit)
        
        # Format response
        matches = []
        for match in matches_data:
            # Skip if matched user not found (deleted account)
            if not match.get("matched_user_data"):
                continue
            
            matched_user_data = match["matched_user_data"]
            
            # Determine unread count based on which user we are
            unread_count = 0
            if match["user1_id"] == user_id:
                unread_count = match.get("unread_count_user1", 0)
            else:
                unread_count = match.get("unread_count_user2", 0)
            
            # Build matched user info
            matched_user = MatchedUserInfo(
                id=str(matched_user_data["_id"]),
                name=matched_user_data.get("name", "Unknown"),
                avatar=matched_user_data.get("avatar"),
                is_online=matched_user_data.get("is_online", False),
                last_seen=matched_user_data.get("last_seen")
            )
            
            # Build last message (if exists)
            last_message = None
            if match.get("last_message_data"):
                msg = match["last_message_data"]
                last_message = LastMessage(
                    content=msg.get("content", ""),
                    timestamp=msg.get("created_at", datetime.utcnow()),
                    sender_id=msg.get("sender_id", "")
                )
            
            # Build match list item
            match_item = MatchListItem(
                id=str(match["_id"]),
                matched_user=matched_user,
                last_message=last_message,
                unread_count=unread_count,
                matched_at=match.get("created_at", datetime.utcnow())
            )
            
            matches.append(match_item)
        
        logger.info(f"[OK] Retrieved {len(matches)} matches for user {user_id}")
        
        return MatchesListResponse(
            matches=matches,
            count=len(matches)
        )
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to get matches: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve matches: {str(e)}"
        )


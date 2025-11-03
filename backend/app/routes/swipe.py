"""
Swipe & Match Routes - Tinder-style Matching System
Handles: Swipe actions, mutual match detection, matches management
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Literal
from datetime import datetime
from bson import ObjectId
from pymongo.errors import PyMongoError, DuplicateKeyError
import logging

from .. import db
from ..auth import get_current_user

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/swipes", tags=["Swipe & Match"])


# ===== MODELS =====
class SwipeRequest(BaseModel):
    targetId: str
    action: Literal["skip", "save", "connect"]


# ===== ROUTES =====

@router.post("/")
async def swipe_user(
    data: SwipeRequest,
    current_user = Depends(get_current_user)
):
    """
    Record a swipe action and check for mutual matches
    Actions: skip (pass), save (like but no action), connect (want to collaborate)
    """
    try:
        current_user_id = current_user["_id"]
        
        # ✅ Validate target user ID format
        try:
            target_user_id = ObjectId(data.targetId)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid target user ID format"
            )
        
        # ✅ Prevent self-swipe
        if current_user_id == target_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot swipe on yourself"
            )
        
        # ✅ Check if target user exists and is active
        target_user = await db.users().find_one({"_id": target_user_id})
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target user not found"
            )
        
        if not target_user.get("verified", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot swipe on unverified user"
            )
        
        # ✅ Check if already swiped
        existing_swipe = await db.swipes().find_one({
            "userId": current_user_id,
            "targetId": target_user_id
        })
        
        if existing_swipe:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already swiped on this user"
            )
        
        # Record swipe
        swipe_doc = {
            "userId": current_user_id,
            "targetId": target_user_id,
            "action": data.action,
            "createdAt": datetime.utcnow()
        }
        
        await db.swipes().insert_one(swipe_doc)
        
        # Check for mutual match (both users connected)
        if data.action == "connect":
            mutual_swipe = await db.swipes().find_one({
                "userId": target_user_id,
                "targetId": current_user_id,
                "action": "connect"
            })
            
            if mutual_swipe:
                # ✅ Atomic match creation to prevent race condition
                # Use unique compound index on (user1, user2) to prevent duplicates
                try:
                    # Ensure consistent ordering to prevent duplicate matches
                    user1, user2 = sorted([str(current_user_id), str(target_user_id)])
                    user1_oid = ObjectId(user1)
                    user2_oid = ObjectId(user2)
                    
                    match_doc = {
                        "user1": user1_oid,
                        "user2": user2_oid,
                        "createdAt": datetime.utcnow(),
                        "chatOpened": False,
                        "chatId": None
                    }
                    
                    # Try to insert, will fail if match already exists (due to unique index)
                    result = await db.matches().insert_one(match_doc)
                    
                    # Get target user profile for response
                    target_profile = await db.profiles().find_one({"userId": target_user_id})
                    
                    return {
                        "matched": True,
                        "matchId": str(result.inserted_id),
                        "user": {
                            "id": str(target_user_id),
                            "name": target_profile.get("name") if target_profile else "User",
                            "photo": target_profile.get("photos", [""])[0] if target_profile and target_profile.get("photos") else ""
                        }
                    }
                    
                except DuplicateKeyError:
                    # Match already exists, just return it
                    logger.info(f"Match already exists between {user1} and {user2}")
                    existing_match = await db.matches().find_one({
                        "user1": user1_oid,
                        "user2": user2_oid
                    })
                    
                    target_profile = await db.profiles().find_one({"userId": target_user_id})
                    
                    return {
                        "matched": True,
                        "matchId": str(existing_match["_id"]),
                        "user": {
                            "id": str(target_user_id),
                            "name": target_profile.get("name") if target_profile else "User",
                            "photo": target_profile.get("photos", [""])[0] if target_profile and target_profile.get("photos") else ""
                        }
                    }
        
        return {
            "matched": False,
            "action": data.action,
            "message": "Swipe recorded successfully"
        }
    
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except PyMongoError as e:
        logger.error(f"❌ Database error in swipe_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except ValueError as e:
        logger.error(f"❌ Validation error in swipe_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid swipe data"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in swipe_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process swipe"
        )


@router.get("/matches")
async def get_matches(
    current_user = Depends(get_current_user)
):
    """
    Get all matches for current user with profile info and error handling
    """
    try:
        current_user_id = current_user["_id"]
        
        # Find all matches
        matches_cursor = db.matches().find({
            "$or": [
                {"user1": current_user_id},
                {"user2": current_user_id}
            ]
        }).sort("createdAt", -1)
        
        matches = await matches_cursor.to_list(length=100)
        
        # Populate with profile data
        matches_list = []
        for match in matches:
            try:
                # Determine the other user
                other_user_id = match["user2"] if match["user1"] == current_user_id else match["user1"]
                
                # Get profile
                profile = await db.profiles().find_one({"userId": other_user_id})
                user = await db.users().find_one({"_id": other_user_id})
                
                if profile and user:
                    matches_list.append({
                        "matchId": str(match["_id"]),
                        "user": {
                            "id": str(other_user_id),
                            "name": profile.get("name", "Unknown User"),
                            "age": profile.get("age"),
                            "field": profile.get("field"),
                            "bio": profile.get("bio"),
                            "photo": profile.get("photos", [""])[0] if profile.get("photos") else "",
                            "verified": user.get("verified", False)
                        },
                        "matchedAt": match["createdAt"].isoformat(),
                        "chatOpened": match.get("chatOpened", False),
                        "chatId": str(match["chatId"]) if match.get("chatId") else None
                    })
                else:
                    logger.warning(f"⚠️ Missing profile or user for match {match['_id']}")
            except Exception as e:
                logger.error(f"❌ Error processing match {match.get('_id')}: {str(e)}")
                continue  # Skip this match, continue with others
        
        return {
            "matches": matches_list,
            "total": len(matches_list)
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in get_matches: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in get_matches: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve matches"
        )


@router.get("/matches/{matchId}")
async def get_match_detail(
    matchId: str,
    current_user = Depends(get_current_user)
):
    """
    Get detailed info about a specific match with proper error handling
    """
    try:
        # ✅ Validate matchId format
        try:
            match_oid = ObjectId(matchId)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid match ID format"
            )
        
        match = await db.matches().find_one({"_id": match_oid})
        
        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found"
            )
        
        # ✅ Verify user is part of this match
        current_user_id = current_user["_id"]
        if match["user1"] != current_user_id and match["user2"] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized access to this match"
            )
        
        # Get the other user
        other_user_id = match["user2"] if match["user1"] == current_user_id else match["user1"]
        profile = await db.profiles().find_one({"userId": other_user_id})
        user = await db.users().find_one({"_id": other_user_id})
        
        if not profile or not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return {
            "matchId": str(match["_id"]),
            "user": {
                "id": str(other_user_id),
                "name": profile.get("name", "Unknown User"),
                "age": profile.get("age"),
                "field": profile.get("field"),
                "bio": profile.get("bio"),
                "photos": profile.get("photos", []),
                "skills": profile.get("skills", []),
                "interests": profile.get("interests", []),
                "verified": user.get("verified", False)
            },
            "matchedAt": match["createdAt"].isoformat(),
            "chatOpened": match.get("chatOpened", False),
            "chatId": str(match["chatId"]) if match.get("chatId") else None
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in get_match_detail: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in get_match_detail: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve match details"
        )


@router.post("/matches/{matchId}/open-chat")
async def open_match_chat(
    matchId: str,
    current_user = Depends(get_current_user)
):
    """
    Open/create a chat for a match with error handling
    """
    try:
        # ✅ Validate matchId format
        try:
            match_oid = ObjectId(matchId)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid match ID format"
            )
        
        match = await db.matches().find_one({"_id": match_oid})
        
        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found"
            )
        
        # ✅ Verify user is part of this match
        current_user_id = current_user["_id"]
        if match["user1"] != current_user_id and match["user2"] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized"
            )
        
        # If chat already exists, return it
        if match.get("chatId"):
            return {
                "chatId": str(match["chatId"]),
                "existing": True
            }
        
        # Create new chat
        chat_doc = {
            "matchId": match_oid,
            "participants": [match["user1"], match["user2"]],
            "createdAt": datetime.utcnow(),
            "lastMessageAt": datetime.utcnow()
        }
        
        chat_result = await db.chats().insert_one(chat_doc)
        
        # Update match with chatId
        await db.matches().update_one(
            {"_id": match_oid},
            {
                "$set": {
                    "chatId": chat_result.inserted_id,
                    "chatOpened": True
                }
            }
        )
        
        return {
            "chatId": str(chat_result.inserted_id),
            "existing": False,
            "message": "Chat created successfully"
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in open_match_chat: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in open_match_chat: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to open chat"
        )


@router.delete("/matches/{matchId}")
async def unmatch_user(
    matchId: str,
    current_user = Depends(get_current_user)
):
    """
    Remove a match (unmatch) with proper error handling
    """
    try:
        # ✅ Validate matchId format
        try:
            match_oid = ObjectId(matchId)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid match ID format"
            )
        
        match = await db.matches().find_one({"_id": match_oid})
        
        if not match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Match not found"
            )
        
        # ✅ Verify user is part of this match
        current_user_id = current_user["_id"]
        if match["user1"] != current_user_id and match["user2"] != current_user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized"
            )
        
        # Delete match
        result = await db.matches().delete_one({"_id": match_oid})
        
        if result.deleted_count == 0:
            logger.warning(f"⚠️ Failed to delete match {matchId}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to remove match"
            )
        
        # Optionally delete chat and messages
        if match.get("chatId"):
            await db.chats().delete_one({"_id": match["chatId"]})
            await db.messages().delete_many({"chatId": match["chatId"]})
        
        return {
            "message": "Match removed successfully"
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in unmatch_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in unmatch_user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove match"
        )

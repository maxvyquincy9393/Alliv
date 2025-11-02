"""
Swipe & Match Routes - Tinder-style Matching System
Handles: Swipe actions, mutual match detection, matches management
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Literal
from datetime import datetime
from bson import ObjectId

from .. import db
from ..auth import get_current_user

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
        target_user_id = ObjectId(data.targetId)
        
        # Prevent self-swipe
        if current_user_id == target_user_id:
            raise HTTPException(status_code=400, detail="Cannot swipe on yourself")
        
        # Check if already swiped
        existing_swipe = await db.swipes().find_one({
            "userId": current_user_id,
            "targetId": target_user_id
        })
        
        if existing_swipe:
            raise HTTPException(status_code=400, detail="Already swiped on this user")
        
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
                # Create match if doesn't exist
                existing_match = await db.matches().find_one({
                    "$or": [
                        {"user1": current_user_id, "user2": target_user_id},
                        {"user1": target_user_id, "user2": current_user_id}
                    ]
                })
                
                if not existing_match:
                    match_doc = {
                        "user1": current_user_id,
                        "user2": target_user_id,
                        "createdAt": datetime.utcnow(),
                        "chatOpened": False,
                        "chatId": None
                    }
                    
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
        
        return {
            "matched": False,
            "action": data.action,
            "message": "Swipe recorded successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/matches")
async def get_matches(
    current_user = Depends(get_current_user)
):
    """
    Get all matches for current user with profile info
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
                        "name": profile.get("name"),
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
        
        return {
            "matches": matches_list,
            "total": len(matches_list)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/matches/{matchId}")
async def get_match_detail(
    matchId: str,
    current_user = Depends(get_current_user)
):
    """
    Get detailed info about a specific match
    """
    try:
        match = await db.matches().find_one({"_id": ObjectId(matchId)})
        
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Verify user is part of this match
        current_user_id = current_user["_id"]
        if match["user1"] != current_user_id and match["user2"] != current_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized access to this match")
        
        # Get the other user
        other_user_id = match["user2"] if match["user1"] == current_user_id else match["user1"]
        profile = await db.profiles().find_one({"userId": other_user_id})
        user = await db.users().find_one({"_id": other_user_id})
        
        if not profile or not user:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return {
            "matchId": str(match["_id"]),
            "user": {
                "id": str(other_user_id),
                "name": profile.get("name"),
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
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/matches/{matchId}/open-chat")
async def open_match_chat(
    matchId: str,
    current_user = Depends(get_current_user)
):
    """
    Open/create a chat for a match
    """
    try:
        match = await db.matches().find_one({"_id": ObjectId(matchId)})
        
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Verify user is part of this match
        current_user_id = current_user["_id"]
        if match["user1"] != current_user_id and match["user2"] != current_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # If chat already exists, return it
        if match.get("chatId"):
            return {
                "chatId": str(match["chatId"]),
                "existing": True
            }
        
        # Create new chat
        chat_doc = {
            "matchId": ObjectId(matchId),
            "participants": [match["user1"], match["user2"]],
            "createdAt": datetime.utcnow(),
            "lastMessageAt": datetime.utcnow()
        }
        
        chat_result = await db.chats().insert_one(chat_doc)
        
        # Update match with chatId
        await db.matches().update_one(
            {"_id": ObjectId(matchId)},
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
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/matches/{matchId}")
async def unmatch_user(
    matchId: str,
    current_user = Depends(get_current_user)
):
    """
    Remove a match (unmatch)
    """
    try:
        match = await db.matches().find_one({"_id": ObjectId(matchId)})
        
        if not match:
            raise HTTPException(status_code=404, detail="Match not found")
        
        # Verify user is part of this match
        current_user_id = current_user["_id"]
        if match["user1"] != current_user_id and match["user2"] != current_user_id:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # Delete match
        await db.matches().delete_one({"_id": ObjectId(matchId)})
        
        # Optionally delete chat and messages
        if match.get("chatId"):
            await db.chats().delete_one({"_id": match["chatId"]})
            await db.messages().delete_many({"chatId": match["chatId"]})
        
        return {
            "message": "Match removed successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

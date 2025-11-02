from . import db
import uuid
from datetime import datetime
from typing import List, Optional


async def create_user(user_data: dict) -> dict:
    """Create a new user"""
    user_data["_id"] = f"user::{str(uuid.uuid4())}"
    user_data["created_at"] = datetime.utcnow()
    user_data["last_active"] = datetime.utcnow()
    user_data["behavior_score"] = 0.8
    
    await db.users().insert_one(user_data)
    return user_data


async def get_user_by_email(email: str) -> Optional[dict]:
    """Get user by email"""
    return await db.users().find_one({"email": email})


async def get_user_by_id(user_id: str) -> Optional[dict]:
    """Get user by ID"""
    return await db.users().find_one({"_id": user_id})


async def compute_match_candidates(user: dict, limit: int = 20) -> List[dict]:
    """
    Compute match candidates using rule-based scoring:
    - Shared skills: +0.2 per skill
    - Same project interest: +0.5
    - Different role (complementary): +0.3
    """
    # Get all users except current user
    cursor = db.users().find({"_id": {"$ne": user["_id"]}})
    pool = await cursor.to_list(length=500)
    
    # Get already liked users
    liked_cursor = db.likes().find({"from": user["_id"]})
    liked_ids = set([like["to"] async for like in liked_cursor])
    
    results = []
    user_skills = set(user.get("skills", []))
    user_interest = user.get("project_interest", "")
    user_role = user.get("role", "")
    
    for candidate in pool:
        # Skip if already liked
        if candidate["_id"] in liked_ids:
            continue
        
        score = 0.0
        
        # Shared skills
        candidate_skills = set(candidate.get("skills", []))
        shared_skills = user_skills & candidate_skills
        score += len(shared_skills) * 0.2
        
        # Same project interest
        if user_interest == candidate.get("project_interest", ""):
            score += 0.5
        
        # Complementary role
        if user_role != candidate.get("role", ""):
            score += 0.3
        
        # Behavior score factor
        score *= candidate.get("behavior_score", 0.8)
        
        results.append((candidate, score))
    
    # Sort by score descending
    results.sort(key=lambda x: x[1], reverse=True)
    
    # Return top N candidates
    top_candidates = [r[0] for r in results[:limit]]
    return top_candidates


async def add_like(from_id: str, to_id: str) -> dict:
    """
    Add a like and check for mutual match
    Returns: {"match": bool, "match_data": dict or None}
    """
    # Check if like already exists
    existing = await db.likes().find_one({"from": from_id, "to": to_id})
    if existing:
        return {"match": False, "match_data": None}
    
    # Create like
    like_doc = {
        "_id": f"like::{str(uuid.uuid4())}",
        "from": from_id,
        "to": to_id,
        "created_at": datetime.utcnow()
    }
    await db.likes().insert_one(like_doc)
    
    # Check for mutual like
    mutual_like = await db.likes().find_one({"from": to_id, "to": from_id})
    
    if mutual_like:
        # Create match
        match_doc = {
            "_id": f"match::{str(uuid.uuid4())}",
            "users": [from_id, to_id],
            "created_at": datetime.utcnow(),
            "status": "active"
        }
        await db.matches().insert_one(match_doc)
        
        return {"match": True, "match_data": match_doc}
    
    return {"match": False, "match_data": None}


async def get_user_matches(user_id: str) -> List[dict]:
    """Get all matches for a user"""
    cursor = db.matches().find({
        "users": user_id,
        "status": "active"
    }).sort("created_at", -1)
    
    match_list = await cursor.to_list(length=100)
    
    # Enrich with other user data
    enriched_matches = []
    for match in match_list:
        other_user_id = match["users"][0] if match["users"][1] == user_id else match["users"][1]
        other_user = await get_user_by_id(other_user_id)
        
        if other_user:
            # Remove sensitive data
            other_user.pop("password_hash", None)
            match["other_user"] = other_user
            enriched_matches.append(match)
    
    return enriched_matches


async def create_message(match_id: str, sender_id: str, content: str) -> dict:
    """Create a new message"""
    message_doc = {
        "_id": f"msg::{str(uuid.uuid4())}",
        "match_id": match_id,
        "sender": sender_id,
        "content": content,
        "created_at": datetime.utcnow()
    }
    await db.messages().insert_one(message_doc)
    return message_doc


async def get_match_messages(match_id: str, limit: int = 100) -> List[dict]:
    """Get messages for a match"""
    cursor = db.messages().find({"match_id": match_id}).sort("created_at", -1).limit(limit)
    message_list = await cursor.to_list(length=limit)
    message_list.reverse()  # Oldest first
    return message_list


async def verify_user_in_match(match_id: str, user_id: str) -> bool:
    """Verify that a user is part of a match"""
    match = await db.matches().find_one({"_id": match_id})
    if not match:
        return False
    return user_id in match["users"]

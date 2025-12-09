from . import db
import uuid
from datetime import datetime
from typing import List, Optional
from bson import ObjectId


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
    Compute match candidates using scalable MongoDB Aggregation Pipeline.
    - Shared skills: +0.2 per skill
    - Same project interest: +0.5
    - Different role (complementary): +0.3
    """
    user_id = user["_id"]
    user_skills = user.get("skills", [])
    user_interest = user.get("project_interest", "")
    user_role = user.get("role", "")

    # Get already liked users (using correct schema fields: userId/targetId)
    # db.likes() is alias for db.swipes()
    liked_cursor = db.likes().find({"userId": user_id})
    liked_ids = [like["targetId"] async for like in liked_cursor]

    pipeline = [
        # 1. Filter: Exclude self and already swiped users
        {
            "$match": {
                "_id": {
                    "$ne": user_id,
                    "$nin": liked_ids
                }
            }
        },
        # 2. Calculate Scores using projection/addFields
        {
            "$addFields": {
                "shared_skills_count": {
                    "$size": {
                        "$setIntersection": [
                            {"$ifNull": ["$skills", []]}, 
                            user_skills
                        ]
                    }
                },
                "same_interest_score": {
                    "$cond": [
                        {"$eq": [{"$ifNull": ["$project_interest", ""]}, user_interest]}, 
                        0.5, 
                        0
                    ]
                },
                "diff_role_score": {
                    "$cond": [
                        {"$ne": [{"$ifNull": ["$role", ""]}, user_role]}, 
                        0.3, 
                        0
                    ]
                },
                "behavior_score": {"$ifNull": ["$behavior_score", 0.8]}
            }
        },
        # 3. Compute Final Score
        {
            "$addFields": {
                "score": {
                    "$multiply": [
                        {
                            "$add": [
                                {"$multiply": ["$shared_skills_count", 0.2]},
                                "$same_interest_score",
                                "$diff_role_score"
                            ]
                        },
                        "$behavior_score"
                    ]
                }
            }
        },
        # 4. Sort by score descending
        {"$sort": {"score": -1}},
        # 5. Limit results
        {"$limit": limit}
    ]

    cursor = db.users().aggregate(pipeline)
    return await cursor.to_list(length=limit)



async def create_message(match_id: str, sender_id: str, content: str) -> dict:
    """Create a new message"""
    message_doc = {
        "_id": f"msg::{str(uuid.uuid4())}",
        "match_id": str(match_id),
        "sender": str(sender_id),
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
    try:
        match_query = {"_id": ObjectId(match_id)} if ObjectId.is_valid(match_id) else {"_id": match_id}
        match = await db.matches().find_one(match_query)
        if not match:
            return False

        user_ids = [str(uid) for uid in match.get("users", [])]
        return str(user_id) in user_ids
    except Exception:
        return False

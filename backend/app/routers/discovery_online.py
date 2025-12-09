"""
Discovery Online Router - Find compatible online users
Production-ready endpoint with AI-powered compatibility scoring
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from bson import ObjectId
import logging

from ..auth import get_current_user, oauth2_scheme
from .. import db
from ..services import get_matching_service, MatchResult
from ..config import settings

router = APIRouter(prefix="/discover", tags=["Discovery"])
logger = logging.getLogger(__name__)


# ===== RESPONSE MODELS =====

class OnlineUserResponse(BaseModel):
    """Single online user with AI-powered compatibility score"""
    id: str
    name: str
    age: int
    field: str
    avatar: str
    skills: List[str]
    interests: List[str]
    bio: str
    location: Dict[str, Any]
    isOnline: bool
    lastSeen: datetime
    compatibility: int = Field(..., ge=0, le=100, description="AI-powered compatibility %")
    match_breakdown: Optional[Dict[str, float]] = None
    match_reasons: Optional[List[str]] = None
    conversation_starters: Optional[List[str]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "name": "Sarah Chen",
                "age": 28,
                "field": "Photography",
                "avatar": "https://example.com/avatar.jpg",
                "skills": ["Portrait", "Editing", "Studio"],
                "interests": ["Travel", "Art", "Nature"],
                "bio": "Passionate photographer looking for creative collaborations",
                "location": {"lat": -6.2088, "lon": 106.8456, "city": "Jakarta"},
                "isOnline": True,
                "lastSeen": "2025-11-03T10:30:00Z",
                "compatibility": 85,
                "match_reasons": ["✅ Shared skills: Photography, Editing", "💡 Common interests: Travel, Art"]
            }
        }


class OnlineUsersResponse(BaseModel):
    """Response for online users discovery"""
    users: List[OnlineUserResponse]
    count: int
    field_filter: Optional[str] = None
    ai_powered: bool = Field(default=True, description="Whether AI matching is enabled")
    
    class Config:
        json_schema_extra = {
            "example": {
                "users": [...],
                "count": 10,
                "field_filter": "Photography",
                "ai_powered": True
            }
        }


async def _get_current_user_dependency(
    token: Optional[str] = Depends(oauth2_scheme)
) -> dict:
    """Wrap auth dependency so tests can patch get_current_user."""
    try:
        return await get_current_user(token=token)
    except HTTPException:
        raise
    except Exception as exc:
        logger.warning(f"[WARN] Auth dependency error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )


def calculate_compatibility(
    current_user: dict,
    target_user: dict
) -> int:
    """
    Calculate a simple compatibility score between two users.

    Scoring breakdown:
    - Common skills: 40% (max 40 points)
    - Common interests: 40% (max 40 points)
    - Field match: 20% (max 20 points)
    """
    try:
        score = 0

        current_skills = set(current_user.get('skills', []))
        target_skills = set(target_user.get('skills', []))
        current_interests = set(current_user.get('interests', []))
        target_interests = set(target_user.get('interests', []))
        current_field = current_user.get('field', '').lower().strip()
        target_field = target_user.get('field', '').lower().strip()

        # 1. Skills match (40%)
        if current_skills and target_skills:
            common_skills = current_skills.intersection(target_skills)
            total_skills = current_skills.union(target_skills)
            skills_ratio = len(common_skills) / len(total_skills)
            score += int(skills_ratio * 40)

        # 2. Interests match (40%)
        if current_interests and target_interests:
            common_interests = current_interests.intersection(target_interests)
            total_interests = current_interests.union(target_interests)
            interests_ratio = len(common_interests) / len(total_interests)
            score += int(interests_ratio * 40)

        # 3. Field match (20%)
        if current_field and target_field:
            if current_field == target_field:
                score += 20
            elif current_field in target_field or target_field in current_field:
                score += 10

        return max(0, min(100, score))
    except Exception as exc:
        logger.error(f"[ERROR] Compatibility calculation error: {exc}")
        return 0


def format_user_response(
    user: dict,
    compatibility_or_match: Any,  # MatchResult or int compatibility
    include_details: bool = False
) -> OnlineUserResponse:
    """
    Format MongoDB user document to OnlineUserResponse with AI match data
    
    Args:
        user: MongoDB user document
        compatibility_or_match: MatchResult from matching service or numeric score
        include_details: Whether to include breakdown and conversation starters
        
    Returns:
        OnlineUserResponse: Formatted user with AI compatibility
    """
    # Normalize compatibility input
    if isinstance(compatibility_or_match, MatchResult):
        compatibility = compatibility_or_match.score
        breakdown = compatibility_or_match.breakdown if include_details else None
        reasons = compatibility_or_match.reasons if include_details else None
        starters = (
            compatibility_or_match.conversation_starters
            if include_details else None
        )
    else:
        compatibility = int(compatibility_or_match or 0)
        breakdown = None
        reasons = None
        starters = None

    compatibility = max(0, min(100, compatibility))

    response = OnlineUserResponse(
        id=str(user['_id']),
        name=user.get('name', ''),
        age=user.get('age', 0),
        field=user.get('field', ''),
        avatar=user.get('avatar', ''),
        skills=user.get('skills', []),
        interests=user.get('interests', []),
        bio=user.get('bio', ''),
        location=user.get('location', {}),
        isOnline=user.get('isOnline', False),
        lastSeen=user.get('lastSeen', datetime.utcnow()),
        compatibility=compatibility,
        match_reasons=reasons if include_details else None,
        match_breakdown=None,
        conversation_starters=None
    )

    # Only include detailed breakdown for high matches
    if include_details and compatibility >= 60:
        response.match_breakdown = breakdown
        response.conversation_starters = starters

    return response


# ===== MAIN ENDPOINT =====

@router.get("/online", response_model=OnlineUsersResponse)
async def discover_online_users(
    field: Optional[str] = Query(None, description="Filter by creative field (e.g., 'Photography')"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    include_details: bool = Query(False, description="Include match breakdown and starters"),
    current_user: dict = Depends(_get_current_user_dependency)
):
    """
    Discover compatible online users with AI-powered matching
    
    **Features:**
    - ✅ AI-powered compatibility scoring (0-100)
    - ✅ Returns only online users (isOnline = true)
    - ✅ Excludes current user
    - ✅ Excludes already swiped users
    - ✅ ML-based semantic similarity
    - ✅ Conversation starter suggestions
    - ✅ Sorted by compatibility (desc) and lastSeen (desc)
    
    **AI Compatibility Factors:**
    - 30% Skill matching (complementary + overlap)
    - 25% Interest alignment
    - 15% Field compatibility (synergy matrix)
    - 10% Experience level fit
    - 10% Availability match
    - 5% AI semantic similarity (embeddings)
    - 5% Location proximity
    
    **Query Parameters:**
    - field: Filter by creative field (optional)
    - limit: Max results (1-100, default 20)
    - include_details: Get match breakdown and conversation starters
    
    **Returns:**
    - users: List of compatible online users with AI scores
    - count: Number of users returned
    - field_filter: Applied field filter (if any)
    - ai_powered: Whether AI matching is active
    """
    try:
        current_user_id = current_user['_id']
        
        # Initialize AI matching service
        matching_service = get_matching_service(use_ai=settings.USE_AI_MATCHING)
        
        # ===== STEP 1: GET ALREADY SWIPED USER IDS =====
        swiped_user_ids = set()
        try:
            swipes_cursor = db.swipes().find(
                {"userId": current_user_id},
                {"swipedUserId": 1}
            )
            
            async for swipe in swipes_cursor:
                swiped_id = swipe.get('swipedUserId')
                if swiped_id:
                    swiped_user_ids.add(swipe['swipedUserId'])
                    
        except Exception as e:
            logger.warning(f"[WARN] Could not fetch swipes: {e}")
        
        # ===== STEP 2: BUILD QUERY FILTERS =====
        query_filters = {
            "isOnline": True,  # Only online users
            "_id": {
                "$ne": current_user_id,  # Exclude current user
                "$nin": list(swiped_user_ids)  # Exclude swiped users
            }
        }
        
        # Add field filter if specified
        if field:
            query_filters["field"] = {
                "$regex": f"^{field}$",
                "$options": "i"  # Case-insensitive
            }
        
        # ===== STEP 3: FETCH ONLINE USERS ===== 
        users_cursor = db.users().find(query_filters).limit(limit * 2)  # Fetch extra for sorting
        
        online_users = []
        async for user in users_cursor:
            online_users.append(user)
        
        # ===== STEP 4: CALCULATE AI COMPATIBILITY & SORT =====
        users_with_scores = []
        
        for user in online_users:
            try:
                # Calculate AI-powered match score
                match_result = await matching_service.calculate_match_score(
                    current_user, 
                    user,
                    context=None  # No distance for online discovery
                )
                
                # Format user response
                user_response = format_user_response(
                    user, 
                    match_result,
                    include_details=include_details
                )
                
                users_with_scores.append({
                    'user': user_response,
                    'compatibility': match_result.score,
                    'lastSeen': user.get('lastSeen', datetime.utcnow())
                })
                
            except Exception as e:
                logger.error(f"[ERROR] Failed to score user {user.get('_id')}: {e}")
                continue
        
        # Sort by compatibility (desc), then lastSeen (desc)
        users_with_scores.sort(
            key=lambda x: (x['compatibility'], x['lastSeen']),
            reverse=True
        )
        
        # Apply final limit after sorting
        users_with_scores = users_with_scores[:limit]
        
        # Extract sorted users
        sorted_users = [item['user'] for item in users_with_scores]
        
        # ===== STEP 5: RETURN RESPONSE =====
        logger.info(
            f"[OK] AI Discovery: Found {len(sorted_users)} online users for user {current_user_id} "
            f"(field: {field or 'all'}, AI: {settings.USE_AI_MATCHING})"
        )
        
        return OnlineUsersResponse(
            users=sorted_users,
            count=len(sorted_users),
            field_filter=field,
            ai_powered=settings.USE_AI_MATCHING
        )
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
        
    except Exception as e:
        logger.error(f"[ERROR] Discovery online error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch online users"
        )


# ===== ADDITIONAL UTILITY ENDPOINT =====

@router.get("/stats")
async def get_discovery_stats(
    current_user: dict = Depends(_get_current_user_dependency)
):
    """
    Get discovery statistics for current user
    
    Returns:
    - total_online: Total online users
    - by_field: Breakdown by creative field
    - avg_compatibility: Average AI compatibility with online users
    """
    try:
        current_user_id = current_user['_id']
        
        # Count total online users (excluding current user)
        total_online = await db.users().count_documents({
            "isOnline": True,
            "_id": {"$ne": current_user_id}
        })
        
        # Get breakdown by field
        pipeline = [
            {
                "$match": {
                    "isOnline": True,
                    "_id": {"$ne": current_user_id}
                }
            },
            {
                "$group": {
                    "_id": "$field",
                    "count": {"$sum": 1}
                }
            },
            {
                "$sort": {"count": -1}
            }
        ]
        
        by_field = {}
        async for doc in db.users().aggregate(pipeline):
            field_name = doc['_id'] or 'Unknown'
            by_field[field_name] = doc['count']
        
        # Calculate average compatibility (sample of 10 users)
        matching_service = get_matching_service(use_ai=settings.USE_AI_MATCHING)
        
        sample_users = []
        async for user in db.users().find(
            {"isOnline": True, "_id": {"$ne": current_user_id}}
        ).limit(10):
            sample_users.append(user)
        
        if sample_users:
            total_compatibility = 0
            for user in sample_users:
                match_result = await matching_service.calculate_match_score(current_user, user)
                total_compatibility += match_result.score
            
            avg_compatibility = total_compatibility / len(sample_users)
        else:
            avg_compatibility = 0
        
        return {
            "total_online": total_online,
            "by_field": by_field,
            "avg_compatibility": round(avg_compatibility, 2),
            "ai_enabled": settings.USE_AI_MATCHING,
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"[ERROR] Discovery stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch discovery stats"
        )

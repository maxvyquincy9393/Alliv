"""
Discovery Routes - Smart Matching System
Handles: Online/Nearby discovery with AI-powered compatibility scoring
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List
from datetime import datetime
from pymongo.errors import PyMongoError
import logging
import math

from ..db import get_db
from ..auth import get_current_user

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/discover", tags=["Discovery"])


# ===== HELPER FUNCTIONS =====

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two points in km using Haversine formula"""
    R = 6371  # Earth radius in kilometers
    
    # Convert to radians
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    # Haversine formula
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


def calculate_compatibility(user_profile: dict, target_profile: dict, distance_km: Optional[float] = None) -> int:
    """
    Calculate compatibility score (0-100)
    Algorithm: 45% skills + 35% interests + 10% activity + 10% proximity
    """
    score = 0
    
    # 1. Skills overlap (45 points max)
    user_skills = set(user_profile.get('skills', []))
    target_skills = set(target_profile.get('skills', []))
    if user_skills and target_skills:
        shared_skills = len(user_skills & target_skills)
        total_unique = len(user_skills | target_skills)
        skills_score = (shared_skills / total_unique) * 45 if total_unique > 0 else 0
        score += skills_score
    
    # 2. Interests overlap (35 points max)
    user_interests = set(user_profile.get('interests', []))
    target_interests = set(target_profile.get('interests', []))
    if user_interests and target_interests:
        shared_interests = len(user_interests & target_interests)
        total_unique = len(user_interests | target_interests)
        interests_score = (shared_interests / total_unique) * 35 if total_unique > 0 else 0
        score += interests_score
    
    # 3. Activity/Mode preference (10 points max)
    user_mode = user_profile.get('modePreference', 'online')
    target_mode = target_profile.get('modePreference', 'online')
    if user_mode == target_mode:
        score += 10
    
    # 4. Proximity bonus (10 points max)
    if distance_km is not None:
        if distance_km <= 5:
            score += 10
        elif distance_km <= 15:
            score += 7
        elif distance_km <= 30:
            score += 4
        elif distance_km <= 50:
            score += 2
    
    return min(100, int(score))


# ===== ROUTES =====

@router.get("/online")
async def discover_online(
    limit: int = Query(10, ge=1, le=50),
    field: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """
    Discover users in online mode with comprehensive error handling
    Returns users with compatibility scores based on skills/interests
    """
    try:
        # [OK] Get current user's profile
        user_profile = await get_db().profiles.find_one({"userId": current_user["_id"]})
        
        # [OK] Handle missing profile properly
        if not user_profile:
            logger.warning(f"[WARN] User {current_user['_id']} authenticated but no profile found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found. Please complete your profile setup first."
            )
        
        # Build query
        query = {
            "userId": {"$ne": current_user["_id"]},  # Exclude self
            "visibility": {"$ne": "private"}  # Respect privacy
        }
        
        if field:
            query["field"] = field
        
        # Get all matching profiles
        profiles_cursor = get_db().profiles.find(query).limit(limit * 3)  # Get more for scoring
        profiles = await profiles_cursor.to_list(length=limit * 3)
        
        # [OK] Handle empty results gracefully
        if not profiles:
            return {
                "users": [],
                "total": 0,
                "mode": "online",
                "message": "No users found matching your criteria"
            }
        
        # Calculate compatibility for each
        scored_profiles = []
        for profile in profiles:
            try:
                compatibility = calculate_compatibility(user_profile, profile)
                
                # Get user info
                user = await get_db().users.find_one({"_id": profile["userId"]})
                if user:
                    scored_profiles.append({
                        "id": str(profile["userId"]),
                        "name": profile.get("name", "Unknown User"),
                        "age": profile.get("age"),
                        "field": profile.get("field"),
                        "bio": profile.get("bio"),
                        "photos": profile.get("photos", []),
                        "skills": profile.get("skills", []),
                        "interests": profile.get("interests", []),
                        "location": {
                            "city": profile.get("location", {}).get("city", "Unknown"),
                            "country": profile.get("location", {}).get("country", "Unknown"),
                        } if not profile.get("location", {}).get("hideExact", False) else None,
                        "compatibility": compatibility,
                        "verified": user.get("verified", False),
                    })
            except Exception as e:
                logger.error(f"[ERROR] Error processing profile {profile.get('userId')}: {str(e)}")
                continue  # Skip this profile, continue with others
        
        # Sort by compatibility score (highest first)
        scored_profiles.sort(key=lambda x: x["compatibility"], reverse=True)
        
        return {
            "users": scored_profiles[:limit],
            "total": len(scored_profiles),
            "mode": "online"
        }
    
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except PyMongoError as e:
        logger.error(f"[ERROR] Database error in discover_online: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"[ERROR] Unexpected error in discover_online: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve online users"
        )


@router.get("/nearby")
async def discover_nearby(
    lat: float = Query(..., ge=-90, le=90, description="User latitude"),
    lon: float = Query(..., ge=-180, le=180, description="User longitude"),
    radiusKm: int = Query(25, ge=1, le=100, description="Search radius in km"),
    limit: int = Query(10, ge=1, le=50),
    field: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """
    Discover users nearby using geolocation with error handling
    Returns users sorted by distance and compatibility
    """
    try:
        # [OK] Get current user's profile
        user_profile = await get_db().profiles.find_one({"userId": current_user["_id"]})
        
        if not user_profile:
            logger.warning(f"[WARN] User {current_user['_id']} authenticated but no profile found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found. Please complete your profile setup first."
            )
        
        # Build query with geospatial search
        query = {
            "userId": {"$ne": current_user["_id"]},
            "visibility": {"$ne": "private"},
            "location.coordinates": {
                "$near": {
                    "$geometry": {
                        "type": "Point",
                        "coordinates": [lon, lat]  # GeoJSON: [longitude, latitude]
                    },
                    "$maxDistance": radiusKm * 1000  # Convert km to meters
                }
            }
        }
        
        if field:
            query["field"] = field
        
        # Get nearby profiles
        profiles_cursor = get_db().profiles.find(query).limit(limit * 2)
        profiles = await profiles_cursor.to_list(length=limit * 2)
        
        # [OK] Handle empty results
        if not profiles:
            return {
                "users": [],
                "total": 0,
                "mode": "nearby",
                "radius": radiusKm,
                "message": f"No users found within {radiusKm}km radius"
            }
        
        # Calculate distance and compatibility for each
        nearby_users = []
        for profile in profiles:
            try:
                # Calculate distance
                profile_loc = profile.get("location", {})
                if "coordinates" in profile_loc:
                    target_lon, target_lat = profile_loc["coordinates"]["coordinates"]
                    distance = haversine_distance(lat, lon, target_lat, target_lon)
                    
                    if distance <= radiusKm:
                        # Calculate compatibility
                        compatibility = calculate_compatibility(user_profile, profile, distance)
                        
                        # Get user info
                        user = await get_db().users.find_one({"_id": profile["userId"]})
                        if user:
                            nearby_users.append({
                                "id": str(profile["userId"]),
                                "name": profile.get("name", "Unknown User"),
                                "age": profile.get("age"),
                                "field": profile.get("field"),
                                "bio": profile.get("bio"),
                                "photos": profile.get("photos", []),
                                "skills": profile.get("skills", []),
                                "interests": profile.get("interests", []),
                                "location": {
                                    "city": profile_loc.get("city", "Unknown"),
                                    "country": profile_loc.get("country", "Unknown"),
                                    "lat": target_lat if not profile_loc.get("hideExact", False) else None,
                                    "lon": target_lon if not profile_loc.get("hideExact", False) else None,
                                },
                                "distance": round(distance, 1),
                                "compatibility": compatibility,
                                "verified": user.get("verified", False),
                            })
            except Exception as e:
                logger.error(f"[ERROR] Error processing nearby profile {profile.get('userId')}: {str(e)}")
                continue
        
        # Sort by compatibility (primary) and distance (secondary)
        nearby_users.sort(key=lambda x: (x["compatibility"], -x["distance"]), reverse=True)
        
        return {
            "users": nearby_users[:limit],
            "total": len(nearby_users),
            "mode": "nearby",
            "radius": radiusKm
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"[ERROR] Database error in discover_nearby: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"[ERROR] Unexpected error in discover_nearby: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve nearby users"
        )


@router.get("/suggestions")
async def daily_suggestions(
    current_user = Depends(get_current_user)
):
    """
    AI-powered daily recommendations with error handling
    Returns top 3 highly compatible users
    """
    try:
        # Get user profile
        user_profile = await get_db().profiles.find_one({"userId": current_user["_id"]})
        
        if not user_profile:
            logger.warning(f"[WARN] User {current_user['_id']} authenticated but no profile found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found. Please complete your profile setup first."
            )
        
        # Get all active profiles
        query = {
            "userId": {"$ne": current_user["_id"]},
            "visibility": {"$ne": "private"}
        }
        
        profiles_cursor = get_db().profiles.find(query).limit(50)
        profiles = await profiles_cursor.to_list(length=50)
        
        # [OK] Handle empty results
        if not profiles:
            return {
                "suggestions": [],
                "date": datetime.now().isoformat(),
                "message": "No suggestions available at the moment"
            }
        
        # Score all profiles
        suggestions = []
        for profile in profiles:
            try:
                compatibility = calculate_compatibility(user_profile, profile)
                
                if compatibility >= 70:  # Only high matches
                    user = await get_db().users.find_one({"_id": profile["userId"]})
                    if user:
                        suggestions.append({
                            "id": str(profile["userId"]),
                            "name": profile.get("name", "Unknown User"),
                            "field": profile.get("field"),
                            "photo": profile.get("photos", [""])[0] if profile.get("photos") else "",
                            "compatibility": compatibility,
                            "reason": f"High match in {profile.get('field', 'collaboration')}"
                        })
            except Exception as e:
                logger.error(f"[ERROR] Error processing suggestion profile {profile.get('userId')}: {str(e)}")
                continue
        
        # Return top 3
        suggestions.sort(key=lambda x: x["compatibility"], reverse=True)
        
        return {
            "suggestions": suggestions[:3],
            "date": datetime.now().isoformat()
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"[ERROR] Database error in daily_suggestions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"[ERROR] Unexpected error in daily_suggestions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate suggestions"
        )

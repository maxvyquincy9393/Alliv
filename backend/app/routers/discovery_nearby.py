"""
Discovery Nearby Router - Find compatible users nearby
Production-ready geospatial endpoint with distance calculation
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId
import logging
import math

from ..auth import get_current_user
from ..db import get_db

router = APIRouter(prefix="/discover", tags=["Discovery Nearby"])
logger = logging.getLogger(__name__)


# ===== RESPONSE MODELS =====

class NearbyUserResponse(BaseModel):
    """Single nearby user with compatibility and distance"""
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
    distance: float = Field(..., ge=0, description="Distance in kilometers")
    compatibility: int = Field(..., ge=0, le=100, description="Compatibility percentage")
    
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
                "distance": 2.5,
                "compatibility": 85
            }
        }


class NearbyUsersResponse(BaseModel):
    """Response for nearby users discovery"""
    users: List[NearbyUserResponse]
    count: int
    search_center: Dict[str, float]
    radius_km: float
    field_filter: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "users": [...],
                "count": 5,
                "search_center": {"lat": -6.2088, "lon": 106.8456},
                "radius_km": 10.0,
                "field_filter": "Photography"
            }
        }


# ===== DISTANCE CALCULATION (HAVERSINE FORMULA) =====

def calculate_distance_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
) -> float:
    """
    Calculate distance between two coordinates using Haversine formula
    
    Formula:
    a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlon/2)
    c = 2 * atan2(√a, √(1−a))
    d = R * c
    
    where R = Earth's radius (6371 km)
    
    Args:
        lat1: First latitude in degrees
        lon1: First longitude in degrees
        lat2: Second latitude in degrees
        lon2: Second longitude in degrees
        
    Returns:
        float: Distance in kilometers
    """
    try:
        # Earth's radius in kilometers
        R = 6371.0
        
        # Convert degrees to radians
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        # Differences
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        # Haversine formula
        a = (
            math.sin(dlat / 2) ** 2 +
            math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        
        return round(distance, 2)  # Round to 2 decimal places
        
    except Exception as e:
        logger.error(f"[ERROR] Distance calculation error: {e}")
        return 0.0


def validate_coordinates(lat: float, lon: float) -> bool:
    """
    Validate latitude and longitude values
    
    Args:
        lat: Latitude (-90 to 90)
        lon: Longitude (-180 to 180)
        
    Returns:
        bool: True if valid
    """
    return -90 <= lat <= 90 and -180 <= lon <= 180


# ===== COMPATIBILITY CALCULATION =====

def calculate_compatibility(
    current_user: dict,
    target_user: dict
) -> int:
    """
    Calculate compatibility score between two users
    Same algorithm as online discovery
    
    Scoring breakdown:
    - Common skills: 40% (max 40 points)
    - Common interests: 40% (max 40 points)
    - Field match: 20% (max 20 points)
    """
    try:
        score = 0
        
        # Get user data with safe defaults
        current_skills = set(current_user.get('skills', []))
        target_skills = set(target_user.get('skills', []))
        current_interests = set(current_user.get('interests', []))
        target_interests = set(target_user.get('interests', []))
        current_field = current_user.get('field', '').lower().strip()
        target_field = target_user.get('field', '').lower().strip()
        
        # 1. SKILLS COMPATIBILITY (40%)
        if current_skills and target_skills:
            common_skills = current_skills.intersection(target_skills)
            total_skills = current_skills.union(target_skills)
            skills_ratio = len(common_skills) / len(total_skills)
            score += int(skills_ratio * 40)
        
        # 2. INTERESTS COMPATIBILITY (40%)
        if current_interests and target_interests:
            common_interests = current_interests.intersection(target_interests)
            total_interests = current_interests.union(target_interests)
            interests_ratio = len(common_interests) / len(total_interests)
            score += int(interests_ratio * 40)
        
        # 3. FIELD MATCH (20%)
        if current_field and target_field:
            if current_field == target_field:
                score += 20  # Perfect field match
            elif current_field in target_field or target_field in current_field:
                score += 10  # Partial field match
        
        # Ensure score is within 0-100 range
        return max(0, min(100, score))
        
    except Exception as e:
        logger.error(f"[ERROR] Compatibility calculation error: {e}")
        return 0


def format_user_response(
    user: dict,
    distance: float,
    compatibility: int
) -> NearbyUserResponse:
    """
    Format MongoDB user document to NearbyUserResponse
    """
    return NearbyUserResponse(
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
        distance=distance,
        compatibility=compatibility
    )


# ===== MAIN ENDPOINT =====

@router.get("/nearby", response_model=NearbyUsersResponse)
async def discover_nearby_users(
    lat: float = Query(..., ge=-90, le=90, description="Your latitude (-90 to 90)"),
    lon: float = Query(..., ge=-180, le=180, description="Your longitude (-180 to 180)"),
    radius_km: float = Query(10.0, ge=0.1, le=100, description="Search radius in kilometers (0.1-100)"),
    field: Optional[str] = Query(None, description="Filter by creative field (e.g., 'Photography')"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    current_user: dict = Depends(get_current_user)
):
    """
    Discover compatible users nearby using geospatial search
    
    **Features:**
    - Geospatial search within radius
    - Accurate distance calculation (Haversine formula)
    - Excludes current user
    - Excludes already swiped users
    - Calculates compatibility score (0-100)
    - Sorts by distance (nearest first)
    
    **Query Parameters:**
    - lat: Your latitude (-90 to 90)
    - lon: Your longitude (-180 to 180)
    - radius_km: Search radius in km (0.1-100, default 10)
    - field: Filter by creative field (optional)
    - limit: Max results (1-100, default 20)
    
    **Returns:**
    - users: List of nearby users with distance & compatibility
    - count: Number of users returned
    - search_center: Your search coordinates
    - radius_km: Applied search radius
    - field_filter: Applied field filter (if any)
    
    **Performance:**
    - Uses MongoDB geospatial index
    - Optimized for <100ms query time
    - Accurate distance calculation
    """
    try:
        # Validate coordinates
        if not validate_coordinates(lat, lon):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid coordinates. Lat must be -90 to 90, Lon must be -180 to 180"
            )
        
        current_user_id = current_user['_id']
        
        # ===== STEP 1: GET ALREADY SWIPED USER IDS =====
        swiped_user_ids = set()
        try:
            swipes_cursor = get_db().swipes.find(
                {"userId": current_user_id},
                {"swipedUserId": 1}
            )
            
            async for swipe in swipes_cursor:
                swiped_id = swipe.get('swipedUserId')
                if swiped_id:
                    swiped_user_ids.add(swipe['swipedUserId'])
                    
        except Exception as e:
            logger.warning(f"[WARN] Could not fetch swipes: {e}")
        
        # ===== STEP 2: BUILD GEOSPATIAL QUERY =====
        
        # Convert radius from km to meters for MongoDB
        radius_meters = radius_km * 1000
        
        # Base query filters
        query_filters = {
            "_id": {
                "$ne": current_user_id,  # Exclude current user
                "$nin": list(swiped_user_ids)  # Exclude swiped users
            }
        }
        
        # Add field filter if specified
        if field:
            query_filters["field"] = {
                "$regex": f"^{field}$",
                "$options": "i"
            }
        
        # ===== STEP 3: GEOSPATIAL SEARCH =====
        
        # Check if geospatial index exists
        try:
            # Try MongoDB $geoNear aggregation (most efficient)
            # Note: $geoNear requires geospatial index on location.coordinates
            
            pipeline = [
                {
                    "$geoNear": {
                        "near": {
                            "type": "Point",
                            "coordinates": [lon, lat]  # [longitude, latitude] - GeoJSON order
                        },
                        "distanceField": "distance",
                        "maxDistance": radius_meters,
                        "spherical": True,  # Use spherical geometry
                        "key": "location.coordinates"  # Index field
                    }
                },
                {
                    "$match": query_filters
                },
                {
                    "$limit": limit * 2  # Fetch extra for sorting
                }
            ]
            
            nearby_users_cursor = get_db().users.aggregate(pipeline)
            nearby_users = []
            
            async for user in nearby_users_cursor:
                # Distance is in meters, convert to km
                user['distance_km'] = round(user.get('distance', 0) / 1000, 2)
                nearby_users.append(user)
            
            logger.info(f"[OK] Used $geoNear aggregation, found {len(nearby_users)} users")
            
        except Exception as geo_error:
            logger.warning(f"[WARN] $geoNear failed (index may be missing): {geo_error}")
            logger.info("ℹ️ Falling back to manual distance calculation...")
            
            # Fallback: Manual distance calculation (slower but works without index)
            # Fetch all users and calculate distance manually
            
            # Rough bounding box to reduce search space
            # 1 degree ≈ 111 km
            lat_range = radius_km / 111.0
            lon_range = radius_km / (111.0 * math.cos(math.radians(lat)))
            
            query_filters["location.lat"] = {
                "$gte": lat - lat_range,
                "$lte": lat + lat_range
            }
            query_filters["location.lon"] = {
                "$gte": lon - lon_range,
                "$lte": lon + lon_range
            }
            
            users_cursor = get_db().users.find(query_filters)
            
            nearby_users = []
            async for user in users_cursor:
                user_location = user.get('location', {})
                user_lat = user_location.get('lat')
                user_lon = user_location.get('lon')
                
                if user_lat is None or user_lon is None:
                    continue  # Skip users without location
                
                # Calculate distance
                distance = calculate_distance_km(lat, lon, user_lat, user_lon)
                
                # Filter by radius
                if distance <= radius_km:
                    user['distance_km'] = distance
                    nearby_users.append(user)
            
            logger.info(f"[OK] Manual calculation, found {len(nearby_users)} users")
        
        # ===== STEP 4: CALCULATE COMPATIBILITY & SORT =====
        users_with_scores = []
        
        for user in nearby_users:
            # Calculate compatibility score
            compatibility = calculate_compatibility(current_user, user)
            
            # Get distance
            distance = user.get('distance_km', 0)
            
            # Format user response
            user_response = format_user_response(user, distance, compatibility)
            
            users_with_scores.append({
                'user': user_response,
                'distance': distance,
                'compatibility': compatibility
            })
        
        # Sort by distance (nearest first), then compatibility (highest first)
        users_with_scores.sort(
            key=lambda x: (x['distance'], -x['compatibility'])
        )
        
        # Apply final limit
        users_with_scores = users_with_scores[:limit]
        
        # Extract sorted users
        sorted_users = [item['user'] for item in users_with_scores]
        
        # ===== STEP 5: RETURN RESPONSE =====
        logger.info(
            f"[OK] Discovery Nearby: Found {len(sorted_users)} users within {radius_km}km "
            f"for user {current_user_id} at ({lat}, {lon}) (field: {field or 'all'})"
        )
        
        return NearbyUsersResponse(
            users=sorted_users,
            count=len(sorted_users),
            search_center={"lat": lat, "lon": lon},
            radius_km=radius_km,
            field_filter=field
        )
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
        
    except Exception as e:
        logger.error(f"[ERROR] Discovery nearby error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch nearby users"
        )


# ===== ADDITIONAL UTILITY ENDPOINT =====

@router.get("/nearby/stats")
async def get_nearby_stats(
    lat: float = Query(..., ge=-90, le=90),
    lon: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(10.0, ge=0.1, le=100),
    current_user: dict = Depends(get_current_user)
):
    """
    Get nearby discovery statistics
    
    Returns:
    - total_nearby: Total users within radius
    - by_distance: Breakdown by distance ranges
    - by_field: Breakdown by creative field
    - avg_distance: Average distance in km
    """
    try:
        current_user_id = current_user['_id']
        
        # Validate coordinates
        if not validate_coordinates(lat, lon):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid coordinates"
            )
        
        # Get nearby users (simplified query)
        radius_meters = radius_km * 1000
        
        try:
            # Try geospatial aggregation
            pipeline = [
                {
                    "$geoNear": {
                        "near": {
                            "type": "Point",
                            "coordinates": [lon, lat]
                        },
                        "distanceField": "distance",
                        "maxDistance": radius_meters,
                        "spherical": True,
                        "key": "location.coordinates"
                    }
                },
                {
                    "$match": {
                        "_id": {"$ne": current_user_id}
                    }
                }
            ]
            
            nearby_users = []
            async for user in get_db().users.aggregate(pipeline):
                user['distance_km'] = user.get('distance', 0) / 1000
                nearby_users.append(user)
                
        except Exception:
            # Fallback to manual calculation
            lat_range = radius_km / 111.0
            lon_range = radius_km / (111.0 * math.cos(math.radians(lat)))
            
            query = {
                "_id": {"$ne": current_user_id},
                "location.lat": {"$gte": lat - lat_range, "$lte": lat + lat_range},
                "location.lon": {"$gte": lon - lon_range, "$lte": lon + lon_range}
            }
            
            nearby_users = []
            async for user in get_db().users.find(query):
                user_lat = user.get('location', {}).get('lat')
                user_lon = user.get('location', {}).get('lon')
                
                if user_lat and user_lon:
                    distance = calculate_distance_km(lat, lon, user_lat, user_lon)
                    if distance <= radius_km:
                        user['distance_km'] = distance
                        nearby_users.append(user)
        
        # Calculate statistics
        total_nearby = len(nearby_users)
        
        # Distance breakdown
        by_distance = {
            "0-1km": 0,
            "1-5km": 0,
            "5-10km": 0,
            "10-20km": 0,
            "20+km": 0
        }
        
        for user in nearby_users:
            dist = user.get('distance_km', 0)
            if dist <= 1:
                by_distance["0-1km"] += 1
            elif dist <= 5:
                by_distance["1-5km"] += 1
            elif dist <= 10:
                by_distance["5-10km"] += 1
            elif dist <= 20:
                by_distance["10-20km"] += 1
            else:
                by_distance["20+km"] += 1
        
        # Field breakdown
        by_field = {}
        for user in nearby_users:
            field = user.get('field', 'Unknown')
            by_field[field] = by_field.get(field, 0) + 1
        
        # Average distance
        if nearby_users:
            total_distance = sum(user.get('distance_km', 0) for user in nearby_users)
            avg_distance = round(total_distance / len(nearby_users), 2)
        else:
            avg_distance = 0
        
        return {
            "total_nearby": total_nearby,
            "by_distance": by_distance,
            "by_field": by_field,
            "avg_distance": avg_distance,
            "search_center": {"lat": lat, "lon": lon},
            "radius_km": radius_km,
            "timestamp": datetime.utcnow()
        }
        
    except HTTPException:
        raise
        
    except Exception as e:
        logger.error(f"[ERROR] Nearby stats error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch nearby stats"
        )

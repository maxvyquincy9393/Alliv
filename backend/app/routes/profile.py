"""
Profile Routes - Complete Implementation
Handles: Get/Update Profile, Photos, Portfolio
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from pymongo.errors import PyMongoError
import logging
import re

from .. import db
from ..auth import get_current_user

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["Profile"])


# ===== MODELS =====
class Location(BaseModel):
    city: str
    country: str
    lat: float
    lon: float
    hideExact: bool = False


class Portfolio(BaseModel):
    github: Optional[str] = None
    behance: Optional[str] = None
    figma: Optional[str] = None
    youtube: Optional[str] = None


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    bio: Optional[str] = None
    goals: Optional[str] = None
    field: Optional[str] = None
    skills: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    photos: Optional[List[str]] = None
    location: Optional[Location] = None
    portfolio: Optional[Portfolio] = None
    modePreference: Optional[str] = None
    visibility: Optional[str] = None
    
    # ✅ Input validation
    @validator('name')
    def validate_name(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) < 2 or len(v) > 50:
                raise ValueError("Name must be 2-50 characters")
            if not re.match(r'^[a-zA-Z\s\-\.]+$', v):
                raise ValueError("Name contains invalid characters")
        return v
    
    @validator('bio')
    def validate_bio(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 500:
                raise ValueError("Bio must be max 500 characters")
        return v
    
    @validator('goals')
    def validate_goals(cls, v):
        if v is not None:
            v = v.strip()
            if len(v) > 300:
                raise ValueError("Goals must be max 300 characters")
        return v
    
    @validator('age')
    def validate_age(cls, v):
        if v is not None:
            if v < 13 or v > 120:
                raise ValueError("Age must be between 13 and 120")
        return v
    
    @validator('visibility')
    def validate_visibility(cls, v):
        if v is not None and v not in ['public', 'private', 'matches']:
            raise ValueError("Visibility must be 'public', 'private', or 'matches'")
        return v


class PhotosUpdate(BaseModel):
    photos: List[str]


# ===== ROUTES =====

@router.get("/me")
async def get_current_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user's complete profile with error handling
    """
    user_id = str(current_user["_id"])
    
    try:
        # Get profile
        profile = await db.profiles().find_one({"userId": user_id})
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        # Remove internal fields
        profile.pop("_id", None)
        
        # Add user info
        profile["email"] = current_user.get("email")
        profile["verified"] = current_user.get("verified", False)
        
        return profile
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except PyMongoError as e:
        logger.error(f"❌ Database error in get_current_profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in get_current_profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )


@router.put("/me")
async def update_current_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's profile with comprehensive error handling
    """
    user_id = str(current_user["_id"])
    
    try:
        # Build update document with sanitized data
        update_data = {}
        if data.name:
            update_data["name"] = data.name.strip()  # ✅ Sanitized
        if data.age:
            update_data["age"] = data.age
        if data.bio:
            update_data["bio"] = data.bio.strip()  # ✅ Sanitized
        if data.goals:
            update_data["goals"] = data.goals.strip()  # ✅ Sanitized
        if data.field:
            update_data["field"] = data.field.strip()
        if data.skills:
            # ✅ Sanitize and limit skills
            update_data["skills"] = [s.strip() for s in data.skills if s.strip()][:5]
        if data.interests:
            # ✅ Sanitize and limit interests
            update_data["interests"] = [i.strip() for i in data.interests if i.strip()][:7]
        if data.photos:
            # ✅ Validate photo count
            if len(data.photos) > 6:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Maximum 6 photos allowed"
                )
            update_data["photos"] = data.photos[:6]
        if data.location:
            update_data["location"] = {
                "type": "Point",
                "coordinates": [data.location.lon, data.location.lat],
                "city": data.location.city.strip(),
                "country": data.location.country.strip(),
                "hideExact": data.location.hideExact
            }
        if data.portfolio:
            update_data["portfolio"] = data.portfolio.model_dump(exclude_none=True)
        if data.modePreference:
            update_data["modePreference"] = data.modePreference
        if data.visibility:
            update_data["visibility"] = data.visibility
        
        update_data["updatedAt"] = datetime.utcnow()
        
        # ✅ Upsert profile with error handling
        result = await db.profiles().update_one(
            {"userId": user_id},
            {
                "$set": update_data,
                "$setOnInsert": {
                    "userId": user_id,
                    "createdAt": datetime.utcnow(),
                    "profileComplete": True
                }
            },
            upsert=True  # Create if doesn't exist
        )
        
        # ✅ Check if operation was successful
        if result.matched_count == 0 and result.upserted_id is None:
            logger.error(f"❌ Profile update failed for user {user_id}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )
        
        # Also update user's name if provided
        if data.name:
            await db.users().update_one(
                {"_id": ObjectId(user_id)},
                {"$set": {"name": data.name.strip()}}
            )
        
        # Return updated profile
        profile = await db.profiles().find_one({"userId": user_id})
        if profile:
            profile.pop("_id", None)
            profile["email"] = current_user.get("email")
            return profile
        
        # Fallback if profile not found after update
        return {"message": "Profile updated successfully"}
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except PyMongoError as e:
        logger.error(f"❌ Database error in update_current_profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )
    except ValueError as e:
        # Pydantic validation errors
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in update_current_profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.put("/me/photos")
async def update_photos(
    data: PhotosUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update profile photos (1-6 photos) with validation
    """
    user_id = str(current_user["_id"])
    
    try:
        # ✅ Business logic validation
        if len(data.photos) < 1 or len(data.photos) > 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Must have 1-6 photos"
            )
        
        # ✅ Update photos with error handling
        result = await db.profiles().update_one(
            {"userId": user_id},
            {
                "$set": {
                    "photos": data.photos,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        # ✅ Check if update successful
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        if result.modified_count == 0:
            # No changes made (same photos)
            logger.info(f"⚠️ No changes made to photos for user {user_id}")
        
        return {"message": "Photos updated", "photos": data.photos}
        
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in update_photos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in update_photos: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update photos"
        )


@router.get("/profiles/{user_id}")
async def get_user_profile(
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get public profile of any user with authorization checks
    """
    try:
        # Get target profile
        profile = await db.profiles().find_one({"userId": user_id})
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        # ✅ Check visibility & authorization
        visibility = profile.get("visibility", "public")
        current_user_id = str(current_user["_id"])
        
        if visibility == "private":
            # Only the owner can see private profiles
            if current_user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="This profile is private"
                )
        
        elif visibility == "matches":
            # Check if users are matched
            if current_user_id != user_id:
                # Check if there's a match between current_user and user_id
                match = await db.matches().find_one({
                    "$or": [
                        {"user1": current_user_id, "user2": user_id, "status": "matched"},
                        {"user1": user_id, "user2": current_user_id, "status": "matched"}
                    ]
                })
                
                if not match:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="This profile is only visible to matches"
                    )
        
        # Remove sensitive fields
        profile.pop("_id", None)
        
        # ✅ Hide exact location if requested
        if profile.get("location", {}).get("hideExact"):
            if "location" in profile and "coordinates" in profile["location"]:
                # Keep city/country but remove exact coordinates
                profile["location"].pop("coordinates", None)
        
        return profile
        
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in get_user_profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in get_user_profile: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )

"""
Profile Routes - Complete Implementation
Handles: Get/Update Profile, Photos, Portfolio
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from .. import db
from ..auth import get_current_user

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
    location: Optional[Location] = None
    portfolio: Optional[Portfolio] = None
    modePreference: Optional[str] = None
    visibility: Optional[str] = None


class PhotosUpdate(BaseModel):
    photos: List[str]


# ===== ROUTES =====

@router.get("/me")
async def get_current_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user's complete profile
    """
    user_id = str(current_user["_id"])
    
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


@router.put("/me")
async def update_current_profile(
    data: ProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's profile
    """
    user_id = str(current_user["_id"])
    
    # Build update document
    update_data = {}
    if data.name:
        update_data["name"] = data.name
    if data.age:
        update_data["age"] = data.age
    if data.bio:
        update_data["bio"] = data.bio
    if data.goals:
        update_data["goals"] = data.goals
    if data.field:
        update_data["field"] = data.field
    if data.skills:
        update_data["skills"] = data.skills[:5]  # Max 5 skills
    if data.interests:
        update_data["interests"] = data.interests[:7]  # Max 7 interests
    if data.location:
        update_data["location"] = {
            "type": "Point",
            "coordinates": [data.location.lon, data.location.lat],
            "city": data.location.city,
            "country": data.location.country,
            "hideExact": data.location.hideExact
        }
    if data.portfolio:
        update_data["portfolio"] = data.portfolio.model_dump(exclude_none=True)
    if data.modePreference:
        update_data["modePreference"] = data.modePreference
    if data.visibility:
        update_data["visibility"] = data.visibility
    
    update_data["updatedAt"] = datetime.utcnow()
    
    # Update profile
    result = await db.profiles().update_one(
        {"userId": user_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Return updated profile
    profile = await db.profiles().find_one({"userId": user_id})
    profile.pop("_id", None)
    
    return profile


@router.put("/me/photos")
async def update_photos(
    data: PhotosUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update profile photos (1-6 photos)
    """
    user_id = str(current_user["_id"])
    
    # Validate photo count
    if len(data.photos) < 1 or len(data.photos) > 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Must have 1-6 photos"
        )
    
    # Update photos
    result = await db.profiles().update_one(
        {"userId": user_id},
        {
            "$set": {
                "photos": data.photos,
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return {"message": "Photos updated", "photos": data.photos}


@router.get("/profiles/{user_id}")
async def get_user_profile(user_id: str):
    """
    Get public profile of any user
    """
    profile = await db.profiles().find_one({"userId": user_id})
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Check visibility
    if profile.get("visibility") == "private":
        # TODO: Check if requester is matched with this user
        pass
    
    # Remove sensitive fields
    profile.pop("_id", None)
    
    # Hide exact location if requested
    if profile.get("location", {}).get("hideExact"):
        if "location" in profile and "coordinates" in profile["location"]:
            profile["location"].pop("coordinates", None)
    
    return profile

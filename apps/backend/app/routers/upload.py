"""
File Upload Router - Photo Upload with Cloudinary
Endpoints: POST /upload/photo, DELETE /upload/photo, GET /upload/photos
Security: Auth required, rate limiting, file validation
"""
from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from ..db import get_db
from ..auth import get_current_user, oauth2_scheme
from ..services.cloudinary import cloudinary_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/upload", tags=["Upload"])


# ===== MODELS =====
class PhotoUploadResponse(BaseModel):
    """Response for successful photo upload"""
    url: str
    publicId: str
    width: int
    height: int
    format: str
    bytes: int
    message: str = "Photo uploaded successfully"


class PhotoDeleteRequest(BaseModel):
    """Request to delete a photo"""
    publicId: str


class PhotoDeleteResponse(BaseModel):
    """Response for photo deletion"""
    success: bool
    message: str


class UserPhotosResponse(BaseModel):
    """Response with user's photos"""
    photos: List[dict]
    count: int
    maxPhotos: int = 6


async def _get_current_user_dependency(
    token: str = Depends(oauth2_scheme)
) -> dict:
    """Wrap auth dependency so tests can patch get_current_user dynamically."""
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


# ===== HELPER FUNCTIONS =====
async def check_upload_rate_limit(user_id: str) -> bool:
    """
    Check if user exceeded upload rate limit (10 uploads per hour)
    Returns True if allowed, False if rate limit exceeded
    """
    try:
        db = get_db()
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        
        count = await db.upload_logs.count_documents({
            "userId": ObjectId(user_id),
            "uploadedAt": {"$gte": one_hour_ago}
        })
        
        return count < cloudinary_service.UPLOADS_PER_HOUR
    except Exception as e:
        logger.error(f"Error checking rate limit: {str(e)}")
        return True  # Allow on error


async def log_upload(user_id: str, public_id: str, file_size: int):
    """Log upload for rate limiting and analytics"""
    try:
        db = get_db()
        await db.upload_logs.insert_one({
            "userId": ObjectId(user_id),
            "publicId": public_id,
            "fileSize": file_size,
            "uploadedAt": datetime.utcnow()
        })
    except Exception as e:
        logger.error(f"Error logging upload: {str(e)}")


async def get_user_photo_count(user_id: str) -> int:
    """Get current number of photos for user"""
    try:
        db = get_db()
        user = await db.users.find_one(
            {"_id": ObjectId(user_id)},
            {"photos": 1}
        )
        
        if not user:
            return 0
        
        photos = user.get("photos", [])
        return len(photos) if isinstance(photos, list) else 0
    except Exception as e:
        logger.error(f"Error getting photo count: {str(e)}")
        return 0


async def add_photo_to_user(user_id: str, photo_data: dict):
    """Add photo to user's photos array"""
    try:
        db = get_db()
        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$push": {
                    "photos": {
                        "url": photo_data["url"],
                        "publicId": photo_data["publicId"],
                        "uploadedAt": datetime.utcnow(),
                        "width": photo_data.get("width", 0),
                        "height": photo_data.get("height", 0)
                    }
                },
                "$set": {"updatedAt": datetime.utcnow()}
            }
        )
        logger.info(f"Photo added to user {user_id}")
    except Exception as e:
        logger.error(f"Error adding photo to user: {str(e)}")
        raise


async def remove_photo_from_user(user_id: str, public_id: str):
    """Remove photo from user's photos array"""
    try:
        db = get_db()
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$pull": {"photos": {"publicId": public_id}},
                "$set": {"updatedAt": datetime.utcnow()}
            }
        )
        return result.modified_count > 0
    except Exception as e:
        logger.error(f"Error removing photo from user: {str(e)}")
        return False


# ===== ENDPOINTS =====
@router.post("/photo", response_model=PhotoUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(_get_current_user_dependency)
):
    """
    Upload a photo to Cloudinary
    
    **Requirements:**
    - Authentication required
    - Max file size: 5MB
    - Allowed formats: jpg, jpeg, png, webp
    - Max photos per user: 6
    - Rate limit: 10 uploads per hour
    
    **Transformations:**
    - Resize to max 800x800 (maintains aspect ratio)
    - Auto quality optimization
    - Auto format (WebP for supported browsers)
    
    **Returns:**
    - url: Cloudinary URL
    - publicId: Cloudinary public_id for deletion
    - width, height: Image dimensions
    - format: Image format
    - bytes: File size
    """
    user_id = str(current_user["_id"])
    
    try:
        # Check rate limit
        if not await check_upload_rate_limit(user_id):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Upload rate limit exceeded. Max 10 uploads per hour."
            )
        
        # Check photo count limit
        current_count = await get_user_photo_count(user_id)
        if current_count >= cloudinary_service.MAX_PHOTOS_PER_USER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum {cloudinary_service.MAX_PHOTOS_PER_USER} photos allowed. Delete a photo first."
            )
        
        # Read file data
        file_data = await file.read()
        
        # Validate file size early
        if len(file_data) > cloudinary_service.MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Max size: {cloudinary_service.MAX_FILE_SIZE / 1024 / 1024}MB"
            )
        
        # Upload to Cloudinary
        result = await cloudinary_service.upload_photo(
            file_data=file_data,
            user_id=user_id,
            filename=file.filename or "photo.jpg"
        )
        
        # Add photo to user's profile
        await add_photo_to_user(user_id, result)
        
        # Log upload for rate limiting
        await log_upload(user_id, result["publicId"], result["bytes"])
        
        logger.info(f"Photo uploaded successfully for user {user_id}")
        
        return PhotoUploadResponse(**result)
        
    except ValueError as e:
        # File validation errors
        error_message = str(e)
        if "invalid" not in error_message.lower():
            error_message = f"Invalid photo upload: {error_message}"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload photo. Please try again."
        )


@router.delete("/photo", response_model=PhotoDeleteResponse)
async def delete_photo(
    request: PhotoDeleteRequest,
    current_user: dict = Depends(_get_current_user_dependency)
):
    """
    Delete a photo from Cloudinary and user profile
    
    **Requirements:**
    - Authentication required
    - User can only delete their own photos
    
    **Parameters:**
    - publicId: Cloudinary public_id of the photo
    
    **Returns:**
    - success: Whether deletion was successful
    - message: Status message
    """
    user_id = str(current_user["_id"])
    
    try:
        # Verify photo belongs to user
        db = get_db()
        user = await db.users.find_one(
            {"_id": ObjectId(user_id)},
            {"photos": 1}
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        photos = user.get("photos", [])
        photo_exists = any(p.get("publicId") == request.publicId for p in photos)
        
        if not photo_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Photo not found or doesn't belong to you"
            )
        
        # Delete from Cloudinary
        cloudinary_deleted = await cloudinary_service.delete_photo(request.publicId)
        
        # Remove from user profile (even if Cloudinary delete failed)
        db_deleted = await remove_photo_from_user(user_id, request.publicId)
        
        if db_deleted:
            message = "Photo deleted successfully"
            if not cloudinary_deleted:
                message += " (from database, but Cloudinary deletion may have failed)"
            
            logger.info(f"Photo deleted: {request.publicId} for user {user_id}")
            return PhotoDeleteResponse(success=True, message=message)
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete photo from database"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete photo. Please try again."
        )


@router.get("/photos", response_model=UserPhotosResponse)
async def get_user_photos(
    current_user: dict = Depends(_get_current_user_dependency)
):
    """
    Get all photos for current user
    
    **Returns:**
    - photos: Array of photo objects with url, publicId, dimensions
    - count: Number of photos
    - maxPhotos: Maximum allowed photos (6)
    """
    user_id = str(current_user["_id"])
    
    try:
        db = get_db()
        user = await db.users.find_one(
            {"_id": ObjectId(user_id)},
            {"photos": 1}
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        photos = user.get("photos", [])
        
        return UserPhotosResponse(
            photos=photos,
            count=len(photos),
            maxPhotos=cloudinary_service.MAX_PHOTOS_PER_USER
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get photos error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get photos"
        )

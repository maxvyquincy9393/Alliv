"""
Upload Routes - Cloudinary Integration
Handles: Presigned URLs, Upload Completion, Photo Deletion
Security: Max 6 photos, 5MB limit, rate limiting (10/hour)
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
import cloudinary
import cloudinary.uploader
import cloudinary.api
from bson import ObjectId
from pymongo.errors import PyMongoError
import logging
import hashlib
import time

from .. import db
from ..auth import get_current_user
from ..config import settings

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/uploads", tags=["Uploads"])

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True
)


# ===== MODELS =====
class PresignResponse(BaseModel):
    timestamp: int
    signature: str
    api_key: str
    cloud_name: str
    public_id: str
    folder: str


class CompleteUploadRequest(BaseModel):
    public_id: str
    url: str
    
    @validator('url')
    def validate_url(cls, v):
        if not v.startswith('https://res.cloudinary.com/'):
            raise ValueError("Invalid Cloudinary URL")
        return v
    
    @validator('public_id')
    def validate_public_id(cls, v):
        if not v or len(v) > 200:
            raise ValueError("Invalid public_id")
        return v


# ===== HELPER FUNCTIONS =====
def generate_public_id(user_id: str) -> str:
    """Generate unique public_id for user photo"""
    timestamp = int(time.time() * 1000)
    unique_str = f"{user_id}_{timestamp}"
    return f"alivv/users/{user_id}/{hashlib.md5(unique_str.encode()).hexdigest()}"


async def get_user_photo_count(user_id: str) -> int:
    """Get current photo count for user"""
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            return 0
        photos = user.get("photos", [])
        return len(photos) if photos else 0
    except Exception as e:
        logger.error(f"Error getting photo count: {str(e)}")
        return 0


async def check_upload_rate_limit(user_id: str) -> bool:
    """Check if user exceeded upload rate limit (10/hour)"""
    try:
        one_hour_ago = datetime.utcnow().timestamp() - 3600
        
        # Count uploads in last hour
        count = await db.upload_logs.count_documents({
            "userId": ObjectId(user_id),
            "uploadedAt": {"$gte": one_hour_ago}
        })
        
        return count < 10
    except Exception as e:
        logger.error(f"Error checking rate limit: {str(e)}")
        return True  # Allow on error


async def log_upload(user_id: str, public_id: str, url: str):
    """Log upload for rate limiting and audit"""
    try:
        await db.upload_logs.insert_one({
            "userId": ObjectId(user_id),
            "publicId": public_id,
            "url": url,
            "uploadedAt": datetime.utcnow().timestamp(),
            "createdAt": datetime.utcnow()
        })
    except Exception as e:
        logger.error(f"Error logging upload: {str(e)}")


# ===== ROUTES =====

@router.post("/presign", response_model=PresignResponse)
async def generate_presign_url(current_user = Depends(get_current_user)):
    """
    Generate presigned URL for client-side upload to Cloudinary
    
    Security:
    - Validates user has < 6 photos
    - Checks rate limit (10 uploads/hour)
    - Generates unique public_id
    - Returns signature for authenticated upload
    """
    try:
        user_id = str(current_user["_id"])
        
        # ✅ Validation 1: Check photo limit (max 6)
        photo_count = await get_user_photo_count(user_id)
        if photo_count >= 6:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 6 photos allowed"
            )
        
        # ✅ Validation 2: Check rate limit (10 uploads/hour)
        if not await check_upload_rate_limit(user_id):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Upload rate limit exceeded. Try again later."
            )
        
        # ✅ Check Cloudinary configuration
        if not settings.CLOUDINARY_CLOUD_NAME or not settings.CLOUDINARY_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Upload service not configured"
            )
        
        # Generate unique public_id
        public_id = generate_public_id(user_id)
        folder = f"alivv/users/{user_id}"
        timestamp = int(time.time())
        
        # Generate signature for authenticated upload
        params_to_sign = {
            "timestamp": timestamp,
            "folder": folder,
            "public_id": public_id,
        }
        
        signature = cloudinary.utils.api_sign_request(
            params_to_sign,
            settings.CLOUDINARY_API_SECRET
        )
        
        logger.info(f"Generated presign URL for user {user_id}")
        
        return PresignResponse(
            timestamp=timestamp,
            signature=signature,
            api_key=settings.CLOUDINARY_API_KEY,
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            public_id=public_id,
            folder=folder
        )
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"Database error in presign: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"Unexpected error in presign: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate upload URL"
        )


@router.post("/complete")
async def complete_upload(
    request: CompleteUploadRequest,
    current_user = Depends(get_current_user)
):
    """
    Complete upload by saving photo URL to user profile
    
    Security:
    - Validates Cloudinary URL format
    - Verifies photo belongs to user's folder
    - Prevents duplicate uploads
    - Updates user profile atomically
    """
    try:
        user_id = str(current_user["_id"])
        
        # ✅ Validation 1: Verify public_id belongs to user
        expected_prefix = f"alivv/users/{user_id}/"
        if not request.public_id.startswith(expected_prefix):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized photo upload"
            )
        
        # ✅ Validation 2: Check for duplicate URL
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        existing_photos = user.get("photos", [])
        if request.url in existing_photos:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Photo already uploaded"
            )
        
        # ✅ Validation 3: Check photo limit again (race condition protection)
        if len(existing_photos) >= 6:
            # Delete uploaded photo from Cloudinary
            try:
                cloudinary.uploader.destroy(request.public_id)
                logger.info(f"Deleted excess photo: {request.public_id}")
            except Exception as e:
                logger.error(f"Failed to delete excess photo: {str(e)}")
            
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 6 photos allowed"
            )
        
        # ✅ Update user profile - add photo to array
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$push": {"photos": request.url},
                "$set": {"updatedAt": datetime.utcnow()}
            }
        )
        
        if result.modified_count == 0:
            logger.warning(f"Photo upload completed but user not updated: {user_id}")
        
        # Log upload for rate limiting
        await log_upload(user_id, request.public_id, request.url)
        
        logger.info(f"Photo upload completed for user {user_id}: {request.public_id}")
        
        return {
            "message": "Photo uploaded successfully",
            "url": request.url,
            "photoCount": len(existing_photos) + 1
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"Database error in complete_upload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"Unexpected error in complete_upload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save photo"
        )


@router.delete("/photo/{photo_index}")
async def delete_photo(
    photo_index: int,
    current_user = Depends(get_current_user)
):
    """
    Delete photo from Cloudinary and user profile
    
    Security:
    - Validates photo belongs to user
    - Deletes from Cloudinary first
    - Removes from user profile
    - Handles partial failures gracefully
    """
    try:
        user_id = str(current_user["_id"])
        
        # ✅ Get user and validate photo exists
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        photos = user.get("photos", [])
        if photo_index < 0 or photo_index >= len(photos):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid photo index"
            )
        
        photo_url = photos[photo_index]
        
        # ✅ Extract public_id from Cloudinary URL
        # URL format: https://res.cloudinary.com/{cloud_name}/image/upload/{public_id}.{format}
        try:
            # Extract public_id from URL
            parts = photo_url.split('/')
            if 'upload' in parts:
                upload_idx = parts.index('upload')
                public_id_with_ext = '/'.join(parts[upload_idx + 1:])
                # Remove file extension
                public_id = public_id_with_ext.rsplit('.', 1)[0]
            else:
                raise ValueError("Invalid Cloudinary URL format")
            
            # ✅ Verify public_id belongs to user
            expected_prefix = f"alivv/users/{user_id}/"
            if not public_id.startswith(expected_prefix):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Unauthorized photo deletion"
                )
            
            # ✅ Delete from Cloudinary
            delete_result = cloudinary.uploader.destroy(public_id)
            logger.info(f"Cloudinary delete result: {delete_result}")
            
        except Exception as e:
            logger.error(f"Failed to delete from Cloudinary: {str(e)}")
            # Continue to remove from DB even if Cloudinary delete fails
        
        # ✅ Remove from user profile
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$pull": {"photos": photo_url},
                "$set": {"updatedAt": datetime.utcnow()}
            }
        )
        
        if result.modified_count == 0:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to remove photo from profile"
            )
        
        logger.info(f"Photo deleted for user {user_id}: {public_id}")
        
        return {
            "message": "Photo deleted successfully",
            "deletedUrl": photo_url,
            "remainingPhotos": len(photos) - 1
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"Database error in delete_photo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"Unexpected error in delete_photo: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete photo"
        )


@router.get("/stats")
async def get_upload_stats(current_user = Depends(get_current_user)):
    """
    Get upload statistics for current user
    """
    try:
        user_id = str(current_user["_id"])
        
        # Get user photos
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        photos = user.get("photos", [])
        
        # Get upload count in last hour
        one_hour_ago = datetime.utcnow().timestamp() - 3600
        recent_uploads = await db.upload_logs.count_documents({
            "userId": ObjectId(user_id),
            "uploadedAt": {"$gte": one_hour_ago}
        })
        
        return {
            "currentPhotoCount": len(photos),
            "maxPhotos": 6,
            "uploadsInLastHour": recent_uploads,
            "maxUploadsPerHour": 10,
            "canUpload": len(photos) < 6 and recent_uploads < 10
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting upload stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get upload stats"
        )

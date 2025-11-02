"""
Upload Routes - Cloudinary Integration
Handles: Image uploads, presigned URLs, file management
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import List
import cloudinary
import cloudinary.uploader
import cloudinary.api
from datetime import datetime
from bson import ObjectId

from ..config import settings
from ..auth import get_current_user
from .. import db

router = APIRouter(prefix="/upload", tags=["Uploads"])

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)


# ===== MODELS =====
class PresignResponse(BaseModel):
    signature: str
    timestamp: int
    cloudName: str
    apiKey: str
    folder: str


class UploadCompleteRequest(BaseModel):
    url: str
    publicId: str
    format: str


# ===== ROUTES =====

@router.post("/presign")
async def generate_presign(
    current_user = Depends(get_current_user)
):
    """
    Generate Cloudinary presigned upload parameters
    For client-side direct uploads
    """
    try:
        timestamp = int(datetime.utcnow().timestamp())
        folder = f"alliv/users/{current_user['_id']}"
        
        # Generate signature for secure upload
        params_to_sign = {
            "timestamp": timestamp,
            "folder": folder
        }
        
        signature = cloudinary.utils.api_sign_request(
            params_to_sign,
            settings.CLOUDINARY_API_SECRET
        )
        
        return {
            "signature": signature,
            "timestamp": timestamp,
            "cloudName": settings.CLOUDINARY_CLOUD_NAME,
            "apiKey": settings.CLOUDINARY_API_KEY,
            "folder": folder
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate presign: {str(e)}")


@router.post("/photo")
async def upload_photo_direct(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Direct server-side photo upload to Cloudinary
    Alternative to client-side presigned uploads
    """
    try:
        # Validate file type
        allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Only JPEG, PNG, WEBP allowed")
        
        # Validate file size (5MB limit)
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max size: 5MB")
        
        # Upload to Cloudinary
        folder = f"alliv/users/{current_user['_id']}"
        upload_result = cloudinary.uploader.upload(
            content,
            folder=folder,
            transformation=[
                {"width": 800, "height": 800, "crop": "limit"},
                {"quality": "auto:good"}
            ]
        )
        
        return {
            "url": upload_result["secure_url"],
            "publicId": upload_result["public_id"],
            "format": upload_result["format"],
            "width": upload_result.get("width"),
            "height": upload_result.get("height")
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/complete")
async def complete_upload(
    data: UploadCompleteRequest,
    current_user = Depends(get_current_user)
):
    """
    Save uploaded photo URL to user profile
    Called after successful client-side upload
    """
    try:
        user_id = current_user["_id"]
        
        # Get current profile
        profile = await db.profiles().find_one({"userId": user_id})
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        # Add photo to photos array (max 6 photos)
        current_photos = profile.get("photos", [])
        
        if len(current_photos) >= 6:
            raise HTTPException(status_code=400, detail="Maximum 6 photos allowed")
        
        # Check if photo already exists
        if data.url in current_photos:
            raise HTTPException(status_code=400, detail="Photo already uploaded")
        
        current_photos.append(data.url)
        
        # Update profile
        await db.profiles().update_one(
            {"userId": user_id},
            {
                "$set": {
                    "photos": current_photos,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        return {
            "message": "Photo added successfully",
            "photos": current_photos,
            "total": len(current_photos)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/photo")
async def delete_photo(
    photoUrl: str,
    current_user = Depends(get_current_user)
):
    """
    Delete a photo from Cloudinary and user profile
    """
    try:
        user_id = current_user["_id"]
        
        # Get profile
        profile = await db.profiles().find_one({"userId": user_id})
        
        if not profile:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        current_photos = profile.get("photos", [])
        
        if photoUrl not in current_photos:
            raise HTTPException(status_code=404, detail="Photo not found in profile")
        
        # Extract public_id from URL
        # Example URL: https://res.cloudinary.com/dvlqelnsf/image/upload/v123/alliv/users/abc/photo.jpg
        try:
            parts = photoUrl.split("/upload/")
            if len(parts) == 2:
                public_id = parts[1].split(".")[0]  # Remove extension
                
                # Delete from Cloudinary
                cloudinary.uploader.destroy(public_id)
        except Exception as e:
            # Continue even if Cloudinary delete fails
            pass
        
        # Remove from profile
        current_photos.remove(photoUrl)
        
        await db.profiles().update_one(
            {"userId": user_id},
            {
                "$set": {
                    "photos": current_photos,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        return {
            "message": "Photo deleted successfully",
            "photos": current_photos,
            "total": len(current_photos)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """
    Upload user avatar (single main profile photo)
    Replaces existing avatar
    """
    try:
        # Validate file
        allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        content = await file.read()
        if len(content) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File too large. Max: 5MB")
        
        # Upload with avatar transformation (square crop)
        folder = f"alliv/users/{current_user['_id']}/avatar"
        upload_result = cloudinary.uploader.upload(
            content,
            folder=folder,
            transformation=[
                {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
                {"quality": "auto:good"}
            ]
        )
        
        # Update profile with new avatar
        await db.profiles().update_one(
            {"userId": current_user["_id"]},
            {
                "$set": {
                    "avatar": upload_result["secure_url"],
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        return {
            "url": upload_result["secure_url"],
            "message": "Avatar updated successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my-uploads")
async def get_my_uploads(
    current_user = Depends(get_current_user)
):
    """
    List all uploads for current user from Cloudinary
    """
    try:
        folder = f"alliv/users/{current_user['_id']}"
        
        result = cloudinary.api.resources(
            type="upload",
            prefix=folder,
            max_results=50
        )
        
        uploads = [{
            "url": resource["secure_url"],
            "publicId": resource["public_id"],
            "format": resource["format"],
            "width": resource.get("width"),
            "height": resource.get("height"),
            "createdAt": resource.get("created_at")
        } for resource in result.get("resources", [])]
        
        return {
            "uploads": uploads,
            "total": len(uploads)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

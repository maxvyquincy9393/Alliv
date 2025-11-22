"""
Media Upload Router for Feed Posts
Handles photo and video uploads for community feed posts
Supports: Images (jpg, png, webp, gif) and Videos (mp4, mov, webm)
"""
from fastapi import APIRouter, HTTPException, status, Depends, File, UploadFile
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime
import os
import mimetypes
import hashlib
import logging
from pathlib import Path

from ..auth import get_current_user
from ..db import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/media", tags=["Media"])

# Configuration
UPLOAD_DIR = Path("uploads/media")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
MAX_MEDIA_PER_POST = 10

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"}


# ===== MODELS =====
class MediaMetadata(BaseModel):
    """Media file metadata"""
    type: Literal["image", "video"]
    url: str
    filename: str
    size: int
    mimeType: str
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None  # For videos in seconds
    aspectRatio: Optional[str] = None  # "square", "portrait", "landscape"


class MediaUploadResponse(BaseModel):
    """Response for successful media upload"""
    success: bool
    media: MediaMetadata
    message: str = "Media uploaded successfully"


class MediaDeleteRequest(BaseModel):
    """Request to delete media"""
    url: str


# ===== HELPER FUNCTIONS =====
def get_aspect_ratio(width: int, height: int) -> str:
    """Determine aspect ratio category"""
    if not width or not height:
        return "unknown"
    
    ratio = width / height
    
    if 0.95 <= ratio <= 1.05:
        return "square"
    elif ratio < 0.95:
        return "portrait"
    else:
        return "landscape"


def validate_file_type(content_type: str, file_data: bytes) -> tuple[bool, str]:
    """Validate file type and return (is_valid, media_type)"""
    if content_type in ALLOWED_IMAGE_TYPES:
        return True, "image"
    elif content_type in ALLOWED_VIDEO_TYPES:
        return True, "video"
    else:
        return False, ""


def generate_unique_filename(user_id: str, original_filename: str) -> str:
    """Generate unique filename"""
    timestamp = int(datetime.utcnow().timestamp() * 1000)
    ext = Path(original_filename).suffix.lower()
    unique_str = f"{user_id}_{timestamp}_{original_filename}"
    hash_str = hashlib.md5(unique_str.encode()).hexdigest()[:12]
    return f"{user_id}_{timestamp}_{hash_str}{ext}"


async def extract_image_dimensions(file_path: Path) -> tuple[Optional[int], Optional[int]]:
    """Extract image dimensions using PIL"""
    try:
        from PIL import Image
        with Image.open(file_path) as img:
            return img.width, img.height
    except Exception as e:
        logger.warning(f"Could not extract image dimensions: {e}")
        return None, None


async def extract_video_metadata(file_path: Path) -> tuple[Optional[int], Optional[int], Optional[float]]:
    """Extract video dimensions and duration"""
    # For now, return None - can be enhanced with moviepy later
    # This would require: pip install moviepy
    logger.info(f"Video metadata extraction not implemented yet for: {file_path}")
    return None, None, None


# ===== ENDPOINTS =====
@router.post("/upload", response_model=MediaUploadResponse)
async def upload_media(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload media file (image or video) for feed posts
    
    **Supported formats:**
    - Images: JPG, PNG, WebP, GIF (max 5MB)
    - Videos: MP4, MOV, WebM, AVI (max 100MB)
    
    **Returns:**
    - Media metadata including URL, dimensions, type, etc.
    """
    user_id = str(current_user["_id"])
    
    try:
        # Read file data
        file_data = await file.read()
        file_size = len(file_data)
        
        # Detect content type
        content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
        
        # Validate file type
        is_valid, media_type = validate_file_type(content_type, file_data)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file type: {content_type}. Allowed: images (jpg, png, webp, gif) and videos (mp4, mov, webm)"
            )
        
        # Validate file size
        max_size = MAX_IMAGE_SIZE if media_type == "image" else MAX_VIDEO_SIZE
        if file_size > max_size:
            max_mb = max_size / 1024 / 1024
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"{media_type.capitalize()} file too large. Max size: {max_mb}MB"
            )
        
        # Generate unique filename
        filename = generate_unique_filename(user_id, file.filename or "media")
        file_path = UPLOAD_DIR / filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(file_data)
        
        # Extract metadata
        width, height, duration = None, None, None
        
        if media_type == "image":
            width, height = await extract_image_dimensions(file_path)
        else:  # video
            width, height, duration = await extract_video_metadata(file_path)
        
        aspect_ratio = get_aspect_ratio(width or 0, height or 0) if width and height else None
        
        # Generate URL (relative path)
        media_url = f"/uploads/media/{filename}"
        
        # Create metadata
        media_metadata = MediaMetadata(
            type=media_type,
            url=media_url,
            filename=filename,
            size=file_size,
            mimeType=content_type,
            width=width,
            height=height,
            duration=duration,
            aspectRatio=aspect_ratio
        )
        
        logger.info(f"Media uploaded: {media_type} for user {user_id}, size: {file_size} bytes")
        
        return MediaUploadResponse(
            success=True,
            media=media_metadata,
            message=f"{media_type.capitalize()} uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        # Clean up file if it was created
        if 'file_path' in locals() and file_path.exists():
            try:
                file_path.unlink()
            except:
                pass
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload media: {str(e)}"
        )


@router.post("/upload-multiple", response_model=List[MediaUploadResponse])
async def upload_multiple_media(
    files: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload multiple media files at once (max 10)
    
    **Limits:**
    - Max files per request: 10
    - Same limits as single upload apply to each file
    """
    if len(files) > MAX_MEDIA_PER_POST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Too many files. Maximum {MAX_MEDIA_PER_POST} files allowed per post"
        )
    
    results = []
    errors = []
    
    for idx, file in enumerate(files):
        try:
            result = await upload_media(file, current_user)
            results.append(result)
        except HTTPException as e:
            errors.append(f"File {idx + 1} ({file.filename}): {e.detail}")
        except Exception as e:
            errors.append(f"File {idx + 1} ({file.filename}): {str(e)}")
    
    if errors and not results:
        # All uploads failed
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"All uploads failed: {'; '.join(errors)}"
        )
    
    # Return successful uploads (partial success is OK)
    return results


@router.delete("/delete")
async def delete_media(
    request: MediaDeleteRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete uploaded media file
    
    **Security:**
    - Only file owner can delete
    - Validates file exists and belongs to user
    """
    user_id = str(current_user["_id"])
    
    try:
        # Extract filename from URL
        if not request.url.startswith("/uploads/media/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid media URL"
            )
        
        filename = request.url.replace("/uploads/media/", "")
        
        # Verify file belongs to user (filename starts with user_id)
        if not filename.startswith(f"{user_id}_"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Unauthorized: Cannot delete media from another user"
            )
        
        file_path = UPLOAD_DIR / filename
        
        if not file_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Media file not found"
            )
        
        # Delete file
        file_path.unlink()
        
        logger.info(f"Media deleted: {filename} by user {user_id}")
        
        return {
            "success": True,
            "message": "Media deleted successfully",
            "url": request.url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete media"
        )


@router.get("/validate")
async def validate_media_url(
    url: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Validate that a media URL exists and is accessible
    """
    try:
        if not url.startswith("/uploads/media/"):
            return {"valid": False, "error": "Invalid media URL format"}
        
        filename = url.replace("/uploads/media/", "")
        file_path = UPLOAD_DIR / filename
        
        if not file_path.exists():
            return {"valid": False, "error": "Media file not found"}
        
        return {
            "valid": True,
            "size": file_path.stat().st_size,
            "exists": True
        }
        
    except Exception as e:
        logger.error(f"Validation error: {str(e)}")
        return {"valid": False, "error": str(e)}

"""
Cloudinary Service - Photo Upload & Management
Handles: Upload, transformation, deletion, URL generation
Security: File validation, size limits, rate limiting
"""
import cloudinary
import cloudinary.uploader
import cloudinary.api
from typing import Optional, Dict, List
import hashlib
import time
import mimetypes
from datetime import datetime
import logging

from ..config import settings

logger = logging.getLogger(__name__)


class CloudinaryService:
    """Cloudinary integration for photo uploads"""
    
    # Configuration
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB in bytes
    ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"]
    ALLOWED_MIME_TYPES = [
        "image/jpeg",
        "image/png", 
        "image/webp"
    ]
    MAX_PHOTOS_PER_USER = 6
    UPLOADS_PER_HOUR = 10
    
    def __init__(self):
        """Initialize Cloudinary configuration"""
        try:
            cloudinary.config(
                cloud_name=settings.CLOUDINARY_CLOUD_NAME,
                api_key=settings.CLOUDINARY_API_KEY,
                api_secret=settings.CLOUDINARY_API_SECRET,
                secure=True
            )
            logger.info(f"Cloudinary configured: {settings.CLOUDINARY_CLOUD_NAME}")
        except Exception as e:
            logger.error(f"Failed to configure Cloudinary: {str(e)}")
            raise
    
    def validate_file(self, file_data: bytes, filename: str) -> Dict[str, any]:
        """
        Validate uploaded file
        Returns: {"valid": bool, "error": str}
        """
        # Check file size
        file_size = len(file_data)
        if file_size > self.MAX_FILE_SIZE:
            return {
                "valid": False,
                "error": f"File size ({file_size / 1024 / 1024:.2f}MB) exceeds 5MB limit"
            }
        
        if file_size == 0:
            return {"valid": False, "error": "Empty file"}
        
        # Check file extension
        file_ext = filename.lower().split('.')[-1] if '.' in filename else ''
        if file_ext not in self.ALLOWED_FORMATS:
            return {
                "valid": False,
                "error": f"Invalid format. Allowed: {', '.join(self.ALLOWED_FORMATS)}"
            }
        
        # Check MIME type (magic bytes validation)
        mime_type, _ = mimetypes.guess_type(filename)
        if mime_type not in self.ALLOWED_MIME_TYPES:
            # Additional check using file signature
            if not self._validate_image_signature(file_data):
                return {"valid": False, "error": "Invalid image file"}
        
        return {"valid": True, "error": None}
    
    def _validate_image_signature(self, file_data: bytes) -> bool:
        """Validate file is actually an image using magic bytes"""
        if len(file_data) < 12:
            return False
        
        # JPEG signature
        if file_data[:2] == b'\xff\xd8':
            return True
        
        # PNG signature
        if file_data[:8] == b'\x89PNG\r\n\x1a\n':
            return True
        
        # WebP signature
        if file_data[:4] == b'RIFF' and file_data[8:12] == b'WEBP':
            return True
        
        return False
    
    def generate_public_id(self, user_id: str) -> str:
        """Generate unique public_id for Cloudinary upload"""
        timestamp = int(time.time() * 1000)
        unique_str = f"{user_id}_{timestamp}"
        hash_id = hashlib.md5(unique_str.encode()).hexdigest()[:16]
        return f"collabmatch/{user_id}/photos/{hash_id}"
    
    async def upload_photo(
        self,
        file_data: bytes,
        user_id: str,
        filename: str
    ) -> Dict[str, any]:
        """
        Upload photo to Cloudinary with transformations
        
        Returns:
        {
            "url": str,
            "publicId": str,
            "width": int,
            "height": int,
            "format": str,
            "bytes": int
        }
        """
        try:
            # Validate file
            validation = self.validate_file(file_data, filename)
            if not validation["valid"]:
                raise ValueError(validation["error"])
            
            # Generate public_id
            public_id = self.generate_public_id(user_id)
            
            # Upload with transformations
            result = cloudinary.uploader.upload(
                file_data,
                public_id=public_id,
                folder=f"collabmatch/{user_id}/photos",
                transformation=[
                    {
                        "width": 800,
                        "height": 800,
                        "crop": "limit",  # Maintain aspect ratio
                        "quality": "auto:good",
                        "fetch_format": "auto"  # Auto-convert to WebP if supported
                    }
                ],
                allowed_formats=self.ALLOWED_FORMATS,
                resource_type="image",
                overwrite=False,
                invalidate=True,
                tags=[f"user_{user_id}", "profile_photo"]
            )
            
            logger.info(f"Photo uploaded: {result['public_id']} for user {user_id}")
            
            return {
                "url": result["secure_url"],
                "publicId": result["public_id"],
                "width": result.get("width", 0),
                "height": result.get("height", 0),
                "format": result.get("format", ""),
                "bytes": result.get("bytes", 0)
            }
            
        except cloudinary.exceptions.Error as e:
            logger.error(f"Cloudinary upload error: {str(e)}")
            raise ValueError(f"Upload failed: {str(e)}")
        except Exception as e:
            logger.error(f"Unexpected upload error: {str(e)}")
            raise
    
    async def delete_photo(self, public_id: str) -> bool:
        """Delete photo from Cloudinary"""
        try:
            result = cloudinary.uploader.destroy(
                public_id,
                invalidate=True
            )
            success = result.get("result") == "ok"
            if success:
                logger.info(f"Photo deleted: {public_id}")
            else:
                logger.warning(f"Photo deletion failed: {public_id} - {result}")
            return success
        except Exception as e:
            logger.error(f"Error deleting photo: {str(e)}")
            return False
    
    async def get_photo_info(self, public_id: str) -> Optional[Dict]:
        """Get photo metadata from Cloudinary"""
        try:
            result = cloudinary.api.resource(public_id)
            return {
                "url": result["secure_url"],
                "width": result["width"],
                "height": result["height"],
                "format": result["format"],
                "bytes": result["bytes"],
                "created_at": result["created_at"]
            }
        except Exception as e:
            logger.error(f"Error getting photo info: {str(e)}")
            return None
    
    async def get_user_photos(self, user_id: str, max_results: int = 10) -> List[Dict]:
        """Get all photos for a user from Cloudinary"""
        try:
            result = cloudinary.api.resources(
                type="upload",
                prefix=f"collabmatch/{user_id}/photos",
                max_results=max_results
            )
            
            photos = []
            for resource in result.get("resources", []):
                photos.append({
                    "url": resource["secure_url"],
                    "publicId": resource["public_id"],
                    "width": resource["width"],
                    "height": resource["height"],
                    "format": resource["format"]
                })
            
            return photos
        except Exception as e:
            logger.error(f"Error getting user photos: {str(e)}")
            return []
    
    def get_transformed_url(
        self,
        public_id: str,
        width: Optional[int] = None,
        height: Optional[int] = None,
        quality: str = "auto",
        format: str = "auto"
    ) -> str:
        """Generate transformed URL for existing photo"""
        transformations = {
            "quality": quality,
            "fetch_format": format
        }
        
        if width:
            transformations["width"] = width
        if height:
            transformations["height"] = height
            
        if width or height:
            transformations["crop"] = "limit"
        
        return cloudinary.CloudinaryImage(public_id).build_url(
            **transformations,
            secure=True
        )


# Singleton instance
cloudinary_service = CloudinaryService()

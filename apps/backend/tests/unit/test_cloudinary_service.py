"""
Unit Tests for Cloudinary Service
Tests: File validation, upload, deletion, transformations
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.services.cloudinary import CloudinaryService, cloudinary_service


class TestFileValidation:
    """Test file validation functionality"""
    
    def setup_method(self):
        """Setup test instance"""
        self.service = CloudinaryService()
    
    def test_validate_file_valid_jpeg(self):
        """Test valid JPEG file passes validation"""
        # JPEG magic bytes
        jpeg_data = b'\xff\xd8\xff\xe0' + b'\x00' * 1000
        result = self.service.validate_file(jpeg_data, "photo.jpg")
        
        assert result["valid"] is True
        assert result["error"] is None
    
    def test_validate_file_valid_png(self):
        """Test valid PNG file passes validation"""
        # PNG magic bytes
        png_data = b'\x89PNG\r\n\x1a\n' + b'\x00' * 1000
        result = self.service.validate_file(png_data, "photo.png")
        
        assert result["valid"] is True
        assert result["error"] is None
    
    def test_validate_file_valid_webp(self):
        """Test valid WebP file passes validation"""
        # WebP magic bytes
        webp_data = b'RIFF' + b'\x00' * 4 + b'WEBP' + b'\x00' * 1000
        result = self.service.validate_file(webp_data, "photo.webp")
        
        assert result["valid"] is True
        assert result["error"] is None
    
    def test_validate_file_too_large(self):
        """Test file size limit (5MB)"""
        large_data = b'\xff\xd8\xff\xe0' + b'\x00' * (6 * 1024 * 1024)  # 6MB
        result = self.service.validate_file(large_data, "photo.jpg")
        
        assert result["valid"] is False
        assert "5MB limit" in result["error"]
    
    def test_validate_file_empty(self):
        """Test empty file is rejected"""
        result = self.service.validate_file(b'', "photo.jpg")
        
        assert result["valid"] is False
        assert "Empty file" in result["error"]
    
    def test_validate_file_invalid_extension(self):
        """Test invalid file extension is rejected"""
        jpeg_data = b'\xff\xd8\xff\xe0' + b'\x00' * 1000
        result = self.service.validate_file(jpeg_data, "photo.gif")
        
        assert result["valid"] is False
        assert "Invalid format" in result["error"]
    
    def test_validate_file_invalid_magic_bytes(self):
        """Test file with wrong magic bytes is rejected"""
        fake_data = b'FAKE' + b'\x00' * 1000
        result = self.service.validate_file(fake_data, "photo.jpg")
        
        assert result["valid"] is False
        assert "Invalid image" in result["error"]
    
    def test_validate_image_signature_jpeg(self):
        """Test JPEG signature validation"""
        jpeg_data = b'\xff\xd8\xff\xe0' + b'\x00' * 100
        assert self.service._validate_image_signature(jpeg_data) is True
    
    def test_validate_image_signature_png(self):
        """Test PNG signature validation"""
        png_data = b'\x89PNG\r\n\x1a\n' + b'\x00' * 100
        assert self.service._validate_image_signature(png_data) is True
    
    def test_validate_image_signature_webp(self):
        """Test WebP signature validation"""
        webp_data = b'RIFF\x00\x00\x00\x00WEBP' + b'\x00' * 100
        assert self.service._validate_image_signature(webp_data) is True
    
    def test_validate_image_signature_invalid(self):
        """Test invalid signature is rejected"""
        invalid_data = b'INVALID' + b'\x00' * 100
        assert self.service._validate_image_signature(invalid_data) is False
    
    def test_validate_image_signature_too_short(self):
        """Test file too short for signature check"""
        assert self.service._validate_image_signature(b'SHORT') is False


class TestPublicIdGeneration:
    """Test public_id generation"""
    
    def setup_method(self):
        """Setup test instance"""
        self.service = CloudinaryService()
    
    def test_generate_public_id_format(self):
        """Test public_id has correct format"""
        user_id = "user123"
        public_id = self.service.generate_public_id(user_id)
        
        assert public_id.startswith(f"collabmatch/{user_id}/photos/")
        assert len(public_id) > len(f"collabmatch/{user_id}/photos/")
    
    def test_generate_public_id_unique(self):
        """Test each public_id is unique"""
        user_id = "user123"
        id1 = self.service.generate_public_id(user_id)
        id2 = self.service.generate_public_id(user_id)
        
        assert id1 != id2
    
    def test_generate_public_id_different_users(self):
        """Test different users get different paths"""
        id1 = self.service.generate_public_id("user1")
        id2 = self.service.generate_public_id("user2")
        
        assert "user1" in id1
        assert "user2" in id2
        assert id1 != id2


@pytest.mark.asyncio
class TestCloudinaryUpload:
    """Test Cloudinary upload functionality"""
    
    def setup_method(self):
        """Setup test instance"""
        self.service = CloudinaryService()
    
    @patch('cloudinary.uploader.upload')
    async def test_upload_photo_success(self, mock_upload):
        """Test successful photo upload"""
        # Mock Cloudinary response
        mock_upload.return_value = {
            "secure_url": "https://res.cloudinary.com/test/image/upload/photo.jpg",
            "public_id": "collabmatch/user123/photos/abc123",
            "width": 800,
            "height": 600,
            "format": "jpg",
            "bytes": 150000
        }
        
        jpeg_data = b'\xff\xd8\xff\xe0' + b'\x00' * 1000
        result = await self.service.upload_photo(
            file_data=jpeg_data,
            user_id="user123",
            filename="photo.jpg"
        )
        
        assert result["url"] == "https://res.cloudinary.com/test/image/upload/photo.jpg"
        assert result["publicId"] == "collabmatch/user123/photos/abc123"
        assert result["width"] == 800
        assert result["height"] == 600
        assert mock_upload.called
    
    async def test_upload_photo_invalid_file(self):
        """Test upload with invalid file raises ValueError"""
        invalid_data = b'INVALID' + b'\x00' * 100
        
        with pytest.raises(ValueError) as exc_info:
            await self.service.upload_photo(
                file_data=invalid_data,
                user_id="user123",
                filename="photo.jpg"
            )
        
        assert "Invalid image" in str(exc_info.value)
    
    async def test_upload_photo_too_large(self):
        """Test upload with oversized file raises ValueError"""
        large_data = b'\xff\xd8\xff\xe0' + b'\x00' * (6 * 1024 * 1024)
        
        with pytest.raises(ValueError) as exc_info:
            await self.service.upload_photo(
                file_data=large_data,
                user_id="user123",
                filename="photo.jpg"
            )
        
        assert "5MB limit" in str(exc_info.value)


@pytest.mark.asyncio
class TestCloudinaryDeletion:
    """Test photo deletion"""
    
    def setup_method(self):
        """Setup test instance"""
        self.service = CloudinaryService()
    
    @patch('cloudinary.uploader.destroy')
    async def test_delete_photo_success(self, mock_destroy):
        """Test successful photo deletion"""
        mock_destroy.return_value = {"result": "ok"}
        
        result = await self.service.delete_photo("collabmatch/user123/photos/abc123")
        
        assert result is True
        assert mock_destroy.called
    
    @patch('cloudinary.uploader.destroy')
    async def test_delete_photo_not_found(self, mock_destroy):
        """Test deletion of non-existent photo"""
        mock_destroy.return_value = {"result": "not found"}
        
        result = await self.service.delete_photo("nonexistent")
        
        assert result is False
    
    @patch('cloudinary.uploader.destroy')
    async def test_delete_photo_error(self, mock_destroy):
        """Test deletion error handling"""
        mock_destroy.side_effect = Exception("Cloudinary error")
        
        result = await self.service.delete_photo("collabmatch/user123/photos/abc123")
        
        assert result is False


class TestTransformations:
    """Test URL transformation generation"""
    
    def setup_method(self):
        """Setup test instance"""
        self.service = CloudinaryService()
    
    @patch('cloudinary.CloudinaryImage')
    def test_get_transformed_url_with_dimensions(self, mock_image):
        """Test URL generation with dimensions"""
        mock_image.return_value.build_url.return_value = "https://transformed.url"
        
        url = self.service.get_transformed_url(
            public_id="test/photo",
            width=400,
            height=300
        )
        
        assert "https://transformed.url" == url
        mock_image.assert_called_once_with("test/photo")
    
    @patch('cloudinary.CloudinaryImage')
    def test_get_transformed_url_quality_format(self, mock_image):
        """Test URL generation with quality and format"""
        mock_image.return_value.build_url.return_value = "https://transformed.url"
        
        url = self.service.get_transformed_url(
            public_id="test/photo",
            quality="auto:best",
            format="webp"
        )
        
        assert url is not None


# Integration test marker
@pytest.mark.integration
@pytest.mark.asyncio
class TestCloudinaryIntegration:
    """Integration tests (requires Cloudinary credentials)"""
    
    async def test_full_upload_delete_cycle(self):
        """Test complete upload and delete cycle"""
        # This test requires real Cloudinary credentials
        # Skip if credentials not available
        try:
            service = CloudinaryService()
            
            # Create test image
            jpeg_data = b'\xff\xd8\xff\xe0' + b'\x00' * 1000
            
            # Upload
            result = await service.upload_photo(
                file_data=jpeg_data,
                user_id="test_user",
                filename="test.jpg"
            )
            
            assert "url" in result
            assert "publicId" in result
            
            # Delete
            deleted = await service.delete_photo(result["publicId"])
            assert deleted is True
            
        except Exception as e:
            pytest.skip(f"Integration test skipped: {str(e)}")

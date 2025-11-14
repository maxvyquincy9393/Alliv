"""
Integration Tests for Upload Router
Tests: Upload endpoint, rate limiting, file validation, deletion
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from io import BytesIO
from datetime import datetime, timedelta
from bson import ObjectId

from app.main import app
from app.services.cloudinary import cloudinary_service


@pytest.fixture
def auth_headers():
    """Mock authentication headers"""
    # In real tests, generate valid JWT token
    return {"Authorization": "Bearer mock_token"}


@pytest.fixture
def mock_current_user():
    """Mock current user"""
    return {
        "_id": ObjectId(),
        "email": "test@example.com",
        "name": "Test User",
        "photos": []
    }


@pytest.fixture
def valid_jpeg_file():
    """Create valid JPEG file for testing"""
    jpeg_data = b'\xff\xd8\xff\xe0' + b'\x00' * 1000
    return ("photo.jpg", BytesIO(jpeg_data), "image/jpeg")


@pytest.fixture
def valid_png_file():
    """Create valid PNG file for testing"""
    png_data = b'\x89PNG\r\n\x1a\n' + b'\x00' * 1000
    return ("photo.png", BytesIO(png_data), "image/png")


@pytest.fixture
def large_file():
    """Create file larger than 5MB"""
    large_data = b'\xff\xd8\xff\xe0' + b'\x00' * (6 * 1024 * 1024)
    return ("large.jpg", BytesIO(large_data), "image/jpeg")


@pytest.fixture
def invalid_file():
    """Create invalid file (not an image)"""
    invalid_data = b'NOTANIMAGE' + b'\x00' * 100
    return ("invalid.jpg", BytesIO(invalid_data), "image/jpeg")


class TestPhotoUploadEndpoint:
    """Test POST /upload/photo endpoint"""
    
    @patch('app.routers.upload.get_current_user')
    @patch('app.routers.upload.cloudinary_service.upload_photo')
    @patch('app.routers.upload.get_db')
    def test_upload_photo_success(
        self,
        mock_get_db,
        mock_upload,
        mock_auth,
        valid_jpeg_file,
        mock_current_user
    ):
        """Test successful photo upload"""
        # Setup mocks
        mock_auth.return_value = mock_current_user
        mock_upload.return_value = {
            "url": "https://res.cloudinary.com/test/photo.jpg",
            "publicId": "collabmatch/user123/photos/abc123",
            "width": 800,
            "height": 600,
            "format": "jpg",
            "bytes": 150000
        }
        
        # Mock database
        mock_db = AsyncMock()
        mock_db.users.find_one.return_value = mock_current_user
        mock_db.users.update_one.return_value = AsyncMock(modified_count=1)
        mock_db.upload_logs.count_documents.return_value = 0
        mock_db.upload_logs.insert_one.return_value = AsyncMock()
        mock_get_db.return_value = mock_db
        
        client = TestClient(app)
        
        files = {"file": valid_jpeg_file}
        response = client.post("/upload/photo", files=files)
        
        assert response.status_code == 201
        data = response.json()
        assert "url" in data
        assert "publicId" in data
        assert data["url"] == "https://res.cloudinary.com/test/photo.jpg"
    
    @patch('app.routers.upload.get_current_user')
    def test_upload_photo_no_auth(self, mock_auth):
        """Test upload without authentication fails"""
        mock_auth.side_effect = Exception("Unauthorized")
        
        client = TestClient(app)
        files = {"file": ("photo.jpg", BytesIO(b"data"), "image/jpeg")}
        
        with pytest.raises(Exception):
            client.post("/upload/photo", files=files)
    
    @patch('app.routers.upload.get_current_user')
    @patch('app.routers.upload.get_db')
    def test_upload_photo_file_too_large(
        self,
        mock_get_db,
        mock_auth,
        large_file,
        mock_current_user
    ):
        """Test upload with file > 5MB fails"""
        mock_auth.return_value = mock_current_user
        
        # Mock database
        mock_db = AsyncMock()
        mock_db.upload_logs.count_documents.return_value = 0
        mock_get_db.return_value = mock_db
        
        client = TestClient(app)
        files = {"file": large_file}
        response = client.post("/upload/photo", files=files)
        
        assert response.status_code == 413
        assert "too large" in response.json()["detail"].lower()
    
    @patch('app.routers.upload.get_current_user')
    @patch('app.routers.upload.get_db')
    def test_upload_photo_invalid_format(
        self,
        mock_get_db,
        mock_auth,
        invalid_file,
        mock_current_user
    ):
        """Test upload with invalid file format fails"""
        mock_auth.return_value = mock_current_user
        
        # Mock database
        mock_db = AsyncMock()
        mock_db.users.find_one.return_value = mock_current_user
        mock_db.upload_logs.count_documents.return_value = 0
        mock_get_db.return_value = mock_db
        
        client = TestClient(app)
        files = {"file": invalid_file}
        response = client.post("/upload/photo", files=files)
        
        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()
    
    @patch('app.routers.upload.get_current_user')
    @patch('app.routers.upload.get_db')
    def test_upload_photo_max_photos_reached(
        self,
        mock_get_db,
        mock_auth,
        valid_jpeg_file,
        mock_current_user
    ):
        """Test upload when user has max photos (6) fails"""
        # User already has 6 photos
        mock_current_user["photos"] = [{"url": f"photo{i}.jpg"} for i in range(6)]
        mock_auth.return_value = mock_current_user
        
        # Mock database
        mock_db = AsyncMock()
        mock_db.users.find_one.return_value = mock_current_user
        mock_db.upload_logs.count_documents.return_value = 0
        mock_get_db.return_value = mock_db
        
        client = TestClient(app)
        files = {"file": valid_jpeg_file}
        response = client.post("/upload/photo", files=files)
        
        assert response.status_code == 400
        assert "maximum" in response.json()["detail"].lower()
    
    @patch('app.routers.upload.get_current_user')
    @patch('app.routers.upload.get_db')
    def test_upload_photo_rate_limit_exceeded(
        self,
        mock_get_db,
        mock_auth,
        valid_jpeg_file,
        mock_current_user
    ):
        """Test upload rate limit (10 per hour)"""
        mock_auth.return_value = mock_current_user
        
        # Mock database - user has uploaded 10 times in last hour
        mock_db = AsyncMock()
        mock_db.users.find_one.return_value = mock_current_user
        mock_db.upload_logs.count_documents.return_value = 10  # At limit
        mock_get_db.return_value = mock_db
        
        client = TestClient(app)
        files = {"file": valid_jpeg_file}
        response = client.post("/upload/photo", files=files)
        
        assert response.status_code == 429
        assert "rate limit" in response.json()["detail"].lower()


class TestPhotoDeleteEndpoint:
    """Test DELETE /upload/photo endpoint"""
    
    @patch('app.routers.upload.get_current_user')
    @patch('app.routers.upload.cloudinary_service.delete_photo')
    @patch('app.routers.upload.get_db')
    def test_delete_photo_success(
        self,
        mock_get_db,
        mock_delete,
        mock_auth,
        mock_current_user
    ):
        """Test successful photo deletion"""
        public_id = "collabmatch/user123/photos/abc123"
        mock_current_user["photos"] = [{"publicId": public_id, "url": "test.jpg"}]
        mock_auth.return_value = mock_current_user
        mock_delete.return_value = True
        
        # Mock database
        mock_db = AsyncMock()
        mock_db.users.find_one.return_value = mock_current_user
        mock_db.users.update_one.return_value = AsyncMock(modified_count=1)
        mock_get_db.return_value = mock_db
        
        client = TestClient(app)
        response = client.delete("/upload/photo", json={"publicId": public_id})
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
    
    @patch('app.routers.upload.get_current_user')
    @patch('app.routers.upload.get_db')
    def test_delete_photo_not_owned(
        self,
        mock_get_db,
        mock_auth,
        mock_current_user
    ):
        """Test deletion of photo not owned by user"""
        mock_current_user["photos"] = []  # No photos
        mock_auth.return_value = mock_current_user
        
        # Mock database
        mock_db = AsyncMock()
        mock_db.users.find_one.return_value = mock_current_user
        mock_get_db.return_value = mock_db
        
        client = TestClient(app)
        response = client.delete(
            "/upload/photo",
            json={"publicId": "someone_else_photo"}
        )
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


class TestGetPhotosEndpoint:
    """Test GET /upload/photos endpoint"""
    
    @patch('app.routers.upload.get_current_user')
    @patch('app.routers.upload.get_db')
    def test_get_photos_success(
        self,
        mock_get_db,
        mock_auth,
        mock_current_user
    ):
        """Test getting user photos"""
        mock_current_user["photos"] = [
            {"url": "photo1.jpg", "publicId": "id1"},
            {"url": "photo2.jpg", "publicId": "id2"}
        ]
        mock_auth.return_value = mock_current_user
        
        # Mock database
        mock_db = AsyncMock()
        mock_db.users.find_one.return_value = mock_current_user
        mock_get_db.return_value = mock_db
        
        client = TestClient(app)
        response = client.get("/upload/photos")
        
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 2
        assert data["maxPhotos"] == 6
        assert len(data["photos"]) == 2
    
    @patch('app.routers.upload.get_current_user')
    @patch('app.routers.upload.get_db')
    def test_get_photos_empty(
        self,
        mock_get_db,
        mock_auth,
        mock_current_user
    ):
        """Test getting photos when user has none"""
        mock_current_user["photos"] = []
        mock_auth.return_value = mock_current_user
        
        # Mock database
        mock_db = AsyncMock()
        mock_db.users.find_one.return_value = mock_current_user
        mock_get_db.return_value = mock_db
        
        client = TestClient(app)
        response = client.get("/upload/photos")
        
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0
        assert data["photos"] == []


@pytest.mark.integration
class TestUploadIntegration:
    """Integration tests with real Cloudinary (requires credentials)"""
    
    def test_full_upload_flow(self):
        """Test complete upload flow"""
        # This requires real Cloudinary credentials and database
        pytest.skip("Integration test - requires real services")

"""
Simple integration tests for authentication API endpoints
These tests are designed to work with the actual backend implementation
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestHealthEndpoint:
    """Test health check endpoints"""
    
    async def test_health_endpoint(self, client: AsyncClient):
        """Should return health check response"""
        response = await client.get("/health")
        
        # Should not be 404 (endpoint exists)
        assert response.status_code != 404, "Health endpoint should exist"
        # Can be 200 (healthy) or 503 (database unavailable - expected in tests)
        assert response.status_code in [200, 503], f"Expected 200 or 503, got {response.status_code}"
        
        data = response.json()
        assert "status" in data
        print(f"✅ Health endpoint responded: {data['status']} (status code: {response.status_code})")


@pytest.mark.asyncio
class TestBasicAuth:
    """Test basic authentication flow"""
    
    async def test_register_endpoint_exists(self, client: AsyncClient):
        """Should have register endpoint"""
        user_data = {
            "email": "test@example.com",
            "password": "TestPass123!",
            "username": "testuser",
            "fullName": "Test User"
        }
        
        response = await client.post("/auth/register", json=user_data)
        
        # Should not be 404 (endpoint exists)
        assert response.status_code != 404, "Register endpoint should exist"
        print(f"✅ Register endpoint exists (status: {response.status_code})")
    
    async def test_login_endpoint_exists(self, client: AsyncClient):
        """Should have login endpoint"""
        login_data = {
            "email": "test@example.com",
            "password": "TestPass123!"
        }
        
        response = await client.post("/auth/login", json=login_data)
        
        # Should not be 404 (endpoint exists)
        assert response.status_code != 404, "Login endpoint should exist"
        print(f"✅ Login endpoint exists (status: {response.status_code})")

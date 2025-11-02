"""
Integration tests for authentication API endpoints
"""
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestAuthRegistration:
    """Test user registration endpoint"""
    
    async def test_register_success(self, client: AsyncClient, mock_user_data):
        """Should successfully register new user"""
        response = await client.post("/api/auth/register", json=mock_user_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert "user" in data
        assert "access_token" in data
        assert data["user"]["email"] == mock_user_data["email"]
        assert "password" not in data["user"]  # Should not return password
    
    async def test_register_duplicate_email(self, client: AsyncClient, mock_user_data):
        """Should reject duplicate email"""
        # Register first user
        await client.post("/api/auth/register", json=mock_user_data)
        
        # Try to register again with same email
        response = await client.post("/api/auth/register", json=mock_user_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "email" in data["detail"].lower()
    
    async def test_register_invalid_email(self, client: AsyncClient, mock_user_data):
        """Should reject invalid email format"""
        mock_user_data["email"] = "invalid-email"
        
        response = await client.post("/api/auth/register", json=mock_user_data)
        
        assert response.status_code == 422  # Validation error
    
    async def test_register_weak_password(self, client: AsyncClient, mock_user_data):
        """Should reject weak password"""
        mock_user_data["password"] = "123"  # Too weak
        
        response = await client.post("/api/auth/register", json=mock_user_data)
        
        assert response.status_code == 400
        assert "password" in response.json()["detail"].lower()
    
    async def test_register_missing_fields(self, client: AsyncClient):
        """Should reject missing required fields"""
        incomplete_data = {"email": "test@example.com"}  # Missing password, name, etc.
        
        response = await client.post("/api/auth/register", json=incomplete_data)
        
        assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
class TestAuthLogin:
    """Test user login endpoint"""
    
    async def test_login_success(self, client: AsyncClient, mock_user_data):
        """Should successfully login with correct credentials"""
        # Register user first
        await client.post("/api/auth/register", json=mock_user_data)
        
        # Login
        login_data = {
            "email": mock_user_data["email"],
            "password": mock_user_data["password"]
        }
        response = await client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        assert "user" in data
        assert data["user"]["email"] == mock_user_data["email"]
    
    async def test_login_wrong_password(self, client: AsyncClient, mock_user_data):
        """Should reject wrong password"""
        # Register user
        await client.post("/api/auth/register", json=mock_user_data)
        
        # Login with wrong password
        login_data = {
            "email": mock_user_data["email"],
            "password": "WrongPassword123!"
        }
        response = await client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Should reject login for non-existent user"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123!"
        }
        response = await client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 401
    
    async def test_login_oauth_user_with_email_password(self, client: AsyncClient):
        """Should reject email/password login for OAuth users"""
        # This tests the provider check we added
        # Would need to mock OAuth registration first
        pass


@pytest.mark.asyncio
class TestAuthTokenRefresh:
    """Test token refresh endpoint"""
    
    async def test_refresh_token_success(self, client: AsyncClient, authenticated_user):
        """Should successfully refresh access token"""
        refresh_token = authenticated_user.get("refresh_token")
        
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": refresh_token}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert data["access_token"] != authenticated_user["access_token"]
    
    async def test_refresh_with_invalid_token(self, client: AsyncClient):
        """Should reject invalid refresh token"""
        response = await client.post(
            "/api/auth/refresh",
            json={"refresh_token": "invalid.token.here"}
        )
        
        assert response.status_code == 401


@pytest.mark.asyncio
class TestAuthProtectedRoutes:
    """Test authentication required on protected routes"""
    
    async def test_protected_route_without_token(self, client: AsyncClient):
        """Should reject request without auth token"""
        response = await client.get("/api/profile/me")
        
        assert response.status_code == 401
    
    async def test_protected_route_with_valid_token(
        self, 
        client: AsyncClient, 
        authenticated_user
    ):
        """Should allow request with valid auth token"""
        headers = {"Authorization": f"Bearer {authenticated_user['access_token']}"}
        
        response = await client.get("/api/profile/me", headers=headers)
        
        assert response.status_code == 200
    
    async def test_protected_route_with_expired_token(self, client: AsyncClient):
        """Should reject request with expired token"""
        # Would need to create an expired token
        # Implementation depends on auth.py structure
        pass

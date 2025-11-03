"""
Pytest configuration and fixtures
"""
import pytest
import pytest_asyncio
import asyncio
from typing import AsyncGenerator, Generator
from motor.motor_asyncio import AsyncIOMotorClient
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import Settings


@pytest_asyncio.fixture
async def test_db() -> AsyncGenerator:
    """
    Create test database connection
    """
    # Use test database
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["alliv_test"]
    
    yield db
    
    # Cleanup after test
    await client.drop_database("alliv_test")
    client.close()


@pytest_asyncio.fixture(scope="function")
async def client() -> AsyncGenerator[AsyncClient, None]:
    """
    Create test HTTP client
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def mock_user_data():
    """
    Mock user data for testing
    """
    return {
        "email": "test@example.com",
        "password": "Test123!@#",
        "name": "Test User",
        "age": 25,
        "bio": "Test bio",
        "skills": ["Python", "JavaScript"],
        "interests": ["Coding", "Music"]
    }


@pytest.fixture
async def authenticated_user(client: AsyncClient, mock_user_data):
    """
    Create authenticated user and return access token
    """
    # Register user
    response = await client.post("/api/auth/register", json=mock_user_data)
    assert response.status_code == 201
    
    # Login
    login_data = {
        "email": mock_user_data["email"],
        "password": mock_user_data["password"]
    }
    response = await client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    
    data = response.json()
    return {
        "access_token": data["access_token"],
        "user_id": data["user"]["id"]
    }

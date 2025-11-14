"""
Pytest configuration and fixtures
"""
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from motor.motor_asyncio import AsyncIOMotorClient
from httpx import AsyncClient, ASGITransport
from app.main import app
from app import db as app_db


TEST_DB_NAME = "alliv_test_pytest"
MONGO_TEST_URI = "mongodb://localhost:27017"


@pytest_asyncio.fixture(scope="function")
async def db() -> AsyncGenerator:
    """
    Provide an isolated Mongo database and hook it into app.db.
    """
    client = AsyncIOMotorClient(MONGO_TEST_URI)
    database = client[TEST_DB_NAME]
    
    # Ensure clean slate
    await client.drop_database(TEST_DB_NAME)
    
    # Attach to application globals
    app_db._client = client  # pylint: disable=protected-access
    app_db._db = database    # pylint: disable=protected-access
    
    try:
        yield database
    finally:
        await client.drop_database(TEST_DB_NAME)
        client.close()
        app_db._client = None  # pylint: disable=protected-access
        app_db._db = None      # pylint: disable=protected-access


@pytest_asyncio.fixture(scope="function")
async def client(db) -> AsyncGenerator[AsyncClient, None]:
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

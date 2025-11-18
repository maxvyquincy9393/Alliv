"""
Pytest configuration and fixtures
"""
import sys
from pathlib import Path
from typing import AsyncGenerator

import pytest
import pytest_asyncio
import unittest.mock
from motor.motor_asyncio import AsyncIOMotorClient
from httpx import AsyncClient, ASGITransport

# Ensure the backend package root (which contains the `app` package) is importable
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.main import app  # noqa: E402  (import after sys.path manipulation)
from app import db as app_db  # noqa: E402


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
    # Patch init_db and create_indexes to do nothing, since we manually set up the db
    # We need to patch where it is used (app.main)
    async def mock_init_db():
        pass
        
    async def mock_create_indexes():
        pass

    with unittest.mock.patch("app.main.init_db", side_effect=mock_init_db), \
         unittest.mock.patch("app.main.create_indexes", side_effect=mock_create_indexes):
        
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

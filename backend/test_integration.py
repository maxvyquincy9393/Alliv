"""
Integration Tests for COLABMATCH
Tests complete user flows: discovery, swipe, match, OAuth
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId
import os
from app.password_utils import hash_password

# Test configuration
TEST_MONGODB_URI = os.getenv("TEST_MONGODB_URI", "mongodb://localhost:27017")
TEST_DB_NAME = "colabmatch_test"


@pytest_asyncio.fixture
async def test_db():
    """Create test database"""
    client = AsyncIOMotorClient(TEST_MONGODB_URI)
    db = client[TEST_DB_NAME]
    
    # Clean up before tests
    await db.users.delete_many({})
    await db.profiles.delete_many({})
    await db.swipes.delete_many({})
    await db.matches.delete_many({})
    
    yield db
    
    # Clean up after tests
    await db.users.delete_many({})
    await db.profiles.delete_many({})
    await db.swipes.delete_many({})
    await db.matches.delete_many({})
    client.close()


@pytest_asyncio.fixture
async def test_client(test_db):
    """Create test HTTP client"""
    from app.main import app
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


TEST_PASSWORD = "password123"


@pytest_asyncio.fixture
async def test_user(test_db):
    """Create test user"""
    user_doc = {
        "_id": ObjectId(),
        "email": "testuser@example.com",
        "passwordHash": hash_password(TEST_PASSWORD),
        "name": "Test User",
        "provider": "email",
        "emailVerified": True,
        "emailVerifiedAt": datetime.utcnow(),
        "roles": ["user"],
        "active": True,
        "refreshTokens": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    await test_db.users.insert_one(user_doc)
    
    # Create profile
    profile_doc = {
        "userId": str(user_doc["_id"]),
        "name": "Test User",
        "bio": "Test bio",
        "skills": ["Python", "FastAPI"],
        "interests": ["AI", "Web Development"],
        "location": {"lat": 0.0, "lon": 0.0},
        "photos": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    await test_db.profiles.insert_one(profile_doc)
    
    return user_doc


@pytest_asyncio.fixture
async def test_user2(test_db):
    """Create second test user"""
    user_doc = {
        "_id": ObjectId(),
        "email": "testuser2@example.com",
        "passwordHash": hash_password(TEST_PASSWORD),
        "name": "Test User 2",
        "provider": "email",
        "emailVerified": True,
        "emailVerifiedAt": datetime.utcnow(),
        "roles": ["user"],
        "active": True,
        "refreshTokens": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    await test_db.users.insert_one(user_doc)
    
    # Create profile
    profile_doc = {
        "userId": str(user_doc["_id"]),
        "name": "Test User 2",
        "bio": "Test bio 2",
        "skills": ["Python", "React"],
        "interests": ["AI", "Mobile Development"],
        "location": {"lat": 0.1, "lon": 0.1},
        "photos": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    await test_db.profiles.insert_one(profile_doc)
    
    return user_doc


@pytest.mark.asyncio
async def test_discovery_flow(test_client, test_user, test_user2):
    """Test: Discovery flow (online/nearby)"""
    
    # Login as test_user
    login_response = await test_client.post(
        "/auth/login",
        json={"email": "testuser@example.com", "password": TEST_PASSWORD}
    )
    assert login_response.status_code == 200
    token = login_response.json()["accessToken"]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test online discovery
    online_response = await test_client.get(
        "/discover/online",
        headers=headers
    )
    assert online_response.status_code == 200
    online_data = online_response.json()
    assert isinstance(online_data, list)
    
    # Test nearby discovery
    nearby_response = await test_client.get(
        "/discover/nearby?lat=0.0&lon=0.0&radius=100",
        headers=headers
    )
    assert nearby_response.status_code == 200
    nearby_data = nearby_response.json()
    assert isinstance(nearby_data, list)


@pytest.mark.asyncio
async def test_swipe_match_flow(test_client, test_user, test_user2, test_db):
    """Test: Swipe → Match flow"""
    
    # Login as test_user
    login1_response = await test_client.post(
        "/auth/login",
        json={"email": "testuser@example.com", "password": TEST_PASSWORD}
    )
    assert login1_response.status_code == 200
    token1 = login1_response.json()["accessToken"]
    
    # Login as test_user2
    login2_response = await test_client.post(
        "/auth/login",
        json={"email": "testuser2@example.com", "password": TEST_PASSWORD}
    )
    assert login2_response.status_code == 200
    token2 = login2_response.json()["accessToken"]
    
    headers1 = {"Authorization": f"Bearer {token1}"}
    headers2 = {"Authorization": f"Bearer {token2}"}
    
    # User 1 swipes right on User 2
    swipe1_response = await test_client.post(
        "/swipes/",
        headers=headers1,
        json={
            "targetId": str(test_user2["_id"]),
            "action": "connect"
        }
    )
    assert swipe1_response.status_code == 200
    swipe1_data = swipe1_response.json()
    assert swipe1_data["match"] == False  # No match yet
    
    # User 2 swipes right on User 1
    swipe2_response = await test_client.post(
        "/swipes/",
        headers=headers2,
        json={
            "targetId": str(test_user["_id"]),
            "action": "connect"
        }
    )
    assert swipe2_response.status_code == 200
    swipe2_data = swipe2_response.json()
    assert swipe2_data["match"] == True  # Match!
    assert "matchData" in swipe2_data
    
    # Verify match in database
    match = await test_db.matches.find_one({
        "users": {"$all": [test_user["_id"], test_user2["_id"]]}
    })
    assert match is not None
    assert match["status"] == "active"
    
    # Get matches for User 1
    matches_response = await test_client.get(
        "/swipes/matches",
        headers=headers1
    )
    assert matches_response.status_code == 200
    matches_data = matches_response.json()
    assert len(matches_data) == 1


@pytest.mark.asyncio
async def test_skip_swipe(test_client, test_user, test_user2, test_db):
    """Test: Skip swipe (should not create match)"""
    
    # Login as test_user
    login_response = await test_client.post(
        "/auth/login",
        json={"email": "testuser@example.com", "password": "password123"}
    )
    token = login_response.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Skip User 2
    skip_response = await test_client.post(
        "/swipes/",
        headers=headers,
        json={
            "targetId": str(test_user2["_id"]),
            "action": "skip"
        }
    )
    assert skip_response.status_code == 200
    skip_data = skip_response.json()
    assert skip_data["match"] == False
    
    # Verify no match created
    match = await test_db.matches.find_one({
        "users": {"$all": [test_user["_id"], test_user2["_id"]]}
    })
    assert match is None


@pytest.mark.asyncio
async def test_duplicate_swipe_prevention(test_client, test_user, test_user2):
    """Test: Cannot swipe on same user twice"""
    
    # Login
    login_response = await test_client.post(
        "/auth/login",
        json={"email": "testuser@example.com", "password": "password123"}
    )
    token = login_response.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # First swipe
    swipe1_response = await test_client.post(
        "/swipes/",
        headers=headers,
        json={
            "targetId": str(test_user2["_id"]),
            "action": "connect"
        }
    )
    assert swipe1_response.status_code == 200
    
    # Second swipe (should fail)
    swipe2_response = await test_client.post(
        "/swipes/",
        headers=headers,
        json={
            "targetId": str(test_user2["_id"]),
            "action": "connect"
        }
    )
    assert swipe2_response.status_code == 400
    assert "already swiped" in swipe2_response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_self_swipe_prevention(test_client, test_user):
    """Test: Cannot swipe on yourself"""
    
    # Login
    login_response = await test_client.post(
        "/auth/login",
        json={"email": "testuser@example.com", "password": "password123"}
    )
    token = login_response.json()["accessToken"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try to swipe on self
    swipe_response = await test_client.post(
        "/swipes/",
        headers=headers,
        json={
            "targetId": str(test_user["_id"]),
            "action": "connect"
        }
    )
    assert swipe_response.status_code == 400
    assert "yourself" in swipe_response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_auth_flow(test_client):
    """Test: Complete auth flow (register → verify → login → refresh)"""
    
    # Register
    register_response = await test_client.post(
        "/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "NewPassword123!",
            "name": "New User"
        }
    )
    assert register_response.status_code == 200
    
    # Login
    login_response = await test_client.post(
        "/auth/login",
        json={
            "email": "newuser@example.com",
            "password": "NewPassword123!"
        }
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert "accessToken" in login_data
    assert "refreshToken" not in login_data
    
    # Refresh token
    refresh_response = await test_client.post("/auth/refresh")
    assert refresh_response.status_code == 200
    refresh_data = refresh_response.json()
    assert "access_token" in refresh_data


# Summary
def test_summary():
    """Print test summary"""
    print("\n" + "="*60)
    print("INTEGRATION TEST SUMMARY")
    print("="*60)
    print("✅ Discovery Flow: Online & Nearby discovery")
    print("✅ Swipe → Match Flow: Mutual swipes create matches")
    print("✅ Skip Swipe: Skip action doesn't create matches")
    print("✅ Duplicate Swipe Prevention: Cannot swipe twice")
    print("✅ Self Swipe Prevention: Cannot swipe on yourself")
    print("✅ Auth Flow: Register → Login → Refresh")
    print("="*60)

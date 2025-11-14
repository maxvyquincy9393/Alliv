"""
Comprehensive test suite for Swipe System
Tests all swipe scenarios termasuk match detection
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient
from datetime import datetime
from bson import ObjectId

from app.main import app


# ===== TEST DATA =====

@pytest_asyncio.fixture
async def test_users(db):
    """Create test users untuk pengujian swipe"""
    await db.users.delete_many({"email": {"$regex": "^test_swipe_"}})
    await db.swipes.delete_many({})
    await db.matches.delete_many({})
    
    users_data = [
        {
            "email": "test_swipe_user1@test.com",
            "hashed_password": "test_hash",
            "name": "Alice",
            "age": 25,
            "field": "Photography",
            "skills": ["Portrait", "Editing"],
            "interests": ["Travel", "Art"],
            "bio": "Photographer",
            "avatar": "https://i.pravatar.cc/150?img=1",
            "isOnline": True,
            "lastSeen": datetime.utcnow()
        },
        {
            "email": "test_swipe_user2@test.com",
            "hashed_password": "test_hash",
            "name": "Bob",
            "age": 28,
            "field": "Design",
            "skills": ["UI/UX", "Branding"],
            "interests": ["Tech", "Art"],
            "bio": "Designer",
            "avatar": "https://i.pravatar.cc/150?img=2",
            "isOnline": True,
            "lastSeen": datetime.utcnow()
        },
        {
            "email": "test_swipe_user3@test.com",
            "hashed_password": "test_hash",
            "name": "Charlie",
            "age": 26,
            "field": "Photography",
            "skills": ["Commercial", "Product"],
            "interests": ["Business", "Travel"],
            "bio": "Commercial photographer",
            "avatar": "https://i.pravatar.cc/150?img=3",
            "isOnline": False,
            "lastSeen": datetime.utcnow()
        }
    ]
    
    result = await db.users.insert_many(users_data)
    user_ids = [str(uid) for uid in result.inserted_ids]
    
    try:
        yield {
            "user1": user_ids[0],
            "user2": user_ids[1],
            "user3": user_ids[2]
        }
    finally:
        await db.users.delete_many({"email": {"$regex": "^test_swipe_"}})
        await db.swipes.delete_many({})
        await db.matches.delete_many({})


@pytest.fixture
def mock_auth_token(test_users):
    """Token auth sederhana memakai user1"""
    return test_users["user1"]


# ===== SWIPE ACTION TESTS =====

@pytest.mark.asyncio
class TestSwipeActions:
    """Test basic swipe actions (like, pass, super_like)"""
    
    async def test_like_no_match(self, test_users, mock_auth_token):
        """Test simple like action without match"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user2"],
                    "action": "like"
                },
                headers={"Authorization": f"Bearer {mock_auth_token}"}
            )
            
            assert response.status_code == 201
            data = response.json()
            
            assert data["success"] is True
            assert data["action"] == "like"
            assert data["is_match"] is False
            assert data["match"] is None
            assert "Successfully" in data["message"]
    
    async def test_super_like_no_match(self, test_users, mock_auth_token):
        """Test super like action without match"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user2"],
                    "action": "super_like"
                },
                headers={"Authorization": f"Bearer {mock_auth_token}"}
            )
            
            assert response.status_code == 201
            data = response.json()
            
            assert data["success"] is True
            assert data["action"] == "super_like"
            assert data["is_match"] is False
    
    async def test_pass_action(self, test_users, mock_auth_token):
        """Test pass action"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user2"],
                    "action": "pass"
                },
                headers={"Authorization": f"Bearer {mock_auth_token}"}
            )
            
            assert response.status_code == 201
            data = response.json()
            
            assert data["success"] is True
            assert data["action"] == "pass"
            assert data["is_match"] is False  # Pass never creates match


# ===== MATCH DETECTION TESTS =====

@pytest.mark.asyncio
class TestMatchDetection:
    """Test automatic match creation when mutual likes occur"""
    
    async def test_mutual_like_creates_match(self, test_users, db):
        """Test that mutual like creates a match"""
        # User1 likes User2 (no match yet)
        async with AsyncClient(app=app, base_url="http://test") as client:
            response1 = await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user2"],
                    "action": "like"
                },
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            assert response1.status_code == 201
            data1 = response1.json()
            assert data1["is_match"] is False
            
            # User2 likes User1 (MATCH!)
            response2 = await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user1"],
                    "action": "like"
                },
                headers={"Authorization": f"Bearer {test_users['user2']}"}
            )
            
            assert response2.status_code == 201
            data2 = response2.json()
            
            # Verify match was created
            assert data2["is_match"] is True
            assert data2["match"] is not None
            assert data2["message"] == "It's a match! 🎉"
            
            # Verify match object structure
            match = data2["match"]
            assert "id" in match
            assert match["user1_id"] == test_users["user2"]
            assert match["user2_id"] == test_users["user1"]
            assert "matched_user" in match
            
            # Verify matched user info
            matched_user = match["matched_user"]
            assert matched_user["name"] == "Alice"
            assert matched_user["age"] == 25
            assert matched_user["field"] == "Photography"
            
            # Verify match exists in database
            match_in_db = await db.matches.find_one({"_id": ObjectId(match["id"])})
            assert match_in_db is not None
    
    async def test_super_like_creates_match(self, test_users):
        """Test that super_like can create match"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # User1 likes User2
            await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user2"],
                    "action": "like"
                },
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            # User2 super_likes User1 (should create match)
            response = await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user1"],
                    "action": "super_like"
                },
                headers={"Authorization": f"Bearer {test_users['user2']}"}
            )
            
            assert response.status_code == 201
            data = response.json()
            
            assert data["is_match"] is True
            assert data["match"] is not None
    
    async def test_like_after_super_like_creates_match(self, test_users):
        """Test that regular like after super_like creates match"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # User1 super_likes User2
            await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user2"],
                    "action": "super_like"
                },
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            # User2 likes User1 (should create match)
            response = await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user1"],
                    "action": "like"
                },
                headers={"Authorization": f"Bearer {test_users['user2']}"}
            )
            
            assert response.status_code == 201
            data = response.json()
            
            assert data["is_match"] is True


# ===== BUSINESS RULES TESTS =====

@pytest.mark.asyncio
class TestBusinessRules:
    """Test business rule validations"""
    
    async def test_cannot_swipe_self(self, test_users):
        """Test that user cannot swipe on themselves"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user1"],
                    "action": "like"
                },
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            assert response.status_code == 400
            data = response.json()
            assert "yourself" in data["detail"].lower()
    
    async def test_cannot_swipe_twice(self, test_users):
        """Test that user cannot swipe same person twice"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # First swipe (should succeed)
            response1 = await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user2"],
                    "action": "like"
                },
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            assert response1.status_code == 201
            
            # Second swipe on same user (should fail)
            response2 = await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user2"],
                    "action": "like"
                },
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            assert response2.status_code == 409
            data = response2.json()
            assert "already swiped" in data["detail"].lower()
    
    async def test_cannot_change_swipe_action(self, test_users):
        """Test that user cannot change swipe action (pass -> like)"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # First pass
            await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user2"],
                    "action": "pass"
                },
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            # Try to like (should fail - duplicate swipe)
            response = await client.post(
                "/swipes",
                json={
                    "target_user_id": test_users["user2"],
                    "action": "like"
                },
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            assert response.status_code == 409
    
    async def test_invalid_target_user(self, test_users):
        """Test swipe on non-existent user"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/swipes",
                json={
                    "target_user_id": "507f1f77bcf86cd799439011",  # Valid format but doesn't exist
                    "action": "like"
                },
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            assert response.status_code == 404
            data = response.json()
            assert "not found" in data["detail"].lower()
    
    async def test_invalid_user_id_format(self, test_users):
        """Test swipe with invalid ObjectId format"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.post(
                "/swipes",
                json={
                    "target_user_id": "invalid_id",
                    "action": "like"
                },
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            assert response.status_code == 400
            data = response.json()
            assert "invalid" in data["detail"].lower()


# ===== SWIPE STATS TESTS =====

@pytest.mark.asyncio
class TestSwipeStats:
    """Test swipe statistics endpoint"""
    
    async def test_empty_stats(self, test_users):
        """Test stats when user has no swipes"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/swipes/stats",
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["total_swipes"] == 0
            assert data["likes_sent"] == 0
            assert data["super_likes_sent"] == 0
            assert data["passes"] == 0
            assert data["matches"] == 0
            assert data["match_rate"] == 0.0
    
    async def test_stats_calculation(self, test_users):
        """Test stats calculation with various swipes"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # User1 swipes on User2 and User3
            await client.post(
                "/swipes",
                json={"target_user_id": test_users["user2"], "action": "like"},
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            await client.post(
                "/swipes",
                json={"target_user_id": test_users["user3"], "action": "super_like"},
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            # User2 likes User1 back (creates match)
            await client.post(
                "/swipes",
                json={"target_user_id": test_users["user1"], "action": "like"},
                headers={"Authorization": f"Bearer {test_users['user2']}"}
            )
            
            # Get User1's stats
            response = await client.get(
                "/swipes/stats",
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["total_swipes"] == 2
            assert data["likes_sent"] == 1
            assert data["super_likes_sent"] == 1
            assert data["passes"] == 0
            assert data["matches"] == 1
            assert data["match_rate"] == 50.0  # 1 match out of 2 likes


# ===== SWIPE HISTORY TESTS =====

@pytest.mark.asyncio
class TestSwipeHistory:
    """Test swipe history retrieval"""
    
    async def test_get_history(self, test_users):
        """Test retrieving swipe history"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create some swipes
            await client.post(
                "/swipes",
                json={"target_user_id": test_users["user2"], "action": "like"},
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            await client.post(
                "/swipes",
                json={"target_user_id": test_users["user3"], "action": "pass"},
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            # Get history
            response = await client.get(
                "/swipes/history",
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["count"] == 2
            assert len(data["swipes"]) == 2
            
            # Verify swipe objects have correct structure
            swipe = data["swipes"][0]
            assert "id" in swipe
            assert "target_user_id" in swipe
            assert "action" in swipe
            assert "created_at" in swipe
            assert "target_user" in swipe
            
            # Verify target user info
            target_user = swipe["target_user"]
            assert "name" in target_user
            assert "age" in target_user
            assert "field" in target_user
    
    async def test_history_pagination(self, test_users):
        """Test swipe history pagination"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Get with limit
            response = await client.get(
                "/swipes/history?limit=1&skip=0",
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["limit"] == 1
            assert data["skip"] == 0


# ===== UNDO SWIPE TESTS =====

@pytest.mark.asyncio
class TestUndoSwipe:
    """Test swipe undo functionality"""
    
    async def test_undo_swipe(self, test_users):
        """Test undoing a swipe"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Create swipe
            await client.post(
                "/swipes",
                json={"target_user_id": test_users["user2"], "action": "like"},
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            # Undo swipe
            response = await client.delete(
                f"/swipes/{test_users['user2']}",
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["success"] is True
            assert "undone" in data["message"].lower()
    
    async def test_undo_nonexistent_swipe(self, test_users):
        """Test undoing a swipe that doesn't exist"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.delete(
                f"/swipes/{test_users['user2']}",
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            
            assert response.status_code == 404
            data = response.json()
            assert "not found" in data["detail"].lower()


# ===== INTEGRATION TESTS =====

@pytest.mark.asyncio
class TestSwipeIntegration:
    """Test complete swipe flows"""
    
    async def test_complete_match_flow(self, test_users, db):
        """Test complete flow: swipe -> match -> stats"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # User1 likes User2
            response1 = await client.post(
                "/swipes",
                json={"target_user_id": test_users["user2"], "action": "like"},
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            assert response1.status_code == 201
            assert response1.json()["is_match"] is False
            
            # User2 likes User1 (creates match)
            response2 = await client.post(
                "/swipes",
                json={"target_user_id": test_users["user1"], "action": "like"},
                headers={"Authorization": f"Bearer {test_users['user2']}"}
            )
            assert response2.status_code == 201
            assert response2.json()["is_match"] is True
            
            # Check User1 stats
            stats1 = await client.get(
                "/swipes/stats",
                headers={"Authorization": f"Bearer {test_users['user1']}"}
            )
            assert stats1.json()["matches"] == 1
            
            # Check User2 stats
            stats2 = await client.get(
                "/swipes/stats",
                headers={"Authorization": f"Bearer {test_users['user2']}"}
            )
            assert stats2.json()["matches"] == 1
            
            # Verify match exists in database
            match_count = await db.matches.count_documents({
                "$or": [
                    {"user1_id": test_users["user1"], "user2_id": test_users["user2"]},
                    {"user1_id": test_users["user2"], "user2_id": test_users["user1"]}
                ]
            })
            assert match_count == 1


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])

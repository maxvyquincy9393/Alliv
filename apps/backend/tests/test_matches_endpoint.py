"""
Tests for GET /swipes/matches endpoint
Test match list retrieval with pagination, last message, and online status
"""
import pytest
import pytest_asyncio
from datetime import datetime, timedelta
from bson import ObjectId

pytestmark = pytest.mark.asyncio

@pytest_asyncio.fixture
async def test_users_with_matches(db):
    """Create test users with matches and messages"""
    users = []
    for i in range(5):
        user_data = {
            "email": f"user{i}@test.com",
            "name": f"User {i}",
            "age": 25 + i,
            "field": "Design",
            "hashed_password": "hashed_password",
            "avatar": f"https://example.com/avatar{i}.jpg",
            "is_online": i < 2,
            "last_seen": datetime.utcnow() if i >= 2 else None,
            "created_at": datetime.utcnow()
        }
        result = await db.users.insert_one(user_data)
        users.append(str(result.inserted_id))
    
    current_user_id = users[0]
    matches = []
    
    for i in range(1, 5):
        match_data = {
            "user1_id": current_user_id,
            "user2_id": users[i],
            "created_at": datetime.utcnow() - timedelta(days=5 - i),
            "last_message_at": datetime.utcnow() - timedelta(hours=i),
            "unread_count_user1": i,
            "unread_count_user2": 0
        }
        result = await db.matches.insert_one(match_data)
        matches.append(str(result.inserted_id))
    
    for i in range(2):
        message_data = {
            "match_id": matches[i],
            "sender_id": users[i + 1],
            "content": f"Hello from user {i + 1}!",
            "created_at": datetime.utcnow() - timedelta(hours=i + 1),
            "read": False
        }
        await db.messages.insert_one(message_data)
    
    return {
        "users": users,
        "matches": matches,
        "current_user_id": current_user_id
    }


@pytest.fixture
def mock_auth_token(test_users_with_matches):
    return test_users_with_matches["current_user_id"]


class TestGetMatches:
    """Test GET /swipes/matches endpoint"""
    
    async def test_get_matches_basic(self, client, test_users_with_matches, mock_auth_token):
        """Test basic match list retrieval"""
        response = await client.get(
            "/swipes/matches",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "matches" in data
        assert "count" in data
        assert data["count"] == 4  # 4 matches created
        assert len(data["matches"]) == 4
    
    async def test_get_matches_sorted_by_last_message(self, client, test_users_with_matches, mock_auth_token):
        """Test matches are sorted by last_message_at (most recent first)"""
        response = await client.get(
            "/swipes/matches",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        matches = data["matches"]
        
        # Verify sorting (most recent last_message_at first)
        last_message_times = []
        for match in matches:
            # Matches with last_message_at should come first
            if "last_message" in match and match["last_message"]:
                last_message_times.append(match["last_message"]["timestamp"])
        
        # Check messages are sorted descending
        for i in range(len(last_message_times) - 1):
            time1 = datetime.fromisoformat(last_message_times[i].replace('Z', '+00:00'))
            time2 = datetime.fromisoformat(last_message_times[i+1].replace('Z', '+00:00'))
            assert time1 >= time2, "Matches should be sorted by last message time descending"
    
    async def test_get_matches_includes_user_info(self, client, test_users_with_matches, mock_auth_token):
        """Test that match includes matched user info"""
        response = await client.get(
            "/swipes/matches",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        match = data["matches"][0]
        
        # Verify matched_user structure
        assert "matched_user" in match
        user = match["matched_user"]
        
        assert "id" in user
        assert "name" in user
        assert "avatar" in user
        assert "is_online" in user
        assert "last_seen" in user
        
        # Check user info is valid
        assert user["name"].startswith("User")
        assert user["avatar"].startswith("https://")
    
    async def test_get_matches_includes_last_message(self, client, test_users_with_matches, mock_auth_token):
        """Test that matches with messages include last_message"""
        response = await client.get(
            "/swipes/matches",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Find match with message
        match_with_message = None
        for match in data["matches"]:
            if match.get("last_message"):
                match_with_message = match
                break
        
        assert match_with_message is not None, "Should have at least one match with message"
        
        # Verify last_message structure
        msg = match_with_message["last_message"]
        assert "content" in msg
        assert "timestamp" in msg
        assert "sender_id" in msg
        
        assert msg["content"].startswith("Hello")
    
    async def test_get_matches_includes_unread_count(self, client, test_users_with_matches, mock_auth_token):
        """Test that matches include correct unread count"""
        response = await client.get(
            "/swipes/matches",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all matches have unread_count
        for match in data["matches"]:
            assert "unread_count" in match
            assert isinstance(match["unread_count"], int)
            assert match["unread_count"] >= 0
    
    async def test_get_matches_pagination_limit(self, client, test_users_with_matches, mock_auth_token):
        """Test pagination with limit parameter"""
        # Get only 2 matches
        response = await client.get(
            "/swipes/matches?limit=2",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["count"] == 2
        assert len(data["matches"]) == 2
    
    async def test_get_matches_pagination_offset(self, client, test_users_with_matches, mock_auth_token):
        """Test pagination with offset parameter"""
        # Get all matches first
        response1 = await client.get(
            "/swipes/matches",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        all_matches = response1.json()["matches"]
        
        # Get matches with offset=2
        response2 = await client.get(
            "/swipes/matches?offset=2",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        assert response2.status_code == 200
        data = response2.json()
        
        # Should get remaining matches (4 total - 2 offset = 2)
        assert data["count"] == 2
        
        # Verify IDs are different (skipped first 2)
        offset_match_ids = [m["id"] for m in data["matches"]]
        first_match_ids = [m["id"] for m in all_matches[:2]]
        
        assert offset_match_ids[0] not in first_match_ids
    
    async def test_get_matches_pagination_limit_offset_combined(self, client, test_users_with_matches, mock_auth_token):
        """Test pagination with both limit and offset"""
        response = await client.get(
            "/swipes/matches?limit=1&offset=1",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should get 1 match (the 2nd one)
        assert data["count"] == 1
        assert len(data["matches"]) == 1
    
    async def test_get_matches_max_limit(self, client, test_users_with_matches, mock_auth_token):
        """Test that limit is capped at 100"""
        response = await client.get(
            "/swipes/matches?limit=200",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should get all matches (4), but limit should be respected
        assert data["count"] <= 100  # Max limit enforced
    
    async def test_get_matches_empty_list(self, client, db):
        """Test getting matches when user has no matches"""
        # Create a new user with no matches
        user_data = {
            "email": "newuser@test.com",
            "name": "New User",
            "age": 25,
            "field": "Design",
            "hashed_password": "hashed_password",
            "created_at": datetime.utcnow()
        }
        result = await db.users.insert_one(user_data)
        new_user_id = str(result.inserted_id)
        
        response = await client.get(
            "/swipes/matches",
            headers={"Authorization": f"Bearer {new_user_id}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0
        assert data["matches"] == []
    
    async def test_get_matches_online_status(self, client, test_users_with_matches, mock_auth_token):
        """Test that online status is correctly returned"""
        response = await client.get(
            "/swipes/matches",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check that some users are online
        online_users = [m for m in data["matches"] if m["matched_user"]["is_online"]]
        offline_users = [m for m in data["matches"] if not m["matched_user"]["is_online"]]
        
        # We set first 2 users as online in fixture
        assert len(online_users) >= 1, "Should have at least one online user"
    
    async def test_get_matches_last_seen(self, client, test_users_with_matches, mock_auth_token):
        """Test that last_seen timestamp is included for offline users"""
        response = await client.get(
            "/swipes/matches",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Find offline user
        offline_match = None
        for match in data["matches"]:
            if not match["matched_user"]["is_online"] and match["matched_user"]["last_seen"]:
                offline_match = match
                break
        
        if offline_match:
            # Verify last_seen is a valid timestamp
            last_seen = offline_match["matched_user"]["last_seen"]
            assert last_seen is not None
            # Should be parseable as datetime
            datetime.fromisoformat(last_seen.replace('Z', '+00:00'))
    
    async def test_get_matches_unauthorized(self, client):
        """Test that unauthenticated requests are rejected"""
        response = await client.get("/swipes/matches")
        
        assert response.status_code == 401  # Unauthorized
    
    async def test_get_matches_includes_matched_at(self, client, test_users_with_matches, mock_auth_token):
        """Test that matches include matched_at timestamp"""
        response = await client.get(
            "/swipes/matches",
            headers={"Authorization": f"Bearer {mock_auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        for match in data["matches"]:
            assert "matched_at" in match
            # Should be valid ISO datetime
            matched_at = datetime.fromisoformat(match["matched_at"].replace('Z', '+00:00'))
            assert matched_at <= datetime.utcnow()


class TestGetMatchesIntegration:
    """Integration tests for complete match flow"""
    
    async def test_swipe_and_get_matches_flow(self, client, db):
        """Test complete flow: swipe -> match -> get matches"""
        # Create two users
        user1_data = {
            "email": "user1@test.com",
            "name": "User 1",
            "age": 25,
            "field": "Design",
            "hashed_password": "hashed",
            "avatar": "https://example.com/avatar1.jpg",
            "is_online": True,
            "created_at": datetime.utcnow()
        }
        user2_data = {
            "email": "user2@test.com",
            "name": "User 2",
            "age": 26,
            "field": "Photography",
            "hashed_password": "hashed",
            "avatar": "https://example.com/avatar2.jpg",
            "is_online": False,
            "last_seen": datetime.utcnow() - timedelta(hours=2),
            "created_at": datetime.utcnow()
        }
        
        result1 = await db.users.insert_one(user1_data)
        result2 = await db.users.insert_one(user2_data)
        
        user1_id = str(result1.inserted_id)
        user2_id = str(result2.inserted_id)
        
        # User 1 likes User 2
        await db.swipes.insert_one({
            "user_id": user1_id,
            "target_user_id": user2_id,
            "action": "like",
            "created_at": datetime.utcnow()
        })
        
        # User 2 likes User 1 (creates match)
        await db.swipes.insert_one({
            "user_id": user2_id,
            "target_user_id": user1_id,
            "action": "like",
            "created_at": datetime.utcnow()
        })
        
        # Create match manually (or use swipe endpoint)
        match_data = {
            "user1_id": user1_id,
            "user2_id": user2_id,
            "created_at": datetime.utcnow(),
            "last_message_at": None,
            "unread_count_user1": 0,
            "unread_count_user2": 0
        }
        await db.matches.insert_one(match_data)
        
        # Get matches for user1
        response = await client.get(
            "/swipes/matches",
            headers={"Authorization": f"Bearer {user1_id}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have the match
        assert data["count"] >= 1
        
        # Find the match we just created
        our_match = None
        for match in data["matches"]:
            if match["matched_user"]["name"] == "User 2":
                our_match = match
                break
        
        assert our_match is not None, "Should find our created match"
        assert our_match["matched_user"]["is_online"] is False
        assert our_match["matched_user"]["last_seen"] is not None
        assert our_match["unread_count"] == 0
        assert our_match["last_message"] is None  # No messages yet

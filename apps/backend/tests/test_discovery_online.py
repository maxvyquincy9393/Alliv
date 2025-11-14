"""
Tests for Discovery Online Endpoint
Comprehensive test coverage for compatibility scoring and user discovery
"""
import pytest
from datetime import datetime, timedelta
from bson import ObjectId
from bson.errors import InvalidId
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

from app.main import app
from app.routers.discovery_online import calculate_compatibility, format_user_response


# ===== TEST CLIENT =====
client = TestClient(app)


# ===== MOCK DATA =====

def create_mock_user(
    user_id: str = "507f1f77bcf86cd799439011",
    name: str = "Test User",
    age: int = 25,
    field: str = "Photography",
    skills: list = None,
    interests: list = None,
    is_online: bool = True
):
    """Helper to create mock user data"""
    try:
        object_id = ObjectId(user_id)
    except InvalidId:
        object_id = ObjectId()
    
    return {
        "_id": object_id,
        "email": f"{name.lower().replace(' ', '.')}@example.com",
        "name": name,
        "age": age,
        "field": field,
        "avatar": f"https://example.com/{name.lower()}.jpg",
        "skills": skills if skills is not None else ["Skill1", "Skill2"],
        "interests": interests if interests is not None else ["Interest1", "Interest2"],
        "bio": f"Bio for {name}",
        "location": {"lat": -6.2088, "lon": 106.8456, "city": "Jakarta"},
        "isOnline": is_online,
        "lastSeen": datetime.utcnow(),
        "photos": ["photo1.jpg"]
    }


# ===== COMPATIBILITY CALCULATION TESTS =====

class TestCompatibilityCalculation:
    """Test suite for compatibility scoring algorithm"""
    
    def test_perfect_match(self):
        """Test 100% compatibility with identical skills, interests, and field"""
        user1 = create_mock_user(
            skills=["Photography", "Editing", "Lightroom"],
            interests=["Travel", "Nature", "Art"],
            field="Photography"
        )
        user2 = create_mock_user(
            user_id="507f1f77bcf86cd799439012",
            skills=["Photography", "Editing", "Lightroom"],
            interests=["Travel", "Nature", "Art"],
            field="Photography"
        )
        
        score = calculate_compatibility(user1, user2)
        assert score == 100, f"Expected 100, got {score}"
    
    def test_no_match(self):
        """Test 0% compatibility with no common attributes"""
        user1 = create_mock_user(
            skills=["Photography", "Editing"],
            interests=["Travel", "Nature"],
            field="Photography"
        )
        user2 = create_mock_user(
            user_id="507f1f77bcf86cd799439012",
            skills=["Coding", "Design"],
            interests=["Gaming", "Music"],
            field="Developer"
        )
        
        score = calculate_compatibility(user1, user2)
        assert score == 0, f"Expected 0, got {score}"
    
    def test_partial_skills_match(self):
        """Test compatibility with 50% skills match"""
        user1 = create_mock_user(
            skills=["Photography", "Editing"],
            interests=[],  # No interests
            field="Photography"
        )
        user2 = create_mock_user(
            user_id="507f1f77bcf86cd799439012",
            skills=["Photography", "Design"],  # 1 common skill
            interests=[],
            field="Photography"
        )
        
        score = calculate_compatibility(user1, user2)
        # Skills: 1 common / 3 total = 0.33 * 40 = 13
        # Field: Perfect match = 20
        # Total: ~33
        assert 30 <= score <= 40, f"Expected ~33, got {score}"
    
    def test_field_match_only(self):
        """Test compatibility with only field match"""
        user1 = create_mock_user(
            skills=[],
            interests=[],
            field="Photography"
        )
        user2 = create_mock_user(
            user_id="507f1f77bcf86cd799439012",
            skills=[],
            interests=[],
            field="Photography"
        )
        
        score = calculate_compatibility(user1, user2)
        assert score == 20, f"Expected 20 (field match only), got {score}"
    
    def test_partial_field_match(self):
        """Test compatibility with partial field match"""
        user1 = create_mock_user(
            skills=[],
            interests=[],
            field="Photography"
        )
        user2 = create_mock_user(
            user_id="507f1f77bcf86cd799439012",
            skills=[],
            interests=[],
            field="Photography Editing"
        )
        
        score = calculate_compatibility(user1, user2)
        assert score == 10, f"Expected 10 (partial field match), got {score}"
    
    def test_empty_attributes(self):
        """Test compatibility calculation handles empty attributes gracefully"""
        user1 = create_mock_user(skills=[], interests=[], field="")
        user2 = create_mock_user(
            user_id="507f1f77bcf86cd799439012",
            skills=[], interests=[], field=""
        )
        
        score = calculate_compatibility(user1, user2)
        assert score == 0, f"Expected 0 for empty attributes, got {score}"
    
    def test_case_insensitive_field(self):
        """Test field matching is case-insensitive"""
        user1 = create_mock_user(field="photography")
        user2 = create_mock_user(
            user_id="507f1f77bcf86cd799439012",
            field="PHOTOGRAPHY"
        )
        
        score = calculate_compatibility(user1, user2)
        assert score >= 20, f"Case-insensitive field match should work, got {score}"
    
    def test_score_range(self):
        """Test that scores are always within 0-100 range"""
        for i in range(10):
            user1 = create_mock_user(
                skills=["Skill1", "Skill2", "Skill3"],
                interests=["Int1", "Int2", "Int3"]
            )
            user2 = create_mock_user(
                user_id=f"507f1f77bcf86cd79943901{i}",
                skills=["Skill2", "Skill4"] if i % 2 == 0 else [],
                interests=["Int2", "Int4"] if i % 3 == 0 else []
            )
            
            score = calculate_compatibility(user1, user2)
            assert 0 <= score <= 100, f"Score {score} out of range"


# ===== ENDPOINT TESTS =====

class TestDiscoverOnlineEndpoint:
    """Test suite for /discover/online endpoint"""
    
    @pytest.fixture
    def mock_current_user(self):
        """Fixture for authenticated user"""
        return create_mock_user(
            user_id="507f1f77bcf86cd799439000",
            name="Current User",
            skills=["Photography", "Editing"],
            interests=["Travel", "Art"]
        )
    
    @pytest.fixture
    def mock_online_users(self):
        """Fixture for online users"""
        return [
            create_mock_user(
                user_id="507f1f77bcf86cd799439001",
                name="User 1",
                skills=["Photography", "Editing"],
                interests=["Travel", "Art"],
                field="Photography"
            ),
            create_mock_user(
                user_id="507f1f77bcf86cd799439002",
                name="User 2",
                skills=["Design", "UI/UX"],
                interests=["Tech", "Startup"],
                field="Designer"
            ),
            create_mock_user(
                user_id="507f1f77bcf86cd799439003",
                name="User 3",
                skills=["Photography"],  # 1 common skill
                interests=["Travel"],  # 1 common interest
                field="Photography"
            ),
        ]
    
    @patch('app.routers.discovery_online.get_current_user')
    @patch('app.routers.discovery_online.db')
    def test_discover_online_success(self, mock_db, mock_auth, mock_current_user, mock_online_users):
        """Test successful discovery of online users"""
        # Setup mocks
        mock_auth.return_value = mock_current_user
        
        # Mock swipes collection (no swipes)
        mock_db.swipes.return_value.find.return_value = AsyncMock()
        mock_db.swipes.return_value.find.return_value.__aiter__.return_value = []
        
        # Mock users collection
        mock_db.users.return_value.find.return_value.limit.return_value = AsyncMock()
        mock_db.users.return_value.find.return_value.limit.return_value.__aiter__.return_value = mock_online_users
        
        # Make request
        response = client.get("/discover/online?limit=20")
        
        # Assertions
        assert response.status_code == 200
        data = response.json()
        assert "users" in data
        assert "count" in data
        assert isinstance(data["users"], list)
        assert data["count"] == len(data["users"])
    
    @patch('app.routers.discovery_online.get_current_user')
    @patch('app.routers.discovery_online.db')
    def test_discover_with_field_filter(self, mock_db, mock_auth, mock_current_user):
        """Test discovery with field filter"""
        mock_auth.return_value = mock_current_user
        
        # Mock empty swipes
        mock_db.swipes.return_value.find.return_value = AsyncMock()
        mock_db.swipes.return_value.find.return_value.__aiter__.return_value = []
        
        # Mock filtered users
        photography_users = [
            create_mock_user(
                user_id="507f1f77bcf86cd799439001",
                field="Photography"
            )
        ]
        mock_db.users.return_value.find.return_value.limit.return_value = AsyncMock()
        mock_db.users.return_value.find.return_value.limit.return_value.__aiter__.return_value = photography_users
        
        response = client.get("/discover/online?field=Photography")
        
        assert response.status_code == 200
        data = response.json()
        assert data["field_filter"] == "Photography"
    
    @patch('app.routers.discovery_online.get_current_user')
    @patch('app.routers.discovery_online.db')
    def test_discover_excludes_swiped_users(self, mock_db, mock_auth, mock_current_user):
        """Test that already swiped users are excluded"""
        mock_auth.return_value = mock_current_user
        
        # Mock swipes (user already swiped user 001)
        swiped_user = {"swipedUserId": ObjectId("507f1f77bcf86cd799439001")}
        mock_db.swipes.return_value.find.return_value = AsyncMock()
        mock_db.swipes.return_value.find.return_value.__aiter__.return_value = [swiped_user]
        
        # Mock users (only user 002 should be returned)
        available_users = [
            create_mock_user(user_id="507f1f77bcf86cd799439002")
        ]
        mock_db.users.return_value.find.return_value.limit.return_value = AsyncMock()
        mock_db.users.return_value.find.return_value.limit.return_value.__aiter__.return_value = available_users
        
        response = client.get("/discover/online")
        
        assert response.status_code == 200
        data = response.json()
        # Verify swiped user is not in results
        user_ids = [user["id"] for user in data["users"]]
        assert "507f1f77bcf86cd799439001" not in user_ids
    
    @patch('app.routers.discovery_online.get_current_user')
    def test_discover_requires_authentication(self, mock_auth):
        """Test that endpoint requires authentication"""
        mock_auth.side_effect = Exception("Unauthorized")
        
        response = client.get("/discover/online")
        
        assert response.status_code != 200  # Should fail without auth
    
    @patch('app.routers.discovery_online.get_current_user')
    @patch('app.routers.discovery_online.db')
    def test_discover_limit_parameter(self, mock_db, mock_auth, mock_current_user, mock_online_users):
        """Test that limit parameter is respected"""
        mock_auth.return_value = mock_current_user
        
        # Mock empty swipes
        mock_db.swipes.return_value.find.return_value = AsyncMock()
        mock_db.swipes.return_value.find.return_value.__aiter__.return_value = []
        
        # Mock many users
        many_users = [
            create_mock_user(user_id=f"507f1f77bcf86cd79943900{i}")
            for i in range(50)
        ]
        mock_db.users.return_value.find.return_value.limit.return_value = AsyncMock()
        mock_db.users.return_value.find.return_value.limit.return_value.__aiter__.return_value = many_users
        
        # Request with limit=5
        response = client.get("/discover/online?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["users"]) <= 5
    
    @patch('app.routers.discovery_online.get_current_user')
    @patch('app.routers.discovery_online.db')
    def test_discover_compatibility_sorting(self, mock_db, mock_auth, mock_current_user):
        """Test that results are sorted by compatibility"""
        mock_auth.return_value = mock_current_user
        
        # Mock empty swipes
        mock_db.swipes.return_value.find.return_value = AsyncMock()
        mock_db.swipes.return_value.find.return_value.__aiter__.return_value = []
        
        # Mock users with varying compatibility
        users = [
            # High compatibility (same skills/interests)
            create_mock_user(
                user_id="507f1f77bcf86cd799439001",
                name="High Match",
                skills=["Photography", "Editing"],
                interests=["Travel", "Art"],
                field="Photography"
            ),
            # Low compatibility (different everything)
            create_mock_user(
                user_id="507f1f77bcf86cd799439002",
                name="Low Match",
                skills=["Coding"],
                interests=["Gaming"],
                field="Developer"
            ),
        ]
        mock_db.users.return_value.find.return_value.limit.return_value = AsyncMock()
        mock_db.users.return_value.find.return_value.limit.return_value.__aiter__.return_value = users
        
        response = client.get("/discover/online")
        
        assert response.status_code == 200
        data = response.json()
        
        # First user should have higher compatibility
        if len(data["users"]) >= 2:
            assert data["users"][0]["compatibility"] >= data["users"][1]["compatibility"]


# ===== STATS ENDPOINT TESTS =====

class TestDiscoveryStats:
    """Test suite for /discover/stats endpoint"""
    
    @pytest.fixture
    def mock_current_user(self):
        return create_mock_user()
    
    @patch('app.routers.discovery_online.get_current_user')
    @patch('app.routers.discovery_online.db')
    def test_stats_success(self, mock_db, mock_auth, mock_current_user):
        """Test successful stats retrieval"""
        mock_auth.return_value = mock_current_user
        
        # Mock count
        mock_db.users.return_value.count_documents = AsyncMock(return_value=10)
        
        # Mock aggregate (field breakdown)
        field_breakdown = [
            {"_id": "Photography", "count": 5},
            {"_id": "Design", "count": 3},
            {"_id": "Developer", "count": 2}
        ]
        mock_db.users.return_value.aggregate.return_value = AsyncMock()
        mock_db.users.return_value.aggregate.return_value.__aiter__.return_value = field_breakdown
        
        # Mock sample users
        sample_users = [create_mock_user(user_id=f"507f1f77bcf86cd79943900{i}") for i in range(5)]
        mock_db.users.return_value.find.return_value.limit.return_value = AsyncMock()
        mock_db.users.return_value.find.return_value.limit.return_value.__aiter__.return_value = sample_users
        
        response = client.get("/discover/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_online" in data
        assert "by_field" in data
        assert "avg_compatibility" in data
        assert "timestamp" in data


# ===== UTILITY FUNCTION TESTS =====

class TestUtilityFunctions:
    """Test suite for utility functions"""
    
    def test_format_user_response(self):
        """Test user formatting function"""
        mock_user = create_mock_user()
        compatibility = 85
        
        formatted = format_user_response(mock_user, compatibility)
        
        assert formatted.id == str(mock_user['_id'])
        assert formatted.name == mock_user['name']
        assert formatted.age == mock_user['age']
        assert formatted.compatibility == compatibility
        assert 0 <= formatted.compatibility <= 100


# ===== INTEGRATION TESTS =====

class TestIntegration:
    """Integration tests with real-like scenarios"""
    
    def test_full_discovery_flow(self):
        """Test complete discovery flow from request to response"""
        # This would be an integration test with real database
        # For now, we test the logic flow
        
        current_user = create_mock_user(
            skills=["Photography", "Editing"],
            interests=["Travel", "Art"],
            field="Photography"
        )
        
        target_users = [
            create_mock_user(
                user_id="507f1f77bcf86cd799439001",
                skills=["Photography", "Editing"],
                interests=["Travel", "Art"],
                field="Photography"
            ),
            create_mock_user(
                user_id="507f1f77bcf86cd799439002",
                skills=["Design"],
                interests=["Tech"],
                field="Designer"
            ),
        ]
        
        # Calculate compatibility for each
        scores = [
            calculate_compatibility(current_user, user)
            for user in target_users
        ]
        
        # Verify first user has higher compatibility
        assert scores[0] > scores[1]
        assert all(0 <= score <= 100 for score in scores)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

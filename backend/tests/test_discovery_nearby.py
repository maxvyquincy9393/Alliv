"""
Comprehensive test suite for Discovery Nearby endpoint
Tests geospatial queries, Haversine distance calculation, and compatibility scoring
"""
import pytest
import math
from datetime import datetime, timedelta
from httpx import AsyncClient
from app.main import app
from app.db import get_db


# ===== TEST DATA =====

# Known locations with real-world distances
JAKARTA_CENTER = {"lat": -6.2088, "lon": 106.8456, "city": "Jakarta"}  # Monas
JAKARTA_SOUTH = {"lat": -6.2615, "lon": 106.8294, "city": "South Jakarta"}  # ~6km
BANDUNG = {"lat": -6.9175, "lon": 107.6191, "city": "Bandung"}  # ~120km
SURABAYA = {"lat": -7.2575, "lon": 112.7521, "city": "Surabaya"}  # ~660km
NEW_YORK = {"lat": 40.7128, "lon": -74.0060, "city": "New York"}  # ~16,000km


def create_geojson_location(lat: float, lon: float, city: str) -> dict:
    """Create GeoJSON location object"""
    return {
        "type": "Point",
        "coordinates": [lon, lat],  # GeoJSON uses [longitude, latitude]
        "city": city
    }


# ===== HAVERSINE DISTANCE TESTS =====

class TestHaversineCalculation:
    """Test accuracy of Haversine distance formula"""
    
    def test_haversine_same_location(self):
        """Distance between same coordinates should be 0"""
        from app.routers.discovery_nearby import calculate_distance_km
        
        distance = calculate_distance_km(
            JAKARTA_CENTER["lat"], JAKARTA_CENTER["lon"],
            JAKARTA_CENTER["lat"], JAKARTA_CENTER["lon"]
        )
        
        assert distance == 0.0
    
    def test_haversine_short_distance(self):
        """Test short distance (~6km) - Jakarta center to South Jakarta"""
        from app.routers.discovery_nearby import calculate_distance_km
        
        distance = calculate_distance_km(
            JAKARTA_CENTER["lat"], JAKARTA_CENTER["lon"],
            JAKARTA_SOUTH["lat"], JAKARTA_SOUTH["lon"]
        )
        
        # Should be around 5-7 km
        assert 5.0 <= distance <= 7.0
        assert isinstance(distance, float)
        # Check rounding to 2 decimals
        assert distance == round(distance, 2)
    
    def test_haversine_medium_distance(self):
        """Test medium distance (~120km) - Jakarta to Bandung"""
        from app.routers.discovery_nearby import calculate_distance_km
        
        distance = calculate_distance_km(
            JAKARTA_CENTER["lat"], JAKARTA_CENTER["lon"],
            BANDUNG["lat"], BANDUNG["lon"]
        )
        
        # Should be around 115-125 km
        assert 115.0 <= distance <= 125.0
    
    def test_haversine_long_distance(self):
        """Test long distance (~660km) - Jakarta to Surabaya"""
        from app.routers.discovery_nearby import calculate_distance_km
        
        distance = calculate_distance_km(
            JAKARTA_CENTER["lat"], JAKARTA_CENTER["lon"],
            SURABAYA["lat"], SURABAYA["lon"]
        )
        
        # Should be around 650-670 km
        assert 650.0 <= distance <= 670.0
    
    def test_haversine_antipodes(self):
        """Test very long distance (~16,000km) - Jakarta to New York"""
        from app.routers.discovery_nearby import calculate_distance_km
        
        distance = calculate_distance_km(
            JAKARTA_CENTER["lat"], JAKARTA_CENTER["lon"],
            NEW_YORK["lat"], NEW_YORK["lon"]
        )
        
        # Should be around 15,500-16,500 km
        assert 15500.0 <= distance <= 16500.0
    
    def test_haversine_equator_crossing(self):
        """Test distance crossing equator"""
        from app.routers.discovery_nearby import calculate_distance_km
        
        # Point just north of equator
        north = {"lat": 1.0, "lon": 100.0}
        # Point just south of equator
        south = {"lat": -1.0, "lon": 100.0}
        
        distance = calculate_distance_km(
            north["lat"], north["lon"],
            south["lat"], south["lon"]
        )
        
        # ~222 km (2 degrees * 111 km/degree)
        assert 220.0 <= distance <= 225.0
    
    def test_haversine_prime_meridian_crossing(self):
        """Test distance crossing prime meridian (0° longitude)"""
        from app.routers.discovery_nearby import calculate_distance_km
        
        # Point west of prime meridian
        west = {"lat": 51.5074, "lon": -0.1278}  # London
        # Point east of prime meridian
        east = {"lat": 48.8566, "lon": 2.3522}   # Paris
        
        distance = calculate_distance_km(
            west["lat"], west["lon"],
            east["lat"], east["lon"]
        )
        
        # Should be around 340-350 km
        assert 340.0 <= distance <= 350.0


# ===== COORDINATE VALIDATION TESTS =====

class TestCoordinateValidation:
    """Test coordinate validation logic"""
    
    def test_valid_coordinates(self):
        """Test valid latitude and longitude"""
        from app.routers.discovery_nearby import validate_coordinates
        
        # Jakarta
        assert validate_coordinates(-6.2088, 106.8456) is True
        
        # North Pole
        assert validate_coordinates(90.0, 0.0) is True
        
        # South Pole
        assert validate_coordinates(-90.0, 0.0) is True
        
        # Prime Meridian
        assert validate_coordinates(0.0, 0.0) is True
        
        # International Date Line
        assert validate_coordinates(0.0, 180.0) is True
        assert validate_coordinates(0.0, -180.0) is True
    
    def test_invalid_latitude(self):
        """Test invalid latitude values"""
        from app.routers.discovery_nearby import validate_coordinates
        
        # Latitude too high
        assert validate_coordinates(91.0, 100.0) is False
        assert validate_coordinates(100.0, 100.0) is False
        
        # Latitude too low
        assert validate_coordinates(-91.0, 100.0) is False
        assert validate_coordinates(-100.0, 100.0) is False
    
    def test_invalid_longitude(self):
        """Test invalid longitude values"""
        from app.routers.discovery_nearby import validate_coordinates
        
        # Longitude too high
        assert validate_coordinates(0.0, 181.0) is False
        assert validate_coordinates(0.0, 200.0) is False
        
        # Longitude too low
        assert validate_coordinates(0.0, -181.0) is False
        assert validate_coordinates(0.0, -200.0) is False


# ===== API ENDPOINT TESTS =====

@pytest.fixture
async def test_users():
    """Create test users with different locations"""
    db = get_db()
    users_collection = db.users()
    
    # Clear test users
    await users_collection.delete_many({"email": {"$regex": "^test_nearby_"}})
    
    # Create test users
    test_users_data = [
        {
            "email": "test_nearby_jakarta1@test.com",
            "hashed_password": "test",
            "name": "User Jakarta 1",
            "age": 25,
            "field": "Photography",
            "skills": ["Portrait", "Editing", "Studio"],
            "interests": ["Travel", "Art", "Nature"],
            "bio": "Jakarta photographer",
            "location": create_geojson_location(
                JAKARTA_CENTER["lat"], 
                JAKARTA_CENTER["lon"], 
                JAKARTA_CENTER["city"]
            ),
            "isOnline": True,
            "lastSeen": datetime.utcnow(),
            "avatar": "https://i.pravatar.cc/150?img=1",
            "photos": [],
            "createdAt": datetime.utcnow()
        },
        {
            "email": "test_nearby_jakarta2@test.com",
            "hashed_password": "test",
            "name": "User Jakarta 2",
            "age": 28,
            "field": "Photography",
            "skills": ["Portrait", "Wedding", "Event"],
            "interests": ["Travel", "Music", "Food"],
            "bio": "South Jakarta photographer",
            "location": create_geojson_location(
                JAKARTA_SOUTH["lat"], 
                JAKARTA_SOUTH["lon"], 
                JAKARTA_SOUTH["city"]
            ),
            "isOnline": True,
            "lastSeen": datetime.utcnow(),
            "avatar": "https://i.pravatar.cc/150?img=2",
            "photos": [],
            "createdAt": datetime.utcnow()
        },
        {
            "email": "test_nearby_bandung@test.com",
            "hashed_password": "test",
            "name": "User Bandung",
            "age": 26,
            "field": "Design",
            "skills": ["UI/UX", "Branding"],
            "interests": ["Tech", "Art"],
            "bio": "Bandung designer",
            "location": create_geojson_location(
                BANDUNG["lat"], 
                BANDUNG["lon"], 
                BANDUNG["city"]
            ),
            "isOnline": True,
            "lastSeen": datetime.utcnow(),
            "avatar": "https://i.pravatar.cc/150?img=3",
            "photos": [],
            "createdAt": datetime.utcnow()
        },
        {
            "email": "test_nearby_surabaya@test.com",
            "hashed_password": "test",
            "name": "User Surabaya",
            "age": 30,
            "field": "Photography",
            "skills": ["Commercial", "Product"],
            "interests": ["Business", "Travel"],
            "bio": "Surabaya photographer",
            "location": create_geojson_location(
                SURABAYA["lat"], 
                SURABAYA["lon"], 
                SURABAYA["city"]
            ),
            "isOnline": False,
            "lastSeen": datetime.utcnow() - timedelta(days=1),
            "avatar": "https://i.pravatar.cc/150?img=4",
            "photos": [],
            "createdAt": datetime.utcnow()
        }
    ]
    
    # Insert users
    result = await users_collection.insert_many(test_users_data)
    user_ids = [str(uid) for uid in result.inserted_ids]
    
    # Return user IDs
    yield {
        "jakarta1": user_ids[0],
        "jakarta2": user_ids[1],
        "bandung": user_ids[2],
        "surabaya": user_ids[3]
    }
    
    # Cleanup
    await users_collection.delete_many({"email": {"$regex": "^test_nearby_"}})


@pytest.mark.asyncio
class TestNearbyEndpoint:
    """Test /discover/nearby endpoint"""
    
    async def test_nearby_success_small_radius(self, test_users):
        """Test finding users within small radius (10km)"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Mock authentication (use jakarta1 user)
            # TODO: Replace with actual JWT token
            
            response = await client.get(
                "/discover/nearby",
                params={
                    "lat": JAKARTA_CENTER["lat"],
                    "lon": JAKARTA_CENTER["lon"],
                    "radius_km": 10.0,
                    "limit": 20
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Should find jakarta2 (~6km away)
            assert data["total"] >= 1
            assert len(data["users"]) >= 1
            
            # Check first user has distance field
            user = data["users"][0]
            assert "distance" in user
            assert user["distance"] <= 10.0
            
            # Check compatibility field
            assert "compatibility" in user
            assert 0 <= user["compatibility"] <= 100
            
            # Should NOT find bandung or surabaya (too far)
            user_names = [u["name"] for u in data["users"]]
            assert "User Bandung" not in user_names
            assert "User Surabaya" not in user_names
    
    async def test_nearby_success_medium_radius(self, test_users):
        """Test finding users within medium radius (150km)"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/discover/nearby",
                params={
                    "lat": JAKARTA_CENTER["lat"],
                    "lon": JAKARTA_CENTER["lon"],
                    "radius_km": 150.0,
                    "limit": 20
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Should find jakarta2 and bandung
            assert data["total"] >= 2
            
            # Should NOT find surabaya (too far)
            user_names = [u["name"] for u in data["users"]]
            assert "User Surabaya" not in user_names
    
    async def test_nearby_sorted_by_distance(self, test_users):
        """Test users are sorted by distance (closest first)"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/discover/nearby",
                params={
                    "lat": JAKARTA_CENTER["lat"],
                    "lon": JAKARTA_CENTER["lon"],
                    "radius_km": 200.0,
                    "limit": 20
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Check distances are sorted (ascending)
            distances = [u["distance"] for u in data["users"]]
            assert distances == sorted(distances)
            
            # First user should be closest (jakarta2 ~6km)
            if len(data["users"]) > 0:
                assert data["users"][0]["distance"] < 10.0
    
    async def test_nearby_field_filter(self, test_users):
        """Test filtering by field"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/discover/nearby",
                params={
                    "lat": JAKARTA_CENTER["lat"],
                    "lon": JAKARTA_CENTER["lon"],
                    "radius_km": 200.0,
                    "field": "Photography",
                    "limit": 20
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # All users should be in Photography field
            for user in data["users"]:
                assert user["field"] == "Photography"
            
            # Should NOT include bandung user (Design field)
            user_names = [u["name"] for u in data["users"]]
            assert "User Bandung" not in user_names
    
    async def test_nearby_invalid_coordinates(self, test_users):
        """Test error handling for invalid coordinates"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Invalid latitude
            response = await client.get(
                "/discover/nearby",
                params={
                    "lat": 100.0,  # Invalid (>90)
                    "lon": 106.8456,
                    "radius_km": 10.0
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            assert response.status_code == 400
            
            # Invalid longitude
            response = await client.get(
                "/discover/nearby",
                params={
                    "lat": -6.2088,
                    "lon": 200.0,  # Invalid (>180)
                    "radius_km": 10.0
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            assert response.status_code == 400
    
    async def test_nearby_invalid_radius(self, test_users):
        """Test error handling for invalid radius"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            # Radius too small
            response = await client.get(
                "/discover/nearby",
                params={
                    "lat": JAKARTA_CENTER["lat"],
                    "lon": JAKARTA_CENTER["lon"],
                    "radius_km": 0.05  # Min is 0.1
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            assert response.status_code == 422
            
            # Radius too large
            response = await client.get(
                "/discover/nearby",
                params={
                    "lat": JAKARTA_CENTER["lat"],
                    "lon": JAKARTA_CENTER["lon"],
                    "radius_km": 150.0  # Max is 100
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            assert response.status_code == 422
    
    async def test_nearby_excludes_swiped_users(self, test_users):
        """Test that swiped users are excluded from results"""
        db = get_db()
        swipes_collection = db.swipes()
        
        # Create swipe record (jakarta1 swiped jakarta2)
        await swipes_collection.insert_one({
            "user_id": test_users["jakarta1"],
            "target_user_id": test_users["jakarta2"],
            "action": "like",
            "created_at": datetime.utcnow()
        })
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/discover/nearby",
                params={
                    "lat": JAKARTA_CENTER["lat"],
                    "lon": JAKARTA_CENTER["lon"],
                    "radius_km": 10.0,
                    "limit": 20
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # jakarta2 should NOT be in results (already swiped)
            user_ids = [u["id"] for u in data["users"]]
            assert test_users["jakarta2"] not in user_ids
        
        # Cleanup
        await swipes_collection.delete_one({
            "user_id": test_users["jakarta1"],
            "target_user_id": test_users["jakarta2"]
        })
    
    async def test_nearby_limit(self, test_users):
        """Test limit parameter"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/discover/nearby",
                params={
                    "lat": JAKARTA_CENTER["lat"],
                    "lon": JAKARTA_CENTER["lon"],
                    "radius_km": 1000.0,
                    "limit": 2
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Should return max 2 users
            assert len(data["users"]) <= 2
    
    async def test_nearby_response_format(self, test_users):
        """Test response format matches schema"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/discover/nearby",
                params={
                    "lat": JAKARTA_CENTER["lat"],
                    "lon": JAKARTA_CENTER["lon"],
                    "radius_km": 200.0,
                    "limit": 20
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Check response structure
            assert "users" in data
            assert "total" in data
            assert "search_center" in data
            assert "radius_km" in data
            
            # Check search_center
            assert data["search_center"]["lat"] == JAKARTA_CENTER["lat"]
            assert data["search_center"]["lon"] == JAKARTA_CENTER["lon"]
            assert data["radius_km"] == 200.0
            
            # Check user object structure
            if len(data["users"]) > 0:
                user = data["users"][0]
                required_fields = [
                    "id", "name", "age", "field", "skills", "interests",
                    "bio", "location", "avatar", "distance", "compatibility"
                ]
                for field in required_fields:
                    assert field in user


# ===== STATS ENDPOINT TESTS =====

@pytest.mark.asyncio
class TestNearbyStatsEndpoint:
    """Test /discover/nearby/stats endpoint"""
    
    async def test_stats_success(self, test_users):
        """Test stats endpoint returns correct data"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/discover/nearby/stats",
                params={
                    "lat": JAKARTA_CENTER["lat"],
                    "lon": JAKARTA_CENTER["lon"],
                    "radius_km": 200.0
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # Check response structure
            assert "total_nearby" in data
            assert "by_distance" in data
            assert "by_field" in data
            assert "avg_distance" in data
            
            # Check distance breakdown
            assert isinstance(data["by_distance"], dict)
            assert "0-1km" in data["by_distance"]
            assert "1-5km" in data["by_distance"]
            assert "5-10km" in data["by_distance"]
            
            # Check field breakdown
            assert isinstance(data["by_field"], dict)
            
            # Check avg_distance
            if data["total_nearby"] > 0:
                assert data["avg_distance"] > 0
    
    async def test_stats_field_filter(self, test_users):
        """Test stats with field filter"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            response = await client.get(
                "/discover/nearby/stats",
                params={
                    "lat": JAKARTA_CENTER["lat"],
                    "lon": JAKARTA_CENTER["lon"],
                    "radius_km": 200.0,
                    "field": "Photography"
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            
            assert response.status_code == 200
            data = response.json()
            
            # All users should be Photography field
            if "Photography" in data["by_field"]:
                # Only Photography field should have count
                assert len(data["by_field"]) == 1 or data["by_field"]["Photography"] == data["total_nearby"]


# ===== PERFORMANCE TESTS =====

@pytest.mark.asyncio
class TestNearbyPerformance:
    """Test performance of nearby endpoint"""
    
    async def test_query_performance(self, test_users):
        """Test query completes within performance target (<100ms)"""
        import time
        
        async with AsyncClient(app=app, base_url="http://test") as client:
            start_time = time.time()
            
            response = await client.get(
                "/discover/nearby",
                params={
                    "lat": JAKARTA_CENTER["lat"],
                    "lon": JAKARTA_CENTER["lon"],
                    "radius_km": 50.0,
                    "limit": 20
                },
                headers={"Authorization": f"Bearer {test_users['jakarta1']}"}
            )
            
            duration_ms = (time.time() - start_time) * 1000
            
            assert response.status_code == 200
            
            # Should complete within 100ms (including network overhead)
            # Note: May be slower in test environment
            assert duration_ms < 500  # Relaxed for test environment
            
            print(f"\n✅ Query completed in {duration_ms:.2f}ms")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])

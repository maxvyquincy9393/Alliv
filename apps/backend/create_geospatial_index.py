"""
Geospatial Index Migration for Discovery Nearby
Creates 2dsphere index for location-based queries
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# MongoDB connection
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "colabmatch"


async def create_geospatial_index():
    """
    Create 2dsphere geospatial index for location-based queries
    
    Index created:
    - users.location.coordinates (2dsphere) - For $geoNear queries
    
    Requirements:
    - location.coordinates must be in GeoJSON format: [longitude, latitude]
    - Data must follow GeoJSON Point structure
    """
    print("🔗 Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print(f"\n📊 Creating geospatial index for database: {DATABASE_NAME}\n")
        
        # ===== STEP 1: CHECK EXISTING DATA FORMAT =====
        
        print("1️⃣  Checking existing user location format...")
        sample_user = await db.users.find_one({"location": {"$exists": True}})
        
        if sample_user:
            location = sample_user.get('location', {})
            print(f"   Sample location data: {location}")
            
            # Check if already in GeoJSON format
            if 'coordinates' in location and location.get('type') == 'Point':
                print("   ✅ Data already in GeoJSON format")
            else:
                print("   ⚠️  Data needs migration to GeoJSON format")
                print("   Current format: {lat: X, lon: Y, city: Z}")
                print("   Required format: {type: 'Point', coordinates: [lon, lat], city: Z}")
        else:
            print("   ℹ️  No users with location data yet")
        
        # ===== STEP 2: MIGRATE EXISTING DATA TO GEOJSON =====
        
        print("\n2️⃣  Migrating location data to GeoJSON format...")
        
        # Find all users with old location format
        users_to_migrate = await db.users.count_documents({
            "location.lat": {"$exists": True},
            "location.coordinates": {"$exists": False}
        })
        
        if users_to_migrate > 0:
            print(f"   Found {users_to_migrate} users to migrate...")
            
            # Update each user's location to GeoJSON format
            update_result = await db.users.update_many(
                {
                    "location.lat": {"$exists": True},
                    "location.coordinates": {"$exists": False}
                },
                [
                    {
                        "$set": {
                            "location": {
                                "type": "Point",
                                "coordinates": ["$location.lon", "$location.lat"],
                                "city": "$location.city"
                            }
                        }
                    }
                ]
            )
            
            print(f"   ✅ Migrated {update_result.modified_count} users to GeoJSON format")
        else:
            print("   ✅ No migration needed - data already in correct format")
        
        # ===== STEP 3: CREATE GEOSPATIAL INDEX =====
        
        print("\n3️⃣  Creating 2dsphere geospatial index...")
        
        try:
            result = await db.users.create_index(
                [("location.coordinates", "2dsphere")],
                name="idx_location_2dsphere",
                background=True
            )
            print(f"   ✅ Created: {result}")
            
        except Exception as e:
            if "already exists" in str(e):
                print("   ℹ️  Index already exists")
            else:
                raise
        
        # ===== STEP 4: CREATE ADDITIONAL LOCATION INDEXES =====
        
        print("\n4️⃣  Creating additional location indexes...")
        
        # Index for legacy lat/lon queries (fallback)
        try:
            result = await db.users.create_index(
                [("location.lat", 1), ("location.lon", 1)],
                name="idx_location_lat_lon",
                background=True
            )
            print(f"   ✅ Created lat/lon index: {result}")
        except Exception as e:
            if "already exists" in str(e):
                print("   ℹ️  Lat/lon index already exists")
            else:
                print(f"   ⚠️  Could not create lat/lon index: {e}")
        
        # ===== STEP 5: VERIFY INDEX =====
        
        print("\n5️⃣  Verifying geospatial index...")
        
        indexes = []
        async for index in db.users.list_indexes():
            indexes.append(index)
        
        geo_index_found = False
        for index in indexes:
            if 'location.coordinates' in str(index.get('key', {})):
                print(f"   ✅ Found: {index['name']}")
                print(f"      Type: {index.get('key', {})}")
                geo_index_found = True
        
        if not geo_index_found:
            print("   ❌ Geospatial index not found!")
            return False
        
        # ===== STEP 6: TEST GEOSPATIAL QUERY =====
        
        print("\n6️⃣  Testing geospatial query...")
        
        try:
            # Test $geoNear aggregation
            pipeline = [
                {
                    "$geoNear": {
                        "near": {
                            "type": "Point",
                            "coordinates": [106.8456, -6.2088]  # Jakarta coords
                        },
                        "distanceField": "distance",
                        "maxDistance": 10000,  # 10km in meters
                        "spherical": True,
                        "key": "location.coordinates"
                    }
                },
                {"$limit": 1}
            ]
            
            test_results = []
            async for doc in db.users.aggregate(pipeline):
                test_results.append(doc)
            
            if test_results:
                print(f"   ✅ Geospatial query works! Found {len(test_results)} users")
                print(f"      Sample distance: {test_results[0].get('distance', 0):.2f} meters")
            else:
                print("   ℹ️  No users found in test area (this is OK if database is empty)")
            
        except Exception as e:
            print(f"   ⚠️  Test query failed: {e}")
            print("   This may indicate the index is not ready yet")
        
        # ===== STEP 7: SUMMARY =====
        
        print("\n\n" + "="*60)
        print("✅ GEOSPATIAL INDEX MIGRATION COMPLETE")
        print("="*60)
        print(f"  Timestamp: {datetime.utcnow()}")
        print(f"  Database: {DATABASE_NAME}")
        print(f"  Migrated users: {users_to_migrate}")
        print(f"  Index created: idx_location_2dsphere")
        print(f"  Query type: $geoNear with 2dsphere")
        print("="*60)
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error creating geospatial index: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        client.close()
        print("\n🔌 Disconnected from MongoDB\n")


async def drop_geospatial_index():
    """
    Drop geospatial index (for rollback)
    """
    print("🔗 Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print(f"\n🗑️  Dropping geospatial index from database: {DATABASE_NAME}\n")
        
        try:
            await db.users.drop_index("idx_location_2dsphere")
            print("  ✅ Dropped: idx_location_2dsphere")
        except Exception as e:
            print(f"  ⚠️  Could not drop idx_location_2dsphere: {e}")
        
        try:
            await db.users.drop_index("idx_location_lat_lon")
            print("  ✅ Dropped: idx_location_lat_lon")
        except Exception as e:
            print(f"  ⚠️  Could not drop idx_location_lat_lon: {e}")
        
        print("\n✅ Rollback complete!")
        
    finally:
        client.close()
        print("\n🔌 Disconnected from MongoDB\n")


async def verify_geospatial_index():
    """
    Verify geospatial index exists and is usable
    """
    print("🔗 Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print(f"\n🔍 Verifying geospatial index in database: {DATABASE_NAME}\n")
        
        # Check if index exists
        indexes = []
        async for index in db.users.list_indexes():
            indexes.append(index)
        
        geo_index_found = False
        for index in indexes:
            name = index.get('name', '')
            if 'location' in name:
                key = index.get('key', {})
                print(f"  ✅ {name}: {key}")
                if 'location.coordinates' in str(key):
                    geo_index_found = True
        
        if not geo_index_found:
            print("\n  ❌ Geospatial index MISSING!")
            print("  Run: python create_geospatial_index.py create")
            return False
        
        # Test query
        print("\n  Testing geospatial query...")
        try:
            pipeline = [
                {
                    "$geoNear": {
                        "near": {
                            "type": "Point",
                            "coordinates": [106.8456, -6.2088]
                        },
                        "distanceField": "distance",
                        "maxDistance": 10000,
                        "spherical": True,
                        "key": "location.coordinates"
                    }
                },
                {"$limit": 1}
            ]
            
            count = 0
            async for _ in db.users.aggregate(pipeline):
                count += 1
            
            print(f"  ✅ Geospatial query works! ({count} results)")
            return True
            
        except Exception as e:
            print(f"  ❌ Geospatial query failed: {e}")
            return False
        
    finally:
        client.close()
        print("\n🔌 Disconnected from MongoDB\n")


async def migrate_sample_data():
    """
    Add sample users with GeoJSON locations for testing
    """
    print("🔗 Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print(f"\n📝 Adding sample users with locations...\n")
        
        sample_users = [
            {
                "email": "user1@jakarta.com",
                "name": "Alice Jakarta",
                "age": 25,
                "field": "Photography",
                "skills": ["Portrait", "Editing"],
                "interests": ["Travel", "Art"],
                "bio": "Jakarta photographer",
                "location": {
                    "type": "Point",
                    "coordinates": [106.8456, -6.2088],  # Jakarta
                    "city": "Jakarta"
                },
                "isOnline": True,
                "lastSeen": datetime.utcnow(),
                "avatar": "https://i.pravatar.cc/150?img=1",
                "photos": []
            },
            {
                "email": "user2@bandung.com",
                "name": "Bob Bandung",
                "age": 28,
                "field": "Design",
                "skills": ["UI/UX", "Figma"],
                "interests": ["Tech", "Art"],
                "bio": "Bandung designer",
                "location": {
                    "type": "Point",
                    "coordinates": [107.6191, -6.9175],  # Bandung (~120km from Jakarta)
                    "city": "Bandung"
                },
                "isOnline": True,
                "lastSeen": datetime.utcnow(),
                "avatar": "https://i.pravatar.cc/150?img=2",
                "photos": []
            },
            {
                "email": "user3@jakarta-south.com",
                "name": "Charlie South Jakarta",
                "age": 26,
                "field": "Photography",
                "skills": ["Portrait", "Studio"],
                "interests": ["Travel", "Nature"],
                "bio": "South Jakarta photographer",
                "location": {
                    "type": "Point",
                    "coordinates": [106.8294, -6.2615],  # South Jakarta (~5km)
                    "city": "Jakarta"
                },
                "isOnline": True,
                "lastSeen": datetime.utcnow(),
                "avatar": "https://i.pravatar.cc/150?img=3",
                "photos": []
            }
        ]
        
        # Insert only if not exists
        for user in sample_users:
            existing = await db.users.find_one({"email": user["email"]})
            if not existing:
                await db.users.insert_one(user)
                print(f"  ✅ Created: {user['name']} at {user['location']['city']}")
            else:
                print(f"  ℹ️  Already exists: {user['name']}")
        
        print("\n✅ Sample data ready for testing!")
        
    finally:
        client.close()
        print("\n🔌 Disconnected from MongoDB\n")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Manage geospatial index for Discovery Nearby")
    parser.add_argument(
        "action",
        choices=["create", "drop", "verify", "sample"],
        help="Action: create (add index), drop (remove), verify (check), sample (add test data)"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("  DISCOVERY NEARBY - GEOSPATIAL INDEX MIGRATION")
    print("=" * 60)
    
    if args.action == "create":
        result = asyncio.run(create_geospatial_index())
        sys.exit(0 if result else 1)
        
    elif args.action == "drop":
        confirm = input("\n⚠️  Drop geospatial index? (yes/no): ")
        if confirm.lower() == "yes":
            asyncio.run(drop_geospatial_index())
        else:
            print("❌ Aborted.")
            
    elif args.action == "verify":
        result = asyncio.run(verify_geospatial_index())
        sys.exit(0 if result else 1)
        
    elif args.action == "sample":
        asyncio.run(migrate_sample_data())

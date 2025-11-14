"""
Database Index Migration for Discovery Online
Creates optimized indexes for fast user discovery queries
"""
import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# MongoDB connection
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "colabmatch"


async def create_discovery_indexes():
    """
    Create indexes for Discovery Online endpoint
    
    Indexes created:
    1. users.isOnline - Fast filtering of online users
    2. users.field - Fast filtering by creative field
    3. users.lastSeen - Fast sorting by activity
    4. swipes.userId - Fast lookup of user's swipes
    """
    print("🔗 Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print(f"\n📊 Creating indexes for database: {DATABASE_NAME}\n")
        
        # ===== USERS COLLECTION INDEXES =====
        
        print("1️⃣  Creating index: users.isOnline")
        result = await db.users.create_index(
            [("isOnline", 1)],
            name="idx_isOnline",
            background=True
        )
        print(f"   ✅ Created: {result}")
        
        print("\n2️⃣  Creating index: users.field")
        result = await db.users.create_index(
            [("field", 1)],
            name="idx_field",
            background=True
        )
        print(f"   ✅ Created: {result}")
        
        print("\n3️⃣  Creating index: users.lastSeen")
        result = await db.users.create_index(
            [("lastSeen", -1)],  # Descending for recent first
            name="idx_lastSeen",
            background=True
        )
        print(f"   ✅ Created: {result}")
        
        print("\n4️⃣  Creating compound index: users.isOnline + field + lastSeen")
        result = await db.users.create_index(
            [
                ("isOnline", 1),
                ("field", 1),
                ("lastSeen", -1)
            ],
            name="idx_online_field_lastseen",
            background=True
        )
        print(f"   ✅ Created: {result}")
        
        # ===== SWIPES COLLECTION INDEXES =====
        
        print("\n5️⃣  Creating index: swipes.userId")
        result = await db.swipes.create_index(
            [("userId", 1)],
            name="idx_userId",
            background=True
        )
        print(f"   ✅ Created: {result}")
        
        print("\n6️⃣  Creating compound index: swipes.userId + swipedUserId")
        result = await db.swipes.create_index(
            [
                ("userId", 1),
                ("swipedUserId", 1)
            ],
            name="idx_userId_swipedUserId",
            unique=True,  # Prevent duplicate swipes
            background=True
        )
        print(f"   ✅ Created: {result}")
        
        # ===== LIST ALL INDEXES =====
        
        print("\n\n📋 Listing all indexes:")
        
        print("\n  Users Collection:")
        async for index in db.users.list_indexes():
            print(f"    - {index['name']}: {index.get('key', {})}")
        
        print("\n  Swipes Collection:")
        async for index in db.swipes.list_indexes():
            print(f"    - {index['name']}: {index.get('key', {})}")
        
        # ===== TEST INDEX PERFORMANCE =====
        
        print("\n\n🧪 Testing index performance...")
        
        # Test query with explain
        explain = await db.users.find(
            {
                "isOnline": True,
                "field": "Photography"
            }
        ).sort("lastSeen", -1).explain()
        
        winning_plan = explain.get('executionStats', {}).get('executionStages', {})
        index_name = winning_plan.get('indexName', 'COLLSCAN (no index)')
        
        print(f"\n  Query Plan: {winning_plan.get('stage', 'N/A')}")
        print(f"  Index Used: {index_name}")
        
        if 'COLLSCAN' in index_name or winning_plan.get('stage') == 'COLLSCAN':
            print("  ⚠️  WARNING: Query not using index! Check query structure.")
        else:
            print("  ✅ Query using index efficiently!")
        
        print("\n\n✅ Migration complete!")
        print(f"   Timestamp: {datetime.utcnow()}")
        print(f"   Database: {DATABASE_NAME}")
        print(f"   Total indexes created: 6")
        
    except Exception as e:
        print(f"\n❌ Error creating indexes: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
        
    finally:
        client.close()
        print("\n🔌 Disconnected from MongoDB\n")


async def drop_discovery_indexes():
    """
    Drop all discovery-related indexes (for rollback)
    """
    print("🔗 Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print(f"\n🗑️  Dropping discovery indexes from database: {DATABASE_NAME}\n")
        
        indexes_to_drop = [
            ("users", "idx_isOnline"),
            ("users", "idx_field"),
            ("users", "idx_lastSeen"),
            ("users", "idx_online_field_lastseen"),
            ("swipes", "idx_userId"),
            ("swipes", "idx_userId_swipedUserId"),
        ]
        
        for collection_name, index_name in indexes_to_drop:
            try:
                await db[collection_name].drop_index(index_name)
                print(f"  ✅ Dropped: {collection_name}.{index_name}")
            except Exception as e:
                print(f"  ⚠️  Could not drop {collection_name}.{index_name}: {e}")
        
        print("\n✅ Rollback complete!")
        
    except Exception as e:
        print(f"\n❌ Error dropping indexes: {e}")
        sys.exit(1)
        
    finally:
        client.close()
        print("\n🔌 Disconnected from MongoDB\n")


async def verify_indexes():
    """
    Verify all indexes exist and are usable
    """
    print("🔗 Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    try:
        print(f"\n🔍 Verifying indexes in database: {DATABASE_NAME}\n")
        
        required_indexes = {
            "users": [
                "idx_isOnline",
                "idx_field",
                "idx_lastSeen",
                "idx_online_field_lastseen"
            ],
            "swipes": [
                "idx_userId",
                "idx_userId_swipedUserId"
            ]
        }
        
        all_good = True
        
        for collection_name, expected_indexes in required_indexes.items():
            print(f"  {collection_name.upper()} Collection:")
            
            existing_indexes = []
            async for index in db[collection_name].list_indexes():
                existing_indexes.append(index['name'])
            
            for index_name in expected_indexes:
                if index_name in existing_indexes:
                    print(f"    ✅ {index_name}")
                else:
                    print(f"    ❌ {index_name} - MISSING!")
                    all_good = False
            
            print()
        
        if all_good:
            print("✅ All required indexes exist!")
        else:
            print("⚠️  Some indexes are missing. Run: python create_discovery_indexes.py")
        
        return all_good
        
    finally:
        client.close()
        print("🔌 Disconnected from MongoDB\n")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Manage Discovery Online database indexes")
    parser.add_argument(
        "action",
        choices=["create", "drop", "verify"],
        help="Action to perform: create (add indexes), drop (remove indexes), verify (check indexes)"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("  DISCOVERY ONLINE - DATABASE INDEX MIGRATION")
    print("=" * 60)
    
    if args.action == "create":
        asyncio.run(create_discovery_indexes())
    elif args.action == "drop":
        confirm = input("\n⚠️  Are you sure you want to DROP all discovery indexes? (yes/no): ")
        if confirm.lower() == "yes":
            asyncio.run(drop_discovery_indexes())
        else:
            print("❌ Aborted.")
    elif args.action == "verify":
        result = asyncio.run(verify_indexes())
        sys.exit(0 if result else 1)

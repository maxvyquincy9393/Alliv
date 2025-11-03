"""
Migration Script: Migrate 'likes' collection to 'swipes' collection
Converts old matching system data to new swipe-based system
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "colabmatch")

async def migrate_likes_to_swipes():
    """Migrate likes collection to swipes collection"""
    
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    print("🔄 Starting migration: likes → swipes")
    print(f"📊 Database: {DB_NAME}")
    
    # Check if likes collection exists
    collections = await db.list_collection_names()
    if "likes" not in collections:
        print("⚠️  'likes' collection not found - nothing to migrate")
        client.close()
        return
    
    # Count existing data
    likes_count = await db.likes.count_documents({})
    swipes_count = await db.swipes.count_documents({})
    
    print(f"📈 Existing likes: {likes_count}")
    print(f"📈 Existing swipes: {swipes_count}")
    
    if likes_count == 0:
        print("✅ No likes to migrate")
        client.close()
        return
    
    # Fetch all likes
    likes = await db.likes.find({}).to_list(length=None)
    
    migrated = 0
    skipped = 0
    errors = 0
    
    for like in likes:
        try:
            # Extract data
            from_id = like.get("from")
            to_id = like.get("to")
            created_at = like.get("created_at", datetime.utcnow())
            
            # Validate IDs
            if not from_id or not to_id:
                print(f"⚠️  Skipping like with missing IDs: {like.get('_id')}")
                skipped += 1
                continue
            
            # Convert string IDs to ObjectId if needed
            try:
                user_id = ObjectId(from_id) if isinstance(from_id, str) else from_id
                target_id = ObjectId(to_id) if isinstance(to_id, str) else to_id
            except Exception as e:
                print(f"⚠️  Invalid ID format in like {like.get('_id')}: {e}")
                skipped += 1
                continue
            
            # Check if swipe already exists
            existing = await db.swipes.find_one({
                "userId": user_id,
                "targetId": target_id
            })
            
            if existing:
                skipped += 1
                continue
            
            # Create swipe document with new schema
            swipe_doc = {
                "userId": user_id,
                "targetId": target_id,
                "action": "connect",  # Old likes are now "connect" swipes
                "createdAt": created_at,
                "migratedFrom": "likes"  # Track migration source
            }
            
            # Insert swipe
            await db.swipes.insert_one(swipe_doc)
            migrated += 1
            
            if migrated % 100 == 0:
                print(f"⏳ Migrated {migrated} likes...")
                
        except Exception as e:
            print(f"❌ Error migrating like {like.get('_id')}: {e}")
            errors += 1
    
    print(f"\n✅ Migration complete!")
    print(f"   Migrated: {migrated}")
    print(f"   Skipped: {skipped}")
    print(f"   Errors: {errors}")
    
    # Backup old likes collection (rename)
    if migrated > 0:
        try:
            await db.likes.rename("likes_backup")
            print(f"📦 Backed up old 'likes' collection to 'likes_backup'")
        except Exception as e:
            print(f"⚠️  Could not rename likes collection: {e}")
    
    client.close()


async def migrate_matches_schema():
    """Update matches collection to use consistent field names"""
    
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    print("\n🔄 Standardizing matches collection schema...")
    
    collections = await db.list_collection_names()
    if "matches" not in collections:
        print("⚠️  'matches' collection not found")
        client.close()
        return
    
    matches_count = await db.matches.count_documents({})
    print(f"📈 Total matches: {matches_count}")
    
    if matches_count == 0:
        print("✅ No matches to update")
        client.close()
        return
    
    # Update matches to use consistent field names
    updated = 0
    errors = 0
    
    matches = await db.matches.find({}).to_list(length=None)
    
    for match in matches:
        try:
            match_id = match["_id"]
            users = match.get("users", [])
            
            if not users or len(users) != 2:
                print(f"⚠️  Invalid match {match_id}: missing users")
                errors += 1
                continue
            
            # Convert to ObjectId if needed
            try:
                user1 = ObjectId(users[0]) if isinstance(users[0], str) else users[0]
                user2 = ObjectId(users[1]) if isinstance(users[1], str) else users[1]
            except Exception as e:
                print(f"⚠️  Invalid user ID in match {match_id}: {e}")
                errors += 1
                continue
            
            # Update match with standardized fields
            update_result = await db.matches.update_one(
                {"_id": match_id},
                {
                    "$set": {
                        "user1Id": user1,
                        "user2Id": user2,
                        "users": [user1, user2],  # Keep for backward compatibility
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            if update_result.modified_count > 0:
                updated += 1
                
            if updated % 50 == 0:
                print(f"⏳ Updated {updated} matches...")
                
        except Exception as e:
            print(f"❌ Error updating match {match.get('_id')}: {e}")
            errors += 1
    
    print(f"\n✅ Matches schema update complete!")
    print(f"   Updated: {updated}")
    print(f"   Errors: {errors}")
    
    client.close()


async def create_indexes():
    """Create indexes for swipes and matches collections"""
    
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    print("\n🔄 Creating database indexes...")
    
    # Swipes indexes
    try:
        await db.swipes.create_index([("userId", 1), ("targetId", 1)], unique=True)
        print("✅ Created unique index on swipes (userId, targetId)")
        
        await db.swipes.create_index([("userId", 1), ("createdAt", -1)])
        print("✅ Created index on swipes (userId, createdAt)")
        
        await db.swipes.create_index([("action", 1)])
        print("✅ Created index on swipes (action)")
    except Exception as e:
        print(f"⚠️  Error creating swipes indexes: {e}")
    
    # Matches indexes
    try:
        await db.matches.create_index([("users", 1)])
        print("✅ Created index on matches (users)")
        
        await db.matches.create_index([("user1Id", 1)])
        print("✅ Created index on matches (user1Id)")
        
        await db.matches.create_index([("user2Id", 1)])
        print("✅ Created index on matches (user2Id)")
        
        await db.matches.create_index([("createdAt", -1)])
        print("✅ Created index on matches (createdAt)")
    except Exception as e:
        print(f"⚠️  Error creating matches indexes: {e}")
    
    client.close()


async def main():
    """Run all migrations"""
    print("=" * 60)
    print("COLABMATCH DATABASE MIGRATION")
    print("=" * 60)
    
    await migrate_likes_to_swipes()
    await migrate_matches_schema()
    await create_indexes()
    
    print("\n" + "=" * 60)
    print("✅ ALL MIGRATIONS COMPLETE!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())

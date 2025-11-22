"""
Database Indexes Setup - Production Ready
Ensures all required indexes exist on startup
"""
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


async def ensure_all_indexes(db: AsyncIOMotorDatabase):
    """
    Ensure all production indexes are created
    Run this on application startup
    """
    try:
        logger.info("🔧 Ensuring database indexes...")
        
        # ===== USERS COLLECTION =====
        users = db.users
        
        # 1. Geospatial index for location-based queries (CRITICAL for nearby discovery)
        try:
            await users.create_index([("location.coordinates", "2dsphere")])
            logger.info("✅ Geospatial index created: users.location.coordinates")
        except Exception as e:
            logger.warning(f"⚠️  Geospatial index may already exist: {e}")
        
        # 2. Online status index (for online discovery)
        await users.create_index([("isOnline", 1)])
        logger.info("✅ Index created: users.isOnline")
        
        # 3. Field index (for filtered discovery)
        await users.create_index([("field", 1)])
        logger.info("✅ Index created: users.field")
        
        # 4. Compound index for online + field queries
        await users.create_index([("isOnline", 1), ("field", 1)])
        logger.info("✅ Compound index created: users.isOnline + field")
        
        # 5. Email index (unique, for auth)
        await users.create_index([("email", 1)], unique=True)
        logger.info("✅ Unique index created: users.email")
        
        # ===== SWIPES COLLECTION =====
        swipes = db.swipes
        
        # 1. Compound unique index to prevent duplicate swipes (CRITICAL!)
        await swipes.create_index(
            [("userId", 1), ("swipedUserId", 1)],
            unique=True,
            name="prevent_duplicate_swipes"
        )
        logger.info("✅ Unique compound index created: swipes.userId + swipedUserId")
        
        # 2. Index for checking mutual likes
        await swipes.create_index([("swipedUserId", 1), ("action", 1)])
        logger.info("✅ Index created: swipes.swipedUserId + action")
        
        # 3. Timestamp index for recent swipes
        await swipes.create_index([("timestamp", -1)])
        logger.info("✅ Index created: swipes.timestamp")
        
        # ===== MATCHES COLLECTION =====
        matches = db.matches
        
        # 1. Compound index for user matches
        await matches.create_index([("userId1", 1), ("userId2", 1)], unique=True)
        logger.info("✅ Unique compound index created: matches.userId1 + userId2")
        
        # 2. Index for fetching user's matches
        await matches.create_index([("userId1", 1)])
        await matches.create_index([("userId2", 1)])
        logger.info("✅ Indexes created: matches.userId1, matches.userId2")
        
        # 3. Timestamp index
        await matches.create_index([("matchedAt", -1)])
        logger.info("✅ Index created: matches.matchedAt")
        
        # ===== MESSAGES COLLECTION =====
        messages = db.messages
        
        # 1. Compound index for chat queries
        await messages.create_index([("senderId", 1), ("receiverId", 1), ("timestamp", -1)])
        logger.info("✅ Compound index created: messages.senderId + receiverId + timestamp")
        
        # 2. Timestamp index
        await messages.create_index([("timestamp", -1)])
        logger.info("✅ Index created: messages.timestamp")
        
        # ===== PROFILES COLLECTION =====
        profiles = db.profiles
        
        # 1. UserID index (to link user -> profile)
        await profiles.create_index([("userId", 1)], unique=True)
        logger.info("✅ Unique index created: profiles.userId")
        
        # 2. Skills index (for matching)
        await profiles.create_index([("skills", 1)])
        logger.info("✅ Index created: profiles.skills")
        
        # 3. Interests index (for matching)
        await profiles.create_index([("interests", 1)])  
        logger.info("✅ Index created: profiles.interests")
        
        logger.info("✅ All database indexes ensured successfully!")
        
    except Exception as e:
        logger.error(f"❌ Failed to create some indexes: {e}")
        # Don't raise - app can still work but might be slower

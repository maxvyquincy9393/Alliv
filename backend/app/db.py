"""Database connection and collection management"""
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional

from .config import settings

logger = logging.getLogger(__name__)

# Global database client
_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def init_db() -> AsyncIOMotorDatabase:
    """Initialize MongoDB connection"""
    global _client, _db
    
    try:
        _client = AsyncIOMotorClient(settings.MONGO_URI)
        # Test connection
        await _client.admin.command('ping')
        
        # Get database name from URI or use default
        db_name = settings.MONGO_URI.split('/')[-1].split('?')[0] or 'alliv'
        _db = _client[db_name]
        
        # Create indices
        await create_indices()
        
        logger.info(f"✅ Connected to MongoDB database: {db_name}")
        return _db
    except Exception as e:
        logger.error(f"❌ Failed to connect to MongoDB: {e}")
        raise


async def close_db():
    """Close MongoDB connection"""
    global _client
    if _client:
        _client.close()
        logger.info("✅ MongoDB connection closed")


async def create_indices():
    """Create database indices for optimal performance"""
    try:
        # Users indices
        await _db.users.create_index("email", unique=True)
        await _db.users.create_index("phone")
        
        # Profiles indices
        await _db.profiles.create_index("userId", unique=True)
        await _db.profiles.create_index([("location.coordinates", "2dsphere")])
        await _db.profiles.create_index("field")
        await _db.profiles.create_index("skills")
        await _db.profiles.create_index("interests")
        
        # Swipes indices
        await _db.swipes.create_index([("swiperId", 1), ("targetId", 1)])
        await _db.swipes.create_index("swiperId")
        await _db.swipes.create_index("targetId")
        
        # Matches indices
        await _db.matches.create_index([("userA", 1), ("userB", 1)], unique=True)
        await _db.matches.create_index("userA")
        await _db.matches.create_index("userB")
        await _db.matches.create_index("status")
        
        # Messages indices
        await _db.messages.create_index([("chatId", 1), ("createdAt", -1)])
        await _db.messages.create_index("chatId")
        
        # Chat indices
        await _db.chats.create_index("memberIds")
        await _db.chats.create_index("lastMessageAt")
        
        # Projects indices
        await _db.projects.create_index("ownerId")
        await _db.projects.create_index("tags")
        await _db.projects.create_index("createdAt")
        
        # Events indices
        await _db.events.create_index("hostId")
        await _db.events.create_index("startsAt")
        await _db.events.create_index("tags")
        
        # Reports & Blocks indices
        await _db.reports.create_index("reporterId")
        await _db.reports.create_index("targetUserId")
        await _db.blocks.create_index([("userId", 1), ("targetUserId", 1)], unique=True)
        
        # Verifications indices (PRODUCTION EMAIL VERIFICATION)
        await _db.verifications.create_index([("userId", 1), ("channel", 1), ("consumed", 1)])
        await _db.verifications.create_index("token")  # For magic link lookup
        # TTL index - MongoDB auto-deletes expired documents
        await _db.verifications.create_index("expiresAt", expireAfterSeconds=0)
        
        logger.info("✅ Database indices created")
    except Exception as e:
        logger.warning(f"⚠️ Error creating indices: {e}")


def get_db() -> AsyncIOMotorDatabase:
    """Get database instance"""
    if _db is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return _db


# Collection shortcuts as functions
def users():
    """Get users collection"""
    return get_db().users

def profiles():
    """Get profiles collection"""
    return get_db().profiles

def swipes():
    """Get swipes collection"""
    return get_db().swipes

def likes():
    """Get likes collection (alias for swipes)"""
    return get_db().swipes

def matches():
    """Get matches collection"""
    return get_db().matches

def chats():
    """Get chats collection"""
    return get_db().chats

def messages():
    """Get messages collection"""
    return get_db().messages

def projects():
    """Get projects collection"""
    return get_db().projects

def events():
    """Get events collection"""
    return get_db().events

def verifications():
    """Get verifications collection"""
    return get_db().verifications

def reports():
    """Get reports collection"""
    return get_db().reports

def blocks():
    """Get blocks collection"""
    return get_db().blocks

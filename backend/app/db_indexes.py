import logging
from pymongo import ASCENDING, DESCENDING, TEXT, IndexModel
from .db import get_db

logger = logging.getLogger(__name__)

async def create_indexes():
    """Create database indexes for performance"""
    db = get_db()
    
    try:
        # Users Collection
        # Email must be unique
        await db.users.create_index("email", unique=True)
        # Username should be unique (if used)
        # await db.users.create_index("username", unique=True)
        
        # Profiles Collection
        # Searchable fields
        await db.profiles.create_index([
            ("name", TEXT),
            ("role", TEXT),
            ("skills", TEXT),
            ("bio", TEXT)
        ])
        # Filtering
        # Ensure userId is unique (one profile per user)
        await db.profiles.create_index("userId", unique=True)
        await db.profiles.create_index("field")
        await db.profiles.create_index("location_city")
        
        # Posts Collection
        # Feed sorting
        await db.posts.create_index([("created_at", DESCENDING)])
        # Author filtering
        await db.posts.create_index("author_id")
        # Type filtering
        await db.posts.create_index("type")
        # Visibility
        await db.posts.create_index("visibility")
        
        # Connections Collection
        # Lookup by user
        await db.connections.create_index("requester_id")
        await db.connections.create_index("recipient_id")
        # Compound index for uniqueness and fast lookup
        await db.connections.create_index(
            [("requester_id", ASCENDING), ("recipient_id", ASCENDING)],
            unique=True
        )
        # Status filtering
        await db.connections.create_index("status")
        
        logger.info("[OK] Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"[ERROR] Failed to create indexes: {e}")

"""
Create unique compound index on matches collection to prevent duplicate matches.
This prevents race conditions when two users swipe on each other simultaneously.

Run this script once to set up the index:
    python backend/create_match_index.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING

# MongoDB connection
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "colabmatch"


async def create_match_index():
    """Create unique compound index on (user1, user2) to prevent duplicate matches"""
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    try:
        # Create unique compound index
        result = await db.matches.create_index(
            [("user1", ASCENDING), ("user2", ASCENDING)],
            unique=True,
            name="unique_match_pair"
        )
        
        print(f"✅ Index created successfully: {result}")
        print("🔒 Duplicate matches are now prevented!")
        
        # List all indexes
        indexes = await db.matches.list_indexes().to_list(length=None)
        print("\n📋 Current indexes on 'matches' collection:")
        for idx in indexes:
            print(f"   - {idx}")
        
    except Exception as e:
        print(f"❌ Error creating index: {str(e)}")
    finally:
        client.close()


if __name__ == "__main__":
    print("🚀 Creating unique index on matches collection...")
    asyncio.run(create_match_index())

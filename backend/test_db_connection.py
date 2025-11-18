"""Test MongoDB connection"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

async def test_connection():
    try:
        print(f"Attempting to connect to: {settings.MONGO_URI}")
        client = AsyncIOMotorClient(settings.MONGO_URI)
        
        # Test connection
        await client.admin.command('ping')
        print("✓ MongoDB connection successful")
        
        # Get database name
        db_name = settings.MONGO_URI.split('/')[-1].split('?')[0] or 'alliv'
        print(f"✓ Database name: {db_name}")
        
        db = client[db_name]
        
        # List collections
        collections = await db.list_collection_names()
        print(f"✓ Collections: {collections}")
        
        # Check users collection
        user_count = await db.users.count_documents({})
        print(f"✓ Users count: {user_count}")
        
        # Check profiles collection
        profile_count = await db.profiles.count_documents({})
        print(f"✓ Profiles count: {profile_count}")
        
        client.close()
        
    except Exception as e:
        print(f"✗ Error: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())

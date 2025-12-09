import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/alliv_test")

async def test_connection():
    print(f"Testing MongoDB connection: {MONGO_URI}")
    print("="*60)
    
    try:
        client = AsyncIOMotorClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        
        # Test connection
        await client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        
        # Get database info
        db = client.get_database()
        collections = await db.list_collection_names()
        print(f"\n📊 Database: {db.name}")
        print(f"📋 Collections: {collections}")
        
        # Count users
        user_count = await db.users.count_documents({})
        print(f"\n👥 Total users: {user_count}")
        
        # Check recent users
        recent_users = await db.users.find({}).sort("createdAt", -1).limit(3).to_list(length=3)
        if recent_users:
            print("\n📝 Recent users:")
            for user in recent_users:
                print(f"   - {user.get('email')} (Verified: {user.get('emailVerified', False)})")
        
        client.close()
        print("\n" + "="*60)
        print("✅ All checks passed!")
        
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print(f"\nError type: {type(e).__name__}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_connection())

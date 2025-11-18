import asyncio
import logging
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_connection():
    logger.info(f"Connecting to {settings.MONGO_URI}")
    try:
        client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
        await client.admin.command('ping')
        logger.info("Ping successful")
        
        db = client.get_database()
        logger.info(f"Using database: {db.name}")
        
        # Test profiles collection
        count = await db.profiles.count_documents({})
        logger.info(f"Profiles count: {count}")
        
        # Test find_one
        profile = await db.profiles.find_one({})
        logger.info(f"Sample profile: {profile.get('_id') if profile else 'None'}")
        
    except Exception as e:
        logger.error(f"Connection failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_connection())


import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def check_users():
    # Check alliv_dev
    uri = "mongodb://127.0.0.1:27017/alliv_dev"
    client = AsyncIOMotorClient(uri)
    db = client.get_database()
    print(f"Checking database: {db.name}")
    
    count = await db.users.count_documents({})
    print(f"User count: {count}")
    
    if count > 0:
        user = await db.users.find_one({"email": "sarah@demo.com"})
        if user:
            print(f"Found sarah@demo.com: {user.get('_id')}")
            print(f"Password hash: {user.get('passwordHash')}")
        else:
            print("sarah@demo.com NOT found")
    
    client.close()
    
    # Check alliv (from .env)
    uri2 = "mongodb://localhost:27017/alliv"
    client2 = AsyncIOMotorClient(uri2)
    db2 = client2.get_database()
    print(f"\nChecking database: {db2.name}")
    
    count2 = await db2.users.count_documents({})
    print(f"User count: {count2}")
    
    client2.close()

if __name__ == "__main__":
    asyncio.run(check_users())

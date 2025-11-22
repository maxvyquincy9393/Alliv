import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from app.password_utils import hash_password

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "colabmatch")

async def reset_password():
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    email = "sarah@demo.com"
    new_password = "Demo123!"
    
    print(f"Resetting password for {email}...")
    
    hashed = hash_password(new_password)
    
    result = await db.users.update_one(
        {"email": email},
        {"$set": {"passwordHash": hashed}}
    )
    
    if result.modified_count > 0:
        print("✅ Password updated successfully!")
    else:
        print("❌ User not found or password already set.")
        
    # Verify it
    user = await db.users.find_one({"email": email})
    print(f"Stored hash: {user['passwordHash']}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(reset_password())

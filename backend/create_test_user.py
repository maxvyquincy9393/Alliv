"""
Create a verified test user for authentication testing
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

# Add parent directory to path to import from app
sys.path.insert(0, '.')
from app.password_utils import hash_password

async def create_verified_test_user():
    # Connect to MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client["alliv"]
    
    email = "verified@test.com"
    password = "Test123!"
    
    # Check if user already exists
    existing = await db.users.find_one({"email": email})
    if existing:
        print(f"✅ User {email} already exists with ID: {existing['_id']}")
        
        # Update to ensure it's verified
        await db.users.update_one(
            {"email": email},
            {"$set": {
                "emailVerified": True,
                "emailVerificationCode": None,
                "emailVerificationExpires": None
            }}
        )
        print(f"✅ Updated user to verified status")
        
        # Also create/update profile
        profile_exists = await db.profiles.find_one({"userId": existing['_id']})
        if not profile_exists:
            await db.profiles.insert_one({
                "userId": existing['_id'],
                "bio": "Test user for cookie authentication",
                "skills": ["Testing", "QA"],
                "interests": ["Security", "Authentication"],
                "photos": [],
                "profileComplete": True,
                "trustScore": 70,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            })
            print(f"✅ Created profile for user")
        return
    
    # Create new user
    hashed_password = hash_password(password)
    
    user_result = await db.users.insert_one({
        "email": email,
        "passwordHash": hashed_password,
        "name": "Test User",
        "birthdate": datetime(1995, 1, 1),
        "emailVerified": True,
        "emailVerificationCode": None,
        "emailVerificationExpires": None,
        "refreshTokens": [],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    
    user_id = user_result.inserted_id
    print(f"✅ Created verified user: {email}")
    print(f"   Password: {password}")
    print(f"   User ID: {user_id}")
    
    # Create profile
    await db.profiles.insert_one({
        "userId": user_id,
        "bio": "Test user for cookie authentication",
        "skills": ["Testing", "QA"],
        "interests": ["Security", "Authentication"],
        "photos": [],
        "profileComplete": True,
        "trustScore": 70,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    })
    
    print(f"✅ Created profile for user")
    print(f"\n🎉 Test user is ready!")
    print(f"\nLogin credentials:")
    print(f"   Email: {email}")
    print(f"   Password: {password}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_verified_test_user())

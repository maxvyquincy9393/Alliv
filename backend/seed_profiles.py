import asyncio
from app.db import init_db, close_db, users, profiles
from datetime import datetime

async def seed_profiles():
    await init_db()
    try:
        all_users = await users().find({}).to_list(length=1000)
        print(f"Found {len(all_users)} users.")
        
        created_count = 0
        updated_count = 0
        
        for user in all_users:
            user_id = str(user["_id"])
            
            # Check if profile exists
            existing_profile = await profiles().find_one({"userId": user_id})
            
            if existing_profile:
                # Update existing
                await profiles().update_one(
                    {"_id": existing_profile["_id"]},
                    {"$set": {"profileComplete": True, "completionScore": 100}}
                )
                updated_count += 1
            else:
                # Create new profile
                profile_doc = {
                    "userId": user_id,
                    "name": user.get("name", "Unknown"),
                    "bio": user.get("bio", "I am a developer."),
                    "photos": [],
                    "skills": user.get("skills", []),
                    "interests": [],
                    "goals": "Build cool things",
                    "category": "Developer",
                    "location": {
                        "city": "Jakarta",
                        "country": "Indonesia",
                        "lat": -6.2088,
                        "lon": 106.8456,
                        "hideExact": False
                    },
                    "visibility": "public",
                    "profileComplete": True,
                    "trustScore": 80,
                    "completionScore": 100,
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
                await profiles().insert_one(profile_doc)
                created_count += 1
                
        print(f"Profiles processed: {created_count} created, {updated_count} updated.")
            
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(seed_profiles())

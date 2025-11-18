import asyncio
from app.db import init_db, close_db, users, profiles

async def mark_complete():
    await init_db()
    try:
        user = await users().find_one({"email": "aulia@dev.com"})
        if not user:
            print("User not found")
            return

        result = await profiles().update_one(
            {"userId": str(user["_id"])},
            {"$set": {"profileComplete": True, "completionScore": 100}}
        )
        
        if result.modified_count > 0:
            print(f"Profile for {user['email']} marked as complete.")
        else:
            print("Profile already complete or not found.")
            
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(mark_complete())

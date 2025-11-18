import asyncio
from app.db import init_db, close_db, users
from app.auth import verify_password, hash_password

async def debug_login():
    await init_db()
    try:
        email = "aulia@dev.com"
        password = "pass123"
        
        user = await users().find_one({"email": email})
        if not user:
            print(f"User {email} NOT FOUND.")
            return

        print(f"User found: {user['_id']}")
        stored_hash = user.get("passwordHash")
        print(f"Stored Hash: {stored_hash}")
        
        if not stored_hash:
            print("No passwordHash found on user object.")
            return

        is_valid = verify_password(password, stored_hash)
        print(f"Password '{password}' valid? {is_valid}")
        
        # Test re-hashing
        new_hash = hash_password(password)
        print(f"New Hash check: {verify_password(password, new_hash)}")
        
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(debug_login())

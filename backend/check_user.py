import asyncio
from app.db import init_db, users, close_db

async def check():
    await init_db()
    try:
        user = await users().find_one({"email": "aulia@dev.com"})
        if user:
            print("User exists")
        else:
            print("User does not exist")
    finally:
        await close_db()

if __name__ == "__main__":
    asyncio.run(check())

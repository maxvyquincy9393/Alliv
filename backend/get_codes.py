import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/alliv_test")

async def main():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.get_database()
    
    users = await db.users.find({"emailVerified": False}).sort("createdAt", -1).limit(5).to_list(length=5)
    
    print("\n" + "="*60)
    for user in users:
        email = user.get('email', 'N/A')
        code = user.get('emailVerificationCode', 'NO CODE')
        print(f"Email: {email}")
        print(f"Code: {code}")
        if code and code != 'NO CODE':
            formatted = " ".join(code[i:i+3] for i in range(0, len(code), 3))
            print(f"Formatted: {formatted}")
        print("-"*60)
    print("="*60 + "\n")
    
    client.close()

asyncio.run(main())

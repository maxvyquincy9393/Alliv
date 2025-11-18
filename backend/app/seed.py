"""
Seed script to populate database with sample users
Run: python -m app.seed
"""
import asyncio
from .db import users, likes, matches, messages, init_db, close_db
from .auth import hash_password
from datetime import datetime


async def seed():
    """Seed database with sample data"""
    print("🌱 Seeding database...")
    
    # Initialize DB connection
    await init_db()
    
    try:
        # Clear existing data
        await users().delete_many({})
        await likes().delete_many({})
        await matches().delete_many({})
        await messages().delete_many({})
        print("  ✓ Cleared existing data")
        
        # Sample users
        sample_users = [
            {
                "_id": "user::1",
                "name": "Aulia Rahman",
                "email": "aulia@dev.com",
                "passwordHash": hash_password("pass123"),
                "provider": "email",
                "emailVerified": True,
                "role": "AI Engineer",
                "skills": ["python", "pytorch", "nlp", "fastapi"],
                "project_interest": "Web AI",
                "bio": "I build LLM-powered applications and love working with transformers",
                "photo_url": "",
                "availability_hours": 15,
                "behavior_score": 0.9,
                "created_at": datetime.utcnow(),
                "last_active": datetime.utcnow()
            },
            {
                "_id": "user::2",
                "name": "Rizky Pratama",
                "email": "rizky@dev.com",
                "passwordHash": hash_password("pass123"),
                "provider": "email",
                "emailVerified": True,
                "role": "Frontend Developer",
                "skills": ["react", "flutter", "typescript", "tailwind"],
                "project_interest": "Web AI",
                "bio": "UI/UX enthusiast who loves creating beautiful interfaces",
                "photo_url": "",
                "availability_hours": 10,
                "behavior_score": 0.85,
                "created_at": datetime.utcnow(),
                "last_active": datetime.utcnow()
            },
            {
                "_id": "user::3",
                "name": "Sari Wijaya",
                "email": "sari@dev.com",
                "passwordHash": hash_password("pass123"),
                "provider": "email",
                "emailVerified": True,
                "role": "Product Designer",
                "skills": ["figma", "ux", "prototyping", "user-research"],
                "project_interest": "Mobile Apps",
                "bio": "Design systems advocate. I create intuitive experiences",
                "photo_url": "",
                "availability_hours": 12,
                "behavior_score": 0.95,
                "created_at": datetime.utcnow(),
                "last_active": datetime.utcnow()
            }
        ]

        for user in sample_users:
            del user["_id"]
        
        await users().insert_many(sample_users)
        print(f"  ✓ Created {len(sample_users)} sample users")
        
        print("\n[OK] Seeding complete!")
        print("\n[NOTE] Sample credentials:")
        print("   Email: aulia@dev.com | Password: pass123")
        print("   Email: rizky@dev.com | Password: pass123")
        print("   Email: sari@dev.com  | Password: pass123")
        print("   (All users have password: pass123)")
        
    finally:
        await close_db()


if __name__ == "__main__":
    asyncio.run(seed())

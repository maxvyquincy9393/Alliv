"""
Seed script to populate database with sample users
Run: python -m app.seed
"""
import asyncio
from .db import users, likes, matches, messages
from .auth import hash_password
from datetime import datetime


async def seed():
    """Seed database with sample data"""
    print("🌱 Seeding database...")
    
    # Clear existing data
    await users.delete_many({})
    await likes.delete_many({})
    await matches.delete_many({})
    await messages.delete_many({})
    print("  ✓ Cleared existing data")
    
    # Sample users
    sample_users = [
        {
            "_id": "user::1",
            "name": "Aulia Rahman",
            "email": "aulia@dev.com",
            "password_hash": hash_password("pass123"),
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
            "password_hash": hash_password("pass123"),
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
            "password_hash": hash_password("pass123"),
            "role": "Product Designer",
            "skills": ["figma", "ux", "prototyping", "user-research"],
            "project_interest": "Mobile Apps",
            "bio": "Design systems advocate. I create intuitive experiences",
            "photo_url": "",
            "availability_hours": 12,
            "behavior_score": 0.95,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::4",
            "name": "Budi Santoso",
            "email": "budi@dev.com",
            "password_hash": hash_password("pass123"),
            "role": "Backend Developer",
            "skills": ["python", "fastapi", "postgresql", "docker"],
            "project_interest": "Web AI",
            "bio": "Backend specialist with focus on scalable architectures",
            "photo_url": "",
            "availability_hours": 20,
            "behavior_score": 0.88,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::5",
            "name": "Dewi Lestari",
            "email": "dewi@dev.com",
            "password_hash": hash_password("pass123"),
            "role": "Mobile Developer",
            "skills": ["flutter", "dart", "firebase", "kotlin"],
            "project_interest": "Mobile Apps",
            "bio": "Cross-platform mobile dev. Flutter is my superpower",
            "photo_url": "",
            "availability_hours": 8,
            "behavior_score": 0.92,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::6",
            "name": "Eko Prasetyo",
            "email": "eko@dev.com",
            "password_hash": hash_password("pass123"),
            "role": "DevOps Engineer",
            "skills": ["docker", "kubernetes", "aws", "terraform"],
            "project_interest": "Infrastructure",
            "bio": "Cloud infrastructure and automation expert",
            "photo_url": "",
            "availability_hours": 10,
            "behavior_score": 0.87,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::7",
            "name": "Fitri Handayani",
            "email": "fitri@dev.com",
            "password_hash": hash_password("pass123"),
            "role": "Data Scientist",
            "skills": ["python", "pandas", "scikit-learn", "sql"],
            "project_interest": "Web AI",
            "bio": "Data storyteller. I turn data into insights",
            "photo_url": "",
            "availability_hours": 15,
            "behavior_score": 0.91,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::8",
            "name": "Gunawan Tan",
            "email": "gunawan@dev.com",
            "password_hash": hash_password("pass123"),
            "role": "Full Stack Developer",
            "skills": ["react", "nodejs", "mongodb", "express"],
            "project_interest": "SaaS Platform",
            "bio": "Building MVPs fast. From idea to production in weeks",
            "photo_url": "",
            "availability_hours": 25,
            "behavior_score": 0.89,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        }
    ]
    
    await users.insert_many(sample_users)
    print(f"  ✓ Created {len(sample_users)} sample users")
    
    print("\n✅ Seeding complete!")
    print("\n📝 Sample credentials:")
    print("   Email: aulia@dev.com | Password: pass123")
    print("   Email: rizky@dev.com | Password: pass123")
    print("   Email: sari@dev.com  | Password: pass123")
    print("   (All users have password: pass123)")


if __name__ == "__main__":
    asyncio.run(seed())

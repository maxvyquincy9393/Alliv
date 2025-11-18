"""
Seed Test Users - Populate Database with Demo Data
Creates diverse users so Discover page has data to show
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId
import os
from dotenv import load_dotenv
from app.password_utils import hash_password

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DATABASE_NAME", "colabmatch")

# Demo users with diverse skills and interests
DEMO_USERS = [
    {
        "name": "Sarah Chen",
        "email": "sarah@demo.com",
        "bio": "Full-stack developer passionate about AI and clean code",
        "skills": ["Python", "React", "TypeScript", "Node.js", "MongoDB"],
        "interests": ["AI/ML", "Web Development", "Open Source", "Tech Talks"],
        "goals": "Looking to collaborate on AI-powered web applications",
        "modePreference": "online",
        "location": {"lat": -6.2088, "lon": 106.8456}  # Jakarta
    },
    {
        "name": "Alex Kumar",
        "email": "alex@demo.com",
        "bio": "Mobile app developer & UX enthusiast",
        "skills": ["Flutter", "React Native", "Figma", "Swift", "Kotlin"],
        "interests": ["Mobile Development", "UI/UX Design", "Startups"],
        "goals": "Building the next big mobile app",
        "modePreference": "hybrid",
        "location": {"lat": -6.2114, "lon": 106.8446}  # Jakarta (nearby)
    },
    {
        "name": "Maria Garcia",
        "email": "maria@demo.com",
        "bio": "Data scientist exploring the world of machine learning",
        "skills": ["Python", "TensorFlow", "PyTorch", "Pandas", "SQL"],
        "interests": ["AI/ML", "Data Science", "Research", "Teaching"],
        "goals": "Collaborate on ML research projects",
        "modePreference": "online",
        "location": {"lat": -6.1751, "lon": 106.8650}  # Jakarta (different area)
    },
    {
        "name": "David Lee",
        "email": "david@demo.com",
        "bio": "DevOps engineer who loves automation",
        "skills": ["Docker", "Kubernetes", "AWS", "Python", "Linux"],
        "interests": ["DevOps", "Cloud Computing", "Automation", "Security"],
        "goals": "Building scalable cloud infrastructure",
        "modePreference": "remote",
        "location": {"lat": -6.2297, "lon": 106.8241}  # Jakarta
    },
    {
        "name": "Emma Wilson",
        "email": "emma@demo.com",
        "bio": "Frontend developer with an eye for design",
        "skills": ["React", "Vue.js", "CSS", "TypeScript", "Tailwind"],
        "interests": ["Web Development", "UI/UX Design", "Animation", "Accessibility"],
        "goals": "Creating beautiful, accessible web experiences",
        "modePreference": "hybrid",
        "location": {"lat": -6.1862, "lon": 106.8063}  # Jakarta
    },
    {
        "name": "James Park",
        "email": "james@demo.com",
        "bio": "Backend architect specializing in microservices",
        "skills": ["Java", "Spring Boot", "PostgreSQL", "Redis", "Kafka"],
        "interests": ["Backend Development", "System Design", "Microservices"],
        "goals": "Architecting scalable distributed systems",
        "modePreference": "online",
        "location": {"lat": -6.2615, "lon": 106.7810}  # Jakarta (south)
    },
    {
        "name": "Lisa Zhang",
        "email": "lisa@demo.com",
        "bio": "Blockchain developer & crypto enthusiast",
        "skills": ["Solidity", "Web3.js", "Ethereum", "React", "Node.js"],
        "interests": ["Blockchain", "DeFi", "Cryptocurrency", "Smart Contracts"],
        "goals": "Building decentralized applications",
        "modePreference": "online",
        "location": {"lat": -6.2276, "lon": 106.8189}  # Jakarta
    },
    {
        "name": "Michael Brown",
        "email": "michael@demo.com",
        "bio": "Game developer creating immersive experiences",
        "skills": ["Unity", "C#", "Unreal Engine", "3D Modeling", "Game Design"],
        "interests": ["Game Development", "VR/AR", "Animation", "Storytelling"],
        "goals": "Developing indie games with unique mechanics",
        "modePreference": "hybrid",
        "location": {"lat": -6.2349, "lon": 106.8450}  # Jakarta
    },
    {
        "name": "Nina Patel",
        "email": "nina@demo.com",
        "bio": "Security researcher & ethical hacker",
        "skills": ["Penetration Testing", "Python", "Cybersecurity", "Linux", "Network Security"],
        "interests": ["Cybersecurity", "Ethical Hacking", "Privacy", "Open Source"],
        "goals": "Making the internet more secure",
        "modePreference": "remote",
        "location": {"lat": -6.1944, "lon": 106.8229}  # Jakarta
    },
    {
        "name": "Oliver Kim",
        "email": "oliver@demo.com",
        "bio": "Product manager with technical background",
        "skills": ["Product Management", "Agile", "Data Analysis", "UX Research", "SQL"],
        "interests": ["Product Strategy", "User Research", "Startups", "Tech Trends"],
        "goals": "Building products people love",
        "modePreference": "hybrid",
        "location": {"lat": -6.2088, "lon": 106.8650}  # Jakarta
    }
]


async def seed_users():
    """Seed database with demo users"""
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[DB_NAME]
    
    print("=" * 60)
    print("SEEDING DEMO USERS")
    print("=" * 60)
    
    # Default password for all demo users
    default_password = "Demo123!"
    
    created_count = 0
    skipped_count = 0
    
    for demo in DEMO_USERS:
        try:
            # Check if user already exists
            existing = await db.users.find_one({"email": demo["email"]})
            if existing:
                print(f"⏭️  Skipped: {demo['name']} (already exists)")
                skipped_count += 1
                continue
            
            # Create user document
            user_doc = {
                "_id": ObjectId(),
                "email": demo["email"],
                "passwordHash": hash_password(default_password),
                "name": demo["name"],
                "provider": "email",
                "emailVerified": True,  # Pre-verified for demo
                "emailVerifiedAt": datetime.utcnow(),
                "roles": ["user"],
                "active": True,
                "lastLogin": datetime.utcnow(),
                "refreshTokens": [],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            await db.users.insert_one(user_doc)
            user_id = str(user_doc["_id"])
            
            # Create profile
            profile_doc = {
                "userId": user_id,
                "name": demo["name"],
                "bio": demo["bio"],
                "skills": demo["skills"],
                "interests": demo["interests"],
                "goals": demo["goals"],
                "modePreference": demo["modePreference"],
                "location": demo["location"],
                "photos": [],  # Empty for demo
                "profileComplete": True,  # Mark as complete
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            await db.profiles.insert_one(profile_doc)
            
            print(f"✅ Created: {demo['name']} ({demo['email']})")
            print(f"   Skills: {', '.join(demo['skills'][:3])}...")
            print(f"   Mode: {demo['modePreference']}")
            created_count += 1
            
        except Exception as e:
            print(f"❌ Error creating {demo['name']}: {e}")
    
    print("\n" + "=" * 60)
    print(f"✅ Seeding Complete!")
    print(f"   Created: {created_count} users")
    print(f"   Skipped: {skipped_count} users")
    print(f"\n💡 Login with any demo account:")
    print(f"   Email: sarah@demo.com")
    print(f"   Password: Demo123!")
    print("=" * 60)
    
    client.close()


if __name__ == "__main__":
    asyncio.run(seed_users())

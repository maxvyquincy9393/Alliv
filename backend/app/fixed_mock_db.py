"""
Fixed Mock Database - Working In-Memory Storage
"""
from datetime import datetime
from typing import Dict, List, Optional
import uuid

# Simple in-memory storage
users_db = {}
likes_db = []
matches_db = []
messages_db = []

# Pre-hashed password for "pass123" (bcrypt)
MOCK_PASSWORD_HASH = "$2b$12$eImi/yT/iah4b6.M6NNBPOyWk1b2BAaHyQerRQ9bAcmaPvk6D0EIm"

def init_mock_data():
    """Initialize with sample data"""
    global users_db, likes_db, matches_db, messages_db
    
    # Clear existing
    users_db.clear()
    likes_db.clear()
    matches_db.clear()
    messages_db.clear()
    
    # Sample users with Tinder-like profiles
    sample_users = [
        {
            "_id": "user::1",
            "name": "Aulia Rahman",
            "email": "aulia@dev.com",
            "password_hash": MOCK_PASSWORD_HASH,
            "role": "AI Engineer",
            "skills": ["Python", "PyTorch", "NLP", "TensorFlow"],
            "project_interest": "Web AI",
            "bio": "Building the future with AI 🚀 Looking for frontend wizards to create magic together",
            "availability_hours": 15,
            "age": 28,
            "location": "Jakarta, Indonesia",
            "photos": [
                "https://randomuser.me/api/portraits/men/1.jpg",
                "https://images.unsplash.com/photo-1555066931-4365d14bab8c"
            ],
            "behavior_score": 0.85,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::2",
            "name": "Sarah Johnson",
            "email": "sarah@dev.com",
            "password_hash": MOCK_PASSWORD_HASH,
            "role": "Frontend Developer",
            "skills": ["React", "TypeScript", "Flutter", "Next.js"],
            "project_interest": "Web Apps",
            "bio": "React enthusiast ⚛️ Crafting beautiful UIs. Let's build something amazing!",
            "availability_hours": 10,
            "age": 26,
            "location": "Singapore",
            "photos": [
                "https://randomuser.me/api/portraits/women/2.jpg",
                "https://images.unsplash.com/photo-1517180102446-f3c77b982b58"
            ],
            "behavior_score": 0.90,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::3",
            "name": "Alex Chen",
            "email": "alex@dev.com",
            "password_hash": MOCK_PASSWORD_HASH,
            "role": "Full Stack Developer",
            "skills": ["Node.js", "React", "MongoDB", "Docker"],
            "project_interest": "SaaS Platform",
            "bio": "Full-stack ninja 🥷 From idea to production. Looking for co-founders!",
            "availability_hours": 20,
            "age": 30,
            "location": "San Francisco, CA",
            "photos": [
                "https://randomuser.me/api/portraits/men/3.jpg",
                "https://images.unsplash.com/photo-1498050108023-c5249f4df085"
            ],
            "behavior_score": 0.92,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::4",
            "name": "Maya Patel",
            "email": "maya@dev.com",
            "password_hash": MOCK_PASSWORD_HASH,
            "role": "Product Designer",
            "skills": ["Figma", "UI/UX", "Prototyping", "Design Systems"],
            "project_interest": "Mobile Apps",
            "bio": "Design is my passion 🎨 Creating experiences users love",
            "availability_hours": 12,
            "age": 27,
            "location": "Mumbai, India",
            "photos": [
                "https://randomuser.me/api/portraits/women/4.jpg",
                "https://images.unsplash.com/photo-1559526324-4b87b5e36e44"
            ],
            "behavior_score": 0.88,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::5",
            "name": "Ryan Kim",
            "email": "ryan@dev.com",
            "password_hash": MOCK_PASSWORD_HASH,
            "role": "Backend Developer",
            "skills": ["Python", "FastAPI", "PostgreSQL", "AWS"],
            "project_interest": "Web AI",
            "bio": "Backend architect 🏗️ Building scalable systems. AI enthusiast",
            "availability_hours": 18,
            "age": 29,
            "location": "Seoul, Korea",
            "photos": [
                "https://randomuser.me/api/portraits/men/5.jpg",
                "https://images.unsplash.com/photo-1461749280684-dccba630e2f6"
            ],
            "behavior_score": 0.91,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::6",
            "name": "Emma Wilson",
            "email": "emma@dev.com",
            "password_hash": MOCK_PASSWORD_HASH,
            "role": "Mobile Developer",
            "skills": ["Flutter", "Swift", "Kotlin", "Firebase"],
            "project_interest": "Mobile Apps",
            "bio": "Mobile first 📱 Creating apps people can't put down",
            "availability_hours": 15,
            "age": 25,
            "location": "London, UK",
            "photos": [
                "https://randomuser.me/api/portraits/women/6.jpg",
                "https://images.unsplash.com/photo-1512941937669-90a1b34e7feb"
            ],
            "behavior_score": 0.87,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::7",
            "name": "David Martinez",
            "email": "david@dev.com",
            "password_hash": MOCK_PASSWORD_HASH,
            "role": "DevOps Engineer",
            "skills": ["Docker", "Kubernetes", "AWS", "CI/CD"],
            "project_interest": "SaaS Platform",
            "bio": "Automation expert ⚙️ Making deployments smooth as butter",
            "availability_hours": 20,
            "age": 32,
            "location": "Barcelona, Spain",
            "photos": [
                "https://randomuser.me/api/portraits/men/7.jpg",
                "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d"
            ],
            "behavior_score": 0.89,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::8",
            "name": "Lisa Zhang",
            "email": "lisa@dev.com",
            "password_hash": MOCK_PASSWORD_HASH,
            "role": "Data Scientist",
            "skills": ["Python", "TensorFlow", "Pandas", "SQL"],
            "project_interest": "Web AI",
            "bio": "Data whisperer 📊 Turning numbers into insights with ML",
            "availability_hours": 16,
            "age": 28,
            "location": "Beijing, China",
            "photos": [
                "https://randomuser.me/api/portraits/women/8.jpg",
                "https://images.unsplash.com/photo-1551434678-e076c223a692"
            ],
            "behavior_score": 0.90,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        }
    ]
    
    # Add users to database
    for user in sample_users:
        users_db[user["_id"]] = user
    
    # Create some sample likes
    likes_db.extend([
        {"_id": "like::1", "from": "user::1", "to": "user::2", "created_at": datetime.utcnow()},
        {"_id": "like::2", "from": "user::2", "to": "user::1", "created_at": datetime.utcnow()},
        {"_id": "like::3", "from": "user::3", "to": "user::4", "created_at": datetime.utcnow()},
        {"_id": "like::4", "from": "user::4", "to": "user::3", "created_at": datetime.utcnow()},
    ])
    
    # Create matches (mutual likes)
    matches_db.extend([
        {
            "_id": "match::1",
            "users": ["user::1", "user::2"],
            "created_at": datetime.utcnow()
        },
        {
            "_id": "match::2",
            "users": ["user::3", "user::4"],
            "created_at": datetime.utcnow()
        }
    ])
    
    # Sample messages
    messages_db.extend([
        {
            "_id": "msg::1",
            "match_id": "match::1",
            "sender": "user::1",
            "content": "Hey! Love your React skills. Want to build an AI app together?",
            "created_at": datetime.utcnow()
        },
        {
            "_id": "msg::2",
            "match_id": "match::1",
            "sender": "user::2",
            "content": "Hi! Yes, that sounds amazing! I've been wanting to work on an AI project 🚀",
            "created_at": datetime.utcnow()
        }
    ])
    
    return {
        "users": len(users_db),
        "likes": len(likes_db),
        "matches": len(matches_db),
        "messages": len(messages_db)
    }


class MockCollection:
    """Mock MongoDB collection"""
    
    def __init__(self, name: str, storage):
        self.name = name
        self.storage = storage
    
    async def find_one(self, query: dict) -> Optional[dict]:
        """Find one document"""
        if isinstance(self.storage, dict):
            for doc in self.storage.values():
                if all(doc.get(k) == v for k, v in query.items()):
                    return doc.copy()
        else:
            for doc in self.storage:
                if all(doc.get(k) == v for k, v in query.items()):
                    return doc.copy()
        return None
    
    async def find(self, query: dict = None) -> List[dict]:
        """Find documents"""
        results = []
        data = list(self.storage.values()) if isinstance(self.storage, dict) else self.storage
        
        for doc in data:
            if query is None or all(doc.get(k) == v for k, v in query.items()):
                results.append(doc.copy())
        
        return results
    
    async def insert_one(self, document: dict):
        """Insert one document"""
        if "_id" not in document:
            document["_id"] = f"{self.name}::{uuid.uuid4().hex[:8]}"
        
        if isinstance(self.storage, dict):
            self.storage[document["_id"]] = document
        else:
            self.storage.append(document)
        
        class Result:
            def __init__(self, doc_id):
                self.inserted_id = doc_id
        
        return Result(document["_id"])
    
    async def update_one(self, query: dict, update: dict):
        """Update one document"""
        doc = await self.find_one(query)
        if doc and "$set" in update:
            # Update in storage
            if isinstance(self.storage, dict):
                for key, val in self.storage.items():
                    if all(val.get(k) == v for k, v in query.items()):
                        self.storage[key].update(update["$set"])
                        break
            else:
                for item in self.storage:
                    if all(item.get(k) == v for k, v in query.items()):
                        item.update(update["$set"])
                        break
        
        class Result:
            modified_count = 1 if doc else 0
        
        return Result()
    
    async def delete_many(self, query: dict):
        """Delete documents"""
        count = 0
        if isinstance(self.storage, dict):
            to_delete = []
            for k, v in self.storage.items():
                if all(v.get(key) == val for key, val in query.items()):
                    to_delete.append(k)
            for k in to_delete:
                del self.storage[k]
                count += 1
        else:
            original_len = len(self.storage)
            self.storage[:] = [doc for doc in self.storage 
                              if not all(doc.get(k) == v for k, v in query.items())]
            count = original_len - len(self.storage)
        
        class Result:
            def __init__(self, cnt):
                self.deleted_count = cnt
        
        return Result(count)
    
    async def create_index(self, *args, **kwargs):
        """Mock create index"""
        pass


# Initialize collections
users = MockCollection("users", users_db)
likes = MockCollection("likes", likes_db)
matches = MockCollection("matches", matches_db)
messages = MockCollection("messages", messages_db)


async def init_db():
    """Initialize mock database"""
    stats = init_mock_data()
    print("🔥 Mock Database Ready (Tinder-style)")
    print(f"   ✅ {stats['users']} users loaded")
    print(f"   ✅ {stats['likes']} likes")
    print(f"   ✅ {stats['matches']} matches")
    print(f"   ✅ {stats['messages']} messages")
    print()
    print("📧 Test Login:")
    print("   Email: aulia@dev.com | Password: pass123")
    print("   Email: sarah@dev.com | Password: pass123")
    print("   (All users: pass123)")

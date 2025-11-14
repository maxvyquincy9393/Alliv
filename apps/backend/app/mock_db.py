"""
Mock Database - In-Memory Storage untuk Testing Tanpa MongoDB
"""
from datetime import datetime
from typing import Dict, List, Optional
import uuid
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory storage
_users: Dict[str, dict] = {}
_likes: List[dict] = []
_matches: List[dict] = []
_messages: List[dict] = []


class MockCollection:
    """Mock MongoDB collection"""
    
    def __init__(self, name: str, storage: dict):
        self.name = name
        self.storage = storage
    
    async def find_one(self, query: dict) -> Optional[dict]:
        """Find one document"""
        if isinstance(self.storage, dict):
            # For users collection
            for doc in self.storage.values():
                if all(doc.get(k) == v for k, v in query.items()):
                    return doc
        else:
            # For list-based collections
            for doc in self.storage:
                if all(doc.get(k) == v for k, v in query.items()):
                    return doc
        return None
    
    async def find(self, query: dict = None) -> List[dict]:
        """Find documents"""
        results = []
        data = list(self.storage.values()) if isinstance(self.storage, dict) else self.storage
        
        for doc in data:
            if query is None or all(doc.get(k) == v for k, v in query.items()):
                results.append(doc)
        
        return results
    
    async def insert_one(self, document: dict):
        """Insert one document"""
        if "_id" not in document:
            document["_id"] = f"{self.name}::{uuid.uuid4().hex[:8]}"
        
        if isinstance(self.storage, dict):
            self.storage[document["_id"]] = document
        else:
            self.storage.append(document)
        
        return type('obj', (object,), {'inserted_id': document["_id"]})
    
    async def update_one(self, query: dict, update: dict):
        """Update one document"""
        doc = await self.find_one(query)
        if doc and "$set" in update:
            doc.update(update["$set"])
        return type('obj', (object,), {'modified_count': 1 if doc else 0})
    
    async def delete_many(self, query: dict):
        """Delete documents"""
        if isinstance(self.storage, dict):
            to_delete = [k for k, v in self.storage.items() 
                        if all(v.get(key) == val for key, val in query.items())]
            for k in to_delete:
                del self.storage[k]
            return type('obj', (object,), {'deleted_count': len(to_delete)})
        else:
            original_len = len(self.storage)
            self.storage[:] = [doc for doc in self.storage 
                              if not all(doc.get(k) == v for k, v in query.items())]
            return type('obj', (object,), {'deleted_count': original_len - len(self.storage)})
    
    async def create_index(self, *args, **kwargs):
        """Mock create index"""
        pass


# Create collections
users = MockCollection("users", _users)
likes = MockCollection("likes", _likes)
matches = MockCollection("matches", _matches)
messages = MockCollection("messages", _messages)


async def init_db():
    """Initialize mock database with sample data"""
    print("🔧 Using MOCK DATABASE (in-memory)")
    print("   MongoDB connection skipped - using sample data")
    
    # Clear existing
    _users.clear()
    _likes.clear()
    _matches.clear()
    _messages.clear()
    
    # For mock database, use a simple valid bcrypt hash
    # This is hash of "pass123" - for testing only!
    password_hash = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"
    
    # Sample users
    sample_users = [
        {
            "_id": "user::1",
            "name": "Aulia Rahman",
            "email": "aulia@dev.com",
            "password_hash": password_hash,
            "role": "AI Engineer",
            "skills": ["Python", "PyTorch", "NLP", "TensorFlow"],
            "project_interest": "Web AI",
            "bio": "I build LLM applications and love working with AI. Looking for frontend partners!",
            "availability_hours": 15,
            "behavior_score": 0.85,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::2",
            "name": "Rizky Pratama",
            "email": "rizky@dev.com",
            "password_hash": password_hash,
            "role": "Frontend Developer",
            "skills": ["React", "TypeScript", "Flutter", "Next.js"],
            "project_interest": "Web AI",
            "bio": "UI/UX enthusiast, love building beautiful interfaces. Open to AI projects!",
            "availability_hours": 10,
            "behavior_score": 0.90,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::3",
            "name": "Sari Wijaya",
            "email": "sari@dev.com",
            "password_hash": password_hash,
            "role": "Product Designer",
            "skills": ["Figma", "UI/UX", "Prototyping", "Design Systems"],
            "project_interest": "Mobile Apps",
            "bio": "Design thinking advocate, creating delightful user experiences",
            "availability_hours": 12,
            "behavior_score": 0.88,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::4",
            "name": "Budi Santoso",
            "email": "budi@dev.com",
            "password_hash": password_hash,
            "role": "Backend Developer",
            "skills": ["Python", "FastAPI", "Docker", "PostgreSQL"],
            "project_interest": "SaaS Platform",
            "bio": "Building scalable backend systems. Looking for frontend and design partners",
            "availability_hours": 20,
            "behavior_score": 0.92,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::5",
            "name": "Dewi Lestari",
            "email": "dewi@dev.com",
            "password_hash": password_hash,
            "role": "Mobile Developer",
            "skills": ["Flutter", "Dart", "Firebase", "React Native"],
            "project_interest": "Mobile Apps",
            "bio": "Cross-platform mobile development specialist. Love building apps!",
            "availability_hours": 15,
            "behavior_score": 0.87,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::6",
            "name": "Eko Prasetyo",
            "email": "eko@dev.com",
            "password_hash": password_hash,
            "role": "DevOps Engineer",
            "skills": ["Docker", "Kubernetes", "AWS", "CI/CD"],
            "project_interest": "SaaS Platform",
            "bio": "Infrastructure and automation expert. Let's build scalable systems!",
            "availability_hours": 18,
            "behavior_score": 0.91,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::7",
            "name": "Fitri Handayani",
            "email": "fitri@dev.com",
            "password_hash": password_hash,
            "role": "Data Scientist",
            "skills": ["Python", "Pandas", "Machine Learning", "SQL"],
            "project_interest": "Web AI",
            "bio": "Data-driven decision making. Looking for developers to build ML products",
            "availability_hours": 12,
            "behavior_score": 0.86,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        },
        {
            "_id": "user::8",
            "name": "Gunawan Tan",
            "email": "gunawan@dev.com",
            "password_hash": password_hash,
            "role": "Full Stack Developer",
            "skills": ["React", "Node.js", "MongoDB", "TypeScript"],
            "project_interest": "SaaS Platform",
            "bio": "Full-stack developer ready to build amazing products. Let's collaborate!",
            "availability_hours": 25,
            "behavior_score": 0.93,
            "created_at": datetime.utcnow(),
            "last_active": datetime.utcnow()
        }
    ]
    
    for user in sample_users:
        _users[user["_id"]] = user
    
    # Create some sample likes
    _likes.extend([
        {"_id": "like::1", "from": "user::1", "to": "user::2", "created_at": datetime.utcnow()},
        {"_id": "like::2", "from": "user::2", "to": "user::1", "created_at": datetime.utcnow()},
        {"_id": "like::3", "from": "user::1", "to": "user::3", "created_at": datetime.utcnow()},
    ])
    
    # Create sample match (mutual like)
    _matches.append({
        "_id": "match::1",
        "users": ["user::1", "user::2"],
        "created_at": datetime.utcnow()
    })
    
    # Create sample messages
    _messages.extend([
        {
            "_id": "msg::1",
            "match_id": "match::1",
            "sender": "user::1",
            "content": "Hi! I saw your React skills. Want to collaborate on a Web AI project?",
            "created_at": datetime.utcnow()
        },
        {
            "_id": "msg::2",
            "match_id": "match::1",
            "sender": "user::2",
            "content": "Hey! Yes, that sounds interesting! I'd love to work on the frontend.",
            "created_at": datetime.utcnow()
        }
    ])
    
    print(f"[OK] Mock database initialized:")
    print(f"   - {len(_users)} users")
    print(f"   - {len(_likes)} likes")
    print(f"   - {len(_matches)} matches")
    print(f"   - {len(_messages)} messages")
    print()
    print("[EMAIL] Test credentials:")
    print("   Email: aulia@dev.com | Password: pass123")
    print("   Email: rizky@dev.com | Password: pass123")
    print("   (All users have password: pass123)")

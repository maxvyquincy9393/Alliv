import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
print(f"Testing connection to: {MONGO_URI[:50]}...")

try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=30000)
    info = client.server_info()
    print(f"✅ Connected successfully!")
    print(f"MongoDB version: {info['version']}")
    print(f"Server: {info.get('host', 'N/A')}")
    
    # Test database access
    db = client[os.getenv("DB_NAME", "collabmatch")]
    collections = db.list_collection_names()
    print(f"Collections: {collections if collections else 'No collections yet'}")
    
except Exception as e:
    print(f"❌ Connection failed!")
    print(f"Error: {e}")
    print("\nTroubleshooting:")
    print("1. Check if MongoDB Atlas IP whitelist includes your IP")
    print("2. Verify username and password are correct")
    print("3. Check internet connection")
    print("4. Try accessing MongoDB Atlas dashboard")

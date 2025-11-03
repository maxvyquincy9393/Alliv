"""
User Management Script - List and Delete Users
Run: python manage_users.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "alliv"

async def list_users():
    """List all registered users"""
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    print("\n" + "="*80)
    print("REGISTERED USERS")
    print("="*80)
    
    users = await db.users.find({}).to_list(length=100)
    
    if not users:
        print("No users found in database.")
        return
    
    for i, user in enumerate(users, 1):
        print(f"\n{i}. Email: {user.get('email', 'N/A')}")
        print(f"   Name: {user.get('name', 'N/A')}")
        print(f"   Email Verified: {user.get('emailVerified', False)}")
        print(f"   Provider: {user.get('provider', 'N/A')}")
        print(f"   Active: {user.get('active', True)}")
        print(f"   Created: {user.get('createdAt', 'N/A')}")
        print(f"   ID: {user.get('_id')}")
    
    print(f"\nTotal users: {len(users)}")
    print("="*80 + "\n")
    
    client.close()
    return users


async def delete_user(email: str):
    """Delete user and associated data by email"""
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Find user
    user = await db.users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
    
    if not user:
        print(f"❌ User with email '{email}' not found.")
        client.close()
        return False
    
    user_id = user['_id']
    
    print(f"\n🗑️  Deleting user: {user.get('name')} ({email})")
    
    # Delete user document
    await db.users.delete_one({"_id": user_id})
    print("   ✅ User document deleted")
    
    # Delete profile
    profile_result = await db.profiles.delete_one({"userId": str(user_id)})
    if profile_result.deleted_count > 0:
        print("   ✅ Profile deleted")
    
    # Delete matches
    match_result = await db.matches.delete_many({
        "$or": [{"user1": str(user_id)}, {"user2": str(user_id)}]
    })
    if match_result.deleted_count > 0:
        print(f"   ✅ {match_result.deleted_count} matches deleted")
    
    # Delete swipes
    swipe_result = await db.swipes.delete_many({
        "$or": [{"userId": str(user_id)}, {"targetUserId": str(user_id)}]
    })
    if swipe_result.deleted_count > 0:
        print(f"   ✅ {swipe_result.deleted_count} swipes deleted")
    
    print(f"\n✅ User '{email}' completely deleted!\n")
    
    client.close()
    return True


async def delete_all_users():
    """Delete ALL users and their data"""
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Count users
    user_count = await db.users.count_documents({})
    
    if user_count == 0:
        print("No users to delete.")
        client.close()
        return
    
    print(f"\n⚠️  WARNING: This will delete ALL {user_count} users and their data!")
    confirm = input("Type 'DELETE ALL' to confirm: ")
    
    if confirm != "DELETE ALL":
        print("❌ Deletion cancelled.")
        client.close()
        return
    
    print("\n🗑️  Deleting all users...")
    
    # Delete all
    users_result = await db.users.delete_many({})
    profiles_result = await db.profiles.delete_many({})
    matches_result = await db.matches.delete_many({})
    swipes_result = await db.swipes.delete_many({})
    
    print(f"   ✅ {users_result.deleted_count} users deleted")
    print(f"   ✅ {profiles_result.deleted_count} profiles deleted")
    print(f"   ✅ {matches_result.deleted_count} matches deleted")
    print(f"   ✅ {swipes_result.deleted_count} swipes deleted")
    
    print("\n✅ All users deleted!\n")
    
    client.close()


async def main():
    """Main menu"""
    while True:
        print("\n" + "="*80)
        print("USER MANAGEMENT - CollabMatch")
        print("="*80)
        print("\n1. List all users")
        print("2. Delete specific user by email")
        print("3. Delete ALL users (⚠️  DANGER)")
        print("4. Exit")
        
        choice = input("\nChoose option (1-4): ").strip()
        
        if choice == "1":
            await list_users()
        
        elif choice == "2":
            email = input("Enter email to delete: ").strip()
            if email:
                await delete_user(email)
        
        elif choice == "3":
            await delete_all_users()
        
        elif choice == "4":
            print("\n👋 Goodbye!\n")
            break
        
        else:
            print("❌ Invalid option. Try again.")


if __name__ == "__main__":
    asyncio.run(main())

"""
Quick Setup Script - Photo Upload Feature
Verifies: Cloudinary config, database connection, test upload
"""
import asyncio
import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.config import settings
from app.db import init_db, close_db, get_db
from app.services.cloudinary import cloudinary_service


async def check_cloudinary_config():
    """Check Cloudinary configuration"""
    print("\n🔍 Checking Cloudinary Configuration...")
    
    if not settings.CLOUDINARY_CLOUD_NAME:
        print("❌ CLOUDINARY_CLOUD_NAME not set")
        return False
    
    if not settings.CLOUDINARY_API_KEY:
        print("❌ CLOUDINARY_API_KEY not set")
        return False
    
    if not settings.CLOUDINARY_API_SECRET:
        print("❌ CLOUDINARY_API_SECRET not set")
        return False
    
    print(f"✅ Cloud Name: {settings.CLOUDINARY_CLOUD_NAME}")
    print(f"✅ API Key: {settings.CLOUDINARY_API_KEY[:4]}...{settings.CLOUDINARY_API_KEY[-4:]}")
    print(f"✅ API Secret: {'*' * 8}")
    
    return True


async def test_cloudinary_connection():
    """Test Cloudinary API connection"""
    print("\n🔌 Testing Cloudinary Connection...")
    
    try:
        import cloudinary
        
        # Test API with ping
        result = cloudinary.api.ping()
        
        if result and result.get("status") == "ok":
            print("✅ Cloudinary connection successful!")
            return True
        else:
            print(f"❌ Cloudinary ping failed: {result}")
            return False
            
    except Exception as e:
        print(f"❌ Cloudinary connection error: {str(e)}")
        return False


async def test_file_validation():
    """Test file validation"""
    print("\n🧪 Testing File Validation...")
    
    # Create test JPEG data
    jpeg_data = b'\xff\xd8\xff\xe0' + b'\x00' * 1000
    
    result = cloudinary_service.validate_file(jpeg_data, "test.jpg")
    
    if result["valid"]:
        print("✅ File validation working")
        return True
    else:
        print(f"❌ File validation failed: {result['error']}")
        return False


async def test_database_connection():
    """Test MongoDB connection"""
    print("\n💾 Testing Database Connection...")
    
    try:
        await init_db()
        db = get_db()
        
        # Test ping
        await db.command("ping")
        
        print("✅ Database connection successful!")
        return True
        
    except Exception as e:
        print(f"❌ Database connection error: {str(e)}")
        return False
    finally:
        await close_db()


async def create_database_indexes():
    """Create required database indexes"""
    print("\n📊 Creating Database Indexes...")
    
    try:
        await init_db()
        db = get_db()
        
        # Upload logs index (TTL - auto delete after 1 hour)
        await db.upload_logs.create_index(
            [("userId", 1), ("uploadedAt", -1)],
            name="upload_logs_user_time"
        )
        
        await db.upload_logs.create_index(
            [("uploadedAt", 1)],
            expireAfterSeconds=3600,  # 1 hour
            name="upload_logs_ttl"
        )
        
        print("✅ Database indexes created")
        return True
        
    except Exception as e:
        print(f"❌ Index creation error: {str(e)}")
        return False
    finally:
        await close_db()


async def show_api_endpoints():
    """Show available API endpoints"""
    print("\n📡 Available API Endpoints:")
    print("\n  Upload Photo:")
    print("    POST   /upload/photo")
    print("    Headers: Authorization: Bearer <token>")
    print("    Body: multipart/form-data with 'file' field")
    print("\n  Delete Photo:")
    print("    DELETE /upload/photo")
    print("    Body: {\"publicId\": \"collabmatch/user/photo123\"}")
    print("\n  Get Photos:")
    print("    GET    /upload/photos")
    print("    Returns: Array of user's photos")


async def show_test_curl_commands():
    """Show test curl commands"""
    print("\n🧪 Test Commands:")
    print("\n  1. Get auth token:")
    print('    curl -X POST http://localhost:8080/auth/login \\')
    print('      -H "Content-Type: application/json" \\')
    print('      -d \'{"email":"test@example.com","password":"password"}\'')
    
    print("\n  2. Upload photo:")
    print('    curl -X POST http://localhost:8080/upload/photo \\')
    print('      -H "Authorization: Bearer YOUR_TOKEN" \\')
    print('      -F "file=@photo.jpg"')
    
    print("\n  3. Get photos:")
    print('    curl http://localhost:8080/upload/photos \\')
    print('      -H "Authorization: Bearer YOUR_TOKEN"')


async def main():
    """Main setup verification"""
    print("\n" + "="*60)
    print("  Photo Upload System - Setup Verification")
    print("="*60)
    
    all_passed = True
    
    # Check Cloudinary config
    if not await check_cloudinary_config():
        all_passed = False
        print("\n⚠️  Setup .env file with Cloudinary credentials:")
        print("   CLOUDINARY_CLOUD_NAME=your_cloud_name")
        print("   CLOUDINARY_API_KEY=your_api_key")
        print("   CLOUDINARY_API_SECRET=your_api_secret")
        print("\n   Get credentials from: https://cloudinary.com/console")
        return
    
    # Test Cloudinary connection
    if not await test_cloudinary_connection():
        all_passed = False
        print("\n⚠️  Check Cloudinary credentials in .env")
        return
    
    # Test file validation
    if not await test_file_validation():
        all_passed = False
    
    # Test database
    if not await test_database_connection():
        all_passed = False
        print("\n⚠️  Make sure MongoDB is running:")
        print("   docker-compose up -d mongo")
    
    # Create indexes
    if not await create_database_indexes():
        all_passed = False
    
    # Show results
    print("\n" + "="*60)
    if all_passed:
        print("✅ All checks passed! Photo upload system ready!")
        print("="*60)
        
        await show_api_endpoints()
        await show_test_curl_commands()
        
        print("\n📚 Full documentation: PHOTO_UPLOAD_GUIDE.md")
        print("\n🚀 Start server: uvicorn app.main:app --reload")
        
    else:
        print("❌ Some checks failed. Fix errors above.")
        print("="*60)
    
    print()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⏸️  Setup interrupted")
    except Exception as e:
        print(f"\n❌ Setup error: {str(e)}")
        import traceback
        traceback.print_exc()

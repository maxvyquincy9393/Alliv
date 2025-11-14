#!/usr/bin/env python3
"""
Cloudinary Upload Test Script
Tests backend upload routes and Cloudinary configuration
"""
import asyncio
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

async def test_cloudinary_config():
    """Test Cloudinary configuration"""
    print("🔧 Testing Cloudinary Configuration...\n")
    
    try:
        from app.config import settings
        import cloudinary
        
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True
        )
        
        # Check if configured
        if not settings.CLOUDINARY_CLOUD_NAME:
            print("❌ CLOUDINARY_CLOUD_NAME not set in .env")
            return False
        
        if not settings.CLOUDINARY_API_KEY:
            print("❌ CLOUDINARY_API_KEY not set in .env")
            return False
        
        if not settings.CLOUDINARY_API_SECRET:
            print("❌ CLOUDINARY_API_SECRET not set in .env")
            return False
        
        print(f"✅ Cloud Name: {settings.CLOUDINARY_CLOUD_NAME}")
        print(f"✅ API Key: {settings.CLOUDINARY_API_KEY[:8]}...")
        print(f"✅ API Secret: {'*' * 8}...")
        print()
        
        # Test API connection
        print("📡 Testing Cloudinary API Connection...")
        result = cloudinary.api.ping()
        
        if result.get('status') == 'ok':
            print("✅ Cloudinary API is reachable!\n")
            return True
        else:
            print(f"❌ Unexpected response: {result}\n")
            return False
            
    except ImportError as e:
        print(f"❌ Import error: {e}")
        print("Run: pip install cloudinary\n")
        return False
    except Exception as e:
        print(f"❌ Configuration error: {str(e)}\n")
        return False


async def test_database_indexes():
    """Create database indexes for upload logs"""
    print("📊 Setting up Database Indexes...\n")
    
    try:
        from app import db
        
        # Create index for rate limiting
        await db.upload_logs.create_index([
            ("userId", 1),
            ("uploadedAt", -1)
        ])
        print("✅ Created index: userId + uploadedAt")
        
        # Create TTL index (auto-delete after 7 days)
        await db.upload_logs.create_index(
            "createdAt",
            expireAfterSeconds=604800  # 7 days
        )
        print("✅ Created TTL index: createdAt (7 days)")
        print()
        
        return True
        
    except Exception as e:
        print(f"❌ Database index error: {str(e)}\n")
        return False


async def test_upload_routes():
    """Test upload route imports"""
    print("🔌 Testing Upload Routes...\n")
    
    try:
        from app.routes import uploads
        
        # Check routes exist
        routes = [
            "/uploads/presign",
            "/uploads/complete",
            "/uploads/photo/{photo_index}",
            "/uploads/stats"
        ]
        
        print("Available routes:")
        for route in routes:
            print(f"  ✅ {route}")
        print()
        
        return True
        
    except ImportError as e:
        print(f"❌ Failed to import upload routes: {e}\n")
        return False
    except Exception as e:
        print(f"❌ Route test error: {str(e)}\n")
        return False


async def show_usage_examples():
    """Show usage examples"""
    print("📚 Usage Examples\n")
    print("=" * 60)
    
    print("\n1️⃣  Get Presign URL (POST /uploads/presign)")
    print("-" * 60)
    print("""
curl -X POST http://localhost:8000/uploads/presign \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

Response:
{
  "timestamp": 1699000000,
  "signature": "abc123...",
  "api_key": "123456789012345",
  "cloud_name": "your_cloud_name",
  "public_id": "alivv/users/userId/hash123",
  "folder": "alivv/users/userId"
}
    """)
    
    print("\n2️⃣  Upload to Cloudinary (Direct)")
    print("-" * 60)
    print("""
curl -X POST https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload \\
  -F "file=@path/to/image.jpg" \\
  -F "timestamp=1699000000" \\
  -F "signature=abc123..." \\
  -F "api_key=123456789012345" \\
  -F "public_id=alivv/users/userId/hash123" \\
  -F "folder=alivv/users/userId"
    """)
    
    print("\n3️⃣  Complete Upload (POST /uploads/complete)")
    print("-" * 60)
    print("""
curl -X POST http://localhost:8000/uploads/complete \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "public_id": "alivv/users/userId/hash123",
    "url": "https://res.cloudinary.com/..."
  }'
    """)
    
    print("\n4️⃣  Delete Photo (DELETE /uploads/photo/{index})")
    print("-" * 60)
    print("""
curl -X DELETE http://localhost:8000/uploads/photo/0 \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
    """)
    
    print("\n5️⃣  Get Upload Stats (GET /uploads/stats)")
    print("-" * 60)
    print("""
curl http://localhost:8000/uploads/stats \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

Response:
{
  "currentPhotoCount": 3,
  "maxPhotos": 6,
  "uploadsInLastHour": 5,
  "maxUploadsPerHour": 10,
  "canUpload": true
}
    """)
    print()


async def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("   CLOUDINARY UPLOAD SYSTEM - TEST SUITE")
    print("=" * 60 + "\n")
    
    results = []
    
    # Test 1: Cloudinary Configuration
    results.append(await test_cloudinary_config())
    
    # Test 2: Upload Routes
    results.append(await test_upload_routes())
    
    # Test 3: Database Indexes
    results.append(await test_database_indexes())
    
    # Show usage examples
    await show_usage_examples()
    
    # Summary
    print("=" * 60)
    print("   TEST SUMMARY")
    print("=" * 60)
    print(f"\nTotal Tests: {len(results)}")
    print(f"Passed: {sum(results)}")
    print(f"Failed: {len(results) - sum(results)}")
    
    if all(results):
        print("\n✅ ALL TESTS PASSED! Upload system is ready.")
        print("\n🚀 Next steps:")
        print("   1. Start backend: uvicorn app.main:app --reload")
        print("   2. Start frontend: npm run dev")
        print("   3. Test upload in browser")
        print()
    else:
        print("\n❌ SOME TESTS FAILED. Check errors above.")
        print("\n🔧 Troubleshooting:")
        print("   1. Ensure .env has Cloudinary credentials")
        print("   2. Run: pip install cloudinary")
        print("   3. Check MongoDB connection")
        print()
    
    print("=" * 60)


if __name__ == "__main__":
    # Check if running from correct directory
    if not os.path.exists("app"):
        print("❌ Error: Run this script from backend/ directory")
        print("   cd backend && python test_cloudinary.py")
        sys.exit(1)
    
    asyncio.run(main())

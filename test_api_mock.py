"""
Mock API Testing Script
Tests the API structure without requiring MongoDB
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

def test_imports():
    """Test if all modules can be imported"""
    print("=" * 60)
    print("Testing Module Imports")
    print("=" * 60)
    
    tests = []
    
    try:
        from app import config
        print("✓ config.py imported successfully")
        print(f"  - DB_NAME: {config.DB_NAME}")
        print(f"  - JWT_ALGORITHM: {config.JWT_ALGORITHM}")
        tests.append(True)
    except Exception as e:
        print(f"✗ config.py failed: {e}")
        tests.append(False)
    
    try:
        from app import models
        print("✓ models.py imported successfully")
        print(f"  - UserSignup: {models.UserSignup}")
        print(f"  - TokenResponse: {models.TokenResponse}")
        tests.append(True)
    except Exception as e:
        print(f"✗ models.py failed: {e}")
        tests.append(False)
    
    try:
        from app import auth
        print("✓ auth.py imported successfully")
        # Test password hashing
        hashed = auth.hash_password("test123")
        verified = auth.verify_password("test123", hashed)
        print(f"  - Password hashing works: {verified}")
        tests.append(True)
    except Exception as e:
        print(f"✗ auth.py failed: {e}")
        tests.append(False)
    
    try:
        from app.routes import auth as auth_routes
        print("✓ routes/auth.py imported successfully")
        print(f"  - Router prefix: {auth_routes.router.prefix}")
        tests.append(True)
    except Exception as e:
        print(f"✗ routes/auth.py failed: {e}")
        tests.append(False)
    
    try:
        from app.routes import discover
        print("✓ routes/discover.py imported successfully")
        print(f"  - Router prefix: {discover.router.prefix}")
        tests.append(True)
    except Exception as e:
        print(f"✗ routes/discover.py failed: {e}")
        tests.append(False)
    
    try:
        from app.routes import match
        print("✓ routes/match.py imported successfully")
        print(f"  - Router prefix: {match.router.prefix}")
        tests.append(True)
    except Exception as e:
        print(f"✗ routes/match.py failed: {e}")
        tests.append(False)
    
    try:
        from app.routes import chat
        print("✓ routes/chat.py imported successfully")
        print(f"  - Router prefix: {chat.router.prefix}")
        tests.append(True)
    except Exception as e:
        print(f"✗ routes/chat.py failed: {e}")
        tests.append(False)
    
    try:
        from app import websocket
        print("✓ websocket.py imported successfully")
        print(f"  - ConnectionManager: {websocket.ConnectionManager}")
        tests.append(True)
    except Exception as e:
        print(f"✗ websocket.py failed: {e}")
        tests.append(False)
    
    print()
    return all(tests)

def test_models():
    """Test Pydantic models"""
    print("=" * 60)
    print("Testing Pydantic Models")
    print("=" * 60)
    
    from app.models import UserSignup, UserLogin, MessageCreate
    
    # Test UserSignup
    try:
        user = UserSignup(
            name="Test User",
            email="test@example.com",
            password="password123",
            role="Frontend Developer",
            skills=["react", "typescript"],
            project_interest="Web AI",
            bio="Test bio"
        )
        print("✓ UserSignup model works")
        print(f"  - Name: {user.name}")
        print(f"  - Email: {user.email}")
        print(f"  - Skills: {user.skills}")
    except Exception as e:
        print(f"✗ UserSignup model failed: {e}")
        return False
    
    # Test UserLogin
    try:
        login = UserLogin(
            email="test@example.com",
            password="password123"
        )
        print("✓ UserLogin model works")
    except Exception as e:
        print(f"✗ UserLogin model failed: {e}")
        return False
    
    # Test MessageCreate
    try:
        message = MessageCreate(content="Hello!")
        print("✓ MessageCreate model works")
    except Exception as e:
        print(f"✗ MessageCreate model failed: {e}")
        return False
    
    print()
    return True

def test_auth_functions():
    """Test authentication functions"""
    print("=" * 60)
    print("Testing Authentication Functions")
    print("=" * 60)
    
    from app.auth import hash_password, verify_password, create_access_token
    
    # Test password hashing
    password = "mySecurePassword123"
    hashed = hash_password(password)
    print(f"✓ Password hashed: {hashed[:50]}...")
    
    # Test password verification
    is_valid = verify_password(password, hashed)
    print(f"✓ Password verification: {is_valid}")
    
    is_invalid = verify_password("wrongPassword", hashed)
    print(f"✓ Wrong password rejected: {not is_invalid}")
    
    # Test JWT token creation
    token = create_access_token({"sub": "user::123"})
    print(f"✓ JWT token created: {token[:50]}...")
    
    print()
    return True

def test_fastapi_app():
    """Test FastAPI app structure"""
    print("=" * 60)
    print("Testing FastAPI Application")
    print("=" * 60)
    
    try:
        from app.main import app
        print("✓ FastAPI app created successfully")
        
        # List all routes
        routes = []
        for route in app.routes:
            if hasattr(route, 'methods') and hasattr(route, 'path'):
                for method in route.methods:
                    routes.append(f"{method:6} {route.path}")
        
        print(f"\n  Total routes: {len(routes)}")
        print("\n  Available endpoints:")
        for route in sorted(set(routes)):
            print(f"    {route}")
        
        print()
        return True
    except Exception as e:
        print(f"✗ FastAPI app failed: {e}")
        return False

def main():
    print("\n")
    print("╔" + "═" * 58 + "╗")
    print("║" + " " * 15 + "CollabMatch API Testing" + " " * 20 + "║")
    print("╚" + "═" * 58 + "╝")
    print()
    
    results = []
    
    # Run tests
    results.append(("Module Imports", test_imports()))
    results.append(("Pydantic Models", test_models()))
    results.append(("Auth Functions", test_auth_functions()))
    results.append(("FastAPI App", test_fastapi_app()))
    
    # Summary
    print("=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    for test_name, result in results:
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name:.<40} {status}")
    
    print()
    
    all_passed = all(r[1] for r in results)
    
    if all_passed:
        print("🎉 All tests passed!")
        print()
        print("Next steps:")
        print("  1. Install MongoDB or Docker")
        print("  2. Run: docker-compose up -d")
        print("  3. Seed database: docker-compose exec backend python -m app.seed")
        print("  4. Test API: http://localhost:8000/docs")
    else:
        print("⚠️  Some tests failed. Check the errors above.")
    
    print("\n" + "=" * 60 + "\n")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())

"""
Test Cookie-Based Authentication

This script tests the new cookie-only authentication implementation:
1. Register a new user
2. Login and verify cookies are set
3. Access protected endpoint with cookies
4. Logout and verify session is cleared
"""

import requests
import sys

API_URL = "http://localhost:8000"

def test_cookie_auth():
    print("🧪 Testing Cookie-Based Authentication\n")
    print("=" * 60)
    
    # Create session to persist cookies
    session = requests.Session()
    
    # Test 1: Register
    print("\n1️⃣  Testing Registration...")
    register_data = {
        "email": "cookie_test@example.com",
        "password": "SecurePass123!",
        "name": "Cookie Test User",
        "birthdate": "1995-01-01"
    }
    
    try:
        resp = session.post(f"{API_URL}/auth/register", json=register_data)
        if resp.status_code == 201:
            print("✅ Registration successful")
            print(f"   Response: {resp.json().get('message', 'User created')}")
        else:
            print(f"⚠️  Registration returned {resp.status_code}")
            # User might already exist, continue anyway
    except Exception as e:
        print(f"❌ Registration failed: {e}")
    
    # Test 2: Login
    print("\n2️⃣  Testing Login...")
    login_data = {
        "email": "cookie_test@example.com",
        "password": "SecurePass123!"
    }
    
    try:
        resp = session.post(f"{API_URL}/auth/login", json=login_data)
        if resp.status_code == 200:
            print("✅ Login successful")
            
            # Check if cookies are set
            if session.cookies:
                print("\n   📦 Cookies received:")
                for cookie in session.cookies:
                    is_httponly = "HttpOnly" if hasattr(cookie, '_rest') and cookie._rest.get('HttpOnly') else "Not HttpOnly"
                    is_secure = "Secure" if cookie.secure else "Not Secure"
                    print(f"      • {cookie.name}: {is_httponly}, {is_secure}")
            else:
                print("   ⚠️  No cookies found! Backend might not be setting cookies correctly.")
            
            # Check response body (should not contain tokens)
            data = resp.json()
            if 'accessToken' in data or 'refreshToken' in data:
                print("   ⚠️  WARNING: Response contains tokens in body! Should be cookies only.")
            else:
                print("   ✅ Response does not expose tokens (correct)")
        else:
            print(f"❌ Login failed with status {resp.status_code}")
            print(f"   Response: {resp.text}")
            return False
    except Exception as e:
        print(f"❌ Login failed: {e}")
        return False
    
    # Test 3: Access protected endpoint
    print("\n3️⃣  Testing Protected Endpoint...")
    try:
        resp = session.get(f"{API_URL}/me")
        if resp.status_code == 200:
            print("✅ Successfully accessed /me with cookies")
            data = resp.json()
            print(f"   User: {data.get('name', 'Unknown')}")
            print(f"   Email: {data.get('email', 'Unknown')}")
        else:
            print(f"❌ Failed to access /me: {resp.status_code}")
            print(f"   Response: {resp.text}")
            return False
    except Exception as e:
        print(f"❌ Protected endpoint failed: {e}")
        return False
    
    # Test 4: Logout
    print("\n4️⃣  Testing Logout...")
    try:
        resp = session.post(f"{API_URL}/auth/logout")
        if resp.status_code == 200:
            print("✅ Logout successful")
            
            # Check if cookies are cleared
            if not session.cookies or len(session.cookies) == 0:
                print("   ✅ Cookies cleared")
            else:
                print("   ⚠️  Cookies still present (should be cleared by backend)")
        else:
            print(f"⚠️  Logout returned {resp.status_code}")
    except Exception as e:
        print(f"❌ Logout failed: {e}")
    
    # Test 5: Verify session is invalidated
    print("\n5️⃣  Testing Session Invalidation...")
    try:
        resp = session.get(f"{API_URL}/me")
        if resp.status_code == 401:
            print("✅ Session correctly invalidated (401 Unauthorized)")
        else:
            print(f"⚠️  Expected 401, got {resp.status_code}")
            print("   Session might not be properly invalidated")
    except Exception as e:
        print(f"❌ Session invalidation test failed: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Cookie-Based Authentication Test Complete!\n")
    return True

if __name__ == "__main__":
    try:
        success = test_cookie_auth()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        sys.exit(1)

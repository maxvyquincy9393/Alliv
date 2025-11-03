"""
Comprehensive Feature Test Suite
Tests all features of COLABMATCH backend
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend', 'app'))

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import httpx
from datetime import datetime
import json

class FeatureTester:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.test_user_email = f"test_{datetime.now().timestamp()}@test.com"
        self.test_user_password = "Test123!@#"
        self.access_token = None
        self.user_id = None
        self.results = {"passed": [], "failed": [], "skipped": []}
    
    def print_test(self, name, status, details=""):
        symbols = {"PASS": "✓", "FAIL": "✗", "SKIP": "⊘"}
        colors = {"PASS": "\033[92m", "FAIL": "\033[91m", "SKIP": "\033[93m"}
        reset = "\033[0m"
        
        symbol = symbols.get(status, "•")
        color = colors.get(status, "")
        print(f"{color}{symbol} {name}{reset}")
        if details:
            print(f"    {details}")
        
        if status == "PASS":
            self.results["passed"].append(name)
        elif status == "FAIL":
            self.results["failed"].append(name)
        else:
            self.results["skipped"].append(name)
    
    async def test_health_endpoint(self):
        """Test 1: Health Check Endpoint"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/health")
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "healthy":
                        self.print_test("Health Check", "PASS", f"Status: {data}")
                        return True
                self.print_test("Health Check", "FAIL", f"Status code: {response.status_code}")
                return False
        except Exception as e:
            self.print_test("Health Check", "FAIL", f"Error: {str(e)}")
            return False
    
    async def test_registration(self):
        """Test 2: User Registration"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "email": self.test_user_email,
                    "password": self.test_user_password,
                    "name": "Test User",
                    "birthdate": "1995-01-01"
                }
                response = await client.post(f"{self.base_url}/auth/register", json=payload)
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    if "access_token" in data or "user" in data:
                        self.user_id = data.get("user", {}).get("id") or data.get("userId")
                        self.print_test("User Registration", "PASS", f"User ID: {self.user_id}")
                        return True
                elif response.status_code == 400 and "already exists" in response.text:
                    self.print_test("User Registration", "SKIP", "User already exists (OK)")
                    return True
                
                self.print_test("User Registration", "FAIL", f"Status: {response.status_code}, Body: {response.text[:100]}")
                return False
        except Exception as e:
            self.print_test("User Registration", "FAIL", f"Error: {str(e)}")
            return False
    
    async def test_login(self):
        """Test 3: User Login"""
        try:
            async with httpx.AsyncClient() as client:
                payload = {
                    "email": self.test_user_email,
                    "password": self.test_user_password
                }
                response = await client.post(f"{self.base_url}/auth/login", json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    if "access_token" in data:
                        self.access_token = data["access_token"]
                        self.print_test("User Login", "PASS", "Token received")
                        return True
                
                self.print_test("User Login", "FAIL", f"Status: {response.status_code}, Body: {response.text[:100]}")
                return False
        except Exception as e:
            self.print_test("User Login", "FAIL", f"Error: {str(e)}")
            return False
    
    async def test_get_profile(self):
        """Test 4: Get User Profile"""
        if not self.access_token:
            self.print_test("Get Profile", "SKIP", "No access token")
            return False
        
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {self.access_token}"}
                response = await client.get(f"{self.base_url}/me", headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if "email" in data:
                        self.print_test("Get Profile", "PASS", f"Email: {data['email']}")
                        return True
                
                self.print_test("Get Profile", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_test("Get Profile", "FAIL", f"Error: {str(e)}")
            return False
    
    async def test_update_profile(self):
        """Test 5: Update User Profile"""
        if not self.access_token:
            self.print_test("Update Profile", "SKIP", "No access token")
            return False
        
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {self.access_token}"}
                payload = {
                    "bio": "Updated bio from test",
                    "interests": ["coding", "design"],
                    "skills": ["Python", "React"]
                }
                response = await client.put(f"{self.base_url}/me", json=payload, headers=headers)
                
                if response.status_code in [200, 204]:
                    self.print_test("Update Profile", "PASS", "Profile updated")
                    return True
                
                self.print_test("Update Profile", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_test("Update Profile", "FAIL", f"Error: {str(e)}")
            return False
    
    async def test_email_verification_request(self):
        """Test 6: Request Email Verification"""
        if not self.access_token:
            self.print_test("Email Verification Request", "SKIP", "No access token")
            return False
        
        try:
            async with httpx.AsyncClient() as client:
                headers = {"Authorization": f"Bearer {self.access_token}"}
                response = await client.post(f"{self.base_url}/auth/verify/request", headers=headers)
                
                if response.status_code in [200, 201]:
                    self.print_test("Email Verification Request", "PASS", "Verification email sent")
                    return True
                elif response.status_code == 400:
                    self.print_test("Email Verification Request", "SKIP", "Already verified or pending")
                    return True
                
                self.print_test("Email Verification Request", "FAIL", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_test("Email Verification Request", "FAIL", f"Error: {str(e)}")
            return False
    
    async def test_mongodb_connection(self):
        """Test 7: MongoDB Connection"""
        try:
            client = AsyncIOMotorClient("mongodb://localhost:27017")
            db = client.alliv
            
            # Try to ping
            await client.admin.command('ping')
            
            # Count users
            count = await db.users.count_documents({})
            
            self.print_test("MongoDB Connection", "PASS", f"Connected, {count} users in DB")
            return True
        except Exception as e:
            self.print_test("MongoDB Connection", "FAIL", f"Error: {str(e)}")
            return False
    
    async def test_jwt_token_validation(self):
        """Test 8: JWT Token Validation"""
        try:
            from auth import create_access_token, verify_access_token
            
            # Create token
            test_data = {"sub": "test_user_id", "email": "test@test.com"}
            token = create_access_token(test_data)
            
            # Verify token
            decoded = verify_access_token(token)
            
            if decoded and decoded.get("sub") == "test_user_id":
                self.print_test("JWT Token Validation", "PASS", "Token created and verified")
                return True
            else:
                self.print_test("JWT Token Validation", "FAIL", "Token verification failed")
                return False
        except Exception as e:
            self.print_test("JWT Token Validation", "FAIL", f"Error: {str(e)}")
            return False
    
    async def test_password_hashing(self):
        """Test 9: Password Hashing"""
        try:
            from auth import hash_password, verify_password
            
            test_password = "TestPassword123!"
            hashed = hash_password(test_password)
            
            # Verify correct password
            if verify_password(test_password, hashed):
                # Verify incorrect password fails
                if not verify_password("WrongPassword", hashed):
                    self.print_test("Password Hashing", "PASS", "Hash and verify working")
                    return True
            
            self.print_test("Password Hashing", "FAIL", "Verification logic failed")
            return False
        except Exception as e:
            self.print_test("Password Hashing", "FAIL", f"Error: {str(e)}")
            return False
    
    async def test_config_validation(self):
        """Test 10: Configuration Validation"""
        try:
            from config_validated import settings
            
            # Check critical settings
            checks = []
            checks.append(len(settings.JWT_ACCESS_SECRET) >= 32)
            checks.append(len(settings.JWT_REFRESH_SECRET) >= 32)
            checks.append(settings.MONGO_URI.startswith("mongodb"))
            checks.append(settings.NODE_ENV in ["development", "staging", "production"])
            
            if all(checks):
                self.print_test("Config Validation", "PASS", f"Environment: {settings.NODE_ENV}")
                return True
            else:
                self.print_test("Config Validation", "FAIL", "Some config checks failed")
                return False
        except Exception as e:
            self.print_test("Config Validation", "FAIL", f"Error: {str(e)}")
            return False
    
    def print_summary(self):
        """Print test summary"""
        total = len(self.results["passed"]) + len(self.results["failed"]) + len(self.results["skipped"])
        passed = len(self.results["passed"])
        failed = len(self.results["failed"])
        skipped = len(self.results["skipped"])
        
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total:   {total}")
        print(f"\033[92mPassed:  {passed}\033[0m")
        print(f"\033[91mFailed:  {failed}\033[0m")
        print(f"\033[93mSkipped: {skipped}\033[0m")
        
        if failed > 0:
            print("\n\033[91mFailed tests:\033[0m")
            for test in self.results["failed"]:
                print(f"  • {test}")
        
        success_rate = (passed / total * 100) if total > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("\n\033[92m✓ OVERALL: GOOD\033[0m")
        elif success_rate >= 60:
            print("\n\033[93m⚠ OVERALL: NEEDS IMPROVEMENT\033[0m")
        else:
            print("\n\033[91m✗ OVERALL: CRITICAL ISSUES\033[0m")
        
        print("="*60 + "\n")
        
        return failed == 0

async def main():
    print("\033[1m" + "="*60)
    print("COMPREHENSIVE FEATURE TEST SUITE")
    print("COLABMATCH - Testing All Features")
    print("="*60 + "\033[0m\n")
    
    tester = FeatureTester()
    
    print("Starting tests...\n")
    
    # Run all tests
    await tester.test_config_validation()
    await tester.test_jwt_token_validation()
    await tester.test_password_hashing()
    await tester.test_mongodb_connection()
    await tester.test_health_endpoint()
    await tester.test_registration()
    await tester.test_login()
    await tester.test_get_profile()
    await tester.test_update_profile()
    await tester.test_email_verification_request()
    
    # Print summary
    all_passed = tester.print_summary()
    
    if not all_passed:
        print("\033[93mNote: Some tests may fail if backend server is not running.\033[0m")
        print("Start backend with: python -m uvicorn app.main:app --reload --port 8000\n")
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n\033[93m⚠ Interrupted by user\033[0m")
        sys.exit(1)
    except Exception as e:
        print(f"\n\033[91m✗ Fatal error: {e}\033[0m")
        import traceback
        traceback.print_exc()
        sys.exit(1)

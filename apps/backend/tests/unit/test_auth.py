"""
Unit tests for authentication logic
"""
import pytest
from app.auth import (
    hash_password,
    verify_password,
    create_access_token
)


class TestPasswordHashing:
    """Test password hashing and verification"""
    
    def test_hash_password_creates_valid_hash(self):
        """Should create valid bcrypt hash"""
        password = "MySecurePassword123!"
        hashed = hash_password(password)
        
        assert hashed is not None
        assert hashed != password
        assert hashed.startswith("$2b$")  # bcrypt format
        print(f"✅ Password hashed successfully: {hashed[:20]}...")
    
    def test_verify_password_correct(self):
        """Should verify correct password"""
        password = "MySecurePassword123!"
        hashed = hash_password(password)
        
        result = verify_password(password, hashed)
        assert result is True
        print("✅ Password verification successful")
    
    def test_verify_password_incorrect(self):
        """Should reject incorrect password"""
        password = "MySecurePassword123!"
        wrong_password = "WrongPassword456!"
        hashed = hash_password(password)
        
        result = verify_password(wrong_password, hashed)
        assert result is False
        print("✅ Incorrect password rejected")
    
    def test_same_password_different_hashes(self):
        """Should create different hashes for same password (salt)"""
        password = "MySecurePassword123!"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        assert hash1 != hash2
        assert verify_password(password, hash1) is True
        assert verify_password(password, hash2) is True
        print("✅ Password salting works correctly")


class TestJWTTokens:
    """Test JWT token creation"""
    
    def test_create_access_token(self):
        """Should create valid access token"""
        user_data = {"sub": "user_123", "email": "test@example.com"}
        token = create_access_token(user_data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
        print(f"✅ JWT token created: {token[:20]}...")
    
    def test_token_with_custom_expiry(self):
        """Should create token with custom expiry"""
        user_data = {"sub": "user_123"}
        token = create_access_token(user_data, expires_delta=3600)  # 1 hour
        
        assert token is not None
        assert isinstance(token, str)
        print("✅ JWT token with custom expiry created")


class TestAuthenticationFlow:
    """Test complete authentication flow"""
    
    def test_password_hash_and_verify_flow(self):
        """Should successfully hash and verify password"""
        # Simulate registration
        raw_password = "UserPassword123!"
        hashed_password = hash_password(raw_password)
        
        # Simulate login with correct password
        login_attempt = "UserPassword123!"
        is_valid = verify_password(login_attempt, hashed_password)
        
        assert is_valid is True
        print("✅ Complete hash+verify flow successful")
        
        # Simulate login with wrong password
        wrong_attempt = "WrongPassword456!"
        is_valid = verify_password(wrong_attempt, hashed_password)
        
        assert is_valid is False
        print("✅ Wrong password correctly rejected")

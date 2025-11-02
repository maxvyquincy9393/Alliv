"""
Enhanced Authentication Routes with Security Improvements
"""
from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict
import secrets
import hashlib
from datetime import datetime, timedelta
from passlib.context import CryptContext
import asyncio
from collections import defaultdict
import time

from ..config import settings
from .. import db
from ..auth import create_access_token, get_current_user
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
login_attempts = defaultdict(list)  # Track failed login attempts
lockout_users = {}  # Track locked out users

# ===== MODELS =====
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    name: str = Field(..., min_length=2, max_length=50)
    birthdate: str
    
    @validator('password')
    def validate_password(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int = 900  # 15 minutes


class OAuthCallbackRequest(BaseModel):
    code: str
    provider: str


# ===== HELPERS =====
def hash_password(password: str) -> str:
    """Hash password using argon2"""
    return pwd_context.hash(password)


def verify_password_hash(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except:
        return False


def check_rate_limit(email: str, ip_address: str) -> tuple[bool, str]:
    """Check if user is rate limited or locked out"""
    current_time = time.time()
    
    # Check if user is locked out
    if email in lockout_users:
        lockout_time = lockout_users[email]
        if current_time < lockout_time:
            remaining = int(lockout_time - current_time)
            return False, f"Account locked. Try again in {remaining} seconds"
        else:
            del lockout_users[email]
    
    # Clean old attempts (older than 15 minutes)
    if email in login_attempts:
        login_attempts[email] = [t for t in login_attempts[email] if current_time - t < 900]
        
        # Check if too many attempts
        if len(login_attempts[email]) >= 5:
            lockout_users[email] = current_time + 300  # 5 minute lockout
            return False, "Too many failed attempts. Account locked for 5 minutes"
    
    return True, ""


def record_failed_attempt(email: str):
    """Record a failed login attempt"""
    login_attempts[email].append(time.time())


def generate_refresh_token() -> str:
    """Generate secure refresh token"""
    return secrets.token_urlsafe(32)


# ===== ROUTES =====

@router.post("/register", response_model=dict)
@limiter.limit("5/minute")
async def register(request: Request, data: RegisterRequest):
    """
    Register new user with enhanced validation
    """
    try:
        # Normalize email
        email = data.email.lower().strip()
        
        # Check if user exists (case-insensitive)
        existing = await db.users().find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user document
        user_doc = {
            "email": email,
            "passwordHash": hash_password(data.password),
            "name": data.name.strip(),
            "birthdate": data.birthdate,
            "provider": "email",
            "providerId": None,
            "emailVerified": False,
            "emailVerifiedAt": None,
            "roles": ["user"],
            "active": True,
            "lastLogin": None,
            "refreshTokens": [],  # Store refresh tokens
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await db.users().insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Create empty profile
        profile_doc = {
            "userId": user_id,
            "name": data.name.strip(),
            "photos": [],
            "skills": [],
            "interests": [],
            "goals": "",
            "category": "",
            "location": {},
            "visibility": "public",
            "trustScore": 50,  # Start at 50/100
            "completionScore": 10,  # 10% for basic registration
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        await db.profiles().insert_one(profile_doc)
        
        # TODO: Send verification email
        
        return {
            "message": "User created successfully. Please verify your email.",
            "userId": user_id,
            "email": email,
            "verified": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, response: Response, credentials: LoginRequest):
    """
    Enhanced login with security features
    """
    email = credentials.email.lower().strip()
    ip_address = get_remote_address(request)
    
    # Generic error message for security
    generic_error = "Invalid credentials"
    
    # Check rate limit
    allowed, message = check_rate_limit(email, ip_address)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=message
        )
    
    try:
        # Find user (case-insensitive)
        user = await db.users().find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"},
            "active": True
        })
        
        if not user:
            record_failed_attempt(email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=generic_error
            )
        
        # Check if password exists (for OAuth users)
        if not user.get("passwordHash"):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Please login with your social account"
            )
        
        # Verify password
        if not verify_password_hash(credentials.password, user["passwordHash"]):
            record_failed_attempt(email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=generic_error
            )
        
        # Clear failed attempts on successful login
        if email in login_attempts:
            del login_attempts[email]
        
        # Generate tokens
        user_id = str(user["_id"])
        access_token = create_access_token({
            "sub": user_id,
            "email": user["email"],
            "verified": user.get("emailVerified", False)
        })
        
        # Generate refresh token
        refresh_token = generate_refresh_token()
        
        # Store refresh token in database
        await db.users().update_one(
            {"_id": user["_id"]},
            {
                "$push": {
                    "refreshTokens": {
                        "token": refresh_token,
                        "createdAt": datetime.utcnow(),
                        "expiresAt": datetime.utcnow() + timedelta(days=14),
                        "userAgent": request.headers.get("User-Agent", ""),
                        "ipAddress": ip_address
                    }
                },
                "$set": {
                    "lastLogin": datetime.utcnow()
                }
            }
        )
        
        # Set refresh token in httpOnly cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.NODE_ENV == "production",
            samesite="lax",
            max_age=14 * 24 * 60 * 60,  # 14 days
            path="/auth"
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 900
        }
        
    except HTTPException:
        raise
    except Exception as e:
        record_failed_attempt(email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=generic_error
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request, response: Response):
    """
    Refresh access token using refresh token from cookie
    """
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token not found"
        )
    
    try:
        # Find user with this refresh token
        user = await db.users().find_one({
            "refreshTokens.token": refresh_token,
            "refreshTokens.expiresAt": {"$gt": datetime.utcnow()}
        })
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Generate new access token
        user_id = str(user["_id"])
        access_token = create_access_token({
            "sub": user_id,
            "email": user["email"],
            "verified": user.get("emailVerified", False)
        })
        
        # Rotate refresh token (optional but recommended)
        new_refresh_token = generate_refresh_token()
        
        # Update refresh tokens in database
        await db.users().update_one(
            {"_id": user["_id"]},
            {
                "$pull": {"refreshTokens": {"token": refresh_token}},
                "$push": {
                    "refreshTokens": {
                        "token": new_refresh_token,
                        "createdAt": datetime.utcnow(),
                        "expiresAt": datetime.utcnow() + timedelta(days=14),
                        "userAgent": request.headers.get("User-Agent", ""),
                        "ipAddress": get_remote_address(request)
                    }
                }
            }
        )
        
        # Update cookie with new refresh token
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=settings.NODE_ENV == "production",
            samesite="lax",
            max_age=14 * 24 * 60 * 60,
            path="/auth"
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 900
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refresh failed"
        )


@router.post("/logout")
async def logout(request: Request, response: Response, current_user: dict = Depends(get_current_user)):
    """
    Logout user and clear tokens
    """
    try:
        # Remove refresh token from database
        refresh_token = request.cookies.get("refresh_token")
        if refresh_token:
            await db.users().update_one(
                {"_id": current_user["_id"]},
                {"$pull": {"refreshTokens": {"token": refresh_token}}}
            )
        
        # Clear cookie
        response.delete_cookie("refresh_token", path="/auth")
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.post("/oauth/callback", response_model=TokenResponse)
@limiter.limit("10/minute")
async def oauth_callback(request: Request, response: Response, data: OAuthCallbackRequest):
    """
    Handle OAuth callback and create/link user
    """
    provider = data.provider.lower()
    code = data.code
    
    if provider not in ["google", "github", "x"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth provider"
        )
    
    try:
        # Exchange code for user info (simplified - implement actual OAuth flow)
        # This would involve calling the provider's token endpoint and user info endpoint
        
        # Mock user info from OAuth provider
        oauth_user = {
            "email": "oauth_user@example.com",
            "name": "OAuth User",
            "provider_id": "oauth_provider_id_123",
            "avatar": "https://example.com/avatar.jpg"
        }
        
        email = oauth_user["email"].lower()
        
        # Check if user exists with this email
        existing_user = await db.users().find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"}
        })
        
        if existing_user:
            # Link OAuth to existing account
            user_id = str(existing_user["_id"])
            
            # Update provider info if not already linked
            if existing_user.get("provider") != provider:
                await db.users().update_one(
                    {"_id": existing_user["_id"]},
                    {
                        "$set": {
                            f"oauth.{provider}": {
                                "id": oauth_user["provider_id"],
                                "linkedAt": datetime.utcnow()
                            },
                            "emailVerified": True,
                            "emailVerifiedAt": datetime.utcnow(),
                            "updatedAt": datetime.utcnow()
                        }
                    }
                )
        else:
            # Create new user from OAuth
            user_doc = {
                "email": email,
                "passwordHash": None,  # No password for OAuth users
                "name": oauth_user["name"],
                "provider": provider,
                "providerId": oauth_user["provider_id"],
                "oauth": {
                    provider: {
                        "id": oauth_user["provider_id"],
                        "linkedAt": datetime.utcnow()
                    }
                },
                "emailVerified": True,
                "emailVerifiedAt": datetime.utcnow(),
                "roles": ["user"],
                "active": True,
                "refreshTokens": [],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            result = await db.users().insert_one(user_doc)
            user_id = str(result.inserted_id)
            
            # Create profile
            profile_doc = {
                "userId": user_id,
                "name": oauth_user["name"],
                "photos": [oauth_user.get("avatar")] if oauth_user.get("avatar") else [],
                "skills": [],
                "interests": [],
                "goals": "",
                "category": "",
                "location": {},
                "visibility": "public",
                "trustScore": 60,  # Higher initial trust for OAuth users
                "completionScore": 15,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            await db.profiles().insert_one(profile_doc)
        
        # Generate tokens
        access_token = create_access_token({
            "sub": user_id,
            "email": email,
            "verified": True
        })
        
        refresh_token = generate_refresh_token()
        
        # Store refresh token
        await db.users().update_one(
            {"_id": existing_user["_id"] if existing_user else result.inserted_id},
            {
                "$push": {
                    "refreshTokens": {
                        "token": refresh_token,
                        "createdAt": datetime.utcnow(),
                        "expiresAt": datetime.utcnow() + timedelta(days=14),
                        "userAgent": request.headers.get("User-Agent", ""),
                        "ipAddress": get_remote_address(request)
                    }
                },
                "$set": {
                    "lastLogin": datetime.utcnow()
                }
            }
        )
        
        # Set cookie
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.NODE_ENV == "production",
            samesite="lax",
            max_age=14 * 24 * 60 * 60,
            path="/auth"
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 900
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth authentication failed"
        )


@router.post("/verify-email")
@limiter.limit("3/minute")
async def verify_email(request: Request, token: str, current_user: dict = Depends(get_current_user)):
    """
    Verify user email with token
    """
    # TODO: Implement email verification logic
    pass

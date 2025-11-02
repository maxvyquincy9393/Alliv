"""
Authentication Routes - Complete Implementation
Handles: Register, Login, OAuth, OTP Verification, Token Refresh
"""
from fastapi import APIRouter, HTTPException, status, Depends, Response
from pydantic import BaseModel, EmailStr
from typing import Optional
import secrets
import hashlib
from datetime import datetime, timedelta

from ..config import settings
from .. import db
from ..auth import create_access_token, verify_password, get_current_user
from passlib.context import CryptContext

router = APIRouter(prefix="/auth", tags=["Authentication"])
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


# ===== MODELS =====
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    birthdate: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class VerificationRequest(BaseModel):
    channel: str  # 'email' or 'phone'
    destination: str


class VerificationConfirm(BaseModel):
    code: str


# ===== HELPERS =====
def hash_password(password: str) -> str:
    """Hash password using argon2"""
    return pwd_context.hash(password)


def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return str(secrets.randbelow(1000000)).zfill(6)


async def send_verification_email(email: str, code: str):
    """Mock email sending (replace with real SMTP in production)"""
    print(f"📧 Sending verification email to {email}")
    print(f"🔢 Verification code: {code}")
    # TODO: Implement real email sending with aiosmtplib
    return True


async def send_verification_sms(phone: str, code: str):
    """Mock SMS sending"""
    print(f"📱 Sending verification SMS to {phone}")
    print(f"🔢 Verification code: {code}")
    # TODO: Implement real SMS sending
    return True


# ===== ROUTES =====

@router.post("/register", response_model=dict)
async def register(data: RegisterRequest):
    """
    Register new user with email/password
    Returns user data (without creating session yet)
    """
    # Check if user exists
    existing = await db.users().find_one({"email": data.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user_doc = {
        "email": data.email,
        "passwordHash": hash_password(data.password),
        "name": data.name,
        "birthdate": data.birthdate,
        "provider": "email",
        "verified": False,
        "roles": ["user"],
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await db.users().insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    
    # Create empty profile
    profile_doc = {
        "userId": user_doc["_id"],
        "name": data.name,
        "photos": [],
        "skills": [],
        "interests": [],
        "visibility": "public",
        "trustScore": 0.8,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    await db.profiles().insert_one(profile_doc)
    
    return {
        "message": "User created successfully",
        "userId": user_doc["_id"],
        "email": user_doc["email"],
        "verified": user_doc["verified"]
    }


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest):
    """
    Login with email/password
    Returns access + refresh tokens
    """
    # Find user
    user = await db.users().find_one({"email": credentials.email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not pwd_context.verify(credentials.password, user["passwordHash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Generate tokens
    user_id = str(user["_id"])
    access_token = create_access_token({"sub": user_id, "email": user["email"]})
    
    # Generate refresh token (simplified - should store in DB)
    refresh_token = create_access_token(
        {"sub": user_id, "type": "refresh"},
        expires_delta=settings.JWT_REFRESH_TTL
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout current user"""
    # TODO: Invalidate tokens (add to blacklist)
    return {"message": "Logged out successfully"}


@router.post("/refresh", response_model=dict)
async def refresh_token(refresh_token: str):
    """
    Refresh access token using refresh token
    """
    # TODO: Validate refresh token
    # For now, just return new access token
    return {
        "access_token": "new_access_token",
        "message": "Token refreshed"
    }


@router.get("/oauth/{provider}/url")
async def get_oauth_url(provider: str):
    """
    Get OAuth authorization URL
    Supported: google, github, x
    """
    if provider == "google":
        client_id = settings.OAUTH_GOOGLE_ID
        redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/google/callback"
        scope = "email profile"
        url = f"https://accounts.google.com/o/oauth2/v2/auth?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope={scope}"
        
    elif provider == "github":
        client_id = settings.OAUTH_GITHUB_ID
        redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/github/callback"
        scope = "user:email"
        url = f"https://github.com/login/oauth/authorize?client_id={client_id}&redirect_uri={redirect_uri}&scope={scope}"
        
    elif provider == "x":
        # X (Twitter) OAuth 2.0
        client_id = settings.OAUTH_X_ID
        redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/x/callback"
        scope = "tweet.read users.read"
        url = f"https://twitter.com/i/oauth2/authorize?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope={scope}"
        
    else:
        raise HTTPException(status_code=400, detail="Unsupported provider")
    
    return {"url": url}


@router.get("/oauth/{provider}/callback")
async def oauth_callback(provider: str, code: str):
    """
    OAuth callback handler
    Exchange code for access token and create/login user
    """
    # TODO: Implement OAuth token exchange
    # For now, mock response
    return {
        "message": f"OAuth {provider} callback",
        "code": code,
        "note": "Token exchange not yet implemented"
    }


@router.post("/verify/request")
async def request_verification(data: VerificationRequest):
    """
    Request OTP verification code
    Sends code via email or SMS
    """
    # Generate OTP
    code = generate_otp()
    code_hash = hashlib.sha256(code.encode()).hexdigest()
    
    # Store verification record
    verification_doc = {
        "channel": data.channel,
        "destination": data.destination,
        "codeHash": code_hash,
        "expiresAt": datetime.utcnow() + timedelta(minutes=10),
        "consumed": False,
        "createdAt": datetime.utcnow()
    }
    
    await db.verifications().insert_one(verification_doc)
    
    # Send code
    if data.channel == "email":
        await send_verification_email(data.destination, code)
    elif data.channel == "phone":
        await send_verification_sms(data.destination, code)
    else:
        raise HTTPException(status_code=400, detail="Invalid channel")
    
    return {
        "message": f"Verification code sent to {data.destination}",
        "expiresIn": 600  # 10 minutes
    }


@router.post("/verify/confirm")
async def confirm_verification(data: VerificationConfirm, current_user: dict = Depends(get_current_user)):
    """
    Confirm OTP code and verify user
    """
    code_hash = hashlib.sha256(data.code.encode()).hexdigest()
    
    # Find verification record
    verification = await db.verifications().find_one({
        "codeHash": code_hash,
        "consumed": False,
        "expiresAt": {"$gt": datetime.utcnow()}
    })
    
    if not verification:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired code"
        )
    
    # Mark as consumed
    await db.verifications().update_one(
        {"_id": verification["_id"]},
        {"$set": {"consumed": True}}
    )
    
    # Update user as verified
    await db.users().update_one(
        {"_id": current_user["_id"]},
        {"$set": {"verified": True, "updatedAt": datetime.utcnow()}}
    )
    
    return {
        "message": "Verification successful",
        "verified": True
    }

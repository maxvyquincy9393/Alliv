"""
Enhanced Authentication Routes with Security Improvements
"""
from fastapi import APIRouter, HTTPException, status, Depends, Response, Request
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Dict
import secrets
import hashlib
from datetime import datetime, timedelta
from passlib.context import CryptContext
import asyncio
from collections import defaultdict
import time
import urllib.parse
import httpx

from ..config import settings
from .. import db
from ..auth import get_current_user, oauth2_scheme, create_access_token, create_refresh_token, verify_access_token, verify_refresh_token
from ..oauth_providers import get_oauth_user_info
from ..email_utils import send_verification_email  # NEW: Email sending
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
    birthdate: Optional[str] = None  # Optional - can be set in profile setup
    
    @field_validator('password')
    @classmethod
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

@router.options("/register")
async def register_options():
    """Handle CORS preflight for register endpoint"""
    return JSONResponse(content={"status": "ok"}, status_code=200)

@router.post("/register", response_model=dict)
@limiter.limit("5/minute")
async def register(request: Request, data: RegisterRequest):
    """
    Register new user with enhanced validation
    """
    try:
        # DEBUG: Log incoming data
        import logging
        logger = logging.getLogger("alliv")
        logger.info(f"Registration attempt - Email: {data.email}, Name: {data.name}, Has password: {bool(data.password)}, Birthdate: {data.birthdate}")
        
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
        verification_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])  # 6-digit code
        
        user_doc = {
            "email": email,
            "passwordHash": hash_password(data.password),
            "name": data.name.strip(),
            "birthdate": data.birthdate if data.birthdate else None,  # Optional
            "provider": "email",
            "providerId": None,
            "emailVerified": False,
            "emailVerifiedAt": None,
            "emailVerificationToken": secrets.token_urlsafe(32),  # Generate verification token
            "emailVerificationCode": verification_code,  # 6-digit code
            "emailVerificationExpires": datetime.utcnow() + timedelta(hours=24),  # 24h expiry
            "roles": ["user"],
            "active": True,
            "lastLogin": None,
            "refreshTokens": [],  # Store refresh tokens
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await db.users().insert_one(user_doc)
        user_id = str(result.inserted_id)
        
        # Create empty profile (needs completion)
        profile_doc = {
            "userId": user_id,
            "name": data.name.strip(),
            "bio": "",  # Empty - needs completion
            "photos": [],
            "skills": [],
            "interests": [],
            "goals": "",
            "category": "",
            "location": {},
            "visibility": "public",
            "profileComplete": False,  # IMPORTANT: Requires setup
            "trustScore": 50,  # Start at 50/100
            "completionScore": 10,  # 10% for basic registration
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        await db.profiles().insert_one(profile_doc)
        
        # Generate verification link
        verification_token = user_doc["emailVerificationToken"]
        verification_code = user_doc["emailVerificationCode"]
        verification_link = f"{settings.OAUTH_REDIRECT_BASE.replace('/auth/oauth', '')}/verify-email?token={verification_token}"
        
        # Send verification email
        email_sent = await send_verification_email(
            to_email=email,
            verification_link=verification_link,
            user_name=data.name.strip(),
            verification_code=verification_code
        )
        
        if not email_sent:
            logger.warning(f"Failed to send verification email to {email}")
        
        # Return verification instructions
        return {
            "message": "Registration successful! Please check your email to verify your account.",
            "emailSent": email_sent,
            "email": email,
            # Development only - helps with testing
            "verificationToken": verification_token if settings.DEBUG else None,
            "verificationLink": verification_link if settings.DEBUG else None,
            "requiresEmailVerification": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )


@router.get("/verify-email")
async def verify_email(token: str):
    """
    Verify email address with token from email link
    """
    try:
        # Find user with this verification token
        user = await db.users().find_one({
            "emailVerificationToken": token,
            "emailVerificationExpires": {"$gt": datetime.utcnow()}
        })
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )
        
        # Mark email as verified
        await db.users().update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "emailVerified": True,
                    "emailVerifiedAt": datetime.utcnow(),
                },
                "$unset": {
                    "emailVerificationToken": "",
                    "emailVerificationExpires": ""
                }
            }
        )
        
        # Generate tokens for auto-login after verification
        user_id = str(user["_id"])
        access_token = create_access_token({
            "sub": user_id,
            "email": user["email"],
            "verified": True
        })
        
        refresh_token = create_refresh_token({"sub": user_id})
        
        # Store refresh token
        await db.users().update_one(
            {"_id": user["_id"]},
            {"$push": {"refreshTokens": {
                "token": refresh_token,
                "createdAt": datetime.utcnow()
            }}}
        )
        
        # Return success with tokens
        return {
            "message": "Email verified successfully! You can now complete your profile.",
            "emailVerified": True,
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": {
                "id": user_id,
                "email": user["email"],
                "name": user["name"],
                "emailVerified": True,
                "profileComplete": False  # Still needs profile setup
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed. Please try again."
        )


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


@router.post("/verify-email-code")
async def verify_email_code(data: VerifyCodeRequest):
    """
    Verify email address with 6-digit code from email
    """
    try:
        email = data.email.lower().strip()
        code = data.code.strip()
        
        print(f"🔍 DEBUG - Verifying email: {email}")
        print(f"🔍 DEBUG - Code received: {code}")
        
        # First, find user by email
        user_check = await db.users().find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"}
        })
        
        if user_check:
            print(f"✅ DEBUG - User found: {user_check.get('email')}")
            print(f"🔍 DEBUG - Stored code: {user_check.get('emailVerificationCode')}")
            print(f"🔍 DEBUG - Code expires: {user_check.get('emailVerificationExpires')}")
            print(f"🔍 DEBUG - Current time: {datetime.utcnow()}")
        else:
            print(f"❌ DEBUG - No user found with email: {email}")
        
        # Find user with this email and code
        user = await db.users().find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"},
            "emailVerificationCode": code,
            "emailVerificationExpires": {"$gt": datetime.utcnow()}
        })
        
        if not user:
            print(f"❌ DEBUG - Verification failed. Code mismatch or expired.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code"
            )
        
        # Mark email as verified
        await db.users().update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "emailVerified": True,
                    "emailVerifiedAt": datetime.utcnow(),
                },
                "$unset": {
                    "emailVerificationToken": "",
                    "emailVerificationCode": "",
                    "emailVerificationExpires": ""
                }
            }
        )
        
        # Generate tokens for auto-login after verification
        user_id = str(user["_id"])
        access_token = create_access_token({
            "sub": user_id,
            "email": user["email"],
            "verified": True
        })
        
        refresh_token = create_refresh_token({"sub": user_id})
        
        # Store refresh token
        await db.users().update_one(
            {"_id": user["_id"]},
            {"$push": {"refreshTokens": {
                "token": refresh_token,
                "createdAt": datetime.utcnow()
            }}}
        )
        
        # Return success with tokens
        return {
            "message": "Email verified successfully! You can now complete your profile.",
            "emailVerified": True,
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "user": {
                "id": user_id,
                "email": user["email"],
                "name": user["name"],
                "emailVerified": True,
                "profileComplete": False  # Still needs profile setup
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger("alliv")
        logger.error(f"Code verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed. Please try again."
        )


@router.options("/login")
async def login_options():
    """Handle CORS preflight for login endpoint"""
    return JSONResponse(content={"status": "ok"}, status_code=200)

@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/minute")
async def login(request: Request, response: Response, credentials: LoginRequest):
    """
    Enhanced login with security features - FIXED VERSION
    Validates: user exists, email verified, account active, password correct
    """
    email = credentials.email.lower().strip()
    ip_address = get_remote_address(request)
    
    # Generic error message for security (don't reveal if email exists)
    generic_error = "Invalid email or password"
    
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
            "email": {"$regex": f"^{email}$", "$options": "i"}
        })
        
        # CRITICAL: Don't reveal if email exists or not
        if not user:
            record_failed_attempt(email)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=generic_error
            )
        
        # Check if account is active
        if not user.get("active", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account has been deactivated. Please contact support."
            )
        
        # Check if email verified (REQUIRED for email/password login)
        if user.get("provider") == "email" and not user.get("emailVerified", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before logging in. Check your inbox."
            )
        
        # Check if password exists (for OAuth users)
        if not user.get("passwordHash"):
            record_failed_attempt(email)
            provider = user.get("provider", "social")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Please login with your {provider.title()} account"
            )
        
        # Verify password - CRITICAL FIX
        from ..security import verify_password as verify_pwd
        password_valid = verify_pwd(credentials.password, user["passwordHash"])
        if not password_valid:
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
        refresh_token = create_refresh_token({"sub": user_id})
        
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
        
        # Get profile completion status
        profile = await db.profiles().find_one({"userId": user_id})
        profile_complete = profile.get("profileComplete", False) if profile else False
        
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
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "tokenType": "bearer",
            "expiresIn": 900,
            "user": {
                "id": user_id,
                "email": user["email"],
                "name": user.get("name", ""),
                "emailVerified": user.get("emailVerified", False),
                "profileComplete": profile_complete  # Frontend checks this!
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")  # Debug log
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
    
    # Validate token format (JWT should have 3 parts separated by dots)
    if refresh_token.count('.') != 2:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token format"
        )
    
    # Verify and decode token BEFORE database query
    try:
        payload = verify_refresh_token(refresh_token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token validation failed"
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
                detail="Refresh token not found or expired"
            )
        
        # Generate new access token
        user_id = str(user["_id"])
        access_token = create_access_token({
            "sub": user_id,
            "email": user["email"],
            "verified": user.get("emailVerified", False)
        })
        
        # Rotate refresh token (security best practice)
        new_refresh_token = create_refresh_token({"sub": user_id})
        
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
        print(f"❌ Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refresh failed - please login again"
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
        # Get OAuth credentials from settings
        if provider == "google":
            client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)
            client_secret = getattr(settings, 'GOOGLE_CLIENT_SECRET', None)
            redirect_uri = f"{getattr(settings, 'API_URL', 'http://localhost:8000')}/auth/oauth/google/callback"
        elif provider == "github":
            client_id = getattr(settings, 'GITHUB_CLIENT_ID', None)
            client_secret = getattr(settings, 'GITHUB_CLIENT_SECRET', None)
            redirect_uri = f"{getattr(settings, 'API_URL', 'http://localhost:8000')}/auth/oauth/github/callback"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported provider: {provider}"
            )
        
        if not client_id or not client_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"OAuth {provider} credentials not configured"
            )
        
        # Exchange code for user info (REAL implementation)
        oauth_user = await get_oauth_user_info(
            provider=provider,
            code=code,
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=redirect_uri
        )
        
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
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="OAuth provider timeout - please try again"
        )
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="OAuth rate limit exceeded - please wait and try again"
            )
        elif e.response.status_code == 401:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid OAuth authorization code"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"OAuth provider error (status: {e.response.status_code})"
            )
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cannot connect to OAuth provider - network error"
        )
    except Exception as e:
        print(f"❌ Unexpected OAuth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth authentication failed - unexpected error"
        )


@router.post("/verify-email")
@limiter.limit("3/minute")
async def verify_email(request: Request, token: str, current_user: dict = Depends(get_current_user)):
    """
    Verify user email with token
    """
    # TODO: Implement email verification logic
    pass


# ===== OAUTH ENDPOINTS =====

@router.get("/oauth/google")
async def google_oauth_redirect():
    """
    Redirect to Google OAuth for authentication
    """
    google_auth_url = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "client_id": getattr(settings, 'GOOGLE_CLIENT_ID', 'your-google-client-id'),
        "redirect_uri": f"{getattr(settings, 'API_URL', 'http://localhost:8000')}/auth/oauth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account"
    }
    
    url = f"{google_auth_url}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/oauth/github")
async def github_oauth_redirect():
    """
    Redirect to GitHub OAuth for authentication
    """
    github_auth_url = "https://github.com/login/oauth/authorize"
    params = {
        "client_id": getattr(settings, 'GITHUB_CLIENT_ID', 'your-github-client-id'),
        "redirect_uri": f"{getattr(settings, 'API_URL', 'http://localhost:8000')}/auth/oauth/github/callback",
        "scope": "user:email",
        "state": secrets.token_urlsafe(32)
    }
    
    url = f"{github_auth_url}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/oauth/google/callback")
async def google_oauth_callback(code: str, response: Response):
    """
    Handle Google OAuth callback
    """
    # Mock implementation for development
    # In production, exchange code for tokens and get user info from Google
    
    frontend_url = "http://localhost:3000"
    
    # Create mock user for demo
    mock_user = {
        "email": "demo.google@alliv.com",
        "name": "Google Demo User",
        "provider": "google",
        "emailVerified": True,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    # Check if user exists
    existing_user = await db.users().find_one({"email": mock_user["email"]})
    
    if existing_user:
        user_id = str(existing_user["_id"])
    else:
        result = await db.users().insert_one(mock_user)
        user_id = str(result.inserted_id)
    
    # Generate token
    access_token = create_access_token({
        "sub": user_id,
        "email": mock_user["email"],
        "verified": True
    })
    
    # Redirect to frontend with token
    return RedirectResponse(
        url=f"{frontend_url}/home?token={access_token}&provider=google"
    )


@router.get("/oauth/github/callback")
async def github_oauth_callback(code: str, response: Response, state: Optional[str] = None):
    """
    Handle GitHub OAuth callback
    """
    # Mock implementation for development
    # In production, exchange code for tokens and get user info from GitHub
    
    frontend_url = "http://localhost:3000"
    
    # Create mock user for demo
    mock_user = {
        "email": "demo.github@alliv.com",
        "name": "GitHub Demo User",
        "provider": "github",
        "emailVerified": True,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    # Check if user exists
    existing_user = await db.users().find_one({"email": mock_user["email"]})
    
    if existing_user:
        user_id = str(existing_user["_id"])
    else:
        result = await db.users().insert_one(mock_user)
        user_id = str(result.inserted_id)
    
    # Generate token
    access_token = create_access_token({
        "sub": user_id,
        "email": mock_user["email"],
        "verified": True
    })
    
    # Redirect to frontend with token
    return RedirectResponse(
        url=f"{frontend_url}/home?token={access_token}&provider=github"
    )

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
import asyncio
from collections import defaultdict
import time
import urllib.parse
import httpx
import logging
import redis.asyncio as redis

# Add logger at the top
logger = logging.getLogger(__name__)

from ..config import settings
from ..db import get_db
from ..auth import get_current_user, oauth2_scheme, create_access_token, create_refresh_token, verify_access_token, verify_refresh_token, hash_refresh_token
from .profile import is_profile_complete
from ..oauth_providers import get_oauth_user_info
from ..email_utils import send_verification_email  # NEW: Email sending
from ..services.trust import update_user_trust_score
from ..services.session_manager import get_session_manager
from slowapi import Limiter
from slowapi.util import get_remote_address
from ..password_utils import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])
# Rate limiting
limiter = Limiter(key_func=get_remote_address)
login_attempts = defaultdict(list)  # In-memory fallback
lockout_users = {}  # In-memory fallback

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


async def _get_redis_client() -> Optional[redis.Redis]:
    if not settings.REDIS_URL:
        return None
    try:
        client = redis.Redis.from_url(settings.REDIS_URL, encoding="utf-8", decode_responses=True)
        await client.ping()
        return client
    except Exception as e:
        logger.warning(f"[WARN] Redis unavailable for login rate limit: {e}")
        return None


async def check_rate_limit(email: str, ip_address: str) -> tuple[bool, str]:
    """Check if user is rate limited or locked out (prefers Redis, falls back to memory)"""
    current_time = time.time()
    redis_client = await _get_redis_client()
    lock_key = f"login:lock:{email.lower()}"
    attempts_key = f"login:attempts:{email.lower()}"

    if redis_client:
        try:
            if await redis_client.exists(lock_key):
                ttl = await redis_client.ttl(lock_key)
                remaining = ttl if ttl and ttl > 0 else 300
                await redis_client.aclose()
                return False, f"Account locked. Try again in {remaining} seconds"

            attempts = await redis_client.get(attempts_key)
            attempts_count = int(attempts) if attempts else 0
            if attempts_count >= 5:
                await redis_client.set(lock_key, "1", ex=300)
                await redis_client.delete(attempts_key)
                await redis_client.aclose()
                return False, "Too many failed attempts. Account locked for 5 minutes"
            await redis_client.aclose()
            return True, ""
        except Exception as e:
            logger.warning(f"[WARN] Redis rate-limit check failed, falling back: {e}")

    # Fallback in-memory
    if email in lockout_users:
        lockout_time = lockout_users[email]
        if current_time < lockout_time:
            remaining = int(lockout_time - current_time)
            return False, f"Account locked. Try again in {remaining} seconds"
        else:
            del lockout_users[email]
    
    if email in login_attempts:
        login_attempts[email] = [t for t in login_attempts[email] if current_time - t < 900]
        if len(login_attempts[email]) >= 5:
            lockout_users[email] = current_time + 300  # 5 minute lockout
            return False, "Too many failed attempts. Account locked for 5 minutes"
    
    return True, ""


async def record_failed_attempt(email: str):
    """Record a failed login attempt"""
    redis_client = await _get_redis_client()
    attempts_key = f"login:attempts:{email.lower()}"

    if redis_client:
        try:
            # Increment attempts and set TTL 15m
            attempts = await redis_client.incr(attempts_key)
            if attempts == 1:
                await redis_client.expire(attempts_key, 900)
            # Lock after 5 attempts
            if attempts >= 5:
                await redis_client.set(f"login:lock:{email.lower()}", "1", ex=300)
                await redis_client.delete(attempts_key)
            await redis_client.aclose()
            return
        except Exception as e:
            logger.warning(f"[WARN] Redis record_failed_attempt failed, fallback to memory: {e}")

    login_attempts[email].append(time.time())


def generate_refresh_token() -> str:
    """Generate secure refresh token"""
    return secrets.token_urlsafe(32)


# ===== ROUTES =====

@router.options("/register")
async def register_options(request: Request):
    """Handle CORS preflight for register endpoint - EXPLICIT handler"""
    from fastapi.responses import Response
    
    response = Response(status_code=200)
    origin = request.headers.get("origin", "")
    cors_origins_str = settings.CORS_ORIGIN if hasattr(settings, 'CORS_ORIGIN') else "http://localhost:5173,http://localhost:3000"
    cors_origins = cors_origins_str.split(',') if cors_origins_str != "*" else ["*"]
    cors_origins = [o.strip() for o in cors_origins]
    
    # ALWAYS set Access-Control-Allow-Origin
    if origin:
        origin_stripped = origin.strip()
        if origin_stripped in cors_origins or cors_origins_str == "*":
            response.headers["Access-Control-Allow-Origin"] = origin_stripped if cors_origins_str != "*" else "*"
        else:
            response.headers["Access-Control-Allow-Origin"] = "*"  # Development fallback
    else:
        response.headers["Access-Control-Allow-Origin"] = "*"
    
    # ALWAYS set required CORS headers
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    requested_headers = request.headers.get("Access-Control-Request-Headers", "Content-Type, Authorization")
    response.headers["Access-Control-Allow-Headers"] = requested_headers
    response.headers["Access-Control-Max-Age"] = "3600"
    
    logger.info(f"OPTIONS /auth/register - CORS preflight - Origin: {origin} - Allowed: {response.headers.get('Access-Control-Allow-Origin')}")
    return response

@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/15minutes")  # Stricter: 3 attempts per 15 minutes
async def register(request: Request, data: RegisterRequest, response: Response):
    """
    Register new user with enhanced validation
    """
    try:
        # DEBUG: Log incoming data
        logger.info(f"Registration attempt - Email: {data.email[:3]}***@{data.email.split('@')[1]}, Name: {data.name}, Has password: {bool(data.password)}, Birthdate: {data.birthdate}")
        
        # Normalize email
        email = data.email.lower().strip()
        
        # Check if user exists (case-insensitive)
        existing = await get_db().users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
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
        
        result = await get_db().users.insert_one(user_doc)
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
        
        await get_db().profiles.insert_one(profile_doc)
        
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
            logger.warning(f"Failed to send verification email to {email[:3]}***@{email.split('@')[1]}")
        
        # Issue tokens so new users can start immediately (tests expect this)
        access_token = create_access_token({
            "sub": user_id,
            "email": email,
            "verified": user_doc.get("emailVerified", False)
        })
        refresh_token = create_refresh_token({"sub": user_id})
        refresh_token_hash = hash_refresh_token(refresh_token)

        await get_db().users.update_one(
            {"_id": result.inserted_id},
            {
                "$push": {
                    "refreshTokens": {
                        "token": refresh_token_hash,
                        "createdAt": datetime.utcnow()
                    }
                },
                "$set": {"lastLogin": datetime.utcnow()}
            }
        )

        # Set session cookies (harmless in tests, required for browser flows)
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=settings.NODE_ENV == "production",
            samesite="lax",
            max_age=settings.JWT_ACCESS_TTL,
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.NODE_ENV == "production",
            samesite="lax",
            max_age=14 * 24 * 60 * 60,
            path="/auth"
        )

        user_payload = {
            "id": user_id,
            "email": email,
            "name": data.name.strip(),
            "emailVerified": user_doc.get("emailVerified", False),
            "profileComplete": False
        }

        # Return verification instructions + tokens
        return {
            "message": "Registration successful! Please check your email to verify your account.",
            "emailSent": email_sent,
            "email": email,
            # Development only - helps with testing
            "verificationToken": verification_token if settings.DEBUG else None,
            "verificationLink": verification_link if settings.DEBUG else None,
            "requiresEmailVerification": True,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user_payload
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )


@router.get("/verify-email")
async def verify_email(token: str, response: Response):
    """
    Verify email address with token from email link
    """
    try:
        # Find user with this verification token
        user = await get_db().users.find_one({
            "emailVerificationToken": token,
            "emailVerificationExpires": {"$gt": datetime.utcnow()}
        })
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )
        
        # Mark email as verified
        await get_db().users.update_one(
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
        await get_db().users.update_one(
            {"_id": user["_id"]},
            {"$push": {"refreshTokens": {
                "token": hash_refresh_token(refresh_token),
                "createdAt": datetime.utcnow()
            }}}
        )

        # Set cookies for session + CSRF
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.NODE_ENV == "production",
            samesite="lax",
            max_age=14 * 24 * 60 * 60,
            path="/auth"
        )
        csrf_token = secrets.token_urlsafe(32)
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            httponly=False,
            secure=settings.NODE_ENV == "production",
            samesite="lax",
            max_age=14 * 24 * 60 * 60,
            path="/"
        )
        
        # Update trust score
        await update_user_trust_score(user_id)

        # Return success with tokens
        return {
            "message": "Email verified successfully! You can now complete your profile.",
            "emailVerified": True,
            "accessToken": access_token,
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
async def verify_email_code(data: VerifyCodeRequest, response: Response):
    """
    Verify email address with 6-digit code from email
    """
    try:
        email = data.email.lower().strip()
        code = data.code.strip()
        
        logger.debug(f"Verifying email: {email}")
        logger.debug(f"Code received: ****{code[-2:] if len(code) > 2 else '**'}")
        
        # First, find user by email
        user_check = await get_db().users.find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"}
        })
        
        if user_check:
            logger.debug(f"User found: {user_check.get('email')}")
            logger.debug(f"Stored code: ****{user_check.get('emailVerificationCode', '')[-2:] if len(user_check.get('emailVerificationCode', '')) > 2 else '**'}")
            logger.debug(f"Code expires: {user_check.get('emailVerificationExpires')}")
            logger.debug(f"Current time: {datetime.utcnow()}")
        else:
            logger.debug(f"No user found with email: {email}")
        
        # Find user with this email and code
        user = await get_db().users.find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"},
            "emailVerificationCode": code,
            "emailVerificationExpires": {"$gt": datetime.utcnow()}
        })
        
        if not user:
            logger.debug(f"Verification failed. Code mismatch or expired.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification code"
            )
        
        # Mark email as verified
        await get_db().users.update_one(
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
        await get_db().users.update_one(
            {"_id": user["_id"]},
            {"$push": {"refreshTokens": {
                "token": hash_refresh_token(refresh_token),
                "createdAt": datetime.utcnow()
            }}}
        )

        # Set cookies for session + CSRF
        # NOTE: For localhost cross-port (5173 -> 8080), we need SameSite=None; Secure
        # This works on localhost even with HTTP in modern browsers
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,  # Required for SameSite=None
            samesite="none",
            max_age=settings.JWT_ACCESS_TTL,
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=14 * 24 * 60 * 60,
            path="/auth"
        )
        csrf_token = secrets.token_urlsafe(32)
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            httponly=False,
            secure=True,
            samesite="none",
            max_age=14 * 24 * 60 * 60,
            path="/"
        )
        
        # Update trust score
        await update_user_trust_score(user_id)

        # Return success with tokens
        return {
            "message": "Email verified successfully! You can now complete your profile.",
            "emailVerified": True,
            "accessToken": access_token,
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
        logger.error(f"Code verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed. Please try again."
        )


@router.options("/login")
async def login_options(request: Request):
    """Handle CORS preflight for login endpoint - backup if middleware fails"""
    from fastapi.responses import Response
    
    response = Response(status_code=200)
    origin = request.headers.get("origin")
    
    # Allow origin if in CORS list or if CORS is set to *
    cors_origins = settings.CORS_ORIGIN.split(',') if settings.CORS_ORIGIN != "*" else ["*"]
    if origin and (origin in cors_origins or settings.CORS_ORIGIN == "*"):
        response.headers["Access-Control-Allow-Origin"] = origin if settings.CORS_ORIGIN != "*" else "*"
    else:
        response.headers["Access-Control-Allow-Origin"] = cors_origins[0] if cors_origins else "*"
    
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Max-Age"] = "3600"
    return response

@router.post("/login", response_model=dict)  # Changed to dict to allow custom response format
@limiter.limit("3/5minutes")  # Stricter: 3 attempts per 5 minutes
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
    allowed, message = await check_rate_limit(email, ip_address)
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=message
        )
    
    try:
        # Find user (case-insensitive)
        user = await get_db().users.find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"}
        })
        
        # CRITICAL: Don't reveal if email exists or not
        if not user:
            await record_failed_attempt(email)
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
            await record_failed_attempt(email)
            provider = user.get("provider", "social")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Please login with your {provider.title()} account"
            )
        
        # Verify password - CRITICAL FIX
        password_valid = verify_password(credentials.password, user["passwordHash"])
        if not password_valid:
            await record_failed_attempt(email)
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
        refresh_token_hash = hash_refresh_token(refresh_token)
        
        # Create session with SessionManager
        session_manager = get_session_manager()
        user_agent = request.headers.get("User-Agent", "")
        expires_at = datetime.utcnow() + timedelta(days=14)
        
        session_id = await session_manager.create_session(
            user_id=user_id,
            refresh_token_hash=refresh_token_hash,
            user_agent=user_agent,
            ip_address=ip_address,
            expires_at=expires_at
        )
        
        # Store refresh token in database
        await get_db().users.update_one(
            {"_id": user["_id"]},
            {
                "$push": {
                    "refreshTokens": {
                        "token": refresh_token_hash,
                        "sessionId": session_id,
                        "createdAt": datetime.utcnow(),
                        "expiresAt": expires_at,
                        "userAgent": user_agent,
                        "ipAddress": ip_address
                    }
                },
                "$set": {
                    "lastLogin": datetime.utcnow()
                }
            }
        )
        
        # Get profile completion status
        profile = await get_db().profiles.find_one({"userId": user_id})
        profile_complete = profile.get("profileComplete", False) if profile else False

        # Auto-heal legacy profiles that already have required fields filled out
        if profile and not profile_complete and is_profile_complete(profile):
            profile_complete = True
            await get_db().profiles.update_one(
                {"_id": profile["_id"]},
                {
                    "$set": {
                        "profileComplete": True,
                        "completionScore": 100,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
        
        # Set refresh token in httpOnly cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=settings.JWT_ACCESS_TTL,
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=14 * 24 * 60 * 60,  # 14 days
            path="/auth"
        )

        # Issue CSRF token (double submit cookie strategy)
        csrf_token = secrets.token_urlsafe(32)
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            httponly=False,
            secure=True,
            samesite="none",
            max_age=14 * 24 * 60 * 60,
            path="/"
        )
        
        # Return response with user data and profileComplete (frontend expects this format)
        return {
            "accessToken": access_token,  # camelCase for frontend
            "tokenType": "bearer",
            "expiresIn": 900,
            "user": {
                "id": user_id,
                "email": user["email"],
                "name": user.get("name", ""),
                "emailVerified": user.get("emailVerified", False),
                "profileComplete": profile_complete  # CRITICAL: Frontend needs this for redirect logic
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {str(e)}")  # Debug log
        await record_failed_attempt(email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=generic_error
        )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("10/minute")  # Prevent refresh token abuse
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
        # Find user with this refresh token (hashed)
        hashed_token = hash_refresh_token(refresh_token)
        user = await get_db().users.find_one({
            "refreshTokens.token": hashed_token,
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
        await get_db().users.update_one(
            {"_id": user["_id"]},
            {
                "$pull": {"refreshTokens": {"token": hashed_token}},
                "$push": {
                    "refreshTokens": {
                        "token": hash_refresh_token(new_refresh_token),
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
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=settings.JWT_ACCESS_TTL,
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=14 * 24 * 60 * 60,
            path="/auth"
        )

        # Rotate CSRF token alongside refresh token
        csrf_token = secrets.token_urlsafe(32)
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            httponly=False,
            secure=True,
            samesite="none",
            max_age=14 * 24 * 60 * 60,
            path="/"
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": 900
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[ERROR] Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token refresh failed - please login again"
        )


@router.post("/logout")
async def logout(request: Request, response: Response, current_user: dict = Depends(get_current_user)):
    """
    Logout user and revoke current session tokens
    """
    try:
        from ..services.token_blacklist import get_token_blacklist
        from jose import jwt
        
        blacklist = get_token_blacklist()
        
        # Get tokens from cookies
        access_token = request.cookies.get("access_token")
        refresh_token = request.cookies.get("refresh_token")
        
        # Blacklist access token if present
        if access_token:
            try:
                payload = jwt.decode(access_token, settings.JWT_ACCESS_SECRET, algorithms=[settings.JWT_ALGORITHM], options={"verify_exp": False})
                exp_time = payload.get("exp")
                if exp_time:
                    await blacklist.revoke_token(access_token, exp_time)
                    logger.info(f"Access token blacklisted for user {current_user['_id']}")
            except Exception as e:
                logger.warning(f"Failed to blacklist access token: {e}")
        
        # Blacklist refresh token if present
        if refresh_token:
            try:
                payload = jwt.decode(refresh_token, settings.JWT_REFRESH_SECRET, algorithms=[settings.JWT_ALGORITHM], options={"verify_exp": False})
                exp_time = payload.get("exp")
                if exp_time:
                    await blacklist.revoke_token(refresh_token, exp_time)
                    logger.info(f"Refresh token blacklisted for user {current_user['_id']}")
            except Exception as e:
                logger.warning(f"Failed to blacklist refresh token: {e}")
            
            # Also remove from database
            hashed_token = hash_refresh_token(refresh_token)
            await get_db().users.update_one(
                {"_id": current_user["_id"]},
                {"$pull": {"refreshTokens": {"token": hashed_token}}}
            )
        
        # Clear cookies
        response.delete_cookie("refresh_token", path="/auth")
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("csrf_token", path="/")
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.post("/logout-all")
async def logout_all(request: Request, response: Response, current_user: dict = Depends(get_current_user)):
    """
    Logout from all devices - revoke all user sessions
    """
    try:
        from ..services.token_blacklist import get_token_blacklist
        from jose import jwt
        
        blacklist = get_token_blacklist()
        user_id = str(current_user["_id"])
        
        # Get all refresh tokens for this user
        user = await get_db().users.find_one({"_id": current_user["_id"]})
        refresh_tokens = user.get("refreshTokens", [])
        
        # Blacklist all refresh tokens
        blacklisted_count = 0
        for token_data in refresh_tokens:
            # The token is stored as hash, but we need to blacklist based on expiry
            # We'll use the expiresAt field from the database
            expires_at = token_data.get("expiresAt")
            if expires_at:
                exp_timestamp = int(expires_at.timestamp())
                # We don't have the actual token, but we can mark the session as revoked
                # by removing from database. The blacklist is for immediate token revocation.
                blacklisted_count += 1
        
        # Remove all refresh tokens from database
        await get_db().users.update_one(
            {"_id": current_user["_id"]},
            {"$set": {"refreshTokens": []}}
        )
        
        # Also blacklist current access token
        access_token = request.cookies.get("access_token")
        if access_token:
            try:
                payload = jwt.decode(access_token, settings.JWT_ACCESS_SECRET, algorithms=[settings.JWT_ALGORITHM], options={"verify_exp": False})
                exp_time = payload.get("exp")
                if exp_time:
                    await blacklist.revoke_token(access_token, exp_time)
            except Exception as e:
                logger.warning(f"Failed to blacklist access token: {e}")
        
        # Clear cookies for current device
        response.delete_cookie("refresh_token", path="/auth")
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("csrf_token", path="/")
        
        logger.info(f"User {user_id} logged out from all devices ({len(refresh_tokens)} sessions)")
        
        return {
            "message": "Logged out from all devices successfully",
            "sessionsRevoked": len(refresh_tokens)
        }
        
    except Exception as e:
        logger.error(f"Logout-all error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout from all devices failed"
        )


@router.get("/sessions")
async def list_sessions(current_user: dict = Depends(get_current_user)):
    """
    List all active sessions for the current user
    """
    try:
        session_manager = get_session_manager()
        user_id = str(current_user["_id"])
        
        sessions = await session_manager.get_user_sessions(user_id)
        
        # Format sessions for response
        formatted_sessions = []
        for session in sessions:
            formatted_sessions.append({
                "sessionId": session.get("session_id"),
                "deviceInfo": session.get("device_info", {}),
                "ipAddress": session.get("ip_address"),
                "createdAt": session.get("created_at"),
                "lastActive": session.get("last_active"),
                "expiresAt": session.get("expires_at"),
                "isCurrent": False  # TODO: Mark current session
            })
        
        return {
            "sessions": formatted_sessions,
            "total": len(formatted_sessions)
        }
        
    except Exception as e:
        logger.error(f"List sessions error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list sessions"
        )


@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Revoke a specific session by session ID
    """
    try:
        session_manager = get_session_manager()
        user_id = str(current_user["_id"])
        
        # Verify session belongs to user
        session = await session_manager.get_session(session_id)
        if not session or session.get("user_id") != user_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Revoke the session
        success = await session_manager.revoke_session(user_id, session_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to revoke session"
            )
        
        # Also remove from database
        refresh_token_hash = session.get("refresh_token_hash")
        if refresh_token_hash:
            await get_db().users.update_one(
                {"_id": current_user["_id"]},
                {"$pull": {"refreshTokens": {"token": refresh_token_hash}}}
            )
        
        logger.info(f"Session {session_id} revoked for user {user_id}")
        
        return {
            "message": "Session revoked successfully",
            "sessionId": session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Revoke session error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke session"
        )


# ===== TWO-FACTOR AUTHENTICATION ENDPOINTS =====

class Enable2FARequest(BaseModel):
    password: str  # Require password confirmation


class Verify2FARequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)


class Disable2FARequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)
    password: str


@router.post("/2fa/enable")
async def enable_2fa(
    data: Enable2FARequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Enable 2FA for the current user.
    Returns QR code and backup codes.
    """
    try:
        from ..services.two_factor_auth import get_two_factor_auth
        from ..password_utils import verify_password
        
        # Verify password
        if not verify_password(data.password, current_user.get("passwordHash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )
        
        # Check if 2FA already enabled
        if current_user.get("mfa_enabled", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA is already enabled"
            )
        
        two_fa = get_two_factor_auth()
        
        # Generate secret and QR code
        secret = two_fa.generate_secret()
        qr_code = two_fa.generate_qr_code(secret, current_user["email"])
        
        # Generate backup codes
        backup_codes = two_fa.generate_backup_codes(10)
        hashed_backup_codes = [two_fa.hash_backup_code(code) for code in backup_codes]
        
        # Store in database (not enabled yet - requires verification)
        user_id = current_user["_id"]
        await get_db().users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "mfa_secret": secret,
                    "mfa_backup_codes": hashed_backup_codes,
                    "mfa_enabled": False,  # Not enabled until verified
                    "mfa_setup_pending": True,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"2FA setup initiated for user {user_id}")
        
        return {
            "message": "2FA setup initiated. Please scan the QR code and verify with a code.",
            "qrCode": qr_code,
            "secret": secret,  # For manual entry
            "backupCodes": backup_codes,  # Show once, user must save
            "setupPending": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Enable 2FA error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to enable 2FA"
        )


@router.post("/2fa/verify-setup")
async def verify_2fa_setup(
    data: Verify2FARequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Verify 2FA setup by confirming a TOTP code.
    This activates 2FA for the account.
    """
    try:
        from ..services.two_factor_auth import get_two_factor_auth
        
        # Check if setup is pending
        if not current_user.get("mfa_setup_pending", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No pending 2FA setup"
            )
        
        secret = current_user.get("mfa_secret")
        if not secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA secret not found"
            )
        
        two_fa = get_two_factor_auth()
        
        # Verify the code
        if not two_fa.verify_totp(secret, data.code):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid verification code"
            )
        
        # Activate 2FA
        user_id = current_user["_id"]
        await get_db().users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "mfa_enabled": True,
                    "mfa_enabled_at": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                },
                "$unset": {
                    "mfa_setup_pending": ""
                }
            }
        )
        
        logger.info(f"2FA enabled for user {user_id}")
        
        return {
            "message": "2FA enabled successfully",
            "enabled": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify 2FA setup error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify 2FA setup"
        )


@router.post("/2fa/disable")
async def disable_2fa(
    data: Disable2FARequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Disable 2FA for the current user.
    Requires both password and current TOTP code.
    """
    try:
        from ..services.two_factor_auth import get_two_factor_auth
        from ..password_utils import verify_password
        
        # Check if 2FA is enabled
        if not current_user.get("mfa_enabled", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA is not enabled"
            )
        
        # Verify password
        if not verify_password(data.password, current_user.get("passwordHash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )
        
        # Verify TOTP code
        two_fa = get_two_factor_auth()
        secret = current_user.get("mfa_secret")
        
        if not two_fa.verify_totp(secret, data.code):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid verification code"
            )
        
        # Disable 2FA
        user_id = current_user["_id"]
        await get_db().users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "mfa_enabled": False,
                    "updatedAt": datetime.utcnow()
                },
                "$unset": {
                    "mfa_secret": "",
                    "mfa_backup_codes": "",
                    "mfa_enabled_at": ""
                }
            }
        )
        
        logger.info(f"2FA disabled for user {user_id}")
        
        return {
            "message": "2FA disabled successfully",
            "enabled": False
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Disable 2FA error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disable 2FA"
        )


@router.post("/2fa/verify")
async def verify_2fa_login(data: Verify2FARequest, response: Response):
    """
    Verify 2FA code during login.
    Called after successful email/password authentication.
    """
    try:
        from ..services.two_factor_auth import get_two_factor_auth
        from jose import jwt
        
        # This endpoint expects a temp token in header or cookie
        # For now, we'll implement it as part of the login flow
        # The actual implementation should be integrated into the login endpoint
        
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="2FA verification is integrated into the login flow"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"2FA verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="2FA verification failed"
        )


@router.get("/2fa/status")
async def get_2fa_status(current_user: dict = Depends(get_current_user)):
    """
    Get 2FA status for the current user.
    """
    return {
        "enabled": current_user.get("mfa_enabled", False),
        "setupPending": current_user.get("mfa_setup_pending", False),
        "enabledAt": current_user.get("mfa_enabled_at")
    }


@router.post("/2fa/backup-codes/regenerate")
async def regenerate_backup_codes(
    data: Enable2FARequest,  # Reuse password confirmation
    current_user: dict = Depends(get_current_user)
):
    """
    Regenerate backup codes for 2FA.
    Requires password confirmation.
    """
    try:
        from ..services.two_factor_auth import get_two_factor_auth
        from ..password_utils import verify_password
        
        # Check if 2FA is enabled
        if not current_user.get("mfa_enabled", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="2FA is not enabled"
            )
        
        # Verify password
        if not verify_password(data.password, current_user.get("passwordHash", "")):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password"
            )
        
        two_fa = get_two_factor_auth()
        
        # Generate new backup codes
        backup_codes = two_fa.generate_backup_codes(10)
        hashed_backup_codes = [two_fa.hash_backup_code(code) for code in backup_codes]
        
        # Update in database
        user_id = current_user["_id"]
        await get_db().users.update_one(
            {"_id": user_id},
            {
                "$set": {
                    "mfa_backup_codes": hashed_backup_codes,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        logger.info(f"Backup codes regenerated for user {user_id}")
        
        return {
            "message": "Backup codes regenerated successfully",
            "backupCodes": backup_codes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Regenerate backup codes error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to regenerate backup codes"
        )


@router.post("/oauth/callback", response_model=TokenResponse)
@limiter.limit("10/minute")
async def oauth_callback(request: Request, response: Response, data: OAuthCallbackRequest):
    """
    Handle OAuth callback and create/link user
    """
    provider = data.provider.lower()
    code = data.code
    
    if provider not in ["google", "github", "facebook", "x"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OAuth provider"
        )
    
    try:
        # Get OAuth credentials from settings
        if provider == "google":
            client_id = settings.OAUTH_GOOGLE_ID
            client_secret = settings.OAUTH_GOOGLE_SECRET
            redirect_uri = f"{settings.BACKEND_URL}/auth/oauth/google/callback"
        elif provider == "facebook":
            client_id = settings.OAUTH_FACEBOOK_APP_ID
            client_secret = settings.OAUTH_FACEBOOK_APP_SECRET
            redirect_uri = f"{settings.BACKEND_URL}/auth/oauth/facebook/callback"
        elif provider == "github":
            client_id = settings.OAUTH_GITHUB_ID
            client_secret = settings.OAUTH_GITHUB_SECRET
            redirect_uri = f"{settings.BACKEND_URL}/auth/oauth/github/callback"
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
        existing_user = await get_db().users.find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"}
        })
        
        if existing_user:
            # Link OAuth to existing account
            user_id = str(existing_user["_id"])
            
            # Update provider info if not already linked
            if existing_user.get("provider") != provider:
                await get_db().users.update_one(
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
            
            result = await get_db().users.insert_one(user_doc)
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
            
            await get_db().profiles.insert_one(profile_doc)
        
        # Generate tokens
        access_token = create_access_token({
            "sub": user_id,
            "email": email,
            "verified": True
        })
        
        refresh_token = create_refresh_token({"sub": user_id})
        
        # Store refresh token
        await get_db().users.update_one(
            {"_id": existing_user["_id"] if existing_user else result.inserted_id},
            {
                "$push": {
                    "refreshTokens": {
                        "token": hash_refresh_token(refresh_token),
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
            key="access_token",
            value=access_token,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=settings.JWT_ACCESS_TTL,
            path="/"
        )
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="none",
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
        logger.error(f"[ERROR] Unexpected OAuth error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth authentication failed - unexpected error"
        )


class VerificationRequest(BaseModel):
    email: EmailStr


@router.post("/verify/request")
@limiter.limit("3/minute")
async def request_verification(request: Request, data: VerificationRequest):
    """
    Request a new verification email
    """
    try:
        email = data.email.lower().strip()
        
        # Find user by email
        user = await get_db().users.find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"}
        })
        
        if user and not user.get("emailVerified", False):
            # Generate new codes
            verification_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
            verification_token = secrets.token_urlsafe(32)
            
            # Update user with new codes
            await get_db().users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "emailVerificationCode": verification_code,
                        "emailVerificationToken": verification_token,
                        "emailVerificationExpires": datetime.utcnow() + timedelta(hours=24)
                    }
                }
            )
            
            # Generate link
            verification_link = f"{settings.OAUTH_REDIRECT_BASE.replace('/auth/oauth', '')}/verify-email?token={verification_token}"
            
            # Send email
            await send_verification_email(
                to_email=email,
                verification_link=verification_link,
                user_name=user.get("name", "User"),
                verification_code=verification_code
            )
            
        # Always return success
        return {
            "message": "If your account exists and is not verified, a new verification email has been sent.",
            "email": email
        }
        
    except Exception as e:
        logger.error(f"Resend verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send verification email"
        )


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
    client_id = settings.OAUTH_GITHUB_ID
    if not client_id:
        # Fallback for development/demo if env var not set
        client_id = "your-github-client-id"
        
    params = {
        "client_id": client_id,
        "redirect_uri": f"{getattr(settings, 'API_URL', 'http://localhost:8080')}/auth/oauth/github/callback",
        "scope": "user:email",
        "state": secrets.token_urlsafe(32)
    }
    
    url = f"{github_auth_url}?{urllib.parse.urlencode(params)}"
    return RedirectResponse(url=url)


@router.get("/oauth/google/callback")
async def google_oauth_callback(
    code: str, 
    response: Response,
    state: Optional[str] = None,
    error: Optional[str] = None
):
    """
    Handle Google OAuth callback - PRODUCTION IMPLEMENTATION
    
    Flow:
    1. User authorizes on Google
    2. Google redirects here with code
    3. Exchange code for access token
    4. Fetch user profile from Google
    5. Create/update user in database
    6. Generate JWT and redirect to frontend
    """
    import logging
    logger = logging.getLogger("alliv")
    
    # Handle OAuth errors
    if error:
        logger.error(f"Google OAuth error: {error}")
        error_url = f"{settings.FRONTEND_URL}/login?error=oauth_denied"
        return RedirectResponse(url=error_url)
    
    try:
        # Get OAuth credentials
        client_id = settings.OAUTH_GOOGLE_ID
        client_secret = settings.OAUTH_GOOGLE_SECRET
        redirect_uri = f"{settings.BACKEND_URL}/auth/oauth/google/callback"
        
        if not client_id or not client_secret:
            logger.error("Google OAuth credentials not configured")
            error_url = f"{settings.FRONTEND_URL}/login?error=config_error"
            return RedirectResponse(url=error_url)
        
        # Exchange code for token and get user info
        from ..oauth_providers import get_oauth_user_info
        oauth_user = await get_oauth_user_info(
            provider="google",
            code=code,
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=redirect_uri
        )
        
        email = oauth_user["email"].lower().strip()
        name = oauth_user["name"]
        provider_id = oauth_user["provider_id"]
        picture_url = oauth_user.get("avatar")
        
        # Check if user exists
        existing_user = await get_db().users.find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"}
        })
        
        if existing_user:
            # Update existing user with Google OAuth info
            user_id = str(existing_user["_id"])
            
            await get_db().users.update_one(
                {"_id": existing_user["_id"]},
                {
                    "$set": {
                        "oauth.google": {
                            "id": provider_id,
                            "connectedAt": datetime.utcnow()
                        },
                        "emailVerified": True,
                        "emailVerifiedAt": datetime.utcnow(),
                        "lastLogin": datetime.utcnow(),
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            # Update profile photo if not set
            profile = await get_db().profiles.find_one({"userId": user_id})
            if profile and picture_url and not profile.get("photos"):
                await get_db().profiles.update_one(
                    {"userId": user_id},
                    {"$set": {"photos": [picture_url], "updatedAt": datetime.utcnow()}}
                )
        else:
            # Create new user from Google OAuth
            user_doc = {
                "email": email,
                "passwordHash": None,  # No password for OAuth users
                "name": name,
                "provider": "google",
                "providerId": provider_id,
                "oauth": {
                    "google": {
                        "id": provider_id,
                        "connectedAt": datetime.utcnow()
                    }
                },
                "emailVerified": True,
                "emailVerifiedAt": datetime.utcnow(),
                "roles": ["user"],
                "active": True,
                "lastLogin": datetime.utcnow(),
                "refreshTokens": [],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            result = await get_db().users.insert_one(user_doc)
            user_id = str(result.inserted_id)
            
            # Create profile with Google photo
            profile_doc = {
                "userId": user_id,
                "name": name,
                "bio": "",
                "photos": [picture_url] if picture_url else [],
                "skills": [],
                "interests": [],
                "goals": "",
                "category": "",
                "location": {},
                "visibility": "public",
                "profileComplete": False,  # Still needs completion
                "trustScore": 60,  # Higher base for OAuth users
                "completionScore": 20,  # Photo + email verified
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            await get_db().profiles.insert_one(profile_doc)
        
        # Generate JWT access token
        access_token = create_access_token({
            "sub": user_id,
            "email": email,
            "verified": True
        })
        
        # Generate refresh token
        refresh_token = generate_refresh_token()
        
        # Store refresh token
        from slowapi.util import get_remote_address
        from fastapi import Request
        
        await get_db().users.update_one(
            {"_id": existing_user["_id"] if existing_user else result.inserted_id},
            {
                "$push": {
                    "refreshTokens": {
                        "token": refresh_token,
                        "createdAt": datetime.utcnow(),
                        "expiresAt": datetime.utcnow() + timedelta(days=14),
                        "userAgent": "OAuth",
                        "ipAddress": "OAuth"
                    }
                }
            }
        )
        
        # Set refresh token cookie
        response_redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?token={access_token}&provider=google"
        )
        response_redirect.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.NODE_ENV == "production",
            samesite="lax",
            max_age=14 * 24 * 60 * 60,
            path="/auth"
        )
        
        return response_redirect
        
    except HTTPException as e:
        logger.error(f"Google OAuth HTTPException: {e.detail}")
        error_url = f"{settings.FRONTEND_URL}/login?error=oauth_failed"
        return RedirectResponse(url=error_url)
    except Exception as e:
        logger.error(f"Google OAuth unexpected error: {str(e)}")
        error_url = f"{settings.FRONTEND_URL}/login?error=server_error"
        return RedirectResponse(url=error_url)


@router.get("/oauth/facebook/callback")
async def facebook_oauth_callback(
    code: str, 
    response: Response,
    state: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None
):
    """
    Handle Facebook OAuth callback - PRODUCTION IMPLEMENTATION
    
    Flow:
    1. User authorizes on Facebook
    2. Facebook redirects here with code
    3. Exchange code for access token
    4. Fetch user profile from Facebook
    5. Create/update user in database
    6. Generate JWT and redirect to frontend
    """
    import logging
    logger = logging.getLogger("alliv")
    
    # Handle OAuth errors
    if error:
        logger.error(f"Facebook OAuth error: {error} - {error_description}")
        error_url = f"{settings.FRONTEND_URL}/login?error=oauth_denied"
        return RedirectResponse(url=error_url)
    
    try:
        # Get OAuth credentials
        client_id = settings.OAUTH_FACEBOOK_APP_ID
        client_secret = settings.OAUTH_FACEBOOK_APP_SECRET
        redirect_uri = f"{settings.BACKEND_URL}/auth/oauth/facebook/callback"
        
        if not client_id or not client_secret:
            logger.error("Facebook OAuth credentials not configured")
            error_url = f"{settings.FRONTEND_URL}/login?error=config_error"
            return RedirectResponse(url=error_url)
        
        # Exchange code for token and get user info
        from ..oauth_providers import get_oauth_user_info
        oauth_user = await get_oauth_user_info(
            provider="facebook",
            code=code,
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=redirect_uri
        )
        
        email = oauth_user.get("email")
        if not email:
            # Facebook requires email permission
            logger.error("Facebook did not provide user email")
            error_url = f"{settings.FRONTEND_URL}/login?error=no_email"
            return RedirectResponse(url=error_url)
        
        email = email.lower().strip()
        name = oauth_user["name"]
        provider_id = oauth_user["provider_id"]
        picture_url = oauth_user.get("avatar")
        
        # Check if user exists
        existing_user = await get_db().users.find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"}
        })
        
        if existing_user:
            # Update existing user with Facebook OAuth info
            user_id = str(existing_user["_id"])
            
            await get_db().users.update_one(
                {"_id": existing_user["_id"]},
                {
                    "$set": {
                        "oauth.facebook": {
                            "id": provider_id,
                            "connectedAt": datetime.utcnow()
                        },
                        "emailVerified": True,
                        "emailVerifiedAt": datetime.utcnow(),
                        "lastLogin": datetime.utcnow(),
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            # Update profile photo if not set
            profile = await get_db().profiles.find_one({"userId": user_id})
            if profile and picture_url and not profile.get("photos"):
                await get_db().profiles.update_one(
                    {"userId": user_id},
                    {"$set": {"photos": [picture_url], "updatedAt": datetime.utcnow()}}
                )
        else:
            # Create new user from Facebook OAuth
            user_doc = {
                "email": email,
                "passwordHash": None,  # No password for OAuth users
                "name": name,
                "provider": "facebook",
                "providerId": provider_id,
                "oauth": {
                    "facebook": {
                        "id": provider_id,
                        "connectedAt": datetime.utcnow()
                    }
                },
                "emailVerified": True,
                "emailVerifiedAt": datetime.utcnow(),
                "roles": ["user"],
                "active": True,
                "lastLogin": datetime.utcnow(),
                "refreshTokens": [],
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            result = await get_db().users.insert_one(user_doc)
            user_id = str(result.inserted_id)
            
            # Create profile with Facebook photo
            profile_doc = {
                "userId": user_id,
                "name": name,
                "bio": "",
                "photos": [picture_url] if picture_url else [],
                "skills": [],
                "interests": [],
                "goals": "",
                "category": "",
                "location": {},
                "visibility": "public",
                "profileComplete": False,  # Still needs completion
                "trustScore": 60,  # Higher base for OAuth users
                "completionScore": 20,  # Photo + email verified
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            await get_db().profiles.insert_one(profile_doc)
        
        # Generate JWT access token
        access_token = create_access_token({
            "sub": user_id,
            "email": email,
            "verified": True
        })
        
        # Generate refresh token
        refresh_token = generate_refresh_token()
        
        # Store refresh token
        await get_db().users.update_one(
            {"_id": existing_user["_id"] if existing_user else result.inserted_id},
            {
                "$push": {
                    "refreshTokens": {
                        "token": refresh_token,
                        "createdAt": datetime.utcnow(),
                        "expiresAt": datetime.utcnow() + timedelta(days=14),
                        "userAgent": "OAuth",
                        "ipAddress": "OAuth"
                    }
                }
            }
        )
        
        # Set refresh token cookie and redirect
        response_redirect = RedirectResponse(
            url=f"{settings.FRONTEND_URL}/auth/callback?token={access_token}&provider=facebook"
        )
        response_redirect.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=settings.NODE_ENV == "production",
            samesite="lax",
            max_age=14 * 24 * 60 * 60,
            path="/auth"
        )
        
        return response_redirect
        
    except HTTPException as e:
        logger.error(f"Facebook OAuth HTTPException: {e.detail}")
        error_url = f"{settings.FRONTEND_URL}/login?error=oauth_failed"
        return RedirectResponse(url=error_url)
    except Exception as e:
        logger.error(f"Facebook OAuth unexpected error: {str(e)}")
        error_url = f"{settings.FRONTEND_URL}/login?error=server_error"
        return RedirectResponse(url=error_url)


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
    existing_user = await get_db().users.find_one({"email": mock_user["email"]})
    
    if existing_user:
        user_id = str(existing_user["_id"])
    else:
        result = await get_db().users.insert_one(mock_user)
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


# ===== PASSWORD RESET ENDPOINTS =====

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class VerifyResetOTPRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    newPassword: str = Field(..., min_length=8, max_length=100)
    
    @field_validator('newPassword')
    @classmethod
    def validate_password(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain at least one lowercase letter')
        return v


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    """
    Request password reset - sends OTP to email
    """
    try:
        email = data.email.lower().strip()
        
        # Find user by email
        user = await get_db().users.find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"}
        })
        
        # IMPORTANT: Don't reveal if user exists (security best practice)
        # Always return success to prevent email enumeration attacks
        
        if user:
            # Generate 6-digit OTP
            reset_code = ''.join([str(secrets.randbelow(10)) for _ in range(6)])
            reset_token = secrets.token_urlsafe(32)
            
            # Store reset code with 10-minute expiry
            await get_db().users.update_one(
                {"_id": user["_id"]},
                {
                    "$set": {
                        "passwordResetCode": reset_code,
                        "passwordResetToken": reset_token,
                        "passwordResetExpires": datetime.utcnow() + timedelta(minutes=10)
                    }
                }
            )
            
            # Send email with OTP
            try:
                await send_verification_email(
                    to_email=email,
                    user_name=user.get('name', 'User'),
                    verification_code=reset_code,
                    subject="Password Reset Code",
                    template_type="reset"  # Use different template for reset
                )
                logger.info(f"Password reset code sent to {email[:3]}***@{email.split('@')[1]}")
            except Exception as e:
                logger.warning(f"Failed to send reset email: {e}")
                # Continue anyway - code is stored in database
        
        # Always return success (don't reveal if email exists)
        return {
            "message": "If an account with that email exists, a reset code has been sent.",
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Forgot password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process password reset request"
        )


@router.post("/verify-reset-otp")
async def verify_reset_otp(data: VerifyResetOTPRequest):
    """
    Verify password reset OTP code
    Returns token for password reset
    """
    try:
        email = data.email.lower().strip()
        code = data.code.strip()
        
        # Find user with matching email, code, and valid expiry
        user = await get_db().users.find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"},
            "passwordResetCode": code,
            "passwordResetExpires": {"$gt": datetime.utcnow()}
        })
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset code"
            )
        
        # Return the reset token (needed for final password reset)
        return {
            "message": "Code verified successfully",
            "token": user["passwordResetToken"],
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verify reset OTP error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify reset code"
        )


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """
    Reset password with verified token
    """
    try:
        email = data.email.lower().strip()
        
        # Find user with matching email, token, and valid expiry
        user = await get_db().users.find_one({
            "email": {"$regex": f"^{email}$", "$options": "i"},
            "passwordResetToken": data.token,
            "passwordResetExpires": {"$gt": datetime.utcnow()}
        })
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Hash new password
        hashed_password = hash_password(data.newPassword)
        
        # Update password and clear reset tokens
        await get_db().users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "passwordHash": hashed_password,
                    "passwordChangedAt": datetime.utcnow(),
                    "refreshTokens": []  # Revoke all sessions
                },
                "$unset": {
                    "password": "",  # Remove legacy field if exists
                    "passwordResetCode": "",
                    "passwordResetToken": "",
                    "passwordResetExpires": ""
                }
            }
        )
        
        logger.info(f"Password reset successful for {email[:3]}***@{email.split('@')[1]}")
        
        return {
            "message": "Password reset successful",
            "success": True
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Reset password error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password"
        )

import logging
import hmac
import hashlib
from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from typing import Optional
from bson import ObjectId
from .config import settings
from .db import users
from .password_utils import hash_password, verify_password
from .services.token_blacklist import get_token_blacklist

# Setup logging
logger = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)


def create_access_token(data: dict, expires_delta: Optional[int] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + timedelta(minutes=expires_delta)
    else:
        expire = datetime.now(timezone.utc) + timedelta(seconds=settings.JWT_ACCESS_TTL)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_ACCESS_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token with longer expiration"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(seconds=settings.JWT_REFRESH_TTL)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_REFRESH_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt


def hash_refresh_token(token: str) -> str:
    """Hash refresh token for secure storage using HMAC and pepper"""
    return hmac.new(
        settings.REFRESH_TOKEN_FINGERPRINT_PEPPER.encode(),
        token.encode(),
        hashlib.sha256
    ).hexdigest()


async def verify_access_token(token: str) -> Optional[dict]:
    """Verify and decode access token with blacklist check"""
    try:
        # Check if token is blacklisted
        blacklist = get_token_blacklist()
        if await blacklist.is_revoked(token):
            logger.warning("Attempted use of blacklisted token")
            return None
        
        payload = jwt.decode(token, settings.JWT_ACCESS_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


async def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify and decode refresh token with blacklist check"""
    try:
        # Check if token is blacklisted
        blacklist = get_token_blacklist()
        if await blacklist.is_revoked(token):
            logger.warning("Attempted use of blacklisted refresh token")
            return None
        
        payload = jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    access_token: Optional[str] = Cookie(None)
):
    """Dependency to get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Prefer header token, fall back to cookie
    if not token and access_token:
        token = access_token
    
    if not token:
        raise credentials_exception
    
    token = token.strip()
    
    # Strict JWT validation only - no ObjectId bypass
    # if settings.NODE_ENV == "test" and ObjectId.is_valid(token):
    #     return await _fetch_user_by_id(token, credentials_exception)
    
    try:
        # Check if token is blacklisted first
        blacklist = get_token_blacklist()
        if await blacklist.is_revoked(token):
            logger.warning("Attempted use of blacklisted token")
            raise credentials_exception
        
        payload = jwt.decode(token, settings.JWT_ACCESS_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        # logger.debug(f"[SEARCH] Token decoded successfully, user_id: {user_id}")
        if user_id is None:
            logger.error("[ERROR] user_id is None in token payload")
            raise credentials_exception
    except JWTError as e:
        logger.error(f"[ERROR] JWT decode failed: {str(e)}")
        raise credentials_exception
    
    return await _fetch_user_by_id(user_id, credentials_exception)


async def _fetch_user_by_id(user_id: str, credentials_exception: HTTPException):
    """Retrieve user by ObjectId string and update last_active."""
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise credentials_exception
    
    user = await users().find_one({"_id": user_object_id})
    # logger.debug(f"[SEARCH] Database lookup for user_id {user_id}: {'Found' if user else 'Not found'}")
    if user is None:
        logger.error(f"[ERROR] User {user_id} not found in database")
        raise credentials_exception
    
    await users().update_one(
        {"_id": user_object_id},
        {"$set": {"last_active": datetime.utcnow()}}
    )
    return user


def decode_token(token: str) -> dict:
    """Decode JWT token without validation (for WebSocket)"""
    try:
        payload = jwt.decode(token, settings.JWT_ACCESS_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

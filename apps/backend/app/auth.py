from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional
from bson import ObjectId
from .config import settings
from .db import users

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token", auto_error=False)


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


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


def verify_access_token(token: str) -> Optional[dict]:
    """Verify and decode access token"""
    try:
        payload = jwt.decode(token, settings.JWT_ACCESS_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_refresh_token(token: str) -> Optional[dict]:
    """Verify and decode refresh token"""
    try:
        payload = jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            return None
        return payload
    except JWTError:
        return None


async def get_current_user(token: Optional[str] = Depends(oauth2_scheme)):
    """Dependency to get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        raise credentials_exception
    
    token = token.strip()
    
    # Allow plain ObjectId tokens in non-production environments for testing
    if settings.NODE_ENV != "production" and ObjectId.is_valid(token):
        return await _fetch_user_by_id(token, credentials_exception)
    
    try:
        payload = jwt.decode(token, settings.JWT_ACCESS_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        print(f"[SEARCH] DEBUG - Token decoded successfully, user_id: {user_id}")
        if user_id is None:
            print("[ERROR] DEBUG - user_id is None in token payload")
            raise credentials_exception
    except JWTError as e:
        print(f"[ERROR] DEBUG - JWT decode failed: {str(e)}")
        raise credentials_exception
    
    return await _fetch_user_by_id(user_id, credentials_exception)


async def _fetch_user_by_id(user_id: str, credentials_exception: HTTPException):
    """Retrieve user by ObjectId string and update last_active."""
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        raise credentials_exception
    
    user = await users().find_one({"_id": user_object_id})
    print(f"[SEARCH] DEBUG - Database lookup for user_id {user_id}: {'Found' if user else 'Not found'}")
    if user is None:
        print(f"[ERROR] DEBUG - User {user_id} not found in database")
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

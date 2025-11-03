"""
Advanced Rate Limiting with Redis Backend
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, HTTPException, status
from typing import Callable, Optional
import redis.asyncio as aioredis
import logging

logger = logging.getLogger(__name__)


# Default rate limiter (uses in-memory storage)
limiter = Limiter(key_func=get_remote_address)


async def init_redis_limiter(redis_url: str) -> Optional[Limiter]:
    """
    Initialize rate limiter with Redis backend for distributed rate limiting
    
    Args:
        redis_url: Redis connection URL (e.g., redis://localhost:6379)
    
    Returns:
        Limiter instance with Redis storage or None if connection fails
    
    Usage:
        from app.middleware.rate_limit import init_redis_limiter
        
        redis_limiter = await init_redis_limiter(settings.REDIS_URL)
        if redis_limiter:
            app.state.limiter = redis_limiter
    """
    try:
        # Create Redis client
        redis_client = await aioredis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True
        )
        
        # Test connection
        await redis_client.ping()
        
        # Create limiter with Redis storage
        redis_limiter = Limiter(
            key_func=get_remote_address,
            storage_uri=redis_url,
        )
        
        logger.info(f"✅ Redis rate limiter initialized: {redis_url}")
        return redis_limiter
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize Redis rate limiter: {e}")
        logger.warning("⚠️  Falling back to in-memory rate limiting")
        return None


def get_user_id_key(request: Request) -> str:
    """
    Get rate limit key based on authenticated user ID (if available)
    Falls back to IP address for anonymous users
    
    Usage:
        @app.get("/api/protected")
        @limiter.limit("100/hour", key_func=get_user_id_key)
        async def protected_route(request: Request):
            return {"status": "ok"}
    """
    # Try to get user from request state (set by auth middleware)
    if hasattr(request.state, "user") and request.state.user:
        return f"user:{request.state.user.get('id', request.state.user.get('sub'))}"
    
    # Fall back to IP address
    return get_remote_address(request)


def get_api_key(request: Request) -> str:
    """
    Get rate limit key based on API key
    
    Usage:
        @app.get("/api/external")
        @limiter.limit("1000/hour", key_func=get_api_key)
        async def external_api(request: Request):
            return {"status": "ok"}
    """
    # Get API key from header
    api_key = request.headers.get("X-API-Key")
    if api_key:
        return f"api_key:{api_key}"
    
    # Fall back to IP address
    return get_remote_address(request)


# Pre-configured rate limit decorators
class RateLimits:
    """
    Pre-configured rate limits for common use cases
    
    Usage:
        from app.middleware.rate_limit import RateLimits
        
        @app.post("/auth/register")
        @RateLimits.auth_endpoint
        async def register(request: Request):
            return {"status": "ok"}
    """
    
    # Authentication endpoints (stricter)
    auth_endpoint = limiter.limit("5/minute")
    
    # Public API endpoints (moderate)
    public_api = limiter.limit("100/hour")
    
    # Authenticated API endpoints (generous)
    authenticated_api = limiter.limit("1000/hour", key_func=get_user_id_key)
    
    # File upload endpoints (very strict)
    file_upload = limiter.limit("10/hour", key_func=get_user_id_key)
    
    # Search endpoints (moderate)
    search_endpoint = limiter.limit("50/minute", key_func=get_user_id_key)
    
    # Real-time endpoints (generous)
    realtime_endpoint = limiter.limit("500/minute", key_func=get_user_id_key)


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit exceeded errors
    
    Returns detailed error with retry-after header
    """
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={
            "error": "rate_limit_exceeded",
            "message": "Too many requests. Please try again later.",
            "retry_after": exc.retry_after if hasattr(exc, 'retry_after') else 60
        },
        headers={
            "Retry-After": str(exc.retry_after if hasattr(exc, 'retry_after') else 60)
        }
    )


# Rate limit configuration per endpoint type
RATE_LIMITS = {
    "auth": {
        "login": "5/minute",
        "register": "3/minute",
        "password_reset": "3/hour",
        "verify_email": "5/hour"
    },
    "api": {
        "read": "100/minute",
        "write": "50/minute",
        "delete": "20/minute"
    },
    "upload": {
        "image": "10/hour",
        "file": "5/hour",
        "video": "2/hour"
    },
    "search": {
        "text": "50/minute",
        "autocomplete": "100/minute"
    }
}


def get_rate_limit(endpoint_type: str, action: str = "default") -> str:
    """
    Get rate limit string for specific endpoint type and action
    
    Args:
        endpoint_type: Type of endpoint (auth, api, upload, search)
        action: Specific action (login, register, etc.)
    
    Returns:
        Rate limit string (e.g., "5/minute")
    
    Example:
        limit = get_rate_limit("auth", "login")  # Returns "5/minute"
        @limiter.limit(limit)
        async def login_endpoint():
            pass
    """
    return RATE_LIMITS.get(endpoint_type, {}).get(action, "60/minute")

import redis.asyncio as aioredis
import json
from typing import Optional, Any
from ..config import settings

class RedisService:
    """
    Redis service for caching and session management.
    Handles connection pooling and common operations.
    """
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self.ttl = 3600  # Default TTL: 1 hour

    async def connect(self):
        """Initialize Redis connection"""
        if not self.redis:
            self.redis = aioredis.from_url(
                settings.REDIS_URL or "redis://localhost:6379",
                encoding="utf-8",
                decode_responses=True,
                max_connections=10
            )

    async def close(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            self.redis = None

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis:
            await self.connect()
        try:
            value = await self.redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception:
            return None

    async def set(self, key: str, value: Any, ttl: int = None):
        """Set value in cache"""
        if not self.redis:
            await self.connect()
        try:
            await self.redis.set(
                key, 
                json.dumps(value), 
                ex=ttl or self.ttl
            )
        except Exception:
            pass

    async def delete(self, key: str):
        """Delete value from cache"""
        if not self.redis:
            await self.connect()
        try:
            await self.redis.delete(key)
        except Exception:
            pass

# Global instance
redis_service = RedisService()

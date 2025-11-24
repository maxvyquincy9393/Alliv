"""
Token Blacklist Service

Redis-based token blacklist for immediate token revocation.
Provides graceful fallback to in-memory storage if Redis is unavailable.
"""
import logging
import time
from typing import Optional, Set
from datetime import datetime, timedelta
import redis.asyncio as redis

from ..config import settings

logger = logging.getLogger(__name__)


class TokenBlacklist:
    """
    Token blacklist service for revoking JWT tokens before expiration.
    
    Features:
    - Redis-based storage with automatic TTL
    - Graceful fallback to in-memory storage
    - Bulk revocation support
    - Automatic cleanup of expired entries
    """
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self._memory_blacklist: Set[str] = set()  # Fallback storage
        self._memory_expiry: dict = {}  # Track expiry times for memory fallback
    
    async def _get_redis_client(self) -> Optional[redis.Redis]:
        """Get Redis client with connection check"""
        if not settings.REDIS_URL:
            return None
        
        try:
            if self.redis_client is None:
                self.redis_client = redis.Redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True
                )
            
            # Test connection
            await self.redis_client.ping()
            return self.redis_client
        except Exception as e:
            logger.warning(f"[WARN] Redis unavailable for token blacklist: {e}")
            return None
    
    async def revoke_token(self, token: str, exp_time: int) -> bool:
        """
        Blacklist a token until its expiration time.
        
        Args:
            token: JWT token to blacklist
            exp_time: Token expiration timestamp (Unix timestamp)
        
        Returns:
            True if successfully blacklisted, False otherwise
        """
        try:
            # Calculate TTL (time until token expires)
            current_time = int(datetime.utcnow().timestamp())
            ttl = exp_time - current_time
            
            if ttl <= 0:
                # Token already expired, no need to blacklist
                logger.debug(f"Token already expired, skipping blacklist")
                return True
            
            redis_client = await self._get_redis_client()
            
            if redis_client:
                # Use Redis for distributed blacklist
                key = f"token:blacklist:{token}"
                await redis_client.setex(key, ttl, "1")
                logger.info(f"Token blacklisted in Redis (TTL: {ttl}s)")
                return True
            else:
                # Fallback to in-memory storage
                self._memory_blacklist.add(token)
                self._memory_expiry[token] = exp_time
                logger.info(f"Token blacklisted in memory (TTL: {ttl}s)")
                return True
                
        except Exception as e:
            logger.error(f"Failed to blacklist token: {e}")
            # Fallback to memory even on Redis errors
            self._memory_blacklist.add(token)
            self._memory_expiry[token] = exp_time
            return True
    
    async def is_revoked(self, token: str) -> bool:
        """
        Check if a token is blacklisted.
        
        Args:
            token: JWT token to check
        
        Returns:
            True if token is blacklisted, False otherwise
        """
        try:
            redis_client = await self._get_redis_client()
            
            if redis_client:
                # Check Redis
                key = f"token:blacklist:{token}"
                exists = await redis_client.exists(key)
                return exists > 0
            else:
                # Check in-memory storage
                if token in self._memory_blacklist:
                    # Verify not expired
                    exp_time = self._memory_expiry.get(token, 0)
                    current_time = int(datetime.utcnow().timestamp())
                    
                    if current_time < exp_time:
                        return True
                    else:
                        # Clean up expired token
                        self._memory_blacklist.discard(token)
                        self._memory_expiry.pop(token, None)
                        return False
                
                return False
                
        except Exception as e:
            logger.error(f"Failed to check token blacklist: {e}")
            # On error, check memory fallback
            return token in self._memory_blacklist
    
    async def revoke_all_user_tokens(self, user_id: str, tokens: list[str]) -> int:
        """
        Revoke all tokens for a specific user (logout from all devices).
        
        Args:
            user_id: User ID
            tokens: List of token dictionaries with 'token' and 'exp' fields
        
        Returns:
            Number of tokens successfully revoked
        """
        revoked_count = 0
        
        for token_data in tokens:
            token = token_data.get("token")
            exp = token_data.get("exp")
            
            if token and exp:
                success = await self.revoke_token(token, exp)
                if success:
                    revoked_count += 1
        
        logger.info(f"Revoked {revoked_count}/{len(tokens)} tokens for user {user_id}")
        return revoked_count
    
    async def cleanup_expired(self) -> int:
        """
        Clean up expired tokens from in-memory storage.
        Redis handles this automatically with TTL.
        
        Returns:
            Number of expired tokens removed
        """
        current_time = int(datetime.utcnow().timestamp())
        expired_tokens = []
        
        for token, exp_time in self._memory_expiry.items():
            if current_time >= exp_time:
                expired_tokens.append(token)
        
        for token in expired_tokens:
            self._memory_blacklist.discard(token)
            self._memory_expiry.pop(token, None)
        
        if expired_tokens:
            logger.info(f"Cleaned up {len(expired_tokens)} expired tokens from memory")
        
        return len(expired_tokens)
    
    async def get_stats(self) -> dict:
        """
        Get blacklist statistics.
        
        Returns:
            Dictionary with blacklist stats
        """
        redis_client = await self._get_redis_client()
        
        stats = {
            "backend": "redis" if redis_client else "memory",
            "memory_tokens": len(self._memory_blacklist)
        }
        
        if redis_client:
            try:
                # Count Redis keys (approximate)
                cursor = 0
                count = 0
                pattern = "token:blacklist:*"
                
                while True:
                    cursor, keys = await redis_client.scan(
                        cursor=cursor,
                        match=pattern,
                        count=100
                    )
                    count += len(keys)
                    
                    if cursor == 0:
                        break
                
                stats["redis_tokens"] = count
            except Exception as e:
                logger.error(f"Failed to get Redis stats: {e}")
                stats["redis_tokens"] = "unknown"
        
        return stats
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.aclose()
            self.redis_client = None


# Singleton instance
_token_blacklist = TokenBlacklist()


def get_token_blacklist() -> TokenBlacklist:
    """Get the singleton token blacklist instance"""
    return _token_blacklist

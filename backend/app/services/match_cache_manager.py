"""
Match Cache Manager Service

Intelligent cache management for AI match scores with automatic invalidation.
Ensures match scores stay fresh when profiles are updated.
"""
import logging
import asyncio
from typing import List, Optional, Set
import redis.asyncio as redis

from ..config import settings

logger = logging.getLogger(__name__)


class MatchCacheManager:
    """
    Manages caching and invalidation of match scores.
    
    Features:
    - Automatic cache invalidation on profile updates
    - Bulk invalidation for performance
    - Pattern-based key scanning
    - TTL management
    - Statistics tracking
    """
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.default_ttl = 3600  # 1 hour
        self.match_key_prefix = "match:"
    
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
            
            await self.redis_client.ping()
            return self.redis_client
        except Exception as e:
            logger.warning(f"[WARN] Redis unavailable for match cache: {e}")
            return None
    
    async def invalidate_user_matches(self, user_id: str) -> int:
        """
        Invalidate all cached matches for a specific user.
        
        This is called when a user updates their profile to ensure
        match scores are recalculated with fresh data.
        
        Args:
            user_id: User ID whose matches should be invalidated
        
        Returns:
            Number of cache entries invalidated
        """
        redis_client = await self._get_redis_client()
        if not redis_client:
            return 0
        
        try:
            invalidated_count = 0
            
            # Scan for all match keys containing this user_id
            # Pattern: match:*user_id* or match:user_id:*
            patterns = [
                f"{self.match_key_prefix}*{user_id}*",
                f"{self.match_key_prefix}{user_id}:*",
                f"{self.match_key_prefix}*:{user_id}"
            ]
            
            keys_to_delete: Set[str] = set()
            
            for pattern in patterns:
                cursor = 0
                while True:
                    cursor, keys = await redis_client.scan(
                        cursor=cursor,
                        match=pattern,
                        count=100
                    )
                    keys_to_delete.update(keys)
                    
                    if cursor == 0:
                        break
            
            # Delete all found keys
            if keys_to_delete:
                await redis_client.delete(*keys_to_delete)
                invalidated_count = len(keys_to_delete)
            
            logger.info(f"Invalidated {invalidated_count} match cache entries for user {user_id}")
            return invalidated_count
            
        except Exception as e:
            logger.error(f"Failed to invalidate user matches: {e}")
            return 0
    
    async def bulk_invalidate(self, user_ids: List[str]) -> int:
        """
        Batch invalidation for multiple users (performance optimization).
        
        Args:
            user_ids: List of user IDs
        
        Returns:
            Total number of cache entries invalidated
        """
        if not user_ids:
            return 0
        
        try:
            # Run invalidations concurrently
            tasks = [self.invalidate_user_matches(uid) for uid in user_ids]
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Sum up successful invalidations
            total_invalidated = sum(r for r in results if isinstance(r, int))
            
            logger.info(f"Bulk invalidated {total_invalidated} cache entries for {len(user_ids)} users")
            return total_invalidated
            
        except Exception as e:
            logger.error(f"Bulk invalidation error: {e}")
            return 0
    
    async def invalidate_match_pair(self, user1_id: str, user2_id: str) -> bool:
        """
        Invalidate cache for a specific user pair.
        
        Args:
            user1_id: First user ID
            user2_id: Second user ID
        
        Returns:
            True if invalidated successfully
        """
        redis_client = await self._get_redis_client()
        if not redis_client:
            return False
        
        try:
            # Create deterministic cache key (sorted)
            cache_key = f"{self.match_key_prefix}{min(user1_id, user2_id)}:{max(user1_id, user2_id)}"
            
            result = await redis_client.delete(cache_key)
            
            if result > 0:
                logger.debug(f"Invalidated match cache for pair {user1_id}-{user2_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to invalidate match pair: {e}")
            return False
    
    async def set_match_cache(
        self,
        user1_id: str,
        user2_id: str,
        score: float,
        breakdown: dict,
        reasons: List[str],
        ttl: Optional[int] = None
    ) -> bool:
        """
        Set match cache with custom TTL.
        
        Args:
            user1_id: First user ID
            user2_id: Second user ID
            score: Match score
            breakdown: Score breakdown
            reasons: Match reasons
            ttl: Time to live in seconds (default: 1 hour)
        
        Returns:
            True if cached successfully
        """
        redis_client = await self._get_redis_client()
        if not redis_client:
            return False
        
        try:
            import json
            
            cache_key = f"{self.match_key_prefix}{min(user1_id, user2_id)}:{max(user1_id, user2_id)}"
            cache_value = json.dumps({
                'score': score,
                'breakdown': breakdown,
                'reasons': reasons
            })
            
            ttl = ttl or self.default_ttl
            await redis_client.setex(cache_key, ttl, cache_value)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to set match cache: {e}")
            return False
    
    async def get_cache_stats(self) -> dict:
        """
        Get cache statistics.
        
        Returns:
            Dictionary with cache stats
        """
        redis_client = await self._get_redis_client()
        
        stats = {
            "enabled": redis_client is not None,
            "total_match_keys": 0,
            "memory_usage_mb": 0
        }
        
        if redis_client:
            try:
                # Count match keys
                cursor = 0
                count = 0
                
                while True:
                    cursor, keys = await redis_client.scan(
                        cursor=cursor,
                        match=f"{self.match_key_prefix}*",
                        count=1000
                    )
                    count += len(keys)
                    
                    if cursor == 0:
                        break
                
                stats["total_match_keys"] = count
                
                # Get memory info
                info = await redis_client.info("memory")
                stats["memory_usage_mb"] = round(
                    info.get("used_memory", 0) / (1024 * 1024),
                    2
                )
                
            except Exception as e:
                logger.error(f"Failed to get cache stats: {e}")
        
        return stats
    
    async def clear_all_match_cache(self) -> int:
        """
        Clear all match cache entries (use with caution).
        
        Returns:
            Number of entries cleared
        """
        redis_client = await self._get_redis_client()
        if not redis_client:
            return 0
        
        try:
            keys_to_delete: Set[str] = set()
            cursor = 0
            
            while True:
                cursor, keys = await redis_client.scan(
                    cursor=cursor,
                    match=f"{self.match_key_prefix}*",
                    count=1000
                )
                keys_to_delete.update(keys)
                
                if cursor == 0:
                    break
            
            if keys_to_delete:
                await redis_client.delete(*keys_to_delete)
                cleared_count = len(keys_to_delete)
                logger.warning(f"Cleared {cleared_count} match cache entries")
                return cleared_count
            
            return 0
            
        except Exception as e:
            logger.error(f"Failed to clear match cache: {e}")
            return 0
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.aclose()
            self.redis_client = None


# Singleton instance
_match_cache_manager = MatchCacheManager()


def get_match_cache_manager() -> MatchCacheManager:
    """Get the singleton match cache manager instance"""
    return _match_cache_manager

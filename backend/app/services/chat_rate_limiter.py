"""
Chat Rate Limiter Service

Prevents spam and abuse in real-time chat with per-conversation and per-user rate limiting.
"""
import logging
from typing import Optional, Dict
from datetime import datetime, timedelta
import redis.asyncio as redis

from ..config import settings

logger = logging.getLogger(__name__)


class ChatRateLimiter:
    """
    Rate limiting for chat messages to prevent spam.
    
    Features:
    - Per-user message rate limiting
    - Per-conversation rate limiting
    - Sliding window algorithm
    - Redis-based tracking
    - Configurable limits
    """
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        
        # Rate limits (configurable via settings)
        self.max_messages_per_minute = getattr(settings, 'MAX_MESSAGES_PER_MINUTE', 30)
        self.max_messages_per_conversation_per_day = getattr(
            settings, 'MAX_MESSAGES_PER_CONVERSATION_PER_DAY', 500
        )
        self.max_message_length = getattr(settings, 'MAX_MESSAGE_LENGTH', 5000)
    
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
            logger.warning(f"[WARN] Redis unavailable for chat rate limiting: {e}")
            return None
    
    async def check_user_rate_limit(self, user_id: str) -> Dict[str, any]:
        """
        Check if user is within rate limits.
        
        Args:
            user_id: User ID
        
        Returns:
            Dictionary with 'allowed', 'remaining', 'reset_at'
        """
        redis_client = await self._get_redis_client()
        
        if not redis_client:
            # If Redis unavailable, allow (graceful degradation)
            return {
                'allowed': True,
                'remaining': self.max_messages_per_minute,
                'reset_at': None
            }
        
        try:
            key = f"chat_rate:user:{user_id}"
            current_time = datetime.utcnow()
            window_start = current_time - timedelta(minutes=1)
            
            # Remove old entries
            await redis_client.zremrangebyscore(
                key,
                '-inf',
                window_start.timestamp()
            )
            
            # Count messages in current window
            count = await redis_client.zcard(key)
            
            if count >= self.max_messages_per_minute:
                # Get oldest message timestamp for reset time
                oldest = await redis_client.zrange(key, 0, 0, withscores=True)
                reset_at = datetime.fromtimestamp(oldest[0][1]) + timedelta(minutes=1) if oldest else None
                
                return {
                    'allowed': False,
                    'remaining': 0,
                    'reset_at': reset_at.isoformat() if reset_at else None,
                    'limit': self.max_messages_per_minute
                }
            
            # Add current message
            await redis_client.zadd(key, {str(current_time.timestamp()): current_time.timestamp()})
            await redis_client.expire(key, 60)  # 1 minute TTL
            
            return {
                'allowed': True,
                'remaining': self.max_messages_per_minute - count - 1,
                'reset_at': (current_time + timedelta(minutes=1)).isoformat(),
                'limit': self.max_messages_per_minute
            }
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            # Allow on error (fail open)
            return {'allowed': True, 'remaining': None, 'reset_at': None}
    
    async def check_conversation_rate_limit(
        self,
        user_id: str,
        conversation_id: str
    ) -> Dict[str, any]:
        """
        Check per-conversation daily rate limit.
        
        Args:
            user_id: User ID
            conversation_id: Conversation ID
        
        Returns:
            Dictionary with 'allowed', 'remaining', 'reset_at'
        """
        redis_client = await self._get_redis_client()
        
        if not redis_client:
            return {'allowed': True, 'remaining': None, 'reset_at': None}
        
        try:
            key = f"chat_rate:conv:{conversation_id}:user:{user_id}"
            current_time = datetime.utcnow()
            day_start = current_time.replace(hour=0, minute=0, second=0, microsecond=0)
            
            # Remove old entries (older than 24 hours)
            await redis_client.zremrangebyscore(
                key,
                '-inf',
                day_start.timestamp()
            )
            
            # Count messages today
            count = await redis_client.zcard(key)
            
            if count >= self.max_messages_per_conversation_per_day:
                reset_at = day_start + timedelta(days=1)
                
                return {
                    'allowed': False,
                    'remaining': 0,
                    'reset_at': reset_at.isoformat(),
                    'limit': self.max_messages_per_conversation_per_day
                }
            
            # Add current message
            await redis_client.zadd(key, {str(current_time.timestamp()): current_time.timestamp()})
            await redis_client.expire(key, 86400)  # 24 hours TTL
            
            return {
                'allowed': True,
                'remaining': self.max_messages_per_conversation_per_day - count - 1,
                'reset_at': (day_start + timedelta(days=1)).isoformat(),
                'limit': self.max_messages_per_conversation_per_day
            }
            
        except Exception as e:
            logger.error(f"Conversation rate limit check failed: {e}")
            return {'allowed': True, 'remaining': None, 'reset_at': None}
    
    def check_message_length(self, message: str) -> Dict[str, any]:
        """
        Check if message length is within limits.
        
        Args:
            message: Message text
        
        Returns:
            Dictionary with 'allowed', 'length', 'max_length'
        """
        length = len(message)
        
        return {
            'allowed': length <= self.max_message_length,
            'length': length,
            'max_length': self.max_message_length
        }
    
    async def is_spam_pattern(self, user_id: str, message: str) -> bool:
        """
        Detect spam patterns (simple heuristics).
        
        Args:
            user_id: User ID
            message: Message text
        
        Returns:
            True if message appears to be spam
        """
        # Check for repeated characters
        if any(char * 10 in message for char in set(message)):
            return True
        
        # Check for all caps (if long enough)
        if len(message) > 20 and message.isupper():
            return True
        
        # Check for excessive URLs
        url_count = message.lower().count('http://') + message.lower().count('https://')
        if url_count > 3:
            return True
        
        # Check for excessive emojis (simple check)
        emoji_count = sum(1 for char in message if ord(char) > 127)
        if emoji_count > len(message) * 0.5 and len(message) > 10:
            return True
        
        return False
    
    async def get_rate_limit_stats(self, user_id: str) -> Dict:
        """
        Get rate limit statistics for a user.
        
        Args:
            user_id: User ID
        
        Returns:
            Dictionary with rate limit stats
        """
        user_limit = await self.check_user_rate_limit(user_id)
        
        return {
            'user_id': user_id,
            'per_minute_limit': self.max_messages_per_minute,
            'per_minute_remaining': user_limit.get('remaining'),
            'per_day_limit': self.max_messages_per_conversation_per_day,
            'max_message_length': self.max_message_length
        }
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.aclose()
            self.redis_client = None


# Singleton instance
_chat_rate_limiter = ChatRateLimiter()


def get_chat_rate_limiter() -> ChatRateLimiter:
    """Get the singleton chat rate limiter instance"""
    return _chat_rate_limiter

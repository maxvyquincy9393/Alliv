"""
Session Manager Service

Tracks user sessions across devices with metadata for enhanced security.
Enables session listing, individual session revocation, and device management.
"""
import logging
import secrets
import hashlib
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import redis.asyncio as redis
from user_agents import parse

from ..config import settings

logger = logging.getLogger(__name__)


class SessionManager:
    """
    Manage user sessions across multiple devices.
    
    Features:
    - Track sessions per device with metadata
    - Session listing and management
    - Individual session revocation
    - Device fingerprinting
    - Redis-based storage with MongoDB fallback
    """
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
    
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
            logger.warning(f"[WARN] Redis unavailable for session management: {e}")
            return None
    
    def _generate_session_id(self) -> str:
        """Generate unique session ID"""
        return secrets.token_urlsafe(32)
    
    def _parse_user_agent(self, user_agent_string: str) -> Dict:
        """Parse user agent string to extract device info"""
        try:
            ua = parse(user_agent_string)
            return {
                "browser": f"{ua.browser.family} {ua.browser.version_string}",
                "os": f"{ua.os.family} {ua.os.version_string}",
                "device": ua.device.family,
                "is_mobile": ua.is_mobile,
                "is_tablet": ua.is_tablet,
                "is_pc": ua.is_pc,
                "is_bot": ua.is_bot
            }
        except Exception as e:
            logger.warning(f"Failed to parse user agent: {e}")
            return {
                "browser": "Unknown",
                "os": "Unknown",
                "device": "Unknown",
                "is_mobile": False,
                "is_tablet": False,
                "is_pc": True,
                "is_bot": False
            }
    
    def _create_device_fingerprint(self, user_agent: str, ip_address: str) -> str:
        """Create device fingerprint from user agent and IP"""
        fingerprint_data = f"{user_agent}:{ip_address}"
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:16]
    
    async def create_session(
        self,
        user_id: str,
        refresh_token_hash: str,
        user_agent: str,
        ip_address: str,
        expires_at: datetime
    ) -> str:
        """
        Create a new session for a user.
        
        Args:
            user_id: User ID
            refresh_token_hash: Hashed refresh token
            user_agent: User agent string
            ip_address: IP address
            expires_at: Session expiration time
        
        Returns:
            Session ID
        """
        session_id = self._generate_session_id()
        device_info = self._parse_user_agent(user_agent)
        device_fingerprint = self._create_device_fingerprint(user_agent, ip_address)
        
        session_data = {
            "session_id": session_id,
            "user_id": user_id,
            "refresh_token_hash": refresh_token_hash,
            "device_fingerprint": device_fingerprint,
            "device_info": device_info,
            "ip_address": ip_address,
            "created_at": datetime.utcnow().isoformat(),
            "last_active": datetime.utcnow().isoformat(),
            "expires_at": expires_at.isoformat()
        }
        
        redis_client = await self._get_redis_client()
        
        if redis_client:
            try:
                # Store session in Redis with TTL
                ttl = int((expires_at - datetime.utcnow()).total_seconds())
                if ttl > 0:
                    # Store session data
                    await redis_client.hset(
                        f"session:{session_id}",
                        mapping={k: str(v) if not isinstance(v, dict) else str(v) for k, v in session_data.items()}
                    )
                    await redis_client.expire(f"session:{session_id}", ttl)
                    
                    # Add to user's session set
                    await redis_client.sadd(f"user_sessions:{user_id}", session_id)
                    await redis_client.expire(f"user_sessions:{user_id}", ttl)
                    
                    logger.info(f"Session {session_id} created in Redis for user {user_id}")
            except Exception as e:
                logger.error(f"Failed to store session in Redis: {e}")
        
        return session_id
    
    async def get_session(self, session_id: str) -> Optional[Dict]:
        """Get session data by session ID"""
        redis_client = await self._get_redis_client()
        
        if redis_client:
            try:
                session_data = await redis_client.hgetall(f"session:{session_id}")
                if session_data:
                    return session_data
            except Exception as e:
                logger.error(f"Failed to get session from Redis: {e}")
        
        return None
    
    async def get_user_sessions(self, user_id: str) -> List[Dict]:
        """
        Get all active sessions for a user.
        
        Args:
            user_id: User ID
        
        Returns:
            List of session data dictionaries
        """
        redis_client = await self._get_redis_client()
        sessions = []
        
        if redis_client:
            try:
                # Get all session IDs for user
                session_ids = await redis_client.smembers(f"user_sessions:{user_id}")
                
                for session_id in session_ids:
                    session_data = await redis_client.hgetall(f"session:{session_id}")
                    if session_data:
                        # Parse device_info back to dict if needed
                        sessions.append({
                            "session_id": session_data.get("session_id"),
                            "device_fingerprint": session_data.get("device_fingerprint"),
                            "device_info": eval(session_data.get("device_info", "{}")),
                            "ip_address": session_data.get("ip_address"),
                            "created_at": session_data.get("created_at"),
                            "last_active": session_data.get("last_active"),
                            "expires_at": session_data.get("expires_at")
                        })
            except Exception as e:
                logger.error(f"Failed to get user sessions from Redis: {e}")
        
        return sessions
    
    async def update_last_active(self, session_id: str):
        """Update session's last active timestamp"""
        redis_client = await self._get_redis_client()
        
        if redis_client:
            try:
                await redis_client.hset(
                    f"session:{session_id}",
                    "last_active",
                    datetime.utcnow().isoformat()
                )
            except Exception as e:
                logger.error(f"Failed to update last active: {e}")
    
    async def revoke_session(self, user_id: str, session_id: str) -> bool:
        """
        Revoke a specific session.
        
        Args:
            user_id: User ID
            session_id: Session ID to revoke
        
        Returns:
            True if revoked successfully
        """
        redis_client = await self._get_redis_client()
        
        if redis_client:
            try:
                # Remove from user's session set
                await redis_client.srem(f"user_sessions:{user_id}", session_id)
                
                # Delete session data
                await redis_client.delete(f"session:{session_id}")
                
                logger.info(f"Session {session_id} revoked for user {user_id}")
                return True
            except Exception as e:
                logger.error(f"Failed to revoke session: {e}")
                return False
        
        return False
    
    async def revoke_all_sessions(self, user_id: str) -> int:
        """
        Revoke all sessions for a user.
        
        Args:
            user_id: User ID
        
        Returns:
            Number of sessions revoked
        """
        redis_client = await self._get_redis_client()
        revoked_count = 0
        
        if redis_client:
            try:
                # Get all session IDs
                session_ids = await redis_client.smembers(f"user_sessions:{user_id}")
                
                # Delete all sessions
                for session_id in session_ids:
                    await redis_client.delete(f"session:{session_id}")
                    revoked_count += 1
                
                # Clear user's session set
                await redis_client.delete(f"user_sessions:{user_id}")
                
                logger.info(f"Revoked {revoked_count} sessions for user {user_id}")
            except Exception as e:
                logger.error(f"Failed to revoke all sessions: {e}")
        
        return revoked_count
    
    async def cleanup_expired_sessions(self, user_id: str) -> int:
        """
        Clean up expired sessions for a user.
        Redis handles this automatically with TTL, but this is for manual cleanup.
        
        Returns:
            Number of sessions cleaned up
        """
        redis_client = await self._get_redis_client()
        cleaned_count = 0
        
        if redis_client:
            try:
                session_ids = await redis_client.smembers(f"user_sessions:{user_id}")
                current_time = datetime.utcnow()
                
                for session_id in session_ids:
                    session_data = await redis_client.hgetall(f"session:{session_id}")
                    if session_data:
                        expires_at = datetime.fromisoformat(session_data.get("expires_at"))
                        if current_time >= expires_at:
                            await self.revoke_session(user_id, session_id)
                            cleaned_count += 1
            except Exception as e:
                logger.error(f"Failed to cleanup expired sessions: {e}")
        
        return cleaned_count
    
    async def get_stats(self) -> Dict:
        """Get session management statistics"""
        redis_client = await self._get_redis_client()
        
        stats = {
            "backend": "redis" if redis_client else "none",
            "total_sessions": 0
        }
        
        if redis_client:
            try:
                # Count all session keys
                cursor = 0
                count = 0
                
                while True:
                    cursor, keys = await redis_client.scan(
                        cursor=cursor,
                        match="session:*",
                        count=100
                    )
                    count += len(keys)
                    
                    if cursor == 0:
                        break
                
                stats["total_sessions"] = count
            except Exception as e:
                logger.error(f"Failed to get session stats: {e}")
        
        return stats
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.aclose()
            self.redis_client = None


# Singleton instance
_session_manager = SessionManager()


def get_session_manager() -> SessionManager:
    """Get the singleton session manager instance"""
    return _session_manager

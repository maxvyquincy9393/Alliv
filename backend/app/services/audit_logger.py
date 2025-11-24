"""
Audit Logger Service

Comprehensive audit trail logging for compliance and security monitoring.
Tracks all critical user actions and data changes.
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from bson import ObjectId

from ..db import get_db

logger = logging.getLogger(__name__)


class AuditLogger:
    """
    Service for logging audit trails of user actions.
    
    Features:
    - Profile change tracking
    - Security event logging
    - IP and user agent tracking
    - Query and export capabilities
    
    Audit Events:
    - profile.updated
    - profile.created
    - security.password_changed
    - security.2fa_enabled
    - security.2fa_disabled
    - auth.login
    - auth.logout
    - auth.failed_login
    """
    
    def __init__(self):
        self.collection_name = "audit_logs"
    
    async def log_event(
        self,
        user_id: str,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        old_value: Optional[Any] = None,
        new_value: Optional[Any] = None,
        metadata: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """
        Log an audit event.
        
        Args:
            user_id: User who performed the action
            action: Action performed (e.g., "profile.updated")
            resource_type: Type of resource (e.g., "profile", "user")
            resource_id: ID of the affected resource
            old_value: Previous value (for updates)
            new_value: New value (for updates)
            metadata: Additional metadata
            ip_address: IP address of the request
            user_agent: User agent string
        
        Returns:
            Audit log ID
        """
        try:
            audit_entry = {
                "user_id": user_id,
                "action": action,
                "resource_type": resource_type,
                "resource_id": resource_id,
                "old_value": old_value,
                "new_value": new_value,
                "metadata": metadata or {},
                "ip_address": ip_address,
                "user_agent": user_agent,
                "timestamp": datetime.utcnow(),
                "created_at": datetime.utcnow()
            }
            
            result = await get_db()[self.collection_name].insert_one(audit_entry)
            
            logger.info(f"Audit log created: {action} by user {user_id}")
            
            return str(result.inserted_id)
            
        except Exception as e:
            logger.error(f"Failed to create audit log: {e}")
            # Don't raise - audit logging should not break the main flow
            return ""
    
    async def log_profile_change(
        self,
        user_id: str,
        field: str,
        old_value: Any,
        new_value: Any,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """
        Log a profile field change.
        
        Args:
            user_id: User ID
            field: Field that was changed
            old_value: Previous value
            new_value: New value
            ip_address: IP address
            user_agent: User agent
        
        Returns:
            Audit log ID
        """
        return await self.log_event(
            user_id=user_id,
            action=f"profile.{field}.updated",
            resource_type="profile",
            resource_id=user_id,
            old_value=old_value,
            new_value=new_value,
            metadata={"field": field},
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    async def log_security_event(
        self,
        user_id: str,
        event_type: str,
        success: bool,
        metadata: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """
        Log a security-related event.
        
        Args:
            user_id: User ID
            event_type: Type of security event
            success: Whether the event was successful
            metadata: Additional metadata
            ip_address: IP address
            user_agent: User agent
        
        Returns:
            Audit log ID
        """
        metadata = metadata or {}
        metadata["success"] = success
        
        return await self.log_event(
            user_id=user_id,
            action=f"security.{event_type}",
            resource_type="security",
            resource_id=user_id,
            metadata=metadata,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    async def log_auth_event(
        self,
        user_id: str,
        event_type: str,
        success: bool,
        metadata: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> str:
        """
        Log an authentication event.
        
        Args:
            user_id: User ID
            event_type: Type of auth event (login, logout, failed_login)
            success: Whether the event was successful
            metadata: Additional metadata
            ip_address: IP address
            user_agent: User agent
        
        Returns:
            Audit log ID
        """
        metadata = metadata or {}
        metadata["success"] = success
        
        return await self.log_event(
            user_id=user_id,
            action=f"auth.{event_type}",
            resource_type="auth",
            resource_id=user_id,
            metadata=metadata,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    async def get_user_audit_logs(
        self,
        user_id: str,
        limit: int = 100,
        skip: int = 0,
        action_filter: Optional[str] = None
    ) -> List[Dict]:
        """
        Get audit logs for a specific user.
        
        Args:
            user_id: User ID
            limit: Maximum number of logs to return
            skip: Number of logs to skip (for pagination)
            action_filter: Filter by action type (optional)
        
        Returns:
            List of audit log entries
        """
        try:
            query = {"user_id": user_id}
            
            if action_filter:
                query["action"] = {"$regex": f"^{action_filter}"}
            
            cursor = get_db()[self.collection_name].find(query).sort(
                "timestamp", -1
            ).skip(skip).limit(limit)
            
            logs = await cursor.to_list(length=limit)
            
            # Convert ObjectId to string
            for log in logs:
                if "_id" in log:
                    log["_id"] = str(log["_id"])
            
            return logs
            
        except Exception as e:
            logger.error(f"Failed to get audit logs: {e}")
            return []
    
    async def get_recent_security_events(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[Dict]:
        """
        Get recent security events for a user.
        
        Args:
            user_id: User ID
            limit: Maximum number of events
        
        Returns:
            List of security events
        """
        return await self.get_user_audit_logs(
            user_id=user_id,
            limit=limit,
            action_filter="security"
        )
    
    async def get_login_history(
        self,
        user_id: str,
        limit: int = 20
    ) -> List[Dict]:
        """
        Get login history for a user.
        
        Args:
            user_id: User ID
            limit: Maximum number of entries
        
        Returns:
            List of login events
        """
        return await self.get_user_audit_logs(
            user_id=user_id,
            limit=limit,
            action_filter="auth.login"
        )
    
    async def count_failed_logins(
        self,
        user_id: str,
        since: datetime
    ) -> int:
        """
        Count failed login attempts since a specific time.
        
        Args:
            user_id: User ID
            since: Start time
        
        Returns:
            Number of failed login attempts
        """
        try:
            count = await get_db()[self.collection_name].count_documents({
                "user_id": user_id,
                "action": "auth.failed_login",
                "timestamp": {"$gte": since}
            })
            
            return count
            
        except Exception as e:
            logger.error(f"Failed to count failed logins: {e}")
            return 0
    
    async def cleanup_old_logs(self, days: int = 90) -> int:
        """
        Clean up audit logs older than specified days.
        
        Args:
            days: Number of days to retain
        
        Returns:
            Number of logs deleted
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            result = await get_db()[self.collection_name].delete_many({
                "timestamp": {"$lt": cutoff_date}
            })
            
            logger.info(f"Cleaned up {result.deleted_count} old audit logs")
            
            return result.deleted_count
            
        except Exception as e:
            logger.error(f"Failed to cleanup audit logs: {e}")
            return 0


# Singleton instance
_audit_logger = AuditLogger()


def get_audit_logger() -> AuditLogger:
    """Get the singleton audit logger instance"""
    return _audit_logger

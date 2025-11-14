"""
Real-time Notification System
Handles push notifications, in-app alerts, and email notifications
"""
from typing import Dict, List, Optional
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    MATCH = "match"
    MESSAGE = "message"
    LIKE = "like"
    SUPER_LIKE = "super_like"
    PROJECT_INVITE = "project_invite"
    EVENT_INVITE = "event_invite"
    ACHIEVEMENT = "achievement"
    LEVEL_UP = "level_up"
    SYSTEM = "system"

class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class NotificationService:
    """Advanced notification service with multiple channels"""
    
    def __init__(self):
        self.notifications = []
        self.user_preferences = {}
    
    async def send_notification(
        self,
        user_id: str,
        notification_type: NotificationType,
        title: str,
        message: str,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        data: Optional[Dict] = None,
        channels: Optional[List[str]] = None
    ):
        """
        Send notification through multiple channels
        
        Channels: in_app, push, email, sms
        """
        notification = {
            'id': f"notif_{datetime.utcnow().timestamp()}",
            'user_id': user_id,
            'type': notification_type,
            'title': title,
            'message': message,
            'priority': priority,
            'data': data or {},
            'timestamp': datetime.utcnow(),
            'read': False,
            'channels': channels or ['in_app', 'push']
        }
        
        self.notifications.append(notification)
        
        # Send through specified channels
        for channel in notification['channels']:
            if channel == 'in_app':
                await self._send_in_app(notification)
            elif channel == 'push':
                await self._send_push(notification)
            elif channel == 'email':
                await self._send_email(notification)
            elif channel == 'sms':
                await self._send_sms(notification)
        
        return notification
    
    async def _send_in_app(self, notification: Dict):
        """Send in-app notification (real-time via WebSocket)"""
        # In production, this would use WebSocket/Socket.IO
        pass
    
    async def _send_push(self, notification: Dict):
        """Send push notification (mobile/desktop)"""
        # In production, this would use Firebase Cloud Messaging or similar
        pass
    
    async def _send_email(self, notification: Dict):
        """Send email notification"""
        # In production, this would use email service
        pass
    
    async def _send_sms(self, notification: Dict):
        """Send SMS notification"""
        # In production, this would use Twilio or similar
        pass
    
    async def get_user_notifications(
        self,
        user_id: str,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Dict]:
        """Get user notifications"""
        user_notifs = [n for n in self.notifications if n['user_id'] == user_id]
        
        if unread_only:
            user_notifs = [n for n in user_notifs if not n['read']]
        
        # Sort by timestamp (newest first)
        user_notifs.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return user_notifs[:limit]
    
    async def mark_as_read(self, notification_id: str):
        """Mark notification as read"""
        for notif in self.notifications:
            if notif['id'] == notification_id:
                notif['read'] = True
                break
    
    async def mark_all_as_read(self, user_id: str):
        """Mark all user notifications as read"""
        for notif in self.notifications:
            if notif['user_id'] == user_id:
                notif['read'] = True
    
    async def delete_notification(self, notification_id: str):
        """Delete notification"""
        self.notifications = [n for n in self.notifications if n['id'] != notification_id]
    
    async def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications"""
        return len([n for n in self.notifications if n['user_id'] == user_id and not n['read']])
    
    async def set_user_preferences(
        self,
        user_id: str,
        preferences: Dict[str, bool]
    ):
        """
        Set user notification preferences
        
        Example:
        {
            'matches': True,
            'messages': True,
            'likes': False,
            'email_digest': True,
            'push_enabled': True
        }
        """
        self.user_preferences[user_id] = preferences
    
    async def get_user_preferences(self, user_id: str) -> Dict[str, bool]:
        """Get user notification preferences"""
        return self.user_preferences.get(user_id, {
            'matches': True,
            'messages': True,
            'likes': True,
            'email_digest': False,
            'push_enabled': True
        })


# Singleton instance
notification_service = NotificationService()

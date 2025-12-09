from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SecuritySettings(BaseModel):
    """Enhanced security settings"""
    two_factor_enabled: bool = False
    two_factor_method: Optional[str] = None  # sms, email, authenticator
    login_notifications: bool = True
    privacy_level: str = "standard"  # public, standard, private
    blocked_users: List[str] = []
    hidden_from: List[str] = []  # Hide from specific users
    data_sharing_consent: bool = False
    marketing_consent: bool = False
    
    # Session security
    active_sessions: List[dict] = []
    trusted_devices: List[str] = []
    last_password_change: Optional[datetime] = None
    failed_login_attempts: int = 0
    account_locked_until: Optional[datetime] = None


class ReportContent(BaseModel):
    """Content reporting for safety"""
    reporter_id: str
    reported_user_id: Optional[str] = None
    reported_message_id: Optional[str] = None
    reported_project_id: Optional[str] = None
    
    report_type: str  # spam, inappropriate, fake, harassment, other
    description: str
    evidence_urls: List[str] = []
    
    created_at: datetime
    status: str = "pending"  # pending, investigating, resolved, dismissed
    moderator_notes: Optional[str] = None
    action_taken: Optional[str] = None

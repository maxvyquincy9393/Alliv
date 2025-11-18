"""
Enhanced Models with AI and Multi-field Support
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class FieldCategory(str, Enum):
    """All professional fields"""
    # Tech
    TECH_SOFTWARE = "Software Development"
    TECH_AI = "AI/Machine Learning"
    TECH_DATA = "Data Science"
    TECH_CYBER = "Cybersecurity"
    TECH_DEVOPS = "DevOps/Cloud"
    TECH_BLOCKCHAIN = "Blockchain/Web3"
    
    # Creative
    CREATIVE_DESIGN = "Graphic Design"
    CREATIVE_VIDEO = "Video/Animation"
    CREATIVE_MUSIC = "Music Production"
    CREATIVE_WRITING = "Content Writing"
    CREATIVE_PHOTO = "Photography"
    CREATIVE_3D = "3D/Game Design"
    
    # Business
    BUSINESS_MARKETING = "Marketing"
    BUSINESS_SALES = "Sales"
    BUSINESS_FINANCE = "Finance"
    BUSINESS_MANAGEMENT = "Management"
    BUSINESS_CONSULTING = "Consulting"
    BUSINESS_STARTUP = "Entrepreneurship"
    
    # Academic
    ACADEMIC_RESEARCH = "Research"
    ACADEMIC_TEACHING = "Teaching"
    ACADEMIC_SCIENCE = "Science"
    ACADEMIC_ENGINEERING = "Engineering"
    
    # Healthcare
    HEALTH_MEDICINE = "Medicine"
    HEALTH_NURSING = "Nursing"
    HEALTH_THERAPY = "Therapy"
    HEALTH_FITNESS = "Fitness/Wellness"
    
    # Legal & Finance
    LEGAL_LAW = "Law"
    LEGAL_COMPLIANCE = "Compliance"
    FINANCE_ACCOUNTING = "Accounting"
    FINANCE_INVESTMENT = "Investment"
    
    # Media & Entertainment
    MEDIA_JOURNALISM = "Journalism"
    MEDIA_BROADCASTING = "Broadcasting"
    ENTERTAINMENT_FILM = "Film Production"
    ENTERTAINMENT_GAMING = "Gaming"
    
    # Social & Community
    SOCIAL_NGO = "NGO/Non-profit"
    SOCIAL_EDUCATION = "Education"
    SOCIAL_COMMUNITY = "Community Building"
    SOCIAL_ACTIVISM = "Activism"
    
    # Others
    OTHER_AGRICULTURE = "Agriculture"
    OTHER_ARCHITECTURE = "Architecture"
    OTHER_REALESTATE = "Real Estate"
    OTHER_HOSPITALITY = "Hospitality"
    OTHER_LOGISTICS = "Logistics"


class ExperienceLevel(str, Enum):
    STUDENT = "Student"
    JUNIOR = "Junior (0-2 years)"
    MID = "Mid-level (2-5 years)"
    SENIOR = "Senior (5-10 years)"
    EXPERT = "Expert (10+ years)"
    MENTOR = "Mentor/Advisor"


class CollaborationType(str, Enum):
    COFOUNDER = "Co-founder"
    PROJECT_PARTNER = "Project Partner"
    FREELANCE = "Freelance Collaboration"
    LEARNING = "Learning Partner"
    MENTOR = "Mentorship"
    INVESTOR = "Investment/Funding"
    ADVISOR = "Advisory"
    VOLUNTEER = "Volunteer Work"
    RESEARCH = "Research Partner"


class UserProfile(BaseModel):
    """Enhanced user profile with all fields"""
    # Basic Info
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)")
    phone: Optional[str] = None
    
    # Professional Info
    field: FieldCategory
    role: str  # Specific role in that field
    experience_level: ExperienceLevel
    skills: List[str] = Field(..., max_items=20)
    tools: List[str] = Field(default=[], max_items=15)  # Software/tools they use
    certifications: List[str] = Field(default=[], max_items=10)
    portfolio_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    
    # Collaboration Preferences
    looking_for: List[FieldCategory] = Field(..., max_items=5)
    collaboration_type: List[CollaborationType]
    project_interests: List[str] = Field(..., max_items=10)
    
    # Personal Info
    bio: str = Field(..., max_length=500)
    languages: List[str] = Field(default=["English"])
    location_city: str
    location_country: str
    timezone: str
    remote_only: bool = False
    
    # Availability
    availability_hours_per_week: int = Field(ge=1, le=168)
    availability_start_date: Optional[datetime] = None
    
    # AI-Enhanced Fields
    personality_traits: List[str] = Field(default=[], max_items=5)  # For AI matching
    work_style: List[str] = Field(default=[], max_items=5)  # Remote, Flexible, Structured, etc.
    values: List[str] = Field(default=[], max_items=5)  # Innovation, Quality, Speed, etc.
    
    # Profile Media
    profile_photo_url: Optional[str] = None
    cover_photo_url: Optional[str] = None
    intro_video_url: Optional[str] = None
    work_samples: List[Dict[str, str]] = Field(default=[], max_items=5)  # {title, url, type}
    
    # Verification & Trust
    email_verified: bool = False
    phone_verified: bool = False
    identity_verified: bool = False
    linkedin_verified: bool = False
    github_verified: bool = False
    trust_score: float = Field(default=0.5, ge=0, le=1)
    
    # Premium Features
    is_premium: bool = False
    premium_until: Optional[datetime] = None
    boost_count: int = 0
    super_like_count: int = 0
    
    # System Fields
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_active: datetime = Field(default_factory=datetime.utcnow)
    profile_completion: float = Field(default=0.0, ge=0, le=1)
    ai_embedding: Optional[List[float]] = None  # For AI matching
    
    @validator('password')
    def validate_password(cls, v):
        """Ensure password is strong"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain uppercase letter')
        if not any(char.islower() for char in v):
            raise ValueError('Password must contain lowercase letter')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain number')
        return v


class EnhancedMatch(BaseModel):
    """Enhanced match with AI scoring"""
    id: str
    users: List[str]
    ai_score: float = Field(ge=0, le=1)  # AI-calculated compatibility
    score_breakdown: Dict[str, float] = {}  # Detailed scoring
    match_reasons: List[str] = []  # Why they matched
    suggested_projects: List[str] = []  # AI-suggested collaboration ideas
    conversation_starters: List[str] = []  # AI-generated icebreakers
    created_at: datetime
    status: str = "active"  # active, archived, blocked
    
    # Interaction tracking
    messages_count: int = 0
    last_message_at: Optional[datetime] = None
    meeting_scheduled: bool = False
    project_started: bool = False
    success_rating: Optional[int] = None  # 1-5 stars


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
    active_sessions: List[Dict[str, Any]] = []
    trusted_devices: List[str] = []
    last_password_change: Optional[datetime] = None
    failed_login_attempts: int = 0
    account_locked_until: Optional[datetime] = None


class AIMatchingPreferences(BaseModel):
    """AI-based matching preferences"""
    use_ai_matching: bool = True
    ai_priority_weights: Dict[str, float] = {
        "skills": 0.2,
        "experience": 0.15,
        "location": 0.1,
        "availability": 0.15,
        "personality": 0.2,
        "values": 0.2
    }
    excluded_fields: List[FieldCategory] = []
    preferred_experience_gap: int = 2  # Years difference tolerance
    cultural_preference: Optional[str] = None
    language_requirements: List[str] = ["English"]
    
    # Advanced AI features
    learning_from_swipes: bool = True
    adaptive_recommendations: bool = True
    personality_matching: bool = True
    success_prediction: bool = True


class ProjectProposal(BaseModel):
    """Project proposals for matches"""
    id: str
    title: str
    description: str
    category: FieldCategory
    required_skills: List[str]
    estimated_duration: str  # "1 week", "1 month", "3 months", etc.
    budget_range: Optional[str] = None
    equity_offered: bool = False
    remote_friendly: bool = True
    
    # Team composition
    current_team: List[str] = []  # User IDs
    open_positions: List[Dict[str, Any]] = []
    
    # Project details
    stage: str  # "idea", "planning", "development", "launch", "growth"
    tech_stack: List[str] = []
    target_audience: str
    revenue_model: Optional[str] = None
    
    # AI-enhanced
    ai_feasibility_score: float = Field(default=0.5, ge=0, le=1)
    ai_success_prediction: float = Field(default=0.5, ge=0, le=1)
    ai_suggested_team: List[str] = []
    
    created_at: datetime
    updated_at: datetime
    status: str = "open"  # open, in_progress, completed, cancelled


class NotificationPreferences(BaseModel):
    """Granular notification settings"""
    # In-app
    new_matches: bool = True
    new_messages: bool = True
    profile_views: bool = True
    project_invites: bool = True
    
    # Email
    email_matches: bool = False
    email_messages: bool = False
    email_weekly_summary: bool = True
    email_project_updates: bool = True
    
    # Push (mobile)
    push_matches: bool = True
    push_messages: bool = True
    push_reminders: bool = False
    
    # Frequency
    quiet_hours_start: Optional[str] = "22:00"
    quiet_hours_end: Optional[str] = "08:00"
    timezone_for_notifications: str = "UTC"
    
    # Smart notifications
    ai_curated_digest: bool = True
    important_only: bool = False
    batch_notifications: bool = False


class AnalyticsData(BaseModel):
    """User analytics and insights"""
    user_id: str
    
    # Activity metrics
    total_swipes: int = 0
    right_swipes: int = 0
    left_swipes: int = 0
    swipe_ratio: float = 0.0
    
    # Match metrics
    total_matches: int = 0
    match_rate: float = 0.0
    matches_messaged: int = 0
    average_response_time: Optional[float] = None
    
    # Success metrics
    projects_started: int = 0
    projects_completed: int = 0
    success_rate: float = 0.0
    collaborator_ratings: List[int] = []
    average_rating: float = 0.0
    
    # AI insights
    best_matching_fields: List[FieldCategory] = []
    ideal_collaboration_types: List[CollaborationType] = []
    peak_activity_hours: List[int] = []
    recommended_improvements: List[str] = []
    
    # Time-based
    weekly_active_days: int = 0
    monthly_active_days: int = 0
    streak_days: int = 0
    last_analysis_date: datetime


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


# ===== NEW MODELS FOR FEED & CONNECTIONS =====

class PostType(str, Enum):
    UPDATE = "update"
    TALENT_REQUEST = "talent-request"
    EVENT = "event"
    SHOWCASE = "showcase"
    MILESTONE = "milestone"
    OPPORTUNITY = "opportunity"


class PostVisibility(str, Enum):
    PUBLIC = "public"
    CONNECTIONS = "connections"
    PROJECT = "project"
    PRIVATE = "private"


class Comment(BaseModel):
    id: str
    post_id: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    likes: List[str] = []  # User IDs


class Post(BaseModel):
    id: Optional[str] = None
    type: PostType = PostType.UPDATE
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    author_role: Optional[str] = None
    author_verified: bool = False
    
    content: str
    media_urls: List[str] = []
    tags: List[str] = []
    mentions: List[str] = []
    
    # Context
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    project_industry: Optional[str] = None
    
    # Metadata
    visibility: PostVisibility = PostVisibility.PUBLIC
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Engagement
    likes: List[str] = []
    bookmarks: List[str] = []
    shares: List[str] = []
    view_count: int = 0
    
    # Type-specific data (stored as dict to be flexible)
    details: Dict[str, Any] = {}


class ConnectionStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    BLOCKED = "blocked"


class Connection(BaseModel):
    id: Optional[str] = None
    requester_id: str
    recipient_id: str
    status: ConnectionStatus = ConnectionStatus.PENDING
    type: CollaborationType = CollaborationType.PROJECT_PARTNER
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    connected_at: Optional[datetime] = None
    
    notes: Optional[str] = None
    tags: List[str] = []
    
    # Interaction tracking
    interaction_score: float = 0.0
    last_interaction: Optional[datetime] = None

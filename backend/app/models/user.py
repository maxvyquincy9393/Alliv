from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional, Dict
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
    password: str = Field(..., min_length=8)
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

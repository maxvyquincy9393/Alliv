from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from .user import FieldCategory, CollaborationType

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

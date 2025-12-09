from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from .user import FieldCategory, CollaborationType

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

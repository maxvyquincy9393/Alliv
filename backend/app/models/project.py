from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from .user import FieldCategory

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

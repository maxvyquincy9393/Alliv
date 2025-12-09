from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from .user import FieldCategory, CollaborationType

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

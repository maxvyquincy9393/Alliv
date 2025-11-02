from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime


class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    skills: List[str] = []
    project_interest: str
    bio: str = ""
    photo_url: str = ""
    availability_hours: int = 10


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    name: str
    email: EmailStr
    role: str
    skills: List[str]
    project_interest: str
    bio: str
    photo_url: str
    availability_hours: int
    behavior_score: float = 0.8
    created_at: datetime
    last_active: datetime

    class Config:
        populate_by_name = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class LikeResponse(BaseModel):
    match: bool
    match_data: Optional[dict] = None


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: str = Field(alias="_id")
    match_id: str
    sender: str
    content: str
    created_at: datetime

    class Config:
        populate_by_name = True

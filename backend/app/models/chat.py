from pydantic import BaseModel, Field, validator
from datetime import datetime

class MessageCreate(BaseModel):
    content: str

    @validator('content')
    def validate_content(cls, v: str) -> str:
        v = v.strip() if v else ""
        if not v:
            raise ValueError("Message content cannot be empty")
        if len(v) > 5000:
            raise ValueError("Message content exceeds maximum length")
        return v


class MessageResponse(BaseModel):
    id: str = Field(alias="_id")
    match_id: str
    sender: str
    content: str
    created_at: datetime

    class Config:
        populate_by_name = True

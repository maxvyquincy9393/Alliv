"""
Production-grade Email Verification Models
Following security best practices with OTP hashing, rate limiting, and anti-abuse
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal
from datetime import datetime


class VerificationRecord(BaseModel):
    """
    Verification record stored in MongoDB
    TTL index on expiresAt automatically cleans up expired records
    """
    userId: str
    channel: Literal["email"] = "email"
    codeHash: str  # argon2id hash of 6-digit OTP
    token: str  # UUID v4 for magic link
    expiresAt: datetime  # now + 10 minutes
    resendAvailableAt: datetime  # now + 60 seconds
    attempts: int = 0  # max 5 attempts
    consumed: bool = False
    createdAt: datetime
    
    class Config:
        json_schema_extra = {
            "example": {
                "userId": "507f1f77bcf86cd799439011",
                "channel": "email",
                "codeHash": "$argon2id$v=19$m=65536...",
                "token": "550e8400-e29b-41d4-a716-446655440000",
                "expiresAt": "2025-11-02T15:30:00Z",
                "resendAvailableAt": "2025-11-02T15:21:00Z",
                "attempts": 0,
                "consumed": False,
                "createdAt": "2025-11-02T15:20:00Z"
            }
        }


class VerifyRequestInput(BaseModel):
    """Request verification code"""
    email: EmailStr


class VerifyConfirmInput(BaseModel):
    """Confirm verification with OTP"""
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6, pattern=r"^\d{6}$")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "code": "123456"
            }
        }


class VerifyResponse(BaseModel):
    """Generic response (don't leak user existence)"""
    ok: bool = True
    message: str = "If the email is registered, a verification code has been sent."


class VerifyConfirmResponse(BaseModel):
    """Successful verification response"""
    ok: bool = True
    message: str = "Email verified successfully"
    accessToken: Optional[str] = None
    refreshToken: Optional[str] = None

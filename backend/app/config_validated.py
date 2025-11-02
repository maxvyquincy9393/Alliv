import os
from typing import Optional
from pydantic import BaseSettings, validator, Field

class Settings(BaseSettings):
    """Application settings with validation"""
    
    # Application
    NODE_ENV: str = Field(default="development", env="NODE_ENV")
    PORT: int = Field(default=8080, env="PORT")
    CORS_ORIGIN: str = Field(default="http://localhost:5173", env="CORS_ORIGIN")
    
    # Database
    MONGO_URI: str = Field(..., env="MONGO_URI")
    REDIS_URL: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    
    # JWT & Sessions - MUST be secure!
    JWT_ACCESS_SECRET: str = Field(..., env="JWT_ACCESS_SECRET")
    JWT_REFRESH_SECRET: str = Field(..., env="JWT_REFRESH_SECRET")
    JWT_ACCESS_TTL: int = Field(default=900, env="JWT_ACCESS_TTL")
    JWT_REFRESH_TTL: int = Field(default=1209600, env="JWT_REFRESH_TTL")
    REFRESH_TOKEN_FINGERPRINT_PEPPER: str = Field(..., env="REFRESH_TOKEN_FINGERPRINT_PEPPER")
    JWT_ALGORITHM: str = "HS256"
    
    # OAuth
    OAUTH_REDIRECT_BASE: str = Field(default="http://localhost:8080/auth/oauth", env="OAUTH_REDIRECT_BASE")
    OAUTH_GOOGLE_ID: str = Field(default="", env="OAUTH_GOOGLE_ID")
    OAUTH_GOOGLE_SECRET: str = Field(default="", env="OAUTH_GOOGLE_SECRET")
    OAUTH_GITHUB_ID: str = Field(default="", env="OAUTH_GITHUB_ID")
    OAUTH_GITHUB_SECRET: str = Field(default="", env="OAUTH_GITHUB_SECRET")
    OAUTH_X_ID: str = Field(default="", env="OAUTH_X_ID")
    OAUTH_X_SECRET: str = Field(default="", env="OAUTH_X_SECRET")
    
    # Email/SMS Verification
    SMTP_URL: str = Field(default="", env="SMTP_URL")
    EMAIL_FROM: str = Field(default="noreply@alliv.app", env="EMAIL_FROM")
    SMS_PROVIDER: str = Field(default="mock", env="SMS_PROVIDER")
    SMS_PROVIDER_API_KEY: str = Field(default="", env="SMS_PROVIDER_API_KEY")
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = Field(default="", env="CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY: str = Field(default="", env="CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET: str = Field(default="", env="CLOUDINARY_API_SECRET")
    
    # Maps
    MAPS_API_KEY: str = Field(default="", env="MAPS_API_KEY")
    
    # Validators
    @validator('JWT_ACCESS_SECRET')
    def validate_access_secret(cls, v):
        if v == "change_this_secret":
            raise ValueError(
                "🚨 SECURITY ERROR: JWT_ACCESS_SECRET cannot be the default value! "
                "Please set a secure random string (min 32 chars) in .env file."
            )
        if len(v) < 32:
            raise ValueError(
                f"🚨 SECURITY ERROR: JWT_ACCESS_SECRET too short ({len(v)} chars). "
                "Minimum 32 characters required for security."
            )
        return v
    
    @validator('JWT_REFRESH_SECRET')
    def validate_refresh_secret(cls, v):
        if v == "change_this_refresh_secret":
            raise ValueError(
                "🚨 SECURITY ERROR: JWT_REFRESH_SECRET cannot be the default value! "
                "Please set a secure random string (min 32 chars) in .env file."
            )
        if len(v) < 32:
            raise ValueError(
                f"🚨 SECURITY ERROR: JWT_REFRESH_SECRET too short ({len(v)} chars). "
                "Minimum 32 characters required for security."
            )
        return v
    
    @validator('REFRESH_TOKEN_FINGERPRINT_PEPPER')
    def validate_pepper(cls, v):
        if v == "change_this_pepper":
            raise ValueError(
                "🚨 SECURITY ERROR: REFRESH_TOKEN_FINGERPRINT_PEPPER cannot be default! "
                "Please set a secure random string (min 32 chars) in .env file."
            )
        if len(v) < 32:
            raise ValueError(
                f"🚨 SECURITY ERROR: Fingerprint pepper too short ({len(v)} chars). "
                "Minimum 32 characters required."
            )
        return v
    
    @validator('MONGO_URI')
    def validate_mongo_uri(cls, v):
        if not v.startswith('mongodb://') and not v.startswith('mongodb+srv://'):
            raise ValueError(
                "🚨 CONFIG ERROR: MONGO_URI must start with 'mongodb://' or 'mongodb+srv://'"
            )
        return v
    
    @validator('NODE_ENV')
    def validate_node_env(cls, v):
        allowed = ['development', 'staging', 'production']
        if v not in allowed:
            raise ValueError(
                f"🚨 CONFIG ERROR: NODE_ENV must be one of {allowed}, got '{v}'"
            )
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Create singleton instance
try:
    settings = Settings()
    print("✅ Configuration validated successfully!")
except Exception as e:
    print(f"❌ Configuration validation failed: {e}")
    raise

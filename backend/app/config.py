import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator, Field, ConfigDict

class Settings(BaseSettings):
    """Application settings with validation"""
    
    # Application
    NODE_ENV: str = Field(default="development", validation_alias="NODE_ENV")
    DEBUG: bool = Field(default=False, validation_alias="DEBUG")
    PORT: int = Field(default=8080, validation_alias="PORT")
    CORS_ORIGIN: str = Field(default="http://localhost:5173,http://localhost:5174", validation_alias="CORS_ORIGIN")
    ALLOWED_HOSTS: str = Field(default="localhost,127.0.0.1", validation_alias="ALLOWED_HOSTS")
    
    # Database
    MONGO_URI: str = Field(..., validation_alias="MONGO_URI")
    REDIS_URL: str = Field(default="redis://localhost:6379", validation_alias="REDIS_URL")
    
    # JWT & Sessions - MUST be secure!
    JWT_ACCESS_SECRET: str = Field(..., validation_alias="JWT_ACCESS_SECRET")
    JWT_REFRESH_SECRET: str = Field(..., validation_alias="JWT_REFRESH_SECRET")
    JWT_ACCESS_TTL: int = Field(default=900, validation_alias="JWT_ACCESS_TTL")
    JWT_REFRESH_TTL: int = Field(default=1209600, validation_alias="JWT_REFRESH_TTL")
    REFRESH_TOKEN_FINGERPRINT_PEPPER: str = Field(..., validation_alias="REFRESH_TOKEN_FINGERPRINT_PEPPER")
    JWT_ALGORITHM: str = "HS256"
    
    # OAuth
    OAUTH_REDIRECT_BASE: str = Field(default="http://localhost:8080/auth/oauth", validation_alias="OAUTH_REDIRECT_BASE")
    OAUTH_GOOGLE_ID: str = Field(default="", validation_alias="OAUTH_GOOGLE_ID")
    OAUTH_GOOGLE_SECRET: str = Field(default="", validation_alias="OAUTH_GOOGLE_SECRET")
    OAUTH_GITHUB_ID: str = Field(default="", validation_alias="OAUTH_GITHUB_ID")
    OAUTH_GITHUB_SECRET: str = Field(default="", validation_alias="OAUTH_GITHUB_SECRET")
    OAUTH_X_ID: str = Field(default="", validation_alias="OAUTH_X_ID")
    OAUTH_X_SECRET: str = Field(default="", validation_alias="OAUTH_X_SECRET")
    OAUTH_FACEBOOK_APP_ID: str = Field(default="", validation_alias="OAUTH_FACEBOOK_APP_ID")
    OAUTH_FACEBOOK_APP_SECRET: str = Field(default="", validation_alias="OAUTH_FACEBOOK_APP_SECRET")
    
    # Email/SMS Verification
    SMTP_URL: str = Field(default="", validation_alias="SMTP_URL")
    EMAIL_FROM: str = Field(default="noreply@alliv.app", validation_alias="EMAIL_FROM")
    SMS_PROVIDER: str = Field(default="mock", validation_alias="SMS_PROVIDER")
    SMS_PROVIDER_API_KEY: str = Field(default="", validation_alias="SMS_PROVIDER_API_KEY")
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = Field(default="", validation_alias="CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY: str = Field(default="", validation_alias="CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET: str = Field(default="", validation_alias="CLOUDINARY_API_SECRET")
    
    # Maps
    MAPS_API_KEY: str = Field(default="", validation_alias="MAPS_API_KEY")
    
    # Monitoring & Error Tracking
    SENTRY_DSN: str = Field(default="", validation_alias="SENTRY_DSN")
    SENTRY_TRACES_SAMPLE_RATE: float = Field(default=0.1, validation_alias="SENTRY_TRACES_SAMPLE_RATE")
    
    # CAPTCHA
    RECAPTCHA_SECRET_KEY: str = Field(default="", validation_alias="RECAPTCHA_SECRET_KEY")
    RECAPTCHA_SITE_KEY: str = Field(default="", validation_alias="RECAPTCHA_SITE_KEY")
    
    # AI Matching Engine
    USE_AI_MATCHING: bool = Field(default=True, validation_alias="USE_AI_MATCHING")
    OPENAI_API_KEY: str = Field(default="", validation_alias="OPENAI_API_KEY")  # Optional for GPT features
    MATCHING_CACHE_TTL: int = Field(default=3600, validation_alias="MATCHING_CACHE_TTL")  # 1 hour
    
    # Frontend URL
    FRONTEND_URL: str = Field(default="http://localhost:3000", validation_alias="FRONTEND_URL")
    BACKEND_URL: str = Field(default="http://localhost:8080", validation_alias="BACKEND_URL")

    # Validators
    @field_validator('JWT_ACCESS_SECRET')
    @classmethod
    def validate_access_secret(cls, v):
        if v == "change_this_secret":
            raise ValueError(
                "[SECURITY ERROR] JWT_ACCESS_SECRET cannot be the default value! "
                "Please set a secure random string (min 32 chars) in .env file."
            )
        if len(v) < 32:
            raise ValueError(
                f"[SECURITY ERROR] JWT_ACCESS_SECRET too short ({len(v)} chars). "
                "Minimum 32 characters required for security."
            )
        return v
    
    @field_validator('JWT_REFRESH_SECRET')
    @classmethod
    def validate_refresh_secret(cls, v):
        if v == "change_this_refresh_secret":
            raise ValueError(
                "[SECURITY ERROR] JWT_REFRESH_SECRET cannot be the default value! "
                "Please set a secure random string (min 32 chars) in .env file."
            )
        if len(v) < 32:
            raise ValueError(
                f"[SECURITY ERROR] JWT_REFRESH_SECRET too short ({len(v)} chars). "
                "Minimum 32 characters required for security."
            )
        return v
    
    @field_validator('REFRESH_TOKEN_FINGERPRINT_PEPPER')
    @classmethod
    def validate_pepper(cls, v):
        if v == "change_this_pepper":
            raise ValueError(
                "[SECURITY ERROR] REFRESH_TOKEN_FINGERPRINT_PEPPER cannot be default! "
                "Please set a secure random string (min 32 chars) in .env file."
            )
        if len(v) < 32:
            raise ValueError(
                f"[SECURITY ERROR] Fingerprint pepper too short ({len(v)} chars). "
                "Minimum 32 characters required."
            )
        return v
    
    @field_validator('MONGO_URI')
    @classmethod
    def validate_mongo_uri(cls, v):
        if not v.startswith('mongodb://') and not v.startswith('mongodb+srv://'):
            raise ValueError(
                "[CONFIG ERROR] MONGO_URI must start with 'mongodb://' or 'mongodb+srv://'"
            )
        return v
    
    @field_validator('NODE_ENV')
    @classmethod
    def validate_node_env(cls, v):
        allowed = ['development', 'staging', 'production', 'test']
        if v not in allowed:
            raise ValueError(
                f"[CONFIG ERROR] NODE_ENV must be one of {allowed}, got '{v}'"
            )
        return v
    
    @field_validator('MAPS_API_KEY')
    @classmethod
    def validate_maps_key(cls, v, info):
        node_env = info.data.get('NODE_ENV', 'development')
        if node_env == 'production' and not v:
            raise ValueError(
                "[CONFIG ERROR] MAPS_API_KEY is required in production. "
                "Set MAPS_API_KEY in .env file."
            )
        return v
    
    @field_validator('CLOUDINARY_CLOUD_NAME')
    @classmethod
    def validate_cloudinary(cls, v, info):
        node_env = info.data.get('NODE_ENV', 'development')
        if node_env == 'production' and not v:
            raise ValueError(
                "[CONFIG ERROR] CLOUDINARY_CLOUD_NAME is required in production. "
                "Configure Cloudinary credentials in .env file."
            )
        return v
    
    @field_validator('SMTP_URL')
    @classmethod
    def validate_smtp(cls, v, info):
        node_env = info.data.get('NODE_ENV', 'development')
        if node_env == 'production' and not v:
            raise ValueError(
                "[CONFIG ERROR] SMTP_URL is required in production for email delivery. "
                "Configure email service in .env file."
            )
        return v
    
    model_config = ConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=True
    )


# Create singleton instance
settings = Settings()

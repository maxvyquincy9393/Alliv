import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator, Field, ConfigDict

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
    
    # Monitoring & Error Tracking
    SENTRY_DSN: str = Field(default="", env="SENTRY_DSN")
    SENTRY_TRACES_SAMPLE_RATE: float = Field(default=0.1, env="SENTRY_TRACES_SAMPLE_RATE")
    
    # CAPTCHA
    RECAPTCHA_SECRET_KEY: str = Field(default="", env="RECAPTCHA_SECRET_KEY")
    RECAPTCHA_SITE_KEY: str = Field(default="", env="RECAPTCHA_SITE_KEY")
    
    # Validators
    @field_validator('JWT_ACCESS_SECRET')
    @classmethod
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
    
    @field_validator('JWT_REFRESH_SECRET')
    @classmethod
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
    
    @field_validator('REFRESH_TOKEN_FINGERPRINT_PEPPER')
    @classmethod
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
    
    @field_validator('MONGO_URI')
    @classmethod
    def validate_mongo_uri(cls, v):
        if not v.startswith('mongodb://') and not v.startswith('mongodb+srv://'):
            raise ValueError(
                "🚨 CONFIG ERROR: MONGO_URI must start with 'mongodb://' or 'mongodb+srv://'"
            )
        return v
    
    @field_validator('NODE_ENV')
    @classmethod
    def validate_node_env(cls, v):
        allowed = ['development', 'staging', 'production']
        if v not in allowed:
            raise ValueError(
                f"🚨 CONFIG ERROR: NODE_ENV must be one of {allowed}, got '{v}'"
            )
        return v
    
    model_config = ConfigDict(
        env_file=".env",
        extra="ignore",
        case_sensitive=True
    )


# Fallback for missing env vars in development
def get_settings():
    """Get settings with fallback for development"""
    try:
        return Settings()
    except Exception as e:
        print(f"[WARN]  Config validation failed: {e}")
        print("[WARN]  Using fallback settings for development")
        
        # Return development settings with safe defaults
        import os
        from dotenv import load_dotenv
        load_dotenv()
        
        class DevSettings:
            NODE_ENV = os.getenv("NODE_ENV", "development")
            PORT = int(os.getenv("PORT", "8080"))
            CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:5173")
            MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/alliv")
            REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
            
            # JWT - use env or generate temp for dev
            JWT_ACCESS_SECRET = os.getenv("JWT_ACCESS_SECRET") or "dev_secret_" + "x" * 24
            JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET") or "dev_refresh_" + "x" * 24
            JWT_ACCESS_TTL = int(os.getenv("JWT_ACCESS_TTL", "900"))
            JWT_REFRESH_TTL = int(os.getenv("JWT_REFRESH_TTL", "1209600"))
            REFRESH_TOKEN_FINGERPRINT_PEPPER = os.getenv("REFRESH_TOKEN_FINGERPRINT_PEPPER") or "dev_pepper_" + "x" * 24
            JWT_ALGORITHM = "HS256"
            
            # OAuth
            OAUTH_REDIRECT_BASE = os.getenv("OAUTH_REDIRECT_BASE", "http://localhost:8080/auth/oauth")
            OAUTH_GOOGLE_ID = os.getenv("OAUTH_GOOGLE_ID", "")
            OAUTH_GOOGLE_SECRET = os.getenv("OAUTH_GOOGLE_SECRET", "")
            OAUTH_GITHUB_ID = os.getenv("OAUTH_GITHUB_ID", "")
            OAUTH_GITHUB_SECRET = os.getenv("OAUTH_GITHUB_SECRET", "")
            OAUTH_X_ID = os.getenv("OAUTH_X_ID", "")
            OAUTH_X_SECRET = os.getenv("OAUTH_X_SECRET", "")
            
            # Email/SMS
            SMTP_URL = os.getenv("SMTP_URL", "")
            EMAIL_FROM = os.getenv("EMAIL_FROM", "noreply@alliv.app")
            SMS_PROVIDER = os.getenv("SMS_PROVIDER", "mock")
            SMS_PROVIDER_API_KEY = os.getenv("SMS_PROVIDER_API_KEY", "")
            
            # Cloudinary
            CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME", "")
            CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY", "")
            CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET", "")
            
            # Maps
            MAPS_API_KEY = os.getenv("MAPS_API_KEY", "")
        
        return DevSettings()


# Create singleton instance with fallback
settings = get_settings()

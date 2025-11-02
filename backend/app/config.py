import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    """Application settings"""
    
    # Application
    NODE_ENV: str = os.getenv("NODE_ENV", "development")
    PORT: int = int(os.getenv("PORT", "8080"))
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:5173")
    
    # Database
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/alliv")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # JWT & Sessions
    JWT_ACCESS_SECRET: str = os.getenv("JWT_ACCESS_SECRET", "change_this_secret")
    JWT_REFRESH_SECRET: str = os.getenv("JWT_REFRESH_SECRET", "change_this_refresh_secret")
    JWT_ACCESS_TTL: int = int(os.getenv("JWT_ACCESS_TTL", "900"))
    JWT_REFRESH_TTL: int = int(os.getenv("JWT_REFRESH_TTL", "1209600"))
    REFRESH_TOKEN_FINGERPRINT_PEPPER: str = os.getenv("REFRESH_TOKEN_FINGERPRINT_PEPPER", "change_this_pepper")
    JWT_ALGORITHM: str = "HS256"
    
    # OAuth
    OAUTH_REDIRECT_BASE: str = os.getenv("OAUTH_REDIRECT_BASE", "http://localhost:8080/auth/oauth")
    OAUTH_GOOGLE_ID: str = os.getenv("OAUTH_GOOGLE_ID", "")
    OAUTH_GOOGLE_SECRET: str = os.getenv("OAUTH_GOOGLE_SECRET", "")
    OAUTH_GITHUB_ID: str = os.getenv("OAUTH_GITHUB_ID", "")
    OAUTH_GITHUB_SECRET: str = os.getenv("OAUTH_GITHUB_SECRET", "")
    OAUTH_X_ID: str = os.getenv("OAUTH_X_ID", "")
    OAUTH_X_SECRET: str = os.getenv("OAUTH_X_SECRET", "")
    
    # Email/SMS Verification
    SMTP_URL: str = os.getenv("SMTP_URL", "")
    EMAIL_FROM: str = os.getenv("EMAIL_FROM", "noreply@alliv.app")
    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "mock")
    SMS_PROVIDER_API_KEY: str = os.getenv("SMS_PROVIDER_API_KEY", "")
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    # Maps
    MAPS_API_KEY: str = os.getenv("MAPS_API_KEY", "")
    
    # Security & Rate Limiting
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))
    RATE_LIMIT_MAX: int = int(os.getenv("RATE_LIMIT_MAX", "100"))
    TRUSTED_PROXY: bool = os.getenv("TRUSTED_PROXY", "false").lower() == "true"


# Create settings instance
settings = Settings()

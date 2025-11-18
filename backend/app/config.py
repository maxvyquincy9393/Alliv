import os
import sys
import secrets
from typing import Optional
from urllib.parse import urlparse, urlunparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DEFAULT_JWT_ACCESS_SECRET = "dev_jwt_access_secret_012345678901234567"
DEFAULT_JWT_REFRESH_SECRET = "dev_jwt_refresh_secret_01234567890123"
DEFAULT_REFRESH_TOKEN_FINGERPRINT_PEPPER = "dev_refresh_fingerprint_pepper_0123456789"


def _build_mongo_uri() -> str:
    """Derive Mongo connection string with sensible fallbacks."""
    mongo_uri = os.getenv("MONGO_URI") or os.getenv("MONGODB_URI")
    db_name = (
        os.getenv("MONGO_DB_NAME")
        or os.getenv("DATABASE_NAME")
        or "colabmatch"
    )

    if mongo_uri:
        parsed = urlparse(mongo_uri)
        # If no database specified, append the fallback db name
        if not parsed.path or parsed.path == "/":
            parsed = parsed._replace(path=f"/{db_name}")
            return urlunparse(parsed)
        return mongo_uri

    host = os.getenv("MONGO_HOST", "localhost")
    port = os.getenv("MONGO_PORT", "27017")
    return f"mongodb://{host}:{port}/{db_name}"


class Settings:
    """Application settings with validation"""
    
    # Application
    NODE_ENV: str = os.getenv("NODE_ENV", "development")
    DEBUG: bool = os.getenv("NODE_ENV", "development") == "development"  # Show debug info in dev mode
    PORT: int = int(os.getenv("PORT", "8080"))
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:5173")
    
    # Database
    MONGO_URI: str = _build_mongo_uri()
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # JWT & Sessions (REQUIRED - no defaults for production!)
    JWT_ACCESS_SECRET: str = os.getenv("JWT_ACCESS_SECRET", "")
    JWT_REFRESH_SECRET: str = os.getenv("JWT_REFRESH_SECRET", "")
    JWT_ACCESS_TTL: int = int(os.getenv("JWT_ACCESS_TTL", "900"))
    JWT_REFRESH_TTL: int = int(os.getenv("JWT_REFRESH_TTL", "1209600"))
    REFRESH_TOKEN_FINGERPRINT_PEPPER: str = os.getenv("REFRESH_TOKEN_FINGERPRINT_PEPPER", "")
    JWT_ALGORITHM: str = "HS256"
    
    # OAuth
    OAUTH_REDIRECT_BASE: str = os.getenv("OAUTH_REDIRECT_BASE", "http://localhost:8080/auth/oauth")
    OAUTH_GOOGLE_ID: str = os.getenv("OAUTH_GOOGLE_ID", "")
    OAUTH_GOOGLE_SECRET: str = os.getenv("OAUTH_GOOGLE_SECRET", "")
    OAUTH_FACEBOOK_APP_ID: str = os.getenv("OAUTH_FACEBOOK_APP_ID", "")
    OAUTH_FACEBOOK_APP_SECRET: str = os.getenv("OAUTH_FACEBOOK_APP_SECRET", "")
    OAUTH_GITHUB_ID: str = os.getenv("OAUTH_GITHUB_ID", "")
    OAUTH_GITHUB_SECRET: str = os.getenv("OAUTH_GITHUB_SECRET", "")
    OAUTH_X_ID: str = os.getenv("OAUTH_X_ID", "")
    OAUTH_X_SECRET: str = os.getenv("OAUTH_X_SECRET", "")
    
    # Frontend URL for OAuth redirects
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8080")
    
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

    def __init__(self):
        """Initialize and validate configuration"""
        self._validate_required_vars()
        self._validate_secrets()
        self._validate_urls()
        self._validate_cors()

    def _validate_required_vars(self):
        """Validate that required environment variables are set"""
        required_vars = []
        
        # Required in production
        if self.NODE_ENV == "production":
            if not os.getenv("JWT_ACCESS_SECRET"):
                required_vars.append("JWT_ACCESS_SECRET (min 32 chars)")
            if not os.getenv("JWT_REFRESH_SECRET"):
                required_vars.append("JWT_REFRESH_SECRET (min 32 chars)")
            if not os.getenv("REFRESH_TOKEN_FINGERPRINT_PEPPER"):
                required_vars.append("REFRESH_TOKEN_FINGERPRINT_PEPPER (min 32 chars)")
        
        if required_vars:
            print("\n[ERROR] Configuration Error: Missing required environment variables")
            print("\n📋 Required variables:")
            for var in required_vars:
                print(f"  - {var}")
            print("\n[TIP] Create a .env file with these variables.")
            print("   Run: python generate_secrets.py")
            sys.exit(1)

    def _validate_urls(self):
        """Validate URL formats"""
        # Validate MongoDB URI
        if not self.MONGO_URI.startswith('mongodb://') and not self.MONGO_URI.startswith('mongodb+srv://'):
            print("\n[ERROR] Configuration Error: Invalid MONGO_URI format")
            print("   Must start with 'mongodb://' or 'mongodb+srv://'")
            sys.exit(1)
        
        # Validate Redis URL if set
        if self.REDIS_URL and not self.REDIS_URL.startswith('redis://'):
            print("\n[WARN] Warning: REDIS_URL should start with 'redis://'")

    def _validate_cors(self):
        """Validate CORS configuration"""
        if self.NODE_ENV == "production" and self.CORS_ORIGIN == "*":
            print("\n[ERROR] Configuration Error: CORS_ORIGIN cannot be '*' in production")
            print("   Set a specific origin like: https://yourdomain.com")
            sys.exit(1)

    def _validate_secrets(self):
        """Validate required secrets for security"""
        if self.NODE_ENV == "production":
            # Production requires strong secrets
            if not self.JWT_ACCESS_SECRET or len(self.JWT_ACCESS_SECRET) < 32:
                raise ValueError(
                    "JWT_ACCESS_SECRET must be at least 32 characters in production.\n"
                    "Generate one with: python generate_secrets.py"
                )
            
            if not self.JWT_REFRESH_SECRET or len(self.JWT_REFRESH_SECRET) < 32:
                raise ValueError(
                    "JWT_REFRESH_SECRET must be at least 32 characters in production.\n"
                    "Generate one with: python generate_secrets.py"
                )
            
            if not self.REFRESH_TOKEN_FINGERPRINT_PEPPER or len(self.REFRESH_TOKEN_FINGERPRINT_PEPPER) < 32:
                raise ValueError(
                    "REFRESH_TOKEN_FINGERPRINT_PEPPER must be at least 32 characters in production.\n"
                    "Generate one with: python generate_secrets.py"
                )
        else:
            # Development mode - generate temporary secrets if missing
            if not self.JWT_ACCESS_SECRET:
                print("[WARN] WARNING: No JWT_ACCESS_SECRET found, using development fallback")
                self.JWT_ACCESS_SECRET = DEFAULT_JWT_ACCESS_SECRET
            
            if not self.JWT_REFRESH_SECRET:
                print("[WARN] WARNING: No JWT_REFRESH_SECRET found, using development fallback")
                self.JWT_REFRESH_SECRET = DEFAULT_JWT_REFRESH_SECRET
            
            if not self.REFRESH_TOKEN_FINGERPRINT_PEPPER:
                print("[WARN] WARNING: No REFRESH_TOKEN_FINGERPRINT_PEPPER found, using development fallback")
                self.REFRESH_TOKEN_FINGERPRINT_PEPPER = DEFAULT_REFRESH_TOKEN_FINGERPRINT_PEPPER
            
            # Warn about weak secrets
            if "change_this" in self.JWT_ACCESS_SECRET:
                print("[WARN] WARNING: Using weak JWT_ACCESS_SECRET in development mode")
            if "change_this" in self.JWT_REFRESH_SECRET:
                print("[WARN] WARNING: Using weak JWT_REFRESH_SECRET in development mode")
            if "change_this" in self.REFRESH_TOKEN_FINGERPRINT_PEPPER:
                print("[WARN] WARNING: Using weak REFRESH_TOKEN_FINGERPRINT_PEPPER in development mode")


# Create settings instance with validation
try:
    settings = Settings()
    print("[OK] Configuration loaded successfully")
    if settings.NODE_ENV == "development":
        print(f"   Environment: {settings.NODE_ENV}")
        print(f"   MongoDB: {settings.MONGO_URI[:20]}...")
        print(f"   CORS: {settings.CORS_ORIGIN}")
except Exception as e:
    print(f"\n[ERROR] Configuration Error: {e}")
    print("\n[TIP] Check your .env file or environment variables")
    sys.exit(1)

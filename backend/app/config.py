import os
import sys
import secrets
from typing import Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class Settings:
    """Application settings with validation"""
    
    # Application
    NODE_ENV: str = os.getenv("NODE_ENV", "development")
    DEBUG: bool = os.getenv("NODE_ENV", "development") == "development"  # Show debug info in dev mode
    PORT: int = int(os.getenv("PORT", "8080"))
    CORS_ORIGIN: str = os.getenv("CORS_ORIGIN", "http://localhost:3000")
    
    # Database
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/alliv")
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
        
        # Always required
        if not os.getenv("MONGO_URI"):
            required_vars.append("MONGO_URI")
        
        # Required in production
        if self.NODE_ENV == "production":
            if not os.getenv("JWT_ACCESS_SECRET"):
                required_vars.append("JWT_ACCESS_SECRET (min 32 chars)")
            if not os.getenv("JWT_REFRESH_SECRET"):
                required_vars.append("JWT_REFRESH_SECRET (min 32 chars)")
            if not os.getenv("REFRESH_TOKEN_FINGERPRINT_PEPPER"):
                required_vars.append("REFRESH_TOKEN_FINGERPRINT_PEPPER (min 32 chars)")
        
        if required_vars:
            print("\n❌ Configuration Error: Missing required environment variables")
            print("\n📋 Required variables:")
            for var in required_vars:
                print(f"  - {var}")
            print("\n💡 Create a .env file with these variables.")
            print("   Run: python generate_secrets.py")
            sys.exit(1)

    def _validate_urls(self):
        """Validate URL formats"""
        # Validate MongoDB URI
        if not self.MONGO_URI.startswith('mongodb://') and not self.MONGO_URI.startswith('mongodb+srv://'):
            print("\n❌ Configuration Error: Invalid MONGO_URI format")
            print("   Must start with 'mongodb://' or 'mongodb+srv://'")
            sys.exit(1)
        
        # Validate Redis URL if set
        if self.REDIS_URL and not self.REDIS_URL.startswith('redis://'):
            print("\n⚠️ Warning: REDIS_URL should start with 'redis://'")

    def _validate_cors(self):
        """Validate CORS configuration"""
        if self.NODE_ENV == "production" and self.CORS_ORIGIN == "*":
            print("\n❌ Configuration Error: CORS_ORIGIN cannot be '*' in production")
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
                print("⚠️ WARNING: No JWT_ACCESS_SECRET found, generating temporary secret for development")
                self.JWT_ACCESS_SECRET = secrets.token_urlsafe(32)
            
            if not self.JWT_REFRESH_SECRET:
                print("⚠️ WARNING: No JWT_REFRESH_SECRET found, generating temporary secret for development")
                self.JWT_REFRESH_SECRET = secrets.token_urlsafe(32)
            
            if not self.REFRESH_TOKEN_FINGERPRINT_PEPPER:
                print("⚠️ WARNING: No REFRESH_TOKEN_FINGERPRINT_PEPPER found, generating temporary secret for development")
                self.REFRESH_TOKEN_FINGERPRINT_PEPPER = secrets.token_urlsafe(32)
            
            # Warn about weak secrets
            if "change_this" in self.JWT_ACCESS_SECRET:
                print("⚠️ WARNING: Using weak JWT_ACCESS_SECRET in development mode")
            if "change_this" in self.JWT_REFRESH_SECRET:
                print("⚠️ WARNING: Using weak JWT_REFRESH_SECRET in development mode")
            if "change_this" in self.REFRESH_TOKEN_FINGERPRINT_PEPPER:
                print("⚠️ WARNING: Using weak REFRESH_TOKEN_FINGERPRINT_PEPPER in development mode")


# Create settings instance with validation
try:
    settings = Settings()
    print("✅ Configuration loaded successfully")
    if settings.NODE_ENV == "development":
        print(f"   Environment: {settings.NODE_ENV}")
        print(f"   MongoDB: {settings.MONGO_URI[:20]}...")
        print(f"   CORS: {settings.CORS_ORIGIN}")
except Exception as e:
    print(f"\n❌ Configuration Error: {e}")
    print("\n💡 Check your .env file or environment variables")
    sys.exit(1)

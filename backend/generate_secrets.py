#!/usr/bin/env python3
"""
Generate secure secrets for JWT tokens and other cryptographic uses.
Run this script to generate secure random secrets for your .env file.
"""

import secrets
import sys


def generate_secrets():
    """Generate secure random secrets"""
    print("=" * 60)
    print("🔐 SECURE SECRETS GENERATOR FOR ALLIV")
    print("=" * 60)
    print("\nCopy these to your .env file:\n")
    
    # Generate secure secrets
    jwt_access = secrets.token_urlsafe(64)
    jwt_refresh = secrets.token_urlsafe(64)
    fingerprint_pepper = secrets.token_urlsafe(64)
    
    # Print in .env format
    print(f"JWT_ACCESS_SECRET={jwt_access}")
    print(f"JWT_REFRESH_SECRET={jwt_refresh}")
    print(f"REFRESH_TOKEN_FINGERPRINT_PEPPER={fingerprint_pepper}")
    
    print("\n" + "=" * 60)
    print("⚠️  IMPORTANT SECURITY NOTES:")
    print("=" * 60)
    print("1. NEVER commit these secrets to version control")
    print("2. Use different secrets for each environment")
    print("3. Rotate secrets regularly (every 3-6 months)")
    print("4. Store production secrets in a secure vault")
    print("5. Never use weak or default secrets in production")
    print("=" * 60)
    
    # Optional: Save to .env.example
    response = input("\nWould you like to create/update .env.example? (y/n): ").lower()
    if response == 'y':
        try:
            with open('.env.example', 'w') as f:
                f.write("# Application\n")
                f.write("NODE_ENV=development\n")
                f.write("PORT=8080\n")
                f.write("CORS_ORIGIN=http://localhost:3000\n\n")
                
                f.write("# Database\n")
                f.write("MONGO_URI=mongodb://localhost:27017/alliv\n")
                f.write("REDIS_URL=redis://localhost:6379\n\n")
                
                f.write("# JWT Secrets (REQUIRED - Generate with: python generate_secrets.py)\n")
                f.write("JWT_ACCESS_SECRET=\n")
                f.write("JWT_REFRESH_SECRET=\n")
                f.write("REFRESH_TOKEN_FINGERPRINT_PEPPER=\n")
                f.write("JWT_ACCESS_TTL=900\n")
                f.write("JWT_REFRESH_TTL=1209600\n\n")
                
                f.write("# OAuth (Optional)\n")
                f.write("OAUTH_GOOGLE_ID=\n")
                f.write("OAUTH_GOOGLE_SECRET=\n")
                f.write("OAUTH_GITHUB_ID=\n")
                f.write("OAUTH_GITHUB_SECRET=\n\n")
                
                f.write("# Email\n")
                f.write("SMTP_URL=\n")
                f.write("EMAIL_FROM=noreply@alliv.app\n\n")
                
                f.write("# Cloudinary (Optional)\n")
                f.write("CLOUDINARY_CLOUD_NAME=\n")
                f.write("CLOUDINARY_API_KEY=\n")
                f.write("CLOUDINARY_API_SECRET=\n\n")
                
                f.write("# Maps (Optional)\n")
                f.write("MAPS_API_KEY=\n")
            
            print("✅ Created .env.example file")
        except Exception as e:
            print(f"❌ Error creating .env.example: {e}")
    
    return 0


if __name__ == "__main__":
    sys.exit(generate_secrets())

"""
Email Verification Utilities - Production Security
- 6-digit OTP with argon2id hashing
- UUID v4 magic links
- Rate limiting & anti-brute-force
- No user enumeration
"""
import secrets
import uuid
from datetime import datetime, timedelta
from passlib.context import CryptContext
import logging

logger = logging.getLogger("alliv")

# Use argon2id for OTP hashing (same as passwords)
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")


def generate_otp() -> str:
    """
    Generate cryptographically secure 6-digit OTP
    Returns: string "000000" to "999999"
    """
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])


def hash_otp(code: str) -> str:
    """
    Hash OTP using argon2id
    NEVER store plaintext OTP in database
    """
    return pwd_context.hash(code)


def verify_otp(plain_code: str, hashed_code: str) -> bool:
    """
    Verify OTP against hash
    Constant-time comparison to prevent timing attacks
    """
    try:
        return pwd_context.verify(plain_code, hashed_code)
    except Exception as e:
        logger.warning(f"OTP verification failed: {e}")
        return False


def generate_magic_token() -> str:
    """
    Generate UUID v4 for magic link
    Single-use, expires in 10 minutes
    """
    return str(uuid.uuid4())


def format_otp_display(code: str) -> str:
    """
    Format OTP for display: 123456 → "123 456"
    Easier to read in emails
    """
    if len(code) != 6:
        return code
    return f"{code[:3]} {code[3:]}"


def mask_email(email: str) -> str:
    """
    Mask email for display: user@example.com → u***@e***.com
    Privacy protection in UI
    """
    try:
        local, domain = email.split('@')
        domain_parts = domain.split('.')
        
        # Mask local part: show first char + ***
        masked_local = local[0] + '***' if len(local) > 1 else local
        
        # Mask domain: show first char + ***
        masked_domain = domain_parts[0][0] + '***'
        
        # Keep TLD
        tld = '.'.join(domain_parts[1:])
        
        return f"{masked_local}@{masked_domain}.{tld}"
    except:
        return "***@***.com"


def create_verification_record(user_id: str, email: str) -> dict:
    """
    Create new verification record
    Returns: dict ready for MongoDB insertion
    """
    now = datetime.utcnow()
    code = generate_otp()
    code_hash = hash_otp(code)
    token = generate_magic_token()
    
    record = {
        "userId": user_id,
        "channel": "email",
        "codeHash": code_hash,
        "token": token,
        "expiresAt": now + timedelta(minutes=10),  # 10 minutes
        "resendAvailableAt": now + timedelta(seconds=60),  # 60 seconds throttle
        "attempts": 0,
        "consumed": False,
        "createdAt": now
    }
    
    logger.info(f"✅ Verification created for user {user_id} (expires in 10m)")
    
    # Return record + plaintext code (for email sending only)
    return {
        "record": record,
        "code": code,  # ONLY use for email, never log or store
        "token": token
    }


def validate_resend_timing(verification: dict) -> tuple[bool, str]:
    """
    Check if resend is allowed (60s throttle)
    Returns: (allowed: bool, error_message: str)
    """
    now = datetime.utcnow()
    resend_available = verification.get("resendAvailableAt")
    
    if resend_available and now < resend_available:
        wait_seconds = int((resend_available - now).total_seconds())
        return False, f"Please wait {wait_seconds} seconds before requesting a new code"
    
    return True, ""


def validate_attempts(verification: dict) -> tuple[bool, str]:
    """
    Check if brute-force attempts exceeded (max 5)
    Returns: (allowed: bool, error_message: str)
    """
    attempts = verification.get("attempts", 0)
    
    if attempts >= 5:
        return False, "Too many incorrect attempts. Please request a new code."
    
    return True, ""


def is_expired(verification: dict) -> bool:
    """
    Check if verification is expired
    """
    now = datetime.utcnow()
    expires_at = verification.get("expiresAt")
    
    return expires_at and now >= expires_at


def seconds_until_resend(verification: dict) -> int:
    """
    Calculate seconds until resend is available
    For countdown timer in UI
    """
    now = datetime.utcnow()
    resend_available = verification.get("resendAvailableAt")
    
    if not resend_available or now >= resend_available:
        return 0
    
    return int((resend_available - now).total_seconds())

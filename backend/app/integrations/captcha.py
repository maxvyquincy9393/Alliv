"""
CAPTCHA integration for bot protection.

Supports reCAPTCHA v3 for invisible bot detection.
"""
import logging
from typing import Optional
import httpx
from ..config import settings

logger = logging.getLogger(__name__)


class CaptchaError(Exception):
    """Raised when CAPTCHA verification fails."""
    pass


async def verify_recaptcha(
    token: str,
    action: str,
    threshold: float = 0.5,
    remote_ip: Optional[str] = None
) -> bool:
    """
    Verify a reCAPTCHA v3 token.
    
    Args:
        token: The reCAPTCHA response token from the client
        action: The expected action name (e.g., "login", "register")
        threshold: Minimum score to accept (0.0 to 1.0). Default 0.5
        remote_ip: Optional IP address of the user
        
    Returns:
        True if verification passes, False otherwise
        
    Raises:
        CaptchaError: If verification request fails
    """
    if not settings.RECAPTCHA_SECRET_KEY:
        logger.warning("RECAPTCHA_SECRET_KEY not configured - skipping CAPTCHA verification")
        return True  # Allow in development
    
    verify_url = "https://www.google.com/recaptcha/api/siteverify"
    
    payload = {
        "secret": settings.RECAPTCHA_SECRET_KEY,
        "response": token,
    }
    
    if remote_ip:
        payload["remoteip"] = remote_ip
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(verify_url, data=payload, timeout=10.0)
            response.raise_for_status()
            result = response.json()
    except httpx.HTTPError as e:
        logger.error(f"CAPTCHA verification request failed: {e}")
        raise CaptchaError(f"Failed to verify CAPTCHA: {e}")
    
    # Check if verification succeeded
    if not result.get("success", False):
        error_codes = result.get("error-codes", [])
        logger.warning(f"CAPTCHA verification failed: {error_codes}")
        return False
    
    # Verify action matches
    if result.get("action") != action:
        logger.warning(
            f"CAPTCHA action mismatch: expected '{action}', got '{result.get('action')}'"
        )
        return False
    
    # Check score against threshold
    score = result.get("score", 0.0)
    if score < threshold:
        logger.warning(
            f"CAPTCHA score too low: {score} < {threshold} for action '{action}'"
        )
        return False
    
    logger.info(f"CAPTCHA verification successful: score={score}, action={action}")
    return True


async def verify_hcaptcha(
    token: str,
    remote_ip: Optional[str] = None
) -> bool:
    """
    Verify an hCaptcha token.
    
    Args:
        token: The hCaptcha response token from the client
        remote_ip: Optional IP address of the user
        
    Returns:
        True if verification passes, False otherwise
        
    Raises:
        CaptchaError: If verification request fails
    """
    # Note: hCaptcha would need separate config keys
    # For now, we'll use the reCAPTCHA keys as placeholders
    if not settings.RECAPTCHA_SECRET_KEY:
        logger.warning("HCAPTCHA_SECRET_KEY not configured - skipping CAPTCHA verification")
        return True
    
    verify_url = "https://hcaptcha.com/siteverify"
    
    payload = {
        "secret": settings.RECAPTCHA_SECRET_KEY,
        "response": token,
    }
    
    if remote_ip:
        payload["remoteip"] = remote_ip
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(verify_url, data=payload, timeout=10.0)
            response.raise_for_status()
            result = response.json()
    except httpx.HTTPError as e:
        logger.error(f"CAPTCHA verification request failed: {e}")
        raise CaptchaError(f"Failed to verify CAPTCHA: {e}")
    
    if not result.get("success", False):
        error_codes = result.get("error-codes", [])
        logger.warning(f"CAPTCHA verification failed: {error_codes}")
        return False
    
    logger.info("CAPTCHA verification successful")
    return True


# Dependency for FastAPI routes
async def require_captcha(
    captcha_token: Optional[str] = None,
    action: str = "submit",
    threshold: float = 0.5,
    remote_ip: Optional[str] = None
) -> bool:
    """
    FastAPI dependency to require CAPTCHA verification.
    
    Args:
        captcha_token: The CAPTCHA token to verify
        action: The action being performed
        threshold: Minimum score for reCAPTCHA v3
        remote_ip: User's IP address
        
    Returns:
        True if verification passes
        
    Raises:
        HTTPException: If CAPTCHA verification fails
    """
    from fastapi import HTTPException, status
    
    if not captcha_token:
        if settings.RECAPTCHA_SECRET_KEY:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CAPTCHA token is required"
            )
        # Allow if not configured (development mode)
        return True
    
    try:
        is_valid = await verify_recaptcha(
            token=captcha_token,
            action=action,
            threshold=threshold,
            remote_ip=remote_ip
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CAPTCHA verification failed. Please try again."
            )
        
        return True
    except CaptchaError as e:
        logger.error(f"CAPTCHA verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="CAPTCHA service temporarily unavailable"
        )

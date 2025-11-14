"""
Production Email Verification Routes
Security features:
- OTP hashing with argon2id
- Rate limiting (per-IP and per-email)
- Anti-brute-force (max 5 attempts)
- Resend throttling (60 seconds)
- No user enumeration
- TTL auto-cleanup
- Magic link single-use
"""
from fastapi import APIRouter, HTTPException, status, Request, Response
from fastapi.responses import RedirectResponse
from datetime import datetime, timedelta
from typing import Optional
import logging

from ..config import settings
from ..db import get_db
from ..models_verification import (
    VerifyRequestInput,
    VerifyConfirmInput,
    VerifyResponse,
    VerifyConfirmResponse
)
from ..verification_utils import (
    create_verification_record,
    verify_otp,
    validate_resend_timing,
    validate_attempts,
    is_expired,
    mask_email
)
from ..email_utils import send_verification_email
from ..auth import create_access_token, create_refresh_token
from slowapi import Limiter
from slowapi.util import get_remote_address

router = APIRouter(prefix="/auth/verify", tags=["Email Verification"])
limiter = Limiter(key_func=get_remote_address)
logger = logging.getLogger("alliv")


@router.post("/request", response_model=VerifyResponse)
@limiter.limit("3/minute")  # Per IP
async def request_verification(request: Request, data: VerifyRequestInput):
    """
    Request verification code
    - Sends 6-digit OTP + magic link
    - Rate limited: 3/min per IP, 60s throttle per email
    - Generic response (no user enumeration)
    
    Security: Always returns 200 even if email doesn't exist
    """
    try:
        email = data.email.lower().strip()
        
        # Find user (case-insensitive)
        user = await get_db().users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        
        # SECURITY: Don't leak if user exists - always return 200
        if not user:
            logger.info(f"Verification request for non-existent email: {mask_email(email)}")
            return VerifyResponse(
                ok=True,
                message="If the email is registered, a verification code has been sent."
            )
        
        user_id = str(user["_id"])
        
        # Check for active verification
        active_verification = await get_db().verifications.find_one({
            "userId": user_id,
            "consumed": False,
            "expiresAt": {"$gt": datetime.utcnow()}
        })
        
        # Check resend throttle (60 seconds)
        if active_verification:
            allowed, error_msg = validate_resend_timing(active_verification)
            if not allowed:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=error_msg
                )
        
        # Generate new verification
        verification_data = create_verification_record(user_id, email)
        record = verification_data["record"]
        code = verification_data["code"]  # Plaintext OTP for email only
        token = verification_data["token"]
        
        # Save to database
        await get_db().verifications.insert_one(record)
        
        # Create magic link
        magic_link = f"{settings.OAUTH_REDIRECT_BASE.replace('/auth/oauth', '')}/verify-email?token={token}"
        
        # Send email
        email_sent = await send_verification_email(
            to_email=email,
            verification_link=magic_link,
            user_name=user.get("name", "there"),
            verification_code=code
        )
        
        if not email_sent:
            logger.warning(f"Failed to send verification email to {mask_email(email)}")
        
        logger.info(f"[EMAIL] Verification sent to {mask_email(email)} (expires in 10m)")
        
        # SECURITY: Generic response
        return VerifyResponse(
            ok=True,
            message="If the email is registered, a verification code has been sent."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verification request error: {e}")
        # SECURITY: Don't leak internal errors
        return VerifyResponse(
            ok=True,
            message="If the email is registered, a verification code has been sent."
        )


@router.post("/confirm", response_model=VerifyConfirmResponse)
@limiter.limit("10/minute")  # Per IP
async def confirm_verification(request: Request, data: VerifyConfirmInput):
    """
    Confirm verification with OTP
    - Max 5 attempts per code
    - Constant-time comparison (argon2id)
    - Auto-cleanup on success
    
    Security: Generic error messages, no user enumeration
    """
    try:
        email = data.email.lower().strip()
        code = data.code.strip()
        
        # Find user
        user = await get_db().users.find_one({"email": {"$regex": f"^{email}$", "$options": "i"}})
        
        # SECURITY: Generic error (don't reveal if user exists)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code"
            )
        
        user_id = str(user["_id"])
        
        # Find active verification
        verification = await get_db().verifications.find_one({
            "userId": user_id,
            "consumed": False,
            "expiresAt": {"$gt": datetime.utcnow()}
        })
        
        # Check if exists and not expired
        if not verification or is_expired(verification):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification code expired or invalid"
            )
        
        # Check brute-force attempts (max 5)
        allowed, error_msg = validate_attempts(verification)
        if not allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=error_msg
            )
        
        # Increment attempts
        await get_db().verifications.update_one(
            {"_id": verification["_id"]},
            {"$inc": {"attempts": 1}}
        )
        
        # Verify OTP (constant-time comparison via argon2id)
        code_hash = verification["codeHash"]
        if not verify_otp(code, code_hash):
            logger.warning(f"Invalid OTP attempt for {mask_email(email)} (attempt {verification['attempts'] + 1}/5)")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code"
            )
        
        # SUCCESS! Mark as verified
        await get_db().verifications.update_one(
            {"_id": verification["_id"]},
            {"$set": {"consumed": True}}
        )
        
        await get_db().users.update_one(
            {"_id": user["_id"]},
            {"$set": {"emailVerifiedAt": datetime.utcnow()}}
        )
        
        # Cleanup all active verifications for this user
        await get_db().verifications.delete_many({
            "userId": user_id,
            "consumed": False
        })
        
        # Generate upgraded tokens
        access_token = create_access_token({
            "sub": user_id,
            "email": user["email"],
            "verified": True
        })
        
        refresh_token = create_refresh_token({"sub": user_id})
        
        # Store refresh token
        await get_db().users.update_one(
            {"_id": user["_id"]},
            {"$push": {"refreshTokens": {
                "token": refresh_token,
                "createdAt": datetime.utcnow()
            }}}
        )
        
        logger.info(f"[OK] Email verified for {mask_email(email)}")
        
        return VerifyConfirmResponse(
            ok=True,
            message="Email verified successfully",
            accessToken=access_token,
            refreshToken=refresh_token
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Verification confirm error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Verification failed. Please try again."
        )


@router.get("/email")
async def verify_via_magic_link(token: str):
    """
    Verify via magic link (UUID token)
    - Single-use link
    - Expires in 10 minutes
    - Redirects to frontend with status
    
    Security: Token is UUID v4, single-use, time-limited
    """
    try:
        # Find verification by token
        verification = await get_db().verifications.find_one({
            "token": token,
            "consumed": False,
            "expiresAt": {"$gt": datetime.utcnow()}
        })
        
        # Check if valid
        if not verification or is_expired(verification):
            logger.warning(f"Invalid/expired magic link attempt: {token[:8]}...")
            # Redirect to frontend with error
            return RedirectResponse(
                url=f"{settings.CORS_ORIGIN}/verify?status=expired",
                status_code=status.HTTP_302_FOUND
            )
        
        # Get user
        user = await get_db().users.find_one({"_id": verification["userId"]})
        if not user:
            logger.error(f"User not found for verification: {verification['userId']}")
            return RedirectResponse(
                url=f"{settings.CORS_ORIGIN}/verify?status=error",
                status_code=status.HTTP_302_FOUND
            )
        
        # Mark as consumed
        await get_db().verifications.update_one(
            {"_id": verification["_id"]},
            {"$set": {"consumed": True}}
        )
        
        # Update user
        await get_db().users.update_one(
            {"_id": user["_id"]},
            {"$set": {"emailVerifiedAt": datetime.utcnow()}}
        )
        
        # Cleanup
        await get_db().verifications.delete_many({
            "userId": str(user["_id"]),
            "consumed": False
        })
        
        logger.info(f"[OK] Email verified via magic link for {mask_email(user['email'])}")
        
        # Redirect to frontend with success + masked email
        return RedirectResponse(
            url=f"{settings.CORS_ORIGIN}/verify?status=success&email={mask_email(user['email'])}",
            status_code=status.HTTP_302_FOUND
        )
        
    except Exception as e:
        logger.error(f"Magic link verification error: {e}")
        return RedirectResponse(
            url=f"{settings.CORS_ORIGIN}/verify?status=error",
            status_code=status.HTTP_302_FOUND
        )

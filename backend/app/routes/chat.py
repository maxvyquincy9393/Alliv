from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import validator
from ..auth import get_current_user
from ..crud import get_match_messages, create_message, verify_user_in_match
from ..models import MessageCreate, MessageResponse
from typing import List
from bson import ObjectId
from pymongo.errors import PyMongoError
import logging
from datetime import datetime, timedelta
from collections import defaultdict

# Setup logging
logger = logging.getLogger(__name__)

# ✅ Simple in-memory rate limiting (for production, use Redis)
rate_limit_store = defaultdict(list)
RATE_LIMIT_MESSAGES = 30  # messages per minute
RATE_LIMIT_WINDOW = 60  # seconds

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/{match_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    match_id: str,
    current_user: dict = Depends(get_current_user),
    limit: int = Query(100, ge=1, le=500, description="Number of messages to retrieve")
):
    """
    Get message history for a match with comprehensive error handling
    """
    try:
        # ✅ Validate match_id format
        try:
            match_oid = ObjectId(match_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid match ID format"
            )
        
        # ✅ Verify user is part of this match (with error handling)
        try:
            is_authorized = await verify_user_in_match(match_id, current_user["_id"])
        except Exception as e:
            logger.error(f"❌ Error verifying match authorization: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to verify match authorization"
            )
        
        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this match"
            )
        
        # ✅ Get messages with error handling
        messages = await get_match_messages(match_id, limit=limit)
        return messages
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except PyMongoError as e:
        logger.error(f"❌ Database error in get_messages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in get_messages: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve messages"
        )


def check_rate_limit(user_id: str) -> bool:
    """
    ✅ Check if user has exceeded rate limit (30 messages per minute)
    Returns True if allowed, False if rate limit exceeded
    """
    now = datetime.utcnow()
    user_key = str(user_id)
    
    # Clean old timestamps (older than RATE_LIMIT_WINDOW seconds)
    rate_limit_store[user_key] = [
        timestamp for timestamp in rate_limit_store[user_key]
        if (now - timestamp).total_seconds() < RATE_LIMIT_WINDOW
    ]
    
    # Check if user exceeded limit
    if len(rate_limit_store[user_key]) >= RATE_LIMIT_MESSAGES:
        return False
    
    # Add current timestamp
    rate_limit_store[user_key].append(now)
    return True


@router.post("/{match_id}/messages", response_model=MessageResponse)
async def send_message(
    match_id: str,
    message: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message with rate limiting, validation, and error handling
    """
    try:
        # ✅ Validate match_id format
        try:
            match_oid = ObjectId(match_id)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid match ID format"
            )
        
        # ✅ Validate message content
        content = message.content.strip()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content cannot be empty"
            )
        
        if len(content) > 5000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message content exceeds maximum length (5000 characters)"
            )
        
        # ✅ Rate limiting check
        if not check_rate_limit(current_user["_id"]):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {RATE_LIMIT_MESSAGES} messages per minute."
            )
        
        # ✅ Verify user is part of this match
        try:
            is_authorized = await verify_user_in_match(match_id, current_user["_id"])
        except Exception as e:
            logger.error(f"❌ Error verifying match authorization: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to verify match authorization"
            )
        
        if not is_authorized:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to send messages in this match"
            )
        
        # ✅ Create message
        message_doc = await create_message(
            match_id=match_id,
            sender_id=current_user["_id"],
            content=content
        )
        
        return message_doc
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except PyMongoError as e:
        logger.error(f"❌ Database error in send_message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in send_message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message"
        )

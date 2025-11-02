from fastapi import APIRouter, Depends, HTTPException, status
from ..auth import get_current_user
from ..crud import get_match_messages, create_message, verify_user_in_match
from ..models import MessageCreate, MessageResponse
from typing import List

router = APIRouter(prefix="/chat", tags=["Chat"])


@router.get("/{match_id}/messages", response_model=List[MessageResponse])
async def get_messages(match_id: str, current_user: dict = Depends(get_current_user)):
    """
    Get message history for a match
    """
    # Verify user is part of this match
    if not await verify_user_in_match(match_id, current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view this match"
        )
    
    messages = await get_match_messages(match_id, limit=100)
    return messages


@router.post("/{match_id}/messages", response_model=MessageResponse)
async def send_message(
    match_id: str,
    message: MessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Send a message (also used by WebSocket as fallback)
    """
    # Verify user is part of this match
    if not await verify_user_in_match(match_id, current_user["_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to send messages in this match"
        )
    
    message_doc = await create_message(
        match_id=match_id,
        sender_id=current_user["_id"],
        content=message.content
    )
    
    return message_doc

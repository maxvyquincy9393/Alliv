from fastapi import APIRouter, Depends, HTTPException, status
from ..auth import get_current_user
from ..crud import add_like, get_user_matches, get_user_by_id
from ..models import LikeResponse

router = APIRouter(prefix="/match", tags=["Matching"])


@router.post("/like/{to_id}", response_model=LikeResponse)
async def like_user(to_id: str, current_user: dict = Depends(get_current_user)):
    """
    Like a user
    If mutual like exists, creates a match
    """
    # Verify target user exists
    target_user = await get_user_by_id(to_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Can't like yourself
    if to_id == current_user["_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot like yourself"
        )
    
    result = await add_like(current_user["_id"], to_id)
    
    return {
        "match": result["match"],
        "match_data": result["match_data"]
    }


@router.post("/pass/{to_id}")
async def pass_user(to_id: str, current_user: dict = Depends(get_current_user)):
    """
    Pass on a user (no action needed, just for tracking)
    """
    return {"status": "passed"}


@router.get("/list")
async def list_matches(current_user: dict = Depends(get_current_user)):
    """
    Get all matches for current user
    """
    matches = await get_user_matches(current_user["_id"])
    return matches

from fastapi import APIRouter, Depends
from ..auth import get_current_user
from ..crud import compute_match_candidates

router = APIRouter(prefix="/discover", tags=["Discovery"])


@router.get("/next")
async def get_next_candidates(current_user: dict = Depends(get_current_user)):
    """
    Get next batch of match candidates
    Uses rule-based scoring algorithm
    """
    candidates = await compute_match_candidates(current_user, limit=20)
    
    # Remove sensitive fields
    for candidate in candidates:
        candidate.pop("password_hash", None)
        candidate.pop("email", None)  # Privacy: don't expose email until matched
    
    return candidates

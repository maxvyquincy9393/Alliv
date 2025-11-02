from fastapi import APIRouter, HTTPException, status, Depends
from ..models import UserSignup, UserLogin, TokenResponse
from ..crud import create_user, get_user_by_email
from ..auth import hash_password, create_access_token, verify_password, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse)
async def signup(payload: UserSignup):
    """Register a new user"""
    # Check if email already exists
    existing_user = await get_user_by_email(payload.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user document
    user_data = payload.model_dump()
    user_data["password_hash"] = hash_password(user_data.pop("password"))
    
    user = await create_user(user_data)
    
    # Generate token
    access_token = create_access_token({"sub": user["_id"]})
    
    # Remove sensitive data
    user.pop("password_hash", None)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/token", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login and get access token"""
    user = await get_user_by_email(credentials.email)
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate token
    access_token = create_access_token({"sub": user["_id"]})
    
    # Remove sensitive data
    user.pop("password_hash", None)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.get("/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    current_user.pop("password_hash", None)
    return current_user

"""
Verification & Trust Score Routes
Handles: Identity verification, trust scoring, badges
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Literal, Optional
from datetime import datetime
from bson import ObjectId

from ..config import settings
from ..auth import get_current_user
from .. import db
import cloudinary.uploader

router = APIRouter(prefix="/verify", tags=["Verification"])


# ===== MODELS =====
class VerificationRequest(BaseModel):
    type: Literal["id", "student", "portfolio", "linkedin"]
    url: Optional[str] = None  # For uploaded documents


class TrustScoreUpdate(BaseModel):
    action: Literal["profile_complete", "email_verify", "id_verify", "student_verify", "portfolio_verify", "first_match", "first_chat", "report_received"]
    value: int  # Points to add/subtract


# ===== TRUST SCORE CALCULATION =====
TRUST_SCORE_WEIGHTS = {
    "profile_complete": 10,      # Basic profile filled
    "email_verify": 15,          # Email verified
    "id_verify": 25,             # Government ID verified
    "student_verify": 20,        # Student/Institution verified
    "portfolio_verify": 15,      # Portfolio/Work verified
    "linkedin_verify": 10,       # LinkedIn connected
    "first_match": 5,            # First successful match
    "first_chat": 5,             # First chat conversation
    "report_received": -20,      # User reported (negative)
}


async def calculate_trust_score(user_id: ObjectId) -> int:
    """
    Calculate trust score based on verification status
    Returns score 0-100
    """
    profile = await db.profiles().find_one({"userId": user_id})
    user = await db.users().find_one({"_id": user_id})
    
    if not profile or not user:
        return 0
    
    score = 0
    
    # Email verification
    if user.get("verified"):
        score += TRUST_SCORE_WEIGHTS["email_verify"]
    
    # Profile completeness
    if profile.get("bio") and profile.get("field") and len(profile.get("skills", [])) >= 3:
        score += TRUST_SCORE_WEIGHTS["profile_complete"]
    
    # ID verification
    verifications = profile.get("verifications", {})
    if verifications.get("idVerified"):
        score += TRUST_SCORE_WEIGHTS["id_verify"]
    
    # Student verification
    if verifications.get("studentVerified"):
        score += TRUST_SCORE_WEIGHTS["student_verify"]
    
    # Portfolio verification
    if verifications.get("portfolioVerified"):
        score += TRUST_SCORE_WEIGHTS["portfolio_verify"]
    
    # LinkedIn verification
    if verifications.get("linkedinVerified"):
        score += TRUST_SCORE_WEIGHTS["linkedin_verify"]
    
    # Activity bonuses
    match_count = await db.matches().count_documents({
        "$or": [{"user1": user_id}, {"user2": user_id}]
    })
    if match_count > 0:
        score += TRUST_SCORE_WEIGHTS["first_match"]
    
    chat_count = await db.chats().count_documents({
        "participants": user_id
    })
    if chat_count > 0:
        score += TRUST_SCORE_WEIGHTS["first_chat"]
    
    # Penalty for reports
    report_count = await db.reports().count_documents({"reportedUserId": user_id})
    score += report_count * TRUST_SCORE_WEIGHTS["report_received"]
    
    # Ensure score is 0-100
    score = max(0, min(100, score))
    
    return score


# ===== ROUTES =====

@router.get("/score")
async def get_trust_score(
    current_user = Depends(get_current_user)
):
    """
    Get current user's trust score and verification status
    """
    try:
        user_id = current_user["_id"]
        score = await calculate_trust_score(user_id)
        
        # Update score in profile
        await db.profiles().update_one(
            {"userId": user_id},
            {"$set": {"trustScore": score}}
        )
        
        # Get verification details
        profile = await db.profiles().find_one({"userId": user_id})
        verifications = profile.get("verifications", {})
        
        return {
            "trustScore": score,
            "verifications": {
                "email": current_user.get("verified", False),
                "id": verifications.get("idVerified", False),
                "student": verifications.get("studentVerified", False),
                "portfolio": verifications.get("portfolioVerified", False),
                "linkedin": verifications.get("linkedinVerified", False)
            },
            "badges": get_badges(score, verifications)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def get_badges(score: int, verifications: dict) -> list:
    """
    Get user badges based on trust score and verifications
    """
    badges = []
    
    if score >= 80:
        badges.append("trusted_user")
    if score >= 50:
        badges.append("verified_user")
    if verifications.get("studentVerified"):
        badges.append("student")
    if verifications.get("portfolioVerified"):
        badges.append("professional")
    
    return badges


@router.post("/submit")
async def submit_verification(
    type: str,
    file: UploadFile = File(None),
    url: str = None,
    current_user = Depends(get_current_user)
):
    """
    Submit verification document
    Accepts: Government ID, Student ID, Portfolio URL, LinkedIn URL
    """
    try:
        user_id = current_user["_id"]
        
        verification_data = {
            "userId": user_id,
            "type": type,
            "status": "pending",
            "submittedAt": datetime.utcnow()
        }
        
        # Handle file upload (ID documents)
        if file:
            # Upload to Cloudinary (private folder)
            folder = f"alliv/verifications/{user_id}"
            content = await file.read()
            
            upload_result = cloudinary.uploader.upload(
                content,
                folder=folder,
                resource_type="auto"
            )
            
            verification_data["documentUrl"] = upload_result["secure_url"]
            verification_data["publicId"] = upload_result["public_id"]
        
        # Handle URL submissions (LinkedIn, Portfolio)
        if url:
            verification_data["url"] = url
        
        # Save verification request
        result = await db.verifications().insert_one(verification_data)
        
        return {
            "message": "Verification submitted successfully",
            "verificationId": str(result.inserted_id),
            "status": "pending",
            "note": "Your verification will be reviewed within 24-48 hours"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status")
async def get_verification_status(
    current_user = Depends(get_current_user)
):
    """
    Get all verification requests for current user
    """
    try:
        user_id = current_user["_id"]
        
        verifications_cursor = db.verifications().find(
            {"userId": user_id}
        ).sort("submittedAt", -1)
        
        verifications = await verifications_cursor.to_list(length=20)
        
        verifications_list = [{
            "id": str(v["_id"]),
            "type": v["type"],
            "status": v["status"],
            "submittedAt": v["submittedAt"].isoformat(),
            "reviewedAt": v.get("reviewedAt").isoformat() if v.get("reviewedAt") else None,
            "note": v.get("note")
        } for v in verifications]
        
        return {
            "verifications": verifications_list,
            "total": len(verifications_list)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/admin/review/{verificationId}")
async def review_verification(
    verificationId: str,
    status: Literal["approved", "rejected"],
    note: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """
    Admin endpoint: Review verification request
    TODO: Add admin role check
    """
    try:
        # Get verification
        verification = await db.verifications().find_one({"_id": ObjectId(verificationId)})
        
        if not verification:
            raise HTTPException(status_code=404, detail="Verification not found")
        
        # Update verification status
        await db.verifications().update_one(
            {"_id": ObjectId(verificationId)},
            {
                "$set": {
                    "status": status,
                    "reviewedAt": datetime.utcnow(),
                    "reviewedBy": current_user["_id"],
                    "note": note
                }
            }
        )
        
        # If approved, update profile verifications
        if status == "approved":
            verification_type = verification["type"]
            field_map = {
                "id": "idVerified",
                "student": "studentVerified",
                "portfolio": "portfolioVerified",
                "linkedin": "linkedinVerified"
            }
            
            field_name = field_map.get(verification_type)
            if field_name:
                await db.profiles().update_one(
                    {"userId": verification["userId"]},
                    {
                        "$set": {
                            f"verifications.{field_name}": True,
                            "updatedAt": datetime.utcnow()
                        }
                    }
                )
                
                # Recalculate trust score
                new_score = await calculate_trust_score(verification["userId"])
                await db.profiles().update_one(
                    {"userId": verification["userId"]},
                    {"$set": {"trustScore": new_score}}
                )
        
        return {
            "message": f"Verification {status}",
            "verificationId": verificationId
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

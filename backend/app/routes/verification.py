"""
Verification & Trust Score Routes
Handles: Identity verification, trust scoring, badges, email notifications
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from pydantic import BaseModel, HttpUrl
from typing import Literal, Optional
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from ..config import settings
from ..auth import get_current_user
from ..db import get_db
from ..email_utils import send_email
import cloudinary.uploader

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/verify", tags=["Verification"])


# ===== MODELS =====
class VerificationRequest(BaseModel):
    type: Literal["id", "student", "portfolio", "linkedin"]
    url: Optional[HttpUrl] = None  # For LinkedIn/Portfolio URLs
    additionalInfo: Optional[str] = None


class VerificationReview(BaseModel):
    status: Literal["approved", "rejected"]
    note: Optional[str] = None


# ===== TRUST SCORE CALCULATION =====
async def calculate_trust_score(user_id: ObjectId) -> int:
    """
    Calculate trust score based on verification status and user activity
    
    Scoring system:
    - Base score: 50 points
    - Email verified: +10
    - Complete profile (photo, bio, skills): +10
    - Verification badge: +20
    - Each successful collaboration: +5 (max +10)
    - User report: -10 each
    - No activity 30 days: -5
    
    Returns: score 0-100
    """
    try:
        score = 50  # Base score
        
        profile = await get_db().profiles.find_one({"userId": user_id})
        user = await get_db().users.find_one({"_id": user_id})
        
        if not user:
            return 50
        
        # +10 for email verified
        if user.get("emailVerified", False) or user.get("verified", False):
            score += 10
        
        # +10 for complete profile
        if profile:
            has_photo = bool(profile.get("photo")) or len(profile.get("photos", [])) > 0
            has_bio = len(profile.get("bio", "")) > 20
            has_skills = len(profile.get("skills", [])) >= 3
            if has_photo and has_bio and has_skills:
                score += 10
        
        # +20 for verification badge (any type of verification)
        if profile:
            verifications = profile.get("verifications", {})
            is_verified = (
                verifications.get("idVerified", False) or
                verifications.get("studentVerified", False) or
                verifications.get("portfolioVerified", False) or
                verifications.get("linkedinVerified", False) or
                profile.get("verified", False)
            )
            if is_verified:
                score += 20
        
        # +5 per successful collaboration (max +10)
        completed_projects = await get_db().projects.count_documents({
            "members": user_id,
            "status": "completed"
        })
        collaboration_bonus = min(completed_projects * 5, 10)
        score += collaboration_bonus
        
        # -10 per unresolved user report
        reports_count = await get_db().reports.count_documents({
            "reportedUserId": user_id,
            "status": {"$ne": "resolved"}
        })
        score -= reports_count * 10
        
        # -5 if inactive for 30+ days
        last_active = user.get("lastActive", datetime.utcnow())
        if isinstance(last_active, datetime):
            days_inactive = (datetime.utcnow() - last_active).days
            if days_inactive > 30:
                score -= 5
        
        # Clamp between 0-100
        return max(0, min(100, score))
        
    except Exception as e:
        logger.error(f"Error calculating trust score for user {user_id}: {str(e)}")
        return 50  # Return base score on error


# ===== HELPER FUNCTIONS =====
async def is_admin(user_id: ObjectId) -> bool:
    """Check if user has admin role"""
    try:
        user = await get_db().users.find_one({"_id": user_id})
        return user and user.get("role") == "admin"
    except Exception:
        return False


async def send_verification_email(user_id: ObjectId, status: str, reason: Optional[str] = None):
    """Send email notification about verification status"""
    try:
        user = await get_db().users.find_one({"_id": user_id})
        if not user:
            return
        
        email = user.get("email")
        name = user.get("name", "User")
        
        if status == "approved":
            subject = "[SUCCESS] Verification Approved - You're Verified!"
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #10b981;">[OK] Verification Approved!</h2>
                <p>Hi <strong>{name}</strong>,</p>
                <p>Congratulations! Your verification request has been approved.</p>
                <p>You now have the <strong>Verified Badge</strong> ✓ on your profile.</p>
                <p><strong>Benefits:</strong></p>
                <ul>
                    <li>+20 Trust Score boost</li>
                    <li>Higher visibility in searches</li>
                    <li>Increased credibility with other users</li>
                    <li>Priority in project applications</li>
                    <li>Access to verified-only features</li>
                </ul>
                <p>Keep building your reputation on COLABMATCH!</p>
                <p style="margin-top: 30px;">
                    <a href="{settings.FRONTEND_URL}/profile" 
                       style="background-color: #10b981; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        View Your Profile
                    </a>
                </p>
            </div>
            """
        else:  # rejected
            subject = "Verification Update - COLABMATCH"
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #ef4444;">Verification Review Update</h2>
                <p>Hi <strong>{name}</strong>,</p>
                <p>Thank you for submitting your verification request.</p>
                <p>Unfortunately, we were unable to approve your verification at this time.</p>
                {f'<p><strong>Reason:</strong> {reason}</p>' if reason else ''}
                <p>You can resubmit your verification with updated documentation.</p>
                <p><strong>Tips for successful verification:</strong></p>
                <ul>
                    <li>Ensure ID photo is clear and readable</li>
                    <li>Make sure all text is visible and not blurry</li>
                    <li>LinkedIn profile should be public and active</li>
                    <li>Portfolio should showcase your actual work</li>
                    <li>All information should match your profile details</li>
                </ul>
                <p style="margin-top: 30px;">
                    <a href="{settings.FRONTEND_URL}/verify" 
                       style="background-color: #3b82f6; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                        Try Again
                    </a>
                </p>
            </div>
            """
        
        await send_email(email, subject, html_content)
        logger.info(f"Verification email sent to {email} with status: {status}")
        
    except Exception as e:
        logger.error(f"Error sending verification email: {str(e)}")
        # Don't raise - email failure shouldn't block verification


# ===== ROUTES =====

@router.get("/score")
async def get_trust_score(current_user = Depends(get_current_user)):
    """
    Get current user's trust score and verification status
    
    Returns:
    - Current trust score (0-100)
    - Verification statuses for all types
    - Earned badges
    - Score breakdown
    """
    try:
        user_id = current_user["_id"]
        score = await calculate_trust_score(user_id)
        
        # Update score in profile and user
        await get_db().profiles.update_one(
            {"userId": user_id},
            {"$set": {"trustScore": score}},
            upsert=True
        )
        await get_db().users.update_one(
            {"_id": user_id},
            {"$set": {"trustScore": score}}
        )
        
        # Get verification details
        profile = await get_db().profiles.find_one({"userId": user_id})
        verifications = profile.get("verifications", {}) if profile else {}
        
        # Get user details
        user = await get_db().users.find_one({"_id": user_id})
        
        return {
            "trustScore": score,
            "verifications": {
                "email": user.get("emailVerified", False) or user.get("verified", False),
                "id": verifications.get("idVerified", False),
                "student": verifications.get("studentVerified", False),
                "portfolio": verifications.get("portfolioVerified", False),
                "linkedin": verifications.get("linkedinVerified", False)
            },
            "badges": get_badges(score, verifications),
            "scoreBreakdown": {
                "base": 50,
                "emailVerified": 10 if user.get("emailVerified") or user.get("verified") else 0,
                "completeProfile": 10 if (profile and profile.get("photo") and len(profile.get("bio", "")) > 20 and len(profile.get("skills", [])) >= 3) else 0,
                "verified": 20 if any(verifications.values()) or profile.get("verified") else 0,
                "collaborations": "varies (max +10)",
                "reports": "varies (penalties)",
                "activity": "varies"
            }
        }
    
    except Exception as e:
        logger.error(f"Error getting trust score: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get trust score"
        )


def get_badges(score: int, verifications: dict) -> list:
    """
    Get user badges based on trust score and verifications
    """
    badges = []
    
    if score >= 90:
        badges.append({"name": "trusted_elite", "label": "Elite Trusted", "color": "gold"})
    elif score >= 80:
        badges.append({"name": "trusted_user", "label": "Highly Trusted", "color": "blue"})
    elif score >= 50:
        badges.append({"name": "verified_user", "label": "Verified", "color": "green"})
    
    if verifications.get("studentVerified"):
        badges.append({"name": "student", "label": "Student", "color": "purple"})
    if verifications.get("portfolioVerified"):
        badges.append({"name": "professional", "label": "Professional", "color": "indigo"})
    if verifications.get("linkedinVerified"):
        badges.append({"name": "linkedin", "label": "LinkedIn Verified", "color": "blue"})
    if verifications.get("idVerified"):
        badges.append({"name": "id_verified", "label": "ID Verified", "color": "green"})
    
    return badges


@router.get("/trust-score/{userId}")
async def get_user_trust_score(userId: str):
    """
    Get trust score for a specific user (public endpoint)
    
    This allows other users to see trust scores for transparency
    """
    try:
        # Validate userId
        try:
            user_oid = ObjectId(userId)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        # Calculate trust score
        trust_score = await calculate_trust_score(user_oid)
        
        # Get verification status
        profile = await get_db().profiles.find_one({"userId": user_oid})
        verifications = profile.get("verifications", {}) if profile else {}
        is_verified = profile.get("verified", False) if profile else False
        
        return {
            "userId": userId,
            "trustScore": trust_score,
            "verified": is_verified,
            "badges": get_badges(trust_score, verifications)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting trust score: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get trust score"
        )


@router.post("/recalculate")
async def recalculate_my_trust_score(current_user = Depends(get_current_user)):
    """
    Recalculate current user's trust score
    
    Useful after completing profile, finishing projects, etc.
    """
    try:
        user_id = current_user["_id"]
        
        # Recalculate trust score
        new_score = await calculate_trust_score(user_id)
        
        # Update in both collections
        await get_db().users.update_one(
            {"_id": user_id},
            {"$set": {"trustScore": new_score}}
        )
        await get_db().profiles.update_one(
            {"userId": user_id},
            {"$set": {"trustScore": new_score}}
        )
        
        return {
            "message": "Trust score recalculated",
            "newScore": new_score
        }
    
    except Exception as e:
        logger.error(f"Error recalculating trust score: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to recalculate trust score"
        )


@router.post("/recalculate-all")
async def recalculate_all_trust_scores(current_user = Depends(get_current_user)):
    """
    Recalculate trust scores for all users (Admin only)
    
    Useful for:
    - After algorithm changes
    - Periodic maintenance
    - Fixing inconsistencies
    """
    try:
        # Check if user is admin
        if not await is_admin(current_user["_id"]):
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )
        
        # Get all users
        cursor = get_db().users.find({})
        users = await cursor.to_list(length=None)
        
        updated_count = 0
        errors = 0
        
        for user in users:
            try:
                new_score = await calculate_trust_score(user["_id"])
                
                await get_db().users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"trustScore": new_score}}
                )
                await get_db().profiles.update_one(
                    {"userId": user["_id"]},
                    {"$set": {"trustScore": new_score}}
                )
                
                updated_count += 1
            except Exception as e:
                logger.error(f"Failed to update trust score for user {user['_id']}: {str(e)}")
                errors += 1
                continue
        
        return {
            "message": "Trust scores recalculated",
            "totalUsers": len(users),
            "updated": updated_count,
            "errors": errors
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error recalculating all trust scores: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to recalculate trust scores"
        )


@router.post("/upload")
async def upload_verification_proof(
    type: str,
    file: Optional[UploadFile] = File(None),
    url: Optional[str] = None,
    additionalInfo: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """
    Upload verification proof (ID photo, LinkedIn, Portfolio, Student ID)
    
    Types:
    - id: Government-issued ID (requires file upload)
    - student: Student/Institution ID (requires file upload)
    - portfolio: Portfolio website (requires URL)
    - linkedin: LinkedIn profile (requires URL)
    """
    try:
        user_id = current_user["_id"]
        
        # Check if user already has pending verification of this type
        existing = await get_db().verifications.find_one({
            "userId": user_id,
            "type": type,
            "status": "pending"
        })
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"You already have a pending {type} verification request"
            )
        
        # Validate input based on type
        if type in ["id", "student"] and not file:
            raise HTTPException(
                status_code=400,
                detail=f"{type.upper()} verification requires a file upload"
            )
        
        if type in ["portfolio", "linkedin"] and not url:
            raise HTTPException(
                status_code=400,
                detail=f"{type.title()} verification requires a URL"
            )
        
        verification_data = {
            "userId": user_id,
            "type": type,
            "status": "pending",
            "submittedAt": datetime.utcnow(),
            "additionalInfo": additionalInfo
        }
        
        # Handle file upload (ID/Student documents)
        if file:
            if not file.content_type or not file.content_type.startswith("image/"):
                raise HTTPException(
                    status_code=400,
                    detail="Only image files are allowed for document verification"
                )
            
            # Upload to Cloudinary (private folder for security)
            folder = f"colabmatch/verifications/{type}"
            content = await file.read()
            
            upload_result = cloudinary.uploader.upload(
                content,
                folder=folder,
                resource_type="image"
            )
            
            verification_data["documentUrl"] = upload_result["secure_url"]
            verification_data["publicId"] = upload_result["public_id"]
        
        # Handle URL submissions (LinkedIn, Portfolio)
        if url:
            verification_data["url"] = url
        
        # Save verification request
        result = await get_db().verifications.insert_one(verification_data)
        
        logger.info(f"Verification submitted: type={type}, userId={user_id}")
        
        return {
            "message": "Verification submitted successfully",
            "verificationId": str(result.inserted_id),
            "type": type,
            "status": "pending",
            "estimatedReviewTime": "1-3 business days",
            "note": "You'll receive an email once your verification is reviewed"
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting verification: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to submit verification request"
        )


@router.get("/status")
async def get_verification_status(
    current_user = Depends(get_current_user)
):
    """
    Get all verification requests for current user
    """
    try:
        user_id = current_user["_id"]
        
        verifications_cursor = get_db().verifications.find(
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


@router.get("/pending")
async def get_pending_verifications(current_user = Depends(get_current_user)):
    """
    Get all pending verification requests (Admin only)
    
    Returns list of pending verifications with user details for review
    """
    try:
        # Check if user is admin
        if not await is_admin(current_user["_id"]):
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )
        
        # Get all pending verifications
        verifications_cursor = get_db().verifications.find(
            {"status": "pending"}
        ).sort("submittedAt", 1)  # Oldest first
        
        verifications = await verifications_cursor.to_list(length=100)
        
        # Enrich with user data
        result = []
        for verification in verifications:
            user = await get_db().users.find_one({"_id": verification["userId"]})
            profile = await get_db().profiles.find_one({"userId": verification["userId"]})
            
            if user:
                result.append({
                    "id": str(verification["_id"]),
                    "userId": str(verification["userId"]),
                    "userName": user.get("name", "Unknown"),
                    "userEmail": user.get("email"),
                    "userPhoto": profile.get("photo") if profile else None,
                    "type": verification["type"],
                    "documentUrl": verification.get("documentUrl"),
                    "url": verification.get("url"),
                    "additionalInfo": verification.get("additionalInfo"),
                    "submittedAt": verification["submittedAt"],
                    "currentTrustScore": await calculate_trust_score(verification["userId"])
                })
        
        return {
            "verifications": result,
            "total": len(result)
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting pending verifications: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get pending verifications"
        )


@router.post("/approve/{userId}")
async def approve_verification(
    userId: str,
    current_user = Depends(get_current_user)
):
    """
    Approve user verification (Admin only)
    
    Actions:
    - Update verification status to approved
    - Set profile verification flag
    - Update trust score (+20 bonus)
    - Send congratulations email
    """
    try:
        # Check if user is admin
        if not await is_admin(current_user["_id"]):
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )
        
        # Validate userId
        try:
            user_oid = ObjectId(userId)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        # Check if user exists
        user = await get_db().users.find_one({"_id": user_oid})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get pending verification
        verification = await get_db().verifications.find_one({
            "userId": user_oid,
            "status": "pending"
        })
        
        if not verification:
            raise HTTPException(
                status_code=404,
                detail="No pending verification request found for this user"
            )
        
        verification_type = verification["type"]
        
        # Update verification status
        await get_db().verifications.update_one(
            {"_id": verification["_id"]},
            {
                "$set": {
                    "status": "approved",
                    "reviewedAt": datetime.utcnow(),
                    "reviewedBy": current_user["_id"]
                }
            }
        )
        
        # Update profile verifications
        field_map = {
            "id": "idVerified",
            "student": "studentVerified",
            "portfolio": "portfolioVerified",
            "linkedin": "linkedinVerified"
        }
        
        field_name = field_map.get(verification_type)
        if field_name:
            await get_db().profiles.update_one(
                {"userId": user_oid},
                {
                    "$set": {
                        f"verifications.{field_name}": True,
                        "verified": True,  # Also set main verified flag
                        "updatedAt": datetime.utcnow()
                    }
                },
                upsert=True
            )
        
        # Recalculate and update trust score (will include +20 for verification)
        new_trust_score = await calculate_trust_score(user_oid)
        await get_db().users.update_one(
            {"_id": user_oid},
            {"$set": {"trustScore": new_trust_score}}
        )
        await get_db().profiles.update_one(
            {"userId": user_oid},
            {"$set": {"trustScore": new_trust_score}}
        )
        
        # Send congratulations email
        await send_verification_email(user_oid, "approved")
        
        logger.info(f"Verification approved: userId={userId}, type={verification_type}")
        
        return {
            "message": "User verification approved successfully",
            "userId": userId,
            "verificationType": verification_type,
            "verified": True,
            "newTrustScore": new_trust_score,
            "emailSent": True
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving verification: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to approve verification"
        )


@router.post("/reject/{userId}")
async def reject_verification(
    userId: str,
    reason: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """
    Reject user verification (Admin only)
    
    Actions:
    - Update verification status to rejected
    - Store rejection reason
    - Send rejection email with reason
    - User can resubmit later
    """
    try:
        # Check if user is admin
        if not await is_admin(current_user["_id"]):
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )
        
        # Validate userId
        try:
            user_oid = ObjectId(userId)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
        
        # Get pending verification
        verification = await get_db().verifications.find_one({
            "userId": user_oid,
            "status": "pending"
        })
        
        if not verification:
            raise HTTPException(
                status_code=404,
                detail="No pending verification request found for this user"
            )
        
        # Update verification status
        await get_db().verifications.update_one(
            {"_id": verification["_id"]},
            {
                "$set": {
                    "status": "rejected",
                    "reviewedAt": datetime.utcnow(),
                    "reviewedBy": current_user["_id"],
                    "note": reason or "Verification requirements not met"
                }
            }
        )
        
        # Send rejection email with reason
        await send_verification_email(user_oid, "rejected", reason)
        
        logger.info(f"Verification rejected: userId={userId}, reason={reason}")
        
        return {
            "message": "Verification rejected",
            "userId": userId,
            "reason": reason,
            "canResubmit": True,
            "emailSent": True
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error rejecting verification: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to reject verification"
        )


@router.post("/admin/review/{verificationId}")
async def review_verification(
    verificationId: str,
    review: VerificationReview,
    current_user = Depends(get_current_user)
):
    """
    Admin endpoint: Review verification request (Legacy endpoint - use approve/reject instead)
    """
    try:
        # Check if user is admin
        if not await is_admin(current_user["_id"]):
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )
        
        # Get verification
        verification = await get_db().verifications.find_one({"_id": ObjectId(verificationId)})
        
        if not verification:
            raise HTTPException(status_code=404, detail="Verification not found")
        
        # Update verification status
        await get_db().verifications.update_one(
            {"_id": ObjectId(verificationId)},
            {
                "$set": {
                    "status": review.status,
                    "reviewedAt": datetime.utcnow(),
                    "reviewedBy": current_user["_id"],
                    "note": review.note
                }
            }
        )
        
        # If approved, update profile verifications
        if review.status == "approved":
            verification_type = verification["type"]
            field_map = {
                "id": "idVerified",
                "student": "studentVerified",
                "portfolio": "portfolioVerified",
                "linkedin": "linkedinVerified"
            }
            
            field_name = field_map.get(verification_type)
            if field_name:
                await get_db().profiles.update_one(
                    {"userId": verification["userId"]},
                    {
                        "$set": {
                            f"verifications.{field_name}": True,
                            "verified": True,
                            "updatedAt": datetime.utcnow()
                        }
                    }
                )
                
                # Recalculate trust score
                new_score = await calculate_trust_score(verification["userId"])
                await get_db().profiles.update_one(
                    {"userId": verification["userId"]},
                    {"$set": {"trustScore": new_score}}
                )
                
                # Send approval email
                await send_verification_email(verification["userId"], "approved")
        else:
            # Send rejection email
            await send_verification_email(verification["userId"], "rejected", review.note)
        
        return {
            "message": f"Verification {review.status}",
            "verificationId": verificationId,
            "emailSent": True
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reviewing verification: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to review verification"
        )

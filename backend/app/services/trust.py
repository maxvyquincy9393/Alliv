import logging
from datetime import datetime
from bson import ObjectId
from ..db import users, profiles, projects, reports

logger = logging.getLogger(__name__)

async def calculate_trust_score(user_id: str) -> int:
    """
    Calculate the trust score (behavioral score) for a user based on:
    - Identity Verification (Email, OAuth)
    - Profile Completeness
    - Platform Activity (Projects)
    - Reputation (Reports)
    """
    score = 50  # Base score
    
    try:
        user_oid = ObjectId(user_id)
        user = await users().find_one({"_id": user_oid})
        profile = await profiles().find_one({"userId": user_id})
        
        if not user or not profile:
            return score

        # 1. Identity Verification (+20 max)
        if user.get("emailVerified"):
            score += 10
        
        # Check for OAuth linkage
        if user.get("oauth") and len(user.get("oauth", {})) > 0:
            score += 10

        # 2. Profile Completeness (+20 max)
        completeness_score = 0
        if profile.get("bio") and len(profile.get("bio")) > 20:
            completeness_score += 5
        if profile.get("skills") and len(profile.get("skills")) > 0:
            completeness_score += 5
        if profile.get("photos") and len(profile.get("photos")) > 0:
            completeness_score += 10
        
        score += completeness_score

        # 3. Platform Activity (+20 max)
        # Projects created
        project_count = await projects().count_documents({"ownerId": user_id})
        project_score = min(project_count * 5, 20) # Cap at 20 points (4 projects)
        score += project_score

        # 4. Reputation (Negative Impact)
        # Reports received (confirmed or pending)
        report_count = await reports().count_documents({"targetUserId": user_id})
        penalty = min(report_count * 20, 100) # Cap penalty at 100
        score -= penalty

        # Ensure score is within 0-100 range (soft limits)
        # We allow > 100 for super users in future, but for now let's keep it readable
        score = max(0, score)
        
        return score

    except Exception as e:
        logger.error(f"Error calculating trust score for {user_id}: {e}")
        return 50 # Return base score on error

async def update_user_trust_score(user_id: str) -> int:
    """
    Calculate and update the user's trust score in the database.
    """
    score = await calculate_trust_score(user_id)
    
    try:
        await profiles().update_one(
            {"userId": user_id},
            {"$set": {"trustScore": score, "updatedAt": datetime.utcnow()}}
        )
        logger.info(f"Updated trust score for {user_id}: {score}")
        return score
    except Exception as e:
        logger.error(f"Failed to update trust score for {user_id}: {e}")
        return 50

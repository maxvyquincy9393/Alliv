"""
Report System Routes
Allows users to report inappropriate behavior, spam, or harassment
Includes admin moderation panel and automatic action logic
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from ..auth import get_current_user
from .. import db
from ..email_utils import send_email
from ..config import settings

router = APIRouter(prefix="/reports", tags=["Reports"])
logger = logging.getLogger("alliv")

# ===== MODELS =====

class ReportCreate(BaseModel):
    targetId: str = Field(..., description="User ID being reported")
    type: Literal["harassment", "spam", "inappropriate", "fake", "other"]
    reason: str = Field(..., min_length=20, max_length=1000)
    evidence: List[str] = Field(default=[], description="Screenshot URLs from Cloudinary")
    context: Optional[dict] = Field(default={}, description="Match/Message/Project context")


class ReportResolve(BaseModel):
    action: Literal["warning", "suspension", "ban", "dismiss"]
    notes: str = Field(..., min_length=10, max_length=500)
    suspensionDays: Optional[int] = Field(default=30, ge=1, le=365)


# ===== HELPER FUNCTIONS =====

async def is_admin(user_id: ObjectId) -> bool:
    """Check if user has admin role"""
    user = await db.users().find_one({"_id": user_id})
    return user and user.get("role") == "admin"


async def check_and_apply_auto_action(target_user_id: ObjectId):
    """
    Check if user should be auto-suspended based on report count
    
    Actions:
    - 1st report: Warning email
    - 3rd report: 7-day suspension
    - 5th report: Permanent ban
    """
    try:
        # Count unresolved reports against this user
        report_count = await db.reports().count_documents({
            "targetId": target_user_id,
            "status": {"$in": ["pending", "reviewing"]},
            "action": {"$ne": "dismiss"}
        })
        
        user = await db.users().find_one({"_id": target_user_id})
        if not user:
            return
        
        email = user.get("email")
        name = user.get("name", "User")
        
        if report_count >= 5:
            # Permanent ban
            await db.users().update_one(
                {"_id": target_user_id},
                {
                    "$set": {
                        "status": "banned",
                        "bannedAt": datetime.utcnow(),
                        "banReason": "Multiple user reports (automatic)",
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            # Send ban email
            await send_email(
                to=email,
                subject="⛔ Account Permanently Banned - COLABMATCH",
                html=f"""
                <h2>Account Permanently Banned</h2>
                <p>Dear {name},</p>
                <p>Your COLABMATCH account has been <strong>permanently banned</strong> due to multiple user reports.</p>
                <p><strong>Reason:</strong> Multiple violations of community guidelines</p>
                <p>You will no longer be able to access your account or use COLABMATCH services.</p>
                <p>If you believe this was a mistake, please contact support@colabmatch.com</p>
                <hr>
                <p style="color: #666; font-size: 12px;">COLABMATCH Community Safety Team</p>
                """
            )
            logger.info(f"Auto-banned user {target_user_id} after {report_count} reports")
            
        elif report_count >= 3:
            # 7-day suspension
            suspension_until = datetime.utcnow() + timedelta(days=7)
            await db.users().update_one(
                {"_id": target_user_id},
                {
                    "$set": {
                        "status": "suspended",
                        "suspendedUntil": suspension_until,
                        "suspensionReason": "Multiple user reports (automatic)",
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            # Send suspension email
            await send_email(
                to=email,
                subject="⚠️ Account Suspended - COLABMATCH",
                html=f"""
                <h2>Account Temporarily Suspended</h2>
                <p>Dear {name},</p>
                <p>Your COLABMATCH account has been <strong>suspended until {suspension_until.strftime('%B %d, %Y')}</strong> due to multiple user reports.</p>
                <p><strong>Reason:</strong> Violations of community guidelines</p>
                <p><strong>Suspension Period:</strong> 7 days</p>
                <p>During this time, you will not be able to access your account. Please review our community guidelines to avoid future violations.</p>
                <p>If you believe this was a mistake, please contact support@colabmatch.com</p>
                <hr>
                <p style="color: #666; font-size: 12px;">COLABMATCH Community Safety Team</p>
                """
            )
            logger.info(f"Auto-suspended user {target_user_id} for 7 days after {report_count} reports")
            
        elif report_count == 1:
            # First warning
            await send_email(
                to=email,
                subject="⚠️ Community Guidelines Warning - COLABMATCH",
                html=f"""
                <h2>Community Guidelines Warning</h2>
                <p>Dear {name},</p>
                <p>You have received a report from another user regarding your behavior on COLABMATCH.</p>
                <p>This is a <strong>warning</strong>. Please review our community guidelines to ensure you're creating a positive experience for all users.</p>
                <h3>What to do:</h3>
                <ul>
                    <li>Review our <a href="{settings.FRONTEND_URL}/guidelines">Community Guidelines</a></li>
                    <li>Be respectful and professional in all interactions</li>
                    <li>Avoid spam, harassment, or inappropriate content</li>
                </ul>
                <p><strong>Important:</strong> Additional reports may result in suspension or permanent ban.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">COLABMATCH Community Safety Team</p>
                """
            )
            logger.info(f"Sent warning email to user {target_user_id} after 1st report")
            
    except Exception as e:
        logger.error(f"Error in auto-action check: {str(e)}")


async def apply_manual_action(
    target_user_id: ObjectId,
    action: str,
    admin_id: ObjectId,
    notes: str,
    suspension_days: int = 30
):
    """
    Apply manual moderation action by admin
    
    Actions:
    - warning: Send warning email
    - suspension: Suspend account for N days
    - ban: Permanently ban account
    - dismiss: No action (false report)
    """
    try:
        user = await db.users().find_one({"_id": target_user_id})
        if not user:
            raise HTTPException(status_code=404, detail="Target user not found")
        
        email = user.get("email")
        name = user.get("name", "User")
        
        if action == "warning":
            # Send official warning
            await send_email(
                to=email,
                subject="⚠️ Official Warning - COLABMATCH",
                html=f"""
                <h2>Official Warning</h2>
                <p>Dear {name},</p>
                <p>You have received an <strong>official warning</strong> from our moderation team.</p>
                <p><strong>Reason:</strong> {notes}</p>
                <p>Please ensure you follow our community guidelines. Further violations may result in suspension or permanent ban.</p>
                <p>Review our guidelines: <a href="{settings.FRONTEND_URL}/guidelines">Community Guidelines</a></p>
                <hr>
                <p style="color: #666; font-size: 12px;">COLABMATCH Moderation Team</p>
                """
            )
            logger.info(f"Admin {admin_id} sent warning to user {target_user_id}")
            
        elif action == "suspension":
            # Suspend account
            suspension_until = datetime.utcnow() + timedelta(days=suspension_days)
            await db.users().update_one(
                {"_id": target_user_id},
                {
                    "$set": {
                        "status": "suspended",
                        "suspendedUntil": suspension_until,
                        "suspensionReason": notes,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            await send_email(
                to=email,
                subject="🚫 Account Suspended - COLABMATCH",
                html=f"""
                <h2>Account Suspended</h2>
                <p>Dear {name},</p>
                <p>Your COLABMATCH account has been <strong>suspended until {suspension_until.strftime('%B %d, %Y')}</strong>.</p>
                <p><strong>Reason:</strong> {notes}</p>
                <p><strong>Suspension Period:</strong> {suspension_days} days</p>
                <p>You will not be able to access your account during this period.</p>
                <p>If you believe this was a mistake, please contact support@colabmatch.com</p>
                <hr>
                <p style="color: #666; font-size: 12px;">COLABMATCH Moderation Team</p>
                """
            )
            logger.info(f"Admin {admin_id} suspended user {target_user_id} for {suspension_days} days")
            
        elif action == "ban":
            # Permanent ban
            await db.users().update_one(
                {"_id": target_user_id},
                {
                    "$set": {
                        "status": "banned",
                        "bannedAt": datetime.utcnow(),
                        "banReason": notes,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            
            await send_email(
                to=email,
                subject="⛔ Account Permanently Banned - COLABMATCH",
                html=f"""
                <h2>Account Permanently Banned</h2>
                <p>Dear {name},</p>
                <p>Your COLABMATCH account has been <strong>permanently banned</strong>.</p>
                <p><strong>Reason:</strong> {notes}</p>
                <p>You will no longer be able to access COLABMATCH services.</p>
                <p>If you believe this was a mistake, please contact support@colabmatch.com</p>
                <hr>
                <p style="color: #666; font-size: 12px;">COLABMATCH Moderation Team</p>
                """
            )
            logger.info(f"Admin {admin_id} permanently banned user {target_user_id}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error applying manual action: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to apply moderation action")


async def update_trust_score_for_report(target_user_id: ObjectId, decrease: int = 10):
    """Decrease target user's trust score after receiving a report"""
    try:
        profile = await db.profiles().find_one({"userId": str(target_user_id)})
        if profile:
            current_score = profile.get("trustScore", 50)
            new_score = max(0, current_score - decrease)  # Don't go below 0
            
            await db.profiles().update_one(
                {"userId": str(target_user_id)},
                {
                    "$set": {
                        "trustScore": new_score,
                        "updatedAt": datetime.utcnow()
                    }
                }
            )
            logger.info(f"Decreased trust score for user {target_user_id}: {current_score} -> {new_score}")
    except Exception as e:
        logger.error(f"Error updating trust score: {str(e)}")


# ===== ROUTES =====

@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_report(
    data: ReportCreate,
    current_user = Depends(get_current_user)
):
    """
    Submit a report against another user
    
    - Validates target user exists
    - Prevents self-reporting
    - Checks for duplicate reports
    - Updates trust score (-10)
    - Triggers auto-action if needed
    """
    try:
        reporter_id = current_user["_id"]
        
        # Validate target user ID
        try:
            target_oid = ObjectId(data.targetId)
        except:
            raise HTTPException(status_code=400, detail="Invalid target user ID")
        
        # Check target user exists
        target_user = await db.users().find_one({"_id": target_oid})
        if not target_user:
            raise HTTPException(status_code=404, detail="Target user not found")
        
        # Prevent self-reporting
        if reporter_id == target_oid:
            raise HTTPException(status_code=400, detail="Cannot report yourself")
        
        # Check for duplicate report (same reporter, same target, same context, within 7 days)
        existing_report = await db.reports().find_one({
            "reporterId": reporter_id,
            "targetId": target_oid,
            "context": data.context,
            "createdAt": {"$gte": datetime.utcnow() - timedelta(days=7)}
        })
        
        if existing_report:
            raise HTTPException(
                status_code=400, 
                detail="You have already reported this user for this issue"
            )
        
        # Create report document
        report_doc = {
            "reporterId": reporter_id,
            "targetId": target_oid,
            "type": data.type,
            "reason": data.reason,
            "evidence": data.evidence,
            "context": data.context,
            "status": "pending",
            "reviewedBy": None,
            "action": None,
            "reviewNotes": None,
            "createdAt": datetime.utcnow(),
            "resolvedAt": None
        }
        
        result = await db.reports().insert_one(report_doc)
        report_id = str(result.inserted_id)
        
        # Update target user's trust score (-10)
        await update_trust_score_for_report(target_oid, decrease=10)
        
        # Check and apply automatic action if needed
        await check_and_apply_auto_action(target_oid)
        
        # Notify admin (optional - could send email to admin)
        logger.info(f"New report {report_id}: {reporter_id} reported {target_oid} for {data.type}")
        
        return {
            "message": "Report submitted successfully. Our team will review it.",
            "reportId": report_id,
            "status": "pending"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting report: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit report")


@router.get("/")
async def list_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    type_filter: Optional[str] = Query(None, alias="type"),
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
    current_user = Depends(get_current_user)
):
    """
    List reports (admin only)
    
    - Filters by status, type
    - Populates reporter and target user info
    - Sorted by creation date (newest first)
    """
    try:
        # Check admin permission
        if not await is_admin(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Build query
        query = {}
        if status_filter:
            query["status"] = status_filter
        if type_filter:
            query["type"] = type_filter
        
        # Fetch reports
        reports_cursor = db.reports().find(query).sort("createdAt", -1).skip(skip).limit(limit)
        reports = await reports_cursor.to_list(length=limit)
        
        # Get total count
        total = await db.reports().count_documents(query)
        
        # Populate user info
        enriched_reports = []
        for report in reports:
            # Get reporter info
            reporter = await db.users().find_one({"_id": report["reporterId"]})
            reporter_profile = await db.profiles().find_one({"userId": str(report["reporterId"])})
            
            # Get target info
            target = await db.users().find_one({"_id": report["targetId"]})
            target_profile = await db.profiles().find_one({"userId": str(report["targetId"])})
            
            enriched_reports.append({
                "_id": str(report["_id"]),
                "reporterId": str(report["reporterId"]),
                "reporterName": reporter.get("name", "Unknown") if reporter else "Unknown",
                "reporterEmail": reporter.get("email") if reporter else None,
                "reporterPhoto": reporter_profile.get("photos", [None])[0] if reporter_profile else None,
                "targetId": str(report["targetId"]),
                "targetName": target.get("name", "Unknown") if target else "Unknown",
                "targetEmail": target.get("email") if target else None,
                "targetPhoto": target_profile.get("photos", [None])[0] if target_profile else None,
                "targetStatus": target.get("status", "active") if target else "unknown",
                "type": report["type"],
                "reason": report["reason"],
                "evidence": report.get("evidence", []),
                "context": report.get("context", {}),
                "status": report["status"],
                "action": report.get("action"),
                "reviewNotes": report.get("reviewNotes"),
                "reviewedBy": str(report["reviewedBy"]) if report.get("reviewedBy") else None,
                "createdAt": report["createdAt"].isoformat(),
                "resolvedAt": report["resolvedAt"].isoformat() if report.get("resolvedAt") else None
            })
        
        return {
            "reports": enriched_reports,
            "total": total,
            "limit": limit,
            "skip": skip
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing reports: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch reports")


@router.get("/{reportId}")
async def get_report_detail(
    reportId: str,
    current_user = Depends(get_current_user)
):
    """
    Get detailed report information (admin only)
    
    - Full reporter and target user profiles
    - Context details (match, message, project)
    - Report history for both users
    """
    try:
        # Check admin permission
        if not await is_admin(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Validate and fetch report
        try:
            report_oid = ObjectId(reportId)
        except:
            raise HTTPException(status_code=400, detail="Invalid report ID")
        
        report = await db.reports().find_one({"_id": report_oid})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Get full user details
        reporter = await db.users().find_one({"_id": report["reporterId"]})
        reporter_profile = await db.profiles().find_one({"userId": str(report["reporterId"])})
        
        target = await db.users().find_one({"_id": report["targetId"]})
        target_profile = await db.profiles().find_one({"userId": str(report["targetId"])})
        
        # Get report history for target user
        target_report_count = await db.reports().count_documents({
            "targetId": report["targetId"],
            "status": {"$in": ["pending", "reviewing", "resolved"]}
        })
        
        # Get context details if available
        context_details = {}
        if report.get("context"):
            ctx = report["context"]
            if ctx.get("matchId"):
                match = await db.matches().find_one({"_id": ObjectId(ctx["matchId"])})
                if match:
                    context_details["match"] = {
                        "_id": str(match["_id"]),
                        "createdAt": match.get("createdAt").isoformat() if match.get("createdAt") else None
                    }
            if ctx.get("projectId"):
                project = await db.projects().find_one({"_id": ObjectId(ctx["projectId"])})
                if project:
                    context_details["project"] = {
                        "_id": str(project["_id"]),
                        "title": project.get("title"),
                        "createdAt": project.get("createdAt").isoformat() if project.get("createdAt") else None
                    }
        
        return {
            "_id": str(report["_id"]),
            "reporter": {
                "_id": str(report["reporterId"]),
                "name": reporter.get("name") if reporter else "Unknown",
                "email": reporter.get("email") if reporter else None,
                "photo": reporter_profile.get("photos", [None])[0] if reporter_profile else None,
                "trustScore": reporter_profile.get("trustScore", 50) if reporter_profile else 50
            },
            "target": {
                "_id": str(report["targetId"]),
                "name": target.get("name") if target else "Unknown",
                "email": target.get("email") if target else None,
                "photo": target_profile.get("photos", [None])[0] if target_profile else None,
                "status": target.get("status", "active") if target else "unknown",
                "trustScore": target_profile.get("trustScore", 50) if target_profile else 50,
                "reportCount": target_report_count
            },
            "type": report["type"],
            "reason": report["reason"],
            "evidence": report.get("evidence", []),
            "context": report.get("context", {}),
            "contextDetails": context_details,
            "status": report["status"],
            "action": report.get("action"),
            "reviewNotes": report.get("reviewNotes"),
            "reviewedBy": str(report["reviewedBy"]) if report.get("reviewedBy") else None,
            "createdAt": report["createdAt"].isoformat(),
            "resolvedAt": report["resolvedAt"].isoformat() if report.get("resolvedAt") else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching report detail: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch report details")


@router.post("/{reportId}/resolve")
async def resolve_report(
    reportId: str,
    data: ReportResolve,
    current_user = Depends(get_current_user)
):
    """
    Resolve a report with action (admin only)
    
    Actions:
    - warning: Send warning email to target
    - suspension: Suspend account for N days
    - ban: Permanently ban account
    - dismiss: No action (false report - reporter loses trust)
    """
    try:
        # Check admin permission
        admin_id = current_user["_id"]
        if not await is_admin(admin_id):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Validate and fetch report
        try:
            report_oid = ObjectId(reportId)
        except:
            raise HTTPException(status_code=400, detail="Invalid report ID")
        
        report = await db.reports().find_one({"_id": report_oid})
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        
        if report["status"] == "resolved":
            raise HTTPException(status_code=400, detail="Report already resolved")
        
        # Apply manual action
        await apply_manual_action(
            target_user_id=report["targetId"],
            action=data.action,
            admin_id=admin_id,
            notes=data.notes,
            suspension_days=data.suspensionDays if data.action == "suspension" else 30
        )
        
        # If dismissed (false report), penalize reporter
        if data.action == "dismiss":
            reporter_profile = await db.profiles().find_one({"userId": str(report["reporterId"])})
            if reporter_profile:
                current_score = reporter_profile.get("trustScore", 50)
                new_score = max(0, current_score - 5)  # -5 for false report
                await db.profiles().update_one(
                    {"userId": str(report["reporterId"])},
                    {"$set": {"trustScore": new_score, "updatedAt": datetime.utcnow()}}
                )
                logger.info(f"Penalized reporter {report['reporterId']} for false report: {current_score} -> {new_score}")
        else:
            # Valid report - reward reporter
            reporter_profile = await db.profiles().find_one({"userId": str(report["reporterId"])})
            if reporter_profile:
                current_score = reporter_profile.get("trustScore", 50)
                new_score = min(100, current_score + 2)  # +2 for valid report
                await db.profiles().update_one(
                    {"userId": str(report["reporterId"])},
                    {"$set": {"trustScore": new_score, "updatedAt": datetime.utcnow()}}
                )
                logger.info(f"Rewarded reporter {report['reporterId']} for valid report: {current_score} -> {new_score}")
        
        # Update report status
        await db.reports().update_one(
            {"_id": report_oid},
            {
                "$set": {
                    "status": "resolved",
                    "action": data.action,
                    "reviewNotes": data.notes,
                    "reviewedBy": admin_id,
                    "resolvedAt": datetime.utcnow()
                }
            }
        )
        
        # Send confirmation email to reporter
        reporter = await db.users().find_one({"_id": report["reporterId"]})
        if reporter:
            action_text = {
                "warning": "warned",
                "suspension": "suspended",
                "ban": "banned",
                "dismiss": "reviewed and dismissed"
            }.get(data.action, "reviewed")
            
            await send_email(
                to=reporter.get("email"),
                subject="Report Update - COLABMATCH",
                html=f"""
                <h2>Report Update</h2>
                <p>Thank you for helping keep COLABMATCH safe.</p>
                <p>Your report has been reviewed by our moderation team.</p>
                <p><strong>Action Taken:</strong> The reported user has been {action_text}.</p>
                <p>We appreciate your vigilance in maintaining our community standards.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">COLABMATCH Community Safety Team</p>
                """
            )
        
        return {
            "message": "Report resolved successfully",
            "action": data.action,
            "reportId": reportId
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error resolving report: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to resolve report")


@router.get("/user/{userId}/history")
async def get_user_report_history(
    userId: str,
    current_user = Depends(get_current_user)
):
    """
    Get user's report history (admin only)
    
    Returns:
    - Reports submitted by user (as reporter)
    - Reports against user (as target)
    - Summary statistics
    """
    try:
        # Check admin permission
        if not await is_admin(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Validate user ID
        try:
            user_oid = ObjectId(userId)
        except:
            raise HTTPException(status_code=400, detail="Invalid user ID")
        
        # Get reports submitted BY this user
        reports_by_user = await db.reports().find({"reporterId": user_oid}).to_list(length=100)
        
        # Get reports AGAINST this user
        reports_against_user = await db.reports().find({"targetId": user_oid}).to_list(length=100)
        
        # Calculate statistics
        stats = {
            "reportsSubmitted": len(reports_by_user),
            "reportsReceived": len(reports_against_user),
            "reportsReceivedPending": len([r for r in reports_against_user if r["status"] == "pending"]),
            "reportsReceivedResolved": len([r for r in reports_against_user if r["status"] == "resolved"]),
            "warningsReceived": len([r for r in reports_against_user if r.get("action") == "warning"]),
            "suspensionsReceived": len([r for r in reports_against_user if r.get("action") == "suspension"]),
            "bansReceived": len([r for r in reports_against_user if r.get("action") == "ban"])
        }
        
        return {
            "userId": userId,
            "statistics": stats,
            "reportsSubmitted": [
                {
                    "_id": str(r["_id"]),
                    "type": r["type"],
                    "status": r["status"],
                    "action": r.get("action"),
                    "createdAt": r["createdAt"].isoformat()
                }
                for r in reports_by_user
            ],
            "reportsReceived": [
                {
                    "_id": str(r["_id"]),
                    "type": r["type"],
                    "status": r["status"],
                    "action": r.get("action"),
                    "createdAt": r["createdAt"].isoformat()
                }
                for r in reports_against_user
            ]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user report history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch report history")

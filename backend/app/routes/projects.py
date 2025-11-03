"""
Projects Routes - Collaborative Projects
Handles: Project creation, discovery, applications, team management
"""
from fastapi import APIRouter, HTTPException, Depends, Query, status
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime
from bson import ObjectId
from pymongo.errors import PyMongoError
import logging

from ..config import settings
from ..auth import get_current_user
from .. import db

# Setup logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/projects", tags=["Projects"])


# ===== MODELS =====
class ProjectCreate(BaseModel):
    title: str
    description: str
    category: Literal["web", "mobile", "ai_ml", "blockchain", "iot", "game", "other"]
    skills: List[str]
    lookingFor: List[str]  # Roles needed
    duration: Optional[str] = None  # e.g., "3 months"
    commitment: Literal["full-time", "part-time", "flexible"]
    maxMembers: Optional[int] = None
    coverImage: Optional[str] = None


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["recruiting", "in_progress", "completed", "on_hold"]] = None
    lookingFor: Optional[List[str]] = None


class ApplicationRequest(BaseModel):
    role: str
    message: str


# ===== ROUTES =====

@router.post("/")
async def create_project(
    data: ProjectCreate,
    current_user = Depends(get_current_user)
):
    """
    Create a new project with comprehensive error handling
    """
    try:
        # ✅ Validate input data
        if len(data.title.strip()) < 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title must be at least 3 characters"
            )
        
        if len(data.description.strip()) < 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Description must be at least 10 characters"
            )
        
        project_doc = {
            "ownerId": current_user["_id"],
            "title": data.title.strip(),
            "description": data.description.strip(),
            "category": data.category,
            "skills": data.skills,
            "lookingFor": data.lookingFor,
            "duration": data.duration,
            "commitment": data.commitment,
            "maxMembers": data.maxMembers,
            "coverImage": data.coverImage,
            "members": [current_user["_id"]],  # Owner is first member
            "applications": [],
            "status": "recruiting",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await db.projects().insert_one(project_doc)
        
        return {
            "projectId": str(result.inserted_id),
            "message": "Project created successfully"
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in create_project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in create_project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create project"
        )


@router.get("/")
async def list_projects(
    category: Optional[str] = None,
    status: str = "recruiting",
    limit: int = Query(20, ge=1, le=100),
    current_user = Depends(get_current_user)
):
    """
    List projects with filtering and error handling
    """
    try:
        query = {}
        
        if category:
            query["category"] = category
        
        if status:
            query["status"] = status
        
        projects_cursor = db.projects().find(query).sort("createdAt", -1).limit(limit)
        projects = await projects_cursor.to_list(length=limit)
        
        # ✅ Handle empty results
        if not projects:
            return {
                "projects": [],
                "total": 0,
                "message": "No projects found matching your criteria"
            }
        
        # Populate with owner info
        projects_list = []
        for project in projects:
            try:
                owner = await db.profiles().find_one({"userId": project["ownerId"]})
                
                projects_list.append({
                    "id": str(project["_id"]),
                    "title": project["title"],
                    "description": project["description"],
                    "category": project["category"],
                    "skills": project["skills"],
                    "lookingFor": project.get("lookingFor", []),
                    "commitment": project["commitment"],
                    "membersCount": len(project.get("members", [])),
                    "maxMembers": project.get("maxMembers"),
                    "owner": {
                        "id": str(project["ownerId"]),
                        "name": owner.get("name", "Unknown User") if owner else "Unknown User",
                        "photo": owner.get("photos", [""])[0] if owner and owner.get("photos") else ""
                    },
                    "coverImage": project.get("coverImage"),
                    "status": project["status"],
                    "createdAt": project["createdAt"].isoformat()
                })
            except Exception as e:
                logger.error(f"❌ Error processing project {project.get('_id')}: {str(e)}")
                continue  # Skip this project
        
        return {
            "projects": projects_list,
            "total": len(projects_list)
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in list_projects: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in list_projects: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve projects"
        )


@router.get("/{projectId}")
async def get_project_detail(
    projectId: str,
    current_user = Depends(get_current_user)
):
    """
    Get detailed project information with error handling
    """
    try:
        # ✅ Validate projectId format
        try:
            project_oid = ObjectId(projectId)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid project ID format"
            )
        
        project = await db.projects().find_one({"_id": project_oid})
        
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project not found"
            )
        
        # Get owner profile
        owner = await db.profiles().find_one({"userId": project["ownerId"]})
        
        # Get members profiles
        members_list = []
        for user_id in project.get("members", []):
            try:
                profile = await db.profiles().find_one({"userId": user_id})
                if profile:
                    members_list.append({
                        "id": str(user_id),
                        "name": profile.get("name", "Unknown User"),
                        "photo": profile.get("photos", [""])[0] if profile.get("photos") else "",
                        "field": profile.get("field"),
                        "skills": profile.get("skills", [])
                    })
            except Exception as e:
                logger.error(f"❌ Error loading member {user_id}: {str(e)}")
                continue
        
        # Check if current user already applied
        has_applied = any(
            app["userId"] == current_user["_id"] 
            for app in project.get("applications", [])
        )
        
        is_member = current_user["_id"] in project.get("members", [])
        
        return {
            "id": str(project["_id"]),
            "title": project["title"],
            "description": project["description"],
            "category": project["category"],
            "skills": project["skills"],
            "lookingFor": project.get("lookingFor", []),
            "duration": project.get("duration"),
            "commitment": project["commitment"],
            "maxMembers": project.get("maxMembers"),
            "owner": {
                "id": str(project["ownerId"]),
                "name": owner.get("name", "Unknown User") if owner else "Unknown User",
                "photo": owner.get("photos", [""])[0] if owner and owner.get("photos") else "",
                "bio": owner.get("bio") if owner else ""
            },
            "members": members_list,
            "membersCount": len(members_list),
            "applicationsCount": len(project.get("applications", [])),
            "coverImage": project.get("coverImage"),
            "status": project["status"],
            "createdAt": project["createdAt"].isoformat(),
            "hasApplied": has_applied,
            "isMember": is_member
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in get_project_detail: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in get_project_detail: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve project details"
        )


@router.post("/{projectId}/apply")
async def apply_to_project(
    projectId: str,
    data: ApplicationRequest,
    current_user = Depends(get_current_user)
):
    """
    Apply to join a project
    """
    try:
        # Validate ObjectId format
        try:
            project_oid = ObjectId(projectId)
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid project ID format"
            )
        
        # Validate application message
        if data.message and len(data.message.strip()) > 1000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Application message too long (max 1000 characters)"
            )
        
        project = await db.projects().find_one({"_id": project_oid})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        user_id = current_user["_id"]
        
        # Check if already a member
        if user_id in project.get("members", []):
            raise HTTPException(status_code=400, detail="Already a member of this project")
        
        # Check if already applied
        applications = project.get("applications", [])
        if any(app["userId"] == user_id for app in applications):
            raise HTTPException(status_code=400, detail="Already applied to this project")
        
        # Check capacity
        max_members = project.get("maxMembers")
        if max_members and len(project.get("members", [])) >= max_members:
            raise HTTPException(status_code=400, detail="Project team is full")
        
        # Add application
        application = {
            "userId": user_id,
            "role": data.role,
            "message": data.message.strip() if data.message else "",
            "status": "pending",
            "appliedAt": datetime.utcnow()
        }
        
        await db.projects().update_one(
            {"_id": project_oid},
            {"$push": {"applications": application}}
        )
        
        logger.info(f"✅ User {user_id} applied to project {projectId}")
        
        return {
            "message": "Application submitted successfully",
            "status": "pending"
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in apply_to_project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in apply_to_project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit application"
        )


@router.post("/{projectId}/applications/{userId}/review")
async def review_application(
    projectId: str,
    userId: str,
    action: Literal["accept", "reject"],
    current_user = Depends(get_current_user)
):
    """
    Review a project application (owner only)
    """
    try:
        # Validate ObjectId formats
        try:
            project_oid = ObjectId(projectId)
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid project ID format"
            )
        
        try:
            applicant_id = ObjectId(userId)
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid user ID format"
            )
        
        project = await db.projects().find_one({"_id": project_oid})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if user is owner
        if project["ownerId"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Only project owner can review applications")
        
        # Find application
        applications = project.get("applications", [])
        application = next(
            (app for app in applications if app["userId"] == applicant_id),
            None
        )
        
        if not application:
            raise HTTPException(status_code=404, detail="Application not found")
        
        if action == "accept":
            # Add to members
            await db.projects().update_one(
                {"_id": project_oid},
                {
                    "$push": {"members": applicant_id},
                    "$pull": {"applications": {"userId": applicant_id}}
                }
            )
            
            logger.info(f"✅ Application accepted for project {projectId}, user {userId}")
            return {"message": "Application accepted", "userId": userId}
        
        else:  # reject
            # Remove application
            await db.projects().update_one(
                {"_id": project_oid},
                {"$pull": {"applications": {"userId": applicant_id}}}
            )
            
            logger.info(f"✅ Application rejected for project {projectId}, user {userId}")
            return {"message": "Application rejected", "userId": userId}
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in review_application: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in review_application: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to review application"
        )


@router.get("/my/owned")
async def my_owned_projects(
    current_user = Depends(get_current_user)
):
    """
    Get projects owned by current user
    """
    try:
        projects_cursor = db.projects().find(
            {"ownerId": current_user["_id"]}
        ).sort("createdAt", -1)
        
        projects = await projects_cursor.to_list(length=50)
        
        if not projects:
            return {
                "projects": [],
                "total": 0,
                "message": "You haven't created any projects yet"
            }
        
        projects_list = []
        for project in projects:
            try:
                projects_list.append({
                    "id": str(project["_id"]),
                    "title": project.get("title", "Untitled Project"),
                    "category": project.get("category", "Other"),
                    "status": project.get("status", "active"),
                    "membersCount": len(project.get("members", [])),
                    "applicationsCount": len(project.get("applications", [])),
                    "createdAt": project["createdAt"].isoformat() if "createdAt" in project else None
                })
            except Exception as e:
                logger.error(f"❌ Error processing owned project {project.get('_id')}: {str(e)}")
                continue  # Skip corrupted project
        
        return {
            "projects": projects_list,
            "total": len(projects_list)
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in my_owned_projects: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in my_owned_projects: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve owned projects"
        )


@router.get("/my/joined")
async def my_joined_projects(
    current_user = Depends(get_current_user)
):
    """
    Get projects current user is a member of
    """
    try:
        user_id = current_user["_id"]
        
        projects_cursor = db.projects().find({
            "members": user_id,
            "ownerId": {"$ne": user_id}  # Exclude owned projects
        }).sort("createdAt", -1)
        
        projects = await projects_cursor.to_list(length=50)
        
        if not projects:
            return {
                "projects": [],
                "total": 0,
                "message": "You haven't joined any projects yet"
            }
        
        projects_list = []
        for project in projects:
            try:
                owner = await db.profiles().find_one({"userId": project["ownerId"]})
                
                projects_list.append({
                    "id": str(project["_id"]),
                    "title": project.get("title", "Untitled Project"),
                    "category": project.get("category", "Other"),
                    "status": project.get("status", "active"),
                    "owner": {
                        "name": owner.get("name") if owner else "Unknown User"
                    },
                    "membersCount": len(project.get("members", []))
                })
            except Exception as e:
                logger.error(f"❌ Error processing joined project {project.get('_id')}: {str(e)}")
                continue  # Skip corrupted project
        
        return {
            "projects": projects_list,
            "total": len(projects_list)
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in my_joined_projects: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in my_joined_projects: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve joined projects"
        )


@router.put("/{projectId}")
async def update_project(
    projectId: str,
    data: ProjectUpdate,
    current_user = Depends(get_current_user)
):
    """
    Update project details (owner only)
    """
    try:
        # Validate ObjectId format
        try:
            project_oid = ObjectId(projectId)
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid project ID format"
            )
        
        project = await db.projects().find_one({"_id": project_oid})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if user is owner
        if project["ownerId"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Only owner can update project")
        
        # Build update dict with validation
        update_data = {}
        
        if data.title is not None:
            if len(data.title.strip()) < 3:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Title must be at least 3 characters"
                )
            update_data["title"] = data.title.strip()
        
        if data.description is not None:
            if len(data.description.strip()) < 10:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Description must be at least 10 characters"
                )
            update_data["description"] = data.description.strip()
        
        # Add other fields without validation
        for field in ["category", "status", "maxMembers", "requiredSkills"]:
            value = getattr(data, field, None)
            if value is not None:
                update_data[field] = value
        
        update_data["updatedAt"] = datetime.utcnow()
        
        if len(update_data) > 1:  # More than just updatedAt
            await db.projects().update_one(
                {"_id": project_oid},
                {"$set": update_data}
            )
            logger.info(f"✅ Project {projectId} updated successfully")
        
        return {"message": "Project updated successfully"}
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in update_project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in update_project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update project"
        )


@router.delete("/{projectId}")
async def delete_project(
    projectId: str,
    current_user = Depends(get_current_user)
):
    """
    Delete a project (owner only)
    """
    try:
        # Validate ObjectId format
        try:
            project_oid = ObjectId(projectId)
        except:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid project ID format"
            )
        
        project = await db.projects().find_one({"_id": project_oid})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if user is owner
        if project["ownerId"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Only owner can delete project")
        
        await db.projects().delete_one({"_id": project_oid})
        
        logger.info(f"✅ Project {projectId} deleted successfully")
        
        return {"message": "Project deleted successfully"}
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"❌ Database error in delete_project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable"
        )
    except Exception as e:
        logger.error(f"❌ Unexpected error in delete_project: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete project"
        )

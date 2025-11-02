"""
Projects Routes - Collaborative Projects
Handles: Project creation, discovery, applications, team management
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime
from bson import ObjectId

from ..config import settings
from ..auth import get_current_user
from .. import db

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
    Create a new project
    """
    try:
        project_doc = {
            "ownerId": current_user["_id"],
            "title": data.title,
            "description": data.description,
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
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_projects(
    category: Optional[str] = None,
    status: str = "recruiting",
    limit: int = Query(20, le=100),
    current_user = Depends(get_current_user)
):
    """
    List projects with filtering
    """
    try:
        query = {}
        
        if category:
            query["category"] = category
        
        if status:
            query["status"] = status
        
        projects_cursor = db.projects().find(query).sort("createdAt", -1).limit(limit)
        projects = await projects_cursor.to_list(length=limit)
        
        # Populate with owner info
        projects_list = []
        for project in projects:
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
                    "name": owner.get("name") if owner else "Unknown",
                    "photo": owner.get("photos", [""])[0] if owner and owner.get("photos") else ""
                },
                "coverImage": project.get("coverImage"),
                "status": project["status"],
                "createdAt": project["createdAt"].isoformat()
            })
        
        return {
            "projects": projects_list,
            "total": len(projects_list)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{projectId}")
async def get_project_detail(
    projectId: str,
    current_user = Depends(get_current_user)
):
    """
    Get detailed project information
    """
    try:
        project = await db.projects().find_one({"_id": ObjectId(projectId)})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get owner profile
        owner = await db.profiles().find_one({"userId": project["ownerId"]})
        
        # Get members profiles
        members_list = []
        for user_id in project.get("members", []):
            profile = await db.profiles().find_one({"userId": user_id})
            if profile:
                members_list.append({
                    "id": str(user_id),
                    "name": profile.get("name"),
                    "photo": profile.get("photos", [""])[0] if profile.get("photos") else "",
                    "field": profile.get("field"),
                    "skills": profile.get("skills", [])
                })
        
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
                "name": owner.get("name") if owner else "Unknown",
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
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        project = await db.projects().find_one({"_id": ObjectId(projectId)})
        
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
            "message": data.message,
            "status": "pending",
            "appliedAt": datetime.utcnow()
        }
        
        await db.projects().update_one(
            {"_id": ObjectId(projectId)},
            {"$push": {"applications": application}}
        )
        
        return {
            "message": "Application submitted successfully",
            "status": "pending"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        project = await db.projects().find_one({"_id": ObjectId(projectId)})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if user is owner
        if project["ownerId"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Only project owner can review applications")
        
        applicant_id = ObjectId(userId)
        
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
                {"_id": ObjectId(projectId)},
                {
                    "$push": {"members": applicant_id},
                    "$pull": {"applications": {"userId": applicant_id}}
                }
            )
            
            return {"message": "Application accepted", "userId": userId}
        
        else:  # reject
            # Remove application
            await db.projects().update_one(
                {"_id": ObjectId(projectId)},
                {"$pull": {"applications": {"userId": applicant_id}}}
            )
            
            return {"message": "Application rejected", "userId": userId}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        
        projects_list = [{
            "id": str(project["_id"]),
            "title": project["title"],
            "category": project["category"],
            "status": project["status"],
            "membersCount": len(project.get("members", [])),
            "applicationsCount": len(project.get("applications", [])),
            "createdAt": project["createdAt"].isoformat()
        } for project in projects]
        
        return {
            "projects": projects_list,
            "total": len(projects_list)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        
        projects_list = []
        for project in projects:
            owner = await db.profiles().find_one({"userId": project["ownerId"]})
            
            projects_list.append({
                "id": str(project["_id"]),
                "title": project["title"],
                "category": project["category"],
                "status": project["status"],
                "owner": {
                    "name": owner.get("name") if owner else "Unknown"
                },
                "membersCount": len(project.get("members", []))
            })
        
        return {
            "projects": projects_list,
            "total": len(projects_list)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


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
        project = await db.projects().find_one({"_id": ObjectId(projectId)})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if user is owner
        if project["ownerId"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Only owner can update project")
        
        # Build update dict
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        update_data["updatedAt"] = datetime.utcnow()
        
        if update_data:
            await db.projects().update_one(
                {"_id": ObjectId(projectId)},
                {"$set": update_data}
            )
        
        return {"message": "Project updated successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{projectId}")
async def delete_project(
    projectId: str,
    current_user = Depends(get_current_user)
):
    """
    Delete a project (owner only)
    """
    try:
        project = await db.projects().find_one({"_id": ObjectId(projectId)})
        
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Check if user is owner
        if project["ownerId"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Only owner can delete project")
        
        await db.projects().delete_one({"_id": ObjectId(projectId)})
        
        return {"message": "Project deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

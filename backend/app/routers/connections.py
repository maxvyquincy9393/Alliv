"""
Connection Hub API Routes
Manages user connections, networking, and collaboration history
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from ..auth import get_current_user
from ..db import get_db
from ..integrations.metrics import track_event

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/connections", tags=["Connection Hub"])


# ===== MODELS =====
class ConnectionResponse(BaseModel):
    id: str = Field(alias="_id")
    user: Dict[str, Any]
    connection_type: str
    status: str
    connected_at: datetime
    last_interaction: Optional[datetime] = None
    collaboration_count: int = 0
    mutual_connections: int = 0
    shared_projects: List[Dict[str, Any]] = []
    interaction_score: float = 0.0
    tags: List[str] = []
    notes: Optional[str] = None

    class Config:
        populate_by_name = True


class ConnectionCreate(BaseModel):
    user_id: str
    connection_type: Literal["colleague", "collaborator", "mentor", "mentee", "friend", "professional"] = "professional"
    notes: Optional[str] = None
    tags: List[str] = Field(default=[], max_items=5)


class ConnectionUpdate(BaseModel):
    connection_type: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[Literal["active", "inactive", "blocked"]] = None


class ConnectionStats(BaseModel):
    total_connections: int
    active_connections: int
    new_this_month: int
    by_type: Dict[str, int]
    by_field: Dict[str, int]
    top_collaborators: List[Dict[str, Any]]
    connection_growth: List[Dict[str, Any]]  # Monthly growth data


class MutualConnection(BaseModel):
    user: Dict[str, Any]
    mutual_count: int
    mutual_users: List[Dict[str, Any]]
    connection_strength: float


class NetworkInsight(BaseModel):
    network_size: int
    network_diversity: float  # How diverse the network is across fields
    influence_score: float  # Based on connections' connections
    collaboration_rate: float  # % of connections that led to projects
    recommendations: List[str]
    growth_opportunities: List[str]


# ===== HELPER FUNCTIONS =====
async def calculate_interaction_score(user_id: str, connection_id: str, db) -> float:
    """Calculate interaction score based on messages, projects, etc."""
    score = 0.0
    
    # Messages exchanged
    messages_collection = db.messages
    message_count = await messages_collection.count_documents({
        "$or": [
            {"sender": user_id, "recipient": connection_id},
            {"sender": connection_id, "recipient": user_id}
        ]
    })
    score += min(message_count * 0.1, 3.0)  # Max 3 points from messages
    
    # Shared projects
    projects_collection = db.projects
    shared_projects = await projects_collection.count_documents({
        "team_members": {"$all": [user_id, connection_id]}
    })
    score += shared_projects * 2.0  # 2 points per shared project
    
    # Recent activity (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    recent_messages = await messages_collection.count_documents({
        "$or": [
            {"sender": user_id, "recipient": connection_id},
            {"sender": connection_id, "recipient": user_id}
        ],
        "timestamp": {"$gte": thirty_days_ago}
    })
    score += recent_messages * 0.2  # Bonus for recent activity
    
    return min(score, 10.0)  # Cap at 10


async def get_mutual_connections(user_id: str, connection_id: str, db) -> List[str]:
    """Get mutual connections between two users"""
    connections_collection = db.connections
    
    # Get user's connections
    user_connections = await connections_collection.find({
        "user_id": user_id,
        "status": "active"
    }).to_list(length=None)
    user_connection_ids = [conn["connected_user_id"] for conn in user_connections]
    
    # Get connection's connections
    connection_connections = await connections_collection.find({
        "user_id": connection_id,
        "status": "active"
    }).to_list(length=None)
    connection_connection_ids = [conn["connected_user_id"] for conn in connection_connections]
    
    # Find mutual connections
    mutual_ids = set(user_connection_ids).intersection(set(connection_connection_ids))
    return list(mutual_ids)


async def get_shared_projects(user_id: str, connection_id: str, db) -> List[Dict[str, Any]]:
    """Get projects that both users have worked on"""
    projects_collection = db.projects
    
    shared_projects = await projects_collection.find({
        "team_members": {"$all": [user_id, connection_id]}
    }).to_list(length=10)  # Limit to 10 most recent
    
    return [
        {
            "id": str(project["_id"]),
            "name": project["name"],
            "status": project.get("status", "unknown"),
            "created_at": project.get("created_at"),
            "role_user": project.get("team_roles", {}).get(user_id, "Member"),
            "role_connection": project.get("team_roles", {}).get(connection_id, "Member")
        }
        for project in shared_projects
    ]


# ===== ENDPOINTS =====
@router.get("/", response_model=List[ConnectionResponse])
async def get_connections(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    filter_type: Optional[str] = Query(None, regex="^(active|inactive|all|recent)$"),
    connection_type: Optional[str] = Query(None),
    field: Optional[str] = Query(None, description="Filter by professional field"),
    search: Optional[str] = Query(None, description="Search by name or skills"),
    sort_by: str = Query("recent", regex="^(recent|name|interaction|mutual)$"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get user's connections with filtering and sorting options
    """
    try:
        db = await get_db()
        connections_collection = db.connections
        users_collection = db.users
        user_id = str(current_user["_id"])
        
        # Build query
        query = {"user_id": user_id}
        
        if filter_type and filter_type != "all":
            if filter_type == "recent":
                week_ago = datetime.utcnow() - timedelta(days=7)
                query["connected_at"] = {"$gte": week_ago}
            else:
                query["status"] = filter_type
        
        if connection_type:
            query["connection_type"] = connection_type
        
        # Get connections
        sort_field = "connected_at"
        sort_direction = -1
        
        if sort_by == "name":
            sort_field = "user.name"
            sort_direction = 1
        elif sort_by == "interaction":
            sort_field = "interaction_score"
            sort_direction = -1
        elif sort_by == "mutual":
            sort_field = "mutual_connections"
            sort_direction = -1
        
        connections_cursor = connections_collection.find(query).sort(sort_field, sort_direction).skip(offset).limit(limit)
        connections = await connections_cursor.to_list(length=limit)
        
        # Enrich connections with user data
        enriched_connections = []
        for conn in connections:
            # Get connected user details
            connected_user = await users_collection.find_one({"_id": ObjectId(conn["connected_user_id"])})
            if not connected_user:
                continue
            
            # Apply field filter
            if field and connected_user.get("field") != field:
                continue
            
            # Apply search filter
            if search:
                search_text = f"{connected_user.get('name', '')} {' '.join(connected_user.get('skills', []))}".lower()
                if search.lower() not in search_text:
                    continue
            
            # Calculate interaction score
            interaction_score = await calculate_interaction_score(user_id, conn["connected_user_id"], db)
            
            # Get mutual connections count
            mutual_connections = await get_mutual_connections(user_id, conn["connected_user_id"], db)
            
            # Get shared projects
            shared_projects = await get_shared_projects(user_id, conn["connected_user_id"], db)
            
            # Prepare user data (sanitized)
            user_data = {
                "id": str(connected_user["_id"]),
                "name": connected_user["name"],
                "avatar": connected_user.get("profile_photo_url", ""),
                "role": connected_user.get("role", ""),
                "field": connected_user.get("field", ""),
                "location": connected_user.get("location_city", ""),
                "skills": connected_user.get("skills", [])[:5],  # Top 5 skills
                "verified": connected_user.get("identity_verified", False),
                "last_active": connected_user.get("last_active")
            }
            
            enriched_conn = ConnectionResponse(
                _id=str(conn["_id"]),
                user=user_data,
                connection_type=conn["connection_type"],
                status=conn["status"],
                connected_at=conn["connected_at"],
                last_interaction=conn.get("last_interaction"),
                collaboration_count=len(shared_projects),
                mutual_connections=len(mutual_connections),
                shared_projects=shared_projects,
                interaction_score=interaction_score,
                tags=conn.get("tags", []),
                notes=conn.get("notes")
            )
            
            enriched_connections.append(enriched_conn)
        
        # Track analytics
        track_event("connections_viewed", {
            "user_id": user_id,
            "filter_type": filter_type,
            "connection_count": len(enriched_connections)
        })
        
        return enriched_connections
        
    except Exception as e:
        logger.error(f"Error fetching connections: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch connections")


@router.post("/", response_model=ConnectionResponse)
async def create_connection(
    connection_data: ConnectionCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a new connection
    """
    try:
        db = await get_db()
        connections_collection = db.connections
        users_collection = db.users
        user_id = str(current_user["_id"])
        
        # Validate target user exists
        target_user = await users_collection.find_one({"_id": ObjectId(connection_data.user_id)})
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Check if connection already exists
        existing = await connections_collection.find_one({
            "user_id": user_id,
            "connected_user_id": connection_data.user_id
        })
        if existing:
            raise HTTPException(status_code=400, detail="Connection already exists")
        
        # Create connection document
        connection_doc = {
            "user_id": user_id,
            "connected_user_id": connection_data.user_id,
            "connection_type": connection_data.connection_type,
            "status": "active",
            "connected_at": datetime.utcnow(),
            "last_interaction": None,
            "tags": connection_data.tags,
            "notes": connection_data.notes
        }
        
        result = await connections_collection.insert_one(connection_doc)
        
        # Create reciprocal connection
        reciprocal_doc = {
            "user_id": connection_data.user_id,
            "connected_user_id": user_id,
            "connection_type": connection_data.connection_type,
            "status": "active",
            "connected_at": datetime.utcnow(),
            "last_interaction": None,
            "tags": [],
            "notes": f"Connected via {current_user['name']}"
        }
        await connections_collection.insert_one(reciprocal_doc)
        
        # Prepare response
        user_data = {
            "id": str(target_user["_id"]),
            "name": target_user["name"],
            "avatar": target_user.get("profile_photo_url", ""),
            "role": target_user.get("role", ""),
            "field": target_user.get("field", ""),
            "location": target_user.get("location_city", ""),
            "skills": target_user.get("skills", [])[:5],
            "verified": target_user.get("identity_verified", False),
            "last_active": target_user.get("last_active")
        }
        
        response = ConnectionResponse(
            _id=str(result.inserted_id),
            user=user_data,
            connection_type=connection_data.connection_type,
            status="active",
            connected_at=connection_doc["connected_at"],
            last_interaction=None,
            collaboration_count=0,
            mutual_connections=0,
            shared_projects=[],
            interaction_score=0.0,
            tags=connection_data.tags,
            notes=connection_data.notes
        )
        
        # Track analytics
        track_event("connection_created", {
            "user_id": user_id,
            "connected_user_id": connection_data.user_id,
            "connection_type": connection_data.connection_type
        })
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating connection: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create connection")


@router.patch("/{connection_id}", response_model=ConnectionResponse)
async def update_connection(
    connection_id: str,
    update_data: ConnectionUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update an existing connection
    """
    try:
        db = await get_db()
        connections_collection = db.connections
        users_collection = db.users
        user_id = str(current_user["_id"])
        
        # Check if connection exists and belongs to user
        connection = await connections_collection.find_one({
            "_id": ObjectId(connection_id),
            "user_id": user_id
        })
        if not connection:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        # Prepare update
        update_fields = {"updated_at": datetime.utcnow()}
        if update_data.connection_type is not None:
            update_fields["connection_type"] = update_data.connection_type
        if update_data.notes is not None:
            update_fields["notes"] = update_data.notes
        if update_data.tags is not None:
            update_fields["tags"] = update_data.tags
        if update_data.status is not None:
            update_fields["status"] = update_data.status
        
        # Update connection
        await connections_collection.update_one(
            {"_id": ObjectId(connection_id)},
            {"$set": update_fields}
        )
        
        # Get updated connection with user data
        updated_connection = await connections_collection.find_one({"_id": ObjectId(connection_id)})
        connected_user = await users_collection.find_one({"_id": ObjectId(updated_connection["connected_user_id"])})
        
        # Prepare response
        user_data = {
            "id": str(connected_user["_id"]),
            "name": connected_user["name"],
            "avatar": connected_user.get("profile_photo_url", ""),
            "role": connected_user.get("role", ""),
            "field": connected_user.get("field", ""),
            "location": connected_user.get("location_city", ""),
            "skills": connected_user.get("skills", [])[:5],
            "verified": connected_user.get("identity_verified", False),
            "last_active": connected_user.get("last_active")
        }
        
        # Calculate additional data
        interaction_score = await calculate_interaction_score(user_id, updated_connection["connected_user_id"], db)
        mutual_connections = await get_mutual_connections(user_id, updated_connection["connected_user_id"], db)
        shared_projects = await get_shared_projects(user_id, updated_connection["connected_user_id"], db)
        
        response = ConnectionResponse(
            _id=str(updated_connection["_id"]),
            user=user_data,
            connection_type=updated_connection["connection_type"],
            status=updated_connection["status"],
            connected_at=updated_connection["connected_at"],
            last_interaction=updated_connection.get("last_interaction"),
            collaboration_count=len(shared_projects),
            mutual_connections=len(mutual_connections),
            shared_projects=shared_projects,
            interaction_score=interaction_score,
            tags=updated_connection.get("tags", []),
            notes=updated_connection.get("notes")
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating connection: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update connection")


@router.delete("/{connection_id}")
async def delete_connection(
    connection_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete a connection
    """
    try:
        db = await get_db()
        connections_collection = db.connections
        user_id = str(current_user["_id"])
        
        # Check if connection exists and belongs to user
        connection = await connections_collection.find_one({
            "_id": ObjectId(connection_id),
            "user_id": user_id
        })
        if not connection:
            raise HTTPException(status_code=404, detail="Connection not found")
        
        connected_user_id = connection["connected_user_id"]
        
        # Delete both directions of the connection
        await connections_collection.delete_one({"_id": ObjectId(connection_id)})
        await connections_collection.delete_one({
            "user_id": connected_user_id,
            "connected_user_id": user_id
        })
        
        # Track analytics
        track_event("connection_deleted", {
            "user_id": user_id,
            "connected_user_id": connected_user_id
        })
        
        return {"message": "Connection deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting connection: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete connection")


@router.get("/stats", response_model=ConnectionStats)
async def get_connection_stats(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get connection statistics and analytics
    """
    try:
        db = await get_db()
        connections_collection = db.connections
        users_collection = db.users
        user_id = str(current_user["_id"])
        
        # Total connections
        total_connections = await connections_collection.count_documents({"user_id": user_id})
        
        # Active connections
        active_connections = await connections_collection.count_documents({
            "user_id": user_id,
            "status": "active"
        })
        
        # New connections this month
        month_ago = datetime.utcnow() - timedelta(days=30)
        new_this_month = await connections_collection.count_documents({
            "user_id": user_id,
            "connected_at": {"$gte": month_ago}
        })
        
        # Connections by type
        type_pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {"_id": "$connection_type", "count": {"$sum": 1}}}
        ]
        type_results = await connections_collection.aggregate(type_pipeline).to_list(length=None)
        by_type = {item["_id"]: item["count"] for item in type_results}
        
        # Connections by field (need to join with users)
        field_pipeline = [
            {"$match": {"user_id": user_id}},
            {"$lookup": {
                "from": "users",
                "localField": "connected_user_id",
                "foreignField": "_id",
                "as": "user_data"
            }},
            {"$unwind": "$user_data"},
            {"$group": {"_id": "$user_data.field", "count": {"$sum": 1}}}
        ]
        field_results = await connections_collection.aggregate(field_pipeline).to_list(length=None)
        by_field = {item["_id"]: item["count"] for item in field_results}
        
        # Top collaborators (by interaction score)
        top_collaborators = []
        connections = await connections_collection.find({
            "user_id": user_id,
            "status": "active"
        }).limit(10).to_list(length=10)
        
        for conn in connections:
            interaction_score = await calculate_interaction_score(user_id, conn["connected_user_id"], db)
            if interaction_score > 0:
                user_data = await users_collection.find_one({"_id": ObjectId(conn["connected_user_id"])})
                if user_data:
                    top_collaborators.append({
                        "user": {
                            "id": str(user_data["_id"]),
                            "name": user_data["name"],
                            "avatar": user_data.get("profile_photo_url", ""),
                            "role": user_data.get("role", "")
                        },
                        "interaction_score": interaction_score,
                        "connection_type": conn["connection_type"]
                    })
        
        top_collaborators.sort(key=lambda x: x["interaction_score"], reverse=True)
        top_collaborators = top_collaborators[:5]
        
        # Connection growth (last 6 months)
        growth_data = []
        for i in range(6):
            start_date = datetime.utcnow() - timedelta(days=30 * (i + 1))
            end_date = datetime.utcnow() - timedelta(days=30 * i)
            
            count = await connections_collection.count_documents({
                "user_id": user_id,
                "connected_at": {"$gte": start_date, "$lt": end_date}
            })
            
            growth_data.append({
                "month": start_date.strftime("%Y-%m"),
                "connections": count
            })
        
        growth_data.reverse()  # Oldest to newest
        
        stats = ConnectionStats(
            total_connections=total_connections,
            active_connections=active_connections,
            new_this_month=new_this_month,
            by_type=by_type,
            by_field=by_field,
            top_collaborators=top_collaborators,
            connection_growth=growth_data
        )
        
        return stats
        
    except Exception as e:
        logger.error(f"Error fetching connection stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch connection stats")


@router.get("/mutual/{user_id}", response_model=MutualConnection)
async def get_mutual_connections_with_user(
    user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get mutual connections with a specific user
    """
    try:
        db = await get_db()
        connections_collection = db.connections
        users_collection = db.users
        current_user_id = str(current_user["_id"])
        
        # Get mutual connection IDs
        mutual_ids = await get_mutual_connections(current_user_id, user_id, db)
        
        # Get user details for mutual connections
        mutual_users = []
        if mutual_ids:
            mutual_users_data = await users_collection.find({
                "_id": {"$in": [ObjectId(uid) for uid in mutual_ids]}
            }).to_list(length=None)
            
            mutual_users = [
                {
                    "id": str(user["_id"]),
                    "name": user["name"],
                    "avatar": user.get("profile_photo_url", ""),
                    "role": user.get("role", ""),
                    "field": user.get("field", "")
                }
                for user in mutual_users_data
            ]
        
        # Get target user data
        target_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        target_user_data = {
            "id": str(target_user["_id"]),
            "name": target_user["name"],
            "avatar": target_user.get("profile_photo_url", ""),
            "role": target_user.get("role", ""),
            "field": target_user.get("field", "")
        }
        
        # Calculate connection strength based on mutual connections and other factors
        connection_strength = min(len(mutual_ids) / 10, 1.0)  # Normalize to 0-1
        
        response = MutualConnection(
            user=target_user_data,
            mutual_count=len(mutual_ids),
            mutual_users=mutual_users,
            connection_strength=connection_strength
        )
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching mutual connections: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch mutual connections")


@router.get("/export")
async def export_connections(
    format: str = Query("csv", regex="^(csv|json)$"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Export connections data in CSV or JSON format
    """
    try:
        db = await get_db()
        connections_collection = db.connections
        users_collection = db.users
        user_id = str(current_user["_id"])
        
        # Get all connections
        connections = await connections_collection.find({"user_id": user_id}).to_list(length=None)
        
        export_data = []
        for conn in connections:
            # Get connected user data
            connected_user = await users_collection.find_one({"_id": ObjectId(conn["connected_user_id"])})
            if connected_user:
                export_data.append({
                    "name": connected_user["name"],
                    "email": connected_user.get("email", ""),
                    "role": connected_user.get("role", ""),
                    "field": connected_user.get("field", ""),
                    "location": connected_user.get("location_city", ""),
                    "connection_type": conn["connection_type"],
                    "connected_at": conn["connected_at"].isoformat(),
                    "status": conn["status"],
                    "tags": ", ".join(conn.get("tags", [])),
                    "notes": conn.get("notes", "")
                })
        
        if format == "csv":
            import csv
            import io
            
            output = io.StringIO()
            if export_data:
                writer = csv.DictWriter(output, fieldnames=export_data[0].keys())
                writer.writeheader()
                writer.writerows(export_data)
            
            from fastapi.responses import Response
            return Response(
                content=output.getvalue(),
                media_type="text/csv",
                headers={"Content-Disposition": "attachment; filename=connections.csv"}
            )
        else:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                content=export_data,
                headers={"Content-Disposition": "attachment; filename=connections.json"}
            )
        
    except Exception as e:
        logger.error(f"Error exporting connections: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to export connections")





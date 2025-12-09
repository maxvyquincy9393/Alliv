"""
Community Feed API Routes
Handles feed posts, filtering, and engagement
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from ..auth import get_current_user
from ..db import get_db
from ..integrations.metrics import track_event

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/feed", tags=["Community Feed"])


# ===== MODELS =====
class PostCreate(BaseModel):
    type: Literal["update", "talent-request", "event", "showcase", "milestone", "opportunity"]
    content: Dict[str, Any]  # Flexible content structure
    visibility: Literal["public", "connections", "project", "private"] = "public"
    project_id: Optional[str] = None
    tags: List[str] = Field(default=[], max_items=10)
    media_urls: List[str] = Field(default=[], max_items=5)


class PostUpdate(BaseModel):
    content: Optional[Dict[str, Any]] = None
    visibility: Optional[str] = None
    tags: Optional[List[str]] = None


class PostResponse(BaseModel):
    id: str = Field(alias="_id")
    type: str
    author: Dict[str, Any]
    content: Dict[str, Any]
    project: Optional[Dict[str, Any]] = None
    engagement: Dict[str, int]
    user_engagement: Dict[str, bool]
    timestamp: datetime
    visibility: str
    tags: List[str]
    media_urls: List[str]

    class Config:
        populate_by_name = True


class EngagementAction(BaseModel):
    action: Literal["like", "unlike", "bookmark", "unbookmark", "share"]


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)
    parent_id: Optional[str] = None  # For reply threads


class CommentResponse(BaseModel):
    id: str = Field(alias="_id")
    post_id: str
    author: Dict[str, Any]
    content: str
    parent_id: Optional[str] = None
    replies: List["CommentResponse"] = []
    likes: int = 0
    user_liked: bool = False
    timestamp: datetime

    class Config:
        populate_by_name = True


# ===== ENDPOINTS =====
@router.get("/", response_model=List[PostResponse])
async def get_feed(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    filter_type: Optional[str] = Query(None, regex="^(all|following|trending|industry)$"),
    industry: Optional[str] = Query(None),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get community feed with filtering and pagination
    """
    try:
        db = get_db()
        posts_collection = db.posts
        
        # Build query
        query = {"visibility": {"$in": ["public", "connections"]}}
        
        # Apply filters
        if filter_type == "following":
            # Get user's connections
            connections = current_user.get("connections", [])
            query["author.id"] = {"$in": connections + [str(current_user["_id"])]}
        
        elif filter_type == "industry" and industry:
            query["$or"] = [
                {"author.field": industry},
                {"project.industry": industry},
                {"tags": {"$in": [industry.lower()]}}
            ]
        
        elif filter_type == "trending":
            # Posts with high engagement in last 24h
            yesterday = datetime.utcnow() - timedelta(days=1)
            query["timestamp"] = {"$gte": yesterday}
        
        # Tag filtering
        if tags:
            tag_list = [tag.strip().lower() for tag in tags.split(",")]
            query["tags"] = {"$in": tag_list}
        
        # Get posts with pagination
        cursor = posts_collection.find(query).sort("timestamp", -1).skip(offset).limit(limit)
        posts = await cursor.to_list(length=limit)
        
        # Enrich posts with user engagement data
        user_id = str(current_user["_id"])
        for post in posts:
            post["_id"] = str(post["_id"])
            
            # Get user's engagement with this post
            post["user_engagement"] = {
                "liked": user_id in post.get("likes", []),
                "bookmarked": user_id in post.get("bookmarks", []),
                "shared": user_id in post.get("shares", [])
            }
            
            # Calculate engagement metrics
            post["engagement"] = {
                "likes": len(post.get("likes", [])),
                "comments": post.get("comment_count", 0),
                "shares": len(post.get("shares", [])),
                "views": post.get("view_count", 0),
                "bookmarks": len(post.get("bookmarks", []))
            }
        
        # Track analytics
        track_event("feed_viewed", {
            "user_id": user_id,
            "filter_type": filter_type,
            "post_count": len(posts)
        })
        
        return posts
        
    except Exception as e:
        logger.error(f"Error fetching feed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch feed")


@router.post("/", response_model=PostResponse)
async def create_post(
    post_data: PostCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a new feed post
    """
    try:
        db = get_db()
        posts_collection = db.posts
        
        # Prepare post document
        post_doc = {
            "type": post_data.type,
            "author": {
                "id": str(current_user["_id"]),
                "name": current_user["name"],
                "avatar": current_user.get("profile_photo_url", ""),
                "role": current_user.get("role", ""),
                "field": current_user.get("field", ""),
                "verified": current_user.get("identity_verified", False)
            },
            "content": post_data.content,
            "visibility": post_data.visibility,
            "tags": [tag.lower().strip() for tag in post_data.tags],
            "media_urls": post_data.media_urls,
            "timestamp": datetime.utcnow(),
            "likes": [],
            "bookmarks": [],
            "shares": [],
            "view_count": 0,
            "comment_count": 0
        }
        
        # Add project info if provided
        if post_data.project_id:
            projects_collection = db.projects
            project = await projects_collection.find_one({"_id": ObjectId(post_data.project_id)})
            if project:
                post_doc["project"] = {
                    "id": str(project["_id"]),
                    "name": project["name"],
                    "industry": project.get("industry", ""),
                    "logo": project.get("logo_url", "")
                }
        
        # Insert post
        result = await posts_collection.insert_one(post_doc)
        post_doc["_id"] = str(result.inserted_id)
        
        # Prepare response
        post_doc["user_engagement"] = {
            "liked": False,
            "bookmarked": False,
            "shared": False
        }
        post_doc["engagement"] = {
            "likes": 0,
            "comments": 0,
            "shares": 0,
            "views": 0,
            "bookmarks": 0
        }
        
        # Track analytics
        track_event("post_created", {
            "user_id": str(current_user["_id"]),
            "post_type": post_data.type,
            "post_id": str(result.inserted_id)
        })
        
        return post_doc
        
    except Exception as e:
        logger.error(f"Error creating post: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create post")


@router.patch("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    update_data: PostUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update an existing post (author only)
    """
    try:
        db = get_db()
        posts_collection = db.posts
        
        # Check if post exists and user is author
        post = await posts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        if post["author"]["id"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to edit this post")
        
        # Prepare update
        update_fields = {"updated_at": datetime.utcnow()}
        if update_data.content is not None:
            update_fields["content"] = update_data.content
        if update_data.visibility is not None:
            update_fields["visibility"] = update_data.visibility
        if update_data.tags is not None:
            update_fields["tags"] = [tag.lower().strip() for tag in update_data.tags]
        
        # Update post
        await posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$set": update_fields}
        )
        
        # Return updated post
        updated_post = await posts_collection.find_one({"_id": ObjectId(post_id)})
        updated_post["_id"] = str(updated_post["_id"])
        
        # Add engagement data
        user_id = str(current_user["_id"])
        updated_post["user_engagement"] = {
            "liked": user_id in updated_post.get("likes", []),
            "bookmarked": user_id in updated_post.get("bookmarks", []),
            "shared": user_id in updated_post.get("shares", [])
        }
        updated_post["engagement"] = {
            "likes": len(updated_post.get("likes", [])),
            "comments": updated_post.get("comment_count", 0),
            "shares": len(updated_post.get("shares", [])),
            "views": updated_post.get("view_count", 0),
            "bookmarks": len(updated_post.get("bookmarks", []))
        }
        
        return updated_post
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating post: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update post")


@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Delete a post (author only)
    """
    try:
        db = get_db()
        posts_collection = db.posts
        
        # Check if post exists and user is author
        post = await posts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        if post["author"]["id"] != str(current_user["_id"]):
            raise HTTPException(status_code=403, detail="Not authorized to delete this post")
        
        # Delete post and related comments
        await posts_collection.delete_one({"_id": ObjectId(post_id)})
        
        comments_collection = db.comments
        await comments_collection.delete_many({"post_id": post_id})
        
        # Track analytics
        track_event("post_deleted", {
            "user_id": str(current_user["_id"]),
            "post_id": post_id
        })
        
        return {"message": "Post deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting post: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete post")


@router.post("/{post_id}/engage")
async def engage_with_post(
    post_id: str,
    engagement: EngagementAction,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Like, bookmark, or share a post
    """
    try:
        db = get_db()
        posts_collection = db.posts
        user_id = str(current_user["_id"])
        
        # Check if post exists
        post = await posts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Increment view count if not author
        if post["author"]["id"] != user_id:
            await posts_collection.update_one(
                {"_id": ObjectId(post_id)},
                {"$inc": {"view_count": 1}}
            )
        
        # Handle engagement actions
        update_query = {}
        
        if engagement.action == "like":
            update_query = {"$addToSet": {"likes": user_id}}
        elif engagement.action == "unlike":
            update_query = {"$pull": {"likes": user_id}}
        elif engagement.action == "bookmark":
            update_query = {"$addToSet": {"bookmarks": user_id}}
        elif engagement.action == "unbookmark":
            update_query = {"$pull": {"bookmarks": user_id}}
        elif engagement.action == "share":
            update_query = {"$addToSet": {"shares": user_id}}
        
        if update_query:
            await posts_collection.update_one(
                {"_id": ObjectId(post_id)},
                update_query
            )
        
        # Track analytics
        track_event("post_engagement", {
            "user_id": user_id,
            "post_id": post_id,
            "action": engagement.action,
            "author_id": post["author"]["id"]
        })
        
        return {"message": f"Post {engagement.action}d successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error engaging with post: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to engage with post")


@router.get("/{post_id}/comments", response_model=List[CommentResponse])
async def get_post_comments(
    post_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get comments for a post
    """
    try:
        db = get_db()
        comments_collection = db.comments
        user_id = str(current_user["_id"])
        
        # Get top-level comments
        cursor = comments_collection.find({
            "post_id": post_id,
            "parent_id": None
        }).sort("timestamp", 1).skip(offset).limit(limit)
        
        comments = await cursor.to_list(length=limit)
        
        # Enrich comments with user engagement and replies
        for comment in comments:
            comment["_id"] = str(comment["_id"])
            comment["user_liked"] = user_id in comment.get("likes", [])
            comment["likes"] = len(comment.get("likes", []))
            
            # Get replies for this comment
            replies_cursor = comments_collection.find({
                "post_id": post_id,
                "parent_id": str(comment["_id"])
            }).sort("timestamp", 1)
            
            replies = await replies_cursor.to_list(length=None)
            for reply in replies:
                reply["_id"] = str(reply["_id"])
                reply["user_liked"] = user_id in reply.get("likes", [])
                reply["likes"] = len(reply.get("likes", []))
            
            comment["replies"] = replies
        
        return comments
        
    except Exception as e:
        logger.error(f"Error fetching comments: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch comments")


@router.post("/{post_id}/comments", response_model=CommentResponse)
async def create_comment(
    post_id: str,
    comment_data: CommentCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a comment on a post
    """
    try:
        db = get_db()
        posts_collection = db.posts
        comments_collection = db.comments
        
        # Check if post exists
        post = await posts_collection.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Prepare comment document
        comment_doc = {
            "post_id": post_id,
            "author": {
                "id": str(current_user["_id"]),
                "name": current_user["name"],
                "avatar": current_user.get("profile_photo_url", ""),
                "role": current_user.get("role", "")
            },
            "content": comment_data.content,
            "parent_id": comment_data.parent_id,
            "likes": [],
            "timestamp": datetime.utcnow()
        }
        
        # Insert comment
        result = await comments_collection.insert_one(comment_doc)
        comment_doc["_id"] = str(result.inserted_id)
        
        # Update post comment count
        await posts_collection.update_one(
            {"_id": ObjectId(post_id)},
            {"$inc": {"comment_count": 1}}
        )
        
        # Prepare response
        comment_doc["user_liked"] = False
        comment_doc["likes"] = 0
        comment_doc["replies"] = []
        
        # Track analytics
        track_event("comment_created", {
            "user_id": str(current_user["_id"]),
            "post_id": post_id,
            "comment_id": str(result.inserted_id)
        })
        
        return comment_doc
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating comment: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create comment")


@router.get("/trending-tags")
async def get_trending_tags(
    limit: int = Query(20, ge=1, le=50),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get trending hashtags from recent posts
    """
    try:
        db = get_db()
        posts_collection = db.posts
        
        # Get posts from last 7 days
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        # Aggregate trending tags
        pipeline = [
            {"$match": {"timestamp": {"$gte": week_ago}}},
            {"$unwind": "$tags"},
            {"$group": {
                "_id": "$tags",
                "count": {"$sum": 1},
                "engagement": {"$sum": {"$size": "$likes"}}
            }},
            {"$sort": {"engagement": -1, "count": -1}},
            {"$limit": limit}
        ]
        
        trending = await posts_collection.aggregate(pipeline).to_list(length=limit)
        
        return {
            "trending_tags": [
                {"tag": item["_id"], "count": item["count"], "engagement": item["engagement"]}
                for item in trending
            ]
        }
        
    except Exception as e:
        logger.error(f"Error fetching trending tags: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch trending tags")





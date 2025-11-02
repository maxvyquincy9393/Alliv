"""
Events Routes - Collaborative Events & Meetups
Handles: Event creation, discovery, RSVP, attendance
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime
from bson import ObjectId

from ..config import settings
from ..auth import get_current_user
from .. import db

router = APIRouter(prefix="/events", tags=["Events"])


# ===== MODELS =====
class EventCreate(BaseModel):
    title: str
    description: str
    category: Literal["hackathon", "workshop", "meetup", "conference", "networking", "study_group"]
    date: datetime
    duration: int  # minutes
    location: Optional[str] = None
    isOnline: bool = False
    maxAttendees: Optional[int] = None
    skills: List[str] = []
    coverImage: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    maxAttendees: Optional[int] = None


class RSVPRequest(BaseModel):
    status: Literal["going", "interested", "not_going"]


# ===== ROUTES =====

@router.post("/")
async def create_event(
    data: EventCreate,
    current_user = Depends(get_current_user)
):
    """
    Create a new event
    """
    try:
        event_doc = {
            "organizerId": current_user["_id"],
            "title": data.title,
            "description": data.description,
            "category": data.category,
            "date": data.date,
            "duration": data.duration,
            "location": data.location,
            "isOnline": data.isOnline,
            "maxAttendees": data.maxAttendees,
            "skills": data.skills,
            "coverImage": data.coverImage,
            "attendees": [],
            "interested": [],
            "createdAt": datetime.utcnow(),
            "status": "upcoming"
        }
        
        result = await db.events().insert_one(event_doc)
        
        return {
            "eventId": str(result.inserted_id),
            "message": "Event created successfully"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/")
async def list_events(
    category: Optional[str] = None,
    upcoming: bool = True,
    limit: int = Query(20, le=100),
    current_user = Depends(get_current_user)
):
    """
    List events with filtering
    """
    try:
        query = {}
        
        if category:
            query["category"] = category
        
        if upcoming:
            query["date"] = {"$gte": datetime.utcnow()}
        
        events_cursor = db.events().find(query).sort("date", 1).limit(limit)
        events = await events_cursor.to_list(length=limit)
        
        # Populate with organizer info
        events_list = []
        for event in events:
            organizer = await db.profiles().find_one({"userId": event["organizerId"]})
            
            events_list.append({
                "id": str(event["_id"]),
                "title": event["title"],
                "description": event["description"],
                "category": event["category"],
                "date": event["date"].isoformat(),
                "duration": event["duration"],
                "location": event.get("location"),
                "isOnline": event["isOnline"],
                "maxAttendees": event.get("maxAttendees"),
                "attendeesCount": len(event.get("attendees", [])),
                "interestedCount": len(event.get("interested", [])),
                "organizer": {
                    "id": str(event["organizerId"]),
                    "name": organizer.get("name") if organizer else "Unknown",
                    "photo": organizer.get("photos", [""])[0] if organizer and organizer.get("photos") else ""
                },
                "coverImage": event.get("coverImage"),
                "status": event.get("status", "upcoming")
            })
        
        return {
            "events": events_list,
            "total": len(events_list)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{eventId}")
async def get_event_detail(
    eventId: str,
    current_user = Depends(get_current_user)
):
    """
    Get detailed event information
    """
    try:
        event = await db.events().find_one({"_id": ObjectId(eventId)})
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Get organizer profile
        organizer = await db.profiles().find_one({"userId": event["organizerId"]})
        
        # Get attendees profiles
        attendees_list = []
        for user_id in event.get("attendees", []):
            profile = await db.profiles().find_one({"userId": user_id})
            if profile:
                attendees_list.append({
                    "id": str(user_id),
                    "name": profile.get("name"),
                    "photo": profile.get("photos", [""])[0] if profile.get("photos") else "",
                    "field": profile.get("field")
                })
        
        return {
            "id": str(event["_id"]),
            "title": event["title"],
            "description": event["description"],
            "category": event["category"],
            "date": event["date"].isoformat(),
            "duration": event["duration"],
            "location": event.get("location"),
            "isOnline": event["isOnline"],
            "maxAttendees": event.get("maxAttendees"),
            "skills": event.get("skills", []),
            "organizer": {
                "id": str(event["organizerId"]),
                "name": organizer.get("name") if organizer else "Unknown",
                "photo": organizer.get("photos", [""])[0] if organizer and organizer.get("photos") else "",
                "bio": organizer.get("bio") if organizer else ""
            },
            "attendees": attendees_list,
            "attendeesCount": len(attendees_list),
            "interestedCount": len(event.get("interested", [])),
            "coverImage": event.get("coverImage"),
            "status": event.get("status", "upcoming"),
            "createdAt": event["createdAt"].isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{eventId}/rsvp")
async def rsvp_event(
    eventId: str,
    data: RSVPRequest,
    current_user = Depends(get_current_user)
):
    """
    RSVP to an event
    """
    try:
        event = await db.events().find_one({"_id": ObjectId(eventId)})
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        user_id = current_user["_id"]
        attendees = event.get("attendees", [])
        interested = event.get("interested", [])
        
        # Check capacity
        max_attendees = event.get("maxAttendees")
        if max_attendees and len(attendees) >= max_attendees and data.status == "going":
            raise HTTPException(status_code=400, detail="Event is full")
        
        # Remove from both lists first
        attendees = [uid for uid in attendees if uid != user_id]
        interested = [uid for uid in interested if uid != user_id]
        
        # Add to appropriate list
        if data.status == "going":
            attendees.append(user_id)
        elif data.status == "interested":
            interested.append(user_id)
        # "not_going" just removes from both lists
        
        # Update event
        await db.events().update_one(
            {"_id": ObjectId(eventId)},
            {
                "$set": {
                    "attendees": attendees,
                    "interested": interested
                }
            }
        )
        
        return {
            "message": f"RSVP updated to {data.status}",
            "status": data.status,
            "attendeesCount": len(attendees),
            "interestedCount": len(interested)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my/organized")
async def my_organized_events(
    current_user = Depends(get_current_user)
):
    """
    Get events organized by current user
    """
    try:
        events_cursor = db.events().find(
            {"organizerId": current_user["_id"]}
        ).sort("date", -1)
        
        events = await events_cursor.to_list(length=50)
        
        events_list = [{
            "id": str(event["_id"]),
            "title": event["title"],
            "date": event["date"].isoformat(),
            "category": event["category"],
            "attendeesCount": len(event.get("attendees", [])),
            "interestedCount": len(event.get("interested", [])),
            "status": event.get("status", "upcoming")
        } for event in events]
        
        return {
            "events": events_list,
            "total": len(events_list)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/my/attending")
async def my_attending_events(
    current_user = Depends(get_current_user)
):
    """
    Get events current user is attending
    """
    try:
        user_id = current_user["_id"]
        
        events_cursor = db.events().find({
            "attendees": user_id,
            "date": {"$gte": datetime.utcnow()}
        }).sort("date", 1)
        
        events = await events_cursor.to_list(length=50)
        
        events_list = []
        for event in events:
            organizer = await db.profiles().find_one({"userId": event["organizerId"]})
            
            events_list.append({
                "id": str(event["_id"]),
                "title": event["title"],
                "date": event["date"].isoformat(),
                "category": event["category"],
                "location": event.get("location"),
                "isOnline": event["isOnline"],
                "organizer": {
                    "name": organizer.get("name") if organizer else "Unknown"
                }
            })
        
        return {
            "events": events_list,
            "total": len(events_list)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{eventId}")
async def update_event(
    eventId: str,
    data: EventUpdate,
    current_user = Depends(get_current_user)
):
    """
    Update event details (organizer only)
    """
    try:
        event = await db.events().find_one({"_id": ObjectId(eventId)})
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if user is organizer
        if event["organizerId"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Only organizer can update event")
        
        # Build update dict
        update_data = {k: v for k, v in data.dict().items() if v is not None}
        
        if update_data:
            await db.events().update_one(
                {"_id": ObjectId(eventId)},
                {"$set": update_data}
            )
        
        return {"message": "Event updated successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{eventId}")
async def delete_event(
    eventId: str,
    current_user = Depends(get_current_user)
):
    """
    Delete an event (organizer only)
    """
    try:
        event = await db.events().find_one({"_id": ObjectId(eventId)})
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if user is organizer
        if event["organizerId"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Only organizer can delete event")
        
        await db.events().delete_one({"_id": ObjectId(eventId)})
        
        return {"message": "Event deleted successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

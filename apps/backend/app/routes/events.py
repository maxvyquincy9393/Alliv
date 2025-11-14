"""
Events Routes - Collaborative Events & Meetups
Handles: Event creation, discovery, RSVP, attendance with waitlist
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict
from datetime import datetime
from bson import ObjectId
from pymongo.errors import PyMongoError
import logging

from ..config import settings
from ..auth import get_current_user
from ..db import get_db
from ..email_utils import send_email

router = APIRouter(prefix="/events", tags=["Events"])
logger = logging.getLogger(__name__)


# ===== HELPER FUNCTIONS =====
async def send_event_notification(
    event_id: str,
    notification_type: Literal["rsvp_confirmation", "waitlist_added", "waitlist_promoted", "event_cancelled", "event_updated"],
    recipient_ids: List[str],
    extra_data: Optional[Dict] = None
):
    """Send event-related email notifications"""
    try:
        db = get_db()
        event = await db.events.find_one({"_id": ObjectId(event_id)})
        if not event:
            return
        
        # Get recipient users
        users = await db.users.find({"_id": {"$in": [ObjectId(uid) for uid in recipient_ids]}}).to_list(None)
        
        for user in users:
            if not user.get('email'):
                continue
                
            event_title = event['title']
            event_date = event['date'].strftime('%B %d, %Y at %I:%M %p')
            
            # Email templates based on type
            if notification_type == "rsvp_confirmation":
                subject = f"[OK] RSVP Confirmed: {event_title}"
                body = f"""
                <h2>You're Registered!</h2>
                <p>Hi {user.get('name', 'there')},</p>
                <p>Your RSVP for <strong>{event_title}</strong> has been confirmed.</p>
                <p><strong>Date:</strong> {event_date}</p>
                <p><strong>Location:</strong> {event.get('location', {}).get('address', 'Online') if isinstance(event.get('location'), dict) else event.get('location', 'TBD')}</p>
                <p>See you there! [SUCCESS]</p>
                """
            
            elif notification_type == "waitlist_added":
                position = extra_data.get('position', 0) if extra_data else 0
                subject = f"📋 Added to Waitlist: {event_title}"
                body = f"""
                <h2>You're on the Waitlist</h2>
                <p>Hi {user.get('name', 'there')},</p>
                <p>The event <strong>{event_title}</strong> is currently full, but you've been added to the waitlist.</p>
                <p><strong>Your Position:</strong> #{position}</p>
                <p>We'll notify you if a spot opens up!</p>
                """
            
            elif notification_type == "waitlist_promoted":
                subject = f"🎊 You're In! {event_title}"
                body = f"""
                <h2>A Spot Opened Up!</h2>
                <p>Hi {user.get('name', 'there')},</p>
                <p>Great news! A spot opened up for <strong>{event_title}</strong> and you've been promoted from the waitlist.</p>
                <p><strong>Date:</strong> {event_date}</p>
                <p>You're now confirmed to attend. See you there! [SUCCESS]</p>
                """
            
            elif notification_type == "event_cancelled":
                subject = f"[ERROR] Event Cancelled: {event_title}"
                body = f"""
                <h2>Event Cancelled</h2>
                <p>Hi {user.get('name', 'there')},</p>
                <p>Unfortunately, <strong>{event_title}</strong> has been cancelled.</p>
                <p>We apologize for any inconvenience.</p>
                """
            
            elif notification_type == "event_updated":
                subject = f"[NOTE] Event Updated: {event_title}"
                body = f"""
                <h2>Event Details Changed</h2>
                <p>Hi {user.get('name', 'there')},</p>
                <p>The details for <strong>{event_title}</strong> have been updated.</p>
                <p>Please check the event page for the latest information.</p>
                """
            
            else:
                continue
            
            await send_email(user['email'], subject, body)
            
    except Exception as e:
        logger.error(f"Failed to send event notification: {str(e)}")
        # Don't raise - email failures shouldn't block the main operation


# ===== MODELS =====
class LocationModel(BaseModel):
    type: str = "Point"
    coordinates: List[float] = Field(..., description="[longitude, latitude]")
    address: str
    city: str
    country: str = "Indonesia"

class EventCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., max_length=1000)
    category: Literal["hackathon", "workshop", "meetup", "conference", "networking", "study_group"]
    date: datetime
    duration: int = Field(..., gt=0)  # minutes
    location: Optional[LocationModel] = None  # GeoJSON format for maps
    isOnline: bool = False
    maxAttendees: Optional[int] = Field(None, gt=0)
    meetingLink: Optional[str] = None
    skills: List[str] = []
    coverImage: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=1000)
    date: Optional[datetime] = None
    location: Optional[LocationModel] = None
    maxAttendees: Optional[int] = Field(None, gt=0)
    meetingLink: Optional[str] = None
    duration: Optional[int] = Field(None, gt=0)
    category: Optional[Literal["hackathon", "workshop", "meetup", "conference", "networking", "study_group"]] = None


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
            "location": data.location.dict() if data.location else None,  # Convert to dict for MongoDB
            "isOnline": data.isOnline,
            "maxAttendees": data.maxAttendees,
            "meetingLink": data.meetingLink,
            "skills": data.skills,
            "coverImage": data.coverImage,
            "attendees": [],
            "interested": [],
            "waitlist": [],  # Initialize waitlist
            "createdAt": datetime.utcnow(),
            "status": "upcoming"
        }
        
        result = await get_db().events.insert_one(event_doc)
        
        return {
            "eventId": str(result.inserted_id),
            "message": "Event created successfully"
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"Database error creating event: {str(e)}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except Exception as e:
        logger.error(f"Unexpected error creating event: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to create event")


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
        
        events_cursor = get_db().events.find(query).sort("date", 1).limit(limit)
        events = await events_cursor.to_list(length=limit)
        
        # Populate with organizer info
        events_list = []
        for event in events:
            organizer = await get_db().profiles.find_one({"userId": event["organizerId"]})
            
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
                "waitlistCount": len(event.get("waitlist", [])),
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
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"Database error listing events: {str(e)}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except Exception as e:
        logger.error(f"Unexpected error listing events: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve events")


@router.get("/{eventId}")
async def get_event_detail(
    eventId: str,
    current_user = Depends(get_current_user)
):
    """
    Get detailed event information - Meeting link only visible to attendees/organizer
    """
    try:
        event = await get_db().events.find_one({"_id": ObjectId(eventId)})
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        user_id = current_user["_id"]
        is_organizer = str(event["organizerId"]) == str(user_id)
        is_attendee = user_id in event.get("attendees", [])
        is_waitlisted = user_id in event.get("waitlist", [])
        
        # Get organizer profile
        organizer = await get_db().profiles.find_one({"userId": event["organizerId"]})
        
        # Get attendees profiles
        attendees_list = []
        for attendee_id in event.get("attendees", []):
            profile = await get_db().profiles.find_one({"userId": attendee_id})
            if profile:
                attendees_list.append({
                    "id": str(attendee_id),
                    "name": profile.get("name"),
                    "photo": profile.get("photos", [""])[0] if profile.get("photos") else "",
                    "field": profile.get("field")
                })
        
        # Get waitlist profiles
        waitlist_list = []
        for waitlist_id in event.get("waitlist", []):
            profile = await get_db().profiles.find_one({"userId": waitlist_id})
            if profile:
                waitlist_list.append({
                    "id": str(waitlist_id),
                    "name": profile.get("name"),
                    "photo": profile.get("photos", [""])[0] if profile.get("photos") else ""
                })
        
        response = {
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
            "waitlist": waitlist_list if is_organizer else [],  # Only organizer sees full waitlist
            "waitlistCount": len(event.get("waitlist", [])),
            "coverImage": event.get("coverImage"),
            "status": event.get("status", "upcoming"),
            "createdAt": event["createdAt"].isoformat(),
            "userStatus": "organizing" if is_organizer else ("attending" if is_attendee else ("waitlisted" if is_waitlisted else "not_attending"))
        }
        
        # Meeting link privacy - only visible to organizer or attendees
        if is_organizer or is_attendee:
            response["meetingLink"] = event.get("meetingLink")
        
        return response
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"Database error getting event: {str(e)}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except Exception as e:
        logger.error(f"Unexpected error getting event: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve event")


@router.post("/{eventId}/rsvp")


@router.post("/{eventId}/rsvp")
async def rsvp_event(
    eventId: str,
    data: RSVPRequest,
    current_user = Depends(get_current_user)
):
    """
    RSVP to an event - With waitlist support
    """
    try:
        event = await get_db().events.find_one({"_id": ObjectId(eventId)})
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        user_id = current_user["_id"]
        attendees = event.get("attendees", [])
        interested = event.get("interested", [])
        waitlist = event.get("waitlist", [])
        
        max_attendees = event.get("maxAttendees")
        
        # Remove from all lists first
        attendees = [uid for uid in attendees if uid != user_id]
        interested = [uid for uid in interested if uid != user_id]
        waitlist = [uid for uid in waitlist if uid != user_id]
        
        response_message = f"RSVP updated to {data.status}"
        waitlist_position = None
        
        # Handle "going" status with waitlist logic
        if data.status == "going":
            if max_attendees and len(attendees) >= max_attendees:
                # Event is full - add to waitlist
                waitlist.append(user_id)
                waitlist_position = len(waitlist)
                response_message = "Event is full. You've been added to the waitlist."
                
                # Send waitlist notification
                await send_event_notification(
                    eventId, 
                    "waitlist_added", 
                    [str(user_id)],
                    {"position": waitlist_position}
                )
            else:
                # Space available - add to attendees
                attendees.append(user_id)
                
                # Send RSVP confirmation
                await send_event_notification(
                    eventId, 
                    "rsvp_confirmation", 
                    [str(user_id)]
                )
        
        elif data.status == "interested":
            interested.append(user_id)
        
        # "not_going" just removes from all lists (already done above)
        
        # Update event
        await get_db().events.update_one(
            {"_id": ObjectId(eventId)},
            {
                "$set": {
                    "attendees": attendees,
                    "interested": interested,
                    "waitlist": waitlist
                }
            }
        )
        
        result = {
            "message": response_message,
            "status": "waitlisted" if waitlist_position else data.status,
            "attendeesCount": len(attendees),
            "interestedCount": len(interested),
            "waitlistCount": len(waitlist)
        }
        
        if waitlist_position:
            result["waitlistPosition"] = waitlist_position
        
        return result
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"Database error in RSVP: {str(e)}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except Exception as e:
        logger.error(f"Unexpected error in RSVP: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update RSVP")


@router.delete("/{eventId}/rsvp")
async def cancel_rsvp(
    eventId: str,
    current_user = Depends(get_current_user)
):
    """
    Cancel RSVP - Promotes first person from waitlist if space opens
    """
    try:
        event = await get_db().events.find_one({"_id": ObjectId(eventId)})
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        user_id = current_user["_id"]
        attendees = event.get("attendees", [])
        interested = event.get("interested", [])
        waitlist = event.get("waitlist", [])
        
        was_attending = user_id in attendees
        
        # Remove user from all lists
        attendees = [uid for uid in attendees if uid != user_id]
        interested = [uid for uid in interested if uid != user_id]
        waitlist = [uid for uid in waitlist if uid != user_id]
        
        promoted_user = None
        
        # If user was attending and waitlist exists, promote first person
        if was_attending and waitlist:
            promoted_user = waitlist[0]
            waitlist = waitlist[1:]  # Remove promoted user from waitlist
            attendees.append(promoted_user)
            
            # Notify promoted user
            await send_event_notification(
                eventId,
                "waitlist_promoted",
                [str(promoted_user)]
            )
        
        # Update event
        await get_db().events.update_one(
            {"_id": ObjectId(eventId)},
            {
                "$set": {
                    "attendees": attendees,
                    "interested": interested,
                    "waitlist": waitlist
                }
            }
        )
        
        result = {
            "message": "RSVP cancelled successfully",
            "attendeesCount": len(attendees),
            "interestedCount": len(interested),
            "waitlistCount": len(waitlist)
        }
        
        if promoted_user:
            result["promotedUser"] = str(promoted_user)
        
        return result
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"Database error cancelling RSVP: {str(e)}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except Exception as e:
        logger.error(f"Unexpected error cancelling RSVP: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to cancel RSVP")


@router.get("/my/organized")
async def my_organized_events(
    current_user = Depends(get_current_user)
):
    """
    Get events organized by current user
    """
    try:
        events_cursor = get_db().events.find(
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
            "waitlistCount": len(event.get("waitlist", [])),
            "status": event.get("status", "upcoming")
        } for event in events]
        
        return {
            "events": events_list,
            "total": len(events_list)
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"Database error getting organized events: {str(e)}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except Exception as e:
        logger.error(f"Unexpected error getting organized events: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve events")


@router.get("/my/attending")
async def my_attending_events(
    current_user = Depends(get_current_user)
):
    """
    Get events current user is attending
    """
    try:
        user_id = current_user["_id"]
        
        events_cursor = get_db().events.find({
            "attendees": user_id,
            "date": {"$gte": datetime.utcnow()}
        }).sort("date", 1)
        
        events = await events_cursor.to_list(length=50)
        
        events_list = []
        for event in events:
            organizer = await get_db().profiles.find_one({"userId": event["organizerId"]})
            
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
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"Database error getting attending events: {str(e)}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except Exception as e:
        logger.error(f"Unexpected error getting attending events: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve events")


@router.put("/{eventId}")
async def update_event(
    eventId: str,
    data: EventUpdate,
    current_user = Depends(get_current_user)
):
    """
    Update event details (organizer only) - Notifies attendees
    """
    try:
        event = await get_db().events.find_one({"_id": ObjectId(eventId)})
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if user is organizer
        if event["organizerId"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Only organizer can update event")
        
        # Build update dict
        update_data = {}
        if data.title is not None:
            update_data["title"] = data.title
        if data.description is not None:
            update_data["description"] = data.description
        if data.date is not None:
            update_data["date"] = data.date
        if data.location is not None:
            update_data["location"] = data.location.dict()
        if data.maxAttendees is not None:
            update_data["maxAttendees"] = data.maxAttendees
        if data.meetingLink is not None:
            update_data["meetingLink"] = data.meetingLink
        if data.duration is not None:
            update_data["duration"] = data.duration
        if data.category is not None:
            update_data["category"] = data.category
        
        if update_data:
            await get_db().events.update_one(
                {"_id": ObjectId(eventId)},
                {"$set": update_data}
            )
            
            # Notify all attendees about the update
            attendees = event.get("attendees", [])
            if attendees:
                await send_event_notification(
                    eventId,
                    "event_updated",
                    [str(uid) for uid in attendees]
                )
        
        return {"message": "Event updated successfully"}
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"Database error updating event: {str(e)}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except Exception as e:
        logger.error(f"Unexpected error updating event: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update event")


@router.delete("/{eventId}")
async def delete_event(
    eventId: str,
    current_user = Depends(get_current_user)
):
    """
    Delete an event (organizer only) - Notifies all attendees
    """
    try:
        event = await get_db().events.find_one({"_id": ObjectId(eventId)})
        
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if user is organizer
        if event["organizerId"] != current_user["_id"]:
            raise HTTPException(status_code=403, detail="Only organizer can delete event")
        
        # Notify all attendees before deleting
        attendees = event.get("attendees", [])
        waitlist = event.get("waitlist", [])
        all_affected = attendees + waitlist
        
        if all_affected:
            await send_event_notification(
                eventId,
                "event_cancelled",
                [str(uid) for uid in all_affected]
            )
        
        await get_db().events.delete_one({"_id": ObjectId(eventId)})
        
        return {
            "message": "Event deleted successfully",
            "notifiedUsers": len(all_affected)
        }
    
    except HTTPException:
        raise
    except PyMongoError as e:
        logger.error(f"Database error deleting event: {str(e)}")
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    except Exception as e:
        logger.error(f"Unexpected error deleting event: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete event")

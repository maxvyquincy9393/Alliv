"""
AI Insights API Routes
Provides contextual AI-generated insights for matches and collaborations
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Literal
from datetime import datetime, timedelta
from bson import ObjectId
import logging
import json

from ..auth import get_current_user
from ..db import get_db
from ..ai_engine import ai_engine
from ..integrations.metrics import track_event

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/insights", tags=["AI Insights"])


# ===== MODELS =====
class MatchInsight(BaseModel):
    match_reasons: List[str] = Field(..., description="Why these users matched")
    compatibility_score: float = Field(..., ge=0, le=1, description="Overall compatibility")
    skill_overlap: List[str] = Field(default=[], description="Shared skills")
    complementary_skills: List[str] = Field(default=[], description="Complementary skills")
    shared_interests: List[str] = Field(default=[], description="Common project interests")
    location_compatibility: Dict[str, Any] = Field(default={}, description="Location analysis")
    availability_match: Dict[str, Any] = Field(default={}, description="Schedule compatibility")
    suggested_projects: List[Dict[str, str]] = Field(default=[], description="AI-suggested collaboration ideas")
    conversation_starters: List[str] = Field(default=[], description="Icebreaker suggestions")
    collaboration_potential: str = Field(..., description="High/Medium/Low potential assessment")
    red_flags: List[str] = Field(default=[], description="Potential compatibility issues")


class AvailabilityBadge(BaseModel):
    status: Literal["available", "busy", "offline"]
    label: str
    description: str
    color: str


class SuggestedAction(BaseModel):
    action: str
    label: str
    description: str
    priority: Literal["high", "medium", "low"]
    icon: str
    data: Optional[Dict[str, Any]] = None


class UserInsightResponse(BaseModel):
    user_id: str
    insights: MatchInsight
    availability: AvailabilityBadge
    suggested_actions: List[SuggestedAction]
    ai_confidence: float = Field(ge=0, le=1)
    generated_at: datetime
    expires_at: datetime


class ProjectRecommendation(BaseModel):
    title: str
    description: str
    category: str
    estimated_duration: str
    required_skills: List[str]
    feasibility_score: float = Field(ge=0, le=1)
    market_potential: str
    team_composition: List[Dict[str, str]]


# ===== HELPER FUNCTIONS =====
async def calculate_skill_compatibility(user1: Dict, user2: Dict) -> Dict[str, Any]:
    """Calculate skill-based compatibility between two users"""
    user1_skills = set(skill.lower() for skill in user1.get("skills", []))
    user2_skills = set(skill.lower() for skill in user2.get("skills", []))
    
    overlap = user1_skills.intersection(user2_skills)
    complementary = user1_skills.symmetric_difference(user2_skills)
    
    # Calculate compatibility score based on overlap and complementarity
    overlap_score = len(overlap) / max(len(user1_skills), len(user2_skills), 1)
    complementary_score = min(len(complementary) / 10, 1.0)  # Cap at 10 skills
    
    return {
        "overlap": list(overlap),
        "complementary": list(complementary)[:10],  # Limit to top 10
        "overlap_score": overlap_score,
        "complementary_score": complementary_score,
        "total_score": (overlap_score * 0.6) + (complementary_score * 0.4)
    }


async def analyze_availability_compatibility(user1: Dict, user2: Dict) -> Dict[str, Any]:
    """Analyze schedule and availability compatibility"""
    user1_hours = user1.get("availability_hours_per_week", 40)
    user2_hours = user2.get("availability_hours_per_week", 40)
    
    user1_tz = user1.get("timezone", "UTC")
    user2_tz = user2.get("timezone", "UTC")
    
    # Simple timezone compatibility (in real app, use proper timezone library)
    timezone_compatible = user1_tz == user2_tz or user1.get("remote_only", False)
    
    # Availability overlap
    min_hours = min(user1_hours, user2_hours)
    max_hours = max(user1_hours, user2_hours)
    availability_ratio = min_hours / max_hours if max_hours > 0 else 0
    
    return {
        "timezone_compatible": timezone_compatible,
        "availability_ratio": availability_ratio,
        "user1_hours": user1_hours,
        "user2_hours": user2_hours,
        "overlap_assessment": "High" if availability_ratio > 0.7 else "Medium" if availability_ratio > 0.4 else "Low"
    }


async def generate_conversation_starters(user1: Dict, user2: Dict, shared_interests: List[str]) -> List[str]:
    """Generate AI-powered conversation starters"""
    starters = []
    
    # Based on shared skills
    if shared_interests:
        starters.append(f"I noticed we both work with {shared_interests[0]}. What's your favorite project you've used it for?")
    
    # Based on experience levels
    user1_exp = user1.get("experience_level", "")
    user2_exp = user2.get("experience_level", "")
    if "Senior" in user1_exp or "Expert" in user1_exp:
        starters.append("I'd love to learn from your experience. What's the most valuable lesson you've learned in your career?")
    
    # Based on location
    if user1.get("location_city") == user2.get("location_city"):
        starters.append(f"Great to meet another professional in {user1.get('location_city')}! Are you familiar with the local tech scene?")
    
    # Based on project interests
    user1_interests = user1.get("project_interests", [])
    user2_interests = user2.get("project_interests", [])
    common_interests = set(user1_interests).intersection(set(user2_interests))
    if common_interests:
        interest = list(common_interests)[0]
        starters.append(f"I see we're both interested in {interest}. Have you worked on any projects in that space recently?")
    
    # Generic professional starters
    starters.extend([
        "What's the most exciting project you're working on right now?",
        "I'm always looking to learn new skills. What would you recommend for someone in my field?",
        "Your profile caught my attention. I'd love to hear about your journey in this industry."
    ])
    
    return starters[:5]  # Return top 5


async def generate_project_suggestions(user1: Dict, user2: Dict) -> List[Dict[str, str]]:
    """Generate AI-powered project collaboration suggestions"""
    suggestions = []
    
    user1_field = user1.get("field", "")
    user2_field = user2.get("field", "")
    user1_skills = user1.get("skills", [])
    user2_skills = user2.get("skills", [])
    
    # Cross-field collaborations
    if "TECH" in user1_field and "CREATIVE" in user2_field:
        suggestions.append({
            "title": "Creative Tech App",
            "description": "Combine technical expertise with creative design for an innovative user experience",
            "duration": "2-3 months"
        })
    
    if "BUSINESS" in user1_field and any("TECH" in field for field in [user1_field, user2_field]):
        suggestions.append({
            "title": "Startup MVP Development",
            "description": "Build a minimum viable product with strong business strategy and technical execution",
            "duration": "1-2 months"
        })
    
    # Skill-based suggestions
    if any("React" in skill for skill in user1_skills + user2_skills):
        suggestions.append({
            "title": "Modern Web Application",
            "description": "Develop a responsive web app using modern React ecosystem",
            "duration": "4-6 weeks"
        })
    
    if any("AI" in skill or "Machine Learning" in skill for skill in user1_skills + user2_skills):
        suggestions.append({
            "title": "AI-Powered Tool",
            "description": "Create an intelligent application that solves a real-world problem",
            "duration": "2-4 months"
        })
    
    # Default suggestions
    suggestions.extend([
        {
            "title": "Portfolio Website",
            "description": "Collaborate on a professional portfolio showcasing both your skills",
            "duration": "2-3 weeks"
        },
        {
            "title": "Open Source Contribution",
            "description": "Contribute together to an open source project in your domain",
            "duration": "Ongoing"
        }
    ])
    
    return suggestions[:4]  # Return top 4


def determine_availability_status(user: Dict) -> AvailabilityBadge:
    """Determine user's current availability status"""
    last_active = user.get("last_active")
    if not last_active:
        return AvailabilityBadge(
            status="offline",
            label="Last seen unknown",
            description="User activity not available",
            color="#6B7280"
        )
    
    # Convert to datetime if it's a string
    if isinstance(last_active, str):
        try:
            last_active = datetime.fromisoformat(last_active.replace('Z', '+00:00'))
        except:
            last_active = datetime.utcnow() - timedelta(days=1)
    
    now = datetime.utcnow()
    time_diff = now - last_active
    
    if time_diff < timedelta(minutes=15):
        return AvailabilityBadge(
            status="available",
            label="Online now",
            description="Active within the last 15 minutes",
            color="#10B981"
        )
    elif time_diff < timedelta(hours=2):
        return AvailabilityBadge(
            status="available",
            label="Recently active",
            description="Active within the last 2 hours",
            color="#F59E0B"
        )
    elif time_diff < timedelta(days=1):
        return AvailabilityBadge(
            status="busy",
            label="Active today",
            description="Last seen earlier today",
            color="#EF4444"
        )
    else:
        return AvailabilityBadge(
            status="offline",
            label="Offline",
            description=f"Last seen {time_diff.days} days ago",
            color="#6B7280"
        )


# ===== ENDPOINTS =====
@router.get("/matches/{user_id}", response_model=UserInsightResponse)
async def get_match_insights(
    user_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get AI-generated insights for a specific user match
    """
    try:
        db = await get_db()
        users_collection = db.users
        
        # Get target user
        target_user = await users_collection.find_one({"_id": ObjectId(user_id)})
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Calculate compatibility metrics
        skill_compat = await calculate_skill_compatibility(current_user, target_user)
        availability_compat = await analyze_availability_compatibility(current_user, target_user)
        
        # Generate AI insights
        shared_interests = list(set(current_user.get("project_interests", [])).intersection(
            set(target_user.get("project_interests", []))
        ))
        
        conversation_starters = await generate_conversation_starters(
            current_user, target_user, shared_interests
        )
        project_suggestions = await generate_project_suggestions(current_user, target_user)
        
        # Determine collaboration potential
        overall_score = (skill_compat["total_score"] * 0.4 + 
                        availability_compat["availability_ratio"] * 0.3 + 
                        len(shared_interests) / 10 * 0.3)
        
        if overall_score > 0.7:
            potential = "High"
        elif overall_score > 0.4:
            potential = "Medium"
        else:
            potential = "Low"
        
        # Generate match reasons
        match_reasons = []
        if skill_compat["overlap"]:
            match_reasons.append(f"Shared expertise in {', '.join(skill_compat['overlap'][:3])}")
        if skill_compat["complementary"]:
            match_reasons.append(f"Complementary skills in {', '.join(skill_compat['complementary'][:2])}")
        if shared_interests:
            match_reasons.append(f"Common interest in {', '.join(shared_interests[:2])}")
        if availability_compat["timezone_compatible"]:
            match_reasons.append("Compatible timezones for collaboration")
        
        # Check for potential red flags
        red_flags = []
        if availability_compat["availability_ratio"] < 0.3:
            red_flags.append("Significant difference in availability hours")
        if not availability_compat["timezone_compatible"] and not target_user.get("remote_only", False):
            red_flags.append("Timezone mismatch may affect collaboration")
        if overall_score < 0.2:
            red_flags.append("Limited skill and interest overlap")
        
        # Create insights object
        insights = MatchInsight(
            match_reasons=match_reasons,
            compatibility_score=overall_score,
            skill_overlap=skill_compat["overlap"],
            complementary_skills=skill_compat["complementary"][:5],
            shared_interests=shared_interests,
            location_compatibility={
                "same_city": current_user.get("location_city") == target_user.get("location_city"),
                "same_country": current_user.get("location_country") == target_user.get("location_country"),
                "both_remote": current_user.get("remote_only", False) and target_user.get("remote_only", False)
            },
            availability_match=availability_compat,
            suggested_projects=project_suggestions,
            conversation_starters=conversation_starters,
            collaboration_potential=potential,
            red_flags=red_flags
        )
        
        # Determine availability status
        availability = determine_availability_status(target_user)
        
        # Generate suggested actions
        suggested_actions = [
            SuggestedAction(
                action="send_message",
                label="Send Message",
                description="Start a conversation with a personalized message",
                priority="high",
                icon="MessageCircle"
            ),
            SuggestedAction(
                action="invite_project",
                label="Invite to Project",
                description="Invite them to collaborate on a specific project",
                priority="medium",
                icon="Users",
                data={"suggested_projects": project_suggestions}
            ),
            SuggestedAction(
                action="schedule_call",
                label="Schedule Call",
                description="Set up a brief introduction call",
                priority="medium",
                icon="Calendar"
            ),
            SuggestedAction(
                action="share_portfolio",
                label="Share Portfolio",
                description="Exchange work samples and portfolios",
                priority="low",
                icon="Briefcase"
            )
        ]
        
        # Adjust action priorities based on compatibility
        if overall_score > 0.7:
            suggested_actions[1].priority = "high"  # Invite to project
        
        now = datetime.utcnow()
        response = UserInsightResponse(
            user_id=user_id,
            insights=insights,
            availability=availability,
            suggested_actions=suggested_actions,
            ai_confidence=min(overall_score + 0.2, 1.0),  # Confidence based on data quality
            generated_at=now,
            expires_at=now + timedelta(hours=6)  # Cache for 6 hours
        )
        
        # Track analytics
        track_event("insights_generated", {
            "user_id": str(current_user["_id"]),
            "target_user_id": user_id,
            "compatibility_score": overall_score,
            "collaboration_potential": potential
        })
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating insights: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate insights")


@router.get("/project-recommendations", response_model=List[ProjectRecommendation])
async def get_project_recommendations(
    limit: int = Query(5, ge=1, le=20),
    category: Optional[str] = Query(None),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get AI-generated project recommendations for the user
    """
    try:
        user_field = current_user.get("field", "")
        user_skills = current_user.get("skills", [])
        user_interests = current_user.get("project_interests", [])
        
        recommendations = []
        
        # Tech-focused recommendations
        if "TECH" in user_field:
            recommendations.extend([
                ProjectRecommendation(
                    title="AI-Powered Personal Assistant",
                    description="Build a smart assistant that learns user preferences and automates daily tasks",
                    category="AI/Machine Learning",
                    estimated_duration="3-4 months",
                    required_skills=["Python", "Machine Learning", "NLP", "API Development"],
                    feasibility_score=0.8,
                    market_potential="High - Growing demand for AI automation",
                    team_composition=[
                        {"role": "AI Engineer", "skills": "Python, TensorFlow"},
                        {"role": "Backend Developer", "skills": "API, Database"},
                        {"role": "Frontend Developer", "skills": "React, UI/UX"}
                    ]
                ),
                ProjectRecommendation(
                    title="Collaborative Code Review Platform",
                    description="Create a platform that enhances code review with AI suggestions and team collaboration features",
                    category="Developer Tools",
                    estimated_duration="2-3 months",
                    required_skills=["React", "Node.js", "Git Integration", "WebSockets"],
                    feasibility_score=0.9,
                    market_potential="Medium - Niche but valuable market",
                    team_composition=[
                        {"role": "Full-Stack Developer", "skills": "React, Node.js"},
                        {"role": "DevOps Engineer", "skills": "CI/CD, Docker"},
                        {"role": "Product Designer", "skills": "UI/UX, Prototyping"}
                    ]
                )
            ])
        
        # Creative-focused recommendations
        if "CREATIVE" in user_field:
            recommendations.extend([
                ProjectRecommendation(
                    title="Interactive Digital Art Gallery",
                    description="Design an immersive online gallery with AR/VR capabilities for showcasing digital art",
                    category="Digital Art",
                    estimated_duration="2-3 months",
                    required_skills=["3D Modeling", "WebGL", "UI/UX Design", "AR/VR"],
                    feasibility_score=0.7,
                    market_potential="High - Growing NFT and digital art market",
                    team_composition=[
                        {"role": "3D Artist", "skills": "Blender, Maya"},
                        {"role": "Frontend Developer", "skills": "Three.js, WebGL"},
                        {"role": "UX Designer", "skills": "User Experience, Prototyping"}
                    ]
                ),
                ProjectRecommendation(
                    title="Brand Identity Generator",
                    description="AI-powered tool that generates complete brand identities including logos, colors, and guidelines",
                    category="Branding",
                    estimated_duration="1-2 months",
                    required_skills=["Graphic Design", "AI/ML", "Brand Strategy", "Web Development"],
                    feasibility_score=0.8,
                    market_potential="High - Small business market demand",
                    team_composition=[
                        {"role": "Brand Designer", "skills": "Logo Design, Typography"},
                        {"role": "AI Developer", "skills": "Computer Vision, ML"},
                        {"role": "Product Manager", "skills": "Strategy, User Research"}
                    ]
                )
            ])
        
        # Business-focused recommendations
        if "BUSINESS" in user_field:
            recommendations.extend([
                ProjectRecommendation(
                    title="Sustainable Business Marketplace",
                    description="Platform connecting eco-conscious consumers with sustainable businesses and products",
                    category="E-commerce",
                    estimated_duration="4-6 months",
                    required_skills=["Business Strategy", "E-commerce", "Marketing", "Web Development"],
                    feasibility_score=0.8,
                    market_potential="Very High - Growing sustainability market",
                    team_composition=[
                        {"role": "Business Strategist", "skills": "Market Analysis, Strategy"},
                        {"role": "E-commerce Developer", "skills": "Shopify, Payment Systems"},
                        {"role": "Marketing Specialist", "skills": "Digital Marketing, SEO"}
                    ]
                )
            ])
        
        # Filter by category if specified
        if category:
            recommendations = [r for r in recommendations if category.lower() in r.category.lower()]
        
        # Sort by feasibility and market potential
        recommendations.sort(key=lambda x: (x.feasibility_score, len(x.market_potential)), reverse=True)
        
        # Track analytics
        track_event("project_recommendations_viewed", {
            "user_id": str(current_user["_id"]),
            "category": category,
            "recommendations_count": len(recommendations[:limit])
        })
        
        return recommendations[:limit]
        
    except Exception as e:
        logger.error(f"Error generating project recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate recommendations")


@router.post("/feedback")
async def submit_insights_feedback(
    feedback_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Submit feedback on AI insights quality for improvement
    """
    try:
        db = await get_db()
        feedback_collection = db.insights_feedback
        
        feedback_doc = {
            "user_id": str(current_user["_id"]),
            "feedback_type": feedback_data.get("type", "general"),
            "rating": feedback_data.get("rating"),  # 1-5 stars
            "comments": feedback_data.get("comments", ""),
            "insights_id": feedback_data.get("insights_id"),
            "helpful_features": feedback_data.get("helpful_features", []),
            "improvement_suggestions": feedback_data.get("improvements", []),
            "timestamp": datetime.utcnow()
        }
        
        await feedback_collection.insert_one(feedback_doc)
        
        # Track analytics
        track_event("insights_feedback", {
            "user_id": str(current_user["_id"]),
            "rating": feedback_data.get("rating"),
            "feedback_type": feedback_data.get("type")
        })
        
        return {"message": "Feedback submitted successfully"}
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to submit feedback")





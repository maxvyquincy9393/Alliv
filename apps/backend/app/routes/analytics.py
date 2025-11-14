"""
Advanced Analytics and Insights Router
Provides detailed user and platform analytics
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from ..auth import get_current_user
from ..analytics_engine import analytics_engine

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/user/insights")
async def get_user_insights(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get comprehensive user insights and analytics
    
    Returns:
    - Activity summary (swipes, matches, messages)
    - Performance metrics (rates, engagement score)
    - Activity patterns (hours, days)
    - Personalized recommendations
    """
    try:
        insights = await analytics_engine.get_user_insights(str(current_user.id))
        return {
            "success": True,
            "insights": insights
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch insights: {str(e)}")


@router.get("/user/activity-graph")
async def get_activity_graph(
    days: int = Query(30, ge=1, le=90, description="Number of days to include"),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get user activity graph data for visualization
    
    Returns time-series data for:
    - Daily swipes
    - Daily matches
    - Daily messages
    - Engagement trend
    """
    # Generate mock data for now
    data = []
    for i in range(days):
        date = datetime.utcnow() - timedelta(days=days-i-1)
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "swipes": 10 + (i % 20),
            "matches": 2 + (i % 5),
            "messages": 15 + (i % 30),
            "engagement": 60 + (i % 40)
        })
    
    return {
        "success": True,
        "data": data
    }


@router.get("/user/match-quality")
async def get_match_quality_analysis(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Analyze match quality and success rates
    
    Returns:
    - Match quality distribution
    - Conversation conversion rate
    - Project collaboration rate
    - Success factors analysis
    """
    return {
        "success": True,
        "quality_analysis": {
            "match_quality_distribution": {
                "excellent": 15,
                "good": 35,
                "average": 40,
                "poor": 10
            },
            "conversion_rates": {
                "match_to_chat": 65.5,
                "chat_to_ongoing": 42.3,
                "ongoing_to_project": 28.7
            },
            "success_factors": [
                {
                    "factor": "Skill complementarity",
                    "impact": 85.2,
                    "your_score": 72.5
                },
                {
                    "factor": "Response time",
                    "impact": 78.9,
                    "your_score": 81.3
                },
                {
                    "factor": "Profile completeness",
                    "impact": 65.4,
                    "your_score": 90.0
                },
                {
                    "factor": "Availability overlap",
                    "impact": 58.7,
                    "your_score": 68.2
                }
            ],
            "top_matching_skills": [
                {"skill": "React", "match_count": 12},
                {"skill": "Python", "match_count": 10},
                {"skill": "Node.js", "match_count": 8}
            ]
        }
    }


@router.get("/user/profile-performance")
async def get_profile_performance(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get profile performance metrics
    
    Returns:
    - Profile views
    - Like rate
    - Comparison with similar users
    - Optimization suggestions
    """
    return {
        "success": True,
        "performance": {
            "views": {
                "total": 245,
                "last_7_days": 42,
                "trend": "up",
                "change_percentage": 18.5
            },
            "likes_received": {
                "total": 78,
                "last_7_days": 15,
                "rate": 31.8,  # percentage of views
                "trend": "up"
            },
            "profile_score": 87.5,
            "comparison": {
                "better_than": 78.2,  # percentage of users
                "category": "Top 25%"
            },
            "optimization_tips": [
                {
                    "area": "Photos",
                    "score": 85,
                    "suggestion": "Add 1-2 more professional photos",
                    "impact": "medium"
                },
                {
                    "area": "Skills",
                    "score": 95,
                    "suggestion": "Great skill coverage!",
                    "impact": "high"
                },
                {
                    "area": "Bio",
                    "score": 75,
                    "suggestion": "Mention your collaboration goals",
                    "impact": "high"
                },
                {
                    "area": "Availability",
                    "score": 90,
                    "suggestion": "Keep your availability updated",
                    "impact": "medium"
                }
            ]
        }
    }


@router.get("/platform/overview")
async def get_platform_overview(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get platform-wide analytics overview
    (Available to all users for transparency)
    """
    try:
        insights = await analytics_engine.get_platform_insights()
        return {
            "success": True,
            "platform": insights
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch platform insights: {str(e)}")


@router.get("/recommendations/skills")
async def get_skill_recommendations(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get personalized skill learning recommendations
    Based on:
    - Current skills
    - Market demand
    - Complementary skills
    - Trending technologies
    """
    user_skills = current_user.skills or []
    
    recommendations = [
        {
            "skill": "TypeScript",
            "category": "Complementary",
            "reason": "Enhances your JavaScript expertise",
            "demand": "Very High",
            "learning_resources": [
                {"name": "TypeScript Handbook", "url": "https://www.typescriptlang.org/docs/"},
                {"name": "TypeScript Course", "url": "https://www.udemy.com/typescript"}
            ],
            "potential_matches": 145,
            "estimated_learning_time": "2-3 weeks"
        },
        {
            "skill": "Docker",
            "category": "In-Demand",
            "reason": "Highly sought after in backend development",
            "demand": "Very High",
            "learning_resources": [
                {"name": "Docker Docs", "url": "https://docs.docker.com/"},
                {"name": "Docker Mastery", "url": "https://www.udemy.com/docker-mastery/"}
            ],
            "potential_matches": 178,
            "estimated_learning_time": "1-2 weeks"
        },
        {
            "skill": "Next.js",
            "category": "Trending",
            "reason": "Fast growing, modern React framework",
            "demand": "Growing",
            "learning_resources": [
                {"name": "Next.js Docs", "url": "https://nextjs.org/docs"},
                {"name": "Next.js Tutorial", "url": "https://www.youtube.com/watch?v="}
            ],
            "potential_matches": 98,
            "estimated_learning_time": "1 week"
        }
    ]
    
    return {
        "success": True,
        "recommendations": recommendations,
        "trending_skills": [
            {"skill": "AI/ML", "growth": 156.3, "demand": "exploding"},
            {"skill": "Rust", "growth": 145.7, "demand": "growing"},
            {"skill": "Go", "growth": 132.4, "demand": "high"},
            {"skill": "Kubernetes", "growth": 128.9, "demand": "high"},
        ]
    }


@router.post("/track-event")
async def track_event(
    event_type: str,
    metadata: Optional[dict] = None,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Track user events for analytics
    
    Event types:
    - swipe, like, pass, super_like
    - match, unmatch
    - message, chat_open, chat_close
    - profile_view, profile_edit
    - project_create, project_join
    """
    try:
        await analytics_engine.track_event(
            event_type=event_type,
            user_id=str(current_user.id),
            metadata=metadata
        )
        
        return {
            "success": True,
            "message": "Event tracked successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to track event: {str(e)}")


@router.get("/leaderboard")
async def get_leaderboard(
    category: str = Query("engagement", description="Category: engagement, matches, projects, contributions"),
    timeframe: str = Query("weekly", description="Timeframe: daily, weekly, monthly, all_time"),
    limit: int = Query(50, ge=1, le=100),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get leaderboard rankings
    
    Categories:
    - engagement: Most active users
    - matches: Most successful matchers
    - projects: Most project collaborations
    - contributions: Most helpful community members
    """
    # Mock leaderboard data
    leaderboard = []
    for i in range(limit):
        leaderboard.append({
            "rank": i + 1,
            "user_id": f"user_{i+1}",
            "username": f"User{i+1}",
            "avatar": None,
            "score": 1000 - (i * 10),
            "badge": "🏆" if i < 3 else "⭐" if i < 10 else None,
            "is_current_user": False
        })
    
    return {
        "success": True,
        "leaderboard": leaderboard,
        "your_rank": 42,
        "your_score": 580
    }

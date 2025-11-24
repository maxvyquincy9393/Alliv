"""
Feed Ranking Engine

Personalized feed ranking based on user interests, engagement, and relevance.
"""
import logging
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import redis.asyncio as redis

from ..config import settings
from ..db import get_db

logger = logging.getLogger(__name__)


class FeedRankingEngine:
    """
    Personalized feed ranking engine.
    
    Ranking Factors:
    - Field match (30%)
    - Tag/interest overlap (25%)
    - Recency (20%)
    - Engagement (15%)
    - Author reputation (10%)
    """
    
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.cache_ttl = 300  # 5 minutes
    
    async def _get_redis_client(self) -> Optional[redis.Redis]:
        """Get Redis client"""
        if not settings.REDIS_URL:
            return None
        
        try:
            if self.redis_client is None:
                self.redis_client = redis.Redis.from_url(
                    settings.REDIS_URL,
                    encoding="utf-8",
                    decode_responses=True
                )
            
            await self.redis_client.ping()
            return self.redis_client
        except Exception as e:
            logger.warning(f"[WARN] Redis unavailable for feed ranking: {e}")
            return None
    
    async def get_personalized_feed(
        self,
        user_id: str,
        user_profile: Dict,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict]:
        """
        Get personalized feed for user.
        
        Args:
            user_id: User ID
            user_profile: User profile data
            limit: Number of posts to return
            offset: Pagination offset
        
        Returns:
            List of ranked posts
        """
        try:
            # Get recent posts (last 7 days)
            cutoff_date = datetime.utcnow() - timedelta(days=7)
            
            posts = await get_db().posts.find({
                'timestamp': {'$gte': cutoff_date},
                'visibility': 'public',
                'moderation_status': {'$in': ['approve', 'approved']},
                'author_id': {'$ne': user_id}  # Exclude own posts
            }).limit(100).to_list(None)
            
            # Score each post
            scored_posts = []
            for post in posts:
                score = await self.calculate_relevance_score(user_profile, post)
                scored_posts.append((post, score))
            
            # Sort by score (descending)
            scored_posts.sort(key=lambda x: x[1], reverse=True)
            
            # Apply pagination
            paginated = scored_posts[offset:offset + limit]
            
            return [post for post, score in paginated]
            
        except Exception as e:
            logger.error(f"Failed to get personalized feed: {e}")
            # Fallback to chronological
            return await self.get_chronological_feed(limit, offset)
    
    async def calculate_relevance_score(
        self,
        user_profile: Dict,
        post: Dict
    ) -> float:
        """
        Calculate relevance score for a post.
        
        Args:
            user_profile: User's profile data
            post: Post data
        
        Returns:
            Relevance score (0.0 - 1.0)
        """
        score = 0.0
        
        # 1. Field match (30%)
        user_field = user_profile.get('field', '')
        post_author_field = post.get('author', {}).get('field', '')
        
        if user_field and post_author_field:
            if user_field == post_author_field:
                score += 0.3
            elif self._are_fields_related(user_field, post_author_field):
                score += 0.15
        
        # 2. Tag/interest overlap (25%)
        user_interests = set(user_profile.get('project_interests', []))
        post_tags = set(post.get('tags', []))
        
        if user_interests and post_tags:
            overlap = len(user_interests & post_tags)
            max_possible = max(len(post_tags), 1)
            tag_score = overlap / max_possible
            score += tag_score * 0.25
        
        # 3. Recency (20%)
        post_time = post.get('timestamp', datetime.utcnow())
        hours_ago = (datetime.utcnow() - post_time).total_seconds() / 3600
        
        # Decay over 7 days (168 hours)
        recency_score = max(0, 1 - (hours_ago / 168))
        score += recency_score * 0.20
        
        # 4. Engagement (15%)
        likes_count = len(post.get('likes', []))
        comments_count = post.get('comment_count', 0)
        shares_count = post.get('share_count', 0)
        
        total_engagement = likes_count + (comments_count * 2) + (shares_count * 3)
        engagement_score = min(1.0, total_engagement / 50)  # Cap at 50
        score += engagement_score * 0.15
        
        # 5. Author reputation (10%)
        author = post.get('author', {})
        author_score = 0.0
        
        if author.get('verified', False):
            author_score += 0.5
        if author.get('premium', False):
            author_score += 0.3
        
        # Normalize to 0-1
        author_score = min(1.0, author_score)
        score += author_score * 0.10
        
        return min(1.0, score)
    
    def _are_fields_related(self, field1: str, field2: str) -> bool:
        """Check if two fields are related"""
        related_fields = {
            'Software Development': ['AI/Machine Learning', 'Data Science', 'DevOps'],
            'AI/Machine Learning': ['Software Development', 'Data Science'],
            'Design': ['UI/UX', 'Graphic Design', 'Product Design'],
            'Marketing': ['Content Writing', 'Social Media', 'Business'],
            'Business': ['Marketing', 'Finance', 'Entrepreneurship']
        }
        
        return field2 in related_fields.get(field1, [])
    
    async def get_chronological_feed(
        self,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict]:
        """
        Get chronological feed (fallback).
        
        Args:
            limit: Number of posts
            offset: Pagination offset
        
        Returns:
            List of posts sorted by timestamp
        """
        try:
            posts = await get_db().posts.find({
                'visibility': 'public',
                'moderation_status': {'$in': ['approve', 'approved']}
            }).sort('timestamp', -1).skip(offset).limit(limit).to_list(None)
            
            return posts
            
        except Exception as e:
            logger.error(f"Failed to get chronological feed: {e}")
            return []
    
    async def get_trending_posts(
        self,
        limit: int = 10,
        hours: int = 24
    ) -> List[Dict]:
        """
        Get trending posts based on engagement velocity.
        
        Args:
            limit: Number of posts
            hours: Time window in hours
        
        Returns:
            List of trending posts
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(hours=hours)
            
            posts = await get_db().posts.find({
                'timestamp': {'$gte': cutoff_date},
                'visibility': 'public',
                'moderation_status': {'$in': ['approve', 'approved']}
            }).to_list(None)
            
            # Calculate engagement velocity
            trending = []
            for post in posts:
                hours_old = (datetime.utcnow() - post['timestamp']).total_seconds() / 3600
                if hours_old == 0:
                    hours_old = 0.1  # Avoid division by zero
                
                engagement = (
                    len(post.get('likes', [])) +
                    post.get('comment_count', 0) * 2 +
                    post.get('share_count', 0) * 3
                )
                
                velocity = engagement / hours_old
                trending.append((post, velocity))
            
            # Sort by velocity
            trending.sort(key=lambda x: x[1], reverse=True)
            
            return [post for post, velocity in trending[:limit]]
            
        except Exception as e:
            logger.error(f"Failed to get trending posts: {e}")
            return []
    
    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.aclose()
            self.redis_client = None


# Singleton instance
_feed_ranking = FeedRankingEngine()


def get_feed_ranking() -> FeedRankingEngine:
    """Get the singleton feed ranking instance"""
    return _feed_ranking

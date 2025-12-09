import re
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ModerationService:
    """
    Service for content moderation using keyword matching and heuristics.
    Designed to be replaced by an external API (e.g. OpenAI, AWS Rekognition) later.
    """
    
    def __init__(self):
        # Basic list of bad words (expanded for production safety)
        # In a real production system, this should be loaded from a secure/updatable source
        self.bad_words = {
            "hate_speech": [
                "hate", "kill", "die", "racist", "nazi", "terrorist" 
                # Add more actual bad words here in a real list
            ],
            "nsfw": [
                "nude", "naked", "sex", "porn", "xxx"
                # Add more NSFW terms
            ],
            "spam": [
                "buy now", "click here", "free money", "crypto guaranteed", "forex trading",
                "whatsapp me", "telegram me"
            ]
        }
        
        # Compile regex patterns for efficiency
        self.patterns = {
            category: re.compile(r'\b(' + '|'.join(map(re.escape, words)) + r')\b', re.IGNORECASE)
            for category, words in self.bad_words.items()
        }
        
    async def check_text(self, text: str) -> Dict[str, Any]:
        """
        Check text for inappropriate content.
        Returns dict with 'flagged': bool, 'categories': list, 'score': float
        """
        if not text:
            return {"flagged": False, "categories": [], "score": 0.0}
            
        flagged_categories = []
        score = 0.0
        
        for category, pattern in self.patterns.items():
            if pattern.search(text):
                flagged_categories.append(category)
                score += 0.5 # Simple scoring
        
        # Cap score
        score = min(1.0, score)
        
        return {
            "flagged": len(flagged_categories) > 0,
            "categories": flagged_categories,
            "score": score,
            "reason": f"Matched categories: {', '.join(flagged_categories)}" if flagged_categories else None
        }

    async def check_image(self, image_url: str) -> Dict[str, Any]:
        """
        Placeholder for image moderation.
        In production, call Cloudinary or AWS Rekognition here.
        """
        # TODO: Implement external image moderation API
        return {"flagged": False, "score": 0.0}

# Global instance
moderation_service = ModerationService()

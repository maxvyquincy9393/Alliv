"""
Feed Moderation Pipeline

Multi-stage content moderation for community feed posts.
Integrates AI moderation, URL safety checks, and manual review queue.
"""
import logging
import re
from typing import Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class FeedModerationPipeline:
    """
    Multi-stage moderation pipeline for feed posts.
    
    Stages:
    1. Text content moderation (AI-powered)
    2. URL safety checking
    3. Image/media moderation
    4. Spam pattern detection
    
    Decisions:
    - approve: Post immediately visible
    - review: Flagged for manual review
    - block: Rejected immediately
    """
    
    def __init__(self):
        self.url_pattern = re.compile(
            r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        )
        self.spam_keywords = [
            'click here', 'buy now', 'limited time', 'act now',
            'guaranteed', 'free money', 'make money fast'
        ]
    
    def extract_urls(self, text: str) -> List[str]:
        """Extract all URLs from text"""
        return self.url_pattern.findall(text)
    
    async def check_url_safety(self, url: str) -> Dict:
        """
        Check if URL is safe (basic validation).
        In production, integrate with Google Safe Browsing API or similar.
        
        Args:
            url: URL to check
        
        Returns:
            Dictionary with 'is_safe' and 'reason'
        """
        # Suspicious TLDs
        suspicious_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq']
        
        for tld in suspicious_tlds:
            if url.endswith(tld):
                return {
                    'is_safe': False,
                    'reason': f'Suspicious TLD: {tld}'
                }
        
        # Check for IP addresses in URL
        if re.search(r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}', url):
            return {
                'is_safe': False,
                'reason': 'IP address in URL'
            }
        
        # Shortened URLs (could hide malicious links)
        short_url_domains = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl']
        if any(domain in url for domain in short_url_domains):
            return {
                'is_safe': False,
                'reason': 'Shortened URL - requires review'
            }
        
        return {'is_safe': True, 'reason': None}
    
    def detect_spam_patterns(self, text: str) -> Dict:
        """
        Detect spam patterns in text.
        
        Args:
            text: Post text
        
        Returns:
            Dictionary with 'is_spam', 'confidence', 'patterns'
        """
        patterns_found = []
        confidence = 0.0
        
        text_lower = text.lower()
        
        # Check for spam keywords
        keyword_count = sum(1 for keyword in self.spam_keywords if keyword in text_lower)
        if keyword_count > 0:
            patterns_found.append(f'{keyword_count} spam keywords')
            confidence += min(0.3, keyword_count * 0.1)
        
        # Excessive capitalization
        if len(text) > 20:
            caps_ratio = sum(1 for c in text if c.isupper()) / len(text)
            if caps_ratio > 0.5:
                patterns_found.append('Excessive capitalization')
                confidence += 0.2
        
        # Excessive exclamation marks
        exclamation_count = text.count('!')
        if exclamation_count > 5:
            patterns_found.append(f'{exclamation_count} exclamation marks')
            confidence += 0.15
        
        # Repeated characters
        if re.search(r'(.)\1{5,}', text):
            patterns_found.append('Repeated characters')
            confidence += 0.2
        
        # Excessive URLs
        urls = self.extract_urls(text)
        if len(urls) > 3:
            patterns_found.append(f'{len(urls)} URLs')
            confidence += 0.25
        
        return {
            'is_spam': confidence > 0.4,
            'confidence': min(1.0, confidence),
            'patterns': patterns_found
        }
    
    async def moderate_post(self, post_content: Dict) -> Dict:
        """
        Run complete moderation pipeline on a post.
        
        Args:
            post_content: Post data including 'text', 'media_urls', etc.
        
        Returns:
            Moderation decision with risk score and issues
        """
        issues = []
        risk_score = 0.0
        
        text = post_content.get('text', '')
        
        # Stage 1: Text moderation using SecurityAI
        try:
            from ..ai_engine import SecurityAI
            
            security_ai = SecurityAI()
            text_mod = await security_ai.detect_inappropriate_content(text)
            
            if text_mod['is_inappropriate']:
                issues.append(f"Inappropriate content: {', '.join(text_mod['categories'])}")
                risk_score += text_mod['confidence']
                
        except Exception as e:
            logger.error(f"Text moderation failed: {e}")
        
        # Stage 2: URL safety checking
        urls = self.extract_urls(text)
        for url in urls:
            url_safety = await self.check_url_safety(url)
            if not url_safety['is_safe']:
                issues.append(f"Suspicious URL: {url_safety['reason']}")
                risk_score += 0.3
        
        # Stage 3: Spam detection
        spam_check = self.detect_spam_patterns(text)
        if spam_check['is_spam']:
            issues.append(f"Spam patterns: {', '.join(spam_check['patterns'])}")
            risk_score += spam_check['confidence']
        
        # Stage 4: Image moderation (placeholder - integrate with AWS Rekognition or similar)
        if post_content.get('media_urls'):
            # In production, check images for inappropriate content
            # For now, just log
            logger.info(f"Image moderation needed for {len(post_content['media_urls'])} images")
        
        # Decision logic
        decision = 'approve'
        if risk_score > 0.8:
            decision = 'block'
        elif risk_score > 0.4:
            decision = 'review'
        
        return {
            'decision': decision,
            'risk_score': min(1.0, risk_score),
            'issues': issues,
            'approved': decision == 'approve',
            'timestamp': datetime.utcnow()
        }
    
    async def flag_for_review(self, post_id: str, moderation_result: Dict):
        """
        Flag post for manual review.
        
        Args:
            post_id: Post ID
            moderation_result: Moderation result
        """
        from ..db import get_db
        
        try:
            await get_db().moderation_queue.insert_one({
                'post_id': post_id,
                'moderation_result': moderation_result,
                'status': 'pending',
                'created_at': datetime.utcnow()
            })
            
            logger.info(f"Post {post_id} flagged for manual review")
            
        except Exception as e:
            logger.error(f"Failed to flag post for review: {e}")


# Singleton instance
_feed_moderation = FeedModerationPipeline()


def get_feed_moderation() -> FeedModerationPipeline:
    """Get the singleton feed moderation instance"""
    return _feed_moderation

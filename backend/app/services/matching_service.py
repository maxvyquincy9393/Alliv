"""
AI-Powered Matching Service
Centralized matching algorithm using AI embeddings and ML-based compatibility scoring
"""
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from dataclasses import dataclass
import logging
import math

logger = logging.getLogger(__name__)


@dataclass
class MatchResult:
    """Result of a match calculation"""
    score: int  # 0-100
    breakdown: Dict[str, float]
    reasons: List[str]
    conversation_starters: Optional[List[str]] = None


class MatchingService:
    """
    Production-grade AI-powered matching service
    
    Combines multiple factors to calculate compatibility:
    - Skill matching with complementary/overlap analysis
    - Interest alignment
    - Field compatibility using synergy matrix
    - Experience level compatibility
    - Availability overlap
    - Location proximity (optional)
    - AI semantic similarity (optional)
    """
    
    def __init__(self, use_ai: bool = False):
        """
        Initialize matching service
        
        Args:
            use_ai: Enable AI-powered semantic matching (requires AI engine)
        """
        self.use_ai = use_ai
        self.ai_engine = None
        
        # Algorithm weights (total = 100%)
        self.weights = {
            'skill_match': 0.30,        # 30% - Skills complementarity
            'interest_match': 0.25,     # 25% - Interests alignment
            'field_compatibility': 0.15, # 15% - Field synergy
            'experience_match': 0.10,   # 10% - Experience level fit
            'availability_match': 0.10, # 10% - Time availability
            'location_proximity': 0.05, # 5% - Location (if provided)
            'ai_semantic': 0.05         # 5% - AI embeddings (if enabled)
        }
        
        # Field synergy matrix (expanded from ai_engine.py)
        self.field_synergy = self._load_field_synergy()
        
        # Skill complementarity pairs
        self.complementary_skills = self._load_complementary_skills()
        
        # Initialize AI engine if enabled
        if use_ai:
            try:
                from ..ai_engine import CollabMatchAI
                self.ai_engine = CollabMatchAI(openai_api_key=None)  # No GPT for now
                logger.info("✅ AI Matching Engine initialized")
            except Exception as e:
                logger.warning(f"❌ Failed to initialize AI engine: {e}")
                logger.info("🔄 Falling back to non-AI matching")
                self.use_ai = False
    
    def _load_field_synergy(self) -> Dict[Tuple[str, str], float]:
        """Load field synergy scores from ai_engine.py logic"""
        return {
            # High synergy pairs (0.9+)
            ("Software Development", "Graphic Design"): 0.95,
            ("AI/Machine Learning", "Data Science"): 0.95,
            ("Backend Development", "Frontend Development"): 0.95,
            ("Entrepreneurship", "Software Development"): 0.93,
            
            # Strong synergy pairs (0.85-0.90)
            ("Marketing", "Content Writing"): 0.89,
            ("Video/Animation", "Music Production"): 0.88,
            ("Research", "Data Science"): 0.90,
            ("Business Strategy", "Technical Development"): 0.88,
            ("Medicine", "AI/Machine Learning"): 0.87,
            ("Design", "Engineering"): 0.87,
            
            # Good synergy pairs (0.80-0.85)
            ("Finance", "Law"): 0.82,
            ("Sales", "Product Development"): 0.84,
            ("Content Creation", "Marketing"): 0.85,
            
            # Cross-domain synergy
            ("Tech", "Business"): 0.88,
            ("Creative", "Tech"): 0.90,
            ("Healthcare", "Tech"): 0.85,
            ("Legal", "Business"): 0.83,
        }
    
    def _load_complementary_skills(self) -> Dict[str, set]:
        """Load complementary skill pairs from advanced_matching.py"""
        return {
            'frontend': {'backend', 'api-development', 'ui-design'},
            'backend': {'frontend', 'devops', 'database'},
            'ui-design': {'frontend', 'ux-design', 'graphic-design'},
            'ux-design': {'ui-design', 'frontend', 'user-research'},
            'data-science': {'backend', 'machine-learning', 'visualization'},
            'machine-learning': {'data-science', 'python', 'ai'},
            'mobile': {'api-development', 'backend', 'ui-design'},
            'devops': {'backend', 'cloud', 'automation'},
            'product-management': {'design', 'engineering', 'business'},
            'marketing': {'content-writing', 'design', 'analytics'},
            'video': {'music', 'animation', 'editing'},
            '3d-modeling': {'animation', 'gaming', 'visualization'},
        }
    
    async def calculate_match_score(
        self,
        user1: Dict,
        user2: Dict,
        context: Optional[Dict] = None
    ) -> MatchResult:
        """
        Calculate AI-powered compatibility score between two users
        
        Args:
            user1: First user profile (current user)
            user2: Second user profile (candidate)
            context: Optional context (e.g., {'distance_km': 5.2})
        
        Returns:
            MatchResult with score (0-100), breakdown, and reasons
        """
        try:
            scores = {}
            reasons = []
            
            # 1. SKILL MATCHING (30%)
            skill_score, skill_reasons = self._calculate_skill_match(user1, user2)
            scores['skill_match'] = skill_score * self.weights['skill_match']
            if skill_score > 0.7:
                reasons.extend(skill_reasons)
            
            # 2. INTEREST ALIGNMENT (25%)
            interest_score, interest_reasons = self._calculate_interest_match(user1, user2)
            scores['interest_match'] = interest_score * self.weights['interest_match']
            if interest_score > 0.7:
                reasons.extend(interest_reasons)
            
            # 3. FIELD COMPATIBILITY (15%)
            field_score, field_reason = self._calculate_field_compatibility(user1, user2)
            scores['field_compatibility'] = field_score * self.weights['field_compatibility']
            if field_score > 0.8 and field_reason:
                reasons.append(field_reason)
            
            # 4. EXPERIENCE MATCH (10%)
            exp_score = self._calculate_experience_match(user1, user2)
            scores['experience_match'] = exp_score * self.weights['experience_match']
            
            # 5. AVAILABILITY MATCH (10%)
            avail_score = self._calculate_availability_match(user1, user2)
            scores['availability_match'] = avail_score * self.weights['availability_match']
            if avail_score > 0.8:
                reasons.append("✅ Great availability overlap")
            
            # 6. LOCATION PROXIMITY (5%)
            if context and 'distance_km' in context:
                location_score = self._calculate_location_score(context['distance_km'])
                scores['location_proximity'] = location_score * self.weights['location_proximity']
                if location_score > 0.8:
                    reasons.append(f"📍 Very close: {context['distance_km']:.1f}km away")
            else:
                scores['location_proximity'] = 0.025  # Default neutral score
            
            # 7. AI SEMANTIC SIMILARITY (5%)
            if self.use_ai and self.ai_engine:
                ai_score = await self._calculate_ai_similarity(user1, user2)
                scores['ai_semantic'] = ai_score * self.weights['ai_semantic']
            else:
                scores['ai_semantic'] = 0.025  # Default neutral score
            
            # Calculate total score (0-1 range)
            total_score_normalized = sum(scores.values())
            
            # Convert to 0-100 scale
            total_score = int(total_score_normalized * 100)
            
            # Ensure score is in valid range
            total_score = max(0, min(100, total_score))
            
            # Generate conversation starters if high match
            conversation_starters = None
            if total_score >= 70 and self.use_ai and self.ai_engine:
                try:
                    conversation_starters = await self.ai_engine.generate_conversation_starters(
                        user1, user2, reasons
                    )
                except Exception as e:
                    logger.warning(f"Failed to generate conversation starters: {e}")
            
            # Fallback conversation starters if no AI
            if not conversation_starters and total_score >= 70:
                conversation_starters = self._generate_simple_starters(user1, user2, reasons)
            
            return MatchResult(
                score=total_score,
                breakdown=scores,
                reasons=reasons[:5],  # Top 5 reasons
                conversation_starters=conversation_starters
            )
            
        except Exception as e:
            logger.error(f"[ERROR] Match calculation failed: {e}")
            # Return default low score on error
            return MatchResult(
                score=0,
                breakdown={},
                reasons=["⚠️ Unable to calculate compatibility"]
            )
    
    def _calculate_skill_match(self, user1: Dict, user2: Dict) -> Tuple[float, List[str]]:
        """
        Calculate skill matching score with complementary and overlap analysis
        
        Returns:
            (score, reasons): Score 0-1 and list of reasons
        """
        skills1 = set(s.lower().strip() for s in user1.get('skills', []))
        skills2 = set(s.lower().strip() for s in user2.get('skills', []))
        
        if not skills1 or not skills2:
            return (0.3, [])  # Neutral score if no skills
        
        reasons = []
        
        # Calculate overlap (shared skills)
        overlap = skills1.intersection(skills2)
        overlap_score = len(overlap) / len(skills1.union(skills2)) if skills1.union(skills2) else 0
        
        if overlap:
            reasons.append(f"✅ Shared skills: {', '.join(list(overlap)[:3])}")
        
        # Calculate complementary score (different but useful together)
        complementary_count = 0
        complementary_pairs = []
        
        for skill1 in skills1:
            for skill2 in skills2:
                if skill2 in self.complementary_skills.get(skill1, set()):
                    complementary_count += 1
                    if len(complementary_pairs) < 2:
                        complementary_pairs.append(f"{skill1} + {skill2}")
        
        # Normalize complementary score
        max_possible = min(len(skills1), len(skills2))
        complementary_score = complementary_count / max(max_possible, 1) if max_possible > 0 else 0
        
        if complementary_pairs:
            reasons.append(f"🔗 Complementary skills: {', '.join(complementary_pairs)}")
        
        # Combine scores: 40% overlap + 60% complementary
        final_score = (overlap_score * 0.4) + (complementary_score * 0.6)
        
        return (min(1.0, final_score), reasons)
    
    def _calculate_interest_match(self, user1: Dict, user2: Dict) -> Tuple[float, List[str]]:
        """Calculate interest alignment score"""
        interests1 = set(i.lower().strip() for i in user1.get('interests', []))
        interests2 = set(i.lower().strip() for i in user2.get('interests', []))
        
        if not interests1 or not interests2:
            return (0.5, [])  # Neutral
        
        overlap = interests1.intersection(interests2)
        total = interests1.union(interests2)
        
        score = len(overlap) / len(total) if total else 0
        
        reasons = []
        if overlap and score > 0.5:
            reasons.append(f"💡 Common interests: {', '.join(list(overlap)[:3])}")
        
        return (score, reasons)
    
    def _calculate_field_compatibility(self, user1: Dict, user2: Dict) -> Tuple[float, Optional[str]]:
        """Calculate field compatibility using synergy matrix"""
        field1 = user1.get('field', '').strip()
        field2 = user2.get('field', '').strip()
        
        if not field1 or not field2:
            return (0.5, None)
        
        # Check synergy matrix
        synergy = self.field_synergy.get((field1, field2)) or \
                  self.field_synergy.get((field2, field1))
        
        if synergy:
            return (synergy, f"🎯 Perfect field match: {field1} + {field2}")
        
        # Same field but different specialization
        if field1.lower() == field2.lower():
            return (0.7, f"📚 Same field: {field1}")
        
        # Partial match
        if field1.lower() in field2.lower() or field2.lower() in field1.lower():
            return (0.6, None)
        
        # Different fields
        return (0.4, None)
    
    def _calculate_experience_match(self, user1: Dict, user2: Dict) -> float:
        """Calculate experience level compatibility from advanced_matching.py"""
        exp_map = {
            'beginner': 1,
            'junior': 2,
            'intermediate': 3,
            'mid-level': 3,
            'senior': 4,
            'advanced': 4,
            'expert': 5
        }
        
        exp1 = exp_map.get(user1.get('experience_level', 'intermediate').lower(), 3)
        exp2 = exp_map.get(user2.get('experience_level', 'intermediate').lower(), 3)
        
        diff = abs(exp1 - exp2)
        
        # Sweet spot: same level or 1 level difference (mentoring)
        if diff == 0:
            return 0.9
        elif diff == 1:
            return 1.0  # Ideal for mentoring
        elif diff == 2:
            return 0.6
        else:
            return 0.3
    
    def _calculate_availability_match(self, user1: Dict, user2: Dict) -> float:
        """Calculate availability overlap"""
        avail1 = user1.get('availability_hours_per_week', 10)
        avail2 = user2.get('availability_hours_per_week', 10)
        
        # Similar availability is better
        if avail1 == 0 or avail2 == 0:
            return 0.5
        
        diff_ratio = abs(avail1 - avail2) / max(avail1, avail2)
        
        if diff_ratio < 0.2:
            return 0.95
        elif diff_ratio < 0.4:
            return 0.75
        elif diff_ratio < 0.6:
            return 0.55
        else:
            return 0.35
    
    def _calculate_location_score(self, distance_km: float) -> float:
        """Calculate location proximity score (from advanced_matching.py)"""
        if distance_km < 5:
            return 1.0
        elif distance_km < 10:
            return 0.9
        elif distance_km < 25:
            return 0.7
        elif distance_km < 50:
            return 0.5
        elif distance_km < 100:
            return 0.3
        else:
            return 0.1
    
    async def _calculate_ai_similarity(self, user1: Dict, user2: Dict) -> float:
        """Calculate AI semantic similarity if embeddings exist"""
        try:
            if not self.ai_engine:
                return 0.5
            
            # Get or create embeddings
            emb1 = user1.get('ai_embedding')
            emb2 = user2.get('ai_embedding')
            
            if not emb1:
                emb1 = await self.ai_engine.create_user_embedding(user1)
            if not emb2:
                emb2 = await self.ai_engine.create_user_embedding(user2)
            
            # Calculate cosine similarity
            similarity = self.ai_engine._calculate_ai_similarity(emb1, emb2)
            
            return similarity
            
        except Exception as e:
            logger.warning(f"AI similarity calculation failed: {e}")
            return 0.5
    
    def _generate_simple_starters(
        self, user1: Dict, user2: Dict, reasons: List[str]
    ) -> List[str]:
        """Generate simple conversation starters without GPT"""
        starters = []
        
        # Based on shared skills
        skills1 = set(user1.get('skills', []))
        skills2 = set(user2.get('skills', []))
        shared_skills = skills1.intersection(skills2)
        
        if shared_skills:
            skill = list(shared_skills)[0]
            starters.append(
                f"Hi! I noticed we both have {skill} in our skillset. "
                f"What's your favorite project using it?"
            )
        
        # Based on shared interests
        interests1 = set(user1.get('interests', []))
        interests2 = set(user2.get('interests', []))
        shared_interests = interests1.intersection(interests2)
        
        if shared_interests:
            interest = list(shared_interests)[0]
            starters.append(
                f"Hey! Looks like we're both interested in {interest}. "
                f"Have you worked on any cool projects related to this?"
            )
        
        # Based on field
        if user1.get('field') and user2.get('field'):
            starters.append(
                f"Hi! Your {user2.get('field')} background looks interesting. "
                f"I'd love to explore potential collaboration ideas!"
            )
        
        # Generic professional starter
        if not starters:
            starters = [
                "Hi! Your profile caught my attention. What kind of projects are you currently working on?",
                "Hey! I think we could build something amazing together. Want to discuss some ideas?",
                "Hello! Love your background. What's your dream collaboration project?"
            ]
        
        return starters[:3]


# Singleton instance
_matching_service_instance = None


def get_matching_service(use_ai: bool = False) -> MatchingService:
    """
    Get singleton matching service instance
    
    Args:
        use_ai: Enable AI-powered matching (set via environment variable)
    
    Returns:
        MatchingService instance
    """
    global _matching_service_instance
    
    if _matching_service_instance is None:
        _matching_service_instance = MatchingService(use_ai=use_ai)
        logger.info(f"✅ Matching service initialized (AI: {use_ai})")
    
    return _matching_service_instance

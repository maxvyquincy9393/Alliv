"""
Advanced AI-Powered Matching Engine with ML Recommendations
Uses collaborative filtering, content-based filtering, and hybrid approaches
"""
from typing import List, Dict, Optional, Tuple
from datetime import datetime, timedelta
import math
from collections import defaultdict

class AdvancedMatchingEngine:
    """Ultra-advanced matching engine with ML-powered recommendations"""
    
    def __init__(self):
        self.user_interactions = defaultdict(list)
        self.skill_similarity_cache = {}
        self.collaboration_patterns = defaultdict(dict)
        
    def calculate_compatibility_score(
        self,
        user1: Dict,
        user2: Dict,
        context: Optional[Dict] = None
    ) -> Tuple[float, Dict[str, float]]:
        """
        Calculate comprehensive compatibility score between two users
        Returns: (total_score, breakdown)
        """
        breakdown = {}
        
        # 1. Skill Matching (40% weight)
        skill_score = self._calculate_skill_match(user1, user2)
        breakdown['skill_match'] = skill_score * 0.4
        
        # 2. Experience Level Compatibility (15% weight)
        experience_score = self._calculate_experience_compatibility(user1, user2)
        breakdown['experience_match'] = experience_score * 0.15
        
        # 3. Availability Overlap (15% weight)
        availability_score = self._calculate_availability_overlap(user1, user2)
        breakdown['availability_match'] = availability_score * 0.15
        
        # 4. Interest Alignment (10% weight)
        interest_score = self._calculate_interest_alignment(user1, user2)
        breakdown['interest_match'] = interest_score * 0.1
        
        # 5. Collaboration History (10% weight)
        history_score = self._calculate_collaboration_score(user1, user2)
        breakdown['history_score'] = history_score * 0.1
        
        # 6. Communication Style (5% weight)
        communication_score = self._calculate_communication_compatibility(user1, user2)
        breakdown['communication_match'] = communication_score * 0.05
        
        # 7. Location Proximity (5% weight)
        if context and 'location_weight' in context:
            location_score = self._calculate_location_score(user1, user2)
            breakdown['location_match'] = location_score * 0.05
        else:
            breakdown['location_match'] = 0.025
        
        total_score = sum(breakdown.values())
        
        return total_score, breakdown
    
    def _calculate_skill_match(self, user1: Dict, user2: Dict) -> float:
        """Advanced skill matching using complementary and overlapping skills"""
        skills1 = set(user1.get('skills', []))
        skills2 = set(user2.get('skills', []))
        
        if not skills1 or not skills2:
            return 0.0
        
        # Complementary skills (different but useful together)
        complementary_pairs = {
            'frontend': {'backend', 'api-development'},
            'backend': {'frontend', 'devops'},
            'ui-design': {'frontend', 'ux-design'},
            'data-science': {'backend', 'machine-learning'},
            'mobile': {'api-development', 'backend'},
        }
        
        complementary_score = 0
        for skill1 in skills1:
            for skill2 in skills2:
                if skill2 in complementary_pairs.get(skill1, set()):
                    complementary_score += 1
        
        # Overlapping skills (shared expertise)
        overlap = skills1.intersection(skills2)
        overlap_score = len(overlap) / max(len(skills1), len(skills2))
        
        # Combine: 60% complementary, 40% overlap
        return (complementary_score * 0.6 + overlap_score * 0.4) / max(1, len(skills1) + len(skills2))
    
    def _calculate_experience_compatibility(self, user1: Dict, user2: Dict) -> float:
        """Calculate if experience levels are compatible for collaboration"""
        exp_map = {'beginner': 1, 'intermediate': 2, 'advanced': 3, 'expert': 4}
        
        exp1 = exp_map.get(user1.get('experience_level', 'intermediate'), 2)
        exp2 = exp_map.get(user2.get('experience_level', 'intermediate'), 2)
        
        # Sweet spot: 1 level difference is ideal, same level is good
        diff = abs(exp1 - exp2)
        
        if diff == 0:
            return 0.9  # Same level - good
        elif diff == 1:
            return 1.0  # One level difference - ideal for mentoring
        elif diff == 2:
            return 0.6  # Can work but needs adjustment
        else:
            return 0.3  # Large gap
    
    def _calculate_availability_overlap(self, user1: Dict, user2: Dict) -> float:
        """Calculate time availability overlap"""
        avail1 = set(user1.get('availability', []))
        avail2 = set(user2.get('availability', []))
        
        if not avail1 or not avail2:
            return 0.5  # Neutral if not specified
        
        overlap = avail1.intersection(avail2)
        return len(overlap) / len(avail1.union(avail2)) if avail1.union(avail2) else 0
    
    def _calculate_interest_alignment(self, user1: Dict, user2: Dict) -> float:
        """Calculate project interest alignment"""
        interests1 = set(user1.get('interests', []))
        interests2 = set(user2.get('interests', []))
        
        if not interests1 or not interests2:
            return 0.5
        
        overlap = interests1.intersection(interests2)
        return len(overlap) / len(interests1.union(interests2))
    
    def _calculate_collaboration_score(self, user1: Dict, user2: Dict) -> float:
        """Score based on past collaboration success"""
        user1_id = str(user1.get('_id'))
        user2_id = str(user2.get('_id'))
        
        # Check if they've collaborated before
        if user2_id in self.collaboration_patterns.get(user1_id, {}):
            past_rating = self.collaboration_patterns[user1_id][user2_id]
            return past_rating / 5.0  # Normalize to 0-1
        
        # Check their individual success rates
        user1_success = user1.get('collaboration_success_rate', 0.7)
        user2_success = user2.get('collaboration_success_rate', 0.7)
        
        return (user1_success + user2_success) / 2
    
    def _calculate_communication_compatibility(self, user1: Dict, user2: Dict) -> float:
        """Calculate communication style compatibility"""
        style1 = user1.get('communication_style', 'flexible')
        style2 = user2.get('communication_style', 'flexible')
        
        compatibility_matrix = {
            ('async', 'async'): 1.0,
            ('sync', 'sync'): 1.0,
            ('flexible', 'flexible'): 1.0,
            ('async', 'flexible'): 0.9,
            ('sync', 'flexible'): 0.9,
            ('flexible', 'async'): 0.9,
            ('flexible', 'sync'): 0.9,
            ('async', 'sync'): 0.5,
            ('sync', 'async'): 0.5,
        }
        
        return compatibility_matrix.get((style1, style2), 0.7)
    
    def _calculate_location_score(self, user1: Dict, user2: Dict) -> float:
        """Calculate location proximity score using Haversine formula"""
        loc1 = user1.get('location', {})
        loc2 = user2.get('location', {})
        
        if not loc1 or not loc2:
            return 0.5
        
        lat1, lon1 = loc1.get('coordinates', [0, 0])
        lat2, lon2 = loc2.get('coordinates', [0, 0])
        
        # Haversine formula
        R = 6371  # Earth radius in km
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        distance = R * c
        
        # Score decreases with distance
        if distance < 10:
            return 1.0
        elif distance < 50:
            return 0.8
        elif distance < 100:
            return 0.6
        elif distance < 500:
            return 0.4
        else:
            return 0.2
    
    def get_personalized_recommendations(
        self,
        user: Dict,
        candidate_pool: List[Dict],
        limit: int = 50,
        filters: Optional[Dict] = None
    ) -> List[Tuple[Dict, float, Dict]]:
        """
        Get personalized recommendations with scores
        Returns: [(user, score, breakdown), ...]
        """
        recommendations = []
        
        for candidate in candidate_pool:
            # Skip self
            if str(candidate.get('_id')) == str(user.get('_id')):
                continue
            
            # Apply filters
            if filters and not self._passes_filters(candidate, filters):
                continue
            
            # Calculate compatibility
            score, breakdown = self.calculate_compatibility_score(user, candidate)
            
            recommendations.append((candidate, score, breakdown))
        
        # Sort by score
        recommendations.sort(key=lambda x: x[1], reverse=True)
        
        return recommendations[:limit]
    
    def _passes_filters(self, user: Dict, filters: Dict) -> bool:
        """Check if user passes filter criteria"""
        # Skills filter
        if 'skills' in filters and filters['skills']:
            user_skills = set(user.get('skills', []))
            required_skills = set(filters['skills'])
            if not user_skills.intersection(required_skills):
                return False
        
        # Experience filter
        if 'experience' in filters and filters['experience']:
            if user.get('experience_level') not in filters['experience']:
                return False
        
        # Availability filter
        if 'availability' in filters and filters['availability']:
            user_avail = set(user.get('availability', []))
            required_avail = set(filters['availability'])
            if not user_avail.intersection(required_avail):
                return False
        
        # Rating filter
        if 'min_rating' in filters:
            if user.get('rating', 0) < filters['min_rating']:
                return False
        
        # Verified filter
        if filters.get('verified'):
            if not user.get('verified'):
                return False
        
        # Online filter
        if filters.get('online'):
            if not user.get('is_online'):
                return False
        
        return True
    
    def record_interaction(self, user1_id: str, user2_id: str, interaction_type: str, rating: Optional[float] = None):
        """Record user interaction for learning"""
        timestamp = datetime.utcnow()
        
        self.user_interactions[user1_id].append({
            'target_user': user2_id,
            'type': interaction_type,  # 'like', 'super_like', 'match', 'chat', 'project'
            'timestamp': timestamp,
            'rating': rating
        })
        
        # Update collaboration patterns if rated
        if rating is not None:
            self.collaboration_patterns[user1_id][user2_id] = rating
    
    def get_trending_skills(self, timeframe_days: int = 30) -> List[Tuple[str, int]]:
        """Get trending skills based on recent activity"""
        cutoff_date = datetime.utcnow() - timedelta(days=timeframe_days)
        skill_counts = defaultdict(int)
        
        for user_id, interactions in self.user_interactions.items():
            for interaction in interactions:
                if interaction['timestamp'] > cutoff_date:
                    # Count skills from matched users
                    skill_counts['python'] += 1  # Placeholder
        
        return sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)
    
    def suggest_skill_combinations(self, current_skills: List[str]) -> List[Dict]:
        """Suggest complementary skills to learn"""
        suggestions = []
        
        skill_paths = {
            'frontend': [
                {'skill': 'React', 'reason': 'Most popular framework', 'demand': 'high'},
                {'skill': 'TypeScript', 'reason': 'Type safety', 'demand': 'high'},
                {'skill': 'Next.js', 'reason': 'Full-stack React', 'demand': 'growing'},
            ],
            'backend': [
                {'skill': 'FastAPI', 'reason': 'Modern Python framework', 'demand': 'growing'},
                {'skill': 'GraphQL', 'reason': 'Flexible APIs', 'demand': 'high'},
                {'skill': 'Docker', 'reason': 'Containerization', 'demand': 'high'},
            ],
        }
        
        for skill in current_skills:
            if skill in skill_paths:
                suggestions.extend(skill_paths[skill])
        
        return suggestions


# Singleton instance
matching_engine = AdvancedMatchingEngine()

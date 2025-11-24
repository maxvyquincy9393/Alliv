"""
AI Engine for Smart Matching and Recommendations
"""
import numpy as np
from typing import List, Dict, Any, Tuple, Optional
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import openai
import asyncio
from datetime import datetime, timedelta
import json
from concurrent.futures import ProcessPoolExecutor
import redis.asyncio as aioredis


# Global worker function for ProcessPoolExecutor
# This runs in child processes and initializes its own encoder
def _encode_text_worker(text: str, model_name: str = 'all-MiniLM-L6-v2') -> np.ndarray:
    """
    Worker function that runs in a separate process.
    Initializes its own SentenceTransformer to avoid pickling issues.
    """
    encoder = SentenceTransformer(model_name)
    embedding = encoder.encode(text)
    return embedding


class CollabMatchAI:
    """AI-powered matching and recommendation engine"""
    
    def __init__(self, openai_api_key: str = None, redis_client: Optional[aioredis.Redis] = None):
        """Initialize AI models"""
        # Sentence transformer for embeddings (kept for backward compatibility)
        self.encoder = SentenceTransformer('all-MiniLM-L6-v2')
        self.model_name = 'all-MiniLM-L6-v2'
        
        # ProcessPoolExecutor for CPU-bound encoding tasks
        # Using 4 workers for parallel processing without overwhelming the system
        self.process_pool = ProcessPoolExecutor(max_workers=4)
        
        # Redis client for caching expensive AI operations
        self.redis = redis_client
        self.cache_ttl = 3600  # 1 hour cache TTL
        
        # OpenAI for advanced features
        if openai_api_key:
            openai.api_key = openai_api_key
            self.use_gpt = True
        else:
            self.use_gpt = False
        
        # Skill compatibility matrix
        self.skill_compatibility = self._load_skill_compatibility()
        
        # Field synergy matrix
        self.field_synergy = self._load_field_synergy()
    
    def _load_skill_compatibility(self) -> Dict:
        """Load skill compatibility scores"""
        return {
            # Tech combinations
            ("Backend", "Frontend"): 0.95,
            ("AI/ML", "Data Science"): 0.90,
            ("DevOps", "Backend"): 0.85,
            ("UI/UX", "Frontend"): 0.90,
            ("Mobile", "Backend"): 0.85,
            
            # Creative combinations
            ("Design", "Developer"): 0.90,
            ("Video", "Music"): 0.85,
            ("Writing", "Marketing"): 0.88,
            ("3D", "Gaming"): 0.92,
            
            # Business combinations
            ("Marketing", "Sales"): 0.85,
            ("Finance", "Business"): 0.88,
            ("Product", "Engineering"): 0.92,
            ("Strategy", "Operations"): 0.87,
            
            # Cross-field combinations
            ("Tech", "Business"): 0.88,
            ("Creative", "Tech"): 0.90,
            ("Healthcare", "Tech"): 0.85,
            ("Legal", "Business"): 0.83,
        }
    
    def _load_field_synergy(self) -> Dict:
        """Load field synergy scores"""
        return {
            # High synergy pairs
            ("Software Development", "Graphic Design"): 0.90,
            ("AI/Machine Learning", "Data Science"): 0.95,
            ("Marketing", "Content Writing"): 0.88,
            ("Finance", "Law"): 0.82,
            ("Medicine", "AI/Machine Learning"): 0.87,
            ("Video/Animation", "Music Production"): 0.85,
            ("Entrepreneurship", "Software Development"): 0.93,
            ("Research", "Data Science"): 0.90,
            
            # Complementary pairs
            ("Backend Development", "Frontend Development"): 0.95,
            ("Business Strategy", "Technical Development"): 0.88,
            ("Design", "Engineering"): 0.87,
            ("Content Creation", "Marketing"): 0.89,
            ("Sales", "Product Development"): 0.84,
        }
    
    async def create_user_embedding(self, user_profile: Dict) -> np.ndarray:
        """Create AI embedding for user profile"""
        # Combine all text fields
        text_representation = f"""
        Field: {user_profile.get('field')}
        Role: {user_profile.get('role')}
        Skills: {', '.join(user_profile.get('skills', []))}
        Bio: {user_profile.get('bio')}
        Interests: {', '.join(user_profile.get('project_interests', []))}
        Values: {', '.join(user_profile.get('values', []))}
        Work Style: {', '.join(user_profile.get('work_style', []))}
        Experience: {user_profile.get('experience_level')}
        """
        
        # Generate embedding in a separate PROCESS to avoid blocking the event loop
        # ProcessPoolExecutor bypasses Python's GIL for true CPU parallelism
        loop = asyncio.get_running_loop()
        embedding = await loop.run_in_executor(
            self.process_pool,
            _encode_text_worker,
            text_representation,
            self.model_name
        )
        return embedding
    
    async def get_match_score_cached(
        self,
        user1_id: str,
        user2_id: str,
        user1: Dict,
        user2: Dict,
        use_ml: bool = True
    ) -> Tuple[float, Dict[str, float], List[str]]:
        """
        Get match score with Redis caching to avoid recomputing expensive operations.
        Cache key is deterministic (sorted user IDs) to ensure consistency.
        
        Args:
            user1_id: First user's ID
            user2_id: Second user's ID
            user1: First user's profile data
            user2: Second user's profile data
            use_ml: Whether to use ML-based scoring
            
        Returns:
            Tuple of (total_score, score_breakdown, match_reasons)
        """
        # Create deterministic cache key (sorted to ensure same key for A-B and B-A)
        cache_key = f"match:{min(user1_id, user2_id)}:{max(user1_id, user2_id)}"
        
        # Try to get from cache if Redis is available
        if self.redis:
            try:
                cached = await self.redis.get(cache_key)
                if cached:
                    result = json.loads(cached)
                    # Convert lists back to proper types
                    return (
                        result['score'],
                        result['breakdown'],
                        result['reasons']
                    )
            except Exception as e:
                # Log but don't fail on cache errors
                pass
        
        # Cache miss or no Redis - compute the score
        score, breakdown, reasons = await self.calculate_match_score(
            user1, user2, use_ml
        )
        
        # Store in cache if Redis is available
        if self.redis:
            try:
                cache_value = json.dumps({
                    'score': score,
                    'breakdown': breakdown,
                    'reasons': reasons
                })
                await self.redis.setex(cache_key, self.cache_ttl, cache_value)
            except Exception as e:
                # Log but don't fail on cache errors
                pass
        
        return score, breakdown, reasons
    
    async def calculate_match_score(
        self, 
        user1: Dict, 
        user2: Dict,
        use_ml: bool = True
    ) -> Tuple[float, Dict[str, float], List[str]]:
        """
        Calculate comprehensive match score between two users.
        This is the core computation method - use get_match_score_cached() for cached access.
        
        Returns: (total_score, score_breakdown, match_reasons)
        """
        scores = {}
        reasons = []
        
        # 1. Field Compatibility Score (20%)
        field_score = self._calculate_field_compatibility(user1, user2)
        scores['field_compatibility'] = field_score * 0.20
        if field_score > 0.8:
            reasons.append(f"Perfect field match: {user1['field']} + {user2['field']}")
        
        # 2. Skill Complementarity Score (20%)
        skill_score = self._calculate_skill_match(user1, user2)
        scores['skill_match'] = skill_score * 0.20
        if skill_score > 0.7:
            shared_skills = set(user1.get('skills', [])) & set(user2.get('skills', []))
            if shared_skills:
                reasons.append(f"Shared skills: {', '.join(list(shared_skills)[:3])}")
        
        # 3. Experience Balance Score (15%)
        exp_score = self._calculate_experience_match(user1, user2)
        scores['experience_balance'] = exp_score * 0.15
        
        # 4. Availability Match Score (15%)
        avail_score = self._calculate_availability_match(user1, user2)
        scores['availability'] = avail_score * 0.15
        if avail_score > 0.8:
            reasons.append("Great availability match")
        
        # 5. Location/Timezone Score (10%)
        location_score = self._calculate_location_match(user1, user2)
        scores['location'] = location_score * 0.10
        
        # 6. Values & Work Style Match (10%)
        values_score = self._calculate_values_match(user1, user2)
        scores['values_alignment'] = values_score * 0.10
        if values_score > 0.8:
            shared_values = set(user1.get('values', [])) & set(user2.get('values', []))
            if shared_values:
                reasons.append(f"Aligned on: {', '.join(list(shared_values)[:2])}")
        
        # 7. AI Semantic Similarity (10%)
        if use_ml and user1.get('ai_embedding') and user2.get('ai_embedding'):
            ai_score = self._calculate_ai_similarity(
                user1['ai_embedding'], 
                user2['ai_embedding']
            )
            scores['ai_compatibility'] = ai_score * 0.10
        else:
            scores['ai_compatibility'] = 0.05  # Default score
        
        # Calculate total
        total_score = sum(scores.values())
        
        # Boost for specific high-value combinations
        boost = self._calculate_special_boost(user1, user2)
        total_score = min(1.0, total_score + boost)
        
        if boost > 0:
            reasons.append("High-potential collaboration detected!")
        
        return total_score, scores, reasons
    
    def _calculate_field_compatibility(self, user1: Dict, user2: Dict) -> float:
        """Calculate field compatibility score"""
        field1 = user1.get('field', '')
        field2 = user2.get('field', '')
        
        # Check direct synergy
        if (field1, field2) in self.field_synergy:
            return self.field_synergy[(field1, field2)]
        elif (field2, field1) in self.field_synergy:
            return self.field_synergy[(field2, field1)]
        
        # Same field but different roles
        if field1 == field2:
            if user1.get('role') != user2.get('role'):
                return 0.7  # Good for same field, different specialization
            else:
                return 0.4  # Lower score for identical profiles
        
        # Default cross-field score
        return 0.5
    
    def _calculate_skill_match(self, user1: Dict, user2: Dict) -> float:
        """Calculate skill complementarity and overlap"""
        skills1 = set(user1.get('skills', []))
        skills2 = set(user2.get('skills', []))
        
        if not skills1 or not skills2:
            return 0.3
        
        # Some overlap is good, but not too much
        overlap = len(skills1 & skills2)
        total = len(skills1 | skills2)
        
        if total == 0:
            return 0.3
        
        overlap_ratio = overlap / total
        
        # Optimal overlap is 20-40%
        if 0.2 <= overlap_ratio <= 0.4:
            return 0.9
        elif overlap_ratio < 0.2:
            return 0.6  # Too different
        else:
            return 0.5  # Too similar
    
    def _calculate_experience_match(self, user1: Dict, user2: Dict) -> float:
        """Calculate experience level compatibility"""
        exp_levels = {
            "Student": 0,
            "Junior (0-2 years)": 1,
            "Mid-level (2-5 years)": 2,
            "Senior (5-10 years)": 3,
            "Expert (10+ years)": 4,
            "Mentor/Advisor": 5
        }
        
        level1 = exp_levels.get(user1.get('experience_level', 'Junior'), 1)
        level2 = exp_levels.get(user2.get('experience_level', 'Junior'), 1)
        
        diff = abs(level1 - level2)
        
        # Similar levels or mentor-student pairs are good
        if diff <= 1:
            return 0.9
        elif diff >= 4:  # Mentor-student relationship
            return 0.85
        elif diff == 2:
            return 0.7
        else:
            return 0.5
    
    def _calculate_availability_match(self, user1: Dict, user2: Dict) -> float:
        """Calculate availability compatibility"""
        hours1 = user1.get('availability_hours_per_week', 10)
        hours2 = user2.get('availability_hours_per_week', 10)
        
        # Similar availability is better
        diff_ratio = abs(hours1 - hours2) / max(hours1, hours2)
        
        if diff_ratio < 0.2:
            return 0.95
        elif diff_ratio < 0.4:
            return 0.75
        elif diff_ratio < 0.6:
            return 0.55
        else:
            return 0.35
    
    def _calculate_location_match(self, user1: Dict, user2: Dict) -> float:
        """Calculate location/timezone compatibility"""
        # If both are remote-only, location doesn't matter
        if user1.get('remote_only') and user2.get('remote_only'):
            return 0.9
        
        # Same country
        if user1.get('location_country') == user2.get('location_country'):
            # Same city
            if user1.get('location_city') == user2.get('location_city'):
                return 1.0
            else:
                return 0.8
        
        # Check timezone difference
        tz1 = user1.get('timezone', 'UTC')
        tz2 = user2.get('timezone', 'UTC')
        
        # Simplified timezone compatibility (would need proper timezone library)
        if tz1 == tz2:
            return 0.7
        else:
            return 0.4
    
    def _calculate_values_match(self, user1: Dict, user2: Dict) -> float:
        """Calculate values and work style alignment"""
        values1 = set(user1.get('values', []))
        values2 = set(user2.get('values', []))
        
        style1 = set(user1.get('work_style', []))
        style2 = set(user2.get('work_style', []))
        
        if not values1 and not style1:
            return 0.5
        
        # Calculate overlap
        values_overlap = len(values1 & values2) / max(len(values1 | values2), 1)
        style_overlap = len(style1 & style2) / max(len(style1 | style2), 1)
        
        return (values_overlap * 0.6 + style_overlap * 0.4)
    
    def _calculate_ai_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between embeddings"""
        if not embedding1 or not embedding2:
            return 0.5
        
        # Convert to numpy arrays
        emb1 = np.array(embedding1).reshape(1, -1)
        emb2 = np.array(embedding2).reshape(1, -1)
        
        # Calculate cosine similarity
        similarity = cosine_similarity(emb1, emb2)[0][0]
        
        # Normalize to 0-1 range
        return (similarity + 1) / 2
    
    def _calculate_special_boost(self, user1: Dict, user2: Dict) -> float:
        """Calculate special boost for high-value combinations"""
        boost = 0.0
        
        # Entrepreneur + Technical co-founder
        if (user1.get('field') == 'Entrepreneurship' and 
            'Software Development' in user2.get('field', '')):
            boost += 0.1
        
        # AI + Healthcare
        if ('AI' in user1.get('field', '') and 'Health' in user2.get('field', '')) or \
           ('Health' in user1.get('field', '') and 'AI' in user2.get('field', '')):
            boost += 0.08
        
        # Designer + Developer
        if ('Design' in user1.get('field', '') and 'Develop' in user2.get('field', '')) or \
           ('Develop' in user1.get('field', '') and 'Design' in user2.get('field', '')):
            boost += 0.07
        
        return boost
    
    async def generate_conversation_starters(
        self, 
        user1: Dict, 
        user2: Dict,
        match_reasons: List[str]
    ) -> List[str]:
        """Generate AI-powered conversation starters"""
        starters = []
        
        # Basic starters based on match reasons
        if "Perfect field match" in str(match_reasons):
            starters.append(f"Hi! I see we're both in {user1.get('field')}. What project are you most excited about?")
        
        # Skill-based starters
        shared_skills = set(user1.get('skills', [])) & set(user2.get('skills', []))
        if shared_skills:
            skill = list(shared_skills)[0]
            starters.append(f"Hey! I noticed we both know {skill}. What's your favorite project using it?")
        
        # Interest-based starters
        shared_interests = set(user1.get('project_interests', [])) & set(user2.get('project_interests', []))
        if shared_interests:
            interest = list(shared_interests)[0]
            starters.append(f"Hi! Looks like we're both interested in {interest}. Have any cool ideas?")
        
        # GPT-powered starters (if available)
        if self.use_gpt and len(starters) < 3:
            try:
                gpt_starters = await self._generate_gpt_starters(user1, user2)
                starters.extend(gpt_starters)
            except:
                pass
        
        # Default starters
        if not starters:
            starters = [
                "Hi! Your profile caught my attention. What kind of projects are you working on?",
                "Hey! I think we could build something amazing together. What's your dream project?",
                "Hello! Love your background. Want to discuss potential collaboration ideas?"
            ]
        
        return starters[:5]  # Return top 5
    
    async def _generate_gpt_starters(self, user1: Dict, user2: Dict) -> List[str]:
        """Use GPT to generate personalized conversation starters"""
        prompt = f"""
        Generate 3 professional conversation starters for a collaboration platform.
        User 1: {user1.get('role')} in {user1.get('field')}, interested in {user1.get('project_interests')}
        User 2: {user2.get('role')} in {user2.get('field')}, interested in {user2.get('project_interests')}
        
        Make them friendly, professional, and focused on potential collaboration.
        Format: Return only the 3 starters, one per line.
        """
        
        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150,
            temperature=0.7
        )
        
        starters = response.choices[0].message.content.strip().split('\n')
        return [s.strip() for s in starters if s.strip()]
    
    async def suggest_project_ideas(
        self, 
        user1: Dict, 
        user2: Dict
    ) -> List[Dict[str, str]]:
        """Suggest project ideas for the match"""
        ideas = []
        
        # Based on field combination
        field_combo = f"{user1.get('field')}_{user2.get('field')}"
        
        project_templates = {
            "Software Development_Graphic Design": [
                {"title": "SaaS Dashboard", "description": "Build a beautiful SaaS platform"},
                {"title": "Mobile App", "description": "Create a stunning mobile application"},
            ],
            "AI/Machine Learning_Healthcare": [
                {"title": "Health Prediction App", "description": "AI-powered health monitoring"},
                {"title": "Medical Image Analysis", "description": "Deep learning for diagnostics"},
            ],
            "Marketing_Content Writing": [
                {"title": "Content Marketing Campaign", "description": "Full content strategy"},
                {"title": "Brand Storytelling", "description": "Develop brand narrative"},
            ],
            # Add more combinations...
        }
        
        # Get relevant templates
        for key, templates in project_templates.items():
            if key in field_combo or key[::-1] in field_combo:
                ideas.extend(templates)
        
        # Generate based on shared interests
        shared_interests = set(user1.get('project_interests', [])) & \
                          set(user2.get('project_interests', []))
        
        for interest in list(shared_interests)[:2]:
            ideas.append({
                "title": f"{interest} Project",
                "description": f"Collaborate on {interest.lower()} initiative"
            })
        
        return ideas[:5]
    
    async def predict_collaboration_success(
        self, 
        match_score: float,
        user1_analytics: Dict,
        user2_analytics: Dict
    ) -> float:
        """Predict the success probability of a collaboration"""
        # Factors for success prediction
        factors = []
        
        # Match score contribution (40%)
        factors.append(match_score * 0.4)
        
        # Past success rates (30%)
        avg_success = (
            user1_analytics.get('success_rate', 0.5) + 
            user2_analytics.get('success_rate', 0.5)
        ) / 2
        factors.append(avg_success * 0.3)
        
        # Response rates and engagement (20%)
        avg_engagement = (
            user1_analytics.get('match_rate', 0.5) + 
            user2_analytics.get('match_rate', 0.5)
        ) / 2
        factors.append(avg_engagement * 0.2)
        
        # Ratings (10%)
        avg_rating = (
            user1_analytics.get('average_rating', 3.0) + 
            user2_analytics.get('average_rating', 3.0)
        ) / 10  # Normalize to 0-1
        factors.append(avg_rating * 0.1)
        
        success_probability = sum(factors)
        return min(1.0, max(0.0, success_probability))
    
    async def learn_from_interaction(
        self,
        user_id: str,
        target_id: str,
        action: str,  # 'like', 'pass', 'message', 'unmatch'
        context: Dict = None
    ):
        """Learn from user interactions to improve future matches"""
        # This would typically update a ML model or preference weights
        # For now, we'll store interaction patterns
        
        interaction = {
            'user_id': user_id,
            'target_id': target_id,
            'action': action,
            'timestamp': datetime.utcnow(),
            'context': context or {}
        }
        
        # In production, this would:
        # 1. Update user preference model
        # 2. Adjust matching weights
        # 3. Retrain recommendation model
        
        return interaction
    
    async def get_daily_recommendations(
        self,
        user: Dict,
        all_users: List[Dict],
        limit: int = 10
    ) -> List[Tuple[Dict, float, List[str]]]:
        """Get AI-curated daily recommendations"""
        recommendations = []
        
        for candidate in all_users:
            if candidate['_id'] == user['_id']:
                continue
            
            # Calculate match score
            score, breakdown, reasons = await self.calculate_match_score(
                user, candidate, use_ml=True
            )
            
            if score > 0.6:  # Minimum threshold
                recommendations.append((candidate, score, reasons))
        
        # Sort by score
        recommendations.sort(key=lambda x: x[1], reverse=True)
        
        return recommendations[:limit]


class SecurityAI:
    """AI-powered security and fraud detection"""
    
    def __init__(self):
        self.suspicious_patterns = self._load_suspicious_patterns()
    
    def _load_suspicious_patterns(self) -> Dict:
        """Load patterns for fraud detection"""
        return {
            'spam_keywords': ['forex', 'crypto', 'guaranteed returns', 'click here'],
            'fake_profile_indicators': [
                'generic_bio',
                'stock_photo',
                'rapid_signup',
                'suspicious_links'
            ],
            'harassment_keywords': ['offensive', 'inappropriate', 'harassment'],
        }
    
    async def verify_profile_authenticity(self, user_profile: Dict) -> Dict[str, Any]:
        """Verify if profile is authentic"""
        trust_score = 1.0
        issues = []
        
        # Check bio for spam
        bio = user_profile.get('bio', '').lower()
        for keyword in self.suspicious_patterns['spam_keywords']:
            if keyword in bio:
                trust_score -= 0.2
                issues.append(f"Suspicious keyword: {keyword}")
        
        # Check profile completeness
        completion = user_profile.get('profile_completion', 0)
        if completion < 0.3:
            trust_score -= 0.1
            issues.append("Incomplete profile")
        
        # Check for verified accounts
        if user_profile.get('email_verified'):
            trust_score += 0.1
        if user_profile.get('linkedin_verified'):
            trust_score += 0.15
        
        # Normalize score
        trust_score = max(0.0, min(1.0, trust_score))
        
        return {
            'trust_score': trust_score,
            'is_suspicious': trust_score < 0.5,
            'issues': issues,
            'verification_status': self._get_verification_status(trust_score)
        }
    
    def _get_verification_status(self, trust_score: float) -> str:
        """Get verification status based on trust score"""
        if trust_score >= 0.9:
            return "verified"
        elif trust_score >= 0.7:
            return "trusted"
        elif trust_score >= 0.5:
            return "standard"
        else:
            return "under_review"
    
    async def detect_inappropriate_content(self, message: str) -> Dict[str, Any]:
        """Detect inappropriate content in messages"""
        # This would use a proper content moderation API
        # For now, basic keyword detection
        
        is_inappropriate = False
        confidence = 0.0
        categories = []
        
        message_lower = message.lower()
        
        # Check for harassment
        for keyword in self.suspicious_patterns['harassment_keywords']:
            if keyword in message_lower:
                is_inappropriate = True
                confidence = 0.8
                categories.append('harassment')
                break
        
        # Check for spam
        spam_count = sum(1 for kw in self.suspicious_patterns['spam_keywords'] 
                        if kw in message_lower)
        if spam_count >= 2:
            is_inappropriate = True
            confidence = max(confidence, 0.7)
            categories.append('spam')
        
        return {
            'is_inappropriate': is_inappropriate,
            'confidence': confidence,
            'categories': categories,
            'should_block': confidence > 0.8
        }
    
    async def analyze_user_behavior(
        self, 
        user_id: str,
        activity_log: List[Dict]
    ) -> Dict[str, Any]:
        """Analyze user behavior for anomalies"""
        # Analyze patterns
        anomalies = []
        risk_level = "low"
        
        # Check for rapid actions (bot-like behavior)
        recent_actions = [a for a in activity_log 
                         if a['timestamp'] > datetime.utcnow() - timedelta(hours=1)]
        
        if len(recent_actions) > 100:
            anomalies.append("Excessive activity")
            risk_level = "high"
        
        # Check for mass messaging
        messages = [a for a in recent_actions if a['action'] == 'message']
        if len(messages) > 50:
            anomalies.append("Mass messaging detected")
            risk_level = "high"
        
        return {
            'user_id': user_id,
            'anomalies': anomalies,
            'risk_level': risk_level,
            'should_flag': risk_level in ['high', 'critical'],
            'recommended_action': self._get_recommended_action(risk_level)
        }
    
    def _get_recommended_action(self, risk_level: str) -> str:
        """Get recommended action based on risk level"""
        actions = {
            'low': 'continue_monitoring',
            'medium': 'increase_monitoring',
            'high': 'manual_review',
            'critical': 'temporary_suspension'
        }
        return actions.get(risk_level, 'continue_monitoring')

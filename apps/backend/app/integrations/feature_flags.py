"""
Feature flags system for gradual rollouts.

Provides:
- User-based feature flags
- Percentage-based rollouts
- Environment-based flags
- A/B testing support
"""
import logging
import hashlib
from typing import Optional, Dict, Any, List
from enum import Enum
from datetime import datetime

logger = logging.getLogger(__name__)


class FeatureFlagType(str, Enum):
    """Feature flag types."""
    BOOLEAN = "boolean"
    PERCENTAGE = "percentage"
    USER_LIST = "user_list"
    ENVIRONMENT = "environment"


class FeatureFlag:
    """Feature flag definition."""
    
    def __init__(
        self,
        key: str,
        name: str,
        description: str,
        flag_type: FeatureFlagType = FeatureFlagType.BOOLEAN,
        enabled: bool = False,
        percentage: int = 0,
        user_list: Optional[List[str]] = None,
        environments: Optional[List[str]] = None
    ):
        """
        Initialize feature flag.
        
        Args:
            key: Unique flag key
            name: Display name
            description: Flag description
            flag_type: Type of flag
            enabled: Default enabled state
            percentage: Rollout percentage (0-100)
            user_list: List of user IDs with access
            environments: List of environments where enabled
        """
        self.key = key
        self.name = name
        self.description = description
        self.flag_type = flag_type
        self.enabled = enabled
        self.percentage = percentage
        self.user_list = user_list or []
        self.environments = environments or []


class FeatureFlagManager:
    """Feature flag manager."""
    
    def __init__(self):
        """Initialize feature flag manager."""
        self.flags: Dict[str, FeatureFlag] = {}
        self._load_default_flags()
    
    def _load_default_flags(self):
        """Load default feature flags."""
        # In production, load from database or config service
        default_flags = [
            FeatureFlag(
                key="new_matching_algorithm",
                name="New Matching Algorithm",
                description="Use ML-based matching instead of rule-based",
                flag_type=FeatureFlagType.PERCENTAGE,
                percentage=10  # 10% rollout
            ),
            FeatureFlag(
                key="video_chat",
                name="Video Chat",
                description="Enable video chat feature",
                flag_type=FeatureFlagType.BOOLEAN,
                enabled=False
            ),
            FeatureFlag(
                key="premium_features",
                name="Premium Features",
                description="Premium subscription features",
                flag_type=FeatureFlagType.BOOLEAN,
                enabled=True
            ),
            FeatureFlag(
                key="advanced_search",
                name="Advanced Search",
                description="Advanced search filters",
                flag_type=FeatureFlagType.PERCENTAGE,
                percentage=50
            ),
        ]
        
        for flag in default_flags:
            self.flags[flag.key] = flag
    
    def is_enabled(
        self,
        flag_key: str,
        user_id: Optional[str] = None,
        environment: Optional[str] = None
    ) -> bool:
        """
        Check if feature flag is enabled.
        
        Args:
            flag_key: Flag key
            user_id: Optional user ID
            environment: Optional environment
            
        Returns:
            True if flag is enabled
        """
        flag = self.flags.get(flag_key)
        if not flag:
            logger.warning(f"Unknown feature flag: {flag_key}")
            return False
        
        # Check environment-based flags
        if flag.flag_type == FeatureFlagType.ENVIRONMENT:
            return environment in flag.environments if environment else False
        
        # Check user list flags
        if flag.flag_type == FeatureFlagType.USER_LIST:
            return user_id in flag.user_list if user_id else False
        
        # Check percentage-based flags
        if flag.flag_type == FeatureFlagType.PERCENTAGE:
            if not user_id:
                return False
            
            # Consistent hashing for stable rollout
            hash_value = int(hashlib.md5(f"{flag_key}:{user_id}".encode()).hexdigest(), 16)
            user_percentage = hash_value % 100
            return user_percentage < flag.percentage
        
        # Boolean flags
        return flag.enabled
    
    def get_variant(
        self,
        experiment_key: str,
        user_id: str,
        variants: List[str] = ["control", "variant"]
    ) -> str:
        """
        Get A/B test variant for user.
        
        Args:
            experiment_key: Experiment key
            user_id: User ID
            variants: List of variant names
            
        Returns:
            Assigned variant name
        """
        # Consistent hashing for stable variant assignment
        hash_value = int(hashlib.md5(f"{experiment_key}:{user_id}".encode()).hexdigest(), 16)
        variant_index = hash_value % len(variants)
        
        assigned_variant = variants[variant_index]
        logger.info(f"User {user_id} assigned to variant '{assigned_variant}' for {experiment_key}")
        
        return assigned_variant
    
    def add_flag(self, flag: FeatureFlag):
        """
        Add or update feature flag.
        
        Args:
            flag: Feature flag to add
        """
        self.flags[flag.key] = flag
        logger.info(f"Feature flag added: {flag.key}")
    
    def remove_flag(self, flag_key: str):
        """
        Remove feature flag.
        
        Args:
            flag_key: Flag key to remove
        """
        if flag_key in self.flags:
            del self.flags[flag_key]
            logger.info(f"Feature flag removed: {flag_key}")
    
    def list_flags(self) -> List[Dict[str, Any]]:
        """
        List all feature flags.
        
        Returns:
            List of flag dictionaries
        """
        return [
            {
                "key": flag.key,
                "name": flag.name,
                "description": flag.description,
                "type": flag.flag_type,
                "enabled": flag.enabled,
                "percentage": flag.percentage
            }
            for flag in self.flags.values()
        ]


# Global feature flag manager
feature_flags = FeatureFlagManager()


def is_feature_enabled(
    flag_key: str,
    user_id: Optional[str] = None,
    environment: Optional[str] = None
) -> bool:
    """
    Helper function to check feature flag.
    
    Args:
        flag_key: Flag key
        user_id: Optional user ID
        environment: Optional environment
        
    Returns:
        True if enabled
    """
    return feature_flags.is_enabled(flag_key, user_id, environment)


def get_ab_variant(
    experiment_key: str,
    user_id: str,
    variants: List[str] = ["control", "variant"]
) -> str:
    """
    Helper function to get A/B test variant.
    
    Args:
        experiment_key: Experiment key
        user_id: User ID
        variants: Variant names
        
    Returns:
        Assigned variant
    """
    return feature_flags.get_variant(experiment_key, user_id, variants)

"""
Test suite to validate enhanced model validation is enforced
"""
import pytest
from pydantic import ValidationError
from app.models import (
    UserProfile,
    FieldCategory,
    ExperienceLevel,
    CollaborationType,
    MessageCreate,
    MessageResponse
)


class TestEnhancedModelValidation:
    """Validate that enhanced models enforce strict validation"""
    
    def test_user_profile_password_validation(self):
        """Test that password validation is enforced"""
        # Valid password
        valid_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "ValidPass123",
            "field": FieldCategory.TECH_SOFTWARE,
            "role": "Developer",
            "experience_level": ExperienceLevel.JUNIOR,
            "skills": ["Python"],
            "looking_for": [FieldCategory.TECH_SOFTWARE],
            "collaboration_type": [CollaborationType.PROJECT_PARTNER],
            "project_interests": ["AI"],
            "bio": "Test bio",
            "location_city": "Test City",
            "location_country": "Test Country",
            "timezone": "UTC",
            "availability_hours_per_week": 10
        }
        
        profile = UserProfile(**valid_data)
        assert profile.name == "Test User"
        
        # Password too short
        with pytest.raises(ValidationError) as exc_info:
            invalid_data = valid_data.copy()
            invalid_data["password"] = "short"
            UserProfile(**invalid_data)
        
        assert "at least 8 characters" in str(exc_info.value).lower()
    
    def test_user_profile_name_validation(self):
        """Test name length validation"""
        valid_data = {
            "name": "AB",  # Minimum 2 chars
            "email": "test@example.com",
            "password": "ValidPass123",
            "field": FieldCategory.TECH_SOFTWARE,
            "role": "Developer",
            "experience_level": ExperienceLevel.JUNIOR,
            "skills": ["Python"],
            "looking_for": [FieldCategory.TECH_SOFTWARE],
            "collaboration_type": [CollaborationType.PROJECT_PARTNER],
            "project_interests": ["AI"],
            "bio": "Test bio",
            "location_city": "Test City",
            "location_country": "Test Country",
            "timezone": "UTC",
            "availability_hours_per_week": 10
        }
        
        profile = UserProfile(**valid_data)
        assert len(profile.name) >= 2
        
        # Name too short
        with pytest.raises(ValidationError):
            invalid_data = valid_data.copy()
            invalid_data["name"] = "A"
            UserProfile(**invalid_data)
    
    def test_message_create_validation(self):
        """Test MessageCreate model"""
        msg = MessageCreate(content="Hello world")
        assert msg.content == "Hello world"
        
        # Empty content should fail
        with pytest.raises(ValidationError):
            MessageCreate(content="")
    
    def test_field_category_enum(self):
        """Test that FieldCategory enum is properly defined"""
        assert FieldCategory.TECH_SOFTWARE == "Software Development"
        assert FieldCategory.TECH_AI == "AI/Machine Learning"
        assert FieldCategory.CREATIVE_DESIGN == "Graphic Design"
    
    def test_experience_level_enum(self):
        """Test ExperienceLevel enum"""
        assert ExperienceLevel.STUDENT == "Student"
        assert ExperienceLevel.JUNIOR == "Junior (0-2 years)"
        assert ExperienceLevel.SENIOR == "Senior (5-10 years)"
    
    def test_collaboration_type_enum(self):
        """Test CollaborationType enum"""
        assert CollaborationType.COFOUNDER == "Co-founder"
        assert CollaborationType.PROJECT_PARTNER == "Project Partner"
        assert CollaborationType.MENTOR == "Mentorship"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

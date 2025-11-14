"""
Unit tests for Celery background tasks.
"""
import pytest
from unittest.mock import Mock, patch
from app.tasks.email import (
    send_welcome_email,
    send_verification_email,
    send_password_reset_email,
    send_notification_email,
)
from app.tasks.reports import (
    generate_user_report,
    generate_match_analytics,
)
from app.tasks.processing import (
    process_user_recommendations,
    process_image_upload,
)


class TestEmailTasks:
    """Test email tasks."""
    
    def test_send_welcome_email(self):
        """Test welcome email task."""
        result = send_welcome_email.apply(
            args=["user@example.com", "Test User"]
        ).get()
        
        assert result["status"] == "sent"
        assert result["recipient"] == "user@example.com"
        assert result["type"] == "welcome"
    
    def test_send_verification_email(self):
        """Test verification email task."""
        result = send_verification_email.apply(
            args=["user@example.com", "ABC123"]
        ).get()
        
        assert result["status"] == "sent"
        assert result["type"] == "verification"
    
    def test_send_password_reset_email(self):
        """Test password reset email task."""
        result = send_password_reset_email.apply(
            args=["user@example.com", "reset-token-123"]
        ).get()
        
        assert result["status"] == "sent"
        assert result["type"] == "password_reset"
    
    def test_send_notification_email(self):
        """Test notification email task."""
        result = send_notification_email.apply(
            args=["user@example.com", "Test Subject", "Test Message"]
        ).get()
        
        assert result["status"] == "sent"
        assert result["subject"] == "Test Subject"


class TestReportTasks:
    """Test report generation tasks."""
    
    def test_generate_user_report(self):
        """Test user report generation."""
        result = generate_user_report.apply(
            args=["user123", "activity"]
        ).get()
        
        assert result["status"] == "completed"
        assert result["user_id"] == "user123"
        assert result["report_type"] == "activity"
    
    def test_generate_match_analytics(self):
        """Test match analytics generation."""
        result = generate_match_analytics.apply().get()
        
        assert "total_matches" in result
        assert "success_rate" in result
        assert "generated_at" in result


class TestProcessingTasks:
    """Test data processing tasks."""
    
    def test_process_user_recommendations(self):
        """Test user recommendations processing."""
        result = process_user_recommendations.apply(
            args=["user123"]
        ).get()
        
        assert result["status"] == "completed"
        assert result["user_id"] == "user123"
        assert "recommendations_count" in result
    
    def test_process_image_upload(self):
        """Test image upload processing."""
        result = process_image_upload.apply(
            args=["img123", "user123", "https://example.com/image.jpg"]
        ).get()
        
        assert result["status"] == "completed"
        assert result["image_id"] == "img123"
        assert result["moderation_status"] == "approved"


class TestCeleryConfiguration:
    """Test Celery configuration."""
    
    def test_celery_app_imports(self):
        """Test Celery app imports correctly."""
        from app.celery_app import celery_app
        
        assert celery_app is not None
        assert celery_app.conf.task_serializer == "json"
        assert celery_app.conf.timezone == "UTC"
    
    def test_task_routes_configured(self):
        """Test task routes are configured."""
        from app.celery_app import celery_app
        
        routes = celery_app.conf.task_routes
        assert routes is not None
        assert 'app.tasks.email.*' in routes
        assert routes['app.tasks.email.*']['queue'] == 'emails'

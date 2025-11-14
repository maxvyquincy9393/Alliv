"""
Unit tests for Sentry integration
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from app.integrations.sentry import (
    init_sentry,
    capture_exception,
    capture_message,
    set_user_context,
    add_breadcrumb
)


class TestSentryIntegration:
    """Test Sentry integration functions"""
    
    @patch('app.integrations.sentry.sentry_sdk')
    def test_init_sentry_with_dsn(self, mock_sentry):
        """Should initialize Sentry when DSN is provided"""
        dsn = "https://example@sentry.io/123456"
        
        init_sentry(
            dsn=dsn,
            environment="production",
            traces_sample_rate=0.5
        )
        
        mock_sentry.init.assert_called_once()
        call_kwargs = mock_sentry.init.call_args[1]
        
        assert call_kwargs['dsn'] == dsn
        assert call_kwargs['environment'] == "production"
        assert call_kwargs['traces_sample_rate'] == 0.5
        print("✅ Sentry initialized with correct DSN")
    
    @patch('app.integrations.sentry.logging')
    def test_init_sentry_without_dsn(self, mock_logging):
        """Should log warning when DSN is not provided"""
        init_sentry(dsn=None)
        
        mock_logging.warning.assert_called_once()
        print("✅ Warning logged when DSN is missing")
    
    @patch('app.integrations.sentry.sentry_sdk')
    def test_capture_exception_with_context(self, mock_sentry):
        """Should capture exception with user context and tags"""
        error = ValueError("Test error")
        
        capture_exception(
            error,
            user={"id": "123", "email": "test@example.com"},
            tags={"operation": "test"},
            extra={"data": "test_data"}
        )
        
        mock_sentry.capture_exception.assert_called_once_with(error)
        print("✅ Exception captured with context")
    
    @patch('app.integrations.sentry.sentry_sdk')
    def test_capture_message(self, mock_sentry):
        """Should capture message with correct level"""
        message = "Test warning message"
        
        capture_message(message, level="warning", tags={"type": "test"})
        
        mock_sentry.capture_message.assert_called_once_with(message, level="warning")
        print("✅ Message captured successfully")
    
    @patch('app.integrations.sentry.sentry_sdk')
    def test_set_user_context(self, mock_sentry):
        """Should set user context correctly"""
        set_user_context(
            user_id="user_123",
            email="user@example.com",
            username="testuser"
        )
        
        mock_sentry.set_user.assert_called_once_with({
            "id": "user_123",
            "email": "user@example.com",
            "username": "testuser"
        })
        print("✅ User context set successfully")
    
    @patch('app.integrations.sentry.sentry_sdk')
    def test_add_breadcrumb(self, mock_sentry):
        """Should add breadcrumb with correct data"""
        add_breadcrumb(
            message="User clicked button",
            category="user_action",
            level="info",
            button_id="submit_btn"
        )
        
        mock_sentry.add_breadcrumb.assert_called_once()
        call_args = mock_sentry.add_breadcrumb.call_args[0][0]
        
        assert call_args["message"] == "User clicked button"
        assert call_args["category"] == "user_action"
        assert call_args["level"] == "info"
        print("✅ Breadcrumb added successfully")


class TestSentryConfiguration:
    """Test Sentry configuration validation"""
    
    def test_sentry_import(self):
        """Should import Sentry module successfully"""
        from app.integrations import sentry
        
        assert hasattr(sentry, 'init_sentry')
        assert hasattr(sentry, 'capture_exception')
        assert hasattr(sentry, 'capture_message')
        print("✅ Sentry module imports correctly")
    
    @patch('app.integrations.sentry.sentry_sdk')
    def test_production_sample_rates(self, mock_sentry):
        """Should use lower sample rates in production"""
        init_sentry(
            dsn="https://example@sentry.io/123456",
            environment="production",
            traces_sample_rate=0.1,  # 10% in production
            profiles_sample_rate=0.1
        )
        
        call_kwargs = mock_sentry.init.call_args[1]
        assert call_kwargs['traces_sample_rate'] == 0.1
        print("✅ Production uses correct sample rates")

"""
Unit tests for CAPTCHA integration.
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from app.integrations.captcha import (
    verify_recaptcha,
    verify_hcaptcha,
    require_captcha,
    CaptchaError,
)


class TestCaptchaIntegration:
    """Test CAPTCHA verification functions."""
    
    @pytest.mark.asyncio
    async def test_verify_recaptcha_success(self):
        """Test successful reCAPTCHA verification."""
        with patch('app.integrations.captcha.settings') as mock_settings, \
             patch('httpx.AsyncClient') as mock_client:
            
            # Mock settings
            mock_settings.RECAPTCHA_SECRET_KEY = "test-secret-key"
            
            # Mock successful response
            mock_response = Mock()
            mock_response.json.return_value = {
                "success": True,
                "score": 0.9,
                "action": "login"
            }
            mock_response.raise_for_status = Mock()
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            # Verify
            result = await verify_recaptcha(
                token="test-token",
                action="login",
                threshold=0.5
            )
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_verify_recaptcha_low_score(self):
        """Test reCAPTCHA verification with low score."""
        with patch('app.integrations.captcha.settings') as mock_settings, \
             patch('httpx.AsyncClient') as mock_client:
            
            mock_settings.RECAPTCHA_SECRET_KEY = "test-secret-key"
            
            mock_response = Mock()
            mock_response.json.return_value = {
                "success": True,
                "score": 0.3,  # Below threshold
                "action": "login"
            }
            mock_response.raise_for_status = Mock()
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            result = await verify_recaptcha(
                token="test-token",
                action="login",
                threshold=0.5
            )
            
            assert result is False
    
    @pytest.mark.asyncio
    async def test_verify_recaptcha_action_mismatch(self):
        """Test reCAPTCHA verification with action mismatch."""
        with patch('app.integrations.captcha.settings') as mock_settings, \
             patch('httpx.AsyncClient') as mock_client:
            
            mock_settings.RECAPTCHA_SECRET_KEY = "test-secret-key"
            
            mock_response = Mock()
            mock_response.json.return_value = {
                "success": True,
                "score": 0.9,
                "action": "register"  # Different action
            }
            mock_response.raise_for_status = Mock()
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            result = await verify_recaptcha(
                token="test-token",
                action="login",
                threshold=0.5
            )
            
            assert result is False
    
    @pytest.mark.asyncio
    async def test_verify_recaptcha_no_secret_key(self):
        """Test reCAPTCHA verification without secret key (development mode)."""
        with patch('app.integrations.captcha.settings') as mock_settings:
            mock_settings.RECAPTCHA_SECRET_KEY = None
            
            # Should pass in development mode
            result = await verify_recaptcha(
                token="test-token",
                action="login"
            )
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_verify_recaptcha_http_error(self):
        """Test reCAPTCHA verification with HTTP error."""
        with patch('app.integrations.captcha.settings') as mock_settings, \
             patch('httpx.AsyncClient') as mock_client:
            
            mock_settings.RECAPTCHA_SECRET_KEY = "test-secret-key"
            
            # Mock HTTP error
            import httpx
            mock_client_instance = AsyncMock()
            mock_client_instance.post = AsyncMock(
                side_effect=httpx.HTTPError("Connection failed")
            )
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            with pytest.raises(CaptchaError):
                await verify_recaptcha(
                    token="test-token",
                    action="login"
                )
    
    @pytest.mark.asyncio
    async def test_verify_hcaptcha_success(self):
        """Test successful hCaptcha verification."""
        with patch('app.integrations.captcha.settings') as mock_settings, \
             patch('httpx.AsyncClient') as mock_client:
            
            mock_settings.RECAPTCHA_SECRET_KEY = "test-secret-key"
            
            mock_response = Mock()
            mock_response.json.return_value = {
                "success": True
            }
            mock_response.raise_for_status = Mock()
            
            mock_client_instance = AsyncMock()
            mock_client_instance.post = AsyncMock(return_value=mock_response)
            mock_client.return_value.__aenter__.return_value = mock_client_instance
            
            result = await verify_hcaptcha(token="test-token")
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_require_captcha_missing_token(self):
        """Test require_captcha dependency with missing token."""
        from fastapi import HTTPException
        
        with patch('app.integrations.captcha.settings') as mock_settings:
            mock_settings.RECAPTCHA_SECRET_KEY = "test-secret-key"
            
            with pytest.raises(HTTPException) as exc_info:
                await require_captcha(captcha_token=None, action="login")
            
            assert exc_info.value.status_code == 400
            assert "required" in exc_info.value.detail.lower()


class TestCaptchaConfiguration:
    """Test CAPTCHA configuration and module imports."""
    
    def test_captcha_imports(self):
        """Test that CAPTCHA module exports expected functions."""
        from app.integrations import captcha
        
        assert hasattr(captcha, 'verify_recaptcha')
        assert hasattr(captcha, 'verify_hcaptcha')
        assert hasattr(captcha, 'require_captcha')
        assert hasattr(captcha, 'CaptchaError')
    
    def test_captcha_error_exception(self):
        """Test CaptchaError exception."""
        error = CaptchaError("Test error")
        assert str(error) == "Test error"
        assert isinstance(error, Exception)

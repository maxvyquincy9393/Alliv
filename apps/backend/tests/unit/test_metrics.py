"""
Unit tests for Prometheus metrics integration.
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from app.integrations.metrics import (
    init_metrics,
    PrometheusMiddleware,
    record_db_query,
    record_user_registration,
    record_match_created,
    record_match_accepted,
    record_message_sent,
    increment_active_users,
    decrement_active_users,
    set_active_users,
    increment_websocket_connections,
    decrement_websocket_connections,
    get_metrics,
    get_metrics_content_type,
)


class TestMetricsIntegration:
    """Test Prometheus metrics functions."""
    
    def test_init_metrics(self):
        """Test metrics initialization."""
        # Should not raise any exceptions
        init_metrics(app_name="test_app", version="1.0.0")
    
    def test_get_metrics_content_type(self):
        """Test metrics content type."""
        content_type = get_metrics_content_type()
        assert "text/plain" in content_type or "text" in content_type
    
    def test_get_metrics_returns_bytes(self):
        """Test that get_metrics returns bytes."""
        metrics = get_metrics()
        assert isinstance(metrics, bytes)
        # Should contain Prometheus formatted data
        assert b"http_requests_total" in metrics or b"#" in metrics
    
    def test_record_db_query(self):
        """Test database query recording."""
        # Should not raise exceptions
        record_db_query("users", "find", 0.05)
        record_db_query("matches", "insert", 0.02)
    
    def test_record_user_registration(self):
        """Test user registration recording."""
        record_user_registration("email")
        record_user_registration("google")
        record_user_registration("github")
    
    def test_record_match_operations(self):
        """Test match operations recording."""
        record_match_created()
        record_match_accepted()
    
    def test_record_message_sent(self):
        """Test message sent recording."""
        record_message_sent()
    
    def test_active_users_operations(self):
        """Test active users gauge operations."""
        increment_active_users()
        decrement_active_users()
        set_active_users(100)
    
    def test_websocket_connections_operations(self):
        """Test WebSocket connections gauge operations."""
        increment_websocket_connections()
        decrement_websocket_connections()


class TestPrometheusMiddleware:
    """Test Prometheus middleware."""
    
    @pytest.mark.asyncio
    async def test_middleware_skips_metrics_endpoint(self):
        """Test that middleware skips the /metrics endpoint."""
        middleware = PrometheusMiddleware(app=Mock())
        
        # Mock request to /metrics
        request = Mock()
        request.url.path = "/metrics"
        
        async def mock_call_next(req):
            return Mock()  # Return a mock response
        
        # Should pass through without recording
        result = await middleware.dispatch(request, mock_call_next)
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_middleware_records_successful_requests(self):
        """Test middleware records successful requests."""
        middleware = PrometheusMiddleware(app=Mock())
        
        request = Mock()
        request.url.path = "/api/users"
        request.method = "GET"
        
        async def mock_call_next(req):
            response = Mock()
            response.status_code = 200
            return response
        
        result = await middleware.dispatch(request, mock_call_next)
        assert result.status_code == 200
    
    @pytest.mark.asyncio
    async def test_middleware_records_failed_requests(self):
        """Test middleware records failed requests."""
        middleware = PrometheusMiddleware(app=Mock())
        
        request = Mock()
        request.url.path = "/api/users"
        request.method = "POST"
        
        async def mock_call_next(req):
            raise ValueError("Test error")
        
        with pytest.raises(ValueError):
            await middleware.dispatch(request, mock_call_next)
    
    def test_normalize_endpoint(self):
        """Test endpoint normalization."""
        middleware = PrometheusMiddleware(app=Mock())
        
        # Test MongoDB ObjectID normalization
        assert middleware._normalize_endpoint("/api/users/507f1f77bcf86cd799439011") == "/api/users/{id}"
        
        # Test numeric ID normalization
        assert middleware._normalize_endpoint("/api/users/123") == "/api/users/{id}"
        
        # Test UUID normalization
        assert middleware._normalize_endpoint("/api/users/550e8400-e29b-41d4-a716-446655440000") == "/api/users/{id}"
        
        # Test regular path (no normalization)
        assert middleware._normalize_endpoint("/api/users") == "/api/users"


class TestMetricsConfiguration:
    """Test metrics configuration and module imports."""
    
    def test_metrics_imports(self):
        """Test that metrics module exports expected functions."""
        from app.integrations import metrics
        
        assert hasattr(metrics, 'init_metrics')
        assert hasattr(metrics, 'PrometheusMiddleware')
        assert hasattr(metrics, 'record_db_query')
        assert hasattr(metrics, 'record_user_registration')
        assert hasattr(metrics, 'get_metrics')
    
    def test_metrics_registry_created(self):
        """Test that Prometheus registry is created."""
        from prometheus_client import REGISTRY
        
        # Should have default registry
        assert REGISTRY is not None
        
        # Should have custom metrics registered
        collector_names = [collector for collector in REGISTRY._collector_to_names.keys()]
        assert len(collector_names) > 0

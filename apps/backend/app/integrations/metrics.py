"""
Prometheus metrics integration for monitoring.

Provides custom application metrics and HTTP metrics middleware.
"""
import time
import logging
from typing import Callable
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    Info,
    generate_latest,
    CONTENT_TYPE_LATEST,
    CollectorRegistry,
    REGISTRY,
)
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Create custom registry (optional, use default REGISTRY)
# custom_registry = CollectorRegistry()

# Application info
app_info = Info('app', 'Application information', registry=REGISTRY)

# HTTP request metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status'],
    registry=REGISTRY
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint'],
    buckets=(0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1.0, 2.5, 5.0, 7.5, 10.0),
    registry=REGISTRY
)

http_requests_in_progress = Gauge(
    'http_requests_in_progress',
    'HTTP requests currently being processed',
    ['method', 'endpoint'],
    registry=REGISTRY
)

# Database metrics
db_queries_total = Counter(
    'db_queries_total',
    'Total database queries',
    ['collection', 'operation'],
    registry=REGISTRY
)

db_query_duration_seconds = Histogram(
    'db_query_duration_seconds',
    'Database query duration',
    ['collection', 'operation'],
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
    registry=REGISTRY
)

# User metrics
active_users = Gauge(
    'active_users_total',
    'Number of active users',
    registry=REGISTRY
)

user_registrations_total = Counter(
    'user_registrations_total',
    'Total user registrations',
    ['provider'],  # email, google, github, etc.
    registry=REGISTRY
)

# Match metrics
matches_created_total = Counter(
    'matches_created_total',
    'Total matches created',
    registry=REGISTRY
)

matches_accepted_total = Counter(
    'matches_accepted_total',
    'Total matches accepted',
    registry=REGISTRY
)

# Message metrics
messages_sent_total = Counter(
    'messages_sent_total',
    'Total messages sent',
    registry=REGISTRY
)

# WebSocket metrics
websocket_connections = Gauge(
    'websocket_connections_active',
    'Active WebSocket connections',
    registry=REGISTRY
)


class PrometheusMiddleware(BaseHTTPMiddleware):
    """
    Middleware to collect HTTP request metrics.
    
    Tracks:
    - Request count by method, endpoint, and status
    - Request duration by method and endpoint
    - In-progress requests by method and endpoint
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip metrics endpoint itself to avoid recursion
        if request.url.path == "/metrics":
            return await call_next(request)
        
        method = request.method
        endpoint = request.url.path
        
        # Normalize endpoint (remove IDs for better aggregation)
        # Example: /api/users/123 -> /api/users/{id}
        endpoint = self._normalize_endpoint(endpoint)
        
        # Track in-progress requests
        http_requests_in_progress.labels(method=method, endpoint=endpoint).inc()
        
        start_time = time.time()
        
        try:
            response = await call_next(request)
            status = response.status_code
        except Exception as e:
            # Track failed requests
            http_requests_total.labels(method=method, endpoint=endpoint, status=500).inc()
            http_requests_in_progress.labels(method=method, endpoint=endpoint).dec()
            raise
        
        # Track request duration
        duration = time.time() - start_time
        http_request_duration_seconds.labels(method=method, endpoint=endpoint).observe(duration)
        
        # Track request count
        http_requests_total.labels(method=method, endpoint=endpoint, status=status).inc()
        
        # Decrement in-progress counter
        http_requests_in_progress.labels(method=method, endpoint=endpoint).dec()
        
        return response
    
    @staticmethod
    def _normalize_endpoint(path: str) -> str:
        """
        Normalize endpoint path by replacing IDs with placeholders.
        
        Args:
            path: The request path
            
        Returns:
            Normalized path with placeholders
        """
        parts = path.split('/')
        normalized_parts = []
        
        for part in parts:
            # Replace UUIDs, MongoDB ObjectIDs, and numeric IDs
            if len(part) == 24 and part.isalnum():  # MongoDB ObjectID
                normalized_parts.append('{id}')
            elif part.isdigit():  # Numeric ID
                normalized_parts.append('{id}')
            elif '-' in part and len(part) > 20:  # UUID
                normalized_parts.append('{id}')
            else:
                normalized_parts.append(part)
        
        return '/'.join(normalized_parts)


def init_metrics(app_name: str = "colabmatch", version: str = "1.0.0"):
    """
    Initialize Prometheus metrics with application info.
    
    Args:
        app_name: Application name
        version: Application version
    """
    app_info.info({
        'app_name': app_name,
        'version': version,
    })
    logger.info(f"Prometheus metrics initialized for {app_name} v{version}")


def get_metrics() -> bytes:
    """
    Get current metrics in Prometheus format.
    
    Returns:
        Metrics in Prometheus text format
    """
    return generate_latest(REGISTRY)


def get_metrics_content_type() -> str:
    """
    Get the content type for Prometheus metrics.
    
    Returns:
        Content type string
    """
    return CONTENT_TYPE_LATEST


# Helper functions for recording metrics

def record_db_query(collection: str, operation: str, duration: float):
    """Record a database query metric."""
    db_queries_total.labels(collection=collection, operation=operation).inc()
    db_query_duration_seconds.labels(collection=collection, operation=operation).observe(duration)


def record_user_registration(provider: str = "email"):
    """Record a user registration metric."""
    user_registrations_total.labels(provider=provider).inc()


def record_match_created():
    """Record a match creation metric."""
    matches_created_total.inc()


def record_match_accepted():
    """Record a match acceptance metric."""
    matches_accepted_total.inc()


def record_message_sent():
    """Record a message sent metric."""
    messages_sent_total.inc()


def increment_active_users():
    """Increment active users count."""
    active_users.inc()


def decrement_active_users():
    """Decrement active users count."""
    active_users.dec()


def set_active_users(count: int):
    """Set active users count."""
    active_users.set(count)


def increment_websocket_connections():
    """Increment WebSocket connections count."""
    websocket_connections.inc()


def decrement_websocket_connections():
    """Decrement WebSocket connections count."""
    websocket_connections.dec()

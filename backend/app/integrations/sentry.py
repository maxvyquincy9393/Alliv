"""
Sentry Integration for Error Tracking and Performance Monitoring
"""
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import logging
from typing import Optional


def init_sentry(
    dsn: Optional[str] = None,
    environment: str = "development",
    traces_sample_rate: float = 1.0,
    profiles_sample_rate: float = 1.0,
    enable_tracing: bool = True
):
    """
    Initialize Sentry SDK for error tracking and performance monitoring
    
    Args:
        dsn: Sentry Data Source Name (DSN) - get from sentry.io
        environment: Environment name (development, staging, production)
        traces_sample_rate: Percentage of transactions to capture (0.0 to 1.0)
        profiles_sample_rate: Percentage of profiles to capture (0.0 to 1.0)
        enable_tracing: Enable performance monitoring
    
    Usage:
        # In main.py
        from app.integrations.sentry import init_sentry
        from app.config_validated import settings
        
        if settings.SENTRY_DSN:
            init_sentry(
                dsn=settings.SENTRY_DSN,
                environment=settings.NODE_ENV,
                traces_sample_rate=0.1 if settings.NODE_ENV == "production" else 1.0
            )
    """
    if not dsn:
        logging.warning("⚠️  Sentry DSN not provided. Error tracking disabled.")
        return
    
    # Configure logging integration
    logging_integration = LoggingIntegration(
        level=logging.INFO,  # Capture info and above as breadcrumbs
        event_level=logging.ERROR  # Send errors as events
    )
    
    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        
        # Performance Monitoring
        enable_tracing=enable_tracing,
        traces_sample_rate=traces_sample_rate,
        profiles_sample_rate=profiles_sample_rate,
        
        # Integrations
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            StarletteIntegration(transaction_style="endpoint"),
            logging_integration,
        ],
        
        # Additional Options
        send_default_pii=False,  # Don't send personal data by default
        attach_stacktrace=True,  # Include stack traces
        debug=False,  # Set to True for debugging Sentry itself
        
        # Release tracking (optional)
        # release="alliv@1.0.0",
        
        # Custom tags
        _experiments={
            "profiles_sample_rate": profiles_sample_rate,
        },
    )
    
    logging.info(f"✅ Sentry initialized for environment: {environment}")


def capture_exception(error: Exception, **kwargs):
    """
    Manually capture an exception to Sentry
    
    Args:
        error: The exception to capture
        **kwargs: Additional context (user, tags, extra data)
    
    Example:
        try:
            risky_operation()
        except Exception as e:
            capture_exception(
                e,
                user={"id": user_id, "email": user_email},
                tags={"operation": "payment"},
                extra={"amount": 100}
            )
    """
    with sentry_sdk.push_scope() as scope:
        # Add user context
        if "user" in kwargs:
            scope.set_user(kwargs["user"])
        
        # Add tags
        if "tags" in kwargs:
            for key, value in kwargs["tags"].items():
                scope.set_tag(key, value)
        
        # Add extra context
        if "extra" in kwargs:
            for key, value in kwargs["extra"].items():
                scope.set_extra(key, value)
        
        sentry_sdk.capture_exception(error)


def capture_message(message: str, level: str = "info", **kwargs):
    """
    Manually capture a message to Sentry
    
    Args:
        message: The message to send
        level: Severity level (debug, info, warning, error, fatal)
        **kwargs: Additional context
    
    Example:
        capture_message(
            "User attempted invalid action",
            level="warning",
            user={"id": user_id},
            tags={"action": "delete_account"}
        )
    """
    with sentry_sdk.push_scope() as scope:
        if "user" in kwargs:
            scope.set_user(kwargs["user"])
        
        if "tags" in kwargs:
            for key, value in kwargs["tags"].items():
                scope.set_tag(key, value)
        
        if "extra" in kwargs:
            for key, value in kwargs["extra"].items():
                scope.set_extra(key, value)
        
        sentry_sdk.capture_message(message, level=level)


def set_user_context(user_id: str, email: Optional[str] = None, username: Optional[str] = None):
    """
    Set user context for all subsequent Sentry events
    
    Args:
        user_id: Unique user identifier
        email: User email (optional)
        username: Username (optional)
    
    Example:
        # After user login
        set_user_context(
            user_id=str(user.id),
            email=user.email,
            username=user.username
        )
    """
    sentry_sdk.set_user({
        "id": user_id,
        "email": email,
        "username": username
    })


def add_breadcrumb(message: str, category: str = "default", level: str = "info", **data):
    """
    Add a breadcrumb to track user actions leading to errors
    
    Args:
        message: Breadcrumb message
        category: Category (auth, database, api, etc.)
        level: Severity level
        **data: Additional data
    
    Example:
        add_breadcrumb(
            message="User updated profile",
            category="user_action",
            level="info",
            user_id=user_id,
            fields_changed=["email", "name"]
        )
    """
    sentry_sdk.add_breadcrumb({
        "message": message,
        "category": category,
        "level": level,
        "data": data
    })


# Middleware for automatic user context
class SentryContextMiddleware:
    """
    Middleware to automatically set user context from request
    
    Usage:
        from app.integrations.sentry import SentryContextMiddleware
        
        app.add_middleware(SentryContextMiddleware)
    """
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        # Add request context
        if scope["type"] == "http":
            with sentry_sdk.push_scope() as sentry_scope:
                # Add request data
                sentry_scope.set_tag("path", scope.get("path"))
                sentry_scope.set_tag("method", scope.get("method"))
                
                # You can extract user from JWT token here
                # headers = dict(scope.get("headers", []))
                # auth_header = headers.get(b"authorization", b"").decode()
                # if auth_header:
                #     user_data = extract_user_from_token(auth_header)
                #     set_user_context(**user_data)
        
        await self.app(scope, receive, send)

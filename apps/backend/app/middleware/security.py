"""
Security headers middleware for production
UPDATED: Fixed deprecated headers, added CSP frame-ancestors, improved cache control
"""
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from typing import Callable


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses
    
    Headers added:
    - X-Content-Type-Options: Prevent MIME sniffing
    - Content-Security-Policy: Control resource loading + frame-ancestors (replaces X-Frame-Options)
    - Strict-Transport-Security: Enforce HTTPS
    - Referrer-Policy: Control referrer information
    - Permissions-Policy: Control browser features
    - Cache-Control: Modern cache control (replaces Expires)
    
    Removed deprecated headers:
    - X-Frame-Options (use CSP frame-ancestors instead)
    - X-XSS-Protection (deprecated, browser built-in XSS protection)
    """
    
    async def dispatch(
        self, 
        request: Request, 
        call_next: Callable
    ) -> Response:
        response = await call_next(request)
        
        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Content Security Policy with frame-ancestors (replaces X-Frame-Options)
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.googletagmanager.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https: blob:; "
            "connect-src 'self' https://apis.google.com https://www.googleapis.com; "
            "frame-src 'self' https://accounts.google.com https://github.com; "
            "frame-ancestors 'none'; "  # Replaces X-Frame-Options: DENY
            "base-uri 'self'; "
            "form-action 'self'; "
        )
        response.headers["Content-Security-Policy"] = csp
        
        # Force HTTPS (only in production)
        # 31536000 seconds = 1 year
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )
        
        # Control referrer information
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Control browser features
        permissions_policy = (
            "geolocation=(self), "
            "microphone=(), "
            "camera=(), "
            "payment=(), "
            "usb=()"
        )
        response.headers["Permissions-Policy"] = permissions_policy
        
        # Modern cache control (for API responses - use Cache-Control instead of Expires)
        # No caching for API responses by default
        if not response.headers.get("Cache-Control"):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
            response.headers["Pragma"] = "no-cache"
        
        # Remove deprecated/unnecessary headers if they exist
        response.headers.pop("X-XSS-Protection", None)  # Deprecated
        response.headers.pop("X-Frame-Options", None)  # Use CSP frame-ancestors instead
        response.headers.pop("Expires", None)  # Use Cache-Control instead
        
        return response


# Usage in main.py:
"""
from app.middleware.security import SecurityHeadersMiddleware

if settings.NODE_ENV == "production":
    app.add_middleware(SecurityHeadersMiddleware)
"""

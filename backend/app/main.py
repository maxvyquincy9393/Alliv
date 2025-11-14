import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import socketio  # [OK] ENABLED for WebSocket chat

# Import validated config instead of regular config
from .config_validated import settings
from .logging_config import setup_logging
from .middleware.security import SecurityHeadersMiddleware
from .integrations.sentry import init_sentry, capture_exception
from .integrations.metrics import init_metrics, PrometheusMiddleware
from .db import init_db, close_db
from .routes import chat
from .routes import auth
from .routes import profile
from .routes import discovery
from .routes import swipe
from .routes import uploads
from .routes import verification
from .routes import email_verification  # NEW: Production email verification
from .routes import events
from .routes import projects
from .routes import reports  # NEW: Report system
from .routes import health
from .routes import metrics as metrics_router
from .routers import discovery_online  # NEW: Discovery Online endpoint
from .routers import discovery_nearby  # NEW: Discovery Nearby endpoint
from .routers import swipes  # NEW: Swipe system with match detection
from .routers import upload  # NEW: Photo upload with Cloudinary

# Setup structured logging
logger = setup_logging(
    level="INFO" if settings.NODE_ENV == "development" else "WARNING",
    use_json=settings.NODE_ENV == "production",
    log_file="logs/app.log" if settings.NODE_ENV == "production" else None
)

# Initialize Sentry (if DSN provided)
if settings.SENTRY_DSN:
    init_sentry(
        dsn=settings.SENTRY_DSN,
        environment=settings.NODE_ENV,
        traces_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        profiles_sample_rate=settings.SENTRY_TRACES_SAMPLE_RATE,
        enable_tracing=True
    )
    logger.info("[OK] Sentry error tracking initialized")
else:
    logger.warning("[WARN] Sentry DSN not configured - error tracking disabled")

# Initialize Prometheus metrics
init_metrics(app_name="colabmatch", version="1.0.0")
logger.info("[OK] Prometheus metrics initialized")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# [OK] Socket.IO server - ENABLED for real-time chat
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins=settings.CORS_ORIGIN.split(',') if settings.CORS_ORIGIN != "*" else "*",
    logger=True,
    engineio_logger=True
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    try:
        await init_db()
        logger.info("[OK] Database connected")
    except Exception as e:
        logger.warning(f"[WARN] Database connection failed: {e}")
        logger.warning("[WARN] Server will run WITHOUT database (for testing)")
    
    yield
    
    # Shutdown
    try:
        await close_db()
        logger.info("[OK] Database disconnected")
    except Exception as e:
        logger.warning(f"[WARN] Database disconnection skipped: {e}")


# Create FastAPI app
app = FastAPI(
    title="Alliv API",
    description="Professional collaboration platform API - Connect, collaborate, create",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add rate limiter to app state
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware - MUST be added FIRST (last in list = executes first)
# Get CORS origins from settings
cors_origins_str = settings.CORS_ORIGIN if hasattr(settings, 'CORS_ORIGIN') else "http://localhost:5173,http://localhost:3000"
cors_origins = cors_origins_str.split(',') if cors_origins_str != "*" else ["*"]
# Strip whitespace from origins
cors_origins = [origin.strip() for origin in cors_origins] if cors_origins_str != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight for 1 hour
)
logger.info(f"[OK] CORS middleware enabled - Origins: {cors_origins}")

# Compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Prometheus metrics middleware
app.add_middleware(PrometheusMiddleware)
logger.info("[OK] Prometheus metrics middleware enabled")

# Security headers middleware (production only)
if settings.NODE_ENV == "production":
    app.add_middleware(SecurityHeadersMiddleware)
    logger.info("[OK] Security headers enabled")

# Request logging middleware - DO NOT intercept OPTIONS, let CORS middleware handle it
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing and ensure CORS headers for POST responses"""
    start_time = time.time()
    
    # Process request - let CORS middleware and route handlers do their job
    response = await call_next(request)
    
    # Ensure CORS headers are present for POST/PUT/DELETE responses (backup if middleware doesn't apply)
    origin = request.headers.get("origin")
    if origin and request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        cors_origins_str = settings.CORS_ORIGIN if hasattr(settings, 'CORS_ORIGIN') else "http://localhost:5173,http://localhost:3000"
        cors_origins = cors_origins_str.split(',') if cors_origins_str != "*" else ["*"]
        
        # Only add if not already present (CORS middleware should have added it)
        if "Access-Control-Allow-Origin" not in response.headers:
            if origin in cors_origins or cors_origins_str == "*":
                response.headers["Access-Control-Allow-Origin"] = origin if cors_origins_str != "*" else "*"
                response.headers["Access-Control-Allow-Credentials"] = "true"
            else:
                # Development fallback
                response.headers["Access-Control-Allow-Origin"] = "*"
                response.headers["Access-Control-Allow-Credentials"] = "true"
    
    # Calculate duration
    duration_ms = (time.time() - start_time) * 1000
    
    # Log request
    logger.info(
        f"{request.method} {request.url.path}",
        extra={
            "method": request.method,
            "endpoint": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
            "ip_address": request.client.host if request.client else "unknown",
            "user_agent": request.headers.get("user-agent", "unknown")
        }
    )
    
    return response

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        f"Unhandled exception: {exc}",
        extra={
            "error_type": type(exc).__name__,
            "endpoint": request.url.path,
            "method": request.method,
            "ip_address": request.client.host if request.client else "unknown"
        },
        exc_info=True
    )
    
    # Capture exception to Sentry
    if settings.SENTRY_DSN:
        capture_exception(
            exc,
            user={"ip": request.client.host if request.client else "unknown"},
            tags={
                "endpoint": request.url.path,
                "method": request.method
            },
            extra={
                "request_id": getattr(request.state, "request_id", "unknown")
            }
        )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.NODE_ENV == "development" else "An error occurred"
        }
    )

# Include routers
app.include_router(health.router, tags=["Health"])  # Add health router first
app.include_router(metrics_router.router, tags=["Monitoring"])  # Add metrics router
app.include_router(auth.router, tags=["Authentication"])
app.include_router(email_verification.router, tags=["Email Verification"])  # NEW: Production email verification
app.include_router(profile.router, tags=["Profile"])
app.include_router(discovery.router, tags=["Discovery"])
app.include_router(discovery_online.router, tags=["Discovery Online"])  # NEW: Discovery Online
app.include_router(discovery_nearby.router, tags=["Discovery Nearby"])  # NEW: Discovery Nearby
app.include_router(swipes.router, tags=["Swipes"])  # NEW: Swipe system with match detection
app.include_router(upload.router, tags=["Upload"])  # NEW: Photo upload with Cloudinary
app.include_router(verification.router, tags=["Verification"])
app.include_router(events.router, tags=["Events"])
app.include_router(projects.router, tags=["Projects"])
app.include_router(reports.router, tags=["Reports"])  # NEW: Report system
app.include_router(chat.router, prefix="/chats", tags=["Chat"])

# [OK] Socket.IO WebSocket - ENABLED for real-time chat
# Import and register socket handlers
from .websocket_handlers import register_socket_handlers
register_socket_handlers(sio)

# Wrap FastAPI app with Socket.IO
socket_app = socketio.ASGIApp(sio, app)


@app.get("/", tags=["Root"])
async def root():
    """API root endpoint"""
    return {
        "status": "ok",
        "message": "Alliv API",
        "version": "1.0.0",
        "environment": settings.NODE_ENV,
        "docs": "/docs",
        "health": "/health"
    }

# Explicit OPTIONS handler at root level - MUST be LAST (after all routes)
# This catches all OPTIONS requests that CORS middleware didn't handle
@app.options("/{full_path:path}")
async def options_handler(request: Request, full_path: str):
    """Handle all OPTIONS preflight requests with proper CORS headers"""
    from fastapi.responses import Response
    
    origin = request.headers.get("origin", "")
    cors_origins_str = settings.CORS_ORIGIN if hasattr(settings, 'CORS_ORIGIN') else "http://localhost:5173,http://localhost:3000"
    cors_origins = cors_origins_str.split(',') if cors_origins_str != "*" else ["*"]
    cors_origins = [o.strip() for o in cors_origins]
    
    response = Response(status_code=200)
    
    # ALWAYS set Access-Control-Allow-Origin
    if origin:
        origin_stripped = origin.strip()
        if origin_stripped in cors_origins or cors_origins_str == "*":
            response.headers["Access-Control-Allow-Origin"] = origin_stripped if cors_origins_str != "*" else "*"
        else:
            response.headers["Access-Control-Allow-Origin"] = "*"  # Development fallback
    else:
        response.headers["Access-Control-Allow-Origin"] = "*"
    
    # ALWAYS set required CORS headers
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    requested_headers = request.headers.get("Access-Control-Request-Headers", "Content-Type, Authorization")
    response.headers["Access-Control-Allow-Headers"] = requested_headers
    response.headers["Access-Control-Max-Age"] = "3600"
    
    logger.info(f"OPTIONS /{full_path} - CORS preflight - Origin: {origin} - Allowed: {response.headers.get('Access-Control-Allow-Origin')}")
    return response

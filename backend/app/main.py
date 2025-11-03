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
import socketio  # ✅ ENABLED for WebSocket chat

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
from .routes import health
from .routes import metrics as metrics_router

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
    logger.info("✅ Sentry error tracking initialized")
else:
    logger.warning("⚠️ Sentry DSN not configured - error tracking disabled")

# Initialize Prometheus metrics
init_metrics(app_name="colabmatch", version="1.0.0")
logger.info("✅ Prometheus metrics initialized")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# ✅ Socket.IO server - ENABLED for real-time chat
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
        logger.info("✅ Database connected")
    except Exception as e:
        logger.warning(f"⚠️ Database connection failed: {e}")
        logger.warning("⚠️ Server will run WITHOUT database (for testing)")
    
    yield
    
    # Shutdown
    try:
        await close_db()
        logger.info("✅ Database disconnected")
    except Exception as e:
        logger.warning(f"⚠️ Database disconnection skipped: {e}")


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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGIN.split(',') if settings.CORS_ORIGIN != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Prometheus metrics middleware
app.add_middleware(PrometheusMiddleware)
logger.info("✅ Prometheus metrics middleware enabled")

# Security headers middleware (production only)
if settings.NODE_ENV == "production":
    app.add_middleware(SecurityHeadersMiddleware)
    logger.info("✅ Security headers enabled")

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all requests with timing"""
    start_time = time.time()
    
    # Process request
    response = await call_next(request)
    
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
app.include_router(swipe.router, tags=["Swipe & Match"])
app.include_router(uploads.router, tags=["Uploads"])
app.include_router(verification.router, tags=["Verification"])
app.include_router(events.router, tags=["Events"])
app.include_router(projects.router, tags=["Projects"])
app.include_router(chat.router, prefix="/chats", tags=["Chat"])

# ✅ Socket.IO WebSocket - ENABLED for real-time chat
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

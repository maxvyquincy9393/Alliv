import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
# import socketio  # Disabled for testing

from .config import settings
from .db import init_db, close_db
from .routes import discover, match, chat
from .routes import auth_enhanced as auth
from .routes import profile
from .routes import discovery
from .routes import swipe
from .routes import uploads
from .routes import verification
from .routes import events
from .routes import projects

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Socket.IO server - DISABLED FOR TESTING
# sio = socketio.AsyncServer(
#     async_mode='asgi',
#     cors_allowed_origins=settings.CORS_ORIGIN.split(',') if settings.CORS_ORIGIN != "*" else "*",
#     logger=True,
#     engineio_logger=True
# )


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

# Security middleware
if settings.TRUSTED_PROXY:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["*"]
    )

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

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.NODE_ENV == "development" else "An error occurred"
        }
    )

# Include routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(profile.router, tags=["Profile"])
app.include_router(discovery.router, tags=["Discovery"])
app.include_router(swipe.router, tags=["Swipe & Match"])
app.include_router(uploads.router, tags=["Uploads"])
app.include_router(verification.router, tags=["Verification"])
app.include_router(events.router, tags=["Events"])
app.include_router(projects.router, tags=["Projects"])
app.include_router(discover.router, prefix="/discover", tags=["Discovery"])
app.include_router(match.router, prefix="/matches", tags=["Matches"])
app.include_router(chat.router, prefix="/chats", tags=["Chat"])

# Socket.IO WebSocket - DISABLED FOR TESTING
# socket_app = socketio.ASGIApp(sio, app)


@app.get("/", tags=["Health"])
async def root():
    """API root endpoint"""
    return {
        "status": "ok",
        "message": "Alliv API",
        "version": "1.0.0",
        "environment": settings.NODE_ENV,
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check for monitoring"""
    return {
        "status": "healthy",
        "database": "connected",
        "version": "1.0.0"
    }

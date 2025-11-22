"""
Comprehensive health check endpoint
"""
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import psutil
import time
from typing import Dict, Any
import redis.asyncio as redis
from app.config import settings
import cloudinary
import cloudinary.uploader
import smtplib

router = APIRouter()

# Store startup time
STARTUP_TIME = time.time()


async def check_database_health() -> Dict[str, Any]:
    """Check MongoDB connection health"""
    try:
        from app.db import get_db
        db = get_db()
        # Ping database
        await db.command('ping')
        
        # Get server info
        server_info = await db.command('serverStatus')
        
        return {
            "status": "healthy",
            "connections": server_info.get("connections", {}).get("current", 0),
            "response_time_ms": 0  # Could measure actual ping time
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


async def check_redis_health() -> Dict[str, Any]:
    """Check Redis connection health"""
    if not settings.REDIS_URL:
        return {"status": "not_configured"}

    try:
        client = redis.Redis.from_url(settings.REDIS_URL)
        start = time.perf_counter()
        pong = await client.ping()
        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        await client.close()
        return {
            "status": "healthy" if pong else "unhealthy",
            "response_time_ms": elapsed_ms
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }


def get_system_health() -> Dict[str, Any]:
    """Get system resource usage"""
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "cpu_usage_percent": cpu_percent,
            "memory_usage_percent": memory.percent,
            "memory_available_mb": memory.available / (1024 * 1024),
            "disk_usage_percent": disk.percent,
            "disk_free_gb": disk.free / (1024 * 1024 * 1024)
        }
    except Exception as e:
        return {
            "error": str(e)
        }


def get_uptime() -> Dict[str, Any]:
    """Get application uptime"""
    uptime_seconds = time.time() - STARTUP_TIME
    
    days = int(uptime_seconds // 86400)
    hours = int((uptime_seconds % 86400) // 3600)
    minutes = int((uptime_seconds % 3600) // 60)
    seconds = int(uptime_seconds % 60)
    
    return {
        "uptime_seconds": int(uptime_seconds),
        "uptime_formatted": f"{days}d {hours}h {minutes}m {seconds}s"
    }


async def check_cloudinary_health() -> Dict[str, Any]:
    """Validate Cloudinary configuration without uploading"""
    if not settings.CLOUDINARY_CLOUD_NAME:
        return {"status": "not_configured"}
    try:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET
        )
        # lightweight config check
        return {"status": "configured"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


async def check_smtp_health() -> Dict[str, Any]:
    """Lightweight SMTP config check (no network dial)"""
    if not settings.SMTP_URL:
        return {"status": "not_configured"}
    try:
        return {"status": "configured"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


@router.get("/health")
async def health_check():
    """
    Comprehensive health check endpoint
    
    Returns detailed system status including:
    - Overall health status
    - Database connectivity
    - Redis connectivity (if configured)
    - System resources (CPU, memory, disk)
    - Application uptime
    - Timestamp
    """
    try:
        # Check database
        db_health = await check_database_health()
        
        # Check Redis (if configured)
        redis_health = await check_redis_health()

        cloudinary_health = await check_cloudinary_health()
        smtp_health = await check_smtp_health()
        
        # Get system stats
        system_health = get_system_health()
        
        # Get uptime
        uptime = get_uptime()
        
        # Determine overall status
        # Relaxed thresholds for development environment
        def ok(val: str) -> bool:
            return val == "healthy"

        prod = settings.NODE_ENV == "production"

        redis_ok = True
        if redis_health.get("status") not in {"not_configured", "healthy"}:
            redis_ok = False

        cloudinary_ok = True
        if prod and cloudinary_health.get("status") != "configured":
            cloudinary_ok = False

        smtp_ok = True
        if prod and smtp_health.get("status") != "configured":
            smtp_ok = False

        is_healthy = (
            ok(db_health.get("status", "")) and
            redis_ok and cloudinary_ok and smtp_ok and
            system_health.get("cpu_usage_percent", 100) < 99 and
            system_health.get("memory_usage_percent", 100) < 99 and
            system_health.get("disk_usage_percent", 100) < 99
        )
        
        status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
        
        return JSONResponse(
            status_code=status_code,
            content={
                "status": "healthy" if is_healthy else "degraded",
                "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
                "checks": {
                    "database": db_health,
                    "redis": redis_health,
                    "cloudinary": cloudinary_health,
                    "smtp": smtp_health,
                    "system": system_health
                },
                "uptime": uptime
            }
        )
        
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "timestamp": datetime.now(timezone.utc).isoformat() + "Z",
                "error": str(e)
            }
        )


@router.get("/health/live")
async def liveness_check():
    """
    Simple liveness check for Kubernetes
    Returns 200 if application is running
    """
    return {"status": "alive"}


@router.get("/health/ready")
async def readiness_check():
    """
    Readiness check for Kubernetes
    Returns 200 if application is ready to serve traffic
    """
    try:
        # Check critical dependencies
        db_health = await check_database_health()
        
        if db_health.get("status") == "healthy":
            return {"status": "ready"}
        else:
            return JSONResponse(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                content={"status": "not_ready", "reason": "database_unhealthy"}
            )
    except Exception as e:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "not_ready", "error": str(e)}
        )


# Usage in main.py:
"""
from app.routes.health import router as health_router

app.include_router(health_router, tags=["health"])
"""

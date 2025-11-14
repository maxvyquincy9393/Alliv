"""
Comprehensive health check endpoint
"""
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from datetime import datetime, timezone
import psutil
import time
from typing import Dict, Any

router = APIRouter()

# Store startup time
STARTUP_TIME = time.time()


async def check_database_health() -> Dict[str, Any]:
    """Check MongoDB connection health"""
    try:
        from app.db import get_db
        db = await get_db()
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
    # Placeholder - implement if using Redis
    return {
        "status": "not_configured"
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
        
        # Get system stats
        system_health = get_system_health()
        
        # Get uptime
        uptime = get_uptime()
        
        # Determine overall status
        is_healthy = (
            db_health.get("status") == "healthy" and
            system_health.get("cpu_usage_percent", 100) < 90 and
            system_health.get("memory_usage_percent", 100) < 90 and
            system_health.get("disk_usage_percent", 100) < 90
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

"""
Metrics endpoint for Prometheus scraping.
"""
from fastapi import APIRouter, Response
from ..integrations.metrics import get_metrics, get_metrics_content_type

router = APIRouter(tags=["Monitoring"])


@router.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint.
    
    Returns metrics in Prometheus text format for scraping.
    """
    return Response(
        content=get_metrics(),
        media_type=get_metrics_content_type()
    )


@router.get("/health/metrics")
async def metrics_health():
    """
    Health check for metrics system.
    
    Returns basic status of metrics collection.
    """
    return {
        "status": "healthy",
        "metrics_enabled": True,
        "endpoint": "/metrics"
    }

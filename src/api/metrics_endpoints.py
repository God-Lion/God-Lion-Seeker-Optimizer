"""
Metrics API endpoints for Prometheus scraping.

This module provides HTTP endpoints that expose application metrics
in Prometheus format for monitoring and alerting.
"""
from fastapi import APIRouter, Response
from typing import Dict, Any
import structlog

from src.services.metrics_service import get_metrics_service

logger = structlog.get_logger(__name__)

# Create router
router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get(
    "",
    response_class=Response,
    summary="Get Prometheus metrics",
    description="Returns application metrics in Prometheus text format for scraping"
)
async def get_metrics():
    """
    Endpoint for Prometheus to scrape metrics.
    
    Returns metrics in Prometheus text format including:
    - Scraping operations (success/failure rates, duration)
    - Database queries (count, duration, errors)
    - Job processing (matches, storage)
    - Cache operations (hits, misses, size)
    - System metrics (memory, connections)
    
    Example Prometheus config:
    ```yaml
    scrape_configs:
      - job_name: 'linkedin_scraper'
        static_configs:
          - targets: ['localhost:8000']
        metrics_path: '/metrics'
        scrape_interval: 15s
    ```
    """
    try:
        metrics_service = get_metrics_service()
        metrics_data = metrics_service.generate_metrics()
        
        return Response(
            content=metrics_data,
            media_type=metrics_service.get_content_type()
        )
    except Exception as e:
        logger.error("metrics_endpoint_error", error=str(e))
        # Return empty metrics on error to avoid breaking Prometheus
        return Response(
            content=b"# Error generating metrics\n",
            media_type="text/plain"
        )


@router.get(
    "/health",
    response_model=Dict[str, Any],
    summary="Get health status with metrics summary",
    description="Returns application health status along with key metrics"
)
async def get_health_with_metrics():
    """
    Health check endpoint with metrics summary.
    
    Useful for:
    - Application monitoring dashboards
    - Quick health status checks
    - Debugging metrics before Prometheus setup
    
    Returns:
        JSON with status and metrics summary
    """
    try:
        metrics_service = get_metrics_service()
        summary = metrics_service.get_metrics_summary()
        
        # Calculate some health indicators
        total_jobs = summary.get('total_jobs_scraped', 0)
        total_errors = summary.get('errors', 0)
        
        # Simple health check: if error rate > 50%, status is degraded
        error_rate = (total_errors / total_jobs * 100) if total_jobs > 0 else 0
        
        if error_rate > 50:
            status = "degraded"
        elif error_rate > 20:
            status = "warning"
        else:
            status = "healthy"
        
        # Calculate cache hit rate
        cache_hits = summary.get('cache_hits', 0)
        cache_misses = summary.get('cache_misses', 0)
        total_cache_ops = cache_hits + cache_misses
        cache_hit_rate = (cache_hits / total_cache_ops * 100) if total_cache_ops > 0 else 0
        
        return {
            "status": status,
            "timestamp": None,  # Will be set by FastAPI
            "metrics": {
                "scraping": {
                    "total_jobs_scraped": total_jobs,
                    "active_sessions": summary.get('active_sessions', 0),
                    "total_sessions": summary.get('total_sessions', 0),
                    "error_rate_percent": round(error_rate, 2)
                },
                "database": {
                    "total_queries": summary.get('db_queries', 0)
                },
                "cache": {
                    "hits": cache_hits,
                    "misses": cache_misses,
                    "hit_rate_percent": round(cache_hit_rate, 2)
                }
            }
        }
    except Exception as e:
        logger.error("health_endpoint_error", error=str(e))
        return {
            "status": "error",
            "error": str(e),
            "metrics": {}
        }


@router.get(
    "/summary",
    response_model=Dict[str, Any],
    summary="Get detailed metrics summary",
    description="Returns detailed breakdown of all metrics (for debugging)"
)
async def get_metrics_summary():
    """
    Detailed metrics summary for debugging and monitoring dashboards.
    
    Returns full breakdown of all collected metrics in JSON format.
    Useful for:
    - Custom monitoring dashboards
    - Debugging metrics collection
    - Integration with non-Prometheus systems
    """
    try:
        metrics_service = get_metrics_service()
        return metrics_service.get_metrics_summary()
    except Exception as e:
        logger.error("summary_endpoint_error", error=str(e))
        return {"error": str(e)}

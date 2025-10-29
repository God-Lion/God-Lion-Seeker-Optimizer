"""
Enhanced Health Check Endpoints
Provides comprehensive health status, readiness checks, and system metrics
"""

import asyncio
import time
from datetime import datetime
from typing import Any, Dict

import psutil
import structlog
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.database import get_db, engine
from src.config.settings import settings

logger = structlog.get_logger(__name__)
router = APIRouter()

# Track application start time
START_TIME = time.time()


def get_uptime() -> float:
    """Calculate application uptime in seconds."""
    return time.time() - START_TIME


def format_uptime(seconds: float) -> str:
    """Format uptime as human-readable string."""
    days, remainder = divmod(int(seconds), 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, seconds = divmod(remainder, 60)
    
    parts = []
    if days > 0:
        parts.append(f"{days}d")
    if hours > 0:
        parts.append(f"{hours}h")
    if minutes > 0:
        parts.append(f"{minutes}m")
    parts.append(f"{seconds}s")
    
    return " ".join(parts)


async def check_database_health(db: AsyncSession) -> Dict[str, Any]:
    """
    Perform comprehensive database health check.
    
    Returns:
        Dictionary with database health information
    """
    check_result = {
        "status": "unknown",
        "response_time_ms": None,
        "pool_size": None,
        "pool_checked_in": None,
        "pool_checked_out": None,
        "pool_overflow": None,
        "error": None,
    }
    
    try:
        # Measure database response time
        start = time.time()
        await db.execute(text("SELECT 1"))
        response_time = (time.time() - start) * 1000
        
        check_result["status"] = "healthy"
        check_result["response_time_ms"] = round(response_time, 2)
        
        # Get connection pool stats
        pool = engine.pool
        check_result["pool_size"] = pool.size()
        check_result["pool_checked_in"] = pool.checkedin()
        check_result["pool_checked_out"] = pool.checkedout()
        check_result["pool_overflow"] = pool.overflow()
        
    except asyncio.TimeoutError:
        check_result["status"] = "unhealthy"
        check_result["error"] = "Database connection timeout"
        logger.error("Database health check timeout")
    except Exception as e:
        check_result["status"] = "unhealthy"
        check_result["error"] = str(e)
        logger.error("Database health check failed", error=str(e), exc_info=True)
    
    return check_result


def get_system_metrics() -> Dict[str, Any]:
    """
    Collect system resource metrics.
    
    Returns:
        Dictionary with system metrics
    """
    try:
        cpu_percent = psutil.cpu_percent(interval=0.1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return {
            "cpu": {
                "usage_percent": round(cpu_percent, 2),
                "count": psutil.cpu_count(),
            },
            "memory": {
                "total_mb": round(memory.total / (1024 * 1024), 2),
                "available_mb": round(memory.available / (1024 * 1024), 2),
                "used_mb": round(memory.used / (1024 * 1024), 2),
                "usage_percent": round(memory.percent, 2),
            },
            "disk": {
                "total_gb": round(disk.total / (1024 * 1024 * 1024), 2),
                "used_gb": round(disk.used / (1024 * 1024 * 1024), 2),
                "free_gb": round(disk.free / (1024 * 1024 * 1024), 2),
                "usage_percent": round(disk.percent, 2),
            },
        }
    except Exception as e:
        logger.error("Failed to collect system metrics", error=str(e))
        return {"error": str(e)}


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint.
    Returns 200 if the service is running.
    
    This is a lightweight endpoint suitable for load balancer health checks.
    """
    uptime_seconds = get_uptime()
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "God Lion Seeker Optimizer",
        "version": settings.app_version,
        "uptime_seconds": round(uptime_seconds, 2),
        "uptime": format_uptime(uptime_seconds),
    }


@router.get("/health/live", status_code=status.HTTP_200_OK)
async def liveness_check() -> Dict[str, Any]:
    """
    Kubernetes liveness probe endpoint.
    
    Returns 200 if the service is alive and responsive.
    This endpoint should be very lightweight and fast.
    """
    return {
        "status": "alive",
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/health/ready")
async def readiness_check(
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Kubernetes readiness probe endpoint.
    
    Verifies that all critical dependencies are ready:
    - Database connectivity
    - Connection pool availability
    
    Returns 200 if ready, 503 if not ready.
    """
    checks = {
        "database": {},
        "dependencies": [],
    }
    
    overall_status = "ready"
    response_status = status.HTTP_200_OK
    
    # Check database
    db_check = await check_database_health(db)
    checks["database"] = db_check
    
    if db_check["status"] != "healthy":
        overall_status = "not_ready"
        response_status = status.HTTP_503_SERVICE_UNAVAILABLE
    
    # Add more dependency checks here as needed
    # Example: Redis, external APIs, etc.
    
    response_data = {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "checks": checks,
    }
    
    return JSONResponse(
        status_code=response_status,
        content=response_data,
    )


@router.get("/health/detailed", status_code=status.HTTP_200_OK)
async def detailed_health_check(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Comprehensive health check with detailed system information.
    
    Includes:
    - Service status
    - Database health and metrics
    - System resource usage
    - Application uptime
    
    This endpoint provides deep insights for monitoring and debugging.
    """
    uptime_seconds = get_uptime()
    
    # Perform all health checks
    db_check = await check_database_health(db)
    system_metrics = get_system_metrics()
    
    # Determine overall health
    is_healthy = db_check["status"] == "healthy"
    
    response = {
        "status": "healthy" if is_healthy else "degraded",
        "timestamp": datetime.utcnow().isoformat(),
        "service": {
            "name": "God Lion Seeker Optimizer",
            "version": settings.app_version,
            "environment": settings.environment,
            "uptime_seconds": round(uptime_seconds, 2),
            "uptime": format_uptime(uptime_seconds),
        },
        "database": db_check,
        "system": system_metrics,
        "configuration": {
            "debug_mode": settings.debug,
            "database_pool_size": settings.db_pool_size,
            "database_max_overflow": settings.db_max_overflow,
        },
    }
    
    return response


@router.get("/health/startup")
async def startup_check(
    db: AsyncSession = Depends(get_db),
) -> JSONResponse:
    """
    Kubernetes startup probe endpoint.
    
    Similar to readiness check but with different semantics.
    Used to know when the application has started successfully.
    
    Returns 200 when started, 503 otherwise.
    """
    # Check if application has been running for at least 5 seconds
    uptime = get_uptime()
    if uptime < 5:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "starting",
                "message": "Application is still starting up",
                "uptime_seconds": round(uptime, 2),
            },
        )
    
    # Perform basic dependency checks
    db_check = await check_database_health(db)
    
    if db_check["status"] != "healthy":
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "message": "Database is not ready",
                "database": db_check,
            },
        )
    
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "started",
            "timestamp": datetime.utcnow().isoformat(),
            "uptime_seconds": round(uptime, 2),
        },
    )


@router.get("/metrics", status_code=status.HTTP_200_OK)
async def metrics_endpoint(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Application metrics endpoint.
    
    Provides metrics in a structured format that can be consumed by
    monitoring systems like Prometheus, Datadog, or custom dashboards.
    
    Metrics include:
    - Application metadata
    - Database metrics
    - System resource metrics
    - Custom application metrics
    """
    uptime_seconds = get_uptime()
    
    # Collect all metrics
    db_check = await check_database_health(db)
    system_metrics = get_system_metrics()
    
    metrics = {
        "timestamp": datetime.utcnow().isoformat(),
        "application": {
            "name": "godlionseeker",
            "version": settings.app_version,
            "environment": settings.environment,
            "uptime_seconds": round(uptime_seconds, 2),
        },
        "database": {
            "status": db_check["status"],
            "response_time_ms": db_check.get("response_time_ms"),
            "pool_size": db_check.get("pool_size"),
            "pool_checked_in": db_check.get("pool_checked_in"),
            "pool_checked_out": db_check.get("pool_checked_out"),
            "pool_overflow": db_check.get("pool_overflow"),
        },
        "system": system_metrics,
        # Add custom application metrics here
        "custom": {
            "jobs_scraped_total": 0,  # TODO: Implement counter
            "scraping_sessions_active": 0,  # TODO: Implement gauge
            "api_requests_total": 0,  # TODO: Implement counter
        },
    }
    
    return metrics


@router.get("/metrics/prometheus", status_code=status.HTTP_200_OK)
async def prometheus_metrics(
    db: AsyncSession = Depends(get_db),
) -> str:
    """
    Prometheus-compatible metrics endpoint.
    
    Returns metrics in Prometheus text exposition format.
    For production use, consider using prometheus_client library.
    """
    uptime_seconds = get_uptime()
    db_check = await check_database_health(db)
    system_metrics = get_system_metrics()
    
    # Build Prometheus format metrics
    metrics_lines = [
        "# HELP app_uptime_seconds Application uptime in seconds",
        "# TYPE app_uptime_seconds gauge",
        f"app_uptime_seconds {uptime_seconds}",
        "",
        "# HELP db_response_time_milliseconds Database response time in milliseconds",
        "# TYPE db_response_time_milliseconds gauge",
        f"db_response_time_milliseconds {db_check.get('response_time_ms', 0)}",
        "",
        "# HELP db_pool_size Database connection pool size",
        "# TYPE db_pool_size gauge",
        f"db_pool_size {db_check.get('pool_size', 0)}",
        "",
        "# HELP db_pool_checked_out Database connections currently checked out",
        "# TYPE db_pool_checked_out gauge",
        f"db_pool_checked_out {db_check.get('pool_checked_out', 0)}",
        "",
        "# HELP system_cpu_usage_percent CPU usage percentage",
        "# TYPE system_cpu_usage_percent gauge",
        f"system_cpu_usage_percent {system_metrics.get('cpu', {}).get('usage_percent', 0)}",
        "",
        "# HELP system_memory_usage_percent Memory usage percentage",
        "# TYPE system_memory_usage_percent gauge",
        f"system_memory_usage_percent {system_metrics.get('memory', {}).get('usage_percent', 0)}",
        "",
        "# HELP system_disk_usage_percent Disk usage percentage",
        "# TYPE system_disk_usage_percent gauge",
        f"system_disk_usage_percent {system_metrics.get('disk', {}).get('usage_percent', 0)}",
    ]
    
    return "\n".join(metrics_lines)

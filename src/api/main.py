"""
FastAPI Main Application
Provides REST API for God Lion Seeker Optimizer
"""

import asyncio
import sys

# Event loop policy is now set in run_server.py before any imports
# This ensures Playwright subprocess support works on Windows

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog

from src.api.routes import (
    health, jobs, scraping, analysis, companies, statistics,
    career_recommendations, sse_streaming, role_analysis,
    auth, profiles, dashboard, automation, notifications, guest, jobs_enhanced, admin, rbac_admin
)
from src.config.database import get_db_session, init_db
from src.config.settings import settings

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    # Startup
    logger.info("Starting God Lion Seeker Optimizer API")
    
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.warning("Failed to initialize database - continuing without DB", error=str(e))
        # Don't raise - allow API to start without database
    
    yield
    
    # Shutdown
    logger.info("Shutting down God Lion Seeker Optimizer API")


# Create FastAPI application
app = FastAPI(
    title="God Lion Seeker Optimizer API",
    description="AI-Powered God Lion Seeker Optimizer with Intelligent Job Application System",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status_code": exc.status_code},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions."""
    logger.error("Unhandled exception", error=str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal server error",
            "status_code": status.HTTP_500_INTERNAL_SERVER_ERROR,
        },
    )


# Root endpoint
@app.get("/", tags=["Root"])
async def root() -> dict[str, Any]:
    """Root endpoint."""
    return {
        "message": "God Lion Seeker Optimizer API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/api/health",
    }


# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])

# Guest/Anonymous User Routes
app.include_router(guest.router, prefix="/api/career", tags=["Guest Users"])

# Authentication & User Management
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profile Management"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(automation.router, prefix="/api/automation", tags=["Automation"])

# Job Search & Scraping
app.include_router(scraping.router, prefix="/api/scraping", tags=["Scraping"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(jobs_enhanced.router, prefix="/api/jobs", tags=["Jobs - Enhanced"])
app.include_router(companies.router, prefix="/api/companies", tags=["Companies"])

# Analysis & Recommendations
app.include_router(role_analysis.router, prefix="/api/analysis", tags=["Role Analysis"])
app.include_router(statistics.router, prefix="/api/statistics", tags=["Statistics"])
app.include_router(career_recommendations.router, prefix="/api", tags=["Career Recommendations"])

# Streaming
app.include_router(sse_streaming.router, prefix="/api", tags=["Server-Sent Events"])

# Admin
app.include_router(admin.router, tags=["Admin"])
app.include_router(rbac_admin.router, tags=["Admin - RBAC"])


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "src.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )

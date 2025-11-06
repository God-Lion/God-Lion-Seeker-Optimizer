"""
Scraping Endpoints
Manage job scraping operations
"""

from typing import Any, Optional
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from src.config.database import get_db_session
from src.services.job_scraping_service import JobScrapingService
from src.repositories.scraping_session_repository import ScrapingSessionRepository
from src.auth.dependencies import require_permission, get_current_active_user
from src.models.permission import PermissionType
from src.models.user import User

logger = structlog.get_logger(__name__)
router = APIRouter()


class ScrapeRequest(BaseModel):
    """Request model for scraping jobs."""
    
    query: str = Field(..., description="Job search query", min_length=1)
    location: str = Field(default="", description="Job location")
    max_jobs: int = Field(default=25, description="Maximum jobs to scrape", ge=1, le=100)
    experience_level: Optional[str] = Field(default=None, description="Experience level filter")
    platforms: Optional[list[str]] = Field(default=['both'], description="Platforms to scrape from: 'linkedin', 'indeed', or 'both'")


class ScrapeResponse(BaseModel):
    """Response model for scraping jobs."""
    
    session_id: int
    status: str
    message: str
    query: str
    location: str
    max_jobs: int
    platforms: list[str]
    timestamp: datetime


async def run_scraping_task(
    query: str,
    location: str,
    max_jobs: int,
    experience_level: Optional[str],
    platforms: list[str],
    db: AsyncSession,
) -> None:
    """Background task to run scraping."""
    try:
        logger.info(
            "Starting background scraping task",
            query=query,
            location=location,
            max_jobs=max_jobs,
            platforms=platforms,
        )
        
        service = JobScrapingService(db, platforms=platforms)
        await service.scrape_and_store_jobs(
            query=query,
            location=location,
            max_jobs=max_jobs,
            experience_level=experience_level,
        )
        
        logger.info("Background scraping task completed", query=query, platforms=platforms)
    except Exception as e:
        logger.error("Background scraping task failed", error=str(e), exc_info=True)


@router.post("/start", status_code=status.HTTP_202_ACCEPTED, response_model=ScrapeResponse)
async def start_scraping(
    request: ScrapeRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_permission(PermissionType.SCRAPER_START)),
) -> dict[str, Any]:
    """
    Start a new scraping job.
    The scraping runs in the background and returns immediately.
    """
    try:
        # Create a scraping session
        session_repo = ScrapingSessionRepository(db)
        session = await session_repo.create_session(
            query=request.query,
            location=request.location,
            max_jobs=request.max_jobs,
        )
        
        # Add scraping task to background
        background_tasks.add_task(
            run_scraping_task,
            request.query,
            request.location,
            request.max_jobs,
            request.experience_level,
            request.platforms,
            db,
        )
        
        logger.info(
            "Scraping job started",
            session_id=session.id,
            query=request.query,
        )
        
        return {
            "session_id": session.id,
            "status": "started",
            "message": "Scraping job started successfully",
            "query": request.query,
            "location": request.location,
            "max_jobs": request.max_jobs,
            "platforms": request.platforms,
            "timestamp": datetime.utcnow(),
        }
    
    except Exception as e:
        logger.error("Failed to start scraping", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start scraping: {str(e)}",
        )


@router.get("/sessions/{session_id}", status_code=status.HTTP_200_OK)
async def get_session_status(
    session_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """Get the status of a scraping session."""
    try:
        session_repo = ScrapingSessionRepository(db)
        session = await session_repo.get_by_id(session_id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found",
            )
        
        return {
            "session_id": session.id,
            "query": session.query,
            # location is not stored on the model; omit it for now
            "status": session.status,
            # jobs_found is not a model column; use total_jobs as a proxy
            "jobs_found": session.total_jobs,
            "jobs_scraped": session.jobs_scraped,
            "started_at": session.started_at.isoformat() if session.started_at else None,
            "completed_at": session.completed_at.isoformat() if session.completed_at else None,
            # error_message is not a model column; omit it for now
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get session status", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get session status: {str(e)}",
        )


@router.post("/sessions/{session_id}/stop", status_code=status.HTTP_200_OK)
async def stop_session(
    session_id: int,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(require_permission(PermissionType.SCRAPER_STOP)),
) -> dict[str, Any]:
    """Stop a running scraping session."""
    try:
        session_repo = ScrapingSessionRepository(db)
        session = await session_repo.get_by_id(session_id)
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Session {session_id} not found",
            )
        
        if session.status not in ['pending', 'running']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Session {session_id} cannot be stopped (status: {session.status})",
            )
        
        # Update session status to stopped
        session.status = 'stopped'
        session.completed_at = datetime.utcnow()
        await db.commit()
        
        logger.info("Session stopped", session_id=session_id)
        
        return {
            "session_id": session.id,
            "status": "stopped",
            "message": "Session stopped successfully",
            "stopped_at": session.completed_at.isoformat(),
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to stop session", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to stop session: {str(e)}",
        )


@router.get("/sessions", status_code=status.HTTP_200_OK)
async def list_sessions(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db_session),
    current_user: User = Depends(get_current_active_user),
) -> dict[str, Any]:
    """List all scraping sessions."""
    try:
        session_repo = ScrapingSessionRepository(db)
        sessions = await session_repo.get_all(skip=skip, limit=limit)
        
        return {
            "sessions": [
                {
                    "session_id": session.id,
                    "query": session.query,
                    # location not stored on model; omit
                    "status": session.status,
                    "jobs_found": session.total_jobs,
                    "jobs_scraped": session.jobs_scraped,
                    "started_at": session.started_at.isoformat() if session.started_at else None,
                    "completed_at": session.completed_at.isoformat() if session.completed_at else None,
                }
                for session in sessions
            ],
            "skip": skip,
            "limit": limit,
            "total": len(sessions),
        }
    
    except Exception as e:
        logger.error("Failed to list sessions", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list sessions: {str(e)}",
        )

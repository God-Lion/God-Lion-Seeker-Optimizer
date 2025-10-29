"""
Jobs Endpoints
Manage and query scraped jobs
"""

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from src.config.database import get_db_session
from src.repositories.job_repository import JobRepository

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.get("/", status_code=status.HTTP_200_OK)
async def list_jobs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of records to return"),
    company: Optional[str] = Query(None, description="Filter by company name"),
    location: Optional[str] = Query(None, description="Filter by location"),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """List all scraped jobs with optional filters."""
    try:
        job_repo = JobRepository(db)
        
        # Get jobs with filters
        jobs = await job_repo.get_jobs_with_filters(
            skip=skip,
            limit=limit,
            company=company,
            location=location,
        )
        
        return {
            "jobs": [
                {
                    "id": job.id,
                    "title": job.title,
                    "company_name": job.company.name if job.company else None,
                    "location": job.place,
                    "date": job.date,
                    "date_text": job.date_text,
                    "job_url": job.link,
                    "apply_url": job.apply_link,
                    "description_preview": job.description[:200] if job.description else None,
                }
                for job in jobs
            ],
            "skip": skip,
            "limit": limit,
            "total": len(jobs),
        }
    
    except Exception as e:
        logger.error("Failed to list jobs", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list jobs: {str(e)}",
        )


@router.get("/{job_id}", status_code=status.HTTP_200_OK)
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """Get detailed information about a specific job."""
    try:
        job_repo = JobRepository(db)
        job = await job_repo.get_by_id(job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found",
            )
        
        return {
            "id": job.id,
            "job_id": job.job_id,
            "title": job.title,
            "company_name": job.company.name if job.company else None,
            "company_id": job.company_id,
            "location": job.place,
            "description": job.description,
            "description_html": job.description_html,
            "date": job.date,
            "date_text": job.date_text,
            "job_url": job.link,
            "apply_url": job.apply_link,
            "is_active": job.is_active,
            "insights": job.insights,
            "match_score": job.match_score,
            "match_details": job.match_details,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "updated_at": job.updated_at.isoformat() if job.updated_at else None,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get job", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get job: {str(e)}",
        )


@router.get("/search/", status_code=status.HTTP_200_OK)
async def search_jobs(
    q: str = Query(..., min_length=1, description="Search query"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """Search jobs by keyword in title and description."""
    try:
        job_repo = JobRepository(db)
        
        # Search jobs (this would need to be implemented in the repository)
        jobs = await job_repo.search_jobs(query=q, skip=skip, limit=limit)
        
        return {
            "query": q,
            "jobs": [
                {
                    "id": job.id,
                    "title": job.title,
                    "company_name": job.company.name if job.company else None,
                    "location": job.place,
                    "date": job.date,
                    "date_text": job.date_text,
                    "job_url": job.link,
                    "description_preview": job.description[:200] if job.description else None,
                }
                for job in jobs
            ],
            "skip": skip,
            "limit": limit,
            "total": len(jobs),
        }
    
    except Exception as e:
        logger.error("Failed to search jobs", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search jobs: {str(e)}",
        )


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> None:
    """Delete a job."""
    try:
        job_repo = JobRepository(db)
        job = await job_repo.get_by_id(job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found",
            )
        
        await job_repo.delete(job)
        logger.info("Job deleted", job_id=job_id)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete job", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete job: {str(e)}",
        )

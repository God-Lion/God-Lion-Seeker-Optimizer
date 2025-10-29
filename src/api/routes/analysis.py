"""
Job Analysis API Endpoints
Provides endpoints for job analysis and matching
"""

from typing import Any, Dict, List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from src.config.database import get_db
from src.repositories.job_analysis_repository import JobAnalysisRepository
from src.repositories.job_repository import JobRepository

logger = structlog.get_logger(__name__)
router = APIRouter()


class JobAnalysisRequest(BaseModel):
    """Request model for creating job analysis."""
    
    job_id: int = Field(..., description="ID of the job to analyze")
    match_score: float = Field(..., ge=0, le=100, description="Overall match score (0-100)")
    skills_match: float = Field(..., ge=0, le=100, description="Skills match score (0-100)")
    experience_match: float = Field(..., ge=0, le=100, description="Experience match score (0-100)")
    education_match: float = Field(..., ge=0, le=100, description="Education match score (0-100)")
    recommended: bool = Field(default=False, description="Whether this job is recommended")


@router.get("/jobs/{job_id}/analysis", status_code=status.HTTP_200_OK)
async def get_job_analysis(
    job_id: int,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get analysis for a specific job.
    
    Args:
        job_id: ID of the job to analyze
        db: Database session
        
    Returns:
        Job analysis data
    """
    try:
        job_repo = JobRepository(db)
        analysis_repo = JobAnalysisRepository(db)
        
        # Check if job exists
        job = await job_repo.get_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job with ID {job_id} not found",
            )
        
        # Get analysis
        analysis = await analysis_repo.get_by_job_id(job_id)
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis for job {job_id} not found",
            )
        
        return {
            "job_id": analysis.job_id,
            "match_score": analysis.match_score,
            "skills_match": analysis.skills_match,
            "experience_match": analysis.experience_match,
            "education_match": analysis.education_match,
            "analysis_date": analysis.analysis_date.isoformat() if analysis.analysis_date else None,
            "recommended": analysis.recommended,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get job analysis", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve job analysis",
        )


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_job_analysis(
    request: JobAnalysisRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create a new job analysis.
    
    Args:
        request: Job analysis data
        db: Database session
        
    Returns:
        Created analysis data
    """
    try:
        job_repo = JobRepository(db)
        analysis_repo = JobAnalysisRepository(db)
        
        # Check if job exists
        job = await job_repo.get_by_id(request.job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job with ID {request.job_id} not found",
            )
        
        # Check if analysis already exists
        existing_analysis = await analysis_repo.get_by_job_id(request.job_id)
        if existing_analysis:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Analysis for job {request.job_id} already exists",
            )
        
        # Create new analysis
        analysis = await analysis_repo.create(
            job_id=request.job_id,
            match_score=request.match_score,
            skills_match=request.skills_match,
            experience_match=request.experience_match,
            education_match=request.education_match,
            recommended=request.recommended,
        )
        
        return {
            "id": analysis.id,
            "job_id": analysis.job_id,
            "match_score": analysis.match_score,
            "skills_match": analysis.skills_match,
            "experience_match": analysis.experience_match,
            "education_match": analysis.education_match,
            "analysis_date": analysis.analysis_date.isoformat() if analysis.analysis_date else None,
            "recommended": analysis.recommended,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create job analysis", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job analysis",
        )


@router.put("/{job_id}", status_code=status.HTTP_200_OK)
async def update_job_analysis(
    job_id: int,
    request: JobAnalysisRequest,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Update an existing job analysis.
    
    Args:
        job_id: ID of the job whose analysis to update
        request: Updated analysis data
        db: Database session
        
    Returns:
        Updated analysis data
    """
    try:
        analysis_repo = JobAnalysisRepository(db)
        
        # Get existing analysis
        analysis = await analysis_repo.get_by_job_id(job_id)
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis for job {job_id} not found",
            )
        
        # Update analysis
        analysis = await analysis_repo.update(
            job_id=job_id,
            match_score=request.match_score,
            skills_match=request.skills_match,
            experience_match=request.experience_match,
            education_match=request.education_match,
            recommended=request.recommended,
        )
        
        return {
            "id": analysis.id,
            "job_id": analysis.job_id,
            "match_score": analysis.match_score,
            "skills_match": analysis.skills_match,
            "experience_match": analysis.experience_match,
            "education_match": analysis.education_match,
            "analysis_date": analysis.analysis_date.isoformat() if analysis.analysis_date else None,
            "recommended": analysis.recommended,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update job analysis", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update job analysis",
        )


@router.delete("/{job_id}", status_code=status.HTTP_200_OK)
async def delete_job_analysis(
    job_id: int,
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete a job analysis.
    
    Args:
        job_id: ID of the job whose analysis to delete
        db: Database session
        
    Returns:
        Deletion confirmation
    """
    try:
        analysis_repo = JobAnalysisRepository(db)
        
        # Check if analysis exists
        analysis = await analysis_repo.get_by_job_id(job_id)
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis for job {job_id} not found",
            )
        
        # Delete analysis
        await analysis_repo.delete_by_job_id(job_id)
        
        return {
            "message": f"Analysis for job {job_id} deleted successfully",
            "job_id": job_id,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete job analysis", job_id=job_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete job analysis",
        )


@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_analysis_stats(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get statistics about job analyses.
    
    Returns:
        Analysis statistics
    """
    try:
        from sqlalchemy import select, func
        from models import JobAnalysis
        
        # Get total count
        total_query = select(func.count(JobAnalysis.id))
        total = await db.scalar(total_query)
        
        # Get recommended count
        recommended_query = select(func.count(JobAnalysis.id)).where(
            JobAnalysis.recommended == True
        )
        recommended = await db.scalar(recommended_query)
        
        # Get average match score
        avg_score_query = select(func.avg(JobAnalysis.match_score))
        avg_score = await db.scalar(avg_score_query)
        
        # Get high match score count (>= 80)
        high_match_query = select(func.count(JobAnalysis.id)).where(
            JobAnalysis.match_score >= 80
        )
        high_match = await db.scalar(high_match_query)
        
        return {
            "total_analyses": total or 0,
            "recommended_analyses": recommended or 0,
            "average_match_score": round(float(avg_score or 0), 2),
            "high_match_count": high_match or 0,
            "recommendation_rate": round((recommended or 0) / (total or 1) * 100, 2),
            "timestamp": datetime.utcnow().isoformat(),
        }
        
    except Exception as e:
        logger.error("Failed to get analysis stats", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analysis statistics",
        )


@router.get("/recommended", status_code=status.HTTP_200_OK)
async def get_recommended_jobs(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of jobs to return"),
    skip: int = Query(0, ge=0, description="Number of jobs to skip (for pagination)"),
    min_match_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum match score filter"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get recommended jobs based on analysis with pagination and filtering.
    
    Args:
        limit: Maximum number of jobs to return
        skip: Number of jobs to skip (for pagination)
        min_match_score: Minimum match score to filter by
        db: Database session
        
    Returns:
        Paginated list of recommended jobs with analysis
    """
    try:
        from sqlalchemy import select, desc, func
        from models import Job, JobAnalysis, Company
        
        # Build base query
        base_query = (
            select(Job, JobAnalysis, Company.name.label('company_name'))
            .join(JobAnalysis, Job.id == JobAnalysis.job_id)
            .join(Company, Job.company_id == Company.id, isouter=True)
            .where(JobAnalysis.recommended == True)
        )
        
        # Apply min_match_score filter if provided
        if min_match_score is not None:
            base_query = base_query.where(JobAnalysis.match_score >= min_match_score)
        
        # Get total count
        count_query = select(func.count()).select_from(
            select(JobAnalysis.id)
            .where(JobAnalysis.recommended == True)
            .where(JobAnalysis.match_score >= min_match_score if min_match_score is not None else True)
            .subquery()
        )
        total = await db.scalar(count_query) or 0
        
        # Get paginated results
        query = base_query.order_by(desc(JobAnalysis.match_score)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        jobs_with_analysis = result.all()
        
        data = [
            {
                "id": job.id,
                "title": job.title,
                "company_name": company_name or "Unknown Company",
                "location": job.location,
                "job_type": job.job_type,
                "experience_level": job.experience_level,
                "posted_date": job.posted_date.isoformat() if job.posted_date else None,
                "job_url": job.job_url,
                "match_score": analysis.match_score,
                "analysis": {
                    "job_id": analysis.job_id,
                    "match_score": analysis.match_score,
                    "skills_match": analysis.skills_match,
                    "experience_match": analysis.experience_match,
                    "education_match": analysis.education_match,
                    "analysis_date": analysis.analysis_date.isoformat() if analysis.analysis_date else None,
                    "recommended": analysis.recommended,
                }
            }
            for job, analysis, company_name in jobs_with_analysis
        ]
        
        return {
            "data": data,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
        
    except Exception as e:
        logger.error("Failed to get recommended jobs", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve recommended jobs",
        )


@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_analyses(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of analyses to return"),
    skip: int = Query(0, ge=0, description="Number of analyses to skip (for pagination)"),
    recommended: Optional[bool] = Query(None, description="Filter by recommended status"),
    min_match_score: Optional[float] = Query(None, ge=0, le=100, description="Minimum match score filter"),
    max_match_score: Optional[float] = Query(None, ge=0, le=100, description="Maximum match score filter"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get all job analyses with optional filtering and pagination.
    
    Args:
        limit: Maximum number of analyses to return
        skip: Number of analyses to skip (for pagination)
        recommended: Filter by recommended status
        min_match_score: Minimum match score filter
        max_match_score: Maximum match score filter
        db: Database session
        
    Returns:
        Paginated list of job analyses
    """
    try:
        from sqlalchemy import select, desc, func, and_
        from models import Job, JobAnalysis, Company
        
        # Build filters
        filters = []
        if recommended is not None:
            filters.append(JobAnalysis.recommended == recommended)
        if min_match_score is not None:
            filters.append(JobAnalysis.match_score >= min_match_score)
        if max_match_score is not None:
            filters.append(JobAnalysis.match_score <= max_match_score)
        
        # Build base query
        base_query = (
            select(Job, JobAnalysis, Company.name.label('company_name'))
            .join(JobAnalysis, Job.id == JobAnalysis.job_id)
            .join(Company, Job.company_id == Company.id, isouter=True)
        )
        
        if filters:
            base_query = base_query.where(and_(*filters))
        
        # Get total count
        count_query = select(func.count(JobAnalysis.id))
        if filters:
            count_query = count_query.where(and_(*filters))
        total = await db.scalar(count_query) or 0
        
        # Get paginated results
        query = base_query.order_by(desc(JobAnalysis.match_score)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        jobs_with_analysis = result.all()
        
        data = [
            {
                "id": analysis.id,
                "job_id": job.id,
                "job_title": job.title,
                "company_name": company_name or "Unknown Company",
                "location": job.location,
                "match_score": analysis.match_score,
                "skills_match": analysis.skills_match,
                "experience_match": analysis.experience_match,
                "education_match": analysis.education_match,
                "analysis_date": analysis.analysis_date.isoformat() if analysis.analysis_date else None,
                "recommended": analysis.recommended,
            }
            for job, analysis, company_name in jobs_with_analysis
        ]
        
        return {
            "data": data,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
        
    except Exception as e:
        logger.error("Failed to get all analyses", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve analyses",
        )


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
async def bulk_create_analyses(
    analyses: List[JobAnalysisRequest],
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Create multiple job analyses in bulk.
    
    Args:
        analyses: List of job analysis data
        db: Database session
        
    Returns:
        Bulk creation results
    """
    try:
        analysis_repo = JobAnalysisRepository(db)
        created_analyses = []
        
        for analysis_data in analyses:
            try:
                # Check if analysis already exists
                existing = await analysis_repo.get_by_job_id(analysis_data.job_id)
                if existing:
                    logger.warning(f"Analysis for job {analysis_data.job_id} already exists, skipping")
                    continue
                
                # Create analysis
                analysis = await analysis_repo.create(
                    job_id=analysis_data.job_id,
                    match_score=analysis_data.match_score,
                    skills_match=analysis_data.skills_match,
                    experience_match=analysis_data.experience_match,
                    education_match=analysis_data.education_match,
                    recommended=analysis_data.recommended,
                )
                created_analyses.append(analysis)
                
            except Exception as e:
                logger.error(f"Failed to create analysis for job {analysis_data.job_id}", error=str(e))
                continue
        
        await db.commit()
        
        return {
            "created_count": len(created_analyses),
            "analyses": [
                {
                    "id": a.id,
                    "job_id": a.job_id,
                    "match_score": a.match_score,
                    "skills_match": a.skills_match,
                    "experience_match": a.experience_match,
                    "education_match": a.education_match,
                    "recommended": a.recommended,
                }
                for a in created_analyses
            ],
        }
        
    except Exception as e:
        logger.error("Failed to bulk create analyses", error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to bulk create analyses",
        )


@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
async def bulk_delete_analyses(
    job_ids: List[int],
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Delete multiple job analyses in bulk.
    
    Args:
        job_ids: List of job IDs whose analyses to delete
        db: Database session
        
    Returns:
        Bulk deletion results
    """
    try:
        analysis_repo = JobAnalysisRepository(db)
        deleted_count = 0
        
        for job_id in job_ids:
            try:
                analysis = await analysis_repo.get_by_job_id(job_id)
                if analysis:
                    await analysis_repo.delete_by_job_id(job_id)
                    deleted_count += 1
            except Exception as e:
                logger.error(f"Failed to delete analysis for job {job_id}", error=str(e))
                continue
        
        await db.commit()
        
        return {
            "deleted_count": deleted_count,
            "message": f"Successfully deleted {deleted_count} analyses",
        }
        
    except Exception as e:
        logger.error("Failed to bulk delete analyses", error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to bulk delete analyses",
        )

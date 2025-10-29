"""
Statistics and Dashboard API Endpoints
Provides aggregated statistics and dashboard data
"""

from typing import Any, Dict, List
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import func, select, desc
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from src.config.database import get_db_session
from src.models import Job, Company, ScrapingSession, JobAnalysis

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.get("/overview", status_code=status.HTTP_200_OK)
async def get_dashboard_overview(
    db: AsyncSession = Depends(get_db_session),
) -> Dict[str, Any]:
    """
    Get dashboard overview with key statistics.
    
    Returns:
        Overview statistics including job counts, companies, sessions
    """
    try:
        # Count total jobs
        total_jobs_query = select(func.count(Job.id))
        total_jobs = await db.scalar(total_jobs_query)
        
        # Count total companies
        total_companies_query = select(func.count(Company.id))
        total_companies = await db.scalar(total_companies_query)
        
        # Count scraping sessions
        total_sessions_query = select(func.count(ScrapingSession.id))
        total_sessions = await db.scalar(total_sessions_query)
        
        # Count jobs analyzed
        analyzed_jobs_query = select(func.count(JobAnalysis.id))
        analyzed_jobs = await db.scalar(analyzed_jobs_query)
        
        # Get recent activity (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_jobs_query = select(func.count(Job.id)).where(
            Job.scraped_at >= seven_days_ago
        )
        recent_jobs = await db.scalar(recent_jobs_query)
        
        return {
            "total_jobs": total_jobs or 0,
            "total_companies": total_companies or 0,
            "total_sessions": total_sessions or 0,
            "analyzed_jobs": analyzed_jobs or 0,
            "recent_jobs_7_days": recent_jobs or 0,
            "timestamp": datetime.utcnow().isoformat(),
        }
    
    except Exception as e:
        logger.error("Failed to get dashboard overview", error=str(e), exc_info=True)
        return {
            "error": str(e),
            "total_jobs": 0,
            "total_companies": 0,
            "total_sessions": 0,
            "analyzed_jobs": 0,
            "recent_jobs_7_days": 0,
        }


@router.get("/jobs-by-location", status_code=status.HTTP_200_OK)
async def get_jobs_by_location(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db_session),
) -> List[Dict[str, Any]]:
    """
    Get job distribution by location.
    
    Returns:
        List of locations with job counts
    """
    try:
        query = (
            select(Job.location, func.count(Job.id).label('count'))
            .group_by(Job.location)
            .order_by(desc('count'))
            .limit(limit)
        )
        
        result = await db.execute(query)
        locations = result.all()
        
        return [
            {
                "location": location,
                "count": count
            }
            for location, count in locations
        ]
    
    except Exception as e:
        logger.error("Failed to get jobs by location", error=str(e), exc_info=True)
        return []


@router.get("/jobs-by-company", status_code=status.HTTP_200_OK)
async def get_jobs_by_company(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db_session),
) -> List[Dict[str, Any]]:
    """
    Get job distribution by company.
    
    Returns:
        List of companies with job counts
    """
    try:
        query = (
            select(Company.name, func.count(Job.id).label('count'))
            .join(Job, Job.company_id == Company.id)
            .group_by(Company.name)
            .order_by(desc('count'))
            .limit(limit)
        )
        
        result = await db.execute(query)
        companies = result.all()
        
        return [
            {
                "company": company,
                "count": count
            }
            for company, count in companies
        ]
    
    except Exception as e:
        logger.error("Failed to get jobs by company", error=str(e), exc_info=True)
        return []


@router.get("/jobs-by-type", status_code=status.HTTP_200_OK)
async def get_jobs_by_type(
    db: AsyncSession = Depends(get_db_session),
) -> List[Dict[str, Any]]:
    """
    Get job distribution by job type.
    
    Returns:
        List of job types with counts
    """
    try:
        query = (
            select(Job.job_type, func.count(Job.id).label('count'))
            .group_by(Job.job_type)
            .order_by(desc('count'))
        )
        
        result = await db.execute(query)
        job_types = result.all()
        
        return [
            {
                "job_type": job_type or "Unknown",
                "count": count
            }
            for job_type, count in job_types
        ]
    
    except Exception as e:
        logger.error("Failed to get jobs by type", error=str(e), exc_info=True)
        return []


@router.get("/jobs-by-experience", status_code=status.HTTP_200_OK)
async def get_jobs_by_experience(
    db: AsyncSession = Depends(get_db_session),
) -> List[Dict[str, Any]]:
    """
    Get job distribution by experience level.
    
    Returns:
        List of experience levels with counts
    """
    try:
        query = (
            select(Job.experience_level, func.count(Job.id).label('count'))
            .group_by(Job.experience_level)
            .order_by(desc('count'))
        )
        
        result = await db.execute(query)
        experience_levels = result.all()
        
        return [
            {
                "experience_level": level or "Unknown",
                "count": count
            }
            for level, count in experience_levels
        ]
    
    except Exception as e:
        logger.error("Failed to get jobs by experience", error=str(e), exc_info=True)
        return []


@router.get("/scraping-activity", status_code=status.HTTP_200_OK)
async def get_scraping_activity(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db_session),
) -> List[Dict[str, Any]]:
    """
    Get scraping activity over time.
    
    Args:
        days: Number of days to look back
        
    Returns:
        Daily scraping activity
    """
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        query = (
            select(
                func.date(ScrapingSession.started_at).label('date'),
                func.count(ScrapingSession.id).label('sessions'),
                func.sum(ScrapingSession.jobs_scraped).label('jobs_scraped')
            )
            .where(ScrapingSession.started_at >= start_date)
            .group_by(func.date(ScrapingSession.started_at))
            .order_by('date')
        )
        
        result = await db.execute(query)
        activity = result.all()
        
        return [
            {
                "date": date.isoformat() if date else None,
                "sessions": sessions or 0,
                "jobs_scraped": jobs_scraped or 0
            }
            for date, sessions, jobs_scraped in activity
        ]
    
    except Exception as e:
        logger.error("Failed to get scraping activity", error=str(e), exc_info=True)
        return []


@router.get("/top-skills", status_code=status.HTTP_200_OK)
async def get_top_skills(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
) -> List[Dict[str, Any]]:
    """
    Get most frequently required skills from job descriptions.
    
    This is a simplified version. For production, you'd want to:
    - Parse job descriptions and extract skills
    - Use NLP to identify skill mentions
    - Store skills in a separate table
    
    Returns:
        List of top skills with frequency
    """
    try:
        # This is a placeholder - implement actual skill extraction
        # You would need to implement skill extraction logic
        
        return [
            {"skill": "Python", "count": 150},
            {"skill": "JavaScript", "count": 120},
            {"skill": "React", "count": 95},
            {"skill": "AWS", "count": 85},
            {"skill": "Docker", "count": 75},
        ]
    
    except Exception as e:
        logger.error("Failed to get top skills", error=str(e), exc_info=True)
        return []


@router.get("/recent-jobs", status_code=status.HTTP_200_OK)
async def get_recent_jobs(
    limit: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db_session),
) -> List[Dict[str, Any]]:
    """
    Get most recently scraped jobs.
    
    Returns:
        List of recent jobs
    """
    try:
        query = (
            select(Job)
            .order_by(desc(Job.scraped_at))
            .limit(limit)
        )
        
        result = await db.execute(query)
        jobs = result.scalars().all()
        
        return [
            {
                "id": job.id,
                "title": job.title,
                "company_id": job.company_id,
                "location": job.location,
                "job_type": job.job_type,
                "experience_level": job.experience_level,
                "posted_date": job.posted_date.isoformat() if job.posted_date else None,
                "scraped_at": job.scraped_at.isoformat() if job.scraped_at else None,
                "job_url": job.job_url,
            }
            for job in jobs
        ]
    
    except Exception as e:
        logger.error("Failed to get recent jobs", error=str(e), exc_info=True)
        return []


@router.get("/session-statistics", status_code=status.HTTP_200_OK)
async def get_session_statistics(
    db: AsyncSession = Depends(get_db_session),
) -> Dict[str, Any]:
    """
    Get statistics about scraping sessions.
    
    Returns:
        Session statistics
    """
    try:
        # Total sessions
        total_query = select(func.count(ScrapingSession.id))
        total = await db.scalar(total_query)
        
        # Completed sessions
        completed_query = select(func.count(ScrapingSession.id)).where(
            ScrapingSession.status == 'completed'
        )
        completed = await db.scalar(completed_query)
        
        # Failed sessions
        failed_query = select(func.count(ScrapingSession.id)).where(
            ScrapingSession.status == 'failed'
        )
        failed = await db.scalar(failed_query)
        
        # Average jobs per session
        avg_query = select(func.avg(ScrapingSession.jobs_scraped))
        avg_jobs = await db.scalar(avg_query)
        
        # Total jobs scraped
        total_jobs_query = select(func.sum(ScrapingSession.jobs_scraped))
        total_jobs_scraped = await db.scalar(total_jobs_query)
        
        return {
            "total_sessions": total or 0,
            "completed_sessions": completed or 0,
            "failed_sessions": failed or 0,
            "running_sessions": (total or 0) - (completed or 0) - (failed or 0),
            "average_jobs_per_session": round(float(avg_jobs or 0), 2),
            "total_jobs_scraped": total_jobs_scraped or 0,
            "success_rate": round((completed or 0) / (total or 1) * 100, 2),
        }
    
    except Exception as e:
        logger.error("Failed to get session statistics", error=str(e), exc_info=True)
        return {
            "error": str(e),
            "total_sessions": 0,
            "completed_sessions": 0,
            "failed_sessions": 0,
        }


@router.get("/trends", status_code=status.HTTP_200_OK)
async def get_job_trends(
    days: int = Query(30, ge=7, le=365),
    db: AsyncSession = Depends(get_db_session),
) -> Dict[str, Any]:
    """
    Get job market trends over time.
    
    Args:
        days: Number of days to analyze
        
    Returns:
        Trend data
    """
    try:
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Jobs posted per day
        jobs_query = (
            select(
                func.date(Job.posted_date).label('date'),
                func.count(Job.id).label('count')
            )
            .where(Job.posted_date >= start_date)
            .group_by(func.date(Job.posted_date))
            .order_by('date')
        )
        
        result = await db.execute(jobs_query)
        daily_jobs = result.all()
        
        return {
            "period_days": days,
            "start_date": start_date.isoformat(),
            "end_date": datetime.utcnow().isoformat(),
            "daily_jobs": [
                {
                    "date": date.isoformat() if date else None,
                    "count": count
                }
                for date, count in daily_jobs
            ],
        }
    
    except Exception as e:
        logger.error("Failed to get job trends", error=str(e), exc_info=True)
        return {
            "error": str(e),
            "period_days": days,
            "daily_jobs": [],
        }

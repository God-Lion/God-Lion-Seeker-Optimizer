"""
Companies API Endpoints
Manage company information
"""

from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from src.config.database import get_db_session
from src.repositories.company_repository import CompanyRepository

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.get("/", status_code=status.HTTP_200_OK)
async def list_companies(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of records"),
    name: Optional[str] = Query(None, description="Filter by company name"),
    industry: Optional[str] = Query(None, description="Filter by industry"),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """List all companies with optional filters."""
    try:
        company_repo = CompanyRepository(db)
        companies = await company_repo.get_all(skip=skip, limit=limit)
        
        # Apply filters if provided
        if name:
            companies = [c for c in companies if name.lower() in c.name.lower()]
        if industry:
            companies = [c for c in companies if industry.lower() in (c.industry or "").lower()]
        
        return {
            "companies": [
                {
                    "id": company.id,
                    "name": company.name,
                    "industry": company.industry,
                    "company_size": company.company_size,
                    "location": company.location,
                    "website": company.website,
                    "description": company.description[:200] if company.description else None,
                }
                for company in companies
            ],
            "skip": skip,
            "limit": limit,
            "total": len(companies),
        }
    
    except Exception as e:
        logger.error("Failed to list companies", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list companies: {str(e)}",
        )


@router.get("/{company_id}", status_code=status.HTTP_200_OK)
async def get_company(
    company_id: int,
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """Get detailed information about a specific company."""
    try:
        company_repo = CompanyRepository(db)
        company = await company_repo.get_by_id(company_id)
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Company {company_id} not found",
            )
        
        return {
            "id": company.id,
            "name": company.name,
            "industry": company.industry,
            "company_size": company.company_size,
            "location": company.location,
            "website": company.website,
            "description": company.description,
            "created_at": company.created_at.isoformat() if hasattr(company, 'created_at') and company.created_at else None,
            "updated_at": company.updated_at.isoformat() if hasattr(company, 'updated_at') and company.updated_at else None,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get company", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get company: {str(e)}",
        )


@router.get("/{company_id}/jobs", status_code=status.HTTP_200_OK)
async def get_company_jobs(
    company_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """Get all jobs for a specific company."""
    try:
        company_repo = CompanyRepository(db)
        company = await company_repo.get_by_id(company_id)
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Company {company_id} not found",
            )
        
        # Get jobs for this company
        jobs = company.jobs[skip:skip + limit] if company.jobs else []
        
        return {
            "company_id": company_id,
            "company_name": company.name,
            "jobs": [
                {
                    "id": job.id,
                    "title": job.title,
                    "location": job.place,
                    "date": job.date,
                    "date_text": job.date_text,
                    "job_url": job.link,
                    "apply_url": job.apply_link,
                }
                for job in jobs
            ],
            "skip": skip,
            "limit": limit,
            "total": len(company.jobs) if company.jobs else 0,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get company jobs", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get company jobs: {str(e)}",
        )


@router.get("/search/", status_code=status.HTTP_200_OK)
async def search_companies(
    q: str = Query(..., min_length=1, description="Search query"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db_session),
) -> dict[str, Any]:
    """Search companies by name or industry."""
    try:
        company_repo = CompanyRepository(db)
        companies = await company_repo.get_all(skip=skip, limit=limit)
        
        # Filter by search query
        filtered = [
            c for c in companies
            if q.lower() in c.name.lower() or q.lower() in (c.industry or "").lower()
        ]
        
        return {
            "query": q,
            "companies": [
                {
                    "id": company.id,
                    "name": company.name,
                    "industry": company.industry,
                    "location": company.location,
                    "website": company.website,
                }
                for company in filtered
            ],
            "skip": skip,
            "limit": limit,
            "total": len(filtered),
        }
    
    except Exception as e:
        logger.error("Failed to search companies", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search companies: {str(e)}",
        )

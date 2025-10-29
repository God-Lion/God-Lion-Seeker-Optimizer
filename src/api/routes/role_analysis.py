"""
Career Role Recommendations API for Job Analysis Page
Provides endpoints for displaying career role recommendations
"""

from typing import Any, Dict, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from src.config.database import get_db

logger = structlog.get_logger(__name__)
router = APIRouter()


@router.get("/stats", status_code=status.HTTP_200_OK)
async def get_role_recommendations_stats(
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get statistics about role recommendations.
    
    Returns:
        Role recommendation statistics
    """
    try:
        from sqlalchemy import select, func
        from models.career_recommendation import RoleRecommendation
        
        # Get total count
        total_query = select(func.count(RoleRecommendation.id))
        total = await db.scalar(total_query) or 0
        
        # Get high match count (score >= 0.7)
        high_match_query = select(func.count(RoleRecommendation.id)).where(
            RoleRecommendation.overall_fit_score >= 0.7
        )
        high_match = await db.scalar(high_match_query) or 0
        
        # Get average match score
        avg_score_query = select(func.avg(RoleRecommendation.overall_fit_score))
        avg_score = await db.scalar(avg_score_query) or 0.0
        
        # Count recommendations by converting score to percentage
        recommended = high_match  # High matches are considered recommended
        
        return {
            "total_analyses": total,
            "recommended_analyses": recommended,
            "average_match_score": round(float(avg_score) * 100, 2),
            "high_match_count": high_match,
            "recommendation_rate": round((recommended / total * 100) if total > 0 else 0, 2),
            "timestamp": datetime.utcnow().isoformat(),
        }
        
    except Exception as e:
        logger.error("Failed to get role recommendation stats", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve role recommendation statistics",
        )


@router.get("/recommended", status_code=status.HTTP_200_OK)
async def get_recommended_roles(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of roles to return"),
    skip: int = Query(0, ge=0, description="Number of roles to skip (for pagination)"),
    min_match_score: float = Query(0, ge=0, le=100, description="Minimum match score filter (0-100)"),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """
    Get recommended career roles based on resume analysis with pagination and filtering.
    
    Args:
        limit: Maximum number of roles to return
        skip: Number of roles to skip (for pagination)
        min_match_score: Minimum match score to filter by (0-100 scale)
        db: Database session
        
    Returns:
        Paginated list of recommended roles
    """
    try:
        from sqlalchemy import select, desc, func
        from models.career_recommendation import RoleRecommendation, ResumeAnalysis
        
        # Convert min_match_score from percentage to decimal
        min_score_decimal = min_match_score / 100.0
        
        # Build base query - join with resume analysis to get candidate info
        base_query = (
            select(RoleRecommendation, ResumeAnalysis)
            .join(ResumeAnalysis, RoleRecommendation.resume_analysis_id == ResumeAnalysis.id)
            .where(RoleRecommendation.overall_fit_score >= min_score_decimal)
        )
        
        # Get total count
        count_query = select(func.count(RoleRecommendation.id)).where(
            RoleRecommendation.overall_fit_score >= min_score_decimal
        )
        total = await db.scalar(count_query) or 0
        
        # Get paginated results ordered by match score
        query = base_query.order_by(desc(RoleRecommendation.overall_fit_score)).offset(skip).limit(limit)
        
        result = await db.execute(query)
        roles_with_analysis = result.all()
        
        data = [
            {
                "id": role.id,
                "title": role.role_title,
                "company_name": resume.user_name or "Career Recommendation",
                "location": "N/A",
                "job_type": role.role_category,
                "experience_level": f"{resume.experience_years} years",
                "posted_date": role.created_at.isoformat() if role.created_at else None,
                "job_url": "#",
                "match_score": round(role.overall_fit_score * 100, 2),
                "analysis": {
                    "job_id": role.id,
                    "match_score": round(role.overall_fit_score * 100, 2),
                    "skills_match": round(role.skills_score * 100, 2),
                    "experience_match": round(role.experience_score * 100, 2),
                    "education_match": round(role.education_score * 100, 2),
                    "analysis_date": role.created_at.isoformat() if role.created_at else None,
                    "recommended": role.overall_fit_score >= 0.7,
                }
            }
            for role, resume in roles_with_analysis
        ]
        
        return {
            "data": data,
            "total": total,
            "skip": skip,
            "limit": limit,
        }
        
    except Exception as e:
        logger.error("Failed to get recommended roles", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve recommended roles: {str(e)}",
        )

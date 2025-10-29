"""
API routes for career recommendation endpoints.
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from pydantic import BaseModel, EmailStr
import tempfile
import os
from pathlib import Path
import structlog

from src.config.database import get_db
from src.services.career_recommendation_service import CareerRecommendationService
from src.repositories.career_recommendation_repository import (
    ResumeAnalysisRepository,
    RoleRecommendationRepository
)

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/career", tags=["Career Recommendations"])


# Pydantic models for API
class ResumeTextRequest(BaseModel):
    """Request model for text-based resume analysis"""
    resume_text: str
    user_email: Optional[EmailStr] = None


class RoleMatchResponse(BaseModel):
    """Response model for a single role match"""
    role_id: str
    role_title: str
    role_category: str
    overall_score: float
    skills_score: float
    education_score: float
    certification_score: float
    experience_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    matched_certifications: List[str]
    missing_certifications: List[str]
    skill_gaps: List[str]
    recommendations: List[str]


class CareerRecommendationResponse(BaseModel):
    """Response model for career recommendations"""
    analysis_id: Optional[int] = None
    resume_summary: dict
    top_roles: List[RoleMatchResponse]
    career_pathways: dict
    overall_insights: dict


class AnalysisHistoryResponse(BaseModel):
    """Response model for analysis history"""
    id: int
    created_at: str
    resume_filename: Optional[str]
    skills_count: int
    years_experience: int
    top_role: str
    top_score: float


# Service initialization
career_service = CareerRecommendationService(use_embeddings=True)


def _convert_to_response(recommendations, analysis_id: Optional[int] = None) -> CareerRecommendationResponse:
    """Convert service response to API response model"""
    top_roles = []
    for match in recommendations.top_roles:
        top_roles.append(RoleMatchResponse(
            role_id=match.role_profile.role_id,
            role_title=match.role_profile.title,
            role_category=match.role_profile.category,
            overall_score=match.overall_score,
            skills_score=match.skills_score,
            education_score=match.education_score,
            certification_score=match.certification_score,
            experience_score=match.experience_score,
            matched_skills=match.matched_skills,
            missing_skills=match.missing_skills,
            matched_certifications=match.matched_certifications,
            missing_certifications=match.missing_certifications,
            skill_gaps=match.skill_gaps,
            recommendations=match.recommendations
        ))
    
    return CareerRecommendationResponse(
        analysis_id=analysis_id,
        resume_summary={
            'total_skills': len(recommendations.resume_data.skills),
            'years_experience': recommendations.resume_data.years_experience,
            'education_count': len(recommendations.resume_data.education),
            'certifications_count': len(recommendations.resume_data.certifications or []),
            'top_skills': recommendations.resume_data.skills[:10]
        },
        top_roles=top_roles,
        career_pathways=recommendations.career_pathways,
        overall_insights=recommendations.overall_insights
    )


@router.post("/analyze/file", response_model=CareerRecommendationResponse)
async def analyze_resume_file(
    file: UploadFile = File(...),
    user_email: Optional[str] = Query(None),
    save_to_db: bool = Query(True, description="Save analysis to database"),
    top_n: int = Query(10, ge=1, le=20, description="Number of top roles to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze a resume file (PDF, DOCX, or TXT) and get career recommendations.
    
    Args:
        file: Resume file to analyze
        user_email: Optional user email for tracking
        save_to_db: Whether to save analysis to database
        top_n: Number of top matching roles to return
        db: Database session
    
    Returns:
        Career recommendations with top matching roles
    """
    logger.info("api_analyze_resume_file", filename=file.filename, user_email=user_email)
    
    # Validate file type
    allowed_extensions = {'.pdf', '.docx', '.doc', '.txt'}
    file_ext = Path(file.filename).suffix.lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Save uploaded file temporarily
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Analyze resume
        recommendations = career_service.analyze_resume_file(temp_path)
        
        # Save to database if requested
        analysis_id = None
        if save_to_db:
            resume_repo = ResumeAnalysisRepository(db)
            recommendation_repo = RoleRecommendationRepository(db)
            
            resume_analysis = await career_service.save_analysis(
                recommendations.resume_data,
                recommendations,
                resume_repo,
                recommendation_repo,
                user_email=user_email,
                resume_filename=file.filename
            )
            await db.commit()
            analysis_id = resume_analysis.id
        
        # Clean up temp file
        os.unlink(temp_path)
        
        logger.info("api_analysis_complete", analysis_id=analysis_id, 
                   top_role=recommendations.top_roles[0].role_profile.title if recommendations.top_roles else None)
        
        return _convert_to_response(recommendations, analysis_id)
        
    except Exception as e:
        logger.error("api_analysis_failed", error=str(e))
        if 'temp_path' in locals():
            os.unlink(temp_path)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze/text", response_model=CareerRecommendationResponse)
async def analyze_resume_text(
    request: ResumeTextRequest,
    save_to_db: bool = Query(True, description="Save analysis to database"),
    top_n: int = Query(10, ge=1, le=20, description="Number of top roles to return"),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze resume text and get career recommendations.
    
    Args:
        request: Resume text and optional user email
        save_to_db: Whether to save analysis to database
        top_n: Number of top matching roles to return
        db: Database session
    
    Returns:
        Career recommendations with top matching roles
    """
    logger.info("api_analyze_resume_text", user_email=request.user_email, text_length=len(request.resume_text))
    
    try:
        # Analyze resume
        recommendations = career_service.analyze_resume_text(request.resume_text)
        
        # Save to database if requested
        analysis_id = None
        if save_to_db:
            resume_repo = ResumeAnalysisRepository(db)
            recommendation_repo = RoleRecommendationRepository(db)
            
            resume_analysis = await career_service.save_analysis(
                recommendations.resume_data,
                recommendations,
                resume_repo,
                recommendation_repo,
                user_email=request.user_email
            )
            await db.commit()
            analysis_id = resume_analysis.id
        
        logger.info("api_analysis_complete", analysis_id=analysis_id)
        
        return _convert_to_response(recommendations, analysis_id)
        
    except Exception as e:
        logger.error("api_analysis_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/analysis/{analysis_id}", response_model=CareerRecommendationResponse)
async def get_analysis(
    analysis_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve a previously saved analysis by ID.
    
    Args:
        analysis_id: ID of the analysis to retrieve
        db: Database session
    
    Returns:
        Career recommendations for the analysis
    """
    logger.info("api_get_analysis", analysis_id=analysis_id)
    
    try:
        resume_repo = ResumeAnalysisRepository(db)
        recommendation_repo = RoleRecommendationRepository(db)
        
        # Get analysis with recommendations
        analysis = await resume_repo.get_with_recommendations(analysis_id)
        
        if not analysis:
            raise HTTPException(status_code=404, detail=f"Analysis {analysis_id} not found")
        
        # Get recommendations
        recommendations = await recommendation_repo.get_by_resume_analysis(analysis_id)
        
        # Convert to response format
        top_roles = []
        for rec in recommendations:
            top_roles.append(RoleMatchResponse(
                role_id=rec.role_id,
                role_title=rec.role_title,
                role_category=rec.role_category,
                overall_score=rec.overall_fit_score,
                skills_score=rec.skills_score,
                education_score=rec.education_score,
                certification_score=rec.certification_score,
                experience_score=rec.experience_score,
                matched_skills=rec.matched_skills,
                missing_skills=rec.missing_skills,
                matched_certifications=rec.matched_certifications,
                missing_certifications=rec.missing_certifications,
                skill_gaps=rec.skill_gaps,
                recommendations=rec.growth_recommendations
            ))
        
        return CareerRecommendationResponse(
            analysis_id=analysis.id,
            resume_summary={
                'total_skills': len(analysis.skills),
                'years_experience': analysis.experience_years,
                'education_count': len(analysis.education),
                'certifications_count': len(analysis.certifications),
                'top_skills': analysis.skills[:10]
            },
            top_roles=top_roles,
            career_pathways={},  # Could be reconstructed from recommendations
            overall_insights={}  # Could be computed from recommendations
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("api_get_analysis_failed", analysis_id=analysis_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to retrieve analysis: {str(e)}")


@router.get("/history", response_model=List[AnalysisHistoryResponse])
async def get_analysis_history(
    user_email: str = Query(..., description="User email to filter by"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of results"),
    db: AsyncSession = Depends(get_db)
):
    """
    Get analysis history for a user.
    
    Args:
        user_email: User email to retrieve history for
        limit: Maximum number of results to return
        db: Database session
    
    Returns:
        List of previous analyses
    """
    logger.info("api_get_history", user_email=user_email, limit=limit)
    
    try:
        resume_repo = ResumeAnalysisRepository(db)
        recommendation_repo = RoleRecommendationRepository(db)
        
        # Get analyses for user
        analyses = await resume_repo.get_by_email(user_email)
        analyses = analyses[:limit]
        
        # Build response
        history = []
        for analysis in analyses:
            # Get top recommendation for this analysis
            top_recs = await recommendation_repo.get_top_recommendations(analysis.id, top_n=1)
            
            if top_recs:
                top_role = top_recs[0].role_title
                top_score = top_recs[0].overall_fit_score
            else:
                top_role = "N/A"
                top_score = 0.0
            
            history.append(AnalysisHistoryResponse(
                id=analysis.id,
                created_at=analysis.created_at.isoformat(),
                resume_filename=analysis.resume_filename,
                skills_count=len(analysis.skills),
                years_experience=analysis.experience_years,
                top_role=top_role,
                top_score=top_score
            ))
        
        return history
        
    except Exception as e:
        logger.error("api_get_history_failed", user_email=user_email, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to retrieve history: {str(e)}")


@router.get("/export/{analysis_id}")
async def export_analysis(
    analysis_id: int,
    format: str = Query("markdown", regex="^(markdown|json|txt)$", description="Export format"),
    db: AsyncSession = Depends(get_db)
):
    """
    Export an analysis report to file.
    
    Args:
        analysis_id: ID of the analysis to export
        format: Export format (markdown, json, or txt)
        db: Database session
    
    Returns:
        File download response
    """
    logger.info("api_export_analysis", analysis_id=analysis_id, format=format)
    
    try:
        resume_repo = ResumeAnalysisRepository(db)
        recommendation_repo = RoleRecommendationRepository(db)
        
        # Get analysis
        analysis = await resume_repo.get_with_recommendations(analysis_id)
        
        if not analysis:
            raise HTTPException(status_code=404, detail=f"Analysis {analysis_id} not found")
        
        # Get recommendations and rebuild CareerRecommendation object
        from services.resume_parser import ResumeData
        from services.career_recommendation_service import CareerRecommendation, RoleMatch
        from services.role_profiles import RoleProfileDatabase
        
        role_db = RoleProfileDatabase()
        
        resume_data = ResumeData(
            full_text=analysis.resume_text,
            skills=analysis.skills,
            years_experience=analysis.experience_years,
            education=analysis.education,
            entities=analysis.entities,
            contact_info=analysis.contact_info,
            certifications=analysis.certifications
        )
        
        recommendations_list = await recommendation_repo.get_by_resume_analysis(analysis_id)
        
        top_roles = []
        for rec in recommendations_list:
            role_profile = role_db.get_profile(rec.role_id)
            if role_profile:
                top_roles.append(RoleMatch(
                    role_profile=role_profile,
                    overall_score=rec.overall_fit_score,
                    skills_score=rec.skills_score,
                    education_score=rec.education_score,
                    certification_score=rec.certification_score,
                    experience_score=rec.experience_score,
                    matched_skills=rec.matched_skills,
                    missing_skills=rec.missing_skills,
                    matched_certifications=rec.matched_certifications,
                    missing_certifications=rec.missing_certifications,
                    skill_gaps=rec.skill_gaps,
                    recommendations=rec.growth_recommendations
                ))
        
        recommendations = CareerRecommendation(
            resume_data=resume_data,
            top_roles=top_roles,
            career_pathways={},
            overall_insights={}
        )
        
        # Export to temporary file
        ext_map = {'markdown': '.md', 'json': '.json', 'txt': '.txt'}
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext_map[format]) as temp_file:
            temp_path = temp_file.name
        
        career_service.export_report(recommendations, temp_path, format=format)
        
        # Return file
        filename = f"career_analysis_{analysis_id}.{ext_map[format][1:]}"
        
        return FileResponse(
            temp_path,
            media_type='application/octet-stream',
            filename=filename,
            background=None  # File will be deleted after response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("api_export_failed", analysis_id=analysis_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.delete("/analysis/{analysis_id}")
async def delete_analysis(
    analysis_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete an analysis and all its recommendations.
    
    Args:
        analysis_id: ID of the analysis to delete
        db: Database session
    
    Returns:
        Success message
    """
    logger.info("api_delete_analysis", analysis_id=analysis_id)
    
    try:
        resume_repo = ResumeAnalysisRepository(db)
        
        # Check if exists
        analysis = await resume_repo.get_by_id(analysis_id)
        if not analysis:
            raise HTTPException(status_code=404, detail=f"Analysis {analysis_id} not found")
        
        # Delete (cascade will handle recommendations)
        await resume_repo.delete_by_id(analysis_id)
        await db.commit()
        
        logger.info("api_analysis_deleted", analysis_id=analysis_id)
        
        return {"message": f"Analysis {analysis_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("api_delete_failed", analysis_id=analysis_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Delete failed: {str(e)}")


@router.get("/roles")
async def list_available_roles():
    """
    List all available role profiles in the system.
    
    Returns:
        List of role profiles with their details
    """
    logger.info("api_list_roles")
    
    try:
        from services.role_profiles import RoleProfileDatabase
        
        role_db = RoleProfileDatabase()
        profiles = role_db.get_all_profiles()
        
        return {
            "total": len(profiles),
            "categories": role_db.get_categories(),
            "roles": [
                {
                    "role_id": p.role_id,
                    "title": p.title,
                    "category": p.category,
                    "description": p.description,
                    "required_skills": p.required_skills[:5],
                    "min_years_experience": p.min_years_experience
                }
                for p in profiles
            ]
        }
        
    except Exception as e:
        logger.error("api_list_roles_failed", error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to list roles: {str(e)}")


@router.get("/roles/{role_id}")
async def get_role_details(role_id: str):
    """
    Get detailed information about a specific role.
    
    Args:
        role_id: ID of the role to retrieve
    
    Returns:
        Detailed role profile information
    """
    logger.info("api_get_role_details", role_id=role_id)
    
    try:
        from services.role_profiles import RoleProfileDatabase
        
        role_db = RoleProfileDatabase()
        profile = role_db.get_profile(role_id)
        
        if not profile:
            raise HTTPException(status_code=404, detail=f"Role {role_id} not found")
        
        return profile.to_dict()
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("api_get_role_details_failed", role_id=role_id, error=str(e))
        raise HTTPException(status_code=500, detail=f"Failed to get role details: {str(e)}")

"""
Enhanced Career Recommendation Service with SSE Progress Updates (REFACTORED)

This is a refactored version that uses the SSE service layer for better
separation of concerns and reusability.
"""
from typing import Optional
import asyncio
from pathlib import Path

from src.services.career_recommendation_service import CareerRecommendationService as BaseService
from src.services.resume_parser import ResumeData
from src.services.sse import AnalysisSSEService


class StreamingCareerRecommendationService(BaseService):
    """
    Enhanced service that broadcasts real-time progress updates via SSE.
    
    This refactored version uses the AnalysisSSEService layer instead of
    directly calling broadcast functions, making it more maintainable and testable.
    """
    
    def __init__(self):
        """Initialize the streaming career recommendation service."""
        super().__init__()
        self.sse_service = AnalysisSSEService()
    
    async def analyze_resume_file_streaming(
        self, 
        file_path: str, 
        analysis_id: Optional[int] = None
    ):
        """
        Analyze resume with real-time progress updates.
        
        Args:
            file_path: Path to the resume file
            analysis_id: Optional analysis ID for SSE broadcasting
            
        Returns:
            CareerRecommendation: The analysis results
        """
        try:
            if analysis_id:
                await self.sse_service.broadcast_progress(
                    analysis_id=analysis_id,
                    stage="parsing",
                    progress=10,
                    details={
                        "step": "Reading file",
                        "file": Path(file_path).name
                    }
                )
            
            # Parse resume
            resume_data = self.resume_parser.parse_from_file(file_path)
            
            if analysis_id:
                await self.sse_service.broadcast_progress(
                    analysis_id=analysis_id,
                    stage="extracting",
                    progress=30,
                    details={
                        "step": "Extracting skills and experience",
                        "skills_found": len(resume_data.skills)
                    }
                )
            
            # Small delay to show progress
            await asyncio.sleep(0.5)
            
            if analysis_id:
                await self.sse_service.broadcast_progress(
                    analysis_id=analysis_id,
                    stage="matching",
                    progress=50,
                    details={"step": "Matching against role profiles"}
                )
            
            # Generate recommendations with progress
            recommendations = await self._generate_recommendations_streaming(
                resume_data,
                analysis_id
            )
            
            if analysis_id:
                await self.sse_service.broadcast_progress(
                    analysis_id=analysis_id,
                    stage="complete",
                    progress=100,
                    details={"step": "Analysis complete"}
                )
                
                # Broadcast final result
                await self.sse_service.broadcast_result(
                    analysis_id=analysis_id,
                    result={
                        "resume_summary": {
                            "total_skills": len(recommendations.resume_data.skills),
                            "years_experience": recommendations.resume_data.years_experience,
                            "education_count": len(recommendations.resume_data.education),
                            "certifications_count": len(recommendations.resume_data.certifications or [])
                        },
                        "top_roles": [
                            {
                                "role_title": match.role_profile.title,
                                "overall_score": match.overall_score,
                                "matched_skills": match.matched_skills[:10],
                                "missing_skills": match.missing_skills[:5]
                            }
                            for match in recommendations.top_roles[:5]
                        ]
                    }
                )
            
            return recommendations
            
        except Exception as e:
            if analysis_id:
                await self.sse_service.broadcast_error(
                    analysis_id=analysis_id,
                    error_message=str(e)
                )
            raise
    
    async def analyze_resume_text_streaming(
        self,
        text: str,
        analysis_id: Optional[int] = None
    ):
        """
        Analyze resume text with real-time progress updates.
        
        Args:
            text: Resume text content
            analysis_id: Optional analysis ID for SSE broadcasting
            
        Returns:
            CareerRecommendation: The analysis results
        """
        try:
            if analysis_id:
                await self.sse_service.broadcast_progress(
                    analysis_id=analysis_id,
                    stage="parsing",
                    progress=10,
                    details={"step": "Processing resume text"}
                )
            
            # Parse resume
            resume_data = self.resume_parser.parse_from_text(text)
            
            if analysis_id:
                await self.sse_service.broadcast_progress(
                    analysis_id=analysis_id,
                    stage="extracting",
                    progress=30,
                    details={
                        "step": "Extracting data",
                        "skills_found": len(resume_data.skills)
                    }
                )
            
            await asyncio.sleep(0.5)
            
            if analysis_id:
                await self.sse_service.broadcast_progress(
                    analysis_id=analysis_id,
                    stage="matching",
                    progress=50,
                    details={"step": "Matching roles"}
                )
            
            # Generate recommendations
            recommendations = await self._generate_recommendations_streaming(
                resume_data,
                analysis_id
            )
            
            if analysis_id:
                await self.sse_service.broadcast_progress(
                    analysis_id=analysis_id,
                    stage="complete",
                    progress=100,
                    details={"step": "Complete"}
                )
                
                await self.sse_service.broadcast_result(
                    analysis_id=analysis_id,
                    result={
                        "resume_summary": {
                            "total_skills": len(recommendations.resume_data.skills),
                            "years_experience": recommendations.resume_data.years_experience,
                            "education_count": len(recommendations.resume_data.education),
                            "certifications_count": len(recommendations.resume_data.certifications or [])
                        },
                        "top_roles": [
                            {
                                "role_title": match.role_profile.title,
                                "overall_score": match.overall_score
                            }
                            for match in recommendations.top_roles[:5]
                        ]
                    }
                )
            
            return recommendations
            
        except Exception as e:
            if analysis_id:
                await self.sse_service.broadcast_error(
                    analysis_id=analysis_id,
                    error_message=str(e)
                )
            raise
    
    async def _generate_recommendations_streaming(
        self,
        resume_data: ResumeData,
        analysis_id: Optional[int] = None,
        top_n: int = 10
    ):
        """
        Generate recommendations with progress updates.
        
        Args:
            resume_data: Parsed resume data
            analysis_id: Optional analysis ID for SSE broadcasting
            top_n: Number of top recommendations to return
            
        Returns:
            CareerRecommendation: The recommendations
        """
        all_profiles = self.role_database.get_all_profiles()
        total_profiles = len(all_profiles)
        all_matches = []
        
        for idx, profile in enumerate(all_profiles):
            match = self._match_resume_to_role(resume_data, profile)
            all_matches.append(match)
            
            # Send progress every 10 profiles
            if analysis_id and (idx + 1) % 10 == 0:
                progress = 50 + int((idx + 1) / total_profiles * 40)
                await self.sse_service.broadcast_progress(
                    analysis_id=analysis_id,
                    stage="scoring",
                    progress=progress,
                    details={"step": f"Scored {idx + 1}/{total_profiles} roles"}
                )
        
        # Sort and get top matches
        all_matches.sort(key=lambda m: m.overall_score, reverse=True)
        top_roles = all_matches[:top_n]
        
        if analysis_id:
            await self.sse_service.broadcast_progress(
                analysis_id=analysis_id,
                stage="scoring",
                progress=95,
                details={"step": "Finalizing recommendations"}
            )
        
        # Generate pathways and insights
        pathways = self._generate_career_pathways(top_roles)
        insights = self._generate_insights(resume_data, top_roles)
        
        from services.career_recommendation_service import CareerRecommendation
        return CareerRecommendation(
            resume_data=resume_data,
            top_roles=top_roles,
            career_pathways=pathways,
            overall_insights=insights
        )

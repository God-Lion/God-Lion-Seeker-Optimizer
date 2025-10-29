"""
Career recommendation repository for managing resume analyses and role recommendations.
"""
from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func
from src.repositories.base import BaseRepository
from src.models.career_recommendation import (
    ResumeAnalysis,
    RoleRecommendation,
    SkillEmbedding,
    CareerPathway
)
import structlog

logger = structlog.get_logger(__name__)


class ResumeAnalysisRepository(BaseRepository[ResumeAnalysis]):
    """Repository for resume analysis operations"""
    
    def __init__(self, session: AsyncSession):
        super().__init__(session, ResumeAnalysis)
    
    async def get_by_email(self, email: str) -> List[ResumeAnalysis]:
        """Get all resume analyses for a user by email"""
        try:
            query = select(ResumeAnalysis).where(
                ResumeAnalysis.user_email == email
            ).order_by(desc(ResumeAnalysis.created_at))
            
            result = await self.session.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            logger.error("error_fetching_analyses_by_email", email=email, error=str(e))
            raise
    
    async def get_latest_by_email(self, email: str) -> Optional[ResumeAnalysis]:
        """Get the most recent resume analysis for a user"""
        try:
            query = select(ResumeAnalysis).where(
                ResumeAnalysis.user_email == email
            ).order_by(desc(ResumeAnalysis.created_at)).limit(1)
            
            result = await self.session.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error("error_fetching_latest_analysis", email=email, error=str(e))
            raise
    
    async def get_with_recommendations(self, analysis_id: int) -> Optional[ResumeAnalysis]:
        """Get resume analysis with all recommendations loaded"""
        try:
            from sqlalchemy.orm import selectinload
            
            query = select(ResumeAnalysis).where(
                ResumeAnalysis.id == analysis_id
            ).options(selectinload(ResumeAnalysis.recommendations))
            
            result = await self.session.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error("error_fetching_analysis_with_recommendations", 
                        analysis_id=analysis_id, error=str(e))
            raise
    
    async def search_by_skills(self, skills: List[str], limit: int = 10) -> List[ResumeAnalysis]:
        """Search resume analyses that contain specific skills"""
        try:
            # This is a simple text search; for production, consider full-text search
            query = select(ResumeAnalysis).limit(limit)
            result = await self.session.execute(query)
            analyses = list(result.scalars().all())
            
            # Filter by skills in Python (could be optimized with JSON operators)
            filtered = [
                analysis for analysis in analyses
                if any(skill.lower() in str(analysis.skills).lower() for skill in skills)
            ]
            
            return filtered[:limit]
        except Exception as e:
            logger.error("error_searching_by_skills", skills=skills, error=str(e))
            raise


class RoleRecommendationRepository(BaseRepository[RoleRecommendation]):
    """Repository for role recommendation operations"""
    
    def __init__(self, session: AsyncSession):
        super().__init__(session, RoleRecommendation)
    
    async def get_by_resume_analysis(
        self,
        resume_analysis_id: int,
        min_score: Optional[float] = None
    ) -> List[RoleRecommendation]:
        """Get all recommendations for a resume analysis, optionally filtered by score"""
        try:
            query = select(RoleRecommendation).where(
                RoleRecommendation.resume_analysis_id == resume_analysis_id
            )
            
            if min_score is not None:
                query = query.where(RoleRecommendation.overall_fit_score >= min_score)
            
            query = query.order_by(desc(RoleRecommendation.overall_fit_score))
            
            result = await self.session.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            logger.error("error_fetching_recommendations", 
                        resume_analysis_id=resume_analysis_id, error=str(e))
            raise
    
    async def get_top_recommendations(
        self,
        resume_analysis_id: int,
        top_n: int = 5
    ) -> List[RoleRecommendation]:
        """Get top N recommendations for a resume"""
        try:
            query = select(RoleRecommendation).where(
                RoleRecommendation.resume_analysis_id == resume_analysis_id
            ).order_by(desc(RoleRecommendation.overall_fit_score)).limit(top_n)
            
            result = await self.session.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            logger.error("error_fetching_top_recommendations", 
                        resume_analysis_id=resume_analysis_id, error=str(e))
            raise
    
    async def get_by_role_category(
        self,
        resume_analysis_id: int,
        category: str
    ) -> List[RoleRecommendation]:
        """Get recommendations filtered by role category"""
        try:
            query = select(RoleRecommendation).where(
                and_(
                    RoleRecommendation.resume_analysis_id == resume_analysis_id,
                    RoleRecommendation.role_category == category
                )
            ).order_by(desc(RoleRecommendation.overall_fit_score))
            
            result = await self.session.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            logger.error("error_fetching_recommendations_by_category", 
                        category=category, error=str(e))
            raise
    
    async def get_statistics_by_role(self, role_id: str) -> Dict:
        """Get statistics for a specific role across all recommendations"""
        try:
            query = select(
                func.count(RoleRecommendation.id).label('count'),
                func.avg(RoleRecommendation.overall_fit_score).label('avg_score'),
                func.max(RoleRecommendation.overall_fit_score).label('max_score'),
                func.min(RoleRecommendation.overall_fit_score).label('min_score')
            ).where(RoleRecommendation.role_id == role_id)
            
            result = await self.session.execute(query)
            row = result.first()
            
            return {
                'role_id': role_id,
                'total_recommendations': row.count or 0,
                'average_score': float(row.avg_score) if row.avg_score else 0.0,
                'max_score': float(row.max_score) if row.max_score else 0.0,
                'min_score': float(row.min_score) if row.min_score else 0.0
            }
        except Exception as e:
            logger.error("error_fetching_role_statistics", role_id=role_id, error=str(e))
            raise


class SkillEmbeddingRepository(BaseRepository[SkillEmbedding]):
    """Repository for skill embedding operations"""
    
    def __init__(self, session: AsyncSession):
        super().__init__(session, SkillEmbedding)
    
    async def get_by_skill_name(self, skill_name: str) -> Optional[SkillEmbedding]:
        """Get embedding for a specific skill"""
        try:
            query = select(SkillEmbedding).where(
                SkillEmbedding.skill_name == skill_name.lower()
            )
            result = await self.session.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error("error_fetching_skill_embedding", 
                        skill_name=skill_name, error=str(e))
            raise
    
    async def get_by_skills(self, skill_names: List[str]) -> List[SkillEmbedding]:
        """Get embeddings for multiple skills"""
        try:
            skill_names_lower = [s.lower() for s in skill_names]
            query = select(SkillEmbedding).where(
                SkillEmbedding.skill_name.in_(skill_names_lower)
            )
            result = await self.session.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            logger.error("error_fetching_multiple_embeddings", 
                        skills_count=len(skill_names), error=str(e))
            raise
    
    async def upsert_embedding(
        self,
        skill_name: str,
        embedding: List[float],
        model: str,
        category: Optional[str] = None,
        synonyms: Optional[List[str]] = None
    ) -> SkillEmbedding:
        """Insert or update a skill embedding"""
        try:
            # Check if exists
            existing = await self.get_by_skill_name(skill_name)
            
            if existing:
                existing.embedding = embedding
                existing.embedding_model = model
                existing.category = category
                existing.synonyms = synonyms
                await self.session.flush()
                return existing
            else:
                new_embedding = SkillEmbedding(
                    skill_name=skill_name.lower(),
                    embedding=embedding,
                    embedding_model=model,
                    category=category,
                    synonyms=synonyms
                )
                return await self.create(new_embedding)
        except Exception as e:
            logger.error("error_upserting_embedding", 
                        skill_name=skill_name, error=str(e))
            raise
    
    async def bulk_create_embeddings(
        self,
        embeddings_data: List[Dict]
    ) -> List[SkillEmbedding]:
        """Bulk create skill embeddings"""
        try:
            embeddings = [
                SkillEmbedding(**data) for data in embeddings_data
            ]
            self.session.add_all(embeddings)
            await self.session.flush()
            logger.info("bulk_embeddings_created", count=len(embeddings))
            return embeddings
        except Exception as e:
            logger.error("error_bulk_creating_embeddings", error=str(e))
            raise


class CareerPathwayRepository(BaseRepository[CareerPathway]):
    """Repository for career pathway operations"""
    
    def __init__(self, session: AsyncSession):
        super().__init__(session, CareerPathway)
    
    async def get_pathways_from_role(self, from_role_id: str) -> List[CareerPathway]:
        """Get all career paths starting from a role"""
        try:
            query = select(CareerPathway).where(
                CareerPathway.from_role_id == from_role_id
            ).order_by(desc(CareerPathway.success_rate))
            
            result = await self.session.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            logger.error("error_fetching_pathways_from_role", 
                        from_role_id=from_role_id, error=str(e))
            raise
    
    async def get_pathways_to_role(self, to_role_id: str) -> List[CareerPathway]:
        """Get all career paths leading to a role"""
        try:
            query = select(CareerPathway).where(
                CareerPathway.to_role_id == to_role_id
            ).order_by(desc(CareerPathway.success_rate))
            
            result = await self.session.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            logger.error("error_fetching_pathways_to_role", 
                        to_role_id=to_role_id, error=str(e))
            raise
    
    async def get_pathway(
        self,
        from_role_id: str,
        to_role_id: str
    ) -> Optional[CareerPathway]:
        """Get a specific career pathway between two roles"""
        try:
            query = select(CareerPathway).where(
                and_(
                    CareerPathway.from_role_id == from_role_id,
                    CareerPathway.to_role_id == to_role_id
                )
            )
            result = await self.session.execute(query)
            return result.scalar_one_or_none()
        except Exception as e:
            logger.error("error_fetching_specific_pathway", 
                        from_role=from_role_id, to_role=to_role_id, error=str(e))
            raise
    
    async def get_recommended_pathways(
        self,
        from_role_id: str,
        min_success_rate: float = 0.5
    ) -> List[CareerPathway]:
        """Get recommended pathways with minimum success rate"""
        try:
            query = select(CareerPathway).where(
                and_(
                    CareerPathway.from_role_id == from_role_id,
                    CareerPathway.success_rate >= min_success_rate
                )
            ).order_by(
                desc(CareerPathway.success_rate),
                CareerPathway.typical_years
            )
            
            result = await self.session.execute(query)
            return list(result.scalars().all())
        except Exception as e:
            logger.error("error_fetching_recommended_pathways", 
                        from_role_id=from_role_id, error=str(e))
            raise

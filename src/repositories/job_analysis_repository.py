"""Repository for job analysis operations"""
from typing import List, Optional
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
import structlog

from .base import BaseRepository
from src.models.job_analysis import JobAnalysis
from src.models.job import Job

logger = structlog.get_logger(__name__)


class JobAnalysisRepository(BaseRepository[JobAnalysis]):
    """Repository for managing job analysis records"""
    
    def __init__(self, session):
        super().__init__(session, JobAnalysis)
    
    async def get_by_job_id(self, job_id: int) -> Optional[JobAnalysis]:
        """
        Get analysis for a specific job.
        
        Args:
            job_id: Job ID
            
        Returns:
            JobAnalysis or None
        """
        stmt = (
            select(JobAnalysis)
            .where(JobAnalysis.job_id == job_id)
            .options(selectinload(JobAnalysis.job))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_by_job_and_resume(
        self, 
        job_id: int, 
        resume_id: Optional[str] = None
    ) -> Optional[JobAnalysis]:
        """
        Get analysis for a specific job and resume combination.
        
        Args:
            job_id: Job ID
            resume_id: Resume identifier (optional)
            
        Returns:
            JobAnalysis or None
        """
        stmt = (
            select(JobAnalysis)
            .where(
                and_(
                    JobAnalysis.job_id == job_id,
                    JobAnalysis.resume_id == resume_id
                )
            )
            .options(selectinload(JobAnalysis.job))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()
    
    async def get_high_matches(
        self, 
        min_score: float = 0.70, 
        limit: int = 100
    ) -> List[JobAnalysis]:
        """
        Get high-match jobs above a minimum score.
        
        Args:
            min_score: Minimum match score (0.0 to 1.0)
            limit: Maximum number of results
            
        Returns:
            List of JobAnalysis records
        """
        stmt = (
            select(JobAnalysis)
            .where(JobAnalysis.overall_match_score >= min_score)
            .options(
                selectinload(JobAnalysis.job)
                .selectinload(Job.company)
            )
            .order_by(JobAnalysis.overall_match_score.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
    
    async def get_by_category(
        self, 
        category: str, 
        limit: int = 100
    ) -> List[JobAnalysis]:
        """
        Get analyses by match category.
        
        Args:
            category: Match category (excellent, good, fair, poor)
            limit: Maximum number of results
            
        Returns:
            List of JobAnalysis records
        """
        stmt = (
            select(JobAnalysis)
            .where(JobAnalysis.match_category == category)
            .options(
                selectinload(JobAnalysis.job)
                .selectinload(Job.company)
            )
            .order_by(JobAnalysis.overall_match_score.desc())
            .limit(limit)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
    
    async def get_top_matches(
        self, 
        limit: int = 20,
        resume_id: Optional[str] = None
    ) -> List[JobAnalysis]:
        """
        Get top matching jobs.
        
        Args:
            limit: Number of top matches to return
            resume_id: Filter by resume ID (optional)
            
        Returns:
            List of JobAnalysis records ordered by score
        """
        conditions = []
        if resume_id:
            conditions.append(JobAnalysis.resume_id == resume_id)
        
        stmt = (
            select(JobAnalysis)
            .options(
                selectinload(JobAnalysis.job)
                .selectinload(Job.company)
            )
            .order_by(JobAnalysis.overall_match_score.desc())
            .limit(limit)
        )
        
        if conditions:
            stmt = stmt.where(and_(*conditions))
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
    
    async def get_recent_analyses(
        self, 
        limit: int = 50,
        resume_id: Optional[str] = None
    ) -> List[JobAnalysis]:
        """
        Get recent job analyses.
        
        Args:
            limit: Number of analyses to return
            resume_id: Filter by resume ID (optional)
            
        Returns:
            List of recent JobAnalysis records
        """
        conditions = []
        if resume_id:
            conditions.append(JobAnalysis.resume_id == resume_id)
        
        stmt = (
            select(JobAnalysis)
            .options(
                selectinload(JobAnalysis.job)
                .selectinload(Job.company)
            )
            .order_by(JobAnalysis.analyzed_at.desc())
            .limit(limit)
        )
        
        if conditions:
            stmt = stmt.where(and_(*conditions))
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
    
    async def get_unanalyzed_jobs(
        self, 
        limit: int = 100,
        resume_id: Optional[str] = None
    ) -> List[Job]:
        """
        Get jobs that haven't been analyzed yet.
        
        Args:
            limit: Maximum number of jobs to return
            resume_id: Resume ID to check against (optional)
            
        Returns:
            List of Job records without analysis
        """
        # Subquery to find job IDs that have been analyzed
        if resume_id:
            analyzed_subq = (
                select(JobAnalysis.job_id)
                .where(JobAnalysis.resume_id == resume_id)
            )
        else:
            analyzed_subq = select(JobAnalysis.job_id)
        
        stmt = (
            select(Job)
            .where(
                and_(
                    Job.is_active == True,
                    Job.id.not_in(analyzed_subq)
                )
            )
            .options(selectinload(Job.company))
            .order_by(Job.created_at.desc())
            .limit(limit)
        )
        
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
    
    async def get_statistics(
        self, 
        resume_id: Optional[str] = None
    ) -> dict:
        """
        Get statistics about job analyses.
        
        Args:
            resume_id: Filter by resume ID (optional)
            
        Returns:
            Dictionary with statistics
        """
        conditions = []
        if resume_id:
            conditions.append(JobAnalysis.resume_id == resume_id)
        
        # Count by category
        category_stmt = (
            select(
                JobAnalysis.match_category,
                func.count(JobAnalysis.id).label('count')
            )
            .group_by(JobAnalysis.match_category)
        )
        
        if conditions:
            category_stmt = category_stmt.where(and_(*conditions))
        
        category_result = await self.session.execute(category_stmt)
        category_counts = {row.match_category: row.count for row in category_result}
        
        # Average score
        avg_stmt = select(func.avg(JobAnalysis.overall_match_score))
        if conditions:
            avg_stmt = avg_stmt.where(and_(*conditions))
        
        avg_result = await self.session.execute(avg_stmt)
        avg_score = avg_result.scalar()
        
        # Total analyzed
        count_stmt = select(func.count(JobAnalysis.id))
        if conditions:
            count_stmt = count_stmt.where(and_(*conditions))
        
        count_result = await self.session.execute(count_stmt)
        total_analyzed = count_result.scalar()
        
        return {
            'total_analyzed': total_analyzed or 0,
            'average_match_score': round(float(avg_score or 0), 3),
            'by_category': category_counts,
            'excellent': category_counts.get('excellent', 0),
            'good': category_counts.get('good', 0),
            'fair': category_counts.get('fair', 0),
            'poor': category_counts.get('poor', 0)
        }
    
    async def delete_by_job_id(self, job_id: int) -> bool:
        """
        Delete analysis for a specific job.
        
        Args:
            job_id: Job ID
            
        Returns:
            True if deleted, False otherwise
        """
        analysis = await self.get_by_job_id(job_id)
        if analysis:
            await self.delete(analysis.id)
            return True
        return False
    
    async def bulk_create_analyses(
        self, 
        analyses: List[JobAnalysis]
    ) -> List[JobAnalysis]:
        """
        Create multiple analyses in bulk.
        
        Args:
            analyses: List of JobAnalysis objects
            
        Returns:
            List of created analyses
        """
        self.session.add_all(analyses)
        await self.session.flush()
        return analyses

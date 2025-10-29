"""Job repository with specialized queries"""
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_, func
from datetime import datetime, timedelta
from src.models import Job
from .base import BaseRepository
import logging

logger = logging.getLogger(__name__)


class JobRepository(BaseRepository[Job]):
    """Repository for Job model with custom queries"""
    
    def __init__(self, session: AsyncSession):
        super().__init__(session, Job)
    
    async def get_by_job_id(self, job_id: str) -> Optional[Job]:
        """
        Retrieve job by LinkedIn job_id (unique identifier).
        
        Args:
            job_id: LinkedIn's unique job identifier
            
        Returns:
            Job instance or None
        """
        try:
            query = select(Job).where(Job.job_id == job_id)
            result = await self.session.execute(query)
            return result.scalar()
        except Exception as e:
            logger.error(f"Error fetching job by job_id {job_id}: {e}")
            raise
    
    async def get_by_company(self, company_id: int, limit: int = 50) -> List[Job]:
        """
        Retrieve all jobs from a specific company.
        
        Args:
            company_id: Company ID
            limit: Maximum results
            
        Returns:
            List of jobs from the company
        """
        try:
            query = (
                select(Job)
                .where(Job.company_id == company_id)
                .order_by(desc(Job.created_at))
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching jobs for company {company_id}: {e}")
            raise
    
    async def get_active_jobs(self, limit: int = 100) -> List[Job]:
        """
        Retrieve active (not archived) job listings.
        
        Args:
            limit: Maximum results
            
        Returns:
            List of active jobs
        """
        try:
            query = (
                select(Job)
                .where(Job.is_active == True)
                .order_by(desc(Job.created_at))
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching active jobs: {e}")
            raise
    
    async def get_recent_jobs(
        self,
        days: int = 7,
        limit: int = 100
    ) -> List[Job]:
        """
        Retrieve jobs scraped in the last N days.
        
        Args:
            days: Number of days to look back
            limit: Maximum results
            
        Returns:
            List of recent jobs
        """
        try:
            since = datetime.utcnow() - timedelta(days=days)
            query = (
                select(Job)
                .where(Job.created_at >= since)
                .order_by(desc(Job.created_at))
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching recent jobs (last {days} days): {e}")
            raise
    
    async def search_by_title(
        self,
        keyword: str,
        limit: int = 50
    ) -> List[Job]:
        """
        Search jobs by title keyword.
        
        Args:
            keyword: Search keyword
            limit: Maximum results
            
        Returns:
            List of matching jobs
        """
        try:
            search_term = f"%{keyword}%"
            query = (
                select(Job)
                .where(Job.title.ilike(search_term))
                .order_by(desc(Job.created_at))
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error searching jobs with title '{keyword}': {e}")
            raise
    
    async def search_by_location(
        self,
        location: str,
        limit: int = 50
    ) -> List[Job]:
        """
        Search jobs by location.
        
        Args:
            location: Location keyword
            limit: Maximum results
            
        Returns:
            List of jobs in matching locations
        """
        try:
            search_term = f"%{location}%"
            query = (
                select(Job)
                .where(Job.place.ilike(search_term))
                .order_by(desc(Job.created_at))
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error searching jobs in location '{location}': {e}")
            raise
    
    async def get_by_session(self, session_id: int, limit: int = 100) -> List[Job]:
        """
        Retrieve all jobs from a scraping session.
        
        Args:
            session_id: Scraping session ID
            limit: Maximum results
            
        Returns:
            List of jobs from the session
        """
        try:
            query = (
                select(Job)
                .where(Job.session_id == session_id)
                .order_by(desc(Job.created_at))
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching jobs for session {session_id}: {e}")
            raise
    
    async def count_by_company(self, company_id: int) -> int:
        """
        Count total jobs from a company.
        
        Args:
            company_id: Company ID
            
        Returns:
            Number of jobs
        """
        try:
            query = select(func.count()).select_from(Job).where(
                Job.company_id == company_id
            )
            result = await self.session.execute(query)
            count = result.scalar()
            return count or 0
        except Exception as e:
            logger.error(f"Error counting jobs for company {company_id}: {e}")
            raise
    
    async def count_by_location(self, location: str) -> int:
        """
        Count jobs in a specific location.
        
        Args:
            location: Location string
            
        Returns:
            Number of jobs in location
        """
        try:
            search_term = f"%{location}%"
            query = (
                select(func.count())
                .select_from(Job)
                .where(Job.place.ilike(search_term))
            )
            result = await self.session.execute(query)
            count = result.scalar()
            return count or 0
        except Exception as e:
            logger.error(f"Error counting jobs in location '{location}': {e}")
            raise
    
    async def get_matched_jobs(
        self,
        min_score: float = 0.5,
        limit: int = 50
    ) -> List[Job]:
        """
        Retrieve jobs with match scores above threshold.
        
        Args:
            min_score: Minimum match score (0-1)
            limit: Maximum results
            
        Returns:
            List of matched jobs
        """
        try:
            query = (
                select(Job)
                .where(
                    and_(
                        Job.match_score >= min_score,
                        Job.match_score.isnot(None)
                    )
                )
                .order_by(desc(Job.match_score))
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching matched jobs (score >= {min_score}): {e}")
            raise
    
    async def archive_old_jobs(self, cutoff_date: datetime) -> int:
        """
        Archive jobs older than cutoff date.
        
        Args:
            cutoff_date: Archive jobs created before this date
            
        Returns:
            Number of jobs archived
        """
        try:
            from sqlalchemy import update
            
            query = (
                update(Job)
                .where(
                    and_(
                        Job.created_at < cutoff_date,
                        Job.is_active == True
                    )
                )
                .values(is_active=False)
            )
            result = await self.session.execute(query)
            await self.session.commit()
            return result.rowcount
        except Exception as e:
            logger.error(f"Error archiving old jobs: {e}")
            await self.session.rollback()
            raise
    
    async def get_by_session_id(self, session_id: int) -> List[Job]:
        """
        Get jobs by session ID (alias for get_by_session).
        
        Args:
            session_id: Scraping session ID
            
        Returns:
            List of jobs from the session
        """
        return await self.get_by_session(session_id)
    
    async def get_jobs_with_filters(
        self,
        skip: int = 0,
        limit: int = 20,
        company: Optional[str] = None,
        location: Optional[str] = None,
    ) -> List[Job]:
        """
        Get jobs with optional filters for API endpoints.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            company: Filter by company name (partial match)
            location: Filter by location (partial match)
            
        Returns:
            List of filtered jobs
        """
        try:
            # Start with base query
            query = select(Job)
            
            # Apply filters if provided
            conditions = []
            
            if company:
                # Join with Company table to filter by company name
                from models import Company
                query = query.join(Company, Job.company_id == Company.id)
                conditions.append(Company.name.ilike(f"%{company}%"))
            
            if location:
                conditions.append(Job.place.ilike(f"%{location}%"))
            
            # Apply all conditions
            if conditions:
                query = query.where(and_(*conditions))
            
            # Order by most recent first
            query = query.order_by(desc(Job.created_at))
            
            # Apply pagination
            query = query.offset(skip).limit(limit)
            
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching jobs with filters: {e}")
            raise
    
    async def search_jobs(
        self,
        query: str,
        skip: int = 0,
        limit: int = 20,
    ) -> List[Job]:
        """
        Search jobs by keyword in title and description.
        
        Args:
            query: Search keyword
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of matching jobs
        """
        try:
            search_term = f"%{query}%"
            
            # Search in both title and description
            sql_query = (
                select(Job)
                .where(
                    Job.title.ilike(search_term) |
                    Job.description.ilike(search_term)
                )
                .order_by(desc(Job.created_at))
                .offset(skip)
                .limit(limit)
            )
            
            result = await self.session.execute(sql_query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error searching jobs with query '{query}': {e}")
            raise


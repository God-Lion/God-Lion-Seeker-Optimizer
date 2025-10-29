"""Scraping session repository with specialized queries"""
from typing import List, Optional, Union
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select, desc, func
from src.models import ScrapingSession
from .base import BaseRepository
import logging

logger = logging.getLogger(__name__)


class ScrapingSessionRepository(BaseRepository[ScrapingSession]):
    """Repository for ScrapingSession model with custom queries"""
    
    def __init__(self, session: AsyncSession):
        super().__init__(session, ScrapingSession)
    
    async def create_session(
        self,
        *,
        query: str,
        location: str = "",
        max_jobs: int = 25,
    ) -> ScrapingSession:
        """
        Create a new scraping session record.

        Note: `location` is currently not stored on the model/table. It is
        accepted to keep API compatibility but ignored for persistence.
        """
        try:
            # Compose a readable session name using provided parameters
            session_name_parts = [query.strip()]
            if location.strip():
                session_name_parts.append(location.strip())
            session_name = " - ".join([p for p in session_name_parts if p]) or "Scraping Session"

            new_session = ScrapingSession(
                session_name=session_name,
                query=query,
                status="pending",
            )

            created = await self.create(new_session)
            await self.session.commit()
            return created
        except Exception as e:
            logger.error(f"Error creating scraping session: {e}")
            raise
    
    async def get_by_status(
        self,
        status: str,
        limit: int = 50
    ) -> List[ScrapingSession]:
        """
        Retrieve sessions by status.
        
        Args:
            status: Session status (pending, running, completed, failed, paused)
            limit: Maximum results
            
        Returns:
            List of sessions with matching status
        """
        try:
            query = (
                select(ScrapingSession)
                .where(ScrapingSession.status == status)
                .order_by(desc(ScrapingSession.created_at))
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching sessions with status '{status}': {e}")
            raise
    
    async def get_recent_sessions(
        self,
        limit: int = 20
    ) -> List[ScrapingSession]:
        """
        Retrieve most recent scraping sessions.
        
        Args:
            limit: Maximum results
            
        Returns:
            List of recent sessions ordered by creation date
        """
        try:
            query = (
                select(ScrapingSession)
                .order_by(desc(ScrapingSession.created_at))
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching recent sessions: {e}")
            raise
    
    async def get_running_sessions(self) -> List[ScrapingSession]:
        """
        Retrieve currently running sessions.
        
        Returns:
            List of running sessions
        """
        try:
            return await self.get_by_status("running")
        except Exception as e:
            logger.error("Error fetching running sessions: {e}")
            raise
    
    async def get_completed_sessions(
        self,
        limit: int = 50
    ) -> List[ScrapingSession]:
        """
        Retrieve completed sessions.
        
        Args:
            limit: Maximum results
            
        Returns:
            List of completed sessions
        """
        try:
            return await self.get_by_status("completed", limit=limit)
        except Exception as e:
            logger.error("Error fetching completed sessions: {e}")
            raise
    
    async def get_by_query(
        self,
        query: str,
        limit: int = 20
    ) -> List[ScrapingSession]:
        """
        Retrieve sessions by search query.
        
        Args:
            query: Search query keyword
            limit: Maximum results
            
        Returns:
            List of sessions with matching query
        """
        try:
            search_term = f"%{query}%"
            query_expr = (
                select(ScrapingSession)
                .where(ScrapingSession.query.ilike(search_term))
                .order_by(desc(ScrapingSession.created_at))
                .limit(limit)
            )
            result = await self.session.execute(query_expr)
            return result.scalars().all()
        except Exception as e:
            logger.error(f"Error fetching sessions with query '{query}': {e}")
            raise
    
    async def get_top_performers(
        self,
        limit: int = 20
    ) -> List[ScrapingSession]:
        """
        Retrieve sessions that scraped the most jobs.
        
        Args:
            limit: Maximum results
            
        Returns:
            List of top performing sessions
        """
        try:
            query = (
                select(ScrapingSession)
                .order_by(desc(ScrapingSession.total_jobs))
                .limit(limit)
            )
            result = await self.session.execute(query)
            return result.scalars().all()
        except Exception as e:
            logger.error("Error fetching top performing sessions: {e}")
            raise
    
    async def get_statistics(self) -> dict:
        """
        Get overall scraping statistics.
        
        Returns:
            Dictionary with statistics
        """
        try:
            # Total sessions
            total_query = select(func.count()).select_from(ScrapingSession)
            total = await self.session.execute(total_query)
            total_count = total.scalar() or 0
            
            # Total jobs
            total_jobs_query = select(func.sum(ScrapingSession.total_jobs)).select_from(ScrapingSession)
            total_jobs = await self.session.execute(total_jobs_query)
            total_jobs_count = total_jobs.scalar() or 0
            
            # Average jobs per session
            avg_jobs = total_jobs_count / total_count if total_count > 0 else 0
            
            # Status breakdown
            statuses = ["pending", "running", "completed", "failed", "paused"]
            status_counts = {}
            for status in statuses:
                status_query = select(func.count()).select_from(ScrapingSession).where(
                    ScrapingSession.status == status
                )
                result = await self.session.execute(status_query)
                status_counts[status] = result.scalar() or 0
            
            return {
                "total_sessions": total_count,
                "total_jobs_scraped": total_jobs_count,
                "average_jobs_per_session": avg_jobs,
                "status_breakdown": status_counts,
            }
        except Exception as e:
            logger.error(f"Error fetching statistics: {e}")
            raise

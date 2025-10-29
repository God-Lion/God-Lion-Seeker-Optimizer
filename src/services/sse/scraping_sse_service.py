"""
Scraping SSE Service

Specialized SSE service for web scraping operations.
Provides convenient methods for broadcasting scraping progress, status changes,
and completion events.

Example Usage:
    ```python
    from services.sse import ScrapingSSEService
    
    scraping_sse = ScrapingSSEService()
    
    # Start monitoring (usually from an endpoint)
    asyncio.create_task(scraping_sse.monitor_session(session_id, db))
    
    # Or broadcast manually from any service
    await scraping_sse.broadcast_progress(
        session_id=123,
        jobs_scraped=50,
        total_jobs=100,
        status="running"
    )
    ```
"""
import asyncio
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from .sse_service import sse_service
from .types import SSEEvent

logger = structlog.get_logger(__name__)


class ScrapingSSEService:
    """
    Specialized SSE service for scraping operations.
    
    This service provides convenient methods for broadcasting scraping-related
    events such as progress updates, status changes, and completion notifications.
    """
    
    def __init__(self):
        """Initialize scraping SSE service."""
        self.base_service = sse_service
    
    def _get_channel(self, session_id: int) -> str:
        """
        Get the channel name for a scraping session.
        
        Args:
            session_id: The scraping session ID
            
        Returns:
            str: Channel name
        """
        return f"scraping_{session_id}"
    
    async def broadcast_progress(
        self,
        session_id: int,
        jobs_scraped: int,
        total_jobs: int,
        status: str,
        additional_data: Optional[dict] = None
    ):
        """
        Broadcast scraping progress update.
        
        Args:
            session_id: The scraping session ID
            jobs_scraped: Number of jobs scraped so far
            total_jobs: Total number of jobs to scrape
            status: Current scraping status
            additional_data: Optional additional data to include
        """
        channel = self._get_channel(session_id)
        progress_percent = (jobs_scraped / max(total_jobs, 1)) * 100
        
        data = {
            "session_id": session_id,
            "jobs_scraped": jobs_scraped,
            "total_jobs": total_jobs,
            "progress": round(progress_percent, 2),
            "status": status
        }
        
        if additional_data:
            data.update(additional_data)
        
        await self.base_service.broadcast(channel, SSEEvent.PROGRESS, data)
        logger.debug(
            "scraping_progress_broadcast",
            session_id=session_id,
            progress=progress_percent
        )
    
    async def broadcast_status_change(
        self,
        session_id: int,
        status: str,
        additional_data: Optional[dict] = None
    ):
        """
        Broadcast scraping status change.
        
        Args:
            session_id: The scraping session ID
            status: The new status
            additional_data: Optional additional data to include
        """
        channel = self._get_channel(session_id)
        
        data = {
            "session_id": session_id,
            "status": status
        }
        
        if additional_data:
            data.update(additional_data)
        
        await self.base_service.broadcast(channel, SSEEvent.STATUS_CHANGE, data)
        logger.info("scraping_status_change", session_id=session_id, status=status)
    
    async def broadcast_complete(
        self,
        session_id: int,
        status: str,
        jobs_scraped: int,
        total_jobs: int,
        completed_at: Optional[str] = None,
        additional_data: Optional[dict] = None
    ):
        """
        Broadcast scraping completion.
        
        Args:
            session_id: The scraping session ID
            status: Final status (completed, failed, stopped)
            jobs_scraped: Total jobs scraped
            total_jobs: Total jobs attempted
            completed_at: Completion timestamp
            additional_data: Optional additional data to include
        """
        channel = self._get_channel(session_id)
        
        data = {
            "session_id": session_id,
            "status": status,
            "jobs_scraped": jobs_scraped,
            "total_jobs": total_jobs,
            "completed_at": completed_at
        }
        
        if additional_data:
            data.update(additional_data)
        
        await self.base_service.broadcast(channel, SSEEvent.COMPLETE, data)
        logger.info(
            "scraping_complete",
            session_id=session_id,
            status=status,
            jobs_scraped=jobs_scraped
        )
    
    async def broadcast_error(
        self,
        session_id: int,
        error_message: str,
        additional_data: Optional[dict] = None
    ):
        """
        Broadcast scraping error.
        
        Args:
            session_id: The scraping session ID
            error_message: The error message
            additional_data: Optional additional data to include
        """
        channel = self._get_channel(session_id)
        
        data = {
            "session_id": session_id,
            "message": error_message
        }
        
        if additional_data:
            data.update(additional_data)
        
        await self.base_service.broadcast(channel, SSEEvent.ERROR, data)
        logger.error("scraping_error_broadcast", session_id=session_id, error=error_message)
    
    async def monitor_session(
        self,
        session_id: int,
        db: AsyncSession,
        poll_interval: float = 2.0
    ):
        """
        Background task to monitor scraping progress and broadcast updates.
        
        This method polls the database for session updates and broadcasts
        changes to connected clients. Should be run as a background task.
        
        Args:
            session_id: The scraping session ID to monitor
            db: Database session
            poll_interval: How often to poll for updates (seconds)
            
        Example:
            ```python
            asyncio.create_task(
                scraping_sse.monitor_session(session_id, db)
            )
            ```
        """
        from repositories.scraping_session_repository import ScrapingSessionRepository
        
        session_repo = ScrapingSessionRepository(db)
        last_status = None
        last_jobs_count = 0
        
        try:
            while True:
                await asyncio.sleep(poll_interval)
                
                session = await session_repo.get_by_id(session_id)
                if not session:
                    logger.warning("scraping_session_not_found", session_id=session_id)
                    break
                
                # Broadcast status changes
                if session.status != last_status:
                    await self.broadcast_status_change(
                        session_id,
                        session.status
                    )
                    last_status = session.status
                
                # Broadcast progress updates
                if session.jobs_scraped != last_jobs_count:
                    await self.broadcast_progress(
                        session_id,
                        session.jobs_scraped,
                        session.total_jobs,
                        session.status
                    )
                    last_jobs_count = session.jobs_scraped
                
                # Check if complete
                if session.status in ['completed', 'failed', 'stopped']:
                    await self.broadcast_complete(
                        session_id,
                        session.status,
                        session.jobs_scraped,
                        session.total_jobs,
                        session.completed_at.isoformat() if session.completed_at else None
                    )
                    break
                    
        except Exception as e:
            logger.error("monitor_scraping_error", session_id=session_id, error=str(e))
            await self.broadcast_error(session_id, str(e))
    
    async def connect_client(self, session_id: int):
        """
        Connect a client to a scraping session channel.
        
        Args:
            session_id: The scraping session ID
            
        Returns:
            asyncio.Queue: The connection queue
        """
        channel = self._get_channel(session_id)
        return await self.base_service.connect(channel)
    
    async def create_event_stream(self, session_id: int, queue: asyncio.Queue):
        """
        Create an event stream for a scraping session.
        
        Args:
            session_id: The scraping session ID
            queue: The connection queue
            
        Returns:
            AsyncGenerator: Stream of SSE events
        """
        channel = self._get_channel(session_id)
        return self.base_service.create_event_stream(channel, queue)

"""
Analysis SSE Service

Specialized SSE service for resume/profile analysis operations.
Provides convenient methods for broadcasting analysis progress, results,
and errors.

Example Usage:
    ```python
    from services.sse import AnalysisSSEService
    
    analysis_sse = AnalysisSSEService()
    
    # From your analysis service
    await analysis_sse.broadcast_progress(
        analysis_id=456,
        stage="parsing",
        progress=25,
        details={"step": "Extracting skills"}
    )
    
    await analysis_sse.broadcast_result(
        analysis_id=456,
        result={
            "top_roles": [...],
            "resume_summary": {...}
        }
    )
    ```
"""
from typing import Optional, Dict, Any
import structlog

from .sse_service import sse_service
from .types import SSEEvent

logger = structlog.get_logger(__name__)


class AnalysisSSEService:
    """
    Specialized SSE service for analysis operations.
    
    This service provides convenient methods for broadcasting analysis-related
    events such as progress updates, stage changes, results, and errors.
    """
    
    def __init__(self):
        """Initialize analysis SSE service."""
        self.base_service = sse_service
    
    def _get_channel(self, analysis_id: int) -> str:
        """
        Get the channel name for an analysis.
        
        Args:
            analysis_id: The analysis ID
            
        Returns:
            str: Channel name
        """
        return f"analysis_{analysis_id}"
    
    async def broadcast_progress(
        self,
        analysis_id: int,
        stage: str,
        progress: float,
        details: Optional[Dict[str, Any]] = None
    ):
        """
        Broadcast analysis progress update.
        
        Args:
            analysis_id: The analysis ID
            stage: Current analysis stage (e.g., "parsing", "matching", "scoring")
            progress: Progress percentage (0-100)
            details: Optional additional details about the current step
            
        Example:
            ```python
            await analysis_sse.broadcast_progress(
                analysis_id=123,
                stage="parsing",
                progress=30,
                details={
                    "step": "Extracting skills",
                    "skills_found": 15
                }
            )
            ```
        """
        channel = self._get_channel(analysis_id)
        
        data = {
            "analysis_id": analysis_id,
            "stage": stage,
            "progress": round(progress, 2)
        }
        
        if details:
            data.update(details)
        
        await self.base_service.broadcast(channel, SSEEvent.PROGRESS, data)
        logger.debug(
            "analysis_progress_broadcast",
            analysis_id=analysis_id,
            stage=stage,
            progress=progress
        )
    
    async def broadcast_result(
        self,
        analysis_id: int,
        result: Dict[str, Any]
    ):
        """
        Broadcast final analysis result.
        
        Args:
            analysis_id: The analysis ID
            result: The analysis result data
            
        Example:
            ```python
            await analysis_sse.broadcast_result(
                analysis_id=123,
                result={
                    "resume_summary": {
                        "total_skills": 25,
                        "years_experience": 5
                    },
                    "top_roles": [...]
                }
            )
            ```
        """
        channel = self._get_channel(analysis_id)
        
        data = {
            "analysis_id": analysis_id,
            **result
        }
        
        await self.base_service.broadcast(channel, SSEEvent.RESULT, data)
        logger.info("analysis_result_broadcast", analysis_id=analysis_id)
    
    async def broadcast_error(
        self,
        analysis_id: int,
        error_message: str,
        additional_data: Optional[Dict[str, Any]] = None
    ):
        """
        Broadcast analysis error.
        
        Args:
            analysis_id: The analysis ID
            error_message: The error message
            additional_data: Optional additional error details
        """
        channel = self._get_channel(analysis_id)
        
        data = {
            "analysis_id": analysis_id,
            "message": error_message
        }
        
        if additional_data:
            data.update(additional_data)
        
        await self.base_service.broadcast(channel, SSEEvent.ERROR, data)
        logger.error("analysis_error_broadcast", analysis_id=analysis_id, error=error_message)
    
    async def broadcast_complete(
        self,
        analysis_id: int,
        summary: Optional[Dict[str, Any]] = None
    ):
        """
        Broadcast analysis completion.
        
        Args:
            analysis_id: The analysis ID
            summary: Optional summary data
        """
        channel = self._get_channel(analysis_id)
        
        data = {
            "analysis_id": analysis_id,
            "status": "complete"
        }
        
        if summary:
            data.update(summary)
        
        await self.base_service.broadcast(channel, SSEEvent.COMPLETE, data)
        logger.info("analysis_complete_broadcast", analysis_id=analysis_id)
    
    async def connect_client(self, analysis_id: int):
        """
        Connect a client to an analysis channel.
        
        Args:
            analysis_id: The analysis ID
            
        Returns:
            asyncio.Queue: The connection queue
        """
        channel = self._get_channel(analysis_id)
        return await self.base_service.connect(channel)
    
    async def create_event_stream(self, analysis_id: int, queue):
        """
        Create an event stream for an analysis.
        
        Args:
            analysis_id: The analysis ID
            queue: The connection queue
            
        Returns:
            AsyncGenerator: Stream of SSE events
        """
        channel = self._get_channel(analysis_id)
        return self.base_service.create_event_stream(channel, queue)

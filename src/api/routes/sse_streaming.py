"""
Server-Sent Events (SSE) Streaming Endpoints (REFACTORED)

Provides real-time progress updates for long-running operations.
This is a refactored version that uses the SSE service layer for better
separation of concerns and reusability.

CHANGES FROM ORIGINAL:
- Uses SSEService layer instead of managing connections directly
- Cleaner separation between routing logic and SSE logic
- Better testability and maintainability
- Reusable service components
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
import asyncio
import structlog

from src.config.database import get_db
from src.repositories.scraping_session_repository import ScrapingSessionRepository
from src.repositories.career_recommendation_repository import ResumeAnalysisRepository
from src.services.sse import (
    sse_service,
    ScrapingSSEService,
    AnalysisSSEService
)

logger = structlog.get_logger(__name__)
router = APIRouter(prefix="/sse", tags=["Server-Sent Events"])

# Initialize specialized SSE services
scraping_sse = ScrapingSSEService()
analysis_sse = AnalysisSSEService()


@router.get("/scraping/{session_id}")
async def stream_scraping_progress(
    session_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Stream real-time scraping progress updates via SSE.
    
    Client usage:
    ```javascript
    const eventSource = new EventSource('/api/sse/scraping/123');
    
    eventSource.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data);
        console.log('Progress:', data);
    });
    
    eventSource.addEventListener('complete', (e) => {
        const data = JSON.parse(e.data);
        console.log('Complete:', data);
        eventSource.close();
    });
    ```
    """
    logger.info("sse_scraping_stream_started", session_id=session_id)
    
    # Verify session exists
    session_repo = ScrapingSessionRepository(db)
    session = await session_repo.get_by_id(session_id)
    
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    
    # Connect client and get queue
    queue = await scraping_sse.connect_client(session_id)
    
    # Start monitoring task in background
    asyncio.create_task(scraping_sse.monitor_session(session_id, db))
    
    # Create and return streaming response
    return StreamingResponse(
        scraping_sse.create_event_stream(session_id, queue),
        media_type="text/event-stream",
        headers=sse_service.get_sse_headers()
    )


@router.get("/analysis/{analysis_id}")
async def stream_analysis_progress(
    analysis_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Stream real-time resume analysis progress updates via SSE.
    
    Client usage:
    ```javascript
    const eventSource = new EventSource('/api/sse/analysis/456');
    
    eventSource.addEventListener('progress', (e) => {
        const data = JSON.parse(e.data);
        updateProgressBar(data.progress);
        updateStatus(data.stage);
    });
    
    eventSource.addEventListener('result', (e) => {
        const data = JSON.parse(e.data);
        displayResults(data);
    });
    ```
    """
    logger.info("sse_analysis_stream_started", analysis_id=analysis_id)
    
    # Verify analysis exists
    resume_repo = ResumeAnalysisRepository(db)
    analysis = await resume_repo.get_by_id(analysis_id)
    
    if not analysis:
        raise HTTPException(status_code=404, detail=f"Analysis {analysis_id} not found")
    
    # Connect client and get queue
    queue = await analysis_sse.connect_client(analysis_id)
    
    # Create and return streaming response
    return StreamingResponse(
        analysis_sse.create_event_stream(analysis_id, queue),
        media_type="text/event-stream",
        headers=sse_service.get_sse_headers()
    )


# Export services for use in other modules
__all__ = [
    'router',
    'scraping_sse',
    'analysis_sse',
    'sse_service'
]

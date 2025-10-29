"""
Server-Sent Events (SSE) Service Layer

Provides reusable SSE functionality throughout the application.
This module abstracts SSE connection management, broadcasting, and event handling
into a clean, testable service layer.

Usage:
    from services.sse import sse_service, ScrapingSSEService, AnalysisSSEService
    
    # Broadcasting from any service
    await sse_service.broadcast("my_channel", "progress", {"value": 50})
    
    # Using specialized services
    scraping_sse = ScrapingSSEService()
    await scraping_sse.broadcast_progress(session_id, 75, 100)
"""

from .sse_service import SSEService, sse_service
from .scraping_sse_service import ScrapingSSEService
from .analysis_sse_service import AnalysisSSEService
from .types import SSEEvent, SSEMessage, SSEConfig

__all__ = [
    'SSEService',
    'sse_service',
    'ScrapingSSEService',
    'AnalysisSSEService',
    'SSEEvent',
    'SSEMessage',
    'SSEConfig',
]

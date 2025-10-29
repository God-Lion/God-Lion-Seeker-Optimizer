"""Services module initialization"""
from .job_scraping_service import JobScrapingService
from .integrated_scraping_service import IntegratedScrapingService

# Optional imports - only available if dependencies are installed
try:
    from .job_matching_service import JobMatchingService, MatchResult, ResumeData
    _matching_available = True
except ImportError:
    JobMatchingService = None
    MatchResult = None
    ResumeData = None
    _matching_available = False

__all__ = [
    "JobScrapingService",
    "IntegratedScrapingService",
]

if _matching_available:
    __all__.extend(["JobMatchingService", "MatchResult", "ResumeData"])

"""
Job scrapers package.
Provides async scrapers for multiple job boards with concurrent execution support.
"""

from .base_scraper import (
    BaseScraper,
    ScraperConfig,
    JobData,
    ScraperError,
    RateLimitError,
    AuthenticationError,
    ParsingError
)

from .async_linkedin_scraper import AsyncLinkedInScraper
from .async_indeed_scraper import AsyncIndeedScraper
from .enhanced_indeed_scraper import EnhancedIndeedScraper
from .hybrid_indeed_scraper import HybridIndeedScraper
from .concurrent_scraper import ConcurrentJobScraper
from .browser_manager import BrowserPool, BrowserManager
from .rate_limiter import RateLimiter, AdaptiveRateLimiter, SlidingWindowRateLimiter

__all__ = [
    # Base classes
    'BaseScraper',
    'ScraperConfig',
    'JobData',
    'ScraperError',
    'RateLimitError',
    'AuthenticationError',
    'ParsingError',
    
    # Scrapers
    'AsyncLinkedInScraper',
    'AsyncIndeedScraper',
    'EnhancedIndeedScraper',  # Enhanced version with proven Cloudflare handling
    'HybridIndeedScraper',     # NEW: Ultimate hybrid scraper combining all best features
    'ConcurrentJobScraper',
    
    # Utilities
    'BrowserPool',
    'BrowserManager',
    'RateLimiter',
    'AdaptiveRateLimiter',
    'SlidingWindowRateLimiter',
]

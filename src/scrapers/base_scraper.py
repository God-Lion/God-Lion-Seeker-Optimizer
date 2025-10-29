"""
Base scraper interface for all job scrapers.
Defines the contract that all scrapers must implement.
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from datetime import datetime


@dataclass
class ScraperConfig:
    """Configuration for scraper behavior"""
    max_concurrent: int = 5
    timeout: int = 30
    retry_attempts: int = 3
    retry_delay: float = 1.0
    headless: bool = True
    user_agent: Optional[str] = None
    proxy: Optional[str] = None


@dataclass
class JobData:
    """Structured job data from scraping"""
    job_id: str
    title: str
    company_name: str
    link: str
    location: Optional[str] = None
    description: Optional[str] = None
    description_html: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    job_type: Optional[str] = None  # Changed from employment_type to match Job model
    experience_level: Optional[str] = None
    posted_date: Optional[str] = None
    apply_link: Optional[str] = None
    company_url: Optional[str] = None
    company_industry: Optional[str] = None
    company_size: Optional[str] = None
    skills: Optional[List[str]] = None
    scraped_at: datetime = None
    
    def __post_init__(self):
        if self.scraped_at is None:
            self.scraped_at = datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for database storage"""
        return {
            'job_id': self.job_id,
            'title': self.title,
            'link': self.link,
            'place': self.location,
            'description': self.description,
            'description_html': self.description_html,
            # Add other fields as needed
        }


class BaseScraper(ABC):
    """Abstract base class for all job scrapers"""
    
    def __init__(self, config: ScraperConfig = None):
        self.config = config or ScraperConfig()
        self._setup()
    
    def _setup(self):
        """Initialize scraper resources"""
        pass
    
    @abstractmethod
    async def scrape_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        limit: Optional[int] = None,
        **kwargs
    ) -> List[JobData]:
        """
        Scrape jobs based on search criteria.
        
        Args:
            query: Search query (e.g., "Python Developer")
            location: Location filter (e.g., "Remote", "New York, NY")
            limit: Maximum number of jobs to scrape
            **kwargs: Additional scraper-specific parameters
            
        Returns:
            List of JobData objects
        """
        pass
    
    @abstractmethod
    async def scrape_job_details(self, job_url: str) -> JobData:
        """
        Scrape detailed information for a single job.
        
        Args:
            job_url: URL of the job posting
            
        Returns:
            JobData object with full details
        """
        pass
    
    @abstractmethod
    async def close(self):
        """Clean up resources"""
        pass
    
    async def __aenter__(self):
        """Context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        await self.close()


class ScraperError(Exception):
    """Base exception for scraper errors"""
    pass


class RateLimitError(ScraperError):
    """Raised when rate limit is exceeded"""
    pass


class AuthenticationError(ScraperError):
    """Raised when authentication fails"""
    pass


class ParsingError(ScraperError):
    """Raised when parsing job data fails"""
    pass

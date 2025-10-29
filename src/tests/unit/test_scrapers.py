"""Unit tests for scrapers module"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
import asyncio

from src.scrapers.base_scraper import (
    BaseScraper, ScraperConfig, JobData, 
    ScraperError, RateLimitError, AuthenticationError, ParsingError
)
from src.scrapers.rate_limiter import RateLimiter


class TestScraperConfig:
    """Test ScraperConfig dataclass"""
    
    def test_config_creation_default(self):
        """Test creating config with default values"""
        config = ScraperConfig()
        
        assert config.max_concurrent == 5
        assert config.timeout == 30
        assert config.retry_attempts == 3
        assert config.headless is True
    
    def test_config_creation_custom(self):
        """Test creating config with custom values"""
        config = ScraperConfig(
            max_concurrent=10,
            timeout=60,
            retry_attempts=5,
            headless=False,
            user_agent="Custom Agent"
        )
        
        assert config.max_concurrent == 10
        assert config.timeout == 60
        assert config.retry_attempts == 5
        assert config.headless is False
        assert config.user_agent == "Custom Agent"


class TestJobData:
    """Test JobData dataclass"""
    
    def test_job_data_creation_minimal(self):
        """Test creating job data with minimal fields"""
        job = JobData(
            job_id="12345",
            title="Python Developer",
            company_name="Tech Corp",
            link="https://example.com/job/12345"
        )
        
        assert job.job_id == "12345"
        assert job.title == "Python Developer"
        assert job.company_name == "Tech Corp"
        assert job.link == "https://example.com/job/12345"
        assert job.scraped_at is not None
    
    def test_job_data_creation_full(self):
        """Test creating job data with all fields"""
        job = JobData(
            job_id="12345",
            title="Senior Python Developer",
            company_name="Tech Corp",
            link="https://example.com/job/12345",
            location="Remote",
            description="Build amazing Python applications",
            salary_min=100000,
            salary_max=150000,
            job_type="Full-time",
            experience_level="Senior",
            posted_date="2024-01-15",
            skills=["Python", "Django", "Docker"]
        )
        
        assert job.location == "Remote"
        assert job.salary_min == 100000
        assert job.salary_max == 150000
        assert job.job_type == "Full-time"
        assert len(job.skills) == 3
    
    def test_job_data_to_dict(self):
        """Test converting job data to dictionary"""
        job = JobData(
            job_id="12345",
            title="Python Developer",
            company_name="Tech Corp",
            link="https://example.com/job/12345",
            location="Remote"
        )
        
        job_dict = job.to_dict()
        
        assert isinstance(job_dict, dict)
        assert job_dict["job_id"] == "12345"
        assert job_dict["title"] == "Python Developer"
        assert job_dict["place"] == "Remote"
    
    def test_job_data_scraped_at_auto_set(self):
        """Test that scraped_at is automatically set"""
        before = datetime.utcnow()
        job = JobData(
            job_id="12345",
            title="Python Developer",
            company_name="Tech Corp",
            link="https://example.com/job/12345"
        )
        after = datetime.utcnow()
        
        assert job.scraped_at is not None
        assert before <= job.scraped_at <= after


class TestBaseScraper:
    """Test BaseScraper abstract class"""
    
    def test_scraper_config_initialization(self):
        """Test scraper initializes with config"""
        # Create a concrete implementation for testing
        class ConcreteScraper(BaseScraper):
            async def scrape_jobs(self, query, location=None, limit=None, **kwargs):
                return []
            
            async def scrape_job_details(self, job_url):
                return JobData(
                    job_id="1",
                    title="Test",
                    company_name="Test",
                    link=job_url
                )
            
            async def close(self):
                pass
        
        config = ScraperConfig(max_concurrent=10)
        scraper = ConcreteScraper(config)
        
        assert scraper.config.max_concurrent == 10
    
    def test_scraper_default_config(self):
        """Test scraper uses default config if none provided"""
        class ConcreteScraper(BaseScraper):
            async def scrape_jobs(self, query, location=None, limit=None, **kwargs):
                return []
            
            async def scrape_job_details(self, job_url):
                return JobData(
                    job_id="1",
                    title="Test",
                    company_name="Test",
                    link=job_url
                )
            
            async def close(self):
                pass
        
        scraper = ConcreteScraper()
        
        assert scraper.config is not None
        assert scraper.config.max_concurrent == 5
    
    @pytest.mark.asyncio
    async def test_scraper_context_manager(self):
        """Test scraper works as async context manager"""
        class ConcreteScraper(BaseScraper):
            def __init__(self):
                super().__init__()
                self.closed = False
            
            async def scrape_jobs(self, query, location=None, limit=None, **kwargs):
                return []
            
            async def scrape_job_details(self, job_url):
                return JobData(
                    job_id="1",
                    title="Test",
                    company_name="Test",
                    link=job_url
                )
            
            async def close(self):
                self.closed = True
        
        async with ConcreteScraper() as scraper:
            assert scraper.closed is False
        
        assert scraper.closed is True


class TestScraperExceptions:
    """Test scraper exception classes"""
    
    def test_scraper_error(self):
        """Test ScraperError exception"""
        error = ScraperError("Test error")
        assert str(error) == "Test error"
        assert isinstance(error, Exception)
    
    def test_rate_limit_error(self):
        """Test RateLimitError exception"""
        error = RateLimitError("Rate limit exceeded")
        assert str(error) == "Rate limit exceeded"
        assert isinstance(error, ScraperError)
    
    def test_authentication_error(self):
        """Test AuthenticationError exception"""
        error = AuthenticationError("Authentication failed")
        assert str(error) == "Authentication failed"
        assert isinstance(error, ScraperError)
    
    def test_parsing_error(self):
        """Test ParsingError exception"""
        error = ParsingError("Failed to parse job data")
        assert str(error) == "Failed to parse job data"
        assert isinstance(error, ScraperError)


class TestRateLimiter:
    """Test RateLimiter"""
    
    def test_rate_limiter_initialization(self):
        """Test rate limiter initialization"""
        limiter = RateLimiter(rate=10, capacity=20, time_period=1.0)
        
        assert limiter.rate == 10
        assert limiter.capacity == 20
        assert limiter.time_period == 1.0
    
    def test_rate_limiter_default_capacity(self):
        """Test rate limiter uses rate as default capacity"""
        limiter = RateLimiter(rate=10)
        
        assert limiter.capacity == 10
    
    @pytest.mark.asyncio
    async def test_rate_limiter_acquire_single(self):
        """Test acquiring a single token"""
        limiter = RateLimiter(rate=100, capacity=100)
        
        # Should acquire immediately
        await limiter.acquire(1)
        assert limiter._total_requests == 1
    
    @pytest.mark.asyncio
    async def test_rate_limiter_acquire_multiple(self):
        """Test acquiring multiple tokens"""
        limiter = RateLimiter(rate=100, capacity=100)
        
        await limiter.acquire(5)
        assert limiter._total_requests == 1
        assert limiter._tokens < 100
    
    @pytest.mark.asyncio
    async def test_rate_limiter_burst(self):
        """Test burst capacity"""
        limiter = RateLimiter(rate=10, capacity=10)
        
        # Should be able to acquire up to capacity immediately
        await limiter.acquire(5)
        await limiter.acquire(5)
        
        assert limiter._total_requests == 2
    
    @pytest.mark.asyncio
    async def test_rate_limiter_wait(self):
        """Test rate limiter waits when tokens exhausted"""
        limiter = RateLimiter(rate=10, capacity=5)
        
        # Exhaust tokens
        await limiter.acquire(5)
        
        # Next acquire should wait
        start = asyncio.get_event_loop().time()
        await limiter.acquire(1)
        elapsed = asyncio.get_event_loop().time() - start
        
        # Should have waited some time
        assert elapsed > 0
    
    @pytest.mark.asyncio
    async def test_rate_limiter_statistics(self):
        """Test rate limiter tracks statistics"""
        limiter = RateLimiter(rate=100, capacity=100)
        
        await limiter.acquire(1)
        await limiter.acquire(1)
        await limiter.acquire(1)
        
        assert limiter._total_requests == 3
    
    def test_rate_limiter_get_stats(self):
        """Test getting rate limiter statistics"""
        limiter = RateLimiter(rate=10, capacity=10)
        
        stats = limiter.get_stats()
        
        assert "total_requests" in stats
        assert "total_wait_time" in stats
        assert stats["total_requests"] == 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

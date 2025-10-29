"""
Performance tests for async scraping functionality.
Tests concurrent scraping, rate limiting, and overall performance.
"""
import pytest
import asyncio
import time
from unittest.mock import Mock, AsyncMock, patch

from src.scrapers.async_linkedin_scraper import AsyncLinkedInScraper, ScraperConfig, JobData
from src.scrapers.browser_manager import BrowserPool
from src.scrapers.rate_limiter import RateLimiter, AdaptiveRateLimiter


@pytest.mark.asyncio
class TestAsyncScraperPerformance:
    """Performance tests for async scraper"""
    
    async def test_concurrent_scraping_faster_than_sequential(self):
        """Test that concurrent scraping is significantly faster"""
        
        # Mock scraper to avoid actual network calls
        config = ScraperConfig(max_concurrent=5, timeout=10)
        scraper = AsyncLinkedInScraper(config)
        
        # Mock the actual scraping method
        async def mock_scrape_job(url):
            await asyncio.sleep(0.1)  # Simulate network delay
            return JobData(
                job_id=url.split('/')[-1],
                title="Test Job",
                company_name="Test Company",
                link=url
            )
        
        scraper.scrape_job_details = mock_scrape_job
        
        # Test with 10 jobs
        job_urls = [f"https://linkedin.com/jobs/{i}" for i in range(10)]
        
        # Time concurrent scraping
        start = time.time()
        results = await scraper._scrape_jobs_concurrent(job_urls)
        concurrent_duration = time.time() - start
        
        # Sequential would take: 10 jobs * 0.1s = 1.0s
        # Concurrent with 5 workers should take: ~0.2s
        assert concurrent_duration < 0.5, f"Concurrent took {concurrent_duration}s, expected < 0.5s"
        assert len(results) == 10
        
        print(f"\n✅ Concurrent scraping: {concurrent_duration:.2f}s")
        print(f"   Expected sequential: ~1.0s")
        print(f"   Speedup: {1.0 / concurrent_duration:.1f}x")
    
    async def test_rate_limiter_enforces_limit(self):
        """Test that rate limiter properly enforces rate limits"""
        rate_limiter = RateLimiter(rate=10.0, time_period=1.0)  # 10 per second
        
        # Make 15 requests
        start = time.time()
        for _ in range(15):
            await rate_limiter.acquire()
        duration = time.time() - start
        
        # Should take at least 0.3 seconds (with burst handling)
        assert duration >= 0.3, f"Rate limiter didn't slow down requests: {duration}s"
        
        stats = rate_limiter.get_stats()
        assert stats['total_requests'] == 15
        
        print(f"\n✅ Rate limiter stats:")
        print(f"   Total requests: {stats['total_requests']}")
        print(f"   Total wait time: {stats['total_wait_time']:.3f}s")
        print(f"   Avg wait time: {stats['avg_wait_time']:.3f}s")
    
    async def test_adaptive_rate_limiter_adjusts(self):
        """Test adaptive rate limiter adjusts to failures"""
        limiter = AdaptiveRateLimiter(
            initial_rate=10.0,
            min_rate=1.0,
            max_rate=20.0,
            increase_factor=1.5,
            decrease_factor=0.5
        )
        
        initial_rate = limiter.current_rate
        
        # Report failure - should decrease rate
        await limiter.report_failure()
        assert limiter.current_rate < initial_rate
        
        # Report many successes - should increase rate
        for _ in range(10):
            await limiter.report_success()
        
        assert limiter.current_rate > limiter.min_rate
        
        stats = limiter.get_stats()
        print(f"\n✅ Adaptive rate limiter:")
        print(f"   Current rate: {stats['current_rate']:.2f}")
        print(f"   Success rate: {stats['success_rate']:.2%}")


@pytest.mark.asyncio
class TestScraperErrorHandling:
    """Test error handling and retry logic"""
    
    async def test_retry_on_failure(self):
        """Test that scraper retries failed requests"""
        config = ScraperConfig(max_concurrent=2, retry_attempts=3, retry_delay=0.1)
        scraper = AsyncLinkedInScraper(config)
        
        attempt_count = 0
        async def mock_scrape_that_fails_twice(url):
            nonlocal attempt_count
            attempt_count += 1
            if attempt_count < 3:
                raise Exception("Temporary failure")
            return JobData(
                job_id="123",
                title="Success",
                company_name="Company",
                link=url
            )
        
        scraper.scrape_job_details = mock_scrape_that_fails_twice
        
        # Should succeed after retries
        result = await scraper._scrape_job_with_retry("https://test.com")
        
        assert result is not None
        assert attempt_count == 3
        print(f"\n✅ Retry logic: succeeded after {attempt_count} attempts")
    
    async def test_gives_up_after_max_retries(self):
        """Test that scraper gives up after max retries"""
        config = ScraperConfig(max_concurrent=2, retry_attempts=2, retry_delay=0.1)
        scraper = AsyncLinkedInScraper(config)
        
        attempt_count = 0
        async def mock_scrape_always_fails(url):
            nonlocal attempt_count
            attempt_count += 1
            raise Exception("Permanent failure")
        
        scraper.scrape_job_details = mock_scrape_always_fails
        
        result = await scraper._scrape_job_with_retry("https://test.com")
        
        assert result is None
        assert attempt_count == 3  # Initial + 2 retries
        print(f"\n✅ Max retries: gave up after {attempt_count} attempts")


if __name__ == "__main__":
    # Run performance tests
    pytest.main([__file__, "-v", "-s"])

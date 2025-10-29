"""
Test cases for the HybridIndeedScraper
"""
import pytest
import asyncio
from src.scrapers.hybrid_indeed_scraper import HybridIndeedScraper, ScraperConfig

@pytest.mark.asyncio
async def test_basic_job_search():
    # Create a basic configuration
    config = ScraperConfig(
        max_concurrent=2,  # Number of concurrent browser instances
        headless=False,    # Set to True for production
        timeout=30,        # Timeout in seconds
        retry_attempts=3,  # Number of retry attempts
        retry_delay=2      # Delay between retries in seconds
    )
    
    # Initialize the scraper
    scraper = HybridIndeedScraper(config=config)
    
    try:
        # Search parameters
        query = "python developer"
        location = "remote"
        limit = 5  # Limit to 5 jobs for testing
        
        # Optional filters
        filters = {
            "date_posted": "7",     # Last 7 days
            "job_type": "fulltime"  # Full-time jobs
        }
        
        # Perform the search
        jobs = await scraper.scrape_jobs(
            query=query,
            location=location,
            limit=limit,
            filters=filters
        )
        
        # Verify the results
        assert jobs is not None
        assert len(jobs) <= limit
        
        # Check job data structure
        for job in jobs:
            assert job.job_id is not None
            assert job.title is not None
            assert job.company_name is not None
            assert job.link is not None
            assert job.description is not None
            
            # Print job details
            print(f"\nFound job:")
            print(f"Title: {job.title}")
            print(f"Company: {job.company_name}")
            print(f"Location: {job.location}")
            print(f"Link: {job.link}")
            print("-" * 50)
        
        # Get scraper statistics
        stats = scraper.get_stats()
        print("\nScraper Statistics:")
        print(f"Jobs scraped: {stats['jobs_scraped']}")
        print(f"Errors: {stats['errors']}")
        print(f"Bot detections: {stats['bot_detections']}")
        
    finally:
        # Clean up resources
        await scraper.close()

@pytest.mark.asyncio
async def test_scraper_with_proxy():
    # Example with proxy configuration
    proxy_list = [
        "proxy1.example.com:8080",
        "proxy2.example.com:8080"
    ]
    
    config = ScraperConfig(
        max_concurrent=1,
        headless=True,
        timeout=30
    )
    
    scraper = HybridIndeedScraper(
        config=config,
        proxy_list=proxy_list
    )
    
    try:
        jobs = await scraper.scrape_jobs(
            query="software engineer",
            location="New York",
            limit=3
        )
        
        assert jobs is not None
        
        # Check proxy rotation stats
        if scraper.proxy_rotator:
            proxy_stats = scraper.proxy_rotator.get_stats()
            print("\nProxy Statistics:")
            print(f"Total proxies: {proxy_stats['total_proxies']}")
            print(f"Failed proxies: {proxy_stats['failed_proxies']}")
            
    finally:
        await scraper.close()

# Example of how to run the tests
if __name__ == "__main__":
    asyncio.run(test_basic_job_search())
    # Uncomment to test with proxies:
    # asyncio.run(test_scraper_with_proxy())
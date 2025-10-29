"""
Async LinkedIn scraper with concurrent job scraping.
Implements high-performance scraping with rate limiting and browser pooling.
"""
import asyncio
from typing import List, Optional, Dict, Any
from urllib.parse import urlencode, urlparse, parse_qs
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout
import structlog
from datetime import datetime
import re
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from .base_scraper import (
    BaseScraper, 
    ScraperConfig, 
    JobData, 
    RateLimitError,
    ParsingError
)
from .browser_manager import BrowserPool
from .rate_limiter import AdaptiveRateLimiter
from .linkedin_auth import LinkedInAuthManager

logger = structlog.get_logger(__name__)


class AsyncLinkedInScraper(BaseScraper):
    """
    High-performance async LinkedIn job scraper with authentication.
    Features:
    - Concurrent scraping with semaphore control
    - Browser connection pooling
    - Adaptive rate limiting
    - Retry logic with exponential backoff
    - LinkedIn authentication support
    - Detailed error handling
    """
    
    BASE_URL = "https://www.linkedin.com/jobs/search"
    
    def __init__(
        self,
        config: ScraperConfig = None,
        linkedin_email: Optional[str] = None,
        linkedin_password: Optional[str] = None,
        auth_storage_dir: str = ".auth"
    ):
        self.browser_pool: Optional[BrowserPool] = None
        self.rate_limiter: Optional[AdaptiveRateLimiter] = None
        self.auth_manager: Optional[LinkedInAuthManager] = None
        self.is_authenticated: bool = False
        self.linkedin_email = linkedin_email
        self.linkedin_password = linkedin_password
        self.auth_storage_dir = auth_storage_dir
        self._stats = {
            'jobs_scraped': 0,
            'errors': 0,
            'rate_limit_hits': 0
        }
        super().__init__(config)
    
    def _setup(self):
        """Initialize scraper resources"""
        logger.info(
            "initializing_linkedin_scraper",
            max_concurrent=self.config.max_concurrent,
            auth_enabled=bool(self.linkedin_email or os.getenv('LINKEDIN_EMAIL'))
        )
        
        # Initialize authentication manager
        self.auth_manager = LinkedInAuthManager(
            storage_dir=self.auth_storage_dir
        )
        
        # Initialize browser pool
        self.browser_pool = BrowserPool(
            pool_size=self.config.max_concurrent,
            headless=self.config.headless,
            user_agent=self.config.user_agent,
            proxy={'server': self.config.proxy} if self.config.proxy else None
        )
        
        # Initialize adaptive rate limiter (start conservative)
        self.rate_limiter = AdaptiveRateLimiter(
            initial_rate=2.0,  # 2 requests per second initially
            min_rate=0.5,
            max_rate=10.0
        )
    
    async def scrape_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        limit: Optional[int] = 100,
        filters: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> List[JobData]:
        """
        Scrape jobs from LinkedIn with concurrent processing.
        
        Args:
            query: Job search query
            location: Location filter
            limit: Maximum jobs to scrape
            filters: Additional filters (experience_level, job_type, etc.)
            
        Returns:
            List of JobData objects
        """
        logger.info(
            "starting_job_scrape",
            query=query,
            location=location,
            limit=limit
        )
        
        # Ensure browser pool is initialized
        if self.browser_pool is None:
            raise RuntimeError("Browser pool not initialized. _setup() may have failed.")
        
        if not self.browser_pool._initialized:
            await self.browser_pool.initialize()
        
        # Setup authentication
        await self._setup_authentication()
        
        # Warn if not authenticated
        if not self.is_authenticated:
            logger.warning(
                "scraping_without_authentication",
                message="LinkedIn authentication not configured. Results may be limited. "
                        "Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD environment variables or "
                        "pass credentials to constructor."
            )
        
        # Step 1: Get job listing URLs
        job_urls = await self._get_job_listings(query, location, limit, filters)
        logger.info("job_listings_found", count=len(job_urls))
        
        # Step 2: Scrape job details concurrently
        jobs = await self._scrape_jobs_concurrent(job_urls)
        
        self._stats['jobs_scraped'] += len(jobs)
        logger.info(
            "scrape_completed",
            jobs_scraped=len(jobs),
            total_stats=self._stats
        )
        
        return jobs
    
    async def _setup_authentication(self):
        """Setup LinkedIn authentication"""
        try:
            # Get credentials
            email = self.linkedin_email or os.getenv('LINKEDIN_EMAIL')
            password = self.linkedin_password or os.getenv('LINKEDIN_PASSWORD')
            
            if not email or not password:
                logger.info(
                    "no_credentials_provided",
                    message="Continuing without authentication. "
                            "Set LINKEDIN_EMAIL and LINKEDIN_PASSWORD to enable auth."
                )
                self.is_authenticated = False
                return
            
            logger.info("setting_up_authentication")
            
            # Try to load saved session first
            async with self.browser_pool.get_page() as page:
                # Add cookies if available
                cookies = self.auth_manager.load_cookies()
                if cookies:
                    await page.context.add_cookies(cookies)
                    logger.info("loaded_saved_cookies", count=len(cookies))
                
                # Check if authenticated
                self.is_authenticated = await self.auth_manager.is_authenticated(page)
                
                if not self.is_authenticated:
                    logger.info("saved_session_invalid_attempting_login")
                    
                    # Attempt login
                    self.is_authenticated = await self.auth_manager.authenticate_with_credentials(
                        page,
                        email,
                        password,
                        save_session=True
                    )
                
                if self.is_authenticated:
                    logger.info("authentication_successful")
                else:
                    logger.error("authentication_failed")
                    
        except Exception as e:
            logger.error("authentication_setup_failed", error=str(e))
            self.is_authenticated = False
    
    async def _get_job_listings(
        self,
        query: str,
        location: Optional[str],
        limit: int,
        filters: Optional[Dict[str, Any]]
    ) -> List[str]:
        """Get job listing URLs from search results"""
        job_urls = []
        start = 0
        page_size = 25  # LinkedIn shows 25 jobs per page
        
        while len(job_urls) < limit:
            try:
                # Rate limit
                await self.rate_limiter.acquire()
                
                # Build search URL
                search_url = self._build_search_url(
                    query, location, start, filters
                )
                
                logger.debug(
                    "fetching_job_listings",
                    start=start,
                    url=search_url
                )
                
                # Fetch page
                async with self.browser_pool.get_page() as page:
                    urls = await self._extract_job_urls_from_page(page, search_url)
                    
                    if not urls:
                        logger.info("no_more_jobs_found", start=start)
                        break
                    
                    job_urls.extend(urls)
                    logger.debug("extracted_urls", count=len(urls))
                
                await self.rate_limiter.report_success()
                
                # Move to next page
                start += page_size
                
                # Add delay between pages
                await asyncio.sleep(1.0)
                
            except Exception as e:
                logger.error(
                    "job_listing_fetch_failed",
                    start=start,
                    error=str(e)
                )
                await self.rate_limiter.report_failure()
                self._stats['errors'] += 1
                break
        
        return job_urls[:limit]
    
    def _build_search_url(
        self,
        query: str,
        location: Optional[str],
        start: int,
        filters: Optional[Dict[str, Any]]
    ) -> str:
        """Build LinkedIn job search URL with filters"""
        params = {
            'keywords': query,
            'start': start
        }
        
        if location:
            params['location'] = location
        
        # Add filters if provided
        if filters:
            # Experience level: 1=Internship, 2=Entry, 3=Associate, 4=Mid-Senior, 5=Director, 6=Executive
            if 'experience_level' in filters:
                params['f_E'] = filters['experience_level']
            
            # Job type: F=Full-time, P=Part-time, C=Contract, T=Temporary, I=Internship
            if 'job_type' in filters:
                params['f_JT'] = filters['job_type']
            
            # Remote: 1=On-site, 2=Remote, 3=Hybrid
            if 'remote' in filters:
                params['f_WT'] = filters['remote']
            
            # Date posted: r86400=Past 24h, r604800=Past week, r2592000=Past month
            if 'date_posted' in filters:
                params['f_TPR'] = filters['date_posted']
        
        query_string = urlencode(params)
        return f"{self.BASE_URL}?{query_string}"
    
    async def _extract_job_urls_from_page(
        self,
        page: Page,
        url: str
    ) -> List[str]:
        """Extract job URLs from a search results page"""
        try:
            # Navigate to page with networkidle to ensure content is loaded
            try:
                await page.goto(url, wait_until="networkidle", timeout=45000)
            except PlaywrightTimeout:
                # Fallback to domcontentloaded if networkidle times out
                logger.debug("networkidle_timeout_using_domcontentloaded")
                await page.goto(url, wait_until="domcontentloaded", timeout=30000)
            
            # Add delay for JavaScript to execute and render content
            await asyncio.sleep(3.0)  # Increased to 3 seconds
            
            # Wait for job listings to load - LinkedIn uses dynamic class names
            # Try multiple selectors in order of specificity with shorter timeout
            selectors_to_try = [
                'ul.jobs-search__results-list',  # Most common list container
                'ul[class*="jobs-search"]',  # Any ul with jobs-search in class
                'div.jobs-search-results-list',  # Alternative container
                'div[class*="jobs-search-results"]',  # Flexible div container
                'li.jobs-search-results__list-item',  # Individual job items
                'div.job-card-container',  # Job card container
                'a[href*="/jobs/view/"]',  # Any job link as last resort
            ]
            
            selector_found = None
            for selector in selectors_to_try:
                try:
                    # Reduce timeout to 5 seconds per selector to fail faster
                    await page.wait_for_selector(
                        selector,
                        timeout=5000,
                        state='attached'  # Just check if exists, don't need visible
                    )
                    selector_found = selector
                    logger.debug("found_jobs_with_selector", selector=selector)
                    break
                except Exception as e:
                    logger.debug("selector_not_found", selector=selector)
                    continue
            
            if not selector_found:
                # Take a screenshot for debugging
                try:
                    screenshot_path = f"debug_screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                    await page.screenshot(path=screenshot_path)
                    logger.warning("no_job_selectors_found", url=url, screenshot=screenshot_path)
                except:
                    logger.warning("no_job_selectors_found", url=url)
                return []
            
            # Extract job card links using multiple methods
            job_links = []
            
            # Method 1: Direct job view links (most reliable)
            logger.debug("attempting_link_extraction", method="direct_job_view_links")
            try:
                links_1 = await page.query_selector_all('a[href*="/jobs/view/"]')
                logger.debug("link_extraction_result", method="method_1", count=len(links_1))
                for link in links_1:
                    href = await link.get_attribute('href')
                    if href and '/jobs/view/' in href:
                        job_links.append(href)
            except Exception as e:
                logger.debug("method_1_failed", error=str(e))
            
            # If we have links, skip other methods
            if not job_links:
                # Method 2: Any links containing "jobs"
                logger.debug("attempting_link_extraction", method="any_job_links")
                try:
                    links_2 = await page.query_selector_all('a[href*="/jobs/"]')
                    logger.debug("link_extraction_result", method="method_2", count=len(links_2))
                    for link in links_2:
                        href = await link.get_attribute('href')
                        if href and '/jobs/' in href:
                            job_links.append(href)
                except Exception as e:
                    logger.debug("method_2_failed", error=str(e))
            
            logger.debug("total_links_found", count=len(job_links))
            
            # Debug: Log first few links to see their format
            if job_links:
                sample_links = job_links[:5]  # Show more samples
                for i, link in enumerate(sample_links):
                    logger.debug("sample_link", index=i, link=link)
            
            # If still no links, take a screenshot for debugging
            if not job_links:
                try:
                    screenshot_path = f"debug_no_links_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                    await page.screenshot(path=screenshot_path, full_page=True)
                    
                    # Also save the HTML for inspection
                    html_path = f"debug_page_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
                    html_content = await page.content()
                    with open(html_path, 'w', encoding='utf-8') as f:
                        f.write(html_content)
                    
                    logger.warning(
                        "no_links_found_debug_saved",
                        screenshot=screenshot_path,
                        html=html_path,
                        selector_found=selector_found
                    )
                except Exception as e:
                    logger.warning("no_links_found", error=str(e))
            
            # Clean and deduplicate URLs  
            job_urls = []
            seen_ids = set()
            
            for link in job_links:
                try:
                    # Handle both absolute and relative URLs
                    if link.startswith('http'):
                        # Absolute URL - extract job ID
                        # Try multiple patterns:
                        # 1. /jobs/view/JOBID
                        # 2. /jobs/collections/.../JOBID
                        # 3. Any URL with currentJobId=JOBID parameter
                        
                        # First try direct /view/ pattern
                        # LinkedIn URLs can be: /jobs/view/JOBID or /jobs/view/job-title-slug-JOBID
                        match = re.search(r'/jobs/view/(?:[^/]*-)?(\d+)', link)
                        if not match:
                            # Try collections pattern
                            match = re.search(r'/jobs/collections/[^/]+/(\d+)', link)
                        if not match:
                            # Try query parameter
                            match = re.search(r'currentJobId=(\d+)', link)
                        if not match:
                            # Try flexible pattern - any jobs-related path with digits
                            match = re.search(r'/jobs[^/]*/(?:api/)?(?:jobPosting/)?(\d+)', link)
                        
                        if match:
                            job_id = match.group(1)
                            if job_id not in seen_ids:
                                clean_url = f"https://www.linkedin.com/jobs/view/{job_id}"
                                job_urls.append(clean_url)
                                seen_ids.add(job_id)
                                logger.debug("extracted_job_id", job_id=job_id, original=link[:100])
                    
                    elif link.startswith('/jobs/'):
                        # Relative URL
                        match = re.search(r'/jobs/view/(?:[^/]*-)?(\d+)', link)
                        if not match:
                            match = re.search(r'/jobs/collections/[^/]+/(\d+)', link)
                        if not match:
                            match = re.search(r'currentJobId=(\d+)', link)
                        if not match:
                            # Try flexible pattern
                            match = re.search(r'/jobs[^/]*/(?:api/)?(?:jobPosting/)?(\d+)', link)
                        
                        if match:
                            job_id = match.group(1)
                            if job_id not in seen_ids:
                                clean_url = f"https://www.linkedin.com/jobs/view/{job_id}"
                                job_urls.append(clean_url)
                                seen_ids.add(job_id)
                                logger.debug("extracted_job_id", job_id=job_id, original=link[:100])
                except Exception as e:
                    logger.debug("failed_to_parse_link", link=link[:100], error=str(e))
                    continue
            
            logger.debug("cleaned_job_urls", count=len(job_urls), seen_ids=len(seen_ids))
            
            return job_urls
            
        except PlaywrightTimeout:
            logger.warning("page_load_timeout", url=url)
            return []
        except Exception as e:
            logger.error("url_extraction_failed", url=url, error=str(e))
            return []
    
    async def _scrape_jobs_concurrent(
        self,
        job_urls: List[str]
    ) -> List[JobData]:
        """Scrape job details concurrently"""
        tasks = [
            self._scrape_job_with_retry(url)
            for url in job_urls
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Filter out errors and None values
        jobs = [
            job for job in results
            if isinstance(job, JobData)
        ]
        
        return jobs
    
    async def _scrape_job_with_retry(
        self,
        job_url: str,
        attempt: int = 0
    ) -> Optional[JobData]:
        """Scrape job with retry logic"""
        try:
            return await self.scrape_job_details(job_url)
        except Exception as e:
            if attempt < self.config.retry_attempts:
                logger.warning(
                    "job_scrape_retry",
                    url=job_url,
                    attempt=attempt + 1,
                    error=str(e)
                )
                delay = self.config.retry_delay * (2 ** attempt)  # Exponential backoff
                await asyncio.sleep(delay)
                return await self._scrape_job_with_retry(job_url, attempt + 1)
            else:
                logger.error(
                    "job_scrape_failed",
                    url=job_url,
                    error=str(e)
                )
                self._stats['errors'] += 1
                return None
    
    async def scrape_job_details(self, job_url: str) -> JobData:
        """
        Scrape detailed information for a single job.
        
        Args:
            job_url: URL of job posting
            
        Returns:
            JobData object with complete job information
        """
        # Rate limit
        await self.rate_limiter.acquire()
        
        async with self.browser_pool.get_page() as page:
            try:
                # Navigate to job page
                await page.goto(
                    job_url,
                    wait_until="domcontentloaded",
                    timeout=self.config.timeout * 1000
                )
                
                # Wait for main content
                await page.wait_for_selector(
                    '.top-card-layout__entity-info',
                    timeout=10000,
                    state='visible'
                )
                
                # Extract job data
                job_data = await self._parse_job_page(page, job_url)
                
                await self.rate_limiter.report_success()
                return job_data
                
            except PlaywrightTimeout:
                logger.warning("job_page_timeout", url=job_url)
                raise
            except Exception as e:
                logger.error("job_scrape_error", url=job_url, error=str(e))
                await self.rate_limiter.report_failure()
                raise
    
    async def _parse_job_page(self, page: Page, job_url: str) -> JobData:
        """Parse job information from page"""
        try:
            # Extract job ID from URL
            job_id_match = re.search(r'/jobs/view/(\d+)', job_url)
            job_id = job_id_match.group(1) if job_id_match else job_url
            
            # Title
            title = await page.locator('.top-card-layout__title').text_content()
            title = title.strip() if title else "Unknown"
            
            # Company
            company_name = await page.locator('.top-card-layout__card a.topcard__org-name-link').text_content()
            company_name = company_name.strip() if company_name else "Unknown"
            
            # Location - use more specific selector to avoid strict mode violation
            # The .topcard__flavor--bullet class matches multiple elements, so we need to be more specific
            location = None
            try:
                # Try to get location from the span with topcard__flavor--bullet class
                # Use nth-child or more specific parent selector
                location_elem = await page.locator('span.topcard__flavor--bullet').first.text_content()
                location = location_elem.strip() if location_elem else None
            except:
                try:
                    # Fallback: look for location in top card
                    location_elem = await page.locator('.topcard__flavor-row span').first.text_content()
                    location = location_elem.strip() if location_elem else None
                except:
                    # Another fallback
                    try:
                        location_elem = await page.locator('[data-test-id="job-location"]').text_content()
                        location = location_elem.strip() if location_elem else None
                    except:
                        location = None
            
            # Description
            try:
                await page.click('button[data-tracking-control-name="public_jobs_show-more-html-btn"]', timeout=5000)
                await asyncio.sleep(0.5)
            except:
                pass  # Show more button might not exist
            
            description_html = await page.locator('.show-more-less-html__markup').inner_html()
            description = await page.locator('.show-more-less-html__markup').text_content()
            description = description.strip() if description else None
            
            # Job criteria
            criteria = {}
            try:
                criteria_items = await page.locator('.description__job-criteria-item').all()
                for item in criteria_items:
                    label = await item.locator('.description__job-criteria-subheader').text_content()
                    value = await item.locator('.description__job-criteria-text').text_content()
                    if label and value:
                        criteria[label.strip()] = value.strip()
            except:
                pass
            
            # Extract employment type and experience level
            employment_type = criteria.get('Employment type')
            experience_level = criteria.get('Seniority level')
            
            # Company URL
            try:
                company_url = await page.locator('.top-card-layout__card a.topcard__org-name-link').get_attribute('href')
            except:
                company_url = None
            
            # Create JobData object
            job_data = JobData(
                job_id=job_id,
                title=title,
                company_name=company_name,
                link=job_url,
                location=location,
                description=description,
                description_html=description_html,
                job_type=employment_type,  # Changed from employment_type
                experience_level=experience_level,
                company_url=company_url,
                scraped_at=datetime.utcnow()
            )
            
            logger.debug("job_parsed", job_id=job_id, title=title)
            return job_data
            
        except Exception as e:
            logger.error("job_parsing_failed", url=job_url, error=str(e))
            raise ParsingError(f"Failed to parse job page: {str(e)}")
    
    async def close(self):
        """Clean up resources"""
        if self.browser_pool:
            await self.browser_pool.close()
        
        # Log final stats
        logger.info(
            "scraper_closed",
            stats=self._stats,
            rate_limiter_stats=self.rate_limiter.get_stats() if self.rate_limiter else {}
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get scraping statistics"""
        stats = self._stats.copy()
        if self.rate_limiter:
            stats['rate_limiter'] = self.rate_limiter.get_stats()
        return stats


# Example usage
async def main():
    """Example usage of AsyncLinkedInScraper"""
    
    # Configure scraper
    config = ScraperConfig(
        max_concurrent=5,  # 5 concurrent browsers
        timeout=30,
        retry_attempts=3,
        headless=True
    )
    
    # Create scraper
    async with AsyncLinkedInScraper(config) as scraper:
        # Scrape jobs
        jobs = await scraper.scrape_jobs(
            query="Python Developer",
            location="Remote",
            limit=50,
            filters={
                'experience_level': '2,3',  # Entry and Associate
                'job_type': 'F',  # Full-time
                'remote': '2'  # Remote
            }
        )
        
        # Print results
        print(f"\n✅ Scraped {len(jobs)} jobs")
        for job in jobs[:5]:
            print(f"\n📋 {job.title}")
            print(f"   🏢 {job.company_name}")
            print(f"   📍 {job.location}")
            print(f"   🔗 {job.link}")
        
        # Print stats
        stats = scraper.get_stats()
        print(f"\n📊 Statistics:")
        print(f"   Jobs scraped: {stats['jobs_scraped']}")
        print(f"   Errors: {stats['errors']}")
        print(f"   Rate limit hits: {stats['rate_limit_hits']}")


if __name__ == "__main__":
    asyncio.run(main())

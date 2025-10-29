import asyncio
from typing import List, Optional, Dict, Any
from urllib.parse import urlencode, quote_plus
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout
import structlog
from datetime import datetime
import re
import os
import random
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
from src.auth import GoogleSSOAuthenticator, GoogleSSOConfig

logger = structlog.get_logger(__name__)


class AsyncIndeedScraper(BaseScraper):
    """
    High-performance async Indeed job scraper.
    Features:
    - Concurrent scraping with semaphore control
    - Browser connection pooling
    - Adaptive rate limiting
    - Retry logic with exponential backoff
    - Detailed error handling
    - Google SSO authentication support
    
    Note: Indeed does not require authentication for basic scraping,
    but authenticated users may see more results and features.
    """
    
    BASE_URL = "https://www.indeed.com/jobs"
    
    def __init__(
        self,
        config: ScraperConfig = None,
        indeed_email: Optional[str] = None,
        indeed_password: Optional[str] = None,
        use_google_sso: bool = False
    ):
        self.browser_pool: Optional[BrowserPool] = None
        self.rate_limiter: Optional[AdaptiveRateLimiter] = None
        self.is_authenticated: bool = False
        self.indeed_email = indeed_email
        self.indeed_password = indeed_password
        self.use_google_sso = use_google_sso
        self._google_authenticator: Optional[GoogleSSOAuthenticator] = None
        self._stats = {
            'jobs_scraped': 0,
            'errors': 0,
            'rate_limit_hits': 0,
            'bot_detections': 0
        }
        super().__init__(config)
    
    def _setup(self):
        """Initialize scraper resources"""
        logger.info(
            "initializing_indeed_scraper",
            max_concurrent=self.config.max_concurrent,
            auth_enabled=bool(self.indeed_email or os.getenv('INDEED_EMAIL') or self.use_google_sso)
        )
        
        # Initialize browser pool with stealth settings
        self.browser_pool = BrowserPool(
            pool_size=self.config.max_concurrent,
            headless=self.config.headless,
            user_agent=self.config.user_agent or self._get_realistic_user_agent(),
            proxy={'server': self.config.proxy} if self.config.proxy else None
        )
        
        # Initialize adaptive rate limiter (more conservative for Indeed)
        self.rate_limiter = AdaptiveRateLimiter(
            initial_rate=0.5,  # Start with 1 request per 2 seconds
            min_rate=0.2,      # Minimum 1 request per 5 seconds
            max_rate=2.0       # Maximum 2 requests per second
        )
    
    def _get_realistic_user_agent(self) -> str:
        """Get a realistic user agent string"""
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
        return random.choice(user_agents)
    
    async def _setup_page_stealth(self, page: Page):
        """Apply enhanced stealth techniques to a page"""
        try:
            # Remove webdriver property
            await page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
            """)
            
            # Add realistic navigator properties
            await page.add_init_script("""
                Object.defineProperty(navigator, 'plugins', {
                    get: () => [1, 2, 3, 4, 5]
                });
                
                Object.defineProperty(navigator, 'languages', {
                    get: () => ['en-US', 'en']
                });
                
                // Add chrome object
                window.chrome = {
                    runtime: {},
                    loadTimes: function() {},
                    csi: function() {},
                    app: {}
                };
                
                // Override permissions
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );
                
                // Add realistic connection
                Object.defineProperty(navigator, 'connection', {
                    get: () => ({
                        effectiveType: '4g',
                        rtt: 50,
                        downlink: 10,
                        saveData: false
                    })
                });
                
                // Mock battery API
                Object.defineProperty(navigator, 'getBattery', {
                    get: () => () => Promise.resolve({
                        charging: true,
                        chargingTime: 0,
                        dischargingTime: Infinity,
                        level: 1
                    })
                });
            """)
            
            # Add realistic screen properties
            await page.add_init_script("""
                Object.defineProperty(screen, 'width', {
                    get: () => 1920
                });
                Object.defineProperty(screen, 'height', {
                    get: () => 1080
                });
                Object.defineProperty(screen, 'availWidth', {
                    get: () => 1920
                });
                Object.defineProperty(screen, 'availHeight', {
                    get: () => 1040
                });
                Object.defineProperty(screen, 'colorDepth', {
                    get: () => 24
                });
                Object.defineProperty(screen, 'pixelDepth', {
                    get: () => 24
                });
            """)
            
            # Override toString methods
            await page.add_init_script("""
                // Make toString methods return expected values
                if (window.navigator.plugins) {
                    window.navigator.plugins.toString = () => '[object PluginArray]';
                }
                if (window.navigator.mimeTypes) {
                    window.navigator.mimeTypes.toString = () => '[object MimeTypeArray]';
                }
            """)
            
            logger.debug("page_stealth_applied")
            
        except Exception as e:
            logger.warning("stealth_setup_failed", error=str(e))
    
    async def _simulate_human_behavior(self, page: Page):
        """Simulate human-like behavior on a page"""
        try:
            # Random mouse movements
            for _ in range(random.randint(2, 4)):
                x = random.randint(100, 800)
                y = random.randint(100, 600)
                await page.mouse.move(x, y)
                await asyncio.sleep(random.uniform(0.1, 0.3))
            
            # Random scroll
            scroll_amount = random.randint(100, 500)
            await page.evaluate(f"window.scrollBy(0, {scroll_amount})")
            await asyncio.sleep(random.uniform(0.5, 1.5))
            
            # Scroll back up a bit
            scroll_back = random.randint(50, 200)
            await page.evaluate(f"window.scrollBy(0, -{scroll_back})")
            await asyncio.sleep(random.uniform(0.3, 0.8))
            
            logger.debug("human_behavior_simulated")
            
        except Exception as e:
            logger.debug("human_simulation_failed", error=str(e))
    
    async def _check_for_bot_detection(self, page: Page) -> bool:
        """
        Check if the page shows bot detection/blocking
        
        Returns:
            True if bot detection is active, False otherwise
        """
        try:
            # Check page content for detection indicators
            content = await page.content()
            
            detection_indicators = [
                'Request Blocked',
                'Additional Verification Required',
                'Verify you are human',
                'cloudflare',
                'cf-wrapper',
                'challenge-platform',
                'ray id',
                'Access Denied',
                'captcha'
            ]
            
            content_lower = content.lower()
            for indicator in detection_indicators:
                if indicator.lower() in content_lower:
                    logger.warning(
                        "bot_detection_found",
                        indicator=indicator,
                        url=page.url
                    )
                    self._stats['bot_detections'] += 1
                    return True
            
            # Check for Cloudflare challenge iframe
            cloudflare_iframe = await page.query_selector('iframe[src*="challenges.cloudflare.com"]')
            if cloudflare_iframe:
                logger.warning("cloudflare_challenge_detected", url=page.url)
                self._stats['bot_detections'] += 1
                return True
            
            return False
            
        except Exception as e:
            logger.debug("bot_detection_check_failed", error=str(e))
            return False
    
    async def _handle_bot_detection(self, page: Page) -> bool:
        """
        Attempt to handle bot detection challenges
        
        Returns:
            True if successfully bypassed, False otherwise
        """
        try:
            logger.info("attempting_to_bypass_bot_detection")
            
            # Wait a bit for any automated challenge to complete
            await asyncio.sleep(5.0)
            
            # Try to wait for Cloudflare challenge to auto-solve
            try:
                # Look for job listings to appear
                await page.wait_for_selector(
                    '#mosaic-provider-jobcards, div.job_seen_beacon',
                    timeout=20000,
                    state='attached'
                )
                logger.info("bot_detection_bypassed_automatically")
                return True
            except:
                pass
            
            # Check if we're still blocked
            if await self._check_for_bot_detection(page):
                logger.error("bot_detection_bypass_failed")
                
                # Take a screenshot for debugging
                try:
                    screenshot_path = f"blocked_indeed_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                    await page.screenshot(path=screenshot_path, full_page=True)
                    logger.info("blocked_screenshot_saved", path=screenshot_path)
                except:
                    pass
                
                return False
            
            return True
            
        except Exception as e:
            logger.error("bot_detection_handling_failed", error=str(e))
            return False
    
    async def scrape_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        limit: Optional[int] = 100,
        filters: Optional[Dict[str, Any]] = None,
        **kwargs
    ) -> List[JobData]:
        """
        Scrape jobs from Indeed with concurrent processing.
        
        Args:
            query: Job search query
            location: Location filter
            limit: Maximum jobs to scrape
            filters: Additional filters (date_posted, job_type, etc.)
            
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
        
        # Setup authentication if EXPLICITLY enabled
        # Note: Google SSO is currently blocked by bot detection, use manual login instead
        google_sso_enabled = (
            self.use_google_sso or 
            os.getenv('INDEED_USE_GOOGLE_SSO', '').lower() == 'true' or
            os.getenv('GOOGLE_EMAIL') and os.getenv('GOOGLE_PASSWORD')  # Only if explicitly set
        )
        
        if google_sso_enabled:
            logger.warning(
                "google_sso_enabled_but_likely_blocked",
                message="Google SSO is enabled but Google blocks automated browsers. "
                        "Consider using manual login: python manual_google_login.py"
            )
            await self._setup_google_sso_authentication()
        elif self.indeed_email or os.getenv('INDEED_EMAIL'):
            await self._setup_authentication()
        else:
            logger.info(
                "scraping_without_authentication",
                message="Scraping without authentication. This is normal for Indeed. "
                        "For authenticated scraping, use: python manual_google_login.py"
            )
        
        # Step 1: Get job listing URLs
        job_urls = await self._get_job_listings(query, location, limit, filters)
        logger.info("job_listings_found", count=len(job_urls))
        
        if not job_urls:
            logger.warning(
                "no_jobs_found",
                message="No job listings found. This may be due to bot detection. "
                        "Try: 1) Using authentication, 2) Reducing request rate, "
                        "3) Using a proxy, 4) Running in non-headless mode"
            )
        
        # Step 2: Scrape job details concurrently
        jobs = await self._scrape_jobs_concurrent(job_urls)
        
        self._stats['jobs_scraped'] += len(jobs)
        logger.info(
            "scrape_completed",
            jobs_scraped=len(jobs),
            total_stats=self._stats
        )
        
        return jobs
    
    async def _setup_google_sso_authentication(self):
        """Setup Indeed authentication using Google SSO"""
        try:
            # Get Google credentials
            google_email = os.getenv('GOOGLE_EMAIL')
            google_password = os.getenv('GOOGLE_PASSWORD')
            
            if not google_email or not google_password:
                logger.error(
                    "google_credentials_missing",
                    message="GOOGLE_EMAIL and GOOGLE_PASSWORD must be set in .env file for Google SSO"
                )
                self.is_authenticated = False
                return
            
            logger.info("setting_up_indeed_google_sso_authentication")
            
            # Create Google SSO authenticator
            google_config = GoogleSSOConfig(
                email=google_email,
                password=google_password,
                timeout=30000,
                debug=os.getenv('DEBUG', 'false').lower() == 'true'
            )
            self._google_authenticator = GoogleSSOAuthenticator(google_config)
            
            async with self.browser_pool.get_page() as page:
                # Apply stealth techniques
                await self._setup_page_stealth(page)
                
                # Use the authentication layer
                success = await self._google_authenticator.authenticate_indeed(page)
                
                if success:
                    self.is_authenticated = True
                    logger.info("indeed_google_sso_authentication_successful")
                else:
                    self.is_authenticated = False
                    logger.warning("indeed_google_sso_authentication_failed")
                    
        except Exception as e:
            logger.error("google_sso_authentication_setup_failed", error=str(e))
            self.is_authenticated = False
    
    async def _setup_authentication(self):
        """Setup Indeed authentication (optional)"""
        try:
            # Get credentials
            email = self.indeed_email or os.getenv('INDEED_EMAIL')
            password = self.indeed_password or os.getenv('INDEED_PASSWORD')
            
            if not email or not password:
                logger.info(
                    "no_credentials_provided",
                    message="Continuing without authentication. "
                            "Set INDEED_EMAIL and INDEED_PASSWORD to enable auth."
                )
                self.is_authenticated = False
                return
            
            logger.info("setting_up_indeed_authentication")
            
            async with self.browser_pool.get_page() as page:
                # Apply stealth techniques
                await self._setup_page_stealth(page)
                
                # Navigate to Indeed login
                await page.goto("https://secure.indeed.com/account/login", timeout=30000)
                
                # Wait for page to load
                await asyncio.sleep(2.0)
                
                # Fill in credentials
                await page.fill('input[type="email"]', email)
                await page.click('button[type="submit"]')
                await asyncio.sleep(1.0)
                
                await page.fill('input[type="password"]', password)
                await page.click('button[type="submit"]')
                
                # Wait for redirect
                try:
                    await page.wait_for_url(
                        lambda url: "secure.indeed.com/account/login" not in url,
                        timeout=10000
                    )
                    self.is_authenticated = True
                    logger.info("indeed_authentication_successful")
                except:
                    logger.warning("indeed_authentication_may_have_failed")
                    self.is_authenticated = False
                    
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
        page_size = 15  # Indeed shows ~15 jobs per page
        consecutive_failures = 0
        max_consecutive_failures = 2
        
        while len(job_urls) < limit and consecutive_failures < max_consecutive_failures:
            try:
                # Rate limit - very conservative
                await self.rate_limiter.acquire()
                logger.debug(
                    "rate_limit_acquired",
                    remaining=self.rate_limiter._tokens,
                    tokens=1
                )
                
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
                    # Apply stealth techniques
                    await self._setup_page_stealth(page)
                    
                    urls = await self._extract_job_urls_from_page(page, search_url)
                    
                    if not urls:
                        logger.info("no_more_jobs_found", start=start)
                        consecutive_failures += 1
                        
                        # If this is the first page, might be bot detection
                        if start == 0:
                            logger.warning(
                                "first_page_returned_no_results",
                                message="This likely indicates bot detection. Consider: "
                                        "1) Running in visible browser mode (headless=False), "
                                        "2) Using authentication, "
                                        "3) Using a residential proxy, "
                                        "4) Increasing delays between requests"
                            )
                        break
                    
                    job_urls.extend(urls)
                    logger.debug("extracted_urls", count=len(urls))
                    consecutive_failures = 0  # Reset on success
                
                await self.rate_limiter.report_success()
                
                # Move to next page
                start += page_size
                
                # Add longer delay between pages to appear more human
                delay = random.uniform(2.0, 4.0)
                logger.debug("page_delay", seconds=delay)
                await asyncio.sleep(delay)
                
            except Exception as e:
                logger.error(
                    "job_listing_fetch_failed",
                    start=start,
                    error=str(e)
                )
                await self.rate_limiter.report_failure()
                self._stats['errors'] += 1
                consecutive_failures += 1
                
                # Longer delay on failure
                await asyncio.sleep(5.0)
        
        return job_urls[:limit]
    
    def _build_search_url(
        self,
        query: str,
        location: Optional[str],
        start: int,
        filters: Optional[Dict[str, Any]]
    ) -> str:
        """Build Indeed job search URL with filters"""
        params = {
            'q': query,
            'start': start
        }
        
        if location:
            params['l'] = location
        
        # Add filters if provided
        if filters:
            # Date posted: 1=Last 24 hours, 3=Last 3 days, 7=Last 7 days, 14=Last 14 days
            if 'date_posted' in filters:
                params['fromage'] = filters['date_posted']
            
            # Job type: fulltime, parttime, contract, temporary, internship
            if 'job_type' in filters:
                params['jt'] = filters['job_type']
            
            # Remote: Only show remote jobs
            if filters.get('remote', False):
                params['remotejob'] = '032b3046-06a3-4876-8dfd-474eb5e7ed11'
            
            # Experience level
            if 'experience_level' in filters:
                params['explvl'] = filters['experience_level']
            
            # Salary estimate
            if 'salary' in filters:
                params['salary'] = filters['salary']
        
        query_string = urlencode(params)
        return f"{self.BASE_URL}?{query_string}"
    
    async def _extract_job_urls_from_page(
        self,
        page: Page,
        url: str
    ) -> List[str]:
        """Extract job URLs from a search results page"""
        try:
            # Navigate to page with longer timeout
            try:
                logger.debug("navigating_to_page", url=url)
                await page.goto(url, wait_until="domcontentloaded", timeout=45000)
            except PlaywrightTimeout:
                logger.warning("page_navigation_timeout", url=url)
                return []
            
            # Wait for page to settle
            await asyncio.sleep(3.0)
            
            # Check for bot detection
            if await self._check_for_bot_detection(page):
                logger.error("bot_detection_active", url=url)
                
                # Attempt to bypass
                if not await self._handle_bot_detection(page):
                    return []
            
            # Simulate human behavior
            await self._simulate_human_behavior(page)
            
            # Wait for job listings container
            selectors_to_try = [
                '#mosaic-provider-jobcards',  # Main job cards container
                'div.job_seen_beacon',  # Individual job cards
                'div[data-jk]',  # Jobs with data-jk attribute
                'a.jcs-JobTitle',  # Job title links
                'h2.jobTitle',  # Job title headings
                '.resultContent',  # Result content divs
            ]
            
            selector_found = None
            for selector in selectors_to_try:
                try:
                    logger.debug("trying_selector", selector=selector)
                    await page.wait_for_selector(
                        selector,
                        timeout=10000,
                        state='attached'
                    )
                    selector_found = selector
                    logger.debug("found_jobs_with_selector", selector=selector)
                    break
                except Exception as e:
                    logger.debug("selector_not_found", selector=selector, error=str(e))
                    continue
            
            if not selector_found:
                # Take debug screenshot
                try:
                    screenshot_path = f"debug_indeed_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                    await page.screenshot(path=screenshot_path, full_page=True)
                    logger.warning("no_job_selectors_found", url=url, screenshot=screenshot_path)
                except:
                    logger.warning("no_job_selectors_found", url=url)
                
                # Log page content snippet for debugging
                try:
                    content = await page.content()
                    content_snippet = content[:500] if len(content) > 500 else content
                    logger.debug("page_content_snippet", snippet=content_snippet)
                except:
                    pass
                
                return []
            
            # Extract job URLs
            job_urls = []
            
            # Method 1: Extract from data-jk attributes (most reliable)
            try:
                job_cards = await page.query_selector_all('div[data-jk]')
                logger.debug("job_cards_found_data_jk", count=len(job_cards))
                
                for card in job_cards:
                    job_key = await card.get_attribute('data-jk')
                    if job_key:
                        job_url = f"https://www.indeed.com/viewjob?jk={job_key}"
                        job_urls.append(job_url)
                        logger.debug("extracted_job_key", job_key=job_key)
            except Exception as e:
                logger.debug("data_jk_extraction_failed", error=str(e))
            
            # Method 2: Extract from job title links
            if not job_urls:
                try:
                    links = await page.query_selector_all('a.jcs-JobTitle, a[id^="job_"]')
                    logger.debug("job_links_found", count=len(links))
                    
                    for link in links:
                        href = await link.get_attribute('href')
                        if href:
                            # Extract job key from URL
                            match = re.search(r'jk=([a-f0-9]+)', href)
                            if match:
                                job_key = match.group(1)
                                job_url = f"https://www.indeed.com/viewjob?jk={job_key}"
                                job_urls.append(job_url)
                                logger.debug("extracted_job_from_link", job_key=job_key)
                except Exception as e:
                    logger.debug("link_extraction_failed", error=str(e))
            
            # Method 3: Extract from result content
            if not job_urls:
                try:
                    results = await page.query_selector_all('.resultContent')
                    logger.debug("result_content_found", count=len(results))
                    
                    for result in results:
                        # Try to find job key in any data attribute or child element
                        html = await result.inner_html()
                        matches = re.findall(r'jk=([a-f0-9]+)|data-jk="([a-f0-9]+)"', html)
                        for match in matches:
                            job_key = match[0] or match[1]
                            if job_key:
                                job_url = f"https://www.indeed.com/viewjob?jk={job_key}"
                                job_urls.append(job_url)
                                logger.debug("extracted_job_from_result", job_key=job_key)
                except Exception as e:
                    logger.debug("result_content_extraction_failed", error=str(e))
            
            # Deduplicate URLs
            job_urls = list(dict.fromkeys(job_urls))
            
            logger.debug("extracted_job_urls_total", count=len(job_urls))
            return job_urls
            
        except Exception as e:
            logger.error("url_extraction_failed", url=url, error=str(e))
            
            # Take error screenshot
            try:
                screenshot_path = f"error_indeed_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                await page.screenshot(path=screenshot_path, full_page=True)
                logger.info("error_screenshot_saved", path=screenshot_path)
            except:
                pass
            
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
                delay = self.config.retry_delay * (2 ** attempt)
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
                # Apply stealth
                await self._setup_page_stealth(page)
                
                # Navigate to job page
                await page.goto(
                    job_url,
                    wait_until="domcontentloaded",
                    timeout=self.config.timeout * 1000
                )
                
                # Check for bot detection
                if await self._check_for_bot_detection(page):
                    if not await self._handle_bot_detection(page):
                        raise RuntimeError("Bot detection active")
                
                # Wait for main content
                await page.wait_for_selector(
                    '#jobDescriptionText, .jobsearch-JobComponent',
                    timeout=10000,
                    state='visible'
                )
                
                # Simulate human behavior
                await self._simulate_human_behavior(page)
                
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
            # Extract job key from URL
            job_key_match = re.search(r'jk=([a-f0-9]+)', job_url)
            job_id = job_key_match.group(1) if job_key_match else job_url
            
            # Title
            title_elem = await page.query_selector('h1.jobsearch-JobInfoHeader-title, h2.jobsearch-JobInfoHeader-title')
            title = await title_elem.text_content() if title_elem else "Unknown"
            title = title.strip()
            
            # Company
            company_elem = await page.query_selector('[data-company-name="true"], div.jobsearch-InlineCompanyRating > div > div')
            company_name = await company_elem.text_content() if company_elem else "Unknown"
            company_name = company_name.strip()
            
            # Location
            location = None
            try:
                location_elem = await page.query_selector('[data-testid="job-location"], div.jobsearch-JobInfoHeader-subtitle > div:nth-child(2)')
                if location_elem:
                    location = await location_elem.text_content()
                    location = location.strip()
            except:
                pass
            
            # Description
            description_html = None
            description = None
            try:
                desc_elem = await page.query_selector('#jobDescriptionText')
                if desc_elem:
                    description_html = await desc_elem.inner_html()
                    description = await desc_elem.text_content()
                    description = description.strip()
            except:
                pass
            
            # Job metadata
            metadata = {}
            try:
                # Try to extract metadata items
                meta_items = await page.query_selector_all('div.jobsearch-JobDescriptionSection-sectionItem')
                for item in meta_items:
                    text = await item.text_content()
                    if text:
                        text = text.strip()
                        if 'Full-time' in text or 'Part-time' in text or 'Contract' in text:
                            metadata['job_type'] = text
                        elif '$' in text or 'hour' in text.lower() or 'year' in text.lower():
                            metadata['salary'] = text
            except:
                pass
            
            # Employment type
            employment_type = metadata.get('job_type')
            
            # Salary parsing
            salary_min = None
            salary_max = None
            if 'salary' in metadata:
                salary_text = metadata['salary']
                # Try to extract salary range
                salary_match = re.findall(r'\$?([\d,]+)', salary_text)
                if len(salary_match) >= 2:
                    try:
                        salary_min = int(salary_match[0].replace(',', ''))
                        salary_max = int(salary_match[1].replace(',', ''))
                    except:
                        pass
                elif len(salary_match) == 1:
                    try:
                        salary_min = int(salary_match[0].replace(',', ''))
                    except:
                        pass
            
            # Apply link
            apply_link = None
            try:
                apply_btn = await page.query_selector('[data-tn-element="apply-now-btn"], #indeedApplyButton')
                if apply_btn:
                    apply_link = job_url
            except:
                pass
            
            # Company URL
            company_url = None
            try:
                company_link = await page.query_selector('a[data-tn-element="companyName"]')
                if company_link:
                    company_url = await company_link.get_attribute('href')
                    if company_url and not company_url.startswith('http'):
                        company_url = f"https://www.indeed.com{company_url}"
            except:
                pass
            
            # Create JobData object
            job_data = JobData(
                job_id=job_id,
                title=title,
                company_name=company_name,
                link=job_url,
                location=location,
                description=description,
                description_html=description_html,
                employment_type=employment_type,
                salary_min=salary_min,
                salary_max=salary_max,
                apply_link=apply_link,
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
        
        # Reset authenticator if exists
        if self._google_authenticator:
            self._google_authenticator.reset()
        
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
    """Example usage of AsyncIndeedScraper"""
    
    # Configure scraper
    config = ScraperConfig(
        max_concurrent=5,
        timeout=30,
        retry_attempts=3,
        headless=True
    )
    
    # Create scraper with Google SSO
    async with AsyncIndeedScraper(config, use_google_sso=True) as scraper:
        # Scrape jobs
        jobs = await scraper.scrape_jobs(
            query="Python Developer",
            location="Remote",
            limit=50,
            filters={
                'date_posted': 7,  # Last 7 days
                'job_type': 'fulltime',
                'remote': True
            }
        )
        
        # Print results
        print(f"\n✅ Scraped {len(jobs)} jobs from Indeed")
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


if __name__ == "__main__":
    asyncio.run(main())

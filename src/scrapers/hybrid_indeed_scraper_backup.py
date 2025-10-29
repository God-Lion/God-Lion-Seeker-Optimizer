"""
Hybrid Indeed Scraper - Ultimate Performance & Robustness
Combines the best features from both async_indeed_scraper and enhanced_indeed_scraper:
- Full async with concurrent processing
- Browser pool for connection reuse
- Proxy rotation with failover
- Enhanced Cloudflare handling
- Multi-source description extraction
- Extensive stealth and human simulation
- Comprehensive retry logic
- Advanced debugging capabilities
"""
import asyncio
from typing import List, Optional, Dict, Any
from urllib.parse import urlencode, quote_plus
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout, async_playwright
from bs4 import BeautifulSoup
import pandas as pd
import time
import random
import requests
import urllib.parse
from datetime import datetime
import structlog
import re
import os
from pathlib import Path
from dotenv import load_dotenv

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

logger = structlog.get_logger(__name__)


class ProxyRotator:
    """Advanced proxy rotation manager with health tracking"""
    def __init__(self, proxy_list: List[str]):
        self.proxies = proxy_list
        self.current_index = 0
        self.failed_proxies = set()
        self.proxy_success_count = {proxy: 0 for proxy in proxy_list}
        self.proxy_failure_count = {proxy: 0 for proxy in proxy_list}

    def get_next_proxy(self) -> Optional[Dict[str, str]]:
        """Get next available proxy with health check"""
        if not self.proxies:
            return None
        
        attempts = 0
        max_attempts = len(self.proxies)
        
        while attempts < max_attempts:
            proxy = self.proxies[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.proxies)
            
            # Skip if marked as failed
            if proxy in self.failed_proxies:
                attempts += 1
                continue
            
            # Check failure rate
            total = self.proxy_success_count[proxy] + self.proxy_failure_count[proxy]
            if total > 10:
                success_rate = self.proxy_success_count[proxy] / total
                if success_rate < 0.3:
                    self.failed_proxies.add(proxy)
                    attempts += 1
                    continue
            
            return {
                "server": f"http://{proxy}",
                "username": "",
                "password": ""
            }
        
        return None

    def mark_proxy_success(self, proxy: str):
        if proxy in self.proxies:
            self.proxy_success_count[proxy] += 1

    def mark_proxy_failed(self, proxy: str):
        if proxy in self.proxies:
            self.proxy_failure_count[proxy] += 1
            if self.proxy_failure_count[proxy] > 5:
                self.failed_proxies.add(proxy)

    def get_stats(self) -> Dict[str, Any]:
        return {
            'total_proxies': len(self.proxies),
            'failed_proxies': len(self.failed_proxies),
            'proxy_health': {
                proxy: {
                    'success': self.proxy_success_count[proxy],
                    'failure': self.proxy_failure_count[proxy]
                }
                for proxy in self.proxies
            }
        }


class HybridIndeedScraper(BaseScraper):
    """
    Hybrid Indeed scraper combining speed and robustness
    """
    
    BASE_URL = "https://www.indeed.com/jobs"
    
    def __init__(
        self,
        config: ScraperConfig = None,
        proxy_list: List[str] = None,
        config_path: str = None,
        indeed_email: Optional[str] = None,
        indeed_password: Optional[str] = None
    ):
        self.proxy_rotator = ProxyRotator(proxy_list or []) if proxy_list else None
        self.config_data = self._load_config(config_path) if config_path else {}
        self.browser_pool: Optional[BrowserPool] = None
        self.rate_limiter: Optional[AdaptiveRateLimiter] = None
        self.indeed_email = indeed_email
        self.indeed_password = indeed_password
        self.is_authenticated = False
        self._stats = {
            'jobs_scraped': 0,
            'errors': 0,
            'cloudflare_challenges': 0,
            'detail_page_fetches': 0,
            'success_count': 0,
            'failure_count': 0,
            'bot_detections': 0,
            'rate_limit_hits': 0,
            'start_time': datetime.now()
        }
        super().__init__(config)
    
    def _load_config(self, config_path: str) -> dict:
        if not config_path or not os.path.exists(config_path):
            return {}
        try:
            import importlib.util
            spec = importlib.util.spec_from_file_location("config", config_path)
            config = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(config)
            return {k: v for k, v in config.__dict__.items() if not k.startswith('__')}
        except Exception as e:
            logger.error("config_load_failed", error=str(e))
            return {}
    
    def _setup(self):
        pass
    
    async def _async_setup(self):
        if self.browser_pool is not None:
            return
            
        logger.info(
            "initializing_hybrid_indeed_scraper",
            max_concurrent=self.config.max_concurrent,
            headless=self.config.headless,
            proxy_enabled=bool(self.proxy_rotator)
        )
        
        self.browser_pool = BrowserPool(
            pool_size=self.config.max_concurrent,
            headless=self.config.headless,
            user_agent=self.config.user_agent or self._get_random_user_agent(),
            proxy=None
        )
        
        if not self.browser_pool._initialized:
            await self.browser_pool.initialize()
        
        self.rate_limiter = AdaptiveRateLimiter(
            initial_rate=0.5,
            min_rate=0.2,
            max_rate=1.5
        )
        
        if self.indeed_email or os.getenv('INDEED_EMAIL'):
            await self._setup_authentication()
    
    def _get_random_user_agent(self) -> str:
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15"
        ]
        return random.choice(user_agents)
    
    async def _setup_page_stealth(self, page: Page):
        try:
            await page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
                Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
                Object.defineProperty(navigator, 'platform', {get: () => 'Win32'});
                
                window.chrome = {
                    runtime: {}, loadTimes: function() {}, csi: function() {}, app: {}
                };
                
                Object.defineProperty(navigator, 'hardwareConcurrency', {get: () => 8});
                Object.defineProperty(navigator, 'deviceMemory', {get: () => 8});
                Object.defineProperty(screen, 'colorDepth', {get: () => 24});
                Object.defineProperty(screen, 'pixelDepth', {get: () => 24});
                
                Object.defineProperty(navigator, 'connection', {
                    get: () => ({effectiveType: '4g', rtt: 50, downlink: 10, saveData: false})
                });
                
                Object.defineProperty(navigator, 'getBattery', {
                    get: () => () => Promise.resolve({
                        charging: true, chargingTime: 0, dischargingTime: Infinity, level: 1
                    })
                });
                
                const originalQuery = window.navigator.permissions.query;
                window.navigator.permissions.query = (parameters) => (
                    parameters.name === 'notifications' ?
                        Promise.resolve({ state: Notification.permission }) :
                        originalQuery(parameters)
                );
                
                if (window.navigator.plugins) {
                    window.navigator.plugins.toString = () => '[object PluginArray]';
                }
                if (window.navigator.mimeTypes) {
                    window.navigator.mimeTypes.toString = () => '[object MimeTypeArray]';
                }
            """)
            
            await page.set_extra_http_headers({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Cache-Control': 'max-age=0'
            })
            
            logger.debug("page_stealth_applied")
            
        except Exception as e:
            logger.warning("stealth_setup_failed", error=str(e))
    
    async def _simulate_human_behavior(self, page: Page):
        try:
            for _ in range(random.randint(3, 6)):
                x = random.randint(100, 1200)
                y = random.randint(100, 800)
                await page.mouse.move(x, y)
                await asyncio.sleep(random.uniform(0.1, 0.3))
            
            total_scroll = random.randint(300, 800)
            scroll_steps = random.randint(3, 6)
            
            for _ in range(scroll_steps):
                scroll_amount = total_scroll // scroll_steps
                await page.evaluate(f"window.scrollBy(0, {scroll_amount})")
                await asyncio.sleep(random.uniform(0.3, 0.7))
            
            scroll_back = random.randint(50, 200)
            await page.evaluate(f"window.scrollBy(0, -{scroll_back})")
            await asyncio.sleep(random.uniform(0.2, 0.5))
            
            if random.random() > 0.5:
                await asyncio.sleep(random.uniform(1.0, 2.5))
            
            logger.debug("human_behavior_simulated")
            
        except Exception as e:
            logger.debug("human_simulation_failed", error=str(e))
    
    async def _check_for_bot_detection(self, page: Page) -> bool:
        try:
            content = await page.content()
            
            detection_indicators = [
                'Request Blocked', 'Additional Verification Required', 'Verify you are human',
                'cloudflare', 'cf-wrapper', 'challenge-platform', 'ray id', 'Access Denied',
                'captcha', 'hcaptcha', 'recaptcha'
            ]
            
            content_lower = content.lower()
            for indicator in detection_indicators:
                if indicator.lower() in content_lower:
                    logger.warning("bot_detection_found", indicator=indicator, url=page.url)
                    self._stats['bot_detections'] += 1
                    return True
            
            cf_iframe = await page.query_selector('iframe[src*="challenges.cloudflare.com"]')
            if cf_iframe:
                logger.warning("cloudflare_iframe_detected", url=page.url)
                self._stats['bot_detections'] += 1
                return True
            
            challenge_selectors = [
                "#challenge-form", ".cf-browser-verification", "#cf-wrapper", "div[class*='cf-']"
            ]
            
            for selector in challenge_selectors:
                try:
                    element = await page.query_selector(selector)
                    if element:
                        logger.warning("challenge_form_detected", selector=selector)
                        self._stats['cloudflare_challenges'] += 1
                        return True
                except:
                    continue
            
            return False
            
        except Exception as e:
            logger.debug("bot_detection_check_failed", error=str(e))
            return False
    
    async def handle_cloudflare(self, page: Page) -> bool:
        try:
            cf_selectors = [
                "#challenge-form", ".cf-browser-verification", "#cf-wrapper",
                "div[class*='cf-']", "iframe[src*='challenges.cloudflare.com']"
            ]

            challenge_detected = False
            for selector in cf_selectors:
                try:
                    if await page.query_selector(selector):
                        challenge_detected = True
                        logger.info("cloudflare_challenge_detected", selector=selector)
                        self._stats['cloudflare_challenges'] += 1
                        
                        if not self.config.headless:
                            print("\n" + "="*50)
                            print("🛡️  CLOUDFLARE CHALLENGE DETECTED")
                            print("="*50)
                            print("⏳ Please complete the challenge manually")
                            print("⏱️  Waiting up to 60 seconds...")
                            print("="*50 + "\n")
                        
                        try:
                            await page.wait_for_selector(selector, state="hidden", timeout=60000)
                            await asyncio.sleep(random.uniform(2, 4))
                            logger.info("cloudflare_challenge_solved")
                            return True
                        except PlaywrightTimeout:
                            logger.error("cloudflare_challenge_timeout")
                            return False
                        
                except:
                    continue
            
            if not challenge_detected:
                return True
                
            return False
            
        except Exception as e:
            logger.error("cloudflare_handling_failed", error=str(e))
            return False
    
    async def _setup_authentication(self):
        try:
            email = self.indeed_email or os.getenv('INDEED_EMAIL')
            password = self.indeed_password or os.getenv('INDEED_PASSWORD')
            
            if not email or not password:
                logger.info("no_credentials_provided")
                return
            
            logger.info("setting_up_indeed_authentication")
            
            async with self.browser_pool.get_page() as page:
                await self._setup_page_stealth(page)
                await page.goto("https://secure.indeed.com/account/login", timeout=30000)
                await asyncio.sleep(2.0)
                
                await page.fill('input[type="email"]', email)
                await page.click('button[type="submit"]')
                await asyncio.sleep(1.0)
                
                await page.fill('input[type="password"]', password)
                await page.click('button[type="submit"]')
                
                try:
                    await page.wait_for_url(
                        lambda url: "secure.indeed.com/account/login" not in url, timeout=10000
                    )
                    self.is_authenticated = True
                    logger.info("indeed_authentication_successful")
                except:
                    logger.warning("indeed_authentication_may_have_failed")
                    self.is_authenticated = False
                    
        except Exception as e:
            logger.error("authentication_setup_failed", error=str(e))
            self.is_authenticated = False
    
    async def scrape_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        limit: Optional[int] = 100,
        filters: Optional[Dict[str, Any]] = None,
        num_pages: Optional[int] = None,
        **kwargs
    ) -> List[JobData]:
        """
        Scrape jobs with hybrid two-phase approach
        Phase 1: Get job URLs from search pages
        Phase 2: Scrape details concurrently
        """
        await self._async_setup()
        
        logger.info(
            "starting_hybrid_job_scrape",
            query=query,
            location=location,
            limit=limit,
            num_pages=num_pages
        )
        
        # Phase 1: Get job URLs
        job_urls = await self._get_job_listings(query, location, limit, filters, num_pages)
        logger.info("job_listings_found", count=len(job_urls))
        
        if not job_urls:
            logger.warning("no_jobs_found")
            return []
        
        # Phase 2: Scrape concurrently
        jobs = await self._scrape_jobs_concurrent(job_urls)
        
        self._stats['jobs_scraped'] = len(jobs)
        logger.info("scrape_completed", jobs=len(jobs), stats=self._stats)
        
        return jobs
    
    async def _get_job_listings(
        self,
        query: str,
        location: Optional[str],
        limit: int,
        filters: Optional[Dict[str, Any]],
        num_pages: Optional[int] = None
    ) -> List[str]:
        """Get job URLs with SERP data extraction"""
        job_data_list = []
        start = 0
        page_size = 15
        
        if num_pages is None:
            num_pages = max(1, (limit // page_size) + 1) if limit else 3
        
        for page_num in range(num_pages):
            retry_count = 0
            max_retries = 3
            
            while retry_count < max_retries:
                try:
                    await self.rate_limiter.acquire()
                    
                    search_url = self._build_search_url(query, location, start, filters)
                    logger.info("fetching_page", page_num=page_num + 1, url=search_url)
                    
                    async with self.browser_pool.get_page() as page:
                        await self._setup_page_stealth(page)
                        await page.goto(search_url, wait_until='domcontentloaded', timeout=30000)
                        
                        if await self._check_for_bot_detection(page):
                            if not await self.handle_cloudflare(page):
                                raise RuntimeError("Cloudflare challenge failed")
                        
                        selectors = [
                            '#mosaic-provider-jobcards', '.job_seen_beacon',
                            '[data-testid="jobsearch-JobCard"]', '.resultContent'
                        ]
                        
                        found = False
                        for selector in selectors:
                            try:
                                await page.wait_for_selector(selector, timeout=5000)
                                found = True
                                break
                            except:
                                continue
                        
                        if not found:
                            logger.warning("no_job_selectors_found", page=page_num + 1)
                            retry_count += 1
                            continue
                        
                        await self._simulate_human_behavior(page)
                        
                        content = await page.content()
                        urls_and_data = await self._extract_jobs_with_serp_data(content)
                        job_data_list.extend(urls_and_data)
                        
                        logger.info("extracted_jobs_from_page", count=len(urls_and_data))
                        await self.rate_limiter.report_success()
                        break
                    
                except Exception as e:
                    logger.error("page_scrape_failed", page_num=page_num + 1, error=str(e))
                    retry_count += 1
                    await self.rate_limiter.report_failure()
                    self._stats['errors'] += 1
                    
                    if retry_count < max_retries:
                        await asyncio.sleep(random.uniform(3, 6) * retry_count)
            
            if retry_count >= max_retries:
                self._stats['failure_count'] += 1
            else:
                self._stats['success_count'] += 1
            
            await asyncio.sleep(random.uniform(2, 4))
            
            if limit and len(job_data_list) >= limit:
                job_data_list = job_data_list[:limit]
                break
            
            start += page_size
        
        self._serp_data = {item['job_id']: item['serp_data'] for item in job_data_list}
        return [item['url'] for item in job_data_list]
    
    def _build_search_url(
        self,
        query: str,
        location: Optional[str],
        start: int,
        filters: Optional[Dict[str, Any]]
    ) -> str:
        """Build search URL with filters"""
        url = f"{self.BASE_URL}?q={query.replace(' ', '+')}"
        if location:
            url += f"&l={location.replace(' ', '+')}"
        url += f"&start={start}"
        
        if filters:
            if 'date_posted' in filters:
                url += f"&fromage={filters['date_posted']}"
            if 'job_type' in filters:
                url += f"&jt={filters['job_type']}"
            if filters.get('remote', False):
                url += '&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11'
            if 'experience_level' in filters:
                url += f"&explvl={filters['experience_level']}"
            if 'salary' in filters:
                url += f"&salary={filters['salary']}"
        
        return url
    
    async def _extract_jobs_with_serp_data(self, content: str) -> List[Dict[str, Any]]:
        """Extract job URLs and SERP descriptions"""
        soup = BeautifulSoup(content, 'lxml')
        jobs = []
        
        listings = soup.select('.job_seen_beacon, .resultContent, [data-testid="jobsearch-JobCard"]')
        
        for listing in listings:
            try:
                job_key = None
                parent = listing
                for _ in range(5):
                    if parent and parent.get('data-jk'):
                        job_key = parent.get('data-jk')
                        break
                    parent = parent.parent if parent else None
                
                if not job_key:
                    link = listing.select_one('a[href*="jk="]')
                    if link:
                        href = link.get('href', '')
                        match = re.search(r'jk=([a-f0-9]+)', href)
                        if match:
                            job_key = match.group(1)
                
                if not job_key:
                    continue
                
                desc_selectors = [
                    '#jobDescriptionText', '.job-snippet',
                    '[data-testid="belowJobSnippet"]', '[data-testid="slider_sub_item"]',
                    '.slider_sub_item', 'div.job-snippet', 'ul.job-snippet'
                ]
                
                description = None
                for selector in desc_selectors:
                    elem = listing.select_one(selector)
                    if not elem and parent:
                        elem = parent.select_one(selector)
                    if elem:
                        desc_text = elem.get_text(separator=' ', strip=True)
                        if desc_text and len(desc_text) > 20:
                            description = desc_text
                            break
                
                jobs.append({
                    'url': f"https://www.indeed.com/viewjob?jk={job_key}",
                    'job_id': job_key,
                    'serp_data': {
                        'description_snippet': description
                    }
                })
                
            except Exception as e:
                logger.debug("serp_parsing_failed", error=str(e))
                continue
        
        return jobs
    
    async def _scrape_jobs_concurrent(self, job_urls: List[str]) -> List[JobData]:
        """Scrape jobs concurrently with semaphore control"""
        semaphore = asyncio.Semaphore(self.config.max_concurrent)
        
        async def scrape_with_semaphore(url):
            async with semaphore:
                return await self._scrape_job_with_retry(url)
        
        tasks = [scrape_with_semaphore(url) for url in job_urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        jobs = [job for job in results if isinstance(job, JobData)]
        return jobs
    
    async def _scrape_job_with_retry(
        self,
        job_url: str,
        attempt: int = 0
    ) -> Optional[JobData]:
        """Scrape with exponential backoff"""
        try:
            return await self.scrape_job_details(job_url)
        except Exception as e:
            if attempt < self.config.retry_attempts:
                logger.warning("job_scrape_retry", url=job_url, attempt=attempt + 1, error=str(e))
                delay = self.config.retry_delay * (2 ** attempt)
                await asyncio.sleep(delay)
                return await self._scrape_job_with_retry(job_url, attempt + 1)
            else:
                logger.error("job_scrape_failed", url=job_url, error=str(e))
                self._stats['errors'] += 1
                return None
    
    async def scrape_job_details(self, job_url: str) -> JobData:
        """Scrape single job with multi-source description"""
        await self.rate_limiter.acquire()
        
        job_id = self._extract_job_id(job_url)
        serp_data = getattr(self, '_serp_data', {}).get(job_id, {})
        
        async with self.browser_pool.get_page() as page:
            try:
                await self._setup_page_stealth(page)
                await page.goto(job_url, wait_until="domcontentloaded", timeout=self.config.timeout * 1000)
                
                if await self._check_for_bot_detection(page):
                    if not await self.handle_cloudflare(page):
                        raise RuntimeError("Bot detection active")
                
                await page.wait_for_selector(
                    '#jobDescriptionText, .jobsearch-JobComponent',
                    timeout=10000, state='visible'
                )
                
                await self._simulate_human_behavior(page)
                
                job_data = await self._parse_job_page(page, job_url, serp_data)
                await self.rate_limiter.report_success()
                return job_data
                
            except Exception as e:
                logger.error("job_scrape_error", url=job_url, error=str(e))
                await self.rate_limiter.report_failure()
                raise
    
    async def _parse_job_page(
        self,
        page: Page,
        job_url: str,
        serp_data: Dict[str, Any]
    ) -> JobData:
        """Parse job page with fallback to SERP data"""
        try:
            job_id = self._extract_job_id(job_url)
            
            # Title
            title_elem = await page.query_selector('h1.jobsearch-JobInfoHeader-title, h2.jobsearch-JobInfoHeader-title')
            title = (await title_elem.text_content()).strip() if title_elem else "Unknown"
            
            # Company
            company_elem = await page.query_selector('[data-company-name="true"], div.jobsearch-InlineCompanyRating > div > div')
            company_name = (await company_elem.text_content()).strip() if company_elem else "Unknown"
            
            # Location
            location = None
            location_elem = await page.query_selector('[data-testid="job-location"], div.jobsearch-JobInfoHeader-subtitle > div:nth-child(2)')
            if location_elem:
                location = (await location_elem.text_content()).strip()
            
            # Description - multi-source approach
            description_html = None
            description = None
            
            # Try detail page first
            desc_elem = await page.query_selector('#jobDescriptionText')
            if desc_elem:
                description_html = await desc_elem.inner_html()
                description = (await desc_elem.text_content()).strip()
            
            # Fallback to SERP data if needed
            if not description or len(description) < 50:
                serp_desc = serp_data.get('description_snippet')
                if serp_desc and len(serp_desc) > len(description or ''):
                    description = serp_desc
                    self._stats['detail_page_fetches'] += 1
            
            # Metadata
            metadata = {}
            meta_items = await page.query_selector_all('div.jobsearch-JobDescriptionSection-sectionItem')
            for item in meta_items:
                text = (await item.text_content()).strip()
                if 'Full-time' in text or 'Part-time' in text or 'Contract' in text:
                    metadata['job_type'] = text
                elif '
            
            # Employment type
            employment_type = metadata.get('job_type')
            
            # Salary parsing
            salary_min, salary_max = self._parse_salary(metadata.get('salary', ''))
            
            # Posted date
            posted_date = None
            date_elem = await page.query_selector('span.date, div.jobsearch-JobMetadataFooter')
            if date_elem:
                posted_date = (await date_elem.text_content()).strip()
            
            # Create JobData
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
                posted_date=posted_date,
                scraped_at=datetime.utcnow()
            )
            
            logger.debug("job_parsed", job_id=job_id, title=title)
            return job_data
            
        except Exception as e:
            logger.error("job_parsing_failed", url=job_url, error=str(e))
            raise ParsingError(f"Failed to parse job page: {str(e)}")
    
    def _extract_job_id(self, url: str) -> str:
        """Extract job ID from URL"""
        if not url:
            return f"indeed_{int(time.time())}"
        match = re.search(r'jk=([a-f0-9]+)', url)
        if match:
            return match.group(1)
        return f"indeed_{int(time.time())}"
    
    def _parse_salary(self, salary_text: str) -> tuple:
        """Parse salary range from text"""
        if not salary_text or salary_text == "Not specified":
            return None, None
        
        try:
            numbers = re.findall(r'\$?([\d,]+)', salary_text)
            if len(numbers) >= 2:
                salary_min = int(numbers[0].replace(',', ''))
                salary_max = int(numbers[1].replace(',', ''))
                return salary_min, salary_max
            elif len(numbers) == 1:
                salary_min = int(numbers[0].replace(',', ''))
                return salary_min, None
        except:
            pass
        
        return None, None
    
    async def close(self):
        """Clean up resources"""
        if self.browser_pool:
            await self.browser_pool.close()
        
        logger.info(
            "hybrid_scraper_closed",
            stats=self._stats,
            rate_limiter_stats=self.rate_limiter.get_stats() if self.rate_limiter else {},
            proxy_stats=self.proxy_rotator.get_stats() if self.proxy_rotator else {}
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive scraping statistics"""
        stats = self._stats.copy()
        if self.rate_limiter:
            stats['rate_limiter'] = self.rate_limiter.get_stats()
        if self.proxy_rotator:
            stats['proxy'] = self.proxy_rotator.get_stats()
        return stats
    
    async def __aenter__(self):
        await self._async_setup()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


# Example usage
async def main():
    """
    Example usage of HybridIndeedScraper
    Demonstrates the ultimate scraper combining all best features
    """
    from pathlib import Path
    
    # Configure scraper
    config = ScraperConfig(
        max_concurrent=3,  # Concurrent job detail scraping
        timeout=30,
        retry_attempts=3,
        headless=False  # Set True for production
    )
    
    # Optional: Add proxy list
    proxy_list = [
        # 'proxy1.example.com:8080',
        # 'proxy2.example.com:8080',
    ]
    
    # Create hybrid scraper
    async with HybridIndeedScraper(
        config=config,
        proxy_list=proxy_list if proxy_list else None
    ) as scraper:
        # Scrape jobs
        jobs = await scraper.scrape_jobs(
            query="Software Engineer",
            location="San Francisco",
            limit=50,
            filters={
                'date_posted': 7,  # Last 7 days
                'job_type': 'fulltime',
                'remote': True
            }
        )
        
        # Save results
        if jobs:
            Path('results').mkdir(exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Convert to DataFrame
            df_data = [{
                'Job ID': job.job_id,
                'Title': job.title,
                'Company': job.company_name,
                'Location': job.location,
                'Salary Min': job.salary_min,
                'Salary Max': job.salary_max,
                'Description': job.description,
                'Job Type': job.employment_type,
                'Date Posted': job.posted_date,
                'Link': job.link,
                'Scraped At': job.scraped_at
            } for job in jobs]
            
            df = pd.DataFrame(df_data)
            filename = f"results/hybrid_jobs_{timestamp}.xlsx"
            df.to_excel(filename, index=False)
            
            print(f"\n✅ Scraped {len(jobs)} jobs")
            print(f"📁 Results saved to {filename}")
            
            # Print comprehensive stats
            stats = scraper.get_stats()
            print(f"\n📊 Hybrid Scraper Statistics:")
            print(f"   Jobs Scraped: {stats['jobs_scraped']}")
            print(f"   Success Rate: {stats['success_count']}/{stats['success_count'] + stats['failure_count']}")
            print(f"   Cloudflare Challenges: {stats['cloudflare_challenges']}")
            print(f"   Bot Detections: {stats['bot_detections']}")
            print(f"   Detail Page Fetches: {stats['detail_page_fetches']}")
            print(f"   Errors: {stats['errors']}")
            
            if 'proxy' in stats:
                print(f"\n🔄 Proxy Statistics:")
                print(f"   Total Proxies: {stats['proxy']['total_proxies']}")
                print(f"   Failed Proxies: {stats['proxy']['failed_proxies']}")
        else:
            print("❌ No jobs found")


if __name__ == "__main__":
    asyncio.run(main())
 in text or 'hour' in text.lower() or 'year' in text.lower():
                    metadata['salary'] = text
            
            # Employment type
            employment_type = metadata.get('job_type')
            
            # Salary parsing
            salary_min, salary_max = self._parse_salary(metadata.get('salary', ''))
            
            # Posted date
            posted_date = None
            date_elem = await page.query_selector('span.date, div.jobsearch-JobMetadataFooter')
            if date_elem:
                posted_date = (await date_elem.text_content()).strip()
            
            # Create JobData
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
                posted_date=posted_date,
                scraped_at=datetime.utcnow()
            )
            
            logger.debug("job_parsed", job_id=job_id, title=title)
            return job_data
            
        except Exception as e:
            logger.error("job_parsing_failed", url=job_url, error=str(e))
            raise ParsingError(f"Failed to parse job page: {str(e)}")
    
    def _extract_job_id(self, url: str) -> str:
        """Extract job ID from URL"""
        if not url:
            return f"indeed_{int(time.time())}"
        match = re.search(r'jk=([a-f0-9]+)', url)
        if match:
            return match.group(1)
        return f"indeed_{int(time.time())}"
    
    def _parse_salary(self, salary_text: str) -> tuple:
        """Parse salary range from text"""
        if not salary_text or salary_text == "Not specified":
            return None, None
        
        try:
            numbers = re.findall(r'\$?([\d,]+)', salary_text)
            if len(numbers) >= 2:
                salary_min = int(numbers[0].replace(',', ''))
                salary_max = int(numbers[1].replace(',', ''))
                return salary_min, salary_max
            elif len(numbers) == 1:
                salary_min = int(numbers[0].replace(',', ''))
                return salary_min, None
        except:
            pass
        
        return None, None
    
    async def close(self):
        """Clean up resources"""
        if self.browser_pool:
            await self.browser_pool.close()
        
        logger.info(
            "hybrid_scraper_closed",
            stats=self._stats,
            rate_limiter_stats=self.rate_limiter.get_stats() if self.rate_limiter else {},
            proxy_stats=self.proxy_rotator.get_stats() if self.proxy_rotator else {}
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive scraping statistics"""
        stats = self._stats.copy()
        if self.rate_limiter:
            stats['rate_limiter'] = self.rate_limiter.get_stats()
        if self.proxy_rotator:
            stats['proxy'] = self.proxy_rotator.get_stats()
        return stats
    
    async def __aenter__(self):
        await self._async_setup()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


# Example usage
async def main():
    """
    Example usage of HybridIndeedScraper
    Demonstrates the ultimate scraper combining all best features
    """
    from pathlib import Path
    
    # Configure scraper
    config = ScraperConfig(
        max_concurrent=3,  # Concurrent job detail scraping
        timeout=30,
        retry_attempts=3,
        headless=False  # Set True for production
    )
    
    # Optional: Add proxy list
    proxy_list = [
        # 'proxy1.example.com:8080',
        # 'proxy2.example.com:8080',
    ]
    
    # Create hybrid scraper
    async with HybridIndeedScraper(
        config=config,
        proxy_list=proxy_list if proxy_list else None
    ) as scraper:
        # Scrape jobs
        jobs = await scraper.scrape_jobs(
            query="Software Engineer",
            location="San Francisco",
            limit=50,
            filters={
                'date_posted': 7,  # Last 7 days
                'job_type': 'fulltime',
                'remote': True
            }
        )
        
        # Save results
        if jobs:
            Path('results').mkdir(exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Convert to DataFrame
            df_data = [{
                'Job ID': job.job_id,
                'Title': job.title,
                'Company': job.company_name,
                'Location': job.location,
                'Salary Min': job.salary_min,
                'Salary Max': job.salary_max,
                'Description': job.description,
                'Job Type': job.employment_type,
                'Date Posted': job.posted_date,
                'Link': job.link,
                'Scraped At': job.scraped_at
            } for job in jobs]
            
            df = pd.DataFrame(df_data)
            filename = f"results/hybrid_jobs_{timestamp}.xlsx"
            df.to_excel(filename, index=False)
            
            print(f"\n✅ Scraped {len(jobs)} jobs")
            print(f"📁 Results saved to {filename}")
            
            # Print comprehensive stats
            stats = scraper.get_stats()
            print(f"\n📊 Hybrid Scraper Statistics:")
            print(f"   Jobs Scraped: {stats['jobs_scraped']}")
            print(f"   Success Rate: {stats['success_count']}/{stats['success_count'] + stats['failure_count']}")
            print(f"   Cloudflare Challenges: {stats['cloudflare_challenges']}")
            print(f"   Bot Detections: {stats['bot_detections']}")
            print(f"   Detail Page Fetches: {stats['detail_page_fetches']}")
            print(f"   Errors: {stats['errors']}")
            
            if 'proxy' in stats:
                print(f"\n🔄 Proxy Statistics:")
                print(f"   Total Proxies: {stats['proxy']['total_proxies']}")
                print(f"   Failed Proxies: {stats['proxy']['failed_proxies']}")
        else:
            print("❌ No jobs found")


if __name__ == "__main__":
    asyncio.run(main())

"""
Hybrid Indeed Scraper - Ultimate Performance & Robustness
"""
import asyncio
from typing import List, Optional, Dict, Any
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup
import pandas as pd
import time
import random
from datetime import datetime
import structlog
import re
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from .base_scraper import BaseScraper, ScraperConfig, JobData, RateLimitError, ParsingError
from .browser_manager import BrowserPool
from .rate_limiter import AdaptiveRateLimiter

logger = structlog.get_logger(__name__)


class ProxyRotator:
    def __init__(self, proxy_list: List[str]):
        self.proxies = proxy_list
        self.current_index = 0
        self.failed_proxies = set()
        self.proxy_success_count = {proxy: 0 for proxy in proxy_list}
        self.proxy_failure_count = {proxy: 0 for proxy in proxy_list}

    def get_next_proxy(self) -> Optional[Dict[str, str]]:
        if not self.proxies:
            return None
        attempts = 0
        max_attempts = len(self.proxies)
        while attempts < max_attempts:
            proxy = self.proxies[self.current_index]
            self.current_index = (self.current_index + 1) % len(self.proxies)
            if proxy in self.failed_proxies:
                attempts += 1
                continue
            total = self.proxy_success_count[proxy] + self.proxy_failure_count[proxy]
            if total > 10:
                success_rate = self.proxy_success_count[proxy] / total
                if success_rate < 0.3:
                    self.failed_proxies.add(proxy)
                    attempts += 1
                    continue
            return {"server": f"http://{proxy}", "username": "", "password": ""}
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
    BASE_URL = "https://www.indeed.com/jobs"
    
    def __init__(self, config: ScraperConfig = None, proxy_list: List[str] = None, 
                 config_path: str = None, indeed_email: Optional[str] = None, 
                 indeed_password: Optional[str] = None):
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
        logger.info("initializing_hybrid_indeed_scraper", max_concurrent=self.config.max_concurrent)
        self.browser_pool = BrowserPool(
            pool_size=self.config.max_concurrent,
            headless=self.config.headless,
            user_agent=self.config.user_agent or self._get_random_user_agent(),
            proxy=None
        )
        if not self.browser_pool._initialized:
            await self.browser_pool.initialize()
        self.rate_limiter = AdaptiveRateLimiter(initial_rate=2.0, min_rate=0.5, max_rate=5.0)
    
    def _get_random_user_agent(self) -> str:
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/120.0.0.0",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ]
        return random.choice(user_agents)
    
    async def _setup_page_stealth(self, page: Page):
        try:
            await page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
            """)
            await page.set_extra_http_headers({
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'DNT': '1'
            })
        except Exception as e:
            logger.warning("stealth_setup_failed", error=str(e))
    
    async def _simulate_human_behavior(self, page: Page):
        try:
            for _ in range(random.randint(2, 4)):
                await page.mouse.move(random.randint(100, 1200), random.randint(100, 800))
                await asyncio.sleep(random.uniform(0.1, 0.3))
            for _ in range(random.randint(2, 4)):
                await page.evaluate(f"window.scrollBy(0, {random.randint(100, 300)})")
                await asyncio.sleep(random.uniform(0.2, 0.5))
        except Exception as e:
            logger.debug("human_simulation_failed", error=str(e))
    
    async def _check_for_bot_detection(self, page: Page) -> bool:
        try:
            content = await page.content()
            indicators = ['Request Blocked', 'cloudflare', 'captcha']
            if any(ind.lower() in content.lower() for ind in indicators):
                self._stats['bot_detections'] += 1
                return True
            return False
        except:
            return False
    
    async def handle_cloudflare(self, page: Page) -> bool:
        try:
            selectors = ["#challenge-form", ".cf-browser-verification"]
            for selector in selectors:
                if await page.query_selector(selector):
                    self._stats['cloudflare_challenges'] += 1
                    if not self.config.headless:
                        print("\n🛡️  CLOUDFLARE CHALLENGE - Please complete manually")
                    try:
                        await page.wait_for_selector(selector, state="hidden", timeout=60000)
                        await asyncio.sleep(random.uniform(2, 4))
                        return True
                    except PlaywrightTimeout:
                        return False
            return True
        except:
            return False
    
    async def scrape_jobs(self, query: str, location: Optional[str] = None, 
                         limit: Optional[int] = 100, filters: Optional[Dict[str, Any]] = None,
                         num_pages: Optional[int] = None, **kwargs) -> List[JobData]:
        await self._async_setup()
        logger.info("starting_hybrid_job_scrape", query=query, limit=limit)
        job_urls = await self._get_job_listings(query, location, limit, filters, num_pages)
        if not job_urls:
            return []
        jobs = await self._scrape_jobs_concurrent(job_urls)
        self._stats['jobs_scraped'] = len(jobs)
        return jobs
    
    async def _get_job_listings(self, query: str, location: Optional[str], limit: int,
                                filters: Optional[Dict[str, Any]], num_pages: Optional[int]) -> List[str]:
        job_data_list = []
        start = 0
        page_size = 15
        if num_pages is None:
            num_pages = max(1, (limit // page_size) + 1) if limit else 3
        
        for page_num in range(num_pages):
            try:
                await self.rate_limiter.acquire()
                search_url = self._build_search_url(query, location, start, filters)
                
                async with self.browser_pool.get_page() as page:
                    await self._setup_page_stealth(page)
                    await page.goto(search_url, wait_until='domcontentloaded', timeout=30000)
                    
                    if await self._check_for_bot_detection(page):
                        if not await self.handle_cloudflare(page):
                            continue
                    
                    selectors = ['#mosaic-provider-jobcards', '.job_seen_beacon']
                    for selector in selectors:
                        try:
                            await page.wait_for_selector(selector, timeout=5000)
                            break
                        except:
                            continue
                    
                    await self._simulate_human_behavior(page)
                    content = await page.content()
                    urls_and_data = await self._extract_jobs_with_serp_data(content)
                    job_data_list.extend(urls_and_data)
                    await self.rate_limiter.report_success()
                    
            except Exception as e:
                logger.error("page_scrape_failed", error=str(e))
                await self.rate_limiter.report_failure()
                self._stats['errors'] += 1
            
            await asyncio.sleep(random.uniform(2, 4))
            if limit and len(job_data_list) >= limit:
                job_data_list = job_data_list[:limit]
                break
            start += page_size
        
        self._serp_data = {item['job_id']: item['serp_data'] for item in job_data_list}
        return [item['url'] for item in job_data_list]
    
    def _build_search_url(self, query: str, location: Optional[str], start: int,
                         filters: Optional[Dict[str, Any]]) -> str:
        url = f"{self.BASE_URL}?q={query.replace(' ', '+')}"
        if location:
            url += f"&l={location.replace(' ', '+')}"
        url += f"&start={start}"
        if filters:
            if 'date_posted' in filters:
                url += f"&fromage={filters['date_posted']}"
            if 'job_type' in filters:
                url += f"&jt={filters['job_type']}"
        return url
    
    async def _extract_jobs_with_serp_data(self, content: str) -> List[Dict[str, Any]]:
        soup = BeautifulSoup(content, 'lxml')
        jobs = []
        listings = soup.select('.job_seen_beacon, .resultContent')
        
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
                        match = re.search(r'jk=([a-f0-9]+)', link.get('href', ''))
                        if match:
                            job_key = match.group(1)
                
                if job_key:
                    jobs.append({
                        'url': f"https://www.indeed.com/viewjob?jk={job_key}",
                        'job_id': job_key,
                        'serp_data': {}
                    })
            except:
                continue
        return jobs
    
    async def _scrape_jobs_concurrent(self, job_urls: List[str]) -> List[JobData]:
        semaphore = asyncio.Semaphore(self.config.max_concurrent)
        
        async def scrape_with_semaphore(url):
            async with semaphore:
                return await self._scrape_job_with_retry(url)
        
        tasks = [scrape_with_semaphore(url) for url in job_urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        return [job for job in results if isinstance(job, JobData)]
    
    async def _scrape_job_with_retry(self, job_url: str, attempt: int = 0) -> Optional[JobData]:
        try:
            return await self.scrape_job_details(job_url)
        except Exception as e:
            if attempt < self.config.retry_attempts:
                await asyncio.sleep(self.config.retry_delay * (2 ** attempt))
                return await self._scrape_job_with_retry(job_url, attempt + 1)
            self._stats['errors'] += 1
            return None
    
    async def scrape_job_details(self, job_url: str) -> JobData:
        await self.rate_limiter.acquire()
        job_id = self._extract_job_id(job_url)
        
        async with self.browser_pool.get_page() as page:
            await self._setup_page_stealth(page)
            await page.goto(job_url, wait_until="domcontentloaded", timeout=self.config.timeout * 1000)
            
            if await self._check_for_bot_detection(page):
                if not await self.handle_cloudflare(page):
                    raise RuntimeError("Bot detection")
            
            await page.wait_for_selector('#jobDescriptionText, .jobsearch-JobComponent', 
                                        timeout=10000, state='visible')
            await self._simulate_human_behavior(page)
            
            job_data = await self._parse_job_page(page, job_url)
            await self.rate_limiter.report_success()
            return job_data
    
    async def _parse_job_page(self, page: Page, job_url: str) -> JobData:
        job_id = self._extract_job_id(job_url)
        
        title_elem = await page.query_selector('h1.jobsearch-JobInfoHeader-title, h2.jobsearch-JobInfoHeader-title')
        title = (await title_elem.text_content()).strip() if title_elem else "Unknown"
        
        company_elem = await page.query_selector('[data-company-name="true"]')
        company_name = (await company_elem.text_content()).strip() if company_elem else "Unknown"
        
        location_elem = await page.query_selector('[data-testid="job-location"]')
        location = (await location_elem.text_content()).strip() if location_elem else None
        
        desc_elem = await page.query_selector('#jobDescriptionText')
        description = (await desc_elem.text_content()).strip() if desc_elem else None
        description_html = await desc_elem.inner_html() if desc_elem else None
        
        return JobData(
            job_id=job_id,
            title=title,
            company_name=company_name,
            link=job_url,
            location=location,
            description=description,
            description_html=description_html,
            job_type=None,  # Changed from employment_type
            salary_min=None,
            salary_max=None,
            posted_date=None,
            scraped_at=datetime.utcnow()
        )
    
    def _extract_job_id(self, url: str) -> str:
        if not url:
            return f"indeed_{int(time.time())}"
        match = re.search(r'jk=([a-f0-9]+)', url)
        return match.group(1) if match else f"indeed_{int(time.time())}"
    
    async def close(self):
        if self.browser_pool:
            await self.browser_pool.close()
    
    def get_stats(self) -> Dict[str, Any]:
        return self._stats.copy()
    
    async def __aenter__(self):
        await self._async_setup()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()

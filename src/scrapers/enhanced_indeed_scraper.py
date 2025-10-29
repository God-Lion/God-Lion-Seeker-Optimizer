"""
Enhanced Indeed Scraper - Combines sync and async approaches
Integrates proven Cloudflare handling with existing async architecture
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
from .rate_limiter import AdaptiveRateLimiter

logger = structlog.get_logger(__name__)


class ProxyRotator:
    """Proxy rotation manager"""
    def __init__(self, proxy_list: List[str]):
        self.proxies = proxy_list
        self.current_index = 0
        self.failed_proxies = set()

    def get_next_proxy(self) -> Optional[Dict[str, str]]:
        if not self.proxies:
            return None
        
        proxy = self.proxies[self.current_index]
        self.current_index = (self.current_index + 1) % len(self.proxies)
        
        if proxy in self.failed_proxies:
            return self.get_next_proxy()
            
        return {
            "server": f"http://{proxy}",
            "username": "",
            "password": ""
        }

    def mark_proxy_failed(self, proxy: str):
        if proxy in self.proxies:
            self.failed_proxies.add(proxy)


class EnhancedIndeedScraper(BaseScraper):
    """
    Enhanced Indeed scraper combining:
    - Proven Cloudflare handling from working sync code
    - Async architecture for better performance
    - Robust error handling and retry logic
    - Description extraction from both SERP and detail pages
    """
    
    BASE_URL = "https://www.indeed.com/jobs"
    
    def __init__(
        self,
        config: ScraperConfig = None,
        proxy_list: List[str] = None,
        config_path: str = None
    ):
        self.proxy_rotator = ProxyRotator(proxy_list or [])
        self.config_data = self._load_config(config_path) if config_path else {}
        self.playwright = None
        self.browser = None
        self.context = None
        self._stats = {
            'jobs_scraped': 0,
            'errors': 0,
            'cloudflare_challenges': 0,
            'detail_page_fetches': 0,
            'success_count': 0,
            'failure_count': 0,
            'start_time': datetime.now()
        }
        super().__init__(config)
    
    def _load_config(self, config_path: str) -> dict:
        """Load configuration from config.py"""
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
        """Sync setup - does nothing, async setup happens in scrape_jobs"""
        # This is called by BaseScraper.__init__ but we can't await here
        # Real setup happens in _async_setup()
        pass
    
    async def _async_setup(self):
        """Initialize scraper resources (async)"""
        if self.playwright is not None:
            return  # Already initialized
            
        logger.info(
            "initializing_enhanced_indeed_scraper",
            max_concurrent=self.config.max_concurrent,
            headless=self.config.headless
        )
        
        # Initialize Playwright
        self.playwright = await async_playwright().start()
        
        # Setup rate limiter
        self.rate_limiter = AdaptiveRateLimiter(
            initial_rate=0.5,  # Conservative: 1 request per 2 seconds
            min_rate=0.2,
            max_rate=1.0
        )
    
    def _get_random_user_agent(self) -> str:
        """Get a realistic user agent string"""
        user_agents = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/118.0.2088.76",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0"
        ]
        return random.choice(user_agents)
    
    async def _setup_browser_context(self, proxy_info: Optional[Dict[str, str]] = None):
        """Setup browser context with anti-detection measures"""
        browser_args = [
            '--disable-blink-features=AutomationControlled',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-site-isolation-trials',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--window-size=1920,1080',
            '--start-maximized'
        ]

        launch_kwargs = {
            'headless': self.config.headless,
            'args': browser_args
        }

        # Add proxy if provided
        if proxy_info and isinstance(proxy_info, dict):
            proxy_server = proxy_info.get('server')
            if proxy_server:
                proxy_kwargs = {'server': proxy_server}
                if proxy_info.get('username'):
                    proxy_kwargs['username'] = proxy_info.get('username')
                    proxy_kwargs['password'] = proxy_info.get('password')
                launch_kwargs['proxy'] = proxy_kwargs

        self.browser = await self.playwright.chromium.launch(**launch_kwargs)

        context_options = {
            'viewport': {'width': 1920, 'height': 1080},
            'user_agent': self.config.user_agent or self._get_random_user_agent(),
            'java_script_enabled': True,
            'locale': 'en-US',
            'timezone_id': 'America/New_York',
            'permissions': ['geolocation'],
            'has_touch': True
        }

        self.context = await self.browser.new_context(**context_options)
        
        # Add stealth scripts
        await self.context.add_init_script("""
            Object.defineProperties(navigator, {
                webdriver: {get: () => undefined},
                languages: {get: () => ['en-US', 'en']},
                plugins: {get: () => [1, 2, 3, 4, 5]},
                platform: {get: () => 'Win32'}
            });
            
            window.chrome = {
                runtime: {},
                loadTimes: function() {},
                csi: function() {},
                app: {}
            };
            
            Object.defineProperty(navigator, 'hardwareConcurrency', {get: () => 8});
            Object.defineProperty(navigator, 'deviceMemory', {get: () => 8});
            Object.defineProperty(screen, 'colorDepth', {get: () => 24});
        """)
    
    async def handle_cloudflare(self, page: Page) -> bool:
        """Enhanced Cloudflare challenge handling - proven to work"""
        cf_selectors = [
            "#challenge-form",
            ".cf-browser-verification",
            "#cf-wrapper",
            "div[class*='cf-']",
            "iframe[src*='challenges.cloudflare.com']"
        ]

        try:
            for selector in cf_selectors:
                try:
                    if await page.wait_for_selector(selector, timeout=5000):
                        logger.info("cloudflare_challenge_detected", selector=selector)
                        self._stats['cloudflare_challenges'] += 1
                        
                        if not self.config.headless:
                            print("\n=== Cloudflare Challenge Detected ===")
                            print("1. Please complete the challenge in the browser window")
                            print("2. The script will continue automatically once solved")
                            print("3. You have 60 seconds to complete the challenge")
                            print("=====================================\n")
                        
                        # Wait for challenge completion
                        await page.wait_for_selector(selector, state="hidden", timeout=60000)
                        await asyncio.sleep(random.uniform(2, 4))
                        return True
                except:
                    continue
            return False
        except Exception as e:
            logger.error("cloudflare_handling_failed", error=str(e))
            return False
    
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
        Scrape jobs from Indeed
        
        Args:
            query: Job search query
            location: Location filter
            limit: Maximum jobs to scrape
            filters: Additional filters
            num_pages: Number of pages to scrape (overrides limit)
            
        Returns:
            List of JobData objects
        """
        # Initialize async resources
        await self._async_setup()
        
        logger.info(
            "starting_job_scrape",
            query=query,
            location=location,
            limit=limit,
            num_pages=num_pages
        )
        
        # Calculate pages
        if num_pages is None:
            num_pages = max(1, (limit // 15) + 1) if limit else 3
        
        all_jobs = []
        
        for page_num in range(num_pages):
            retry_count = 0
            success = False
            max_retries = self.config_data.get('MAX_RETRIES', 3)
            
            while not success and retry_count < max_retries:
                try:
                    # Get proxy and setup browser for this attempt
                    proxy_info = self.proxy_rotator.get_next_proxy()
                    await self._setup_browser_context(proxy_info)
                    page = await self.context.new_page()
                    
                    # Set extra headers
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
                    
                    # Build URL
                    url = self._build_search_url(query, location, page_num * 10, filters)
                    logger.info("accessing_page", page_num=page_num + 1, url=url)
                    
                    # Navigate
                    try:
                        await page.goto(url, wait_until='domcontentloaded', timeout=20000)
                        
                        # Handle Cloudflare
                        if await self.handle_cloudflare(page):
                            await asyncio.sleep(random.uniform(2, 4))
                        
                        # Wait for job listings
                        selectors = ['.job_seen_beacon', '.resultContent', '[data-testid="jobsearch-JobCard"]']
                        found_selector = None
                        for selector in selectors:
                            try:
                                await page.wait_for_selector(selector, timeout=3000)
                                found_selector = selector
                                break
                            except:
                                continue
                        
                        if not found_selector:
                            raise Exception("No job listings found")
                        
                        # Extract job data
                        content = await page.content()
                        jobs = await self._parse_page_content(content, proxy_info)
                        
                        # Debug: Save HTML if all descriptions missing
                        if jobs:
                            all_desc_missing = all((not j.description or j.description == 'Not specified') for j in jobs)
                            if all_desc_missing:
                                Path('debug').mkdir(exist_ok=True)
                                ts = datetime.now().strftime('%Y%m%d_%H%M%S')
                                debug_path = Path('debug') / f'content_page_{page_num+1}_{ts}.html'
                                with debug_path.open('w', encoding='utf-8') as fh:
                                    fh.write(content)
                                logger.info("saved_debug_html", path=str(debug_path))
                        
                        all_jobs.extend(jobs)
                        success = True
                        self._stats['success_count'] += 1
                        
                    except Exception as e:
                        logger.error("page_scrape_failed", page_num=page_num + 1, error=str(e))
                        retry_count += 1
                        
                        # Mark proxy failed
                        if proxy_info and isinstance(proxy_info, dict):
                            server = proxy_info.get('server')
                            if server:
                                host = server.replace('http://', '').replace('https://', '')
                                self.proxy_rotator.mark_proxy_failed(host)
                    
                    finally:
                        # Cleanup
                        try:
                            await page.close()
                            await self.context.close()
                            await self.browser.close()
                        except:
                            pass
                        await asyncio.sleep(random.uniform(3, 6))
                
                except Exception as e:
                    logger.error("browser_error", error=str(e))
                    retry_count += 1
            
            if not success:
                logger.error("page_failed_all_retries", page_num=page_num + 1)
                self._stats['failure_count'] += 1
            
            # Apply limit if specified
            if limit and len(all_jobs) >= limit:
                all_jobs = all_jobs[:limit]
                break
        
        self._stats['jobs_scraped'] = len(all_jobs)
        logger.info("scrape_completed", jobs=len(all_jobs), stats=self._stats)
        
        return all_jobs
    
    def _build_search_url(
        self,
        query: str,
        location: Optional[str],
        start: int,
        filters: Optional[Dict[str, Any]]
    ) -> str:
        """Build Indeed search URL"""
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
        
        return url
    
    async def _parse_page_content(self, content: str, proxy_info: Optional[Dict[str, str]] = None) -> List[JobData]:
        """Parse page content and extract job information"""
        soup = BeautifulSoup(content, 'lxml')
        jobs = []
        
        # Try different job card selectors
        selectors = ['.job_seen_beacon', '.resultContent', '[data-testid="jobsearch-JobCard"]']
        listings = []
        for selector in selectors:
            listings = soup.select(selector)
            if listings:
                break
        
        for listing in listings:
            try:
                # Climb to card container
                card = listing
                for _ in range(4):
                    parent = card.parent
                    if parent is None:
                        break
                    card = parent
                    if card.name == 'li' or ('cardOutline' in (card.get('class') or [])):
                        break
                
                # Extract basic data
                title = self._extract_text(listing, ['[title]', '.jobTitle', '.title'])
                company = self._extract_text(listing, ['[data-testid="company-name"]', '.companyName'])
                location_text = self._extract_text(listing, ['[data-testid="text-location"]', '.companyLocation'])
                salary = self._extract_text(listing, ['.salary-snippet', '.estimated-salary', '.metadata.salary'])
                date_posted = self._extract_text(listing, ['span.date', '.date'])
                job_type = self._extract_text(listing, ['[class*="attribute_snippet"]'])
                
                # Extract description from SERP
                description = self._extract_text(listing, [
                    '#jobDescriptionText',
                    '.job-snippet',
                    '[data-testid="belowJobSnippet"]',
                    '[data-testid="slider_sub_item"]',
                    '.slider_sub_item',
                    'div[data-testid="belowJobSnippet"] ul',
                    'div[data-testid="belowJobSnippet"] li'
                ])
                
                # Fallback to card container for description
                if not description or description.lower() == 'not specified':
                    card_desc = self._extract_text(card, [
                        '[data-testid="belowJobSnippet"]',
                        '[data-testid="slider_sub_item"]',
                        '.slider_sub_item',
                        'div[data-testid="belowJobSnippet"] ul',
                        'div[data-testid="belowJobSnippet"] li'
                    ])
                    if card_desc and card_desc.lower() != 'not specified':
                        description = card_desc
                    else:
                        # Fetch from detail page
                        job_url = self._build_job_url(listing)
                        if job_url:
                            try:
                                detail_desc = await self._fetch_job_detail_and_extract(job_url, proxy_info)
                                if detail_desc:
                                    description = detail_desc
                                    self._stats['detail_page_fetches'] += 1
                            except Exception as e:
                                logger.debug("detail_fetch_failed", url=job_url, error=str(e))
                
                # Extract job ID from URL
                job_url = self._build_job_url(listing)
                job_id = self._extract_job_id(job_url) if job_url else f"indeed_{int(time.time())}"
                
                # Parse salary
                salary_min, salary_max = self._parse_salary(salary)
                
                if title and company:
                    job_data = JobData(
                        job_id=job_id,
                        title=title,
                        company_name=company,
                        link=job_url or f"{self.BASE_URL}",
                        location=location_text if location_text != "Not specified" else None,
                        description=description if description != "Not specified" else None,
                        description_html=None,
                        salary_min=salary_min,
                        salary_max=salary_max,
                        employment_type=job_type if job_type != "Not specified" else None,
                        posted_date=date_posted if date_posted != "Not specified" else None,
                        scraped_at=datetime.utcnow()
                    )
                    jobs.append(job_data)
                    
            except Exception as e:
                logger.error("listing_parse_failed", error=str(e))
        
        return jobs
    
    def _extract_text(self, element, selectors) -> str:
        """Extract text using multiple possible selectors"""
        for selector in selectors:
            try:
                found = element.select_one(selector)
                if found:
                    return found.get_text().strip()
            except:
                continue
        return "Not specified"
    
    def _build_job_url(self, listing) -> Optional[str]:
        """Build absolute job detail URL from listing element"""
        try:
            a = listing.select_one('a[href]')
            if not a:
                return None
            href = a.get('href')
            if href.startswith('http'):
                return href
            return urllib.parse.urljoin('https://www.indeed.com', href)
        except:
            return None
    
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
            # Extract numbers
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
    
    async def _fetch_job_detail_and_extract(self, url: str, proxy_info: Optional[Dict[str, str]] = None) -> Optional[str]:
        """Fetch job detail page and extract description"""
        try:
            proxies = None
            if proxy_info and proxy_info.get('server'):
                server = proxy_info.get('server')
                proxies = {'http': server, 'https': server}
            
            headers = {
                'User-Agent': self._get_random_user_agent(),
                'Accept-Language': 'en-US,en;q=0.9'
            }
            
            # Run in executor to avoid blocking
            loop = asyncio.get_event_loop()
            resp = await loop.run_in_executor(
                None,
                lambda: requests.get(url, headers=headers, proxies=proxies, timeout=15)
            )
            
            if resp.status_code != 200:
                return None
            
            soup = BeautifulSoup(resp.text, 'lxml')
            desc = soup.select_one('#jobDescriptionText')
            if desc:
                return desc.get_text(separator='\n').strip()
            
            # Fallback
            main = soup.select_one('div.jobsearch-JobComponent') or soup.select_one('div.jobsearch-JobComponent-description')
            if main:
                return main.get_text(separator='\n').strip()
            
            return None
            
        except Exception as e:
            logger.debug("detail_fetch_failed", url=url, error=str(e))
            return None
    
    async def scrape_job_details(self, job_url: str) -> JobData:
        """
        Scrape detailed information for a single job
        Not implemented yet - use scrape_jobs instead
        """
        raise NotImplementedError("Use scrape_jobs method instead")
    
    async def close(self):
        """Clean up resources"""
        try:
            if self.context:
                await self.context.close()
            if self.browser:
                await self.browser.close()
            if self.playwright:
                await self.playwright.stop()
        except Exception as e:
            logger.error("cleanup_failed", error=str(e))
        
        logger.info("scraper_closed", stats=self._stats)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get scraping statistics"""
        stats = self._stats.copy()
        if hasattr(self, 'rate_limiter') and self.rate_limiter:
            stats['rate_limiter'] = self.rate_limiter.get_stats()
        return stats


# Example usage
async def main():
    """Example usage of EnhancedIndeedScraper"""
    from pathlib import Path
    
    # Configure scraper
    config = ScraperConfig(
        max_concurrent=1,  # Use 1 for safety with Cloudflare
        timeout=30,
        retry_attempts=3,
        headless=False  # Set True for production
    )
    
    # Create scraper
    async with EnhancedIndeedScraper(config) as scraper:
        # Scrape jobs
        jobs = await scraper.scrape_jobs(
            query="Software Engineer",
            location="San Francisco",
            limit=50,
            filters={
                'date_posted': 7,  # Last 7 days
                'remote': True
            }
        )
        
        # Save results
        if jobs:
            Path('results').mkdir(exist_ok=True)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Convert to DataFrame
            df_data = [{
                'Title': job.title,
                'Company': job.company_name,
                'Location': job.location,
                'Salary Min': job.salary_min,
                'Salary Max': job.salary_max,
                'Description': job.description,
                'Job Type': job.employment_type,
                'Date Posted': job.posted_date,
                'Link': job.link,
                'Job ID': job.job_id
            } for job in jobs]
            
            df = pd.DataFrame(df_data)
            filename = f"results/jobs_Software_Engineer_San_Francisco_{timestamp}.xlsx"
            df.to_excel(filename, index=False)
            
            print(f"\n✅ Scraped {len(jobs)} jobs")
            print(f"📁 Results saved to {filename}")
            
            # Print stats
            stats = scraper.get_stats()
            print(f"\n📊 Statistics:")
            for key, value in stats.items():
                if key != 'start_time':
                    print(f"   {key}: {value}")
        else:
            print("❌ No jobs found")


if __name__ == "__main__":
    asyncio.run(main())

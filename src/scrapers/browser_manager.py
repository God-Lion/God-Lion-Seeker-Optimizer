"""
Browser manager for handling Playwright browser instances with pooling.
Manages browser lifecycle, connection pooling, and resource cleanup.
"""
import asyncio
import sys
from typing import Optional, List
from contextlib import asynccontextmanager
from playwright.async_api import async_playwright, Browser, BrowserContext, Page
import structlog

logger = structlog.get_logger(__name__)

# Event loop policy is now set in run_server.py before imports


class BrowserPool:
    """
    Manages a pool of browser instances for concurrent scraping.
    Implements connection pooling to reuse browser instances efficiently.
    """
    
    def __init__(
        self,
        pool_size: int = 3,
        headless: bool = True,
        browser_type: str = "chromium",
        user_agent: Optional[str] = None,
        proxy: Optional[dict] = None
    ):
        self.pool_size = pool_size
        self.headless = headless
        self.browser_type = browser_type
        self.user_agent = user_agent
        self.proxy = proxy
        
        self._playwright = None
        self._browsers: List[Browser] = []
        self._semaphore = asyncio.Semaphore(pool_size)
        self._initialized = False
    
    async def initialize(self):
        """Initialize the browser pool"""
        if self._initialized:
            return
        
        logger.info("initializing_browser_pool", pool_size=self.pool_size)
        
        self._playwright = await async_playwright().start()
        
        # Get browser launcher
        if self.browser_type == "chromium":
            launcher = self._playwright.chromium
        elif self.browser_type == "firefox":
            launcher = self._playwright.firefox
        elif self.browser_type == "webkit":
            launcher = self._playwright.webkit
        else:
            raise ValueError(f"Unknown browser type: {self.browser_type}")
        
        # Launch browsers in pool with enhanced stealth settings
        launch_options = {
            "headless": self.headless,
            "proxy": self.proxy,
            "args": [
                '--disable-blink-features=AutomationControlled',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-infobars',
                '--window-position=0,0',
                '--ignore-certificate-errors',
                '--ignore-certificate-errors-spki-list',
                '--disable-gpu',
                '--disable-background-networking',
                '--disable-default-apps',
                '--disable-extensions',
                '--disable-sync',
                '--disable-translate',
                '--hide-scrollbars',
                '--metrics-recording-only',
                '--mute-audio',
                '--no-first-run',
                '--safebrowsing-disable-auto-update',
            ]
        }
        
        for i in range(self.pool_size):
            try:
                browser = await launcher.launch(**launch_options)
                self._browsers.append(browser)
                logger.info("browser_launched", index=i)
            except Exception as e:
                logger.error("browser_launch_failed", index=i, error=str(e))
                raise
        
        self._initialized = True
        logger.info("browser_pool_initialized", count=len(self._browsers))
    
    @asynccontextmanager
    async def get_page(self):
        """
        Get a browser page from the pool.
        Uses semaphore to limit concurrent page usage.
        """
        async with self._semaphore:
            if not self._initialized:
                await self.initialize()
            
            if not self._browsers:
                raise RuntimeError("No browsers available in pool")
            
            # Get a browser (use first available)
            browser = self._browsers[0]
            
            # Create new context for isolation with enhanced settings
            context_options = {
                'viewport': {'width': 1920, 'height': 1080},
                'user_agent': self.user_agent or 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'locale': 'en-US',
                'timezone_id': 'America/New_York',
                'permissions': ['geolocation', 'notifications'],
                'geolocation': {'longitude': -73.935242, 'latitude': 40.730610},
                'color_scheme': 'light',
                'device_scale_factor': 1,
                'has_touch': False,
                'is_mobile': False,
                'java_script_enabled': True,
            }
            
            context: BrowserContext = None
            page: Page = None
            
            try:
                context = await browser.new_context(**context_options)
                page = await context.new_page()
                logger.debug("page_acquired")
                yield page
            finally:
                try:
                    if page:
                        await page.close()
                except Exception as e:
                    logger.debug("page_close_error", error=str(e))
                
                try:
                    if context:
                        await context.close()
                except Exception as e:
                    logger.debug("context_close_error", error=str(e))
                
                logger.debug("page_released")
    
    async def close(self):
        """Close all browsers in the pool"""
        if not self._initialized:
            return
        
        logger.info("closing_browser_pool", browser_count=len(self._browsers))
        
        for browser in self._browsers:
            try:
                await browser.close()
            except Exception as e:
                logger.error("browser_close_failed", error=str(e))
        
        self._browsers.clear()
        
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
        
        self._initialized = False
        logger.info("browser_pool_closed")
    
    async def __aenter__(self):
        """Context manager entry"""
        await self.initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        await self.close()


class BrowserManager:
    """
    Simple browser manager for single browser instances.
    Use this for lightweight scraping tasks.
    """
    
    def __init__(
        self,
        headless: bool = True,
        browser_type: str = "chromium",
        timeout: int = 30000,
        user_agent: Optional[str] = None
    ):
        self.headless = headless
        self.browser_type = browser_type
        self.timeout = timeout
        self.user_agent = user_agent
        
        self._playwright = None
        self._browser: Optional[Browser] = None
        self._context: Optional[BrowserContext] = None
    
    async def start(self):
        """Start the browser"""
        if self._browser:
            return
        
        logger.info("starting_browser", browser_type=self.browser_type)
        
        self._playwright = await async_playwright().start()
        
        # Get browser launcher
        if self.browser_type == "chromium":
            launcher = self._playwright.chromium
        elif self.browser_type == "firefox":
            launcher = self._playwright.firefox
        elif self.browser_type == "webkit":
            launcher = self._playwright.webkit
        else:
            raise ValueError(f"Unknown browser type: {self.browser_type}")
        
        # Launch browser
        self._browser = await launcher.launch(headless=self.headless)
        
        # Create context
        context_options = {'user_agent': self.user_agent} if self.user_agent else {}
        self._context = await self._browser.new_context(**context_options)
        self._context.set_default_timeout(self.timeout)
        
        logger.info("browser_started")
    
    async def new_page(self) -> Page:
        """Create a new page"""
        if not self._context:
            await self.start()
        
        page = await self._context.new_page()
        return page
    
    async def close(self):
        """Close the browser"""
        if self._context:
            await self._context.close()
            self._context = None
        
        if self._browser:
            await self._browser.close()
            self._browser = None
        
        if self._playwright:
            await self._playwright.stop()
            self._playwright = None
        
        logger.info("browser_closed")
    
    async def __aenter__(self):
        """Context manager entry"""
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        await self.close()

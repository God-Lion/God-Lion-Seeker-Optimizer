"""
LinkedIn Authentication Manager for Async Scraper.
Handles cookie-based authentication, session persistence, and login flow.
"""
import json
import os
from pathlib import Path
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from playwright.async_api import Page, BrowserContext
import structlog

logger = structlog.get_logger(__name__)


class LinkedInAuthManager:
    """
    Manages LinkedIn authentication for the async scraper.
    
    Supports:
    - Cookie-based authentication
    - Session persistence
    - Automatic session refresh
    - Manual login flow
    """
    
    def __init__(
        self,
        storage_dir: str = ".auth",
        session_file: str = "linkedin_session.json",
        cookies_file: str = "linkedin_cookies.json"
    ):
        self.storage_dir = Path(storage_dir)
        self.session_file = self.storage_dir / session_file
        self.cookies_file = self.storage_dir / cookies_file
        
        # Create storage directory if it doesn't exist
        self.storage_dir.mkdir(exist_ok=True)
        
        logger.info(
            "auth_manager_initialized",
            storage_dir=str(self.storage_dir)
        )
    
    async def is_authenticated(self, page: Page) -> bool:
        """
        Check if the current session is authenticated.
        
        Args:
            page: Playwright page instance
            
        Returns:
            True if authenticated, False otherwise
        """
        try:
            # Navigate to LinkedIn feed
            await page.goto(
                "https://www.linkedin.com/feed/",
                wait_until="domcontentloaded",
                timeout=10000
            )
            
            # Check if redirected to login page
            current_url = page.url
            
            if "login" in current_url or "authwall" in current_url:
                logger.warning("not_authenticated", url=current_url)
                return False
            
            # Check for authenticated elements
            try:
                await page.wait_for_selector(
                    "div.global-nav__me",
                    timeout=5000,
                    state="visible"
                )
                logger.info("authentication_verified")
                return True
            except:
                logger.warning("authentication_element_not_found")
                return False
                
        except Exception as e:
            logger.error("authentication_check_failed", error=str(e))
            return False
    
    async def authenticate_with_cookies(
        self,
        context: BrowserContext,
        cookies: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """
        Authenticate using cookies.
        
        Args:
            context: Browser context
            cookies: List of cookie dictionaries (if None, loads from file)
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if cookies is None:
                cookies = self.load_cookies()
            
            if not cookies:
                logger.warning("no_cookies_available")
                return False
            
            # Add cookies to context
            await context.add_cookies(cookies)
            logger.info("cookies_added", count=len(cookies))
            
            # Verify authentication
            page = await context.new_page()
            is_auth = await self.is_authenticated(page)
            await page.close()
            
            if is_auth:
                logger.info("cookie_authentication_successful")
                return True
            else:
                logger.warning("cookie_authentication_failed")
                return False
                
        except Exception as e:
            logger.error("cookie_authentication_error", error=str(e))
            return False
    
    async def authenticate_with_credentials(
        self,
        page: Page,
        email: str,
        password: str,
        save_session: bool = True
    ) -> bool:
        """
        Authenticate using email and password.
        
        Args:
            page: Playwright page instance
            email: LinkedIn email
            password: LinkedIn password
            save_session: Whether to save the session for future use
            
        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info("starting_credential_authentication", email=email)
            
            # Navigate to login page
            await page.goto(
                "https://www.linkedin.com/login",
                wait_until="domcontentloaded"
            )
            
            # Fill login form
            await page.fill('input#username', email)
            await page.fill('input#password', password)
            
            # Click login button and wait for navigation
            await page.click('button[type="submit"]')
            
            # Wait for either feed page or checkpoint
            try:
                await page.wait_for_url(
                    lambda url: "feed" in url or "checkpoint" in url or "check/add-phone" in url,
                    timeout=15000
                )
            except Exception:
                # If URL doesn't change, check current page
                await page.wait_for_timeout(3000)
            
            # Check if login was successful
            current_url = page.url
            
            if "checkpoint" in current_url or "challenge" in current_url or "check/add-phone" in current_url:
                logger.warning(
                    "login_challenge_required",
                    message="LinkedIn security challenge detected. Manual intervention may be required.",
                    url=current_url
                )
                # For automated scraping, we'll just try to continue
                # In a visible browser, user can solve the challenge
                # Wait a bit to see if redirect happens
                try:
                    await page.wait_for_url(
                        lambda url: "feed" in url,
                        timeout=30000  # 30 seconds
                    )
                except Exception:
                    logger.warning("challenge_redirect_timeout")
            
            # Check for error messages
            try:
                error_element = await page.query_selector('.form__label--error')
                if error_element:
                    error_text = await error_element.text_content()
                    logger.error("login_error_message", error=error_text)
                    return False
            except Exception:
                pass
            
            # Verify authentication by checking current page
            # If we're on feed, mynetwork, jobs, etc - we're authenticated
            authenticated_paths = ['feed', 'mynetwork', 'jobs', 'messaging', 'notifications']
            is_auth = any(path in current_url for path in authenticated_paths)
            
            if not is_auth:
                # Double-check by trying to access feed
                is_auth = await self.is_authenticated(page)
            
            if is_auth:
                logger.info("credential_authentication_successful")
                
                # Save session if requested
                if save_session:
                    await self.save_session(page.context)
                
                return True
            else:
                logger.error(
                    "credential_authentication_failed",
                    current_url=current_url
                )
                return False
                
        except Exception as e:
            logger.error("credential_authentication_error", error=str(e))
            return False
    
    async def save_session(self, context: BrowserContext) -> bool:
        """
        Save the current authenticated session.
        
        Args:
            context: Browser context to save
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Save storage state (cookies, localStorage, etc.)
            await context.storage_state(path=str(self.session_file))
            
            # Also save cookies separately for easier inspection
            cookies = await context.cookies()
            self.save_cookies(cookies)
            
            logger.info(
                "session_saved",
                session_file=str(self.session_file),
                cookies_count=len(cookies)
            )
            return True
            
        except Exception as e:
            logger.error("session_save_failed", error=str(e))
            return False
    
    async def load_session(self, context: BrowserContext) -> bool:
        """
        Load a previously saved session.
        
        Args:
            context: Browser context to load session into
            
        Returns:
            True if successful, False otherwise
        """
        try:
            if not self.session_file.exists():
                logger.warning("session_file_not_found")
                return False
            
            # Check if session is expired (older than 30 days)
            if self._is_session_expired():
                logger.warning("session_expired")
                return False
            
            # Load storage state would require recreating context
            # Instead, we'll use cookies
            return await self.authenticate_with_cookies(context)
            
        except Exception as e:
            logger.error("session_load_failed", error=str(e))
            return False
    
    def save_cookies(self, cookies: List[Dict[str, Any]]) -> bool:
        """
        Save cookies to file.
        
        Args:
            cookies: List of cookie dictionaries
            
        Returns:
            True if successful, False otherwise
        """
        try:
            with open(self.cookies_file, 'w') as f:
                json.dump(cookies, f, indent=2)
            
            logger.info("cookies_saved", path=str(self.cookies_file))
            return True
            
        except Exception as e:
            logger.error("cookies_save_failed", error=str(e))
            return False
    
    def load_cookies(self) -> Optional[List[Dict[str, Any]]]:
        """
        Load cookies from file.
        
        Returns:
            List of cookie dictionaries or None
        """
        try:
            if not self.cookies_file.exists():
                logger.warning("cookies_file_not_found")
                return None
            
            with open(self.cookies_file, 'r') as f:
                cookies = json.load(f)
            
            logger.info("cookies_loaded", count=len(cookies))
            return cookies
            
        except Exception as e:
            logger.error("cookies_load_failed", error=str(e))
            return None
    
    def load_cookies_from_dict(self, cookies_dict: Dict[str, str]) -> List[Dict[str, Any]]:
        """
        Convert simple cookie dict to Playwright format.
        
        Args:
            cookies_dict: Dictionary of cookie name: value pairs
            
        Returns:
            List of cookie dictionaries in Playwright format
        """
        return [
            {
                "name": name,
                "value": value,
                "domain": ".linkedin.com",
                "path": "/",
                "httpOnly": True,
                "secure": True,
                "sameSite": "None"
            }
            for name, value in cookies_dict.items()
        ]
    
    def _is_session_expired(self, max_age_days: int = 30) -> bool:
        """
        Check if saved session is expired.
        
        Args:
            max_age_days: Maximum age of session in days
            
        Returns:
            True if expired, False otherwise
        """
        try:
            if not self.session_file.exists():
                return True
            
            # Get file modification time
            mtime = datetime.fromtimestamp(self.session_file.stat().st_mtime)
            age = datetime.now() - mtime
            
            return age > timedelta(days=max_age_days)
            
        except Exception as e:
            logger.error("session_expiry_check_failed", error=str(e))
            return True
    
    def get_cookies_from_env(self) -> Optional[List[Dict[str, Any]]]:
        """
        Get cookies from environment variables.
        
        Expected format:
        LINKEDIN_COOKIES='{"li_at": "value", "JSESSIONID": "value"}'
        
        Returns:
            List of cookie dictionaries or None
        """
        try:
            cookies_json = os.getenv('LINKEDIN_COOKIES')
            if not cookies_json:
                return None
            
            cookies_dict = json.loads(cookies_json)
            return self.load_cookies_from_dict(cookies_dict)
            
        except Exception as e:
            logger.error("env_cookies_load_failed", error=str(e))
            return None
    
    async def setup_authenticated_context(
        self,
        browser,
        email: Optional[str] = None,
        password: Optional[str] = None,
        use_env_cookies: bool = True
    ) -> tuple[BrowserContext, bool]:
        """
        Create an authenticated browser context.
        
        Tries in order:
        1. Load saved session
        2. Use environment variable cookies
        3. Use provided credentials
        4. Return unauthenticated context
        
        Args:
            browser: Browser instance
            email: LinkedIn email (optional)
            password: LinkedIn password (optional)
            use_env_cookies: Whether to try environment cookies
            
        Returns:
            Tuple of (context, is_authenticated)
        """
        # Try to load saved session
        if self.session_file.exists():
            try:
                context = await browser.new_context(
                    storage_state=str(self.session_file)
                )
                page = await context.new_page()
                
                if await self.is_authenticated(page):
                    await page.close()
                    logger.info("loaded_saved_session")
                    return context, True
                
                await page.close()
                await context.close()
            except Exception as e:
                logger.warning("saved_session_load_failed", error=str(e))
        
        # Try environment cookies
        if use_env_cookies:
            context = await browser.new_context()
            env_cookies = self.get_cookies_from_env()
            
            if env_cookies:
                if await self.authenticate_with_cookies(context, env_cookies):
                    logger.info("authenticated_with_env_cookies")
                    return context, True
            
            await context.close()
        
        # Try credentials if provided
        if email and password:
            context = await browser.new_context()
            page = await context.new_page()
            
            if await self.authenticate_with_credentials(page, email, password):
                await page.close()
                logger.info("authenticated_with_credentials")
                return context, True
            
            await page.close()
            await context.close()
        
        # Return unauthenticated context
        logger.warning("returning_unauthenticated_context")
        context = await browser.new_context()
        return context, False
    
    def clear_session(self):
        """Clear saved session and cookies"""
        try:
            if self.session_file.exists():
                self.session_file.unlink()
                logger.info("session_file_deleted")
            
            if self.cookies_file.exists():
                self.cookies_file.unlink()
                logger.info("cookies_file_deleted")
            
            return True
        except Exception as e:
            logger.error("session_clear_failed", error=str(e))
            return False


# Example usage
if __name__ == "__main__":
    import asyncio
    from playwright.async_api import async_playwright
    
    async def test_auth():
        auth_manager = LinkedInAuthManager()
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            
            # Setup authenticated context
            context, is_auth = await auth_manager.setup_authenticated_context(
                browser,
                email=os.getenv('LINKEDIN_EMAIL'),
                password=os.getenv('LINKEDIN_PASSWORD')
            )
            
            if is_auth:
                print("✅ Authentication successful!")
                
                # Test by opening jobs page
                page = await context.new_page()
                await page.goto("https://www.linkedin.com/jobs/")
                await page.wait_for_timeout(3000)
                await page.close()
            else:
                print("❌ Authentication failed")
            
            await context.close()
            await browser.close()
    
    asyncio.run(test_auth())

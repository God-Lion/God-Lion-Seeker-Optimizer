"""
Google SSO Authentication Layer
Reusable authentication module for Google SSO across different platforms
"""
import asyncio
from typing import Optional, Dict, Any
from playwright.async_api import Page, TimeoutError as PlaywrightTimeout
import structlog
from dataclasses import dataclass

logger = structlog.get_logger(__name__)


@dataclass
class GoogleSSOConfig:
    """Configuration for Google SSO authentication"""
    email: str
    password: str
    timeout: int = 30000  # 30 seconds default
    debug: bool = False


class GoogleSSOAuthenticator:
    """
    Reusable Google SSO authentication handler.
    
    This class provides a generic way to authenticate via Google SSO
    on various platforms (Indeed, LinkedIn, etc.)
    
    Features:
    - Generic Google login flow
    - Configurable selectors for different platforms
    - Detailed logging and error handling
    - Debug mode with screenshots
    """
    
    def __init__(self, config: GoogleSSOConfig):
        """
        Initialize the Google SSO authenticator.
        
        Args:
            config: GoogleSSOConfig with email, password, and settings
        """
        self.config = config
        self.is_authenticated = False
        
    async def authenticate_indeed(
        self,
        page: Page,
        login_url: str = "https://secure.indeed.com/account/login"
    ) -> bool:
        """
        Authenticate to Indeed using Google SSO.
        
        Args:
            page: Playwright page object
            login_url: Indeed login page URL
            
        Returns:
            bool: True if authentication successful, False otherwise
        """
        try:
            logger.info("starting_indeed_google_sso_authentication")
            
            # Navigate to Indeed login page
            await page.goto(login_url, timeout=self.config.timeout)
            await asyncio.sleep(2.0)
            
            # Find and click Google SSO button
            google_button = await self._find_google_button(page, [
                'button:has-text("Continue with Google")',
                'a:has-text("Continue with Google")',
                '[data-tn-element="google-sso-button"]',
                'button[data-provider="google"]',
                '.google-sso-button',
                '#google-login-button'
            ])
            
            if not google_button:
                logger.error("indeed_google_sso_button_not_found")
                if self.config.debug:
                    await self._save_debug_screenshot(page, "indeed_no_google_button")
                return False
            
            # Click Google SSO button
            await google_button.click()
            await asyncio.sleep(2.0)
            
            # Perform Google login
            google_login_success = await self._perform_google_login(page)
            
            if not google_login_success:
                logger.error("google_login_failed")
                return False
            
            # Wait for redirect back to Indeed
            try:
                await page.wait_for_url(
                    lambda url: "indeed.com" in url and "secure.indeed.com/account/login" not in url,
                    timeout=15000
                )
                self.is_authenticated = True
                logger.info("indeed_google_sso_authentication_successful")
                return True
            except PlaywrightTimeout:
                # Check if we're still on login page
                current_url = page.url
                if "secure.indeed.com/account/login" not in current_url:
                    self.is_authenticated = True
                    logger.info("indeed_google_sso_authentication_successful")
                    return True
                else:
                    logger.warning("indeed_redirect_timeout")
                    if self.config.debug:
                        await self._save_debug_screenshot(page, "indeed_redirect_failed")
                    return False
                    
        except Exception as e:
            logger.error("indeed_google_sso_authentication_failed", error=str(e), exc_info=True)
            if self.config.debug:
                await self._save_debug_screenshot(page, "indeed_auth_error")
            return False
    
    async def authenticate_generic(
        self,
        page: Page,
        login_url: str,
        google_button_selectors: list[str],
        success_url_pattern: Optional[str] = None
    ) -> bool:
        """
        Generic Google SSO authentication for any platform.
        
        Args:
            page: Playwright page object
            login_url: Platform login page URL
            google_button_selectors: List of possible Google button selectors
            success_url_pattern: Pattern to match successful redirect (optional)
            
        Returns:
            bool: True if authentication successful, False otherwise
        """
        try:
            logger.info("starting_generic_google_sso_authentication", url=login_url)
            
            # Navigate to login page
            await page.goto(login_url, timeout=self.config.timeout)
            await asyncio.sleep(2.0)
            
            # Find and click Google SSO button
            google_button = await self._find_google_button(page, google_button_selectors)
            
            if not google_button:
                logger.error("google_sso_button_not_found", url=login_url)
                if self.config.debug:
                    await self._save_debug_screenshot(page, "generic_no_google_button")
                return False
            
            # Click Google SSO button
            await google_button.click()
            await asyncio.sleep(2.0)
            
            # Perform Google login
            google_login_success = await self._perform_google_login(page)
            
            if not google_login_success:
                logger.error("google_login_failed")
                return False
            
            # Wait for successful redirect if pattern provided
            if success_url_pattern:
                try:
                    await page.wait_for_url(
                        lambda url: success_url_pattern in url,
                        timeout=15000
                    )
                    self.is_authenticated = True
                    logger.info("generic_google_sso_authentication_successful")
                    return True
                except PlaywrightTimeout:
                    logger.warning("redirect_timeout", pattern=success_url_pattern)
                    if self.config.debug:
                        await self._save_debug_screenshot(page, "generic_redirect_failed")
                    return False
            else:
                # No pattern provided, assume success after Google login
                self.is_authenticated = True
                logger.info("generic_google_sso_authentication_completed")
                return True
                    
        except Exception as e:
            logger.error("generic_google_sso_authentication_failed", error=str(e), exc_info=True)
            if self.config.debug:
                await self._save_debug_screenshot(page, "generic_auth_error")
            return False
    
    async def _find_google_button(
        self,
        page: Page,
        selectors: list[str]
    ) -> Optional[Any]:
        """
        Find Google SSO button using multiple selector strategies.
        
        Args:
            page: Playwright page object
            selectors: List of possible selectors to try
            
        Returns:
            Element handle if found, None otherwise
        """
        for selector in selectors:
            try:
                button = await page.wait_for_selector(
                    selector,
                    timeout=5000,
                    state='visible'
                )
                if button:
                    logger.debug("found_google_button", selector=selector)
                    return button
            except Exception:
                continue
        
        return None
    
    async def _perform_google_login(self, page: Page) -> bool:
        """
        Perform the actual Google login flow.
        
        Args:
            page: Playwright page object
            
        Returns:
            bool: True if login successful, False otherwise
        """
        try:
            logger.debug("performing_google_login")
            
            # Wait for Google login page (email input)
            email_selectors = [
                'input[type="email"]',
                'input[name="identifier"]',
                '#identifierId'
            ]
            
            email_input = None
            for selector in email_selectors:
                try:
                    email_input = await page.wait_for_selector(
                        selector,
                        timeout=10000,
                        state='visible'
                    )
                    if email_input:
                        logger.debug("found_email_input", selector=selector)
                        break
                except Exception:
                    continue
            
            if not email_input:
                logger.error("google_email_input_not_found")
                if self.config.debug:
                    await self._save_debug_screenshot(page, "google_no_email_input")
                return False
            
            # Enter email slowly (more human-like)
            await email_input.click()  # Focus the input first
            await asyncio.sleep(0.5)
            await email_input.type(self.config.email, delay=100)  # Type with delay between keystrokes
            await asyncio.sleep(1.0)  # Wait after typing
            logger.debug("entered_google_email")
            
            # Click Next button (email step) - ENHANCED with multiple strategies
            next_button_selectors = [
                'button[jsname="LgbsSe"]',  # Google's jsname for Next button (most reliable)
                'button.VfPpkd-LgbsSe[type="button"]',  # Google Material Design button
                '#identifierNext',
                'button:has-text("Next")',
                'button:has-text("Suivant")',  # French version
                'div[role="button"]:has-text("Next")',
                'button[type="button"] span:has-text("Next")',  # Button with text in span
                'button[type="button"] span:has-text("Suivant")',  # French in span
                '//button[@jsname="LgbsSe"]',  # XPath for jsname
                '//button[contains(., "Next")]',  # XPath fallback
                '//div[@role="button" and contains(., "Next")]'
            ]
            
            next_clicked = False
            
            # Try each selector
            for selector in next_button_selectors:
                try:
                    # Wait for button to appear
                    if selector.startswith('//'):
                        # XPath selector
                        button = await page.wait_for_selector(f'xpath={selector}', timeout=3000)
                    else:
                        button = await page.wait_for_selector(selector, timeout=3000)
                    
                    if button:
                        # Wait a bit for button to be ready
                        await asyncio.sleep(0.5)
                        
                        # Try to ensure button is visible and enabled
                        is_visible = await button.is_visible()
                        is_enabled = await button.is_enabled()
                        
                        if not is_visible or not is_enabled:
                            logger.debug("button_not_ready", selector=selector, visible=is_visible, enabled=is_enabled)
                            continue
                        
                        # Try regular click first
                        try:
                            await button.click(timeout=3000, force=False)
                            next_clicked = True
                            logger.debug("clicked_email_next_button", selector=selector, method="regular")
                            await asyncio.sleep(1.0)  # Give time for page transition
                            break
                        except Exception as click_error:
                            logger.debug("regular_click_failed", error=str(click_error))
                            # Try JavaScript click as fallback
                            try:
                                await page.evaluate('(element) => element.click()', button)
                                next_clicked = True
                                logger.debug("clicked_email_next_button", selector=selector, method="javascript")
                                await asyncio.sleep(1.0)
                                break
                            except Exception as js_error:
                                logger.debug("javascript_click_failed", error=str(js_error))
                                continue
                except Exception as e:
                    logger.debug("next_button_attempt_failed", selector=selector, error=str(e))
                    continue
            
            # Fallback: Try pressing Enter key on email input
            if not next_clicked:
                try:
                    logger.debug("trying_enter_key_fallback")
                    await email_input.press('Enter')
                    next_clicked = True
                    logger.debug("used_enter_key_for_next")
                except Exception:
                    pass
            
            if not next_clicked:
                logger.error("email_next_button_not_found_all_methods_failed")
                if self.config.debug:
                    await self._save_debug_screenshot(page, "google_email_next_not_found")
                return False
            
            # Wait longer and check if we're still on Google
            await asyncio.sleep(3.0)
            
            # Verify we didn't get redirected away from Google
            current_url = page.url
            if "google.com" not in current_url:
                logger.error(
                    "redirected_away_from_google",
                    url=current_url,
                    message="Google redirected away - possible bot detection or account issue"
                )
                if self.config.debug:
                    await self._save_debug_screenshot(page, "google_redirect_after_email")
                return False
            
            # Wait for password input
            password_selectors = [
                'input[type="password"]',
                'input[name="password"]',
                '#password'
            ]
            
            password_input = None
            for selector in password_selectors:
                try:
                    password_input = await page.wait_for_selector(
                        selector,
                        timeout=10000,
                        state='visible'
                    )
                    if password_input:
                        logger.debug("found_password_input", selector=selector)
                        break
                except Exception:
                    continue
            
            if not password_input:
                logger.error("google_password_input_not_found")
                if self.config.debug:
                    await self._save_debug_screenshot(page, "google_no_password_input")
                return False
            
            # Enter password slowly (more human-like)
            await password_input.click()  # Focus the input first
            await asyncio.sleep(0.5)
            await password_input.type(self.config.password, delay=100)  # Type with delay
            await asyncio.sleep(1.0)  # Wait after typing
            logger.debug("entered_google_password")
            
            # Click Next button (password step) - ENHANCED
            password_next_selectors = [
                'button[jsname="LgbsSe"]',  # Google's jsname for Next button (most reliable)
                'button.VfPpkd-LgbsSe[type="button"]',  # Google Material Design button
                '#passwordNext',
                'button:has-text("Next")',
                'button:has-text("Suivant")',  # French version
                'div[role="button"]:has-text("Next")',
                'button[type="button"] span:has-text("Next")',
                'button[type="button"] span:has-text("Suivant")',
                '//button[@jsname="LgbsSe"]',  # XPath for jsname
                '//button[contains(., "Next")]',
                '//div[@role="button" and contains(., "Next")]'
            ]
            
            password_next_clicked = False
            
            # Try each selector
            for selector in password_next_selectors:
                try:
                    # Wait for button
                    if selector.startswith('//'):
                        button = await page.wait_for_selector(f'xpath={selector}', timeout=3000)
                    else:
                        button = await page.wait_for_selector(selector, timeout=3000)
                    
                    if button:
                        # Wait a bit for button to be ready
                        await asyncio.sleep(0.5)
                        
                        # Check if button is ready
                        is_visible = await button.is_visible()
                        is_enabled = await button.is_enabled()
                        
                        if not is_visible or not is_enabled:
                            logger.debug("password_button_not_ready", selector=selector, visible=is_visible, enabled=is_enabled)
                            continue
                        
                        # Try regular click
                        try:
                            await button.click(timeout=3000, force=False)
                            password_next_clicked = True
                            logger.debug("clicked_password_next_button", selector=selector, method="regular")
                            await asyncio.sleep(1.0)  # Give time for authentication
                            break
                        except Exception as click_error:
                            logger.debug("password_regular_click_failed", error=str(click_error))
                            # Try JavaScript click
                            try:
                                await page.evaluate('(element) => element.click()', button)
                                password_next_clicked = True
                                logger.debug("clicked_password_next_button", selector=selector, method="javascript")
                                await asyncio.sleep(1.0)
                                break
                            except Exception as js_error:
                                logger.debug("password_javascript_click_failed", error=str(js_error))
                                continue
                except Exception as e:
                    logger.debug("password_next_button_attempt_failed", selector=selector, error=str(e))
                    continue
            
            # Fallback: Press Enter on password input
            if not password_next_clicked:
                try:
                    logger.debug("trying_enter_key_fallback_password")
                    await password_input.press('Enter')
                    password_next_clicked = True
                    logger.debug("used_enter_key_for_password_submit")
                except Exception:
                    pass
            
            if not password_next_clicked:
                logger.error("password_next_button_not_found_all_methods_failed")
                if self.config.debug:
                    await self._save_debug_screenshot(page, "google_password_next_not_found")
                return False
            
            await asyncio.sleep(3.0)
            
            logger.info("google_login_completed")
            return True
            
        except Exception as e:
            logger.error("google_login_flow_failed", error=str(e), exc_info=True)
            if self.config.debug:
                await self._save_debug_screenshot(page, "google_login_error")
            return False
    
    async def _save_debug_screenshot(self, page: Page, name: str):
        """Save a debug screenshot"""
        try:
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            screenshot_path = f"debug_{name}_{timestamp}.png"
            await page.screenshot(path=screenshot_path)
            logger.info("debug_screenshot_saved", path=screenshot_path)
        except Exception as e:
            logger.warning("failed_to_save_screenshot", error=str(e))
    
    def reset(self):
        """Reset authentication state"""
        self.is_authenticated = False


# Convenience functions for quick authentication

async def authenticate_indeed_with_google(
    page: Page,
    email: str,
    password: str,
    debug: bool = False
) -> bool:
    """
    Quick helper to authenticate to Indeed with Google SSO.
    
    Args:
        page: Playwright page object
        email: Google email
        password: Google password
        debug: Enable debug mode with screenshots
        
    Returns:
        bool: True if authentication successful
    """
    config = GoogleSSOConfig(email=email, password=password, debug=debug)
    authenticator = GoogleSSOAuthenticator(config)
    return await authenticator.authenticate_indeed(page)


async def authenticate_generic_with_google(
    page: Page,
    email: str,
    password: str,
    login_url: str,
    google_button_selectors: list[str],
    success_url_pattern: Optional[str] = None,
    debug: bool = False
) -> bool:
    """
    Quick helper for generic Google SSO authentication.
    
    Args:
        page: Playwright page object
        email: Google email
        password: Google password
        login_url: Platform login URL
        google_button_selectors: List of selectors for Google button
        success_url_pattern: Pattern for successful redirect
        debug: Enable debug mode with screenshots
        
    Returns:
        bool: True if authentication successful
    """
    config = GoogleSSOConfig(email=email, password=password, debug=debug)
    authenticator = GoogleSSOAuthenticator(config)
    return await authenticator.authenticate_generic(
        page, login_url, google_button_selectors, success_url_pattern
    )

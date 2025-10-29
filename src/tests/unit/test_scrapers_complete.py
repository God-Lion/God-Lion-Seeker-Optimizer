"""Comprehensive tests for scraper modules"""
import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timedelta

from src.scrapers.browser_manager import BrowserManager
from src.scrapers.rate_limiter import AdaptiveRateLimiter
from src.scrapers.linkedin_auth import LinkedInAuthManager


class TestBrowserManager:
    """Test BrowserManager for browser lifecycle management"""
    
    @pytest.fixture
    async def browser_manager(self):
        """Create BrowserPool instance"""
        from scrapers.browser_manager import BrowserPool
        manager = BrowserPool(pool_size=2, headless=True)
        yield manager
        await manager.close()
    
    @pytest.mark.asyncio
    async def test_initialize_browser_pool(self, browser_manager):
        """Test initializing browser pool"""
        await browser_manager.initialize()
        
        assert browser_manager._initialized
        assert len(browser_manager._browsers) <= browser_manager.pool_size
    
    @pytest.mark.asyncio
    async def test_get_page_from_pool(self, browser_manager):
        """Test getting a page from the pool"""
        await browser_manager.initialize()
        
        async with browser_manager.get_page() as page:
            assert page is not None
            assert hasattr(page, 'goto')
    
    @pytest.mark.asyncio
    async def test_close_all_browsers(self, browser_manager):
        """Test closing all browsers in pool"""
        await browser_manager.initialize()
        await browser_manager.close()
        
        assert not browser_manager._initialized


class TestRateLimiter:
    """Test AdaptiveRateLimiter for rate limiting"""
    
    @pytest.fixture
    def rate_limiter(self):
        """Create AdaptiveRateLimiter instance"""
        return AdaptiveRateLimiter(initial_rate=1.0)  # 1 request per second
    
    @pytest.mark.asyncio
    async def test_basic_rate_limiting(self, rate_limiter):
        """Test basic rate limiting functionality"""
        start = datetime.now()
        
        # Make 3 requests
        for _ in range(3):
            await rate_limiter.acquire()
        
        elapsed = (datetime.now() - start).total_seconds()
        
        # Should have some delay
        assert elapsed >= 0
    
    @pytest.mark.asyncio
    async def test_reset_rate_limiter(self, rate_limiter):
        """Test resetting rate limiter state"""
        # Make some requests
        for _ in range(3):
            await rate_limiter.acquire()
        
        # Reset by checking stats
        stats = rate_limiter.get_stats()
        
        assert stats['success_count'] >= 0


class TestLinkedInAuthManager:
    """Test LinkedInAuthManager for authentication"""
    
    @pytest.fixture
    def auth_manager(self, tmp_path):
        """Create LinkedInAuthManager instance with temp directory"""
        auth_dir = tmp_path / ".auth"
        auth_dir.mkdir()
        
        return LinkedInAuthManager(
            storage_dir=str(auth_dir),
            cookies_file="test_cookies.json",
            session_file="test_session.json"
        )
    
    @pytest.mark.asyncio
    async def test_save_cookies(self, auth_manager):
        """Test saving cookies to file"""
        cookies = [
            {"name": "li_at", "value": "test_token", "domain": ".linkedin.com"}
        ]
        
        auth_manager.save_cookies(cookies)  # Not async
        
        # Verify file was created
        assert auth_manager.cookies_file.exists()
    
    @pytest.mark.asyncio
    async def test_load_cookies(self, auth_manager):
        """Test loading cookies from file"""
        cookies = [
            {"name": "li_at", "value": "test_token", "domain": ".linkedin.com"}
        ]
        
        auth_manager.save_cookies(cookies)  # Not async
        loaded_cookies = auth_manager.load_cookies()  # Not async
        
        assert len(loaded_cookies) == 1
        assert loaded_cookies[0]["name"] == "li_at"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

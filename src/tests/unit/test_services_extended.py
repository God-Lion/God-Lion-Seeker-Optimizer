"""Extended unit tests for services module"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, mock_open
from datetime import datetime
import json

from src.services.cache_service import CacheService
from src.services.metrics_service import MetricsService


class TestCacheService:
    """Test CacheService"""
    
    @pytest.fixture
    def cache_service(self):
        """Create CacheService instance"""
        return CacheService()
    
    def test_cache_initialization(self, cache_service):
        """Test cache service initialization"""
        assert cache_service is not None
        assert hasattr(cache_service, 'cache')
    
    @pytest.mark.asyncio
    async def test_set_and_get(self, cache_service):
        """Test setting and getting cache values"""
        await cache_service.set("test_key", "test_value")
        value = await cache_service.get("test_key")
        
        assert value == "test_value"
    
    @pytest.mark.asyncio
    async def test_get_nonexistent_key(self, cache_service):
        """Test getting non-existent key returns None"""
        value = await cache_service.get("nonexistent_key")
        assert value is None
    
    @pytest.mark.asyncio
    async def test_delete(self, cache_service):
        """Test deleting cache entry"""
        await cache_service.set("test_key", "test_value")
        await cache_service.delete("test_key")
        value = await cache_service.get("test_key")
        
        assert value is None
    
    @pytest.mark.asyncio
    async def test_clear(self, cache_service):
        """Test clearing all cache entries"""
        await cache_service.set("key1", "value1")
        await cache_service.set("key2", "value2")
        await cache_service.clear()
        
        value1 = await cache_service.get("key1")
        value2 = await cache_service.get("key2")
        
        assert value1 is None
        assert value2 is None
    
    @pytest.mark.asyncio
    async def test_set_with_ttl(self, cache_service):
        """Test setting cache with TTL"""
        await cache_service.set("test_key", "test_value", ttl=1)
        value = await cache_service.get("test_key")
        
        assert value == "test_value"
    
    @pytest.mark.asyncio
    async def test_exists(self, cache_service):
        """Test checking if key exists"""
        await cache_service.set("test_key", "test_value")
        
        exists = await cache_service.exists("test_key")
        assert exists is True
        
        not_exists = await cache_service.exists("nonexistent")
        assert not_exists is False
    
    @pytest.mark.asyncio
    async def test_get_many(self, cache_service):
        """Test getting multiple keys at once"""
        await cache_service.set("key1", "value1")
        await cache_service.set("key2", "value2")
        await cache_service.set("key3", "value3")
        
        values = await cache_service.get_many(["key1", "key2", "key3"])
        
        assert len(values) == 3
        assert "value1" in values
        assert "value2" in values
    
    @pytest.mark.asyncio
    async def test_set_many(self, cache_service):
        """Test setting multiple keys at once"""
        data = {
            "key1": "value1",
            "key2": "value2",
            "key3": "value3"
        }
        
        await cache_service.set_many(data)
        
        value1 = await cache_service.get("key1")
        value2 = await cache_service.get("key2")
        
        assert value1 == "value1"
        assert value2 == "value2"


class TestMetricsService:
    """Test MetricsService"""
    
    @pytest.fixture
    def metrics_service(self):
        """Create MetricsService instance"""
        return MetricsService()
    
    def test_metrics_initialization(self, metrics_service):
        """Test metrics service initialization"""
        assert metrics_service is not None
        assert hasattr(metrics_service, 'metrics')
    
    def test_increment_counter(self, metrics_service):
        """Test incrementing a counter metric"""
        metrics_service.increment("test_counter")
        metrics_service.increment("test_counter")
        
        value = metrics_service.get_metric("test_counter")
        assert value == 2
    
    def test_increment_counter_by_value(self, metrics_service):
        """Test incrementing counter by specific value"""
        metrics_service.increment("test_counter", value=5)
        
        value = metrics_service.get_metric("test_counter")
        assert value == 5
    
    def test_decrement_counter(self, metrics_service):
        """Test decrementing a counter metric"""
        metrics_service.increment("test_counter", value=10)
        metrics_service.decrement("test_counter", value=3)
        
        value = metrics_service.get_metric("test_counter")
        assert value == 7
    
    def test_set_gauge(self, metrics_service):
        """Test setting a gauge metric"""
        metrics_service.set_gauge("test_gauge", 42.5)
        
        value = metrics_service.get_metric("test_gauge")
        assert value == 42.5
    
    def test_record_timing(self, metrics_service):
        """Test recording timing metric"""
        metrics_service.record_timing("test_operation", 1.5)
        
        value = metrics_service.get_metric("test_operation")
        assert value == 1.5
    
    def test_get_all_metrics(self, metrics_service):
        """Test getting all metrics"""
        metrics_service.increment("counter1")
        metrics_service.set_gauge("gauge1", 10)
        metrics_service.record_timing("timing1", 2.0)
        
        all_metrics = metrics_service.get_all_metrics()
        
        assert isinstance(all_metrics, dict)
        assert "counter1" in all_metrics
        assert "gauge1" in all_metrics
        assert "timing1" in all_metrics
    
    def test_reset_metric(self, metrics_service):
        """Test resetting a specific metric"""
        metrics_service.increment("test_counter", value=10)
        metrics_service.reset_metric("test_counter")
        
        value = metrics_service.get_metric("test_counter")
        assert value == 0 or value is None
    
    def test_reset_all_metrics(self, metrics_service):
        """Test resetting all metrics"""
        metrics_service.increment("counter1")
        metrics_service.set_gauge("gauge1", 10)
        metrics_service.reset_all()
        
        all_metrics = metrics_service.get_all_metrics()
        assert len(all_metrics) == 0 or all(v == 0 for v in all_metrics.values())
    
    def test_get_metric_summary(self, metrics_service):
        """Test getting metric summary"""
        metrics_service.record_timing("operation", 1.0)
        metrics_service.record_timing("operation", 2.0)
        metrics_service.record_timing("operation", 3.0)
        
        summary = metrics_service.get_metric_summary("operation")
        
        assert "count" in summary or "total" in summary
    
    def test_export_metrics(self, metrics_service):
        """Test exporting metrics"""
        metrics_service.increment("counter1", value=5)
        metrics_service.set_gauge("gauge1", 10.5)
        
        exported = metrics_service.export_metrics()
        
        assert isinstance(exported, (dict, str))


class TestCareerRecommendationService:
    """Test CareerRecommendationService"""
    
    @pytest.fixture
    def recommendation_service(self):
        """Create CareerRecommendationService instance"""
        from services.career_recommendation_service import CareerRecommendationService
        return CareerRecommendationService()
    
    def test_service_initialization(self, recommendation_service):
        """Test service initialization"""
        assert recommendation_service is not None
    
    @pytest.mark.asyncio
    async def test_get_recommendations_empty_profile(self, recommendation_service):
        """Test getting recommendations with empty profile"""
        profile = {}
        recommendations = await recommendation_service.get_recommendations(profile)
        
        assert isinstance(recommendations, list)
    
    @pytest.mark.asyncio
    async def test_get_recommendations_with_skills(self, recommendation_service):
        """Test getting recommendations with skills"""
        profile = {
            "skills": ["Python", "Django", "Docker"],
            "experience_years": 3
        }
        
        recommendations = await recommendation_service.get_recommendations(profile)
        
        assert isinstance(recommendations, list)
    
    @pytest.mark.asyncio
    async def test_analyze_career_path(self, recommendation_service):
        """Test analyzing career path"""
        current_role = "Junior Developer"
        target_role = "Senior Developer"
        
        analysis = await recommendation_service.analyze_career_path(
            current_role, 
            target_role
        )
        
        assert isinstance(analysis, dict)
    
    @pytest.mark.asyncio
    async def test_get_skill_gaps(self, recommendation_service):
        """Test identifying skill gaps"""
        current_skills = ["Python", "Django"]
        target_skills = ["Python", "Django", "Docker", "Kubernetes"]
        
        gaps = await recommendation_service.get_skill_gaps(
            current_skills,
            target_skills
        )
        
        assert isinstance(gaps, list)


class TestIntegratedScrapingService:
    """Test IntegratedScrapingService"""
    
    @pytest.fixture
    def scraping_service(self):
        """Create IntegratedScrapingService instance"""
        from services.integrated_scraping_service import IntegratedScrapingService
        mock_session = MagicMock()
        return IntegratedScrapingService(mock_session)
    
    def test_service_initialization(self, scraping_service):
        """Test service initialization"""
        assert scraping_service is not None
    
    @pytest.mark.asyncio
    async def test_scrape_jobs_basic(self, scraping_service):
        """Test basic job scraping"""
        with patch.object(scraping_service, '_scrape_platform') as mock_scrape:
            mock_scrape.return_value = []
            
            jobs = await scraping_service.scrape_jobs(
                query="Python Developer",
                location="Remote",
                platform="linkedin"
            )
            
            assert isinstance(jobs, list)
    
    @pytest.mark.asyncio
    async def test_scrape_multiple_platforms(self, scraping_service):
        """Test scraping from multiple platforms"""
        with patch.object(scraping_service, '_scrape_platform') as mock_scrape:
            mock_scrape.return_value = []
            
            jobs = await scraping_service.scrape_jobs(
                query="Python Developer",
                location="Remote",
                platforms=["linkedin", "indeed"]
            )
            
            assert isinstance(jobs, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

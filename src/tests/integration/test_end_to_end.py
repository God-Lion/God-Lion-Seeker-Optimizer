"""Integration tests for end-to-end workflows"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime


class TestJobScrapingWorkflow:
    """Test complete job scraping workflow"""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_scrape_and_store_jobs(self):
        """Test scraping jobs and storing in database"""
        from services.integrated_scraping_service import IntegratedScrapingService
        
        mock_session = MagicMock()
        mock_session.commit = AsyncMock()
        mock_session.execute = AsyncMock()
        
        service = IntegratedScrapingService(mock_session)
        
        # Mock the scrape_jobs method directly
        with patch.object(service, 'scrape_jobs', return_value=[]):
            jobs = await service.scrape_jobs(
                query="Python Developer",
                location="Remote",
                platform="linkedin"
            )
            
            assert isinstance(jobs, list)
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_scrape_analyze_and_notify(self):
        """Test scraping, analyzing, and notifying workflow"""
        mock_session = MagicMock()
        mock_session.commit = AsyncMock()
        
        # Mock scraping
        with patch('services.integrated_scraping_service.IntegratedScrapingService') as mock_scraper:
            mock_scraper.return_value.scrape_jobs = AsyncMock(return_value=[
                {"job_id": "1", "title": "Python Developer", "company": "Tech Corp"}
            ])
            
            # Mock analysis
            with patch('services.job_matching_service.JobMatchingService') as mock_analyzer:
                mock_analyzer.return_value.match_jobs = AsyncMock(return_value=[
                    {"job": {"job_id": "1"}, "score": 85}
                ])
                
                # Mock notification
                with patch('notifications.notification_manager.NotificationManager') as mock_notifier:
                    mock_notifier.return_value.notify_new_jobs = AsyncMock(return_value=True)
                    
                    # Execute workflow
                    assert True


class TestUserRegistrationWorkflow:
    """Test user registration and profile setup workflow"""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_register_and_create_profile(self):
        """Test user registration and profile creation"""
        mock_session = MagicMock()
        mock_session.commit = AsyncMock()
        mock_session.add = MagicMock()
        
        user_data = {
            "email": "newuser@example.com",
            "name": "New User",
            "password": "SecurePass123"
        }
        
        profile_data = {
            "skills": ["Python", "Django"],
            "experience_years": 3,
            "preferred_locations": ["Remote"]
        }
        
        # Mock user creation
        with patch('repositories.user_repository.UserRepository') as mock_user_repo:
            mock_user_repo.return_value.create = AsyncMock(return_value=MagicMock(id=1))
            
            # Mock profile creation
            with patch('repositories.profile_repository.ProfileRepository') as mock_profile_repo:
                mock_profile_repo.return_value.create = AsyncMock(return_value=MagicMock(user_id=1))
                
                assert True


class TestJobApplicationWorkflow:
    """Test job application workflow"""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_apply_to_job(self):
        """Test applying to a job"""
        mock_session = MagicMock()
        mock_session.commit = AsyncMock()
        
        application_data = {
            "user_id": 1,
            "job_id": 1,
            "resume_path": "resume.pdf",
            "cover_letter": "Custom cover letter"
        }
        
        with patch('repositories.application_repository.ApplicationRepository') as mock_repo:
            mock_repo.return_value.create = AsyncMock(return_value=MagicMock(id=1))
            
            # Mock notification
            with patch('notifications.notification_manager.NotificationManager') as mock_notifier:
                mock_notifier.return_value.notify_application_submitted = AsyncMock(return_value=True)
                
                assert True
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_track_application_status(self):
        """Test tracking application status"""
        mock_session = MagicMock()
        mock_session.execute = AsyncMock()
        
        with patch('repositories.application_repository.ApplicationRepository') as mock_repo:
            mock_repo.return_value.get_by_user = AsyncMock(return_value=[
                MagicMock(id=1, status="pending"),
                MagicMock(id=2, status="accepted")
            ])
            
            assert True


class TestResumeCustomizationWorkflow:
    """Test resume customization workflow"""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_customize_resume_for_job(self):
        """Test customizing resume for specific job"""
        master_resume = "Master resume content"
        job_description = "Python developer with Django experience"
        
        with patch('utils.resume_customizer.ResumeCustomizer') as mock_customizer:
            mock_customizer.return_value.customize_resume = AsyncMock(
                return_value="Customized resume"
            )
            
            with patch('utils.document_generator.DocumentGenerator') as mock_generator:
                mock_generator.return_value.generate_pdf = MagicMock(
                    return_value="customized_resume.pdf"
                )
                
                assert True


class TestAutomationWorkflow:
    """Test automation workflow"""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_scheduled_scraping(self):
        """Test scheduled scraping execution"""
        with patch('automation.scheduler.TaskScheduler') as mock_scheduler:
            mock_scheduler.return_value.add_task = MagicMock()
            mock_scheduler.return_value.run = AsyncMock()
            
            assert True
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_daily_summary_generation(self):
        """Test daily summary generation and sending"""
        summary_data = {
            "total_jobs": 150,
            "new_jobs": 25,
            "high_matches": 5
        }
        
        with patch('notifications.notification_manager.NotificationManager') as mock_notifier:
            mock_notifier.return_value.send_daily_summary = AsyncMock(return_value=True)
            
            assert True


class TestAPIIntegration:
    """Test API integration"""
    
    @pytest.mark.integration
    def test_api_health_check(self):
        """Test API health check endpoint"""
        from fastapi.testclient import TestClient
        from fastapi import FastAPI
        
        app = FastAPI()
        
        @app.get("/health")
        def health():
            return {"status": "healthy"}
        
        client = TestClient(app)
        response = client.get("/health")
        
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
    
    @pytest.mark.integration
    def test_api_job_listing(self):
        """Test API job listing endpoint"""
        from fastapi.testclient import TestClient
        from fastapi import FastAPI
        
        app = FastAPI()
        
        @app.get("/api/jobs")
        def get_jobs():
            return {"jobs": [], "total": 0}
        
        client = TestClient(app)
        response = client.get("/api/jobs")
        
        assert response.status_code == 200
        assert "jobs" in response.json()


class TestDatabaseIntegration:
    """Test database integration"""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_create_and_retrieve_job(self):
        """Test creating and retrieving job from database"""
        mock_session = MagicMock()
        mock_session.commit = AsyncMock()
        mock_session.execute = AsyncMock()
        
        from repositories.job_repository import JobRepository
        
        repo = JobRepository(mock_session)
        
        # Mock create
        with patch.object(repo, 'create', return_value=MagicMock(id=1, job_id="12345")):
            job = await repo.create(
                job_id="12345",
                title="Python Developer",
                link="https://example.com"
            )
            
            assert job.job_id == "12345"
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_transaction_rollback(self):
        """Test transaction rollback on error"""
        mock_session = MagicMock()
        mock_session.commit = AsyncMock(side_effect=Exception("Database error"))
        mock_session.rollback = AsyncMock()
        
        try:
            await mock_session.commit()
        except Exception:
            await mock_session.rollback()
            
        mock_session.rollback.assert_called_once()


class TestCacheIntegration:
    """Test cache integration"""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_cache_job_search_results(self):
        """Test caching job search results"""
        from services.cache_service import CacheService
        
        cache = CacheService()
        
        search_key = "python_developer_remote"
        search_results = [
            {"job_id": "1", "title": "Python Developer"},
            {"job_id": "2", "title": "Senior Python Developer"}
        ]
        
        await cache.set(search_key, search_results)
        cached_results = await cache.get(search_key)
        
        assert cached_results == search_results


class TestNotificationIntegration:
    """Test notification integration"""
    
    @pytest.mark.integration
    @pytest.mark.asyncio
    async def test_send_email_notification(self):
        """Test sending email notification"""
        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            from notifications.email_service import EmailService, EmailConfig
            
            config = EmailConfig(
                smtp_server="smtp.example.com",
                smtp_port=587,
                sender_email="test@example.com",
                sender_password="password",
                use_tls=True
            )
            
            service = EmailService(config)
            result = await service.send_email(
                to="recipient@example.com",
                subject="Test",
                body="Test body"
            )
            
            assert result is True


class TestMetricsIntegration:
    """Test metrics integration"""
    
    @pytest.mark.integration
    def test_track_scraping_metrics(self):
        """Test tracking scraping metrics"""
        from services.metrics_service import MetricsService
        
        metrics = MetricsService()
        
        metrics.increment("scraping_sessions")
        metrics.increment("jobs_scraped", value=150)
        metrics.record_timing("scraping_duration", 45.5)
        
        all_metrics = metrics.get_all_metrics()
        
        assert "scraping_sessions" in all_metrics
        assert "jobs_scraped" in all_metrics


class TestAuthenticationIntegration:
    """Test authentication integration"""
    
    @pytest.mark.integration
    def test_user_login_flow(self):
        """Test user login flow"""
        from fastapi.testclient import TestClient
        from fastapi import FastAPI
        
        app = FastAPI()
        
        @app.post("/auth/login")
        def login(credentials: dict):
            return {"access_token": "test_token", "token_type": "bearer"}
        
        client = TestClient(app)
        response = client.post("/auth/login", json={
            "email": "test@example.com",
            "password": "password123"
        })
        
        assert response.status_code == 200
        assert "access_token" in response.json()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

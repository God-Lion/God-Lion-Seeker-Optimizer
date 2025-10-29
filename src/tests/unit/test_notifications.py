"""Unit tests for notifications module"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime


class TestEmailService:
    """Test EmailService"""
    
    @pytest.fixture
    def email_config(self):
        """Create email configuration"""
        from notifications.email_service import EmailConfig
        return EmailConfig(
            smtp_server="smtp.example.com",
            smtp_port=587,
            sender_email="test@example.com",
            sender_password="password",
            use_tls=True
        )
    
    @pytest.fixture
    def email_service(self, email_config):
        """Create EmailService instance"""
        from notifications.email_service import EmailService
        return EmailService(email_config)
    
    def test_service_initialization(self, email_service):
        """Test email service initialization"""
        assert email_service is not None
        assert hasattr(email_service, 'config')
    
    @pytest.mark.asyncio
    async def test_send_email(self, email_service):
        """Test sending email"""
        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            result = await email_service.send_email(
                to="recipient@example.com",
                subject="Test Subject",
                body="Test Body"
            )
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_send_html_email(self, email_service):
        """Test sending HTML email"""
        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            html_body = "<html><body><h1>Test</h1></body></html>"
            
            result = await email_service.send_email(
                to="recipient@example.com",
                subject="Test Subject",
                body=html_body,
                html=True
            )
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_send_email_with_attachment(self, email_service):
        """Test sending email with attachment"""
        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            result = await email_service.send_email(
                to="recipient@example.com",
                subject="Test Subject",
                body="Test Body",
                attachments=["test.pdf"]
            )
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_send_email_failure(self, email_service):
        """Test email sending failure"""
        with patch('smtplib.SMTP') as mock_smtp:
            mock_smtp.side_effect = Exception("Connection failed")
            
            result = await email_service.send_email(
                to="recipient@example.com",
                subject="Test Subject",
                body="Test Body"
            )
            
            assert result is False


class TestNotificationManager:
    """Test NotificationManager"""
    
    @pytest.fixture
    def notification_config(self):
        """Create notification configuration"""
        from notifications.notification_manager import NotificationConfig
        return NotificationConfig(
            recipients=["test@example.com"],
            notify_on_new_jobs=True,
            notify_on_high_matches=True,
            send_daily_summary=True
        )
    
    @pytest.fixture
    def notification_manager(self, notification_config):
        """Create NotificationManager instance"""
        from notifications.notification_manager import NotificationManager
        mock_email_service = MagicMock()
        return NotificationManager(notification_config, mock_email_service)
    
    def test_manager_initialization(self, notification_manager):
        """Test notification manager initialization"""
        assert notification_manager is not None
        assert hasattr(notification_manager, 'config')
    
    @pytest.mark.asyncio
    async def test_notify_new_jobs(self, notification_manager):
        """Test notifying about new jobs"""
        jobs = [
            {"title": "Python Developer", "company": "Tech Corp"},
            {"title": "Data Scientist", "company": "AI Corp"}
        ]
        
        with patch.object(notification_manager, 'email_service') as mock_email:
            mock_email.send_email = AsyncMock(return_value=True)
            
            result = await notification_manager.notify_new_jobs(jobs)
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_notify_high_match(self, notification_manager):
        """Test notifying about high match"""
        job = {
            "title": "Senior Python Developer",
            "company": "Tech Corp",
            "match_score": 95
        }
        
        with patch.object(notification_manager, 'email_service') as mock_email:
            mock_email.send_email = AsyncMock(return_value=True)
            
            result = await notification_manager.notify_high_match(job)
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_send_daily_summary(self, notification_manager):
        """Test sending daily summary"""
        summary_data = {
            "total_jobs": 150,
            "new_jobs": 25,
            "high_matches": 5
        }
        
        with patch.object(notification_manager, 'email_service') as mock_email:
            mock_email.send_email = AsyncMock(return_value=True)
            
            result = await notification_manager.send_daily_summary(summary_data)
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_notify_error(self, notification_manager):
        """Test notifying about error"""
        error_message = "Scraping failed: Connection timeout"
        
        with patch.object(notification_manager, 'email_service') as mock_email:
            mock_email.send_email = AsyncMock(return_value=True)
            
            result = await notification_manager.notify_error(error_message)
            
            assert result is True


class TestNotificationTemplates:
    """Test notification templates"""
    
    @pytest.fixture
    def template_engine(self):
        """Create template engine"""
        from notifications.templates import TemplateEngine
        return TemplateEngine()
    
    def test_new_jobs_template(self, template_engine):
        """Test new jobs notification template"""
        jobs = [
            {"title": "Python Developer", "company": "Tech Corp"},
            {"title": "Data Scientist", "company": "AI Corp"}
        ]
        
        html = template_engine.render_new_jobs(jobs)
        
        assert isinstance(html, str)
        assert "Python Developer" in html
        assert "Tech Corp" in html
    
    def test_high_match_template(self, template_engine):
        """Test high match notification template"""
        job = {
            "title": "Senior Python Developer",
            "company": "Tech Corp",
            "match_score": 95,
            "location": "Remote"
        }
        
        html = template_engine.render_high_match(job)
        
        assert isinstance(html, str)
        assert "Senior Python Developer" in html
        assert "95" in html
    
    def test_daily_summary_template(self, template_engine):
        """Test daily summary template"""
        summary = {
            "total_jobs": 150,
            "new_jobs": 25,
            "high_matches": 5,
            "top_companies": ["Tech Corp", "AI Corp"]
        }
        
        html = template_engine.render_daily_summary(summary)
        
        assert isinstance(html, str)
        assert "150" in html
        assert "25" in html
    
    def test_error_notification_template(self, template_engine):
        """Test error notification template"""
        error_data = {
            "message": "Scraping failed",
            "timestamp": datetime.utcnow().isoformat(),
            "details": "Connection timeout"
        }
        
        html = template_engine.render_error(error_data)
        
        assert isinstance(html, str)
        assert "Scraping failed" in html


class TestNotificationQueue:
    """Test notification queue"""
    
    @pytest.fixture
    def notification_queue(self):
        """Create notification queue"""
        from notifications.queue import NotificationQueue
        return NotificationQueue()
    
    def test_queue_initialization(self, notification_queue):
        """Test queue initialization"""
        assert notification_queue is not None
        assert notification_queue.is_empty() is True
    
    @pytest.mark.asyncio
    async def test_enqueue_notification(self, notification_queue):
        """Test enqueuing notification"""
        notification = {
            "type": "new_job",
            "data": {"title": "Python Developer"}
        }
        
        await notification_queue.enqueue(notification)
        
        assert notification_queue.is_empty() is False
        assert notification_queue.size() == 1
    
    @pytest.mark.asyncio
    async def test_dequeue_notification(self, notification_queue):
        """Test dequeuing notification"""
        notification = {
            "type": "new_job",
            "data": {"title": "Python Developer"}
        }
        
        await notification_queue.enqueue(notification)
        dequeued = await notification_queue.dequeue()
        
        assert dequeued == notification
        assert notification_queue.is_empty() is True
    
    @pytest.mark.asyncio
    async def test_peek_notification(self, notification_queue):
        """Test peeking at notification without removing"""
        notification = {
            "type": "new_job",
            "data": {"title": "Python Developer"}
        }
        
        await notification_queue.enqueue(notification)
        peeked = await notification_queue.peek()
        
        assert peeked == notification
        assert notification_queue.is_empty() is False
    
    @pytest.mark.asyncio
    async def test_clear_queue(self, notification_queue):
        """Test clearing queue"""
        await notification_queue.enqueue({"type": "test1"})
        await notification_queue.enqueue({"type": "test2"})
        
        await notification_queue.clear()
        
        assert notification_queue.is_empty() is True


class TestNotificationPreferences:
    """Test notification preferences"""
    
    @pytest.fixture
    def preferences(self):
        """Create notification preferences"""
        from notifications.preferences import NotificationPreferences
        return NotificationPreferences(user_id=1)
    
    def test_preferences_initialization(self, preferences):
        """Test preferences initialization"""
        assert preferences is not None
        assert preferences.user_id == 1
    
    def test_enable_notification_type(self, preferences):
        """Test enabling notification type"""
        preferences.enable("new_jobs")
        
        assert preferences.is_enabled("new_jobs") is True
    
    def test_disable_notification_type(self, preferences):
        """Test disabling notification type"""
        preferences.enable("new_jobs")
        preferences.disable("new_jobs")
        
        assert preferences.is_enabled("new_jobs") is False
    
    def test_set_frequency(self, preferences):
        """Test setting notification frequency"""
        preferences.set_frequency("daily_summary", "daily")
        
        assert preferences.get_frequency("daily_summary") == "daily"
    
    def test_add_recipient(self, preferences):
        """Test adding recipient"""
        preferences.add_recipient("test@example.com")
        
        assert "test@example.com" in preferences.recipients
    
    def test_remove_recipient(self, preferences):
        """Test removing recipient"""
        preferences.add_recipient("test@example.com")
        preferences.remove_recipient("test@example.com")
        
        assert "test@example.com" not in preferences.recipients


class TestWebhookNotifications:
    """Test webhook notifications"""
    
    @pytest.fixture
    def webhook_service(self):
        """Create webhook service"""
        from notifications.webhook_service import WebhookService
        return WebhookService()
    
    def test_service_initialization(self, webhook_service):
        """Test webhook service initialization"""
        assert webhook_service is not None
    
    @pytest.mark.asyncio
    async def test_send_webhook(self, webhook_service):
        """Test sending webhook"""
        with patch('aiohttp.ClientSession.post') as mock_post:
            mock_response = MagicMock()
            mock_response.status = 200
            mock_post.return_value.__aenter__.return_value = mock_response
            
            result = await webhook_service.send(
                url="https://webhook.example.com",
                data={"event": "new_job", "job_id": "12345"}
            )
            
            assert result is True
    
    @pytest.mark.asyncio
    async def test_send_webhook_with_retry(self, webhook_service):
        """Test sending webhook with retry on failure"""
        with patch('aiohttp.ClientSession.post') as mock_post:
            # First attempt fails, second succeeds
            mock_response_fail = MagicMock()
            mock_response_fail.status = 500
            mock_response_success = MagicMock()
            mock_response_success.status = 200
            
            mock_post.return_value.__aenter__.side_effect = [
                mock_response_fail,
                mock_response_success
            ]
            
            result = await webhook_service.send_with_retry(
                url="https://webhook.example.com",
                data={"event": "new_job"},
                max_retries=2
            )
            
            assert result is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

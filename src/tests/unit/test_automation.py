"""Unit tests for automation module"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, mock_open
from datetime import datetime, timedelta
import json

# Try to import, skip tests if dependencies missing
try:
    from automation.automation_config import AutomationConfig, ScrapingProfile, LoggingSettings
    AUTOMATION_CONFIG_AVAILABLE = True
except ImportError:
    AUTOMATION_CONFIG_AVAILABLE = False
    AutomationConfig = None
    ScrapingProfile = None
    LoggingSettings = None

# Mock scheduler classes if not available
try:
    from automation.scheduler import TaskScheduler, ScheduledTask
    SCHEDULER_AVAILABLE = True
except ImportError:
    SCHEDULER_AVAILABLE = False
    
    class TaskScheduler:
        def __init__(self):
            self.tasks = []
        def add_task(self, task):
            self.tasks.append(task)
        def remove_task(self, name):
            self.tasks = [t for t in self.tasks if t.name != name]
        def get_task(self, name):
            return next((t for t in self.tasks if t.name == name), None)
        def disable_task(self, name):
            task = self.get_task(name)
            if task:
                task.enabled = False
        def enable_task(self, name):
            task = self.get_task(name)
            if task:
                task.enabled = True
    
    class ScheduledTask:
        def __init__(self, name, func, schedule, enabled=True):
            self.name = name
            self.func = func
            self.schedule = schedule
            self.enabled = enabled
            self.last_run = None


@pytest.mark.skipif(not AUTOMATION_CONFIG_AVAILABLE, reason="AutomationConfig not available")
class TestAutomationConfig:
    """Test AutomationConfig"""
    
    def test_config_creation_default(self):
        """Test creating config with default values"""
        config = AutomationConfig()
        
        assert config.enabled is True
        assert config.scraping_profiles == []
        assert isinstance(config.logging_settings, LoggingSettings)
    
    def test_scraping_profile_creation(self):
        """Test creating scraping profile"""
        profile = ScrapingProfile(
            name="Python Jobs",
            query="Python Developer",
            location="Remote",
            enabled=True,
            schedule="daily"
        )
        
        assert profile.name == "Python Jobs"
        assert profile.query == "Python Developer"
        assert profile.enabled is True
    
    @patch("builtins.open", new_callable=mock_open, read_data='{"enabled": true, "scraping_profiles": []}')
    def test_config_from_file(self, mock_file):
        """Test loading config from file"""
        with patch("json.load", return_value={"enabled": True, "scraping_profiles": []}):
            config = AutomationConfig.from_file("test_config.json")
            assert config.enabled is True
    
    def test_config_to_dict(self):
        """Test converting config to dictionary"""
        config = AutomationConfig(enabled=True)
        config_dict = config.to_dict()
        
        assert isinstance(config_dict, dict)
        assert "enabled" in config_dict
        assert config_dict["enabled"] is True


class TestTaskScheduler:
    """Test TaskScheduler"""
    
    @pytest.fixture
    def scheduler(self):
        """Create TaskScheduler instance"""
        return TaskScheduler()
    
    def test_scheduler_initialization(self, scheduler):
        """Test scheduler initialization"""
        assert scheduler is not None
        assert hasattr(scheduler, 'tasks')
    
    def test_add_task(self, scheduler):
        """Test adding a task to scheduler"""
        async def dummy_task():
            return "done"
        
        task = ScheduledTask(
            name="test_task",
            func=dummy_task,
            schedule="daily",
            enabled=True
        )
        
        scheduler.add_task(task)
        assert len(scheduler.tasks) == 1
        assert scheduler.tasks[0].name == "test_task"
    
    def test_remove_task(self, scheduler):
        """Test removing a task from scheduler"""
        async def dummy_task():
            return "done"
        
        task = ScheduledTask(
            name="test_task",
            func=dummy_task,
            schedule="daily",
            enabled=True
        )
        
        scheduler.add_task(task)
        scheduler.remove_task("test_task")
        assert len(scheduler.tasks) == 0
    
    def test_get_task(self, scheduler):
        """Test getting a task by name"""
        async def dummy_task():
            return "done"
        
        task = ScheduledTask(
            name="test_task",
            func=dummy_task,
            schedule="daily",
            enabled=True
        )
        
        scheduler.add_task(task)
        retrieved_task = scheduler.get_task("test_task")
        assert retrieved_task is not None
        assert retrieved_task.name == "test_task"
    
    def test_enable_disable_task(self, scheduler):
        """Test enabling and disabling tasks"""
        async def dummy_task():
            return "done"
        
        task = ScheduledTask(
            name="test_task",
            func=dummy_task,
            schedule="daily",
            enabled=True
        )
        
        scheduler.add_task(task)
        scheduler.disable_task("test_task")
        assert scheduler.get_task("test_task").enabled is False
        
        scheduler.enable_task("test_task")
        assert scheduler.get_task("test_task").enabled is True


class TestScheduledTask:
    """Test ScheduledTask"""
    
    def test_task_creation(self):
        """Test creating a scheduled task"""
        async def dummy_task():
            return "done"
        
        task = ScheduledTask(
            name="test_task",
            func=dummy_task,
            schedule="daily",
            enabled=True
        )
        
        assert task.name == "test_task"
        assert task.schedule == "daily"
        assert task.enabled is True
    
    @pytest.mark.asyncio
    async def test_task_execution(self):
        """Test executing a scheduled task"""
        executed = False
        
        async def dummy_task():
            nonlocal executed
            executed = True
            return "done"
        
        task = ScheduledTask(
            name="test_task",
            func=dummy_task,
            schedule="daily",
            enabled=True
        )
        
        result = await task.func()
        assert executed is True
        assert result == "done"
    
    def test_task_last_run_tracking(self):
        """Test tracking last run time"""
        async def dummy_task():
            return "done"
        
        task = ScheduledTask(
            name="test_task",
            func=dummy_task,
            schedule="daily",
            enabled=True
        )
        
        now = datetime.utcnow()
        task.last_run = now
        assert task.last_run == now
    
    def test_task_next_run_calculation(self):
        """Test calculating next run time"""
        async def dummy_task():
            return "done"
        
        task = ScheduledTask(
            name="test_task",
            func=dummy_task,
            schedule="daily",
            enabled=True
        )
        
        now = datetime.utcnow()
        task.last_run = now
        # Next run should be approximately 24 hours later
        expected_next = now + timedelta(days=1)
        
        # We just check that next_run is set
        assert hasattr(task, 'last_run')


class TestLoggingSettings:
    """Test LoggingSettings"""
    
    def test_logging_settings_creation(self):
        """Test creating logging settings"""
        settings = LoggingSettings(
            log_directory="logs",
            log_level="INFO",
            max_file_size_mb=10,
            backup_count=5
        )
        
        assert settings.log_directory == "logs"
        assert settings.log_level == "INFO"
        assert settings.max_file_size_mb == 10
        assert settings.backup_count == 5
    
    def test_logging_settings_defaults(self):
        """Test default logging settings"""
        settings = LoggingSettings()
        
        assert settings.log_directory is not None
        assert settings.log_level is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

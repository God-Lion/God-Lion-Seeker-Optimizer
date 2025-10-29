"""
Automation configuration management
Handles loading, saving, and validation of automation settings
"""
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, validator
from pathlib import Path
import json
from datetime import time


class ScrapingProfile(BaseModel):
    """Configuration for a scraping profile"""
    profile_name: str
    enabled: bool = True
    priority: int = 1
    queries: List[Dict[str, Any]]


class AutomationSchedule(BaseModel):
    """Automation schedule configuration"""
    enabled: bool = True
    schedule_type: str = "daily"  # daily, weekly, interval
    execution_times: List[str] = Field(default_factory=lambda: ["09:00", "18:00"])
    timezone: str = "America/New_York"
    max_retries: int = 3
    retry_delay_minutes: int = 15


class MatchingConfig(BaseModel):
    """Job matching configuration"""
    enabled: bool = True
    auto_analyze: bool = True
    resume_path: str = "my_resume.txt"
    min_match_score: float = 0.50
    save_reports: bool = True


class NotificationConfig(BaseModel):
    """Notification settings"""
    enabled: bool = True
    notify_on_high_matches: bool = True
    high_match_threshold: float = 0.75
    send_daily_summary: bool = True
    summary_time: str = "20:00"
    email_enabled: bool = False
    email_to: Optional[str] = None
    slack_enabled: bool = False
    slack_webhook: Optional[str] = None


class ExportConfig(BaseModel):
    """Export and archiving configuration"""
    auto_export: bool = True
    export_formats: List[str] = Field(default_factory=lambda: ["json", "csv"])
    export_directory: str = "exports"
    keep_days: int = 30


class DatabaseMaintenanceConfig(BaseModel):
    """Database maintenance settings"""
    auto_cleanup: bool = True
    cleanup_days: int = 90
    archive_old_jobs: bool = True
    backup_enabled: bool = True
    backup_directory: str = "backups"


class LoggingConfig(BaseModel):
    """Logging configuration"""
    log_level: str = "INFO"
    log_directory: str = "logs"
    max_log_size_mb: int = 10
    log_retention_days: int = 30


class RateLimitConfig(BaseModel):
    """Rate limiting configuration"""
    slow_mo: float = 1.5
    max_workers: int = 1
    page_load_timeout: int = 40


class AutomationConfig(BaseModel):
    """Complete automation configuration"""
    automation_settings: AutomationSchedule = Field(default_factory=AutomationSchedule)
    scraping_profiles: List[ScrapingProfile] = Field(default_factory=list)
    matching_settings: MatchingConfig = Field(default_factory=MatchingConfig)
    notification_settings: NotificationConfig = Field(default_factory=NotificationConfig)
    export_settings: ExportConfig = Field(default_factory=ExportConfig)
    database_settings: DatabaseMaintenanceConfig = Field(default_factory=DatabaseMaintenanceConfig)
    logging_settings: LoggingConfig = Field(default_factory=LoggingConfig)
    rate_limiting: RateLimitConfig = Field(default_factory=RateLimitConfig)
    
    @classmethod
    def from_file(cls, config_path: str) -> "AutomationConfig":
        """Load configuration from JSON file"""
        path = Path(config_path)
        if not path.exists():
            return cls.create_default()
        
        with open(path, 'r') as f:
            data = json.load(f)
        
        return cls(**data)
    
    @classmethod
    def create_default(cls) -> "AutomationConfig":
        """Create default configuration with sample profile"""
        default_profile = ScrapingProfile(
            profile_name="software_engineering",
            enabled=True,
            priority=1,
            queries=[
                {
                    "query": "Software Engineer",
                    "locations": ["United States", "Remote"],
                    "limit": 100,
                    "filters": {
                        "relevance": "RECENT",
                        "time": "WEEK",
                        "type": ["FULL_TIME"],
                        "experience": ["ENTRY_LEVEL", "MID_SENIOR"],
                        "on_site_or_remote": ["REMOTE", "HYBRID"]
                    }
                }
            ]
        )
        
        return cls(scraping_profiles=[default_profile])
    
    def to_file(self, config_path: str):
        """Save configuration to JSON file"""
        path = Path(config_path)
        path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(path, 'w') as f:
            json.dump(self.model_dump(), f, indent=2)
    
    def get_enabled_profiles(self) -> List[ScrapingProfile]:
        """Get all enabled profiles sorted by priority"""
        enabled = [p for p in self.scraping_profiles if p.enabled]
        return sorted(enabled, key=lambda x: x.priority)
    
    def add_profile(self, profile: ScrapingProfile):
        """Add a new scraping profile"""
        self.scraping_profiles.append(profile)
    
    def update_profile(self, profile_name: str, updates: Dict[str, Any]) -> bool:
        """Update an existing profile"""
        for profile in self.scraping_profiles:
            if profile.profile_name == profile_name:
                for key, value in updates.items():
                    if hasattr(profile, key):
                        setattr(profile, key, value)
                return True
        return False
    
    def remove_profile(self, profile_name: str) -> bool:
        """Remove a profile"""
        for i, profile in enumerate(self.scraping_profiles):
            if profile.profile_name == profile_name:
                self.scraping_profiles.pop(i)
                return True
        return False

"""
Schedule Management System
Manages job schedules, configurations, and execution patterns
"""
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, time
from pathlib import Path
import json
from enum import Enum

import structlog

logger = structlog.get_logger(__name__)


class ScheduleType(str, Enum):
    """Schedule execution types"""
    CRON = "cron"
    INTERVAL = "interval"
    ONCE = "once"


class SchedulePriority(str, Enum):
    """Job priority levels"""
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


@dataclass
class JobSchedule:
    """Job schedule configuration"""
    job_id: str
    name: str
    schedule_type: ScheduleType
    enabled: bool = True
    priority: SchedulePriority = SchedulePriority.NORMAL
    
    # Cron schedule (for CRON type)
    cron_hour: Optional[str] = None
    cron_minute: Optional[str] = None
    cron_day_of_week: Optional[str] = None
    
    # Interval schedule (for INTERVAL type)
    interval_hours: int = 0
    interval_minutes: int = 0
    interval_seconds: int = 0
    
    # One-time schedule (for ONCE type)
    run_date: Optional[str] = None  # ISO format
    
    # Job parameters
    function_name: str = ""
    args: List[Any] = None
    kwargs: Dict[str, Any] = None
    
    # Metadata
    description: str = ""
    tags: List[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    last_run: Optional[str] = None
    
    def __post_init__(self):
        """Initialize mutable defaults"""
        if self.args is None:
            self.args = []
        if self.kwargs is None:
            self.kwargs = {}
        if self.tags is None:
            self.tags = []
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'JobSchedule':
        """Create from dictionary"""
        # Convert string enums back
        if 'schedule_type' in data:
            data['schedule_type'] = ScheduleType(data['schedule_type'])
        if 'priority' in data:
            data['priority'] = SchedulePriority(data['priority'])
        
        return cls(**data)
    
    def validate(self) -> bool:
        """Validate schedule configuration"""
        if self.schedule_type == ScheduleType.CRON:
            return bool(self.cron_hour or self.cron_minute or self.cron_day_of_week)
        elif self.schedule_type == ScheduleType.INTERVAL:
            return (self.interval_hours + self.interval_minutes + self.interval_seconds) > 0
        elif self.schedule_type == ScheduleType.ONCE:
            return bool(self.run_date)
        return False


class ScheduleManager:
    """
    Manages job schedule configurations
    Handles loading, saving, and CRUD operations on schedules
    """
    
    def __init__(self, config_file: str = "schedules.json"):
        """
        Initialize schedule manager
        
        Args:
            config_file: Path to schedules configuration file
        """
        self.config_file = Path(config_file)
        self.schedules: Dict[str, JobSchedule] = {}
        
        # Load existing schedules
        if self.config_file.exists():
            self.load_schedules()
        
        logger.info("schedule_manager_initialized", config_file=str(self.config_file))
    
    def load_schedules(self):
        """Load schedules from configuration file"""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.schedules = {
                job_id: JobSchedule.from_dict(schedule_data)
                for job_id, schedule_data in data.items()
            }
            
            logger.info("schedules_loaded", count=len(self.schedules))
        
        except Exception as e:
            logger.error("schedule_load_failed", error=str(e))
            self.schedules = {}
    
    def save_schedules(self):
        """Save schedules to configuration file"""
        try:
            # Create backup
            if self.config_file.exists():
                backup_file = self.config_file.with_suffix('.json.bak')
                self.config_file.rename(backup_file)
            
            # Save schedules
            data = {
                job_id: schedule.to_dict()
                for job_id, schedule in self.schedules.items()
            }
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, default=str)
            
            logger.info("schedules_saved", count=len(self.schedules))
        
        except Exception as e:
            logger.error("schedule_save_failed", error=str(e))
            raise
    
    def add_schedule(self, schedule: JobSchedule) -> bool:
        """
        Add a new schedule
        
        Args:
            schedule: Schedule configuration
        
        Returns:
            True if added successfully
        """
        if not schedule.validate():
            logger.error("invalid_schedule", job_id=schedule.job_id)
            return False
        
        if schedule.job_id in self.schedules:
            logger.warning("schedule_exists", job_id=schedule.job_id)
            return False
        
        schedule.created_at = datetime.now().isoformat()
        self.schedules[schedule.job_id] = schedule
        self.save_schedules()
        
        logger.info("schedule_added", job_id=schedule.job_id)
        return True
    
    def update_schedule(self, job_id: str, **kwargs) -> bool:
        """
        Update existing schedule
        
        Args:
            job_id: Job identifier
            **kwargs: Fields to update
        
        Returns:
            True if updated successfully
        """
        if job_id not in self.schedules:
            logger.error("schedule_not_found", job_id=job_id)
            return False
        
        schedule = self.schedules[job_id]
        
        # Update fields
        for key, value in kwargs.items():
            if hasattr(schedule, key):
                setattr(schedule, key, value)
        
        schedule.updated_at = datetime.now().isoformat()
        
        if not schedule.validate():
            logger.error("invalid_schedule_update", job_id=job_id)
            return False
        
        self.save_schedules()
        logger.info("schedule_updated", job_id=job_id)
        return True
    
    def remove_schedule(self, job_id: str) -> bool:
        """
        Remove a schedule
        
        Args:
            job_id: Job identifier
        
        Returns:
            True if removed successfully
        """
        if job_id not in self.schedules:
            logger.error("schedule_not_found", job_id=job_id)
            return False
        
        del self.schedules[job_id]
        self.save_schedules()
        
        logger.info("schedule_removed", job_id=job_id)
        return True
    
    def get_schedule(self, job_id: str) -> Optional[JobSchedule]:
        """Get schedule by job ID"""
        return self.schedules.get(job_id)
    
    def get_all_schedules(self) -> List[JobSchedule]:
        """Get all schedules"""
        return list(self.schedules.values())
    
    def get_enabled_schedules(self) -> List[JobSchedule]:
        """Get only enabled schedules"""
        return [s for s in self.schedules.values() if s.enabled]
    
    def get_schedules_by_type(self, schedule_type: ScheduleType) -> List[JobSchedule]:
        """Get schedules by type"""
        return [
            s for s in self.schedules.values()
            if s.schedule_type == schedule_type
        ]
    
    def get_schedules_by_priority(self, priority: SchedulePriority) -> List[JobSchedule]:
        """Get schedules by priority"""
        return [
            s for s in self.schedules.values()
            if s.priority == priority
        ]
    
    def get_schedules_by_tag(self, tag: str) -> List[JobSchedule]:
        """Get schedules by tag"""
        return [
            s for s in self.schedules.values()
            if tag in s.tags
        ]
    
    def enable_schedule(self, job_id: str) -> bool:
        """Enable a schedule"""
        return self.update_schedule(job_id, enabled=True)
    
    def disable_schedule(self, job_id: str) -> bool:
        """Disable a schedule"""
        return self.update_schedule(job_id, enabled=False)
    
    def mark_last_run(self, job_id: str, run_time: Optional[datetime] = None):
        """Mark last run time for a job"""
        if job_id in self.schedules:
            run_time = run_time or datetime.now()
            self.schedules[job_id].last_run = run_time.isoformat()
            self.save_schedules()
    
    def create_daily_schedule(
        self,
        job_id: str,
        name: str,
        hour: int,
        minute: int = 0,
        function_name: str = "",
        **kwargs
    ) -> JobSchedule:
        """
        Create a daily schedule
        
        Args:
            job_id: Job identifier
            name: Job name
            hour: Hour to run (0-23)
            minute: Minute to run (0-59)
            function_name: Function to execute
            **kwargs: Additional schedule parameters
        
        Returns:
            JobSchedule instance
        """
        return JobSchedule(
            job_id=job_id,
            name=name,
            schedule_type=ScheduleType.CRON,
            cron_hour=str(hour),
            cron_minute=str(minute),
            function_name=function_name,
            **kwargs
        )
    
    def create_hourly_schedule(
        self,
        job_id: str,
        name: str,
        minute: int = 0,
        function_name: str = "",
        **kwargs
    ) -> JobSchedule:
        """
        Create an hourly schedule
        
        Args:
            job_id: Job identifier
            name: Job name
            minute: Minute to run (0-59)
            function_name: Function to execute
            **kwargs: Additional schedule parameters
        
        Returns:
            JobSchedule instance
        """
        return JobSchedule(
            job_id=job_id,
            name=name,
            schedule_type=ScheduleType.CRON,
            cron_minute=str(minute),
            function_name=function_name,
            **kwargs
        )
    
    def create_weekday_schedule(
        self,
        job_id: str,
        name: str,
        hour: int,
        minute: int = 0,
        function_name: str = "",
        **kwargs
    ) -> JobSchedule:
        """
        Create a weekday (Mon-Fri) schedule
        
        Args:
            job_id: Job identifier
            name: Job name
            hour: Hour to run (0-23)
            minute: Minute to run (0-59)
            function_name: Function to execute
            **kwargs: Additional schedule parameters
        
        Returns:
            JobSchedule instance
        """
        return JobSchedule(
            job_id=job_id,
            name=name,
            schedule_type=ScheduleType.CRON,
            cron_hour=str(hour),
            cron_minute=str(minute),
            cron_day_of_week='mon-fri',
            function_name=function_name,
            **kwargs
        )
    
    def create_interval_schedule(
        self,
        job_id: str,
        name: str,
        hours: int = 0,
        minutes: int = 0,
        seconds: int = 0,
        function_name: str = "",
        **kwargs
    ) -> JobSchedule:
        """
        Create an interval-based schedule
        
        Args:
            job_id: Job identifier
            name: Job name
            hours: Interval hours
            minutes: Interval minutes
            seconds: Interval seconds
            function_name: Function to execute
            **kwargs: Additional schedule parameters
        
        Returns:
            JobSchedule instance
        """
        return JobSchedule(
            job_id=job_id,
            name=name,
            schedule_type=ScheduleType.INTERVAL,
            interval_hours=hours,
            interval_minutes=minutes,
            interval_seconds=seconds,
            function_name=function_name,
            **kwargs
        )
    
    def create_once_schedule(
        self,
        job_id: str,
        name: str,
        run_date: datetime,
        function_name: str = "",
        **kwargs
    ) -> JobSchedule:
        """
        Create a one-time schedule
        
        Args:
            job_id: Job identifier
            name: Job name
            run_date: When to run
            function_name: Function to execute
            **kwargs: Additional schedule parameters
        
        Returns:
            JobSchedule instance
        """
        return JobSchedule(
            job_id=job_id,
            name=name,
            schedule_type=ScheduleType.ONCE,
            run_date=run_date.isoformat(),
            function_name=function_name,
            **kwargs
        )
    
    def get_summary(self) -> Dict[str, Any]:
        """Get summary statistics"""
        schedules = list(self.schedules.values())
        
        return {
            'total_schedules': len(schedules),
            'enabled_schedules': len([s for s in schedules if s.enabled]),
            'disabled_schedules': len([s for s in schedules if not s.enabled]),
            'by_type': {
                'cron': len([s for s in schedules if s.schedule_type == ScheduleType.CRON]),
                'interval': len([s for s in schedules if s.schedule_type == ScheduleType.INTERVAL]),
                'once': len([s for s in schedules if s.schedule_type == ScheduleType.ONCE])
            },
            'by_priority': {
                'high': len([s for s in schedules if s.priority == SchedulePriority.HIGH]),
                'normal': len([s for s in schedules if s.priority == SchedulePriority.NORMAL]),
                'low': len([s for s in schedules if s.priority == SchedulePriority.LOW])
            }
        }

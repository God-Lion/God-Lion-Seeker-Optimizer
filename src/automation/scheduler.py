"""
Advanced Job Scheduler using APScheduler
Provides cron-like scheduling with persistence and monitoring
"""
import asyncio
from typing import Dict, List, Optional, Callable, Any
from datetime import datetime, timedelta
from pathlib import Path
import json

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from apscheduler.executors.asyncio import AsyncIOExecutor
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.date import DateTrigger
from apscheduler.events import (
    EVENT_JOB_EXECUTED, 
    EVENT_JOB_ERROR, 
    EVENT_JOB_MISSED,
    JobExecutionEvent
)
import structlog

logger = structlog.get_logger(__name__)


class JobScheduler:
    """
    Advanced job scheduler with persistence and monitoring
    Uses APScheduler for robust task scheduling
    """
    
    def __init__(
        self,
        db_url: str = "sqlite:///scheduler.db",
        timezone: str = "America/New_York",
        max_instances: int = 3,
        coalesce: bool = True,
        misfire_grace_time: int = 300
    ):
        """
        Initialize job scheduler
        
        Args:
            db_url: SQLAlchemy database URL for job persistence
            timezone: Timezone for scheduling
            max_instances: Maximum concurrent instances of same job
            coalesce: Combine multiple missed runs into one
            misfire_grace_time: Seconds after which missed job is cancelled
        """
        self.timezone = timezone
        self.db_url = db_url
        
        # Job stores configuration
        jobstores = {
            'default': SQLAlchemyJobStore(url=db_url)
        }
        
        # Executors configuration
        executors = {
            'default': AsyncIOExecutor()
        }
        
        # Job defaults
        job_defaults = {
            'coalesce': coalesce,
            'max_instances': max_instances,
            'misfire_grace_time': misfire_grace_time
        }
        
        # Create scheduler
        self.scheduler = AsyncIOScheduler(
            jobstores=jobstores,
            executors=executors,
            job_defaults=job_defaults,
            timezone=timezone
        )
        
        # Statistics tracking
        self.stats = {
            'total_executions': 0,
            'successful_executions': 0,
            'failed_executions': 0,
            'missed_executions': 0,
            'last_execution': None,
            'execution_history': []
        }
        
        # Setup event listeners
        self._setup_listeners()
        
        logger.info(
            "scheduler_initialized",
            timezone=timezone,
            max_instances=max_instances
        )
    
    def _setup_listeners(self):
        """Setup event listeners for monitoring"""
        self.scheduler.add_listener(
            self._job_executed_listener,
            EVENT_JOB_EXECUTED
        )
        self.scheduler.add_listener(
            self._job_error_listener,
            EVENT_JOB_ERROR
        )
        self.scheduler.add_listener(
            self._job_missed_listener,
            EVENT_JOB_MISSED
        )
    
    def _job_executed_listener(self, event: JobExecutionEvent):
        """Handle successful job execution"""
        self.stats['total_executions'] += 1
        self.stats['successful_executions'] += 1
        self.stats['last_execution'] = datetime.now()
        
        # Keep last 100 executions
        self.stats['execution_history'].append({
            'job_id': event.job_id,
            'execution_time': datetime.now().isoformat(),
            'status': 'success'
        })
        
        if len(self.stats['execution_history']) > 100:
            self.stats['execution_history'].pop(0)
        
        logger.info(
            "job_executed",
            job_id=event.job_id,
            scheduled_time=event.scheduled_run_time
        )
    
    def _job_error_listener(self, event: JobExecutionEvent):
        """Handle job execution error"""
        self.stats['total_executions'] += 1
        self.stats['failed_executions'] += 1
        
        self.stats['execution_history'].append({
            'job_id': event.job_id,
            'execution_time': datetime.now().isoformat(),
            'status': 'error',
            'exception': str(event.exception)
        })
        
        if len(self.stats['execution_history']) > 100:
            self.stats['execution_history'].pop(0)
        
        logger.error(
            "job_failed",
            job_id=event.job_id,
            exception=event.exception,
            exc_info=True
        )
    
    def _job_missed_listener(self, event: JobExecutionEvent):
        """Handle missed job execution"""
        self.stats['missed_executions'] += 1
        
        logger.warning(
            "job_missed",
            job_id=event.job_id,
            scheduled_time=event.scheduled_run_time
        )
    
    def start(self):
        """Start the scheduler"""
        if not self.scheduler.running:
            self.scheduler.start()
            logger.info("scheduler_started")
        else:
            logger.warning("scheduler_already_running")
    
    def shutdown(self, wait: bool = True):
        """
        Shutdown the scheduler
        
        Args:
            wait: Wait for running jobs to complete
        """
        if self.scheduler.running:
            self.scheduler.shutdown(wait=wait)
            logger.info("scheduler_stopped", wait=wait)
        else:
            logger.warning("scheduler_not_running")
    
    def add_cron_job(
        self,
        func: Callable,
        job_id: str,
        hour: Optional[str] = None,
        minute: Optional[str] = None,
        day_of_week: Optional[str] = None,
        args: Optional[tuple] = None,
        kwargs: Optional[dict] = None,
        name: Optional[str] = None,
        replace_existing: bool = True
    ):
        """
        Add a cron-style scheduled job
        
        Args:
            func: Function to execute
            job_id: Unique job identifier
            hour: Hour(s) to run (0-23, *, */2, 8-17)
            minute: Minute(s) to run (0-59, *, */15)
            day_of_week: Day(s) of week (mon-sun, *, mon-fri)
            args: Positional arguments
            kwargs: Keyword arguments
            name: Human-readable job name
            replace_existing: Replace job if exists
        
        Example:
            scheduler.add_cron_job(
                my_func,
                'daily_job',
                hour='9',
                minute='0',
                day_of_week='mon-fri'
            )
        """
        trigger = CronTrigger(
            hour=hour,
            minute=minute,
            day_of_week=day_of_week,
            timezone=self.timezone
        )
        
        self.scheduler.add_job(
            func=func,
            trigger=trigger,
            id=job_id,
            name=name or job_id,
            args=args or (),
            kwargs=kwargs or {},
            replace_existing=replace_existing
        )
        
        logger.info(
            "cron_job_added",
            job_id=job_id,
            hour=hour,
            minute=minute,
            day_of_week=day_of_week
        )
    
    def add_interval_job(
        self,
        func: Callable,
        job_id: str,
        hours: int = 0,
        minutes: int = 0,
        seconds: int = 0,
        args: Optional[tuple] = None,
        kwargs: Optional[dict] = None,
        name: Optional[str] = None,
        start_date: Optional[datetime] = None,
        replace_existing: bool = True
    ):
        """
        Add an interval-based job
        
        Args:
            func: Function to execute
            job_id: Unique job identifier
            hours: Interval hours
            minutes: Interval minutes
            seconds: Interval seconds
            args: Positional arguments
            kwargs: Keyword arguments
            name: Human-readable job name
            start_date: When to start (default: now)
            replace_existing: Replace job if exists
        
        Example:
            scheduler.add_interval_job(
                my_func,
                'hourly_job',
                hours=1
            )
        """
        trigger = IntervalTrigger(
            hours=hours,
            minutes=minutes,
            seconds=seconds,
            start_date=start_date,
            timezone=self.timezone
        )
        
        self.scheduler.add_job(
            func=func,
            trigger=trigger,
            id=job_id,
            name=name or job_id,
            args=args or (),
            kwargs=kwargs or {},
            replace_existing=replace_existing
        )
        
        logger.info(
            "interval_job_added",
            job_id=job_id,
            hours=hours,
            minutes=minutes,
            seconds=seconds
        )
    
    def add_date_job(
        self,
        func: Callable,
        job_id: str,
        run_date: datetime,
        args: Optional[tuple] = None,
        kwargs: Optional[dict] = None,
        name: Optional[str] = None,
        replace_existing: bool = True
    ):
        """
        Add a one-time job at specific date/time
        
        Args:
            func: Function to execute
            job_id: Unique job identifier
            run_date: When to run the job
            args: Positional arguments
            kwargs: Keyword arguments
            name: Human-readable job name
            replace_existing: Replace job if exists
        
        Example:
            scheduler.add_date_job(
                my_func,
                'onetime_job',
                run_date=datetime(2025, 1, 20, 10, 0)
            )
        """
        trigger = DateTrigger(
            run_date=run_date,
            timezone=self.timezone
        )
        
        self.scheduler.add_job(
            func=func,
            trigger=trigger,
            id=job_id,
            name=name or job_id,
            args=args or (),
            kwargs=kwargs or {},
            replace_existing=replace_existing
        )
        
        logger.info(
            "date_job_added",
            job_id=job_id,
            run_date=run_date.isoformat()
        )
    
    def remove_job(self, job_id: str):
        """Remove a scheduled job"""
        try:
            self.scheduler.remove_job(job_id)
            logger.info("job_removed", job_id=job_id)
        except Exception as e:
            logger.error("job_removal_failed", job_id=job_id, error=str(e))
            raise
    
    def pause_job(self, job_id: str):
        """Pause a scheduled job"""
        try:
            self.scheduler.pause_job(job_id)
            logger.info("job_paused", job_id=job_id)
        except Exception as e:
            logger.error("job_pause_failed", job_id=job_id, error=str(e))
            raise
    
    def resume_job(self, job_id: str):
        """Resume a paused job"""
        try:
            self.scheduler.resume_job(job_id)
            logger.info("job_resumed", job_id=job_id)
        except Exception as e:
            logger.error("job_resume_failed", job_id=job_id, error=str(e))
            raise
    
    def reschedule_job(
        self,
        job_id: str,
        trigger: Optional[str] = None,
        **trigger_args
    ):
        """
        Reschedule an existing job
        
        Args:
            job_id: Job to reschedule
            trigger: Trigger type ('cron', 'interval', 'date')
            **trigger_args: Trigger-specific arguments
        """
        try:
            if trigger == 'cron':
                new_trigger = CronTrigger(**trigger_args, timezone=self.timezone)
            elif trigger == 'interval':
                new_trigger = IntervalTrigger(**trigger_args, timezone=self.timezone)
            elif trigger == 'date':
                new_trigger = DateTrigger(**trigger_args, timezone=self.timezone)
            else:
                raise ValueError(f"Unknown trigger type: {trigger}")
            
            self.scheduler.reschedule_job(job_id, trigger=new_trigger)
            logger.info("job_rescheduled", job_id=job_id, trigger=trigger)
        
        except Exception as e:
            logger.error("job_reschedule_failed", job_id=job_id, error=str(e))
            raise
    
    def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Get job details"""
        job = self.scheduler.get_job(job_id)
        if not job:
            return None
        
        return {
            'id': job.id,
            'name': job.name,
            'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None,
            'trigger': str(job.trigger),
            'pending': job.pending
        }
    
    def get_all_jobs(self) -> List[Dict[str, Any]]:
        """Get all scheduled jobs"""
        jobs = self.scheduler.get_jobs()
        return [
            {
                'id': job.id,
                'name': job.name,
                'next_run_time': job.next_run_time.isoformat() if job.next_run_time else None,
                'trigger': str(job.trigger),
                'pending': job.pending
            }
            for job in jobs
        ]
    
    def get_stats(self) -> Dict[str, Any]:
        """Get scheduler statistics"""
        return {
            'running': self.scheduler.running,
            'total_jobs': len(self.scheduler.get_jobs()),
            'total_executions': self.stats['total_executions'],
            'successful_executions': self.stats['successful_executions'],
            'failed_executions': self.stats['failed_executions'],
            'missed_executions': self.stats['missed_executions'],
            'last_execution': self.stats['last_execution'].isoformat() if self.stats['last_execution'] else None,
            'recent_history': self.stats['execution_history'][-10:]
        }
    
    def print_jobs(self):
        """Print all scheduled jobs (debug)"""
        self.scheduler.print_jobs()


# Singleton instance
_scheduler_instance: Optional[JobScheduler] = None


def get_scheduler(
    db_url: str = "sqlite:///scheduler.db",
    timezone: str = "America/New_York"
) -> JobScheduler:
    """Get or create scheduler singleton"""
    global _scheduler_instance
    
    if _scheduler_instance is None:
        _scheduler_instance = JobScheduler(
            db_url=db_url,
            timezone=timezone
        )
    
    return _scheduler_instance

"""
LinkedIn Job Automation Service
Automated scraping, analysis, resume customization, and application tracking
Refactored to use async architecture and repository pattern
"""
import asyncio
import schedule
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from pathlib import Path
import structlog

from .automation_config import AutomationConfig, ScrapingProfile
from src.services.integrated_scraping_service import IntegratedScrapingService
from src.scrapers.async_linkedin_scraper import ScraperConfig
from src.repositories.scraping_session_repository import ScrapingSessionRepository
from src.repositories.job_repository import JobRepository
from src.repositories.job_analysis_repository import JobAnalysisRepository
from src.config.database import get_session
from src.config.settings import settings
from src.notifications.email_service import EmailService, EmailConfig
from src.notifications.notification_manager import NotificationManager, NotificationConfig

logger = structlog.get_logger(__name__)


class AutomationService:
    """
    Complete automation service for job searching and application
    Uses async/await and repository pattern
    """
    
    def __init__(self, config_file: str = "automation_config.json"):
        """Initialize automation service"""
        self.config_file = config_file
        self.config = AutomationConfig.from_file(config_file)
        
        # Setup logging
        self._setup_logging()
        
        # Setup notification manager
        self.notification_manager = self._setup_notifications()
        
        # Statistics
        self.stats = {
            'sessions_run': 0,
            'jobs_scraped': 0,
            'jobs_analyzed': 0,
            'errors': []
        }
        
        # Scheduler state
        self.is_running = False
        
        logger.info("automation_service_initialized", config_file=config_file)
    
    def _setup_logging(self):
        """Setup logging configuration"""
        log_settings = self.config.logging_settings
        log_dir = Path(log_settings.log_directory)
        log_dir.mkdir(exist_ok=True)
        
        # Configure structlog
        structlog.configure(
            processors=[
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.add_log_level,
                structlog.processors.StackInfoRenderer(),
                structlog.dev.ConsoleRenderer()
            ],
            wrapper_class=structlog.BoundLogger,
            context_class=dict,
            logger_factory=structlog.PrintLoggerFactory(),
            cache_logger_on_first_use=False
        )
    
    def _setup_notifications(self) -> Optional[NotificationManager]:
        """Setup email notification manager"""
        if not settings.email_enabled:
            logger.info("email_notifications_disabled")
            return None
        
        try:
            email_config = EmailConfig(
                smtp_server=settings.smtp_server,
                smtp_port=settings.smtp_port,
                sender_email=settings.sender_email,
                sender_password=settings.sender_password,
                sender_name=settings.sender_name,
                use_tls=settings.smtp_use_tls,
                use_ssl=settings.smtp_use_ssl
            )
            
            notification_config = NotificationConfig(
                recipients=settings.recipient_email_list,
                notify_on_new_jobs=settings.notify_on_new_jobs,
                notify_on_high_matches=settings.notify_on_high_matches,
                send_daily_summary=settings.send_daily_summary,
                notify_on_errors=settings.notify_on_errors,
                high_match_threshold=settings.high_match_threshold,
                summary_time=settings.summary_time,
                min_jobs_for_notification=settings.min_jobs_for_notification,
                max_jobs_per_email=settings.max_jobs_per_email
            )
            
            logger.info("notification_manager_initialized")
            return NotificationManager(email_config, notification_config)
        
        except Exception as e:
            logger.error("notification_setup_failed", error=str(e))
            return None
    
    async def run_once(self):
        """Run automation once (all enabled profiles)"""
        logger.info("automation_run_started")
        
        # Reset stats
        self.stats['jobs_scraped'] = 0
        self.stats['jobs_analyzed'] = 0
        
        # Get enabled profiles
        profiles = self.config.get_enabled_profiles()
        
        if not profiles:
            logger.warning("no_enabled_profiles")
            return
        
        logger.info("processing_profiles", count=len(profiles))
        
        # Process each profile
        for profile in profiles:
            try:
                await self._run_profile(profile)
            except Exception as e:
                logger.error(
                    "profile_execution_failed",
                    profile=profile.profile_name,
                    error=str(e),
                    exc_info=True
                )
                self.stats['errors'].append({
                    'profile': profile.profile_name,
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                })
        
        # Export results if configured
        if self.config.export_settings.auto_export:
            await self._export_results()
        
        # Send notifications
        if self.notification_manager:
            # Send error notifications if any
            if self.stats['errors']:
                await self.notification_manager.notify_errors(self.stats['errors'])
            
            # Send high matches notification (consolidated)
            if settings.notify_on_high_matches:
                await self.notification_manager.notify_high_matches()
        
        logger.info(
            "automation_run_completed",
            profiles=len(profiles),
            jobs_scraped=self.stats['jobs_scraped'],
            jobs_analyzed=self.stats['jobs_analyzed']
        )
    
    async def _run_profile(self, profile: ScrapingProfile):
        """Run a single scraping profile"""
        logger.info("processing_profile", profile=profile.profile_name)
        
        # Create integrated scraping service
        matching_settings = self.config.matching_settings
        
        service = IntegratedScrapingService(
            resume_path=matching_settings.resume_path if matching_settings.enabled else None,
            scraper_config=ScraperConfig(
                max_concurrent=self.config.rate_limiting.max_workers,
                timeout=self.config.rate_limiting.page_load_timeout,
                headless=True,
                slow_mo=self.config.rate_limiting.slow_mo
            )
        )
        
        # Process each query in the profile
        for query_config in profile.queries:
            try:
                await self._run_query(service, query_config, profile.profile_name)
            except Exception as e:
                logger.error(
                    "query_execution_failed",
                    query=query_config.get('query'),
                    error=str(e),
                    exc_info=True
                )
        
        logger.info("profile_completed", profile=profile.profile_name)
    
    async def _run_query(
        self,
        service: IntegratedScrapingService,
        query_config: Dict[str, Any],
        profile_name: str
    ):
        """Run a single query"""
        query_text = query_config.get('query', '')
        locations = query_config.get('locations', ['United States'])
        limit = query_config.get('limit', 50)
        filters_config = query_config.get('filters', {})
        
        logger.info(
            "executing_query",
            query=query_text,
            locations=locations,
            limit=limit
        )
        
        # Convert filters to scraper format
        filters = self._convert_filters(filters_config)
        
        # Run scraping and matching
        result = await service.scrape_and_match_jobs(
            query=query_text,
            location=', '.join(locations),
            limit=limit,
            filters=filters,
            session_name=f"{profile_name}_{query_text}",
            min_match_score=self.config.matching_settings.min_match_score,
            analyze_on_scrape=self.config.matching_settings.auto_analyze
        )
        
        # Update stats
        self.stats['jobs_scraped'] += result.get('jobs_scraped', 0)
        if 'analysis' in result:
            self.stats['jobs_analyzed'] += result['analysis'].get('jobs_analyzed', 0)
        
        # Send notifications if enabled
        if self.notification_manager:
            await self._send_job_notifications(result, query_text)
        
        logger.info(
            "query_completed",
            query=query_text,
            jobs_scraped=result.get('jobs_scraped', 0),
            jobs_analyzed=result.get('analysis', {}).get('jobs_analyzed', 0),
            high_matches=len(result.get('high_matches', []))
        )
    
    def _convert_filters(self, filters_config: Dict[str, Any]) -> Dict[str, Any]:
        """Convert filter configuration to scraper format"""
        # This method would convert the filter config to the format
        # expected by the async scraper
        return filters_config
    
    async def _send_job_notifications(self, result: Dict[str, Any], query: str):
        """Send email notifications for found jobs"""
        try:
            # Notify about new jobs
            if result.get('jobs_scraped', 0) > 0:
                jobs_list = []
                # Get jobs from database to send in notification
                async with get_session() as db_session:
                    job_repo = JobRepository(db_session)
                    recent_jobs = await job_repo.get_recent_jobs(limit=result['jobs_scraped'])
                    
                    for job in recent_jobs:
                        jobs_list.append({
                            'title': job.title,
                            'company': job.company.name if job.company else 'Unknown',
                            'location': job.place,
                            'date': job.date,
                            'link': job.link,
                            'is_new': True
                        })
                
                if jobs_list:
                    await self.notification_manager.notify_new_jobs(
                        jobs=jobs_list,
                        profile_name=query
                    )
            
            # Notify about high matches
            high_matches = result.get('high_matches', [])
            if high_matches:
                await self.notification_manager.notify_high_matches(
                    threshold=self.config.matching_settings.min_match_score
                )
        
        except Exception as e:
            logger.error("notification_send_failed", error=str(e))
    
    async def _export_results(self):
        """Export results to configured formats"""
        export_settings = self.config.export_settings
        export_dir = Path(export_settings.export_directory)
        export_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        try:
            async with get_session() as db_session:
                job_repo = JobRepository(db_session)
                
                # Get recent jobs
                jobs = await job_repo.get_recent_jobs(limit=1000)
                
                if not jobs:
                    logger.info("no_jobs_to_export")
                    return
                
                # Convert to dict
                jobs_data = [
                    {
                        'job_id': job.job_id,
                        'title': job.title,
                        'company': job.company.name if job.company else None,
                        'location': job.place,
                        'link': job.link,
                        'date': job.date,
                        'scraped_at': job.scraped_at.isoformat() if job.scraped_at else None
                    }
                    for job in jobs
                ]
                
                # Export in requested formats
                formats = export_settings.export_formats
                
                if 'json' in formats:
                    import json
                    output_file = export_dir / f"jobs_{timestamp}.json"
                    with open(output_file, 'w', encoding='utf-8') as f:
                        json.dump(jobs_data, f, indent=2)
                    logger.info("export_completed", format="json", file=str(output_file))
                
                if 'csv' in formats:
                    import csv
                    output_file = export_dir / f"jobs_{timestamp}.csv"
                    
                    if jobs_data:
                        with open(output_file, 'w', newline='', encoding='utf-8') as f:
                            writer = csv.DictWriter(f, fieldnames=jobs_data[0].keys())
                            writer.writeheader()
                            writer.writerows(jobs_data)
                        logger.info("export_completed", format="csv", file=str(output_file))
        
        except Exception as e:
            logger.error("export_failed", error=str(e), exc_info=True)
    

    
    def start_scheduler(self):
        """Start the automation scheduler"""
        automation_settings = self.config.automation_settings
        
        if not automation_settings.enabled:
            logger.warning("automation_disabled_in_config")
            return
        
        logger.info(
            "starting_scheduler",
            execution_times=automation_settings.execution_times
        )
        
        # Schedule jobs
        for exec_time in automation_settings.execution_times:
            schedule.every().day.at(exec_time).do(self._scheduled_run)
            logger.info("scheduled_job", time=exec_time)
        
        # Schedule daily summary if enabled
        if self.notification_manager and settings.send_daily_summary:
            summary_time = settings.summary_time
            schedule.every().day.at(summary_time).do(self._scheduled_summary)
            logger.info("scheduled_summary", time=summary_time)
        
        # Schedule maintenance if enabled
        if self.config.database_settings.auto_cleanup:
            schedule.every().sunday.at("02:00").do(self._scheduled_maintenance)
            logger.info("scheduled_maintenance", time="Sunday 02:00")
        
        self.is_running = True
        
        # Main scheduler loop
        try:
            while self.is_running:
                schedule.run_pending()
                time.sleep(60)  # Check every minute
        except KeyboardInterrupt:
            logger.info("scheduler_stopped_by_user")
            self.is_running = False
    
    def _scheduled_run(self):
        """Wrapper for scheduled execution"""
        asyncio.run(self.run_once())
    
    def _scheduled_summary(self):
        """Wrapper for scheduled summary"""
        asyncio.run(self.generate_daily_summary())
    
    def _scheduled_maintenance(self):
        """Wrapper for scheduled maintenance"""
        asyncio.run(self.database_maintenance())
    
    def stop(self):
        """Stop the automation system"""
        self.is_running = False
        logger.info("automation_service_stopped")
    
    async def generate_daily_summary(self):
        """Generate and send daily summary"""
        logger.info("generating_daily_summary")
        
        try:
            async with get_session() as db_session:
                job_repo = JobRepository(db_session)
                analysis_repo = JobAnalysisRepository(db_session)
                
                # Get statistics
                stats = await analysis_repo.get_statistics()
                recent_jobs = await job_repo.get_recent_jobs(limit=24*60)  # Last 24h
                
                summary = {
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'total_jobs': len(recent_jobs),
                    'stats': stats
                }
                
                logger.info("daily_summary_generated", summary=summary)
        
        except Exception as e:
            logger.error("summary_generation_failed", error=str(e), exc_info=True)
    
    async def database_maintenance(self):
        """Perform database maintenance"""
        logger.info("starting_database_maintenance")
        
        try:
            db_settings = self.config.database_settings
            
            # Archive old jobs if enabled
            if db_settings.archive_old_jobs:
                async with get_session() as db_session:
                    job_repo = JobRepository(db_session)
                    
                    # Archive jobs older than cleanup_days
                    cutoff_date = datetime.now() - timedelta(days=db_settings.cleanup_days)
                    archived_count = await job_repo.archive_old_jobs(cutoff_date)
                    
                    logger.info("jobs_archived", count=archived_count)
            
            # Backup if enabled
            if db_settings.backup_enabled:
                await self._backup_database()
            
            logger.info("maintenance_completed")
        
        except Exception as e:
            logger.error("maintenance_failed", error=str(e), exc_info=True)
    
    async def _backup_database(self):
        """Backup database"""
        try:
            backup_dir = Path(self.config.database_settings.backup_directory)
            backup_dir.mkdir(exist_ok=True)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = backup_dir / f"backup_{timestamp}.json"
            
            async with get_session() as db_session:
                job_repo = JobRepository(db_session)
                jobs = await job_repo.get_recent_jobs(limit=10000)
                
                # Simple JSON backup
                import json
                backup_data = {
                    'timestamp': timestamp,
                    'jobs_count': len(jobs),
                    'jobs': [
                        {
                            'job_id': job.job_id,
                            'title': job.title,
                            'company': job.company.name if job.company else None,
                            'scraped_at': job.scraped_at.isoformat() if job.scraped_at else None
                        }
                        for job in jobs
                    ]
                }
                
                with open(backup_file, 'w', encoding='utf-8') as f:
                    json.dump(backup_data, f, indent=2)
                
                logger.info("backup_created", file=str(backup_file))
        
        except Exception as e:
            logger.error("backup_failed", error=str(e), exc_info=True)
    
    async def get_status(self) -> Dict[str, Any]:
        """Get automation system status"""
        try:
            async with get_session() as db_session:
                job_repo = JobRepository(db_session)
                analysis_repo = JobAnalysisRepository(db_session)
                
                stats = await analysis_repo.get_statistics()
                recent_jobs = await job_repo.get_recent_jobs(limit=24*60)
                
                return {
                    'is_running': self.is_running,
                    'config_loaded': True,
                    'matching_enabled': self.config.matching_settings.enabled,
                    'statistics': {
                        'total_jobs': stats.get('total_analyzed', 0),
                        'jobs_last_24h': len(recent_jobs),
                        'sessions_run': self.stats['sessions_run'],
                        'jobs_scraped': self.stats['jobs_scraped'],
                        'jobs_analyzed': self.stats['jobs_analyzed'],
                        'errors': len(self.stats['errors'])
                    },
                    'next_run': self._get_next_scheduled_run()
                }
        
        except Exception as e:
            logger.error("status_retrieval_failed", error=str(e))
            return {
                'is_running': self.is_running,
                'error': str(e)
            }
    
    def _get_next_scheduled_run(self) -> str:
        """Get next scheduled run time"""
        jobs = schedule.get_jobs()
        if not jobs:
            return "Not scheduled"
        
        next_run = min(jobs, key=lambda j: j.next_run)
        return next_run.next_run.strftime('%Y-%m-%d %H:%M:%S')

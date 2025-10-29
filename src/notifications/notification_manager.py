"""Notification manager for coordinating all notifications"""
from typing import List, Dict, Any, Optional
from pathlib import Path
from datetime import datetime, timedelta
import structlog

from .email_service import EmailService, EmailConfig
from .email_templates import EmailTemplateGenerator
from src.repositories.job_repository import JobRepository
from src.repositories.job_analysis_repository import JobAnalysisRepository
from src.config.database import get_session

logger = structlog.get_logger(__name__)


class NotificationConfig:
    """Configuration for notification manager"""
    def __init__(
        self,
        recipients: List[str],
        notify_on_new_jobs: bool = True,
        notify_on_high_matches: bool = True,
        send_daily_summary: bool = True,
        notify_on_errors: bool = True,
        high_match_threshold: float = 75.0,
        summary_time: str = "18:00",
        min_jobs_for_notification: int = 1,
        max_jobs_per_email: int = 20
    ):
        self.recipients = recipients
        self.notify_on_new_jobs = notify_on_new_jobs
        self.notify_on_high_matches = notify_on_high_matches
        self.send_daily_summary = send_daily_summary
        self.notify_on_errors = notify_on_errors
        self.high_match_threshold = high_match_threshold
        self.summary_time = summary_time
        self.min_jobs_for_notification = min_jobs_for_notification
        self.max_jobs_per_email = max_jobs_per_email


class NotificationManager:
    """Manage all notifications for the job scraper"""
    
    def __init__(
        self,
        email_config: EmailConfig,
        notification_config: NotificationConfig
    ):
        """Initialize notification manager
        
        Args:
            email_config: Email service configuration
            notification_config: Notification settings
        """
        self.email_service = EmailService(email_config)
        self.config = notification_config
        self.template_generator = EmailTemplateGenerator()
        
        logger.info(
            "notification_manager_initialized",
            recipients=len(notification_config.recipients)
        )
    
    async def notify_new_jobs(
        self,
        jobs: List[Dict[str, Any]],
        profile_name: Optional[str] = None
    ) -> bool:
        """Send notification for new jobs found
        
        Args:
            jobs: List of job dictionaries
            profile_name: Name of the scraping profile
        
        Returns:
            True if successful, False otherwise
        """
        if not self.config.notify_on_new_jobs:
            logger.debug("new_jobs_notification_disabled")
            return False
        
        if len(jobs) < self.config.min_jobs_for_notification:
            logger.debug(
                "too_few_jobs_for_notification",
                count=len(jobs),
                minimum=self.config.min_jobs_for_notification
            )
            return False
        
        try:
            # Limit jobs if too many
            jobs_to_send = jobs[:self.config.max_jobs_per_email]
            
            # Generate email
            subject = f"🎯 {len(jobs)} New Jobs Found"
            if profile_name:
                subject += f" - {profile_name}"
            
            html_content = self.template_generator.generate_new_jobs_notification(
                jobs=jobs_to_send,
                profile_name=profile_name,
                include_match_scores=True
            )
            
            # Send email
            success = self.email_service.send_email(
                to_emails=self.config.recipients,
                subject=subject,
                html_content=html_content
            )
            
            if success:
                logger.info(
                    "new_jobs_notification_sent",
                    job_count=len(jobs),
                    recipients=len(self.config.recipients)
                )
            
            return success
        
        except Exception as e:
            logger.error(
                "new_jobs_notification_failed",
                error=str(e),
                exc_info=True
            )
            return False
    
    async def notify_high_matches(
        self,
        threshold: Optional[float] = None
    ) -> bool:
        """Send notification for high-matching jobs
        
        Args:
            threshold: Match score threshold (uses config default if None)
        
        Returns:
            True if successful, False otherwise
        """
        if not self.config.notify_on_high_matches:
            logger.debug("high_match_notification_disabled")
            return False
        
        threshold = threshold or self.config.high_match_threshold
        
        try:
            async with get_session() as db_session:
                analysis_repo = JobAnalysisRepository(db_session)
                
                # Get high matches from last 24 hours
                high_matches = await analysis_repo.get_high_matches(
                    min_score=threshold,
                    limit=self.config.max_jobs_per_email
                )
                
                if len(high_matches) < self.config.min_jobs_for_notification:
                    logger.debug(
                        "no_high_matches_found",
                        threshold=threshold
                    )
                    return False
                
                # Convert to dict format
                jobs = []
                for analysis in high_matches:
                    job = analysis.job
                    jobs.append({
                        'title': job.title,
                        'company': job.company.name if job.company else 'Unknown',
                        'location': job.place,
                        'date': job.date,
                        'link': job.link,
                        'match_score': analysis.overall_match_score,
                        'skills_matched': analysis.matched_skills or []
                    })
                
                # Generate and send email
                subject = f"⭐ {len(jobs)} High-Match Jobs Found!"
                html_content = self.template_generator.generate_high_match_alert(
                    jobs=jobs,
                    threshold=threshold
                )
                
                success = self.email_service.send_email(
                    to_emails=self.config.recipients,
                    subject=subject,
                    html_content=html_content
                )
                
                if success:
                    logger.info(
                        "high_match_notification_sent",
                        job_count=len(jobs),
                        threshold=threshold
                    )
                
                return success
        
        except Exception as e:
            logger.error(
                "high_match_notification_failed",
                error=str(e),
                exc_info=True
            )
            return False
    
    async def send_daily_summary(self) -> bool:
        """Send daily summary report
        
        Returns:
            True if successful, False otherwise
        """
        if not self.config.send_daily_summary:
            logger.debug("daily_summary_disabled")
            return False
        
        try:
            async with get_session() as db_session:
                job_repo = JobRepository(db_session)
                analysis_repo = JobAnalysisRepository(db_session)
                
                # Get data from last 24 hours
                cutoff = datetime.now() - timedelta(hours=24)
                recent_jobs = await job_repo.get_jobs_since(cutoff)
                stats = await analysis_repo.get_statistics()
                
                # Get top matching jobs
                high_matches = await analysis_repo.get_high_matches(
                    min_score=50.0,
                    limit=5
                )
                
                top_jobs = []
                for analysis in high_matches:
                    job = analysis.job
                    top_jobs.append({
                        'title': job.title,
                        'company': job.company.name if job.company else 'Unknown',
                        'location': job.place,
                        'date': job.date,
                        'link': job.link,
                        'match_score': analysis.overall_match_score
                    })
                
                # Prepare summary data
                summary_data = {
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'stats': {
                        'jobs_found': len(recent_jobs),
                        'jobs_analyzed': stats.get('total_analyzed', 0),
                        'high_matches': len([j for j in top_jobs if j['match_score'] >= 75]),
                        'companies': len(set(j['company'] for j in top_jobs))
                    },
                    'top_jobs': top_jobs
                }
                
                # Generate and send email
                subject = f"📊 Daily Job Search Summary - {summary_data['date']}"
                html_content = self.template_generator.generate_daily_summary(
                    summary_data=summary_data
                )
                
                success = self.email_service.send_email(
                    to_emails=self.config.recipients,
                    subject=subject,
                    html_content=html_content
                )
                
                if success:
                    logger.info(
                        "daily_summary_sent",
                        jobs_found=summary_data['stats']['jobs_found']
                    )
                
                return success
        
        except Exception as e:
            logger.error(
                "daily_summary_failed",
                error=str(e),
                exc_info=True
            )
            return False
    
    async def notify_errors(
        self,
        errors: List[Dict[str, Any]]
    ) -> bool:
        """Send error notification
        
        Args:
            errors: List of error dictionaries
        
        Returns:
            True if successful, False otherwise
        """
        if not self.config.notify_on_errors:
            logger.debug("error_notification_disabled")
            return False
        
        if not errors:
            return False
        
        try:
            subject = f"⚠️ {len(errors)} Error(s) in Job Scraper"
            html_content = self.template_generator.generate_error_notification(
                errors=errors
            )
            
            success = self.email_service.send_email(
                to_emails=self.config.recipients,
                subject=subject,
                html_content=html_content
            )
            
            if success:
                logger.info(
                    "error_notification_sent",
                    error_count=len(errors)
                )
            
            return success
        
        except Exception as e:
            logger.error(
                "error_notification_failed",
                error=str(e),
                exc_info=True
            )
            return False
    
    def test_email(self, recipient: Optional[str] = None) -> bool:
        """Send a test email
        
        Args:
            recipient: Optional recipient (uses first from config if None)
        
        Returns:
            True if successful, False otherwise
        """
        test_recipient = recipient or self.config.recipients[0]
        return self.email_service.send_test_email(test_recipient)
    
    async def notify_custom(
        self,
        subject: str,
        message: str,
        jobs: Optional[List[Dict[str, Any]]] = None,
        attachments: Optional[List[Path]] = None
    ) -> bool:
        """Send custom notification
        
        Args:
            subject: Email subject
            message: Message body
            jobs: Optional list of jobs to include
            attachments: Optional file attachments
        
        Returns:
            True if successful, False otherwise
        """
        try:
            # Build HTML content
            html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                {self.template_generator.get_base_style()}
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>{subject}</h1>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        {message}
                    </div>
            """
            
            if jobs:
                html += '<h2>Related Jobs</h2><div class="jobs-list">'
                for job in jobs:
                    html += f"""
                    <div class="job-card">
                        <a href="{job.get('link', '#')}" class="job-title">{job.get('title', 'N/A')}</a>
                        <div class="company-name">🏢 {job.get('company', 'Unknown')}</div>
                        <div class="job-details">
                            📍 {job.get('location', 'N/A')} | 
                            📅 {job.get('date', 'N/A')}
                        </div>
                    </div>
                    """
                html += '</div>'
            
            html += """
                    <div class="footer">
                        <p>This email was sent by God Lion Seeker Optimizer</p>
                        <p>Generated at: """ + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + """</p>
                    </div>
                </div>
            </body>
            </html>
            """
            
            success = self.email_service.send_email(
                to_emails=self.config.recipients,
                subject=subject,
                html_content=html,
                attachments=attachments
            )
            
            if success:
                logger.info("custom_notification_sent", subject=subject)
            
            return success
        
        except Exception as e:
            logger.error(
                "custom_notification_failed",
                error=str(e),
                exc_info=True
            )
            return False

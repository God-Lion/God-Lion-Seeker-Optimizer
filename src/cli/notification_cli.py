"""CLI for testing and managing email notifications"""
import asyncio
import click
from pathlib import Path
from datetime import datetime

from src.config.settings import settings
from src.notifications.email_service import EmailService, EmailConfig
from src.notifications.notification_manager import NotificationManager, NotificationConfig
from src.notifications.email_templates import EmailTemplateGenerator


@click.group()
def cli():
    """Email notification management CLI"""
    pass


@cli.command()
@click.option('--to', '-t', default=None, help='Recipient email (uses config default if not specified)')
def test_email(to):
    """Send a test email to verify configuration"""
    click.echo("📧 Testing email configuration...")
    
    if not settings.email_enabled:
        click.echo("❌ Email is disabled in configuration. Set EMAIL_ENABLED=true in .env file.")
        return
    
    if not settings.sender_email or not settings.sender_password:
        click.echo("❌ Email credentials not configured. Please set SENDER_EMAIL and SENDER_PASSWORD in .env file.")
        return
    
    try:
        # Create email service
        email_config = EmailConfig(
            smtp_server=settings.smtp_server,
            smtp_port=settings.smtp_port,
            sender_email=settings.sender_email,
            sender_password=settings.sender_password,
            sender_name=settings.sender_name,
            use_tls=settings.smtp_use_tls,
            use_ssl=settings.smtp_use_ssl
        )
        
        email_service = EmailService(email_config)
        
        # Get recipient
        recipient = to or settings.recipient_email_list[0] if settings.recipient_email_list else None
        
        if not recipient:
            click.echo("❌ No recipient specified. Use --to option or set RECIPIENT_EMAILS in .env file.")
            return
        
        # Send test email
        success = email_service.send_test_email(recipient)
        
        if success:
            click.echo(f"✅ Test email sent successfully to {recipient}")
        else:
            click.echo(f"❌ Failed to send test email to {recipient}")
    
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}")


@cli.command()
def show_config():
    """Display current email configuration"""
    click.echo("\n📋 Email Configuration:")
    click.echo("=" * 50)
    click.echo(f"Enabled: {settings.email_enabled}")
    click.echo(f"SMTP Server: {settings.smtp_server}:{settings.smtp_port}")
    click.echo(f"Use TLS: {settings.smtp_use_tls}")
    click.echo(f"Use SSL: {settings.smtp_use_ssl}")
    click.echo(f"Sender: {settings.sender_email}")
    click.echo(f"Sender Name: {settings.sender_name}")
    click.echo(f"Recipients: {', '.join(settings.recipient_email_list) if settings.recipient_email_list else 'None configured'}")
    click.echo("\n📬 Notification Settings:")
    click.echo("=" * 50)
    click.echo(f"Notify on New Jobs: {settings.notify_on_new_jobs}")
    click.echo(f"Notify on High Matches: {settings.notify_on_high_matches}")
    click.echo(f"Send Daily Summary: {settings.send_daily_summary}")
    click.echo(f"Notify on Errors: {settings.notify_on_errors}")
    click.echo(f"High Match Threshold: {settings.high_match_threshold}%")
    click.echo(f"Summary Time: {settings.summary_time}")
    click.echo(f"Min Jobs for Notification: {settings.min_jobs_for_notification}")
    click.echo(f"Max Jobs per Email: {settings.max_jobs_per_email}")


@cli.command()
def send_sample_new_jobs():
    """Send a sample new jobs notification"""
    click.echo("📧 Sending sample new jobs notification...")
    
    if not _check_email_config():
        return
    
    # Create sample jobs data
    sample_jobs = [
        {
            'title': 'Senior Python Developer',
            'company': 'Tech Corp Inc.',
            'location': 'San Francisco, CA',
            'date': 'Today',
            'link': 'https://linkedin.com/jobs/sample-1',
            'match_score': 85,
            'is_new': True,
            'posted_hours_ago': 2
        },
        {
            'title': 'Full Stack Engineer',
            'company': 'Startup XYZ',
            'location': 'Remote',
            'date': '1 day ago',
            'link': 'https://linkedin.com/jobs/sample-2',
            'match_score': 78,
            'is_new': True,
            'posted_hours_ago': 20
        },
        {
            'title': 'Software Engineer',
            'company': 'Big Company LLC',
            'location': 'New York, NY',
            'date': '2 days ago',
            'link': 'https://linkedin.com/jobs/sample-3',
            'match_score': 65,
            'is_new': False,
            'posted_hours_ago': 48
        }
    ]
    
    try:
        notification_manager = _create_notification_manager()
        
        asyncio.run(
            notification_manager.notify_new_jobs(
                jobs=sample_jobs,
                profile_name="Sample Profile"
            )
        )
        
        click.echo("✅ Sample notification sent successfully!")
    
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}")


@cli.command()
def send_sample_high_match():
    """Send a sample high-match alert"""
    click.echo("📧 Sending sample high-match alert...")
    
    if not _check_email_config():
        return
    
    # This would normally query the database
    click.echo("⚠️  This command requires database access.")
    click.echo("Use 'send_sample_new_jobs' for a preview without database.")


@cli.command()
def send_sample_daily_summary():
    """Send a sample daily summary"""
    click.echo("📧 Sending sample daily summary...")
    
    if not _check_email_config():
        return
    
    try:
        notification_manager = _create_notification_manager()
        asyncio.run(notification_manager.send_daily_summary())
        click.echo("✅ Daily summary sent successfully!")
    
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}")


@cli.command()
@click.option('--subject', '-s', required=True, help='Email subject')
@click.option('--message', '-m', required=True, help='Email message')
def send_custom(subject, message):
    """Send a custom notification"""
    click.echo("📧 Sending custom notification...")
    
    if not _check_email_config():
        return
    
    try:
        notification_manager = _create_notification_manager()
        
        asyncio.run(
            notification_manager.notify_custom(
                subject=subject,
                message=message
            )
        )
        
        click.echo("✅ Custom notification sent successfully!")
    
    except Exception as e:
        click.echo(f"❌ Error: {str(e)}")


@cli.command()
def generate_template_html():
    """Generate sample HTML templates for preview"""
    click.echo("📝 Generating sample HTML templates...")
    
    output_dir = Path("email_templates_preview")
    output_dir.mkdir(exist_ok=True)
    
    template_gen = EmailTemplateGenerator()
    
    # Sample data
    sample_jobs = [
        {
            'title': 'Senior Python Developer',
            'company': 'Tech Corp Inc.',
            'location': 'San Francisco, CA',
            'date': 'Today',
            'link': 'https://linkedin.com/jobs/sample-1',
            'match_score': 85,
            'is_new': True,
            'posted_hours_ago': 2
        },
        {
            'title': 'Full Stack Engineer',
            'company': 'Startup XYZ',
            'location': 'Remote',
            'date': '1 day ago',
            'link': 'https://linkedin.com/jobs/sample-2',
            'match_score': 78,
            'is_new': True,
            'posted_hours_ago': 20
        }
    ]
    
    # Generate new jobs notification
    html = template_gen.generate_new_jobs_notification(
        jobs=sample_jobs,
        profile_name="Sample Profile"
    )
    (output_dir / "new_jobs.html").write_text(html, encoding='utf-8')
    click.echo(f"✅ Generated: {output_dir / 'new_jobs.html'}")
    
    # Generate high match alert
    html = template_gen.generate_high_match_alert(
        jobs=sample_jobs,
        threshold=75.0
    )
    (output_dir / "high_match.html").write_text(html, encoding='utf-8')
    click.echo(f"✅ Generated: {output_dir / 'high_match.html'}")
    
    # Generate daily summary
    summary_data = {
        'date': datetime.now().strftime('%Y-%m-%d'),
        'stats': {
            'jobs_found': 15,
            'jobs_analyzed': 12,
            'high_matches': 3,
            'companies': 8
        },
        'top_jobs': sample_jobs
    }
    html = template_gen.generate_daily_summary(summary_data)
    (output_dir / "daily_summary.html").write_text(html, encoding='utf-8')
    click.echo(f"✅ Generated: {output_dir / 'daily_summary.html'}")
    
    # Generate error notification
    errors = [
        {
            'message': 'Failed to connect to LinkedIn',
            'timestamp': datetime.now().isoformat(),
            'context': 'Scraping session 123'
        },
        {
            'message': 'Database connection timeout',
            'timestamp': datetime.now().isoformat(),
            'context': 'Saving jobs'
        }
    ]
    html = template_gen.generate_error_notification(errors)
    (output_dir / "error_notification.html").write_text(html, encoding='utf-8')
    click.echo(f"✅ Generated: {output_dir / 'error_notification.html'}")
    
    click.echo(f"\n📁 All templates saved to: {output_dir.absolute()}")
    click.echo("Open these files in a browser to preview the email templates.")


def _check_email_config() -> bool:
    """Check if email is properly configured"""
    if not settings.email_enabled:
        click.echo("❌ Email is disabled. Set EMAIL_ENABLED=true in .env file.")
        return False
    
    if not settings.sender_email or not settings.sender_password:
        click.echo("❌ Email credentials not configured.")
        return False
    
    if not settings.recipient_email_list:
        click.echo("❌ No recipients configured. Set RECIPIENT_EMAILS in .env file.")
        return False
    
    return True


def _create_notification_manager() -> NotificationManager:
    """Create notification manager instance"""
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
    
    return NotificationManager(email_config, notification_config)


if __name__ == '__main__':
    cli()

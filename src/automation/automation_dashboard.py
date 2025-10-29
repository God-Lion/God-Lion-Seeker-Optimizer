"""
Automation Dashboard - Monitor and Control the Automation System
Real-time monitoring, statistics, and control interface
Refactored to use async architecture
"""
import asyncio
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import structlog

from .automation_config import AutomationConfig
from src.repositories.job_repository import JobRepository
from src.repositories.job_analysis_repository import JobAnalysisRepository
from src.repositories.scraping_session_repository import ScrapingSessionRepository
from src.config.database import get_session

logger = structlog.get_logger(__name__)


class AutomationDashboard:
    """
    Interactive dashboard for monitoring automation system
    """
    
    def __init__(self, config_file: str = "automation_config.json"):
        """Initialize dashboard"""
        self.config_file = config_file
        self.config = AutomationConfig.from_file(config_file)
    
    def clear_screen(self):
        """Clear console screen"""
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def show_header(self):
        """Display dashboard header"""
        print("=" * 80)
        print("LINKEDIN JOBS SCRAPER - AUTOMATION DASHBOARD".center(80))
        print("=" * 80)
        print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}".center(80))
        print("=" * 80)
    
    async def show_system_status(self):
        """Display system status"""
        print("\n📊 SYSTEM STATUS")
        print("-" * 80)
        
        # Configuration status
        automation_enabled = self.config.automation_settings.enabled
        status_icon = "🟢" if automation_enabled else "🔴"
        print(f"{status_icon} Automation: {'Enabled' if automation_enabled else 'Disabled'}")
        
        # Check if automation is running
        if os.path.exists('automation.pid'):
            print("🟢 Status: Running")
        else:
            print("⚪ Status: Stopped")
        
        # Next scheduled run
        exec_times = self.config.automation_settings.execution_times
        if exec_times:
            next_time = self._get_next_execution_time(exec_times)
            print(f"⏰ Next Run: {next_time}")
        
        # Database status
        try:
            async with get_session() as db_session:
                job_repo = JobRepository(db_session)
                _ = await job_repo.count()
                print("🟢 Database: Connected")
        except:
            print("🔴 Database: Disconnected")
        
        # Matcher status
        matcher_enabled = self.config.matching_settings.enabled
        matcher_icon = "🟢" if matcher_enabled else "⚪"
        print(f"{matcher_icon} Job Matching: {'Enabled' if matcher_enabled else 'Disabled'}")
        
        # Notifications
        notifications = []
        if self.config.notification_settings.email_enabled:
            notifications.append("Email")
        if self.config.notification_settings.slack_enabled:
            notifications.append("Slack")
        notif_text = ", ".join(notifications) if notifications else "None"
        print(f"📧 Notifications: {notif_text}")
    
    def _get_next_execution_time(self, exec_times: List[str]) -> str:
        """Calculate next execution time"""
        now = datetime.now()
        today = now.date()
        
        next_times = []
        for time_str in exec_times:
            try:
                hour, minute = map(int, time_str.split(':'))
                exec_datetime = datetime.combine(
                    today, 
                    datetime.min.time().replace(hour=hour, minute=minute)
                )
                
                if exec_datetime > now:
                    next_times.append(exec_datetime)
                else:
                    next_times.append(exec_datetime + timedelta(days=1))
            except:
                continue
        
        if next_times:
            next_run = min(next_times)
            return next_run.strftime('%Y-%m-%d %H:%M:%S')
        return "Not scheduled"
    
    async def show_database_statistics(self):
        """Display database statistics"""
        print("\n📈 DATABASE STATISTICS")
        print("-" * 80)
        
        try:
            async with get_session() as db_session:
                job_repo = JobRepository(db_session)
                analysis_repo = JobAnalysisRepository(db_session)
                session_repo = ScrapingSessionRepository(db_session)
                
                # Get statistics
                total_jobs = await job_repo.count()
                recent_jobs = await job_repo.get_recent_jobs(limit=24*60)
                total_sessions = await session_repo.count()
                stats = await analysis_repo.get_statistics()
                
                print(f"Total Jobs: {total_jobs:,}")
                print(f"Jobs (24h): {len(recent_jobs):,}")
                print(f"Sessions: {total_sessions:,}")
                print(f"Analyzed: {stats.get('total_analyzed', 0):,}")
                
                # Show match distribution
                if stats.get('match_distribution'):
                    print(f"\n🎯 Match Distribution:")
                    for category, count in stats['match_distribution'].items():
                        print(f"   {category}: {count}")
        
        except Exception as e:
            logger.error("statistics_load_failed", error=str(e))
            print(f"Error loading statistics: {e}")
    
    async def show_recent_activity(self):
        """Display recent scraping activity"""
        print("\n🕐 RECENT ACTIVITY")
        print("-" * 80)
        
        try:
            async with get_session() as db_session:
                job_repo = JobRepository(db_session)
                recent_jobs = await job_repo.get_recent_jobs(limit=5)
                
                if recent_jobs:
                    print("Latest Jobs:")
                    for job in recent_jobs:
                        scraped_time = job.scraped_at.strftime('%Y-%m-%d %H:%M') if job.scraped_at else 'Unknown'
                        company = job.company.name if job.company else 'Unknown'
                        print(f"   • {job.title} at {company} ({scraped_time})")
                else:
                    print("No recent jobs found")
        
        except Exception as e:
            logger.error("recent_activity_load_failed", error=str(e))
            print(f"Error loading recent activity: {e}")
    
    def show_scraping_profiles(self):
        """Display configured scraping profiles"""
        print("\n🎯 SCRAPING PROFILES")
        print("-" * 80)
        
        profiles = self.config.scraping_profiles
        
        if not profiles:
            print("No profiles configured")
            return
        
        for profile in profiles:
            status_icon = "✅" if profile.enabled else "⚪"
            query_count = len(profile.queries)
            
            print(f"{status_icon} {profile.profile_name} (Priority: {profile.priority})")
            print(f"   Queries: {query_count}")
            
            # Show first query
            if profile.queries:
                first_query = profile.queries[0]
                locations = ', '.join(first_query.get('locations', ['N/A'])[:2])
                print(f"   Example: \"{first_query.get('query', 'N/A')}\" in {locations}")
    
    async def show_logs(self):
        """Display recent log entries"""
        print("\n📋 RECENT LOGS")
        print("-" * 80)
        
        log_dir = Path(self.config.logging_settings.log_directory)
        
        if not log_dir.exists():
            print("No logs found")
            return
        
        # Find today's log file
        today_log = log_dir / f"automation_{datetime.now().strftime('%Y%m%d')}.log"
        
        if today_log.exists():
            try:
                with open(today_log, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    # Show last 10 lines
                    for line in lines[-10:]:
                        print(f"   {line.strip()}")
            except Exception as e:
                print(f"Error reading logs: {e}")
        else:
            print("No logs for today")
    
    def show_export_info(self):
        """Display export information"""
        print("\n💾 EXPORT & BACKUP")
        print("-" * 80)
        
        # Export info
        export_dir = Path(self.config.export_settings.export_directory)
        if export_dir.exists():
            export_files = list(export_dir.glob('*'))
            print(f"Export Files: {len(export_files)}")
            if export_files:
                latest = max(export_files, key=lambda f: f.stat().st_mtime)
                print(f"Latest Export: {latest.name}")
        else:
            print("Export directory not found")
        
        # Backup info
        backup_dir = Path(self.config.database_settings.backup_directory)
        if backup_dir.exists():
            backup_files = list(backup_dir.glob('*.json'))
            print(f"Backups: {len(backup_files)}")
            if backup_files:
                latest_backup = max(backup_files, key=lambda f: f.stat().st_mtime)
                backup_time = datetime.fromtimestamp(latest_backup.stat().st_mtime)
                print(f"Latest Backup: {backup_time.strftime('%Y-%m-%d %H:%M:%S')}")
        else:
            print("Backup directory not found")
    
    async def show_full_dashboard(self):
        """Display complete dashboard"""
        self.clear_screen()
        self.show_header()
        await self.show_system_status()
        await self.show_database_statistics()
        await self.show_recent_activity()
        self.show_scraping_profiles()
        self.show_export_info()
        print("\n" + "=" * 80)
    
    async def interactive_mode(self):
        """Run interactive dashboard"""
        while True:
            await self.show_full_dashboard()
            
            print("\nOptions:")
            print("  [R] Refresh")
            print("  [L] View Logs")
            print("  [S] View Scraping Profiles")
            print("  [D] Database Statistics")
            print("  [Q] Quit")
            print()
            
            choice = input("Select option: ").strip().upper()
            
            if choice == 'R':
                continue
            elif choice == 'L':
                self.clear_screen()
                self.show_header()
                await self.show_logs()
                input("\nPress Enter to continue...")
            elif choice == 'S':
                self.clear_screen()
                self.show_header()
                self.show_scraping_profiles()
                input("\nPress Enter to continue...")
            elif choice == 'D':
                self.clear_screen()
                self.show_header()
                await self.show_database_statistics()
                await self.show_recent_activity()
                input("\nPress Enter to continue...")
            elif choice == 'Q':
                print("\nGoodbye!")
                break
            else:
                print("Invalid option")
                await asyncio.sleep(1)
    
    async def auto_refresh_mode(self, interval: int = 30):
        """Auto-refresh dashboard mode"""
        try:
            while True:
                await self.show_full_dashboard()
                print(f"\nAuto-refreshing every {interval} seconds... (Ctrl+C to stop)")
                await asyncio.sleep(interval)
        except KeyboardInterrupt:
            print("\n\nStopped.")


async def main_dashboard():
    """Main entry point for dashboard"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Automation Dashboard')
    parser.add_argument('--auto-refresh', type=int, metavar='SECONDS', 
                       help='Auto-refresh every N seconds')
    parser.add_argument('--once', action='store_true', 
                       help='Show dashboard once and exit')
    parser.add_argument('--config', default='automation_config.json',
                       help='Config file path')
    
    args = parser.parse_args()
    
    dashboard = AutomationDashboard(config_file=args.config)
    
    if args.once:
        await dashboard.show_full_dashboard()
    elif args.auto_refresh:
        await dashboard.auto_refresh_mode(args.auto_refresh)
    else:
        await dashboard.interactive_mode()


if __name__ == "__main__":
    asyncio.run(main_dashboard())

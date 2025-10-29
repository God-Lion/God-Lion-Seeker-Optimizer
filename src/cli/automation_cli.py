"""
CLI for automation system
Entry point for running and managing the automation
"""
import asyncio
import argparse
import sys
from pathlib import Path

from src.automation.automation_service import AutomationService
from src.automation.automation_dashboard import AutomationDashboard
from src.automation.automation_config import AutomationConfig, ScrapingProfile


async def run_once(config_file: str):
    """Run automation once"""
    service = AutomationService(config_file=config_file)
    await service.run_once()


async def start_scheduler(config_file: str):
    """Start the automation scheduler"""
    service = AutomationService(config_file=config_file)
    service.start_scheduler()


async def show_status(config_file: str):
    """Show automation status"""
    service = AutomationService(config_file=config_file)
    status = await service.get_status()
    
    print("\n" + "="*60)
    print("AUTOMATION SYSTEM STATUS")
    print("="*60)
    print(f"Running: {status['is_running']}")
    print(f"Matching Enabled: {status['matching_enabled']}")
    print(f"Config File: {status['config_loaded']}")
    print(f"Next Scheduled Run: {status.get('next_run', 'N/A')}")
    print("\nStatistics:")
    for key, value in status['statistics'].items():
        print(f"  {key}: {value}")
    print("="*60 + "\n")


async def run_dashboard(config_file: str, auto_refresh: int = None, once: bool = False):
    """Run the dashboard"""
    dashboard = AutomationDashboard(config_file=config_file)
    
    if once:
        await dashboard.show_full_dashboard()
    elif auto_refresh:
        await dashboard.auto_refresh_mode(auto_refresh)
    else:
        await dashboard.interactive_mode()


async def generate_summary(config_file: str):
    """Generate daily summary"""
    service = AutomationService(config_file=config_file)
    await service.generate_daily_summary()


async def run_maintenance(config_file: str):
    """Run database maintenance"""
    service = AutomationService(config_file=config_file)
    await service.database_maintenance()


def create_default_config(config_file: str):
    """Create default configuration file"""
    config = AutomationConfig.create_default()
    config.to_file(config_file)
    print(f"✅ Default configuration created: {config_file}")


def list_profiles(config_file: str):
    """List all scraping profiles"""
    config = AutomationConfig.from_file(config_file)
    
    print("\n" + "="*60)
    print("SCRAPING PROFILES")
    print("="*60)
    
    if not config.scraping_profiles:
        print("No profiles configured")
        return
    
    for profile in config.scraping_profiles:
        status = "✅ ENABLED" if profile.enabled else "⚪ DISABLED"
        print(f"\n{profile.profile_name} {status}")
        print(f"  Priority: {profile.priority}")
        print(f"  Queries: {len(profile.queries)}")
        
        for i, query in enumerate(profile.queries, 1):
            print(f"    {i}. \"{query.get('query')}\" in {', '.join(query.get('locations', [])[:2])}")
    
    print("="*60 + "\n")


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description='LinkedIn Job Automation System',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run automation once
  python -m cli.automation_cli run-once
  
  # Start scheduler
  python -m cli.automation_cli start
  
  # Show status
  python -m cli.automation_cli status
  
  # Run dashboard
  python -m cli.automation_cli dashboard
  
  # Create default config
  python -m cli.automation_cli init-config
  
  # List profiles
  python -m cli.automation_cli list-profiles
        """
    )
    
    parser.add_argument(
        '--config',
        default='automation_config.json',
        help='Configuration file path (default: automation_config.json)'
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Commands')
    
    # Run once
    subparsers.add_parser('run-once', help='Run automation once and exit')
    
    # Start scheduler
    subparsers.add_parser('start', help='Start automation scheduler')
    
    # Status
    subparsers.add_parser('status', help='Show system status')
    
    # Dashboard
    dashboard_parser = subparsers.add_parser('dashboard', help='Run interactive dashboard')
    dashboard_parser.add_argument('--auto-refresh', type=int, metavar='SECONDS',
                                   help='Auto-refresh every N seconds')
    dashboard_parser.add_argument('--once', action='store_true',
                                   help='Show dashboard once and exit')
    
    # Summary
    subparsers.add_parser('summary', help='Generate daily summary')
    
    # Maintenance
    subparsers.add_parser('maintenance', help='Run database maintenance')
    
    # Init config
    subparsers.add_parser('init-config', help='Create default configuration file')
    
    # List profiles
    subparsers.add_parser('list-profiles', help='List all scraping profiles')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    try:
        if args.command == 'run-once':
            asyncio.run(run_once(args.config))
        
        elif args.command == 'start':
            asyncio.run(start_scheduler(args.config))
        
        elif args.command == 'status':
            asyncio.run(show_status(args.config))
        
        elif args.command == 'dashboard':
            asyncio.run(run_dashboard(
                args.config,
                auto_refresh=args.auto_refresh,
                once=args.once
            ))
        
        elif args.command == 'summary':
            asyncio.run(generate_summary(args.config))
        
        elif args.command == 'maintenance':
            asyncio.run(run_maintenance(args.config))
        
        elif args.command == 'init-config':
            create_default_config(args.config)
        
        elif args.command == 'list-profiles':
            list_profiles(args.config)
    
    except KeyboardInterrupt:
        print("\n\n🛑 Stopped by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()

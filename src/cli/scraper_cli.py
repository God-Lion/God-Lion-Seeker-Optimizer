"""
Command-line interface for the async job scraper.
Provides easy access to scraping functionality with support for multiple platforms.
"""
import asyncio
import argparse
import sys
import json
import os
from typing import Optional, List
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from src.scrapers.async_linkedin_scraper import AsyncLinkedInScraper, ScraperConfig
from src.scrapers.async_indeed_scraper import AsyncIndeedScraper
from src.scrapers.hybrid_indeed_scraper import HybridIndeedScraper
from src.services.job_scraping_service import JobScrapingService
from src.services.multi_platform_storage_service import MultiPlatformStorageService
import structlog

# Configure logging
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.dev.ConsoleRenderer()
    ]
)

logger = structlog.get_logger(__name__)


class Colors:
    """ANSI color codes for terminal output"""
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_header(text: str):
    """Print colored header"""
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text:^60}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*60}{Colors.ENDC}\n")


def print_success(text: str):
    """Print success message"""
    print(f"{Colors.GREEN}✅ {text}{Colors.ENDC}")


def print_error(text: str):
    """Print error message"""
    print(f"{Colors.RED}❌ {text}{Colors.ENDC}")


def print_info(text: str):
    """Print info message"""
    print(f"{Colors.CYAN}ℹ️  {text}{Colors.ENDC}")


def print_warning(text: str):
    """Print warning message"""
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.ENDC}")


async def scrape_platform(
    platform: str,
    query: str,
    location: Optional[str],
    limit: int,
    config: ScraperConfig,
    filters: dict,
    use_auth: bool,
    use_google_sso: bool,
    output_file: Optional[str] = None
) -> List:
    """Scrape jobs from a specific platform"""
    
    print_info(f"Scraping {platform.upper()}...")
    
    if platform == 'indeed':
        # Indeed scraper - Use Hybrid for better performance
        print_info("Using Hybrid Indeed Scraper for enhanced performance")
        
        async with HybridIndeedScraper(
            config=config,
            indeed_email=os.getenv('INDEED_EMAIL') if use_auth else None,
            indeed_password=os.getenv('INDEED_PASSWORD') if use_auth else None
        ) as scraper:
            jobs = await scraper.scrape_jobs(
                query=query,
                location=location,
                limit=limit,
                filters=filters
            )
            
            # Print results
            print_success(f"Scraped {len(jobs)} jobs from Indeed!")
            
            if jobs:
                print("\n📋 Sample Jobs:")
                for i, job in enumerate(jobs[:3], 1):
                    print(f"\n{i}. {Colors.BOLD}{job.title}{Colors.ENDC}")
                    print(f"   🏢 {job.company_name}")
                    print(f"   📍 {job.location or 'Not specified'}")
                    print(f"   🔗 {job.link}")
                    if job.job_type:
                        print(f"   💼 {job.job_type}")
                
                if len(jobs) > 3:
                    print(f"\n   ... and {len(jobs) - 3} more jobs")
            
            # Print stats
            stats = scraper.get_stats()
            print(f"\n📊 Statistics:")
            print(f"   Jobs scraped: {stats['jobs_scraped']}")
            print(f"   Errors: {stats['errors']}")
            if scraper.is_authenticated:
                print(f"   Authentication: ✅ Successful")
            else:
                print(f"   Authentication: ⚠️  Not authenticated")
            
            return jobs
            
    elif platform == 'linkedin':
        # LinkedIn scraper
        email = os.getenv('LINKEDIN_EMAIL') if use_auth else None
        password = os.getenv('LINKEDIN_PASSWORD') if use_auth else None
        
        if use_auth and not (email and password):
            print_warning("LinkedIn credentials not found in .env file")
            email = input("LinkedIn Email: ")
            import getpass
            password = getpass.getpass("LinkedIn Password: ")
        
        async with AsyncLinkedInScraper(
            config,
            linkedin_email=email,
            linkedin_password=password
        ) as scraper:
            jobs = await scraper.scrape_jobs(
                query=query,
                location=location,
                limit=limit,
                filters=filters
            )
            
            print_success(f"Scraped {len(jobs)} jobs from LinkedIn!")
            
            if jobs:
                print("\n📋 Sample Jobs:")
                for i, job in enumerate(jobs[:3], 1):
                    print(f"\n{i}. {Colors.BOLD}{job.title}{Colors.ENDC}")
                    print(f"   🏢 {job.company_name}")
                    print(f"   📍 {job.location or 'Not specified'}")
                    print(f"   🔗 {job.link}")
                    if job.job_type:
                        print(f"   💼 {job.job_type}")
                
                if len(jobs) > 3:
                    print(f"\n   ... and {len(jobs) - 3} more jobs")
            
            # Print stats
            stats = scraper.get_stats()
            print(f"\n📊 Statistics:")
            print(f"   Jobs scraped: {stats['jobs_scraped']}")
            print(f"   Errors: {stats['errors']}")
            
            return jobs
    
    return []


async def scrape_command(args):
    """Handle scrape command"""
    
    # Determine platforms to scrape
    platforms = []
    if args.indeed:
        platforms.append('indeed')
    if args.linkedin:
        platforms.append('linkedin')
    
    # If no platform specified, scrape both
    if not platforms:
        platforms = ['indeed', 'linkedin']
        print_info("No platform specified, scraping both Indeed and LinkedIn")
    
    print_header(f"Job Scraper - {', '.join([p.upper() for p in platforms])}")
    
    print_info(f"Query: {args.query}")
    print_info(f"Location: {args.location or 'Any'}")
    print_info(f"Limit per platform: {args.limit}")
    print_info(f"Concurrent browsers: {args.concurrent}")
    print_info(f"Authentication: {'Enabled' if args.auth else 'Disabled'}")
    print_info(f"Store in DB: {'Yes' if args.store else 'No'}")
    print_info(f"Debug mode: {'Enabled' if args.debug else 'Disabled'}")
    
    # Set debug mode
    if args.debug:
        os.environ['DEBUG'] = 'true'
        print_warning("Debug mode enabled - browsers will be visible and screenshots will be saved")
    
    # Verify Google credentials if needed
    use_google_sso = args.auth and (
        os.getenv('INDEED_USE_GOOGLE_SSO', '').lower() == 'true' or
        'indeed' in platforms
    )
    
    if use_google_sso and 'indeed' in platforms:
        if not os.getenv('GOOGLE_EMAIL') or not os.getenv('GOOGLE_PASSWORD'):
            print_error("Google credentials not found in .env file!")
            print_info("Please set GOOGLE_EMAIL and GOOGLE_PASSWORD in your .env file")
            if not args.auth:
                print_info("Continuing without authentication...")
                use_google_sso = False
            else:
                sys.exit(1)
    
    # Parse filters
    filters = {}
    if args.experience:
        filters['experience_level'] = args.experience
    if args.job_type:
        filters['job_type'] = args.job_type
    if args.remote:
        filters['remote'] = args.remote
    if args.date_posted:
        filters['date_posted'] = args.date_posted
    
    if filters:
        print_info(f"Filters: {filters}")
    
    print("\n")
    
    try:
        # Configure scraper
        config = ScraperConfig(
            max_concurrent=args.concurrent,
            timeout=args.timeout,
            retry_attempts=args.retry,
            headless=not args.debug  # Show browser in debug mode
        )
        
        all_jobs = []
        
        # Scrape each platform
        for platform in platforms:
            try:
                jobs = await scrape_platform(
                    platform=platform,
                    query=args.query,
                    location=args.location,
                    limit=args.limit,
                    config=config,
                    filters=filters,
                    use_auth=args.auth,
                    use_google_sso=use_google_sso,
                    output_file=args.output
                )
                all_jobs.extend(jobs)
                
                # Add delay between platforms
                if len(platforms) > 1 and platform != platforms[-1]:
                    print_info("Waiting before scraping next platform...")
                    await asyncio.sleep(5)
                    
            except Exception as e:
                print_error(f"Failed to scrape {platform}: {str(e)}")
                logger.exception(f"{platform}_scraping_failed")
                continue
        
        # Summary
        print("\n" + "="*60)
        print_success(f"Total jobs scraped: {len(all_jobs)}")
        print("="*60 + "\n")
        
        # Store in database if requested
        if args.store and all_jobs:
            print_info("Storing jobs in database...")
            try:
                await store_jobs_in_database(
                    all_jobs=all_jobs,
                    platforms=platforms,
                    query=args.query,
                    location=args.location,
                    session_name=args.session_name
                )
                print_success(f"Stored {len(all_jobs)} jobs in database!")
            except Exception as e:
                print_error(f"Failed to store jobs in database: {str(e)}")
                logger.exception("database_storage_failed")
        
        # Export to JSON if requested
        if args.output:
            export_to_json(all_jobs, args.output, platforms)
            print_success(f"Exported {len(all_jobs)} jobs to: {args.output}")
        
    except KeyboardInterrupt:
        print_warning("Scraping interrupted by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"Scraping failed: {str(e)}")
        logger.exception("scraping_failed")
        sys.exit(1)


async def list_sessions_command(args):
    """Handle list-sessions command"""
    print_header("Recent Scraping Sessions")
    
    try:
        service = JobScrapingService()
        sessions = await service.list_scraping_sessions(
            limit=args.limit,
            status=args.status
        )
        
        if not sessions:
            print_info("No sessions found")
            return
        
        print(f"Found {len(sessions)} sessions:\n")
        
        for session in sessions:
            status_color = {
                'completed': Colors.GREEN,
                'running': Colors.YELLOW,
                'failed': Colors.RED
            }.get(session.status, Colors.CYAN)
            
            print(f"{Colors.BOLD}Session #{session.id}{Colors.ENDC}")
            print(f"  Name: {session.name}")
            print(f"  Status: {status_color}{session.status}{Colors.ENDC}")
            print(f"  Query: {session.query}")
            print(f"  Location: {session.location or 'Any'}")
            print(f"  Started: {session.started_at}")
            if session.completed_at:
                duration = (session.completed_at - session.started_at).total_seconds()
                print(f"  Duration: {duration:.1f}s")
            print(f"  Jobs Found: {session.jobs_found or 0}")
            print(f"  Jobs Stored: {session.jobs_stored or 0}")
            if session.error_message:
                print(f"  Error: {Colors.RED}{session.error_message}{Colors.ENDC}")
            print()
        
    except Exception as e:
        print_error(f"Failed to list sessions: {str(e)}")
        sys.exit(1)


async def store_jobs_in_database(
    all_jobs: List,
    platforms: List[str],
    query: str,
    location: Optional[str],
    session_name: Optional[str]
):
    """
    Store scraped jobs in database, organized by platform.
    
    Args:
        all_jobs: List of all scraped JobData objects
        platforms: List of platforms that were scraped
        query: Search query used
        location: Location filter used
        session_name: Optional name for scraping sessions
    """
    # Organize jobs by platform
    jobs_by_platform = {}
    
    for job in all_jobs:
        # Determine platform from job_id prefix or default to 'unknown'
        platform = 'unknown'
        
        # Try to determine from job_id
        if hasattr(job, 'job_id') and job.job_id:
            job_id = str(job.job_id)
            if 'linkedin' in job_id or job_id.isdigit():
                platform = 'linkedin'
            elif 'indeed' in job_id or len(job_id) == 16:
                platform = 'indeed'
        
        # Try to determine from link
        if platform == 'unknown' and hasattr(job, 'link') and job.link:
            if 'linkedin.com' in job.link:
                platform = 'linkedin'
            elif 'indeed.com' in job.link:
                platform = 'indeed'
        
        # Initialize platform list if needed
        if platform not in jobs_by_platform:
            jobs_by_platform[platform] = []
        
        jobs_by_platform[platform].append(job)
    
    # Log what we're storing
    logger.info(
        "organizing_jobs_for_storage",
        total_jobs=len(all_jobs),
        platforms_found=list(jobs_by_platform.keys())
    )
    
    # Store jobs for each platform
    storage_service = MultiPlatformStorageService()
    results = []
    
    for platform, jobs in jobs_by_platform.items():
        if not jobs:
            continue
        
        platform_session_name = session_name
        if not platform_session_name:
            platform_session_name = f"{query} - {platform.upper()}"
        else:
            platform_session_name = f"{session_name} - {platform.upper()}"
        
        try:
            logger.info(
                "storing_platform_jobs",
                platform=platform,
                count=len(jobs)
            )
            
            result = await storage_service.store_jobs(
                jobs=jobs,
                platform=platform,
                query=query,
                location=location,
                session_name=platform_session_name
            )
            
            results.append(result)
            
            # Print result for this platform
            print_info(f"{platform.upper()}: Stored {result['jobs_stored']} jobs "                       f"({result['new_jobs']} new, {result['updated_jobs']} updated, "                       f"{result['duplicate_jobs']} duplicates)")
        
        except Exception as e:
            logger.error(
                "platform_storage_failed",
                platform=platform,
                error=str(e)
            )
            print_warning(f"{platform.upper()}: Failed to store - {str(e)}")
            results.append({
                'success': False,
                'platform': platform,
                'error': str(e)
            })
    
    # Print summary
    stats = storage_service.get_stats()
    print(f"\n📊 Storage Summary:")
    print(f"   Total jobs processed: {stats['total_jobs']}")
    print(f"   New jobs: {stats['new_jobs']}")
    print(f"   Updated jobs: {stats['updated_jobs']}")
    print(f"   Duplicates skipped: {stats['duplicate_jobs']}")
    print(f"   Errors: {stats['errors']}")
    
    if stats['by_platform']:
        print(f"\n   By Platform:")
        for platform, pstats in stats['by_platform'].items():
            print(f"      {platform.upper()}: {pstats['jobs_stored']} stored "                  f"({pstats['new']} new, {pstats['updated']} updated)")


def export_to_json(jobs, output_path: str, platforms: List[str]):
    """Export jobs to JSON file"""
    data = {
        'exported_at': datetime.utcnow().isoformat(),
        'platforms': platforms,
        'total_jobs': len(jobs),
        'jobs': [
            {
                'job_id': job.job_id,
                'title': job.title,
                'company_name': job.company_name,
                'location': job.location,
                'link': job.link,
                'description': job.description[:500] if job.description else None,  # Truncate for file size
                'job_type': job.job_type,
                'experience_level': job.experience_level,
                'salary_min': job.salary_min,
                'salary_max': job.salary_max,
                'scraped_at': job.scraped_at.isoformat() if job.scraped_at else None
            }
            for job in jobs
        ]
    }
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


async def test_command(args):
    """Handle test command"""
    print_header("Testing Async Scraper")
    
    print_info("Running quick test with 3 jobs per platform...")
    
    config = ScraperConfig(
        max_concurrent=3,
        timeout=30,
        headless=not args.debug
    )
    
    platforms_to_test = []
    if args.indeed:
        platforms_to_test.append('indeed')
    if args.linkedin:
        platforms_to_test.append('linkedin')
    if not platforms_to_test:
        platforms_to_test = ['indeed', 'linkedin']
    
    try:
        for platform in platforms_to_test:
            print_info(f"\nTesting {platform.upper()} scraper...")
            
            if platform == 'indeed':
                print_info("Using Hybrid Indeed Scraper")
                
                async with HybridIndeedScraper(config=config) as scraper:
                    jobs = await scraper.scrape_jobs(
                        query="Python Developer",
                        location="Remote",
                        limit=3
                    )
                    
                    if jobs:
                        print_success(f"Indeed test passed! Scraped {len(jobs)} jobs")
                        job = jobs[0]
                        print(f"  Sample: {job.title} at {job.company_name}")
                        if scraper.is_authenticated:
                            print_success("  Authentication: ✅ Successful")
                    else:
                        print_warning("Test completed but no jobs found")
                        
            elif platform == 'linkedin':
                async with AsyncLinkedInScraper(config) as scraper:
                    jobs = await scraper.scrape_jobs(
                        query="Python Developer",
                        location="Remote",
                        limit=3
                    )
                    
                    if jobs:
                        print_success(f"LinkedIn test passed! Scraped {len(jobs)} jobs")
                        job = jobs[0]
                        print(f"  Sample: {job.title} at {job.company_name}")
                    else:
                        print_warning("Test completed but no jobs found")
        
        print("\n" + "="*60)
        print_success("All tests completed!")
        print("="*60)
        
    except Exception as e:
        print_error(f"Test failed: {str(e)}")
        logger.exception("test_failed")
        sys.exit(1)


def main():
    """Main CLI entry point"""
    parser = argparse.ArgumentParser(
        description="Multi-Platform Job Scraper CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Scrape both platforms (default)
  python run_cli.py scrape "Python Developer" --limit 10
  
  # Scrape only Indeed
  python run_cli.py scrape "Python Developer" --indeed --limit 20
  
  # Scrape only LinkedIn
  python run_cli.py scrape "Data Scientist" --linkedin --limit 15
  
  # Scrape both with authentication
  python run_cli.py scrape "Software Engineer" --auth --limit 25
  
  # Debug mode (visible browser, screenshots)
  python run_cli.py scrape "Backend Dev" --debug --indeed --limit 5
  
  # Export to JSON
  python run_cli.py scrape "DevOps" --output jobs.json --limit 30
  
  # Store in database
  python run_cli.py scrape "Frontend" --store --auth --limit 50
  
  # With filters
  python run_cli.py scrape "Full Stack" --job-type fulltime --remote --date-posted 7
  
  # Test scrapers
  python run_cli.py test --indeed
  
  # List sessions
  python run_cli.py list-sessions --limit 10
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Command to run')
    
    # Scrape command
    scrape_parser = subparsers.add_parser('scrape', help='Scrape jobs from platforms')
    scrape_parser.add_argument('query', help='Search query (e.g., "Python Developer")')
    
    # Platform selection
    scrape_parser.add_argument('--indeed', action='store_true', help='Scrape Indeed (if no platform specified, scrapes all)')
    scrape_parser.add_argument('--linkedin', action='store_true', help='Scrape LinkedIn (if no platform specified, scrapes all)')
    
    # Basic options
    scrape_parser.add_argument('--location', '-l', help='Location filter (e.g., "Remote", "New York")')
    scrape_parser.add_argument('--limit', '-n', type=int, default=10, help='Maximum jobs per platform (default: 10)')
    scrape_parser.add_argument('--concurrent', '-c', type=int, default=5, help='Concurrent browsers (default: 5)')
    scrape_parser.add_argument('--timeout', '-t', type=int, default=30, help='Timeout in seconds (default: 30)')
    scrape_parser.add_argument('--retry', '-r', type=int, default=3, help='Retry attempts (default: 3)')
    
    # Feature flags
    scrape_parser.add_argument('--auth', '-a', action='store_true', help='Enable authentication (uses credentials from .env)')
    scrape_parser.add_argument('--store', '-s', action='store_true', help='Store results in database')
    scrape_parser.add_argument('--debug', '-d', action='store_true', help='Debug mode (visible browser, screenshots)')
    scrape_parser.add_argument('--output', '-o', help='Export to JSON file')
    scrape_parser.add_argument('--session-name', help='Name for scraping session (with --store)')
    
    # Filters
    scrape_parser.add_argument('--experience', '-e', help='Experience level (1-6, comma-separated)')
    scrape_parser.add_argument('--job-type', '-j', help='Job type (fulltime, parttime, contract, etc.)')
    scrape_parser.add_argument('--remote', action='store_true', help='Remote jobs only')
    scrape_parser.add_argument('--date-posted', help='Date posted in days (1, 3, 7, 14, 30)')
    
    # List sessions command
    list_parser = subparsers.add_parser('list-sessions', help='List scraping sessions')
    list_parser.add_argument('--limit', '-n', type=int, default=20, help='Number of sessions (default: 20)')
    list_parser.add_argument('--status', help='Filter by status (completed, running, failed)')
    
    # Test command
    test_parser = subparsers.add_parser('test', help='Run quick test')
    test_parser.add_argument('--indeed', action='store_true', help='Test Indeed only')
    test_parser.add_argument('--linkedin', action='store_true', help='Test LinkedIn only')
    test_parser.add_argument('--debug', '-d', action='store_true', help='Debug mode (visible browser)')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        sys.exit(1)
    
    # Run appropriate command
    if args.command == 'scrape':
        asyncio.run(scrape_command(args))
    elif args.command == 'list-sessions':
        asyncio.run(list_sessions_command(args))
    elif args.command == 'test':
        asyncio.run(test_command(args))


if __name__ == "__main__":
    main()

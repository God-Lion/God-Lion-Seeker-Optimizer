"""
Concurrent job scraper that runs multiple scrapers (LinkedIn, Indeed) simultaneously.
Aggregates results from multiple job boards for comprehensive job search.
"""
import asyncio
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
import structlog

from .base_scraper import ScraperConfig, JobData
from .async_linkedin_scraper import AsyncLinkedInScraper
from .async_indeed_scraper import AsyncIndeedScraper
from .hybrid_indeed_scraper import HybridIndeedScraper

logger = structlog.get_logger(__name__)


class ConcurrentJobScraper:
    """
    Orchestrates multiple job scrapers to run concurrently.
    Aggregates results from LinkedIn, Indeed, and other job boards.
    
    Features:
    - Concurrent scraping of multiple job boards
    - Unified authentication handling
    - Result aggregation and deduplication
    - Comprehensive error handling
    - Detailed statistics tracking
    """
    
    def __init__(
        self,
        config: ScraperConfig = None,
        linkedin_email: Optional[str] = None,
        linkedin_password: Optional[str] = None,
        indeed_email: Optional[str] = None,
        indeed_password: Optional[str] = None,
        enable_linkedin: bool = True,
        enable_indeed: bool = True
    ):
        """
        Initialize concurrent scraper.
        
        Args:
            config: Shared configuration for all scrapers
            linkedin_email: LinkedIn email for authentication
            linkedin_password: LinkedIn password for authentication
            indeed_email: Indeed email for authentication (optional)
            indeed_password: Indeed password for authentication (optional)
            enable_linkedin: Whether to enable LinkedIn scraping
            enable_indeed: Whether to enable Indeed scraping
        """
        self.config = config or ScraperConfig()
        self.linkedin_email = linkedin_email
        self.linkedin_password = linkedin_password
        self.indeed_email = indeed_email
        self.indeed_password = indeed_password
        self.enable_linkedin = enable_linkedin
        self.enable_indeed = enable_indeed
        
        # Initialize scrapers
        self.scrapers: Dict[str, Any] = {}
        self._stats = {
            'total_jobs': 0,
            'godlionseeker': 0,
            'indeed_jobs': 0,
            'duplicates_removed': 0,
            'errors': 0,
            'start_time': None,
            'end_time': None
        }
    
    async def __aenter__(self):
        """Context manager entry - initialize scrapers"""
        logger.info(
            "initializing_concurrent_scraper",
            linkedin_enabled=self.enable_linkedin,
            indeed_enabled=self.enable_indeed
        )
        
        if self.enable_linkedin:
            self.scrapers['linkedin'] = AsyncLinkedInScraper(
                config=self.config,
                linkedin_email=self.linkedin_email,
                linkedin_password=self.linkedin_password
            )
            logger.info("linkedin_scraper_initialized")
        
        if self.enable_indeed:
            # Use HybridIndeedScraper for better performance and robustness
            self.scrapers['indeed'] = HybridIndeedScraper(
                config=self.config,
                indeed_email=self.indeed_email,
                indeed_password=self.indeed_password
            )
            logger.info("hybrid_indeed_scraper_initialized")
        
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - cleanup scrapers"""
        await self.close()
    
    async def scrape_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        limit_per_source: Optional[int] = 100,
        linkedin_filters: Optional[Dict[str, Any]] = None,
        indeed_filters: Optional[Dict[str, Any]] = None,
        deduplicate: bool = True,
        **kwargs
    ) -> Dict[str, List[JobData]]:
        """
        Scrape jobs from all enabled sources concurrently.
        
        Args:
            query: Job search query
            location: Location filter
            limit_per_source: Maximum jobs to scrape per source
            linkedin_filters: LinkedIn-specific filters
                - experience_level: '1,2,3,4,5,6' (Internship, Entry, Associate, Mid-Senior, Director, Executive)
                - job_type: 'F,P,C,T,I' (Full-time, Part-time, Contract, Temporary, Internship)
                - remote: '1,2,3' (On-site, Remote, Hybrid)
                - date_posted: 'r86400,r604800,r2592000' (Past 24h, Past week, Past month)
            indeed_filters: Indeed-specific filters
                - date_posted: 1,3,7,14 (Last 24h, 3 days, 7 days, 14 days)
                - job_type: 'fulltime,parttime,contract,temporary,internship'
                - remote: True/False
                - experience_level: Experience level filter
                - salary: Salary filter
            deduplicate: Whether to remove duplicate jobs
            
        Returns:
            Dictionary mapping source name to list of JobData objects
            Example: {'linkedin': [...], 'indeed': [...], 'all': [...]}
        """
        self._stats['start_time'] = datetime.utcnow()
        
        logger.info(
            "starting_concurrent_scrape",
            query=query,
            location=location,
            sources=list(self.scrapers.keys()),
            limit_per_source=limit_per_source
        )
        
        # Create tasks for each enabled scraper
        tasks = []
        source_names = []
        
        if 'linkedin' in self.scrapers:
            tasks.append(
                self._scrape_linkedin(
                    query,
                    location,
                    limit_per_source,
                    linkedin_filters
                )
            )
            source_names.append('linkedin')
        
        if 'indeed' in self.scrapers:
            tasks.append(
                self._scrape_indeed(
                    query,
                    location,
                    limit_per_source,
                    indeed_filters
                )
            )
            source_names.append('indeed')
        
        # Execute all scrapers concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        aggregated_results = {}
        for source_name, result in zip(source_names, results):
            if isinstance(result, Exception):
                logger.error(
                    "scraper_failed",
                    source=source_name,
                    error=str(result)
                )
                aggregated_results[source_name] = []
                self._stats['errors'] += 1
            else:
                aggregated_results[source_name] = result
                self._stats[f'{source_name}_jobs'] = len(result)
                self._stats['total_jobs'] += len(result)
        
        # Aggregate all jobs
        all_jobs = self.aggregate_jobs(aggregated_results, deduplicate=deduplicate)
        aggregated_results['all'] = all_jobs
        
        self._stats['end_time'] = datetime.utcnow()
        
        duration = (self._stats['end_time'] - self._stats['start_time']).total_seconds()
        
        logger.info(
            "concurrent_scrape_completed",
            total_jobs=len(all_jobs),
            godlionseeker=self._stats.get('godlionseeker', 0),
            indeed_jobs=self._stats.get('indeed_jobs', 0),
            duplicates_removed=self._stats.get('duplicates_removed', 0),
            duration_seconds=duration
        )
        
        return aggregated_results
    
    async def _scrape_linkedin(
        self,
        query: str,
        location: Optional[str],
        limit: Optional[int],
        filters: Optional[Dict[str, Any]]
    ) -> List[JobData]:
        """Scrape jobs from LinkedIn"""
        try:
            logger.info("starting_linkedin_scrape", query=query, limit=limit)
            scraper = self.scrapers['linkedin']
            jobs = await scraper.scrape_jobs(
                query=query,
                location=location,
                limit=limit,
                filters=filters or {}
            )
            logger.info("linkedin_scrape_completed", count=len(jobs))
            return jobs
        except Exception as e:
            logger.error("linkedin_scrape_failed", error=str(e), exc_info=True)
            raise
    
    async def _scrape_indeed(
        self,
        query: str,
        location: Optional[str],
        limit: Optional[int],
        filters: Optional[Dict[str, Any]]
    ) -> List[JobData]:
        """Scrape jobs from Indeed"""
        try:
            logger.info("starting_indeed_scrape", query=query, limit=limit)
            scraper = self.scrapers['indeed']
            jobs = await scraper.scrape_jobs(
                query=query,
                location=location,
                limit=limit,
                filters=filters or {}
            )
            logger.info("indeed_scrape_completed", count=len(jobs))
            return jobs
        except Exception as e:
            logger.error("indeed_scrape_failed", error=str(e), exc_info=True)
            raise
    
    def aggregate_jobs(
        self,
        results: Dict[str, List[JobData]],
        deduplicate: bool = True
    ) -> List[JobData]:
        """
        Aggregate jobs from all sources into a single list.
        
        Args:
            results: Dictionary of source -> jobs
            deduplicate: Whether to remove duplicate jobs (based on title + company)
            
        Returns:
            Combined list of all jobs
        """
        all_jobs = []
        
        for source, jobs in results.items():
            # Add source tag to each job
            for job in jobs:
                # Store source as a custom attribute
                job._source = source
            all_jobs.extend(jobs)
        
        logger.info(
            "jobs_before_deduplication",
            total=len(all_jobs),
            by_source={k: len(v) for k, v in results.items()}
        )
        
        if deduplicate:
            all_jobs = self._deduplicate_jobs(all_jobs)
        
        logger.info(
            "jobs_aggregated",
            total=len(all_jobs),
            deduplicated=deduplicate
        )
        
        return all_jobs
    
    def _deduplicate_jobs(self, jobs: List[JobData]) -> List[JobData]:
        """
        Remove duplicate jobs based on title and company.
        
        Uses fuzzy matching to catch slight variations in job titles.
        """
        seen = set()
        unique_jobs = []
        
        for job in jobs:
            # Create unique key from normalized title and company
            # Normalize: lowercase, strip whitespace, remove special chars
            normalized_title = ''.join(
                c.lower() for c in job.title 
                if c.isalnum() or c.isspace()
            ).strip()
            
            normalized_company = ''.join(
                c.lower() for c in job.company_name 
                if c.isalnum() or c.isspace()
            ).strip()
            
            key = (normalized_title, normalized_company)
            
            if key not in seen:
                seen.add(key)
                unique_jobs.append(job)
            else:
                logger.debug(
                    "duplicate_job_removed",
                    title=job.title,
                    company=job.company_name,
                    source=getattr(job, '_source', 'unknown')
                )
        
        duplicates_removed = len(jobs) - len(unique_jobs)
        self._stats['duplicates_removed'] = duplicates_removed
        
        if duplicates_removed > 0:
            logger.info(
                "duplicates_removed",
                original=len(jobs),
                unique=len(unique_jobs),
                removed=duplicates_removed
            )
        
        return unique_jobs
    
    async def close(self):
        """Close all scrapers"""
        logger.info("closing_concurrent_scraper")
        
        close_tasks = []
        for name, scraper in self.scrapers.items():
            close_tasks.append(self._close_scraper(name, scraper))
        
        await asyncio.gather(*close_tasks, return_exceptions=True)
        
        # Log final stats
        logger.info("concurrent_scraper_closed", stats=self._stats)
    
    async def _close_scraper(self, name: str, scraper: Any):
        """Close a single scraper with error handling"""
        try:
            await scraper.close()
            logger.info("scraper_closed", name=name)
        except Exception as e:
            logger.error("scraper_close_failed", name=name, error=str(e))
    
    def get_stats(self) -> Dict[str, Any]:
        """Get comprehensive statistics from all scrapers"""
        stats = self._stats.copy()
        
        # Add individual scraper stats
        for name, scraper in self.scrapers.items():
            if hasattr(scraper, 'get_stats'):
                stats[f'{name}_details'] = scraper.get_stats()
        
        # Calculate additional metrics
        if stats['start_time'] and stats['end_time']:
            duration = (stats['end_time'] - stats['start_time']).total_seconds()
            stats['duration_seconds'] = duration
            
            if stats['total_jobs'] > 0:
                stats['jobs_per_second'] = stats['total_jobs'] / duration
        
        return stats


# Example usage
async def main():
    """Example usage of ConcurrentJobScraper"""
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    # Configure scrapers
    config = ScraperConfig(
        max_concurrent=5,
        timeout=30,
        retry_attempts=3,
        headless=True
    )
    
    # Create concurrent scraper
    async with ConcurrentJobScraper(
        config=config,
        linkedin_email=os.getenv('LINKEDIN_EMAIL'),
        linkedin_password=os.getenv('LINKEDIN_PASSWORD'),
        indeed_email=os.getenv('INDEED_EMAIL'),
        indeed_password=os.getenv('INDEED_PASSWORD'),
        enable_linkedin=True,
        enable_indeed=True
    ) as scraper:
        
        # Scrape jobs from both sources concurrently
        results = await scraper.scrape_jobs(
            query="Python Developer",
            location="Remote",
            limit_per_source=50,
            linkedin_filters={
                'experience_level': '2,3',  # Entry and Associate
                'job_type': 'F',  # Full-time
                'remote': '2'  # Remote
            },
            indeed_filters={
                'date_posted': 7,  # Last 7 days
                'job_type': 'fulltime',
                'remote': True
            },
            deduplicate=True
        )
        
        # Print results by source
        print("\n" + "="*80)
        print("SCRAPING RESULTS BY SOURCE")
        print("="*80)
        
        for source in ['linkedin', 'indeed']:
            if source in results:
                jobs = results[source]
                print(f"\n{'━'*80}")
                print(f"📊 {source.upper()} - {len(jobs)} jobs found")
                print(f"{'━'*80}")
                
                for i, job in enumerate(jobs[:5], 1):
                    print(f"\n{i}. 📋 {job.title}")
                    print(f"   🏢 {job.company_name}")
                    print(f"   📍 {job.location or 'Not specified'}")
                    print(f"   🔗 {job.link}")
        
        # Print aggregated results
        print("\n" + "="*80)
        print("AGGREGATED RESULTS (Deduplicated)")
        print("="*80)
        
        all_jobs = results.get('all', [])
        print(f"\n✅ Total unique jobs: {len(all_jobs)}")
        
        # Print sample of aggregated results
        print("\nSample jobs:")
        for i, job in enumerate(all_jobs[:10], 1):
            source_label = getattr(job, '_source', 'unknown')
            print(f"\n{i}. 📋 {job.title}")
            print(f"   🏢 {job.company_name}")
            print(f"   📍 {job.location or 'Not specified'}")
            print(f"   🌐 Source: {source_label}")
        
        # Print comprehensive stats
        print("\n" + "="*80)
        print("STATISTICS")
        print("="*80)
        
        stats = scraper.get_stats()
        print(f"\nOverall:")
        print(f"  Total jobs scraped: {stats['total_jobs']}")
        print(f"  LinkedIn jobs: {stats.get('godlionseeker', 0)}")
        print(f"  Indeed jobs: {stats.get('indeed_jobs', 0)}")
        print(f"  Duplicates removed: {stats.get('duplicates_removed', 0)}")
        print(f"  Unique jobs: {len(all_jobs)}")
        print(f"  Errors: {stats['errors']}")
        
        if 'duration_seconds' in stats:
            print(f"  Duration: {stats['duration_seconds']:.2f} seconds")
            if 'jobs_per_second' in stats:
                print(f"  Speed: {stats['jobs_per_second']:.2f} jobs/second")
        
        # Print individual scraper stats
        if 'linkedin_details' in stats:
            print(f"\nLinkedIn Details:")
            linkedin_stats = stats['linkedin_details']
            print(f"  Jobs scraped: {linkedin_stats.get('jobs_scraped', 0)}")
            print(f"  Errors: {linkedin_stats.get('errors', 0)}")
            if 'rate_limiter' in linkedin_stats:
                print(f"  Rate limiter: {linkedin_stats['rate_limiter']}")
        
        if 'indeed_details' in stats:
            print(f"\nIndeed Details:")
            indeed_stats = stats['indeed_details']
            print(f"  Jobs scraped: {indeed_stats.get('jobs_scraped', 0)}")
            print(f"  Errors: {indeed_stats.get('errors', 0)}")
            if 'rate_limiter' in indeed_stats:
                print(f"  Rate limiter: {indeed_stats['rate_limiter']}")


if __name__ == "__main__":
    asyncio.run(main())

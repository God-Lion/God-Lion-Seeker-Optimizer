"""
Job scraping service that integrates async scraper with database storage.
Handles the full workflow: scrape -> parse -> store -> return
"""
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
import structlog

from src.scrapers.async_linkedin_scraper import AsyncLinkedInScraper, ScraperConfig, JobData
from src.scrapers.hybrid_indeed_scraper import HybridIndeedScraper
from src.repositories.job_repository import JobRepository
from src.repositories.company_repository import CompanyRepository
from src.repositories.scraping_session_repository import ScrapingSessionRepository
from src.models.job import Job
from src.models.company import Company
from src.models.scraping_session import ScrapingSession
from src.config.database import get_session

logger = structlog.get_logger(__name__)


class JobScrapingService:
    """
    Service for scraping jobs and storing them in database.
    Orchestrates scraping, data transformation, and storage.
    """
    
    def __init__(
        self,
        db_session=None,
        scraper_config: Optional[ScraperConfig] = None,
        platforms: Optional[List[str]] = None
    ):
        """
        Initialize scraping service.
        
        Args:
            db_session: Database session (optional, will create one if not provided)
            scraper_config: Configuration for the scraper
            platforms: List of platforms to scrape from ['linkedin', 'indeed', 'both']. Default is 'both'
        """
        self.db_session = db_session
        self.scraper_config = scraper_config or ScraperConfig(
            max_concurrent=10,
            timeout=30,
            retry_attempts=3,
            headless=True
        )
        self.platforms = platforms or ['both']
        self.linkedin_scraper: Optional[AsyncLinkedInScraper] = None
        self.indeed_scraper: Optional[HybridIndeedScraper] = None
    
    async def scrape_and_store_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        max_jobs: Optional[int] = None,
        limit: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
        session_name: Optional[str] = None,
        experience_level: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Scrape jobs and store them in database.
        
        Args:
            query: Search query
            location: Location filter
            max_jobs: Maximum jobs to scrape (takes precedence over limit)
            limit: Maximum jobs to scrape (deprecated, use max_jobs)
            filters: Additional filters
            session_name: Name for this scraping session
            experience_level: Experience level filter
            
        Returns:
            Dictionary with results and statistics
        """
        # Use max_jobs if provided, otherwise fall back to limit or default
        job_limit = max_jobs if max_jobs is not None else (limit if limit is not None else 100)
        logger.info(
            "starting_scrape_and_store",
            query=query,
            location=location,
            limit=job_limit
        )
        
        # Build filters dict
        if filters is None:
            filters = {}
        if experience_level:
            filters['experience_level'] = experience_level
        
        # Determine which platforms to use
        use_linkedin = 'linkedin' in self.platforms or 'both' in self.platforms
        use_indeed = 'indeed' in self.platforms or 'both' in self.platforms
        
        # Create scrapers
        if use_linkedin:
            self.linkedin_scraper = AsyncLinkedInScraper(self.scraper_config)
        if use_indeed:
            self.indeed_scraper = HybridIndeedScraper()
        
        # Use provided db_session or create a new one
        use_context_manager = self.db_session is None
        
        if use_context_manager:
            async with get_session() as db_session:
                return await self._scrape_and_store_internal(
                    db_session, query, location, job_limit, filters, session_name
                )
        else:
            return await self._scrape_and_store_internal(
                self.db_session, query, location, job_limit, filters, session_name
            )
    
    async def _scrape_and_store_internal(
        self,
        db_session,
        query: str,
        location: Optional[str],
        job_limit: int,
        filters: Dict[str, Any],
        session_name: Optional[str]
    ) -> Dict[str, Any]:
        """Internal method to perform scraping with a given db session."""
        # Create repositories
        job_repo = JobRepository(db_session)
        company_repo = CompanyRepository(db_session)
        session_repo = ScrapingSessionRepository(db_session)
        
        # Create scraping session record with error handling
        try:
            scraping_session = ScrapingSession(
                session_name=session_name or f"{query} - {datetime.utcnow().isoformat()}",
                query=query,
                status="running",
                started_at=datetime.utcnow()
            )
            # Add to session and flush to get the ID
            db_session.add(scraping_session)
            await db_session.flush()
            await db_session.commit()
            
            logger.info("scraping_session_created", session_id=scraping_session.id)
        except Exception as e:
            await db_session.rollback()
            logger.error("session_creation_failed", error=str(e))
            raise RuntimeError(f"Failed to create scraping session: {e}")
        
        try:
            # Scrape jobs from all platforms
            all_scraped_jobs = []
            platform_stats = {}
            
            # Scrape from LinkedIn
            if self.linkedin_scraper:
                try:
                    logger.info("scraping_from_linkedin", query=query, limit=job_limit)
                    linkedin_jobs = await self.linkedin_scraper.scrape_jobs(
                        query=query,
                        location=location,
                        limit=job_limit,
                        filters=filters
                    )
                    all_scraped_jobs.extend(linkedin_jobs)
                    platform_stats['linkedin'] = {
                        'jobs_found': len(linkedin_jobs),
                        'stats': self.linkedin_scraper.get_stats()
                    }
                    logger.info("linkedin_scrape_completed", count=len(linkedin_jobs))
                except Exception as e:
                    logger.error("linkedin_scrape_failed", error=str(e))
                    platform_stats['linkedin'] = {'error': str(e)}
            
            # Scrape from Indeed
            if self.indeed_scraper:
                try:
                    logger.info("scraping_from_indeed", query=query, limit=job_limit)
                    indeed_jobs = await self.indeed_scraper.scrape_jobs(
                        query=query,
                        location=location or "",
                        num_jobs=job_limit
                    )
                    # Convert Indeed jobs to JobData format
                    for job in indeed_jobs:
                        job_data = JobData(
                            job_id=job.get('job_id', ''),
                            title=job.get('title', ''),
                            company=job.get('company', ''),
                            location=job.get('location', ''),
                            description=job.get('description', ''),
                            description_html=job.get('description', ''),
                            link=job.get('link', ''),
                            apply_link=job.get('apply_link'),
                            posted_date=job.get('date')
                        )
                        all_scraped_jobs.append(job_data)
                    platform_stats['indeed'] = {
                        'jobs_found': len(indeed_jobs)
                    }
                    logger.info("indeed_scrape_completed", count=len(indeed_jobs))
                except Exception as e:
                    logger.error("indeed_scrape_failed", error=str(e))
                    platform_stats['indeed'] = {'error': str(e)}
            
            scraped_jobs = all_scraped_jobs
            logger.info("total_jobs_scraped", count=len(scraped_jobs), platforms=platform_stats)
            
            # Store jobs in database
            stored_jobs = []
            new_jobs = 0
            updated_jobs = 0
            errors = 0
            
            for job_data in scraped_jobs:
                try:
                    # Store company first (if not exists)
                    company = await self._get_or_create_company(
                        company_repo,
                        job_data
                    )
                    
                    # Check if job already exists using async method
                    existing_job = await job_repo.get_by_job_id(job_data.job_id)
                    
                    if existing_job:
                        # Update existing job
                        existing_job.title = job_data.title
                        existing_job.description = job_data.description
                        existing_job.description_html = job_data.description_html
                        existing_job.place = job_data.location
                        existing_job.link = job_data.link
                        existing_job.apply_link = job_data.apply_link if hasattr(job_data, 'apply_link') else None
                        existing_job.date = job_data.posted_date if hasattr(job_data, 'posted_date') else None
                        existing_job.date_text = job_data.posted_date if hasattr(job_data, 'posted_date') else None
                        
                        # Mark as modified and flush
                        await db_session.flush()
                        stored_jobs.append(existing_job)
                        updated_jobs += 1
                        
                        logger.debug("job_updated", job_id=job_data.job_id)
                    else:
                        # Create new job
                        new_job = Job(
                            job_id=job_data.job_id,
                            title=job_data.title,
                            company_id=company.id,
                            link=job_data.link,
                            apply_link=job_data.apply_link if hasattr(job_data, 'apply_link') else None,
                            place=job_data.location,
                            description=job_data.description,
                            description_html=job_data.description_html,
                            date=job_data.posted_date if hasattr(job_data, 'posted_date') else None,
                            date_text=job_data.posted_date if hasattr(job_data, 'posted_date') else None,
                            session_id=scraping_session.id,
                            is_active=True
                        )
                        
                        # Add to session directly
                        db_session.add(new_job)
                        await db_session.flush()  # Flush to get the ID
                        stored_jobs.append(new_job)
                        new_jobs += 1
                        
                        logger.debug("job_created", job_id=job_data.job_id)
                    
                except Exception as e:
                    logger.error(
                        "job_storage_failed",
                        job_id=job_data.job_id,
                        error=str(e)
                    )
                    errors += 1
                    # Rollback this job's changes but continue with others
                    await db_session.rollback()
            
            # Commit all changes
            try:
                await db_session.commit()
                logger.info("jobs_committed", total=len(stored_jobs))
            except Exception as e:
                await db_session.rollback()
                logger.error("commit_failed", error=str(e))
                raise
            
            # Update scraping session
            try:
                scraping_session.status = "completed"
                scraping_session.completed_at = datetime.utcnow()
                scraping_session.total_jobs = len(scraped_jobs)
                scraping_session.unique_jobs = new_jobs
                scraping_session.duplicate_jobs = updated_jobs
                scraping_session.error_count = errors
                await db_session.flush()
                await db_session.commit()
                logger.info("session_updated", session_id=scraping_session.id, status="completed")
            except Exception as e:
                await db_session.rollback()
                logger.error("session_update_failed", error=str(e))
            
            result = {
                'success': True,
                'session_id': scraping_session.id,
                'jobs_scraped': len(scraped_jobs),
                'new_jobs': new_jobs,
                'updated_jobs': updated_jobs,
                'errors': errors,
                'platform_stats': platform_stats
            }
            
            logger.info("scrape_and_store_completed", result=result)
            return result
            
        except Exception as e:
            # Update session as failed with proper error handling
            try:
                scraping_session.status = "failed"
                scraping_session.completed_at = datetime.utcnow()
                await db_session.flush()
                await db_session.commit()
                logger.error("scrape_and_store_failed", error=str(e), session_id=scraping_session.id)
            except Exception as update_error:
                await db_session.rollback()
                logger.error("failed_to_update_session_status", error=str(update_error))
            
            raise
        
        finally:
            # Clean up scrapers
            if self.linkedin_scraper:
                await self.linkedin_scraper.close()
            if self.indeed_scraper:
                await self.indeed_scraper.close()
    
    async def _get_or_create_company(
        self,
        company_repo: CompanyRepository,
        job_data: JobData
    ) -> Company:
        """Get existing company or create new one"""
        # Get company name from job data
        company_name = getattr(job_data, 'company', None) or getattr(job_data, 'company_name', 'Unknown Company')
        
        # Try to find existing company
        existing_company = await company_repo.get_by_name(company_name)
        
        if existing_company:
            return existing_company
        
        # Create new company with available data and error handling
        try:
            new_company = Company(
                name=company_name,
                website=getattr(job_data, 'company_url', None) or getattr(job_data, 'company_link', None),
                industry=getattr(job_data, 'company_industry', None),
                company_size=getattr(job_data, 'company_size', None),
                location=getattr(job_data, 'company_location', None)
            )
            
            db_session = company_repo.session
            db_session.add(new_company)
            await db_session.flush()
            
            logger.debug("company_created", name=company_name)
            return new_company
            
        except Exception as e:
            await db_session.rollback()
            logger.error("company_creation_failed", name=company_name, error=str(e))
            raise
    
    async def get_scraping_session(
        self,
        session_id: int
    ) -> Optional[ScrapingSession]:
        """Get scraping session by ID"""
        async with get_session() as db_session:
            session_repo = ScrapingSessionRepository(db_session)
            return await session_repo.get_by_id(session_id)
    
    async def list_scraping_sessions(
        self,
        limit: int = 50,
        status: Optional[str] = None
    ) -> List[ScrapingSession]:
        """List recent scraping sessions"""
        async with get_session() as db_session:
            session_repo = ScrapingSessionRepository(db_session)
            
            if status:
                return await session_repo.get_by_status(status, limit=limit)
            else:
                return await session_repo.get_recent_sessions(limit=limit)


# Example usage
async def example_usage():
    """Example of using JobScrapingService"""
    
    # Create service
    service = JobScrapingService(
        scraper_config=ScraperConfig(
            max_concurrent=5,
            timeout=30,
            headless=True
        )
    )
    
    # Scrape and store jobs
    result = await service.scrape_and_store_jobs(
        query="Python Developer",
        location="Remote",
        max_jobs=50,
        filters={
            'experience_level': '2,3',
            'job_type': 'F',
            'remote': '2'
        },
        session_name="Python Remote Jobs - Daily Scrape"
    )
    
    print("\n✅ Scraping completed!")
    print(f"   Jobs scraped: {result['jobs_scraped']}")
    print(f"   New jobs: {result['new_jobs']}")
    print(f"   Updated jobs: {result['updated_jobs']}")
    print(f"   Errors: {result['errors']}")
    print(f"   Session ID: {result['session_id']}")
    
    # List recent sessions
    sessions = await service.list_scraping_sessions(limit=10)
    print(f"\n📊 Recent scraping sessions: {len(sessions)}")
    for session in sessions[:5]:
        print(f"   - {session.session_name}: {session.status} ({session.total_jobs} jobs)")


if __name__ == "__main__":
    asyncio.run(example_usage())

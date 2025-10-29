"""
Multi-Platform Job Storage Service
Handles storing jobs from multiple platforms (Indeed, LinkedIn, etc.) into database
"""
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
import structlog

from src.scrapers.base_scraper import JobData
from src.repositories.job_repository import JobRepository
from src.repositories.company_repository import CompanyRepository
from src.repositories.scraping_session_repository import ScrapingSessionRepository
from src.models.job import Job
from src.models.company import Company
from src.models.scraping_session import ScrapingSession
from src.config.database import get_session

logger = structlog.get_logger(__name__)


class MultiPlatformStorageService:
    """
    Service for storing jobs from multiple platforms into database.
    Handles deduplication, company management, and session tracking.
    """
    
    def __init__(self, db_session=None):
        """
        Initialize storage service.
        
        Args:
            db_session: Database session (optional, will create one if not provided)
        """
        self.db_session = db_session
        self._stats = {
            'total_jobs': 0,
            'new_jobs': 0,
            'updated_jobs': 0,
            'duplicate_jobs': 0,
            'errors': 0,
            'by_platform': {}
        }
    
    async def store_jobs(
        self,
        jobs: List[JobData],
        platform: str,
        query: str,
        location: Optional[str] = None,
        session_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Store jobs from a specific platform.
        
        Args:
            jobs: List of JobData objects to store
            platform: Platform name (e.g., 'indeed', 'linkedin')
            query: Search query used
            location: Location filter used
            session_name: Optional name for this scraping session
            
        Returns:
            Dictionary with storage statistics
        """
        if not jobs:
            logger.warning("no_jobs_to_store", platform=platform)
            return {
                'success': True,
                'jobs_stored': 0,
                'new_jobs': 0,
                'updated_jobs': 0,
                'errors': 0,
                'platform': platform
            }
        
        logger.info(
            "storing_jobs",
            platform=platform,
            count=len(jobs),
            query=query,
            location=location
        )
        
        # Use provided db_session or create a new one
        use_context_manager = self.db_session is None
        
        if use_context_manager:
            async with get_session() as db_session:
                return await self._store_jobs_internal(
                    db_session, jobs, platform, query, location, session_name
                )
        else:
            return await self._store_jobs_internal(
                self.db_session, jobs, platform, query, location, session_name
            )
    
    async def _store_jobs_internal(
        self,
        db_session,
        jobs: List[JobData],
        platform: str,
        query: str,
        location: Optional[str],
        session_name: Optional[str]
    ) -> Dict[str, Any]:
        """Internal method to store jobs with a given db session."""
        # Create repositories
        job_repo = JobRepository(db_session)
        company_repo = CompanyRepository(db_session)
        session_repo = ScrapingSessionRepository(db_session)
        
        # Create scraping session record
        try:
            scraping_session = ScrapingSession(
                session_name=session_name or f"{platform.upper()} - {query} - {datetime.utcnow().isoformat()}",
                query=query,
                location=location,
                platform=platform,
                status="running",
                started_at=datetime.utcnow()
            )
            db_session.add(scraping_session)
            await db_session.flush()
            await db_session.commit()
            
            logger.info(
                "scraping_session_created",
                session_id=scraping_session.id,
                platform=platform
            )
        except Exception as e:
            await db_session.rollback()
            logger.error("session_creation_failed", error=str(e), platform=platform)
            raise RuntimeError(f"Failed to create scraping session: {e}")
        
        # Storage counters
        stored_jobs = []
        new_jobs_count = 0
        updated_jobs_count = 0
        duplicate_jobs_count = 0
        errors_count = 0
        
        try:
            # Process each job
            for job_data in jobs:
                try:
                    # Get or create company
                    company = await self._get_or_create_company(
                        company_repo,
                        job_data,
                        db_session
                    )
                    
                    # Check if job already exists
                    existing_job = await job_repo.get_by_job_id(job_data.job_id)
                    
                    if existing_job:
                        # Check if it's really a duplicate (same content)
                        if self._is_duplicate(existing_job, job_data):
                            duplicate_jobs_count += 1
                            logger.debug(
                                "job_duplicate_skipped",
                                job_id=job_data.job_id,
                                title=job_data.title
                            )
                            continue
                        
                        # Update existing job with new data
                        existing_job.title = job_data.title
                        existing_job.description = job_data.description
                        existing_job.description_html = job_data.description_html
                        existing_job.location = job_data.location
                        existing_job.place = job_data.location  # Keep both for compatibility
                        existing_job.link = job_data.link
                        existing_job.job_url = job_data.link
                        existing_job.apply_link = getattr(job_data, 'apply_link', None)
                        existing_job.job_type = getattr(job_data, 'job_type', None)
                        existing_job.experience_level = getattr(job_data, 'experience_level', None)
                        existing_job.posted_date = getattr(job_data, 'posted_date', None)
                        existing_job.scraped_at = getattr(job_data, 'scraped_at', datetime.utcnow())
                        existing_job.is_active = True  # Reactivate if was inactive
                        existing_job.company_id = company.id
                        
                        await db_session.flush()
                        stored_jobs.append(existing_job)
                        updated_jobs_count += 1
                        
                        logger.debug(
                            "job_updated",
                            job_id=job_data.job_id,
                            title=job_data.title,
                            platform=platform
                        )
                    else:
                        # Create new job
                        new_job = Job(
                            job_id=job_data.job_id,
                            title=job_data.title,
                            company_id=company.id,
                            link=job_data.link,
                            job_url=job_data.link,
                            apply_link=getattr(job_data, 'apply_link', None),
                            location=job_data.location,
                            place=job_data.location,  # Keep both for compatibility
                            description=job_data.description,
                            description_html=job_data.description_html,
                            job_type=getattr(job_data, 'job_type', None),
                            experience_level=getattr(job_data, 'experience_level', None),
                            posted_date=getattr(job_data, 'posted_date', None),
                            scraped_at=getattr(job_data, 'scraped_at', datetime.utcnow()),
                            session_id=scraping_session.id,
                            is_active=True,
                            insights={'platform': platform, 'query': query}
                        )
                        
                        db_session.add(new_job)
                        await db_session.flush()
                        stored_jobs.append(new_job)
                        new_jobs_count += 1
                        
                        logger.debug(
                            "job_created",
                            job_id=job_data.job_id,
                            title=job_data.title,
                            platform=platform
                        )
                
                except Exception as e:
                    logger.error(
                        "job_storage_failed",
                        job_id=getattr(job_data, 'job_id', 'unknown'),
                        title=getattr(job_data, 'title', 'unknown'),
                        error=str(e),
                        platform=platform
                    )
                    errors_count += 1
                    await db_session.rollback()
            
            # Commit all changes
            try:
                await db_session.commit()
                logger.info(
                    "jobs_committed",
                    total=len(stored_jobs),
                    new=new_jobs_count,
                    updated=updated_jobs_count,
                    platform=platform
                )
            except Exception as e:
                await db_session.rollback()
                logger.error("commit_failed", error=str(e), platform=platform)
                raise
            
            # Update scraping session
            try:
                scraping_session.status = "completed"
                scraping_session.completed_at = datetime.utcnow()
                scraping_session.jobs_found = len(jobs)
                scraping_session.jobs_stored = new_jobs_count + updated_jobs_count
                scraping_session.total_jobs = len(jobs)
                scraping_session.unique_jobs = new_jobs_count
                scraping_session.duplicate_jobs = duplicate_jobs_count
                scraping_session.error_count = errors_count
                
                await db_session.flush()
                await db_session.commit()
                
                logger.info(
                    "session_completed",
                    session_id=scraping_session.id,
                    platform=platform,
                    jobs_stored=new_jobs_count + updated_jobs_count
                )
            except Exception as e:
                await db_session.rollback()
                logger.error("session_update_failed", error=str(e), platform=platform)
            
            # Build result
            result = {
                'success': True,
                'session_id': scraping_session.id,
                'platform': platform,
                'jobs_scraped': len(jobs),
                'jobs_stored': new_jobs_count + updated_jobs_count,
                'new_jobs': new_jobs_count,
                'updated_jobs': updated_jobs_count,
                'duplicate_jobs': duplicate_jobs_count,
                'errors': errors_count
            }
            
            # Update stats
            self._stats['total_jobs'] += len(jobs)
            self._stats['new_jobs'] += new_jobs_count
            self._stats['updated_jobs'] += updated_jobs_count
            self._stats['duplicate_jobs'] += duplicate_jobs_count
            self._stats['errors'] += errors_count
            self._stats['by_platform'][platform] = {
                'jobs_scraped': len(jobs),
                'jobs_stored': new_jobs_count + updated_jobs_count,
                'new': new_jobs_count,
                'updated': updated_jobs_count,
                'duplicates': duplicate_jobs_count,
                'errors': errors_count
            }
            
            logger.info("store_jobs_completed", result=result)
            return result
        
        except Exception as e:
            # Update session as failed
            try:
                scraping_session.status = "failed"
                scraping_session.completed_at = datetime.utcnow()
                scraping_session.error_message = str(e)
                await db_session.flush()
                await db_session.commit()
            except Exception as update_error:
                await db_session.rollback()
                logger.error(
                    "failed_to_update_session_status",
                    error=str(update_error),
                    platform=platform
                )
            
            logger.error("store_jobs_failed", error=str(e), platform=platform)
            raise
    
    async def _get_or_create_company(
        self,
        company_repo: CompanyRepository,
        job_data: JobData,
        db_session
    ) -> Company:
        """Get existing company or create new one"""
        # Get company name from job data
        company_name = (
            getattr(job_data, 'company', None) or
            getattr(job_data, 'company_name', None) or
            'Unknown Company'
        )
        
        # Normalize company name
        company_name = company_name.strip()
        
        # Try to find existing company
        existing_company = await company_repo.get_by_name(company_name)
        
        if existing_company:
            return existing_company
        
        # Create new company
        try:
            new_company = Company(
                name=company_name,
                website=getattr(job_data, 'company_url', None) or getattr(job_data, 'company_link', None),
                industry=getattr(job_data, 'company_industry', None),
                company_size=getattr(job_data, 'company_size', None),
                location=getattr(job_data, 'company_location', None)
            )
            
            db_session.add(new_company)
            await db_session.flush()
            
            logger.debug("company_created", name=company_name)
            return new_company
        
        except Exception as e:
            await db_session.rollback()
            logger.error("company_creation_failed", name=company_name, error=str(e))
            raise
    
    def _is_duplicate(self, existing_job: Job, new_job_data: JobData) -> bool:
        """
        Check if a job is a true duplicate (same content).
        
        Args:
            existing_job: Existing job from database
            new_job_data: New job data being processed
            
        Returns:
            True if duplicate, False if content has changed
        """
        # Compare key fields to determine if it's a duplicate
        return (
            existing_job.title == new_job_data.title and
            existing_job.link == new_job_data.link and
            existing_job.company_id is not None and
            existing_job.location == new_job_data.location
        )
    
    def get_stats(self) -> Dict[str, Any]:
        """Get storage statistics"""
        return self._stats.copy()
    
    def reset_stats(self):
        """Reset statistics"""
        self._stats = {
            'total_jobs': 0,
            'new_jobs': 0,
            'updated_jobs': 0,
            'duplicate_jobs': 0,
            'errors': 0,
            'by_platform': {}
        }


async def store_multi_platform_jobs(
    jobs_by_platform: Dict[str, List[JobData]],
    query: str,
    location: Optional[str] = None,
    session_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Convenience function to store jobs from multiple platforms.
    
    Args:
        jobs_by_platform: Dictionary mapping platform name to list of JobData
                         e.g., {'indeed': [job1, job2], 'linkedin': [job3, job4]}
        query: Search query used
        location: Location filter used
        session_name: Optional base name for scraping sessions
        
    Returns:
        Dictionary with combined statistics
    """
    service = MultiPlatformStorageService()
    
    results = []
    for platform, jobs in jobs_by_platform.items():
        if not jobs:
            continue
        
        platform_session_name = f"{session_name} - {platform.upper()}" if session_name else None
        
        try:
            result = await service.store_jobs(
                jobs=jobs,
                platform=platform,
                query=query,
                location=location,
                session_name=platform_session_name
            )
            results.append(result)
        except Exception as e:
            logger.error(f"Failed to store {platform} jobs", error=str(e))
            results.append({
                'success': False,
                'platform': platform,
                'error': str(e)
            })
    
    # Combine results
    combined_result = {
        'success': all(r.get('success', False) for r in results),
        'platforms': results,
        'summary': service.get_stats()
    }
    
    return combined_result


# Example usage
async def example_usage():
    """Example of using MultiPlatformStorageService"""
    from scrapers.base_scraper import JobData
    
    # Simulate jobs from multiple platforms
    indeed_jobs = [
        JobData(
            job_id="indeed_123",
            title="Python Developer",
            company_name="Tech Corp",
            link="https://indeed.com/job/123",
            location="Remote",
            description="Great Python job",
            description_html="<p>Great Python job</p>",
            job_type="Full-time",
            scraped_at=datetime.utcnow()
        )
    ]
    
    godlionseeker = [
        JobData(
            job_id="linkedin_456",
            title="Senior Python Developer",
            company_name="Startup Inc",
            link="https://linkedin.com/job/456",
            location="San Francisco, CA",
            description="Exciting startup role",
            description_html="<p>Exciting startup role</p>",
            job_type="Full-time",
            scraped_at=datetime.utcnow()
        )
    ]
    
    # Store jobs from both platforms
    result = await store_multi_platform_jobs(
        jobs_by_platform={
            'indeed': indeed_jobs,
            'linkedin': godlionseeker
        },
        query="Python Developer",
        location="Remote",
        session_name="Multi-Platform Python Search"
    )
    
    print("\n✅ Multi-platform storage completed!")
    print(f"   Success: {result['success']}")
    print(f"   Total new jobs: {result['summary']['new_jobs']}")
    print(f"   Total updated jobs: {result['summary']['updated_jobs']}")
    print(f"   Platforms:")
    for platform_result in result['platforms']:
        print(f"      {platform_result['platform']}: {platform_result.get('jobs_stored', 0)} jobs stored")


if __name__ == "__main__":
    asyncio.run(example_usage())

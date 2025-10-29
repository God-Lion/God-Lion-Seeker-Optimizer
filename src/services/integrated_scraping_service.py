"""
Integrated service that combines job scraping with AI-powered matching.
This service scrapes jobs and automatically analyzes them against your resume.
"""
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path
import structlog

from .job_scraping_service import JobScrapingService
try:
    from .job_matching_service import JobMatchingService, MatchResult
    _MATCHING_AVAILABLE = True
except ImportError:
    JobMatchingService = None
    MatchResult = None
    _MATCHING_AVAILABLE = False
from src.models.job_analysis import JobAnalysis
from src.models.job import Job
from src.repositories.job_analysis_repository import JobAnalysisRepository
from src.repositories.job_repository import JobRepository
from src.config.database import get_session
from src.scrapers.async_linkedin_scraper import ScraperConfig

logger = structlog.get_logger(__name__)


class IntegratedScrapingService:
    """
    Service that integrates job scraping with AI-powered matching.
    Scrapes jobs and automatically analyzes them for match quality.
    """
    
    def __init__(
        self,
        resume_path: Optional[str] = None,
        resume_text: Optional[str] = None,
        scraper_config: Optional[ScraperConfig] = None,
        resume_id: Optional[str] = None
    ):
        """
        Initialize the integrated service.
        
        Args:
            resume_path: Path to resume file
            resume_text: Resume as plain text
            scraper_config: Configuration for the scraper
            resume_id: Identifier for the resume (optional)
        """
        self.resume_path = resume_path
        self.resume_text = resume_text
        self.resume_id = resume_id or (Path(resume_path).stem if resume_path else None)
        
        # Initialize services
        self.scraping_service = JobScrapingService(scraper_config)
        
        # Initialize matching service if resume provided and matching is available
        if (resume_path or resume_text) and _MATCHING_AVAILABLE:
            self.matching_service = JobMatchingService(
                resume_text=resume_text,
                resume_path=resume_path
            )
            logger.info(
                "matching_enabled",
                resume_id=self.resume_id,
                skills_count=len(self.matching_service.resume_data.skills)
            )
        else:
            self.matching_service = None
            if not _MATCHING_AVAILABLE:
                logger.warning("matching_disabled", reason="dependencies_not_available")
            else:
                logger.warning("matching_disabled", reason="no_resume_provided")
    
    async def scrape_and_match_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        limit: int = 100,
        filters: Optional[Dict[str, Any]] = None,
        session_name: Optional[str] = None,
        min_match_score: float = 0.0,
        analyze_on_scrape: bool = True
    ) -> Dict[str, Any]:
        """
        Scrape jobs and analyze them for matches.
        
        Args:
            query: Search query
            location: Location filter
            limit: Maximum jobs to scrape
            filters: Additional filters
            session_name: Name for scraping session
            min_match_score: Minimum match score to save (0.0 to 1.0)
            analyze_on_scrape: Whether to analyze jobs during scraping
            
        Returns:
            Dictionary with scraping and matching results
        """
        logger.info(
            "starting_scrape_and_match",
            query=query,
            location=location,
            limit=limit,
            matching_enabled=self.matching_service is not None
        )
        
        # Step 1: Scrape jobs
        scrape_result = await self.scraping_service.scrape_and_store_jobs(
            query=query,
            location=location,
            limit=limit,
            filters=filters,
            session_name=session_name
        )
        
        if not scrape_result['success']:
            logger.error("scraping_failed")
            return scrape_result
        
        # Step 2: Analyze jobs if matching is enabled
        if self.matching_service and analyze_on_scrape:
            analysis_result = await self._analyze_scraped_jobs(
                session_id=scrape_result['session_id'],
                min_match_score=min_match_score
            )
            
            scrape_result.update({
                'analysis': analysis_result,
                'high_matches': analysis_result['high_matches'],
                'analysis_stats': analysis_result['stats']
            })
        
        return scrape_result
    
    async def _analyze_scraped_jobs(
        self,
        session_id: int,
        min_match_score: float = 0.0
    ) -> Dict[str, Any]:
        """
        Analyze jobs from a scraping session.
        
        Args:
            session_id: Scraping session ID
            min_match_score: Minimum match score to save
            
        Returns:
            Dictionary with analysis results
        """
        logger.info("analyzing_scraped_jobs", session_id=session_id)
        
        async with get_session() as db_session:
            job_repo = JobRepository(db_session)
            analysis_repo = JobAnalysisRepository(db_session)
            
            # Get jobs from this session
            jobs = await job_repo.get_by_session_id(session_id)
            
            if not jobs:
                logger.warning("no_jobs_to_analyze", session_id=session_id)
                return {
                    'jobs_analyzed': 0,
                    'high_matches': [],
                    'stats': {}
                }
            
            logger.info("jobs_to_analyze", count=len(jobs))
            
            # Analyze jobs
            analyses = []
            high_matches = []
            
            for job in jobs:
                try:
                    # Skip if already analyzed
                    existing = await analysis_repo.get_by_job_and_resume(
                        job.id, 
                        self.resume_id
                    )
                    if existing:
                        logger.debug("job_already_analyzed", job_id=job.job_id)
                        continue
                    
                    # Analyze job
                    match_result = await self.matching_service.analyze_job(
                        job_description=job.description or "",
                        job_title=job.title
                    )
                    
                    # Create analysis record
                    if match_result.overall_score >= min_match_score:
                        job_analysis = JobAnalysis(
                            job_id=job.id,
                            resume_id=self.resume_id,
                            overall_match_score=match_result.overall_score,
                            similarity_score=match_result.similarity_score,
                            skills_match_percentage=match_result.skills_match_percentage,
                            experience_match_score=match_result.experience_match_score,
                            match_category=match_result.match_category,
                            matching_skills={'skills': match_result.matching_skills},
                            missing_skills={'skills': match_result.missing_skills},
                            recommended_skills={'skills': match_result.recommended_skills},
                            keyword_match_score=match_result.keyword_match_score,
                            top_matching_keywords={'keywords': match_result.top_keywords},
                            recommendation=match_result.recommendation,
                            analyzed_at=datetime.utcnow(),
                            analysis_version="1.0"
                        )
                        
                        db_session.add(job_analysis)
                        analyses.append(job_analysis)
                        
                        # Track high matches
                        if match_result.overall_score >= 0.70:
                            high_matches.append({
                                'job_id': job.job_id,
                                'title': job.title,
                                'company': job.company.name if job.company else 'Unknown',
                                'location': job.place,
                                'link': job.link,
                                'match_score': match_result.overall_score,
                                'match_category': match_result.match_category,
                                'recommendation': match_result.recommendation,
                                'matching_skills': match_result.matching_skills[:5],
                                'missing_skills': match_result.missing_skills[:3]
                            })
                        
                        logger.debug(
                            "job_analyzed",
                            job_id=job.job_id,
                            score=match_result.overall_score,
                            category=match_result.match_category
                        )
                    
                except Exception as e:
                    logger.error(
                        "job_analysis_failed",
                        job_id=job.job_id,
                        error=str(e)
                    )
            
            # Commit all analyses
            await db_session.commit()
            
            # Get statistics
            stats = await analysis_repo.get_statistics(self.resume_id)
            
            logger.info(
                "analysis_complete",
                jobs_analyzed=len(analyses),
                high_matches=len(high_matches)
            )
            
            return {
                'jobs_analyzed': len(analyses),
                'high_matches': high_matches,
                'stats': stats
            }
    
    async def analyze_existing_jobs(
        self,
        limit: int = 100,
        min_match_score: float = 0.0,
        skip_analyzed: bool = True
    ) -> Dict[str, Any]:
        """
        Analyze jobs already in the database.
        
        Args:
            limit: Maximum jobs to analyze
            min_match_score: Minimum match score to save
            skip_analyzed: Skip jobs already analyzed with this resume
            
        Returns:
            Dictionary with analysis results
        """
        if not self.matching_service:
            raise ValueError("Cannot analyze jobs without a resume")
        
        logger.info(
            "analyzing_existing_jobs",
            limit=limit,
            resume_id=self.resume_id
        )
        
        async with get_session() as db_session:
            job_repo = JobRepository(db_session)
            analysis_repo = JobAnalysisRepository(db_session)
            
            # Get unanalyzed jobs
            if skip_analyzed:
                jobs = await analysis_repo.get_unanalyzed_jobs(
                    limit=limit,
                    resume_id=self.resume_id
                )
            else:
                jobs = await job_repo.get_recent_jobs(limit=limit)
            
            if not jobs:
                logger.info("no_jobs_to_analyze")
                return {
                    'jobs_analyzed': 0,
                    'high_matches': [],
                    'stats': {}
                }
            
            logger.info("jobs_to_analyze", count=len(jobs))
            
            # Analyze jobs in batches
            batch_size = 10
            analyses = []
            high_matches = []
            
            for i in range(0, len(jobs), batch_size):
                batch = jobs[i:i + batch_size]
                
                for job in batch:
                    try:
                        # Check if already analyzed
                        if skip_analyzed:
                            existing = await analysis_repo.get_by_job_and_resume(
                                job.id,
                                self.resume_id
                            )
                            if existing:
                                continue
                        
                        # Analyze
                        match_result = await self.matching_service.analyze_job(
                            job_description=job.description or "",
                            job_title=job.title
                        )
                        
                        # Save if meets minimum score
                        if match_result.overall_score >= min_match_score:
                            job_analysis = JobAnalysis(
                                job_id=job.id,
                                resume_id=self.resume_id,
                                overall_match_score=match_result.overall_score,
                                similarity_score=match_result.similarity_score,
                                skills_match_percentage=match_result.skills_match_percentage,
                                experience_match_score=match_result.experience_match_score,
                                match_category=match_result.match_category,
                                matching_skills={'skills': match_result.matching_skills},
                                missing_skills={'skills': match_result.missing_skills},
                                recommended_skills={'skills': match_result.recommended_skills},
                                keyword_match_score=match_result.keyword_match_score,
                                top_matching_keywords={'keywords': match_result.top_keywords},
                                recommendation=match_result.recommendation,
                                analyzed_at=datetime.utcnow(),
                                analysis_version="1.0"
                            )
                            
                            db_session.add(job_analysis)
                            analyses.append(job_analysis)
                            
                            # Track high matches
                            if match_result.overall_score >= 0.70:
                                high_matches.append({
                                    'job_id': job.job_id,
                                    'title': job.title,
                                    'company': job.company.name if job.company else 'Unknown',
                                    'location': job.place,
                                    'link': job.link,
                                    'match_score': match_result.overall_score,
                                    'match_category': match_result.match_category,
                                    'recommendation': match_result.recommendation
                                })
                        
                    except Exception as e:
                        logger.error(
                            "job_analysis_failed",
                            job_id=job.job_id,
                            error=str(e)
                        )
                
                # Commit batch
                await db_session.commit()
                logger.debug("batch_analyzed", batch=i//batch_size + 1)
            
            # Get updated statistics
            stats = await analysis_repo.get_statistics(self.resume_id)
            
            # Sort high matches by score
            high_matches.sort(key=lambda x: x['match_score'], reverse=True)
            
            logger.info(
                "analysis_complete",
                jobs_analyzed=len(analyses),
                high_matches=len(high_matches)
            )
            
            return {
                'jobs_analyzed': len(analyses),
                'high_matches': high_matches,
                'stats': stats
            }
    
    async def get_top_matches(
        self,
        limit: int = 20,
        min_score: float = 0.60
    ) -> List[Dict[str, Any]]:
        """
        Get top matching jobs from database.
        
        Args:
            limit: Maximum number of matches to return
            min_score: Minimum match score
            
        Returns:
            List of job matches with details
        """
        async with get_session() as db_session:
            analysis_repo = JobAnalysisRepository(db_session)
            
            analyses = await analysis_repo.get_high_matches(
                min_score=min_score,
                limit=limit
            )
            
            matches = []
            for analysis in analyses:
                job = analysis.job
                matches.append({
                    'job_id': job.job_id,
                    'title': job.title,
                    'company': job.company.name if job.company else 'Unknown',
                    'location': job.place,
                    'link': job.link,
                    'match_score': analysis.overall_match_score,
                    'match_category': analysis.match_category,
                    'skills_match': analysis.skills_match_percentage,
                    'matching_skills': analysis.matching_skills.get('skills', [])[:5],
                    'missing_skills': analysis.missing_skills.get('skills', [])[:3],
                    'recommendation': analysis.recommendation,
                    'analyzed_at': analysis.analyzed_at.isoformat()
                })
            
            return matches
    
    async def generate_report(
        self,
        output_path: str,
        min_score: float = 0.60,
        limit: int = 50
    ) -> str:
        """
        Generate a detailed report of job matches.
        
        Args:
            output_path: Path to save the report
            min_score: Minimum match score to include
            limit: Maximum jobs to include
            
        Returns:
            Path to generated report
        """
        matches = await self.get_top_matches(limit=limit, min_score=min_score)
        
        report_lines = [
            "="*80,
            "JOB MATCHING REPORT",
            "="*80,
            f"Generated: {datetime.utcnow().isoformat()}",
            f"Resume: {self.resume_id or 'Unknown'}",
            f"Total Matches: {len(matches)}",
            f"Minimum Score: {min_score*100:.0f}%",
            "="*80,
            ""
        ]
        
        for i, match in enumerate(matches, 1):
            report_lines.extend([
                f"\n{i}. {match['title']}",
                f"   Company: {match['company']}",
                f"   Location: {match['location']}",
                f"   Match Score: {match['match_score']*100:.1f}% ({match['match_category'].upper()})",
                f"   Skills Match: {match['skills_match']:.1f}%",
                f"   Matching Skills: {', '.join(match['matching_skills'][:5])}",
                f"   Missing Skills: {', '.join(match['missing_skills'][:3])}",
                f"   {match['recommendation']}",
                f"   Link: {match['link']}",
                "-"*80
            ])
        
        # Write report
        report_path = Path(output_path)
        report_path.write_text('\n'.join(report_lines), encoding='utf-8')
        
        logger.info("report_generated", path=str(report_path), matches=len(matches))
        return str(report_path)


# Example usage
async def example_usage():
    """Example of using IntegratedScrapingService"""
    
    # Initialize with resume
    service = IntegratedScrapingService(
        resume_path="my_resume.txt",
        scraper_config=ScraperConfig(
            max_concurrent=5,
            timeout=30,
            headless=True
        )
    )
    
    # Scrape and match jobs
    result = await service.scrape_and_match_jobs(
        query="Python Developer",
        location="Remote",
        limit=50,
        min_match_score=0.50
    )
    
    print("\n✅ Scraping & Analysis Complete!")
    print(f"   Jobs scraped: {result['jobs_scraped']}")
    print(f"   Jobs analyzed: {result['analysis']['jobs_analyzed']}")
    print(f"   High matches: {len(result['high_matches'])}")
    
    # Show top matches
    if result['high_matches']:
        print("\n🎯 TOP MATCHES:")
        for i, match in enumerate(result['high_matches'][:5], 1):
            print(f"\n{i}. {match['title']} at {match['company']}")
            print(f"   Score: {match['match_score']*100:.0f}%")
            print(f"   {match['recommendation']}")
    
    # Generate report
    report_path = await service.generate_report(
        output_path="job_matches_report.txt",
        min_score=0.60
    )
    print(f"\n📄 Report saved: {report_path}")


if __name__ == "__main__":
    asyncio.run(example_usage())

"""
CLI tool for analyzing existing jobs in the database.
Provides commands for analyzing, viewing, and exporting job matches.
"""
import asyncio
import sys
from pathlib import Path
from typing import Optional
import click
import json
from datetime import datetime
from tabulate import tabulate
import structlog

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.services.integrated_scraping_service import IntegratedScrapingService
from src.services.job_matching_service import JobMatchingService
from src.repositories.job_analysis_repository import JobAnalysisRepository
from src.config.database import get_session

logger = structlog.get_logger(__name__)


@click.group()
def cli():
    """Job Analysis CLI - Analyze and find matching jobs"""
    pass


@cli.command()
@click.option('--resume', '-r', required=True, help='Path to resume file')
@click.option('--limit', '-l', default=100, help='Maximum jobs to analyze')
@click.option('--min-score', '-m', default=0.0, help='Minimum match score (0.0-1.0)')
@click.option('--skip-analyzed', is_flag=True, default=True, help='Skip already analyzed jobs')
def analyze(resume: str, limit: int, min_score: float, skip_analyzed: bool):
    """Analyze existing jobs in database against your resume"""
    
    click.echo("="*80)
    click.echo("JOB ANALYSIS - Analyzing Existing Jobs")
    click.echo("="*80)
    
    # Validate resume
    resume_path = Path(resume)
    if not resume_path.exists():
        click.echo(f"❌ Error: Resume file not found: {resume}", err=True)
        return
    
    click.echo(f"📄 Resume: {resume}")
    click.echo(f"🔢 Limit: {limit} jobs")
    click.echo(f"📊 Min Score: {min_score*100:.0f}%")
    click.echo(f"⏭️  Skip Analyzed: {skip_analyzed}")
    click.echo("="*80)
    click.echo()
    
    async def run_analysis():
        service = IntegratedScrapingService(resume_path=str(resume_path))
        
        # Show resume info
        matcher = service.matching_service
        click.echo(f"✅ Detected {len(matcher.resume_data.skills)} skills in resume")
        click.echo(f"✅ Experience: {matcher.resume_data.years_experience} years")
        click.echo()
        click.echo("🔄 Analyzing jobs...")
        click.echo()
        
        result = await service.analyze_existing_jobs(
            limit=limit,
            min_match_score=min_score,
            skip_analyzed=skip_analyzed
        )
        
        click.echo("="*80)
        click.echo("ANALYSIS COMPLETE")
        click.echo("="*80)
        click.echo(f"Jobs Analyzed: {result['jobs_analyzed']}")
        click.echo(f"High Matches (70%+): {len(result['high_matches'])}")
        click.echo()
        
        # Show statistics
        stats = result['stats']
        click.echo("MATCH STATISTICS:")
        click.echo(f"  Excellent (75%+): {stats.get('excellent', 0)}")
        click.echo(f"  Good (60-74%): {stats.get('good', 0)}")
        click.echo(f"  Fair (40-59%): {stats.get('fair', 0)}")
        click.echo(f"  Poor (<40%): {stats.get('poor', 0)}")
        click.echo(f"  Average Score: {stats.get('average_match_score', 0)*100:.1f}%")
        click.echo()
        
        # Show top matches
        if result['high_matches']:
            click.echo("="*80)
            click.echo("🎯 TOP HIGH MATCHES:")
            click.echo("="*80)
            
            for i, match in enumerate(result['high_matches'][:10], 1):
                click.echo(f"\n{i}. {match['title']}")
                click.echo(f"   Company: {match['company']}")
                click.echo(f"   Location: {match['location']}")
                click.echo(f"   Match: {match['match_score']*100:.1f}% ({match['match_category'].upper()})")
                click.echo(f"   Link: {match['link']}")
    
    asyncio.run(run_analysis())


@cli.command()
@click.option('--limit', '-l', default=20, help='Number of matches to show')
@click.option('--min-score', '-m', default=0.60, help='Minimum match score (0.0-1.0)')
@click.option('--format', '-f', type=click.Choice(['table', 'detailed', 'json']), default='table')
def top_matches(limit: int, min_score: float, format: str):
    """View top matching jobs from database"""
    
    async def show_matches():
        async with get_session() as db_session:
            repo = JobAnalysisRepository(db_session)
            
            analyses = await repo.get_high_matches(min_score=min_score, limit=limit)
            
            if not analyses:
                click.echo("No matches found in database")
                return
            
            click.echo(f"\n🎯 TOP {len(analyses)} MATCHING JOBS")
            click.echo("="*80)
            
            if format == 'table':
                # Table format
                table_data = []
                for analysis in analyses:
                    job = analysis.job
                    table_data.append([
                        job.title[:40],
                        (job.company.name if job.company else 'Unknown')[:25],
                        f"{analysis.overall_match_score*100:.0f}%",
                        analysis.match_category.upper(),
                        f"{analysis.skills_match_percentage:.0f}%"
                    ])
                
                headers = ['Title', 'Company', 'Match', 'Category', 'Skills']
                click.echo(tabulate(table_data, headers=headers, tablefmt='grid'))
            
            elif format == 'detailed':
                # Detailed format
                for i, analysis in enumerate(analyses, 1):
                    job = analysis.job
                    click.echo(f"\n{i}. {job.title}")
                    click.echo(f"   Company: {job.company.name if job.company else 'Unknown'}")
                    click.echo(f"   Location: {job.place or 'Not specified'}")
                    click.echo(f"   Match Score: {analysis.overall_match_score*100:.1f}% ({analysis.match_category.upper()})")
                    click.echo(f"   Skills Match: {analysis.skills_match_percentage:.1f}%")
                    
                    matching = analysis.matching_skills.get('skills', [])[:5]
                    if matching:
                        click.echo(f"   Matching Skills: {', '.join(matching)}")
                    
                    missing = analysis.missing_skills.get('skills', [])[:3]
                    if missing:
                        click.echo(f"   Missing Skills: {', '.join(missing)}")
                    
                    click.echo(f"   {analysis.recommendation}")
                    click.echo(f"   Link: {job.link}")
                    click.echo("-"*80)
            
            elif format == 'json':
                # JSON format
                results = []
                for analysis in analyses:
                    job = analysis.job
                    results.append({
                        'title': job.title,
                        'company': job.company.name if job.company else 'Unknown',
                        'location': job.place,
                        'link': job.link,
                        'match_score': analysis.overall_match_score,
                        'match_category': analysis.match_category,
                        'skills_match': analysis.skills_match_percentage,
                        'matching_skills': analysis.matching_skills.get('skills', []),
                        'missing_skills': analysis.missing_skills.get('skills', []),
                        'recommendation': analysis.recommendation
                    })
                
                click.echo(json.dumps(results, indent=2))
    
    asyncio.run(show_matches())


@cli.command()
@click.option('--output', '-o', required=True, help='Output file path')
@click.option('--format', '-f', type=click.Choice(['txt', 'json', 'csv']), default='txt')
@click.option('--min-score', '-m', default=0.60, help='Minimum match score')
@click.option('--limit', '-l', default=50, help='Maximum matches to export')
def export(output: str, format: str, min_score: float, limit: int):
    """Export job matches to file"""
    
    async def export_matches():
        async with get_session() as db_session:
            repo = JobAnalysisRepository(db_session)
            
            analyses = await repo.get_high_matches(min_score=min_score, limit=limit)
            
            if not analyses:
                click.echo("No matches found to export")
                return
            
            output_path = Path(output)
            
            if format == 'txt':
                # Text report
                lines = [
                    "="*80,
                    "JOB MATCHING EXPORT",
                    "="*80,
                    f"Generated: {datetime.utcnow().isoformat()}",
                    f"Total Matches: {len(analyses)}",
                    f"Minimum Score: {min_score*100:.0f}%",
                    "="*80,
                    ""
                ]
                
                for i, analysis in enumerate(analyses, 1):
                    job = analysis.job
                    lines.extend([
                        f"\n{i}. {job.title}",
                        f"   Company: {job.company.name if job.company else 'Unknown'}",
                        f"   Location: {job.place or 'Not specified'}",
                        f"   Match Score: {analysis.overall_match_score*100:.1f}% ({analysis.match_category.upper()})",
                        f"   Skills Match: {analysis.skills_match_percentage:.1f}%",
                        f"   Matching Skills: {', '.join(analysis.matching_skills.get('skills', [])[:5])}",
                        f"   Missing Skills: {', '.join(analysis.missing_skills.get('skills', [])[:3])}",
                        f"   {analysis.recommendation}",
                        f"   Link: {job.link}",
                        "-"*80
                    ])
                
                output_path.write_text('\n'.join(lines), encoding='utf-8')
            
            elif format == 'json':
                # JSON export
                results = []
                for analysis in analyses:
                    job = analysis.job
                    results.append({
                        'job_id': job.job_id,
                        'title': job.title,
                        'company': job.company.name if job.company else 'Unknown',
                        'location': job.place,
                        'link': job.link,
                        'match_score': analysis.overall_match_score,
                        'match_category': analysis.match_category,
                        'skills_match_percentage': analysis.skills_match_percentage,
                        'matching_skills': analysis.matching_skills.get('skills', []),
                        'missing_skills': analysis.missing_skills.get('skills', []),
                        'recommended_skills': analysis.recommended_skills.get('skills', []) if analysis.recommended_skills else [],
                        'recommendation': analysis.recommendation,
                        'analyzed_at': analysis.analyzed_at.isoformat()
                    })
                
                output_path.write_text(json.dumps(results, indent=2), encoding='utf-8')
            
            elif format == 'csv':
                # CSV export
                import csv
                with output_path.open('w', newline='', encoding='utf-8') as f:
                    writer = csv.writer(f)
                    writer.writerow([
                        'Title', 'Company', 'Location', 'Match Score',
                        'Match Category', 'Skills Match %', 'Link', 'Recommendation'
                    ])
                    
                    for analysis in analyses:
                        job = analysis.job
                        writer.writerow([
                            job.title,
                            job.company.name if job.company else 'Unknown',
                            job.place or '',
                            f"{analysis.overall_match_score*100:.1f}%",
                            analysis.match_category,
                            f"{analysis.skills_match_percentage:.1f}%",
                            job.link,
                            analysis.recommendation
                        ])
            
            click.echo(f"✅ Exported {len(analyses)} matches to: {output_path}")
    
    asyncio.run(export_matches())


@cli.command()
def stats():
    """Show job analysis statistics"""
    
    async def show_stats():
        async with get_session() as db_session:
            repo = JobAnalysisRepository(db_session)
            
            stats = await repo.get_statistics()
            
            click.echo("\n" + "="*80)
            click.echo("JOB ANALYSIS STATISTICS")
            click.echo("="*80)
            click.echo(f"Total Analyzed: {stats['total_analyzed']}")
            click.echo(f"Average Match Score: {stats['average_match_score']*100:.1f}%")
            click.echo()
            click.echo("BREAKDOWN BY CATEGORY:")
            click.echo(f"  🟢 Excellent (75%+): {stats['excellent']}")
            click.echo(f"  🟡 Good (60-74%): {stats['good']}")
            click.echo(f"  🟠 Fair (40-59%): {stats['fair']}")
            click.echo(f"  🔴 Poor (<40%): {stats['poor']}")
            click.echo("="*80)
    
    asyncio.run(show_stats())


@cli.command()
@click.option('--resume', '-r', required=True, help='Path to resume file')
@click.option('--query', '-q', required=True, help='Job search query')
@click.option('--location', '-l', default='Remote', help='Job location')
@click.option('--limit', default=50, help='Maximum jobs to scrape')
@click.option('--min-score', '-m', default=0.50, help='Minimum match score to save')
def scrape_and_analyze(resume: str, query: str, location: str, limit: int, min_score: float):
    """Scrape new jobs and analyze them immediately"""
    
    click.echo("="*80)
    click.echo("SCRAPE & ANALYZE - Find Matching Jobs")
    click.echo("="*80)
    
    # Validate resume
    resume_path = Path(resume)
    if not resume_path.exists():
        click.echo(f"❌ Error: Resume file not found: {resume}", err=True)
        return
    
    click.echo(f"📄 Resume: {resume}")
    click.echo(f"🔍 Query: {query}")
    click.echo(f"📍 Location: {location}")
    click.echo(f"🔢 Limit: {limit} jobs")
    click.echo(f"📊 Min Score: {min_score*100:.0f}%")
    click.echo("="*80)
    click.echo()
    
    async def run():
        from scrapers.async_linkedin_scraper import ScraperConfig
        
        service = IntegratedScrapingService(
            resume_path=str(resume_path),
            scraper_config=ScraperConfig(
                max_concurrent=5,
                timeout=30,
                headless=True
            )
        )
        
        click.echo("🚀 Starting scraper...")
        
        result = await service.scrape_and_match_jobs(
            query=query,
            location=location,
            limit=limit,
            min_match_score=min_score,
            session_name=f"{query} - {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        )
        
        click.echo("\n" + "="*80)
        click.echo("✅ SCRAPING & ANALYSIS COMPLETE")
        click.echo("="*80)
        click.echo(f"Jobs Scraped: {result['jobs_scraped']}")
        click.echo(f"New Jobs: {result['new_jobs']}")
        click.echo(f"Updated Jobs: {result['updated_jobs']}")
        
        if 'analysis' in result:
            click.echo(f"Jobs Analyzed: {result['analysis']['jobs_analyzed']}")
            click.echo(f"High Matches: {len(result.get('high_matches', []))}")
        
        # Show top matches
        high_matches = result.get('high_matches', [])
        if high_matches:
            click.echo("\n" + "="*80)
            click.echo("🎯 TOP HIGH MATCHES:")
            click.echo("="*80)
            
            for i, match in enumerate(high_matches[:10], 1):
                click.echo(f"\n{i}. {match['title']}")
                click.echo(f"   Company: {match['company']}")
                click.echo(f"   Match: {match['match_score']*100:.1f}%")
                click.echo(f"   {match['recommendation']}")
                click.echo(f"   Link: {match['link']}")
    
    asyncio.run(run())


if __name__ == '__main__':
    cli()

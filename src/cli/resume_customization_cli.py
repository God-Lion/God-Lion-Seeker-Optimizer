"""
CLI script to customize resumes for jobs
Integrates with database and job analysis
"""

import sys
import os
from pathlib import Path
from datetime import datetime
from typing import List, Dict
import json
from sqlalchemy.orm import Session

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config.database import get_db
from src.repositories.job_repository import JobRepository
from src.repositories.job_analysis_repository import JobAnalysisRepository
from src.utils.resume_customizer import ResumeCustomizer


RESUME_PATH = 'my_resume.txt'
OUTPUT_DIR = 'customized_resumes'


def load_job_analysis_from_db(db: Session, min_score: float = 0.0) -> List[Dict]:
    """
    Load analyzed jobs from database
    
    Args:
        db: Database session
        min_score: Minimum match score (0-100)
        
    Returns:
        List of jobs with analysis
    """
    try:
        job_repo = JobRepository(db)
        analysis_repo = JobAnalysisRepository(db)
        
        # Get all analyzed jobs with score >= min_score
        jobs_with_analysis = []
        
        # Get all job analyses
        analyses = analysis_repo.get_all()
        
        for analysis in analyses:
            if analysis.overall_match_score >= min_score:
                job = job_repo.get_by_id(analysis.job_id)
                if job:
                    job_dict = {
                        'job_id': job.job_id,
                        'title': job.title,
                        'company': job.company.company_name if job.company else 'Unknown',
                        'place': job.place,
                        'link': job.link,
                        'overall_match_score': analysis.overall_match_score,
                        'similarity_score': analysis.similarity_score,
                        'skill_match': {
                            'matched': json.loads(analysis.matching_skills) if analysis.matching_skills else [],
                            'missing': json.loads(analysis.missing_skills) if analysis.missing_skills else [],
                            'match_percentage': analysis.skills_match_percentage
                        },
                        'recommendation': analysis.recommendation
                    }
                    jobs_with_analysis.append(job_dict)
        
        # Sort by overall match score
        jobs_with_analysis.sort(key=lambda x: x['overall_match_score'], reverse=True)
        
        return jobs_with_analysis
        
    except Exception as e:
        print(f"Error loading jobs from database: {e}")
        import traceback
        traceback.print_exc()
        return []


def customize_single_job(job_id: str, resume_path: str = RESUME_PATH, 
                        output_dir: str = OUTPUT_DIR, output_format: str = "both"):
    """
    Create customized resume for a single job
    
    Args:
        job_id: Job ID from database
        resume_path: Path to master resume
        output_dir: Output directory
        output_format: "pdf", "docx", or "both"
    """
    print("\n" + "="*80)
    print("CREATING CUSTOMIZED RESUME FOR SINGLE JOB")
    print("="*80)
    
    # Get database session
    db = next(get_db())
    
    try:
        # Initialize customizer
        customizer = ResumeCustomizer(resume_path)
        
        # Load job with analysis
        jobs = load_job_analysis_from_db(db, min_score=0)
        job = next((j for j in jobs if j['job_id'] == job_id), None)
        
        if not job:
            print(f"Error: Job ID '{job_id}' not found in database or not analyzed")
            return
        
        print(f"\nJob: {job['title']} at {job['company']}")
        print(f"Match Score: {job['overall_match_score']:.1f}%")
        print(f"Skills Match: {job['skill_match']['match_percentage']:.1f}%")
        
        # Create customized resume
        job_data = {
            'job_id': job['job_id'],
            'title': job['title'],
            'company': job['company'],
            'place': job['place'],
            'link': job['link']
        }
        
        cv_data = customizer.customize_for_job(job_data, job, output_format)
        filepaths = customizer.save_resume(cv_data, job_data, output_dir, output_format)
        
        print(f"\n✅ Resume created successfully!")
        for filepath in filepaths:
            print(f"📄 Saved to: {filepath}")
        
    except Exception as e:
        print(f"\n❌ Error creating resume: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def customize_batch(min_score: float = 75.0, resume_path: str = RESUME_PATH, 
                   output_dir: str = OUTPUT_DIR, max_jobs: int = None,
                   output_format: str = "both"):
    """
    Create customized resumes for multiple jobs
    
    Args:
        min_score: Minimum match score (0-100)
        resume_path: Path to master resume
        output_dir: Output directory
        max_jobs: Maximum number of resumes to create (None = all)
        output_format: "pdf", "docx", or "both"
    """
    print("\n" + "="*80)
    print("BATCH RESUME CUSTOMIZATION")
    print("="*80)
    print(f"Minimum Match Score: {min_score}%")
    print(f"Resume: {resume_path}")
    print(f"Output Directory: {output_dir}")
    print(f"Output Format: {output_format}")
    
    # Get database session
    db = next(get_db())
    
    try:
        # Initialize customizer
        customizer = ResumeCustomizer(resume_path)
        
        # Load jobs with analysis
        print("\nLoading analyzed jobs from database...")
        jobs = load_job_analysis_from_db(db, min_score=min_score)
        
        if not jobs:
            print(f"\n⚠️  No jobs found with match score >= {min_score}%")
            print("Tip: Run job analysis first using job_analysis_cli.py")
            return
        
        print(f"Found {len(jobs)} jobs with match score >= {min_score}%")
        
        # Limit if specified
        if max_jobs and max_jobs < len(jobs):
            jobs = jobs[:max_jobs]
            print(f"Creating resumes for top {max_jobs} jobs")
        
        # Display jobs
        print("\n" + "-"*80)
        print("Jobs to process:")
        print("-"*80)
        for i, job in enumerate(jobs, 1):
            print(f"{i:2d}. {job['title'][:50]:50s} | {job['company'][:20]:20s} | {job['overall_match_score']:5.1f}%")
        
        # Confirm
        print("\n" + "-"*80)
        response = input(f"\nCreate {len(jobs)} customized resumes? (y/n): ").strip().lower()
        
        if response != 'y':
            print("Cancelled.")
            return
        
        # Create resumes
        print("\n" + "="*80)
        print("CREATING RESUMES...")
        print("="*80)
        
        created_files = customizer.batch_create_resumes(jobs, min_score=0, output_dir=output_dir, output_format=output_format)
        
        # Summary
        print("\n" + "="*80)
        print("BATCH CREATION COMPLETE")
        print("="*80)
        print(f"✅ Successfully created: {len(created_files)} files")
        print(f"📁 Location: {Path(output_dir).absolute()}")
        
        # Save manifest
        manifest = {
            'created_at': datetime.now().isoformat(),
            'total_resumes': len(created_files) // (2 if output_format == "both" else 1),
            'total_files': len(created_files),
            'min_score': min_score,
            'output_format': output_format,
            'jobs': [
                {
                    'job_id': job['job_id'],
                    'title': job['title'],
                    'company': job['company'],
                    'match_score': job['overall_match_score'],
                }
                for job in jobs
            ]
        }
        
        manifest_path = Path(output_dir) / f"manifest_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2)
        
        print(f"📋 Manifest saved: {manifest_path}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


def list_analyzed_jobs(min_score: float = 0.0, limit: int = 20):
    """
    List analyzed jobs from database
    
    Args:
        min_score: Minimum match score
        limit: Maximum number to display
    """
    print("\n" + "="*80)
    print("ANALYZED JOBS IN DATABASE")
    print("="*80)
    
    # Get database session
    db = next(get_db())
    
    try:
        jobs = load_job_analysis_from_db(db, min_score=min_score)
        
        if not jobs:
            print(f"\n⚠️  No analyzed jobs found with match score >= {min_score}%")
            return
        
        print(f"\nShowing top {min(limit, len(jobs))} of {len(jobs)} jobs:\n")
        print(f"{'#':<4} {'Title':<45} {'Company':<22} {'Score':<8} {'Category':<12}")
        print("-"*100)
        
        for i, job in enumerate(jobs[:limit], 1):
            score = job['overall_match_score']
            category = 'Excellent' if score >= 75 else 'Good' if score >= 60 else 'Fair' if score >= 40 else 'Poor'
            
            title = job['title'][:44]
            company = job['company'][:21]
            
            print(f"{i:<4} {title:<45} {company:<22} {score:>5.1f}%  {category:<12}")
        
        # Statistics
        print("\n" + "-"*80)
        print("Statistics:")
        excellent = sum(1 for j in jobs if j['overall_match_score'] >= 75)
        good = sum(1 for j in jobs if 60 <= j['overall_match_score'] < 75)
        fair = sum(1 for j in jobs if 40 <= j['overall_match_score'] < 60)
        poor = sum(1 for j in jobs if j['overall_match_score'] < 40)
        
        print(f"  Excellent (75%+): {excellent}")
        print(f"  Good (60-74%):    {good}")
        print(f"  Fair (40-59%):    {fair}")
        print(f"  Poor (<40%):      {poor}")
        
    finally:
        db.close()


def show_help():
    """Show help message"""
    help_text = """
RESUME CUSTOMIZATION SYSTEM - HELP
=====================================

USAGE:
    python resume_customization_cli.py [command] [options]

COMMANDS:
    
    batch [min_score] [max_jobs] [format]
        Create customized resumes for multiple jobs
        min_score: Minimum match score (default: 75)
        max_jobs: Max number of resumes to create (default: all)
        format: Output format - pdf, docx, or both (default: both)
        
        Examples:
            python resume_customization_cli.py batch
            python resume_customization_cli.py batch 80
            python resume_customization_cli.py batch 70 10
            python resume_customization_cli.py batch 75 5 pdf
    
    single <job_id> [format]
        Create customized resume for a specific job
        format: Output format - pdf, docx, or both (default: both)
        
        Examples:
            python resume_customization_cli.py single 3845729162
            python resume_customization_cli.py single 3845729162 docx
    
    list [min_score] [limit]
        List analyzed jobs from database
        min_score: Minimum match score (default: 0)
        limit: Maximum number to display (default: 20)
        
        Examples:
            python resume_customization_cli.py list
            python resume_customization_cli.py list 75
            python resume_customization_cli.py list 60 50
    
    help
        Show this help message

REQUIREMENTS:
    - Master resume file: my_resume.txt (in project root)
    - Jobs must be analyzed first (run job_analysis_cli.py)
    - Database connection configured

OUTPUT:
    - Resumes saved to: customized_resumes/
    - Format: resume_[Company]_[Title]_[Date].pdf/docx
    - Manifest file created with batch operations

OUTPUT FORMATS:
    - pdf: Creates PDF resume only
    - docx: Creates DOCX resume only  
    - both: Creates both PDF and DOCX (default)

TIPS:
    - Start with min_score of 75% for best matches
    - Review manifest file to track created resumes
    - ATS-optimized formatting applied automatically
    - Resumes are customized based on matched skills and job requirements
"""
    print(help_text)


def main():
    """Main entry point"""
    
    # Check if resume file exists
    if not os.path.exists(RESUME_PATH):
        print(f"❌ Error: Resume file not found: {RESUME_PATH}")
        print("Please create a master resume file named 'my_resume.txt' in the project root")
        print("\nExpected format:")
        print("  - Header with name, title, contact info")
        print("  - Section headers: SUMMARY, SKILLS, EXPERIENCE, EDUCATION, etc.")
        print("  - Experience entries: Title | Company | Location | Dates")
        print("  - Bullet points starting with - or •")
        sys.exit(1)
    
    # Parse command line arguments
    if len(sys.argv) < 2:
        show_help()
        return
    
    command = sys.argv[1].lower()
    
    try:
        if command == 'help' or command == '-h' or command == '--help':
            show_help()
        
        elif command == 'batch':
            min_score = float(sys.argv[2]) if len(sys.argv) > 2 else 75.0
            max_jobs = int(sys.argv[3]) if len(sys.argv) > 3 else None
            output_format = sys.argv[4].lower() if len(sys.argv) > 4 else "both"
            
            if output_format not in ["pdf", "docx", "both"]:
                print(f"❌ Invalid format: {output_format}. Must be 'pdf', 'docx', or 'both'")
                sys.exit(1)
            
            customize_batch(min_score=min_score, max_jobs=max_jobs, output_format=output_format)
        
        elif command == 'single':
            if len(sys.argv) < 3:
                print("❌ Error: Job ID required")
                print("Usage: python resume_customization_cli.py single <job_id> [format]")
                sys.exit(1)
            job_id = sys.argv[2]
            output_format = sys.argv[3].lower() if len(sys.argv) > 3 else "both"
            
            if output_format not in ["pdf", "docx", "both"]:
                print(f"❌ Invalid format: {output_format}. Must be 'pdf', 'docx', or 'both'")
                sys.exit(1)
            
            customize_single_job(job_id, output_format=output_format)
        
        elif command == 'list':
            min_score = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
            limit = int(sys.argv[3]) if len(sys.argv) > 3 else 20
            list_analyzed_jobs(min_score=min_score, limit=limit)
        
        else:
            print(f"❌ Unknown command: {command}")
            print("Run 'python resume_customization_cli.py help' for usage information")
            sys.exit(1)
    
    except KeyboardInterrupt:
        print("\n\nOperation cancelled by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()

"""
Resume Generation Service
Business logic for resume customization and generation
"""

from typing import List, Dict, Optional
from pathlib import Path
from datetime import datetime
import json
from sqlalchemy.orm import Session

from src.repositories.job_repository import JobRepository
from src.repositories.job_analysis_repository import JobAnalysisRepository
from src.utils.resume_customizer import ResumeCustomizer


class ResumeGenerationService:
    """
    Service for generating customized resumes based on job analysis
    """
    
    def __init__(self, db: Session, master_resume_path: str):
        """
        Initialize the service
        
        Args:
            db: Database session
            master_resume_path: Path to master resume file
        """
        self.db = db
        self.job_repo = JobRepository(db)
        self.analysis_repo = JobAnalysisRepository(db)
        self.customizer = ResumeCustomizer(master_resume_path)
    
    def get_analyzed_jobs(self, min_score: float = 0.0, limit: Optional[int] = None) -> List[Dict]:
        """
        Get all analyzed jobs from database
        
        Args:
            min_score: Minimum match score (0-100)
            limit: Maximum number of jobs to return
            
        Returns:
            List of job dictionaries with analysis data
        """
        jobs_with_analysis = []
        
        # Get all job analyses
        analyses = self.analysis_repo.get_all()
        
        for analysis in analyses:
            if analysis.overall_match_score >= min_score:
                job = self.job_repo.get_by_id(analysis.job_id)
                if job:
                    job_dict = {
                        'job_id': job.job_id,
                        'title': job.title,
                        'company': job.company.company_name if job.company else 'Unknown',
                        'place': job.place,
                        'link': job.link,
                        'description': job.description,
                        'overall_match_score': analysis.overall_match_score,
                        'similarity_score': analysis.similarity_score,
                        'skill_match': {
                            'matched': json.loads(analysis.matching_skills) if analysis.matching_skills else [],
                            'missing': json.loads(analysis.missing_skills) if analysis.missing_skills else [],
                            'match_percentage': analysis.skills_match_percentage
                        },
                        'recommendation': analysis.recommendation,
                        'match_category': analysis.match_category
                    }
                    jobs_with_analysis.append(job_dict)
        
        # Sort by overall match score
        jobs_with_analysis.sort(key=lambda x: x['overall_match_score'], reverse=True)
        
        # Apply limit if specified
        if limit:
            jobs_with_analysis = jobs_with_analysis[:limit]
        
        return jobs_with_analysis
    
    def get_job_by_id(self, job_id: str) -> Optional[Dict]:
        """
        Get a specific job with analysis
        
        Args:
            job_id: Job ID
            
        Returns:
            Job dictionary with analysis or None
        """
        jobs = self.get_analyzed_jobs(min_score=0)
        return next((j for j in jobs if j['job_id'] == job_id), None)
    
    def generate_resume_for_job(self, job_id: str, output_dir: str = 'customized_resumes',
                               output_format: str = 'both') -> List[str]:
        """
        Generate customized resume for a specific job
        
        Args:
            job_id: Job ID
            output_dir: Output directory
            output_format: "pdf", "docx", or "both"
            
        Returns:
            List of generated file paths
            
        Raises:
            ValueError: If job not found or not analyzed
        """
        # Get job with analysis
        job = self.get_job_by_id(job_id)
        
        if not job:
            raise ValueError(f"Job with ID '{job_id}' not found or not analyzed")
        
        # Prepare job data
        job_data = {
            'job_id': job['job_id'],
            'title': job['title'],
            'company': job['company'],
            'place': job['place'],
            'link': job['link']
        }
        
        # Generate CV data
        cv_data = self.customizer.customize_for_job(job_data, job, output_format)
        
        # Save resume
        filepaths = self.customizer.save_resume(cv_data, job_data, output_dir, output_format)
        
        return filepaths
    
    def generate_resumes_batch(self, min_score: float = 75.0, 
                              max_jobs: Optional[int] = None,
                              output_dir: str = 'customized_resumes',
                              output_format: str = 'both') -> Dict:
        """
        Generate resumes for multiple jobs
        
        Args:
            min_score: Minimum match score (0-100)
            max_jobs: Maximum number of resumes to create
            output_dir: Output directory
            output_format: "pdf", "docx", or "both"
            
        Returns:
            Dictionary with generation results
        """
        # Get qualified jobs
        jobs = self.get_analyzed_jobs(min_score=min_score, limit=max_jobs)
        
        if not jobs:
            return {
                'success': False,
                'message': f'No jobs found with match score >= {min_score}%',
                'jobs_processed': 0,
                'files_created': []
            }
        
        # Generate resumes
        created_files = []
        errors = []
        
        for job in jobs:
            try:
                job_data = {
                    'job_id': job['job_id'],
                    'title': job['title'],
                    'company': job['company'],
                    'place': job['place'],
                    'link': job['link']
                }
                
                cv_data = self.customizer.customize_for_job(job_data, job, output_format)
                filepaths = self.customizer.save_resume(cv_data, job_data, output_dir, output_format)
                created_files.extend(filepaths)
                
            except Exception as e:
                errors.append({
                    'job_id': job['job_id'],
                    'title': job['title'],
                    'error': str(e)
                })
        
        # Create manifest
        manifest = self._create_manifest(jobs, created_files, min_score, output_format, output_dir)
        
        return {
            'success': True,
            'message': f'Successfully created {len(created_files)} files for {len(jobs)} jobs',
            'jobs_processed': len(jobs),
            'files_created': created_files,
            'errors': errors,
            'manifest_path': str(manifest)
        }
    
    def _create_manifest(self, jobs: List[Dict], files: List[str], 
                        min_score: float, output_format: str, output_dir: str) -> Path:
        """
        Create manifest file for batch generation
        
        Args:
            jobs: List of processed jobs
            files: List of created files
            min_score: Minimum score used
            output_format: Output format used
            output_dir: Output directory
            
        Returns:
            Path to manifest file
        """
        manifest = {
            'created_at': datetime.now().isoformat(),
            'total_resumes': len(files) // (2 if output_format == "both" else 1),
            'total_files': len(files),
            'min_score': min_score,
            'output_format': output_format,
            'jobs': [
                {
                    'job_id': job['job_id'],
                    'title': job['title'],
                    'company': job['company'],
                    'match_score': job['overall_match_score'],
                    'skills_match': job['skill_match']['match_percentage'],
                    'category': job['match_category']
                }
                for job in jobs
            ]
        }
        
        # Save manifest
        manifest_path = Path(output_dir) / f"manifest_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2)
        
        return manifest_path
    
    def get_statistics(self) -> Dict:
        """
        Get statistics about analyzed jobs
        
        Returns:
            Dictionary with statistics
        """
        jobs = self.get_analyzed_jobs(min_score=0)
        
        if not jobs:
            return {
                'total_jobs': 0,
                'excellent': 0,
                'good': 0,
                'fair': 0,
                'poor': 0,
                'avg_match_score': 0.0,
                'avg_skills_match': 0.0
            }
        
        excellent = sum(1 for j in jobs if j['overall_match_score'] >= 75)
        good = sum(1 for j in jobs if 60 <= j['overall_match_score'] < 75)
        fair = sum(1 for j in jobs if 40 <= j['overall_match_score'] < 60)
        poor = sum(1 for j in jobs if j['overall_match_score'] < 40)
        
        avg_match = sum(j['overall_match_score'] for j in jobs) / len(jobs)
        avg_skills = sum(j['skill_match']['match_percentage'] for j in jobs) / len(jobs)
        
        return {
            'total_jobs': len(jobs),
            'excellent': excellent,
            'good': good,
            'fair': fair,
            'poor': poor,
            'avg_match_score': round(avg_match, 2),
            'avg_skills_match': round(avg_skills, 2)
        }
    
    def preview_customization(self, job_id: str) -> Dict:
        """
        Preview how a resume would be customized for a job
        
        Args:
            job_id: Job ID
            
        Returns:
            Dictionary with customization preview
            
        Raises:
            ValueError: If job not found
        """
        job = self.get_job_by_id(job_id)
        
        if not job:
            raise ValueError(f"Job with ID '{job_id}' not found")
        
        job_data = {
            'job_id': job['job_id'],
            'title': job['title'],
            'company': job['company'],
            'place': job['place'],
            'link': job['link']
        }
        
        # Generate CV data without saving
        cv_data = self.customizer.customize_for_job(job_data, job, 'both')
        
        return {
            'job': {
                'title': job['title'],
                'company': job['company'],
                'match_score': job['overall_match_score'],
                'skills_match': job['skill_match']['match_percentage']
            },
            'customization': {
                'summary': cv_data.get('summary', ''),
                'skills_highlighted': list(cv_data.get('skills', {}).keys()),
                'matched_skills': job['skill_match']['matched'][:10],
                'missing_skills': job['skill_match']['missing'][:5],
                'experience_bullets_selected': sum(len(exp.get('bullets', [])) for exp in cv_data.get('experience', []))
            }
        }

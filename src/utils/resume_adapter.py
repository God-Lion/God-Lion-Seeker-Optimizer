"""
Resume Adapter Module
Bridges the ResumeCustomizer with the new DocumentGenerator
Provides backward compatibility while adding PDF generation capability
"""

from typing import Dict, List, Optional
from pathlib import Path
from datetime import datetime
import re
import sys

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from src.utils.document_generator import DocumentGenerator
from resume_customizer import ResumeCustomizer


class ResumeAdapter:
    """
    Adapter class that provides a bridge between ResumeCustomizer and DocumentGenerator.
    Allows using the new PDF generation capabilities with existing resume data.
    """
    
    def __init__(self, master_resume_path: str):
        """
        Initialize adapter with master resume
        
        Args:
            master_resume_path: Path to master resume text file
        """
        self.customizer = ResumeCustomizer(master_resume_path)
        self.resume_data = self.customizer.resume_data
        
    def _convert_to_cv_data(self, job_data: Dict, analysis: Dict) -> Dict:
        """
        Convert ResumeCustomizer format to DocumentGenerator CV data format
        
        Args:
            job_data: Job information
            analysis: Job analysis data
            
        Returns:
            CV data dictionary compatible with DocumentGenerator
        """
        # Get matched skills for prioritization
        matched_skills = analysis.get('skill_match', {}).get('matched', [])
        matched_set = set([s.lower() for s in matched_skills])
        
        # Build CV data structure
        cv_data = {
            "name": self.resume_data.get('name', ''),
            "title": self.resume_data.get('title', ''),
            "contact": {
                "email": self._extract_email(self.resume_data.get('contact', '')),
                "phone": self._extract_phone(self.resume_data.get('contact', '')),
                "linkedin": self._extract_linkedin(self.resume_data.get('contact', '')),
                "github": self._extract_github(self.resume_data.get('contact', ''))
            },
            "summary": self._generate_custom_summary(job_data, matched_skills[:5]),
            "experience": self._convert_experience(analysis),
            "education": self._convert_education(),
            "skills": self._categorize_skills(matched_set),
            "certifications": self._convert_certifications()
        }
        
        return cv_data
    
    def _extract_email(self, contact_text: str) -> str:
        """Extract email from contact text"""
        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', contact_text)
        return email_match.group(0) if email_match else ''
    
    def _extract_phone(self, contact_text: str) -> Optional[str]:
        """Extract phone from contact text"""
        phone_match = re.search(r'[\+\d][\d\s\-\(\)]{10,}', contact_text)
        return phone_match.group(0).strip() if phone_match else None
    
    def _extract_linkedin(self, contact_text: str) -> Optional[str]:
        """Extract LinkedIn URL from contact text"""
        linkedin_match = re.search(r'linkedin\.com/in/[\w\-]+', contact_text)
        if linkedin_match:
            return f"https://{linkedin_match.group(0)}"
        return None
    
    def _extract_github(self, contact_text: str) -> Optional[str]:
        """Extract GitHub URL from contact text"""
        github_match = re.search(r'github\.com/[\w\-]+', contact_text)
        if github_match:
            return f"https://{github_match.group(0)}"
        return None
    
    def _generate_custom_summary(self, job_data: Dict, key_skills: List[str]) -> str:
        """Generate customized summary based on job"""
        original_summary = self.resume_data.get('summary', '')
        job_title = job_data.get('title', '')
        
        # Extract years of experience
        years_match = re.search(r'(\d+)\+?\s*years?', original_summary.lower())
        years = years_match.group(1) if years_match else '5+'
        
        # Determine expertise area based on job title
        expertise = 'software development'
        job_title_lower = job_title.lower()
        
        if 'data' in job_title_lower:
            expertise = 'data science and analytics'
        elif 'devops' in job_title_lower or 'cloud' in job_title_lower:
            expertise = 'DevOps and cloud infrastructure'
        elif 'security' in job_title_lower or 'cybersecurity' in job_title_lower:
            expertise = 'cybersecurity and information security'
        elif 'full stack' in job_title_lower or 'full-stack' in job_title_lower:
            expertise = 'full-stack development'
        elif 'backend' in job_title_lower or 'back-end' in job_title_lower:
            expertise = 'backend development'
        elif 'frontend' in job_title_lower or 'front-end' in job_title_lower:
            expertise = 'frontend development'
        
        # Build customized summary
        skill_text = ', '.join(key_skills[:3]) if key_skills else 'modern technologies'
        
        summary = (
            f"Results-driven professional with {years} years of experience in {expertise}. "
            f"Proven expertise in {skill_text} with a strong track record of delivering "
            f"high-quality solutions. Passionate about leveraging technology to solve complex "
            f"problems and drive business value through efficient, scalable applications."
        )
        
        return summary
    
    def _convert_experience(self, analysis: Dict) -> List[Dict]:
        """Convert experience entries to CV format"""
        experiences = []
        matched_skills = set([s.lower() for s in analysis.get('skill_match', {}).get('matched', [])])
        
        for exp in self.resume_data.get('experience', []):
            # Score responsibilities by relevance
            responsibilities = exp.get('responsibilities', [])
            
            def relevance_score(resp):
                resp_lower = resp.lower()
                return sum(1 for skill in matched_skills if skill in resp_lower)
            
            # Sort and limit responsibilities
            sorted_resp = sorted(responsibilities, key=relevance_score, reverse=True)
            top_resp = sorted_resp[:6]  # Top 6 most relevant
            
            experiences.append({
                "title": exp.get('title', ''),
                "company": exp.get('company', ''),
                "location": None,  # Extract if available
                "dates": exp.get('dates', ''),
                "bullets": top_resp
            })
        
        return experiences
    
    def _convert_education(self) -> List[Dict]:
        """Convert education to CV format"""
        education = []
        edu_text = self.resume_data.get('education', '')
        
        if isinstance(edu_text, str):
            # Parse education text
            lines = [l.strip() for l in edu_text.split('\n') if l.strip()]
            current_entry = {}
            
            for line in lines:
                if '|' in line and any(year in line for year in ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']):
                    # New education entry
                    if current_entry:
                        education.append(current_entry)
                    
                    parts = [p.strip() for p in line.split('|')]
                    current_entry = {
                        'degree': parts[0] if parts else '',
                        'institution': parts[1] if len(parts) > 1 else '',
                        'location': None,
                        'dates': parts[2] if len(parts) > 2 else '',
                        'details': []
                    }
                elif line.startswith('-') or line.startswith('•'):
                    # Detail line
                    if current_entry:
                        current_entry['details'].append(line.lstrip('-•').strip())
            
            if current_entry:
                education.append(current_entry)
        
        return education
    
    def _categorize_skills(self, matched_set: set) -> Dict[str, List[str]]:
        """Categorize skills for CV format"""
        all_skills = self.resume_data.get('skills', [])
        
        categorized = {
            'Security Tools': [],
            'Programming': [],
            'Frameworks': [],
            'Cloud Security': [],
            'Other': []
        }
        
        # Keywords for categorization
        security_keywords = ['wireshark', 'nmap', 'metasploit', 'burp', 'splunk', 'firewall', 'ids', 'ips']
        prog_keywords = ['python', 'java', 'javascript', 'c++', 'c#', 'bash', 'powershell', 'sql']
        framework_keywords = ['nist', 'iso', 'owasp', 'pci', 'hipaa', 'gdpr']
        cloud_keywords = ['aws', 'azure', 'gcp', 'iam', 'sentinel', 'cloudwatch']
        
        for skill in all_skills:
            skill_lower = skill.lower()
            
            # Categorize
            if any(k in skill_lower for k in security_keywords):
                categorized['Security Tools'].append(skill)
            elif any(k in skill_lower for k in prog_keywords):
                categorized['Programming'].append(skill)
            elif any(k in skill_lower for k in framework_keywords):
                categorized['Frameworks'].append(skill)
            elif any(k in skill_lower for k in cloud_keywords):
                categorized['Cloud Security'].append(skill)
            else:
                categorized['Other'].append(skill)
        
        # Sort each category with matched skills first
        for category in categorized:
            categorized[category].sort(key=lambda s: (s.lower() not in matched_set, s))
        
        # Remove empty categories
        return {k: v for k, v in categorized.items() if v}
    
    def _convert_certifications(self) -> List[Dict]:
        """Convert certifications to CV format"""
        certifications = []
        cert_text = self.resume_data.get('certifications', '')
        
        if isinstance(cert_text, str):
            lines = [l.strip() for l in cert_text.split('\n') if l.strip()]
            
            for line in lines:
                if line.startswith('-') or line.startswith('•'):
                    line = line.lstrip('-•').strip()
                    
                    # Try to parse certification format
                    # Format: "Name - Issuer (Year)" or "Name - Issuer, Year"
                    match = re.match(r'(.+?)\s*-\s*(.+?)(?:\s*[\(,]\s*(\d{4})\)?)?$', line)
                    
                    if match:
                        name, issuer, date = match.groups()
                        certifications.append({
                            'name': name.strip(),
                            'issuer': issuer.strip(),
                            'date': date if date else None,
                            'url': None
                        })
                    else:
                        # Fallback: use the whole line as name
                        certifications.append({
                            'name': line,
                            'issuer': '',
                            'date': None,
                            'url': None
                        })
        
        return certifications
    
    def generate_for_job(self, job_data: Dict, analysis: Dict, 
                        output_dir: str = 'customized_resumes',
                        output_format: str = 'both') -> List[str]:
        """
        Generate customized resume for a job in specified format(s)
        
        Args:
            job_data: Job information
            analysis: Job analysis data
            output_dir: Output directory
            output_format: 'pdf', 'docx', or 'both'
            
        Returns:
            List of paths to created files
        """
        # Create output directory
        Path(output_dir).mkdir(exist_ok=True)
        
        # Convert to CV data format
        cv_data = self._convert_to_cv_data(job_data, analysis)
        
        # Generate filename
        company = job_data.get('company', 'Unknown')
        title = job_data.get('title', 'Position')
        date = datetime.now().strftime('%Y%m%d')
        
        company_clean = re.sub(r'[^\w\s-]', '', company).strip().replace(' ', '_')[:30]
        title_clean = re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '_')[:40]
        
        base_filename = Path(output_dir) / f"resume_{company_clean}_{title_clean}_{date}"
        
        # Generate documents
        generator = DocumentGenerator(output_format=output_format)
        saved_files = generator.generate(str(base_filename), cv_data)
        
        return saved_files
    
    def batch_generate(self, jobs_with_analysis: List[Dict],
                      min_score: float = 0.75,
                      output_dir: str = 'customized_resumes',
                      output_format: str = 'both') -> List[str]:
        """
        Generate customized resumes for multiple jobs
        
        Args:
            jobs_with_analysis: List of jobs with analysis data
            min_score: Minimum match score (0-1 scale)
            output_dir: Output directory
            output_format: 'pdf', 'docx', or 'both'
            
        Returns:
            List of all created file paths
        """
        created_files = []
        
        # Filter jobs by minimum score
        qualified_jobs = [
            job for job in jobs_with_analysis
            if job.get('overall_score', 0) >= min_score
        ]
        
        print(f"\nGenerating {output_format.upper()} resumes for {len(qualified_jobs)} jobs (score >= {min_score*100:.0f}%)...")
        
        for i, job in enumerate(qualified_jobs, 1):
            try:
                job_data = {
                    'job_id': job.get('job_id', ''),
                    'title': job.get('title', ''),
                    'company': job.get('company', ''),
                    'place': job.get('place', ''),
                    'link': job.get('link', '')
                }
                
                files = self.generate_for_job(job_data, job, output_dir, output_format)
                created_files.extend(files)
                
                print(f"  [{i}/{len(qualified_jobs)}] Created: {', '.join([Path(f).name for f in files])}")
                
            except Exception as e:
                print(f"  [{i}/{len(qualified_jobs)}] Error: {job_data.get('title', 'Unknown')}: {e}")
                continue
        
        return created_files


# Example usage
if __name__ == '__main__':
    # Test the adapter
    adapter = ResumeAdapter('my_resume.txt')
    
    # Sample job data and analysis
    job_data = {
        'job_id': 'test123',
        'title': 'Cybersecurity Analyst',
        'company': 'Tech Corp',
        'place': 'Boston, MA',
        'link': 'https://example.com/job'
    }
    
    analysis = {
        'overall_score': 0.85,
        'skill_match': {
            'matched': ['Python', 'Network Security', 'SIEM', 'Incident Response'],
            'missing': ['Kubernetes', 'Docker'],
            'match_percentage': 85.0
        }
    }
    
    # Generate both PDF and DOCX
    files = adapter.generate_for_job(job_data, analysis, output_format='both')
    print(f"\nGenerated files: {files}")

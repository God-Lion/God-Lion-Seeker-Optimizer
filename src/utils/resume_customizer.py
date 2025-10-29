"""
Resume Customization System
Automatically creates tailored resumes for each job based on AI analysis
Integrates with DocumentGenerator for consistent formatting
"""

from typing import Dict, List, Optional
import re
from datetime import datetime
from pathlib import Path
import json

from .document_generator import DocumentGenerator


class ResumeCustomizer:
    """
    Creates ATS-optimized customized resumes using DocumentGenerator
    Tailors resumes based on job analysis data
    """
    
    def __init__(self, master_resume_path: str):
        """
        Initialize with master resume
        
        Args:
            master_resume_path: Path to master resume file (PDF, DOCX, or TXT)
        """
        self.master_resume_path = master_resume_path
        self.resume_data = self._parse_master_resume()
        
    def _parse_master_resume(self) -> Dict:
        """
        Parse master resume into structured sections
        
        Returns:
            Dictionary with resume sections
        """
        try:
            content = self._load_resume_file(self.master_resume_path)
        except Exception as e:
            raise ValueError(f"Error reading master resume: {e}")
        
        # Initialize sections
        sections = {
            'header': '',
            'summary': '',
            'skills': [],
            'experience': [],
            'education': [],
            'certifications': [],
            'projects': [],
            'achievements': [],
            'languages': [],
            'interests': []
        }
        
        # Split by sections
        current_section = 'header'
        lines = content.split('\n')
        
        temp_content = []
        
        for line in lines:
            line_upper = line.strip().upper()
            
            # Check for section headers
            if line_upper in ['SUMMARY', 'PROFESSIONAL SUMMARY', 'PROFILE']:
                if temp_content:
                    sections[current_section] = '\n'.join(temp_content)
                current_section = 'summary'
                temp_content = []
            elif line_upper in ['TECHNICAL SKILLS', 'SKILLS', 'CORE COMPETENCIES']:
                if temp_content:
                    sections[current_section] = '\n'.join(temp_content)
                current_section = 'skills'
                temp_content = []
            elif line_upper in ['PROFESSIONAL EXPERIENCE', 'EXPERIENCE', 'WORK EXPERIENCE']:
                if temp_content:
                    sections[current_section] = '\n'.join(temp_content)
                current_section = 'experience'
                temp_content = []
            elif line_upper in ['EDUCATION', 'ACADEMIC BACKGROUND']:
                if temp_content:
                    sections[current_section] = '\n'.join(temp_content)
                current_section = 'education'
                temp_content = []
            elif line_upper in ['CERTIFICATIONS', 'CERTIFICATES', 'PROFESSIONAL CERTIFICATIONS']:
                if temp_content:
                    sections[current_section] = '\n'.join(temp_content)
                current_section = 'certifications'
                temp_content = []
            elif line_upper in ['PROJECTS', 'KEY PROJECTS', 'NOTABLE PROJECTS']:
                if temp_content:
                    sections[current_section] = '\n'.join(temp_content)
                current_section = 'projects'
                temp_content = []
            elif line_upper in ['ACHIEVEMENTS', 'KEY ACHIEVEMENTS', 'ACCOMPLISHMENTS']:
                if temp_content:
                    sections[current_section] = '\n'.join(temp_content)
                current_section = 'achievements'
                temp_content = []
            elif line_upper in ['LANGUAGES']:
                if temp_content:
                    sections[current_section] = '\n'.join(temp_content)
                current_section = 'languages'
                temp_content = []
            elif line_upper in ['INTERESTS', 'HOBBIES']:
                if temp_content:
                    sections[current_section] = '\n'.join(temp_content)
                current_section = 'interests'
                temp_content = []
            else:
                temp_content.append(line)
        
        # Save last section
        if temp_content:
            sections[current_section] = '\n'.join(temp_content)
        
        # Parse structured data
        sections = self._structure_sections(sections)
        
        return sections
    
    def _load_resume_file(self, file_path: str) -> str:
        """Load resume from file (supports TXT, PDF, DOCX)"""
        try:
            path = Path(file_path)
            if not path.exists():
                raise FileNotFoundError(f"Resume file not found: {file_path}")
            
            file_ext = path.suffix.lower()
            
            # Handle PDF files
            if file_ext == '.pdf':
                try:
                    from PyPDF2 import PdfReader
                    reader = PdfReader(str(path))
                    content = ""
                    for page in reader.pages:
                        content += page.extract_text() + "\n"
                    return content
                except ImportError:
                    raise ValueError("PyPDF2 is required to read PDF files. Install it with: pip install PyPDF2")
                except Exception as e:
                    raise ValueError(f"Failed to read PDF: {e}")
            
            # Handle DOCX files
            elif file_ext in ['.docx', '.doc']:
                try:
                    from docx import Document
                    doc = Document(str(path))
                    content = "\n".join([para.text for para in doc.paragraphs])
                    return content
                except ImportError:
                    raise ValueError("python-docx is required to read DOCX files. Install it with: pip install python-docx")
                except Exception as e:
                    raise ValueError(f"Failed to read DOCX: {e}")
            
            # Handle text files
            else:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return content
                
        except Exception as e:
            raise ValueError(f"Failed to load resume file: {e}")
    
    def _structure_sections(self, sections: Dict) -> Dict:
        """
        Convert raw text sections into structured data
        """
        # Parse header
        header_lines = [l.strip() for l in sections['header'].split('\n') if l.strip()]
        sections['name'] = header_lines[0] if header_lines else ''
        sections['title'] = header_lines[1] if len(header_lines) > 1 else ''
        
        # Parse contact info
        contact_dict = {}
        for line in header_lines[2:]:
            if '@' in line:
                contact_dict['email'] = line.strip()
            elif 'linkedin.com' in line.lower():
                contact_dict['linkedin'] = line.strip()
            elif 'github.com' in line.lower():
                contact_dict['github'] = line.strip()
            elif any(char.isdigit() for char in line) and ('-' in line or '(' in line):
                contact_dict['phone'] = line.strip()
        
        sections['contact'] = contact_dict
        
        # Parse skills into list
        if isinstance(sections['skills'], str):
            skills_text = sections['skills']
            skill_list = []
            for line in skills_text.split('\n'):
                if ':' in line:
                    _, skills = line.split(':', 1)
                    skills = [s.strip() for s in skills.split(',') if s.strip()]
                    skill_list.extend(skills)
            sections['skills'] = skill_list
        
        # Parse experience entries
        if isinstance(sections['experience'], str):
            sections['experience'] = self._parse_experience(sections['experience'])
        
        # Parse education
        if isinstance(sections['education'], str):
            sections['education'] = self._parse_education(sections['education'])
        
        # Parse certifications
        if isinstance(sections['certifications'], str):
            sections['certifications'] = self._parse_certifications(sections['certifications'])
        
        # Parse projects
        if isinstance(sections['projects'], str):
            sections['projects'] = self._parse_projects(sections['projects'])
        
        return sections
    
    def _parse_experience(self, text: str) -> List[Dict]:
        """Parse experience section into structured entries"""
        entries = []
        current_entry = None
        
        for line in text.split('\n'):
            line = line.strip()
            if not line:
                continue
            
            # Check if it's a job header (contains company and dates)
            if '|' in line and any(year in line for year in ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Present']):
                if current_entry:
                    entries.append(current_entry)
                
                parts = [p.strip() for p in line.split('|')]
                current_entry = {
                    'title': parts[0] if parts else '',
                    'company': parts[1] if len(parts) > 1 else '',
                    'location': parts[2] if len(parts) > 2 and not any(year in parts[2] for year in ['2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', 'Present']) else None,
                    'dates': parts[-1],
                    'bullets': []
                }
            elif line.startswith('-') or line.startswith('•'):
                if current_entry:
                    current_entry['bullets'].append(line.lstrip('-•').strip())
        
        if current_entry:
            entries.append(current_entry)
        
        return entries
    
    def _parse_education(self, text: str) -> List[Dict]:
        """Parse education section into structured entries"""
        entries = []
        current_entry = None
        
        for line in text.split('\n'):
            line = line.strip()
            if not line:
                continue
            
            if '|' in line and any(year in line for year in ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']):
                if current_entry:
                    entries.append(current_entry)
                
                parts = [p.strip() for p in line.split('|')]
                current_entry = {
                    'degree': parts[0] if parts else '',
                    'institution': parts[1] if len(parts) > 1 else '',
                    'location': parts[2] if len(parts) > 2 and not any(year in parts[2] for year in ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025']) else None,
                    'dates': parts[-1],
                    'details': []
                }
            elif (line.startswith('-') or line.startswith('•')) and current_entry:
                current_entry['details'].append(line.lstrip('-•').strip())
        
        if current_entry:
            entries.append(current_entry)
        
        return entries
    
    def _parse_certifications(self, text: str) -> List[Dict]:
        """Parse certifications section"""
        certs = []
        for line in text.split('\n'):
            line = line.strip()
            if line and (line.startswith('-') or line.startswith('•')):
                line = line.lstrip('-•').strip()
                # Try to extract cert name, issuer, and date
                parts = [p.strip() for p in line.split('-')]
                cert = {
                    'name': parts[0] if parts else line,
                    'issuer': parts[1] if len(parts) > 1 else '',
                    'date': parts[2] if len(parts) > 2 else None,
                    'url': None
                }
                certs.append(cert)
        
        return certs
    
    def _parse_projects(self, text: str) -> List[Dict]:
        """Parse projects section into structured entries"""
        projects = []
        current_project = None
        
        for line in text.split('\n'):
            line = line.strip()
            if not line:
                continue
            
            if not line.startswith('-') and not line.startswith('•') and 'Technologies:' not in line:
                if current_project:
                    projects.append(current_project)
                
                current_project = {
                    'name': line,
                    'description': [],
                    'technologies': ''
                }
            elif line.startswith('-') or line.startswith('•'):
                if current_project:
                    current_project['description'].append(line.lstrip('-•').strip())
            elif 'Technologies:' in line:
                if current_project:
                    current_project['technologies'] = line.replace('Technologies:', '').strip()
        
        if current_project:
            projects.append(current_project)
        
        return projects
    
    def customize_for_job(self, job_data: Dict, analysis: Dict, output_format: str = "both") -> DocumentGenerator:
        """
        Create customized resume for specific job using DocumentGenerator
        
        Args:
            job_data: Dictionary with job information
            analysis: Dictionary with job analysis data
            output_format: "pdf", "docx", or "both"
            
        Returns:
            DocumentGenerator instance with customized content
        """
        # Create CV data structure
        cv_data = {
            "name": self.resume_data.get('name', ''),
            "title": self.resume_data.get('title', ''),
            "contact": self.resume_data.get('contact', {}),
            "summary": self._generate_custom_summary(job_data, analysis),
            "skills": self._generate_custom_skills(analysis),
            "experience": self._customize_experience(job_data, analysis),
            "education": self.resume_data.get('education', []),
            "certifications": self.resume_data.get('certifications', []),
        }
        
        # Add relevant projects if available
        projects = self._select_relevant_projects(job_data, analysis)
        if projects:
            # Convert projects to experience format for display
            for project in projects:
                cv_data['experience'].append({
                    'title': project['name'],
                    'company': 'Personal Project',
                    'location': None,
                    'dates': '',
                    'bullets': project['description']
                })
        
        return cv_data
    
    def _generate_custom_summary(self, job_data: Dict, analysis: Dict) -> str:
        """Generate customized professional summary"""
        original_summary = self.resume_data.get('summary', '')
        job_title = job_data.get('title', '')
        matched_skills = analysis.get('skill_match', {}).get('matched', [])
        
        # Extract years of experience
        years_match = re.search(r'(\d+)\+?\s*years?', original_summary.lower())
        years = years_match.group(1) if years_match else '5+'
        
        # Determine expertise area from job title
        expertise = 'software development'
        job_lower = job_title.lower()
        if 'data' in job_lower:
            expertise = 'data science and analytics'
        elif 'devops' in job_lower or 'cloud' in job_lower:
            expertise = 'DevOps and cloud infrastructure'
        elif 'full stack' in job_lower or 'full-stack' in job_lower:
            expertise = 'full-stack development'
        elif 'backend' in job_lower or 'back-end' in job_lower:
            expertise = 'backend development'
        elif 'frontend' in job_lower or 'front-end' in job_lower:
            expertise = 'frontend development'
        elif 'security' in job_lower or 'cybersecurity' in job_lower:
            expertise = 'cybersecurity'
        
        # Build customized summary
        skill_text = ', '.join(matched_skills[:3]) if matched_skills else 'modern technologies'
        
        summary = (
            f"Results-driven professional with {years} years of experience in {expertise}. "
            f"Proven expertise in {skill_text} with a strong track record of delivering "
            f"high-quality solutions. Passionate about leveraging technology to solve complex "
            f"problems and drive business value through efficient, scalable applications."
        )
        
        return summary
    
    def _generate_custom_skills(self, analysis: Dict) -> Dict[str, List[str]]:
        """Generate skills dictionary prioritizing matched skills"""
        matched_skills = analysis.get('skill_match', {}).get('matched', [])
        all_skills = self.resume_data.get('skills', [])
        
        matched_set = set([s.lower() for s in matched_skills])
        
        # Categorize skills
        categorized = {
            'Languages': [],
            'Web Technologies': [],
            'Databases': [],
            'Cloud & DevOps': [],
            'Tools & Frameworks': [],
            'Other': []
        }
        
        # Common tech keywords
        lang_keywords = ['python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'php', 'go', 'kotlin', 'swift']
        web_keywords = ['react', 'angular', 'vue', 'node.js', 'django', 'flask', 'html', 'css', 'rest', 'graphql']
        db_keywords = ['mysql', 'postgresql', 'mongodb', 'redis', 'sql', 'nosql', 'dynamodb', 'elasticsearch']
        cloud_keywords = ['aws', 'azure', 'gcp', 'docker', 'kubernetes', 'ci/cd', 'jenkins', 'terraform', 'ansible']
        
        for skill in all_skills:
            skill_lower = skill.lower()
            
            if any(k in skill_lower for k in lang_keywords):
                categorized['Languages'].append(skill)
            elif any(k in skill_lower for k in web_keywords):
                categorized['Web Technologies'].append(skill)
            elif any(k in skill_lower for k in db_keywords):
                categorized['Databases'].append(skill)
            elif any(k in skill_lower for k in cloud_keywords):
                categorized['Cloud & DevOps'].append(skill)
            elif any(k in skill_lower for k in ['git', 'jira', 'agile', 'scrum', 'linux', 'unix']):
                categorized['Tools & Frameworks'].append(skill)
            else:
                categorized['Other'].append(skill)
        
        # Sort each category with matched skills first
        for category in categorized:
            categorized[category].sort(key=lambda s: (s.lower() not in matched_set, s))
        
        # Remove empty categories
        return {k: v for k, v in categorized.items() if v}
    
    def _customize_experience(self, job_data: Dict, analysis: Dict) -> List[Dict]:
        """Customize experience section prioritizing relevant achievements"""
        experiences = self.resume_data.get('experience', [])
        matched_skills = set([s.lower() for s in analysis.get('skill_match', {}).get('matched', [])])
        
        customized = []
        for exp in experiences:
            # Score and sort bullets by relevance
            def relevance_score(bullet):
                bullet_lower = bullet.lower()
                return sum(1 for skill in matched_skills if skill in bullet_lower)
            
            bullets = exp.get('bullets', [])
            bullets_sorted = sorted(bullets, key=relevance_score, reverse=True)
            
            # Take top 6 most relevant bullets
            customized.append({
                'title': exp['title'],
                'company': exp['company'],
                'location': exp.get('location'),
                'dates': exp['dates'],
                'bullets': bullets_sorted[:6]
            })
        
        return customized
    
    def _select_relevant_projects(self, job_data: Dict, analysis: Dict) -> List[Dict]:
        """Select most relevant projects based on job analysis"""
        projects = self.resume_data.get('projects', [])
        if not projects:
            return []
        
        matched_skills = set([s.lower() for s in analysis.get('skill_match', {}).get('matched', [])])
        
        # Score projects by relevance
        def project_relevance(proj):
            text = f"{proj['name']} {' '.join(proj['description'])} {proj.get('technologies', '')}".lower()
            return sum(1 for skill in matched_skills if skill in text)
        
        sorted_projects = sorted(projects, key=project_relevance, reverse=True)
        
        # Return top 2 most relevant
        return sorted_projects[:2]
    
    def save_resume(self, cv_data: Dict, job_data: Dict, 
                   output_dir: str = 'customized_resumes',
                   output_format: str = "both") -> List[str]:
        """
        Save customized resume using DocumentGenerator
        
        Args:
            cv_data: CV data dictionary
            job_data: Job information
            output_dir: Output directory
            output_format: "pdf", "docx", or "both"
            
        Returns:
            List of paths to saved files
        """
        # Create output directory
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Generate filename
        company = job_data.get('company', 'Unknown')
        title = job_data.get('title', 'Position')
        date = datetime.now().strftime('%Y%m%d')
        
        # Clean filename
        company_clean = re.sub(r'[^\w\s-]', '', company).strip().replace(' ', '_')[:30]
        title_clean = re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '_')[:40]
        
        base_filename = f"{output_dir}/resume_{company_clean}_{title_clean}_{date}"
        
        # Generate document
        generator = DocumentGenerator(output_format=output_format)
        saved_files = generator.generate(base_filename, cv_data)
        
        return saved_files
    
    def batch_create_resumes(self, jobs_with_analysis: List[Dict], 
                            min_score: float = 75.0, 
                            output_dir: str = 'customized_resumes',
                            output_format: str = "both") -> List[str]:
        """
        Create customized resumes for multiple jobs
        
        Args:
            jobs_with_analysis: List of jobs with analysis data
            min_score: Minimum match score to create resume (0-100)
            output_dir: Output directory
            output_format: "pdf", "docx", or "both"
            
        Returns:
            List of created file paths
        """
        created_files = []
        
        # Filter jobs by minimum score
        qualified_jobs = [
            job for job in jobs_with_analysis 
            if job.get('overall_match_score', 0) >= min_score
        ]
        
        print(f"\nCreating customized resumes for {len(qualified_jobs)} jobs (score >= {min_score}%)...")
        
        for i, job in enumerate(qualified_jobs, 1):
            try:
                job_data = {
                    'job_id': job.get('job_id', ''),
                    'title': job.get('title', ''),
                    'company': job.get('company', ''),
                    'place': job.get('place', ''),
                    'link': job.get('link', '')
                }
                
                # Create customized CV data
                cv_data = self.customize_for_job(job_data, job, output_format)
                
                # Save resume
                filepaths = self.save_resume(cv_data, job_data, output_dir, output_format)
                created_files.extend(filepaths)
                
                print(f"  [{i}/{len(qualified_jobs)}] Created: {', '.join([Path(f).name for f in filepaths])}")
                
            except Exception as e:
                print(f"  [{i}/{len(qualified_jobs)}] Error creating resume for {job_data.get('title', 'Unknown')}: {e}")
                continue
        
        return created_files

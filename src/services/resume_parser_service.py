"""
Resume parsing service for extracting structured information from resumes.
Supports TXT, PDF, and DOCX formats with NLP-based extraction.
"""
import re
from typing import List, Dict, Optional
from pathlib import Path
from dataclasses import dataclass
import structlog

# Try to import spacy, but make it optional
try:
    import spacy
    from spacy.language import Language
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    Language = None
    logger_temp = structlog.get_logger(__name__)
    logger_temp.warning("spacy_not_available", reason="NLP features will be limited")

logger = structlog.get_logger(__name__)


@dataclass
class ResumeData:
    """Structured resume data"""
    full_text: str
    skills: List[str]
    years_experience: int
    education: List[str]
    entities: Dict[str, List[str]]
    contact_info: Optional[Dict[str, str]] = None
    certifications: Optional[List[str]] = None


class ResumeParser:
    """
    Service for parsing and extracting structured information from resumes.
    Supports multiple file formats and uses NLP for intelligent extraction.
    """
    
    # Comprehensive skills database
    SKILL_PATTERNS = {
        # Programming Languages
        'python', 'java', 'javascript', 'typescript', 'c\\+\\+', 'c#', 'csharp',
        'ruby', 'php', 'go', 'golang', 'rust', 'kotlin', 'swift', 'r', 'matlab',
        'scala', 'perl', 'shell', 'bash', 'powershell',
        
        # Web Technologies
        'html', 'css', 'react', 'reactjs', 'angular', 'vue', 'vuejs', 'node.js',
        'nodejs', 'express', 'expressjs', 'django', 'flask', 'fastapi', 'spring',
        'spring boot', 'asp.net', 'dotnet', '.net', 'jquery', 'bootstrap',
        'tailwind', 'sass', 'less', 'webpack', 'vite',
        
        # Databases
        'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'cassandra',
        'oracle', 'sqlite', 'dynamodb', 'elasticsearch', 'mariadb', 'mssql',
        'nosql', 'firebase', 'supabase',
        
        # Cloud & DevOps
        'aws', 'amazon web services', 'azure', 'microsoft azure', 'gcp',
        'google cloud', 'docker', 'kubernetes', 'k8s', 'jenkins', 'ci/cd',
        'terraform', 'ansible', 'git', 'github', 'gitlab', 'bitbucket',
        'circleci', 'travis ci', 'github actions', 'helm', 'vagrant',
        
        # Data Science & ML
        'machine learning', 'deep learning', 'artificial intelligence', 'ai',
        'tensorflow', 'pytorch', 'keras', 'scikit-learn', 'sklearn', 'pandas',
        'numpy', 'data analysis', 'statistics', 'nlp', 'natural language processing',
        'computer vision', 'neural networks', 'data science', 'big data',
        'spark', 'hadoop', 'jupyter', 'matplotlib', 'seaborn', 'plotly',
        
        # Tools & Frameworks
        'jira', 'confluence', 'agile', 'scrum', 'kanban', 'rest api', 'restful',
        'graphql', 'microservices', 'linux', 'unix', 'windows', 'macos',
        'visual studio', 'vscode', 'intellij', 'pycharm', 'vim', 'emacs',
        
        # Testing
        'unit testing', 'integration testing', 'pytest', 'jest', 'mocha',
        'selenium', 'cypress', 'junit', 'testng', 'tdd', 'bdd',
        
        # Mobile
        'android', 'ios', 'react native', 'flutter', 'swift', 'kotlin',
        'mobile development', 'xamarin',
        
        # Other Technical
        'api', 'oauth', 'jwt', 'websockets', 'grpc', 'rabbitmq', 'kafka',
        'nginx', 'apache', 'load balancing', 'caching', 'cdn', 'security',
        'encryption', 'ssl', 'tls', 'blockchain', 'solidity', 'web3',
        
        # Soft Skills
        'leadership', 'communication', 'teamwork', 'problem solving',
        'project management', 'analytical', 'critical thinking', 'mentoring',
        'collaboration', 'time management', 'adaptability'
    }
    
    def __init__(self, spacy_model: str = 'en_core_web_md'):
        """
        Initialize the resume parser.
        
        Args:
            spacy_model: spaCy model to use for NLP processing
        """
        logger.info("initializing_resume_parser", model=spacy_model)
        
        # Load spaCy model if available
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load(spacy_model)
                logger.info("spacy_model_loaded", model=spacy_model)
            except OSError:
                logger.warning("spacy_model_not_found", model=spacy_model)
                logger.info("downloading_spacy_model")
                import subprocess
                subprocess.run(['python', '-m', 'spacy', 'download', spacy_model])
                self.nlp = spacy.load(spacy_model)
        else:
            self.nlp = None
            logger.warning("spacy_not_available", message="NLP features disabled")
    
    def parse_from_file(self, file_path: str) -> ResumeData:
        """
        Parse resume from a file.
        
        Args:
            file_path: Path to resume file (TXT, PDF, or DOCX)
            
        Returns:
            ResumeData object with extracted information
        """
        logger.info("parsing_resume_from_file", path=file_path)
        
        # Load file content
        text = self._load_resume_file(file_path)
        
        # Parse the content
        return self.parse_from_text(text)
    
    def parse_from_text(self, text: str) -> ResumeData:
        """
        Parse resume from text.
        
        Args:
            text: Resume text content
            
        Returns:
            ResumeData object with extracted information
        """
        logger.info("parsing_resume_from_text", length=len(text))
        
        if not text or not text.strip():
            logger.warning("empty_resume_text")
            return self._empty_resume_data()
        
        # Process with spaCy if available
        if self.nlp:
            doc = self.nlp(text)
            entities = self._extract_entities(doc)
            education = self._extract_education(doc)
        else:
            doc = None
            entities = {}
            education = []
        
        # Extract all information
        skills = self._extract_skills(text)
        years_exp = self._extract_years_experience(text)
        contact_info = self._extract_contact_info(text)
        certifications = self._extract_certifications(text)
        
        logger.info(
            "resume_parsed",
            skills_count=len(skills),
            years_experience=years_exp,
            education_count=len(education),
            has_contact=contact_info is not None
        )
        
        return ResumeData(
            full_text=text,
            skills=skills,
            years_experience=years_exp,
            education=education,
            entities=entities,
            contact_info=contact_info,
            certifications=certifications
        )
    
    def _load_resume_file(self, file_path: str) -> str:
        """
        Load resume from file (supports TXT, PDF, DOCX).
        
        Args:
            file_path: Path to resume file
            
        Returns:
            Resume text content
        """
        try:
            path = Path(file_path)
            if not path.exists():
                raise FileNotFoundError(f"Resume file not found: {file_path}")
            
            file_ext = path.suffix.lower()
            
            # Handle PDF files
            if file_ext == '.pdf':
                return self._load_pdf(path)
            
            # Handle DOCX files
            elif file_ext in ['.docx', '.doc']:
                return self._load_docx(path)
            
            # Handle text files
            else:
                return self._load_text(path)
                
        except Exception as e:
            logger.error("resume_load_failed", path=file_path, error=str(e))
            raise
    
    def _load_pdf(self, path: Path) -> str:
        """Load content from PDF file"""
        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(str(path))
            content = ""
            for page in reader.pages:
                content += page.extract_text() + "\n"
            logger.info("pdf_resume_loaded", path=str(path), size=len(content))
            return content
        except ImportError:
            logger.error("pypdf2_not_installed")
            raise ImportError("PyPDF2 is required for PDF parsing. Install with: pip install PyPDF2")
        except Exception as e:
            logger.error("pdf_load_failed", path=str(path), error=str(e))
            raise ValueError(f"Failed to read PDF: {e}")
    
    def _load_docx(self, path: Path) -> str:
        """Load content from DOCX file"""
        try:
            from docx import Document
            doc = Document(str(path))
            content = "\n".join([para.text for para in doc.paragraphs])
            logger.info("docx_resume_loaded", path=str(path), size=len(content))
            return content
        except ImportError:
            logger.error("python_docx_not_installed")
            raise ImportError("python-docx is required for DOCX parsing. Install with: pip install python-docx")
        except Exception as e:
            logger.error("docx_load_failed", path=str(path), error=str(e))
            raise ValueError(f"Failed to read DOCX: {e}")
    
    def _load_text(self, path: Path) -> str:
        """Load content from text file"""
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
        logger.info("text_resume_loaded", path=str(path), size=len(content))
        return content
    
    def _extract_entities(self, doc: Language) -> Dict[str, List[str]]:
        """
        Extract named entities from resume.
        
        Args:
            doc: spaCy Doc object
            
        Returns:
            Dictionary of entity types to entity lists
        """
        entities = {
            'PERSON': [],
            'ORG': [],
            'GPE': [],
            'DATE': []
        }
        
        for ent in doc.ents:
            if ent.label_ in entities:
                entities[ent.label_].append(ent.text)
        
        return entities
    
    def _extract_skills(self, text: str) -> List[str]:
        """
        Extract technical skills from text.
        
        Args:
            text: Resume text
            
        Returns:
            List of found skills
        """
        text_lower = text.lower()
        found_skills = []
        
        for skill in self.SKILL_PATTERNS:
            # Escape regex special characters except those we want
            pattern = r'\b' + skill.replace('+', r'\+') + r'\b'
            if re.search(pattern, text_lower, re.IGNORECASE):
                # Clean up the skill name
                clean_skill = skill.replace('\\+\\+', '++').replace('\\', '')
                if clean_skill not in found_skills:
                    found_skills.append(clean_skill)
        
        return sorted(found_skills)
    
    def _extract_years_experience(self, text: str) -> int:
        """
        Extract years of experience from text.
        
        Args:
            text: Resume text
            
        Returns:
            Maximum years of experience found
        """
        patterns = [
            r'(\d+)\+?\s*years?\s+(?:of\s+)?experience',
            r'experience\s+(?:of\s+)?(\d+)\+?\s*years?',
            r'(\d+)\+?\s*yrs?\s+(?:of\s+)?experience',
            r'(\d+)\+?\s*years?\s+(?:in|with)',
        ]
        
        years = []
        text_lower = text.lower()
        
        for pattern in patterns:
            matches = re.findall(pattern, text_lower)
            years.extend([int(y) for y in matches])
        
        result = max(years) if years else 0
        return result
    
    def _extract_education(self, doc: Language) -> List[str]:
        """
        Extract education information from resume.
        
        Args:
            doc: spaCy Doc object
            
        Returns:
            List of education entries
        """
        education_keywords = [
            'bachelor', 'master', 'phd', 'doctorate', 'associate',
            'b.s.', 'b.a.', 'm.s.', 'm.a.', 'mba', 'degree',
            'university', 'college', 'institute'
        ]
        
        education = []
        
        for sent in doc.sents:
            sent_lower = sent.text.lower()
            if any(keyword in sent_lower for keyword in education_keywords):
                education.append(sent.text.strip())
        
        return education[:5]  # Limit to 5 entries
    
    def _extract_contact_info(self, text: str) -> Optional[Dict[str, str]]:
        """
        Extract contact information (email, phone, LinkedIn).
        
        Args:
            text: Resume text
            
        Returns:
            Dictionary with contact information or None
        """
        contact_info = {}
        
        # Email pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        if emails:
            contact_info['email'] = emails[0]
        
        # Phone pattern (US/International)
        phone_pattern = r'(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
        phones = re.findall(phone_pattern, text)
        if phones:
            contact_info['phone'] = phones[0]
        
        # LinkedIn pattern
        linkedin_pattern = r'(?:linkedin\.com/in/|linkedin\.com/profile/)([A-Za-z0-9-]+)'
        linkedin = re.search(linkedin_pattern, text, re.IGNORECASE)
        if linkedin:
            contact_info['linkedin'] = f"linkedin.com/in/{linkedin.group(1)}"
        
        return contact_info if contact_info else None
    
    def _extract_certifications(self, text: str) -> List[str]:
        """
        Extract certifications from resume.
        
        Args:
            text: Resume text
            
        Returns:
            List of certifications found
        """
        cert_keywords = [
            'certified', 'certification', 'certificate',
            'aws certified', 'microsoft certified', 'cisco',
            'pmp', 'comptia', 'ceh', 'cissp', 'cisa', 'cism',
            'cka', 'ckad', 'gcp certified', 'azure certified'
        ]
        
        certifications = []
        text_lower = text.lower()
        
        # Split into lines to get context
        lines = text.split('\n')
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in cert_keywords):
                certifications.append(line.strip())
        
        return certifications[:10]  # Limit to 10 certifications
    
    def _empty_resume_data(self) -> ResumeData:
        """Return empty ResumeData object"""
        return ResumeData(
            full_text="",
            skills=[],
            years_experience=0,
            education=[],
            entities={},
            contact_info=None,
            certifications=None
        )
    
    def add_custom_skills(self, skills: List[str]):
        """
        Add custom skills to the skill patterns.
        
        Args:
            skills: List of skill names to add
        """
        for skill in skills:
            skill_lower = skill.lower()
            if skill_lower not in self.SKILL_PATTERNS:
                self.SKILL_PATTERNS.add(skill_lower)
                logger.info("custom_skill_added", skill=skill)
    
    def get_summary(self, resume_data: ResumeData) -> Dict[str, any]:
        """
        Get a summary of parsed resume data.
        
        Args:
            resume_data: Parsed resume data
            
        Returns:
            Dictionary with summary statistics
        """
        return {
            'total_length': len(resume_data.full_text),
            'skills_count': len(resume_data.skills),
            'top_skills': resume_data.skills[:10],
            'years_experience': resume_data.years_experience,
            'education_count': len(resume_data.education),
            'has_contact_info': resume_data.contact_info is not None,
            'certifications_count': len(resume_data.certifications) if resume_data.certifications else 0,
            'entities_found': {k: len(v) for k, v in resume_data.entities.items()}
        }

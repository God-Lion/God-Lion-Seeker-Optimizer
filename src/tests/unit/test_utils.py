"""Unit tests for utils module"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch, mock_open
from datetime import datetime


class TestDocumentGenerator:
    """Test DocumentGenerator"""
    
    @pytest.fixture
    def doc_generator(self):
        """Create DocumentGenerator instance"""
        from utils.document_generator import DocumentGenerator
        return DocumentGenerator()
    
    def test_generator_initialization(self, doc_generator):
        """Test document generator initialization"""
        assert doc_generator is not None
    
    def test_generate_pdf(self, doc_generator):
        """Test generating PDF document"""
        content = "Test content for PDF"
        
        with patch("builtins.open", mock_open()):
            result = doc_generator.generate_pdf(content, "test.pdf")
            assert result is not None
    
    def test_generate_docx(self, doc_generator):
        """Test generating DOCX document"""
        content = "Test content for DOCX"
        
        with patch("docx.Document") as mock_doc:
            result = doc_generator.generate_docx(content, "test.docx")
            assert result is not None
    
    def test_generate_cover_letter(self, doc_generator):
        """Test generating cover letter"""
        data = {
            "name": "John Doe",
            "company": "Tech Corp",
            "position": "Python Developer"
        }
        
        cover_letter = doc_generator.generate_cover_letter(data)
        
        assert isinstance(cover_letter, str)
        assert "John Doe" in cover_letter
        assert "Tech Corp" in cover_letter
    
    def test_format_resume_section(self, doc_generator):
        """Test formatting resume section"""
        section_data = {
            "title": "Experience",
            "items": [
                "Software Engineer at Tech Corp",
                "Built web applications"
            ]
        }
        
        formatted = doc_generator.format_resume_section(section_data)
        
        assert isinstance(formatted, str)
        assert "Experience" in formatted


class TestResumeCustomizer:
    """Test ResumeCustomizer"""
    
    @pytest.fixture
    def customizer(self):
        """Create ResumeCustomizer instance"""
        from utils.resume_customizer import ResumeCustomizer
        return ResumeCustomizer()
    
    def test_customizer_initialization(self, customizer):
        """Test customizer initialization"""
        assert customizer is not None
    
    @pytest.mark.asyncio
    async def test_customize_resume(self, customizer):
        """Test customizing resume for job"""
        resume_text = """
        John Doe
        Software Engineer
        
        Skills: Python, JavaScript, Docker, AWS
        
        Experience:
        - Built web applications
        - Deployed to cloud
        """
        
        job_description = "Looking for Python developer with Docker experience"
        
        customized = await customizer.customize_resume(resume_text, job_description)
        
        assert isinstance(customized, str)
        assert len(customized) > 0
    
    def test_extract_keywords(self, customizer):
        """Test extracting keywords from job description"""
        job_description = "Looking for Python developer with Django and Docker experience"
        
        keywords = customizer.extract_keywords(job_description)
        
        assert isinstance(keywords, list)
        assert len(keywords) > 0
    
    def test_highlight_relevant_skills(self, customizer):
        """Test highlighting relevant skills"""
        resume_text = "Skills: Python, JavaScript, Java, Docker"
        job_keywords = ["Python", "Docker", "Kubernetes"]
        
        highlighted = customizer.highlight_relevant_skills(resume_text, job_keywords)
        
        assert isinstance(highlighted, str)
    
    def test_reorder_sections(self, customizer):
        """Test reordering resume sections"""
        sections = {
            "experience": "Work experience content",
            "education": "Education content",
            "skills": "Skills content"
        }
        
        priority = ["skills", "experience", "education"]
        
        reordered = customizer.reorder_sections(sections, priority)
        
        assert isinstance(reordered, dict)
    
    def test_tailor_summary(self, customizer):
        """Test tailoring professional summary"""
        summary = "Experienced software engineer with Python and JavaScript"
        job_keywords = ["Python", "Django", "REST API"]
        
        tailored = customizer.tailor_summary(summary, job_keywords)
        
        assert isinstance(tailored, str)


class TestResumeAdapter:
    """Test ResumeAdapter"""
    
    @pytest.fixture
    def adapter(self):
        """Create ResumeAdapter instance"""
        from utils.resume_adapter import ResumeAdapter
        return ResumeAdapter()
    
    def test_adapter_initialization(self, adapter):
        """Test adapter initialization"""
        assert adapter is not None
    
    def test_parse_resume_text(self, adapter):
        """Test parsing resume text"""
        resume_text = """
        John Doe
        john@email.com
        (555) 123-4567
        
        EXPERIENCE
        Software Engineer at Tech Corp
        - Built web applications
        
        EDUCATION
        BS Computer Science
        
        SKILLS
        Python, Django, Docker
        """
        
        parsed = adapter.parse_resume(resume_text)
        
        assert isinstance(parsed, dict)
        assert "contact" in parsed or "sections" in parsed
    
    def test_extract_contact_info(self, adapter):
        """Test extracting contact information"""
        resume_text = """
        John Doe
        john.doe@email.com
        (555) 123-4567
        linkedin.com/in/johndoe
        """
        
        contact = adapter.extract_contact_info(resume_text)
        
        assert isinstance(contact, dict)
    
    def test_extract_skills(self, adapter):
        """Test extracting skills from resume"""
        resume_text = """
        SKILLS
        Python, Django, Flask, Docker, Kubernetes, AWS, PostgreSQL
        """
        
        skills = adapter.extract_skills(resume_text)
        
        assert isinstance(skills, list)
        assert len(skills) > 0
    
    def test_extract_experience(self, adapter):
        """Test extracting experience section"""
        resume_text = """
        EXPERIENCE
        Senior Software Engineer at Tech Corp (2020-2024)
        - Built scalable web applications
        - Led team of 5 developers
        
        Software Engineer at StartUp Inc (2018-2020)
        - Developed REST APIs
        """
        
        experience = adapter.extract_experience(resume_text)
        
        assert isinstance(experience, list)
    
    def test_extract_education(self, adapter):
        """Test extracting education section"""
        resume_text = """
        EDUCATION
        Master of Science in Computer Science
        University of Technology, 2018
        
        Bachelor of Science in Computer Science
        State University, 2016
        """
        
        education = adapter.extract_education(resume_text)
        
        assert isinstance(education, list)
    
    def test_format_for_ats(self, adapter):
        """Test formatting resume for ATS"""
        resume_data = {
            "name": "John Doe",
            "email": "john@email.com",
            "skills": ["Python", "Django"],
            "experience": ["Software Engineer at Tech Corp"]
        }
        
        ats_formatted = adapter.format_for_ats(resume_data)
        
        assert isinstance(ats_formatted, str)
        assert "John Doe" in ats_formatted


class TestResumeParser:
    """Test ResumeParserService"""
    
    @pytest.fixture
    def parser(self):
        """Create ResumeParserService instance"""
        from services.resume_parser_service import ResumeParserService
        return ResumeParserService()
    
    def test_parser_initialization(self, parser):
        """Test parser initialization"""
        assert parser is not None
    
    @pytest.mark.asyncio
    async def test_parse_pdf_resume(self, parser):
        """Test parsing PDF resume"""
        with patch("builtins.open", mock_open(read_data=b"PDF content")):
            with patch("PyPDF2.PdfReader") as mock_pdf:
                mock_page = MagicMock()
                mock_page.extract_text.return_value = "John Doe\nPython Developer"
                mock_pdf.return_value.pages = [mock_page]
                
                content = await parser.parse_pdf("test_resume.pdf")
                
                assert isinstance(content, str)
    
    @pytest.mark.asyncio
    async def test_parse_docx_resume(self, parser):
        """Test parsing DOCX resume"""
        with patch("docx.Document") as mock_doc:
            mock_para = MagicMock()
            mock_para.text = "John Doe"
            mock_doc.return_value.paragraphs = [mock_para]
            
            content = await parser.parse_docx("test_resume.docx")
            
            assert isinstance(content, str)
    
    def test_extract_email(self, parser):
        """Test extracting email from text"""
        text = "Contact me at john.doe@email.com for more info"
        
        email = parser.extract_email(text)
        
        assert email == "john.doe@email.com" or "@" in email
    
    def test_extract_phone(self, parser):
        """Test extracting phone number from text"""
        text = "Call me at (555) 123-4567"
        
        phone = parser.extract_phone(text)
        
        assert phone is not None
    
    def test_extract_urls(self, parser):
        """Test extracting URLs from text"""
        text = "Portfolio: https://johndoe.com LinkedIn: linkedin.com/in/johndoe"
        
        urls = parser.extract_urls(text)
        
        assert isinstance(urls, list)
        assert len(urls) > 0


class TestMultiPlatformStorageService:
    """Test MultiPlatformStorageService"""
    
    @pytest.fixture
    def storage_service(self):
        """Create MultiPlatformStorageService instance"""
        from services.multi_platform_storage_service import MultiPlatformStorageService
        return MultiPlatformStorageService()
    
    def test_service_initialization(self, storage_service):
        """Test service initialization"""
        assert storage_service is not None
    
    @pytest.mark.asyncio
    async def test_save_file(self, storage_service):
        """Test saving file"""
        content = b"Test file content"
        filename = "test.txt"
        
        with patch("builtins.open", mock_open()):
            result = await storage_service.save_file(filename, content)
            assert result is not None
    
    @pytest.mark.asyncio
    async def test_load_file(self, storage_service):
        """Test loading file"""
        with patch("builtins.open", mock_open(read_data=b"Test content")):
            content = await storage_service.load_file("test.txt")
            assert content is not None
    
    @pytest.mark.asyncio
    async def test_delete_file(self, storage_service):
        """Test deleting file"""
        with patch("os.remove"):
            result = await storage_service.delete_file("test.txt")
            assert result is not None
    
    @pytest.mark.asyncio
    async def test_list_files(self, storage_service):
        """Test listing files"""
        with patch("os.listdir", return_value=["file1.txt", "file2.txt"]):
            files = await storage_service.list_files()
            assert isinstance(files, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

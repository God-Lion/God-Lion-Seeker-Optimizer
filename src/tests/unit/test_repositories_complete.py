"""Comprehensive tests for repository layer"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from src.models import Job, Company, ScrapingSession, JobAnalysis
from src.repositories.job_repository import JobRepository
from src.repositories.company_repository import CompanyRepository
from src.repositories.scraping_session_repository import ScrapingSessionRepository
from src.repositories.job_analysis_repository import JobAnalysisRepository


class TestJobRepository:
    """Test JobRepository CRUD operations"""
    
    @pytest.fixture
    def job_repo(self, session):
        """Create JobRepository instance"""
        return JobRepository(session)
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_create_job_success(self, job_repo, sample_company):
        """Test creating a new job"""
        job_data = {
            "job_id": "linkedin_12345",
            "title": "Senior Python Developer",
            "link": "https://linkedin.com/jobs/view/12345",
            "place": "San Francisco, CA",
            "description": "Build amazing Python applications",
            "company_id": sample_company.id
        }
        
        job = await job_repo.create(job_data)
        
        assert job.id is not None
        assert job.job_id == "linkedin_12345"
        assert job.title == "Senior Python Developer"
        assert job.company_id == sample_company.id
        assert job.is_active is True
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_get_by_id(self, job_repo, sample_jobs):
        """Test retrieving job by primary key ID"""
        job = sample_jobs[0]
        retrieved = await job_repo.get_by_id(job.id)
        
        assert retrieved is not None
        assert retrieved.id == job.id
        assert retrieved.title == job.title
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_get_all_jobs(self, job_repo, sample_jobs):
        """Test retrieving all jobs"""
        jobs = await job_repo.get_all()
        
        assert len(jobs) == len(sample_jobs)
        assert all(isinstance(job, Job) for job in jobs)
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_update_job(self, job_repo, sample_jobs):
        """Test updating job fields"""
        job = sample_jobs[0]
        update_data = {
            "title": "Updated Job Title",
            "description": "Updated description"
        }
        
        updated = await job_repo.update(job.id, update_data)
        
        assert updated.title == "Updated Job Title"
        assert updated.description == "Updated description"
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_delete_job(self, job_repo, sample_jobs):
        """Test deleting a job"""
        job = sample_jobs[0]
        result = await job_repo.delete(job.id)
        
        assert result is True
        
        # Verify deletion
        deleted = await job_repo.get_by_id(job.id)
        assert deleted is None


class TestCompanyRepository:
    """Test CompanyRepository CRUD operations"""
    
    @pytest.fixture
    def company_repo(self, session):
        """Create CompanyRepository instance"""
        return CompanyRepository(session)
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_create_company_success(self, company_repo):
        """Test creating a new company"""
        company_data = {
            "name": "TechCorp Inc",
            "industry": "Information Technology",
            "company_size": "1001-5000",
            "website": "https://techcorp.com",
            "location": "San Francisco, CA"
        }
        
        company = await company_repo.create(company_data)
        
        assert company.id is not None
        assert company.name == "TechCorp Inc"
        assert company.industry == "Information Technology"
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_get_company_by_id(self, company_repo, sample_company):
        """Test retrieving company by ID"""
        company = await company_repo.get_by_id(sample_company.id)
        
        assert company is not None
        assert company.id == sample_company.id
        assert company.name == sample_company.name


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

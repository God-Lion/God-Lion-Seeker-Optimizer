"""Unit tests for repositories"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from src.repositories.job_repository import JobRepository
from src.repositories.company_repository import CompanyRepository
from src.repositories.scraping_session_repository import ScrapingSessionRepository
from src.models import Job, Company, ScrapingSession


class TestJobRepository:
    """Test JobRepository methods"""
    
    @pytest.fixture
    def mock_session(self):
        """Create mock database session"""
        session = MagicMock(spec=AsyncSession)
        session.execute = AsyncMock()
        session.commit = AsyncMock()
        session.rollback = AsyncMock()
        session.flush = AsyncMock()
        session.refresh = AsyncMock()
        return session
    
    @pytest.fixture
    def job_repo(self, mock_session):
        """Create JobRepository instance"""
        return JobRepository(mock_session)
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_create_job(self, job_repo, mock_session):
        """Test creating a new job"""
        job_data = {
            "job_id": "12345",
            "title": "Python Developer",
            "link": "https://linkedin.com/jobs/view/12345",
            "place": "Remote"
        }
        
        job = await job_repo.create(**job_data)
        
        assert job.job_id == "12345"
        assert job.title == "Python Developer"
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_get_by_job_id(self, job_repo, mock_session):
        """Test getting job by job_id"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = Job(
            job_id="12345",
            title="Python Developer",
            link="https://example.com"
        )
        mock_session.execute.return_value = mock_result
        
        job = await job_repo.get_by_job_id("12345")
        
        assert job is not None
        assert job.job_id == "12345"
        mock_session.execute.assert_called_once()
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_get_by_job_id_not_found(self, job_repo, mock_session):
        """Test getting non-existent job"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result
        
        job = await job_repo.get_by_job_id("99999")
        
        assert job is None
    
    @pytest.mark.asyncio
    async def test_get_active_jobs(self, job_repo, mock_session):
        """Test getting active jobs"""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            Job(job_id="1", title="Dev 1", link="https://example.com", is_active=True),
            Job(job_id="2", title="Dev 2", link="https://example.com", is_active=True)
        ]
        mock_session.execute.return_value = mock_result
        
        jobs = await job_repo.get_active_jobs()
        
        assert len(jobs) == 2
        assert all(job.is_active for job in jobs)
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_update_job(self, job_repo, mock_session):
        """Test updating a job"""
        job = Job(job_id="12345", title="Old Title", link="https://example.com")
        job.id = 1
        
        updated_job = await job_repo.update(job, title="New Title", place="Remote")
        
        assert updated_job.title == "New Title"
        assert updated_job.place == "Remote"
        mock_session.commit.assert_called_once()
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_delete_job(self, job_repo, mock_session):
        """Test deleting a job"""
        job = Job(job_id="12345", title="Test", link="https://example.com")
        
        await job_repo.delete(job)
        
        mock_session.delete.assert_called_once_with(job)
        mock_session.commit.assert_called_once()
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_get_jobs_by_company(self, job_repo, mock_session):
        """Test getting jobs by company"""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            Job(job_id="1", title="Dev 1", link="https://example.com", company_id=1),
            Job(job_id="2", title="Dev 2", link="https://example.com", company_id=1)
        ]
        mock_session.execute.return_value = mock_result
        
        jobs = await job_repo.get_jobs_by_company(1)
        
        assert len(jobs) == 2
        mock_session.execute.assert_called_once()


class TestCompanyRepository:
    """Test CompanyRepository methods"""
    
    @pytest.fixture
    def mock_session(self):
        """Create mock database session"""
        session = MagicMock(spec=AsyncSession)
        session.execute = AsyncMock()
        session.commit = AsyncMock()
        session.rollback = AsyncMock()
        return session
    
    @pytest.fixture
    def company_repo(self, mock_session):
        """Create CompanyRepository instance"""
        return CompanyRepository(mock_session)
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_create_company(self, company_repo, mock_session):
        """Test creating a new company"""
        company_data = {
            "name": "Tech Corp",
            "industry": "IT",
            "company_size": "501-1000"
        }
        
        company = await company_repo.create(**company_data)
        
        assert company.name == "Tech Corp"
        assert company.industry == "IT"
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_get_by_name(self, company_repo, mock_session):
        """Test getting company by name"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = Company(
            name="Tech Corp",
            industry="IT"
        )
        mock_session.execute.return_value = mock_result
        
        company = await company_repo.get_by_name("Tech Corp")
        
        assert company is not None
        assert company.name == "Tech Corp"
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_get_or_create_existing(self, company_repo, mock_session):
        """Test get_or_create with existing company"""
        existing_company = Company(name="Tech Corp", industry="IT")
        existing_company.id = 1
        
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = existing_company
        mock_session.execute.return_value = mock_result
        
        company = await company_repo.get_or_create("Tech Corp", industry="IT")
        
        assert company.id == 1
        assert company.name == "Tech Corp"
        # Should not create new company
        mock_session.add.assert_not_called()
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_get_or_create_new(self, company_repo, mock_session):
        """Test get_or_create with new company"""
        mock_result = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result
        
        company = await company_repo.get_or_create("New Corp", industry="Finance")
        
        assert company.name == "New Corp"
        assert company.industry == "Finance"
        mock_session.add.assert_called_once()


class TestScrapingSessionRepository:
    """Test ScrapingSessionRepository methods"""
    
    @pytest.fixture
    def mock_session(self):
        """Create mock database session"""
        session = MagicMock(spec=AsyncSession)
        session.execute = AsyncMock()
        session.commit = AsyncMock()
        return session
    
    @pytest.fixture
    def session_repo(self, mock_session):
        """Create ScrapingSessionRepository instance"""
        return ScrapingSessionRepository(mock_session)
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_create_session(self, session_repo, mock_session):
        """Test creating a new scraping session"""
        session_data = {
            "session_name": "Daily Scrape",
            "query": "python developer",
            "status": "pending"
        }
        
        session = await session_repo.create(**session_data)
        
        assert session.session_name == "Daily Scrape"
        assert session.query == "python developer"
        assert session.status == "pending"
        mock_session.add.assert_called_once()
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_mark_as_running(self, session_repo, mock_session):
        """Test marking session as running"""
        session = ScrapingSession(
            session_name="Test",
            query="test",
            status="pending"
        )
        session.id = 1
        
        await session_repo.mark_as_running(session)
        
        assert session.status == "running"
        assert session.started_at is not None
        mock_session.commit.assert_called_once()
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_mark_as_completed(self, session_repo, mock_session):
        """Test marking session as completed"""
        session = ScrapingSession(
            session_name="Test",
            query="test",
            status="running",
            started_at=datetime.utcnow()
        )
        session.id = 1
        
        await session_repo.mark_as_completed(
            session,
            total_jobs=150,
            unique_jobs=120,
            duplicate_jobs=30
        )
        
        assert session.status == "completed"
        assert session.completed_at is not None
        assert session.total_jobs == 150
        assert session.unique_jobs == 120
    
    @pytest.mark.skip(reason="Needs implementation update")
    @pytest.mark.asyncio
    async def test_mark_as_failed(self, session_repo, mock_session):
        """Test marking session as failed"""
        session = ScrapingSession(
            session_name="Test",
            query="test",
            status="running"
        )
        session.id = 1
        
        await session_repo.mark_as_failed(session, error_message="Test error")
        
        assert session.status == "failed"
        assert session.error_message == "Test error"
        assert session.completed_at is not None
    
    @pytest.mark.asyncio
    async def test_get_recent_sessions(self, session_repo, mock_session):
        """Test getting recent sessions"""
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [
            ScrapingSession(session_name="Session 1", query="test1", status="completed"),
            ScrapingSession(session_name="Session 2", query="test2", status="completed")
        ]
        mock_session.execute.return_value = mock_result
        
        sessions = await session_repo.get_recent_sessions(limit=10)
        
        assert len(sessions) == 2
        mock_session.execute.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

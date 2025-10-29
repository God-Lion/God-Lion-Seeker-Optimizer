"""Unit tests for SQLAlchemy models"""
import pytest
from datetime import datetime
from src.models import Job, Company, ScrapingSession, Base


class TestJobModel:
    """Test Job model creation and validation"""
    
    def test_job_creation_minimal(self):
        """Test creating job with minimal required fields"""
        job = Job(
            job_id="12345",
            title="Python Developer",
            link="https://linkedin.com/jobs/view/12345"
        )
        
        assert job.job_id == "12345"
        assert job.title == "Python Developer"
        assert job.link == "https://linkedin.com/jobs/view/12345"
        assert job.is_active is True
        assert job.created_at is None  # Not set until persisted
    
    def test_job_creation_full(self):
        """Test creating job with all fields"""
        job = Job(
            job_id="12345",
            title="Python Developer",
            link="https://linkedin.com/jobs/view/12345",
            apply_link="https://linkedin.com/jobs/apply/12345",
            place="San Francisco, CA",
            description="Build amazing Python applications",
            date="2024-01-15",
            is_active=True,
            match_score=0.85
        )
        
        assert job.job_id == "12345"
        assert job.place == "San Francisco, CA"
        assert job.match_score == 0.85
        assert job.is_active is True
    
    def test_job_repr(self):
        """Test Job string representation"""
        job = Job(
            job_id="12345",
            title="Python Developer",
            link="https://example.com"
        )
        job.id = 1
        
        repr_str = repr(job)
        assert "Job" in repr_str
        assert "id=1" in repr_str
        assert "Python Developer" in repr_str
    
    def test_job_str(self):
        """Test Job string conversion"""
        job = Job(
            job_id="12345",
            title="Python Developer",
            link="https://example.com",
            place="Remote"
        )
        
        str_repr = str(job)
        assert "Python Developer" in str_repr
        assert "Remote" in str_repr


class TestCompanyModel:
    """Test Company model creation and validation"""
    
    def test_company_creation_minimal(self):
        """Test creating company with minimal required fields"""
        company = Company(name="Tech Corp")
        
        assert company.name == "Tech Corp"
        assert company.industry is None
        assert company.jobs == []
    
    def test_company_creation_full(self):
        """Test creating company with all fields"""
        company = Company(
            name="Tech Corp",
            industry="Information Technology",
            company_size="501-1000",
            website="https://techcorp.com",
            location="San Francisco, CA",
            description="Leading tech company"
        )
        
        assert company.name == "Tech Corp"
        assert company.industry == "Information Technology"
        assert company.company_size == "501-1000"
        assert company.website == "https://techcorp.com"
    
    def test_company_repr(self):
        """Test Company string representation"""
        company = Company(
            name="Tech Corp",
            industry="IT"
        )
        company.id = 1
        
        repr_str = repr(company)
        assert "Company" in repr_str
        assert "id=1" in repr_str
        assert "Tech Corp" in repr_str


class TestScrapingSessionModel:
    """Test ScrapingSession model creation and validation"""
    
    def test_session_creation_minimal(self):
        """Test creating session with minimal required fields"""
        session = ScrapingSession(
            session_name="Daily Scrape",
            query="python developer",
            status="pending"
        )
        
        assert session.session_name == "Daily Scrape"
        assert session.query == "python developer"
        assert session.status == "pending"
        assert session.total_jobs == 0
        assert session.unique_jobs == 0
    
    def test_session_creation_full(self):
        """Test creating session with all fields"""
        now = datetime.utcnow()
        session = ScrapingSession(
            session_name="Daily Scrape",
            query="python developer",
            status="completed",
            total_jobs=150,
            unique_jobs=120,
            duplicate_jobs=30,
            error_count=0,
            started_at=now,
            completed_at=now
        )
        
        assert session.total_jobs == 150
        assert session.unique_jobs == 120
        assert session.status == "completed"
    
    def test_session_is_running_property(self):
        """Test is_running property"""
        running_session = ScrapingSession(
            session_name="Test",
            query="test",
            status="running"
        )
        pending_session = ScrapingSession(
            session_name="Test",
            query="test",
            status="pending"
        )
        
        assert running_session.is_running is True
        assert pending_session.is_running is False
    
    def test_session_is_completed_property(self):
        """Test is_completed property"""
        completed_session = ScrapingSession(
            session_name="Test",
            query="test",
            status="completed"
        )
        running_session = ScrapingSession(
            session_name="Test",
            query="test",
            status="running"
        )
        
        assert completed_session.is_completed is True
        assert running_session.is_completed is False
    
    def test_session_duration_property(self):
        """Test duration_seconds property calculation"""
        start = datetime(2024, 1, 1, 12, 0, 0)
        end = datetime(2024, 1, 1, 12, 30, 0)
        
        session = ScrapingSession(
            session_name="Test",
            query="test",
            status="completed",
            started_at=start,
            completed_at=end
        )
        
        assert session.duration_seconds == 1800  # 30 minutes
    
    def test_session_repr(self):
        """Test ScrapingSession string representation"""
        session = ScrapingSession(
            session_name="Test",
            query="python developer",
            status="completed",
            total_jobs=150
        )
        session.id = 1
        
        repr_str = repr(session)
        assert "ScrapingSession" in repr_str
        assert "id=1" in repr_str
        assert "python developer" in repr_str


class TestModelRelationships:
    """Test model relationships and foreign keys"""
    
    def test_company_job_relationship(self):
        """Test Company to Job relationship"""
        company = Company(name="Tech Corp")
        job1 = Job(job_id="1", title="Dev", link="https://example.com")
        job2 = Job(job_id="2", title="Dev", link="https://example.com")
        
        company.jobs = [job1, job2]
        assert len(company.jobs) == 2
        assert job1 in company.jobs
    
    def test_session_job_relationship(self):
        """Test ScrapingSession to Job relationship"""
        session = ScrapingSession(
            session_name="Test",
            query="python",
            status="completed"
        )
        job = Job(job_id="1", title="Dev", link="https://example.com")
        
        session.jobs = [job]
        assert len(session.jobs) == 1
        assert job in session.jobs


class TestTimestampMixin:
    """Test timestamp mixin functionality"""
    
    def test_model_has_timestamps(self):
        """Test that models have timestamp fields"""
        job = Job(
            job_id="12345",
            title="Python Developer",
            link="https://example.com"
        )
        
        assert hasattr(job, 'created_at')
        assert hasattr(job, 'updated_at')
    
    def test_timestamps_optional_before_persist(self):
        """Test timestamps are None before persistence"""
        company = Company(name="Tech Corp")
        
        assert company.created_at is None
        assert company.updated_at is None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

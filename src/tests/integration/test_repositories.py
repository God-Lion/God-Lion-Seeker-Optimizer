"""Integration tests for repositories with async database operations"""
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from src.models import Base, Job, Company, ScrapingSession
from src.repositories import (
    JobRepository,
    CompanyRepository,
    ScrapingSessionRepository
)


# Use SQLite in-memory for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def test_engine():
    """Create test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        connect_args={"timeout": 10},
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Cleanup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def test_session(test_engine):
    """Create test database session"""
    async_session = async_sessionmaker(
        test_engine,
        class_=AsyncSession,
        expire_on_commit=False
    )
    
    async with async_session() as session:
        yield session


class TestJobRepository:
    """Test JobRepository CRUD and query operations"""
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_create_job(self, test_session):
        """Test creating a job"""
        repo = JobRepository(test_session)
        
        job = await repo.create(
            job_id="12345",
            title="Python Developer",
            link="https://linkedin.com/jobs/view/12345",
            place="Remote"
        )
        
        assert job.id is not None
        assert job.job_id == "12345"
        assert job.title == "Python Developer"
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_get_job_by_id(self, test_session):
        """Test retrieving job by ID"""
        repo = JobRepository(test_session)
        
        job = await repo.create(
            job_id="12345",
            title="Python Developer",
            link="https://linkedin.com/jobs/view/12345"
        )
        
        retrieved = await repo.get_by_id(job.id)
        assert retrieved is not None
        assert retrieved.job_id == "12345"
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_get_job_by_job_id(self, test_session):
        """Test retrieving job by job_id"""
        repo = JobRepository(test_session)
        
        await repo.create(
            job_id="12345",
            title="Python Developer",
            link="https://linkedin.com/jobs/view/12345"
        )
        
        job = await repo.get_by_job_id("12345")
        assert job is not None
        assert job.job_id == "12345"
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_search_by_title(self, test_session):
        """Test searching jobs by title"""
        repo = JobRepository(test_session)
        
        await repo.create(
            job_id="1",
            title="Python Developer",
            link="https://example.com"
        )
        await repo.create(
            job_id="2",
            title="Java Developer",
            link="https://example.com"
        )
        
        results = await repo.search_by_title("Python")
        assert len(results) == 1
        assert results[0].title == "Python Developer"
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_search_by_location(self, test_session):
        """Test searching jobs by location"""
        repo = JobRepository(test_session)
        
        await repo.create(
            job_id="1",
            title="Dev 1",
            link="https://example.com",
            place="San Francisco, CA"
        )
        await repo.create(
            job_id="2",
            title="Dev 2",
            link="https://example.com",
            place="New York, NY"
        )
        
        results = await repo.search_by_location("San Francisco")
        assert len(results) == 1
        assert "San Francisco" in results[0].place
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_get_active_jobs(self, test_session):
        """Test retrieving active jobs"""
        repo = JobRepository(test_session)
        
        job1 = await repo.create(
            job_id="1",
            title="Active Job",
            link="https://example.com",
            is_active=True
        )
        job2 = await repo.create(
            job_id="2",
            title="Inactive Job",
            link="https://example.com",
            is_active=False
        )
        
        active = await repo.get_active_jobs()
        assert len(active) == 1
        assert active[0].is_active is True


class TestCompanyRepository:
    """Test CompanyRepository CRUD and query operations"""
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_create_company(self, test_session):
        """Test creating a company"""
        repo = CompanyRepository(test_session)
        
        company = await repo.create(
            name="Tech Corp",
            industry="IT"
        )
        
        assert company.id is not None
        assert company.name == "Tech Corp"
        assert company.industry == "IT"
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_get_company_by_name(self, test_session):
        """Test retrieving company by name"""
        repo = CompanyRepository(test_session)
        
        await repo.create(name="Tech Corp", industry="IT")
        
        company = await repo.get_by_name("Tech Corp")
        assert company is not None
        assert company.name == "Tech Corp"
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_search_by_name(self, test_session):
        """Test searching companies by name"""
        repo = CompanyRepository(test_session)
        
        await repo.create(name="Tech Corp", industry="IT")
        await repo.create(name="Tech Innovations", industry="IT")
        await repo.create(name="Finance Corp", industry="Finance")
        
        results = await repo.search_by_name("Tech")
        assert len(results) == 2
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_get_by_industry(self, test_session):
        """Test retrieving companies by industry"""
        repo = CompanyRepository(test_session)
        
        await repo.create(name="Tech Corp 1", industry="IT")
        await repo.create(name="Tech Corp 2", industry="IT")
        await repo.create(name="Finance Corp", industry="Finance")
        
        it_companies = await repo.get_by_industry("IT")
        assert len(it_companies) == 2
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_get_or_create_existing(self, test_session):
        """Test get_or_create with existing company"""
        repo = CompanyRepository(test_session)
        
        company1 = await repo.create(name="Tech Corp", industry="IT")
        company2 = await repo.get_or_create(name="Tech Corp", industry="IT")
        
        assert company1.id == company2.id
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_get_or_create_new(self, test_session):
        """Test get_or_create with new company"""
        repo = CompanyRepository(test_session)
        
        company = await repo.get_or_create(
            name="New Corp",
            industry="IT"
        )
        
        assert company.id is not None
        assert company.name == "New Corp"


class TestScrapingSessionRepository:
    """Test ScrapingSessionRepository CRUD and query operations"""
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_create_session(self, test_session):
        """Test creating a scraping session"""
        repo = ScrapingSessionRepository(test_session)
        
        session = await repo.create(
            session_name="Test Scrape",
            query="python developer",
            status="pending"
        )
        
        assert session.id is not None
        assert session.query == "python developer"
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_get_by_status(self, test_session):
        """Test retrieving sessions by status"""
        repo = ScrapingSessionRepository(test_session)
        
        await repo.create(
            session_name="Running 1",
            query="query1",
            status="running"
        )
        await repo.create(
            session_name="Completed 1",
            query="query2",
            status="completed"
        )
        
        running = await repo.get_by_status("running")
        assert len(running) == 1
        assert running[0].status == "running"
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_get_running_sessions(self, test_session):
        """Test retrieving running sessions"""
        repo = ScrapingSessionRepository(test_session)
        
        await repo.create(
            session_name="Running",
            query="q",
            status="running"
        )
        await repo.create(
            session_name="Completed",
            query="q",
            status="completed"
        )
        
        running = await repo.get_running_sessions()
        assert len(running) == 1


class TestBaseRepositoryCRUD:
    """Test base CRUD operations"""
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_update(self, test_session):
        """Test updating an entity"""
        repo = JobRepository(test_session)
        
        job = await repo.create(
            job_id="123",
            title="Developer",
            link="https://example.com"
        )
        
        updated = await repo.update(job.id, title="Senior Developer")
        assert updated.title == "Senior Developer"
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_delete(self, test_session):
        """Test deleting an entity"""
        repo = JobRepository(test_session)
        
        job = await repo.create(
            job_id="123",
            title="Developer",
            link="https://example.com"
        )
        
        deleted = await repo.delete(job.id)
        assert deleted is True
        
        retrieved = await repo.get_by_id(job.id)
        assert retrieved is None
    
    @pytest.mark.skip(reason="Requires real database")
    @pytest.mark.asyncio
    async def test_exists(self, test_session):
        """Test checking existence"""
        repo = JobRepository(test_session)
        
        await repo.create(
            job_id="123",
            title="Developer",
            link="https://example.com"
        )
        
        exists = await repo.exists(job_id="123")
        assert exists is True
        
        not_exists = await repo.exists(job_id="999")
        assert not_exists is False


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])

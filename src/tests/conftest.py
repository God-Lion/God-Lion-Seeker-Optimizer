"""Pytest configuration for tests"""
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

import pytest
import pytest_asyncio


def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line("markers", "asyncio: mark test as async")
    config.addinivalue_line("markers", "integration: mark test as integration test")
    config.addinivalue_line("markers", "unit: mark test as unit test")
    config.addinivalue_line("markers", "slow: mark test as slow")
    config.addinivalue_line("markers", "performance: mark test as performance test")


def pytest_collect_file(parent, file_path):
    """Skip __init__.py files during collection"""
    if file_path.name == "__init__.py":
        return None


def pytest_collection_modifyitems(config, items):
    """Modify test collection - add markers based on location"""
    filtered_items = []
    
    for item in items:
        # Skip any items related to __init__.py files  
        if "__init__" in str(item.fspath):
            continue
            
        # Add location-based markers
        try:
            nodeid = str(item.nodeid)
            if "integration" in nodeid:
                item.add_marker(pytest.mark.integration)
            elif "performance" in nodeid:
                item.add_marker(pytest.mark.performance)
            elif "unit" in nodeid:
                item.add_marker(pytest.mark.unit)
        except (AttributeError, TypeError):
            pass
        
        filtered_items.append(item)
    
    items[:] = filtered_items


# Database and async fixtures
@pytest.fixture(scope="function")
def event_loop():
    """Create an event loop for async tests"""
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def session():
    """Create a mock database session for testing"""
    from unittest.mock import AsyncMock, MagicMock
    
    mock_session = AsyncMock()
    mock_session.commit = AsyncMock()
    mock_session.rollback = AsyncMock()
    mock_session.close = AsyncMock()
    mock_session.execute = AsyncMock()
    mock_session.add = MagicMock()
    mock_session.delete = AsyncMock()
    mock_session.refresh = AsyncMock()
    
    yield mock_session
    
    await mock_session.close()


@pytest.fixture
def sample_company():
    """Create a sample company for testing"""
    from models import Company
    
    company = Company(
        id=1,
        name="Test Company",
        industry="Technology",
        company_size="1001-5000",
        website="https://testcompany.com",
        location="San Francisco, CA"
    )
    return company


@pytest.fixture
def sample_jobs(sample_company):
    """Create sample jobs for testing"""
    from models import Job
    
    jobs = [
        Job(
            id=1,
            job_id="linkedin_001",
            title="Senior Python Developer",
            link="https://linkedin.com/jobs/view/001",
            place="San Francisco, CA",
            description="Build amazing Python applications",
            company_id=sample_company.id,
            is_active=True
        ),
        Job(
            id=2,
            job_id="linkedin_002",
            title="Data Scientist",
            link="https://linkedin.com/jobs/view/002",
            place="New York, NY",
            description="Analyze data and build models",
            company_id=sample_company.id,
            is_active=True
        )
    ]
    return jobs

import sys
from pathlib import Path
sys.path.insert(0, "/app/src")
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.main import app
from src.models.base import Base
from src.models.user import User
from src.config.database import get_db

DATABASE_URL = "postgresql+asyncpg://scraper_user:scraper_password@postgres:5432/godlionseeker_test"

engine = create_async_engine(DATABASE_URL, echo=True)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)

async def override_get_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"

@pytest.fixture(scope="session")
async def client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.fixture(scope="session", autouse=True)
async def setup_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture(scope="function")
async def db():
    async with TestingSessionLocal() as session:
        yield session

@pytest.fixture(scope="function")
async def test_user(db: AsyncSession):
    user = User(
        email="test@example.com",
        hashed_password="testpassword",
        first_name="Test",
        last_name="User",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

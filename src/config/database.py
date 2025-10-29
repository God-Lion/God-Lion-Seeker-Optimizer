"""Async database configuration using SQLAlchemy 2.0"""
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import NullPool
from contextlib import asynccontextmanager, contextmanager
from typing import AsyncGenerator, Generator
import logging
from .settings import settings

logger = logging.getLogger(__name__)

# Create async engine with connection pooling
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_recycle=3600,  # Recycle connections every hour
    connect_args={
        "charset": "utf8mb4",
        # Note: aiomysql doesn't support 'timeout' in connect_args
        # Use server-side timeouts or connection pool settings instead
    },
)

# Create session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# Create synchronous engine for legacy operations and migrations
sync_engine = create_engine(
    settings.sync_database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_recycle=3600,
    connect_args={
        "charset": "utf8mb4",
    },
)

# Create synchronous session factory
sync_session_factory = sessionmaker(
    sync_engine,
    class_=Session,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


@asynccontextmanager
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provide database session with automatic cleanup and error handling.
    
    Usage:
        async with get_session() as session:
            # do something
            await session.commit()
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database error: {e}")
            raise
        finally:
            await session.close()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for FastAPI and other async frameworks.
    
    Usage in FastAPI:
        async def route(db: AsyncSession = Depends(get_db)):
            # use db session
    """
    async with get_session() as session:
        yield session


# Alias for compatibility
get_db_session = get_db


async def init_db() -> None:
    """Initialize database and create all tables based on models."""
    try:
        from src.models import Base
        
        logger.info("Initializing database...")
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


async def close_db() -> None:
    """Close all database connections."""
    try:
        logger.info("Closing database connections...")
        await engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database: {e}")
        raise


async def health_check() -> bool:
    """Check database connectivity."""
    try:
        async with get_session() as session:
            await session.execute("SELECT 1")
        return True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False


# Synchronous database functions for legacy scraper
def get_sync_session() -> Session:
    """
    Get a synchronous database session.
    
    Usage:
        session = get_sync_session()
        try:
            # do something
            session.commit()
        finally:
            session.close()
    """
    return sync_session_factory()


def init_sync_db() -> None:
    """Initialize database synchronously."""
    try:
        from src.models import Base
        
        logger.info("Initializing database (sync)...")
        Base.metadata.create_all(sync_engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

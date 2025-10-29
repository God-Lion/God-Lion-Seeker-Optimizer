"""Scraping session model using SQLAlchemy 2.0"""
from sqlalchemy import String, Integer, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from datetime import datetime
from .base import Base, TimestampMixin


class ScrapingSession(Base, TimestampMixin):
    """Track scraping sessions, queries, and statistics"""
    
    __tablename__ = "scraping_sessions"
    
    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Session details
    session_name: Mapped[str] = mapped_column(String(200), nullable=False)
    query: Mapped[str] = mapped_column(String(500), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    platform: Mapped[Optional[str]] = mapped_column(
        String(50), 
        nullable=True,
        comment="indeed, linkedin, glassdoor, etc."
    )
    status: Mapped[str] = mapped_column(
        String(50), 
        default="pending",
        nullable=False,
        comment="pending, running, completed, failed, paused"
    )
    
    # Statistics
    total_jobs: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    unique_jobs: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    duplicate_jobs: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    error_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)
    jobs_found: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)  # Total jobs found during scraping
    jobs_stored: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)  # Jobs successfully stored
    jobs_scraped: Mapped[int] = mapped_column(Integer, default=0, server_default="0", nullable=False)  # Alias for total_jobs for statistics
    error_message: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    
    def __init__(self, **kwargs):
        # Set defaults for statistics if not provided
        if 'total_jobs' not in kwargs:
            kwargs['total_jobs'] = 0
        if 'unique_jobs' not in kwargs:
            kwargs['unique_jobs'] = 0
        if 'duplicate_jobs' not in kwargs:
            kwargs['duplicate_jobs'] = 0
        if 'error_count' not in kwargs:
            kwargs['error_count'] = 0
        if 'jobs_found' not in kwargs:
            kwargs['jobs_found'] = 0
        if 'jobs_stored' not in kwargs:
            kwargs['jobs_stored'] = 0
        if 'jobs_scraped' not in kwargs:
            kwargs['jobs_scraped'] = 0
        super().__init__(**kwargs)
    
    # Timing information
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    jobs: Mapped[List["Job"]] = relationship(
        "Job",
        back_populates="session",
        lazy="selectin"
    )
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_session_status', 'status'),
        Index('idx_session_created_at', 'created_at'),
        Index('idx_session_query', 'query'),
        Index('idx_session_platform', 'platform'),
        Index('idx_session_location', 'location'),
    )
    
    @property
    def duration_seconds(self) -> Optional[int]:
        """Calculate session duration in seconds"""
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            return int(delta.total_seconds())
        return None
    
    @property
    def is_running(self) -> bool:
        """Check if session is currently running"""
        return self.status == "running"
    
    @property
    def is_completed(self) -> bool:
        """Check if session is completed"""
        return self.status == "completed"
    
    def __repr__(self) -> str:
        return (
            f"<ScrapingSession(id={self.id}, query='{self.query}', "
            f"status='{self.status}', total_jobs={self.total_jobs})>"
        )
    
    def __str__(self) -> str:
        return f"Session: {self.session_name} ({self.status}) - {self.total_jobs} jobs"

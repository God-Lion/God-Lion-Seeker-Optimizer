"""Job model using SQLAlchemy 2.0"""
from sqlalchemy import String, Text, Integer, ForeignKey, Boolean, JSON, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, Dict, Any
from datetime import datetime

from .base import Base, TimestampMixin


class Job(Base, TimestampMixin):
    """Job posting model"""
    
    __tablename__ = "jobs"
    
    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Job identifiers
    job_id: Mapped[str] = mapped_column(
        String(100), 
        unique=True, 
        index=True,
        nullable=False
    )
    
    # Foreign keys
    session_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("scraping_sessions.id", ondelete="SET NULL"),
        nullable=True
    )
    company_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("companies.id", ondelete="SET NULL"),
        nullable=True
    )
    
    # Job details
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    link: Mapped[str] = mapped_column(String(1000), nullable=False)
    apply_link: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    place: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    
    # Description
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description_html: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Date information
    date: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    date_text: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    posted_date: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    scraped_at: Mapped[Optional[datetime]] = mapped_column(nullable=True)
    
    # Job classification
    job_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Full-time, Part-time, Contract, etc.
    experience_level: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # Entry level, Mid-Senior, etc.
    location: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    job_url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    
    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, server_default="1", nullable=False)
    
    def __init__(self, **kwargs):
        # Set default for is_active if not provided
        if 'is_active' not in kwargs:
            kwargs['is_active'] = True
        super().__init__(**kwargs)
    
    # Metadata
    insights: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Matching data
    match_score: Mapped[Optional[float]] = mapped_column(nullable=True)
    match_details: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    company: Mapped[Optional["Company"]] = relationship(
        "Company",
        back_populates="jobs",
        lazy="selectin"
    )
    session: Mapped[Optional["ScrapingSession"]] = relationship(
        "ScrapingSession",
        back_populates="jobs",
        lazy="selectin"
    )
    analysis: Mapped[Optional["JobAnalysis"]] = relationship(
        "JobAnalysis",
        back_populates="job",
        uselist=False,
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    
    # Indexes
    __table_args__ = (
        Index('idx_jobs_title', 'title'),
        Index('idx_jobs_place', 'place'),
        Index('idx_jobs_is_active', 'is_active'),
        Index('idx_jobs_created_at', 'created_at'),
        Index('idx_jobs_company_id', 'company_id'),
        Index('idx_jobs_session_id', 'session_id'),
        Index('idx_jobs_location', 'location'),
        Index('idx_jobs_job_type', 'job_type'),
        Index('idx_jobs_experience_level', 'experience_level'),
        Index('idx_jobs_posted_date', 'posted_date'),
        Index('idx_jobs_scraped_at', 'scraped_at'),
    )
    
    def __repr__(self) -> str:
        return f"<Job(id={self.id}, title='{self.title}', company_id={self.company_id})>"
    
    def __str__(self) -> str:
        return f"{self.title} at {self.place or 'Unknown Location'}"

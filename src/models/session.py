"""Scraping session model with SQLAlchemy 2.0"""
from sqlalchemy import String, Text, Integer, JSON, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, Dict, Any, List
from enum import Enum

from .base import Base, TimestampMixin


class SessionStatus(str, Enum):
    """Session status enum"""
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ScrapingSession(Base, TimestampMixin):
    """Scraping session model"""
    
    __tablename__ = "scraping_sessions"
    
    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Session details
    query_text: Mapped[str] = mapped_column(String(500), nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Filters applied
    filters_applied: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    
    # Status
    status: Mapped[SessionStatus] = mapped_column(
        SQLEnum(SessionStatus),
        default=SessionStatus.RUNNING,
        nullable=False
    )
    
    # Statistics
    total_jobs_scraped: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Error handling
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    jobs: Mapped[List["Job"]] = relationship(
        "Job",
        back_populates="session",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<ScrapingSession(id={self.id}, query='{self.query_text}', status='{self.status}')>"

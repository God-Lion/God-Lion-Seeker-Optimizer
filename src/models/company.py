"""Company model using SQLAlchemy 2.0"""
from sqlalchemy import String, Integer, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from .base import Base, TimestampMixin


class Company(Base, TimestampMixin):
    """Company model for job posting organizations"""
    
    __tablename__ = "companies"
    
    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Company identifiers
    name: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    
    # Company details
    industry: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    company_size: Mapped[Optional[str]] = mapped_column(
        String(100), 
        nullable=True,
        comment="e.g., 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001+"
    )
    website: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    
    # Relationships
    jobs: Mapped[List["Job"]] = relationship(
        "Job",
        back_populates="company",
        cascade="all, delete-orphan",
        lazy="selectin"
    )
    
    # Indexes for common queries
    __table_args__ = (
        Index('idx_company_name', 'name'),
        Index('idx_company_industry', 'industry'),
        Index('idx_company_location', 'location'),
    )
    
    def __repr__(self) -> str:
        return f"<Company(id={self.id}, name='{self.name}', industry='{self.industry}')>"
    
    def __str__(self) -> str:
        return f"{self.name} ({self.industry or 'Unknown'})"

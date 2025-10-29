"""Job analysis model for storing AI-powered job matching results"""
from sqlalchemy import String, Float, Text, Integer, ForeignKey, Index, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, Dict, Any, List
from datetime import datetime

from .base import Base, TimestampMixin


class JobAnalysis(Base, TimestampMixin):
    """
    Stores AI-powered job matching analysis results.
    
    Links jobs with resumes and provides detailed match scoring,
    skill matching, and recommendations.
    """
    
    __tablename__ = "job_analysis"
    
    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    
    # Foreign keys
    job_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("jobs.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Resume identifier (optional - for multiple resume support)
    resume_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        comment="Identifier for the resume used in analysis"
    )
    
    # Match scores (0.0 to 1.0 scale)
    overall_match_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Overall match score (0.0 to 1.0)"
    )
    similarity_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Semantic similarity using NLP (0.0 to 1.0)"
    )
    skills_match_percentage: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Percentage of required skills matched (0.0 to 100.0)"
    )
    experience_match_score: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        comment="Experience level match score (0.0 to 1.0)"
    )
    
    # Match category
    match_category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        comment="excellent, good, fair, poor"
    )
    
    # Detailed skill analysis
    matching_skills: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        comment="List of skills that match between resume and job"
    )
    missing_skills: Mapped[Dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
        comment="List of required skills missing from resume"
    )
    recommended_skills: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Skills recommended to learn for this role"
    )
    
    # Additional analysis data
    keyword_match_score: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True,
        comment="TF-IDF keyword matching score"
    )
    top_matching_keywords: Mapped[Optional[Dict[str, Any]]] = mapped_column(
        JSON,
        nullable=True,
        comment="Top keywords matching between resume and job description"
    )
    
    # Recommendation text
    recommendation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Human-readable recommendation for applying"
    )
    
    # Analysis metadata
    analyzed_at: Mapped[datetime] = mapped_column(
        nullable=False,
        default=datetime.utcnow,
        comment="When the analysis was performed"
    )
    analysis_version: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True,
        comment="Version of the matching algorithm used"
    )
    
    # Relationships
    job: Mapped["Job"] = relationship(
        "Job",
        back_populates="analysis",
        lazy="selectin"
    )
    
    # Indexes for efficient querying
    __table_args__ = (
        Index('idx_job_analysis_job_id', 'job_id'),
        Index('idx_job_analysis_overall_score', 'overall_match_score'),
        Index('idx_job_analysis_category', 'match_category'),
        Index('idx_job_analysis_analyzed_at', 'analyzed_at'),
        Index('idx_job_analysis_resume', 'resume_id'),
        # Unique constraint to prevent duplicate analysis
        Index('idx_unique_job_resume', 'job_id', 'resume_id', unique=True),
    )
    
    def __repr__(self) -> str:
        return (
            f"<JobAnalysis(id={self.id}, job_id={self.job_id}, "
            f"score={self.overall_match_score:.2f}, category='{self.match_category}')>"
        )
    
    def __str__(self) -> str:
        return f"Match: {self.overall_match_score*100:.1f}% ({self.match_category})"
    
    @property
    def is_high_match(self) -> bool:
        """Check if this is a high match (>= 70%)"""
        return self.overall_match_score >= 0.70
    
    @property
    def is_good_match(self) -> bool:
        """Check if this is at least a good match (>= 60%)"""
        return self.overall_match_score >= 0.60
    
    @property
    def match_score_percentage(self) -> float:
        """Get overall match score as percentage"""
        return round(self.overall_match_score * 100, 1)
    
    @property
    def skill_gap_count(self) -> int:
        """Count of missing skills"""
        if isinstance(self.missing_skills, list):
            return len(self.missing_skills)
        elif isinstance(self.missing_skills, dict):
            return len(self.missing_skills.get('skills', []))
        return 0
    
    @property
    def matched_skill_count(self) -> int:
        """Count of matched skills"""
        if isinstance(self.matching_skills, list):
            return len(self.matching_skills)
        elif isinstance(self.matching_skills, dict):
            return len(self.matching_skills.get('skills', []))
        return 0

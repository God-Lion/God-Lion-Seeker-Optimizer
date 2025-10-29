"""
Career recommendation models for storing resume analysis and role matching results.
"""
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Float, Text, JSON, ForeignKey
from typing import Optional, Dict, List
from datetime import datetime
from src.models.base import Base, TimestampMixin


class ResumeAnalysis(Base, TimestampMixin):
    """
    Stores parsed resume information and analysis results.
    """
    __tablename__ = "resume_analyses"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # User identification (optional)
    user_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    user_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Resume content
    resume_text: Mapped[str] = mapped_column(Text, nullable=False)
    resume_filename: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Parsed information
    skills: Mapped[Dict] = mapped_column(JSON, nullable=False, default=list)
    education: Mapped[Dict] = mapped_column(JSON, nullable=False, default=list)
    certifications: Mapped[Dict] = mapped_column(JSON, nullable=False, default=list)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    
    # Analysis metadata
    contact_info: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    entities: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    
    # Relationships
    recommendations: Mapped[List["RoleRecommendation"]] = relationship(
        "RoleRecommendation",
        back_populates="resume_analysis",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self):
        return f"<ResumeAnalysis(id={self.id}, name={self.user_name}, skills_count={len(self.skills)})>"


class RoleRecommendation(Base, TimestampMixin):
    """
    Stores individual role recommendations for a resume analysis.
    """
    __tablename__ = "role_recommendations"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Foreign key to resume analysis
    resume_analysis_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("resume_analyses.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Role information
    role_id: Mapped[str] = mapped_column(String(100), nullable=False)
    role_title: Mapped[str] = mapped_column(String(255), nullable=False)
    role_category: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # Matching scores (0.0 - 1.0)
    overall_fit_score: Mapped[float] = mapped_column(Float, nullable=False)
    skills_score: Mapped[float] = mapped_column(Float, nullable=False)
    education_score: Mapped[float] = mapped_column(Float, nullable=False)
    certification_score: Mapped[float] = mapped_column(Float, nullable=False)
    experience_score: Mapped[float] = mapped_column(Float, nullable=False)
    
    # Detailed analysis
    matched_skills: Mapped[List] = mapped_column(JSON, nullable=False, default=list)
    missing_skills: Mapped[List] = mapped_column(JSON, nullable=False, default=list)
    matched_certifications: Mapped[List] = mapped_column(JSON, nullable=False, default=list)
    missing_certifications: Mapped[List] = mapped_column(JSON, nullable=False, default=list)
    
    # Career insights
    skill_gaps: Mapped[List] = mapped_column(JSON, nullable=False, default=list)
    growth_recommendations: Mapped[List] = mapped_column(JSON, nullable=False, default=list)
    career_path_suggestions: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    
    # Additional metadata
    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Relationships
    resume_analysis: Mapped["ResumeAnalysis"] = relationship(
        "ResumeAnalysis",
        back_populates="recommendations"
    )
    
    def __repr__(self):
        return f"<RoleRecommendation(id={self.id}, role={self.role_title}, score={self.overall_fit_score:.2f})>"


class SkillEmbedding(Base, TimestampMixin):
    """
    Stores pre-computed embeddings for skills to enable semantic matching.
    """
    __tablename__ = "skill_embeddings"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    skill_name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    embedding: Mapped[List] = mapped_column(JSON, nullable=False)  # Vector representation
    embedding_model: Mapped[str] = mapped_column(String(100), nullable=False)  # Model used
    
    # Metadata
    category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    synonyms: Mapped[Optional[List]] = mapped_column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<SkillEmbedding(skill={self.skill_name}, model={self.embedding_model})>"


class CareerPathway(Base, TimestampMixin):
    """
    Stores career progression pathways and transitions between roles.
    """
    __tablename__ = "career_pathways"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    
    # Pathway definition
    from_role_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    to_role_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    
    # Transition details
    typical_years: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    difficulty_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # easy, medium, hard
    
    # Requirements for transition
    required_skills: Mapped[List] = mapped_column(JSON, nullable=False, default=list)
    required_certifications: Mapped[List] = mapped_column(JSON, nullable=False, default=list)
    recommended_courses: Mapped[Optional[List]] = mapped_column(JSON, nullable=True)
    
    # Success metrics
    transition_frequency: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0.0-1.0
    success_rate: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # 0.0-1.0
    
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    def __repr__(self):
        return f"<CareerPathway(from={self.from_role_id}, to={self.to_role_id})>"

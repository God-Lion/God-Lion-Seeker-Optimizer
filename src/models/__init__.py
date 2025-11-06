"""Updated models initialization with all models exported"""
from .base import Base, TimestampMixin
from .job import Job
from .company import Company
from .scraping_session import ScrapingSession
from .job_analysis import JobAnalysis
from .career_recommendation import ResumeAnalysis, RoleRecommendation, SkillEmbedding, CareerPathway
from .user import (
    User,
    UserRole,
    UserStatus,
    ResumeProfile,
    JobApplication,
    SecurityLog,
    Notification,
    SystemMetric,
)
from .permission import (
    Permission,
    PermissionType,
    RolePermission,
    AuditLog,
    UserPermission,
)

__all__ = [
    "Base",
    "TimestampMixin",
    "Job",
    "Company",
    "ScrapingSession",
    "JobAnalysis",
    "ResumeAnalysis",
    "RoleRecommendation",
    "SkillEmbedding",
    "CareerPathway",
    "User",
    "UserRole",
    "UserStatus",
    "ResumeProfile",
    "JobApplication",
    "SecurityLog",
    "Notification",
    "SystemMetric",
    "Permission",
    "PermissionType",
    "RolePermission",
    "AuditLog",
    "UserPermission",
]

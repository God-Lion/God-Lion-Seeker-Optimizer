"""User model for authentication and authorization"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, JSON
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class UserRole(PyEnum):
    """User role enumeration"""
    GUEST = "guest"
    USER = "user"
    ADMIN = "admin"
    SUPERADMIN = "superadmin"


class UserStatus(PyEnum):
    """User status enumeration"""
    ACTIVE = "active"
    SUSPENDED = "suspended"
    BANNED = "banned"
    PENDING_VERIFICATION = "pending_verification"


class User(Base, TimestampMixin):
    """User model for authentication and profile management"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Nullable for SSO users
    
    # Profile information
    first_name = Column(String(100))
    last_name = Column(String(100))
    avatar = Column(Text)  # URL to avatar image
    bio = Column(Text)
    
    # Authentication
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    status = Column(Enum(UserStatus), default=UserStatus.PENDING_VERIFICATION, nullable=False)
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(255))
    password_reset_token = Column(String(255))
    password_reset_expires = Column(DateTime)
    
    # SSO
    google_id = Column(String(255), unique=True, index=True)
    
    # Session management
    last_login = Column(DateTime)
    last_activity = Column(DateTime)
    failed_login_attempts = Column(Integer, default=0)
    account_locked_until = Column(DateTime)
    
    # Preferences
    preferences = Column(JSON, default=dict)  # User settings and preferences
    notification_settings = Column(JSON, default=dict)
    
    # Statistics
    application_count = Column(Integer, default=0)
    profile_views = Column(Integer, default=0)
    
    # Relationships
    profiles = relationship("ResumeProfile", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("JobApplication", back_populates="user", cascade="all, delete-orphan")
    saved_jobs = relationship("SavedJob", back_populates="user", cascade="all, delete-orphan")
    security_logs = relationship("SecurityLog", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role}, status={self.status})>"
    
    @property
    def full_name(self):
        """Get user's full name"""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email.split('@')[0]
    
    def is_admin(self):
        """Check if user has admin privileges"""
        return self.role in [UserRole.ADMIN, UserRole.SUPERADMIN]
    
    def is_active(self):
        """Check if user account is active"""
        return self.status == UserStatus.ACTIVE and self.email_verified
    
    def can_login(self):
        """Check if user can login"""
        if not self.is_active():
            return False
        if self.account_locked_until and self.account_locked_until > datetime.utcnow():
            return False
        return True


class ResumeProfile(Base, TimestampMixin):
    """Resume profiles for users (multiple profiles per user)"""
    __tablename__ = "resume_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    name = Column(String(255), nullable=False)  # Profile name (e.g., "Senior Developer", "Data Analyst")
    is_active = Column(Boolean, default=False)  # Active profile for job search
    
    # Resume data
    resume_text = Column(Text)
    resume_file_url = Column(Text)
    parsed_data = Column(JSON)  # Parsed resume data
    
    # Skills and experience
    skills = Column(JSON)  # List of skills
    experience_years = Column(Integer)
    education = Column(JSON)
    certifications = Column(JSON)
    
    # Job preferences
    desired_roles = Column(JSON)  # List of desired job titles
    preferred_locations = Column(JSON)
    preferred_companies = Column(JSON)
    salary_expectation = Column(JSON)  # {min, max, currency}
    
    # Analysis results
    analysis_results = Column(JSON)  # Latest analysis results
    last_analyzed = Column(DateTime)
    
    # Relationships
    from sqlalchemy import ForeignKey
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    user = relationship("User", back_populates="profiles")
    
    def __repr__(self):
        return f"<ResumeProfile(id={self.id}, user_id={self.user_id}, name={self.name}, active={self.is_active})>"


class JobApplication(Base, TimestampMixin):
    """Job applications tracking"""
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    job_id = Column(Integer, nullable=False, index=True)
    profile_id = Column(Integer, index=True)  # Which profile was used
    
    # Application status
    status = Column(String(50), default="applied")  # applied, interviewing, offered, rejected, withdrawn
    applied_at = Column(DateTime, default=datetime.utcnow)
    
    # Application details
    cover_letter = Column(Text)
    custom_resume_url = Column(Text)
    notes = Column(Text)
    
    # Tracking
    source = Column(String(100))  # manual, automated
    automation_session_id = Column(String(255))
    
    # Follow-up
    follow_up_date = Column(DateTime)
    interview_dates = Column(JSON)  # List of interview dates
    
    # Relationships
    from sqlalchemy import ForeignKey
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey('jobs.id'), nullable=False, index=True)
    profile_id = Column(Integer, ForeignKey('resume_profiles.id'), index=True)
    
    user = relationship("User", back_populates="applications")
    job = relationship("Job")
    profile = relationship("ResumeProfile")
    
    def __repr__(self):
        return f"<JobApplication(id={self.id}, user_id={self.user_id}, job_id={self.job_id}, status={self.status})>"


class SecurityLog(Base, TimestampMixin):
    """Security event logging"""
    __tablename__ = "security_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    
    # Event details
    event_type = Column(String(100), nullable=False)  # login_success, login_failed, password_reset, etc.
    ip_address = Column(String(45))  # IPv4 or IPv6
    user_agent = Column(Text)
    location = Column(String(255))  # Geolocation
    
    # Additional data
    event_metadata = Column(JSON)  # Additional event data
    severity = Column(String(20), default="info")  # info, warning, critical
    
    # Relationships
    from sqlalchemy import ForeignKey
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    user = relationship("User", back_populates="security_logs")
    
    def __repr__(self):
        return f"<SecurityLog(id={self.id}, user_id={self.user_id}, event={self.event_type})>"


class Notification(Base, TimestampMixin):
    """User notifications"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    
    # Notification details
    type = Column(String(50), nullable=False)  # application_update, interview_scheduled, etc.
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    
    # Status
    read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    
    # Action
    action_url = Column(Text)  # URL to navigate when clicked
    action_label = Column(String(100))
    
    # Metadata
    notification_metadata = Column(JSON)
    
    # Relationships
    from sqlalchemy import ForeignKey
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    user = relationship("User", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.type}, read={self.read})>"


class SavedJob(Base, TimestampMixin):
    """Saved/bookmarked jobs"""
    __tablename__ = "saved_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    job_id = Column(Integer, nullable=False, index=True)
    
    # Optional notes
    notes = Column(Text)
    
    # Relationships
    from sqlalchemy import ForeignKey
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    job_id = Column(Integer, ForeignKey('jobs.id'), nullable=False, index=True)
    
    user = relationship("User", back_populates="saved_jobs")
    job = relationship("Job")
    
    def __repr__(self):
        return f"<SavedJob(id={self.id}, user_id={self.user_id}, job_id={self.job_id})>"


class SystemMetric(Base, TimestampMixin):
    """System metrics for admin dashboard"""
    __tablename__ = "system_metrics"

    id = Column(Integer, primary_key=True, index=True)
    
    # Metric details
    metric_name = Column(String(100), nullable=False, index=True)
    metric_value = Column(String(255), nullable=False)
    metric_type = Column(String(50))  # counter, gauge, histogram
    
    # Metadata
    labels = Column(JSON)  # Additional labels for the metric
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<SystemMetric(name={self.metric_name}, value={self.metric_value})>"

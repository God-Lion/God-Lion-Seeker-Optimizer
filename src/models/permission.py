"""Permission and RBAC models for granular access control"""
from datetime import datetime
from enum import Enum as PyEnum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class PermissionType(PyEnum):
    """Permission types enumeration"""
    JOBS_READ = "jobs.read"
    JOBS_CREATE = "jobs.create"
    JOBS_UPDATE = "jobs.update"
    JOBS_DELETE = "jobs.delete"
    
    SCRAPER_START = "scraper.start"
    SCRAPER_STOP = "scraper.stop"
    SCRAPER_CONFIGURE = "scraper.configure"
    
    USERS_READ = "users.read"
    USERS_CREATE = "users.create"
    USERS_UPDATE = "users.update"
    USERS_DELETE = "users.delete"
    
    ADMIN_ACCESS = "admin.access"
    ADMIN_CONFIGURE = "admin.configure"
    
    REPORTS_VIEW = "reports.view"
    REPORTS_EXPORT = "reports.export"
    
    PROFILES_READ = "profiles.read"
    PROFILES_CREATE = "profiles.create"
    PROFILES_UPDATE = "profiles.update"
    PROFILES_DELETE = "profiles.delete"
    
    APPLICATIONS_READ = "applications.read"
    APPLICATIONS_CREATE = "applications.create"
    APPLICATIONS_UPDATE = "applications.update"
    APPLICATIONS_DELETE = "applications.delete"
    
    NOTIFICATIONS_READ = "notifications.read"
    NOTIFICATIONS_MANAGE = "notifications.manage"
    
    ANALYTICS_VIEW = "analytics.view"
    ANALYTICS_MANAGE = "analytics.manage"
    
    SYSTEM_CONFIGURE = "system.configure"
    SYSTEM_MONITOR = "system.monitor"


class Permission(Base, TimestampMixin):
    """Permission model for granular access control"""
    __tablename__ = "permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    permission_type = Column(Enum(PermissionType), nullable=False, unique=True)
    description = Column(Text)
    resource = Column(String(50), nullable=False, index=True)
    action = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    
    role_permissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Permission(id={self.id}, name={self.name}, type={self.permission_type})>"


class RolePermission(Base, TimestampMixin):
    """Many-to-many mapping between roles and permissions"""
    __tablename__ = "role_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(50), nullable=False, index=True)
    permission_id = Column(Integer, ForeignKey('permissions.id'), nullable=False, index=True)
    is_granted = Column(Boolean, default=True)
    
    permission = relationship("Permission", back_populates="role_permissions")
    
    __table_args__ = (
        UniqueConstraint('role', 'permission_id', name='unique_role_permission'),
    )
    
    def __repr__(self):
        return f"<RolePermission(role={self.role}, permission_id={self.permission_id}, granted={self.is_granted})>"


class AuditLog(Base, TimestampMixin):
    """Audit log for tracking security-sensitive actions and privilege escalations"""
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    performed_by_id = Column(Integer, ForeignKey('users.id'), index=True)
    
    action = Column(String(100), nullable=False, index=True)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100))
    
    ip_address = Column(String(45))
    user_agent = Column(Text)
    
    old_value = Column(Text)
    new_value = Column(Text)
    
    success = Column(Boolean, default=True)
    error_message = Column(Text)
    
    severity = Column(String(20), default="info", index=True)
    extra_metadata = Column(Text)
    
    user = relationship("User", foreign_keys=[user_id], backref="audit_logs_as_subject")
    performed_by = relationship("User", foreign_keys=[performed_by_id], backref="audit_logs_performed")
    
    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id}, severity={self.severity})>"


class UserPermission(Base, TimestampMixin):
    """Custom permissions assigned to specific users (override role permissions)"""
    __tablename__ = "user_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    permission_id = Column(Integer, ForeignKey('permissions.id'), nullable=False, index=True)
    is_granted = Column(Boolean, default=True)
    granted_by_id = Column(Integer, ForeignKey('users.id'))
    granted_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    reason = Column(Text)
    
    user = relationship("User", foreign_keys=[user_id], backref="custom_permissions")
    permission = relationship("Permission")
    granted_by = relationship("User", foreign_keys=[granted_by_id])
    
    __table_args__ = (
        UniqueConstraint('user_id', 'permission_id', name='unique_user_permission'),
    )
    
    def __repr__(self):
        return f"<UserPermission(user_id={self.user_id}, permission_id={self.permission_id}, granted={self.is_granted})>"

"""User repository for database operations"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc

from src.models.user import (
    User,
    UserRole,
    UserStatus,
    ResumeProfile,
    JobApplication,
    SecurityLog,
    Notification,
)


class UserRepository:
    """Repository for user-related database operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # ========================================================================
    # User CRUD Operations
    # ========================================================================
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()
    
    def get_user_by_google_id(self, google_id: str) -> Optional[User]:
        """Get user by Google ID"""
        return self.db.query(User).filter(User.google_id == google_id).first()
    
    def create_user(self, user_data: Dict[str, Any]) -> User:
        """Create new user"""
        user = User(**user_data)
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def update_user(self, user_id: int, update_data: Dict[str, Any]) -> Optional[User]:
        """Update user"""
        user = self.get_user_by_id(user_id)
        if not user:
            return None
        
        for key, value in update_data.items():
            setattr(user, key, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user
    
    def delete_user(self, user_id: int) -> bool:
        """Delete user"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        self.db.delete(user)
        self.db.commit()
        return True
    
    def get_users(
        self,
        skip: int = 0,
        limit: int = 20,
        role: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> tuple[List[User], int]:
        """Get users with filters and pagination"""
        query = self.db.query(User)
        
        if role and role != "all":
            query = query.filter(User.role == role)
        
        if status and status != "all":
            query = query.filter(User.status == status)
        
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    User.email.ilike(search_pattern),
                    User.first_name.ilike(search_pattern),
                    User.last_name.ilike(search_pattern),
                )
            )
        
        total = query.count()
        users = query.order_by(desc(User.created_at)).offset(skip).limit(limit).all()
        
        return users, total
    
    # ========================================================================
    # Authentication Operations
    # ========================================================================
    
    def verify_email(self, user_id: int) -> bool:
        """Mark user email as verified"""
        user = self.get_user_by_id(user_id)
        if not user:
            return False
        
        user.email_verified = True
        user.email_verification_token = None
        user.status = UserStatus.ACTIVE
        self.db.commit()
        return True
    
    def update_last_login(self, user_id: int):
        """Update user's last login timestamp"""
        user = self.get_user_by_id(user_id)
        if user:
            user.last_login = datetime.utcnow()
            user.last_activity = datetime.utcnow()
            user.failed_login_attempts = 0
            self.db.commit()
    
    def increment_failed_login(self, user_id: int):
        """Increment failed login attempts"""
        user = self.get_user_by_id(user_id)
        if user:
            user.failed_login_attempts += 1
            
            # Lock account after 5 failed attempts
            if user.failed_login_attempts >= 5:
                user.account_locked_until = datetime.utcnow() + timedelta(minutes=30)
            
            self.db.commit()
    
    def reset_failed_login(self, user_id: int):
        """Reset failed login attempts"""
        user = self.get_user_by_id(user_id)
        if user:
            user.failed_login_attempts = 0
            user.account_locked_until = None
            self.db.commit()
    
    # ========================================================================
    # Profile Operations
    # ========================================================================
    
    def create_profile(self, user_id: int, profile_data: Dict[str, Any]) -> ResumeProfile:
        """Create resume profile for user"""
        profile_data['user_id'] = user_id
        profile = ResumeProfile(**profile_data)
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile
    
    def get_user_profiles(self, user_id: int) -> List[ResumeProfile]:
        """Get all profiles for a user"""
        return self.db.query(ResumeProfile).filter(
            ResumeProfile.user_id == user_id
        ).order_by(desc(ResumeProfile.created_at)).all()
    
    def get_active_profile(self, user_id: int) -> Optional[ResumeProfile]:
        """Get user's active profile"""
        return self.db.query(ResumeProfile).filter(
            ResumeProfile.user_id == user_id,
            ResumeProfile.is_active == True
        ).first()
    
    def set_active_profile(self, user_id: int, profile_id: int) -> bool:
        """Set a profile as active (and deactivate others)"""
        # Deactivate all profiles
        self.db.query(ResumeProfile).filter(
            ResumeProfile.user_id == user_id
        ).update({ResumeProfile.is_active: False})
        
        # Activate the selected profile
        profile = self.db.query(ResumeProfile).filter(
            ResumeProfile.id == profile_id,
            ResumeProfile.user_id == user_id
        ).first()
        
        if profile:
            profile.is_active = True
            self.db.commit()
            return True
        return False
    
    def delete_profile(self, user_id: int, profile_id: int) -> bool:
        """Delete a user's profile"""
        profile = self.db.query(ResumeProfile).filter(
            ResumeProfile.id == profile_id,
            ResumeProfile.user_id == user_id
        ).first()
        
        if profile:
            self.db.delete(profile)
            self.db.commit()
            return True
        return False
    
    # ========================================================================
    # Application Operations
    # ========================================================================
    
    def create_application(self, application_data: Dict[str, Any]) -> JobApplication:
        """Create job application"""
        application = JobApplication(**application_data)
        self.db.add(application)
        
        # Increment user's application count
        user = self.get_user_by_id(application_data['user_id'])
        if user:
            user.application_count += 1
        
        self.db.commit()
        self.db.refresh(application)
        return application
    
    def get_user_applications(
        self, 
        user_id: int,
        status: Optional[str] = None,
        limit: int = 100
    ) -> List[JobApplication]:
        """Get user's applications"""
        query = self.db.query(JobApplication).filter(
            JobApplication.user_id == user_id
        )
        
        if status:
            query = query.filter(JobApplication.status == status)
        
        return query.order_by(desc(JobApplication.applied_at)).limit(limit).all()
    
    def update_application_status(
        self, 
        application_id: int,
        status: str,
        notes: Optional[str] = None
    ) -> bool:
        """Update application status"""
        application = self.db.query(JobApplication).filter(
            JobApplication.id == application_id
        ).first()
        
        if application:
            application.status = status
            if notes:
                application.notes = notes
            self.db.commit()
            return True
        return False
    
    # ========================================================================
    # Security Log Operations
    # ========================================================================
    
    def log_security_event(
        self,
        user_id: Optional[int],
        event_type: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        location: Optional[str] = None,
        severity: str = "info",
        metadata: Optional[Dict] = None
    ) -> SecurityLog:
        """Log security event"""
        log = SecurityLog(
            user_id=user_id,
            event_type=event_type,
            ip_address=ip_address,
            user_agent=user_agent,
            location=location,
            severity=severity,
            event_metadata=metadata or {}
        )
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log
    
    def get_user_security_logs(
        self,
        user_id: int,
        limit: int = 50
    ) -> List[SecurityLog]:
        """Get user's security logs"""
        return self.db.query(SecurityLog).filter(
            SecurityLog.user_id == user_id
        ).order_by(desc(SecurityLog.created_at)).limit(limit).all()
    
    def get_recent_failed_logins(
        self,
        user_id: int,
        hours: int = 24
    ) -> List[SecurityLog]:
        """Get recent failed login attempts"""
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        return self.db.query(SecurityLog).filter(
            SecurityLog.user_id == user_id,
            SecurityLog.event_type == "login_failed",
            SecurityLog.created_at >= cutoff
        ).order_by(desc(SecurityLog.created_at)).all()
    
    # ========================================================================
    # Notification Operations
    # ========================================================================
    
    def create_notification(
        self,
        user_id: int,
        notification_type: str,
        title: str,
        message: str,
        action_url: Optional[str] = None,
        action_label: Optional[str] = None,
        metadata: Optional[Dict] = None
    ) -> Notification:
        """Create notification for user"""
        notification = Notification(
            user_id=user_id,
            type=notification_type,
            title=title,
            message=message,
            action_url=action_url,
            action_label=action_label,
            notification_metadata=metadata or {}
        )
        self.db.add(notification)
        self.db.commit()
        self.db.refresh(notification)
        return notification
    
    def get_user_notifications(
        self,
        user_id: int,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Notification]:
        """Get user's notifications"""
        query = self.db.query(Notification).filter(
            Notification.user_id == user_id
        )
        
        if unread_only:
            query = query.filter(Notification.read == False)
        
        return query.order_by(desc(Notification.created_at)).limit(limit).all()
    
    def mark_notification_read(self, notification_id: int) -> bool:
        """Mark notification as read"""
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id
        ).first()
        
        if notification:
            notification.read = True
            notification.read_at = datetime.utcnow()
            self.db.commit()
            return True
        return False
    
    def mark_all_notifications_read(self, user_id: int) -> int:
        """Mark all user notifications as read"""
        count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.read == False
        ).update({
            Notification.read: True,
            Notification.read_at: datetime.utcnow()
        })
        self.db.commit()
        return count
    
    def delete_notification(self, notification_id: int, user_id: int) -> bool:
        """Delete notification"""
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            self.db.delete(notification)
            self.db.commit()
            return True
        return False
    
    # ========================================================================
    # Statistics Operations
    # ========================================================================
    
    def get_user_statistics(self, user_id: int) -> Dict[str, Any]:
        """Get user statistics"""
        user = self.get_user_by_id(user_id)
        if not user:
            return {}
        
        # Application statistics
        total_applications = self.db.query(func.count(JobApplication.id)).filter(
            JobApplication.user_id == user_id
        ).scalar()
        
        applications_by_status = self.db.query(
            JobApplication.status,
            func.count(JobApplication.id)
        ).filter(
            JobApplication.user_id == user_id
        ).group_by(JobApplication.status).all()
        
        # Profile statistics
        total_profiles = self.db.query(func.count(ResumeProfile.id)).filter(
            ResumeProfile.user_id == user_id
        ).scalar()
        
        return {
            "total_applications": total_applications,
            "applications_by_status": {status: count for status, count in applications_by_status},
            "total_profiles": total_profiles,
            "profile_views": user.profile_views,
            "account_age_days": (datetime.utcnow() - user.created_at).days,
            "last_active": user.last_activity
        }
    
    def get_dashboard_data(self, user_id: int) -> Dict[str, Any]:
        """Get user dashboard data"""
        user = self.get_user_by_id(user_id)
        if not user:
            return {}
        
        # Recent applications
        recent_applications = self.get_user_applications(user_id, limit=10)
        
        # Unread notifications
        unread_notifications = self.get_user_notifications(user_id, unread_only=True, limit=5)
        
        # Active profile
        active_profile = self.get_active_profile(user_id)
        
        # Application statistics
        stats = self.get_user_statistics(user_id)
        
        return {
            "user": user,
            "recent_applications": recent_applications,
            "unread_notifications": unread_notifications,
            "active_profile": active_profile,
            "statistics": stats
        }

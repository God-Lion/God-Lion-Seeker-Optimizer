"""GDPR compliance service for user rights implementation"""
import json
import csv
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from io import StringIO
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import logging

logger = logging.getLogger(__name__)


class GDPRService:
    """Service for GDPR compliance - user rights implementation"""
    
    def __init__(self, session: AsyncSession):
        """
        Initialize GDPR service
        
        Args:
            session: Database session
        """
        self.session = session
    
    async def export_user_data(
        self,
        user_id: int,
        format: str = "json"
    ) -> Dict[str, Any]:
        """
        Export all user data (GDPR Article 15 - Right to Access)
        
        Args:
            user_id: User ID
            format: Export format (json, csv)
            
        Returns:
            Dictionary containing all user data
        """
        from src.models.user import (
            User, ResumeProfile, JobApplication, 
            SavedJob, SecurityLog, Notification
        )
        from src.models.career_recommendation import ResumeAnalysis
        from src.models.permission import AuditLog
        
        logger.info(f"Exporting data for user {user_id}")
        
        # Get user with all relationships
        result = await self.session.execute(
            select(User)
            .options(
                selectinload(User.profiles),
                selectinload(User.applications),
                selectinload(User.saved_jobs),
                selectinload(User.security_logs),
                selectinload(User.notifications)
            )
            .where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        # Build complete user data export
        user_data = {
            "export_metadata": {
                "export_date": datetime.utcnow().isoformat(),
                "user_id": user.id,
                "format": format,
                "gdpr_article": "Article 15 - Right to Access"
            },
            "personal_information": {
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "full_name": user.full_name,
                "avatar": user.avatar,
                "bio": user.bio,
                "role": user.role.value if user.role else None,
                "status": user.status.value if user.status else None,
                "email_verified": user.email_verified,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None
            },
            "account_information": {
                "google_id": user.google_id,
                "mfa_enabled": user.mfa_enabled,
                "last_login": user.last_login.isoformat() if user.last_login else None,
                "last_activity": user.last_activity.isoformat() if user.last_activity else None
            },
            "preferences": {
                "user_preferences": user.preferences,
                "notification_settings": user.notification_settings
            },
            "statistics": {
                "application_count": user.application_count,
                "profile_views": user.profile_views
            },
            "resume_profiles": [],
            "job_applications": [],
            "saved_jobs": [],
            "security_logs": [],
            "notifications": []
        }
        
        # Add resume profiles
        for profile in user.profiles:
            user_data["resume_profiles"].append({
                "id": profile.id,
                "name": profile.name,
                "is_active": profile.is_active,
                "resume_text": profile.resume_text,
                "resume_file_url": profile.resume_file_url,
                "parsed_data": profile.parsed_data,
                "skills": profile.skills,
                "experience_years": profile.experience_years,
                "education": profile.education,
                "certifications": profile.certifications,
                "desired_roles": profile.desired_roles,
                "preferred_locations": profile.preferred_locations,
                "preferred_companies": profile.preferred_companies,
                "salary_expectation": profile.salary_expectation,
                "created_at": profile.created_at.isoformat() if profile.created_at else None
            })
        
        # Add job applications
        for app in user.applications:
            user_data["job_applications"].append({
                "id": app.id,
                "job_id": app.job_id,
                "status": app.status,
                "applied_at": app.applied_at.isoformat() if app.applied_at else None,
                "cover_letter": app.cover_letter,
                "custom_resume_url": app.custom_resume_url,
                "notes": app.notes,
                "source": app.source
            })
        
        # Add saved jobs
        for saved in user.saved_jobs:
            user_data["saved_jobs"].append({
                "id": saved.id,
                "job_id": saved.job_id,
                "notes": saved.notes,
                "created_at": saved.created_at.isoformat() if saved.created_at else None
            })
        
        # Add security logs (last 90 days only for privacy)
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        for log in user.security_logs:
            if log.created_at and log.created_at > ninety_days_ago:
                user_data["security_logs"].append({
                    "event_type": log.event_type,
                    "ip_address": log.ip_address,
                    "location": log.location,
                    "severity": log.severity,
                    "created_at": log.created_at.isoformat()
                })
        
        # Add notifications (last 90 days)
        for notif in user.notifications:
            if notif.created_at and notif.created_at > ninety_days_ago:
                user_data["notifications"].append({
                    "type": notif.type,
                    "title": notif.title,
                    "message": notif.message,
                    "read": notif.read,
                    "created_at": notif.created_at.isoformat()
                })
        
        # Get resume analyses
        result = await self.session.execute(
            select(ResumeAnalysis).where(ResumeAnalysis.user_id == user_id)
        )
        analyses = result.scalars().all()
        
        user_data["resume_analyses"] = []
        for analysis in analyses:
            user_data["resume_analyses"].append({
                "id": analysis.id,
                "resume_text": analysis.resume_text,
                "analysis_result": analysis.analysis_result,
                "created_at": analysis.created_at.isoformat() if analysis.created_at else None
            })
        
        # Get audit logs related to this user
        result = await self.session.execute(
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .order_by(AuditLog.timestamp.desc())
            .limit(100)
        )
        audit_logs = result.scalars().all()
        
        user_data["audit_logs"] = []
        for audit in audit_logs:
            user_data["audit_logs"].append({
                "action": audit.action,
                "resource_type": audit.resource_type,
                "resource_id": audit.resource_id,
                "timestamp": audit.timestamp.isoformat() if audit.timestamp else None,
                "ip_address": audit.ip_address
            })
        
        logger.info(f"Data export completed for user {user_id}")
        
        return user_data
    
    async def export_user_data_csv(self, user_id: int) -> str:
        """
        Export user data in CSV format
        
        Args:
            user_id: User ID
            
        Returns:
            CSV string
        """
        data = await self.export_user_data(user_id, format="csv")
        
        # Create CSV output
        output = StringIO()
        
        # Write personal information
        output.write("PERSONAL INFORMATION\n")
        writer = csv.writer(output)
        writer.writerow(["Field", "Value"])
        for key, value in data["personal_information"].items():
            writer.writerow([key, value])
        
        output.write("\n\nRESUME PROFILES\n")
        if data["resume_profiles"]:
            profiles = data["resume_profiles"]
            writer.writerow(profiles[0].keys())
            for profile in profiles:
                writer.writerow(profile.values())
        
        output.write("\n\nJOB APPLICATIONS\n")
        if data["job_applications"]:
            apps = data["job_applications"]
            writer.writerow(apps[0].keys())
            for app in apps:
                writer.writerow(app.values())
        
        return output.getvalue()
    
    async def delete_user_data(
        self,
        user_id: int,
        anonymize: bool = False,
        retain_audit: bool = True
    ) -> Dict[str, Any]:
        """
        Delete or anonymize user data (GDPR Article 17 - Right to Erasure)
        
        Args:
            user_id: User ID
            anonymize: If True, anonymize instead of delete
            retain_audit: If True, retain audit logs
            
        Returns:
            Dictionary with deletion results
        """
        from src.models.user import (
            User, ResumeProfile, JobApplication,
            SavedJob, SecurityLog, Notification
        )
        from src.models.career_recommendation import ResumeAnalysis
        from src.models.permission import AuditLog
        
        logger.info(f"Processing deletion request for user {user_id}, anonymize={anonymize}")
        
        # Get user
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        user = result.scalar_one_or_none()
        
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        deletion_results = {
            "user_id": user_id,
            "deletion_timestamp": datetime.utcnow().isoformat(),
            "anonymized": anonymize,
            "items_deleted": {}
        }
        
        if anonymize:
            # Anonymize user data instead of deleting
            user.email = f"deleted_{user_id}@anonymized.local"
            user.first_name = "Deleted"
            user.last_name = "User"
            user.avatar = None
            user.bio = None
            user.google_id = None
            user.hashed_password = None
            user.mfa_secret = None
            user.mfa_recovery_codes = None
            user.preferences = {}
            user.notification_settings = {}
            user.status = "BANNED"  # Prevent login
            
            deletion_results["items_deleted"]["user"] = "anonymized"
        else:
            # Hard delete cascade
            
            # Delete resume profiles
            result = await self.session.execute(
                delete(ResumeProfile).where(ResumeProfile.user_id == user_id)
            )
            deletion_results["items_deleted"]["resume_profiles"] = result.rowcount
            
            # Delete job applications
            result = await self.session.execute(
                delete(JobApplication).where(JobApplication.user_id == user_id)
            )
            deletion_results["items_deleted"]["job_applications"] = result.rowcount
            
            # Delete saved jobs
            result = await self.session.execute(
                delete(SavedJob).where(SavedJob.user_id == user_id)
            )
            deletion_results["items_deleted"]["saved_jobs"] = result.rowcount
            
            # Delete notifications
            result = await self.session.execute(
                delete(Notification).where(Notification.user_id == user_id)
            )
            deletion_results["items_deleted"]["notifications"] = result.rowcount
            
            # Delete security logs (unless retain_audit is True)
            if not retain_audit:
                result = await self.session.execute(
                    delete(SecurityLog).where(SecurityLog.user_id == user_id)
                )
                deletion_results["items_deleted"]["security_logs"] = result.rowcount
            else:
                # Anonymize security logs
                result = await self.session.execute(
                    select(SecurityLog).where(SecurityLog.user_id == user_id)
                )
                logs = result.scalars().all()
                for log in logs:
                    log.ip_address = "0.0.0.0"
                    log.user_agent = "Anonymized"
                    log.location = "Anonymized"
                deletion_results["items_deleted"]["security_logs"] = "anonymized"
            
            # Delete resume analyses
            result = await self.session.execute(
                delete(ResumeAnalysis).where(ResumeAnalysis.user_id == user_id)
            )
            deletion_results["items_deleted"]["resume_analyses"] = result.rowcount
            
            # Retain audit logs but anonymize user reference
            if retain_audit:
                result = await self.session.execute(
                    select(AuditLog).where(AuditLog.user_id == user_id)
                )
                audit_logs = result.scalars().all()
                for log in audit_logs:
                    log.ip_address = "0.0.0.0"
                deletion_results["items_deleted"]["audit_logs"] = "anonymized"
            else:
                result = await self.session.execute(
                    delete(AuditLog).where(AuditLog.user_id == user_id)
                )
                deletion_results["items_deleted"]["audit_logs"] = result.rowcount
            
            # Delete user
            await self.session.delete(user)
            deletion_results["items_deleted"]["user"] = "deleted"
        
        await self.session.commit()
        
        logger.info(f"User {user_id} data deletion completed: {deletion_results}")
        
        return deletion_results
    
    async def check_data_retention(self) -> Dict[str, Any]:
        """
        Check and enforce data retention policies
        
        Returns:
            Dictionary with retention check results
        """
        from src.models.user import SecurityLog, Notification
        from src.models.permission import AuditLog
        
        logger.info("Running data retention check")
        
        retention_results = {
            "check_timestamp": datetime.utcnow().isoformat(),
            "items_deleted": {}
        }
        
        # Delete security logs older than 2 years
        two_years_ago = datetime.utcnow() - timedelta(days=730)
        result = await self.session.execute(
            delete(SecurityLog).where(SecurityLog.created_at < two_years_ago)
        )
        retention_results["items_deleted"]["security_logs"] = result.rowcount
        
        # Delete read notifications older than 90 days
        ninety_days_ago = datetime.utcnow() - timedelta(days=90)
        result = await self.session.execute(
            delete(Notification).where(
                Notification.read == True,
                Notification.created_at < ninety_days_ago
            )
        )
        retention_results["items_deleted"]["notifications"] = result.rowcount
        
        # Delete old audit logs (keep 3 years for compliance)
        three_years_ago = datetime.utcnow() - timedelta(days=1095)
        result = await self.session.execute(
            delete(AuditLog).where(AuditLog.timestamp < three_years_ago)
        )
        retention_results["items_deleted"]["audit_logs"] = result.rowcount
        
        await self.session.commit()
        
        logger.info(f"Data retention check completed: {retention_results}")
        
        return retention_results


class ConsentService:
    """Service for managing user consent (GDPR Article 7)"""
    
    def __init__(self, session: AsyncSession):
        """
        Initialize consent service
        
        Args:
            session: Database session
        """
        self.session = session
    
    async def record_consent(
        self,
        user_id: int,
        consent_type: str,
        consent_given: bool,
        consent_text: str,
        consent_version: str
    ) -> Dict[str, Any]:
        """
        Record user consent
        
        Args:
            user_id: User ID
            consent_type: Type of consent (privacy_policy, marketing, etc.)
            consent_given: Whether consent was given
            consent_text: Text of consent agreement
            consent_version: Version of consent document
            
        Returns:
            Consent record
        """
        from src.models.gdpr import UserConsent
        
        consent = UserConsent(
            user_id=user_id,
            consent_type=consent_type,
            consent_given=consent_given,
            consent_text=consent_text,
            consent_version=consent_version,
            consent_timestamp=datetime.utcnow()
        )
        
        self.session.add(consent)
        await self.session.commit()
        await self.session.refresh(consent)
        
        logger.info(
            f"Consent recorded for user {user_id}: {consent_type} = {consent_given}"
        )
        
        return {
            "id": consent.id,
            "user_id": consent.user_id,
            "consent_type": consent.consent_type,
            "consent_given": consent.consent_given,
            "consent_version": consent.consent_version,
            "consent_timestamp": consent.consent_timestamp.isoformat()
        }
    
    async def get_user_consents(self, user_id: int) -> List[Dict[str, Any]]:
        """
        Get all consents for a user
        
        Args:
            user_id: User ID
            
        Returns:
            List of consent records
        """
        from src.models.gdpr import UserConsent
        
        result = await self.session.execute(
            select(UserConsent)
            .where(UserConsent.user_id == user_id)
            .order_by(UserConsent.consent_timestamp.desc())
        )
        consents = result.scalars().all()
        
        return [
            {
                "id": c.id,
                "consent_type": c.consent_type,
                "consent_given": c.consent_given,
                "consent_version": c.consent_version,
                "consent_timestamp": c.consent_timestamp.isoformat()
            }
            for c in consents
        ]
    
    async def withdraw_consent(
        self,
        user_id: int,
        consent_type: str
    ) -> Dict[str, Any]:
        """
        Withdraw user consent
        
        Args:
            user_id: User ID
            consent_type: Type of consent to withdraw
            
        Returns:
            Updated consent record
        """
        from src.models.gdpr import UserConsent
        
        # Create new consent record showing withdrawal
        consent = UserConsent(
            user_id=user_id,
            consent_type=consent_type,
            consent_given=False,
            consent_text=f"Consent withdrawn for {consent_type}",
            consent_version="withdrawal",
            consent_timestamp=datetime.utcnow()
        )
        
        self.session.add(consent)
        await self.session.commit()
        
        logger.info(f"Consent withdrawn for user {user_id}: {consent_type}")
        
        return {
            "user_id": user_id,
            "consent_type": consent_type,
            "consent_given": False,
            "timestamp": consent.consent_timestamp.isoformat()
        }

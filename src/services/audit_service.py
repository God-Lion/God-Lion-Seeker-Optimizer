"""Comprehensive audit logging service for tracking all security-sensitive actions"""
from typing import Optional, Any, Dict, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from fastapi import Request
import logging
import json

logger = logging.getLogger(__name__)


class AuditService:
    """
    Comprehensive audit logging service
    
    Tracks:
    - Authentication events (login, logout, password changes)
    - Authorization events (access denied, privilege escalation)
    - Data access events (PII access, downloads, exports)
    - Administrative events (user management, config changes)
    - Security events (attacks, incidents, anomalies)
    """
    
    def __init__(self, session: AsyncSession):
        """
        Initialize audit service
        
        Args:
            session: Database session
        """
        self.session = session
    
    # =========================================================================
    # AUTHENTICATION EVENTS
    # =========================================================================
    
    async def log_successful_login(
        self,
        user_id: int,
        username: str,
        ip_address: str,
        user_agent: Optional[str] = None,
        mfa_used: bool = False,
        login_method: str = "password"
    ) -> None:
        """
        Log successful login
        
        Args:
            user_id: User ID
            username: Username/email
            ip_address: IP address
            user_agent: Browser user agent
            mfa_used: Whether MFA was used
            login_method: Login method (password, oauth, etc.)
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=user_id,
            action="login_success",
            resource_type="authentication",
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity="info",
            extra_metadata=json.dumps({
                "username": username,
                "mfa_used": mfa_used,
                "login_method": login_method
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.info(f"Successful login: user={username}, ip={ip_address}, mfa={mfa_used}")
    
    async def log_failed_login(
        self,
        username: str,
        ip_address: str,
        reason: str,
        user_agent: Optional[str] = None,
        attempt_count: int = 1
    ) -> None:
        """
        Log failed login attempt
        
        Args:
            username: Attempted username/email
            ip_address: IP address
            reason: Failure reason (invalid_password, user_not_found, etc.)
            user_agent: Browser user agent
            attempt_count: Number of consecutive failed attempts
        """
        from src.models.permission import AuditLog
        
        # Determine severity based on attempt count
        severity = "warning" if attempt_count >= 3 else "info"
        
        audit_log = AuditLog(
            user_id=None,  # No user ID for failed login
            action="login_failed",
            resource_type="authentication",
            ip_address=ip_address,
            user_agent=user_agent,
            success=False,
            error_message=reason,
            severity=severity,
            extra_metadata=json.dumps({
                "username": username,
                "reason": reason,
                "attempt_count": attempt_count
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.warning(
            f"Failed login: username={username}, ip={ip_address}, "
            f"reason={reason}, attempts={attempt_count}"
        )
    
    async def log_logout(
        self,
        user_id: int,
        username: str,
        ip_address: str,
        user_agent: Optional[str] = None,
        session_duration: Optional[int] = None
    ) -> None:
        """
        Log user logout
        
        Args:
            user_id: User ID
            username: Username/email
            ip_address: IP address
            user_agent: Browser user agent
            session_duration: Session duration in seconds
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=user_id,
            action="logout",
            resource_type="authentication",
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity="info",
            extra_metadata=json.dumps({
                "username": username,
                "session_duration_seconds": session_duration
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.info(f"User logout: user={username}, ip={ip_address}")
    
    async def log_password_change(
        self,
        user_id: int,
        username: str,
        ip_address: str,
        user_agent: Optional[str] = None,
        initiated_by: str = "user",
        forced: bool = False
    ) -> None:
        """
        Log password change
        
        Args:
            user_id: User ID
            username: Username/email
            ip_address: IP address
            user_agent: Browser user agent
            initiated_by: Who initiated change (user, admin, system)
            forced: Whether change was forced
        """
        from src.models.permission import AuditLog
        
        severity = "warning" if initiated_by == "admin" or forced else "info"
        
        audit_log = AuditLog(
            user_id=user_id,
            action="password_change",
            resource_type="authentication",
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity=severity,
            extra_metadata=json.dumps({
                "username": username,
                "initiated_by": initiated_by,
                "forced": forced
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.info(
            f"Password changed: user={username}, initiated_by={initiated_by}, forced={forced}"
        )
    
    async def log_account_lockout(
        self,
        user_id: Optional[int],
        username: str,
        ip_address: str,
        reason: str,
        user_agent: Optional[str] = None,
        lockout_duration: Optional[int] = None
    ) -> None:
        """
        Log account lockout
        
        Args:
            user_id: User ID (if known)
            username: Username/email
            ip_address: IP address
            reason: Lockout reason
            user_agent: Browser user agent
            lockout_duration: Lockout duration in minutes
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=user_id,
            action="account_lockout",
            resource_type="authentication",
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity="critical",
            extra_metadata=json.dumps({
                "username": username,
                "reason": reason,
                "lockout_duration_minutes": lockout_duration
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.critical(
            f"Account locked: username={username}, ip={ip_address}, reason={reason}"
        )
    
    # =========================================================================
    # AUTHORIZATION EVENTS
    # =========================================================================
    
    async def log_access_denied(
        self,
        user_id: int,
        username: str,
        resource_type: str,
        resource_id: Optional[str],
        action: str,
        ip_address: str,
        user_agent: Optional[str] = None,
        required_permission: Optional[str] = None
    ) -> None:
        """
        Log access denied event
        
        Args:
            user_id: User ID
            username: Username/email
            resource_type: Type of resource
            resource_id: Resource identifier
            action: Attempted action
            ip_address: IP address
            user_agent: Browser user agent
            required_permission: Required permission
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=user_id,
            action="access_denied",
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            success=False,
            error_message=f"Access denied to {action} on {resource_type}",
            severity="warning",
            extra_metadata=json.dumps({
                "username": username,
                "attempted_action": action,
                "required_permission": required_permission
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.warning(
            f"Access denied: user={username}, resource={resource_type}/{resource_id}, "
            f"action={action}, required={required_permission}"
        )
    
    async def log_privilege_escalation(
        self,
        user_id: int,
        username: str,
        old_role: str,
        new_role: str,
        admin_id: int,
        admin_username: str,
        ip_address: str,
        user_agent: Optional[str] = None,
        reason: Optional[str] = None
    ) -> None:
        """
        Log privilege escalation (role change)
        
        Args:
            user_id: Target user ID
            username: Target username
            old_role: Previous role
            new_role: New role
            admin_id: Admin who made the change
            admin_username: Admin username
            ip_address: IP address
            user_agent: Browser user agent
            reason: Reason for change
        """
        from src.models.permission import AuditLog
        
        # Higher severity for admin role grants
        severity = "critical" if "admin" in new_role.lower() else "warning"
        
        audit_log = AuditLog(
            user_id=user_id,
            performed_by_id=admin_id,
            action="privilege_escalation",
            resource_type="user_role",
            resource_id=str(user_id),
            old_value=old_role,
            new_value=new_role,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity=severity,
            extra_metadata=json.dumps({
                "username": username,
                "admin_username": admin_username,
                "reason": reason
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.critical(
            f"Privilege escalation: user={username}, {old_role} -> {new_role}, "
            f"by={admin_username}, reason={reason}"
        )
    
    async def log_permission_change(
        self,
        user_id: int,
        username: str,
        permission: str,
        action: str,  # grant or revoke
        admin_id: int,
        admin_username: str,
        ip_address: str,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Log permission change
        
        Args:
            user_id: Target user ID
            username: Target username
            permission: Permission name
            action: grant or revoke
            admin_id: Admin who made the change
            admin_username: Admin username
            ip_address: IP address
            user_agent: Browser user agent
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=user_id,
            performed_by_id=admin_id,
            action=f"permission_{action}",
            resource_type="user_permission",
            resource_id=str(user_id),
            new_value=permission if action == "grant" else None,
            old_value=permission if action == "revoke" else None,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity="warning",
            extra_metadata=json.dumps({
                "username": username,
                "permission": permission,
                "admin_username": admin_username,
                "action": action
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.warning(
            f"Permission {action}: user={username}, permission={permission}, "
            f"by={admin_username}"
        )
    
    # =========================================================================
    # DATA ACCESS EVENTS
    # =========================================================================
    
    async def log_pii_access(
        self,
        user_id: int,
        username: str,
        data_type: str,
        record_id: str,
        ip_address: str,
        user_agent: Optional[str] = None,
        accessed_fields: Optional[List[str]] = None
    ) -> None:
        """
        Log PII data access
        
        Args:
            user_id: User accessing data
            username: Username
            data_type: Type of PII data
            record_id: Record identifier
            ip_address: IP address
            user_agent: Browser user agent
            accessed_fields: List of PII fields accessed
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=user_id,
            action="pii_access",
            resource_type=data_type,
            resource_id=record_id,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity="info",
            extra_metadata=json.dumps({
                "username": username,
                "data_type": data_type,
                "accessed_fields": accessed_fields or []
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.info(
            f"PII access: user={username}, type={data_type}, record={record_id}"
        )
    
    async def log_resume_download(
        self,
        user_id: int,
        username: str,
        resume_id: int,
        ip_address: str,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Log resume download
        
        Args:
            user_id: User downloading resume
            username: Username
            resume_id: Resume ID
            ip_address: IP address
            user_agent: Browser user agent
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=user_id,
            action="resume_download",
            resource_type="resume",
            resource_id=str(resume_id),
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity="info",
            extra_metadata=json.dumps({
                "username": username,
                "resume_id": resume_id
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.info(f"Resume download: user={username}, resume={resume_id}")
    
    async def log_bulk_data_export(
        self,
        user_id: int,
        username: str,
        export_type: str,
        record_count: int,
        ip_address: str,
        user_agent: Optional[str] = None,
        format: str = "json"
    ) -> None:
        """
        Log bulk data export
        
        Args:
            user_id: User exporting data
            username: Username
            export_type: Type of export
            record_count: Number of records
            ip_address: IP address
            user_agent: Browser user agent
            format: Export format
        """
        from src.models.permission import AuditLog
        
        # Higher severity for large exports
        severity = "warning" if record_count > 1000 else "info"
        
        audit_log = AuditLog(
            user_id=user_id,
            action="bulk_data_export",
            resource_type=export_type,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity=severity,
            extra_metadata=json.dumps({
                "username": username,
                "export_type": export_type,
                "record_count": record_count,
                "format": format
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.warning(
            f"Bulk export: user={username}, type={export_type}, "
            f"records={record_count}, format={format}"
        )
    
    async def log_data_deletion(
        self,
        user_id: int,
        username: str,
        data_type: str,
        record_id: str,
        ip_address: str,
        user_agent: Optional[str] = None,
        permanent: bool = False
    ) -> None:
        """
        Log data deletion
        
        Args:
            user_id: User deleting data
            username: Username
            data_type: Type of data
            record_id: Record identifier
            ip_address: IP address
            user_agent: Browser user agent
            permanent: Whether deletion is permanent
        """
        from src.models.permission import AuditLog
        
        severity = "critical" if permanent else "warning"
        
        audit_log = AuditLog(
            user_id=user_id,
            action="data_deletion",
            resource_type=data_type,
            resource_id=record_id,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity=severity,
            extra_metadata=json.dumps({
                "username": username,
                "data_type": data_type,
                "permanent": permanent
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.critical(
            f"Data deletion: user={username}, type={data_type}, "
            f"record={record_id}, permanent={permanent}"
        )
    
    # =========================================================================
    # ADMINISTRATIVE EVENTS
    # =========================================================================
    
    async def log_configuration_change(
        self,
        admin_id: int,
        admin_username: str,
        setting: str,
        old_value: Optional[str],
        new_value: str,
        ip_address: str,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Log configuration change
        
        Args:
            admin_id: Admin user ID
            admin_username: Admin username
            setting: Configuration setting name
            old_value: Previous value
            new_value: New value
            ip_address: IP address
            user_agent: Browser user agent
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=admin_id,
            action="configuration_change",
            resource_type="system_config",
            resource_id=setting,
            old_value=old_value,
            new_value=new_value,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity="warning",
            extra_metadata=json.dumps({
                "admin_username": admin_username,
                "setting": setting
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.warning(
            f"Configuration change: setting={setting}, old={old_value}, "
            f"new={new_value}, by={admin_username}"
        )
    
    async def log_user_creation(
        self,
        admin_id: int,
        admin_username: str,
        target_user_id: int,
        target_username: str,
        ip_address: str,
        user_agent: Optional[str] = None
    ) -> None:
        """
        Log user creation
        
        Args:
            admin_id: Admin user ID
            admin_username: Admin username
            target_user_id: Created user ID
            target_username: Created username
            ip_address: IP address
            user_agent: Browser user agent
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=target_user_id,
            performed_by_id=admin_id,
            action="user_creation",
            resource_type="user",
            resource_id=str(target_user_id),
            new_value=target_username,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity="info",
            extra_metadata=json.dumps({
                "admin_username": admin_username,
                "target_username": target_username
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.info(
            f"User created: username={target_username}, by={admin_username}"
        )
    
    async def log_user_deletion(
        self,
        admin_id: int,
        admin_username: str,
        target_user_id: int,
        target_username: str,
        ip_address: str,
        user_agent: Optional[str] = None,
        reason: Optional[str] = None
    ) -> None:
        """
        Log user deletion
        
        Args:
            admin_id: Admin user ID
            admin_username: Admin username
            target_user_id: Deleted user ID
            target_username: Deleted username
            ip_address: IP address
            user_agent: Browser user agent
            reason: Deletion reason
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=target_user_id,
            performed_by_id=admin_id,
            action="user_deletion",
            resource_type="user",
            resource_id=str(target_user_id),
            old_value=target_username,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity="critical",
            extra_metadata=json.dumps({
                "admin_username": admin_username,
                "target_username": target_username,
                "reason": reason
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.critical(
            f"User deleted: username={target_username}, by={admin_username}, "
            f"reason={reason}"
        )
    
    async def log_system_settings_change(
        self,
        admin_id: int,
        admin_username: str,
        setting: str,
        ip_address: str,
        user_agent: Optional[str] = None,
        changes: Optional[Dict[str, Any]] = None
    ) -> None:
        """
        Log system settings change
        
        Args:
            admin_id: Admin user ID
            admin_username: Admin username
            setting: Setting category
            ip_address: IP address
            user_agent: Browser user agent
            changes: Dictionary of changes
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=admin_id,
            action="system_settings_change",
            resource_type="system_settings",
            resource_id=setting,
            ip_address=ip_address,
            user_agent=user_agent,
            success=True,
            severity="warning",
            extra_metadata=json.dumps({
                "admin_username": admin_username,
                "setting": setting,
                "changes": changes or {}
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.warning(
            f"System settings changed: setting={setting}, by={admin_username}"
        )
    
    # =========================================================================
    # SECURITY EVENTS
    # =========================================================================
    
    async def log_sql_injection_attempt(
        self,
        ip_address: str,
        payload: str,
        user_agent: Optional[str] = None,
        user_id: Optional[int] = None,
        endpoint: Optional[str] = None
    ) -> None:
        """
        Log SQL injection attempt
        
        Args:
            ip_address: IP address
            payload: Malicious payload
            user_agent: Browser user agent
            user_id: User ID (if authenticated)
            endpoint: API endpoint
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=user_id,
            action="sql_injection_attempt",
            resource_type="security",
            ip_address=ip_address,
            user_agent=user_agent,
            success=False,
            error_message="SQL injection attempt detected and blocked",
            severity="critical",
            extra_metadata=json.dumps({
                "payload": payload[:200],  # Truncate payload
                "endpoint": endpoint
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.critical(
            f"SQL injection attempt: ip={ip_address}, endpoint={endpoint}"
        )
    
    async def log_excessive_failed_logins(
        self,
        username: Optional[str],
        ip_address: str,
        attempt_count: int,
        time_window_minutes: int
    ) -> None:
        """
        Log excessive failed login attempts
        
        Args:
            username: Username (if known)
            ip_address: IP address
            attempt_count: Number of attempts
            time_window_minutes: Time window
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=None,
            action="excessive_failed_logins",
            resource_type="security",
            ip_address=ip_address,
            success=False,
            error_message=f"{attempt_count} failed login attempts in {time_window_minutes} minutes",
            severity="critical",
            extra_metadata=json.dumps({
                "username": username,
                "attempt_count": attempt_count,
                "time_window_minutes": time_window_minutes
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.critical(
            f"Excessive failed logins: ip={ip_address}, attempts={attempt_count}"
        )
    
    async def log_unusual_activity(
        self,
        user_id: int,
        username: str,
        activity_type: str,
        ip_address: str,
        details: Dict[str, Any],
        user_agent: Optional[str] = None
    ) -> None:
        """
        Log unusual activity
        
        Args:
            user_id: User ID
            username: Username
            activity_type: Type of unusual activity
            ip_address: IP address
            details: Activity details
            user_agent: Browser user agent
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=user_id,
            action="unusual_activity",
            resource_type="security",
            ip_address=ip_address,
            user_agent=user_agent,
            success=False,
            error_message=f"Unusual activity detected: {activity_type}",
            severity="warning",
            extra_metadata=json.dumps({
                "username": username,
                "activity_type": activity_type,
                "details": details
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.warning(
            f"Unusual activity: user={username}, type={activity_type}, ip={ip_address}"
        )
    
    async def log_security_incident(
        self,
        incident_type: str,
        severity: str,
        details: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> None:
        """
        Log security incident
        
        Args:
            incident_type: Type of incident
            severity: Severity level
            details: Incident details
            ip_address: IP address (if applicable)
            user_id: User ID (if applicable)
        """
        from src.models.permission import AuditLog
        
        audit_log = AuditLog(
            user_id=user_id,
            action="security_incident",
            resource_type="security",
            ip_address=ip_address,
            success=False,
            error_message=f"Security incident: {incident_type}",
            severity=severity,
            extra_metadata=json.dumps({
                "incident_type": incident_type,
                "details": details
            })
        )
        
        self.session.add(audit_log)
        await self.session.commit()
        
        logger.critical(
            f"Security incident: type={incident_type}, severity={severity}"
        )
    
    # =========================================================================
    # QUERY METHODS
    # =========================================================================
    
    async def get_audit_logs(
        self,
        user_id: Optional[int] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        severity: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Query audit logs with filters
        
        Args:
            user_id: Filter by user ID
            action: Filter by action
            resource_type: Filter by resource type
            severity: Filter by severity
            start_date: Start date filter
            end_date: End date filter
            limit: Maximum results
            offset: Offset for pagination
            
        Returns:
            List of audit log entries
        """
        from src.models.permission import AuditLog
        
        query = select(AuditLog)
        
        # Apply filters
        conditions = []
        
        if user_id:
            conditions.append(AuditLog.user_id == user_id)
        
        if action:
            conditions.append(AuditLog.action == action)
        
        if resource_type:
            conditions.append(AuditLog.resource_type == resource_type)
        
        if severity:
            conditions.append(AuditLog.severity == severity)
        
        if start_date:
            conditions.append(AuditLog.timestamp >= start_date)
        
        if end_date:
            conditions.append(AuditLog.timestamp <= end_date)
        
        if conditions:
            query = query.where(and_(*conditions))
        
        query = query.order_by(AuditLog.timestamp.desc()).limit(limit).offset(offset)
        
        result = await self.session.execute(query)
        logs = result.scalars().all()
        
        return [self._audit_log_to_dict(log) for log in logs]
    
    async def get_audit_log_statistics(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get audit log statistics
        
        Args:
            start_date: Start date
            end_date: End date
            
        Returns:
            Statistics dictionary
        """
        from src.models.permission import AuditLog
        
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=30)
        
        if not end_date:
            end_date = datetime.utcnow()
        
        # Total count
        count_query = select(func.count(AuditLog.id)).where(
            and_(
                AuditLog.timestamp >= start_date,
                AuditLog.timestamp <= end_date
            )
        )
        total_count = await self.session.scalar(count_query)
        
        # Count by severity
        severity_query = select(
            AuditLog.severity,
            func.count(AuditLog.id)
        ).where(
            and_(
                AuditLog.timestamp >= start_date,
                AuditLog.timestamp <= end_date
            )
        ).group_by(AuditLog.severity)
        
        severity_result = await self.session.execute(severity_query)
        severity_counts = dict(severity_result.all())
        
        # Count by action
        action_query = select(
            AuditLog.action,
            func.count(AuditLog.id)
        ).where(
            and_(
                AuditLog.timestamp >= start_date,
                AuditLog.timestamp <= end_date
            )
        ).group_by(AuditLog.action).limit(10)
        
        action_result = await self.session.execute(action_query)
        top_actions = dict(action_result.all())
        
        return {
            "total_events": total_count or 0,
            "date_range": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat()
            },
            "by_severity": severity_counts,
            "top_actions": top_actions
        }
    
    def _audit_log_to_dict(self, log) -> Dict[str, Any]:
        """Convert audit log to dictionary"""
        return {
            "id": log.id,
            "timestamp": log.timestamp.isoformat() if log.timestamp else None,
            "user_id": log.user_id,
            "performed_by_id": log.performed_by_id,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "ip_address": log.ip_address,
            "user_agent": log.user_agent,
            "old_value": log.old_value,
            "new_value": log.new_value,
            "success": log.success,
            "error_message": log.error_message,
            "severity": log.severity,
            "metadata": json.loads(log.metadata) if log.metadata else None
        }

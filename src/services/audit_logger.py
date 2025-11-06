"""
Simplified audit logger wrapper for easy access to audit functionality.
Provides static methods for common audit operations.
"""
from typing import Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Request

from src.services.audit_service import AuditService
from src.models.user import User


class AuditLogger:
    """
    Static wrapper for audit logging operations.
    Provides convenient static methods for logging various actions.
    """
    
    @staticmethod
    async def log_action(
        db: AsyncSession,
        action: str,
        resource_type: str,
        performed_by: User,
        request: Request,
        resource_id: Optional[str] = None,
        old_value: Optional[str] = None,
        new_value: Optional[str] = None,
        success: bool = True,
        error_message: Optional[str] = None,
        severity: str = "info"
    ) -> None:
        """
        Log a generic action
        
        Args:
            db: Database session
            action: Action performed
            resource_type: Type of resource
            performed_by: User who performed the action
            request: FastAPI request object
            resource_id: Resource identifier
            old_value: Old value (for updates)
            new_value: New value (for updates)
            success: Whether action was successful
            error_message: Error message if failed
            severity: Severity level (info, warning, critical)
        """
        from src.models.permission import AuditLog
        
        # Extract request info
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        audit_log = AuditLog(
            user_id=performed_by.id,
            performed_by_id=performed_by.id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            old_value=old_value,
            new_value=new_value,
            success=success,
            error_message=error_message,
            severity=severity
        )
        
        db.add(audit_log)
        await db.commit()
    
    @staticmethod
    async def log_permission_grant(
        db: AsyncSession,
        user: User,
        permission_name: str,
        performed_by: User,
        request: Request,
        reason: Optional[str] = None,
        expires_at: Optional[datetime] = None
    ) -> None:
        """
        Log permission grant
        
        Args:
            db: Database session
            user: User receiving permission
            permission_name: Permission name
            performed_by: User granting permission
            request: FastAPI request object
            reason: Reason for grant
            expires_at: Expiration date
        """
        from src.models.permission import AuditLog
        import json
        
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        metadata = {
            "user_email": user.email,
            "permission": permission_name,
            "granted_by": performed_by.email,
            "reason": reason,
            "expires_at": expires_at.isoformat() if expires_at else None
        }
        
        audit_log = AuditLog(
            user_id=user.id,
            performed_by_id=performed_by.id,
            action="permission_grant",
            resource_type="user_permission",
            resource_id=str(user.id),
            ip_address=ip_address,
            user_agent=user_agent,
            new_value=permission_name,
            success=True,
            severity="warning",
            metadata=json.dumps(metadata)
        )
        
        db.add(audit_log)
        await db.commit()
    
    @staticmethod
    async def log_permission_revoke(
        db: AsyncSession,
        user: User,
        permission_name: str,
        performed_by: User,
        request: Request,
        reason: Optional[str] = None
    ) -> None:
        """
        Log permission revoke
        
        Args:
            db: Database session
            user: User losing permission
            permission_name: Permission name
            performed_by: User revoking permission
            request: FastAPI request object
            reason: Reason for revoke
        """
        from src.models.permission import AuditLog
        import json
        
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        metadata = {
            "user_email": user.email,
            "permission": permission_name,
            "revoked_by": performed_by.email,
            "reason": reason
        }
        
        audit_log = AuditLog(
            user_id=user.id,
            performed_by_id=performed_by.id,
            action="permission_revoke",
            resource_type="user_permission",
            resource_id=str(user.id),
            ip_address=ip_address,
            user_agent=user_agent,
            old_value=permission_name,
            success=True,
            severity="warning",
            metadata=json.dumps(metadata)
        )
        
        db.add(audit_log)
        await db.commit()
    
    @staticmethod
    async def log_role_change(
        db: AsyncSession,
        user: User,
        old_role,
        new_role,
        performed_by: User,
        request: Request,
        reason: Optional[str] = None
    ) -> None:
        """
        Log role change
        
        Args:
            db: Database session
            user: User whose role changed
            old_role: Previous role
            new_role: New role
            performed_by: User who made the change
            request: FastAPI request object
            reason: Reason for change
        """
        from src.models.permission import AuditLog
        import json
        
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        metadata = {
            "user_email": user.email,
            "old_role": old_role.value if hasattr(old_role, 'value') else str(old_role),
            "new_role": new_role.value if hasattr(new_role, 'value') else str(new_role),
            "changed_by": performed_by.email,
            "reason": reason
        }
        
        audit_log = AuditLog(
            user_id=user.id,
            performed_by_id=performed_by.id,
            action="role_change",
            resource_type="user_role",
            resource_id=str(user.id),
            ip_address=ip_address,
            user_agent=user_agent,
            old_value=old_role.value if hasattr(old_role, 'value') else str(old_role),
            new_value=new_role.value if hasattr(new_role, 'value') else str(new_role),
            success=True,
            severity="critical",
            metadata=json.dumps(metadata)
        )
        
        db.add(audit_log)
        await db.commit()

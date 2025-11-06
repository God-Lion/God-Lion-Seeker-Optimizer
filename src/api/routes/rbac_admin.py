"""RBAC admin routes for permission and role management"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, desc
from pydantic import BaseModel, Field

from src.config.database import get_db
from src.models.user import User, UserRole, UserStatus
from src.models.permission import Permission, PermissionType, RolePermission, AuditLog, UserPermission
from src.auth.dependencies import require_admin, require_superadmin, get_current_active_user
from src.auth.rbac_service import RBACService
from src.services.audit_logger import AuditLogger


router = APIRouter(prefix="/api/admin/rbac", tags=["admin-rbac"])


class PermissionResponse(BaseModel):
    id: int
    name: str
    permission_type: str
    description: Optional[str]
    resource: str
    action: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class RolePermissionResponse(BaseModel):
    id: int
    role: str
    permission_id: int
    permission_name: str
    permission_type: str
    is_granted: bool
    created_at: datetime


class UserPermissionResponse(BaseModel):
    id: int
    user_id: int
    user_email: str
    permission_id: int
    permission_name: str
    permission_type: str
    is_granted: bool
    granted_by_id: Optional[int]
    granted_at: datetime
    expires_at: Optional[datetime]
    reason: Optional[str]

    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int]
    performed_by_id: Optional[int]
    action: str
    resource_type: str
    resource_id: Optional[str]
    ip_address: Optional[str]
    old_value: Optional[str]
    new_value: Optional[str]
    success: bool
    error_message: Optional[str]
    severity: str
    created_at: datetime

    class Config:
        from_attributes = True


class GrantPermissionRequest(BaseModel):
    user_id: int
    permission_id: int
    reason: Optional[str] = None
    expires_at: Optional[datetime] = None


class RevokePermissionRequest(BaseModel):
    user_id: int
    permission_id: int
    reason: Optional[str] = None


class AssignRolePermissionRequest(BaseModel):
    role: str
    permission_id: int


class UpdateUserRoleRequest(BaseModel):
    user_id: int
    new_role: str
    reason: Optional[str] = None


@router.get("/permissions", response_model=List[PermissionResponse])
async def get_all_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    resource: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """Get all permissions in the system"""
    
    query = select(Permission)
    
    if resource:
        query = query.filter(Permission.resource == resource)
    if is_active is not None:
        query = query.filter(Permission.is_active == is_active)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    permissions = result.scalars().all()
    
    return [
        PermissionResponse(
            id=p.id,
            name=p.name,
            permission_type=p.permission_type.value,
            description=p.description,
            resource=p.resource,
            action=p.action,
            is_active=p.is_active,
            created_at=p.created_at
        )
        for p in permissions
    ]


@router.get("/roles/{role}/permissions", response_model=List[PermissionResponse])
async def get_role_permissions(
    role: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all permissions for a specific role"""
    
    try:
        user_role = UserRole(role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {role}"
        )
    
    permissions = await RBACService.get_role_permissions(user_role, db)
    
    return [
        PermissionResponse(
            id=p.id,
            name=p.name,
            permission_type=p.permission_type.value,
            description=p.description,
            resource=p.resource,
            action=p.action,
            is_active=p.is_active,
            created_at=p.created_at
        )
        for p in permissions
    ]


@router.post("/roles/{role}/permissions", response_model=dict)
async def assign_permission_to_role(
    role: str,
    request_data: AssignRolePermissionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    """Assign a permission to a role (SUPERADMIN only)"""
    
    try:
        user_role = UserRole(role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {role}"
        )
    
    permission_query = select(Permission).filter(Permission.id == request_data.permission_id)
    result = await db.execute(permission_query)
    permission = result.scalar_one_or_none()
    
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    
    role_permission = await RBACService.assign_role_permission(user_role, request_data.permission_id, db)
    
    await AuditLogger.log_action(
        db=db,
        action="role_permission_assign",
        resource_type="role_permission",
        performed_by=current_user,
        resource_id=f"{role}:{permission.name}",
        new_value=f"role={role}, permission={permission.name}",
        request=request,
        severity="warning"
    )
    
    return {
        "message": f"Permission '{permission.name}' assigned to role '{role}'",
        "role": role,
        "permission": permission.name
    }


@router.delete("/roles/{role}/permissions/{permission_id}", response_model=dict)
async def remove_permission_from_role(
    role: str,
    permission_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_superadmin)
):
    """Remove a permission from a role (SUPERADMIN only)"""
    
    try:
        user_role = UserRole(role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {role}"
        )
    
    permission_query = select(Permission).filter(Permission.id == permission_id)
    result = await db.execute(permission_query)
    permission = result.scalar_one_or_none()
    
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    
    success = await RBACService.remove_role_permission(user_role, permission_id, db)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role permission mapping not found"
        )
    
    await AuditLogger.log_action(
        db=db,
        action="role_permission_remove",
        resource_type="role_permission",
        performed_by=current_user,
        resource_id=f"{role}:{permission.name}",
        old_value=f"role={role}, permission={permission.name}",
        request=request,
        severity="warning"
    )
    
    return {
        "message": f"Permission '{permission.name}' removed from role '{role}'",
        "role": role,
        "permission": permission.name
    }


@router.get("/users/{user_id}/permissions", response_model=List[str])
async def get_user_permissions(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all effective permissions for a specific user"""
    
    user_query = select(User).filter(User.id == user_id)
    result = await db.execute(user_query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    permissions = await RBACService.get_user_permissions(user, db)
    return [perm.value for perm in permissions]


@router.post("/users/permissions/grant", response_model=dict)
async def grant_user_permission(
    request_data: GrantPermissionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Grant a custom permission to a user"""
    
    user_query = select(User).filter(User.id == request_data.user_id)
    result = await db.execute(user_query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    permission_query = select(Permission).filter(Permission.id == request_data.permission_id)
    result = await db.execute(permission_query)
    permission = result.scalar_one_or_none()
    
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    
    user_permission = await RBACService.grant_permission(
        user_id=request_data.user_id,
        permission_id=request_data.permission_id,
        granted_by_id=current_user.id,
        db=db,
        reason=request_data.reason,
        expires_at=request_data.expires_at
    )
    
    await AuditLogger.log_permission_grant(
        db=db,
        user=user,
        permission_name=permission.name,
        performed_by=current_user,
        request=request,
        reason=request_data.reason,
        expires_at=request_data.expires_at
    )
    
    return {
        "message": f"Permission '{permission.name}' granted to user {user.email}",
        "user_id": user.id,
        "permission": permission.name,
        "expires_at": request_data.expires_at.isoformat() if request_data.expires_at else None
    }


@router.post("/users/permissions/revoke", response_model=dict)
async def revoke_user_permission(
    request_data: RevokePermissionRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Revoke a custom permission from a user"""
    
    user_query = select(User).filter(User.id == request_data.user_id)
    result = await db.execute(user_query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    permission_query = select(Permission).filter(Permission.id == request_data.permission_id)
    result = await db.execute(permission_query)
    permission = result.scalar_one_or_none()
    
    if not permission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Permission not found"
        )
    
    success = await RBACService.revoke_permission(
        user_id=request_data.user_id,
        permission_id=request_data.permission_id,
        db=db
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User permission not found"
        )
    
    await AuditLogger.log_permission_revoke(
        db=db,
        user=user,
        permission_name=permission.name,
        performed_by=current_user,
        request=request,
        reason=request_data.reason
    )
    
    return {
        "message": f"Permission '{permission.name}' revoked from user {user.email}",
        "user_id": user.id,
        "permission": permission.name
    }


@router.put("/users/role", response_model=dict)
async def update_user_role(
    request_data: UpdateUserRoleRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a user's role"""
    
    if current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only SUPERADMIN can change user roles"
        )
    
    user_query = select(User).filter(User.id == request_data.user_id)
    result = await db.execute(user_query)
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        new_role = UserRole(request_data.new_role)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role: {request_data.new_role}"
        )
    
    old_role = user.role
    user.role = new_role
    await db.commit()
    
    await AuditLogger.log_role_change(
        db=db,
        user=user,
        old_role=old_role,
        new_role=new_role,
        performed_by=current_user,
        request=request,
        reason=request_data.reason
    )
    
    return {
        "message": f"User role updated from {old_role.value} to {new_role.value}",
        "user_id": user.id,
        "old_role": old_role.value,
        "new_role": new_role.value
    }


@router.get("/audit-logs", response_model=List[AuditLogResponse])
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    severity: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """Get audit logs with filtering (privilege escalations, role changes, etc.)"""
    
    query = select(AuditLog)
    
    if user_id:
        query = query.filter(or_(
            AuditLog.user_id == user_id,
            AuditLog.performed_by_id == user_id
        ))
    
    if action:
        query = query.filter(AuditLog.action == action)
    
    if severity:
        query = query.filter(AuditLog.severity == severity)
    
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)
    
    query = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return [
        AuditLogResponse(
            id=log.id,
            user_id=log.user_id,
            performed_by_id=log.performed_by_id,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            ip_address=log.ip_address,
            old_value=log.old_value,
            new_value=log.new_value,
            success=log.success,
            error_message=log.error_message,
            severity=log.severity,
            created_at=log.created_at
        )
        for log in logs
    ]


@router.get("/audit-logs/unauthorized", response_model=List[AuditLogResponse])
async def get_unauthorized_access_attempts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500)
):
    """Get all unauthorized access attempts"""
    
    query = select(AuditLog).filter(
        and_(
            AuditLog.success == False,
            AuditLog.severity.in_(["warning", "critical"])
        )
    ).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return [
        AuditLogResponse(
            id=log.id,
            user_id=log.user_id,
            performed_by_id=log.performed_by_id,
            action=log.action,
            resource_type=log.resource_type,
            resource_id=log.resource_id,
            ip_address=log.ip_address,
            old_value=log.old_value,
            new_value=log.new_value,
            success=log.success,
            error_message=log.error_message,
            severity=log.severity,
            created_at=log.created_at
        )
        for log in logs
    ]


@router.get("/roles", response_model=List[dict])
async def get_all_roles(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all available roles with their hierarchy levels"""
    
    return [
        {
            "role": role.value,
            "hierarchy_level": RBACService.ROLE_HIERARCHY[role],
            "description": {
                UserRole.GUEST: "Read-only access to public content",
                UserRole.BASIC_USER: "Limited feature access",
                UserRole.PREMIUM_USER: "Full feature access",
                UserRole.MANAGER: "Team oversight and reporting",
                UserRole.ADMIN: "User management and configuration",
                UserRole.SUPERADMIN: "Full system access"
            }.get(role, "")
        }
        for role in UserRole
    ]

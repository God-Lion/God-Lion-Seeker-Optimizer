"""RBAC service for permission checking and role management"""
from typing import List, Optional, Set
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from src.models.user import User, UserRole
from src.models.permission import Permission, PermissionType, RolePermission, UserPermission


class RBACService:
    """Service for Role-Based Access Control operations"""
    
    ROLE_HIERARCHY = {
        UserRole.SUPERADMIN: 6,
        UserRole.ADMIN: 5,
        UserRole.MANAGER: 4,
        UserRole.PREMIUM_USER: 3,
        UserRole.BASIC_USER: 2,
        UserRole.GUEST: 1,
    }
    
    @staticmethod
    async def get_user_permissions(
        user: User,
        db: AsyncSession
    ) -> Set[PermissionType]:
        """Get all permissions for a user (role-based + custom)"""
        permissions = set()
        
        query = select(Permission).join(RolePermission).filter(
            and_(
                RolePermission.role == user.role.value,
                RolePermission.is_granted == True,
                Permission.is_active == True
            )
        )
        result = await db.execute(query)
        role_permissions = result.scalars().all()
        permissions.update(perm.permission_type for perm in role_permissions)
        
        user_perm_query = select(Permission).join(UserPermission).filter(
            and_(
                UserPermission.user_id == user.id,
                UserPermission.is_granted == True,
                Permission.is_active == True,
                (UserPermission.expires_at.is_(None) | (UserPermission.expires_at > datetime.utcnow()))
            )
        )
        result = await db.execute(user_perm_query)
        custom_permissions = result.scalars().all()
        permissions.update(perm.permission_type for perm in custom_permissions)
        
        user_denied_query = select(Permission).join(UserPermission).filter(
            and_(
                UserPermission.user_id == user.id,
                UserPermission.is_granted == False,
                Permission.is_active == True
            )
        )
        result = await db.execute(user_denied_query)
        denied_permissions = result.scalars().all()
        for perm in denied_permissions:
            permissions.discard(perm.permission_type)
        
        return permissions
    
    @staticmethod
    async def has_permission(
        user: User,
        permission: PermissionType,
        db: AsyncSession
    ) -> bool:
        """Check if user has a specific permission"""
        permissions = await RBACService.get_user_permissions(user, db)
        return permission in permissions
    
    @staticmethod
    async def has_any_permission(
        user: User,
        permissions: List[PermissionType],
        db: AsyncSession
    ) -> bool:
        """Check if user has any of the specified permissions"""
        user_permissions = await RBACService.get_user_permissions(user, db)
        return any(perm in user_permissions for perm in permissions)
    
    @staticmethod
    async def has_all_permissions(
        user: User,
        permissions: List[PermissionType],
        db: AsyncSession
    ) -> bool:
        """Check if user has all of the specified permissions"""
        user_permissions = await RBACService.get_user_permissions(user, db)
        return all(perm in user_permissions for perm in permissions)
    
    @staticmethod
    def has_role_hierarchy(user: User, required_role: UserRole) -> bool:
        """Check if user's role is equal to or higher than required role"""
        user_level = RBACService.ROLE_HIERARCHY.get(user.role, 0)
        required_level = RBACService.ROLE_HIERARCHY.get(required_role, 0)
        return user_level >= required_level
    
    @staticmethod
    async def grant_permission(
        user_id: int,
        permission_id: int,
        granted_by_id: int,
        db: AsyncSession,
        reason: Optional[str] = None,
        expires_at: Optional[datetime] = None
    ) -> UserPermission:
        """Grant a custom permission to a user"""
        user_permission = UserPermission(
            user_id=user_id,
            permission_id=permission_id,
            is_granted=True,
            granted_by_id=granted_by_id,
            granted_at=datetime.utcnow(),
            expires_at=expires_at,
            reason=reason
        )
        db.add(user_permission)
        await db.commit()
        await db.refresh(user_permission)
        return user_permission
    
    @staticmethod
    async def revoke_permission(
        user_id: int,
        permission_id: int,
        db: AsyncSession
    ) -> bool:
        """Revoke a custom permission from a user"""
        query = select(UserPermission).filter(
            and_(
                UserPermission.user_id == user_id,
                UserPermission.permission_id == permission_id
            )
        )
        result = await db.execute(query)
        user_permission = result.scalar_one_or_none()
        
        if user_permission:
            await db.delete(user_permission)
            await db.commit()
            return True
        return False
    
    @staticmethod
    async def get_role_permissions(
        role: UserRole,
        db: AsyncSession
    ) -> List[Permission]:
        """Get all permissions for a specific role"""
        query = select(Permission).join(RolePermission).filter(
            and_(
                RolePermission.role == role.value,
                RolePermission.is_granted == True,
                Permission.is_active == True
            )
        )
        result = await db.execute(query)
        return result.scalars().all()
    
    @staticmethod
    async def assign_role_permission(
        role: UserRole,
        permission_id: int,
        db: AsyncSession
    ) -> RolePermission:
        """Assign a permission to a role"""
        role_permission = RolePermission(
            role=role.value,
            permission_id=permission_id,
            is_granted=True
        )
        db.add(role_permission)
        await db.commit()
        await db.refresh(role_permission)
        return role_permission
    
    @staticmethod
    async def remove_role_permission(
        role: UserRole,
        permission_id: int,
        db: AsyncSession
    ) -> bool:
        """Remove a permission from a role"""
        query = select(RolePermission).filter(
            and_(
                RolePermission.role == role.value,
                RolePermission.permission_id == permission_id
            )
        )
        result = await db.execute(query)
        role_permission = result.scalar_one_or_none()
        
        if role_permission:
            await db.delete(role_permission)
            await db.commit()
            return True
        return False

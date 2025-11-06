"""Authentication and authorization dependencies for FastAPI"""
from typing import Optional, List, Callable
from functools import wraps
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import JWTError, jwt
from datetime import datetime

from src.config.database import get_db
from src.models.user import User, UserRole, UserStatus
from src.models.permission import PermissionType
from src.auth.rbac_service import RBACService


security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decode JWT token
        from config.settings import settings
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        user_id: int = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    
    # Check if user can login
    if not user.can_login():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active or is locked"
        )
    
    # Update last activity
    user.last_activity = datetime.utcnow()
    await db.commit()
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user (email verified and active status)"""
    
    if not current_user.is_active():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified or account not active"
        )
    
    return current_user


async def require_admin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Require admin or superadmin role"""
    
    if not current_user.is_admin():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    return current_user


async def require_superadmin(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """Require superadmin role only"""
    
    if current_user.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin privileges required"
        )
    
    return current_user


async def optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None (for guest access)"""
    
    if not credentials:
        return None
    
    try:
        from config.settings import settings
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        user_id: int = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    return user


def require_permission(*permissions: PermissionType):
    """Decorator to require specific permissions"""
    async def permission_checker(
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        has_perm = await RBACService.has_any_permission(current_user, list(permissions), db)
        if not has_perm:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required permissions: {[p.value for p in permissions]}"
            )
        return current_user
    
    return permission_checker


def require_all_permissions(*permissions: PermissionType):
    """Decorator to require all specified permissions"""
    async def permission_checker(
        current_user: User = Depends(get_current_active_user),
        db: AsyncSession = Depends(get_db)
    ) -> User:
        has_all = await RBACService.has_all_permissions(current_user, list(permissions), db)
        if not has_all:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required all permissions: {[p.value for p in permissions]}"
            )
        return current_user
    
    return permission_checker


def require_role(*roles: UserRole):
    """Decorator to require specific roles"""
    async def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required roles: {[r.value for r in roles]}"
            )
        return current_user
    
    return role_checker


def require_role_hierarchy(minimum_role: UserRole):
    """Decorator to require minimum role level (hierarchical)"""
    async def role_checker(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        if not RBACService.has_role_hierarchy(current_user, minimum_role):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required minimum role: {minimum_role.value}"
            )
        return current_user
    
    return role_checker

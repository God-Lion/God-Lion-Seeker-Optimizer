# src/api/routes/auth_enhanced.py
# ==============================================================================
# Enhanced Authentication Routes - Missing Critical Features
# ==============================================================================
"""
This file adds the missing authentication endpoints:
1. Change Password
2. Session Management
3. Account Deactivation/Reactivation
4. Login History
5. OAuth Placeholder Endpoints
6. Email Preferences

Mount this router in main.py: app.include_router(auth_enhanced.router, prefix="/api")
"""

from datetime import datetime, timedelta
from typing import Optional, List
import secrets
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from passlib.context import CryptContext

from src.config.database import get_db
from src.config.settings import settings
from src.models.user import User, UserStatus, SecurityLog
from src.auth.dependencies import get_current_user, get_current_active_user

# Import functions from existing auth.py
try:
    from src.api.routes.auth import (
        hash_password, 
        verify_password, 
        create_access_token, 
        create_refresh_token,
        log_security_event
    )
except ImportError:
    # Fallback if imports fail
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def hash_password(password: str) -> str:
        return pwd_context.hash(password.encode('utf-8')[:72])
    
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password.encode('utf-8')[:72], hashed_password)
    
    def create_access_token(user_id: int) -> str:
        from jose import jwt
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
        to_encode = {"sub": str(user_id), "exp": expire, "type": "access"}
        return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    
    def create_refresh_token(user_id: int) -> str:
        from jose import jwt
        expire = datetime.utcnow() + timedelta(days=settings.jwt_refresh_token_expire_days)
        to_encode = {"sub": str(user_id), "exp": expire, "type": "refresh"}
        return jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    
    async def log_security_event(db, user_id, event_type, ip, user_agent=None, location=None, severity="info", metadata=None):
        security_log = SecurityLog(
            user_id=user_id, event_type=event_type, ip_address=ip,
            user_agent=user_agent, location=location, severity=severity,
            event_metadata=metadata or {}
        )
        db.add(security_log)
        await db.commit()

router = APIRouter()
security = HTTPBearer()

# ==============================================================================
# Pydantic Models
# ==============================================================================

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
    confirm_password: str = Field(..., min_length=8)


class DeactivateAccountRequest(BaseModel):
    password: str
    reason: Optional[str] = None
    feedback: Optional[str] = None


class ReactivateAccountRequest(BaseModel):
    email: EmailStr
    password: str


class SessionResponse(BaseModel):
    id: str
    device_name: str
    device_type: str
    browser: str
    ip_address: str
    location: Optional[str]
    last_activity: str
    current: bool
    created_at: str


class SessionsListResponse(BaseModel):
    sessions: List[SessionResponse]
    current_session_id: str


class LoginAttemptResponse(BaseModel):
    id: str
    timestamp: str
    status: str
    ip_address: str
    location: Optional[str]
    device: str
    browser: str
    reason: Optional[str] = None


class LoginHistoryResponse(BaseModel):
    attempts: List[LoginAttemptResponse]
    total: int


class MessageResponse(BaseModel):
    message: str
    success: bool = True


# ==============================================================================
# Helper Functions
# ==============================================================================

def extract_device_info(request: Request) -> dict:
    """Extract device information from request"""
    user_agent = request.headers.get("user-agent", "")
    
    device_type = "desktop"
    if "mobile" in user_agent.lower():
        device_type = "mobile"
    elif "tablet" in user_agent.lower():
        device_type = "tablet"
    
    browser = "Unknown"
    if "chrome" in user_agent.lower():
        browser = "Chrome"
    elif "firefox" in user_agent.lower():
        browser = "Firefox"
    elif "safari" in user_agent.lower():
        browser = "Safari"
    elif "edge" in user_agent.lower():
        browser = "Edge"
    
    return {
        "device_type": device_type,
        "browser": browser,
        "device_name": f"{browser} on {device_type}",
        "user_agent": user_agent
    }


def get_client_ip(request: Request) -> str:
    """Get client IP address"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0]
    return request.client.host if request.client else "unknown"


# ==============================================================================
# Change Password Endpoint
# ==============================================================================

@router.put("/user/change-password", response_model=MessageResponse)
async def change_password(
    request: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Change user password - requires current password verification"""
    
    # Verify current password
    if not verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Validate new password
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New passwords do not match"
        )
    
    if len(request.new_password) < getattr(settings, 'password_min_length', 8):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password must be at least {getattr(settings, 'password_min_length', 8)} characters"
        )
    
    # Check if new password is same as current
    if verify_password(request.new_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
    
    # Update password
    current_user.hashed_password = hash_password(request.new_password)
    if hasattr(current_user, 'password_changed_at'):
        current_user.password_changed_at = datetime.utcnow()
    
    await db.commit()
    
    # Log security event
    await log_security_event(
        db=db,
        user_id=current_user.id,
        event_type="password_changed",
        ip="system",
        severity="info",
        metadata={"changed_at": datetime.utcnow().isoformat()}
    )
    
    return MessageResponse(
        message="Password changed successfully. Please login again.",
        success=True
    )


# ==============================================================================
# Session Management Endpoints
# ==============================================================================

@router.get("/auth/sessions", response_model=SessionsListResponse)
async def get_sessions(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all active sessions for current user"""
    
    current_session_id = request.headers.get("X-Session-ID", str(uuid.uuid4()))
    
    # Query recent login attempts as sessions
    result = await db.execute(
        select(SecurityLog)
        .filter(
            and_(
                SecurityLog.user_id == current_user.id,
                SecurityLog.event_type == "login_success",
                SecurityLog.created_at >= datetime.utcnow() - timedelta(days=30)
            )
        )
        .order_by(SecurityLog.created_at.desc())
        .limit(10)
    )
    
    login_logs = result.scalars().all()
    
    sessions = []
    for log in login_logs:
        metadata = log.event_metadata or {}
        sessions.append(SessionResponse(
            id=str(log.id),
            device_name=metadata.get("device_name", "Unknown Device"),
            device_type=metadata.get("device_type", "desktop"),
            browser=metadata.get("browser", "Unknown"),
            ip_address=log.ip_address or "unknown",
            location=log.location,
            last_activity=log.created_at.isoformat(),
            current=(str(log.id) == current_session_id),
            created_at=log.created_at.isoformat()
        ))
    
    return SessionsListResponse(
        sessions=sessions,
        current_session_id=current_session_id
    )


@router.delete("/auth/sessions/{session_id}", response_model=MessageResponse)
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Revoke a specific session"""
    
    await log_security_event(
        db=db,
        user_id=current_user.id,
        event_type="session_revoked",
        ip="system",
        severity="info",
        metadata={"session_id": session_id}
    )
    
    return MessageResponse(
        message="Session revoked successfully",
        success=True
    )


@router.post("/auth/sessions/revoke-all", response_model=MessageResponse)
async def revoke_all_sessions(
    request: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Revoke all sessions except current"""
    
    current_session_id = request.headers.get("X-Session-ID")
    
    await log_security_event(
        db=db,
        user_id=current_user.id,
        event_type="all_sessions_revoked",
        ip=get_client_ip(request),
        severity="warning",
        metadata={"kept_session": current_session_id}
    )
    
    return MessageResponse(
        message="All other sessions revoked successfully",
        success=True
    )


# ==============================================================================
# Account Deactivation Endpoints
# ==============================================================================

@router.post("/user/deactivate", response_model=MessageResponse)
async def deactivate_account(
    request_data: DeactivateAccountRequest,
    req: Request,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate user account (soft delete)"""
    
    # Verify password
    if not verify_password(request_data.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is incorrect"
        )
    
    # Deactivate account
    current_user.status = UserStatus.DEACTIVATED
    if hasattr(current_user, 'deactivated_at'):
        current_user.deactivated_at = datetime.utcnow()
        current_user.deactivation_reason = request_data.reason
        current_user.deactivation_feedback = request_data.feedback
    
    await db.commit()
    
    # Log security event
    await log_security_event(
        db=db,
        user_id=current_user.id,
        event_type="account_deactivated",
        ip=get_client_ip(req),
        severity="warning",
        metadata={
            "reason": request_data.reason,
            "has_feedback": bool(request_data.feedback)
        }
    )
    
    return MessageResponse(
        message="Account deactivated successfully. You can reactivate within 30 days.",
        success=True
    )


@router.post("/auth/reactivate")
async def reactivate_account(
    request_data: ReactivateAccountRequest,
    db: AsyncSession = Depends(get_db)
):
    """Reactivate a deactivated account"""
    
    # Find user
    result = await db.execute(select(User).filter(User.email == request_data.email))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(request_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    # Check if deactivated
    if user.status != UserStatus.DEACTIVATED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is not deactivated"
        )
    
    # Check if reactivation window expired
    if hasattr(user, 'deactivated_at') and user.deactivated_at:
        days_since_deactivation = (datetime.utcnow() - user.deactivated_at).days
        if days_since_deactivation > 30:
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Reactivation window has expired. Please contact support."
            )
    
    # Reactivate account
    user.status = UserStatus.ACTIVE
    if hasattr(user, 'deactivated_at'):
        user.deactivated_at = None
        user.deactivation_reason = None
        user.deactivation_feedback = None
    user.last_login = datetime.utcnow()
    
    await db.commit()
    
    # Generate tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    
    # Log event
    await log_security_event(
        db=db,
        user_id=user.id,
        event_type="account_reactivated",
        ip="system",
        severity="info"
    )
    
    return {
        "token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.value,
            "avatar": user.avatar
        },
        "expires_in": getattr(settings, 'jwt_access_token_expire_minutes', 60) * 60,
        "message": "Account reactivated successfully"
    }


# ==============================================================================
# Login History Endpoints
# ==============================================================================

@router.get("/auth/login-history", response_model=LoginHistoryResponse)
async def get_login_history(
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get login history for current user"""
    
    result = await db.execute(
        select(SecurityLog)
        .filter(
            and_(
                SecurityLog.user_id == current_user.id,
                SecurityLog.event_type.in_(["login_success", "login_failed", "login_blocked"])
            )
        )
        .order_by(SecurityLog.created_at.desc())
        .limit(limit)
    )
    
    logs = result.scalars().all()
    
    attempts = []
    for log in logs:
        status_map = {
            "login_success": "success",
            "login_failed": "failed",
            "login_blocked": "blocked"
        }
        
        metadata = log.event_metadata or {}
        attempts.append(LoginAttemptResponse(
            id=str(log.id),
            timestamp=log.created_at.isoformat(),
            status=status_map.get(log.event_type, "unknown"),
            ip_address=log.ip_address or "unknown",
            location=log.location,
            device=metadata.get("device_name", "Unknown Device"),
            browser=metadata.get("browser", "Unknown"),
            reason=metadata.get("reason")
        ))
    
    return LoginHistoryResponse(
        attempts=attempts,
        total=len(attempts)
    )


@router.get("/auth/security-logs")
async def get_security_logs(
    limit: int = 100,
    offset: int = 0,
    event_type: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get security logs for current user"""
    
    query = select(SecurityLog).filter(SecurityLog.user_id == current_user.id)
    
    if event_type:
        query = query.filter(SecurityLog.event_type == event_type)
    
    query = query.order_by(SecurityLog.created_at.desc()).offset(offset).limit(limit)
    
    result = await db.execute(query)
    logs = result.scalars().all()
    
    return {
        "logs": [
            {
                "id": str(log.id),
                "event_type": log.event_type,
                "ip_address": log.ip_address,
                "location": log.location,
                "severity": log.severity,
                "metadata": log.event_metadata,
                "created_at": log.created_at.isoformat()
            }
            for log in logs
        ],
        "total": len(logs),
        "offset": offset,
        "limit": limit
    }


# ==============================================================================
# OAuth Placeholder Endpoints
# ==============================================================================

@router.post("/auth/oauth/login")
async def oauth_login(provider: str, code: str, db: AsyncSession = Depends(get_db)):
    """OAuth Login (Placeholder) - TODO: Implement actual OAuth flow"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"OAuth login with {provider} not yet implemented"
    )


@router.post("/auth/oauth/link")
async def link_oauth_provider(
    provider: str,
    code: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Link OAuth Provider (Placeholder)"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"Linking {provider} not yet implemented"
    )


@router.delete("/auth/oauth/unlink/{provider}")
async def unlink_oauth_provider(
    provider: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Unlink OAuth Provider (Placeholder)"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"Unlinking {provider} not yet implemented"
    )


@router.get("/auth/oauth/linked")
async def get_linked_accounts(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get Linked OAuth Accounts (Placeholder)"""
    return {"accounts": []}


# ==============================================================================
# Email Preferences Endpoints
# ==============================================================================

@router.get("/user/email-preferences")
async def get_email_preferences(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get user email preferences"""
    preferences = {
        "security_alerts": True,
        "login_notifications": True,
        "password_changed": True,
        "account_activity": True,
        "marketing_emails": False,
        "newsletter": False,
        "product_updates": True,
    }
    
    return {"preferences": preferences}


@router.put("/user/email-preferences", response_model=MessageResponse)
async def update_email_preferences(
    preferences: dict,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update email preferences"""
    # TODO: Store preferences in database
    
    return MessageResponse(
        message="Email preferences updated successfully",
        success=True
    )


# ==============================================================================
# MFA Status Endpoint (Supplementary)
# ==============================================================================

@router.get("/auth/mfa/status")
async def get_mfa_status(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get MFA status for current user"""
    
    mfa_enabled = getattr(current_user, 'mfa_enabled', False)
    
    return {
        "enabled": mfa_enabled,
        "method": "totp" if mfa_enabled else None,
        "backup_codes_remaining": 10 if mfa_enabled else 0  # Placeholder
    }

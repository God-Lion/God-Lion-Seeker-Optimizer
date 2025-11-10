"""
Authentication Routes
Handles user registration, login, password reset, and token management
"""
from datetime import datetime, timedelta
from typing import Optional
import secrets
import hashlib
import pyotp
import qrcode
import io
from starlette.responses import StreamingResponse

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import HTTPBearer
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt
from passlib.context import CryptContext

from src.config.database import get_db
from src.config.settings import settings
from src.models.user import User, UserRole, UserStatus, SecurityLog
from src.auth.dependencies import get_current_user, get_current_active_user

router = APIRouter()
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Pydantic Models
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    remember_me: bool = False


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=8)


class TrackFailedLoginRequest(BaseModel):
    email: EmailStr
    ip: str
    location: Optional[str] = None
    user_agent: Optional[str] = None


class TokenResponse(BaseModel):
    token: str
    refresh_token: str
    user: dict
    expires_in: int


class MessageResponse(BaseModel):
    message: str
    success: bool = True

class MfaSetupResponse(BaseModel):
    qr_code: str
    recovery_codes: list[str]

class MfaVerifyRequest(BaseModel):
    code: str


# Helper Functions
def generate_qr_code(otp_uri: str) -> io.BytesIO:
    """Generate a QR code image from an OTP URI"""
    img = qrcode.make(otp_uri)
    buf = io.BytesIO()
    img.save(buf)
    buf.seek(0)
    return buf

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    # Bcrypt has a 72 byte limit, truncate if necessary
    password_bytes = password.encode('utf-8')[:72]
    return pwd_context.hash(password_bytes)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    # Bcrypt has a 72 byte limit, truncate if necessary
    password_bytes = plain_password.encode('utf-8')[:72]
    return pwd_context.verify(password_bytes, hashed_password)


def create_access_token(user_id: int, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access"
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def create_refresh_token(user_id: int) -> str:
    """Create JWT refresh token"""
    expire = datetime.utcnow() + timedelta(days=settings.jwt_refresh_token_expire_days)
    
    to_encode = {
        "sub": str(user_id),
        "exp": expire,
        "type": "refresh"
    }
    
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def generate_verification_token() -> str:
    """Generate a secure verification token"""
    return secrets.token_urlsafe(32)


def send_verification_email(email: str, token: str):
    """Send verification email (placeholder - implement with actual email service)"""
    # TODO: Implement actual email sending
    verification_link = f"{settings.frontend_url}/auth/verify-email/{token}"
    print(f"Verification email would be sent to {email} with link: {verification_link}")


def send_password_reset_email(email: str, token: str):
    """Send password reset email (placeholder - implement with actual email service)"""
    # TODO: Implement actual email sending
    reset_link = f"{settings.frontend_url}/auth/reset-password/{token}"
    print(f"Password reset email would be sent to {email} with link: {reset_link}")


def send_account_locked_email(email: str, ip: str, location: Optional[str]):
    """Send account locked notification email"""
    # TODO: Implement actual email sending
    print(f"Account locked email would be sent to {email}. IP: {ip}, Location: {location}")


async def log_security_event(
    db: AsyncSession,
    user_id: Optional[int],
    event_type: str,
    ip: str,
    user_agent: Optional[str] = None,
    location: Optional[str] = None,
    severity: str = "info",
    metadata: Optional[dict] = None
):
    """Log security event"""
    security_log = SecurityLog(
        user_id=user_id,
        event_type=event_type,
        ip_address=ip,
        user_agent=user_agent,
        location=location,
        severity=severity,
        event_metadata=metadata or {}
    )
    db.add(security_log)
    await db.commit()


# Routes
@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: RegisterRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user account
    
    - Creates user with pending verification status
    - Sends verification email
    - Returns success message
    """
    # Check if user already exists
    result = await db.execute(select(User).filter(User.email == request.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password strength
    if len(request.password) < settings.password_min_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password must be at least {settings.password_min_length} characters"
        )
    
    # Create verification token
    verification_token = generate_verification_token()
    
    # Create new user
    new_user = User(
        email=request.email,
        hashed_password=hash_password(request.password),
        first_name=request.first_name,
        last_name=request.last_name,
        role=UserRole.USER,
        status=UserStatus.PENDING_VERIFICATION,
        email_verified=False,
        email_verification_token=verification_token
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Send verification email in background
    background_tasks.add_task(send_verification_email, request.email, verification_token)
    
    return MessageResponse(
        message=f"Verification email sent to {request.email}",
        success=True
    )


@router.get("/verify-email/{token}", response_model=MessageResponse)
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    """
    Verify user email with token
    
    - Validates verification token
    - Activates user account
    - Returns success message with redirect
    """
    result = await db.execute(select(User).filter(User.email_verification_token == token))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )
    
    # Update user status
    user.email_verified = True
    user.status = UserStatus.ACTIVE
    user.email_verification_token = None
    
    await db.commit()
    
    return MessageResponse(
        message="Email verified successfully. You can now sign in.",
        success=True
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT tokens
    
    - Validates credentials
    - Checks account status and lockout
    - Returns access and refresh tokens
    """
    try:
        # Find user
        result = await db.execute(select(User).filter(User.email == request.email))
        user = result.scalar_one_or_none()
        
        if not user or not verify_password(request.password, user.hashed_password):
            # Log failed login attempt
            if user:
                user.failed_login_attempts += 1
                
                # Lock account after max attempts
                if user.failed_login_attempts >= settings.max_login_attempts:
                    user.account_locked_until = datetime.utcnow() + timedelta(
                        minutes=settings.account_lockout_duration_minutes
                    )
                    await db.commit()
                    
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Account locked due to too many failed login attempts. Try again in {settings.account_lockout_duration_minutes} minutes."
                    )
                
                await db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        # Check if account can login
        if not user.can_login():
            if user.account_locked_until and user.account_locked_until > datetime.utcnow():
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is temporarily locked. Please try again later."
                )
            elif not user.email_verified:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Please verify your email before logging in"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is not active"
                )
        
        # Reset failed login attempts
        user.failed_login_attempts = 0
        user.last_login = datetime.utcnow()
        user.last_activity = datetime.utcnow()
        await db.commit()

        # If MFA is enabled, return a response indicating that MFA is required
        if user.mfa_enabled:
            return {"mfa_required": True}
        
        # Create tokens
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        
        # Prepare user data
        user_data = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.value,
            "avatar": user.avatar
        }
        
        return TokenResponse(
            token=access_token,
            refresh_token=refresh_token,
            user=user_data,
            expires_in=settings.jwt_access_token_expire_minutes * 60
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login. Please try again."
        )


@router.post("/track-failed-login")
async def track_failed_login(
    request: TrackFailedLoginRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Track failed login attempts and lock account if needed
    
    - Increments failed login counter
    - Locks account after max attempts
    - Sends notification email
    """
    result = await db.execute(select(User).filter(User.email == request.email))
    user = result.scalar_one_or_none()
    
    if not user:
        return {"message": "User not found"}
    
    user.failed_login_attempts += 1
    
    # Log security event
    await log_security_event(
        db=db,
        user_id=user.id,
        event_type="login_failed",
        ip=request.ip,
        user_agent=request.user_agent,
        location=request.location,
        severity="warning"
    )
    
    # Check if account should be locked
    if user.failed_login_attempts >= settings.max_login_attempts:
        user.account_locked_until = datetime.utcnow() + timedelta(
            minutes=settings.account_lockout_duration_minutes
        )
        
        # Send notification email
        background_tasks.add_task(
            send_account_locked_email,
            user.email,
            request.ip,
            request.location
        )
        
        await db.commit()
        
        return {
            "attempts_remaining": 0,
            "locked": True,
            "lockout_duration": settings.account_lockout_duration_minutes,
            "email_sent": True
        }
    
    await db.commit()
    
    return {
        "attempts_remaining": settings.max_login_attempts - user.failed_login_attempts,
        "locked": False
    }


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
):
    """
    Initiate password reset process
    
    - Generates reset token
    - Sends reset email
    - Returns success message
    """
    result = await db.execute(select(User).filter(User.email == request.email))
    user = result.scalar_one_or_none()
    
    # Always return success to prevent email enumeration
    if not user:
        return MessageResponse(
            message="If the email exists, a reset link has been sent",
            success=True
        )
    
    # Generate reset token
    reset_token = generate_verification_token()
    user.password_reset_token = reset_token
    user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
    
    await db.commit()
    
    # Send reset email
    background_tasks.add_task(send_password_reset_email, user.email, reset_token)
    
    return MessageResponse(
        message="If the email exists, a reset link has been sent",
        success=True
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Reset password with token
    
    - Validates reset token
    - Updates password
    - Clears reset token
    """
    result = await db.execute(select(User).filter(User.password_reset_token == request.token))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Check if token is expired
    if user.password_reset_expires and user.password_reset_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    # Validate password
    if len(request.new_password) < settings.password_min_length:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Password must be at least {settings.password_min_length} characters"
        )
    
    # Update password
    user.hashed_password = hash_password(request.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    user.failed_login_attempts = 0
    user.account_locked_until = None
    
    await db.commit()
    
    return MessageResponse(
        message="Password reset successfully",
        success=True
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    credentials: str = Depends(security),
    db: AsyncSession = Depends(get_db)
):
    """
    Refresh access token using refresh token
    
    - Validates refresh token
    - Issues new access token
    - Returns new token pair
    """
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm]
        )
        
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user_id = int(payload.get("sub"))
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user or not user.can_login():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid user or account not active"
            )
        
        # Create new tokens
        access_token = create_access_token(user.id)
        refresh_token = create_refresh_token(user.id)
        
        user_data = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role": user.role.value,
            "avatar": user.avatar
        }
        
        return TokenResponse(
            token=access_token,
            refresh_token=refresh_token,
            user=user_data,
            expires_in=settings.jwt_access_token_expire_minutes * 60
        )
        
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )


@router.post("/logout", response_model=MessageResponse)
async def logout(current_user: User = Depends(get_current_active_user)):
    """
    Logout current user
    
    - Invalidates session (client-side token removal)
    - Returns success message
    """
    # In a production system, you might want to:
    # 1. Add token to blacklist
    # 2. Clear refresh token from database
    # 3. Log the logout event
    
    return MessageResponse(
        message="Logged out successfully",
        success=True
    )


@router.get("/session")
async def get_session(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Get current session information
    
    - Returns user data
    - Returns session expiry
    """
    return {
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "first_name": current_user.first_name,
            "last_name": current_user.last_name,
            "full_name": current_user.full_name,
            "role": current_user.role.value,
            "status": current_user.status.value,
            "avatar": current_user.avatar,
            "email_verified": current_user.email_verified
        },
        "session_expiry": (datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)).isoformat()
    }

@router.post("/mfa/setup", response_model=MfaSetupResponse)
async def mfa_setup(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    """
    Set up MFA for the current user.

    - Generates a new MFA secret and recovery codes.
    - Returns a QR code and recovery codes.
    """
    if current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is already enabled for this account."
        )

    # Generate a new MFA secret
    mfa_secret = pyotp.random_base32()
    current_user.mfa_secret = mfa_secret

    # Generate recovery codes
    recovery_codes = [secrets.token_hex(8) for _ in range(10)]
    current_user.mfa_recovery_codes = recovery_codes

    await db.commit()

    # Generate OTP URI for the QR code
    otp_uri = pyotp.totp.TOTP(mfa_secret).provisioning_uri(
        name=current_user.email,
        issuer_name=settings.app_name
    )

    # Generate and return the QR code
    qr_code = generate_qr_code(otp_uri)
    return StreamingResponse(qr_code, media_type="image/png")

@router.post("/mfa/verify", response_model=MessageResponse)
async def mfa_verify(request: MfaVerifyRequest, current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    """
    Verify the MFA code and enable MFA for the user.

    - Verifies the TOTP code.
    - Enables MFA for the user.
    """
    if not current_user.mfa_secret:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not set up for this account."
        )

    totp = pyotp.TOTP(current_user.mfa_secret)
    if not totp.verify(request.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid MFA code."
        )

    current_user.mfa_enabled = True
    await db.commit()

    return MessageResponse(message="MFA enabled successfully.")

@router.post("/mfa/disable", response_model=MessageResponse)
async def mfa_disable(current_user: User = Depends(get_current_active_user), db: AsyncSession = Depends(get_db)):
    """
    Disable MFA for the current user.

    - Disables MFA.
    - Clears the MFA secret and recovery codes.
    """
    if not current_user.mfa_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MFA is not enabled for this account."
        )

    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    current_user.mfa_recovery_codes = None
    await db.commit()

    return MessageResponse(message="MFA disabled successfully.")

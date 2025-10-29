"""
Automation Routes
Handles automated job application configuration and monitoring
"""
from datetime import datetime, timedelta
from typing import List, Optional
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc

from src.config.database import get_db
from src.models.user import User, JobApplication, ResumeProfile
from src.models.job import Job
from src.auth.dependencies import get_current_active_user

router = APIRouter()


# Pydantic Models
class AutomationConfigResponse(BaseModel):
    enabled: bool
    profile_id: Optional[int] = None
    keywords: List[str] = []
    daily_limit: int = 10
    auto_apply: bool = False
    notify_on_application: bool = True


class AutomationConfigUpdateRequest(BaseModel):
    enabled: Optional[bool] = None
    profile_id: Optional[int] = None
    keywords: Optional[List[str]] = None
    daily_limit: Optional[int] = Field(None, ge=1, le=100)
    auto_apply: Optional[bool] = None
    notify_on_application: Optional[bool] = None


class AutomationStatusResponse(BaseModel):
    running: bool
    applications_today: int
    daily_limit: int
    last_application: Optional[datetime] = None
    next_run: Optional[datetime] = None


class AutomationStartResponse(BaseModel):
    job_id: str
    status: str
    message: str


class AutomationHistoryItem(BaseModel):
    id: int
    job_id: int
    job_title: str
    company_name: str
    applied_at: datetime
    status: str
    automated: bool


class MessageResponse(BaseModel):
    message: str
    success: bool = True


# In-memory automation state (in production, use Redis or database)
automation_state = {}


def get_automation_config(user_id: int, db: Session) -> dict:
    """Get automation configuration from user preferences"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.preferences:
        return {
            "enabled": False,
            "profile_id": None,
            "keywords": [],
            "daily_limit": 10,
            "auto_apply": False,
            "notify_on_application": True
        }
    
    automation_config = user.preferences.get("automation", {})
    return {
        "enabled": automation_config.get("enabled", False),
        "profile_id": automation_config.get("profile_id"),
        "keywords": automation_config.get("keywords", []),
        "daily_limit": automation_config.get("daily_limit", 10),
        "auto_apply": automation_config.get("auto_apply", False),
        "notify_on_application": automation_config.get("notify_on_application", True)
    }


def save_automation_config(user_id: int, config: dict, db: Session):
    """Save automation configuration to user preferences"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return
    
    if not user.preferences:
        user.preferences = {}
    
    user.preferences["automation"] = config
    db.commit()


def get_applications_today(user_id: int, db: Session) -> int:
    """Get count of applications made today"""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    count = db.query(JobApplication).filter(
        JobApplication.user_id == user_id,
        JobApplication.applied_at >= today_start,
        JobApplication.source == "automated"
    ).count()
    
    return count


# Routes
@router.get("/config", response_model=AutomationConfigResponse)
async def get_config(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get automation configuration
    
    - Returns current automation settings
    """
    config = get_automation_config(current_user.id, db)
    return AutomationConfigResponse(**config)


@router.put("/config", response_model=MessageResponse)
async def update_config(
    request: AutomationConfigUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update automation configuration
    
    - Updates automation settings
    - Validates profile exists if profile_id provided
    """
    # Get current config
    config = get_automation_config(current_user.id, db)
    
    # Update fields
    if request.enabled is not None:
        config["enabled"] = request.enabled
    
    if request.profile_id is not None:
        # Validate profile exists and belongs to user
        profile = db.query(ResumeProfile).filter(
            ResumeProfile.id == request.profile_id,
            ResumeProfile.user_id == current_user.id
        ).first()
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profile not found"
            )
        
        config["profile_id"] = request.profile_id
    
    if request.keywords is not None:
        config["keywords"] = request.keywords
    
    if request.daily_limit is not None:
        config["daily_limit"] = request.daily_limit
    
    if request.auto_apply is not None:
        config["auto_apply"] = request.auto_apply
    
    if request.notify_on_application is not None:
        config["notify_on_application"] = request.notify_on_application
    
    # Save config
    save_automation_config(current_user.id, config, db)
    
    return MessageResponse(
        message="Automation configuration updated successfully",
        success=True
    )


@router.post("/start", response_model=AutomationStartResponse)
async def start_automation(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Start automation process
    
    - Validates configuration
    - Starts automated job application
    - Returns job ID for monitoring
    """
    # Get config
    config = get_automation_config(current_user.id, db)
    
    if not config["enabled"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Automation is not enabled. Please enable it in settings."
        )
    
    if not config["profile_id"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No profile selected. Please select a profile for automation."
        )
    
    if not config["keywords"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No keywords configured. Please add job search keywords."
        )
    
    # Check daily limit
    applications_today = get_applications_today(current_user.id, db)
    if applications_today >= config["daily_limit"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Daily application limit ({config['daily_limit']}) reached. Try again tomorrow."
        )
    
    # Check if already running
    if current_user.id in automation_state and automation_state[current_user.id].get("running"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Automation is already running"
        )
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    
    # Update state
    automation_state[current_user.id] = {
        "running": True,
        "job_id": job_id,
        "started_at": datetime.utcnow(),
        "applications_count": 0
    }
    
    # TODO: Start actual automation process in background
    # This would typically use Celery, background tasks, or similar
    
    return AutomationStartResponse(
        job_id=job_id,
        status="running",
        message="Automation started successfully"
    )


@router.post("/stop", response_model=MessageResponse)
async def stop_automation(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Stop automation process
    
    - Stops running automation
    - Returns success message
    """
    if current_user.id not in automation_state or not automation_state[current_user.id].get("running"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Automation is not running"
        )
    
    # Update state
    automation_state[current_user.id]["running"] = False
    automation_state[current_user.id]["stopped_at"] = datetime.utcnow()
    
    # TODO: Stop actual automation process
    
    return MessageResponse(
        message="Automation stopped successfully",
        success=True
    )


@router.get("/status", response_model=AutomationStatusResponse)
async def get_status(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get automation status
    
    - Returns current running status
    - Shows applications count for today
    - Shows last application time
    """
    config = get_automation_config(current_user.id, db)
    applications_today = get_applications_today(current_user.id, db)
    
    # Get last application
    last_app = db.query(JobApplication).filter(
        JobApplication.user_id == current_user.id,
        JobApplication.source == "automated"
    ).order_by(desc(JobApplication.applied_at)).first()
    
    # Check if running
    running = False
    if current_user.id in automation_state:
        running = automation_state[current_user.id].get("running", False)
    
    return AutomationStatusResponse(
        running=running,
        applications_today=applications_today,
        daily_limit=config["daily_limit"],
        last_application=last_app.applied_at if last_app else None,
        next_run=None  # TODO: Calculate next scheduled run
    )


@router.get("/history", response_model=List[AutomationHistoryItem])
async def get_history(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get automation history
    
    - Returns list of automated applications
    - Paginated results
    """
    offset = (page - 1) * limit
    
    applications = db.query(JobApplication, Job).join(
        Job, JobApplication.job_id == Job.id
    ).filter(
        JobApplication.user_id == current_user.id,
        JobApplication.source == "automated"
    ).order_by(desc(JobApplication.applied_at)).offset(offset).limit(limit).all()
    
    return [
        AutomationHistoryItem(
            id=app.id,
            job_id=job.id,
            job_title=job.title,
            company_name=job.company_name,
            applied_at=app.applied_at,
            status=app.status,
            automated=True
        )
        for app, job in applications
    ]


@router.get("/stats")
async def get_automation_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get automation statistics
    
    - Total automated applications
    - Success rate
    - Average per day
    """
    # Total automated applications
    total_automated = db.query(JobApplication).filter(
        JobApplication.user_id == current_user.id,
        JobApplication.source == "automated"
    ).count()
    
    # Applications in last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    last_30_days = db.query(JobApplication).filter(
        JobApplication.user_id == current_user.id,
        JobApplication.source == "automated",
        JobApplication.applied_at >= thirty_days_ago
    ).count()
    
    # Success rate (interviews + offers)
    successful = db.query(JobApplication).filter(
        JobApplication.user_id == current_user.id,
        JobApplication.source == "automated",
        JobApplication.status.in_(["interviewing", "offered"])
    ).count()
    
    success_rate = (successful / total_automated * 100) if total_automated > 0 else 0
    
    # Average per day (last 30 days)
    avg_per_day = last_30_days / 30 if last_30_days > 0 else 0
    
    return {
        "total_automated_applications": total_automated,
        "last_30_days": last_30_days,
        "success_rate": round(success_rate, 2),
        "average_per_day": round(avg_per_day, 2),
        "successful_applications": successful
    }

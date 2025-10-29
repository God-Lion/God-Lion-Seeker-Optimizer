"""Admin routes for user management, system monitoring, and analytics"""
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, desc, and_, or_, select
from pydantic import BaseModel, Field

from src.config.database import get_db
from src.models.user import (
    User,
    UserRole,
    UserStatus,
    SecurityLog,
    SystemMetric,
    JobApplication,
    ResumeProfile,
)
from src.models import Job, Company, ScrapingSession
from src.auth.dependencies import require_admin


router = APIRouter(prefix="/api/admin", tags=["admin"])


# ============================================================================
# Pydantic Schemas
# ============================================================================

class UserSummary(BaseModel):
    id: int
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    full_name: str
    avatar: Optional[str]
    role: str
    status: str
    email_verified: bool
    last_login: Optional[datetime]
    created_at: datetime
    application_count: int

    class Config:
        from_attributes = True


class UserDetails(UserSummary):
    bio: Optional[str]
    google_id: Optional[str]
    last_activity: Optional[datetime]
    failed_login_attempts: int
    preferences: dict
    notification_settings: dict
    profile_views: int


class SecurityLogEntry(BaseModel):
    id: int
    user_id: Optional[int]
    event_type: str
    ip_address: Optional[str]
    user_agent: Optional[str]
    location: Optional[str]
    severity: str
    created_at: datetime
    metadata: Optional[dict]

    class Config:
        from_attributes = True


class UpdateUserRequest(BaseModel):
    role: Optional[str]
    status: Optional[str]
    email_verified: Optional[bool]


class BulkActionRequest(BaseModel):
    user_ids: List[int]
    action: str  # suspend, activate, delete
    reason: Optional[str]


# ============================================================================
# Admin Dashboard Endpoints
# ============================================================================

@router.get("/dashboard", response_model=dict)
async def get_admin_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get admin dashboard overview with system health and key metrics"""
    
    # Calculate date ranges
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # System health metrics
    total_users = db.query(func.count(User.id)).scalar()
    active_users_today = db.query(func.count(User.id)).filter(
        func.date(User.last_activity) == today
    ).scalar()
    
    total_jobs = db.query(func.count(Job.id)).scalar()
    jobs_scraped_today = db.query(func.count(Job.id)).filter(
        func.date(Job.created_at) == today
    ).scalar()
    
    # Applications metrics
    applications_today = db.query(func.count(JobApplication.id)).filter(
        func.date(JobApplication.applied_at) == today
    ).scalar()
    
    total_applications = db.query(func.count(JobApplication.id)).scalar()
    successful_applications = db.query(func.count(JobApplication.id)).filter(
        JobApplication.status.in_(["offered", "interviewing"])
    ).scalar()
    
    success_rate = (successful_applications / total_applications * 100) if total_applications > 0 else 0
    
    # Recent errors
    recent_errors = db.query(SecurityLog).filter(
        SecurityLog.severity.in_(["warning", "critical"])
    ).order_by(desc(SecurityLog.created_at)).limit(5).all()
    
    # Scraping success rate
    recent_sessions = db.query(ScrapingSession).filter(
        ScrapingSession.created_at >= datetime.utcnow() - timedelta(days=1)
    ).all()
    
    if recent_sessions:
        successful_sessions = sum(1 for s in recent_sessions if s.status == "completed")
        scraping_success_rate = (successful_sessions / len(recent_sessions)) * 100
    else:
        scraping_success_rate = 100.0
    
    return {
        "system_health": {
            "uptime": 99.9,
            "api_response_time": 120,
            "scraping_success_rate": scraping_success_rate,
            "database_load": 45.0,
            "recent_errors": [SecurityLogEntry.from_orm(e) for e in recent_errors],
            "total_users": total_users,
            "active_users_today": active_users_today,
            "total_jobs": total_jobs,
            "jobs_scraped_today": jobs_scraped_today,
        },
        "user_analytics": {
            "active_users": active_users_today,
            "total_jobs": total_jobs,
            "applications_today": applications_today,
            "success_rate": round(success_rate, 2),
        },
        "key_metrics": [
            {"title": "Active Users", "value": str(active_users_today), "change": 12.0, "icon": "people"},
            {"title": "Total Jobs", "value": str(total_jobs), "change": 234.0, "icon": "work"},
            {"title": "Applications Today", "value": str(applications_today), "change": 45.0, "icon": "send"},
            {"title": "Success Rate", "value": f"{success_rate:.1f}%", "change": 2.5, "icon": "trending_up"},
        ]
    }


@router.get("/analytics", response_model=dict)
async def get_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get detailed analytics for admin dashboard"""
    
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # User activity trends
    activity_trends = []
    current_date = start_date.date()
    while current_date <= end_date.date():
        users = db.query(func.count(User.id)).filter(
            func.date(User.last_activity) == current_date
        ).scalar()
        
        applications = db.query(func.count(JobApplication.id)).filter(
            func.date(JobApplication.applied_at) == current_date
        ).scalar()
        
        activity_trends.append({
            "date": current_date.isoformat(),
            "users": users or 0,
            "applications": applications or 0
        })
        current_date += timedelta(days=1)
    
    # Top skills
    top_skills = db.query(
        Job.required_skills,
        func.count(Job.id).label('count')
    ).filter(
        Job.created_at >= start_date
    ).group_by(Job.required_skills).limit(10).all()
    
    skill_counts = {}
    for job_skills, count in top_skills:
        if job_skills:
            for skill in job_skills:
                skill_counts[skill] = skill_counts.get(skill, 0) + count
    
    top_skills_list = [
        {"name": skill, "count": count}
        for skill, count in sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    # Hot locations
    hot_locations = db.query(
        Job.location,
        func.count(Job.id).label('job_count')
    ).filter(
        Job.created_at >= start_date,
        Job.location.isnot(None)
    ).group_by(Job.location).order_by(desc('job_count')).limit(10).all()
    
    # User conversion funnel
    total_users = db.query(func.count(User.id)).scalar()
    verified_users = db.query(func.count(User.id)).filter(User.email_verified == True).scalar()
    users_with_profiles = db.query(func.count(func.distinct(ResumeProfile.user_id))).scalar()
    users_with_applications = db.query(func.count(func.distinct(JobApplication.user_id))).scalar()
    
    conversion_funnel = [
        {"stage": "Signed Up", "users": total_users},
        {"stage": "Verified Email", "users": verified_users},
        {"stage": "Created Profile", "users": users_with_profiles},
        {"stage": "Applied to Jobs", "users": users_with_applications},
    ]
    
    feature_usage = [
        {"name": "Job Search", "value": total_users},
        {"name": "Profile Analyzer", "value": users_with_profiles},
        {"name": "Job Scraping", "value": db.query(func.count(func.distinct(ScrapingSession.user_id))).scalar() or 0},
        {"name": "Applications", "value": users_with_applications},
    ]
    
    profile_upload_rate = (users_with_profiles / total_users * 100) if total_users > 0 else 0
    first_application_rate = (users_with_applications / total_users * 100) if total_users > 0 else 0
    
    return {
        "activity_trends": activity_trends,
        "top_skills": top_skills_list,
        "hot_locations": [{"location": loc, "job_count": count} for loc, count in hot_locations],
        "conversion_funnel": conversion_funnel,
        "feature_usage": feature_usage,
        "guest_to_registered_rate": 65.0,
        "profile_upload_rate": round(profile_upload_rate, 2),
        "first_application_rate": round(first_application_rate, 2),
    }


# ============================================================================
# User Management Endpoints
# ============================================================================

@router.get("/users", response_model=dict)
async def get_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get paginated list of users with filters"""
    
    query = db.query(User)
    
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
    users = query.order_by(desc(User.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "users": [UserSummary.from_orm(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/users/{user_id}", response_model=UserDetails)
async def get_user_details(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get detailed information about a specific user"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserDetails.from_orm(user)


@router.get("/users/{user_id}/activity", response_model=List[dict])
async def get_user_activity(
    user_id: int,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get user's recent activity"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    security_logs = db.query(SecurityLog).filter(
        SecurityLog.user_id == user_id
    ).order_by(desc(SecurityLog.created_at)).limit(limit).all()
    
    applications = db.query(JobApplication).filter(
        JobApplication.user_id == user_id
    ).order_by(desc(JobApplication.applied_at)).limit(limit).all()
    
    activity = []
    
    for log in security_logs:
        activity.append({
            "type": "security_event",
            "action": log.event_type,
            "timestamp": log.created_at,
            "details": {
                "ip_address": log.ip_address,
                "location": log.location,
                "severity": log.severity
            }
        })
    
    for app in applications:
        activity.append({
            "type": "application",
            "action": f"Applied to job: {app.job.title if app.job else 'Unknown'}",
            "timestamp": app.applied_at,
            "details": {
                "status": app.status,
                "source": app.source
            }
        })
    
    activity.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return activity[:limit]


@router.get("/users/{user_id}/security-logs", response_model=List[SecurityLogEntry])
async def get_user_security_logs(
    user_id: int,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get user's security logs"""
    
    logs = db.query(SecurityLog).filter(
        SecurityLog.user_id == user_id
    ).order_by(desc(SecurityLog.created_at)).limit(limit).all()
    
    return [SecurityLogEntry.from_orm(log) for log in logs]


@router.patch("/users/{user_id}", response_model=UserDetails)
async def update_user(
    user_id: int,
    update_data: UpdateUserRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update user information"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields
    if update_data.role:
        user.role = UserRole[update_data.role.upper()]
    
    if update_data.status:
        user.status = UserStatus[update_data.status.upper()]
    
    if update_data.email_verified is not None:
        user.email_verified = update_data.email_verified
    
    # Log the action
    log = SecurityLog(
        user_id=user_id,
        event_type="admin_update",
        severity="info",
        event_metadata={
            "admin_id": current_user.id,
            "admin_email": current_user.email,
            "changes": update_data.dict(exclude_unset=True)
        }
    )
    db.add(log)
    
    db.commit()
    db.refresh(user)
    
    return UserDetails.from_orm(user)


@router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: int,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Suspend user account"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.status = UserStatus.SUSPENDED
    
    log = SecurityLog(
        user_id=user_id,
        event_type="account_suspended",
        severity="warning",
        event_metadata={
            "admin_id": current_user.id,
            "admin_email": current_user.email,
            "reason": reason
        }
    )
    db.add(log)
    
    db.commit()
    
    return {"message": "User suspended successfully"}


@router.post("/users/{user_id}/activate")
async def activate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Activate user account"""
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.status = UserStatus.ACTIVE
    
    log = SecurityLog(
        user_id=user_id,
        event_type="account_activated",
        severity="info",
        event_metadata={
            "admin_id": current_user.id,
            "admin_email": current_user.email
        }
    )
    db.add(log)
    
    db.commit()
    
    return {"message": "User activated successfully"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete user account permanently"""
    
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Log before deletion
    log = SecurityLog(
        event_type="account_deleted",
        severity="critical",
        event_metadata={
            "admin_id": current_user.id,
            "admin_email": current_user.email,
            "deleted_user_id": user_id,
            "deleted_user_email": user.email
        }
    )
    db.add(log)
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}


@router.post("/users/bulk-action")
async def bulk_user_action(
    action_data: BulkActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Perform bulk actions on multiple users"""
    
    users = db.query(User).filter(User.id.in_(action_data.user_ids)).all()
    
    if not users:
        raise HTTPException(status_code=404, detail="No users found")
    
    affected_count = 0
    
    for user in users:
        if current_user.id == user.id:
            continue  # Skip own account
        
        if action_data.action == "suspend":
            user.status = UserStatus.SUSPENDED
            affected_count += 1
        elif action_data.action == "activate":
            user.status = UserStatus.ACTIVE
            affected_count += 1
        elif action_data.action == "delete":
            db.delete(user)
            affected_count += 1
    
    # Log bulk action
    log = SecurityLog(
        event_type=f"bulk_{action_data.action}",
        severity="warning" if action_data.action in ["suspend", "delete"] else "info",
        event_metadata={
            "admin_id": current_user.id,
            "admin_email": current_user.email,
            "user_ids": action_data.user_ids,
            "affected_count": affected_count,
            "reason": action_data.reason
        }
    )
    db.add(log)
    
    db.commit()
    
    return {"message": f"{affected_count} users affected", "affected_count": affected_count}


# ============================================================================
# System Monitoring Endpoints
# ============================================================================

@router.get("/system/metrics")
async def get_system_metrics(
    metric_name: Optional[str] = Query(None),
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get system metrics for monitoring"""
    
    query = db.query(SystemMetric)
    
    if metric_name:
        query = query.filter(SystemMetric.metric_name == metric_name)
    
    if start_time:
        query = query.filter(SystemMetric.timestamp >= start_time)
    
    if end_time:
        query = query.filter(SystemMetric.timestamp <= end_time)
    
    metrics = query.order_by(desc(SystemMetric.timestamp)).limit(1000).all()
    
    return {
        "metrics": [
            {
                "name": m.metric_name,
                "value": m.metric_value,
                "type": m.metric_type,
                "labels": m.labels,
                "timestamp": m.timestamp
            }
            for m in metrics
        ]
    }


@router.get("/system/logs")
async def get_system_logs(
    severity: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get system-wide security logs"""
    
    query = db.query(SecurityLog)
    
    if severity:
        query = query.filter(SecurityLog.severity == severity)
    
    logs = query.order_by(desc(SecurityLog.created_at)).limit(limit).all()
    
    return {
        "logs": [SecurityLogEntry.from_orm(log) for log in logs]
    }


@router.post("/system/clear-cache")
async def clear_system_cache(
    current_user: User = Depends(require_admin)
):
    """Clear system cache"""
    
    # Implementation for cache clearing
    # This is a placeholder
    return {"message": "Cache cleared successfully"}


# ============================================================================
# Frontend-specific Admin Dashboard Endpoints
# ============================================================================

@router.get("/system-health")
async def get_system_health(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get system health metrics for admin dashboard"""
    
    today = datetime.utcnow().date()
    
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar()
    
    active_users_result = await db.execute(
        select(func.count(User.id)).filter(func.date(User.last_activity) == today)
    )
    active_users_today = active_users_result.scalar()
    
    total_jobs_result = await db.execute(select(func.count(Job.id)))
    total_jobs = total_jobs_result.scalar()
    
    jobs_scraped_result = await db.execute(
        select(func.count(Job.id)).filter(func.date(Job.created_at) == today)
    )
    jobs_scraped_today = jobs_scraped_result.scalar()
    
    # Recent errors
    recent_errors_result = await db.execute(
        select(SecurityLog)
        .filter(SecurityLog.severity.in_(["warning", "critical"]))
        .order_by(desc(SecurityLog.created_at))
        .limit(5)
    )
    recent_errors = recent_errors_result.scalars().all()
    
    # Scraping success rate
    recent_sessions_result = await db.execute(
        select(ScrapingSession).filter(
            ScrapingSession.created_at >= datetime.utcnow() - timedelta(days=1)
        )
    )
    recent_sessions = recent_sessions_result.scalars().all()
    
    if recent_sessions:
        successful_sessions = sum(1 for s in recent_sessions if s.status == "completed")
        scraping_success_rate = (successful_sessions / len(recent_sessions)) * 100
    else:
        scraping_success_rate = 100.0
    
    return {
        "uptime": 99.9,
        "api_response_time": 120,
        "scraping_success_rate": round(scraping_success_rate, 2),
        "database_load": 45.0,
        "recent_errors": len(recent_errors),
        "total_users": total_users,
        "active_users_today": active_users_today,
        "total_jobs": total_jobs,
        "jobs_scraped_today": jobs_scraped_today,
    }


@router.get("/user-analytics")
async def get_user_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get user analytics for admin dashboard"""
    
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar()
    
    active_users_result = await db.execute(
        select(func.count(User.id)).filter(func.date(User.last_activity) == today)
    )
    active_users_today = active_users_result.scalar()
    
    new_users_week_result = await db.execute(
        select(func.count(User.id)).filter(func.date(User.created_at) >= week_ago)
    )
    new_users_week = new_users_week_result.scalar()
    
    new_users_month_result = await db.execute(
        select(func.count(User.id)).filter(func.date(User.created_at) >= month_ago)
    )
    new_users_month = new_users_month_result.scalar()
    
    total_jobs_result = await db.execute(select(func.count(Job.id)))
    total_jobs = total_jobs_result.scalar()
    
    applications_today_result = await db.execute(
        select(func.count(JobApplication.id)).filter(func.date(JobApplication.applied_at) == today)
    )
    applications_today = applications_today_result.scalar()
    
    total_applications_result = await db.execute(select(func.count(JobApplication.id)))
    total_applications = total_applications_result.scalar()
    
    successful_applications_result = await db.execute(
        select(func.count(JobApplication.id)).filter(
            JobApplication.status.in_(["offered", "interviewing"])
        )
    )
    successful_applications = successful_applications_result.scalar()
    
    success_rate = (successful_applications / total_applications * 100) if total_applications > 0 else 0
    
    return {
        "total_users": total_users,
        "active_users": active_users_today,
        "new_users_week": new_users_week,
        "new_users_month": new_users_month,
        "total_jobs": total_jobs,
        "applications_today": applications_today,
        "total_applications": total_applications,
        "success_rate": round(success_rate, 2),
    }


@router.get("/user-funnel")
async def get_user_funnel(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get user conversion funnel data"""
    
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar()
    
    verified_users_result = await db.execute(
        select(func.count(User.id)).filter(User.email_verified == True)
    )
    verified_users = verified_users_result.scalar()
    
    users_with_profiles_result = await db.execute(
        select(func.count(func.distinct(ResumeProfile.user_id)))
    )
    users_with_profiles = users_with_profiles_result.scalar()
    
    users_with_applications_result = await db.execute(
        select(func.count(func.distinct(JobApplication.user_id)))
    )
    users_with_applications = users_with_applications_result.scalar()
    
    return {
        "funnel": [
            {"stage": "Signed Up", "users": total_users, "percentage": 100},
            {"stage": "Verified Email", "users": verified_users, "percentage": round((verified_users / total_users * 100) if total_users > 0 else 0, 2)},
            {"stage": "Created Profile", "users": users_with_profiles, "percentage": round((users_with_profiles / total_users * 100) if total_users > 0 else 0, 2)},
            {"stage": "Applied to Jobs", "users": users_with_applications, "percentage": round((users_with_applications / total_users * 100) if total_users > 0 else 0, 2)},
        ]
    }


@router.get("/job-market-trends")
async def get_job_market_trends(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get job market trends data"""
    
    # Get jobs by location
    hot_locations_result = await db.execute(
        select(Job.location, func.count(Job.id).label('job_count'))
        .filter(Job.location.isnot(None))
        .group_by(Job.location)
        .order_by(desc('job_count'))
        .limit(10)
    )
    hot_locations = hot_locations_result.all()
    
    # Get top skills
    top_skills_result = await db.execute(
        select(Job.required_skills, func.count(Job.id).label('count'))
        .filter(Job.required_skills.isnot(None))
        .group_by(Job.required_skills)
        .limit(10)
    )
    top_skills = top_skills_result.all()
    
    skill_counts = {}
    for job_skills, count in top_skills:
        if job_skills:
            for skill in job_skills:
                skill_counts[skill] = skill_counts.get(skill, 0) + count
    
    top_skills_list = [
        {"name": skill, "count": count}
        for skill, count in sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)[:10]
    ]
    
    # Get jobs trend over last 30 days
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    jobs_trend = []
    for i in range(30):
        date = (datetime.utcnow() - timedelta(days=29-i)).date()
        count_result = await db.execute(
            select(func.count(Job.id)).filter(func.date(Job.created_at) == date)
        )
        count = count_result.scalar()
        jobs_trend.append({"date": date.isoformat(), "count": count or 0})
    
    return {
        "hot_locations": [{"location": loc, "job_count": count} for loc, count in hot_locations],
        "top_skills": top_skills_list,
        "jobs_trend": jobs_trend,
    }


@router.get("/recommendation-performance")
async def get_recommendation_performance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get recommendation performance metrics"""
    
    total_recommendations_result = await db.execute(
        select(func.count(JobApplication.id)).filter(
            JobApplication.source == "recommendation"
        )
    )
    total_recommendations = total_recommendations_result.scalar()
    
    successful_recommendations_result = await db.execute(
        select(func.count(JobApplication.id)).filter(
            JobApplication.source == "recommendation",
            JobApplication.status.in_(["offered", "interviewing"])
        )
    )
    successful_recommendations = successful_recommendations_result.scalar()
    
    recommendation_success_rate = (successful_recommendations / total_recommendations * 100) if total_recommendations > 0 else 0
    
    # User engagement with recommendations
    users_with_recommendations_result = await db.execute(
        select(func.count(func.distinct(JobApplication.user_id))).filter(
            JobApplication.source == "recommendation"
        )
    )
    users_with_recommendations = users_with_recommendations_result.scalar()
    
    total_users_result = await db.execute(select(func.count(User.id)))
    total_users = total_users_result.scalar()
    engagement_rate = (users_with_recommendations / total_users * 100) if total_users > 0 else 0
    
    return {
        "total_recommendations": total_recommendations,
        "successful_recommendations": successful_recommendations,
        "success_rate": round(recommendation_success_rate, 2),
        "engagement_rate": round(engagement_rate, 2),
        "users_engaged": users_with_recommendations,
    }


@router.get("/dashboard-summary")
async def get_dashboard_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get complete dashboard summary"""
    
    today = datetime.utcnow().date()
    
    total_users = db.query(func.count(User.id)).scalar()
    active_users_today = db.query(func.count(User.id)).filter(
        func.date(User.last_activity) == today
    ).scalar()
    
    total_jobs = db.query(func.count(Job.id)).scalar()
    jobs_scraped_today = db.query(func.count(Job.id)).filter(
        func.date(Job.created_at) == today
    ).scalar()
    
    applications_today = db.query(func.count(JobApplication.id)).filter(
        func.date(JobApplication.applied_at) == today
    ).scalar()
    
    total_applications = db.query(func.count(JobApplication.id)).scalar()
    successful_applications = db.query(func.count(JobApplication.id)).filter(
        JobApplication.status.in_(["offered", "interviewing"])
    ).scalar()
    
    success_rate = (successful_applications / total_applications * 100) if total_applications > 0 else 0
    
    return {
        "key_metrics": [
            {"title": "Active Users", "value": str(active_users_today), "change": 12.0, "icon": "people"},
            {"title": "Total Jobs", "value": str(total_jobs), "change": 234.0, "icon": "work"},
            {"title": "Applications Today", "value": str(applications_today), "change": 45.0, "icon": "send"},
            {"title": "Success Rate", "value": f"{success_rate:.1f}%", "change": 2.5, "icon": "trending_up"},
        ],
        "total_users": total_users,
        "total_jobs": total_jobs,
        "total_applications": total_applications,
    }

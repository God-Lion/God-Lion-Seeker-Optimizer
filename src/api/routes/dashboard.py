"""
Dashboard Routes
Provides overview statistics, recent activity, and recommendations
"""
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from src.config.database import get_db
from src.models.user import User, JobApplication, ResumeProfile
from src.models.job import Job
from src.auth.dependencies import get_current_active_user

router = APIRouter()


# Pydantic Models
class StatsResponse(BaseModel):
    applications_count: int
    interviews_scheduled: int
    saved_jobs: int
    profile_views: int


class RecentApplicationResponse(BaseModel):
    id: int
    job_title: str
    company_name: str
    status: str
    applied_at: datetime


class UpcomingInterviewResponse(BaseModel):
    id: int
    job_title: str
    company_name: str
    scheduled_at: datetime
    type: str


class JobRecommendationResponse(BaseModel):
    job_id: int
    title: str
    company_name: str
    location: str
    match_score: float
    posted_date: Optional[str] = None


class RecentActivityResponse(BaseModel):
    type: str
    description: str
    timestamp: datetime


class DashboardOverviewResponse(BaseModel):
    stats: StatsResponse
    recent_applications: List[RecentApplicationResponse]
    upcoming_interviews: List[UpcomingInterviewResponse]
    recommendations: List[JobRecommendationResponse]
    recent_activity: List[RecentActivityResponse]


# Routes
@router.get("/overview", response_model=DashboardOverviewResponse)
async def get_dashboard_overview(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard overview with stats and recent activity
    
    - Returns application statistics
    - Shows recent applications
    - Lists upcoming interviews
    - Provides job recommendations
    - Shows recent activity
    """
    
    # Get statistics
    applications_count = db.query(func.count(JobApplication.id)).filter(
        JobApplication.user_id == current_user.id
    ).scalar() or 0
    
    interviews_count = db.query(func.count(JobApplication.id)).filter(
        JobApplication.user_id == current_user.id,
        JobApplication.status == "interviewing"
    ).scalar() or 0
    
    # For saved jobs, we'd need a SavedJob model - using placeholder
    saved_jobs_count = 0
    
    stats = StatsResponse(
        applications_count=applications_count,
        interviews_scheduled=interviews_count,
        saved_jobs=saved_jobs_count,
        profile_views=current_user.profile_views
    )
    
    # Get recent applications (last 5)
    recent_apps = db.query(JobApplication, Job).join(
        Job, JobApplication.job_id == Job.id
    ).filter(
        JobApplication.user_id == current_user.id
    ).order_by(desc(JobApplication.applied_at)).limit(5).all()
    
    recent_applications = [
        RecentApplicationResponse(
            id=app.id,
            job_title=job.title,
            company_name=job.company_name,
            status=app.status,
            applied_at=app.applied_at
        )
        for app, job in recent_apps
    ]
    
    # Get upcoming interviews
    upcoming_interviews_data = db.query(JobApplication, Job).join(
        Job, JobApplication.job_id == Job.id
    ).filter(
        JobApplication.user_id == current_user.id,
        JobApplication.status == "interviewing",
        JobApplication.interview_dates.isnot(None)
    ).order_by(JobApplication.applied_at).limit(5).all()
    
    upcoming_interviews = []
    for app, job in upcoming_interviews_data:
        if app.interview_dates and len(app.interview_dates) > 0:
            # Get the next interview date
            interview_date = app.interview_dates[0] if isinstance(app.interview_dates, list) else None
            if interview_date:
                upcoming_interviews.append(
                    UpcomingInterviewResponse(
                        id=app.id,
                        job_title=job.title,
                        company_name=job.company_name,
                        scheduled_at=datetime.fromisoformat(interview_date) if isinstance(interview_date, str) else interview_date,
                        type="Technical Interview"  # Placeholder
                    )
                )
    
    # Get job recommendations (top 5 recent jobs matching user profile)
    # This is a simplified version - in production, use ML-based recommendations
    recommendations = []
    active_profile = db.query(ResumeProfile).filter(
        ResumeProfile.user_id == current_user.id,
        ResumeProfile.is_active == True
    ).first()
    
    if active_profile and active_profile.skills:
        # Get recent jobs
        recent_jobs = db.query(Job).filter(
            Job.created_at >= datetime.utcnow() - timedelta(days=7)
        ).order_by(desc(Job.created_at)).limit(10).all()
        
        for job in recent_jobs:
            # Simple matching based on skills in description
            match_score = 0.0
            if job.description and active_profile.skills:
                description_lower = job.description.lower()
                matched_skills = sum(1 for skill in active_profile.skills if skill.lower() in description_lower)
                match_score = (matched_skills / len(active_profile.skills)) * 100 if active_profile.skills else 0
            
            if match_score > 30:  # Only show jobs with >30% match
                recommendations.append(
                    JobRecommendationResponse(
                        job_id=job.id,
                        title=job.title,
                        company_name=job.company_name,
                        location=job.location or "Remote",
                        match_score=round(match_score, 1),
                        posted_date=job.posted_date
                    )
                )
        
        # Sort by match score and limit to 5
        recommendations = sorted(recommendations, key=lambda x: x.match_score, reverse=True)[:5]
    
    # Get recent activity
    recent_activity = []
    
    # Add recent applications to activity
    for app, job in recent_apps[:3]:
        recent_activity.append(
            RecentActivityResponse(
                type="application",
                description=f"Applied to {job.title} at {job.company_name}",
                timestamp=app.applied_at
            )
        )
    
    # Add profile updates
    profiles = db.query(ResumeProfile).filter(
        ResumeProfile.user_id == current_user.id
    ).order_by(desc(ResumeProfile.updated_at)).limit(2).all()
    
    for profile in profiles:
        if profile.updated_at:
            recent_activity.append(
                RecentActivityResponse(
                    type="profile_update",
                    description=f"Updated profile: {profile.name}",
                    timestamp=profile.updated_at
                )
            )
    
    # Sort activity by timestamp
    recent_activity = sorted(recent_activity, key=lambda x: x.timestamp, reverse=True)[:5]
    
    return DashboardOverviewResponse(
        stats=stats,
        recent_applications=recent_applications,
        upcoming_interviews=upcoming_interviews,
        recommendations=recommendations,
        recent_activity=recent_activity
    )


@router.get("/stats", response_model=StatsResponse)
async def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics only
    
    - Returns key metrics for user
    """
    applications_count = db.query(func.count(JobApplication.id)).filter(
        JobApplication.user_id == current_user.id
    ).scalar() or 0
    
    interviews_count = db.query(func.count(JobApplication.id)).filter(
        JobApplication.user_id == current_user.id,
        JobApplication.status == "interviewing"
    ).scalar() or 0
    
    saved_jobs_count = 0  # Placeholder
    
    return StatsResponse(
        applications_count=applications_count,
        interviews_scheduled=interviews_count,
        saved_jobs=saved_jobs_count,
        profile_views=current_user.profile_views
    )


@router.get("/recent-applications", response_model=List[RecentApplicationResponse])
async def get_recent_applications(
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get recent job applications
    
    - Returns list of recent applications
    - Ordered by application date
    """
    recent_apps = db.query(JobApplication, Job).join(
        Job, JobApplication.job_id == Job.id
    ).filter(
        JobApplication.user_id == current_user.id
    ).order_by(desc(JobApplication.applied_at)).limit(limit).all()
    
    return [
        RecentApplicationResponse(
            id=app.id,
            job_title=job.title,
            company_name=job.company_name,
            status=app.status,
            applied_at=app.applied_at
        )
        for app, job in recent_apps
    ]


@router.get("/recommendations", response_model=List[JobRecommendationResponse])
async def get_recommendations(
    limit: int = 10,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get personalized job recommendations
    
    - Based on active profile
    - Matches skills and preferences
    """
    active_profile = db.query(ResumeProfile).filter(
        ResumeProfile.user_id == current_user.id,
        ResumeProfile.is_active == True
    ).first()
    
    if not active_profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active profile found. Please set an active profile first."
        )
    
    recommendations = []
    
    # Get recent jobs
    recent_jobs = db.query(Job).filter(
        Job.created_at >= datetime.utcnow() - timedelta(days=30)
    ).order_by(desc(Job.created_at)).limit(50).all()
    
    for job in recent_jobs:
        # Calculate match score
        match_score = 0.0
        if job.description and active_profile.skills:
            description_lower = job.description.lower()
            matched_skills = sum(1 for skill in active_profile.skills if skill.lower() in description_lower)
            match_score = (matched_skills / len(active_profile.skills)) * 100 if active_profile.skills else 0
        
        # Location matching
        if active_profile.preferred_locations and job.location:
            if any(loc.lower() in job.location.lower() for loc in active_profile.preferred_locations):
                match_score += 10
        
        if match_score > 20:
            recommendations.append(
                JobRecommendationResponse(
                    job_id=job.id,
                    title=job.title,
                    company_name=job.company_name,
                    location=job.location or "Remote",
                    match_score=round(match_score, 1),
                    posted_date=job.posted_date
                )
            )
    
    # Sort by match score and limit
    recommendations = sorted(recommendations, key=lambda x: x.match_score, reverse=True)[:limit]
    
    return recommendations

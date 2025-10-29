"""
Enhanced Jobs Endpoints
Additional endpoints for job saving, applying, and enhanced search
"""
from datetime import datetime
from typing import Optional, List
import os

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_

from src.config.database import get_db
from src.models.user import User, JobApplication, ResumeProfile, SavedJob
from src.models.job import Job
from src.auth.dependencies import get_current_active_user, optional_user

router = APIRouter()


# Pydantic Models
class SaveJobResponse(BaseModel):
    success: bool
    message: str
    saved_job_id: int


class ApplyToJobRequest(BaseModel):
    profile_id: int
    cover_letter: Optional[str] = None


class ApplyToJobResponse(BaseModel):
    application_id: int
    success: bool
    message: str


class JobSearchResult(BaseModel):
    id: int
    title: str
    company_name: str
    location: Optional[str]
    description_preview: Optional[str]
    job_type: Optional[str]
    experience_level: Optional[str]
    posted_date: Optional[str]
    url: str
    is_saved: bool = False


class JobSearchResponse(BaseModel):
    jobs: List[JobSearchResult]
    total: int
    pages: int
    current_page: int
    is_guest: bool


class SavedJobItem(BaseModel):
    id: int
    job_id: int
    job_title: str
    company_name: str
    location: Optional[str]
    saved_at: datetime
    notes: Optional[str]


class MessageResponse(BaseModel):
    message: str
    success: bool = True


# Routes
@router.post("/{job_id}/save", response_model=SaveJobResponse)
async def save_job(
    job_id: int,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Save/bookmark a job for later
    
    - Requires authentication
    - Prevents duplicate saves
    - Optional notes can be added
    """
    # Check if job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check if already saved
    existing_save = db.query(SavedJob).filter(
        SavedJob.user_id == current_user.id,
        SavedJob.job_id == job_id
    ).first()
    
    if existing_save:
        # Update notes if provided
        if notes:
            existing_save.notes = notes
            db.commit()
        
        return SaveJobResponse(
            success=True,
            message="Job already saved",
            saved_job_id=existing_save.id
        )
    
    # Create new saved job
    saved_job = SavedJob(
        user_id=current_user.id,
        job_id=job_id,
        notes=notes
    )
    
    db.add(saved_job)
    db.commit()
    db.refresh(saved_job)
    
    return SaveJobResponse(
        success=True,
        message=f"Job '{job.title}' saved successfully",
        saved_job_id=saved_job.id
    )


@router.delete("/{job_id}/save", response_model=MessageResponse)
async def unsave_job(
    job_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Remove a job from saved/bookmarked jobs
    
    - Requires authentication
    - Returns success even if job wasn't saved
    """
    saved_job = db.query(SavedJob).filter(
        SavedJob.user_id == current_user.id,
        SavedJob.job_id == job_id
    ).first()
    
    if saved_job:
        db.delete(saved_job)
        db.commit()
        return MessageResponse(
            message="Job removed from saved jobs",
            success=True
        )
    
    return MessageResponse(
        message="Job was not in saved jobs",
        success=True
    )


@router.get("/saved", response_model=List[SavedJobItem])
async def get_saved_jobs(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all saved/bookmarked jobs for current user
    
    - Returns paginated list
    - Includes job details
    """
    offset = (page - 1) * limit
    
    saved_jobs = db.query(SavedJob, Job).join(
        Job, SavedJob.job_id == Job.id
    ).filter(
        SavedJob.user_id == current_user.id
    ).order_by(desc(SavedJob.created_at)).offset(offset).limit(limit).all()
    
    return [
        SavedJobItem(
            id=saved.id,
            job_id=job.id,
            job_title=job.title,
            company_name=job.company_name if hasattr(job, 'company_name') else "Unknown",
            location=job.location or job.place,
            saved_at=saved.created_at,
            notes=saved.notes
        )
        for saved, job in saved_jobs
    ]


@router.post("/{job_id}/apply", response_model=ApplyToJobResponse)
async def apply_to_job(
    job_id: int,
    request: ApplyToJobRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Apply to a job
    
    - Requires authentication
    - Requires active profile
    - Creates application record
    - Prevents duplicate applications
    """
    # Check if job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )
    
    # Check if profile exists and belongs to user
    profile = db.query(ResumeProfile).filter(
        ResumeProfile.id == request.profile_id,
        ResumeProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Check if already applied
    existing_application = db.query(JobApplication).filter(
        JobApplication.user_id == current_user.id,
        JobApplication.job_id == job_id
    ).first()
    
    if existing_application:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already applied to this job"
        )
    
    # Create application
    application = JobApplication(
        user_id=current_user.id,
        job_id=job_id,
        profile_id=request.profile_id,
        cover_letter=request.cover_letter,
        status="applied",
        applied_at=datetime.utcnow(),
        source="manual"
    )
    
    db.add(application)
    
    # Update user application count
    current_user.application_count += 1
    
    db.commit()
    db.refresh(application)
    
    return ApplyToJobResponse(
        application_id=application.id,
        success=True,
        message=f"Successfully applied to {job.title}"
    )


@router.get("/search", response_model=JobSearchResponse)
async def search_jobs_enhanced(
    query: Optional[str] = None,
    location: Optional[str] = None,
    company: Optional[str] = None,
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: Optional[User] = Depends(optional_user),
    db: Session = Depends(get_db)
):
    """
    Enhanced job search with guest/auth differentiation
    
    - Guests: Limited to 10 results max
    - Authenticated: Unlimited results
    - Supports multiple filters
    - Shows saved status for authenticated users
    """
    # Determine if user is guest
    is_guest = current_user is None
    
    # Limit for guests
    if is_guest:
        limit = min(limit, 10)
    
    # Build query
    job_query = db.query(Job).filter(Job.is_active == True)
    
    # Apply filters
    if query:
        search_filter = or_(
            Job.title.ilike(f"%{query}%"),
            Job.description.ilike(f"%{query}%")
        )
        job_query = job_query.filter(search_filter)
    
    if location:
        location_filter = or_(
            Job.location.ilike(f"%{location}%"),
            Job.place.ilike(f"%{location}%")
        )
        job_query = job_query.filter(location_filter)
    
    if company:
        # This would need to join with Company table
        # For now, simple filter if company_name exists
        pass
    
    if job_type:
        job_query = job_query.filter(Job.job_type == job_type)
    
    if experience_level:
        job_query = job_query.filter(Job.experience_level == experience_level)
    
    # Get total count
    total = job_query.count()
    
    # Calculate pagination
    offset = (page - 1) * limit
    pages = (total + limit - 1) // limit
    
    # Get jobs
    jobs = job_query.order_by(desc(Job.created_at)).offset(offset).limit(limit).all()
    
    # Get saved job IDs for authenticated users
    saved_job_ids = set()
    if current_user:
        saved_jobs = db.query(SavedJob.job_id).filter(
            SavedJob.user_id == current_user.id
        ).all()
        saved_job_ids = {job_id for (job_id,) in saved_jobs}
    
    # Format results
    job_results = []
    for job in jobs:
        job_results.append(
            JobSearchResult(
                id=job.id,
                title=job.title,
                company_name=job.company.name if job.company else "Unknown",
                location=job.location or job.place,
                description_preview=job.description[:200] if job.description else None,
                job_type=job.job_type,
                experience_level=job.experience_level,
                posted_date=job.posted_date.isoformat() if job.posted_date else None,
                url=job.link,
                is_saved=job.id in saved_job_ids
            )
        )
    
    return JobSearchResponse(
        jobs=job_results,
        total=total,
        pages=pages,
        current_page=page,
        is_guest=is_guest
    )


@router.get("/applications", response_model=List[dict])
async def get_my_applications(
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get user's job applications
    
    - Returns list of applications
    - Can filter by status
    - Includes job details
    """
    offset = (page - 1) * limit
    
    query = db.query(JobApplication, Job).join(
        Job, JobApplication.job_id == Job.id
    ).filter(
        JobApplication.user_id == current_user.id
    )
    
    if status:
        query = query.filter(JobApplication.status == status)
    
    applications = query.order_by(desc(JobApplication.applied_at)).offset(offset).limit(limit).all()
    
    return [
        {
            "id": app.id,
            "job_id": job.id,
            "job_title": job.title,
            "company_name": job.company.name if job.company else "Unknown",
            "location": job.location or job.place,
            "status": app.status,
            "applied_at": app.applied_at,
            "source": app.source,
            "cover_letter": app.cover_letter,
            "notes": app.notes
        }
        for app, job in applications
    ]


@router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: int,
    status: str,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update application status
    
    - Updates status (applied, interviewing, offered, rejected, withdrawn)
    - Optional notes
    """
    application = db.query(JobApplication).filter(
        JobApplication.id == application_id,
        JobApplication.user_id == current_user.id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    valid_statuses = ["applied", "interviewing", "offered", "rejected", "withdrawn"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    application.status = status
    if notes:
        application.notes = notes
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Application status updated to {status}"
    }

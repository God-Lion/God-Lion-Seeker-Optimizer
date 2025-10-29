"""
Profile Management Routes
Handles resume upload, profile management, and career analysis
"""
from datetime import datetime
from typing import List, Optional
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from src.config.database import get_db
from src.config.settings import settings
from src.models.user import User, ResumeProfile
from src.auth.dependencies import get_current_active_user

router = APIRouter()


# Pydantic Models
class ProfileResponse(BaseModel):
    id: int
    name: str
    file_name: Optional[str] = None
    created_at: datetime
    is_active: bool
    last_analyzed: Optional[datetime] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = None
    
    class Config:
        from_attributes = True


class ProfileDetailResponse(BaseModel):
    id: int
    name: str
    file_name: Optional[str] = None
    created_at: datetime
    is_active: bool
    resume_text: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = None
    education: Optional[dict] = None
    certifications: Optional[List[str]] = None
    desired_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    salary_expectation: Optional[dict] = None
    analysis_results: Optional[dict] = None
    last_analyzed: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ProfileCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    desired_roles: Optional[List[str]] = None
    preferred_locations: Optional[List[str]] = None
    salary_expectation: Optional[dict] = None


class MessageResponse(BaseModel):
    message: str
    success: bool = True


class UploadResponse(BaseModel):
    profile_id: int
    file_name: str
    created_at: datetime
    message: str


# Helper Functions
def save_uploaded_file(file: UploadFile, user_id: int) -> tuple[str, str]:
    """
    Save uploaded resume file
    
    Returns:
        tuple: (file_path, file_name)
    """
    # Create uploads directory if it doesn't exist
    upload_dir = os.path.join("uploads", "resumes", str(user_id))
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    
    return file_path, file.filename


def extract_text_from_file(file_path: str) -> str:
    """
    Extract text from resume file (PDF, DOCX, TXT)
    
    TODO: Implement actual text extraction using libraries like:
    - PyPDF2 for PDF
    - python-docx for DOCX
    - Plain text for TXT
    """
    # Placeholder implementation
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except:
        return ""


def parse_resume_data(resume_text: str) -> dict:
    """
    Parse resume text to extract structured data
    
    TODO: Implement actual resume parsing using:
    - NLP libraries
    - Resume parsing APIs
    - Custom ML models
    """
    # Placeholder implementation
    return {
        "skills": [],
        "experience_years": 0,
        "education": {},
        "certifications": []
    }


# Routes
@router.post("/upload", response_model=UploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload and create a new resume profile
    
    - Accepts PDF, DOCX, or TXT files
    - Extracts text from resume
    - Creates profile record
    - Returns profile ID for analysis
    """
    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.doc', '.txt']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Save file
    try:
        file_path, original_filename = save_uploaded_file(file, current_user.id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Extract text from file
    resume_text = extract_text_from_file(file_path)
    
    # Parse resume data
    parsed_data = parse_resume_data(resume_text)
    
    # Create profile
    profile = ResumeProfile(
        user_id=current_user.id,
        name=name,
        resume_text=resume_text,
        resume_file_url=file_path,
        parsed_data=parsed_data,
        skills=parsed_data.get("skills", []),
        experience_years=parsed_data.get("experience_years", 0),
        education=parsed_data.get("education", {}),
        certifications=parsed_data.get("certifications", []),
        is_active=False  # User needs to set it active
    )
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return UploadResponse(
        profile_id=profile.id,
        file_name=original_filename,
        created_at=profile.created_at,
        message="Resume uploaded successfully. You can now analyze it."
    )


@router.get("", response_model=List[ProfileResponse])
async def get_profiles(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get all profiles for current user
    
    - Returns list of user's profiles
    - Includes basic profile information
    """
    profiles = db.query(ResumeProfile).filter(
        ResumeProfile.user_id == current_user.id
    ).order_by(ResumeProfile.created_at.desc()).all()
    
    return [
        ProfileResponse(
            id=p.id,
            name=p.name,
            file_name=os.path.basename(p.resume_file_url) if p.resume_file_url else None,
            created_at=p.created_at,
            is_active=p.is_active,
            last_analyzed=p.last_analyzed,
            skills=p.skills,
            experience_years=p.experience_years
        )
        for p in profiles
    ]


@router.get("/{profile_id}", response_model=ProfileDetailResponse)
async def get_profile_details(
    profile_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed profile information
    
    - Returns complete profile data
    - Includes analysis results if available
    """
    profile = db.query(ResumeProfile).filter(
        ResumeProfile.id == profile_id,
        ResumeProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    return ProfileDetailResponse(
        id=profile.id,
        name=profile.name,
        file_name=os.path.basename(profile.resume_file_url) if profile.resume_file_url else None,
        created_at=profile.created_at,
        is_active=profile.is_active,
        resume_text=profile.resume_text,
        skills=profile.skills,
        experience_years=profile.experience_years,
        education=profile.education,
        certifications=profile.certifications,
        desired_roles=profile.desired_roles,
        preferred_locations=profile.preferred_locations,
        salary_expectation=profile.salary_expectation,
        analysis_results=profile.analysis_results,
        last_analyzed=profile.last_analyzed
    )


@router.put("/{profile_id}/set-active", response_model=MessageResponse)
async def set_active_profile(
    profile_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Set a profile as active for job search
    
    - Deactivates all other profiles
    - Sets specified profile as active
    """
    # Check if profile exists and belongs to user
    profile = db.query(ResumeProfile).filter(
        ResumeProfile.id == profile_id,
        ResumeProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Deactivate all user's profiles
    db.query(ResumeProfile).filter(
        ResumeProfile.user_id == current_user.id
    ).update({"is_active": False})
    
    # Activate selected profile
    profile.is_active = True
    db.commit()
    
    return MessageResponse(
        message=f"Profile '{profile.name}' set as active",
        success=True
    )


@router.put("/{profile_id}", response_model=MessageResponse)
async def update_profile(
    profile_id: int,
    request: ProfileUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update profile information
    
    - Updates profile metadata
    - Updates job preferences
    """
    profile = db.query(ResumeProfile).filter(
        ResumeProfile.id == profile_id,
        ResumeProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Update fields
    if request.name is not None:
        profile.name = request.name
    
    if request.desired_roles is not None:
        profile.desired_roles = request.desired_roles
    
    if request.preferred_locations is not None:
        profile.preferred_locations = request.preferred_locations
    
    if request.salary_expectation is not None:
        profile.salary_expectation = request.salary_expectation
    
    db.commit()
    
    return MessageResponse(
        message="Profile updated successfully",
        success=True
    )


@router.delete("/{profile_id}", response_model=MessageResponse)
async def delete_profile(
    profile_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a profile
    
    - Removes profile from database
    - Deletes associated resume file
    """
    profile = db.query(ResumeProfile).filter(
        ResumeProfile.id == profile_id,
        ResumeProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    # Delete file if exists
    if profile.resume_file_url and os.path.exists(profile.resume_file_url):
        try:
            os.remove(profile.resume_file_url)
        except Exception as e:
            # Log error but continue with database deletion
            print(f"Failed to delete file: {str(e)}")
    
    # Delete profile
    db.delete(profile)
    db.commit()
    
    return MessageResponse(
        message="Profile deleted successfully",
        success=True
    )


@router.get("/{profile_id}/active-status")
async def get_active_profile(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get the currently active profile for the user
    
    - Returns active profile or null if none set
    """
    active_profile = db.query(ResumeProfile).filter(
        ResumeProfile.user_id == current_user.id,
        ResumeProfile.is_active == True
    ).first()
    
    if not active_profile:
        return {"active_profile": None}
    
    return {
        "active_profile": {
            "id": active_profile.id,
            "name": active_profile.name,
            "created_at": active_profile.created_at,
            "last_analyzed": active_profile.last_analyzed
        }
    }

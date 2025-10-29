"""
Guest/Anonymous User Routes
Handles temporary profile analysis and job matching for non-authenticated users
"""
from datetime import datetime, timedelta
from typing import List, Optional
import uuid
import os

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from src.config.database import get_db
from src.models.job import Job

router = APIRouter()


# In-memory session storage (in production, use Redis)
guest_sessions = {}


# Pydantic Models
class GuestAnalysisResponse(BaseModel):
    session_id: str
    analysis: dict
    expires_at: datetime


class GuestJobMatch(BaseModel):
    job_id: int
    title: str
    company_name: str
    location: Optional[str]
    description: Optional[str]
    match_score: float
    matched_skills: List[str]
    posted_date: Optional[str]


class GuestJobMatchResponse(BaseModel):
    matches: List[GuestJobMatch]
    session_id: str
    total_matches: int


# Helper Functions
def extract_text_from_file(file_path: str) -> str:
    """
    Extract text from resume file
    
    TODO: Implement actual text extraction for PDF/DOCX
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except:
        return ""


def analyze_resume_text(resume_text: str) -> dict:
    """
    Analyze resume text and extract structured data
    
    TODO: Implement actual NLP-based analysis
    This is a simplified version for demonstration
    """
    # Simple keyword extraction (placeholder)
    common_skills = [
        'python', 'javascript', 'java', 'react', 'node.js', 'sql',
        'aws', 'docker', 'kubernetes', 'git', 'agile', 'scrum',
        'machine learning', 'data analysis', 'api', 'rest', 'graphql',
        'typescript', 'angular', 'vue', 'mongodb', 'postgresql'
    ]
    
    resume_lower = resume_text.lower()
    found_skills = [skill for skill in common_skills if skill in resume_lower]
    
    # Extract years of experience (simple pattern matching)
    experience_years = 0
    if 'years' in resume_lower or 'year' in resume_lower:
        # Simple heuristic - count occurrences of year patterns
        experience_years = min(resume_lower.count('year'), 15)
    
    # Identify potential roles
    role_keywords = {
        'Software Engineer': ['software engineer', 'developer', 'programmer'],
        'Data Scientist': ['data scientist', 'machine learning', 'data analysis'],
        'DevOps Engineer': ['devops', 'infrastructure', 'cloud engineer'],
        'Frontend Developer': ['frontend', 'react', 'angular', 'vue'],
        'Backend Developer': ['backend', 'api', 'server', 'database'],
        'Full Stack Developer': ['full stack', 'fullstack'],
        'Project Manager': ['project manager', 'scrum master', 'agile'],
    }
    
    top_roles = []
    for role, keywords in role_keywords.items():
        if any(keyword in resume_lower for keyword in keywords):
            top_roles.append(role)
    
    if not top_roles:
        top_roles = ['Software Engineer']  # Default
    
    return {
        'skills': found_skills[:10],  # Top 10 skills
        'experience': {
            'total_years': experience_years,
            'roles': top_roles[:3]
        },
        'education': {},  # Placeholder
        'top_roles': top_roles[:5],
        'recommendations': [
            'Consider adding more specific technical skills',
            'Highlight quantifiable achievements',
            'Include relevant certifications'
        ]
    }


def save_temp_file(file: UploadFile) -> tuple[str, str]:
    """Save uploaded file temporarily"""
    temp_dir = os.path.join("uploads", "temp")
    os.makedirs(temp_dir, exist_ok=True)
    
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(temp_dir, unique_filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    
    return file_path, file.filename


def cleanup_temp_file(file_path: str):
    """Delete temporary file"""
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except:
        pass


def calculate_job_match_score(job: Job, skills: List[str]) -> tuple[float, List[str]]:
    """
    Calculate match score between job and user skills
    
    Returns: (match_score, matched_skills)
    """
    if not job.description or not skills:
        return 0.0, []
    
    description_lower = job.description.lower()
    matched_skills = []
    
    for skill in skills:
        if skill.lower() in description_lower:
            matched_skills.append(skill)
    
    # Calculate score (0-100)
    if len(skills) > 0:
        match_score = (len(matched_skills) / len(skills)) * 100
    else:
        match_score = 0.0
    
    # Bonus for job title matching
    if job.title and skills:
        title_lower = job.title.lower()
        title_matches = sum(1 for skill in skills if skill.lower() in title_lower)
        match_score += (title_matches * 5)  # +5 points per title match
    
    return min(match_score, 100.0), matched_skills


# Routes
@router.post("/analyze-anonymous", response_model=GuestAnalysisResponse)
async def analyze_anonymous_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Analyze resume for anonymous/guest users
    
    - Accepts resume file (PDF, DOCX, TXT)
    - Extracts skills and experience
    - Returns analysis with session ID
    - Data stored temporarily (not in database)
    - Session expires after 24 hours
    """
    # Validate file type
    allowed_extensions = ['.pdf', '.docx', '.doc', '.txt']
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed: {', '.join(allowed_extensions)}"
        )
    
    # Save file temporarily
    try:
        file_path, original_filename = save_temp_file(file)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
    
    # Extract text
    resume_text = extract_text_from_file(file_path)
    
    # Analyze resume
    analysis = analyze_resume_text(resume_text)
    
    # Clean up temp file
    cleanup_temp_file(file_path)
    
    # Generate session ID
    session_id = str(uuid.uuid4())
    expires_at = datetime.utcnow() + timedelta(hours=24)
    
    # Store in session (in production, use Redis with TTL)
    guest_sessions[session_id] = {
        'analysis': analysis,
        'resume_text': resume_text[:1000],  # Store first 1000 chars
        'created_at': datetime.utcnow(),
        'expires_at': expires_at,
        'original_filename': original_filename
    }
    
    return GuestAnalysisResponse(
        session_id=session_id,
        analysis=analysis,
        expires_at=expires_at
    )


@router.get("/match-anonymous", response_model=GuestJobMatchResponse)
async def match_jobs_anonymous(
    session_id: str,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Get job recommendations for anonymous users
    
    - Requires valid session ID from analyze-anonymous
    - Matches jobs based on temporary profile analysis
    - Returns top matching jobs with scores
    - Shows "Sign Up to Apply" message
    """
    # Validate session
    if session_id not in guest_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired. Please upload your resume again."
        )
    
    session_data = guest_sessions[session_id]
    
    # Check if session expired
    if session_data['expires_at'] < datetime.utcnow():
        del guest_sessions[session_id]
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Session expired. Please upload your resume again."
        )
    
    # Get user skills from analysis
    analysis = session_data['analysis']
    skills = analysis.get('skills', [])
    
    if not skills:
        return GuestJobMatchResponse(
            matches=[],
            session_id=session_id,
            total_matches=0
        )
    
    # Get recent jobs (last 30 days)
    recent_jobs = db.query(Job).filter(
        Job.created_at >= datetime.utcnow() - timedelta(days=30)
    ).order_by(desc(Job.created_at)).limit(100).all()
    
    # Calculate match scores
    job_matches = []
    for job in recent_jobs:
        match_score, matched_skills = calculate_job_match_score(job, skills)
        
        # Only include jobs with >20% match
        if match_score > 20:
            job_matches.append(
                GuestJobMatch(
                    job_id=job.id,
                    title=job.title,
                    company_name=job.company_name,
                    location=job.location,
                    description=job.description[:200] if job.description else None,  # First 200 chars
                    match_score=round(match_score, 1),
                    matched_skills=matched_skills,
                    posted_date=job.posted_date
                )
            )
    
    # Sort by match score
    job_matches.sort(key=lambda x: x.match_score, reverse=True)
    
    # Limit results
    limited_matches = job_matches[:limit]
    
    return GuestJobMatchResponse(
        matches=limited_matches,
        session_id=session_id,
        total_matches=len(job_matches)
    )


@router.get("/session/{session_id}")
async def get_guest_session(session_id: str):
    """
    Get guest session data
    
    - Returns analysis results for valid session
    - Used to restore session on page refresh
    """
    if session_id not in guest_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or expired"
        )
    
    session_data = guest_sessions[session_id]
    
    # Check if expired
    if session_data['expires_at'] < datetime.utcnow():
        del guest_sessions[session_id]
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Session expired"
        )
    
    return {
        'session_id': session_id,
        'analysis': session_data['analysis'],
        'created_at': session_data['created_at'],
        'expires_at': session_data['expires_at'],
        'original_filename': session_data['original_filename']
    }


@router.delete("/session/{session_id}")
async def delete_guest_session(session_id: str):
    """
    Delete guest session
    
    - Clears session data
    - Called on user logout or session cleanup
    """
    if session_id in guest_sessions:
        del guest_sessions[session_id]
    
    return {"message": "Session deleted", "success": True}


# Cleanup task (should be run periodically)
def cleanup_expired_sessions():
    """
    Remove expired guest sessions
    
    Should be called periodically (e.g., every hour)
    In production, use a background task scheduler
    """
    now = datetime.utcnow()
    expired_sessions = [
        sid for sid, data in guest_sessions.items()
        if data['expires_at'] < now
    ]
    
    for sid in expired_sessions:
        del guest_sessions[sid]
    
    return len(expired_sessions)

"""GDPR compliance API routes"""
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, Response
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import logging
import json
import io

from src.config.database import get_db
from src.auth.dependencies import get_current_active_user
from src.models.user import User
from src.services.gdpr_service import GDPRService, ConsentService
from src.services.audit_service import AuditService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/gdpr", tags=["GDPR Compliance"])


# Pydantic models
class DataExportRequest(BaseModel):
    """Request for data export"""
    format: str = "json"  # json or csv


class DataExportResponse(BaseModel):
    """Response for data export"""
    export_id: int
    format: str
    status: str
    message: str
    download_url: Optional[str] = None
    expires_at: Optional[str] = None


class DataDeletionRequest(BaseModel):
    """Request for data deletion"""
    anonymize: bool = False
    reason: Optional[str] = None
    verification_code: Optional[str] = None


class DataDeletionResponse(BaseModel):
    """Response for data deletion"""
    request_id: int
    status: str
    message: str
    verification_required: bool = False


class ConsentRequest(BaseModel):
    """Request to record or update consent"""
    consent_type: str
    consent_given: bool
    consent_version: str


class ConsentResponse(BaseModel):
    """Response for consent operation"""
    success: bool
    message: str
    consent_id: Optional[int] = None


# GDPR Article 15 - Right to Access
@router.get("/data-export", response_model=DataExportResponse)
async def request_data_export(
    format: str = "json",
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    """
    Request export of all user data (GDPR Article 15 - Right to Access)
    
    Returns all personal data in machine-readable format (JSON or CSV)
    """
    try:
        from src.models.gdpr import DataAccessRequest
        
        # Create data access request
        access_request = DataAccessRequest(
            user_id=current_user.id,
            request_format=format,
            status="pending"
        )
        db.add(access_request)
        await db.commit()
        await db.refresh(access_request)
        
        # Log the request
        audit = AuditService(db)
        await audit.log_action(
            user_id=current_user.id,
            action="data_export_requested",
            resource_type="user_data",
            resource_id=str(current_user.id),
            details={"format": format}
        )
        
        # Generate export in background
        if background_tasks:
            background_tasks.add_task(
                generate_data_export,
                access_request.id,
                current_user.id,
                format
            )
        
        logger.info(f"Data export requested by user {current_user.id}, format={format}")
        
        return DataExportResponse(
            export_id=access_request.id,
            format=format,
            status="processing",
            message="Your data export is being prepared. You will be notified when it's ready.",
            expires_at=(datetime.utcnow() + timedelta(days=7)).isoformat()
        )
    
    except Exception as e:
        logger.error(f"Data export request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process data export request"
        )


@router.get("/data-export/{export_id}/download")
async def download_data_export(
    export_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Download exported user data
    """
    try:
        from src.models.gdpr import DataAccessRequest
        from sqlalchemy import select
        
        # Get export request
        result = await db.execute(
            select(DataAccessRequest).where(
                DataAccessRequest.id == export_id,
                DataAccessRequest.user_id == current_user.id
            )
        )
        access_request = result.scalar_one_or_none()
        
        if not access_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Export request not found"
            )
        
        if access_request.status != "completed":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Export is not ready yet. Status: {access_request.status}"
            )
        
        # Check expiry
        if access_request.export_expires_at and access_request.export_expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Export has expired. Please request a new export."
            )
        
        # Generate export data
        gdpr_service = GDPRService(db)
        
        if access_request.request_format == "json":
            data = await gdpr_service.export_user_data(current_user.id, format="json")
            
            # Update download tracking
            access_request.downloaded = True
            access_request.downloaded_at = datetime.utcnow()
            access_request.download_count += 1
            await db.commit()
            
            return JSONResponse(content=data)
        
        elif access_request.request_format == "csv":
            csv_data = await gdpr_service.export_user_data_csv(current_user.id)
            
            # Update download tracking
            access_request.downloaded = True
            access_request.downloaded_at = datetime.utcnow()
            access_request.download_count += 1
            await db.commit()
            
            return StreamingResponse(
                io.StringIO(csv_data),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=user_data_{current_user.id}.csv"
                }
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported format: {access_request.request_format}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Data download failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download data export"
        )


# GDPR Article 17 - Right to Erasure
@router.delete("/account", response_model=DataDeletionResponse)
async def request_account_deletion(
    request: DataDeletionRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Request account and data deletion (GDPR Article 17 - Right to Erasure)
    
    Options:
    - Full deletion: Permanently delete all user data
    - Anonymization: Retain data but anonymize personal information
    """
    try:
        from src.models.gdpr import DataDeletionRequest as DeletionRequestModel
        import secrets
        
        # Create deletion request
        verification_token = secrets.token_urlsafe(32)
        
        deletion_request = DeletionRequestModel(
            user_id=current_user.id,
            request_type="anonymization" if request.anonymize else "full_deletion",
            reason=request.reason,
            status="pending_verification",
            verification_token=verification_token
        )
        
        db.add(deletion_request)
        await db.commit()
        await db.refresh(deletion_request)
        
        # Log the request
        audit = AuditService(db)
        await audit.log_action(
            user_id=current_user.id,
            action="data_deletion_requested",
            resource_type="user_data",
            resource_id=str(current_user.id),
            details={
                "request_type": deletion_request.request_type,
                "reason": request.reason
            }
        )
        
        # TODO: Send verification email
        # send_deletion_verification_email(current_user.email, verification_token)
        
        logger.info(
            f"Data deletion requested by user {current_user.id}, "
            f"type={deletion_request.request_type}"
        )
        
        return DataDeletionResponse(
            request_id=deletion_request.id,
            status="pending_verification",
            message="A verification email has been sent. Please confirm to proceed with deletion.",
            verification_required=True
        )
    
    except Exception as e:
        logger.error(f"Data deletion request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process deletion request"
        )


@router.post("/account/delete/verify/{request_id}")
async def verify_account_deletion(
    request_id: int,
    verification_code: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    """
    Verify and process account deletion request
    """
    try:
        from src.models.gdpr import DataDeletionRequest
        from sqlalchemy import select
        
        # Get deletion request
        result = await db.execute(
            select(DataDeletionRequest).where(
                DataDeletionRequest.id == request_id,
                DataDeletionRequest.user_id == current_user.id
            )
        )
        deletion_request = result.scalar_one_or_none()
        
        if not deletion_request:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Deletion request not found"
            )
        
        if deletion_request.verification_token != verification_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification code"
            )
        
        # Mark as verified
        deletion_request.verified_at = datetime.utcnow()
        deletion_request.status = "processing"
        await db.commit()
        
        # Process deletion in background
        if background_tasks:
            background_tasks.add_task(
                process_account_deletion,
                deletion_request.id,
                current_user.id,
                deletion_request.request_type == "anonymization"
            )
        
        return {
            "success": True,
            "message": "Account deletion is being processed. This may take a few minutes."
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Deletion verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify deletion request"
        )


# GDPR Article 20 - Right to Data Portability
@router.get("/data-portability")
async def get_portable_data(
    format: str = "json",
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Export data in machine-readable format (GDPR Article 20 - Right to Portability)
    
    Returns user-generated content in JSON or CSV format
    """
    try:
        gdpr_service = GDPRService(db)
        
        if format == "json":
            data = await gdpr_service.export_user_data(current_user.id, format="json")
            
            # Remove system-generated data, keep only user-generated
            portable_data = {
                "export_metadata": data["export_metadata"],
                "personal_information": {
                    "email": data["personal_information"]["email"],
                    "first_name": data["personal_information"]["first_name"],
                    "last_name": data["personal_information"]["last_name"],
                    "bio": data["personal_information"]["bio"]
                },
                "preferences": data["preferences"],
                "resume_profiles": data["resume_profiles"],
                "job_applications": data["job_applications"],
                "saved_jobs": data["saved_jobs"]
            }
            
            return JSONResponse(content=portable_data)
        
        elif format == "csv":
            csv_data = await gdpr_service.export_user_data_csv(current_user.id)
            
            return StreamingResponse(
                io.StringIO(csv_data),
                media_type="text/csv",
                headers={
                    "Content-Disposition": f"attachment; filename=user_portable_data_{current_user.id}.csv"
                }
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported format: {format}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Data portability export failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export portable data"
        )


# Consent Management
@router.post("/consent", response_model=ConsentResponse)
async def record_consent(
    request: ConsentRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Record user consent for data processing
    """
    try:
        consent_service = ConsentService(db)
        
        consent = await consent_service.record_consent(
            user_id=current_user.id,
            consent_type=request.consent_type,
            consent_given=request.consent_given,
            consent_text=f"User {'accepted' if request.consent_given else 'rejected'} {request.consent_type}",
            consent_version=request.consent_version
        )
        
        logger.info(
            f"Consent recorded for user {current_user.id}: "
            f"{request.consent_type} = {request.consent_given}"
        )
        
        return ConsentResponse(
            success=True,
            message=f"Consent for {request.consent_type} has been recorded",
            consent_id=consent["id"]
        )
    
    except Exception as e:
        logger.error(f"Consent recording failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record consent"
        )


@router.get("/consent")
async def get_user_consents(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all consents for the current user
    """
    try:
        consent_service = ConsentService(db)
        consents = await consent_service.get_user_consents(current_user.id)
        
        return {
            "user_id": current_user.id,
            "consents": consents
        }
    
    except Exception as e:
        logger.error(f"Failed to retrieve consents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve consents"
        )


@router.delete("/consent/{consent_type}")
async def withdraw_consent(
    consent_type: str,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Withdraw consent for specific data processing
    """
    try:
        consent_service = ConsentService(db)
        
        result = await consent_service.withdraw_consent(
            user_id=current_user.id,
            consent_type=consent_type
        )
        
        logger.info(f"Consent withdrawn for user {current_user.id}: {consent_type}")
        
        return {
            "success": True,
            "message": f"Consent for {consent_type} has been withdrawn",
            "withdrawn_at": result["timestamp"]
        }
    
    except Exception as e:
        logger.error(f"Consent withdrawal failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to withdraw consent"
        )


# Background tasks
async def generate_data_export(export_id: int, user_id: int, format: str):
    """Background task to generate data export"""
    from src.config.database import get_session
    from src.models.gdpr import DataAccessRequest
    from sqlalchemy import select
    
    async with get_session() as db:
        try:
            gdpr_service = GDPRService(db)
            
            # Generate export
            await gdpr_service.export_user_data(user_id, format=format)
            
            # Update request status
            result = await db.execute(
                select(DataAccessRequest).where(DataAccessRequest.id == export_id)
            )
            access_request = result.scalar_one_or_none()
            
            if access_request:
                access_request.status = "completed"
                access_request.completed_at = datetime.utcnow()
                access_request.export_expires_at = datetime.utcnow() + timedelta(days=7)
                await db.commit()
            
            logger.info(f"Data export completed for user {user_id}, export_id={export_id}")
        
        except Exception as e:
            logger.error(f"Data export generation failed: {e}")


async def process_account_deletion(request_id: int, user_id: int, anonymize: bool):
    """Background task to process account deletion"""
    from src.config.database import get_session
    from src.models.gdpr import DataDeletionRequest
    from sqlalchemy import select
    
    async with get_session() as db:
        try:
            gdpr_service = GDPRService(db)
            
            # Process deletion
            results = await gdpr_service.delete_user_data(
                user_id=user_id,
                anonymize=anonymize,
                retain_audit=True
            )
            
            # Update request status
            result = await db.execute(
                select(DataDeletionRequest).where(DataDeletionRequest.id == request_id)
            )
            deletion_request = result.scalar_one_or_none()
            
            if deletion_request:
                deletion_request.status = "completed"
                deletion_request.completed_at = datetime.utcnow()
                deletion_request.deletion_results = results
                await db.commit()
            
            logger.info(f"Account deletion completed for user {user_id}, request_id={request_id}")
        
        except Exception as e:
            logger.error(f"Account deletion processing failed: {e}")

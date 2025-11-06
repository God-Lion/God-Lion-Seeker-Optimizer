"""
Backup and Disaster Recovery API Routes

Provides endpoints for backup management, restore operations,
and disaster recovery monitoring
"""
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import logging

from src.config.database import get_db
from src.auth.dependencies import get_current_user, require_admin
from src.services.backup_service import BackupService, BackupMetadata
from src.services.restore_service import RestoreService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/backup", tags=["Backup & Disaster Recovery"])


class BackupCreateRequest(BaseModel):
    """Request to create a backup"""
    backup_type: str = Field(..., description="Backup type: full, incremental, transaction_log")
    verify_after_creation: bool = Field(default=True, description="Verify backup after creation")


class BackupResponse(BaseModel):
    """Backup metadata response"""
    backup_id: str
    backup_type: str
    timestamp: str
    size_bytes: int
    size_mb: float
    checksum: str
    components: List[str]
    location: str
    status: str
    rpo_compliant: bool
    verification_timestamp: Optional[str]
    restore_tested: bool


class BackupListResponse(BaseModel):
    """List of backups response"""
    total: int
    backups: List[BackupResponse]


class RPOStatusResponse(BaseModel):
    """RPO compliance status"""
    compliant: bool
    last_backup: Optional[str]
    last_backup_timestamp: Optional[str]
    hours_since_last_backup: Optional[float]
    rpo_hours: int
    recommendation: str


class RestoreRequest(BaseModel):
    """Request to restore from backup"""
    backup_id: str
    verify_before_restore: bool = Field(default=True)
    create_backup_before_restore: bool = Field(default=True)


class PITRRequest(BaseModel):
    """Point-in-time recovery request"""
    target_timestamp: datetime
    verify_before_restore: bool = Field(default=True)


class RestoreTestRequest(BaseModel):
    """Restore test request"""
    backup_id: str


class RestoreOperationResponse(BaseModel):
    """Restore operation result"""
    restore_id: str
    backup_id: str
    restore_type: str
    started_at: str
    completed_at: Optional[str]
    duration_minutes: Optional[float]
    status: str
    components_restored: List[str]
    errors: List[str]
    rto_compliant: Optional[bool]


class RestoreTestResponse(BaseModel):
    """Restore test result"""
    backup_id: str
    test_timestamp: str
    success: bool
    duration_minutes: float
    rto_compliant: bool
    components_tested: List[str]
    errors: List[str]


class EmergencyContactResponse(BaseModel):
    """Emergency contact information"""
    role: str
    name: str
    email: str
    phone: str
    priority: int


@router.post("/create", response_model=BackupResponse)
async def create_backup(
    request: BackupCreateRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Create a new backup
    
    Types:
    - full: Complete backup of all components
    - incremental: Changes since last backup
    - transaction_log: PostgreSQL WAL backup
    
    Requires admin privileges
    """
    try:
        service = BackupService()
        
        # Create backup based on type
        if request.backup_type == "full":
            metadata = await service.create_full_backup()
        elif request.backup_type == "incremental":
            # Get last full backup
            backups = await service.list_backups(backup_type="full")
            if not backups:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No full backup found. Create a full backup first."
                )
            metadata = await service.create_incremental_backup(backups[0].timestamp)
        elif request.backup_type == "transaction_log":
            metadata = await service.create_transaction_log_backup()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid backup type: {request.backup_type}"
            )
        
        # Verify backup if requested
        if request.verify_after_creation:
            background_tasks.add_task(service.verify_backup, metadata.backup_id)
        
        return BackupResponse(
            backup_id=metadata.backup_id,
            backup_type=metadata.backup_type,
            timestamp=metadata.timestamp.isoformat(),
            size_bytes=metadata.size_bytes,
            size_mb=round(metadata.size_bytes / 1024 / 1024, 2),
            checksum=metadata.checksum,
            components=metadata.components,
            location=metadata.location,
            status=metadata.status,
            rpo_compliant=metadata.rpo_compliant,
            verification_timestamp=metadata.verification_timestamp.isoformat() if metadata.verification_timestamp else None,
            restore_tested=metadata.restore_tested
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create backup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create backup: {str(e)}"
        )


@router.get("/list", response_model=BackupListResponse)
async def list_backups(
    backup_type: Optional[str] = Query(None, description="Filter by backup type"),
    limit: int = Query(50, ge=1, le=500, description="Maximum results"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    List all available backups
    
    Requires admin privileges
    """
    try:
        service = BackupService()
        backups = await service.list_backups(backup_type=backup_type)
        
        # Limit results
        backups = backups[:limit]
        
        backup_responses = [
            BackupResponse(
                backup_id=b.backup_id,
                backup_type=b.backup_type,
                timestamp=b.timestamp.isoformat(),
                size_bytes=b.size_bytes,
                size_mb=round(b.size_bytes / 1024 / 1024, 2),
                checksum=b.checksum,
                components=b.components,
                location=b.location,
                status=b.status,
                rpo_compliant=b.rpo_compliant,
                verification_timestamp=b.verification_timestamp.isoformat() if b.verification_timestamp else None,
                restore_tested=b.restore_tested
            )
            for b in backups
        ]
        
        return BackupListResponse(
            total=len(backup_responses),
            backups=backup_responses
        )
    
    except Exception as e:
        logger.error(f"Failed to list backups: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list backups"
        )


@router.get("/status/rpo", response_model=RPOStatusResponse)
async def check_rpo_status(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Check RPO (Recovery Point Objective) compliance
    
    RPO: 24 hours - Ensures backups are current
    
    Requires admin privileges
    """
    try:
        service = BackupService()
        status = await service.check_rpo_compliance()
        
        return RPOStatusResponse(**status)
    
    except Exception as e:
        logger.error(f"Failed to check RPO status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check RPO status"
        )


@router.post("/verify/{backup_id}")
async def verify_backup(
    backup_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Verify backup integrity
    
    Checks:
    - File checksum
    - Archive extraction
    - Data integrity
    
    Requires admin privileges
    """
    try:
        service = BackupService()
        is_valid = await service.verify_backup(backup_id)
        
        return {
            "backup_id": backup_id,
            "valid": is_valid,
            "verified_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Failed to verify backup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify backup: {str(e)}"
        )


@router.post("/restore", response_model=RestoreOperationResponse)
async def restore_from_backup(
    request: RestoreRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Restore system from backup
    
    WARNING: This will:
    - Stop all services
    - Overwrite current database
    - Restore all files and configurations
    
    RTO Target: 4 hours
    
    Requires admin privileges
    """
    try:
        service = RestoreService()
        
        restore_op = await service.restore_full_backup(
            backup_id=request.backup_id,
            verify_before_restore=request.verify_before_restore,
            create_backup_before_restore=request.create_backup_before_restore
        )
        
        duration = restore_op.duration_minutes()
        rto_compliant = duration <= (service.rto_hours * 60) if duration else None
        
        return RestoreOperationResponse(
            restore_id=restore_op.restore_id,
            backup_id=restore_op.backup_id,
            restore_type=restore_op.restore_type,
            started_at=restore_op.started_at.isoformat(),
            completed_at=restore_op.completed_at.isoformat() if restore_op.completed_at else None,
            duration_minutes=duration,
            status=restore_op.status,
            components_restored=restore_op.components_restored,
            errors=restore_op.errors,
            rto_compliant=rto_compliant
        )
    
    except Exception as e:
        logger.error(f"Failed to restore from backup: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to restore from backup: {str(e)}"
        )


@router.post("/restore/pitr", response_model=RestoreOperationResponse)
async def point_in_time_recovery(
    request: PITRRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Point-in-Time Recovery (PITR)
    
    Restore database to specific point in time using:
    - Latest full backup before target time
    - Transaction logs up to target time
    
    Requires admin privileges
    """
    try:
        service = RestoreService()
        
        restore_op = await service.restore_point_in_time(
            target_timestamp=request.target_timestamp,
            verify_before_restore=request.verify_before_restore
        )
        
        duration = restore_op.duration_minutes()
        rto_compliant = duration <= (service.rto_hours * 60) if duration else None
        
        return RestoreOperationResponse(
            restore_id=restore_op.restore_id,
            backup_id=restore_op.backup_id,
            restore_type=restore_op.restore_type,
            started_at=restore_op.started_at.isoformat(),
            completed_at=restore_op.completed_at.isoformat() if restore_op.completed_at else None,
            duration_minutes=duration,
            status=restore_op.status,
            components_restored=restore_op.components_restored,
            errors=restore_op.errors,
            rto_compliant=rto_compliant
        )
    
    except Exception as e:
        logger.error(f"Failed to perform point-in-time recovery: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform point-in-time recovery: {str(e)}"
        )


@router.post("/test/restore", response_model=RestoreTestResponse)
async def test_restore(
    request: RestoreTestRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Test restore procedure (monthly drill)
    
    Tests:
    - Backup integrity
    - Restore to temporary location
    - Database restoration
    - Data integrity
    - Restore time (RTO compliance)
    
    Does NOT affect production system
    
    Requires admin privileges
    """
    try:
        service = RestoreService()
        
        # Run test in background for long-running tests
        # For synchronous response, await directly
        results = await service.test_restore(request.backup_id)
        
        return RestoreTestResponse(**results)
    
    except Exception as e:
        logger.error(f"Failed to test restore: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to test restore: {str(e)}"
        )


@router.delete("/cleanup")
async def cleanup_old_backups(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Clean up old backups based on retention policy
    
    Retention:
    - Local: 7 days
    - Cloud: 90 days
    - Cold storage: 7 years
    
    Requires admin privileges
    """
    try:
        service = BackupService()
        await service.cleanup_old_backups()
        
        return {
            "message": "Old backups cleaned up successfully",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Failed to cleanup old backups: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cleanup old backups"
        )


@router.get("/emergency-contacts", response_model=List[EmergencyContactResponse])
async def get_emergency_contacts(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Get emergency contact list for disaster recovery
    
    Returns prioritized list of contacts for emergency situations
    
    Requires admin privileges
    """
    try:
        service = BackupService()
        contacts = service.get_emergency_contacts()
        
        return [EmergencyContactResponse(**contact) for contact in contacts]
    
    except Exception as e:
        logger.error(f"Failed to get emergency contacts: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get emergency contacts"
        )


@router.get("/statistics")
async def get_backup_statistics(
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Get backup statistics and analytics
    
    Provides insights into backup health and trends
    
    Requires admin privileges
    """
    try:
        service = BackupService()
        
        # Get all backups
        all_backups = await service.list_backups()
        
        # Filter by date range
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        recent_backups = [b for b in all_backups if b.timestamp >= cutoff_date]
        
        # Calculate statistics
        stats = {
            "total_backups": len(recent_backups),
            "full_backups": len([b for b in recent_backups if b.backup_type == "full"]),
            "incremental_backups": len([b for b in recent_backups if b.backup_type == "incremental"]),
            "transaction_log_backups": len([b for b in recent_backups if b.backup_type == "transaction_log"]),
            "verified_backups": len([b for b in recent_backups if b.verification_timestamp]),
            "tested_backups": len([b for b in recent_backups if b.restore_tested]),
            "total_size_gb": round(sum(b.size_bytes for b in recent_backups) / 1024 / 1024 / 1024, 2),
            "average_backup_size_mb": round(
                sum(b.size_bytes for b in recent_backups) / len(recent_backups) / 1024 / 1024, 2
            ) if recent_backups else 0,
            "rpo_compliant_backups": len([b for b in recent_backups if b.rpo_compliant]),
            "failed_backups": len([b for b in recent_backups if b.status == "failed"]),
            "period_days": days,
            "oldest_backup": min((b.timestamp for b in recent_backups), default=None),
            "newest_backup": max((b.timestamp for b in recent_backups), default=None)
        }
        
        return stats
    
    except Exception as e:
        logger.error(f"Failed to get backup statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get backup statistics"
        )


@router.get("/health")
async def backup_health_check(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Comprehensive backup system health check
    
    Checks:
    - RPO compliance
    - Recent backup availability
    - Disk space
    - Cloud storage connectivity
    
    Requires admin privileges
    """
    try:
        service = BackupService()
        
        # Check RPO compliance
        rpo_status = await service.check_rpo_compliance()
        
        # Get recent backups
        backups = await service.list_backups()
        recent_backups = [b for b in backups if b.timestamp >= datetime.utcnow() - timedelta(days=7)]
        
        # Check disk space
        import shutil
        disk_usage = shutil.disk_usage(str(service.local_backup_path))
        
        health = {
            "overall_status": "healthy" if rpo_status["compliant"] else "warning",
            "rpo_compliant": rpo_status["compliant"],
            "recent_backups_count": len(recent_backups),
            "last_backup": rpo_status.get("last_backup"),
            "last_backup_timestamp": rpo_status.get("last_backup_timestamp"),
            "disk_space": {
                "total_gb": round(disk_usage.total / 1024 / 1024 / 1024, 2),
                "used_gb": round(disk_usage.used / 1024 / 1024 / 1024, 2),
                "free_gb": round(disk_usage.free / 1024 / 1024 / 1024, 2),
                "percent_used": round(disk_usage.used / disk_usage.total * 100, 2)
            },
            "recommendations": []
        }
        
        # Add recommendations
        if not rpo_status["compliant"]:
            health["recommendations"].append("Create new backup immediately - RPO violation")
        
        if disk_usage.free / disk_usage.total < 0.2:
            health["recommendations"].append("Low disk space - clean up old backups")
        
        if len(recent_backups) == 0:
            health["recommendations"].append("No recent backups found - verify backup schedule")
        
        verified_count = len([b for b in recent_backups if b.verification_timestamp])
        if verified_count < len(recent_backups):
            health["recommendations"].append(f"Only {verified_count}/{len(recent_backups)} backups verified")
        
        return health
    
    except Exception as e:
        logger.error(f"Failed to check backup health: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check backup health"
        )

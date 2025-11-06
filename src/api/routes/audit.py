"""
Audit Logging API Routes

Provides endpoints for querying and analyzing security audit logs
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, desc
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import csv
import io
import logging

from src.config.database import get_db
from src.auth.dependencies import get_current_user, require_admin
from src.models.permission import AuditLog
from src.services.audit_service import AuditService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/audit", tags=["Audit"])


class AuditLogResponse(BaseModel):
    """Audit log response model"""
    id: int
    user_id: Optional[int]
    action: str
    resource_type: str
    resource_id: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    success: bool
    severity: str
    metadata: Optional[Dict[str, Any]]
    timestamp: datetime
    
    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Paginated audit log list response"""
    logs: List[AuditLogResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AuditStatisticsResponse(BaseModel):
    """Audit log statistics response"""
    total_events: int
    successful_events: int
    failed_events: int
    critical_events: int
    warning_events: int
    info_events: int
    unique_users: int
    unique_ips: int
    events_by_action: Dict[str, int]
    events_by_resource: Dict[str, int]
    events_by_severity: Dict[str, int]
    events_by_day: List[Dict[str, Any]]
    top_users: List[Dict[str, Any]]
    top_ips: List[Dict[str, Any]]
    failed_logins: int
    successful_logins: int
    access_denied_count: int


@router.get("/logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    user_id: Optional[int] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    severity: Optional[str] = Query(None, description="Filter by severity (info/warning/critical)"),
    success: Optional[bool] = Query(None, description="Filter by success status"),
    ip_address: Optional[str] = Query(None, description="Filter by IP address"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=1000, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Query audit logs with filtering and pagination
    
    Requires admin privileges
    """
    try:
        # Build query
        query = select(AuditLog)
        filters = []
        
        if user_id:
            filters.append(AuditLog.user_id == user_id)
        
        if action:
            filters.append(AuditLog.action == action)
        
        if resource_type:
            filters.append(AuditLog.resource_type == resource_type)
        
        if severity:
            filters.append(AuditLog.severity == severity)
        
        if success is not None:
            filters.append(AuditLog.success == success)
        
        if ip_address:
            filters.append(AuditLog.ip_address == ip_address)
        
        if start_date:
            filters.append(AuditLog.timestamp >= start_date)
        
        if end_date:
            filters.append(AuditLog.timestamp <= end_date)
        
        if filters:
            query = query.where(and_(*filters))
        
        # Get total count
        count_query = select(func.count()).select_from(AuditLog)
        if filters:
            count_query = count_query.where(and_(*filters))
        
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Apply pagination and ordering
        query = query.order_by(desc(AuditLog.timestamp))
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        # Execute query
        result = await db.execute(query)
        logs = result.scalars().all()
        
        # Convert to response models
        log_responses = []
        for log in logs:
            import json
            metadata = json.loads(log.extra_metadata) if log.extra_metadata else None
            
            log_responses.append(AuditLogResponse(
                id=log.id,
                user_id=log.user_id,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                ip_address=log.ip_address,
                user_agent=log.user_agent,
                success=log.success,
                severity=log.severity,
                metadata=metadata,
                timestamp=log.timestamp
            ))
        
        total_pages = (total + page_size - 1) // page_size
        
        return AuditLogListResponse(
            logs=log_responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    
    except Exception as e:
        logger.error(f"Failed to retrieve audit logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve audit logs"
        )


@router.get("/statistics", response_model=AuditStatisticsResponse)
async def get_audit_statistics(
    start_date: Optional[datetime] = Query(None, description="Start date for statistics"),
    end_date: Optional[datetime] = Query(None, description="End date for statistics"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Get audit log statistics and analytics
    
    Requires admin privileges
    """
    try:
        audit_service = AuditService(db)
        
        # Use default date range if not provided (last 30 days)
        if not end_date:
            end_date = datetime.utcnow()
        
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        stats = await audit_service.get_audit_log_statistics(start_date, end_date)
        
        return AuditStatisticsResponse(**stats)
    
    except Exception as e:
        logger.error(f"Failed to retrieve audit statistics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve audit statistics"
        )


@router.get("/user/{user_id}", response_model=AuditLogListResponse)
async def get_user_audit_logs(
    user_id: int,
    action: Optional[str] = Query(None, description="Filter by action type"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=1000, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Get all audit logs for a specific user
    
    Requires admin privileges
    """
    try:
        # Build filters
        filters = [AuditLog.user_id == user_id]
        
        if action:
            filters.append(AuditLog.action == action)
        
        if start_date:
            filters.append(AuditLog.timestamp >= start_date)
        
        if end_date:
            filters.append(AuditLog.timestamp <= end_date)
        
        # Get total count
        count_query = select(func.count()).select_from(AuditLog).where(and_(*filters))
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get logs
        query = select(AuditLog).where(and_(*filters))
        query = query.order_by(desc(AuditLog.timestamp))
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await db.execute(query)
        logs = result.scalars().all()
        
        # Convert to response models
        import json
        log_responses = [
            AuditLogResponse(
                id=log.id,
                user_id=log.user_id,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                ip_address=log.ip_address,
                user_agent=log.user_agent,
                success=log.success,
                severity=log.severity,
                metadata=json.loads(log.extra_metadata) if log.extra_metadata else None,
                timestamp=log.timestamp
            )
            for log in logs
        ]
        
        total_pages = (total + page_size - 1) // page_size
        
        return AuditLogListResponse(
            logs=log_responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    
    except Exception as e:
        logger.error(f"Failed to retrieve user audit logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user audit logs"
        )


@router.get("/security", response_model=AuditLogListResponse)
async def get_security_events(
    severity: Optional[str] = Query(None, description="Filter by severity"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=1000, description="Items per page"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Get all security-related events
    
    Includes: failed logins, access denied, SQL injection attempts,
    excessive failed logins, unusual activity, security incidents
    
    Requires admin privileges
    """
    try:
        # Security-related actions
        security_actions = [
            "login_failed",
            "access_denied",
            "sql_injection_attempt",
            "excessive_failed_logins",
            "unusual_activity",
            "security_incident",
            "account_lockout"
        ]
        
        # Build filters
        filters = [AuditLog.action.in_(security_actions)]
        
        if severity:
            filters.append(AuditLog.severity == severity)
        
        if start_date:
            filters.append(AuditLog.timestamp >= start_date)
        
        if end_date:
            filters.append(AuditLog.timestamp <= end_date)
        
        # Get total count
        count_query = select(func.count()).select_from(AuditLog).where(and_(*filters))
        total_result = await db.execute(count_query)
        total = total_result.scalar()
        
        # Get logs
        query = select(AuditLog).where(and_(*filters))
        query = query.order_by(desc(AuditLog.timestamp))
        query = query.offset((page - 1) * page_size).limit(page_size)
        
        result = await db.execute(query)
        logs = result.scalars().all()
        
        # Convert to response models
        import json
        log_responses = [
            AuditLogResponse(
                id=log.id,
                user_id=log.user_id,
                action=log.action,
                resource_type=log.resource_type,
                resource_id=log.resource_id,
                ip_address=log.ip_address,
                user_agent=log.user_agent,
                success=log.success,
                severity=log.severity,
                metadata=json.loads(log.extra_metadata) if log.extra_metadata else None,
                timestamp=log.timestamp
            )
            for log in logs
        ]
        
        total_pages = (total + page_size - 1) // page_size
        
        return AuditLogListResponse(
            logs=log_responses,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages
        )
    
    except Exception as e:
        logger.error(f"Failed to retrieve security events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve security events"
        )


@router.get("/failed-logins")
async def get_failed_logins(
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum results"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Get failed login attempts
    
    Useful for security monitoring and detecting brute force attacks
    """
    try:
        filters = [AuditLog.action == "login_failed"]
        
        if start_date:
            filters.append(AuditLog.timestamp >= start_date)
        
        if end_date:
            filters.append(AuditLog.timestamp <= end_date)
        
        query = select(AuditLog).where(and_(*filters))
        query = query.order_by(desc(AuditLog.timestamp)).limit(limit)
        
        result = await db.execute(query)
        logs = result.scalars().all()
        
        import json
        return {
            "total": len(logs),
            "failed_logins": [
                {
                    "username": json.loads(log.extra_metadata).get("username") if log.extra_metadata else None,
                    "ip_address": log.ip_address,
                    "reason": json.loads(log.extra_metadata).get("reason") if log.extra_metadata else None,
                    "timestamp": log.timestamp.isoformat(),
                    "user_agent": log.user_agent
                }
                for log in logs
            ]
        }
    
    except Exception as e:
        logger.error(f"Failed to retrieve failed logins: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve failed logins"
        )


@router.get("/export/csv")
async def export_audit_logs_csv(
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(10000, ge=1, le=100000, description="Maximum records to export"),
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Export audit logs to CSV format
    
    Requires admin privileges
    """
    try:
        # Build query
        query = select(AuditLog)
        filters = []
        
        if user_id:
            filters.append(AuditLog.user_id == user_id)
        
        if action:
            filters.append(AuditLog.action == action)
        
        if resource_type:
            filters.append(AuditLog.resource_type == resource_type)
        
        if severity:
            filters.append(AuditLog.severity == severity)
        
        if start_date:
            filters.append(AuditLog.timestamp >= start_date)
        
        if end_date:
            filters.append(AuditLog.timestamp <= end_date)
        
        if filters:
            query = query.where(and_(*filters))
        
        query = query.order_by(desc(AuditLog.timestamp)).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        logs = result.scalars().all()
        
        # Create CSV
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "ID", "User ID", "Action", "Resource Type", "Resource ID",
            "IP Address", "User Agent", "Success", "Severity",
            "Metadata", "Timestamp"
        ])
        
        # Write data
        for log in logs:
            writer.writerow([
                log.id,
                log.user_id,
                log.action,
                log.resource_type,
                log.resource_id,
                log.ip_address,
                log.user_agent,
                log.success,
                log.severity,
                log.extra_metadata,
                log.timestamp.isoformat()
            ])
        
        # Prepare response
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=audit_logs_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
    
    except Exception as e:
        logger.error(f"Failed to export audit logs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export audit logs"
        )


@router.get("/actions")
async def get_available_actions(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Get list of all available audit log actions
    
    Useful for filtering and understanding what events are tracked
    """
    try:
        query = select(AuditLog.action).distinct()
        result = await db.execute(query)
        actions = [row[0] for row in result.all()]
        
        # Categorize actions
        categorized = {
            "authentication": [],
            "authorization": [],
            "data_access": [],
            "administrative": [],
            "security": []
        }
        
        for action in actions:
            if action in ["login_success", "login_failed", "logout", "password_change", "account_lockout"]:
                categorized["authentication"].append(action)
            elif action in ["access_denied", "privilege_escalation", "permission_change"]:
                categorized["authorization"].append(action)
            elif action in ["pii_access", "resume_download", "bulk_export", "data_deletion"]:
                categorized["data_access"].append(action)
            elif action in ["config_change", "user_creation", "user_deletion", "system_settings_change"]:
                categorized["administrative"].append(action)
            elif action in ["sql_injection_attempt", "excessive_failed_logins", "unusual_activity", "security_incident"]:
                categorized["security"].append(action)
            else:
                # Unknown category
                if "other" not in categorized:
                    categorized["other"] = []
                categorized["other"].append(action)
        
        return {
            "total_actions": len(actions),
            "all_actions": sorted(actions),
            "categorized": categorized
        }
    
    except Exception as e:
        logger.error(f"Failed to retrieve available actions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve available actions"
        )


@router.get("/resource-types")
async def get_resource_types(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    """
    Get list of all resource types tracked in audit logs
    """
    try:
        query = select(AuditLog.resource_type).distinct()
        result = await db.execute(query)
        resource_types = [row[0] for row in result.all() if row[0]]
        
        return {
            "total": len(resource_types),
            "resource_types": sorted(resource_types)
        }
    
    except Exception as e:
        logger.error(f"Failed to retrieve resource types: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve resource types"
        )

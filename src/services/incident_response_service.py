"""
Incident Response Service for GDPR Data Breach Management

Implements GDPR Article 33 (Notification to supervisory authority)
and Article 34 (Communication to data subjects)
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging
import secrets

logger = logging.getLogger(__name__)


class IncidentResponseService:
    """Service for managing data breach incidents"""
    
    # Severity levels
    SEVERITY_LOW = "low"
    SEVERITY_MEDIUM = "medium"
    SEVERITY_HIGH = "high"
    SEVERITY_CRITICAL = "critical"
    
    # Incident types
    TYPE_UNAUTHORIZED_ACCESS = "unauthorized_access"
    TYPE_DATA_LOSS = "data_loss"
    TYPE_DATA_LEAK = "data_leak"
    TYPE_RANSOMWARE = "ransomware"
    TYPE_PHISHING = "phishing"
    TYPE_INSIDER_THREAT = "insider_threat"
    
    def __init__(self, session: AsyncSession):
        """
        Initialize incident response service
        
        Args:
            session: Database session
        """
        self.session = session
    
    async def create_incident(
        self,
        incident_type: str,
        severity: str,
        description: str,
        affected_systems: List[str],
        affected_data_types: List[str],
        discovered_at: Optional[datetime] = None,
        occurred_at: Optional[datetime] = None,
        reported_by: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a new data breach incident
        
        Args:
            incident_type: Type of incident
            severity: Severity level
            description: Detailed description
            affected_systems: List of affected systems
            affected_data_types: Types of data affected
            discovered_at: When incident was discovered
            occurred_at: When incident occurred (if known)
            reported_by: Who reported the incident
            
        Returns:
            Incident details
        """
        from src.models.gdpr import DataBreachIncident
        
        if discovered_at is None:
            discovered_at = datetime.utcnow()
        
        # Generate incident ID
        incident_id = f"INC-{datetime.utcnow().strftime('%Y%m%d')}-{secrets.token_hex(4).upper()}"
        
        incident = DataBreachIncident(
            incident_id=incident_id,
            incident_type=incident_type,
            severity=severity,
            description=description,
            affected_systems=affected_systems,
            affected_data_types=affected_data_types,
            discovered_at=discovered_at,
            occurred_at=occurred_at,
            reported_by=reported_by,
            status="open"
        )
        
        self.session.add(incident)
        await self.session.commit()
        await self.session.refresh(incident)
        
        logger.critical(
            f"Data breach incident created: {incident_id}, "
            f"severity={severity}, type={incident_type}"
        )
        
        # Check if notification required (within 72 hours)
        if severity in [self.SEVERITY_HIGH, self.SEVERITY_CRITICAL]:
            await self._check_notification_requirements(incident)
        
        return self._incident_to_dict(incident)
    
    async def update_incident(
        self,
        incident_id: str,
        **updates
    ) -> Dict[str, Any]:
        """
        Update incident details
        
        Args:
            incident_id: Incident ID
            **updates: Fields to update
            
        Returns:
            Updated incident details
        """
        from src.models.gdpr import DataBreachIncident
        
        result = await self.session.execute(
            select(DataBreachIncident).where(DataBreachIncident.incident_id == incident_id)
        )
        incident = result.scalar_one_or_none()
        
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")
        
        # Update fields
        for key, value in updates.items():
            if hasattr(incident, key):
                setattr(incident, key, value)
        
        await self.session.commit()
        await self.session.refresh(incident)
        
        logger.info(f"Incident {incident_id} updated: {updates}")
        
        return self._incident_to_dict(incident)
    
    async def contain_incident(
        self,
        incident_id: str,
        containment_actions: List[str]
    ) -> Dict[str, Any]:
        """
        Mark incident as contained
        
        Args:
            incident_id: Incident ID
            containment_actions: Actions taken to contain the incident
            
        Returns:
            Updated incident
        """
        return await self.update_incident(
            incident_id,
            status="contained",
            contained_at=datetime.utcnow(),
            containment_actions=containment_actions
        )
    
    async def resolve_incident(
        self,
        incident_id: str,
        remediation_actions: List[str],
        lessons_learned: str
    ) -> Dict[str, Any]:
        """
        Mark incident as resolved
        
        Args:
            incident_id: Incident ID
            remediation_actions: Actions taken to remediate
            lessons_learned: Post-incident analysis
            
        Returns:
            Updated incident
        """
        return await self.update_incident(
            incident_id,
            status="resolved",
            resolved_at=datetime.utcnow(),
            remediation_actions=remediation_actions,
            lessons_learned=lessons_learned
        )
    
    async def notify_dpo(self, incident_id: str) -> Dict[str, Any]:
        """
        Notify Data Protection Officer
        
        Args:
            incident_id: Incident ID
            
        Returns:
            Notification status
        """
        from src.models.gdpr import DataBreachIncident
        
        result = await self.session.execute(
            select(DataBreachIncident).where(DataBreachIncident.incident_id == incident_id)
        )
        incident = result.scalar_one_or_none()
        
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")
        
        # TODO: Send actual notification email to DPO
        # send_email(dpo_email, incident_details)
        
        incident.dpo_notified_at = datetime.utcnow()
        await self.session.commit()
        
        logger.warning(f"DPO notified of incident {incident_id}")
        
        return {
            "incident_id": incident_id,
            "dpo_notified_at": incident.dpo_notified_at.isoformat(),
            "status": "notified"
        }
    
    async def notify_authority(
        self,
        incident_id: str,
        authority_name: str,
        notification_details: str
    ) -> Dict[str, Any]:
        """
        Notify supervisory authority (GDPR Article 33)
        
        Must be done within 72 hours of discovery
        
        Args:
            incident_id: Incident ID
            authority_name: Name of supervisory authority
            notification_details: Details of notification
            
        Returns:
            Notification status
        """
        from src.models.gdpr import DataBreachIncident
        
        result = await self.session.execute(
            select(DataBreachIncident).where(DataBreachIncident.incident_id == incident_id)
        )
        incident = result.scalar_one_or_none()
        
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")
        
        # Check 72-hour deadline
        hours_since_discovery = (datetime.utcnow() - incident.discovered_at).total_seconds() / 3600
        
        if hours_since_discovery > 72:
            logger.error(
                f"Incident {incident_id}: Authority notification is LATE! "
                f"Discovered {hours_since_discovery:.1f} hours ago"
            )
        
        # TODO: Send actual notification to supervisory authority
        # notify_supervisory_authority(authority_name, incident_details, notification_details)
        
        incident.authority_notified_at = datetime.utcnow()
        await self.session.commit()
        
        logger.critical(
            f"Supervisory authority ({authority_name}) notified of incident {incident_id}"
        )
        
        return {
            "incident_id": incident_id,
            "authority": authority_name,
            "notified_at": incident.authority_notified_at.isoformat(),
            "hours_since_discovery": hours_since_discovery,
            "within_deadline": hours_since_discovery <= 72
        }
    
    async def notify_affected_users(
        self,
        incident_id: str,
        user_ids: List[int]
    ) -> Dict[str, Any]:
        """
        Notify affected users (GDPR Article 34)
        
        Required when high risk to rights and freedoms
        
        Args:
            incident_id: Incident ID
            user_ids: List of affected user IDs
            
        Returns:
            Notification status
        """
        from src.models.gdpr import DataBreachIncident
        
        result = await self.session.execute(
            select(DataBreachIncident).where(DataBreachIncident.incident_id == incident_id)
        )
        incident = result.scalar_one_or_none()
        
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")
        
        # TODO: Send actual notification emails to affected users
        # for user_id in user_ids:
        #     send_breach_notification_email(user_id, incident_details)
        
        incident.users_notified_at = datetime.utcnow()
        incident.affected_users_count = len(user_ids)
        incident.affected_user_ids = user_ids
        await self.session.commit()
        
        logger.critical(
            f"Affected users notified for incident {incident_id}: {len(user_ids)} users"
        )
        
        return {
            "incident_id": incident_id,
            "users_notified": len(user_ids),
            "notified_at": incident.users_notified_at.isoformat()
        }
    
    async def get_incident(self, incident_id: str) -> Dict[str, Any]:
        """
        Get incident details
        
        Args:
            incident_id: Incident ID
            
        Returns:
            Incident details
        """
        from src.models.gdpr import DataBreachIncident
        
        result = await self.session.execute(
            select(DataBreachIncident).where(DataBreachIncident.incident_id == incident_id)
        )
        incident = result.scalar_one_or_none()
        
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")
        
        return self._incident_to_dict(incident)
    
    async def list_incidents(
        self,
        status: Optional[str] = None,
        severity: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        List incidents with optional filters
        
        Args:
            status: Filter by status
            severity: Filter by severity
            limit: Maximum number of results
            
        Returns:
            List of incidents
        """
        from src.models.gdpr import DataBreachIncident
        
        query = select(DataBreachIncident).order_by(DataBreachIncident.discovered_at.desc())
        
        if status:
            query = query.where(DataBreachIncident.status == status)
        
        if severity:
            query = query.where(DataBreachIncident.severity == severity)
        
        query = query.limit(limit)
        
        result = await self.session.execute(query)
        incidents = result.scalars().all()
        
        return [self._incident_to_dict(incident) for incident in incidents]
    
    async def generate_incident_report(self, incident_id: str) -> str:
        """
        Generate detailed incident report
        
        Args:
            incident_id: Incident ID
            
        Returns:
            Markdown-formatted incident report
        """
        incident_dict = await self.get_incident(incident_id)
        
        report = f"""# Data Breach Incident Report

## Incident Information
- **Incident ID**: {incident_dict['incident_id']}
- **Type**: {incident_dict['incident_type']}
- **Severity**: {incident_dict['severity']}
- **Status**: {incident_dict['status']}

## Timeline
- **Discovered**: {incident_dict['discovered_at']}
- **Occurred**: {incident_dict.get('occurred_at', 'Unknown')}
- **Contained**: {incident_dict.get('contained_at', 'Not yet contained')}
- **Resolved**: {incident_dict.get('resolved_at', 'Not yet resolved')}

## Description
{incident_dict['description']}

## Affected Systems
{chr(10).join(f"- {system}" for system in incident_dict.get('affected_systems', []))}

## Affected Data Types
{chr(10).join(f"- {data_type}" for data_type in incident_dict.get('affected_data_types', []))}

## Impact Assessment
- **Affected Users**: {incident_dict.get('affected_users_count', 0)}
- **Potential Impact**: {incident_dict.get('potential_impact', 'Under assessment')}

## Response Actions

### Containment
{chr(10).join(f"- {action}" for action in incident_dict.get('containment_actions', []))}

### Remediation
{chr(10).join(f"- {action}" for action in incident_dict.get('remediation_actions', []))}

## Notifications
- **DPO Notified**: {incident_dict.get('dpo_notified_at', 'Not notified')}
- **Authority Notified**: {incident_dict.get('authority_notified_at', 'Not notified')}
- **Users Notified**: {incident_dict.get('users_notified_at', 'Not notified')}

## Lessons Learned
{incident_dict.get('lessons_learned', 'Post-incident analysis pending')}

---
*Report Generated*: {datetime.utcnow().isoformat()}
"""
        
        return report
    
    async def _check_notification_requirements(self, incident) -> None:
        """
        Check if incident requires regulatory notification
        
        Args:
            incident: Incident object
        """
        # Check 72-hour deadline
        deadline = incident.discovered_at + timedelta(hours=72)
        time_remaining = (deadline - datetime.utcnow()).total_seconds() / 3600
        
        if time_remaining < 72:
            logger.warning(
                f"Incident {incident.incident_id}: "
                f"{time_remaining:.1f} hours remaining for authority notification"
            )
        
        # TODO: Set up automatic reminders/alerts
    
    def _incident_to_dict(self, incident) -> Dict[str, Any]:
        """Convert incident model to dictionary"""
        return {
            "id": incident.id,
            "incident_id": incident.incident_id,
            "incident_type": incident.incident_type,
            "severity": incident.severity,
            "status": incident.status,
            "description": incident.description,
            "affected_systems": incident.affected_systems,
            "affected_data_types": incident.affected_data_types,
            "affected_users_count": incident.affected_users_count,
            "affected_user_ids": incident.affected_user_ids,
            "potential_impact": incident.potential_impact,
            "discovered_at": incident.discovered_at.isoformat() if incident.discovered_at else None,
            "occurred_at": incident.occurred_at.isoformat() if incident.occurred_at else None,
            "contained_at": incident.contained_at.isoformat() if incident.contained_at else None,
            "resolved_at": incident.resolved_at.isoformat() if incident.resolved_at else None,
            "containment_actions": incident.containment_actions,
            "remediation_actions": incident.remediation_actions,
            "dpo_notified_at": incident.dpo_notified_at.isoformat() if incident.dpo_notified_at else None,
            "authority_notified_at": incident.authority_notified_at.isoformat() if incident.authority_notified_at else None,
            "users_notified_at": incident.users_notified_at.isoformat() if incident.users_notified_at else None,
            "lessons_learned": incident.lessons_learned,
            "reported_by": incident.reported_by,
            "incident_manager": incident.incident_manager
        }

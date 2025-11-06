"""GDPR compliance models"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, TimestampMixin


class UserConsent(Base, TimestampMixin):
    """User consent tracking for GDPR compliance"""
    __tablename__ = "user_consents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
    # Consent details
    consent_type = Column(String(100), nullable=False, index=True)  # privacy_policy, marketing, cookies, etc.
    consent_given = Column(Boolean, nullable=False)
    consent_text = Column(Text)  # Text of consent at time of agreement
    consent_version = Column(String(50))  # Version of policy/terms
    
    # Tracking
    consent_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    ip_address = Column(String(45))  # IP where consent was given
    user_agent = Column(Text)  # Browser/device info
    
    # Expiry and withdrawal
    consent_expires_at = Column(DateTime)  # If consent has expiry
    withdrawn_at = Column(DateTime)  # If consent was withdrawn
    
    # Relationship
    user = relationship("User", foreign_keys=[user_id])
    
    def __repr__(self):
        return f"<UserConsent(user_id={self.user_id}, type={self.consent_type}, given={self.consent_given})>"


class DataProcessingRecord(Base, TimestampMixin):
    """Record of Processing Activities (ROPA) - GDPR Article 30"""
    __tablename__ = "data_processing_records"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Processing details
    processing_activity = Column(String(255), nullable=False)  # e.g., "User Registration"
    purpose = Column(Text, nullable=False)  # Purpose of processing
    legal_basis = Column(String(100), nullable=False)  # consent, contract, legal_obligation, etc.
    
    # Data categories
    data_categories = Column(JSON)  # ["personal_data", "contact_info", "employment_history"]
    data_subjects = Column(JSON)  # ["users", "job_applicants"]
    
    # Recipients
    recipients = Column(JSON)  # Who receives the data
    third_country_transfers = Column(JSON)  # Transfers outside EU/EEA
    
    # Retention
    retention_period = Column(String(100))  # e.g., "2 years after account closure"
    
    # Security measures
    security_measures = Column(JSON)  # Technical and organizational measures
    
    # Responsible parties
    controller = Column(String(255))  # Data controller
    processor = Column(String(255))  # Data processor (if applicable)
    dpo_contact = Column(String(255))  # Data Protection Officer contact
    
    # Metadata
    last_reviewed = Column(DateTime)
    review_frequency = Column(String(50))  # annual, quarterly, etc.
    
    def __repr__(self):
        return f"<DataProcessingRecord(activity={self.processing_activity}, legal_basis={self.legal_basis})>"


class DataBreachIncident(Base, TimestampMixin):
    """Data breach incident tracking for GDPR Article 33/34 compliance"""
    __tablename__ = "data_breach_incidents"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Incident identification
    incident_id = Column(String(100), unique=True, nullable=False, index=True)
    incident_type = Column(String(100), nullable=False)  # unauthorized_access, data_loss, etc.
    severity = Column(String(20), nullable=False)  # low, medium, high, critical
    
    # Incident details
    description = Column(Text, nullable=False)
    affected_systems = Column(JSON)  # List of affected systems
    affected_data_types = Column(JSON)  # Types of data affected
    
    # Impact assessment
    affected_users_count = Column(Integer)  # Number of users affected
    affected_user_ids = Column(JSON)  # List of affected user IDs
    potential_impact = Column(Text)  # Assessment of potential harm
    
    # Timeline
    discovered_at = Column(DateTime, nullable=False)
    occurred_at = Column(DateTime)  # When breach actually occurred (if known)
    contained_at = Column(DateTime)  # When breach was contained
    resolved_at = Column(DateTime)  # When fully resolved
    
    # Response
    containment_actions = Column(JSON)  # Actions taken to contain breach
    remediation_actions = Column(JSON)  # Actions taken to remediate
    
    # Notifications
    dpo_notified_at = Column(DateTime)  # When DPO was notified
    authority_notified_at = Column(DateTime)  # When supervisory authority notified
    users_notified_at = Column(DateTime)  # When affected users notified
    
    # Status
    status = Column(String(50), nullable=False)  # open, contained, resolved, closed
    
    # Documentation
    incident_report = Column(Text)  # Detailed incident report
    lessons_learned = Column(Text)  # Post-incident analysis
    
    # Responsible parties
    reported_by = Column(String(255))
    incident_manager = Column(String(255))
    
    def __repr__(self):
        return f"<DataBreachIncident(id={self.incident_id}, severity={self.severity}, status={self.status})>"


class DataDeletionRequest(Base, TimestampMixin):
    """Track GDPR data deletion requests"""
    __tablename__ = "data_deletion_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
    # Request details
    request_type = Column(String(50), nullable=False)  # full_deletion, anonymization
    reason = Column(Text)  # User's reason for deletion
    
    # Status
    status = Column(String(50), nullable=False)  # pending, processing, completed, rejected
    
    # Timeline
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Results
    deletion_results = Column(JSON)  # Results of deletion process
    retention_reason = Column(Text)  # If data retained, reason why
    
    # Verification
    verification_token = Column(String(255))  # Token for email verification
    verified_at = Column(DateTime)  # When user verified the request
    
    # Relationship
    user = relationship("User", foreign_keys=[user_id])
    
    def __repr__(self):
        return f"<DataDeletionRequest(user_id={self.user_id}, status={self.status})>"


class DataAccessRequest(Base, TimestampMixin):
    """Track GDPR data access requests (Article 15)"""
    __tablename__ = "data_access_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    
    # Request details
    request_format = Column(String(20))  # json, csv, pdf
    
    # Status
    status = Column(String(50), nullable=False)  # pending, processing, completed
    
    # Timeline
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime)
    
    # Results
    export_file_path = Column(String(500))  # Path to exported data file
    export_expires_at = Column(DateTime)  # When export file expires
    
    # Download tracking
    downloaded = Column(Boolean, default=False)
    downloaded_at = Column(DateTime)
    download_count = Column(Integer, default=0)
    
    # Relationship
    user = relationship("User", foreign_keys=[user_id])
    
    def __repr__(self):
        return f"<DataAccessRequest(user_id={self.user_id}, status={self.status})>"

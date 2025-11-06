"""Add GDPR compliance tables

Revision ID: 20251105_add_gdpr_compliance
Revises: 20251105_add_encryption_support
Create Date: 2025-11-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '20251105_add_gdpr_compliance'
down_revision = '20251105_add_encryption_support'
branch_labels = None
depends_on = None


def upgrade():
    """Add GDPR compliance tables"""
    
    # User consents table (GDPR Article 7)
    op.create_table(
        'user_consents',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('consent_type', sa.String(100), nullable=False, index=True),
        sa.Column('consent_given', sa.Boolean(), nullable=False),
        sa.Column('consent_text', sa.Text(), nullable=True),
        sa.Column('consent_version', sa.String(50), nullable=True),
        sa.Column('consent_timestamp', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('consent_expires_at', sa.DateTime(), nullable=True),
        sa.Column('withdrawn_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    
    op.create_index('idx_user_consents_user_type', 'user_consents', ['user_id', 'consent_type'])
    
    # Data processing records table (GDPR Article 30 - ROPA)
    op.create_table(
        'data_processing_records',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('processing_activity', sa.String(255), nullable=False),
        sa.Column('purpose', sa.Text(), nullable=False),
        sa.Column('legal_basis', sa.String(100), nullable=False),
        sa.Column('data_categories', sa.JSON(), nullable=True),
        sa.Column('data_subjects', sa.JSON(), nullable=True),
        sa.Column('recipients', sa.JSON(), nullable=True),
        sa.Column('third_country_transfers', sa.JSON(), nullable=True),
        sa.Column('retention_period', sa.String(100), nullable=True),
        sa.Column('security_measures', sa.JSON(), nullable=True),
        sa.Column('controller', sa.String(255), nullable=True),
        sa.Column('processor', sa.String(255), nullable=True),
        sa.Column('dpo_contact', sa.String(255), nullable=True),
        sa.Column('last_reviewed', sa.DateTime(), nullable=True),
        sa.Column('review_frequency', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    
    # Data breach incidents table (GDPR Article 33/34)
    op.create_table(
        'data_breach_incidents',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('incident_id', sa.String(100), unique=True, nullable=False, index=True),
        sa.Column('incident_type', sa.String(100), nullable=False),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('affected_systems', sa.JSON(), nullable=True),
        sa.Column('affected_data_types', sa.JSON(), nullable=True),
        sa.Column('affected_users_count', sa.Integer(), nullable=True),
        sa.Column('affected_user_ids', sa.JSON(), nullable=True),
        sa.Column('potential_impact', sa.Text(), nullable=True),
        sa.Column('discovered_at', sa.DateTime(), nullable=False),
        sa.Column('occurred_at', sa.DateTime(), nullable=True),
        sa.Column('contained_at', sa.DateTime(), nullable=True),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.Column('containment_actions', sa.JSON(), nullable=True),
        sa.Column('remediation_actions', sa.JSON(), nullable=True),
        sa.Column('dpo_notified_at', sa.DateTime(), nullable=True),
        sa.Column('authority_notified_at', sa.DateTime(), nullable=True),
        sa.Column('users_notified_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('incident_report', sa.Text(), nullable=True),
        sa.Column('lessons_learned', sa.Text(), nullable=True),
        sa.Column('reported_by', sa.String(255), nullable=True),
        sa.Column('incident_manager', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    
    op.create_index('idx_breach_severity_status', 'data_breach_incidents', ['severity', 'status'])
    op.create_index('idx_breach_discovered', 'data_breach_incidents', ['discovered_at'])
    
    # Data deletion requests table (GDPR Article 17)
    op.create_table(
        'data_deletion_requests',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('request_type', sa.String(50), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('requested_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('processed_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('deletion_results', sa.JSON(), nullable=True),
        sa.Column('retention_reason', sa.Text(), nullable=True),
        sa.Column('verification_token', sa.String(255), nullable=True),
        sa.Column('verified_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    
    op.create_index('idx_deletion_status', 'data_deletion_requests', ['status'])
    
    # Data access requests table (GDPR Article 15)
    op.create_table(
        'data_access_requests',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('request_format', sa.String(20), nullable=True),
        sa.Column('status', sa.String(50), nullable=False),
        sa.Column('requested_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('export_file_path', sa.String(500), nullable=True),
        sa.Column('export_expires_at', sa.DateTime(), nullable=True),
        sa.Column('downloaded', sa.Boolean(), default=False),
        sa.Column('downloaded_at', sa.DateTime(), nullable=True),
        sa.Column('download_count', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    
    op.create_index('idx_access_status', 'data_access_requests', ['status'])


def downgrade():
    """Remove GDPR compliance tables"""
    
    op.drop_table('data_access_requests')
    op.drop_table('data_deletion_requests')
    op.drop_table('data_breach_incidents')
    op.drop_table('data_processing_records')
    op.drop_table('user_consents')

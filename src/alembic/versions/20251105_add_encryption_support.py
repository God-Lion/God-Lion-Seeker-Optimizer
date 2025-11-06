"""Add encryption support to PII fields

Revision ID: 20251105_add_encryption_support
Revises: 20251105_add_rbac_permission_tables
Create Date: 2025-11-05

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '20251105_add_encryption_support'
down_revision = '20251105_rbac'
branch_labels = None
depends_on = None


def upgrade():
    """
    Upgrade database schema to support encryption
    
    Note: This migration prepares the schema for encrypted data.
    Actual data encryption should be performed separately using the encryption service.
    """
    
    # Modify users table to accommodate encrypted data
    # Encrypted data is longer than plaintext, so we need to increase column sizes
    with op.batch_alter_table('users', schema=None) as batch_op:
        # Email: encrypted will be ~200+ characters
        batch_op.alter_column('email',
                              existing_type=sa.String(255),
                              type_=sa.String(500),
                              existing_nullable=False)
        
        # Name fields: encrypted will be ~200+ characters
        batch_op.alter_column('first_name',
                              existing_type=sa.String(100),
                              type_=sa.String(300),
                              existing_nullable=True)
        
        batch_op.alter_column('last_name',
                              existing_type=sa.String(100),
                              type_=sa.String(300),
                              existing_nullable=True)
        
        # Google ID: encrypted will be ~200+ characters
        batch_op.alter_column('google_id',
                              existing_type=sa.String(255),
                              type_=sa.String(500),
                              existing_nullable=True)
    
    # Add encryption metadata columns
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('is_encrypted', sa.Boolean(), default=False, nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('encryption_version', sa.String(20), nullable=True))
    
    # Modify resume_profiles table for encrypted data
    with op.batch_alter_table('resume_profiles', schema=None) as batch_op:
        # resume_file_url: store encrypted file paths
        batch_op.alter_column('resume_file_url',
                              existing_type=sa.Text(),
                              type_=sa.Text(),
                              existing_nullable=True)
        
        # Add encryption metadata
        batch_op.add_column(sa.Column('is_encrypted', sa.Boolean(), default=False, nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('encryption_version', sa.String(20), nullable=True))
    
    # Modify security_logs table for encrypted PII
    with op.batch_alter_table('security_logs', schema=None) as batch_op:
        # IP address: encrypted will be ~200+ characters
        batch_op.alter_column('ip_address',
                              existing_type=sa.String(45),
                              type_=sa.String(300),
                              existing_nullable=True)
        
        # Location: encrypted will be ~500+ characters
        batch_op.alter_column('location',
                              existing_type=sa.String(255),
                              type_=sa.String(500),
                              existing_nullable=True)
        
        # Add encryption metadata
        batch_op.add_column(sa.Column('is_encrypted', sa.Boolean(), default=False, nullable=False, server_default='0'))
        batch_op.add_column(sa.Column('encryption_version', sa.String(20), nullable=True))
    
    # Create encryption audit log table
    op.create_table(
        'encryption_audit_log',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('table_name', sa.String(100), nullable=False, index=True),
        sa.Column('record_id', sa.Integer(), nullable=False, index=True),
        sa.Column('field_name', sa.String(100), nullable=False),
        sa.Column('operation', sa.String(20), nullable=False),  # 'encrypt' or 'decrypt'
        sa.Column('encryption_version', sa.String(20), nullable=True),
        sa.Column('performed_by', sa.String(255), nullable=True),
        sa.Column('performed_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('status', sa.String(20), nullable=False),  # 'success' or 'failed'
        sa.Column('error_message', sa.Text(), nullable=True),
        mysql_charset='utf8mb4',
        mysql_collate='utf8mb4_unicode_ci'
    )
    
    # Create index for faster lookups
    op.create_index('idx_encryption_audit_table_record', 'encryption_audit_log', ['table_name', 'record_id'])


def downgrade():
    """
    Downgrade database schema
    
    Warning: This will drop encryption-related columns and the audit log.
    Make sure to decrypt all data before running this downgrade.
    """
    
    # Drop encryption audit log table
    op.drop_table('encryption_audit_log')
    
    # Revert users table changes
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('encryption_version')
        batch_op.drop_column('is_encrypted')
        
        batch_op.alter_column('email',
                              existing_type=sa.String(500),
                              type_=sa.String(255),
                              existing_nullable=False)
        
        batch_op.alter_column('first_name',
                              existing_type=sa.String(300),
                              type_=sa.String(100),
                              existing_nullable=True)
        
        batch_op.alter_column('last_name',
                              existing_type=sa.String(300),
                              type_=sa.String(100),
                              existing_nullable=True)
        
        batch_op.alter_column('google_id',
                              existing_type=sa.String(500),
                              type_=sa.String(255),
                              existing_nullable=True)
    
    # Revert resume_profiles table changes
    with op.batch_alter_table('resume_profiles', schema=None) as batch_op:
        batch_op.drop_column('encryption_version')
        batch_op.drop_column('is_encrypted')
    
    # Revert security_logs table changes
    with op.batch_alter_table('security_logs', schema=None) as batch_op:
        batch_op.drop_column('encryption_version')
        batch_op.drop_column('is_encrypted')
        
        batch_op.alter_column('ip_address',
                              existing_type=sa.String(300),
                              type_=sa.String(45),
                              existing_nullable=True)
        
        batch_op.alter_column('location',
                              existing_type=sa.String(500),
                              type_=sa.String(255),
                              existing_nullable=True)

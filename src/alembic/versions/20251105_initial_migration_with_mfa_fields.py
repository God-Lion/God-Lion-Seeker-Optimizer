"""Initial migration with MFA fields

Revision ID: 20251105
Revises:
Create Date: 2025-11-05 12:13:25.239200

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '20251105'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
    CREATE TABLE users (
        id SERIAL NOT NULL,
        email VARCHAR(255) NOT NULL,
        hashed_password VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        avatar TEXT,
        bio TEXT,
        role VARCHAR(10) NOT NULL,
        status VARCHAR(20) NOT NULL,
        email_verified BOOLEAN,
        email_verification_token VARCHAR(255),
        password_reset_token VARCHAR(255),
        password_reset_expires TIMESTAMP WITHOUT TIME ZONE,
        google_id VARCHAR(255),
        mfa_secret VARCHAR(255),
        mfa_enabled BOOLEAN,
        mfa_recovery_codes JSON,
        last_login TIMESTAMP WITHOUT TIME ZONE,
        last_activity TIMESTAMP WITHOUT TIME ZONE,
        failed_login_attempts INTEGER,
        account_locked_until TIMESTAMP WITHOUT TIME ZONE,
        preferences JSON,
        notification_settings JSON,
        application_count INTEGER,
        profile_views INTEGER,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id)
    );
    CREATE UNIQUE INDEX ix_users_email ON users (email);
    CREATE UNIQUE INDEX ix_users_google_id ON users (google_id);
    CREATE INDEX ix_users_id ON users (id);
    CREATE TABLE companies (
        id SERIAL NOT NULL,
        name VARCHAR(500) NOT NULL,
        industry VARCHAR(200),
        company_size VARCHAR(100),
        website VARCHAR(500),
        location VARCHAR(300),
        description VARCHAR(2000),
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id),
        UNIQUE (name)
    );
    CREATE INDEX idx_company_name ON companies (name);
    CREATE INDEX idx_company_industry ON companies (industry);
    CREATE INDEX idx_company_location ON companies (location);
    CREATE TABLE scraping_sessions (
        id SERIAL NOT NULL,
        session_name VARCHAR(200) NOT NULL,
        query VARCHAR(500) NOT NULL,
        location VARCHAR(200),
        platform VARCHAR(50),
        status VARCHAR(50) NOT NULL,
        total_jobs INTEGER NOT NULL,
        unique_jobs INTEGER NOT NULL,
        duplicate_jobs INTEGER NOT NULL,
        error_count INTEGER NOT NULL,
        jobs_found INTEGER NOT NULL,
        jobs_stored INTEGER NOT NULL,
        jobs_scraped INTEGER NOT NULL,
        error_message VARCHAR(1000),
        started_at TIMESTAMP WITHOUT TIME ZONE,
        completed_at TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id)
    );
    CREATE INDEX idx_session_status ON scraping_sessions (status);
    CREATE INDEX idx_session_created_at ON scraping_sessions (created_at);
    CREATE INDEX idx_session_query ON scraping_sessions (query);
    CREATE INDEX idx_session_platform ON scraping_sessions (platform);
    CREATE INDEX idx_session_location ON scraping_sessions (location);
    CREATE TABLE jobs (
        id SERIAL NOT NULL,
        job_id VARCHAR(100) NOT NULL,
        session_id INTEGER,
        company_id INTEGER,
        title VARCHAR(500) NOT NULL,
        link VARCHAR(1000) NOT NULL,
        apply_link VARCHAR(1000),
        place VARCHAR(200),
        description TEXT,
        description_html TEXT,
        date VARCHAR(100),
        date_text VARCHAR(100),
        posted_date TIMESTAMP WITHOUT TIME ZONE,
        scraped_at TIMESTAMP WITHOUT TIME ZONE,
        job_type VARCHAR(100),
        experience_level VARCHAR(100),
        location VARCHAR(200),
        job_url VARCHAR(1000),
        is_active BOOLEAN NOT NULL,
        insights JSON,
        match_score FLOAT,
        match_details JSON,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(session_id) REFERENCES scraping_sessions (id) ON DELETE SET NULL,
        FOREIGN KEY(company_id) REFERENCES companies (id) ON DELETE SET NULL
    );
    CREATE UNIQUE INDEX ix_jobs_job_id ON jobs (job_id);
    CREATE INDEX idx_jobs_title ON jobs (title);
    CREATE INDEX idx_jobs_place ON jobs (place);
    CREATE INDEX idx_jobs_is_active ON jobs (is_active);
    CREATE INDEX idx_jobs_created_at ON jobs (created_at);
    CREATE INDEX idx_jobs_company_id ON jobs (company_id);
    CREATE INDEX idx_jobs_session_id ON jobs (session_id);
    CREATE INDEX idx_jobs_location ON jobs (location);
    CREATE INDEX idx_jobs_job_type ON jobs (job_type);
    CREATE INDEX idx_jobs_experience_level ON jobs (experience_level);
    CREATE INDEX idx_jobs_posted_date ON jobs (posted_date);
    CREATE INDEX idx_jobs_scraped_at ON jobs (scraped_at);
    CREATE TABLE resume_profiles (
        id SERIAL NOT NULL,
        user_id INTEGER NOT NULL,
        name VARCHAR(255) NOT NULL,
        is_active BOOLEAN,
        resume_text TEXT,
        resume_file_url TEXT,
        parsed_data JSON,
        skills JSON,
        experience_years INTEGER,
        education JSON,
        certifications JSON,
        desired_roles JSON,
        preferred_locations JSON,
        preferred_companies JSON,
        salary_expectation JSON,
        analysis_results JSON,
        last_analyzed TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES users (id)
    );
    CREATE INDEX ix_resume_profiles_id ON resume_profiles (id);
    CREATE INDEX ix_resume_profiles_user_id ON resume_profiles (user_id);
    CREATE TABLE security_logs (
        id SERIAL NOT NULL,
        user_id INTEGER,
        event_type VARCHAR(100) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        location VARCHAR(255),
        event_metadata JSON,
        severity VARCHAR(20),
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES users (id)
    );
    CREATE INDEX ix_security_logs_id ON security_logs (id);
    CREATE INDEX ix_security_logs_user_id ON security_logs (user_id);
    CREATE TABLE notifications (
        id SERIAL NOT NULL,
        user_id INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN,
        read_at TIMESTAMP WITHOUT TIME ZONE,
        action_url TEXT,
        action_label VARCHAR(100),
        notification_metadata JSON,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES users (id)
    );
    CREATE INDEX ix_notifications_id ON notifications (id);
    CREATE INDEX ix_notifications_user_id ON notifications (user_id);
    CREATE TABLE job_analysis (
        id SERIAL NOT NULL,
        job_id INTEGER NOT NULL,
        resume_id VARCHAR(100),
        overall_match_score FLOAT NOT NULL,
        similarity_score FLOAT NOT NULL,
        skills_match_percentage FLOAT NOT NULL,
        experience_match_score FLOAT NOT NULL,
        match_category VARCHAR(50) NOT NULL,
        matching_skills JSON NOT NULL,
        missing_skills JSON NOT NULL,
        recommended_skills JSON,
        keyword_match_score FLOAT,
        top_matching_keywords JSON,
        recommendation TEXT NOT NULL,
        analyzed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        analysis_version VARCHAR(20),
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(job_id) REFERENCES jobs (id) ON DELETE CASCADE
    );
    CREATE INDEX idx_job_analysis_job_id ON job_analysis (job_id);
    CREATE INDEX idx_job_analysis_overall_score ON job_analysis (overall_match_score);
    CREATE INDEX idx_job_analysis_category ON job_analysis (match_category);
    CREATE INDEX idx_job_analysis_analyzed_at ON job_analysis (analyzed_at);
    CREATE INDEX idx_job_analysis_resume ON job_analysis (resume_id);
    CREATE UNIQUE INDEX idx_unique_job_resume ON job_analysis (job_id, resume_id);
    CREATE TABLE job_applications (
        id SERIAL NOT NULL,
        user_id INTEGER NOT NULL,
        job_id INTEGER NOT NULL,
        profile_id INTEGER,
        status VARCHAR(50),
        applied_at TIMESTAMP WITHOUT TIME ZONE,
        cover_letter TEXT,
        custom_resume_url TEXT,
        notes TEXT,
        source VARCHAR(100),
        automation_session_id VARCHAR(255),
        follow_up_date TIMESTAMP WITHOUT TIME ZONE,
        interview_dates JSON,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES users (id),
        FOREIGN KEY(job_id) REFERENCES jobs (id),
        FOREIGN KEY(profile_id) REFERENCES resume_profiles (id)
    );
    CREATE INDEX ix_job_applications_id ON job_applications (id);
    CREATE INDEX ix_job_applications_user_id ON job_applications (user_id);
    CREATE INDEX ix_job_applications_job_id ON job_applications (job_id);
    CREATE INDEX ix_job_applications_profile_id ON job_applications (profile_id);
    CREATE TABLE saved_jobs (
        id SERIAL NOT NULL,
        user_id INTEGER NOT NULL,
        job_id INTEGER NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY(user_id) REFERENCES users (id),
        FOREIGN KEY(job_id) REFERENCES jobs (id)
    );
    CREATE INDEX ix_saved_jobs_id ON saved_jobs (id);
    CREATE INDEX ix_saved_jobs_user_id ON saved_jobs (user_id);
    CREATE INDEX ix_saved_jobs_job_id ON saved_jobs (job_id);
    """)


def downgrade() -> None:
    op.execute("""
    DROP TABLE saved_jobs;
    DROP TABLE job_applications;
    DROP TABLE job_analysis;
    DROP TABLE notifications;
    DROP TABLE security_logs;
    DROP TABLE resume_profiles;
    DROP TABLE jobs;
    DROP TABLE scraping_sessions;
    DROP TABLE companies;
    DROP TABLE users;
    """)

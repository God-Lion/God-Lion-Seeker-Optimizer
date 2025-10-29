-- ============================================================================
-- God Lion Seeker Optimizer - Complete Database Management Script
-- MySQL 9.4 compatible | SQLAlchemy 2.0 compatible
-- 
-- ⚠️  IMPORTANT: This is the SINGLE SOURCE OF TRUTH for the database schema
-- ⚠️  All Alembic migrations have been removed - use this SQL file instead
-- 
-- This script provides:
-- 1. Complete database setup (fresh install)
-- 2. Safe migrations for existing databases
-- 3. All views and stored procedures
-- 4. Verification queries
-- 
-- Safe to run multiple times - includes existence checks
-- 
-- Last Updated: October 25, 2025
-- Migration Status: All Alembic migrations removed - SQL-only approach
-- ============================================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS godlionseeker_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE godlionseeker_db;

-- ============================================================================
-- SECTION 1: TABLE CREATION (Fresh Install)
-- ============================================================================

-- Drop existing tables (ONLY for clean setup - comment out if migrating)
-- DROP TABLE IF EXISTS job_insights;
-- DROP TABLE IF EXISTS applications_sent;
-- DROP TABLE IF EXISTS job_analysis;
-- DROP TABLE IF EXISTS jobs;
-- DROP TABLE IF EXISTS companies;
-- DROP TABLE IF EXISTS scraping_sessions;

-- ============================================================================
-- 1. COMPANIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(500) NOT NULL UNIQUE,
    industry VARCHAR(200),
    company_size VARCHAR(100) COMMENT 'e.g., 1-10, 11-50, 51-200, 201-500, 501-1000, 1001-5000, 5001+',
    website VARCHAR(500),
    location VARCHAR(300),
    description VARCHAR(2000),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_company_name (name),
    INDEX idx_company_industry (industry),
    INDEX idx_company_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. SCRAPING SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS scraping_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_name VARCHAR(200) NOT NULL,
    query VARCHAR(500) NOT NULL,
    location VARCHAR(200) COMMENT 'Location filter for job search',
    platform VARCHAR(50) COMMENT 'indeed, linkedin, glassdoor, etc.',
    status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'pending, running, completed, failed, paused',
    total_jobs INT NOT NULL DEFAULT 0,
    unique_jobs INT NOT NULL DEFAULT 0,
    duplicate_jobs INT NOT NULL DEFAULT 0,
    error_count INT NOT NULL DEFAULT 0,
    jobs_found INT NOT NULL DEFAULT 0 COMMENT 'Total jobs found during scraping',
    jobs_stored INT NOT NULL DEFAULT 0 COMMENT 'Jobs successfully stored in database',
    error_message VARCHAR(1000) COMMENT 'Error details if scraping failed',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_session_status (status),
    INDEX idx_session_created_at (created_at),
    INDEX idx_session_query (query),
    INDEX idx_session_platform (platform),
    INDEX idx_session_location (location)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. JOBS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(100) NOT NULL UNIQUE,
    session_id INT,
    company_id INT,
    title VARCHAR(500) NOT NULL,
    link VARCHAR(1000) NOT NULL,
    apply_link VARCHAR(1000),
    place VARCHAR(200),
    description TEXT,
    description_html TEXT,
    date VARCHAR(100),
    date_text VARCHAR(100),
    posted_date DATETIME COMMENT 'Parsed posted date',
    scraped_at DATETIME COMMENT 'When the job was scraped',
    job_type VARCHAR(100) COMMENT 'Full-time, Part-time, Contract, etc.',
    experience_level VARCHAR(100) COMMENT 'Entry level, Mid-Senior, Executive, etc.',
    location VARCHAR(200) COMMENT 'Job location (may differ from place)',
    job_url VARCHAR(1000) COMMENT 'Direct job URL',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    insights JSON,
    match_score FLOAT,
    match_details JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_job_id (job_id),
    INDEX idx_jobs_title (title(255)),
    INDEX idx_jobs_place (place),
    INDEX idx_jobs_is_active (is_active),
    INDEX idx_jobs_created_at (created_at),
    INDEX idx_jobs_company_id (company_id),
    INDEX idx_jobs_session_id (session_id),
    INDEX idx_jobs_location (location),
    INDEX idx_jobs_job_type (job_type),
    INDEX idx_jobs_experience_level (experience_level),
    INDEX idx_jobs_posted_date (posted_date),
    INDEX idx_jobs_scraped_at (scraped_at),
    
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (session_id) REFERENCES scraping_sessions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. JOB INSIGHTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_insights (
    insight_id INT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(100) NOT NULL,
    insight_text TEXT,
    
    INDEX idx_job_id (job_id),
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. JOB ANALYSIS TABLE (AI-powered job matching)
-- ============================================================================
CREATE TABLE IF NOT EXISTS job_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL COMMENT 'Foreign key to jobs.id',
    resume_id VARCHAR(100) COMMENT 'Identifier for the resume used in analysis',

    -- Match scores (0.0 to 1.0 scale)
    overall_match_score FLOAT NOT NULL COMMENT 'Overall match score (0.0 to 1.0)',
    similarity_score FLOAT NOT NULL COMMENT 'Semantic similarity using NLP (0.0 to 1.0)',
    skills_match_percentage FLOAT NOT NULL COMMENT 'Percentage of required skills matched (0.0 to 100.0)',
    experience_match_score FLOAT NOT NULL COMMENT 'Experience level match score (0.0 to 1.0)',

    -- Match category
    match_category VARCHAR(50) NOT NULL COMMENT 'excellent, good, fair, poor',

    -- Detailed skill analysis (JSON format)
    matching_skills JSON NOT NULL COMMENT 'List of skills that match between resume and job',
    missing_skills JSON NOT NULL COMMENT 'List of required skills missing from resume',
    recommended_skills JSON COMMENT 'Skills recommended to learn for this role',

    -- Additional analysis data
    keyword_match_score FLOAT COMMENT 'TF-IDF keyword matching score',
    top_matching_keywords JSON COMMENT 'Top keywords matching between resume and job description',

    -- Recommendation text
    recommendation TEXT NOT NULL COMMENT 'Human-readable recommendation for applying',

    -- Analysis metadata
    analyzed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the analysis was performed',
    analysis_version VARCHAR(20) COMMENT 'Version of the matching algorithm used',

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_job_analysis_job_id (job_id),
    INDEX idx_job_analysis_resume_id (resume_id),
    INDEX idx_job_analysis_match_score (overall_match_score),
    INDEX idx_job_analysis_match_category (match_category),
    INDEX idx_job_analysis_analyzed_at (analyzed_at),
    
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. APPLICATIONS SENT TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS applications_sent (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id VARCHAR(100) NOT NULL COMMENT 'References jobs.job_id',
    method VARCHAR(50) NOT NULL COMMENT 'email, linkedin, company_website, etc.',
    status VARCHAR(50) NOT NULL DEFAULT 'sent' COMMENT 'sent, delivered, failed, bounced',
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    response_received BOOLEAN NOT NULL DEFAULT FALSE,
    response_date TIMESTAMP NULL,
    recipient_email VARCHAR(255),
    follow_up_date TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_app_job_id (job_id),
    INDEX idx_app_sent_at (sent_at),
    INDEX idx_app_status (status),
    INDEX idx_app_response (response_received),
    
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- SECTION 2: SAFE MIGRATIONS (For Existing Databases)
-- ============================================================================

SELECT '=== Running Safe Migrations ===' AS Status;

-- Add missing columns to scraping_sessions
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'scraping_sessions' AND COLUMN_NAME = 'location');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE scraping_sessions ADD COLUMN location VARCHAR(200) COMMENT "Location filter for job search" AFTER query', 'SELECT "✓ Column location exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'scraping_sessions' AND COLUMN_NAME = 'platform');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE scraping_sessions ADD COLUMN platform VARCHAR(50) COMMENT "indeed, linkedin, glassdoor, etc." AFTER location', 'SELECT "✓ Column platform exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'scraping_sessions' AND COLUMN_NAME = 'jobs_found');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE scraping_sessions ADD COLUMN jobs_found INT NOT NULL DEFAULT 0 COMMENT "Total jobs found during scraping" AFTER error_count', 'SELECT "✓ Column jobs_found exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'scraping_sessions' AND COLUMN_NAME = 'jobs_stored');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE scraping_sessions ADD COLUMN jobs_stored INT NOT NULL DEFAULT 0 COMMENT "Jobs successfully stored in database" AFTER jobs_found', 'SELECT "✓ Column jobs_stored exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'scraping_sessions' AND COLUMN_NAME = 'error_message');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE scraping_sessions ADD COLUMN error_message VARCHAR(1000) COMMENT "Error details if scraping failed" AFTER jobs_stored', 'SELECT "✓ Column error_message exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add missing columns to jobs
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'posted_date');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE jobs ADD COLUMN posted_date DATETIME COMMENT "Parsed posted date" AFTER date_text', 'SELECT "✓ Column posted_date exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'scraped_at');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE jobs ADD COLUMN scraped_at DATETIME COMMENT "When the job was scraped" AFTER posted_date', 'SELECT "✓ Column scraped_at exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'job_type');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE jobs ADD COLUMN job_type VARCHAR(100) COMMENT "Full-time, Part-time, Contract, etc." AFTER scraped_at', 'SELECT "✓ Column job_type exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'experience_level');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE jobs ADD COLUMN experience_level VARCHAR(100) COMMENT "Entry level, Mid-Senior, Executive, etc." AFTER job_type', 'SELECT "✓ Column experience_level exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'location');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE jobs ADD COLUMN location VARCHAR(200) COMMENT "Job location (may differ from place)" AFTER experience_level', 'SELECT "✓ Column location exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'jobs' AND COLUMN_NAME = 'job_url');
SET @sql = IF(@column_exists = 0, 'ALTER TABLE jobs ADD COLUMN job_url VARCHAR(1000) COMMENT "Direct job URL" AFTER location', 'SELECT "✓ Column job_url exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Add missing indexes
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'scraping_sessions' AND INDEX_NAME = 'idx_session_platform');
SET @sql = IF(@index_exists = 0, 'ALTER TABLE scraping_sessions ADD INDEX idx_session_platform (platform)', 'SELECT "✓ Index idx_session_platform exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'scraping_sessions' AND INDEX_NAME = 'idx_session_location');
SET @sql = IF(@index_exists = 0, 'ALTER TABLE scraping_sessions ADD INDEX idx_session_location (location)', 'SELECT "✓ Index idx_session_location exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'jobs' AND INDEX_NAME = 'idx_jobs_location');
SET @sql = IF(@index_exists = 0, 'ALTER TABLE jobs ADD INDEX idx_jobs_location (location)', 'SELECT "✓ Index idx_jobs_location exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'jobs' AND INDEX_NAME = 'idx_jobs_job_type');
SET @sql = IF(@index_exists = 0, 'ALTER TABLE jobs ADD INDEX idx_jobs_job_type (job_type)', 'SELECT "✓ Index idx_jobs_job_type exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'jobs' AND INDEX_NAME = 'idx_jobs_experience_level');
SET @sql = IF(@index_exists = 0, 'ALTER TABLE jobs ADD INDEX idx_jobs_experience_level (experience_level)', 'SELECT "✓ Index idx_jobs_experience_level exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'jobs' AND INDEX_NAME = 'idx_jobs_posted_date');
SET @sql = IF(@index_exists = 0, 'ALTER TABLE jobs ADD INDEX idx_jobs_posted_date (posted_date)', 'SELECT "✓ Index idx_jobs_posted_date exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = 'godlionseeker_db' AND TABLE_NAME = 'jobs' AND INDEX_NAME = 'idx_jobs_scraped_at');
SET @sql = IF(@index_exists = 0, 'ALTER TABLE jobs ADD INDEX idx_jobs_scraped_at (scraped_at)', 'SELECT "✓ Index idx_jobs_scraped_at exists" AS Status');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ============================================================================
-- SECTION 3: VIEWS
-- ============================================================================

-- View 1: Jobs with Company Info
CREATE OR REPLACE VIEW jobs_with_company AS
SELECT
    j.id,
    j.job_id,
    j.title,
    j.link,
    j.apply_link,
    j.place,
    j.location,
    j.job_type,
    j.experience_level,
    j.date,
    j.posted_date,
    j.scraped_at,
    j.is_active,
    c.name as company_name,
    c.industry as company_industry,
    c.website as company_website,
    c.location as company_location,
    j.match_score,
    j.created_at
FROM jobs j
LEFT JOIN companies c ON j.company_id = c.id;

-- View 2: High Match Jobs
CREATE OR REPLACE VIEW high_match_jobs AS
SELECT
    ja.id as analysis_id,
    j.job_id,
    j.title,
    c.name as company_name,
    j.place,
    j.link,
    ja.overall_match_score,
    ja.match_category,
    ja.skills_match_percentage,
    ja.recommendation,
    ja.analyzed_at
FROM job_analysis ja
JOIN jobs j ON ja.job_id = j.id
LEFT JOIN companies c ON j.company_id = c.id
WHERE ja.overall_match_score >= 0.70
  AND j.is_active = TRUE
ORDER BY ja.overall_match_score DESC;

-- View 3: Application Statistics
CREATE OR REPLACE VIEW application_stats AS
SELECT
    DATE(sent_at) as date,
    COUNT(*) as applications_sent,
    SUM(CASE WHEN response_received = TRUE THEN 1 ELSE 0 END) as responses_received,
    ROUND(SUM(CASE WHEN response_received = TRUE THEN 1 ELSE 0 END) / COUNT(*) * 100, 1) as response_rate,
    COUNT(DISTINCT job_id) as unique_jobs
FROM applications_sent
GROUP BY DATE(sent_at)
ORDER BY date DESC;

-- View 4: Applications Detailed
CREATE OR REPLACE VIEW applications_detailed AS
SELECT
    a.id,
    a.method,
    a.status,
    a.sent_at,
    a.response_received,
    a.response_date,
    a.recipient_email,
    a.follow_up_date,
    j.job_id,
    j.title,
    j.link,
    c.name as company_name,
    c.website as company_link,
    j.place,
    ja.overall_match_score,
    ja.match_category,
    DATEDIFF(NOW(), a.sent_at) as days_since_sent
FROM applications_sent a
JOIN jobs j ON a.job_id = j.job_id
LEFT JOIN companies c ON j.company_id = c.id
LEFT JOIN job_analysis ja ON j.id = ja.job_id
ORDER BY a.sent_at DESC;

-- View 5: Follow-ups Needed
CREATE OR REPLACE VIEW followups_needed AS
SELECT
    a.id,
    a.sent_at,
    j.job_id,
    j.title,
    c.name as company_name,
    j.link,
    a.recipient_email,
    DATEDIFF(NOW(), a.sent_at) as days_since,
    ja.overall_match_score,
    ja.match_category
FROM applications_sent a
JOIN jobs j ON a.job_id = j.job_id
LEFT JOIN companies c ON j.company_id = c.id
LEFT JOIN job_analysis ja ON j.id = ja.job_id
WHERE a.response_received = FALSE
  AND a.status = 'sent'
  AND DATEDIFF(NOW(), a.sent_at) >= 7
  AND DATEDIFF(NOW(), a.sent_at) <= 14
  AND a.job_id NOT IN (
      SELECT a2.job_id
      FROM applications_sent a2
      WHERE a2.method = 'email_followup'
  )
ORDER BY a.sent_at ASC;

-- ============================================================================
-- SECTION 4: STORED PROCEDURES
-- ============================================================================

DELIMITER $$

-- Get today's application count
DROP PROCEDURE IF EXISTS get_today_count$$
CREATE PROCEDURE get_today_count()
BEGIN
    SELECT COUNT(*) as count
    FROM applications_sent
    WHERE DATE(sent_at) = CURDATE();
END$$

-- Get pending count
DROP PROCEDURE IF EXISTS get_pending_count$$
CREATE PROCEDURE get_pending_count()
BEGIN
    SELECT COUNT(*) as count
    FROM applications_sent
    WHERE status IN ('sent', 'delivered')
      AND response_received = FALSE;
END$$

-- Get response rate
DROP PROCEDURE IF EXISTS get_response_rate$$
CREATE PROCEDURE get_response_rate()
BEGIN
    SELECT
        COUNT(*) as total,
        SUM(response_received) as responses,
        ROUND(SUM(response_received) / COUNT(*) * 100, 1) as response_rate
    FROM applications_sent
    WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 30 DAY);
END$$

DELIMITER $;

-- Get session statistics
DROP PROCEDURE IF EXISTS get_session_stats$;
CREATE PROCEDURE get_session_stats(IN p_session_id INT)
BEGIN
    SELECT
        s.id,
        s.session_name,
        s.query,
        s.status,
        s.total_jobs,
        s.unique_jobs,
        s.duplicate_jobs,
        s.error_count,
        s.started_at,
        s.completed_at,
        TIMESTAMPDIFF(SECOND, s.started_at, s.completed_at) as duration_seconds,
        COUNT(DISTINCT j.company_id) as unique_companies
    FROM scraping_sessions s
    LEFT JOIN jobs j ON s.id = j.session_id
    WHERE s.id = p_session_id
    GROUP BY s.id, s.session_name, s.query, s.status, s.total_jobs,
             s.unique_jobs, s.duplicate_jobs, s.error_count,
             s.started_at, s.completed_at;
END$;

-- Get job analysis statistics
DROP PROCEDURE IF EXISTS get_analysis_stats$;
CREATE PROCEDURE get_analysis_stats(IN p_resume_id VARCHAR(100))
BEGIN
    SELECT
        COUNT(*) as total_analyzed,
        AVG(overall_match_score) as avg_match_score,
        SUM(CASE WHEN match_category = 'excellent' THEN 1 ELSE 0 END) as excellent_count,
        SUM(CASE WHEN match_category = 'good' THEN 1 ELSE 0 END) as good_count,
        SUM(CASE WHEN match_category = 'fair' THEN 1 ELSE 0 END) as fair_count,
        SUM(CASE WHEN match_category = 'poor' THEN 1 ELSE 0 END) as poor_count,
        SUM(CASE WHEN overall_match_score >= 0.70 THEN 1 ELSE 0 END) as high_matches,
        MIN(analyzed_at) as first_analysis,
        MAX(analyzed_at) as last_analysis
    FROM job_analysis
    WHERE p_resume_id IS NULL OR resume_id = p_resume_id;
END$;

-- Get top matches for a resume
DROP PROCEDURE IF EXISTS get_top_matches$;
CREATE PROCEDURE get_top_matches(
    IN p_resume_id VARCHAR(100),
    IN p_min_score FLOAT,
    IN p_limit INT
)
BEGIN
    SELECT
        j.job_id,
        j.title,
        c.name as company_name,
        j.place,
        j.link,
        ja.overall_match_score,
        ja.match_category,
        ja.skills_match_percentage,
        ja.recommendation,
        ja.analyzed_at
    FROM job_analysis ja
    JOIN jobs j ON ja.job_id = j.id
    LEFT JOIN companies c ON j.company_id = c.id
    WHERE (p_resume_id IS NULL OR ja.resume_id = p_resume_id)
      AND ja.overall_match_score >= p_min_score
      AND j.is_active = TRUE
    ORDER BY ja.overall_match_score DESC
    LIMIT p_limit;
END$;

-- Get unanalyzed jobs count
DROP PROCEDURE IF EXISTS get_unanalyzed_count$;
CREATE PROCEDURE get_unanalyzed_count(IN p_resume_id VARCHAR(100))
BEGIN
    SELECT COUNT(*) as unanalyzed_count
    FROM jobs j
    WHERE j.is_active = TRUE
      AND j.description IS NOT NULL
      AND NOT EXISTS (
          SELECT 1
          FROM job_analysis ja
          WHERE ja.job_id = j.id
            AND (p_resume_id IS NULL OR ja.resume_id = p_resume_id)
      );
END$;

DELIMITER ;

-- ============================================================================
-- SECTION 5: VERIFICATION
-- ============================================================================

SELECT '✓ Database setup and migration complete!' AS Status;

SELECT '\n=== Tables ===' AS Info;
SHOW TABLES;

SELECT '\n=== Table Structures ===' AS Info;
SELECT
    TABLE_NAME,
    TABLE_ROWS,
    ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 2) as 'Size (MB)'
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'godlionseeker_db'
  AND TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

SELECT '\n=== Views ===' AS Info;
SELECT TABLE_NAME
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = 'godlionseeker_db'
ORDER BY TABLE_NAME;

SELECT '\n=== Stored Procedures ===' AS Info;
SELECT ROUTINE_NAME
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'godlionseeker_db'
  AND ROUTINE_TYPE = 'PROCEDURE'
ORDER BY ROUTINE_NAME;

-- Initialize MySQL database for God Lion Seeker Optimizer
-- This script runs automatically when the MySQL container first starts

-- Set character set and collation
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- Grant privileges to application user
GRANT ALL PRIVILEGES ON godlionseeker.* TO 'scraper_user'@'%';
FLUSH PRIVILEGES;

-- Create indexes for better performance (if tables exist)
-- Note: Alembic migrations will create tables, but we can prepare indexes

-- Enable slow query log for monitoring
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;
SET GLOBAL log_queries_not_using_indexes = 'ON';

-- Optimize MySQL settings for application
SET GLOBAL max_connections = 200;
SET GLOBAL innodb_buffer_pool_size = 268435456; -- 256MB
SET GLOBAL innodb_log_file_size = 67108864;     -- 64MB
SET GLOBAL innodb_flush_log_at_trx_commit = 2;

-- Enable query cache (if supported)
-- SET GLOBAL query_cache_type = 1;
-- SET GLOBAL query_cache_size = 33554432; -- 32MB

-- Performance schema settings
SET GLOBAL performance_schema = ON;

-- Create backup user (optional)
-- CREATE USER IF NOT EXISTS 'backup_user'@'localhost' IDENTIFIED BY 'backup_password';
-- GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON godlionseeker.* TO 'backup_user'@'localhost';

SELECT 'God Lion Seeker Optimizer database initialized successfully!' AS Status;

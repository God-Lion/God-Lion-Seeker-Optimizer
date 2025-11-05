@echo off
REM ============================================================================
REM God Lion Seeker Optimizer - Backup Database
REM ============================================================================

echo.
echo ============================================================================
echo   God Lion Seeker Optimizer - Database Backup
echo ============================================================================
echo.

cd /d "%~dp0"

REM Create backup directory if it doesn't exist
if not exist "backups" mkdir backups

REM Generate timestamp for backup filename
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%-%datetime:~8,6%

set BACKUP_FILE=backups\godlionseeker_backup_%TIMESTAMP%.sql

echo Creating database backup...
echo Backup file: %BACKUP_FILE%
echo.

REM Find the postgres container
for /f "tokens=*" %%i in ('docker ps --filter "name=godlionseeker-db" -q') do set DB_CONTAINER=%%i

if "%DB_CONTAINER%"=="" (
    echo ERROR: Database container is not running!
    echo Please start the application first.
    pause
    exit /b 1
)

echo Database container found: %DB_CONTAINER%
echo.

REM Create backup
docker exec %DB_CONTAINER% pg_dump -U scraper_user godlionseeker > %BACKUP_FILE%

if errorlevel 1 (
    echo ERROR: Backup failed!
    pause
    exit /b 1
)

echo.
echo ============================================================================
echo   BACKUP COMPLETE!
echo ============================================================================
echo.
echo Backup saved to: %BACKUP_FILE%
echo.
echo To restore this backup:
echo   docker exec -i godlionseeker-db psql -U scraper_user godlionseeker ^< %BACKUP_FILE%
echo.
pause

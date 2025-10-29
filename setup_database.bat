@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Database Setup Script
echo ========================================
echo.

REM Change to project directory
cd /d "%~dp0"

REM Activate virtual environment
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
) else (
    echo ERROR: Virtual environment not found!
    echo Please run: python -m venv venv
    pause
    exit /b 1
)

REM Prompt for database credentials
set /p DB_USER="Enter MySQL username (default: root): "
if "!DB_USER!"=="" set DB_USER=root

set /p DB_PASS="Enter MySQL password: "
if "!DB_PASS!"=="" (
    echo ERROR: Password cannot be empty!
    pause
    exit /b 1
)

set /p DB_HOST="Enter MySQL host (default: localhost): "
if "!DB_HOST!"=="" set DB_HOST=localhost

set /p DB_PORT="Enter MySQL port (default: 3306): "
if "!DB_PORT!"=="" set DB_PORT=3306

set /p DB_NAME="Enter database name (default: godlionseeker_db): "
if "!DB_NAME!"=="" set DB_NAME=godlionseeker_db

echo.
echo ========================================
echo Configuration Summary
echo ========================================
echo Host: !DB_HOST!
echo Port: !DB_PORT!
echo User: !DB_USER!
echo Database: !DB_NAME!
echo ========================================
echo.

set /p CONFIRM="Is this correct? (y/N): "
if /i not "!CONFIRM!"=="y" (
    echo Setup cancelled.
    pause
    exit /b 0
)

echo.
echo [1/6] Testing MySQL connection...
mysql -u !DB_USER! -p!DB_PASS! -h !DB_HOST! -P !DB_PORT! -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Cannot connect to MySQL!
    echo.
    echo Please verify:
    echo   1. MySQL is running (run: net start MySQL80)
    echo   2. Username and password are correct
    echo   3. Host and port are correct
    echo.
    pause
    exit /b 1
)
echo [SUCCESS] MySQL connection successful!

echo.
echo [2/6] Creating database if it doesn't exist...
mysql -u !DB_USER! -p!DB_PASS! -h !DB_HOST! -P !DB_PORT! -e "CREATE DATABASE IF NOT EXISTS !DB_NAME! CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
if errorlevel 1 (
    echo [ERROR] Failed to create database!
    pause
    exit /b 1
)
echo [SUCCESS] Database ready!

echo.
echo [3/6] Creating .env file...
(
    echo # Database Configuration
    echo DATABASE_URL=mysql+pymysql://!DB_USER!:!DB_PASS!@!DB_HOST!:!DB_PORT!/!DB_NAME!
    echo.
    echo # Security
    echo JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production-!RANDOM!
    echo.
    echo # API Configuration
    echo API_HOST=0.0.0.0
    echo API_PORT=8000
    echo DEBUG=True
    echo.
    echo # Scraper Configuration
    echo SCRAPER_HEADLESS=True
    echo SCRAPER_MAX_RETRIES=3
    echo SCRAPER_TIMEOUT=30
    echo.
    echo # CORS
    echo CORS_ORIGINS=http://localhost:3000,http://localhost:5173
) > .env

if errorlevel 1 (
    echo [ERROR] Failed to create .env file!
    pause
    exit /b 1
)
echo [SUCCESS] .env file created!

echo.
echo [4/6] Verifying .env file...
python -c "from dotenv import load_dotenv; import os; load_dotenv(); db=os.getenv('DATABASE_URL'); print('  DATABASE_URL:', 'OK' if db else 'MISSING'); exit(0 if db else 1)" 2>nul
if errorlevel 1 (
    echo [ERROR] .env file verification failed!
    pause
    exit /b 1
)
echo [SUCCESS] .env file verified!

echo.
echo [5/6] Checking migration state...
alembic current >nul 2>&1
if errorlevel 1 (
    echo [INFO] No migration history found. This is normal for first setup.
    set NEED_MIGRATION=1
) else (
    echo [INFO] Migration history found.
    set NEED_MIGRATION=0
)

echo.
echo [6/6] Running database migrations...
if !NEED_MIGRATION!==1 (
    echo [INFO] Applying initial migration...
    alembic upgrade head
    if errorlevel 1 (
        echo [ERROR] Migration failed!
        echo.
        echo Troubleshooting options:
        echo   1. Drop database and try again:
        echo      mysql -u !DB_USER! -p!DB_PASS! -e "DROP DATABASE !DB_NAME!;"
        echo   2. Check if tables already exist:
        echo      mysql -u !DB_USER! -p!DB_PASS! !DB_NAME! -e "SHOW TABLES;"
        echo   3. If tables exist, mark migration as complete:
        echo      alembic stamp head
        echo.
        pause
        exit /b 1
    )
) else (
    alembic upgrade head
    if errorlevel 1 (
        echo [WARNING] Migration upgrade failed. Trying to mark as complete...
        alembic stamp head
        if errorlevel 1 (
            echo [ERROR] Could not mark migration as complete!
            pause
            exit /b 1
        )
    )
)
echo [SUCCESS] Database migrations complete!

echo.
echo ========================================
echo Setup Complete! ✓
echo ========================================
echo.
echo Database: !DB_NAME!
echo Host: !DB_HOST!:!DB_PORT!
echo User: !DB_USER!
echo.
echo Next steps:
echo   1. Review your .env file
echo   2. Run: python main.py
echo   3. API will be available at http://localhost:8000
echo   4. API docs at http://localhost:8000/docs
echo.
echo ========================================
pause

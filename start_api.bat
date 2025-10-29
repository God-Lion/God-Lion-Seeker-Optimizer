@echo off
setlocal enabledelayedexpansion

REM Startup script for God Lion Seeker Optimizer API (Windows)

echo ========================================
echo God Lion Seeker Optimizer API - Startup
echo ========================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo [INFO] Virtual environment not found. Creating with Python 3.12...
    py -3.12 -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment
        echo [ERROR] Please ensure Python 3.12 is installed: py --list
        pause
        exit /b 1
    )
    echo [SUCCESS] Virtual environment created
    echo.
)

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)
echo [SUCCESS] Virtual environment activated
echo.

REM Upgrade pip first
echo [INFO] Upgrading pip...
python -m pip install --upgrade pip setuptools wheel >nul 2>&1
echo.

REM Install/update dependencies
echo [INFO] Installing dependencies (this may take a few minutes)...
pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Dependencies installed
echo.

@REM REM Install cryptography separately if needed (for MySQL)
@REM echo [INFO] Ensuring cryptography package is installed...
@REM pip install cryptography>=41.0.0 >nul 2>&1
@REM echo.

REM Install Playwright browsers if needed
echo [INFO] Installing Playwright Chromium browser...
playwright install chromium >nul 2>&1
echo.

REM Check if .env file exists
if exist ".env" (
    echo [INFO] .env file found
) else (
    echo [WARNING] .env file not found
    if exist ".env.example" (
        echo [INFO] Copying .env.example to .env...
        copy /Y ".env.example" ".env" >nul
        echo [SUCCESS] .env file created
        echo.
        echo ============================================
        echo [ACTION REQUIRED] Opening .env for configuration
        echo Please update the following:
        echo   - DATABASE_URL
        echo   - Database credentials
        echo   - API keys if needed
        echo ============================================
        echo.
        timeout /t 2 >nul
        start notepad.exe ".env"
        echo.
        echo Press any key after you've saved your .env configuration...
        pause >nul
    ) else (
        echo [ERROR] Neither .env nor .env.example found
        echo [INFO] Please create a .env file manually with your database configuration
        pause
        exit /b 1
    )
)
echo.

REM Check if src directory exists
if not exist "src\" (
    echo [ERROR] src directory not found. Are you in the correct directory?
    pause
    exit /b 1
)

REM Test database connection
echo [INFO] Testing database connection...
python -c "from sqlalchemy import create_engine; import os; from dotenv import load_dotenv; load_dotenv(); engine = create_engine(os.getenv('DATABASE_URL')); conn = engine.connect(); conn.close(); print('[SUCCESS] Database connected')" 2>nul
if errorlevel 1 (
    echo [WARNING] Cannot connect to database
    echo.
    echo Please verify:
    echo   1. MySQL server is running
    echo   2. DATABASE_URL in .env is correct
    echo   3. Database exists and credentials are valid
    echo.
    set /p CONTINUE="Continue anyway? (y/N): "
    if /i not "!CONTINUE!"=="y" (
        pause
        exit /b 1
    )
)
echo.

REM Run database migrations
echo [INFO] Running database migrations...
cd src
alembic upgrade head
if errorlevel 1 (
    echo.
    echo [ERROR] Database migration failed
    echo.
    cd ..
    pause
    exit /b 1
)
echo [SUCCESS] Migrations completed
echo.

REM Start the API
echo ========================================
echo Starting API Server...
echo ========================================
echo.
echo API URL:           http://localhost:8000
echo API Documentation: http://localhost:8000/api/docs
echo Interactive API:   http://localhost:8000/api/redoc
echo Health Check:      http://localhost:8000/health
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

REM Cleanup
cd ..
echo.
echo [INFO] Server stopped
pause
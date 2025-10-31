@echo off
REM Quick API Startup Script (skips spacy model installation)
REM Use this when you just want to start the API without NLP features

echo ========================================
echo God Lion Seeker Optimizer API - Quick Start
echo ========================================
echo.

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)
echo [SUCCESS] Virtual environment activated
echo.

REM Check if .env file exists
if not exist .env (
    echo [WARNING] .env file not found
    echo [INFO] Creating .env from .env.example...
    copy .env.example .env
)
echo [INFO] .env file found
echo.

REM Start the API server
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

python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

pause

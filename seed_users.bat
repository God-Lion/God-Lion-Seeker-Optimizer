@echo off
REM ============================================================================
REM Seed Users Script - Create Test Users
REM ============================================================================

echo.
echo ========================================
echo God Lion Seeker Optimizer - User Seeding
echo ========================================
echo.

REM Activate virtual environment
echo [INFO] Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    echo Please ensure the virtual environment exists: venv\
    pause
    exit /b 1
)
echo [SUCCESS] Virtual environment activated
echo.

REM Run the seed script
echo [INFO] Running user seed script...
echo.
cd src
python seed_users.py
cd ..

echo.
echo ========================================
echo Seeding Complete
echo ========================================
echo.
pause

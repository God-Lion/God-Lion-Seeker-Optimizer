@echo off
echo ========================================
echo God Lion Seeker Optimizer API - Quick Start
echo ========================================
echo.

call venv\Scripts\activate.bat

echo [INFO] Testing database connection...
python -c "from sqlalchemy import create_engine; import os; from dotenv import load_dotenv; load_dotenv(); engine = create_engine(os.getenv('DATABASE_URL')); conn = engine.connect(); conn.close(); print('[SUCCESS] Database connected')"
if errorlevel 1 (
    echo [ERROR] Database connection failed. Check your .env file.
    pause
    exit /b 1
)
echo.

echo [INFO] Running migrations...
cd src
alembic upgrade head
if errorlevel 1 (
    echo [ERROR] Migration failed
    cd ..
    pause
    exit /b 1
)
echo.

echo ========================================
echo Starting API Server...
echo ========================================
echo API: http://localhost:8000
echo Docs: http://localhost:8000/api/docs
echo ========================================
echo.

uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

cd ..
pause
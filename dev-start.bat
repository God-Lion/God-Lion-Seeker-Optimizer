@echo off
REM Development Environment Setup Script for Windows
REM This script sets up the complete development environment with MailDev

echo ========================================
echo   God Lion Seeker Optimizer
echo   Development Environment Setup
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check if .env exists
if not exist .env (
    echo [INFO] Creating .env file from .env.development...
    copy .env.development .env >nul
    echo [OK] .env file created
    echo.
    echo [WARNING] Please review .env file and update settings if needed!
    echo.
) else (
    echo [OK] .env file already exists
    echo.
)

echo ========================================
echo   Starting Development Services
echo ========================================
echo.
echo Services to be started:
echo   - PostgreSQL Database (port 5432)
echo   - Redis Cache (port 6379)
echo   - FastAPI Backend (port 8000)
echo   - React Frontend (port 8080)
echo   - MailDev Email Testing (ports 1025, 1080)
echo   - PgAdmin (port 5050)
echo   - Redis Commander (port 8081)
echo   - Prometheus (port 9090)
echo   - Grafana (port 3000)
echo.

set /p CONFIRM="Start all services? (Y/N): "
if /i not "%CONFIRM%"=="Y" (
    echo Setup cancelled.
    pause
    exit /b 0
)

echo.
echo [INFO] Starting services with Docker Compose...
docker-compose up -d

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start services!
    echo Please check Docker logs for details.
    pause
    exit /b 1
)

echo.
echo [OK] All services started successfully!
echo.

REM Wait for services to be ready
echo [INFO] Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo ========================================
echo   Development Environment Ready!
echo ========================================
echo.
echo Access URLs:
echo   - API Documentation:    http://localhost:8000/docs
echo   - Frontend Application: http://localhost:8080
echo   - MailDev Web UI:       http://localhost:1080
echo   - PgAdmin:              http://localhost:5050
echo   - Redis Commander:      http://localhost:8081
echo   - Prometheus:           http://localhost:9090
echo   - Grafana:              http://localhost:3000
echo.
echo MailDev Configuration:
echo   - SMTP Host: localhost
echo   - SMTP Port: 1025
echo   - Web UI:    http://localhost:1080
echo.
echo ========================================
echo   Useful Commands
echo ========================================
echo.
echo View API logs:
echo   docker logs godlionseeker-api -f
echo.
echo View all services status:
echo   docker-compose ps
echo.
echo Stop all services:
echo   docker-compose down
echo.
echo Restart a service:
echo   docker-compose restart [service-name]
echo.
echo ========================================

REM Check if services are healthy
echo [INFO] Checking service health...
echo.

REM Check API
curl -s http://localhost:8000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] API is healthy
) else (
    echo [WARNING] API is not responding yet
    echo Try: docker logs godlionseeker-api
)

REM Check MailDev
curl -s http://localhost:1080 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] MailDev is accessible
) else (
    echo [WARNING] MailDev is not responding yet
)

echo.
echo ========================================
echo   Next Steps
echo ========================================
echo.
echo 1. Open frontend:  http://localhost:8080
echo 2. Register a user
echo 3. Check MailDev:  http://localhost:1080
echo 4. Click verification email
echo 5. Start developing!
echo.
echo Need help? Check DOCS/MAILDEV_SETUP.md
echo.

pause

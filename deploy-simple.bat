@echo off
REM ============================================================================
REM God Lion Seeker Optimizer - Simple Deployment Script
REM ============================================================================
REM This script deploys the application using the basic docker-compose.yml
REM Suitable for: Development, Testing, Single-machine deployment
REM ============================================================================

echo.
echo ============================================================================
echo   God Lion Seeker Optimizer - Simple Deployment
echo ============================================================================
echo.

REM Change to the project directory
cd /d "%~dp0"

echo [1/5] Checking Docker Desktop status...
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo Docker Desktop is running. OK!
echo.

echo [2/5] Stopping any existing containers...
docker-compose down
echo.

echo [3/5] Building Docker images...
docker-compose build --no-cache
if errorlevel 1 (
    echo ERROR: Failed to build Docker images!
    pause
    exit /b 1
)
echo Build completed successfully!
echo.

echo [4/5] Starting services...
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start services!
    pause
    exit /b 1
)
echo Services started successfully!
echo.

echo [5/5] Waiting for services to become healthy...
timeout /t 10 /nobreak >nul
echo.

echo ============================================================================
echo   DEPLOYMENT COMPLETE!
echo ============================================================================
echo.
echo Services are now running:
echo   - API Server:       http://localhost:8000
echo   - API Health:       http://localhost:8000/api/health
echo   - API Docs:         http://localhost:8000/docs
echo   - Client:           http://localhost:8080
echo   - Grafana:          http://localhost:3000
echo   - Prometheus:       http://localhost:9090
echo.
echo Grafana credentials:
echo   Username: admin
echo   Password: gr@f@n@!sS3cur3N0w
echo.
echo To view logs:           docker-compose logs -f
echo To stop services:       docker-compose down
echo To restart services:    docker-compose restart
echo ============================================================================
echo.
pause

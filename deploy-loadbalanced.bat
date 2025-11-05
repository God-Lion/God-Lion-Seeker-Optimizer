@echo off
REM ============================================================================
REM God Lion Seeker Optimizer - Load Balanced Deployment Script
REM ============================================================================
REM This script deploys the application with 3 API instances and NGINX load balancer
REM Suitable for: Production, High-availability deployment
REM ============================================================================

echo.
echo ============================================================================
echo   God Lion Seeker Optimizer - Load Balanced Deployment
echo ============================================================================
echo.

REM Change to the project directory
cd /d "%~dp0"

echo [1/6] Checking Docker Desktop status...
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo Docker Desktop is running. OK!
echo.

echo [2/6] Stopping any existing containers...
docker-compose -f docker-compose.loadbalanced.yml down
echo.

echo [3/6] Building Docker images...
docker-compose -f docker-compose.loadbalanced.yml build --no-cache
if errorlevel 1 (
    echo ERROR: Failed to build Docker images!
    pause
    exit /b 1
)
echo Build completed successfully!
echo.

echo [4/6] Starting database and cache services...
docker-compose -f docker-compose.loadbalanced.yml up -d postgres redis
echo Waiting for database to be ready...
timeout /t 15 /nobreak >nul
echo.

echo [5/6] Starting application services...
docker-compose -f docker-compose.loadbalanced.yml up -d
if errorlevel 1 (
    echo ERROR: Failed to start services!
    pause
    exit /b 1
)
echo Services started successfully!
echo.

echo [6/6] Waiting for all services to become healthy...
timeout /t 20 /nobreak >nul
echo.

echo ============================================================================
echo   DEPLOYMENT COMPLETE!
echo ============================================================================
echo.
echo Load Balanced Configuration:
echo   - NGINX Load Balancer:  http://localhost
echo   - API via NGINX:        http://localhost/api
echo   - API Health Check:     http://localhost/health
echo   - Client:               http://localhost
echo   - Grafana:              http://localhost:3000
echo.
echo API Instances (3 replicas):
echo   - godlionseeker-api-1   (Internal)
echo   - godlionseeker-api-2   (Internal)
echo   - godlionseeker-api-3   (Internal)
echo.
echo Grafana credentials:
echo   Username: admin
echo   Password: gr@f@n@!sS3cur3N0w
echo.
echo NGINX will automatically distribute traffic across all API instances.
echo.
echo To view logs:           docker-compose -f docker-compose.loadbalanced.yml logs -f
echo To stop services:       docker-compose -f docker-compose.loadbalanced.yml down
echo To restart services:    docker-compose -f docker-compose.loadbalanced.yml restart
echo To scale API instances: docker-compose -f docker-compose.loadbalanced.yml up -d --scale api-1=5
echo ============================================================================
echo.
pause

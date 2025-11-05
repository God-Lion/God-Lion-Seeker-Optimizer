@echo off
REM ============================================================================
REM God Lion Seeker Optimizer - Development Deployment Script
REM ============================================================================
REM This script deploys the application with development tools and hot-reload
REM Includes: PgAdmin, Redis Commander, Mailhog, Hot-reload
REM ============================================================================

echo.
echo ============================================================================
echo   God Lion Seeker Optimizer - Development Deployment
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
docker-compose -f docker-compose.override.yml down
echo.

echo [3/5] Building Docker images...
docker-compose -f docker-compose.yml -f docker-compose.override.yml build
if errorlevel 1 (
    echo ERROR: Failed to build Docker images!
    pause
    exit /b 1
)
echo Build completed successfully!
echo.

echo [4/5] Starting services with development tools...
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
if errorlevel 1 (
    echo ERROR: Failed to start services!
    pause
    exit /b 1
)
echo Services started successfully!
echo.

echo [5/5] Waiting for services to become healthy...
timeout /t 15 /nobreak >nul
echo.

echo ============================================================================
echo   DEVELOPMENT DEPLOYMENT COMPLETE!
echo ============================================================================
echo.
echo Main Services:
echo   - API Server:           http://localhost:8000
echo   - API Docs (Swagger):   http://localhost:8000/docs
echo   - API Health:           http://localhost:8000/api/health
echo   - Client:               http://localhost:8080
echo   - Grafana:              http://localhost:3000
echo.
echo Development Tools:
echo   - PgAdmin:              http://localhost:5050
echo   - Redis Commander:      http://localhost:8081
echo   - Mailhog (SMTP UI):    http://localhost:8025
echo.
echo Database Access:
echo   - PostgreSQL:           localhost:5432
echo   - Database:             godlionseeker
echo   - Username:             scraper_user
echo   - Password:             scraper_password
echo.
echo Redis Access:
echo   - Redis:                localhost:6379
echo.
echo PgAdmin Login:
echo   Email:    admin@godlionseeker.local
echo   Password: admin
echo.
echo Grafana Login:
echo   Username: admin
echo   Password: gr@f@n@!sS3cur3N0w
echo.
echo Features Enabled:
echo   - Hot-reload for API code changes
echo   - Debug mode enabled
echo   - Exposed database ports for external tools
echo   - Email testing with Mailhog
echo.
echo To view logs:           docker-compose -f docker-compose.yml -f docker-compose.override.yml logs -f
echo To stop services:       docker-compose -f docker-compose.yml -f docker-compose.override.yml down
echo To restart services:    docker-compose -f docker-compose.yml -f docker-compose.override.yml restart
echo ============================================================================
echo.
pause

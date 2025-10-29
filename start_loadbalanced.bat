@echo off
REM ========================================
REM God Lion Seeker Optimizer - Load Balanced Deployment
REM ========================================

echo ========================================
echo God Lion Seeker Load Balanced Deployment
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo [INFO] Docker is running...
echo.

REM Check if docker-compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] docker-compose is not installed or not in PATH.
    pause
    exit /b 1
)

echo [INFO] Starting load balanced deployment...
echo.
echo Components:
echo   - NGINX Load Balancer (Port 80/443)
echo   - 3x FastAPI Instances (Internal: 8000)
echo   - PostgreSQL Database (Port 5432)
echo   - Redis Cache (Port 6379)
echo   - Prometheus Monitoring (Port 9090)
echo   - Grafana Dashboards (Port 3000)
echo.

REM Build and start all services
echo [INFO] Building and starting services (this may take a few minutes)...
echo [INFO] Step 1/2: Building images...
docker-compose -f docker-compose.loadbalanced.yml build --no-cache

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to build images
    pause
    exit /b 1
)

echo.
echo [INFO] Step 2/2: Starting services...
docker-compose -f docker-compose.loadbalanced.yml up -d

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start services
    pause
    exit /b 1
)

echo.
echo [SUCCESS] All services started successfully!
echo.
echo ========================================
echo Access Points:
echo ========================================
echo   API (Load Balanced):  http://localhost/api/docs
echo   Health Check:         http://localhost/health
echo   Grafana:              http://localhost:3000 (admin/admin)
echo   Prometheus:           http://localhost:9090
echo.
echo ========================================
echo Service Status:
echo ========================================
docker-compose -f docker-compose.loadbalanced.yml ps
echo.

echo [INFO] Waiting for services to be healthy (30 seconds)...
timeout /t 30 /nobreak >nul

echo.
echo [INFO] Testing API health...
curl -s http://localhost/health
echo.
echo.

echo ========================================
echo Useful Commands:
echo ========================================
echo   View logs:           docker-compose -f docker-compose.loadbalanced.yml logs -f
echo   Stop services:       docker-compose -f docker-compose.loadbalanced.yml down
echo   Restart service:     docker-compose -f docker-compose.loadbalanced.yml restart [service]
echo   Check status:        docker-compose -f docker-compose.loadbalanced.yml ps
echo.
echo See LOAD_BALANCED_DEPLOYMENT.md for complete documentation
echo.

pause

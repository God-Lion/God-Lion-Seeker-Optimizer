@echo off
REM ========================================
REM God Lion Seeker - Start Existing Services
REM ========================================

echo ========================================
echo Starting God Lion Seeker Services
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

echo [INFO] Starting services with existing images...
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

pause

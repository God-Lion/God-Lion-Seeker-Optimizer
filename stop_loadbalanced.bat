@echo off
REM ========================================
REM God Lion Seeker Optimizer - Stop Load Balanced Deployment
REM ========================================

echo ========================================
echo Stopping God Lion Seeker Load Balanced Deployment
echo ========================================
echo.

echo [INFO] Stopping all services...
docker-compose -f docker-compose.loadbalanced.yml down

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to stop services
    pause
    exit /b 1
)

echo.
echo [SUCCESS] All services stopped successfully!
echo.
echo To remove volumes (data will be lost), run:
echo   docker-compose -f docker-compose.loadbalanced.yml down -v
echo.

pause

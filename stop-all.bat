@echo off
REM ============================================================================
REM God Lion Seeker Optimizer - Stop All Services
REM ============================================================================

echo.
echo ============================================================================
echo   Stopping God Lion Seeker Optimizer Services
echo ============================================================================
echo.

cd /d "%~dp0"

echo Stopping all Docker Compose services...
echo.

echo [1/3] Stopping simple deployment...
docker-compose down

echo [2/3] Stopping load balanced deployment...
docker-compose -f docker-compose.loadbalanced.yml down

echo [3/3] Stopping development deployment...
docker-compose -f docker-compose.yml -f docker-compose.override.yml down

echo.
echo ============================================================================
echo   All services stopped successfully!
echo ============================================================================
echo.
echo To view remaining containers: docker ps -a
echo To remove all volumes:        docker-compose down -v
echo ============================================================================
echo.
pause

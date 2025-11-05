@echo off
REM ============================================================================
REM God Lion Seeker Optimizer - Status Check
REM ============================================================================

echo.
echo ============================================================================
echo   God Lion Seeker Optimizer - Service Status
echo ============================================================================
echo.

cd /d "%~dp0"

echo Checking Docker Desktop status...
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker Desktop is not running!
    echo Please start Docker Desktop first.
    pause
    exit /b 1
)
echo Docker Desktop: RUNNING
echo.

echo ============================================================================
echo   Running Containers
echo ============================================================================
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo ============================================================================
echo   Container Health Status
echo ============================================================================
for /f "tokens=*" %%i in ('docker ps -q') do (
    for /f "tokens=*" %%n in ('docker inspect -f "{{.Name}}" %%i') do (
        for /f "tokens=*" %%h in ('docker inspect -f "{{.State.Health.Status}}" %%i 2^>nul') do (
            if not "%%h"=="" (
                echo %%n: %%h
            ) else (
                echo %%n: no healthcheck
            )
        )
    )
)
echo.

echo ============================================================================
echo   Docker Resources Usage
echo ============================================================================
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
echo.

echo ============================================================================
echo   Docker Volumes
echo ============================================================================
docker volume ls --filter "name=god"
echo.

echo ============================================================================
echo   Useful Commands
echo ============================================================================
echo   View logs:              view-logs.bat
echo   Restart services:       docker-compose restart
echo   Stop all services:      stop-all.bat
echo   Access container:       docker exec -it [container_name] /bin/sh
echo ============================================================================
echo.
pause

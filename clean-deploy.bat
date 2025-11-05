@echo off
REM ============================================================================
REM God Lion Seeker Optimizer - Clean Deployment
REM ============================================================================
REM WARNING: This will remove all containers, volumes, and images!
REM Use this for a fresh start or when troubleshooting issues.
REM ============================================================================

echo.
echo ============================================================================
echo   God Lion Seeker Optimizer - CLEAN DEPLOYMENT
echo ============================================================================
echo.
echo WARNING: This will completely remove:
echo   - All containers
echo   - All volumes (DATABASE WILL BE DELETED!)
echo   - All images
echo   - All build cache
echo.
echo This action cannot be undone!
echo.
set /p confirm="Are you sure you want to continue? (yes/no): "

if /i not "%confirm%"=="yes" (
    echo.
    echo Cleanup cancelled.
    pause
    exit /b 0
)

echo.
echo Starting cleanup process...
echo.

cd /d "%~dp0"

echo [1/7] Stopping all running containers...
docker-compose down
docker-compose -f docker-compose.loadbalanced.yml down
docker-compose -f docker-compose.yml -f docker-compose.override.yml down
echo.

echo [2/7] Removing all God Lion Seeker containers...
for /f "tokens=*" %%i in ('docker ps -a --filter "name=godlionseeker" -q') do docker rm -f %%i
echo.

echo [3/7] Removing all volumes...
docker volume prune -f
docker-compose down -v
docker-compose -f docker-compose.loadbalanced.yml down -v
echo.

echo [4/7] Removing all God Lion Seeker images...
for /f "tokens=*" %%i in ('docker images --filter "reference=god*" -q') do docker rmi -f %%i
echo.

echo [5/7] Removing build cache...
docker builder prune -a -f
echo.

echo [6/7] Cleaning up dangling resources...
docker system prune -f
echo.

echo [7/7] Verifying cleanup...
echo.
echo Remaining containers:
docker ps -a
echo.
echo Remaining volumes:
docker volume ls
echo.

echo ============================================================================
echo   CLEANUP COMPLETE!
echo ============================================================================
echo.
echo The system is now clean and ready for a fresh deployment.
echo.
echo To deploy again:
echo   - Simple:        deploy-simple.bat
echo   - Load Balanced: deploy-loadbalanced.bat
echo   - Development:   deploy-dev.bat
echo.
pause

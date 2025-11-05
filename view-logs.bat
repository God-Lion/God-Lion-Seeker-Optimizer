@echo off
REM ============================================================================
REM God Lion Seeker Optimizer - View Logs
REM ============================================================================

echo.
echo ============================================================================
echo   God Lion Seeker Optimizer - View Logs
echo ============================================================================
echo.
echo Select which logs to view:
echo.
echo   1. Simple deployment logs
echo   2. Load balanced deployment logs
echo   3. Development deployment logs
echo   4. Specific service logs
echo   5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    docker-compose logs -f
) else if "%choice%"=="2" (
    docker-compose -f docker-compose.loadbalanced.yml logs -f
) else if "%choice%"=="3" (
    docker-compose -f docker-compose.yml -f docker-compose.override.yml logs -f
) else if "%choice%"=="4" (
    echo.
    echo Available services:
    docker-compose ps --services
    echo.
    set /p service="Enter service name: "
    docker-compose logs -f %service%
) else (
    echo Exiting...
    exit /b 0
)

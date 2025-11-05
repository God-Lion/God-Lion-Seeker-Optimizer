@echo off
REM Stop all development services

echo ========================================
echo   Stopping Development Services
echo ========================================
echo.

docker-compose down

if %errorlevel% equ 0 (
    echo [OK] All services stopped successfully!
) else (
    echo [ERROR] Failed to stop some services
    echo Try: docker-compose down --remove-orphans
)

echo.
pause

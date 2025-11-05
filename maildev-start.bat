@echo off
REM Run MailDev standalone for email testing
REM Useful when you want to run MailDev separately from the full stack

echo ========================================
echo   Starting MailDev Standalone
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running!
    echo Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [INFO] Starting MailDev container...
echo.

docker run -d ^
  --name maildev-standalone ^
  -p 1080:1080 ^
  -p 1025:1025 ^
  --rm ^
  maildev/maildev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to start MailDev!
    echo.
    echo Common issues:
    echo   - Port 1080 or 1025 already in use
    echo   - Docker Desktop not running
    echo   - Container name already exists
    echo.
    echo Try stopping any existing MailDev:
    echo   docker stop maildev-standalone
    echo.
    pause
    exit /b 1
)

echo [OK] MailDev started successfully!
echo.
echo ========================================
echo   MailDev is Ready!
echo ========================================
echo.
echo Web UI:    http://localhost:1080
echo SMTP Port: 1025
echo SMTP Host: localhost
echo.
echo Configure your application:
echo   SMTP_SERVER=localhost
echo   SMTP_PORT=1025
echo   SMTP_USE_TLS=false
echo.
echo ========================================
echo   Commands
echo ========================================
echo.
echo View logs:
echo   docker logs -f maildev-standalone
echo.
echo Stop MailDev:
echo   docker stop maildev-standalone
echo.
echo Restart MailDev:
echo   docker restart maildev-standalone
echo.

REM Wait for MailDev to be ready
timeout /t 3 /nobreak >nul

REM Try to open MailDev in browser
echo [INFO] Opening MailDev in browser...
start http://localhost:1080

echo.
echo Press any key to view logs, or close this window.
pause >nul

docker logs -f maildev-standalone

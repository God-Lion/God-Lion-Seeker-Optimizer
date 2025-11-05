@echo off
REM Stop standalone MailDev container

echo Stopping MailDev...
docker stop maildev-standalone

if %errorlevel% equ 0 (
    echo [OK] MailDev stopped successfully!
) else (
    echo [WARNING] MailDev was not running or already stopped
)

echo.
pause

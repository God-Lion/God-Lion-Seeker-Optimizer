@echo off
REM ============================================================================
REM God Lion Seeker Optimizer - Main Deployment Menu
REM ============================================================================

:menu
cls
echo.
echo ============================================================================
echo         GOD LION SEEKER OPTIMIZER - DEPLOYMENT MANAGER
echo ============================================================================
echo.
echo   DEPLOYMENT OPTIONS:
echo   -------------------
echo   1. Simple Deployment        (Single instance, quick start)
echo   2. Load Balanced Deployment (3 API instances + NGINX)
echo   3. Development Deployment   (With dev tools and hot-reload)
echo.
echo   MANAGEMENT OPTIONS:
echo   -------------------
echo   4. Health Check (Comprehensive test)
echo   5. View Service Status
echo   6. View Logs
echo   7. Stop All Services
echo   8. Backup Database
echo   9. Clean Install (Remove everything)
echo.
echo   0. Exit
echo.
echo ============================================================================
echo.

set /p choice="Enter your choice (0-9): "

if "%choice%"=="1" goto simple
if "%choice%"=="2" goto loadbalanced
if "%choice%"=="3" goto development
if "%choice%"=="4" goto health
if "%choice%"=="5" goto status
if "%choice%"=="6" goto logs
if "%choice%"=="7" goto stop
if "%choice%"=="8" goto backup
if "%choice%"=="9" goto clean
if "%choice%"=="0" goto exit

echo Invalid choice. Please try again.
timeout /t 2 >nul
goto menu

:simple
cls
echo.
echo Starting Simple Deployment...
call deploy-simple.bat
goto menu

:loadbalanced
cls
echo.
echo Starting Load Balanced Deployment...
call deploy-loadbalanced.bat
goto menu

:development
cls
echo.
echo Starting Development Deployment...
call deploy-dev.bat
goto menu

:health
cls
echo.
echo Running Health Check...
call health-check.bat
goto menu

:status
cls
echo.
echo Checking Service Status...
call status.bat
goto menu

:logs
cls
echo.
echo Opening Logs Viewer...
call view-logs.bat
goto menu

:stop
cls
echo.
echo Stopping All Services...
call stop-all.bat
goto menu

:backup
cls
echo.
echo Creating Database Backup...
call backup-database.bat
goto menu

:clean
cls
echo.
echo Starting Clean Installation...
call clean-deploy.bat
goto menu

:exit
echo.
echo Exiting...
exit /b 0

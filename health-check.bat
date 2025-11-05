@echo off
REM ============================================================================
REM God Lion Seeker Optimizer - Comprehensive Health Check
REM ============================================================================

echo.
echo ============================================================================
echo   God Lion Seeker Optimizer - Health Check
echo ============================================================================
echo.

cd /d "%~dp0"

set ERRORS=0

REM Check Docker Desktop
echo [1/8] Checking Docker Desktop...
docker info >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Docker Desktop is not running!
    set /a ERRORS+=1
) else (
    echo [PASS] Docker Desktop is running
)
echo.

REM Check if containers are running
echo [2/8] Checking containers...
for /f %%i in ('docker ps -q') do set HAS_CONTAINERS=1
if not defined HAS_CONTAINERS (
    echo [WARN] No containers are running
    echo Run deploy.bat to start services
) else (
    echo [PASS] Containers are running
    docker ps --format "  - {{.Names}}: {{.Status}}"
)
echo.

REM Check API health
echo [3/8] Checking API health endpoint...
curl -s -f http://localhost:8000/api/health >nul 2>&1
if errorlevel 1 (
    curl -s -f http://localhost/api/health >nul 2>&1
    if errorlevel 1 (
        echo [FAIL] API health check failed
        set /a ERRORS+=1
    ) else (
        echo [PASS] API is healthy (via NGINX)
    )
) else (
    echo [PASS] API is healthy
)
echo.

REM Check Client
echo [4/8] Checking Client...
curl -s -f http://localhost:8080 >nul 2>&1
if errorlevel 1 (
    curl -s -f http://localhost >nul 2>&1
    if errorlevel 1 (
        echo [FAIL] Client is not accessible
        set /a ERRORS+=1
    ) else (
        echo [PASS] Client is accessible (via NGINX)
    )
) else (
    echo [PASS] Client is accessible
)
echo.

REM Check Database
echo [5/8] Checking Database...
docker exec godlionseeker-db pg_isready -U scraper_user >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Database is not ready
    set /a ERRORS+=1
) else (
    echo [PASS] Database is ready
)
echo.

REM Check Redis
echo [6/8] Checking Redis...
docker exec godlionseeker-redis redis-cli ping >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Redis is not responding
    set /a ERRORS+=1
) else (
    echo [PASS] Redis is responding
)
echo.

REM Check disk space
echo [7/8] Checking disk space...
for /f "tokens=3" %%a in ('dir /-c ^| find "bytes free"') do set FREE_SPACE=%%a
echo Available space: %FREE_SPACE% bytes
if %FREE_SPACE% LSS 5368709120 (
    echo [WARN] Low disk space (less than 5GB free)
) else (
    echo [PASS] Sufficient disk space
)
echo.

REM Check Docker resources
echo [8/8] Checking Docker resources...
docker system df
echo.

echo ============================================================================
echo   HEALTH CHECK SUMMARY
echo ============================================================================

if %ERRORS% EQU 0 (
    echo.
    echo   STATUS: HEALTHY ✓
    echo   All systems operational!
    echo.
) else (
    echo.
    echo   STATUS: UNHEALTHY ✗
    echo   Found %ERRORS% error(s)
    echo.
    echo   RECOMMENDED ACTIONS:
    echo   1. Check logs: view-logs.bat
    echo   2. Check service status: status.bat
    echo   3. Restart services: stop-all.bat then deploy.bat
    echo   4. If problems persist: clean-deploy.bat
    echo.
)

echo ============================================================================
echo.

REM Test all endpoints
echo Testing all endpoints:
echo.

echo Testing API endpoints:
curl -s http://localhost:8000/api/health 2>nul
if errorlevel 1 (
    echo   /api/health: FAIL
) else (
    echo   /api/health: OK
)

curl -s http://localhost:8000/docs 2>nul
if errorlevel 1 (
    echo   /docs: FAIL
) else (
    echo   /docs: OK
)

echo.
echo Testing Client endpoints:
curl -s -o nul -w "  Client (port 8080): %%{http_code}\n" http://localhost:8080 2>nul
curl -s -o nul -w "  NGINX (port 80): %%{http_code}\n" http://localhost 2>nul

echo.
echo ============================================================================
echo.

pause

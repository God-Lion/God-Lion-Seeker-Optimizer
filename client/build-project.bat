@echo off
echo Building project...
call npm run build
if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    exit /b 0
) else (
    echo Build failed with error code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

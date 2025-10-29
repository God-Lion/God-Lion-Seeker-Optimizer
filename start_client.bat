@echo off
REM Startup script for God Lion Seeker Optimizer API (Windows)

echo Starting God Lion Seeker Optimizer client...

REM Check if virtual environment exists
if not exist "client\node_modules\" (
    echo Dependencies node_modules not found. Installing...
    pushd client
    npm install --legacy-peer-deps
    popd
)



REM Run database migrations
echo Running database migrations...
cd client


REM Start the CLIENT
echo Starting Client DEV server...
echo API will be available at: http://localhost:3000
echo.


npm run start
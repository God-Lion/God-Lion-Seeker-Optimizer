#!/bin/bash
# Startup script for God Lion Seeker Optimizer API

set -e

echo "🚀 Starting God Lion Seeker Optimizer API..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "${YELLOW}Virtual environment not found. Creating...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Install Playwright browsers if needed
if ! playwright --version &> /dev/null; then
    echo "Installing Playwright browsers..."
    playwright install chromium
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "${YELLOW}⚠️  .env file not found. Copying from .env.example${NC}"
    cp .env.example .env
    echo "${YELLOW}⚠️  Please update .env with your configuration${NC}"
fi

# Run database migrations
echo "Running database migrations..."
cd src
alembic upgrade head
cd ..

# Start the API
echo "${GREEN}✓ Starting API server...${NC}"
echo "API will be available at: http://localhost:8000"
echo "API Documentation: http://localhost:8000/api/docs"
echo ""

cd src
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# Makefile for God Lion Seeker Optimizer

.PHONY: help install install-dev setup test test-unit test-integration test-coverage \
        lint format type-check security-check pre-commit docker-build docker-up docker-down \
        docker-logs docker-clean clean migrate upgrade downgrade db-init

.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)God Lion Seeker Optimizer - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-30s$(NC) %s\n", $$1, $$2}'

# Installation
install: ## Install production dependencies
	@echo "$(BLUE)Installing production dependencies...$(NC)"
	pip install -r requirements.txt
	python -m spacy download en_core_web_md
	playwright install chromium

install-dev: ## Install development dependencies
	@echo "$(BLUE)Installing development dependencies...$(NC)"
	pip install -r requirements.txt
	pip install -r requirements-dev.txt
	python -m spacy download en_core_web_md
	playwright install chromium
	pre-commit install

setup: ## Initial project setup
	@echo "$(BLUE)Setting up project...$(NC)"
	cp .env.example .env
	@echo "$(YELLOW)Please edit .env file with your configuration$(NC)"
	make install-dev
	make db-init

# Testing
test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	pytest tests/ -v

test-unit: ## Run unit tests only
	@echo "$(BLUE)Running unit tests...$(NC)"
	pytest tests/unit/ -v

test-integration: ## Run integration tests only
	@echo "$(BLUE)Running integration tests...$(NC)"
	pytest tests/integration/ -v

test-coverage: ## Run tests with coverage report
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	pytest tests/ -v --cov=src --cov-report=html --cov-report=term
	@echo "$(GREEN)Coverage report generated in htmlcov/index.html$(NC)"

# Code Quality
lint: ## Run linter (ruff)
	@echo "$(BLUE)Running linter...$(NC)"
	ruff check src/ tests/

format: ## Format code with black and isort
	@echo "$(BLUE)Formatting code...$(NC)"
	black src/ tests/
	isort src/ tests/

type-check: ## Run type checker (mypy)
	@echo "$(BLUE)Running type checker...$(NC)"
	mypy src/

security-check: ## Run security checks (bandit + safety)
	@echo "$(BLUE)Running security checks...$(NC)"
	bandit -r src/
	safety check

pre-commit: ## Run all pre-commit hooks
	@echo "$(BLUE)Running pre-commit hooks...$(NC)"
	pre-commit run --all-files

# Docker Commands
docker-build: ## Build Docker image
	@echo "$(BLUE)Building Docker image...$(NC)"
	docker build -t godlionseeker:latest .

docker-up: ## Start Docker containers
	@echo "$(BLUE)Starting Docker containers...$(NC)"
	docker-compose up -d

docker-up-build: ## Build and start Docker containers
	@echo "$(BLUE)Building and starting Docker containers...$(NC)"
	docker-compose up -d --build

docker-down: ## Stop Docker containers
	@echo "$(BLUE)Stopping Docker containers...$(NC)"
	docker-compose down

docker-logs: ## View Docker logs
	@echo "$(BLUE)Viewing Docker logs...$(NC)"
	docker-compose logs -f

docker-clean: ## Remove Docker containers and volumes
	@echo "$(RED)Removing Docker containers and volumes...$(NC)"
	docker-compose down -v
	docker system prune -f

# Database Commands
db-init: ## Initialize database with migrations
	@echo "$(BLUE)Initializing database...$(NC)"
	alembic upgrade head

migrate: ## Create new migration
	@echo "$(BLUE)Creating new migration...$(NC)"
	@read -p "Migration message: " msg; \
	alembic revision --autogenerate -m "$$msg"

upgrade: ## Upgrade database to latest version
	@echo "$(BLUE)Upgrading database...$(NC)"
	alembic upgrade head

downgrade: ## Downgrade database by one version
	@echo "$(YELLOW)Downgrading database...$(NC)"
	alembic downgrade -1

# Application Commands
run: ## Run the application
	@echo "$(BLUE)Running application...$(NC)"
	python -m src.cli.main

scrape: ## Run scraping job
	@echo "$(BLUE)Running scraping job...$(NC)"
	python -m src.cli.scrape_jobs

analyze: ## Analyze scraped jobs
	@echo "$(BLUE)Analyzing jobs...$(NC)"
	python -m src.cli.analyze_jobs

match: ## Match jobs with profile
	@echo "$(BLUE)Matching jobs...$(NC)"
	python -m src.cli.match_jobs

# Cleanup
clean: ## Clean up temporary files
	@echo "$(BLUE)Cleaning up...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".mypy_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type f -name ".coverage" -delete
	rm -rf htmlcov/
	rm -rf dist/
	rm -rf build/
	@echo "$(GREEN)Cleanup complete!$(NC)"

# Monitoring
monitor-up: ## Start monitoring stack (Prometheus + Grafana)
	@echo "$(BLUE)Starting monitoring stack...$(NC)"
	docker-compose --profile monitoring up -d

monitor-down: ## Stop monitoring stack
	@echo "$(BLUE)Stopping monitoring stack...$(NC)"
	docker-compose --profile monitoring down

# Documentation
docs: ## Generate documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	@echo "$(YELLOW)Documentation is in the documentation/ folder$(NC)"

# Development
dev: ## Run in development mode
	@echo "$(BLUE)Starting development environment...$(NC)"
	make docker-up
	@echo "$(GREEN)Development environment ready!$(NC)"
	@echo "$(YELLOW)MySQL: localhost:3306$(NC)"
	@echo "$(YELLOW)Redis: localhost:6379$(NC)"

# Quick start commands
quickstart: ## Complete setup and first run
	@echo "$(BLUE)Quick Start Setup$(NC)"
	make setup
	make docker-up
	@echo "$(GREEN)Setup complete! You can now run: make scrape$(NC)"

check: ## Run all quality checks
	@echo "$(BLUE)Running all quality checks...$(NC)"
	make lint
	make type-check
	make test-coverage
	make security-check
	@echo "$(GREEN)All checks passed!$(NC)"

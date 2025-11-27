# Makefile for Flowlet Development

.PHONY: help setup dev build test clean docker-build docker-dev docker-prod lint format

# Default target
help:
	@echo "Flowlet Development Commands"
	@echo "============================"
	@echo "setup          - Setup development environment"
	@echo "dev            - Start development servers"
	@echo "build          - Build production assets"
	@echo "test           - Run all tests"
	@echo "lint           - Run linting on all code"
	@echo "format         - Format all code"
	@echo "clean          - Clean build artifacts"
	@echo "docker-build   - Build Docker images"
	@echo "docker-dev     - Start development with Docker"
	@echo "docker-prod    - Start production with Docker"

# Setup development environment
setup:
	@echo "Setting up development environment..."
	./setup-dev.sh

# Start development servers
dev:
	@echo "Starting development servers..."
	./dev-start.sh

# Build production assets
build:
	@echo "Building production assets..."
	cd web-frontend && npm run build

# Run all tests
test:
	@echo "Running backend tests..."
	cd backend && ./run_tests.sh
	@echo "Running web-frontend tests..."
	cd web-frontend && npm test -- --watchAll=false

# Run linting
lint:
	@echo "Linting backend code..."
	cd backend && flake8 src/ --max-line-length=100
	@echo "Linting web-frontend code..."
	cd web-frontend && npm run lint

# Format code
format:
	@echo "Formatting backend code..."
	cd backend && black src/
	@echo "Formatting web-frontend code..."
	cd web-frontend && npm run format

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	cd backend && rm -rf __pycache__ .pytest_cache test_results logs/*.log
	cd web-frontend && rm -rf node_modules dist .vite
	docker system prune -f

# Docker commands
docker-build:
	@echo "Building Docker images..."
	docker-compose build

docker-dev:
	@echo "Starting development environment with Docker..."
	docker-compose -f docker-compose.dev.yml up

docker-prod:
	@echo "Starting production environment with Docker..."
	docker-compose up -d

# Database commands
db-init:
	@echo "Initializing database..."
	cd backend && python -c "from src.main import create_app; from src.models.database import db; app = create_app('development'); app.app_context().push(); db.create_all()"

db-reset:
	@echo "Resetting database..."
	cd backend && rm -f data/flowlet_dev.db
	$(MAKE) db-init

# Security scan
security:
	@echo "Running security scan..."
	cd backend && bandit -r src/ -f json -o security-report.json

# Performance test
perf:
	@echo "Running performance tests..."
	cd backend && pytest tests/test_performance.py -v

# Install dependencies
install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements_updated.txt
	@echo "Installing web-frontend dependencies..."
	cd web-frontend && npm install

# Update dependencies
update:
	@echo "Updating backend dependencies..."
	cd backend && pip install --upgrade -r requirements_updated.txt
	@echo "Updating web-frontend dependencies..."
	cd web-frontend && npm update

# Generate documentation
docs:
	@echo "Generating documentation..."
	cd backend && python -m pydoc -w src/
	cd web-frontend && npm run build-docs

# Health check
health:
	@echo "Checking application health..."
	curl -f http://localhost:5000/health || echo "Backend not running"
	curl -f http://localhost:5173 || echo "web-frontend not running"

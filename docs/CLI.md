# CLI Reference

Command-line interface documentation for Flowlet development, deployment, and operations.

## Table of Contents

- [Installation](#installation)
- [Make Commands](#make-commands)
- [Flask CLI](#flask-cli)
- [Database Commands](#database-commands)
- [Testing Commands](#testing-commands)
- [Deployment Commands](#deployment-commands)

## Installation

The CLI is available through the project's `Makefile` and Flask's built-in CLI.

```bash
# Clone repository
git clone https://github.com/abrar2030/Flowlet
cd Flowlet

# Make is available by default on Unix systems
make help
```

## Make Commands

All Make commands should be run from the project root directory.

### Available Commands

| Command             | Arguments | Description                            | Example             |
| ------------------- | --------- | -------------------------------------- | ------------------- |
| `make help`         | None      | Display all available commands         | `make help`         |
| `make setup`        | None      | Setup development environment          | `make setup`        |
| `make dev`          | None      | Start development servers              | `make dev`          |
| `make build`        | None      | Build production assets                | `make build`        |
| `make test`         | None      | Run all tests (backend + frontend)     | `make test`         |
| `make lint`         | None      | Run linting on all code                | `make lint`         |
| `make format`       | None      | Format all code (Black + Prettier)     | `make format`       |
| `make clean`        | None      | Clean build artifacts and caches       | `make clean`        |
| `make docker-build` | None      | Build Docker images                    | `make docker-build` |
| `make docker-dev`   | None      | Start development with Docker Compose  | `make docker-dev`   |
| `make docker-prod`  | None      | Start production with Docker Compose   | `make docker-prod`  |
| `make db-init`      | None      | Initialize database schema             | `make db-init`      |
| `make db-reset`     | None      | Reset database (WARNING: deletes data) | `make db-reset`     |
| `make security`     | None      | Run security scan with Bandit          | `make security`     |
| `make perf`         | None      | Run performance tests                  | `make perf`         |
| `make install`      | None      | Install all dependencies               | `make install`      |
| `make update`       | None      | Update all dependencies                | `make update`       |
| `make docs`         | None      | Generate documentation                 | `make docs`         |
| `make health`       | None      | Check application health               | `make health`       |

### Development Workflow

#### Initial Setup

```bash
# Setup development environment (installs dependencies, configures env)
make setup

# Initialize database
make db-init

# Start development servers
make dev
```

#### Daily Development

```bash
# Start development environment
make docker-dev

# In another terminal, run tests
make test

# Format code before committing
make format

# Run linting checks
make lint
```

#### Code Quality

```bash
# Format backend code (Black)
cd backend && black src/

# Format frontend code (Prettier)
cd web-frontend && npm run format

# Or format everything
make format

# Lint backend
cd backend && flake8 src/ --max-line-length=100

# Lint frontend
cd web-frontend && npm run lint

# Or lint everything
make lint
```

### Docker Commands

#### Build Images

```bash
# Build all Docker images
make docker-build

# Build specific service
docker-compose build backend
docker-compose build web-frontend
```

#### Start Services

```bash
# Development mode (with hot reload)
make docker-dev

# Production mode (optimized)
make docker-prod

# Start specific services
docker-compose up backend postgres redis
```

#### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

#### View Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f postgres

# View last 100 lines
docker-compose logs --tail=100 backend
```

### Database Commands

#### Initialize Database

```bash
# Create database schema
make db-init

# Using Flask CLI directly
cd backend
export FLASK_APP=app.py
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

#### Migration Workflow

```bash
# Create a new migration
cd backend
flask db migrate -m "Add new column to users table"

# Review migration file in backend/migrations/versions/

# Apply migration
flask db upgrade

# Rollback migration
flask db downgrade
```

#### Reset Database

```bash
# WARNING: This deletes ALL data
make db-reset

# Manual reset
cd backend
rm -f database/app.db  # For SQLite
flask db upgrade
```

#### Database Utilities

```bash
# Open database shell (PostgreSQL)
docker-compose exec postgres psql -U flowlet -d flowlet

# Open database shell (SQLite)
sqlite3 backend/database/app.db

# Backup database (PostgreSQL)
docker-compose exec postgres pg_dump -U flowlet flowlet > backup.sql

# Restore database (PostgreSQL)
docker-compose exec -T postgres psql -U flowlet flowlet < backup.sql
```

## Flask CLI

Flask provides built-in CLI commands for application management.

### Setup Flask CLI

```bash
cd backend
export FLASK_APP=app.py
export FLASK_ENV=development

# Verify Flask CLI is working
flask --help
```

### Flask Commands

| Command              | Description                        | Example                                |
| -------------------- | ---------------------------------- | -------------------------------------- |
| `flask run`          | Start development server           | `flask run --host=0.0.0.0 --port=5000` |
| `flask shell`        | Open Python shell with app context | `flask shell`                          |
| `flask routes`       | List all registered routes         | `flask routes`                         |
| `flask db init`      | Initialize migrations              | `flask db init`                        |
| `flask db migrate`   | Create migration                   | `flask db migrate -m "message"`        |
| `flask db upgrade`   | Apply migrations                   | `flask db upgrade`                     |
| `flask db downgrade` | Rollback migration                 | `flask db downgrade`                   |
| `flask db current`   | Show current migration             | `flask db current`                     |
| `flask db history`   | Show migration history             | `flask db history`                     |

### Custom Flask Commands

```bash
# Run development server
cd backend
python run_server.py

# With custom port
python run_server.py --port=8000

# With debug mode
FLASK_DEBUG=1 python run_server.py
```

## Testing Commands

### Run All Tests

```bash
# Run backend and frontend tests
make test

# Backend tests only
cd backend
./run_tests.sh

# Frontend tests only
cd web-frontend
npm test
```

### Backend Testing

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html tests/

# Run specific test file
pytest tests/unit/test_wallet.py

# Run specific test function
pytest tests/unit/test_wallet.py::test_create_wallet

# Run with verbose output
pytest -v

# Run in parallel (faster)
pytest -n auto
```

### Frontend Testing

```bash
cd web-frontend

# Run tests once
npm test -- --watchAll=false

# Run tests in watch mode
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- wallet.test.tsx
```

### Integration Testing

```bash
# Run integration tests
cd backend
pytest tests/integration/ -v

# Test specific integration
pytest tests/integration/test_payment_flow.py
```

### Performance Testing

```bash
# Run performance benchmarks
make perf

# Run specific performance test
cd backend
pytest tests/test_performance.py::test_payment_throughput -v
```

## Deployment Commands

### Build Production Assets

```bash
# Build frontend for production
cd web-frontend
npm run build

# Output will be in web-frontend/dist/

# Build with specific environment
VITE_API_URL=https://api.flowlet.com npm run build
```

### Start Production Server

```bash
# Using Docker Compose
make docker-prod

# Manual start with Gunicorn
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 "app:create_app()"

# With more workers
gunicorn -w 8 -b 0.0.0.0:5000 --timeout 120 "app:create_app()"
```

### Infrastructure Deployment

```bash
# Deploy with Terraform
cd infrastructure/terraform
terraform init
terraform plan
terraform apply

# Deploy with Ansible
cd infrastructure/ansible
ansible-playbook -i inventory/production site.yml

# Deploy to Kubernetes
cd infrastructure/kubernetes
kubectl apply -f namespaces/
kubectl apply -f databases/
kubectl apply -f services/
```

### Health Checks

```bash
# Check application health
make health

# Manual health check
curl http://localhost:5000/health

# Check specific services
curl http://localhost:5000/api/v1/monitoring/health
```

## Environment Management

### Set Environment Variables

```bash
# Development
export FLASK_ENV=development
export DATABASE_URL=sqlite:///./database/app.db

# Production
export FLASK_ENV=production
export DATABASE_URL=postgresql://user:pass@localhost/flowlet
export SECRET_KEY=your-secret-key
```

### Load from .env File

```bash
# Backend automatically loads from .env
cd backend
cp .env.example .env
# Edit .env with your values

# Frontend
cd web-frontend
cp .env.example .env
# Edit .env with your values
```

## Monitoring Commands

### View Application Logs

```bash
# Docker logs
docker-compose logs -f backend

# Local logs
cd backend
tail -f logs/app.log

# Error logs only
tail -f logs/error.log
```

### Check Metrics

```bash
# Prometheus metrics
curl http://localhost:5000/metrics

# Application metrics
curl http://localhost:5000/api/v1/monitoring/metrics
```

## Security Commands

### Security Scanning

```bash
# Run security scan
make security

# Manual Bandit scan
cd backend
bandit -r src/ -f json -o security-report.json

# Check for vulnerabilities
pip-audit

# Frontend security audit
cd web-frontend
npm audit
```

### Generate Secrets

```bash
# Generate Flask SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"

# Generate JWT secret
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Generate Fernet encryption key
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

## Troubleshooting CLI Issues

### Command Not Found

```bash
# Ensure Make is installed
which make
# If not installed:
# Ubuntu/Debian: sudo apt install make
# macOS: xcode-select --install

# Ensure Flask CLI is accessible
cd backend
export FLASK_APP=app.py
flask --version
```

### Permission Denied

```bash
# Fix script permissions
chmod +x backend/run_tests.sh
chmod +x scripts/*.sh

# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
# Logout and login again
```

### Port Already in Use

```bash
# Find process using port
lsof -i :5000
# Or
netstat -tuln | grep 5000

# Kill process
kill -9 <PID>
```

## Advanced Usage

### Running Commands in Docker Container

```bash
# Execute command in running container
docker-compose exec backend flask db upgrade

# Open shell in container
docker-compose exec backend bash

# Run one-off command
docker-compose run --rm backend pytest
```

### Batch Operations

```bash
# Clean and rebuild everything
make clean && make docker-build && make docker-dev

# Full test cycle
make format && make lint && make test

# Production deployment
make build && make docker-build && make docker-prod
```

## Next Steps

- Review [USAGE.md](USAGE.md) for application usage patterns
- Check [CONFIGURATION.md](CONFIGURATION.md) for environment configuration
- See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues

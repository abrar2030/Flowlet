# Installation Guide

This guide covers all installation methods for Flowlet, including local development, Docker, and production deployment.

## Table of Contents

- [System Requirements](#system-requirements)
- [Installation by Platform](#installation-by-platform)
- [Quick Start with Docker](#quick-start-with-docker)
- [Manual Installation](#manual-installation)
- [Database Setup](#database-setup)
- [Verification](#verification)

## System Requirements

| Component      | Minimum Version | Recommended |
| -------------- | --------------- | ----------- |
| Python         | 3.11+           | 3.12+       |
| Node.js        | 18+             | 20+ LTS     |
| PostgreSQL     | 13+             | 15+         |
| Redis          | 6+              | 7+          |
| Docker         | 20.10+          | 24+         |
| Docker Compose | 2.0+            | 2.20+       |
| RAM            | 4GB             | 8GB+        |
| Disk Space     | 5GB             | 10GB+       |

## Installation by Platform

### Platform-Specific Installation

| OS / Platform       | Recommended Install Command                                                            | Notes                              |
| ------------------- | -------------------------------------------------------------------------------------- | ---------------------------------- |
| **macOS**           | `brew install python@3.12 node@20 postgresql redis docker`                             | Use Homebrew package manager       |
| **Ubuntu/Debian**   | `sudo apt update && sudo apt install python3.12 nodejs npm postgresql redis docker.io` | Requires sudo privileges           |
| **Windows**         | Use WSL2 with Ubuntu 22.04, then follow Ubuntu instructions                            | Install Docker Desktop for Windows |
| **Docker (Any OS)** | `docker-compose up -d`                                                                 | Easiest cross-platform option      |

## Quick Start with Docker

**Recommended for first-time users and development.**

### 1. Clone Repository

```bash
git clone https://github.com/abrar2030/Flowlet.git
cd Flowlet
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and update these critical settings:

```bash
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=postgresql://flowlet:password@postgres:5432/flowlet
REDIS_URL=redis://redis:6379/0
```

### 3. Start with Docker Compose

```bash
# Development environment
make docker-dev

# OR Production environment
make docker-prod
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/api/v1/docs

## Manual Installation

For advanced users who want full control over the installation.

### Backend Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Initialize database
flask db init
flask db migrate -m "Initial migration"
flask db upgrade

# Run backend server
python run_server.py
```

Backend will run on http://localhost:5000

### Frontend Installation

```bash
# Navigate to web-frontend directory
cd web-frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run development server
npm run dev
```

Frontend will run on http://localhost:3000

## Database Setup

### PostgreSQL (Recommended for Production)

```bash
# Install PostgreSQL
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql

# Start PostgreSQL service
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS

# Create database and user
sudo -u postgres psql
CREATE DATABASE flowlet;
CREATE USER flowlet_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE flowlet TO flowlet_user;
\q

# Update backend/.env
DATABASE_URL=postgresql://flowlet_user:secure_password@localhost:5432/flowlet
```

### SQLite (Development Only)

SQLite is automatically configured for development:

```bash
# In backend/.env
DATABASE_URL=sqlite:///./database/app.db
```

The database file will be created automatically on first run.

### Redis Setup

```bash
# Install Redis
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis

# Start Redis
sudo systemctl start redis  # Linux
brew services start redis   # macOS

# Update backend/.env
REDIS_URL=redis://localhost:6379/0
```

## Environment Configuration

Create and configure the environment file:

```bash
cp backend/.env.example backend/.env
```

### Essential Environment Variables

```bash
# Core Settings
SECRET_KEY=generate-random-string-here
FLASK_ENV=development
FLASK_CONFIG=development

# Database
DATABASE_URL=postgresql://user:password@localhost/flowlet

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=generate-jwt-secret-here
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=86400

# Feature Flags
FRAUD_DETECTION_ENABLED=true
KYC_VERIFICATION_REQUIRED=true
AML_MONITORING_ENABLED=true
```

See [CONFIGURATION.md](CONFIGURATION.md) for complete environment variable reference.

## Verification

### Verify Backend Installation

```bash
cd backend
python -c "from app import create_app; app = create_app(); print('Backend OK')"

# Run tests
./run_tests.sh
```

### Verify Frontend Installation

```bash
cd web-frontend
npm run build
echo "Frontend build successful"
```

### Check Services

```bash
# Backend health check
curl http://localhost:5000/health

# Expected response:
# {"status": "healthy", "timestamp": "2025-01-01T00:00:00Z"}
```

### Run Full Test Suite

```bash
# From project root
make test
```

## Troubleshooting Installation

### Common Issues

**Issue**: `ModuleNotFoundError: No module named 'src'`

**Solution**: Ensure you're running commands from the correct directory and virtual environment is activated:

```bash
cd backend
source venv/bin/activate
export PYTHONPATH=$PYTHONPATH:$(pwd)
```

**Issue**: Database connection errors

**Solution**: Verify PostgreSQL is running and credentials are correct:

```bash
sudo systemctl status postgresql
psql -U flowlet_user -d flowlet -h localhost
```

**Issue**: Port already in use

**Solution**: Change ports in configuration or stop conflicting services:

```bash
# Find process using port 5000
lsof -i :5000
kill -9 <PID>
```

For more troubleshooting help, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Next Steps

- Read [USAGE.md](USAGE.md) for common usage patterns
- Explore [API.md](API.md) for API documentation
- Check [EXAMPLES](examples/) for working code examples
- Review [CONFIGURATION.md](CONFIGURATION.md) for advanced configuration

## Updating Installation

```bash
# Pull latest changes
git pull origin main

# Update backend dependencies
cd backend
pip install --upgrade -r requirements.txt

# Update frontend dependencies
cd web-frontend
npm update

# Run migrations
cd backend
flask db upgrade

# Restart services
make docker-dev  # For Docker
# OR restart manually for local installation
```

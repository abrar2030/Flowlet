#!/bin/bash

# Flowlet Development Environment Setup Script
# This script sets up the complete development environment for Flowlet

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo -e "Flowlet Development Environment Setup"
echo -e "==========================================${NC}"

# Check if running on supported OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS="windows"
else
    echo -e "${RED}Unsupported operating system: $OSTYPE${NC}"
    exit 1
fi

echo -e "${GREEN}Detected OS: $OS${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Python dependencies
install_python_deps() {
    echo -e "${BLUE}Installing Python dependencies...${NC}"
    
    if [ -f "backend/requirements.txt" ]; then
        pip install -r backend/requirements.txt
    fi
    
    if [ -f "backend/requirements_updated.txt" ]; then
        pip install -r backend/requirements_updated.txt
    fi
    
    # Install development dependencies
    pip install pytest pytest-cov pytest-html pytest-mock bandit flake8 black isort
    
    echo -e "${GREEN}✓ Python dependencies installed${NC}"
}

# Function to install Node.js dependencies
install_node_deps() {
    echo -e "${BLUE}Installing Node.js dependencies...${NC}"
    
    # Install unified frontend dependencies
    if [ -d "unified-frontend" ]; then
        cd unified-frontend
        if command_exists pnpm; then
            pnpm install
        elif command_exists npm; then
            npm install
        else
            echo -e "${RED}Neither pnpm nor npm found. Please install Node.js and npm.${NC}"
            exit 1
        fi
        cd ..
        echo -e "${GREEN}✓ Unified frontend dependencies installed${NC}"
    fi
}

# Function to setup database
setup_database() {
    echo -e "${BLUE}Setting up database...${NC}"
    
    cd backend
    
    # Create database directory if it doesn't exist
    mkdir -p data
    
    # Initialize database
    python -c "
from src.main import create_app
from src.models.database import db

app = create_app('development')
with app.app_context():
    db.create_all()
    print('Database initialized successfully')
"
    
    cd ..
    echo -e "${GREEN}✓ Database setup completed${NC}"
}

# Function to setup environment files
setup_env_files() {
    echo -e "${BLUE}Setting up environment files...${NC}"
    
    # Backend environment file
    if [ ! -f "backend/.env" ]; then
        cat > backend/.env << EOF
# Flowlet Backend Environment Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production
DATABASE_URL=sqlite:///data/flowlet_dev.db
REDIS_URL=redis://localhost:6379/0

# API Keys (replace with actual values)
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# Security Settings
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
JWT_SECRET_KEY=jwt-secret-key-change-in-production

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/flowlet.log

# Performance Settings
SQLALCHEMY_POOL_SIZE=10
SQLALCHEMY_MAX_OVERFLOW=20
REDIS_POOL_SIZE=10
EOF
        echo -e "${GREEN}✓ Backend .env file created${NC}"
    else
        echo -e "${YELLOW}⚠ Backend .env file already exists${NC}"
    fi
    
    # Frontend environment file
    if [ ! -f "unified-frontend/.env" ]; then
        cat > unified-frontend/.env << EOF
# Flowlet Frontend Environment Configuration
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=Flowlet
VITE_APP_VERSION=2.0.0
VITE_ENVIRONMENT=development

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=true
VITE_ENABLE_FRAUD_DETECTION=true

# External Services
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key
EOF
        echo -e "${GREEN}✓ Frontend .env file created${NC}"
    else
        echo -e "${YELLOW}⚠ Frontend .env file already exists${NC}"
    fi
}

# Function to create development scripts
create_dev_scripts() {
    echo -e "${BLUE}Creating development scripts...${NC}"
    
    # Backend development script
    cat > backend/dev.sh << 'EOF'
#!/bin/bash
# Backend Development Server

export FLASK_ENV=development
export FLASK_DEBUG=True

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Create logs directory
mkdir -p logs

# Start the development server
python src/main.py
EOF
    chmod +x backend/dev.sh
    
    # Frontend development script
    cat > unified-frontend/dev.sh << 'EOF'
#!/bin/bash
# Frontend Development Server

# Start the development server with host binding for external access
if command -v pnpm >/dev/null 2>&1; then
    pnpm run dev --host
else
    npm run dev -- --host
fi
EOF
    chmod +x unified-frontend/dev.sh
    
    # Combined development script
    cat > dev-start.sh << 'EOF'
#!/bin/bash
# Start both backend and frontend development servers

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Flowlet development environment...${NC}"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${BLUE}Shutting down development servers...${NC}"
    kill $(jobs -p) 2>/dev/null
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start backend server
echo -e "${GREEN}Starting backend server...${NC}"
cd backend && ./dev.sh &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo -e "${GREEN}Starting frontend server...${NC}"
cd ../unified-frontend && ./dev.sh &
FRONTEND_PID=$!

echo -e "${GREEN}=========================================="
echo -e "Development servers started!"
echo -e "Backend:  http://localhost:5000"
echo -e "Frontend: http://localhost:5173"
echo -e "Press Ctrl+C to stop all servers"
echo -e "==========================================${NC}"

# Wait for background processes
wait
EOF
    chmod +x dev-start.sh
    
    echo -e "${GREEN}✓ Development scripts created${NC}"
}

# Function to create Docker configuration
create_docker_config() {
    echo -e "${BLUE}Creating Docker configuration...${NC}"
    
    # Backend Dockerfile
    cat > backend/Dockerfile << 'EOF'
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements*.txt ./
RUN pip install --no-cache-dir -r requirements_updated.txt

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Run the application
CMD ["python", "src/main.py"]
EOF
    
    # Frontend Dockerfile
    cat > unified-frontend/Dockerfile << 'EOF'
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml* ./

# Install dependencies
RUN npm install -g pnpm && pnpm install

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
EOF
    
    # Nginx configuration for frontend
    cat > unified-frontend/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    # Docker Compose configuration
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://flowlet:password@postgres:5432/flowlet
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend/logs:/app/logs
    restart: unless-stopped

  frontend:
    build: ./unified-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=flowlet
      - POSTGRES_USER=flowlet
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
EOF
    
    # Development Docker Compose
    cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=development
      - FLASK_DEBUG=True
      - DATABASE_URL=postgresql://flowlet:password@postgres:5432/flowlet_dev
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
      - ./backend/logs:/app/logs
    command: python src/main.py

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=flowlet_dev
      - POSTGRES_USER=flowlet
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_dev_data:/data

volumes:
  postgres_dev_data:
  redis_dev_data:
EOF
    
    echo -e "${GREEN}✓ Docker configuration created${NC}"
}

# Function to create CI/CD configuration
create_cicd_config() {
    echo -e "${BLUE}Creating CI/CD configuration...${NC}"
    
    mkdir -p .github/workflows
    
    # GitHub Actions workflow
    cat > .github/workflows/ci-cd.yml << 'EOF'
name: Flowlet CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: flowlet_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Cache pip dependencies
      uses: actions/cache@v3
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('backend/requirements*.txt') }}
        restore-keys: |
          ${{ runner.os }}-pip-
    
    - name: Install dependencies
      run: |
        cd backend
        pip install -r requirements_updated.txt
        pip install pytest pytest-cov pytest-html bandit flake8
    
    - name: Run security scan
      run: |
        cd backend
        bandit -r src/ -f json -o security-report.json || true
    
    - name: Run code quality checks
      run: |
        cd backend
        flake8 src/ --max-line-length=100 --ignore=E203,W503
    
    - name: Run tests with coverage
      run: |
        cd backend
        ./run_tests.sh
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/flowlet_test
        REDIS_URL: redis://localhost:6379/1
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: backend/test_results/coverage/combined_coverage.xml
        flags: backend
        name: backend-coverage

  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: unified-frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd unified-frontend
        npm ci
    
    - name: Run linting
      run: |
        cd unified-frontend
        npm run lint
    
    - name: Build application
      run: |
        cd unified-frontend
        npm run build
    
    - name: Run tests
      run: |
        cd unified-frontend
        npm test -- --coverage --watchAll=false
      env:
        CI: true

  build-and-deploy:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Login to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
    
    - name: Build and push backend image
      uses: docker/build-push-action@v5
      with:
        context: ./backend
        push: true
        tags: ghcr.io/${{ github.repository }}/backend:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Build and push frontend image
      uses: docker/build-push-action@v5
      with:
        context: ./unified-frontend
        push: true
        tags: ghcr.io/${{ github.repository }}/frontend:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
EOF
    
    echo -e "${GREEN}✓ CI/CD configuration created${NC}"
}

# Function to create development documentation
create_dev_docs() {
    echo -e "${BLUE}Creating development documentation...${NC}"
    
    cat > DEVELOPMENT.md << 'EOF'
# Flowlet Development Guide

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ (optional, SQLite used by default)
- Redis 7+ (optional)

### Setup Development Environment

1. **Clone and setup:**
   ```bash
   git clone <repository-url>
   cd flowlet
   ./setup-dev.sh
   ```

2. **Start development servers:**
   ```bash
   ./dev-start.sh
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/v1/info

## Development Workflow

### Backend Development

1. **Activate virtual environment:**
   ```bash
   cd backend
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements_updated.txt
   ```

3. **Run development server:**
   ```bash
   ./dev.sh
   ```

4. **Run tests:**
   ```bash
   ./run_tests.sh
   ```

### Frontend Development

1. **Install dependencies:**
   ```bash
   cd unified-frontend
   pnpm install  # or npm install
   ```

2. **Run development server:**
   ```bash
   ./dev.sh
   ```

3. **Build for production:**
   ```bash
   pnpm run build
   ```

## Testing

### Backend Testing
```bash
cd backend
./run_tests.sh
```

### Frontend Testing
```bash
cd unified-frontend
npm test
```

### End-to-End Testing
```bash
# Start both servers first
./dev-start.sh

# In another terminal
npm run test:e2e
```

## Docker Development

### Start with Docker Compose
```bash
docker-compose -f docker-compose.dev.yml up
```

### Build production images
```bash
docker-compose build
```

## Code Quality

### Backend
- **Linting:** `flake8 src/`
- **Formatting:** `black src/`
- **Security:** `bandit -r src/`
- **Type checking:** `mypy src/`

### Frontend
- **Linting:** `npm run lint`
- **Formatting:** `npm run format`
- **Type checking:** `npm run type-check`

## Database Management

### Migrations
```bash
cd backend
python -c "from src.models.database import db; db.create_all()"
```

### Reset database
```bash
rm backend/data/flowlet_dev.db
python -c "from src.models.database import db; db.create_all()"
```

## Environment Configuration

### Backend (.env)
```env
FLASK_ENV=development
DATABASE_URL=sqlite:///data/flowlet_dev.db
SECRET_KEY=your-secret-key
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_APP_NAME=Flowlet
```

## Debugging

### Backend Debugging
- Use Flask's built-in debugger
- Set breakpoints with `import pdb; pdb.set_trace()`
- Check logs in `backend/logs/`

### Frontend Debugging
- Use browser developer tools
- React Developer Tools extension
- Check console for errors

## Performance Monitoring

### Backend
- Monitor with `/health` endpoint
- Check performance tests: `pytest tests/test_performance.py`

### Frontend
- Use Lighthouse for performance audits
- Monitor bundle size with `npm run analyze`

## Deployment

### Staging
```bash
docker-compose -f docker-compose.staging.yml up
```

### Production
```bash
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   lsof -ti:5000 | xargs kill -9  # Kill process on port 5000
   ```

2. **Database connection issues:**
   - Check PostgreSQL is running
   - Verify connection string in .env

3. **Frontend build issues:**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Clear cache: `npm run clean`

### Getting Help
- Check the logs in `backend/logs/`
- Review test results in `backend/test_results/`
- Open an issue on GitHub
EOF
    
    echo -e "${GREEN}✓ Development documentation created${NC}"
}

# Main execution
echo -e "${BLUE}Checking system requirements...${NC}"

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
    echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}"
else
    echo -e "${RED}✗ Python 3 not found. Please install Python 3.11+${NC}"
    exit 1
fi

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js $NODE_VERSION found${NC}"
else
    echo -e "${RED}✗ Node.js not found. Please install Node.js 20+${NC}"
    exit 1
fi

# Check Git
if command_exists git; then
    echo -e "${GREEN}✓ Git found${NC}"
else
    echo -e "${RED}✗ Git not found. Please install Git${NC}"
    exit 1
fi

# Setup development environment
setup_env_files
install_python_deps
install_node_deps
setup_database
create_dev_scripts
create_docker_config
create_cicd_config
create_dev_docs

echo -e "${GREEN}=========================================="
echo -e "Development environment setup complete!"
echo -e "=========================================="
echo -e "🚀 To start development:"
echo -e "   ./dev-start.sh"
echo -e ""
echo -e "📚 Read the development guide:"
echo -e "   cat DEVELOPMENT.md"
echo -e ""
echo -e "🧪 Run tests:"
echo -e "   cd backend && ./run_tests.sh"
echo -e ""
echo -e "🐳 Use Docker:"
echo -e "   docker-compose -f docker-compose.dev.yml up"
echo -e "==========================================${NC}"


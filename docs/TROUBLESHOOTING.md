# Troubleshooting Guide

Common issues and solutions for Flowlet setup, development, and operations.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Database Issues](#database-issues)
- [API and Backend Issues](#api-and-backend-issues)
- [Frontend Issues](#frontend-issues)
- [Docker and Deployment Issues](#docker-and-deployment-issues)
- [Security and Authentication Issues](#security-and-authentication-issues)

## Installation Issues

### Python Module Not Found

**Problem**: `ModuleNotFoundError: No module named 'src'`

**Solution**:

```bash
# Ensure you're in the backend directory
cd backend

# Activate virtual environment
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# Set PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Reinstall dependencies
pip install -r requirements.txt
```

### pip Installation Fails

**Problem**: Package installation errors with pip

**Solution**:

```bash
# Upgrade pip
pip install --upgrade pip

# Clear pip cache
pip cache purge

# Install with no cache
pip install --no-cache-dir -r requirements.txt

# If specific package fails, install dependencies first
pip install wheel setuptools
```

### npm Install Fails

**Problem**: `npm install` errors or permission issues

**Solution**:

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If permission errors (don't use sudo)
# Fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors
```

## Database Issues

### Database Connection Refused

**Problem**: `FATAL: database "flowlet" does not exist` or connection refused

**Solution**:

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # Mac

# Start PostgreSQL if not running
sudo systemctl start postgresql  # Linux
brew services start postgresql  # Mac

# Create database
sudo -u postgres psql
CREATE DATABASE flowlet;
CREATE USER flowlet_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE flowlet TO flowlet_user;
\q

# Update DATABASE_URL in .env
DATABASE_URL=postgresql://flowlet_user:password@localhost:5432/flowlet
```

### Migration Errors

**Problem**: `alembic.util.exc.CommandError: Target database is not up to date`

**Solution**:

```bash
cd backend

# Check migration status
flask db current

# Upgrade to latest
flask db upgrade

# If migrations are out of sync
flask db stamp head
flask db migrate -m "Sync migrations"
flask db upgrade

# Nuclear option: reset database (WARNING: deletes all data)
flask db downgrade base
flask db upgrade
```

### SQLite Database Locked

**Problem**: `database is locked` error with SQLite

**Solution**:

```bash
# Close all connections to database
# Stop backend server
pkill -f "python.*app.py"

# Remove lock file
rm backend/database/app.db-journal

# Restart server
python backend/run_server.py
```

## API and Backend Issues

### Flask Server Won't Start

**Problem**: Port already in use or server crashes

**Solution**:

```bash
# Check what's using port 5000
lsof -i :5000  # Linux/Mac
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>  # Linux/Mac
taskkill /PID <PID> /F  # Windows

# Start on different port
export PORT=8000
python run_server.py
```

### Import Errors in Backend

**Problem**: Circular import or missing imports

**Solution**:

```bash
# Check Python path
cd backend
python -c "import sys; print('\n'.join(sys.path))"

# Set PYTHONPATH explicitly
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# Restructure imports to avoid circular dependencies
# Use absolute imports: from src.models import User
# Not relative: from ..models import User
```

### JWT Token Errors

**Problem**: `Invalid token` or `Token has expired`

**Solution**:

```bash
# Check JWT_SECRET_KEY is set
grep JWT_SECRET_KEY backend/.env

# Generate new secret if needed
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Update .env
JWT_SECRET_KEY=newly-generated-secret

# Clear old tokens and login again
```

### Rate Limit Exceeded

**Problem**: `429 Too Many Requests`

**Solution**:

```bash
# Clear Redis cache
redis-cli FLUSHALL

# Or increase rate limits in backend/.env
RATELIMIT_DEFAULT=1000 per hour

# For development, disable rate limiting
# In backend/src/config/settings.py
# Comment out rate limiter initialization
```

## Frontend Issues

### React App Won't Start

**Problem**: `Error: ENOSPC: System limit for number of file watchers reached`

**Solution**:

```bash
# Increase file watcher limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Or use polling
CHOKIDAR_USEPOLLING=true npm start
```

### CORS Errors

**Problem**: `Access to fetch blocked by CORS policy`

**Solution**:

```bash
# Check CORS_ORIGINS in backend/.env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Ensure frontend URL is included
# Restart backend after changes

# For development, allow all origins (NOT for production)
CORS_ORIGINS=*
```

### API Calls Fail with 401

**Problem**: Unauthorized errors despite being logged in

**Solution**:

```javascript
// Check token is being sent in headers
const response = await fetch("/api/v1/accounts", {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

// Verify token in localStorage
console.log(localStorage.getItem("access_token"));

// Check token hasn't expired
// Token lifetime is JWT_ACCESS_TOKEN_EXPIRES (default 3600s = 1 hour)
// Implement token refresh logic
```

### Build Failures

**Problem**: `npm run build` fails

**Solution**:

```bash
# Clean build cache
rm -rf node_modules/.cache
rm -rf dist

# Rebuild
npm run build

# Check for TypeScript errors
npm run type-check

# If memory issues
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

## Docker and Deployment Issues

### Docker Container Won't Start

**Problem**: Container exits immediately or health check fails

**Solution**:

```bash
# Check logs
docker-compose logs backend
docker-compose logs postgres

# Inspect container
docker-compose ps
docker inspect flowlet_backend

# Remove and rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### Database Container Issues

**Problem**: PostgreSQL container fails to start

**Solution**:

```bash
# Check volume permissions
ls -la $(pwd)/data/postgres

# Fix permissions
sudo chown -R 999:999 data/postgres

# Remove volume and recreate
docker-compose down -v
docker volume rm flowlet_postgres_data
docker-compose up postgres
```

### Network Issues Between Containers

**Problem**: Backend can't connect to database

**Solution**:

```bash
# Check network
docker network ls
docker network inspect flowlet_default

# Verify service names in docker-compose.yml
# Use service name as hostname: DATABASE_URL=postgresql://user:pass@postgres:5432/db

# Test connection from backend container
docker-compose exec backend ping postgres
```

## Security and Authentication Issues

### Password Reset Not Working

**Problem**: Password reset email not sent

**Solution**:

```bash
# Check email configuration in .env
EMAIL_ENABLED=true
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

# For Gmail, use App Password not account password
# Generate at: https://myaccount.google.com/apppasswords

# Check logs for email errors
docker-compose logs backend | grep -i mail
```

### 2FA Not Working

**Problem**: TOTP codes not accepted

**Solution**:

```bash
# Ensure server time is correct (TOTP is time-based)
date

# Sync time (Linux)
sudo ntpdate -s time.nist.gov

# Check QR code was scanned correctly
# Regenerate 2FA secret
POST /api/v1/auth/2fa/regenerate

# Verify code format (6 digits)
# Allow for time drift (±30 seconds)
```

### SSL/TLS Errors

**Problem**: Certificate verification failed

**Solution**:

```bash
# Development: Use HTTP not HTTPS
API_URL=http://localhost:5000

# Production: Check certificate
openssl s_client -connect api.flowlet.com:443

# Use valid certificate from Let's Encrypt
sudo certbot --nginx -d api.flowlet.com

# Or disable SSL verification (development only)
# curl -k https://localhost:5000
```

## Performance Issues

### Slow API Response Times

**Problem**: API endpoints taking too long

**Solution**:

```bash
# Enable query logging
# In backend/src/config/settings.py
SQLALCHEMY_ECHO = True

# Check slow queries
# Add indexes to frequently queried columns
# In backend/src/models/transaction.py:
#   Index('idx_transaction_created', 'created_at')

# Enable Redis caching
REDIS_URL=redis://localhost:6379/0

# Profile code
python -m cProfile -o profile.stats run_server.py
```

### High Memory Usage

**Problem**: Application consuming too much memory

**Solution**:

```bash
# Reduce connection pool size
# In backend/.env
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20

# Enable garbage collection
# Add to backend/app.py
import gc
gc.enable()

# Limit worker processes
gunicorn -w 2 app:create_app()
```

## Common Error Messages

| Error                                           | Cause                      | Solution                              |
| ----------------------------------------------- | -------------------------- | ------------------------------------- |
| `relation "users" does not exist`               | Database not initialized   | Run `flask db upgrade`                |
| `ModuleNotFoundError: No module named 'flask'`  | Dependencies not installed | Run `pip install -r requirements.txt` |
| `EADDRINUSE: address already in use`            | Port already taken         | Kill process or use different port    |
| `password authentication failed`                | Wrong database credentials | Check DATABASE_URL in .env            |
| `CORS policy: No 'Access-Control-Allow-Origin'` | CORS not configured        | Add frontend URL to CORS_ORIGINS      |
| `Token has expired`                             | JWT token expired          | Refresh token or login again          |
| `Insufficient funds`                            | Wallet balance too low     | Deposit funds first                   |
| `KYC verification required`                     | User not verified          | Complete KYC process                  |

## Getting More Help

If your issue isn't covered here:

1. **Check Logs**:

   ```bash
   # Backend logs
   docker-compose logs -f backend
   tail -f backend/logs/app.log

   # Frontend logs
   npm run dev  # Check console output
   ```

2. **Search GitHub Issues**: [https://github.com/abrar2030/Flowlet/issues](https://github.com/abrar2030/Flowlet/issues)

3. **Create New Issue**: Include:
   - Error message
   - Steps to reproduce
   - Environment (OS, Python version, Node version)
   - Relevant logs

4. **Check Documentation**:
   - [Installation Guide](INSTALLATION.md)
   - [Configuration Guide](CONFIGURATION.md)
   - [API Reference](API.md)

## Preventive Measures

### Regular Maintenance

```bash
# Update dependencies monthly
cd backend && pip list --outdated
cd web-frontend && npm outdated

# Backup database weekly
pg_dump flowlet > backup_$(date +%Y%m%d).sql

# Monitor disk space
df -h

# Check logs for errors
grep -i error backend/logs/app.log
```

### Development Best Practices

- Use virtual environments for Python
- Don't commit .env files
- Run tests before committing
- Keep dependencies updated
- Monitor application metrics

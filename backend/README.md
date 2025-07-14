# Flowlet Financial Backend

A secure, scalable, and compliant backend API for financial services, built with Flask and designed to meet banking industry standards.

## 🏦 Financial Industry Compliance

This backend is designed to meet strict financial industry requirements:

- **Security**: Bank-level security with JWT authentication, password policies, and audit logging
- **Compliance**: PCI DSS, SOX, and GDPR compliance features built-in
- **Audit Trail**: Comprehensive logging of all financial operations
- **Data Protection**: Encryption at rest and in transit, secure data handling
- **Performance**: Optimized for high-throughput financial transactions
- **Reliability**: Robust error handling and transaction management

## 🚀 Features

### Core API Features
- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Secure user registration, login, and profile management
- **Account Management**: Multiple account types (checking, savings, credit, investment)
- **Transaction Processing**: Secure money transfers with fraud detection
- **Card Management**: Virtual and physical card controls with PCI DSS compliance
- **Compliance Tools**: KYC/AML verification, audit logging, regulatory reporting

### Technical Features
- **Flask Application Factory**: Modular, testable application structure
- **SQLAlchemy ORM**: Type-safe database operations with migrations
- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **Structured Logging**: Comprehensive audit trails and monitoring
- **Input Validation**: Marshmallow schemas for robust data validation
- **Error Handling**: Secure error responses that don't leak sensitive data

## 📦 Installation

### Prerequisites
- Python 3.9+
- PostgreSQL 12+ (or SQLite for development)
- Redis 6+ (for caching and rate limiting)

### Setup

```bash
# Clone the repository
git clone https://github.com/abrar2030/Flowlet.git
cd Flowlet/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
flask init-db

# Create admin user (optional)
flask create-admin

# Run the application
python main.py
```

## 🔧 Configuration

### Environment Variables

```bash
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here

# Database
DATABASE_URL=postgresql://user:password@localhost/flowlet
REDIS_URL=redis://localhost:6379

# Security
CORS_ORIGINS=http://localhost:3000,https://app.flowlet.com

# Email (for notifications)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### Configuration Classes

- **DevelopmentConfig**: For local development with debug mode
- **TestingConfig**: For running tests with in-memory database
- **ProductionConfig**: For production with improved security settings

## 🏗️ Architecture

### Directory Structure

```
backend/
├── app/                    # Application package
│   ├── __init__.py        # Application factory
│   ├── config.py          # Configuration classes
│   ├── api/               # API blueprints
│   │   ├── auth.py        # Authentication endpoints
│   │   ├── accounts.py    # Account management
│   │   ├── transactions.py # Transaction processing
│   │   └── ...
│   ├── models/            # Database models
│   │   ├── user.py        # User model
│   │   ├── account.py     # Account model
│   │   └── ...
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── schemas/           # Validation schemas
├── tests/                 # Test suite
├── migrations/            # Database migrations
├── requirements.txt       # Python dependencies
└── main.py               # Application entry point
```

### Application Factory Pattern

The application uses the Flask application factory pattern for better testability and configuration management:

```python
from app import create_app

app = create_app('production')
```

## 🔐 Security Features

### Authentication
- JWT-based authentication with access and refresh tokens
- Password strength validation and hashing with PBKDF2
- Account lockout after failed login attempts
- Session management with configurable timeouts

### Authorization
- Role-based access control (RBAC)
- Permission-based resource access
- API endpoint protection with decorators

### Data Protection
- Sensitive data encryption at rest
- Secure password storage with salt
- PII data masking in API responses
- Audit logging for all sensitive operations

### API Security
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration for frontend integration
- Security headers for protection against common attacks

## 📊 API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/register
Register a new user account.

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "terms_accepted": true,
  "privacy_accepted": true
}
```

#### POST /api/v1/auth/login
Authenticate user and receive tokens.

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

#### POST /api/v1/auth/refresh
Refresh access token using refresh token.

#### POST /api/v1/auth/logout
Logout user and invalidate tokens.

### Account Endpoints

#### GET /api/v1/accounts
Get user's accounts (requires authentication).

#### POST /api/v1/accounts
Create a new account.

### Transaction Endpoints

#### GET /api/v1/transactions
Get transaction history with filtering.

#### POST /api/v1/transactions/transfer
Transfer money between accounts.

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth.py

# Run security tests
pytest tests/security/
```

### Test Categories
- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **Security Tests**: Authentication and authorization testing
- **Performance Tests**: Load and stress testing

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**
   ```bash
   export FLASK_ENV=production
   export SECRET_KEY=your-production-secret
   export DATABASE_URL=your-production-db-url
   ```

2. **Database Migration**
   ```bash
   flask db upgrade
   ```

3. **Run with Gunicorn**
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 main:app
   ```

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "main:app"]
```

## 📈 Monitoring

### Health Checks
- `/health` - Basic health check
- `/health/detailed` - Detailed system status
- `/metrics` - Prometheus metrics (if enabled)

### Logging
- Structured logging with JSON format
- Audit trail for all financial operations
- Security event logging
- Performance metrics

## 🔄 Development

### Code Quality
```bash
# Format code
black app/ tests/

# Lint code
flake8 app/ tests/

# Type checking
mypy app/

# Security scan
bandit -r app/
```

### Database Migrations
```bash
# Create migration
flask db migrate -m "Description of changes"

# Apply migration
flask db upgrade

# Downgrade migration
flask db downgrade
```

## 📚 API Reference

Full API documentation is available at `/docs` when running the application with Swagger/OpenAPI integration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run the test suite
5. Submit a pull request

### Code Standards
- Follow PEP 8 style guidelines
- Write comprehensive tests for new features
- Document all public APIs
- Use type hints where appropriate

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review existing issues and discussions

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.


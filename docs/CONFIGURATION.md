# Configuration Guide

Complete reference for configuring Flowlet through environment variables, configuration files, and feature flags.

## Table of Contents

- [Configuration Sources](#configuration-sources)
- [Environment Variables](#environment-variables)
- [Configuration Files](#configuration-files)
- [Feature Flags](#feature-flags)
- [Security Settings](#security-settings)
- [Integration Configuration](#integration-configuration)

## Configuration Sources

Flowlet loads configuration from multiple sources in this order (later sources override earlier):

1. Default values in `backend/src/config/settings.py`
2. Environment variables from `backend/.env` file
3. System environment variables
4. Runtime configuration overrides

## Environment Variables

### Core Settings

| Option         | Type    | Default    | Description                   | Where to set (env/file) |
| -------------- | ------- | ---------- | ----------------------------- | ----------------------- |
| `SECRET_KEY`   | string  | None       | Flask secret key for sessions | .env file (required)    |
| `FLASK_ENV`    | string  | production | Environment mode              | .env file or system env |
| `FLASK_CONFIG` | string  | default    | Configuration profile         | .env file               |
| `DEBUG`        | boolean | false      | Enable debug mode             | .env file               |
| `PORT`         | integer | 5000       | Backend server port           | .env file or system env |

**Example**:

```bash
# .env file
SECRET_KEY=your-randomly-generated-secret-key-change-me
FLASK_ENV=development
FLASK_CONFIG=development
DEBUG=true
PORT=5000
```

### Database Configuration

| Option            | Type    | Default                     | Description                       | Where to set (env/file) |
| ----------------- | ------- | --------------------------- | --------------------------------- | ----------------------- |
| `DATABASE_URL`    | string  | sqlite:///./database/app.db | Full database connection string   | .env file (required)    |
| `DB_POOL_SIZE`    | integer | 20                          | Connection pool size              | .env file               |
| `DB_MAX_OVERFLOW` | integer | 30                          | Maximum overflow connections      | .env file               |
| `DB_POOL_TIMEOUT` | integer | 30                          | Connection timeout (seconds)      | .env file               |
| `DB_POOL_RECYCLE` | integer | 3600                        | Connection recycle time (seconds) | .env file               |

**PostgreSQL Example**:

```bash
DATABASE_URL=postgresql://username:password@localhost:5432/flowlet_db
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=30
```

**SQLite Example (Development)**:

```bash
DATABASE_URL=sqlite:///./database/app.db
```

### Redis Configuration

| Option                  | Type    | Default                  | Description               | Where to set (env/file) |
| ----------------------- | ------- | ------------------------ | ------------------------- | ----------------------- |
| `REDIS_URL`             | string  | redis://localhost:6379/0 | Redis connection URL      | .env file               |
| `REDIS_MAX_CONNECTIONS` | integer | 50                       | Maximum Redis connections | .env file               |

**Example**:

```bash
REDIS_URL=redis://localhost:6379/0
# With password:
REDIS_URL=redis://:password@localhost:6379/0
```

### JWT Authentication

| Option                      | Type    | Default | Description                      | Where to set (env/file) |
| --------------------------- | ------- | ------- | -------------------------------- | ----------------------- |
| `JWT_SECRET_KEY`            | string  | None    | Secret key for JWT signing       | .env file (required)    |
| `JWT_ACCESS_TOKEN_EXPIRES`  | integer | 3600    | Access token lifetime (seconds)  | .env file               |
| `JWT_REFRESH_TOKEN_EXPIRES` | integer | 86400   | Refresh token lifetime (seconds) | .env file               |
| `JWT_ALGORITHM`             | string  | HS256   | JWT signing algorithm            | .env file               |

**Example**:

```bash
JWT_SECRET_KEY=your-jwt-secret-key-different-from-secret-key
JWT_ACCESS_TOKEN_EXPIRES=3600  # 1 hour
JWT_REFRESH_TOKEN_EXPIRES=86400  # 24 hours
JWT_ALGORITHM=HS256
```

**Generate secure keys**:

```bash
# SECRET_KEY
python -c "import secrets; print(secrets.token_hex(32))"

# JWT_SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### CORS Settings

| Option         | Type   | Default                                     | Description                            | Where to set (env/file) |
| -------------- | ------ | ------------------------------------------- | -------------------------------------- | ----------------------- |
| `CORS_ORIGINS` | string | http://localhost:3000,http://localhost:5000 | Allowed CORS origins (comma-separated) | .env file               |

**Example**:

```bash
# Development
CORS_ORIGINS=http://localhost:3000,http://localhost:5000

# Production
CORS_ORIGINS=https://app.flowlet.com,https://api.flowlet.com
```

### Email Configuration

| Option               | Type    | Default             | Description                | Where to set (env/file) |
| -------------------- | ------- | ------------------- | -------------------------- | ----------------------- |
| `EMAIL_ENABLED`      | boolean | false               | Enable email functionality | .env file               |
| `MAIL_SERVER`        | string  | smtp.gmail.com      | SMTP server hostname       | .env file               |
| `MAIL_PORT`          | integer | 587                 | SMTP server port           | .env file               |
| `MAIL_USE_TLS`       | boolean | true                | Use TLS encryption         | .env file               |
| `MAIL_USERNAME`      | string  | None                | SMTP username              | .env file               |
| `MAIL_PASSWORD`      | string  | None                | SMTP password              | .env file               |
| `DEFAULT_FROM_EMAIL` | string  | noreply@flowlet.com | Default sender address     | .env file               |

**Example**:

```bash
EMAIL_ENABLED=true
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@flowlet.com
```

### SMS Configuration

| Option               | Type    | Default      | Description                    | Where to set (env/file) |
| -------------------- | ------- | ------------ | ------------------------------ | ----------------------- |
| `SMS_ENABLED`        | boolean | false        | Enable SMS functionality       | .env file               |
| `SMS_PROVIDER`       | string  | console      | SMS provider (console, twilio) | .env file               |
| `SMS_FROM_NUMBER`    | string  | +10000000000 | Sender phone number            | .env file               |
| `TWILIO_ACCOUNT_SID` | string  | None         | Twilio account SID             | .env file               |
| `TWILIO_AUTH_TOKEN`  | string  | None         | Twilio auth token              | .env file               |

**Example**:

```bash
SMS_ENABLED=true
SMS_PROVIDER=twilio
SMS_FROM_NUMBER=+11234567890
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
```

### Security & Encryption

| Option                           | Type    | Default        | Description                | Where to set (env/file) |
| -------------------------------- | ------- | -------------- | -------------------------- | ----------------------- |
| `ENCRYPTION_KEY`                 | string  | auto-generated | Fernet encryption key      | .env file               |
| `PASSWORD_MIN_LENGTH`            | integer | 8              | Minimum password length    | .env file               |
| `PASSWORD_REQUIRE_UPPERCASE`     | boolean | true           | Require uppercase letters  | .env file               |
| `PASSWORD_REQUIRE_LOWERCASE`     | boolean | true           | Require lowercase letters  | .env file               |
| `PASSWORD_REQUIRE_NUMBERS`       | boolean | true           | Require numbers            | .env file               |
| `PASSWORD_REQUIRE_SPECIAL_CHARS` | boolean | true           | Require special characters | .env file               |
| `SESSION_TIMEOUT_MINUTES`        | integer | 30             | Session timeout duration   | .env file               |
| `MAX_CONTENT_LENGTH`             | integer | 16777216       | Max request size (bytes)   | .env file               |

**Example**:

```bash
# Generate encryption key:
# python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
ENCRYPTION_KEY=your-fernet-encryption-key

PASSWORD_MIN_LENGTH=10
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL_CHARS=true
SESSION_TIMEOUT_MINUTES=30
MAX_CONTENT_LENGTH=16777216
```

## Feature Flags

Enable or disable specific features at runtime.

### Financial Services Features

| Option                        | Type    | Default | Description                     | Where to set (env/file) |
| ----------------------------- | ------- | ------- | ------------------------------- | ----------------------- |
| `FRAUD_DETECTION_ENABLED`     | boolean | true    | Enable AI fraud detection       | .env file               |
| `KYC_VERIFICATION_REQUIRED`   | boolean | true    | Require KYC for operations      | .env file               |
| `AML_MONITORING_ENABLED`      | boolean | true    | Enable AML monitoring           | .env file               |
| `SANCTIONS_SCREENING_ENABLED` | boolean | true    | Enable sanctions list screening | .env file               |
| `SANCTIONS_MOCK_MODE`         | boolean | true    | Use mock sanctions data         | .env file               |

**Example**:

```bash
FRAUD_DETECTION_ENABLED=true
KYC_VERIFICATION_REQUIRED=true
AML_MONITORING_ENABLED=true
SANCTIONS_SCREENING_ENABLED=true
SANCTIONS_MOCK_MODE=false  # Use real screening in production
```

### Payment Processing Features

| Option             | Type    | Default | Description             | Where to set (env/file) |
| ------------------ | ------- | ------- | ----------------------- | ----------------------- |
| `ACH_ENABLED`      | boolean | true    | Enable ACH transfers    | .env file               |
| `ACH_MOCK_MODE`    | boolean | true    | Use mock ACH processing | .env file               |
| `ACH_COMPANY_NAME` | string  | Flowlet | ACH company name        | .env file               |
| `ACH_COMPANY_ID`   | string  | None    | ACH company ID          | .env file               |

**Example**:

```bash
ACH_ENABLED=true
ACH_MOCK_MODE=false
ACH_COMPANY_NAME=My Company Inc
ACH_COMPANY_ID=1234567890
```

### Transaction Limits

| Option                          | Type    | Default  | Description                   | Where to set (env/file) |
| ------------------------------- | ------- | -------- | ----------------------------- | ----------------------- |
| `MAX_DAILY_TRANSACTION_AMOUNT`  | decimal | 50000.0  | Max daily transaction amount  | .env file               |
| `MAX_SINGLE_TRANSACTION_AMOUNT` | decimal | 10000.0  | Max single transaction amount | .env file               |
| `SUSPICIOUS_ACTIVITY_THRESHOLD` | integer | 5        | Suspicious transaction count  | .env file               |
| `DEFAULT_DAILY_LIMIT`           | decimal | 5000.0   | Default card daily limit      | .env file               |
| `DEFAULT_MONTHLY_LIMIT`         | decimal | 50000.0  | Default card monthly limit    | .env file               |
| `DEFAULT_YEARLY_LIMIT`          | decimal | 500000.0 | Default card yearly limit     | .env file               |

**Example**:

```bash
MAX_DAILY_TRANSACTION_AMOUNT=50000.00
MAX_SINGLE_TRANSACTION_AMOUNT=10000.00
SUSPICIOUS_ACTIVITY_THRESHOLD=5
DEFAULT_DAILY_LIMIT=5000.00
DEFAULT_MONTHLY_LIMIT=50000.00
```

### Monitoring & Metrics

| Option                     | Type    | Default | Description                   | Where to set (env/file) |
| -------------------------- | ------- | ------- | ----------------------------- | ----------------------- |
| `ERROR_TRACKING_ENABLED`   | boolean | true    | Enable error tracking         | .env file               |
| `METRICS_ENABLED`          | boolean | true    | Enable Prometheus metrics     | .env file               |
| `ENABLE_HEALTH_CHECKS`     | boolean | true    | Enable health check endpoints | .env file               |
| `AUDIT_LOG_RETENTION_DAYS` | integer | 365     | Audit log retention period    | .env file               |

**Example**:

```bash
ERROR_TRACKING_ENABLED=true
METRICS_ENABLED=true
ENABLE_HEALTH_CHECKS=true
AUDIT_LOG_RETENTION_DAYS=365
```

## Integration Configuration

### Payment Gateway (Stripe)

| Option                   | Type   | Default | Description                   | Where to set (env/file)         |
| ------------------------ | ------ | ------- | ----------------------------- | ------------------------------- |
| `STRIPE_SECRET_KEY`      | string | None    | Stripe secret API key         | .env file (required for Stripe) |
| `STRIPE_PUBLISHABLE_KEY` | string | None    | Stripe publishable key        | .env file                       |
| `STRIPE_WEBHOOK_SECRET`  | string | None    | Stripe webhook signing secret | .env file                       |

**Example**:

```bash
# Test keys
STRIPE_SECRET_KEY=sk_test_your_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Production keys
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
```

### Banking Integration (Plaid)

| Option            | Type   | Default | Description       | Where to set (env/file) |
| ----------------- | ------ | ------- | ----------------- | ----------------------- |
| `PLAID_CLIENT_ID` | string | None    | Plaid client ID   | .env file               |
| `PLAID_SECRET`    | string | None    | Plaid secret key  | .env file               |
| `PLAID_ENV`       | string | sandbox | Plaid environment | .env file               |

**Example**:

```bash
PLAID_CLIENT_ID=your-plaid-client-id
PLAID_SECRET=your-plaid-secret
PLAID_ENV=sandbox  # Options: sandbox, development, production
```

### AI Services (OpenAI)

| Option           | Type   | Default | Description          | Where to set (env/file) |
| ---------------- | ------ | ------- | -------------------- | ----------------------- |
| `OPENAI_API_KEY` | string | None    | OpenAI API key       | .env file               |
| `OPENAI_MODEL`   | string | gpt-4   | Default model to use | .env file               |

**Example**:

```bash
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4
```

## Configuration Files

### Backend Configuration

Located at `backend/src/config/settings.py`

Contains configuration classes:

- `Config` - Base configuration
- `DevelopmentConfig` - Development settings
- `ProductionConfig` - Production settings
- `TestingConfig` - Testing settings

Select configuration with `FLASK_CONFIG` environment variable:

```bash
FLASK_CONFIG=development  # Uses DevelopmentConfig
FLASK_CONFIG=production   # Uses ProductionConfig
FLASK_CONFIG=testing      # Uses TestingConfig
```

### Frontend Configuration

Located at `web-frontend/.env`

| Option             | Type   | Default               | Description      | Where to set |
| ------------------ | ------ | --------------------- | ---------------- | ------------ |
| `VITE_API_URL`     | string | http://localhost:5000 | Backend API URL  | .env file    |
| `VITE_APP_NAME`    | string | Flowlet               | Application name | .env file    |
| `VITE_ENVIRONMENT` | string | development           | Environment      | .env file    |

**Example**:

```bash
# web-frontend/.env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Flowlet
VITE_ENVIRONMENT=development
```

## Multi-Currency Configuration

| Option                   | Type   | Default                 | Description              | Where to set (env/file) |
| ------------------------ | ------ | ----------------------- | ------------------------ | ----------------------- |
| `SUPPORTED_CURRENCIES`   | list   | USD,EUR,GBP,JPY,CAD,AUD | Supported currency codes | settings.py             |
| `DEFAULT_CURRENCY`       | string | USD                     | Default currency         | .env file               |
| `EXCHANGE_RATE_PROVIDER` | string | openexchangerates       | Exchange rate API        | .env file               |
| `EXCHANGE_RATE_API_KEY`  | string | None                    | Exchange rate API key    | .env file               |

## Docker Configuration

Configuration in `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - FLASK_ENV=development
      - DATABASE_URL=postgresql://flowlet:password@postgres:5432/flowlet
      - REDIS_URL=redis://redis:6379/0
```

Override with `docker-compose.override.yml` (not committed to git):

```yaml
services:
  backend:
    environment:
      - STRIPE_SECRET_KEY=sk_test_your_key
      - OPENAI_API_KEY=sk-your-key
```

## Environment-Specific Configurations

### Development

```bash
# backend/.env.development
FLASK_ENV=development
DEBUG=true
DATABASE_URL=sqlite:///./database/app_dev.db
LOG_LEVEL=DEBUG
FRAUD_DETECTION_ENABLED=true
KYC_VERIFICATION_REQUIRED=false  # Relaxed for testing
```

### Production

```bash
# backend/.env.production
FLASK_ENV=production
DEBUG=false
DATABASE_URL=postgresql://user:password@db-host:5432/flowlet_prod
LOG_LEVEL=INFO
FRAUD_DETECTION_ENABLED=true
KYC_VERIFICATION_REQUIRED=true
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=strict
```

### Testing

```bash
# backend/.env.testing
FLASK_ENV=testing
DATABASE_URL=sqlite:///:memory:
REDIS_URL=redis://localhost:6379/1
TESTING=true
```

## Configuration Validation

Flowlet validates critical configuration on startup. Missing required variables will cause startup to fail with clear error messages.

### Required Variables for Production

- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `DATABASE_URL` (PostgreSQL recommended)
- `REDIS_URL`

### Generate Configuration

Use the provided script to generate a complete `.env` file:

```bash
cd backend
python scripts/generate_config.py > .env
```

## Best Practices

1. **Never commit `.env` files** to version control
2. **Use different keys** for `SECRET_KEY` and `JWT_SECRET_KEY`
3. **Generate random secrets** using cryptographic methods
4. **Use PostgreSQL** in production (not SQLite)
5. **Enable all security features** in production
6. **Use environment-specific** configuration files
7. **Rotate secrets** regularly
8. **Use secret management** systems (AWS Secrets Manager, HashiCorp Vault) in production

## Troubleshooting Configuration

### Check Active Configuration

```python
from app import create_app
app = create_app()

with app.app_context():
    print(f"ENV: {app.config['FLASK_ENV']}")
    print(f"DATABASE: {app.config['SQLALCHEMY_DATABASE_URI']}")
    print(f"DEBUG: {app.config['DEBUG']}")
```

### Verify Environment Loading

```bash
cd backend
python -c "from src.config.settings import config; print(config['development'].DATABASE_URL)"
```

### Common Issues

- **Database connection fails**: Check `DATABASE_URL` format
- **CORS errors**: Verify `CORS_ORIGINS` includes frontend URL
- **JWT errors**: Ensure `JWT_SECRET_KEY` is set and matches
- **Import errors**: Verify `PYTHONPATH` includes backend directory

## Next Steps

- Review [FEATURE_MATRIX.md](FEATURE_MATRIX.md) for available features
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- See [INSTALLATION.md](INSTALLATION.md) for environment setup

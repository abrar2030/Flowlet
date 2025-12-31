# Usage Guide

This guide demonstrates typical usage patterns for Flowlet, including CLI operations, programmatic API usage, and common workflows.

## Table of Contents

- [Getting Started](#getting-started)
- [CLI Usage](#cli-usage)
- [Python Library Usage](#python-library-usage)
- [REST API Usage](#rest-api-usage)
- [Common Workflows](#common-workflows)

## Getting Started

After installation, start the Flowlet services:

```bash
# Using Docker (recommended)
make docker-dev

# OR manually
cd backend && python run_server.py &
cd web-frontend && npm run dev
```

## CLI Usage

Flowlet provides a `Makefile` with convenient commands for common operations.

### Development Commands

```bash
# Show all available commands
make help

# Setup development environment
make setup

# Start development servers
make dev

# Build production assets
make build
```

### Testing Commands

```bash
# Run all tests
make test

# Run backend tests only
cd backend && ./run_tests.sh

# Run frontend tests only
cd web-frontend && npm test

# Run with coverage
cd backend && pytest --cov=src tests/
```

### Database Commands

```bash
# Initialize database
make db-init

# Reset database (WARNING: deletes all data)
make db-reset

# Create migration
cd backend && flask db migrate -m "Description of changes"

# Apply migrations
cd backend && flask db upgrade
```

### Linting and Formatting

```bash
# Lint all code
make lint

# Format all code
make format

# Backend linting
cd backend && flake8 src/ --max-line-length=100

# Frontend linting
cd web-frontend && npm run lint
```

## Python Library Usage

### Initialize Flask Application

```python
from app import create_app
from src.models.database import db

# Create Flask application instance
app = create_app()

# Access within application context
with app.app_context():
    # Perform database operations
    db.create_all()
```

### Authentication Flow

```python
import requests

base_url = "http://localhost:5000/api/v1"

# Register new user
response = requests.post(f"{base_url}/auth/register", json={
    "email": "user@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
})
user_data = response.json()

# Login and get JWT token
response = requests.post(f"{base_url}/auth/login", json={
    "email": "user@example.com",
    "password": "SecurePass123!"
})
auth_data = response.json()
token = auth_data["access_token"]

# Use token for authenticated requests
headers = {"Authorization": f"Bearer {token}"}
```

### Wallet Operations

```python
# Create wallet
response = requests.post(
    f"{base_url}/accounts/wallets",
    headers=headers,
    json={
        "currency": "USD",
        "type": "personal"
    }
)
wallet = response.json()
wallet_id = wallet["id"]

# Get wallet balance
response = requests.get(
    f"{base_url}/accounts/wallets/{wallet_id}",
    headers=headers
)
balance_data = response.json()
print(f"Balance: {balance_data['balance']} {balance_data['currency']}")

# List all wallets
response = requests.get(
    f"{base_url}/accounts/wallets",
    headers=headers
)
wallets = response.json()
```

### Payment Processing

```python
# Create payment
response = requests.post(
    f"{base_url}/payments",
    headers=headers,
    json={
        "amount": 100.00,
        "currency": "USD",
        "source_wallet_id": wallet_id,
        "destination": "user2@example.com",
        "description": "Payment for services"
    }
)
payment = response.json()

# Check payment status
payment_id = payment["id"]
response = requests.get(
    f"{base_url}/payments/{payment_id}",
    headers=headers
)
status = response.json()
print(f"Payment status: {status['status']}")
```

### Card Management

```python
# Issue virtual card
response = requests.post(
    f"{base_url}/cards",
    headers=headers,
    json={
        "type": "virtual",
        "wallet_id": wallet_id,
        "daily_limit": 500.00,
        "monthly_limit": 5000.00
    }
)
card = response.json()

# Activate card
card_id = card["id"]
response = requests.post(
    f"{base_url}/cards/{card_id}/activate",
    headers=headers
)

# Set card limits
response = requests.patch(
    f"{base_url}/cards/{card_id}",
    headers=headers,
    json={
        "daily_limit": 1000.00,
        "monthly_limit": 10000.00
    }
)
```

### KYC Verification

```python
# Submit KYC information
response = requests.post(
    f"{base_url}/kyc/submit",
    headers=headers,
    json={
        "first_name": "John",
        "last_name": "Doe",
        "date_of_birth": "1990-01-01",
        "ssn": "123-45-6789",
        "address": {
            "street": "123 Main St",
            "city": "New York",
            "state": "NY",
            "postal_code": "10001",
            "country": "US"
        },
        "document_type": "passport",
        "document_number": "X12345678"
    }
)
kyc_request = response.json()

# Check KYC status
response = requests.get(
    f"{base_url}/kyc/status",
    headers=headers
)
kyc_status = response.json()
print(f"KYC Status: {kyc_status['status']}")
```

## REST API Usage

### Using cURL

```bash
# Register user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'

# Create wallet (with authentication)
curl -X POST http://localhost:5000/api/v1/accounts/wallets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "currency": "USD",
    "type": "personal"
  }'
```

## Common Workflows

### 1. Onboarding New User

Complete user onboarding with wallet creation and KYC:

```python
import requests

base_url = "http://localhost:5000/api/v1"

# Step 1: Register user
user_data = {
    "email": "newuser@example.com",
    "password": "SecurePass123!",
    "first_name": "Jane",
    "last_name": "Smith",
    "phone": "+1234567890"
}
response = requests.post(f"{base_url}/auth/register", json=user_data)
user = response.json()

# Step 2: Login to get token
login_response = requests.post(f"{base_url}/auth/login", json={
    "email": user_data["email"],
    "password": user_data["password"]
})
token = login_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Step 3: Create default wallet
wallet_response = requests.post(
    f"{base_url}/accounts/wallets",
    headers=headers,
    json={"currency": "USD", "type": "personal"}
)
wallet = wallet_response.json()

# Step 4: Submit KYC
kyc_response = requests.post(
    f"{base_url}/kyc/submit",
    headers=headers,
    json={
        "first_name": "Jane",
        "last_name": "Smith",
        "date_of_birth": "1995-05-15",
        "address": {
            "street": "456 Oak Ave",
            "city": "San Francisco",
            "state": "CA",
            "postal_code": "94102",
            "country": "US"
        }
    }
)

print("Onboarding complete!")
print(f"Wallet ID: {wallet['id']}")
print(f"KYC Status: {kyc_response.json()['status']}")
```

### 2. Making a Payment

```python
# Assuming authenticated with token in headers

# Create payment
payment_data = {
    "amount": 50.00,
    "currency": "USD",
    "source_wallet_id": "wallet_123",
    "destination": "recipient@example.com",
    "description": "Lunch payment"
}

response = requests.post(
    f"{base_url}/payments",
    headers=headers,
    json=payment_data
)
payment = response.json()

# Monitor payment status
import time
for i in range(10):
    status_response = requests.get(
        f"{base_url}/payments/{payment['id']}",
        headers=headers
    )
    status = status_response.json()['status']
    print(f"Payment status: {status}")

    if status in ['completed', 'failed']:
        break
    time.sleep(2)
```

### 3. Multi-Currency Transaction

```python
# Create USD wallet
usd_wallet = requests.post(
    f"{base_url}/accounts/wallets",
    headers=headers,
    json={"currency": "USD", "type": "personal"}
).json()

# Create EUR wallet
eur_wallet = requests.post(
    f"{base_url}/accounts/wallets",
    headers=headers,
    json={"currency": "EUR", "type": "personal"}
).json()

# Convert currency (USD to EUR)
conversion_response = requests.post(
    f"{base_url}/currency/convert",
    headers=headers,
    json={
        "from_currency": "USD",
        "to_currency": "EUR",
        "amount": 100.00,
        "source_wallet_id": usd_wallet['id'],
        "destination_wallet_id": eur_wallet['id']
    }
)
conversion = conversion_response.json()
print(f"Converted: ${conversion['source_amount']} USD → €{conversion['destination_amount']} EUR")
```

### 4. Fraud Detection Check

```python
# Submit transaction for fraud analysis
transaction_data = {
    "amount": 1000.00,
    "currency": "USD",
    "merchant": "Electronics Store",
    "location": "New York, NY",
    "card_present": False
}

fraud_check = requests.post(
    f"{base_url}/fraud/analyze",
    headers=headers,
    json=transaction_data
)
result = fraud_check.json()

print(f"Risk Score: {result['risk_score']}")
print(f"Decision: {result['decision']}")  # approve, decline, review
if result['flags']:
    print(f"Flags: {', '.join(result['flags'])}")
```

### 5. Generate Transaction Report

```python
# Get transactions for date range
from datetime import datetime, timedelta

end_date = datetime.now()
start_date = end_date - timedelta(days=30)

response = requests.get(
    f"{base_url}/ledger/transactions",
    headers=headers,
    params={
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "format": "json"
    }
)
transactions = response.json()

# Calculate summary
total_amount = sum(t['amount'] for t in transactions['items'])
print(f"Total transactions: {len(transactions['items'])}")
print(f"Total amount: ${total_amount:.2f}")
```

## Integration Examples

See [examples/](examples/) directory for complete, runnable examples:

- [Basic Wallet Operations](examples/basic-wallet-operations.md)
- [Payment Processing Flow](examples/payment-processing-flow.md)
- [KYC Verification Workflow](examples/kyc-verification-workflow.md)

## Next Steps

- Explore complete [API Reference](API.md)
- Review [Configuration Options](CONFIGURATION.md)
- Check [Troubleshooting Guide](TROUBLESHOOTING.md) for common issues

# API Reference

Comprehensive REST API documentation for Flowlet's embedded finance platform.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Response Format](#response-format)
- [Authentication API](#authentication-api)
- [Wallet API](#wallet-api)
- [Payment API](#payment-api)
- [Card API](#card-api)
- [KYC/AML API](#kycaml-api)
- [Ledger API](#ledger-api)
- [Fraud Detection API](#fraud-detection-api)
- [Multi-Currency API](#multi-currency-api)
- [Analytics API](#analytics-api)
- [User Management API](#user-management-api)

## Base URL

```
Development: http://localhost:5000/api/v1
Production: https://api.flowlet.com/api/v1
```

All API endpoints are prefixed with `/api/v1`.

## Authentication

Flowlet uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Obtaining a Token

```bash
POST /api/v1/auth/login
```

See [Authentication API](#authentication-api) for details.

## Rate Limiting

| Endpoint Type      | Rate Limit   | Window   |
| ------------------ | ------------ | -------- |
| Authentication     | 5 requests   | 1 minute |
| Standard API       | 100 requests | 1 minute |
| Payment Operations | 30 requests  | 1 minute |
| Fraud Detection    | 50 requests  | 1 minute |

Rate limit headers are included in all responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

## Response Format

### Success Response

```json
{
  "status": "success",
  "data": {
    "id": "123",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid parameter: amount must be positive",
    "field": "amount"
  }
}
```

### Common HTTP Status Codes

| Code | Meaning               | Usage                             |
| ---- | --------------------- | --------------------------------- |
| 200  | OK                    | Successful request                |
| 201  | Created               | Resource created successfully     |
| 400  | Bad Request           | Invalid request parameters        |
| 401  | Unauthorized          | Missing or invalid authentication |
| 403  | Forbidden             | Insufficient permissions          |
| 404  | Not Found             | Resource not found                |
| 429  | Too Many Requests     | Rate limit exceeded               |
| 500  | Internal Server Error | Server error                      |

---

## Authentication API

### Register User

Create a new user account.

**Endpoint**: `POST /auth/register`

**Parameters**:

| Name       | Type   | Required? | Default | Description                    | Example          |
| ---------- | ------ | --------- | ------- | ------------------------------ | ---------------- |
| email      | string | Yes       | -       | User email address (unique)    | user@example.com |
| password   | string | Yes       | -       | Strong password (min 8 chars)  | SecurePass123!   |
| first_name | string | Yes       | -       | User's first name              | John             |
| last_name  | string | Yes       | -       | User's last name               | Doe              |
| phone      | string | No        | null    | Phone number with country code | +1234567890      |

**Example Request**:

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890"
  }'
```

**Example Response**:

```json
{
  "status": "success",
  "data": {
    "user_id": "usr_1234567890",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2025-01-01T00:00:00Z"
  },
  "message": "User registered successfully"
}
```

### Login

Authenticate and receive JWT token.

**Endpoint**: `POST /auth/login`

**Parameters**:

| Name     | Type   | Required? | Default | Description   | Example          |
| -------- | ------ | --------- | ------- | ------------- | ---------------- |
| email    | string | Yes       | -       | User email    | user@example.com |
| password | string | Yes       | -       | User password | SecurePass123!   |

**Example Request**:

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

**Example Response**:

```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": "usr_1234567890",
      "email": "user@example.com"
    }
  }
}
```

### Refresh Token

Get a new access token using refresh token.

**Endpoint**: `POST /auth/refresh`

**Headers**: `Authorization: Bearer REFRESH_TOKEN`

**Example Response**:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}
```

### Logout

Invalidate current session.

**Endpoint**: `POST /auth/logout`

**Headers**: `Authorization: Bearer ACCESS_TOKEN`

---

## Wallet API

### List Wallets

Get all wallets for the authenticated user.

**Endpoint**: `GET /accounts`

**Headers**: `Authorization: Bearer TOKEN`

**Example Request**:

```bash
curl -X GET http://localhost:5000/api/v1/accounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Example Response**:

```json
{
  "accounts": [
    {
      "id": "acc_1234567890",
      "user_id": "usr_1234567890",
      "currency": "USD",
      "balance": "1000.00",
      "type": "personal",
      "status": "active",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### Get Wallet Details

Get detailed information about a specific wallet.

**Endpoint**: `GET /accounts/{account_id}`

**Headers**: `Authorization: Bearer TOKEN`

**Path Parameters**:

| Name       | Type   | Description       | Example        |
| ---------- | ------ | ----------------- | -------------- |
| account_id | string | Wallet identifier | acc_1234567890 |

**Example Response**:

```json
{
  "account": {
    "id": "acc_1234567890",
    "balance": "1000.00",
    "currency": "USD",
    "status": "active"
  },
  "recent_transactions": [
    {
      "id": "txn_9876543210",
      "amount": "50.00",
      "type": "deposit",
      "status": "completed",
      "timestamp": "2025-01-01T12:00:00Z"
    }
  ]
}
```

### Create Wallet

Create a new wallet for the user.

**Endpoint**: `POST /accounts/wallets`

**Headers**: `Authorization: Bearer TOKEN`

**Parameters**:

| Name     | Type   | Required? | Default  | Description            | Example            |
| -------- | ------ | --------- | -------- | ---------------------- | ------------------ |
| currency | string | Yes       | -        | ISO 4217 currency code | USD, EUR, GBP      |
| type     | string | No        | personal | Wallet type            | personal, business |
| name     | string | No        | null     | Custom wallet name     | Savings Account    |

**Example Request**:

```bash
curl -X POST http://localhost:5000/api/v1/accounts/wallets \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "USD",
    "type": "personal",
    "name": "My Savings"
  }'
```

### Deposit Funds

Deposit funds into a wallet.

**Endpoint**: `POST /accounts/{account_id}/deposit`

**Parameters**:

| Name        | Type    | Required? | Default | Description                  | Example                       |
| ----------- | ------- | --------- | ------- | ---------------------------- | ----------------------------- |
| amount      | decimal | Yes       | -       | Amount to deposit (positive) | 100.00                        |
| source      | string  | Yes       | -       | Deposit source               | bank_transfer, card, external |
| reference   | string  | No        | null    | External reference           | ref_12345                     |
| description | string  | No        | null    | Transaction description      | Monthly deposit               |

**Example Request**:

```bash
curl -X POST http://localhost:5000/api/v1/accounts/acc_123/deposit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "source": "bank_transfer",
    "description": "Salary deposit"
  }'
```

### Withdraw Funds

Withdraw funds from a wallet.

**Endpoint**: `POST /accounts/{account_id}/withdraw`

**Parameters**:

| Name        | Type    | Required? | Default | Description            | Example                       |
| ----------- | ------- | --------- | ------- | ---------------------- | ----------------------------- |
| amount      | decimal | Yes       | -       | Amount to withdraw     | 50.00                         |
| destination | string  | Yes       | -       | Withdrawal destination | bank_account, external_wallet |
| reference   | string  | No        | null    | External reference     | withdrawal_001                |

---

## Payment API

### Create Payment

Initiate a payment transaction.

**Endpoint**: `POST /payments`

**Headers**: `Authorization: Bearer TOKEN`

**Parameters**:

| Name             | Type    | Required? | Default | Description          | Example                   |
| ---------------- | ------- | --------- | ------- | -------------------- | ------------------------- |
| amount           | decimal | Yes       | -       | Payment amount       | 100.00                    |
| currency         | string  | Yes       | -       | ISO currency code    | USD                       |
| source_wallet_id | string  | Yes       | -       | Source wallet ID     | acc_123                   |
| destination      | string  | Yes       | -       | Recipient identifier | user@example.com, acc_456 |
| description      | string  | No        | null    | Payment description  | Invoice payment           |
| metadata         | object  | No        | {}      | Custom metadata      | {"invoice_id": "INV-001"} |

**Example Request**:

```bash
curl -X POST http://localhost:5000/api/v1/payments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "currency": "USD",
    "source_wallet_id": "acc_123",
    "destination": "recipient@example.com",
    "description": "Payment for services"
  }'
```

**Example Response**:

```json
{
  "status": "success",
  "data": {
    "payment_id": "pmt_9876543210",
    "amount": "100.00",
    "currency": "USD",
    "status": "pending",
    "created_at": "2025-01-01T12:00:00Z",
    "estimated_completion": "2025-01-01T12:05:00Z"
  }
}
```

### Get Payment Status

Check the status of a payment.

**Endpoint**: `GET /payments/{payment_id}`

**Example Response**:

```json
{
  "payment_id": "pmt_9876543210",
  "status": "completed",
  "amount": "100.00",
  "currency": "USD",
  "completed_at": "2025-01-01T12:03:45Z"
}
```

### List Payments

Get payment history with filtering.

**Endpoint**: `GET /payments`

**Query Parameters**:

| Name       | Type    | Required? | Default | Description           | Example                    |
| ---------- | ------- | --------- | ------- | --------------------- | -------------------------- |
| status     | string  | No        | all     | Filter by status      | completed, pending, failed |
| start_date | string  | No        | null    | Start date (ISO 8601) | 2025-01-01T00:00:00Z       |
| end_date   | string  | No        | null    | End date (ISO 8601)   | 2025-01-31T23:59:59Z       |
| limit      | integer | No        | 50      | Max results per page  | 100                        |
| offset     | integer | No        | 0       | Pagination offset     | 50                         |

---

## Card API

### Issue Card

Create a new virtual or physical card.

**Endpoint**: `POST /cards`

**Parameters**:

| Name          | Type    | Required? | Default   | Description            | Example           |
| ------------- | ------- | --------- | --------- | ---------------------- | ----------------- |
| type          | string  | Yes       | -         | Card type              | virtual, physical |
| wallet_id     | string  | Yes       | -         | Linked wallet ID       | acc_123           |
| daily_limit   | decimal | No        | 500.00    | Daily spending limit   | 1000.00           |
| monthly_limit | decimal | No        | 5000.00   | Monthly spending limit | 10000.00          |
| name_on_card  | string  | No        | User name | Cardholder name        | John Doe          |

**Example Request**:

```bash
curl -X POST http://localhost:5000/api/v1/cards \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "virtual",
    "wallet_id": "acc_123",
    "daily_limit": 1000.00
  }'
```

**Example Response**:

```json
{
  "card_id": "card_1234567890",
  "type": "virtual",
  "status": "inactive",
  "last_four": "4242",
  "expiry_month": 12,
  "expiry_year": 2028,
  "created_at": "2025-01-01T12:00:00Z"
}
```

### Activate Card

Activate an issued card.

**Endpoint**: `POST /cards/{card_id}/activate`

### Set Card Limits

Update spending limits for a card.

**Endpoint**: `PATCH /cards/{card_id}`

**Parameters**:

| Name          | Type    | Required? | Default | Description         | Example  |
| ------------- | ------- | --------- | ------- | ------------------- | -------- |
| daily_limit   | decimal | No        | current | New daily limit     | 2000.00  |
| monthly_limit | decimal | No        | current | New monthly limit   | 20000.00 |
| enabled       | boolean | No        | current | Enable/disable card | true     |

### Freeze/Unfreeze Card

Temporarily freeze or unfreeze a card.

**Endpoint**: `POST /cards/{card_id}/freeze`

**Endpoint**: `POST /cards/{card_id}/unfreeze`

---

## KYC/AML API

### Submit KYC Information

Submit identity verification documents.

**Endpoint**: `POST /kyc/submit`

**Parameters**:

| Name            | Type   | Required? | Default | Description                 | Example                   |
| --------------- | ------ | --------- | ------- | --------------------------- | ------------------------- |
| first_name      | string | Yes       | -       | Legal first name            | John                      |
| last_name       | string | Yes       | -       | Legal last name             | Doe                       |
| date_of_birth   | string | Yes       | -       | DOB (YYYY-MM-DD)            | 1990-01-01                |
| ssn             | string | Yes\*     | -       | Social Security Number (US) | 123-45-6789               |
| address         | object | Yes       | -       | Residential address         | See below                 |
| document_type   | string | Yes       | -       | ID document type            | passport, drivers_license |
| document_number | string | Yes       | -       | Document number             | X12345678                 |

**Address Object**:

| Name        | Type   | Required? | Description      | Example     |
| ----------- | ------ | --------- | ---------------- | ----------- |
| street      | string | Yes       | Street address   | 123 Main St |
| city        | string | Yes       | City             | New York    |
| state       | string | Yes       | State/Province   | NY          |
| postal_code | string | Yes       | ZIP/Postal code  | 10001       |
| country     | string | Yes       | ISO country code | US          |

**Example Request**:

```bash
curl -X POST http://localhost:5000/api/v1/kyc/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### Get KYC Status

Check KYC verification status.

**Endpoint**: `GET /kyc/status`

**Example Response**:

```json
{
  "status": "verified",
  "verified_at": "2025-01-01T12:00:00Z",
  "verification_level": "tier_2",
  "limits": {
    "daily_transaction": 10000.0,
    "monthly_transaction": 50000.0
  }
}
```

---

## Ledger API

### Get Transaction History

Retrieve transaction history with filters.

**Endpoint**: `GET /ledger/transactions`

**Query Parameters**:

| Name       | Type    | Required? | Default | Description       | Example                      |
| ---------- | ------- | --------- | ------- | ----------------- | ---------------------------- |
| account_id | string  | No        | all     | Filter by account | acc_123                      |
| start_date | string  | No        | null    | Start date        | 2025-01-01T00:00:00Z         |
| end_date   | string  | No        | null    | End date          | 2025-01-31T23:59:59Z         |
| type       | string  | No        | all     | Transaction type  | deposit, withdrawal, payment |
| format     | string  | No        | json    | Response format   | json, csv                    |
| limit      | integer | No        | 50      | Results per page  | 100                          |

**Example Response**:

```json
{
  "transactions": [
    {
      "id": "txn_1234567890",
      "account_id": "acc_123",
      "amount": "100.00",
      "currency": "USD",
      "type": "deposit",
      "status": "completed",
      "description": "Bank transfer",
      "timestamp": "2025-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

### Generate Account Statement

Generate a formal account statement.

**Endpoint**: `POST /ledger/statements`

**Parameters**:

| Name       | Type   | Required? | Default | Description          | Example        |
| ---------- | ------ | --------- | ------- | -------------------- | -------------- |
| account_id | string | Yes       | -       | Account identifier   | acc_123        |
| start_date | string | Yes       | -       | Statement start date | 2025-01-01     |
| end_date   | string | Yes       | -       | Statement end date   | 2025-01-31     |
| format     | string | No        | pdf     | Output format        | pdf, csv, json |

---

## Fraud Detection API

### Analyze Transaction

Submit a transaction for fraud analysis.

**Endpoint**: `POST /fraud/analyze`

**Parameters**:

| Name           | Type    | Required? | Default | Description             | Example           |
| -------------- | ------- | --------- | ------- | ----------------------- | ----------------- |
| transaction_id | string  | Yes\*     | -       | Existing transaction ID | txn_123           |
| amount         | decimal | Yes\*     | -       | Transaction amount      | 1000.00           |
| currency       | string  | Yes       | USD     | Currency code           | USD               |
| merchant       | string  | No        | null    | Merchant name           | Electronics Store |
| location       | string  | No        | null    | Transaction location    | New York, NY      |
| card_present   | boolean | No        | false   | Card physically present | true              |

**Example Response**:

```json
{
  "transaction_id": "txn_123",
  "risk_score": 0.35,
  "risk_level": "low",
  "decision": "approve",
  "flags": [],
  "analysis_timestamp": "2025-01-01T12:00:00Z"
}
```

---

## Multi-Currency API

### Get Exchange Rates

Retrieve current exchange rates.

**Endpoint**: `GET /currency/rates`

**Query Parameters**:

| Name    | Type   | Required? | Default | Description                         | Example     |
| ------- | ------ | --------- | ------- | ----------------------------------- | ----------- |
| base    | string | No        | USD     | Base currency                       | USD         |
| symbols | string | No        | all     | Target currencies (comma-separated) | EUR,GBP,JPY |

**Example Response**:

```json
{
  "base": "USD",
  "rates": {
    "EUR": 0.85,
    "GBP": 0.73,
    "JPY": 110.5
  },
  "timestamp": "2025-01-01T12:00:00Z"
}
```

### Convert Currency

Convert amount between currencies.

**Endpoint**: `POST /currency/convert`

**Parameters**:

| Name                  | Type    | Required? | Default | Description                         | Example |
| --------------------- | ------- | --------- | ------- | ----------------------------------- | ------- |
| from_currency         | string  | Yes       | -       | Source currency                     | USD     |
| to_currency           | string  | Yes       | -       | Target currency                     | EUR     |
| amount                | decimal | Yes       | -       | Amount to convert                   | 100.00  |
| source_wallet_id      | string  | No        | null    | Source wallet (for actual transfer) | acc_123 |
| destination_wallet_id | string  | No        | null    | Destination wallet                  | acc_456 |

---

## Analytics API

### Get Dashboard Metrics

Retrieve dashboard analytics.

**Endpoint**: `GET /analytics/dashboard`

**Example Response**:

```json
{
  "total_transactions": 1500,
  "total_volume": "150000.00",
  "active_users": 250,
  "period": "last_30_days"
}
```

---

## User Management API

### Get User Profile

Retrieve authenticated user's profile.

**Endpoint**: `GET /users/profile`

**Example Response**:

```json
{
  "user_id": "usr_123",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "kyc_status": "verified",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### Update User Profile

Update user profile information.

**Endpoint**: `PATCH /users/profile`

**Parameters**:

| Name       | Type   | Required? | Default | Description        | Example     |
| ---------- | ------ | --------- | ------- | ------------------ | ----------- |
| first_name | string | No        | current | Updated first name | Jane        |
| last_name  | string | No        | current | Updated last name  | Smith       |
| phone      | string | No        | current | Updated phone      | +1987654321 |

---

## Error Codes

| Code                   | Description                       | Resolution                                   |
| ---------------------- | --------------------------------- | -------------------------------------------- |
| `TOKEN_MISSING`        | Authentication token not provided | Include Bearer token in Authorization header |
| `TOKEN_INVALID`        | Token is invalid or expired       | Obtain new token via login                   |
| `INSUFFICIENT_BALANCE` | Wallet balance too low            | Deposit funds or reduce amount               |
| `INVALID_AMOUNT`       | Amount validation failed          | Ensure amount is positive and within limits  |
| `KYC_REQUIRED`         | KYC verification needed           | Complete KYC verification process            |
| `RATE_LIMIT_EXCEEDED`  | Too many requests                 | Wait before retrying                         |
| `ACCOUNT_NOT_FOUND`    | Account/wallet doesn't exist      | Verify account ID                            |
| `PERMISSION_DENIED`    | Insufficient permissions          | Check account ownership                      |

## SDK Support

Official SDKs available for:

- **Python**: `pip install flowlet-sdk`
- **JavaScript/Node.js**: `npm install @flowlet/sdk`
- **Ruby**: `gem install flowlet`

See [SDK Documentation](../10_SDK/) for language-specific guides.

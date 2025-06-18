# Flowlet MVP - API Documentation

## Base URL
- Simple Implementation: `http://localhost:5001`
- Enhanced Implementation: `http://localhost:5000`

## Authentication
Currently, the MVP does not require authentication for testing purposes. In production, all endpoints would require proper authentication tokens.

## Response Format
All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2025-06-15T19:30:00Z"
}
```

## Endpoints

### Health Check

#### GET /health
Check the health status of the API.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-15T19:30:00Z",
  "version": "1.0.0-mvp",
  "services": {
    "database": "healthy",
    "api": "active"
  }
}
```

### API Information

#### GET /api/v1/info
Get information about the API and available features.

**Response:**
```json
{
  "api_name": "Flowlet MVP Backend",
  "version": "1.0.0-mvp",
  "description": "Simple MVP for wallet and payment functionality",
  "endpoints": {
    "wallet_mvp": "/api/v1/wallet",
    "payment_mvp": "/api/v1/payment"
  },
  "mvp_features": [
    "Wallet Creation and Management",
    "Balance Inquiry",
    "Fund Deposits and Withdrawals",
    "Transaction History",
    "Peer-to-Peer Payments",
    "Transfer Between Wallets"
  ]
}
```

## Wallet Management

### Create Wallet

#### POST /api/v1/wallet/create
Create a new wallet for a user.

**Request Body:**
```json
{
  "user_id": "string (required)",
  "account_name": "string (required)",
  "account_type": "checking|savings|business (optional, default: checking)",
  "currency": "USD|EUR|GBP (optional, default: USD)",
  "initial_deposit": "decimal (optional, default: 0.00)"
}
```

**Response:**
```json
{
  "success": true,
  "wallet": {
    "id": "wallet_uuid",
    "account_name": "My Checking Account",
    "account_number": "1234", // Last 4 digits only
    "account_type": "checking",
    "currency": "USD",
    "available_balance": 100.00,
    "current_balance": 100.00,
    "status": "active"
  },
  "message": "Wallet created successfully"
}
```

### Get Wallet Balance

#### GET /api/v1/wallet/{wallet_id}/balance
Get the current balance of a wallet.

**Response:**
```json
{
  "success": true,
  "wallet_id": "wallet_uuid",
  "account_name": "My Checking Account",
  "available_balance": 125.50,
  "current_balance": 125.50,
  "currency": "USD",
  "last_updated": "2025-06-15T19:30:00Z"
}
```

### Deposit Funds

#### POST /api/v1/wallet/{wallet_id}/deposit
Deposit funds into a wallet.

**Request Body:**
```json
{
  "amount": "decimal (required)",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "transaction_uuid",
    "transaction_id": "TXN-20250615-ABC12345",
    "amount": 50.00,
    "currency": "USD",
    "description": "Deposit to wallet"
  },
  "new_balance": 175.50,
  "message": "Deposit completed successfully"
}
```

### Withdraw Funds

#### POST /api/v1/wallet/{wallet_id}/withdraw
Withdraw funds from a wallet.

**Request Body:**
```json
{
  "amount": "decimal (required)",
  "description": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "transaction_uuid",
    "transaction_id": "TXN-20250615-DEF67890",
    "amount": 25.00,
    "currency": "USD",
    "description": "Withdrawal from wallet"
  },
  "new_balance": 150.50,
  "message": "Withdrawal completed successfully"
}
```

### Get Transaction History

#### GET /api/v1/wallet/{wallet_id}/transactions
Get transaction history for a wallet.

**Query Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)
- `transaction_type`: Filter by type (credit, debit, transfer)
- `start_date`: Filter from date (ISO format)
- `end_date`: Filter to date (ISO format)

**Response:**
```json
{
  "success": true,
  "wallet_id": "wallet_uuid",
  "transactions": [
    {
      "transaction_id": "TXN-20250615-ABC12345",
      "transaction_type": "credit",
      "transaction_category": "deposit",
      "amount": 50.00,
      "currency": "USD",
      "description": "Deposit to wallet",
      "created_at": "2025-06-15T19:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 5
  }
}
```

### Get User Wallets

#### GET /api/v1/wallet/user/{user_id}
Get all wallets for a specific user.

**Response:**
```json
{
  "success": true,
  "user_id": "user123",
  "wallets": [
    {
      "id": "wallet_uuid",
      "account_name": "My Checking Account",
      "account_type": "checking",
      "currency": "USD",
      "available_balance": 150.50,
      "current_balance": 150.50,
      "status": "active"
    }
  ],
  "total_wallets": 1
}
```

## Payment Processing

### Transfer Funds

#### POST /api/v1/payment/transfer
Transfer funds between two wallets.

**Request Body:**
```json
{
  "from_wallet_id": "string (required)",
  "to_wallet_id": "string (required)",
  "amount": "decimal (required)",
  "description": "string (optional)",
  "reference": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "transfer_reference": "TRF-20250615193000-ABC12345",
  "from_wallet": {
    "wallet_id": "from_wallet_uuid",
    "account_name": "Sender Account",
    "new_balance": 120.50
  },
  "to_wallet": {
    "wallet_id": "to_wallet_uuid",
    "account_name": "Receiver Account",
    "new_balance": 80.00
  },
  "transfer_details": {
    "amount": 30.00,
    "currency": "USD",
    "description": "Payment for services",
    "processed_at": "2025-06-15T19:30:00Z"
  },
  "message": "Transfer completed successfully"
}
```

### Send Payment

#### POST /api/v1/payment/send
Send payment to a recipient (by email, phone, or account number).

**Request Body:**
```json
{
  "from_wallet_id": "string (required)",
  "recipient_identifier": "string (required)", // email, phone, or account number
  "recipient_type": "email|phone|account_number (optional, auto-detected)",
  "amount": "decimal (required)",
  "description": "string (optional)",
  "reference": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "payment_reference": "PAY-20250615193000-DEF67890",
  "sender": {
    "wallet_id": "sender_wallet_uuid",
    "account_name": "Sender Account",
    "new_balance": 90.50
  },
  "recipient": {
    "wallet_id": "recipient_wallet_uuid",
    "account_name": "Recipient Account",
    "identifier": "recipient@example.com",
    "type": "email"
  },
  "payment_details": {
    "amount": 30.00,
    "currency": "USD",
    "description": "Payment to recipient",
    "processed_at": "2025-06-15T19:30:00Z"
  },
  "message": "Payment sent successfully"
}
```

### Create Payment Request

#### POST /api/v1/payment/request
Create a payment request (for future implementation).

**Request Body:**
```json
{
  "from_wallet_id": "string (required)",
  "amount": "decimal (required)",
  "description": "string (optional)",
  "expires_at": "datetime (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "request_reference": "REQ-20250615193000-GHI12345",
  "wallet_id": "wallet_uuid",
  "account_name": "My Account",
  "amount": 50.00,
  "currency": "USD",
  "description": "Payment request",
  "status": "pending",
  "created_at": "2025-06-15T19:30:00Z",
  "expires_at": null,
  "message": "Payment request created successfully"
}
```

### Get Payment History

#### GET /api/v1/payment/history/{wallet_id}
Get payment history for a wallet (payments sent and received).

**Query Parameters:**
- `page`: Page number (default: 1)
- `per_page`: Items per page (default: 20, max: 100)
- `type`: Filter by type (sent, received, all) (default: all)
- `start_date`: Filter from date (ISO format)
- `end_date`: Filter to date (ISO format)

**Response:**
```json
{
  "success": true,
  "wallet_id": "wallet_uuid",
  "payments": [
    {
      "transaction_id": "TXN-20250615-ABC12345",
      "transaction_type": "debit",
      "transaction_category": "payment",
      "amount": 30.00,
      "currency": "USD",
      "description": "Payment sent",
      "created_at": "2025-06-15T19:30:00Z",
      "direction": "sent"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 3
  }
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `WALLET_NOT_FOUND` | The specified wallet does not exist |
| `USER_NOT_FOUND` | The specified user does not exist |
| `INSUFFICIENT_FUNDS` | Not enough balance for the operation |
| `INVALID_AMOUNT` | Amount is invalid (negative or zero) |
| `INVALID_AMOUNT_FORMAT` | Amount format is incorrect |
| `CURRENCY_MISMATCH` | Different currencies between wallets |
| `MISSING_FIELDS` | Required fields are missing |
| `WALLET_INACTIVE` | Wallet is not in active status |
| `DAILY_LIMIT_EXCEEDED` | Daily transaction limit exceeded |
| `INVALID_CONTENT_TYPE` | Content-Type must be application/json |
| `INVALID_JSON` | Request body contains invalid JSON |
| `INTERNAL_ERROR` | Internal server error occurred |

## Rate Limiting

The API implements rate limiting to prevent abuse:
- 1000 requests per hour per IP
- 100 requests per minute per IP

When rate limits are exceeded, the API returns a 429 status code with retry information.

## Testing

Use the provided test script (`test_mvp.py`) to test all endpoints:

```bash
python3.11 test_mvp.py
```

The test script will:
1. Check API health
2. Create test wallets
3. Test deposits and withdrawals
4. Test transfers between wallets
5. Verify transaction history

## cURL Examples

### Create a wallet:
```bash
curl -X POST http://localhost:5001/api/v1/wallet/create \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test123","account_name":"Test Account","initial_deposit":"100.00"}'
```

### Check balance:
```bash
curl http://localhost:5001/api/v1/wallet/{wallet_id}/balance
```

### Make a deposit:
```bash
curl -X POST http://localhost:5001/api/v1/wallet/{wallet_id}/deposit \
  -H "Content-Type: application/json" \
  -d '{"amount":"50.00","description":"Test deposit"}'
```

### Transfer funds:
```bash
curl -X POST http://localhost:5001/api/v1/payment/transfer \
  -H "Content-Type: application/json" \
  -d '{"from_wallet_id":"wallet1","to_wallet_id":"wallet2","amount":"25.00"}'
```


# Flowlet MVP - Wallet and Payment System

## Overview

This is an MVP (Minimum Viable Product) implementation of the Flowlet financial platform with core wallet and payment functionality. The MVP provides essential features for digital wallet management and peer-to-peer payments.

## Features Implemented

### Core Wallet Functionality

- **Wallet Creation**: Create new digital wallets for users
- **Balance Inquiry**: Check current and available balances
- **Fund Deposits**: Add money to wallets
- **Fund Withdrawals**: Remove money from wallets
- **Transaction History**: View detailed transaction records

### Payment Functionality

- **Peer-to-Peer Transfers**: Transfer funds between wallets
- **Payment Processing**: Send payments with reference tracking
- **Multi-currency Support**: Support for USD, EUR, GBP, and other major currencies
- **Transaction Tracking**: Comprehensive transaction logging and status tracking

## Architecture

The MVP includes two implementations:

1. **Enhanced Implementation** (`src/` directory)
   - Full-featured implementation with advanced models
   - Enhanced security and compliance features
   - Comprehensive transaction tracking
   - Advanced account management

2. **Simple Implementation** (`simple_mvp_app.py`)
   - Lightweight implementation for testing
   - SQLite database for simplicity
   - All core features functional
   - Easy to run and test

## API Endpoints

### Health and Info

- `GET /health` - Health check endpoint
- `GET /api/v1/info` - API information and features

### Wallet Management

- `POST /api/v1/wallet/create` - Create a new wallet
- `GET /api/v1/wallet/{wallet_id}/balance` - Get wallet balance
- `POST /api/v1/wallet/{wallet_id}/deposit` - Deposit funds
- `POST /api/v1/wallet/{wallet_id}/withdraw` - Withdraw funds
- `GET /api/v1/wallet/{wallet_id}/transactions` - Get transaction history
- `GET /api/v1/wallet/user/{user_id}` - Get all wallets for a user

### Payment Processing

- `POST /api/v1/payment/transfer` - Transfer funds between wallets
- `POST /api/v1/payment/send` - Send payment to recipient
- `POST /api/v1/payment/request` - Create payment request
- `GET /api/v1/payment/history/{wallet_id}` - Get payment history

## Quick Start

### Prerequisites

- Python 3.11+
- pip3
- Required packages (see requirements below)

### Installation

1. **Install Dependencies**

   ```bash
   cd backend
   pip3 install flask flask-cors flask-sqlalchemy flask-migrate flask-limiter redis pyjwt async-timeout
   ```

2. **Run Simple MVP (Recommended for Testing)**

   ```bash
   cd backend
   python3.11 simple_mvp_app.py
   ```

   The server will start on `http://localhost:5001`

3. **Run Enhanced Implementation**
   ```bash
   cd backend
   FLASK_ENV=development PYTHONPATH=/path/to/Flowlet/backend python3.11 -m src.main
   ```

### Testing

Run the included test script:

```bash
cd backend
python3.11 test_mvp.py
```

This will test all major functionality including:

- Wallet creation
- Balance inquiries
- Deposits and withdrawals
- Transfers between wallets
- Transaction history

## API Usage Examples

### Create a Wallet

```bash
curl -X POST http://localhost:5001/api/v1/wallet/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "account_name": "My Checking Account",
    "account_type": "checking",
    "currency": "USD",
    "initial_deposit": "100.00"
  }'
```

### Check Balance

```bash
curl http://localhost:5001/api/v1/wallet/{wallet_id}/balance
```

### Deposit Funds

```bash
curl -X POST http://localhost:5001/api/v1/wallet/{wallet_id}/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "50.00",
    "description": "Deposit from bank account"
  }'
```

### Transfer Funds

```bash
curl -X POST http://localhost:5001/api/v1/payment/transfer \
  -H "Content-Type: application/json" \
  -d '{
    "from_wallet_id": "wallet1_id",
    "to_wallet_id": "wallet2_id",
    "amount": "25.00",
    "description": "Payment for services"
  }'
```

## Database Schema

### Simple Implementation (SQLite)

- **users**: User information
- **accounts**: Wallet/account details
- **transactions**: Transaction records

### Enhanced Implementation

- **enhanced_accounts**: Advanced account management
- **enhanced_transactions**: Comprehensive transaction tracking
- **users**: User management with KYC support

## Security Features

- Input validation and sanitization
- SQL injection prevention
- CORS support for web-frontend integration
- Transaction integrity checks
- Balance validation
- Comprehensive error handling

## Error Handling

The API returns standardized error responses:

```json
{
  "error": "Error description",
  "code": "ERROR_CODE",
  "timestamp": "2025-06-15T19:30:00Z"
}
```

Common error codes:

- `WALLET_NOT_FOUND`: Wallet doesn't exist
- `INSUFFICIENT_FUNDS`: Not enough balance
- `INVALID_AMOUNT`: Invalid amount format
- `CURRENCY_MISMATCH`: Different currencies in transfer
- `MISSING_FIELDS`: Required fields not provided

## Development Notes

### File Structure

```
backend/
├── src/                          # Enhanced implementation
│   ├── main.py                   # Main application
│   ├── models/                   # Database models
│   │   ├── account.py           # Account model
│   │   ├── transaction.py       # Transaction model
│   │   └── database.py          # Database setup
│   └── routes/                   # API routes
│       ├── wallet_mvp.py        # Wallet endpoints
│       └── payment_mvp.py       # Payment endpoints
├── simple_mvp_app.py            # Simple implementation
├── test_mvp.py                  # Test script
└── README_MVP.md                # This file
```

### Key Implementation Details

1. **Amount Handling**: All monetary amounts are stored as integers (cents) to avoid floating-point precision issues
2. **Transaction Integrity**: Each transfer creates two linked transactions (debit and credit)
3. **Unique Identifiers**: UUIDs used for all entities to ensure uniqueness
4. **Status Tracking**: Comprehensive status tracking for accounts and transactions
5. **Audit Trail**: Complete transaction history with timestamps and references

## Future Enhancements

The MVP provides a solid foundation for additional features:

- User authentication and authorization
- Card management and tokenization
- Fraud detection and prevention
- Multi-factor authentication
- Real-time notifications
- Advanced reporting and analytics
- Integration with external payment processors
- Mobile app support

## Support

For questions or issues with the MVP implementation, refer to the test script (`test_mvp.py`) for usage examples and the API documentation above for endpoint details.

## License

This MVP implementation is part of the Flowlet project. See the main project LICENSE file for details.

# Flowlet Backend - Comprehensive Embedded Finance Platform

This is the complete backend implementation for the Flowlet embedded finance platform, providing a comprehensive suite of financial services through microservices architecture.

## 🏗️ Architecture Overview

The Flowlet backend is built using a microservices architecture with the following core services:

### Core Services

1. **Wallet Service** (`/api/v1/wallet/`)
   - Digital wallet creation and management
   - Multi-currency support
   - Real-time balance tracking
   - Internal transfers between wallets

2. **Payment Processing Service** (`/api/v1/payment/`)
   - Deposit and withdrawal operations
   - Bank transfers (ACH, SEPA, Wire)
   - Card payment processing
   - Currency conversion
   - Real-time transaction status updates

3. **Card Issuance and Management** (`/api/v1/card/`)
   - Virtual and physical card issuance
   - Real-time card controls (freeze/unfreeze)
   - Spending limits management
   - Transaction analytics
   - Merchant category controls

4. **KYC/AML Compliance** (`/api/v1/kyc/`)
   - User identity verification
   - Multi-level verification (basic, enhanced, premium)
   - Document verification
   - AML screening against watchlists
   - Risk scoring algorithms

5. **Ledger and Accounting** (`/api/v1/ledger/`)
   - Double-entry bookkeeping system
   - Real-time financial reporting
   - Trial balance, balance sheet, income statement
   - Account reconciliation
   - Comprehensive audit trails

6. **AI-Enhanced Services** (`/api/v1/ai/`)
   - Real-time fraud detection
   - AI-powered support chatbot
   - User behavior analytics
   - Financial product recommendations
   - Machine learning risk assessment

7. **Security Infrastructure** (`/api/v1/security/`)
   - API key management with permissions
   - Data tokenization and encryption
   - Comprehensive audit logging
   - Security scanning and monitoring
   - Access control and authentication

8. **API Gateway** (`/api/v1/gateway/`)
   - Unified API documentation
   - SDK information and examples
   - Developer portal integration
   - Webhook configuration
   - Rate limiting information

## 🗄️ Database Schema

The platform uses SQLite for development (easily replaceable with PostgreSQL for production) with the following models:

- **User**: Customer information and KYC status
- **Wallet**: Digital wallets with multi-currency support
- **Transaction**: All financial transactions with status tracking
- **Card**: Virtual and physical card management
- **KYCRecord**: Identity verification records
- **LedgerEntry**: Double-entry bookkeeping entries
- **FraudAlert**: AI-generated fraud detection alerts
- **APIKey**: Secure API access management
- **AuditLog**: Comprehensive system audit trail

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Virtual environment support
- SQLite (included with Python)

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd flowlet_backend
   ```

2. **Activate the virtual environment:**
   ```bash
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the development server:**
   ```bash
   python src/main.py
   ```

The server will start on `http://localhost:5000` with the following endpoints available:

- Health check: `GET /health`
- API documentation: `GET /api/v1/gateway/documentation`
- Service status: `GET /api/v1/gateway/status`

### Testing

Run the comprehensive test suite:

```bash
python test_offline.py
```

This will validate:
- ✅ Flask app creation
- ✅ Database model integrity
- ✅ Route blueprint imports
- ✅ Service functionality
- ✅ AI algorithms
- ✅ Security functions

## 📚 API Documentation

### Authentication

All API requests require authentication using API keys:

```bash
Authorization: Bearer YOUR_API_KEY
```

Create API keys using the security service:

```bash
POST /api/v1/security/api-keys/create
{
  "key_name": "My Application",
  "permissions": ["read", "write"],
  "rate_limit": 1000
}
```

### Core Workflows

#### 1. User Onboarding and KYC

```bash
# Create user
POST /api/v1/kyc/user/create
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01"
}

# Start verification
POST /api/v1/kyc/verification/start
{
  "user_id": "user_id",
  "verification_level": "enhanced"
}

# Submit documents
POST /api/v1/kyc/verification/{verification_id}/document
{
  "document_type": "passport",
  "document_number": "A12345678"
}
```

#### 2. Wallet and Payment Operations

```bash
# Create wallet
POST /api/v1/wallet/create
{
  "user_id": "user_id",
  "wallet_type": "user",
  "currency": "USD"
}

# Deposit funds
POST /api/v1/payment/deposit
{
  "wallet_id": "wallet_id",
  "amount": "100.00",
  "payment_method": "bank_transfer",
  "description": "Initial deposit"
}

# Check balance
GET /api/v1/wallet/{wallet_id}/balance
```

#### 3. Card Issuance and Management

```bash
# Issue virtual card
POST /api/v1/card/issue
{
  "wallet_id": "wallet_id",
  "card_type": "virtual",
  "daily_limit": "500.00",
  "monthly_limit": "2000.00"
}

# Update spending limits
PUT /api/v1/card/{card_id}/limits
{
  "daily_limit": "1000.00",
  "monthly_limit": "5000.00"
}
```

## 🔒 Security Features

### Data Protection
- **Tokenization**: Sensitive data like card numbers are tokenized
- **Encryption**: All data encrypted at rest and in transit
- **API Keys**: Secure authentication with granular permissions
- **Audit Logging**: Complete audit trail of all operations

### Fraud Detection
- **Real-time Analysis**: AI-powered transaction monitoring
- **Risk Scoring**: Multi-factor risk assessment
- **Pattern Recognition**: Behavioral analysis and anomaly detection
- **Alert System**: Automated fraud alert generation

### Compliance
- **KYC/AML**: Multi-level identity verification
- **Regulatory Reporting**: Automated compliance reporting
- **Data Privacy**: GDPR-compliant data handling
- **Audit Trails**: Immutable transaction records

## 🤖 AI Capabilities

### Fraud Detection Engine
- Analyzes transaction patterns in real-time
- Multi-factor risk scoring (amount, velocity, location, behavior)
- Machine learning-based anomaly detection
- Automated alert generation and resolution

### Support Chatbot
- Natural language processing for developer queries
- Comprehensive knowledge base integration
- Context-aware responses
- Multi-language support capability

### Analytics and Insights
- User behavior pattern analysis
- Financial product recommendations
- Risk assessment algorithms
- Predictive analytics for business intelligence

## 📊 Financial Reporting

### Double-Entry Ledger
- GAAP-compliant accounting principles
- Real-time balance calculations
- Automated journal entry generation
- Multi-currency support

### Financial Statements
- **Trial Balance**: Real-time account balances
- **Balance Sheet**: Assets, liabilities, and equity
- **Income Statement**: Revenue and expense tracking
- **Cash Flow Statement**: Operating, investing, and financing activities

### Reconciliation
- Automated account reconciliation
- External system integration
- Discrepancy detection and reporting
- Audit trail maintenance

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=sqlite:///flowlet.db

# Security
SECRET_KEY=your_secret_key_here
API_KEY_SALT=your_api_key_salt

# External Services
FRAUD_DETECTION_ENDPOINT=https://fraud-api.example.com
KYC_PROVIDER_API_KEY=your_kyc_provider_key
```

### Production Deployment

For production deployment:

1. **Database**: Replace SQLite with PostgreSQL
2. **Security**: Use environment variables for secrets
3. **Scaling**: Deploy with Docker and Kubernetes
4. **Monitoring**: Integrate with APM tools
5. **Logging**: Configure structured logging

## 🧪 Testing

### Test Coverage

The implementation includes comprehensive testing:

- **Unit Tests**: Individual service functionality
- **Integration Tests**: Cross-service interactions
- **API Tests**: Endpoint validation
- **Security Tests**: Authentication and authorization
- **Performance Tests**: Load and stress testing

### Test Data

Use the provided test data for development:

```python
# Test user credentials
test_user = {
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "User"
}

# Test card numbers (for sandbox)
test_cards = [
    "4111111111111111",  # Visa
    "5555555555554444",  # Mastercard
    "378282246310005"    # American Express
]
```

## 📈 Performance and Scalability

### Optimization Features
- **Database Indexing**: Optimized queries for high performance
- **Caching**: Redis integration for frequently accessed data
- **Connection Pooling**: Efficient database connection management
- **Async Processing**: Background job processing for heavy operations

### Monitoring and Observability
- **Health Checks**: Comprehensive service health monitoring
- **Metrics**: Business and technical metrics collection
- **Logging**: Structured logging with correlation IDs
- **Alerting**: Automated alert system for critical issues

## 🔄 API Versioning and Backwards Compatibility

- **Semantic Versioning**: Clear version numbering (v1.0.0)
- **Backwards Compatibility**: Maintained across minor versions
- **Deprecation Policy**: 6-month notice for breaking changes
- **Migration Guides**: Detailed upgrade documentation

## 🌐 Integration Examples

### Python SDK Example

```python
import flowlet

client = flowlet.Client(api_key="your_api_key")

# Create wallet
wallet = client.wallets.create(
    user_id="user_123",
    wallet_type="user",
    currency="USD"
)

# Process payment
payment = client.payments.deposit(
    wallet_id=wallet.id,
    amount=100.00,
    payment_method="bank_transfer",
    description="Initial deposit"
)
```

### JavaScript SDK Example

```javascript
const Flowlet = require('@flowlet/sdk');

const client = new Flowlet({
  apiKey: 'your_api_key'
});

// Create wallet
const wallet = await client.wallets.create({
  userId: 'user_123',
  walletType: 'user',
  currency: 'USD'
});

// Process payment
const payment = await client.payments.deposit({
  walletId: wallet.id,
  amount: 100.00,
  paymentMethod: 'bank_transfer',
  description: 'Initial deposit'
});
```

## 📞 Support and Documentation

### Resources
- **API Reference**: Complete endpoint documentation
- **Developer Portal**: Interactive API explorer
- **SDKs**: Multiple language support
- **Community Forum**: Developer community support
- **Status Page**: Real-time service status

### Contact
- **Support Email**: support@flowlet.com
- **Developer Portal**: https://developers.flowlet.com
- **Documentation**: https://docs.flowlet.com
- **Status Page**: https://status.flowlet.com

## 📄 License

This implementation is provided as a comprehensive example of an embedded finance platform. For production use, ensure compliance with all applicable financial regulations and obtain necessary licenses.

---

**Built with ❤️ for the embedded finance ecosystem**


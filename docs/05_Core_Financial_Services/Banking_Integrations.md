# Banking Integrations API Documentation

The Banking Integrations API provides a robust and secure interface for connecting Flowlet with various external banking systems. This API is critical for enabling functionalities such as fetching account information, retrieving transaction history, and initiating payments across different financial institutions. Designed with financial industry standards in mind, it emphasizes secure authentication, data integrity, and reliable transaction processing.

## Base URL

`/api/v1/banking`

## Financial Industry Standards and Considerations

- **Secure Authentication**: All interactions with external banking systems are secured using industry-standard authentication mechanisms. The API provides endpoints to manage and authenticate these integrations securely.
- **Data Encryption**: Sensitive financial data, including account numbers and transaction details, are encrypted both in transit and at rest to protect against unauthorized access and data breaches.
- **Transaction Integrity**: The API ensures the atomicity and reliability of financial transactions. Payment initiations include fallback mechanisms to ensure successful processing even if a preferred integration fails.
- **Comprehensive Logging and Audit Trails**: All API calls and interactions with banking integrations are meticulously logged, providing a complete audit trail for compliance, reconciliation, and troubleshooting purposes.
- **Error Handling and Resilience**: Robust error handling and specific error codes are implemented to provide clear feedback on integration issues, authentication failures, or invalid account details. The system is designed to be resilient to external system failures.
- **Scalability**: The architecture supports integration with multiple banking partners and is designed to scale to handle a high volume of account and transaction data.
- **Compliance**: The API design considers various financial regulations and best practices, particularly concerning data access, transaction reporting, and customer data protection.

## Endpoints

### 1. List All Registered Banking Integrations

`GET /api/v1/banking/integrations`

Retrieves a list of all banking integrations currently registered with the Flowlet system, along with their current health status.

**Permissions**: None (requires internal authentication/authorization, typically for administrative or system-level access)

**Responses**:

- `200 OK`: Successfully retrieved the list of integrations.
  ```json
  {
    "success": true,
    "integrations": [
      {
        "name": "string",
        "type": "string (e.g., PLAID, SWIFT, ACH)",
        "status": "string (e.g., ACTIVE, INACTIVE)",
        "last_authenticated": "string (ISO 8601 datetime)" (optional)
      }
    ],
    "health_status": {
      "integration_name": {
        "authenticated": "boolean",
        "last_check": "string (ISO 8601 datetime)",
        "status": "string (e.g., HEALTHY, DEGRADED, UNAVAILABLE)",
        "message": "string" (optional)
      }
    }
  }
  ```
- `500 Internal Server Error`: An unexpected error occurred.

### 2. Register a New Banking Integration

`POST /api/v1/banking/integrations`

Registers a new banking integration with the Flowlet system. This involves providing a name, type, and configuration details for the integration.

**Permissions**: None (requires internal authentication/authorization, typically for administrative or system-level access)

**Request Body**:

```json
{
  "name": "string" (required): A unique name for the integration (e.g., "Plaid_US", "Swift_EU").
  "type": "string" (required): The type of banking integration (e.g., "PLAID", "SWIFT", "ACH").
  "config": "object" (required): A JSON object containing configuration details specific to the integration type (e.g., API keys, client IDs, webhooks).
}
```

**Responses**:

- `201 Created`: Integration registered successfully.
  ```json
  {
    "success": true,
    "message": "Integration [name] registered successfully"
  }
  ```
- `400 Bad Request`: Missing required fields or invalid integration type.
- `500 Internal Server Error`: An unexpected error occurred.

### 3. Authenticate All Registered Integrations

`POST /api/v1/banking/integrations/authenticate`

Initiates the authentication process for all currently registered banking integrations. This endpoint is typically used to refresh tokens or re-establish connections.

**Permissions**: None (requires internal authentication/authorization)

**Responses**:

- `200 OK`: Authentication process initiated successfully.
  ```json
  {
    "success": true,
    "authentication_results": {
      "integration_name": "string (e.g., AUTHENTICATED, FAILED, SKIPPED)"
    }
  }
  ```
- `500 Internal Server Error`: An unexpected error occurred during authentication.

### 4. Get Accounts for a Customer

`GET /api/v1/banking/accounts/{customer_id}`

Retrieves all bank accounts associated with a specific customer across all integrated banking services. This provides a consolidated view of a user's financial holdings.

**Permissions**: None (requires internal authentication/authorization, or user-specific token)

**Path Parameters**:

- `customer_id` (string, required): The unique identifier of the customer.

**Responses**:

- `200 OK`: Successfully retrieved customer accounts.
  ```json
  {
    "success": true,
    "customer_id": "string",
    "accounts": {
      "integration_name": [
        {
          "account_id": "string",
          "account_number": "string",
          "routing_number": "string" (optional),
          "account_type": "string (e.g., CHECKING, SAVINGS, CREDIT_CARD)",
          "bank_name": "string",
          "currency": "string",
          "balance": "float",
          "available_balance": "float",
          "account_holder_name": "string",
          "iban": "string" (optional),
          "swift_code": "string" (optional)
        }
      ]
    }
  }
  ```
- `500 Internal Server Error`: An unexpected error occurred.

### 5. Get Transactions from Multiple Integrations

`POST /api/v1/banking/transactions`

Retrieves transaction history for specified accounts across multiple banking integrations within a given date range. This enables a comprehensive view of a user's financial activity.

**Permissions**: None (requires internal authentication/authorization, or user-specific token)

**Request Body**:

```json
{
  "account_mappings": {
    "integration_name": [
      "string" (account_id)
    ]
  } (required): A mapping of integration names to a list of account IDs for which to retrieve transactions.
  "start_date": "string (ISO 8601 datetime)" (optional): The start date for transaction retrieval.
  "end_date": "string (ISO 8601 datetime)" (optional): The end date for transaction retrieval.
  "limit": "integer" (optional): Maximum number of transactions to retrieve per account.
}
```

**Responses**:

- `200 OK`: Successfully retrieved transactions.
  ```json
  {
    "success": true,
    "transactions": {
      "integration_name": [
        {
          "transaction_id": "string",
          "account_id": "string",
          "amount": "float",
          "currency": "string",
          "transaction_type": "string (e.g., DEBIT, CREDIT)",
          "status": "string (e.g., COMPLETED, PENDING, FAILED)",
          "description": "string",
          "timestamp": "string (ISO 8601 datetime)",
          "reference_id": "string" (optional),
          "counterparty_account": "string" (optional),
          "counterparty_name": "string" (optional),
          "fees": "float" (optional),
          "exchange_rate": "float" (optional),
          "metadata": "object" (optional)
        }
      ]
    }
  }
  ```
- `400 Bad Request`: Missing required fields.
- `500 Internal Server Error`: An unexpected error occurred.

### 6. Initiate a Payment with Fallback

`POST /api/v1/banking/payments`

Initiates a payment through one of the integrated banking services. The system can attempt to process the payment through preferred integrations and fall back to others if necessary, ensuring high reliability.

**Permissions**: None (requires internal authentication/authorization, or user-specific token)

**Request Body**:

```json
{
  "amount": "float" (required): The amount of the payment.
  "currency": "string" (required): The currency of the payment (e.g., "USD", "EUR").
  "from_account": "string" (required): The account ID from which the payment will be made.
  "to_account": "string" (required): The destination account ID for the payment.
  "description": "string" (required): A description for the payment.
  "reference_id": "string" (optional): An optional reference ID for the payment.
  "scheduled_date": "string (ISO 8601 datetime)" (optional): The scheduled date for the payment.
  "metadata": "object" (optional): Additional metadata for the payment.
  "preferred_integrations": [
    "string" (integration_name)
  ] (optional): A list of preferred integrations to attempt payment through, in order of preference.
}
```

**Responses**:

- `201 Created`: Payment initiated successfully.
  ```json
  {
    "success": true,
    "transaction_id": "string",
    "integration_used": "string",
    "payment_request": {
      "amount": "float",
      "currency": "string",
      "from_account": "string",
      "to_account": "string",
      "description": "string",
      "reference_id": "string" (optional)
    }
  }
  ```
- `400 Bad Request`: Missing required fields or banking integration error.
- `500 Internal Server Error`: An unexpected error occurred.

### 7. Get Payment Status from Multiple Integrations

`POST /api/v1/banking/payments/status`

Retrieves the status of one or more payments across different banking integrations. This allows for real-time tracking of payment processing.

**Permissions**: None (requires internal authentication/authorization, or user-specific token)

**Request Body**:

```json
{
  "transaction_mappings": {
    "integration_name": [
      "string" (transaction_id)
    ]
  } (required): A mapping of integration names to a list of transaction IDs for which to retrieve status.
}
```

**Responses**:

- `200 OK`: Successfully retrieved payment status.
  ```json
  {
    "success": true,
    "payment_status": {
      "integration_name": "string (e.g., PENDING, COMPLETED, FAILED)"
    }
  }
  ```
- `400 Bad Request`: Missing required fields.
- `500 Internal Server Error`: An unexpected error occurred.

### 8. Health Check for Banking Integrations

`GET /api/v1/banking/health`

Provides a health check endpoint for all banking integrations, indicating their overall status and individual integration health.

**Permissions**: None (publicly accessible, or requires basic monitoring authentication)

**Responses**:

- `200 OK`: Successfully retrieved health status.
  ```json
  {
    "success": true,
    "overall_health": "string (e.g., healthy, degraded, unavailable)",
    "integrations": {
      "integration_name": {
        "authenticated": "boolean",
        "last_check": "string (ISO 8601 datetime)",
        "status": "string (e.g., HEALTHY, DEGRADED, UNAVAILABLE)",
        "message": "string" (optional)
      }
    },
    "timestamp": "string (ISO 8601 datetime)"
  }
  ```
- `500 Internal Server Error`: An unexpected error occurred during the health check.

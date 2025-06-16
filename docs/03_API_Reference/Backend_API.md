# Flowlet Backend API Documentation

This document provides a comprehensive reference for the Flowlet backend APIs, detailing available services, endpoints, request/response formats, and authentication requirements.

## Base URL

The base URL for all API endpoints is `/api/v1/`.

## Authentication

All API requests require authentication. Please refer to the `Auth Service` documentation for details on obtaining and using authentication tokens.

## Services and Endpoints

Flowlet's backend is structured around several microservices, each exposed via a dedicated API blueprint.

### Wallet Service

**URL Prefix**: `/api/v1/wallet`

Manages digital wallets, balances, and account operations.

- **`POST /`**: Create a new wallet.
  - **Request Body**: 
    ```json
    {
      "userId": "string",
      "currency": "string",
      "type": "string"
    }
    ```
  - **Response**: Wallet object.
- **`GET /{walletId}/balance`**: Get the balance of a specific wallet.
  - **Response**: Balance object.
- **`GET /{walletId}/transactions`**: Get transaction history for a wallet.
  - **Query Parameters**: `limit` (integer, optional), `offset` (integer, optional)
  - **Response**: List of transaction objects.

### Payment Service

**URL Prefix**: `/api/v1/payment`

Handles payment processing, transfers, and settlement.

- **`POST /`**: Create a new payment.
  - **Request Body**: 
    ```json
    {
      "fromWalletId": "string",
      "toWalletId": "string",
      "amount": "number",
      "currency": "string",
      "description": "string" (optional)
    }
    ```
  - **Response**: Payment object.
- **`GET /{paymentId}`**: Get the status of a specific payment.
  - **Response**: Payment object.

### Card Service

**URL Prefix**: `/api/v1/card`

Manages card issuance, controls, and transaction processing.

- **`POST /`**: Issue a new card.
  - **Request Body**: 
    ```json
    {
      "walletId": "string",
      "type": "string",
      "limits": {
        "daily": "number",
        "monthly": "number"
      }
    }
    ```
  - **Response**: Card object.
- **`PUT /{cardId}/controls`**: Update card controls.
  - **Request Body**: 
    ```json
    {
      "enabled": "boolean",
      "allowedMerchants": ["string"],
      "blockedCountries": ["string"]
    }
    ```
  - **Response**: Updated card object.

### KYC/AML Service

**URL Prefix**: `/api/v1/kyc`

Handles identity verification and compliance workflows.

- **`POST /verify`**: Submit a KYC/AML verification request.
  - **Request Body**: 
    ```json
    {
      "userId": "string",
      "documentType": "string",
      "documentId": "string"
    }
    ```
  - **Response**: Verification status object.
- **`GET /{userId}/status`**: Get the KYC/AML status for a user.
  - **Response**: KYC/AML status object.

### Ledger Service

**URL Prefix**: `/api/v1/ledger`

Maintains double-entry accounting and financial records.

- **`POST /transaction`**: Record a new ledger transaction.
  - **Request Body**: 
    ```json
    {
      "debitAccountId": "string",
      "creditAccountId": "string",
      "amount": "number",
      "currency": "string",
      "description": "string"
    }
    ```
  - **Response**: Ledger transaction object.
- **`GET /account/{accountId}/entries`**: Get ledger entries for a specific account.
  - **Response**: List of ledger entry objects.

### AI Service

**URL Prefix**: `/api/v1/ai`

Provides AI-powered fraud detection and chatbot functionalities.

- **`POST /fraud-detection`**: Submit a transaction for fraud detection.
  - **Request Body**: 
    ```json
    {
      "transactionId": "string",
      "amount": "number",
      "userId": "string"
    }
    ```
  - **Response**: Fraud detection result object.
- **`POST /chatbot`**: Interact with the AI chatbot.
  - **Request Body**: 
    ```json
    {
      "message": "string",
      "sessionId": "string" (optional)
    }
    ```
  - **Response**: Chatbot response object.

### Security Service

**URL Prefix**: `/api/v1/security`

Manages user authentication, authorization, and session handling.

- **`POST /login`**: Authenticate a user and obtain a token.
  - **Request Body**: 
    ```json
    {
      "email": "string",
      "password": "string"
    }
    ```
  - **Response**: Authentication token object.
- **`POST /register`**: Register a new user.
  - **Request Body**: 
    ```json
    {
      "email": "string",
      "password": "string",
      "username": "string"
    }
    ```
  - **Response**: User object.
- **`POST /logout`**: Invalidate a user's session.
  - **Response**: Success message.

### API Gateway Service

**URL Prefix**: `/api/v1/gateway`

Provides a unified API access point, authentication, and rate limiting for all Flowlet services.

- **`GET /health`**: Check the health status of the API Gateway.
  - **Response**: Health status object.

## Error Handling

API errors are returned with appropriate HTTP status codes and a JSON error body:

```json
{
  "error": "string",
  "message": "string"
}
```

Common error codes include:

- `400 Bad Request`: Invalid request payload or parameters.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Insufficient permissions to access the resource.
- `404 Not Found`: The requested resource does not exist.
- `500 Internal Server Error`: An unexpected error occurred on the server.



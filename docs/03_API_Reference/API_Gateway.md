
# API Gateway Documentation

The API Gateway acts as the central entry point for all Flowlet services, providing a unified interface, routing requests to the appropriate microservices, and offering features like status monitoring and centralized documentation.

## Base URL

`/api/v1/gateway`

## Endpoints

### 1. Get API Gateway Status and Health Information

`GET /api/v1/gateway/status`

Retrieves the operational status and health of the API Gateway and its underlying services.

#### Example Request

```
GET /api/v1/gateway/status
```

#### Example Success Response (200 OK)

```json
{
    "gateway_status": "operational",
    "version": "1.0.0",
    "uptime": "99.9%",
    "services": {
        "wallet_service": "healthy",
        "payment_service": "healthy",
        "card_service": "healthy",
        "kyc_aml_service": "healthy",
        "ledger_service": "healthy",
        "ai_service": "healthy",
        "security_service": "healthy"
    },
    "rate_limits": {
        "default": "1000 requests/hour",
        "burst": "100 requests/minute"
    },
    "timestamp": "2024-01-20T09:00:00.000Z"
}
```

#### Example Error Response (500 Internal Server Error)

```json
{
    "error": "Failed to retrieve gateway status"
}
```

### 2. Get Comprehensive API Documentation

`GET /api/v1/gateway/documentation`

Provides a comprehensive, machine-readable documentation of all available Flowlet APIs, their endpoints, parameters, and expected responses.

#### Example Request

```
GET /api/v1/gateway/documentation
```

#### Example Success Response (200 OK)

```json
{
    "api_version": "1.0.0",
    "base_url": "https://api.flowlet.com/v1",
    "authentication": {
        "type": "Bearer Token",
        "header": "Authorization: Bearer YOUR_API_KEY",
        "description": "All API requests require a valid API key"
    },
    "services": {
        "wallet_service": {
            "base_path": "/api/v1/wallet",
            "description": "Digital wallet management and operations",
            "endpoints": [
                {
                    "method": "POST",
                    "path": "/create",
                    "description": "Create a new wallet",
                    "parameters": {
                        "user_id": "string (required)",
                        "wallet_type": "string (required) - user, business, escrow, operating",
                        "currency": "string (required) - USD, EUR, GBP, etc."
                    }
                }
                // ... other wallet endpoints
            ]
        },
        "payment_service": {
            "base_path": "/api/v1/payment",
            "description": "Payment processing and transaction management",
            "endpoints": [
                {
                    "method": "POST",
                    "path": "/deposit",
                    "description": "Deposit funds into a wallet",
                    "parameters": {
                        "wallet_id": "string (required)",
                        "amount": "decimal (required)",
                        "payment_method": "string (required)",
                        "description": "string (required)"
                    }
                }
                // ... other payment endpoints
            ]
        },
        "card_service": {
            "base_path": "/api/v1/card",
            "description": "Card issuance and management",
            "endpoints": [
                {
                    "method": "POST",
                    "path": "/issue",
                    "description": "Issue a new virtual or physical card",
                    "parameters": {
                        "wallet_id": "string (required)",
                        "card_type": "string (required) - virtual, physical"
                    }
                }
                // ... other card endpoints
            ]
        },
        "kyc_service": {
            "base_path": "/api/v1/kyc",
            "description": "KYC/AML compliance and user verification",
            "endpoints": [
                {
                    "method": "POST",
                    "path": "/user/create",
                    "description": "Create a new user",
                    "parameters": {
                        "email": "string (required)",
                        "first_name": "string (required)",
                        "last_name": "string (required)"
                    }
                }
                // ... other KYC endpoints
            ]
        },
        "ledger_service": {
            "base_path": "/api/v1/ledger",
            "description": "Double-entry ledger and financial reporting",
            "endpoints": [
                {
                    "method": "GET",
                    "path": "/entries",
                    "description": "Get ledger entries with filtering"
                }
                // ... other ledger endpoints
            ]
        },
        "ai_service": {
            "base_path": "/api/v1/ai",
            "description": "AI-powered fraud detection and analytics",
            "endpoints": [
                {
                    "method": "POST",
                    "path": "/fraud-detection/analyze",
                    "description": "Analyze transaction for fraud"
                }
                // ... other AI service endpoints
            ]
        },
        "security_service": {
            "base_path": "/api/v1/security",
            "description": "Security, authentication, and audit services",
            "endpoints": [
                {
                    "method": "POST",
                    "path": "/api-keys/create",
                    "description": "Create a new API key"
                }
                // ... other security endpoints
            ]
        }
    },
    "response_formats": {
        "success": {
            "status_code": "200-299",
            "content_type": "application/json",
            "structure": "Varies by endpoint"
        },
        "error": {
            "status_code": "400-599",
            "content_type": "application/json",
            "structure": {
                "error": "string - Error description"
            }
        }
    },
    "rate_limiting": {
        "default_limit": "1000 requests per hour",
        "burst_limit": "100 requests per minute",
        "headers": [
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset"
        ]
    },
    "webhooks": {
        "description": "Real-time event notifications",
        "events": [
            "transaction.completed",
            "card.transaction",
            "kyc.status_changed",
            "fraud.alert"
        ]
    }
}
```

#### Example Error Response (500 Internal Server Error)

```json
{
    "error": "Failed to generate documentation"
}
```

import json
from datetime import datetime

from flask import Blueprint, jsonify, request

api_gateway_bp = Blueprint("api_gateway", __name__)


@api_gateway_bp.route("/status", methods=["GET"])
def gateway_status():
    """Get API Gateway status and health information"""
    try:
        return (
            jsonify(
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
                        "security_service": "healthy",
                    },
                    "rate_limits": {
                        "default": "1000 requests/hour",
                        "burst": "100 requests/minute",
                    },
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_gateway_bp.route("/documentation", methods=["GET"])
def api_documentation():
    """Get comprehensive API documentation"""
    try:
        documentation = {
            "api_version": "1.0.0",
            "base_url": "https://api.flowlet.com/v1",
            "authentication": {
                "type": "Bearer Token",
                "header": "Authorization: Bearer YOUR_API_KEY",
                "description": "All API requests require a valid API key",
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
                                "currency": "string (required) - USD, EUR, GBP, etc.",
                            },
                        },
                        {
                            "method": "GET",
                            "path": "/{wallet_id}",
                            "description": "Get wallet details",
                            "parameters": {
                                "wallet_id": "string (required) - Wallet ID"
                            },
                        },
                        {
                            "method": "GET",
                            "path": "/{wallet_id}/balance",
                            "description": "Get current wallet balance",
                            "parameters": {
                                "wallet_id": "string (required) - Wallet ID"
                            },
                        },
                        {
                            "method": "GET",
                            "path": "/{wallet_id}/transactions",
                            "description": "Get wallet transaction history",
                            "parameters": {
                                "wallet_id": "string (required) - Wallet ID",
                                "page": "integer (optional) - Page number",
                                "per_page": "integer (optional) - Items per page",
                            },
                        },
                        {
                            "method": "POST",
                            "path": "/{wallet_id}/transfer",
                            "description": "Transfer funds between wallets",
                            "parameters": {
                                "to_wallet_id": "string (required)",
                                "amount": "decimal (required)",
                                "description": "string (required)",
                            },
                        },
                    ],
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
                                "description": "string (required)",
                            },
                        },
                        {
                            "method": "POST",
                            "path": "/withdraw",
                            "description": "Withdraw funds from a wallet",
                            "parameters": {
                                "wallet_id": "string (required)",
                                "amount": "decimal (required)",
                                "payment_method": "string (required)",
                                "description": "string (required)",
                            },
                        },
                        {
                            "method": "POST",
                            "path": "/bank-transfer",
                            "description": "Process bank transfer (ACH, SEPA, Wire)",
                            "parameters": {
                                "wallet_id": "string (required)",
                                "amount": "decimal (required)",
                                "transfer_type": "string (required) - ACH, SEPA, WIRE",
                                "bank_details": "object (required)",
                                "description": "string (required)",
                            },
                        },
                        {
                            "method": "POST",
                            "path": "/card-payment",
                            "description": "Process card payment",
                            "parameters": {
                                "wallet_id": "string (required)",
                                "amount": "decimal (required)",
                                "card_token": "string (required)",
                                "merchant_info": "object (required)",
                                "description": "string (required)",
                            },
                        },
                    ],
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
                                "card_type": "string (required) - virtual, physical",
                                "daily_limit": "decimal (optional)",
                                "monthly_limit": "decimal (optional)",
                            },
                        },
                        {
                            "method": "GET",
                            "path": "/{card_id}",
                            "description": "Get card details",
                            "parameters": {"card_id": "string (required) - Card ID"},
                        },
                        {
                            "method": "POST",
                            "path": "/{card_id}/freeze",
                            "description": "Freeze/block a card",
                            "parameters": {"card_id": "string (required) - Card ID"},
                        },
                        {
                            "method": "PUT",
                            "path": "/{card_id}/limits",
                            "description": "Update card spending limits",
                            "parameters": {
                                "daily_limit": "decimal (optional)",
                                "monthly_limit": "decimal (optional)",
                            },
                        },
                    ],
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
                                "last_name": "string (required)",
                                "phone": "string (optional)",
                                "date_of_birth": "string (optional) - YYYY-MM-DD",
                                "address": "string (optional)",
                            },
                        },
                        {
                            "method": "POST",
                            "path": "/verification/start",
                            "description": "Start KYC verification process",
                            "parameters": {
                                "user_id": "string (required)",
                                "verification_level": "string (required) - basic, enhanced, premium",
                            },
                        },
                        {
                            "method": "POST",
                            "path": "/verification/{verification_id}/document",
                            "description": "Submit identity document",
                            "parameters": {
                                "document_type": "string (required) - passport, drivers_license, national_id",
                                "document_number": "string (required)",
                            },
                        },
                    ],
                },
                "ledger_service": {
                    "base_path": "/api/v1/ledger",
                    "description": "Double-entry ledger and financial reporting",
                    "endpoints": [
                        {
                            "method": "GET",
                            "path": "/entries",
                            "description": "Get ledger entries with filtering",
                            "parameters": {
                                "account_type": "string (optional)",
                                "currency": "string (optional)",
                                "start_date": "string (optional) - YYYY-MM-DD",
                                "end_date": "string (optional) - YYYY-MM-DD",
                            },
                        },
                        {
                            "method": "GET",
                            "path": "/trial-balance",
                            "description": "Generate trial balance report",
                            "parameters": {
                                "as_of_date": "string (optional) - YYYY-MM-DD",
                                "currency": "string (optional)",
                            },
                        },
                        {
                            "method": "GET",
                            "path": "/balance-sheet",
                            "description": "Generate balance sheet report",
                            "parameters": {
                                "as_of_date": "string (optional) - YYYY-MM-DD",
                                "currency": "string (optional)",
                            },
                        },
                    ],
                },
                "ai_service": {
                    "base_path": "/api/v1/ai",
                    "description": "AI-powered fraud detection and analytics",
                    "endpoints": [
                        {
                            "method": "POST",
                            "path": "/fraud-detection/analyze",
                            "description": "Analyze transaction for fraud",
                            "parameters": {
                                "transaction_id": "string (required)",
                                "user_id": "string (required)",
                                "amount": "decimal (required)",
                                "merchant_info": "object (required)",
                            },
                        },
                        {
                            "method": "POST",
                            "path": "/chatbot/query",
                            "description": "AI chatbot for support",
                            "parameters": {
                                "query": "string (required)",
                                "context": "string (optional) - general, developer, user",
                            },
                        },
                    ],
                },
                "security_service": {
                    "base_path": "/api/v1/security",
                    "description": "Security, authentication, and audit services",
                    "endpoints": [
                        {
                            "method": "POST",
                            "path": "/api-keys/create",
                            "description": "Create a new API key",
                            "parameters": {
                                "key_name": "string (required)",
                                "permissions": "array (optional)",
                                "rate_limit": "integer (optional)",
                                "expires_in_days": "integer (optional)",
                            },
                        },
                        {
                            "method": "GET",
                            "path": "/audit-logs",
                            "description": "Get audit logs",
                            "parameters": {
                                "user_id": "string (optional)",
                                "action": "string (optional)",
                                "start_date": "string (optional) - YYYY-MM-DD",
                            },
                        },
                    ],
                },
            },
            "response_formats": {
                "success": {
                    "status_code": "200-299",
                    "content_type": "application/json",
                    "structure": "Varies by endpoint",
                },
                "error": {
                    "status_code": "400-599",
                    "content_type": "application/json",
                    "structure": {"error": "string - Error description"},
                },
            },
            "rate_limiting": {
                "default_limit": "1000 requests per hour",
                "burst_limit": "100 requests per minute",
                "headers": [
                    "X-RateLimit-Limit",
                    "X-RateLimit-Remaining",
                    "X-RateLimit-Reset",
                ],
            },
            "webhooks": {
                "description": "Real-time event notifications",
                "events": [
                    "transaction.completed",
                    "transaction.failed",
                    "card.transaction",
                    "kyc.status_changed",
                    "fraud.alert_created",
                ],
                "configuration": "Configure webhook URLs in developer portal",
            },
        }

        return jsonify(documentation), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_gateway_bp.route("/sdk-info", methods=["GET"])
def sdk_information():
    """Get information about available SDKs"""
    try:
        sdk_info = {
            "available_sdks": {
                "python": {
                    "version": "1.0.0",
                    "installation": "pip install flowlet-python-sdk",
                    "documentation": "https://docs.flowlet.com/sdks/python",
                    "github": "https://github.com/flowlet/python-sdk",
                    "features": [
                        "Full API coverage",
                        "Async/await support",
                        "Built-in retry logic",
                        "Type hints",
                        "Comprehensive error handling",
                    ],
                },
                "javascript": {
                    "version": "1.0.0",
                    "installation": "npm install @flowlet/sdk",
                    "documentation": "https://docs.flowlet.com/sdks/javascript",
                    "github": "https://github.com/flowlet/javascript-sdk",
                    "features": [
                        "Node.js and browser support",
                        "Promise-based API",
                        "TypeScript definitions",
                        "Webhook verification",
                        "Rate limit handling",
                    ],
                },
                "php": {
                    "version": "1.0.0",
                    "installation": "composer require flowlet/php-sdk",
                    "documentation": "https://docs.flowlet.com/sdks/php",
                    "github": "https://github.com/flowlet/php-sdk",
                    "features": [
                        "PSR-4 compliant",
                        "Guzzle HTTP client",
                        "Laravel integration",
                        "Comprehensive documentation",
                        "Unit tests included",
                    ],
                },
                "java": {
                    "version": "1.0.0",
                    "installation": "Maven/Gradle dependency",
                    "documentation": "https://docs.flowlet.com/sdks/java",
                    "github": "https://github.com/flowlet/java-sdk",
                    "features": [
                        "Spring Boot integration",
                        "Reactive programming support",
                        "Jackson JSON processing",
                        "Comprehensive logging",
                        "Thread-safe operations",
                    ],
                },
                "go": {
                    "version": "1.0.0",
                    "installation": "go get github.com/flowlet/go-sdk",
                    "documentation": "https://docs.flowlet.com/sdks/go",
                    "github": "https://github.com/flowlet/go-sdk",
                    "features": [
                        "Idiomatic Go code",
                        "Context support",
                        "Structured logging",
                        "Comprehensive error types",
                        "High performance",
                    ],
                },
            },
            "code_examples": {
                "python": {
                    "initialization": """
import flowlet

client = flowlet.Client(api_key="your_api_key")
""",
                    "create_wallet": """
wallet = client.wallets.create(
    user_id="user_123",
    wallet_type="user",
    currency="USD"
)
""",
                    "process_payment": """
payment = client.payments.deposit(
    wallet_id=wallet.id,
    amount=100.00,
    payment_method="bank_transfer",
    description="Initial deposit"
)
""",
                },
                "javascript": {
                    "initialization": """
const Flowlet = require('@flowlet/sdk');

const client = new Flowlet({
  apiKey: 'your_api_key'
});
""",
                    "create_wallet": """
const wallet = await client.wallets.create({
  userId: 'user_123',
  walletType: 'user',
  currency: 'USD'
});
""",
                    "process_payment": """
const payment = await client.payments.deposit({
  walletId: wallet.id,
  amount: 100.00,
  paymentMethod: 'bank_transfer',
  description: 'Initial deposit'
});
""",
                },
            },
            "getting_started": {
                "steps": [
                    "Sign up for a Flowlet developer account",
                    "Generate API keys in the developer portal",
                    "Install the SDK for your preferred language",
                    "Initialize the client with your API key",
                    "Start building with the sandbox environment",
                    "Test your integration thoroughly",
                    "Switch to production when ready",
                ],
                "sandbox_url": "https://sandbox.flowlet.com",
                "production_url": "https://api.flowlet.com",
            },
        }

        return jsonify(sdk_info), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_gateway_bp.route("/developer-portal", methods=["GET"])
def developer_portal_info():
    """Get information about the developer portal"""
    try:
        portal_info = {
            "developer_portal": {
                "url": "https://developers.flowlet.com",
                "features": [
                    "Interactive API documentation",
                    "API key management",
                    "Webhook configuration",
                    "Usage analytics and monitoring",
                    "Sandbox environment access",
                    "Code examples and tutorials",
                    "Community forum access",
                    "Support ticket system",
                ],
                "getting_started": {
                    "registration": "https://developers.flowlet.com/signup",
                    "documentation": "https://docs.flowlet.com",
                    "tutorials": "https://developers.flowlet.com/tutorials",
                    "api_reference": "https://docs.flowlet.com/api",
                },
                "support_channels": {
                    "documentation": "https://docs.flowlet.com",
                    "community_forum": "https://community.flowlet.com",
                    "support_email": "support@flowlet.com",
                    "status_page": "https://status.flowlet.com",
                    "github": "https://github.com/flowlet",
                },
            },
            "sandbox_environment": {
                "description": "Full-featured testing environment",
                "base_url": "https://sandbox-api.flowlet.com/v1",
                "features": [
                    "All API endpoints available",
                    "Test data and mock responses",
                    "No real money transactions",
                    "Unlimited testing",
                    "Data reset capabilities",
                    "Webhook testing",
                ],
                "test_data": {
                    "test_cards": [
                        "4111111111111111 (Visa)",
                        "5555555555554444 (Mastercard)",
                        "378282246310005 (American Express)",
                    ],
                    "test_bank_accounts": [
                        "Routing: 110000000, Account: 000123456789",
                        "IBAN: GB29 NWBK 6016 1331 9268 19",
                    ],
                },
            },
            "api_explorer": {
                "description": "Interactive API testing tool",
                "url": "https://developers.flowlet.com/api-explorer",
                "features": [
                    "Test API endpoints directly",
                    "Real-time request/response viewing",
                    "Authentication handling",
                    "Parameter validation",
                    "Code generation for multiple languages",
                ],
            },
        }

        return jsonify(portal_info), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_gateway_bp.route("/webhooks/info", methods=["GET"])
def webhook_information():
    """Get information about webhook configuration and events"""
    try:
        webhook_info = {
            "webhooks": {
                "description": "Real-time event notifications sent to your application",
                "configuration": "Configure webhook URLs in the developer portal",
                "security": "All webhooks are signed with HMAC-SHA256",
                "retry_policy": "Failed webhooks are retried with exponential backoff",
                "timeout": "30 seconds maximum response time",
            },
            "available_events": {
                "wallet_events": [
                    "wallet.created",
                    "wallet.balance_updated",
                    "wallet.frozen",
                    "wallet.unfrozen",
                ],
                "transaction_events": [
                    "transaction.created",
                    "transaction.completed",
                    "transaction.failed",
                    "transaction.cancelled",
                ],
                "payment_events": [
                    "payment.deposit_completed",
                    "payment.withdrawal_completed",
                    "payment.bank_transfer_completed",
                    "payment.card_payment_completed",
                ],
                "card_events": [
                    "card.issued",
                    "card.activated",
                    "card.frozen",
                    "card.transaction",
                    "card.declined",
                ],
                "kyc_events": [
                    "kyc.verification_started",
                    "kyc.verification_completed",
                    "kyc.verification_failed",
                    "kyc.document_submitted",
                ],
                "fraud_events": [
                    "fraud.alert_created",
                    "fraud.alert_resolved",
                    "fraud.transaction_blocked",
                ],
            },
            "webhook_payload_example": {
                "id": "evt_1234567890",
                "type": "transaction.completed",
                "created": "2024-01-15T10:30:00Z",
                "data": {
                    "object": {
                        "id": "txn_abcdef123456",
                        "wallet_id": "wal_xyz789",
                        "amount": "100.00",
                        "currency": "USD",
                        "status": "completed",
                        "type": "credit",
                    }
                },
                "livemode": False,
            },
            "verification": {
                "header_name": "Flowlet-Signature",
                "algorithm": "HMAC-SHA256",
                "example_verification": """
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)
""",
            },
        }

        return jsonify(webhook_info), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_gateway_bp.route("/rate-limits", methods=["GET"])
def rate_limit_info():
    """Get information about API rate limits"""
    try:
        rate_limit_info = {
            "rate_limits": {
                "default": {
                    "requests_per_hour": 1000,
                    "burst_limit": 100,
                    "window": "1 hour rolling window",
                },
                "premium": {
                    "requests_per_hour": 10000,
                    "burst_limit": 500,
                    "window": "1 hour rolling window",
                },
                "enterprise": {
                    "requests_per_hour": "unlimited",
                    "burst_limit": 1000,
                    "custom_limits": "Available upon request",
                },
            },
            "headers": {
                "X-RateLimit-Limit": "Total requests allowed in current window",
                "X-RateLimit-Remaining": "Requests remaining in current window",
                "X-RateLimit-Reset": "Unix timestamp when window resets",
                "X-RateLimit-Retry-After": "Seconds to wait before retrying (when rate limited)",
            },
            "rate_limit_exceeded_response": {
                "status_code": 429,
                "response": {
                    "error": "Rate limit exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": 3600,
                },
            },
            "best_practices": [
                "Implement exponential backoff for retries",
                "Cache responses when possible",
                "Use webhooks instead of polling",
                "Batch operations when available",
                "Monitor rate limit headers",
                "Upgrade plan for higher limits",
            ],
        }

        return jsonify(rate_limit_info), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

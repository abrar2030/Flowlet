from typing import Any
import logging
from datetime import datetime, timezone
from flask import Blueprint, jsonify

"\nAPI Gateway Routes for Health Check and Documentation\n"
api_gateway_bp = Blueprint("api_gateway", __name__, url_prefix="/api/v1")
logger = logging.getLogger(__name__)


@api_gateway_bp.route("/status", methods=["GET"])
def gateway_status() -> Any:
    """Get API Gateway status and health information"""
    try:
        health_status = {
            "database": "healthy",
            "redis": "healthy",
            "openai_service": "healthy",
            "payment_integrations": "partial_health",
        }
        overall_status = (
            "operational"
            if all((s == "healthy" for s in health_status.values()))
            else "degraded"
        )
        return (
            jsonify(
                {
                    "gateway_status": overall_status,
                    "version": "1.0.0",
                    "environment": "development",
                    "services_health": health_status,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }
            ),
            200,
        )
    except Exception as e:
        logger.error(f"Gateway status check error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "Internal server error during status check",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


@api_gateway_bp.route("/documentation", methods=["GET"])
def api_documentation() -> Any:
    """Provides a high-level overview of the API structure."""
    return (
        jsonify(
            {
                "message": "API Documentation is available via the /swagger-ui endpoint (if configured) or by consulting the source code.",
                "api_structure": {
                    "/v1/auth": "User authentication and token management",
                    "/v1/users": "User profile management",
                    "/v1/accounts": "Account (Wallet) management and transactions",
                    "/v1/cards": "Card issuance and management",
                    "/v1/payments": "External payment processing (Deposit/Withdrawal)",
                    "/v1/ai": "AI services (Fraud Detection, Chatbot)",
                    "/v1/analytics": "Financial analytics and reporting",
                    "/v1/kyc": "KYC/AML compliance (Placeholder)",
                    "/v1/ledger": "Ledger and Audit Log access (Admin only)",
                    "/v1/status": "API Gateway health check",
                },
                "authentication": "Bearer Token (JWT) required for most endpoints.",
            }
        ),
        200,
    )

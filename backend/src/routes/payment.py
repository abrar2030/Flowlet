"""
Payment Processing Routes
"""

from flask import Blueprint, request, jsonify, g
from sqlalchemy.exc import IntegrityError
from decimal import Decimal
import uuid
from datetime import datetime, timezone
import logging

# Import refactored modules
from ..models.database import db
from ..models.account import Account, AccountStatus
from ..models.transaction import (
    Transaction,
    TransactionType,
    TransactionStatus,
    TransactionCategory,
)
from ..security.audit_logger import audit_logger
from ..models.audit_log import AuditEventType, AuditSeverity
from ..utils.validators import InputValidator
from ..integrations.payments.payment_factory import PaymentFactory
from .auth import token_required  # Assuming decorators are defined here for now

# Create blueprint
payments_bp = Blueprint("payments", __name__, url_prefix="/api/v1/payments")

# Configure logging
logger = logging.getLogger(__name__)


@payments_bp.route("/process", methods=["POST"])
@token_required
def process_payment():
    """
    Process an external payment (deposit) into a user's account.
    This acts as a wrapper around the PaymentFactory.
    """
    try:
        data = request.get_json()
        if not data:
            return (
                jsonify(
                    {
                        "error": "Request body must contain valid JSON",
                        "code": "INVALID_JSON",
                    }
                ),
                400,
            )

        required_fields = [
            "account_id",
            "amount",
            "currency",
            "payment_method",
            "payment_details",
        ]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return (
                jsonify(
                    {
                        "error": f'Missing required fields: {", ".join(missing_fields)}',
                        "code": "MISSING_FIELDS",
                    }
                ),
                400,
            )

        account_id = data["account_id"]
        amount_str = data["amount"]
        currency = data["currency"]
        payment_method = data["payment_method"]
        payment_details = data["payment_details"]

        # Validate account
        account = db.session.get(Account, account_id)
        if not account or account.user_id != g.current_user.id:
            return (
                jsonify(
                    {
                        "error": "Account not found or access denied",
                        "code": "ACCOUNT_ACCESS_DENIED",
                    }
                ),
                403,
            )

        # Validate amount
        is_valid, message, amount = InputValidator.validate_amount(amount_str)
        if not is_valid or amount <= 0:
            return jsonify({"error": message, "code": "INVALID_AMOUNT"}), 400

        # Get payment processor
        try:
            processor = PaymentFactory.get_processor(payment_method)
        except ValueError as e:
            return jsonify({"error": str(e), "code": "UNSUPPORTED_PAYMENT_METHOD"}), 400

        # Process payment
        result = processor.process_payment(
            account_id=account_id,
            amount=amount,
            currency=currency,
            payment_details=payment_details,
            description=data.get("description", f"Payment via {payment_method}"),
        )

        # Log the event
        audit_logger.log_event(
            event_type=AuditEventType.TRANSACTION_INITIATED,
            description=f"External payment initiated via {payment_method}",
            user_id=g.current_user.id,
            severity=AuditSeverity.MEDIUM,
            details={
                "account_id": account_id,
                "amount": float(amount),
                "status": result.get("status"),
            },
        )

        return jsonify(result), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Process payment error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during payment processing",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


@payments_bp.route("/webhook/<processor_name>", methods=["POST"])
def payment_webhook(processor_name):
    """
    Webhook endpoint for payment processors to notify of transaction status updates.
    """
    try:
        # Get processor
        try:
            processor = PaymentFactory.get_processor(processor_name)
        except ValueError:
            return (
                jsonify(
                    {"error": "Invalid processor name", "code": "INVALID_PROCESSOR"}
                ),
                404,
            )

        # Handle webhook
        response, status_code = processor.handle_webhook(request)

        # Log the event
        audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_EVENT,
            description=f"Webhook received from {processor_name}",
            severity=AuditSeverity.LOW,
            details={"status_code": status_code, "response": response},
        )

        return response, status_code

    except Exception as e:
        logger.error(
            f"Payment webhook error for {processor_name}: {str(e)}", exc_info=True
        )
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


@payments_bp.route("/transaction/<transaction_id>", methods=["GET"])
@token_required
def get_transaction_details(transaction_id):
    """Get details for a specific transaction"""
    try:
        transaction = db.session.get(Transaction, transaction_id)
        if not transaction:
            return (
                jsonify(
                    {"error": "Transaction not found", "code": "TRANSACTION_NOT_FOUND"}
                ),
                404,
            )

        # Check ownership
        if transaction.user_id != g.current_user.id and not g.current_user.is_admin:
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        return jsonify(transaction.to_dict()), 200

    except Exception as e:
        logger.error(f"Get transaction details error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "Failed to retrieve transaction details",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )

from typing import Any
import logging
from flask import Blueprint, g, jsonify, request
from pydantic import ValidationError
from ..models.audit_log import AuditEventType, AuditSeverity
from ..models.database import db
from ..utils.auth import token_required
from ..utils.audit import audit_logger
from ..services.payment_service import process_external_payment, get_transaction_details
from ..services.payment_service_errors import PaymentServiceError
from ..schemas import ProcessPaymentRequest
from ..error_handlers import (
    handle_validation_error,
    handle_wallet_service_error,
    handle_generic_exception,
)

payment_bp = Blueprint("payments", __name__, url_prefix="/api/v1/payments")
logger = logging.getLogger(__name__)


@payment_bp.route("/process", methods=["POST"])
@token_required
def process_payment() -> Any:
    """
    Process an external payment (deposit) into a user's account.
    """
    try:
        data = request.get_json()
        payment_request = ProcessPaymentRequest(**data or {})
        user_id = g.current_user.id
        result = process_external_payment(db.session, user_id, payment_request)
        audit_logger.log_event(
            event_type=AuditEventType.TRANSACTION_COMPLETED,
            description=f"External payment of {payment_request.amount} {payment_request.currency} processed via {payment_request.payment_method}",
            user_id=user_id,
            severity=AuditSeverity.MEDIUM,
            details={
                "account_id": payment_request.account_id,
                "amount": float(payment_request.amount),
                "status": result.get("status"),
                "transaction_id": result.get("transaction_id"),
            },
        )
        return (jsonify(result), 200)
    except ValidationError as e:
        return handle_validation_error(e)
    except PaymentServiceError as e:
        db.session.rollback()
        return handle_wallet_service_error(e)
    except Exception as e:
        db.session.rollback()
        return handle_generic_exception(e)


@payment_bp.route("/webhook/<processor_name>", methods=["POST"])
def payment_webhook(processor_name: Any) -> Any:
    """
    Webhook endpoint for payment processors to notify of transaction status updates.
    NOTE: This is a placeholder. A real implementation would require a dedicated webhook handler
    that verifies the signature and processes the event.
    """
    try:
        logger.info(
            f"Webhook received from {processor_name}. Payload: {request.get_data(as_text=True)}"
        )
        audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_EVENT,
            description=f"Webhook received from {processor_name}",
            severity=AuditSeverity.LOW,
            details={
                "processor": processor_name,
                "data_length": len(request.get_data()),
            },
        )
        return (jsonify({"status": "received", "processor": processor_name}), 200)
    except Exception as e:
        logger.error(
            f"Payment webhook error for {processor_name}: {str(e)}", exc_info=True
        )
        return handle_generic_exception(e)


@payment_bp.route("/transaction/<transaction_id>", methods=["GET"])
@token_required
def get_transaction_details_route(transaction_id: Any) -> Any:
    """Get details for a specific transaction"""
    try:
        user_id = g.current_user.id
        transaction = get_transaction_details(db.session, user_id, transaction_id)
        return (jsonify(transaction.to_dict()), 200)
    except PaymentServiceError as e:
        return handle_wallet_service_error(e)
    except Exception as e:
        return handle_generic_exception(e)

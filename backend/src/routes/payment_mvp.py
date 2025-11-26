import logging
from datetime import datetime
from functools import wraps

from flask import Blueprint, g, jsonify, request
from pydantic import ValidationError

from ..models.account import Account
from ..models.database import db
from ..models.transaction import Transaction as EnhancedTransaction
from ..models.transaction import (
    TransactionCategory,
    TransactionType,
)
from ..utils.auth import token_required

from ..services.payment_service import (
    process_internal_transfer,
    send_payment,
    create_payment_request,
)
from ..services.payment_service_errors import PaymentServiceError
from ..schemas import (
    InternalTransferRequest,
    SendPaymentRequest,
    PaymentRequestCreate,
)
from ..error_handlers import (
    handle_validation_error,
    handle_wallet_service_error,
    handle_generic_exception,
)

# Create blueprint
payment_mvp_bp = Blueprint("payment_mvp", __name__, url_prefix="/api/v1/payment")

# Configure logging
logger = logging.getLogger(__name__)

# Re-using handle_wallet_service_error for PaymentServiceError as they share the same base class


# --- Helper function for wallet access (similar to wallet.py's decorator) ---
def wallet_access_required(f):
    """Decorator to ensure user has access to the wallet"""

    @wraps(f)
    @token_required
    def decorated(wallet_id, *args, **kwargs):
        account = db.session.get(Account, wallet_id)
        if not account:
            return (
                jsonify({"error": "Wallet not found", "code": "WALLET_NOT_FOUND"}),
                404,
            )

        # Check if user owns the account or is admin
        if account.user_id != g.current_user.id and not getattr(
            g.current_user, "is_admin", False
        ):
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        g.account = account
        return f(wallet_id, *args, **kwargs)

    return decorated


@payment_mvp_bp.route("/transfer", methods=["POST"])
@token_required
def transfer_funds():
    """
    Transfer funds between wallets
    """
    try:
        data = request.get_json()
        transfer_request = InternalTransferRequest(**(data or {}))

        # Check if the authenticated user owns the source wallet
        source_account = db.session.get(Account, transfer_request.from_wallet_id)
        if not source_account or source_account.user_id != g.current_user.id:
            return (
                jsonify(
                    {
                        "error": "Source wallet not found or access denied",
                        "code": "ACCOUNT_ACCESS_DENIED",
                    }
                ),
                403,
            )

        debit_transaction, credit_transaction = process_internal_transfer(
            db.session, transfer_request
        )

        # Fetch accounts again to get updated balances
        from_account = db.session.get(Account, transfer_request.from_wallet_id)
        to_account = db.session.get(Account, transfer_request.to_wallet_id)

        return (
            jsonify(
                {
                    "success": True,
                    "transfer_reference": debit_transaction.reference_number,
                    "from_wallet": {
                        "wallet_id": str(from_account.id),
                        "account_name": from_account.account_name,
                        "new_balance": float(
                            from_account.get_available_balance_decimal()
                        ),
                    },
                    "to_wallet": {
                        "wallet_id": str(to_account.id),
                        "account_name": to_account.account_name,
                        "new_balance": float(
                            to_account.get_available_balance_decimal()
                        ),
                    },
                    "transfer_details": {
                        "amount": float(transfer_request.amount),
                        "currency": from_account.currency,
                        "description": transfer_request.description,
                        "processed_at": debit_transaction.processed_at.isoformat(),
                    },
                    "transactions": {
                        "debit_transaction_id": str(debit_transaction.id),
                        "credit_transaction_id": str(credit_transaction.id),
                    },
                    "message": "Transfer completed successfully",
                }
            ),
            200,
        )

    except ValidationError as e:
        return handle_validation_error(e)
    except PaymentServiceError as e:
        db.session.rollback()
        return handle_wallet_service_error(e)
    except Exception as e:
        db.session.rollback()
        return handle_generic_exception(e)


@payment_mvp_bp.route("/send", methods=["POST"])
@token_required
def send_payment_route():
    """
    Send payment to a recipient (by email, phone, or account number)
    """
    try:
        data = request.get_json()
        send_request = SendPaymentRequest(**(data or {}))

        # Check if the authenticated user owns the source wallet
        source_account = db.session.get(Account, send_request.from_wallet_id)
        if not source_account or source_account.user_id != g.current_user.id:
            return (
                jsonify(
                    {
                        "error": "Source wallet not found or access denied",
                        "code": "ACCOUNT_ACCESS_DENIED",
                    }
                ),
                403,
            )

        debit_transaction, credit_transaction = send_payment(db.session, send_request)

        # Fetch accounts again to get updated balances
        from_account = db.session.get(Account, send_request.from_wallet_id)
        to_account = db.session.get(Account, credit_transaction.account_id)

        return (
            jsonify(
                {
                    "success": True,
                    "transfer_reference": debit_transaction.reference_number,
                    "from_wallet": {
                        "wallet_id": str(from_account.id),
                        "account_name": from_account.account_name,
                        "new_balance": float(
                            from_account.get_available_balance_decimal()
                        ),
                    },
                    "recipient": {
                        "wallet_id": str(to_account.id),
                        "account_name": to_account.account_name,
                        "identifier": send_request.recipient_identifier,
                        "type": send_request.recipient_type,
                    },
                    "payment_details": {
                        "amount": float(send_request.amount),
                        "currency": from_account.currency,
                        "description": send_request.description,
                        "processed_at": debit_transaction.processed_at.isoformat(),
                    },
                    "transactions": {
                        "debit_transaction_id": str(debit_transaction.id),
                        "credit_transaction_id": str(credit_transaction.id),
                    },
                    "message": "Payment sent successfully",
                }
            ),
            200,
        )

    except ValidationError as e:
        return handle_validation_error(e)
    except PaymentServiceError as e:
        db.session.rollback()
        return handle_wallet_service_error(e)
    except Exception as e:
        db.session.rollback()
        return handle_generic_exception(e)


@payment_mvp_bp.route("/request", methods=["POST"])
@token_required
def request_payment_route():
    """
    Create a payment request
    """
    try:
        data = request.get_json()
        request_create = PaymentRequestCreate(**(data or {}))

        # Check if the authenticated user owns the source wallet
        source_account = db.session.get(Account, request_create.from_wallet_id)
        if not source_account or source_account.user_id != g.current_user.id:
            return (
                jsonify(
                    {
                        "error": "Source wallet not found or access denied",
                        "code": "ACCOUNT_ACCESS_DENIED",
                    }
                ),
                403,
            )

        result = create_payment_request(db.session, request_create)

        return jsonify(result), 201

    except ValidationError as e:
        return handle_validation_error(e)
    except PaymentServiceError as e:
        db.session.rollback()
        return handle_wallet_service_error(e)
    except Exception as e:
        db.session.rollback()
        return handle_generic_exception(e)


@payment_mvp_bp.route("/history/<wallet_id>", methods=["GET"])
@wallet_access_required
def get_payment_history(wallet_id):
    """
    Get payment history for a wallet (payments sent and received)
    """
    try:
        # Get query parameters
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        payment_type = request.args.get("type", "all").lower()
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Build query for payment transactions
        query = EnhancedTransaction.query.filter_by(account_id=wallet_id).filter(
            EnhancedTransaction.transaction_category.in_(
                [TransactionCategory.PAYMENT, TransactionCategory.TRANSFER]
            )
        )

        # Apply type filter
        if payment_type == "sent":
            query = query.filter(
                EnhancedTransaction.transaction_type == TransactionType.DEBIT
            )
        elif payment_type == "received":
            query = query.filter(
                EnhancedTransaction.transaction_type == TransactionType.CREDIT
            )
        elif payment_type != "all":
            return (
                jsonify(
                    {
                        "error": "Invalid type. Must be one of: sent, received, all",
                        "code": "INVALID_TYPE",
                    }
                ),
                400,
            )

        # Apply date filters
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                query = query.filter(EnhancedTransaction.created_at >= start_dt)
            except ValueError:
                return (
                    jsonify(
                        {
                            "error": "Invalid start_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)",
                            "code": "INVALID_DATE_FORMAT",
                        }
                    ),
                    400,
                )

        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                query = query.filter(EnhancedTransaction.created_at <= end_dt)
            except ValueError:
                return (
                    jsonify(
                        {
                            "error": "Invalid end_date format. Use ISO format (YYYY-MM-DDTHH:MM:SS)",
                            "code": "INVALID_DATE_FORMAT",
                        }
                    ),
                    400,
                )

        # Order by creation date (newest first) and paginate
        # Assuming `paginate` is available (e.g., from Flask-SQLAlchemy)
        payments = query.order_by(EnhancedTransaction.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        # Format payment data
        payment_list = []
        for payment in payments.items:
            payment_data = payment.to_dict()
            payment_data["direction"] = (
                "sent"
                if payment.transaction_type == TransactionType.DEBIT
                else "received"
            )
            payment_list.append(payment_data)

        return (
            jsonify(
                {
                    "success": True,
                    "wallet_id": wallet_id,
                    "payments": payment_list,
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": payments.total,
                        "pages": payments.pages,
                        "has_next": payments.has_next,
                        "has_prev": payments.has_prev,
                    },
                }
            ),
            200,
        )

    except PaymentServiceError as e:
        return handle_wallet_service_error(e)
    except Exception as e:
        return handle_generic_exception(e)


# Error handlers for the blueprint - removed the original redundant ones
@payment_mvp_bp.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found", "code": "ENDPOINT_NOT_FOUND"}), 404


@payment_mvp_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed", "code": "METHOD_NOT_ALLOWED"}), 405


@payment_mvp_bp.errorhandler(500)
def internal_error(error):
    return handle_generic_exception(error)

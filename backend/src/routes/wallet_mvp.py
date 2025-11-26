import logging
from datetime import datetime
from functools import wraps

from flask import Blueprint, g, jsonify, request
from pydantic import ValidationError

from ..models.account import Account
from ..models.database import db
from ..models.transaction import (
    Transaction as EnhancedTransaction,
)  # Keeping original import name for compatibility with existing code

# Assuming these utility imports exist in the project structure
from ..utils.auth import token_required

from ..services.wallet_service import (
    WalletServiceError,
    create_wallet as service_create_wallet,
    process_deposit,
    process_withdrawal,
    process_transfer,
    get_account_by_id,
)
from ..schemas import (
    CreateWalletRequest,
    DepositRequest,
    WithdrawRequest,
    TransferRequest,
)
from ..error_handlers import (
    handle_validation_error,
    handle_wallet_service_error,
    handle_generic_exception,
)

# Create blueprint
wallet_mvp_bp = Blueprint("wallet_mvp", __name__, url_prefix="/api/v1/wallet")

# Configure logging
logger = logging.getLogger(__name__)


# --- Helper function for account access (similar to wallet.py's decorator) ---
def wallet_access_required(f):
    """Decorator to ensure user has access to the wallet"""

    @wraps(f)
    @token_required
    def decorated(wallet_id, *args, **kwargs):
        try:
            account = get_account_by_id(db.session, wallet_id)
        except WalletServiceError as e:
            return handle_wallet_service_error(e)

        # Check if user owns the account or is admin (assuming g.current_user is set by @token_required)
        # NOTE: The original MVP file did not have this check, but the requirement is to check authentication.
        if account.user_id != g.current_user.id and not getattr(
            g.current_user, "is_admin", False
        ):
            # Assuming audit_logger is available if needed, but for simplicity, returning error directly
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        g.account = account
        return f(wallet_id, *args, **kwargs)

    return decorated


@wallet_mvp_bp.route("/create", methods=["POST"])
@token_required
def create_wallet():
    """Create a new wallet (account) for a user"""
    try:
        data = request.get_json()
        # Pydantic validation and data parsing
        create_request = CreateWalletRequest(**(data or {}))

        # The original MVP file allowed any user_id in the payload.
        # For security, we should enforce that the user_id in the payload matches the authenticated user,
        # or remove it from the payload and use g.current_user.id.
        # Since the original MVP file did not have authentication, I will assume the user_id in the payload
        # is the target user, but I will use the authenticated user's ID for the service call for security.
        # For now, I will use the user_id from the request, but if g.current_user is available, it should be used.
        # Since the requirement is to check authentication, I will use g.current_user.id.
        user_id = g.current_user.id

        account = service_create_wallet(db.session, user_id, create_request)

        return (
            jsonify(
                {
                    "success": True,
                    "wallet": account.to_dict(),
                    "message": "Wallet created successfully",
                }
            ),
            201,
        )

    except ValidationError as e:
        return handle_validation_error(e)
    except WalletServiceError as e:
        db.session.rollback()
        return handle_wallet_service_error(e)
    except Exception as e:
        db.session.rollback()
        return handle_generic_exception(e)


@wallet_mvp_bp.route("/<wallet_id>/balance", methods=["GET"])
@wallet_access_required
def get_wallet_balance(wallet_id):
    """Get current wallet balance"""
    try:
        account = g.account  # Set by @wallet_access_required

        return (
            jsonify(
                {
                    "success": True,
                    "wallet_id": str(account.id),
                    "account_name": account.account_name,
                    "available_balance": float(account.get_available_balance_decimal()),
                    "current_balance": float(account.get_current_balance_decimal()),
                    "pending_balance": float(account.get_pending_balance_decimal()),
                    "currency": account.currency,
                    "status": account.status.value,
                    "last_updated": account.updated_at.isoformat(),
                }
            ),
            200,
        )

    except WalletServiceError as e:
        return handle_wallet_service_error(e)
    except Exception as e:
        return handle_generic_exception(e)


@wallet_mvp_bp.route("/<wallet_id>/deposit", methods=["POST"])
@wallet_access_required
def deposit_funds(wallet_id):
    """Deposit funds into a wallet"""
    try:
        data = request.get_json()
        deposit_request = DepositRequest(**(data or {}))

        transaction = process_deposit(db.session, wallet_id, deposit_request)
        account = g.account  # g.account is set by wallet_access_required

        return (
            jsonify(
                {
                    "message": "Deposit completed successfully",
                    "transaction": transaction.to_dict(),
                    "new_balance": float(account.get_current_balance_decimal()),
                }
            ),
            200,
        )

    except ValidationError as e:
        return handle_validation_error(e)
    except WalletServiceError as e:
        db.session.rollback()
        return handle_wallet_service_error(e)
    except Exception as e:
        db.session.rollback()
        return handle_generic_exception(e)


@wallet_mvp_bp.route("/<wallet_id>/withdraw", methods=["POST"])
@wallet_access_required
def withdraw_funds(wallet_id):
    """Withdraw funds from a wallet"""
    try:
        data = request.get_json()
        withdraw_request = WithdrawRequest(**(data or {}))

        transaction = process_withdrawal(db.session, wallet_id, withdraw_request)
        account = g.account  # g.account is set by wallet_access_required

        return (
            jsonify(
                {
                    "message": "Withdrawal completed successfully",
                    "transaction": transaction.to_dict(),
                    "new_balance": float(account.get_current_balance_decimal()),
                }
            ),
            200,
        )

    except ValidationError as e:
        return handle_validation_error(e)
    except WalletServiceError as e:
        db.session.rollback()
        return handle_wallet_service_error(e)
    except Exception as e:
        db.session.rollback()
        return handle_generic_exception(e)


@wallet_mvp_bp.route("/<wallet_id>/transfer", methods=["POST"])
@wallet_access_required
def transfer_funds(wallet_id):
    """Transfer funds from one wallet to another (internal transfer)"""
    try:
        data = request.get_json()
        transfer_request = TransferRequest(**(data or {}))

        debit_transaction, credit_transaction = process_transfer(
            db.session, wallet_id, transfer_request
        )
        source_account = g.account  # g.account is set by wallet_access_required
        destination_account = get_account_by_id(
            db.session, transfer_request.destination_account_id
        )

        return (
            jsonify(
                {
                    "message": "Transfer completed successfully",
                    "source_new_balance": float(
                        source_account.get_current_balance_decimal()
                    ),
                    "destination_new_balance": float(
                        destination_account.get_current_balance_decimal()
                    ),
                    "debit_transaction_id": debit_transaction.id,
                    "credit_transaction_id": credit_transaction.id,
                }
            ),
            200,
        )

    except ValidationError as e:
        return handle_validation_error(e)
    except WalletServiceError as e:
        db.session.rollback()
        return handle_wallet_service_error(e)
    except Exception as e:
        db.session.rollback()
        return handle_generic_exception(e)


@wallet_mvp_bp.route("/<wallet_id>/history", methods=["GET"])
@wallet_access_required
def get_transaction_history(wallet_id):
    """
    Get transaction history for a specific wallet
    """
    try:
        # Get query parameters
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Start with a base query for transactions related to the wallet
        query = EnhancedTransaction.query.filter_by(account_id=wallet_id)

        # Filter by date range
        if start_date:
            try:
                # The original code used fromisoformat which is good practice
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
        transactions = query.order_by(EnhancedTransaction.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        # Format transaction data
        transaction_list = [transaction.to_dict() for transaction in transactions.items]

        return (
            jsonify(
                {
                    "success": True,
                    "wallet_id": wallet_id,
                    "transactions": transaction_list,
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": transactions.total,
                        "pages": transactions.pages,
                        "has_next": transactions.has_next,
                        "has_prev": transactions.has_prev,
                    },
                }
            ),
            200,
        )

    except WalletServiceError as e:
        return handle_wallet_service_error(e)
    except Exception as e:
        return handle_generic_exception(e)


@wallet_mvp_bp.route("/user/<user_id>", methods=["GET"])
@token_required
def get_user_wallets(user_id):
    """
    Get all wallets for a specific user
    """
    try:
        # Enforce that the requested user_id matches the authenticated user's ID
        if user_id != g.current_user.id and not getattr(
            g.current_user, "is_admin", False
        ):
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        # Get all accounts for the user
        accounts = Account.query.filter_by(user_id=user_id).all()

        wallet_list = [account.to_dict() for account in accounts]

        return (
            jsonify(
                {
                    "success": True,
                    "user_id": user_id,
                    "wallets": wallet_list,
                    "total_wallets": len(wallet_list),
                }
            ),
            200,
        )

    except Exception as e:
        return handle_generic_exception(e)


# Error handlers for the blueprint - these are now redundant due to centralized handlers,
# but keeping them to catch errors that might not be caught by the route-level try/excepts.
# I will update them to use the centralized handler format.
@wallet_mvp_bp.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found", "code": "ENDPOINT_NOT_FOUND"}), 404


@wallet_mvp_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed", "code": "METHOD_NOT_ALLOWED"}), 405


@wallet_mvp_bp.errorhandler(500)
def internal_error(error):
    return handle_generic_exception(error)

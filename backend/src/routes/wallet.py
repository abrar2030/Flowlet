import logging

from flask import Blueprint, g, jsonify, request
from pydantic import ValidationError
from functools import wraps

from ..models.account import Account
from ..models.audit_log import AuditEventType, AuditSeverity
from ..models.database import db
from ..models.transaction import (
    Transaction,
)  # Assuming Transaction is needed for to_dict() in get_account_details

# Assuming these utility imports exist in the project structure
from ..utils.auth import token_required
from ..utils.audit import audit_logger

from ..services.wallet_service import (
    WalletServiceError,
    process_deposit,
    process_withdrawal,
    process_transfer,
    get_user_accounts as service_get_user_accounts,
    get_account_details_with_transactions,
)
from ..schemas import DepositFundsRequest, WithdrawFundsRequest, TransferFundsRequest
from ..error_handlers import (
    handle_validation_error,
    handle_wallet_service_error,
    handle_generic_exception,
)

# Create blueprint
account_bp = Blueprint("account", __name__, url_prefix="/api/v1/accounts")

# Configure logging
logger = logging.getLogger(__name__)


def account_access_required(f):
    """Decorator to ensure user has access to the account"""

    @wraps(f)
    @token_required
    def decorated(account_id, *args, **kwargs):
        account = db.session.get(Account, account_id)
        if not account:
            return (
                jsonify({"error": "Account not found", "code": "ACCOUNT_NOT_FOUND"}),
                404,
            )

        # Check if user owns the account or is admin
        if account.user_id != g.current_user.id and not g.current_user.is_admin:
            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="Unauthorized account access attempt",
                severity=AuditSeverity.HIGH,
                user_id=g.current_user.id,
                details={"account_id": account_id},
                ip_address=request.remote_addr,
            )
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        g.account = account
        return f(account_id, *args, **kwargs)

    return decorated


@account_bp.route("/", methods=["GET"])
@token_required
def get_user_accounts():
    """Get all accounts (wallets) for the current user"""
    try:
        user_id = g.current_user.id
        accounts = service_get_user_accounts(db.session, user_id)
        account_list = [account.to_dict() for account in accounts]
        return jsonify({"accounts": account_list}), 200
    except WalletServiceError as e:
        return handle_wallet_service_error(e)
    except Exception as e:
        return handle_generic_exception(e)


@account_bp.route("/<account_id>", methods=["GET"])
@account_access_required
def get_account_details(account_id):
    """Get details for a specific account (wallet)"""
    try:
        # g.account is set by the decorator
        account, recent_transactions = get_account_details_with_transactions(
            db.session, account_id
        )
        transaction_data = [t.to_dict() for t in recent_transactions]
        return (
            jsonify(
                {"account": account.to_dict(), "recent_transactions": transaction_data}
            ),
            200,
        )
    except WalletServiceError as e:
        return handle_wallet_service_error(e)
    except Exception as e:
        return handle_generic_exception(e)


@account_bp.route("/<account_id>/deposit", methods=["POST"])
@account_access_required
def deposit_funds(account_id):
    """Deposit funds into an account"""
    try:
        data = request.get_json()
        # Pydantic validation and data parsing
        deposit_request = DepositFundsRequest(**(data or {}))

        transaction = process_deposit(db.session, account_id, deposit_request)
        account = g.account  # g.account is set by account_access_required

        # Audit logging
        audit_logger.log_event(
            event_type=AuditEventType.TRANSACTION_COMPLETED,
            description=f"Deposit of {deposit_request.amount} {account.currency} to account {account.id}",
            user_id=g.current_user.id,
            severity=AuditSeverity.LOW,
            resource_type="transaction",
            resource_id=transaction.id,
        )

        return (
            jsonify(
                {
                    "message": "Deposit completed successfully",
                    "transaction": transaction.to_dict(),
                    "new_balance": float(account.balance),
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


@account_bp.route("/<account_id>/withdraw", methods=["POST"])
@account_access_required
def withdraw_funds(account_id):
    """Withdraw funds from an account"""
    try:
        data = request.get_json()
        # Pydantic validation and data parsing
        withdraw_request = WithdrawFundsRequest(**(data or {}))

        transaction = process_withdrawal(db.session, account_id, withdraw_request)
        account = g.account  # g.account is set by account_access_required

        # Audit logging
        audit_logger.log_event(
            event_type=AuditEventType.TRANSACTION_COMPLETED,
            description=f"Withdrawal of {withdraw_request.amount} {account.currency} from account {account.id}",
            user_id=g.current_user.id,
            severity=AuditSeverity.LOW,
            resource_type="transaction",
            resource_id=transaction.id,
        )

        return (
            jsonify(
                {
                    "message": "Withdrawal completed successfully",
                    "transaction": transaction.to_dict(),
                    "new_balance": float(account.balance),
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


@account_bp.route("/<account_id>/transfer", methods=["POST"])
@account_access_required
def transfer_funds(account_id):
    """Transfer funds from one account to another (internal transfer)"""
    try:
        data = request.get_json()
        # Pydantic validation and data parsing
        transfer_request = TransferFundsRequest(**(data or {}))

        debit_transaction, credit_transaction = process_transfer(
            db.session, account_id, transfer_request
        )
        source_account = g.account  # g.account is set by account_access_required
        # Fetch destination account to get its name for the audit log
        destination_account = db.session.get(
            Account, transfer_request.destination_account_id
        )

        # Audit logging
        audit_logger.log_event(
            event_type=AuditEventType.TRANSACTION_COMPLETED,
            description=f"Internal transfer of {transfer_request.amount} {source_account.currency} from {source_account.id} to {destination_account.id}",
            user_id=g.current_user.id,
            severity=AuditSeverity.MEDIUM,
            resource_type="transfer",
            resource_id=f"{debit_transaction.id},{credit_transaction.id}",
        )

        return (
            jsonify(
                {
                    "message": "Transfer completed successfully",
                    "source_new_balance": float(source_account.balance),
                    "destination_new_balance": float(destination_account.balance),
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

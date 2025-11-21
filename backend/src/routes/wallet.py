import logging

from flask import Blueprint, g, jsonify, request
from sqlalchemy import select

from ..models.account import Account, AccountStatus
from ..models.audit_log import AuditEventType, AuditSeverity
from ..models.database import db

# Create blueprint
account_bp = Blueprint("account", __name__, url_prefix="/api/v1/accounts")

# Configure logging
logger = logging.getLogger(__name__)


def account_access_required(f):
    """Decorator to ensure user has access to the account"""

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

        accounts_stmt = select(Account).filter_by(user_id=user_id)
        accounts = db.session.execute(accounts_stmt).scalars().all()

        account_list = [account.to_dict() for account in accounts]

        return jsonify({"accounts": account_list}), 200

    except Exception as e:
        logger.error(f"Get user accounts error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {"error": "Failed to retrieve accounts", "code": "GET_ACCOUNTS_ERROR"}
            ),
            500,
        )


@account_bp.route("/<account_id>", methods=["GET"])
@account_access_required
def get_account_details(account_id):
    """Get details for a specific account (wallet)"""
    account = g.account

    # Get recent transactions (last 10)
    recent_transactions_stmt = (
        select(Transaction)
        .filter_by(account_id=account.id)
        .order_by(Transaction.created_at.desc())
        .limit(10)
    )
    recent_transactions = db.session.execute(recent_transactions_stmt).scalars().all()

    transaction_data = [t.to_dict() for t in recent_transactions]

    return (
        jsonify(
            {"account": account.to_dict(), "recent_transactions": transaction_data}
        ),
        200,
    )


@account_bp.route("/<account_id>/deposit", methods=["POST"])
@account_access_required
def deposit_funds(account_id):
    """Deposit funds into an account"""
    try:
        data = request.get_json()
        if not data or "amount" not in data:
            return (
                jsonify({"error": "Missing amount field", "code": "MISSING_DATA"}),
                400,
            )

        account = g.account

        # Validate amount
        is_valid, message, amount = InputValidator.validate_amount(data["amount"])
        if not is_valid or amount <= 0:
            return jsonify({"error": message, "code": "INVALID_AMOUNT"}), 400

        if account.status != AccountStatus.ACTIVE:
            return (
                jsonify({"error": "Account is not active", "code": "ACCOUNT_INACTIVE"}),
                400,
            )

        # Create deposit transaction
        transaction = Transaction(
            user_id=account.user_id,
            account_id=account.id,
            transaction_type=TransactionType.CREDIT,
            transaction_category=TransactionCategory.DEPOSIT,
            status=TransactionStatus.COMPLETED,
            description=data.get("description", f"Deposit to {account.account_name}"),
            channel=data.get("channel", "api"),
            currency=account.currency,
            amount=amount,
        )

        # Update account balance
        account.credit(amount)

        db.session.add(transaction)
        db.session.commit()

        audit_logger.log_event(
            event_type=AuditEventType.TRANSACTION_COMPLETED,
            description=f"Deposit of {amount} {account.currency} to account {account.id}",
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

    except Exception as e:
        db.session.rollback()
        logger.error(f"Deposit funds error: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Failed to process deposit", "code": "DEPOSIT_ERROR"}),
            500,
        )


@account_bp.route("/<account_id>/withdraw", methods=["POST"])
@account_access_required
def withdraw_funds(account_id):
    """Withdraw funds from an account"""
    try:
        data = request.get_json()
        if not data or "amount" not in data:
            return (
                jsonify({"error": "Missing amount field", "code": "MISSING_DATA"}),
                400,
            )

        account = g.account

        # Validate amount
        is_valid, message, amount = InputValidator.validate_amount(data["amount"])
        if not is_valid or amount <= 0:
            return jsonify({"error": message, "code": "INVALID_AMOUNT"}), 400

        if account.status != AccountStatus.ACTIVE:
            return (
                jsonify({"error": "Account is not active", "code": "ACCOUNT_INACTIVE"}),
                400,
            )

        # Check for sufficient funds
        if account.balance < amount:
            return (
                jsonify({"error": "Insufficient funds", "code": "INSUFFICIENT_FUNDS"}),
                400,
            )

        # Create withdrawal transaction
        transaction = Transaction(
            user_id=account.user_id,
            account_id=account.id,
            transaction_type=TransactionType.DEBIT,
            transaction_category=TransactionCategory.WITHDRAWAL,
            status=TransactionStatus.COMPLETED,
            description=data.get(
                "description", f"Withdrawal from {account.account_name}"
            ),
            channel=data.get("channel", "api"),
            currency=account.currency,
            amount=amount,
        )

        # Update account balance
        account.debit(amount)

        db.session.add(transaction)
        db.session.commit()

        audit_logger.log_event(
            event_type=AuditEventType.TRANSACTION_COMPLETED,
            description=f"Withdrawal of {amount} {account.currency} from account {account.id}",
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

    except Exception as e:
        db.session.rollback()
        logger.error(f"Withdraw funds error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {"error": "Failed to process withdrawal", "code": "WITHDRAWAL_ERROR"}
            ),
            500,
        )


@account_bp.route("/<account_id>/transfer", methods=["POST"])
@account_access_required
def transfer_funds(account_id):
    """Transfer funds from one account to another (internal transfer)"""
    try:
        data = request.get_json()
        if not data or "amount" not in data or "destination_account_id" not in data:
            return (
                jsonify(
                    {
                        "error": "Missing amount or destination account ID",
                        "code": "MISSING_DATA",
                    }
                ),
                400,
            )

        source_account = g.account
        destination_account_id = data["destination_account_id"]

        # Validate amount
        is_valid, message, amount = InputValidator.validate_amount(data["amount"])
        if not is_valid or amount <= 0:
            return jsonify({"error": message, "code": "INVALID_AMOUNT"}), 400

        # Get destination account
        destination_account = db.session.get(Account, destination_account_id)
        if not destination_account:
            return (
                jsonify(
                    {
                        "error": "Destination account not found",
                        "code": "DESTINATION_NOT_FOUND",
                    }
                ),
                404,
            )

        # Check account statuses
        if (
            source_account.status != AccountStatus.ACTIVE
            or destination_account.status != AccountStatus.ACTIVE
        ):
            return (
                jsonify(
                    {
                        "error": "One or both accounts are inactive",
                        "code": "ACCOUNT_INACTIVE",
                    }
                ),
                400,
            )

        # Check for sufficient funds
        if source_account.balance < amount:
            return (
                jsonify(
                    {
                        "error": "Insufficient funds in source account",
                        "code": "INSUFFICIENT_FUNDS",
                    }
                ),
                400,
            )

        # Check currency match (for simplicity, assume same currency for internal transfer)
        if source_account.currency != destination_account.currency:
            # In a real system, this would involve a currency conversion service
            return (
                jsonify(
                    {
                        "error": "Currency mismatch for internal transfer",
                        "code": "CURRENCY_MISMATCH",
                    }
                ),
                400,
            )

        # Perform debit on source account
        source_account.debit(amount)

        # Perform credit on destination account
        destination_account.credit(amount)

        # Create two transactions (debit for source, credit for destination)
        debit_transaction = Transaction(
            user_id=source_account.user_id,
            account_id=source_account.id,
            transaction_type=TransactionType.DEBIT,
            transaction_category=TransactionCategory.TRANSFER,
            status=TransactionStatus.COMPLETED,
            description=data.get(
                "description", f"Transfer to {destination_account.account_name}"
            ),
            channel=data.get("channel", "api"),
            currency=source_account.currency,
            amount=amount,
            related_account_id=destination_account.id,
        )

        credit_transaction = Transaction(
            user_id=destination_account.user_id,
            account_id=destination_account.id,
            transaction_type=TransactionType.CREDIT,
            transaction_category=TransactionCategory.TRANSFER,
            status=TransactionStatus.COMPLETED,
            description=data.get(
                "description", f"Transfer from {source_account.account_name}"
            ),
            channel=data.get("channel", "api"),
            currency=destination_account.currency,
            amount=amount,
            related_account_id=source_account.id,
        )

        db.session.add_all([debit_transaction, credit_transaction])
        db.session.commit()

        audit_logger.log_event(
            event_type=AuditEventType.TRANSACTION_COMPLETED,
            description=f"Internal transfer of {amount} {source_account.currency} from {source_account.id} to {destination_account.id}",
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

    except Exception as e:
        db.session.rollback()
        logger.error(f"Transfer funds error: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Failed to process transfer", "code": "TRANSFER_ERROR"}),
            500,
        )

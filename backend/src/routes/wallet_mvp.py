import logging
from datetime import datetime, timezone
from decimal import Decimal
from functools import wraps

from flask import Blueprint, g, jsonify, request
from src.models.account import Account, AccountStatus, AccountType
from src.models.database import User, db
from src.models.transaction import MVP, Enhanced
from src.models.transaction import Transaction as EnhancedTransaction
from src.models.transaction import (TransactionCategory, TransactionStatus,
                                    TransactionType, """, for, functionality,
                                    routes, wallet)

# Create blueprint
wallet_mvp_bp = Blueprint("wallet_mvp", __name__, url_prefix="/api/v1/wallet")

# Configure logging
logger = logging.getLogger(__name__)


def validate_json_request(required_fields=None):
    """Decorator to validate JSON request data"""

    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return (
                    jsonify(
                        {
                            "error": "Content-Type must be application/json",
                            "code": "INVALID_CONTENT_TYPE",
                        }
                    ),
                    400,
                )

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

            if required_fields:
                missing_fields = [
                    field for field in required_fields if field not in data
                ]
                if missing_fields:
                    return (
                        jsonify(
                            {
                                "error": f'Missing required fields: {", ".join(missing_fields)}',
                                "code": "MISSING_FIELDS",
                                "missing_fields": missing_fields,
                            }
                        ),
                        400,
                    )

            g.request_data = data
            return f(*args, **kwargs)

        return decorated_function

    return decorator


@wallet_mvp_bp.route("/create", methods=["POST"])
@validate_json_request(["user_id", "account_name"])
def create_wallet():
    """
    Create a new wallet (account) for a user

    Expected JSON payload:
    {
        "user_id": "string",
        "account_name": "string",
        "account_type": "checking|savings|business" (optional, defaults to checking),
        "currency": "USD|EUR|GBP" (optional, defaults to USD),
        "initial_deposit": "decimal" (optional, defaults to 0.00)
    }
    """
    try:
        data = g.request_data

        # Check if user exists
        user = User.query.get(data["user_id"])
        if not user:
            return jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}), 404

        # Validate account type
        account_type_str = data.get("account_type", "checking").lower()
        try:
            account_type = AccountType(account_type_str)
        except ValueError:
            return (
                jsonify(
                    {
                        "error": f"Invalid account type. Must be one of: {[t.value for t in AccountType]}",
                        "code": "INVALID_ACCOUNT_TYPE",
                    }
                ),
                400,
            )

        # Validate currency
        currency = data.get("currency", "USD").upper()
        supported_currencies = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD"]
        if currency not in supported_currencies:
            return (
                jsonify(
                    {
                        "error": f"Unsupported currency. Supported currencies: {supported_currencies}",
                        "code": "UNSUPPORTED_CURRENCY",
                    }
                ),
                400,
            )

        # Validate initial deposit
        initial_deposit = Decimal(str(data.get("initial_deposit", "0.00")))
        if initial_deposit < 0:
            return (
                jsonify(
                    {
                        "error": "Initial deposit cannot be negative",
                        "code": "INVALID_AMOUNT",
                    }
                ),
                400,
            )

        # Create new account
        account = Account(
            user_id=user.id,
            account_name=data["account_name"],
            account_type=account_type,
            currency=currency,
            status=AccountStatus.ACTIVE,
        )

        # Set initial balance if provided
        if initial_deposit > 0:
            account.set_available_balance(initial_deposit)
            account.set_current_balance(initial_deposit)

        db.session.add(account)
        db.session.flush()  # Get the account ID

        # Create initial deposit transaction if amount > 0
        if initial_deposit > 0:
            deposit_transaction = EnhancedTransaction(
                user_id=user.id,
                account_id=account.id,
                transaction_type=TransactionType.CREDIT,
                transaction_category=TransactionCategory.DEPOSIT,
                status=TransactionStatus.COMPLETED,
                description=f"Initial deposit for account {account.account_name}",
                channel="api",
            )
            deposit_transaction.set_amount(initial_deposit)
            deposit_transaction.currency = currency
            deposit_transaction.processed_at = datetime.now(timezone.utc)

            db.session.add(deposit_transaction)

        db.session.commit()

        logger.info(f"Created new wallet for user {user.id}: {account.id}")

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

    except ValueError as e:
        db.session.rollback()
        return (
            jsonify({"error": f"Invalid input: {str(e)}", "code": "VALIDATION_ERROR"}),
            400,
        )
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating wallet: {str(e)}")
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


@wallet_mvp_bp.route("/<wallet_id>/balance", methods=["GET"])
def get_wallet_balance(wallet_id):
    """
    Get current wallet balance

    Returns:
    {
        "wallet_id": "string",
        "account_name": "string",
        "available_balance": "decimal",
        "current_balance": "decimal",
        "currency": "string",
        "status": "string",
        "last_updated": "datetime"
    }
    """
    try:
        # Find account by ID
        account = Account.query.get(wallet_id)
        if not account:
            return (
                jsonify({"error": "Wallet not found", "code": "WALLET_NOT_FOUND"}),
                404,
            )

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

    except Exception as e:
        logger.error(f"Error getting wallet balance: {str(e)}")
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


@wallet_mvp_bp.route("/<wallet_id>/deposit", methods=["POST"])
@validate_json_request(["amount"])
def deposit_funds(wallet_id):
    """
    Deposit funds into a wallet

    Expected JSON payload:
    {
        "amount": "decimal",
        "description": "string" (optional),
        "payment_method": "string" (optional, defaults to 'bank_transfer')
    }
    """
    try:
        data = g.request_data

        # Find account
        account = Account.query.get(wallet_id)
        if not account:
            return (
                jsonify({"error": "Wallet not found", "code": "WALLET_NOT_FOUND"}),
                404,
            )

        # Validate account status
        if account.status != AccountStatus.ACTIVE:
            return (
                jsonify({"error": "Wallet is not active", "code": "WALLET_INACTIVE"}),
                400,
            )

        # Validate amount
        try:
            amount = Decimal(str(data["amount"]))
            if amount <= 0:
                return (
                    jsonify(
                        {
                            "error": "Deposit amount must be positive",
                            "code": "INVALID_AMOUNT",
                        }
                    ),
                    400,
                )
        except (ValueError, TypeError):
            return (
                jsonify(
                    {"error": "Invalid amount format", "code": "INVALID_AMOUNT_FORMAT"}
                ),
                400,
            )

        # Create deposit transaction
        transaction = EnhancedTransaction(
            user_id=account.user_id,
            account_id=account.id,
            transaction_type=TransactionType.CREDIT,
            transaction_category=TransactionCategory.DEPOSIT,
            status=TransactionStatus.COMPLETED,
            description=data.get("description", f"Deposit to {account.account_name}"),
            channel="api",
        )
        transaction.set_amount(amount)
        transaction.currency = account.currency
        transaction.processed_at = datetime.now(timezone.utc)

        # Update account balance
        account.credit(amount, transaction.description)

        db.session.add(transaction)
        db.session.commit()

        logger.info(f"Deposited {amount} {account.currency} to wallet {account.id}")

        return (
            jsonify(
                {
                    "success": True,
                    "transaction": transaction.to_dict(),
                    "new_balance": float(account.get_available_balance_decimal()),
                    "message": "Deposit completed successfully",
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error depositing funds: {str(e)}")
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


@wallet_mvp_bp.route("/<wallet_id>/withdraw", methods=["POST"])
@validate_json_request(["amount"])
def withdraw_funds(wallet_id):
    """
    Withdraw funds from a wallet

    Expected JSON payload:
    {
        "amount": "decimal",
        "description": "string" (optional),
        "payment_method": "string" (optional, defaults to 'bank_transfer')
    }
    """
    try:
        data = g.request_data

        # Find account
        account = Account.query.get(wallet_id)
        if not account:
            return (
                jsonify({"error": "Wallet not found", "code": "WALLET_NOT_FOUND"}),
                404,
            )

        # Validate account status
        if account.status != AccountStatus.ACTIVE:
            return (
                jsonify({"error": "Wallet is not active", "code": "WALLET_INACTIVE"}),
                400,
            )

        # Validate amount
        try:
            amount = Decimal(str(data["amount"]))
            if amount <= 0:
                return (
                    jsonify(
                        {
                            "error": "Withdrawal amount must be positive",
                            "code": "INVALID_AMOUNT",
                        }
                    ),
                    400,
                )
        except (ValueError, TypeError):
            return (
                jsonify(
                    {"error": "Invalid amount format", "code": "INVALID_AMOUNT_FORMAT"}
                ),
                400,
            )

        # Check if withdrawal is allowed
        can_debit, message = account.can_debit(amount)
        if not can_debit:
            return jsonify({"error": message, "code": "INSUFFICIENT_FUNDS"}), 400

        # Create withdrawal transaction
        transaction = EnhancedTransaction(
            user_id=account.user_id,
            account_id=account.id,
            transaction_type=TransactionType.DEBIT,
            transaction_category=TransactionCategory.WITHDRAWAL,
            status=TransactionStatus.COMPLETED,
            description=data.get(
                "description", f"Withdrawal from {account.account_name}"
            ),
            channel="api",
        )
        transaction.set_amount(amount)
        transaction.currency = account.currency
        transaction.processed_at = datetime.now(timezone.utc)

        # Update account balance
        account.debit(amount, transaction.description)

        db.session.add(transaction)
        db.session.commit()

        logger.info(f"Withdrew {amount} {account.currency} from wallet {account.id}")

        return (
            jsonify(
                {
                    "success": True,
                    "transaction": transaction.to_dict(),
                    "new_balance": float(account.get_available_balance_decimal()),
                    "message": "Withdrawal completed successfully",
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error withdrawing funds: {str(e)}")
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


@wallet_mvp_bp.route("/<wallet_id>/transactions", methods=["GET"])
def get_transaction_history(wallet_id):
    """
    Get transaction history for a wallet

    Query parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    - transaction_type: Filter by type (credit, debit, transfer, etc.)
    - start_date: Filter from date (ISO format)
    - end_date: Filter to date (ISO format)
    """
    try:
        # Find account
        account = Account.query.get(wallet_id)
        if not account:
            return (
                jsonify({"error": "Wallet not found", "code": "WALLET_NOT_FOUND"}),
                404,
            )

        # Get query parameters
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        transaction_type = request.args.get("transaction_type")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Build query
        query = EnhancedTransaction.query.filter_by(account_id=wallet_id)

        # Apply filters
        if transaction_type:
            try:
                trans_type = TransactionType(transaction_type.lower())
                query = query.filter(EnhancedTransaction.transaction_type == trans_type)
            except ValueError:
                return (
                    jsonify(
                        {
                            "error": f"Invalid transaction type. Must be one of: {[t.value for t in TransactionType]}",
                            "code": "INVALID_TRANSACTION_TYPE",
                        }
                    ),
                    400,
                )

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
        transactions = query.order_by(EnhancedTransaction.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        # Format transaction data
        transaction_list = []
        for transaction in transactions.items:
            transaction_data = transaction.to_dict()
            transaction_list.append(transaction_data)

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

    except Exception as e:
        logger.error(f"Error getting transaction history: {str(e)}")
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


@wallet_mvp_bp.route("/user/<user_id>", methods=["GET"])
def get_user_wallets(user_id):
    """
    Get all wallets for a specific user

    Returns:
    {
        "success": true,
        "user_id": "string",
        "wallets": [wallet_objects],
        "total_wallets": number
    }
    """
    try:
        # Check if user exists
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}), 404

        # Get all accounts for the user
        accounts = Account.query.filter_by(user_id=user_id).all()

        wallet_list = []
        for account in accounts:
            wallet_data = account.to_dict()
            wallet_list.append(wallet_data)

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
        logger.error(f"Error getting user wallets: {str(e)}")
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


# Error handlers for the blueprint
@wallet_mvp_bp.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found", "code": "ENDPOINT_NOT_FOUND"}), 404


@wallet_mvp_bp.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed", "code": "METHOD_NOT_ALLOWED"}), 405


@wallet_mvp_bp.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}), 500

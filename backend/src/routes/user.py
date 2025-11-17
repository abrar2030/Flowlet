"""
Enhanced User Management System with Financial-Grade Features
"""

import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from flask import Blueprint, g, jsonify, request
from sqlalchemy import and_, func, or_
from src.models.account import Account, AccountStatus, AccountType
from src.models.database import User, db
from src.models.transaction import (Transaction, TransactionStatus,
                                    TransactionType)
from src.routes.auth import admin_required, token_required
from src.security.audit_logger import AuditLogger
from src.security.input_validator import InputValidator
from src.security.rate_limiter import RateLimiter

# Create blueprint
user_bp = Blueprint("user", __name__, url_prefix="/api/v1/users")

# Configure logging
logger = logging.getLogger(__name__)

# Initialize security components
audit_logger = AuditLogger()
input_validator = InputValidator()
rate_limiter = RateLimiter()


@user_bp.route("/", methods=["GET"])
@admin_required
def get_users():
    """
    Get all users with pagination and filtering (Admin only)

    Query parameters:
    - page: Page number (default: 1)
    - per_page: Items per page (default: 20, max: 100)
    - search: Search by name or email
    - kyc_status: Filter by KYC status
    - status: Filter by user status (active/inactive)
    - sort_by: Sort field (created_at, last_login_at, etc.)
    - sort_order: Sort order (asc/desc)
    """
    try:
        # Get query parameters
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        search = request.args.get("search", "").strip()
        kyc_status = request.args.get("kyc_status")
        status = request.args.get("status")
        sort_by = request.args.get("sort_by", "created_at")
        sort_order = request.args.get("sort_order", "desc")

        # Build query
        query = User.query

        # Apply search filter
        if search:
            search_filter = or_(
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
            )
            query = query.filter(search_filter)

        # Apply KYC status filter
        if kyc_status:
            query = query.filter(User.kyc_status == kyc_status)

        # Apply status filter
        if status:
            is_active = status.lower() == "active"
            query = query.filter(User.is_active == is_active)

        # Apply sorting
        sort_column = getattr(User, sort_by, User.created_at)
        if sort_order.lower() == "desc":
            query = query.order_by(sort_column.desc())
        else:
            query = query.order_by(sort_column.asc())

        # Paginate results
        users = query.paginate(page=page, per_page=per_page, error_out=False)

        # Format user data
        user_list = []
        for user in users.items:
            # Get user's account summary
            accounts = Account.query.filter_by(user_id=user.id).all()
            total_balance = sum(
                account.get_current_balance_decimal() for account in accounts
            )

            user_data = {
                "id": str(user.id),
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "phone": user.phone,
                "kyc_status": user.kyc_status,
                "is_active": user.is_active,
                "email_verified": user.email_verified,
                "phone_verified": user.phone_verified,
                "two_factor_enabled": user.two_factor_enabled,
                "last_login_at": (
                    user.last_login_at.isoformat() if user.last_login_at else None
                ),
                "created_at": user.created_at.isoformat(),
                "account_summary": {
                    "total_accounts": len(accounts),
                    "total_balance": float(total_balance),
                    "primary_currency": accounts[0].currency if accounts else None,
                },
            }
            user_list.append(user_data)

        return (
            jsonify(
                {
                    "success": True,
                    "users": user_list,
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": users.total,
                        "pages": users.pages,
                        "has_next": users.has_next,
                        "has_prev": users.has_prev,
                    },
                    "filters": {
                        "search": search,
                        "kyc_status": kyc_status,
                        "status": status,
                        "sort_by": sort_by,
                        "sort_order": sort_order,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get users error: {str(e)}")
        return (
            jsonify({"error": "Failed to retrieve users", "code": "GET_USERS_ERROR"}),
            500,
        )


@user_bp.route("/<user_id>", methods=["GET"])
@token_required
def get_user(user_id):
    """Get user details by ID (Admin or own profile)"""
    try:
        current_user = g.current_user

        # Check if user is accessing their own profile or is admin
        if str(current_user.id) != user_id and not current_user.is_admin:
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}), 404

        # Get user's accounts
        accounts = Account.query.filter_by(user_id=user.id).all()

        account_data = []
        for account in accounts:
            account_data.append(
                {
                    "id": str(account.id),
                    "account_name": account.account_name,
                    "account_type": account.account_type.value,
                    "currency": account.currency,
                    "available_balance": float(account.get_available_balance_decimal()),
                    "current_balance": float(account.get_current_balance_decimal()),
                    "status": account.status.value,
                    "created_at": account.created_at.isoformat(),
                }
            )

        # Get recent transactions (last 10)
        recent_transactions = (
            Transaction.query.filter_by(user_id=user.id)
            .order_by(Transaction.created_at.desc())
            .limit(10)
            .all()
        )

        transaction_data = []
        for transaction in recent_transactions:
            transaction_data.append(
                {
                    "id": str(transaction.id),
                    "type": transaction.transaction_type.value,
                    "category": transaction.transaction_category.value,
                    "amount": float(transaction.get_amount_decimal()),
                    "currency": transaction.currency,
                    "description": transaction.description,
                    "status": transaction.status.value,
                    "created_at": transaction.created_at.isoformat(),
                }
            )

        # Calculate user statistics
        total_balance = sum(
            account.get_current_balance_decimal() for account in accounts
        )
        total_transactions = Transaction.query.filter_by(user_id=user.id).count()

        # Get monthly transaction volume
        current_month = datetime.now(timezone.utc).replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        monthly_volume = (
            db.session.query(func.sum(Transaction.amount_cents))
            .filter(
                and_(
                    Transaction.user_id == user.id,
                    Transaction.created_at >= current_month,
                    Transaction.status == TransactionStatus.COMPLETED,
                )
            )
            .scalar()
            or 0
        )

        user_data = {
            "id": str(user.id),
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "phone": user.phone,
            "date_of_birth": (
                user.date_of_birth.isoformat() if user.date_of_birth else None
            ),
            "address": (
                {
                    "street": user.address_street,
                    "city": user.address_city,
                    "state": user.address_state,
                    "postal_code": user.address_postal_code,
                    "country": user.address_country,
                }
                if user.address_street
                else None
            ),
            "kyc_status": user.kyc_status,
            "is_active": user.is_active,
            "email_verified": user.email_verified,
            "phone_verified": user.phone_verified,
            "two_factor_enabled": user.two_factor_enabled,
            "last_login_at": (
                user.last_login_at.isoformat() if user.last_login_at else None
            ),
            "last_login_ip": user.last_login_ip,
            "failed_login_attempts": user.failed_login_attempts,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat(),
        }

        return (
            jsonify(
                {
                    "success": True,
                    "user": user_data,
                    "accounts": account_data,
                    "recent_transactions": transaction_data,
                    "statistics": {
                        "total_accounts": len(accounts),
                        "total_balance": float(total_balance),
                        "total_transactions": total_transactions,
                        "monthly_volume": float(
                            monthly_volume / 100
                        ),  # Convert from cents
                        "account_age_days": (
                            datetime.now(timezone.utc) - user.created_at
                        ).days,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get user error: {str(e)}")
        return (
            jsonify({"error": "Failed to retrieve user", "code": "GET_USER_ERROR"}),
            500,
        )


@user_bp.route("/<user_id>", methods=["PUT"])
@token_required
def update_user(user_id):
    """Update user details (Admin or own profile)"""
    try:
        current_user = g.current_user

        # Check if user is updating their own profile or is admin
        if str(current_user.id) != user_id and not current_user.is_admin:
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}), 404

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

        # Track changes for audit log
        changes = {}

        # Update allowed fields with validation
        if "first_name" in data:
            old_value = user.first_name
            user.first_name = input_validator.sanitize_string(data["first_name"])
            if old_value != user.first_name:
                changes["first_name"] = {"old": old_value, "new": user.first_name}

        if "last_name" in data:
            old_value = user.last_name
            user.last_name = input_validator.sanitize_string(data["last_name"])
            if old_value != user.last_name:
                changes["last_name"] = {"old": old_value, "new": user.last_name}

        if "phone" in data:
            if data["phone"] and not input_validator.validate_phone(data["phone"]):
                return (
                    jsonify(
                        {
                            "error": "Invalid phone number format",
                            "code": "INVALID_PHONE",
                        }
                    ),
                    400,
                )
            old_value = user.phone
            user.phone = data["phone"]
            if old_value != user.phone:
                changes["phone"] = {"old": old_value, "new": user.phone}

        if "date_of_birth" in data:
            try:
                old_value = user.date_of_birth
                user.date_of_birth = datetime.strptime(
                    data["date_of_birth"], "%Y-%m-%d"
                ).date()
                if old_value != user.date_of_birth:
                    changes["date_of_birth"] = {
                        "old": old_value.isoformat() if old_value else None,
                        "new": user.date_of_birth.isoformat(),
                    }
            except ValueError:
                return (
                    jsonify(
                        {
                            "error": "Invalid date of birth format. Use YYYY-MM-DD",
                            "code": "INVALID_DATE_FORMAT",
                        }
                    ),
                    400,
                )

        if "address" in data and isinstance(data["address"], dict):
            address_data = data["address"]
            old_address = {
                "street": user.address_street,
                "city": user.address_city,
                "state": user.address_state,
                "postal_code": user.address_postal_code,
                "country": user.address_country,
            }

            user.address_street = input_validator.sanitize_string(
                address_data.get("street", "")
            )
            user.address_city = input_validator.sanitize_string(
                address_data.get("city", "")
            )
            user.address_state = input_validator.sanitize_string(
                address_data.get("state", "")
            )
            user.address_postal_code = input_validator.sanitize_string(
                address_data.get("postal_code", "")
            )
            user.address_country = input_validator.sanitize_string(
                address_data.get("country", "")
            )

            new_address = {
                "street": user.address_street,
                "city": user.address_city,
                "state": user.address_state,
                "postal_code": user.address_postal_code,
                "country": user.address_country,
            }

            if old_address != new_address:
                changes["address"] = {"old": old_address, "new": new_address}

        # Admin-only fields
        if current_user.is_admin:
            if "kyc_status" in data:
                old_value = user.kyc_status
                user.kyc_status = data["kyc_status"]
                if old_value != user.kyc_status:
                    changes["kyc_status"] = {"old": old_value, "new": user.kyc_status}

            if "is_active" in data:
                old_value = user.is_active
                user.is_active = bool(data["is_active"])
                if old_value != user.is_active:
                    changes["is_active"] = {"old": old_value, "new": user.is_active}

        user.updated_at = datetime.now(timezone.utc)
        db.session.commit()

        # Log changes if any were made
        if changes:
            audit_logger.log_user_event(
                user_id=user.id,
                event_type="user_updated",
                details={
                    "changes": changes,
                    "updated_by": current_user.id,
                    "ip": request.remote_addr,
                },
            )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "User updated successfully",
                    "user": {
                        "id": str(user.id),
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "phone": user.phone,
                        "kyc_status": user.kyc_status,
                        "is_active": user.is_active,
                        "updated_at": user.updated_at.isoformat(),
                    },
                    "changes": changes,
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update user error: {str(e)}")
        return (
            jsonify({"error": "Failed to update user", "code": "UPDATE_USER_ERROR"}),
            500,
        )


@user_bp.route("/<user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    """Soft delete user (Admin only)"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}), 404

        # Check if user has active accounts with balance
        accounts = Account.query.filter_by(user_id=user.id).all()
        for account in accounts:
            if account.get_current_balance_decimal() > 0:
                return (
                    jsonify(
                        {
                            "error": "Cannot delete user with active account balances",
                            "code": "ACTIVE_BALANCE_EXISTS",
                        }
                    ),
                    400,
                )

        # Soft delete - deactivate user instead of hard delete
        user.is_active = False
        user.deleted_at = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)

        # Deactivate all user accounts
        for account in accounts:
            account.status = AccountStatus.CLOSED
            account.updated_at = datetime.now(timezone.utc)

        db.session.commit()

        # Log user deletion
        audit_logger.log_user_event(
            user_id=user.id,
            event_type="user_deleted",
            details={
                "deleted_by": g.current_user.id,
                "ip": request.remote_addr,
                "accounts_closed": len(accounts),
            },
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "User deleted successfully",
                    "deleted_at": user.deleted_at.isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Delete user error: {str(e)}")
        return (
            jsonify({"error": "Failed to delete user", "code": "DELETE_USER_ERROR"}),
            500,
        )


@user_bp.route("/<user_id>/accounts", methods=["GET"])
@token_required
def get_user_accounts(user_id):
    """Get all accounts for a specific user"""
    try:
        current_user = g.current_user

        # Check if user is accessing their own accounts or is admin
        if str(current_user.id) != user_id and not current_user.is_admin:
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}), 404

        accounts = Account.query.filter_by(user_id=user_id).all()

        account_list = []
        total_balance = Decimal("0")

        for account in accounts:
            account_balance = account.get_current_balance_decimal()
            total_balance += account_balance

            account_data = {
                "id": str(account.id),
                "account_name": account.account_name,
                "account_type": account.account_type.value,
                "currency": account.currency,
                "available_balance": float(account.get_available_balance_decimal()),
                "current_balance": float(account_balance),
                "pending_balance": float(account.get_pending_balance_decimal()),
                "status": account.status.value,
                "created_at": account.created_at.isoformat(),
                "updated_at": account.updated_at.isoformat(),
            }
            account_list.append(account_data)

        return (
            jsonify(
                {
                    "success": True,
                    "user_id": user_id,
                    "accounts": account_list,
                    "summary": {
                        "total_accounts": len(account_list),
                        "total_balance": float(total_balance),
                        "active_accounts": len(
                            [a for a in accounts if a.status == AccountStatus.ACTIVE]
                        ),
                        "primary_currency": accounts[0].currency if accounts else None,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get user accounts error: {str(e)}")
        return (
            jsonify(
                {
                    "error": "Failed to retrieve user accounts",
                    "code": "GET_ACCOUNTS_ERROR",
                }
            ),
            500,
        )


@user_bp.route("/<user_id>/transactions", methods=["GET"])
@token_required
def get_user_transactions(user_id):
    """Get transaction history for a user"""
    try:
        current_user = g.current_user

        # Check if user is accessing their own transactions or is admin
        if str(current_user.id) != user_id and not current_user.is_admin:
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}), 404

        # Get query parameters
        page = request.args.get("page", 1, type=int)
        per_page = min(request.args.get("per_page", 20, type=int), 100)
        transaction_type = request.args.get("transaction_type")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")
        account_id = request.args.get("account_id")

        # Build query
        query = Transaction.query.filter_by(user_id=user_id)

        # Apply filters
        if transaction_type:
            try:
                trans_type = TransactionType(transaction_type.lower())
                query = query.filter(Transaction.transaction_type == trans_type)
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

        if account_id:
            query = query.filter(Transaction.account_id == account_id)

        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
                query = query.filter(Transaction.created_at >= start_dt)
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
                query = query.filter(Transaction.created_at <= end_dt)
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
        transactions = query.order_by(Transaction.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        # Format transaction data
        transaction_list = []
        for transaction in transactions.items:
            transaction_data = {
                "id": str(transaction.id),
                "account_id": str(transaction.account_id),
                "type": transaction.transaction_type.value,
                "category": transaction.transaction_category.value,
                "amount": float(transaction.get_amount_decimal()),
                "currency": transaction.currency,
                "description": transaction.description,
                "status": transaction.status.value,
                "reference_number": transaction.reference_number,
                "channel": transaction.channel,
                "created_at": transaction.created_at.isoformat(),
                "processed_at": (
                    transaction.processed_at.isoformat()
                    if transaction.processed_at
                    else None
                ),
            }
            transaction_list.append(transaction_data)

        return (
            jsonify(
                {
                    "success": True,
                    "user_id": user_id,
                    "transactions": transaction_list,
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": transactions.total,
                        "pages": transactions.pages,
                        "has_next": transactions.has_next,
                        "has_prev": transactions.has_prev,
                    },
                    "filters": {
                        "transaction_type": transaction_type,
                        "account_id": account_id,
                        "start_date": start_date,
                        "end_date": end_date,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get user transactions error: {str(e)}")
        return (
            jsonify(
                {
                    "error": "Failed to retrieve user transactions",
                    "code": "GET_TRANSACTIONS_ERROR",
                }
            ),
            500,
        )


@user_bp.route("/<user_id>/verify-email", methods=["POST"])
@token_required
def verify_email(user_id):
    """
    Verify user email address

    Expected JSON payload:
    {
        "verification_token": "string"
    }
    """
    try:
        current_user = g.current_user

        # Check if user is verifying their own email or is admin
        if str(current_user.id) != user_id and not current_user.is_admin:
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}), 404

        if user.email_verified:
            return (
                jsonify(
                    {
                        "error": "Email is already verified",
                        "code": "EMAIL_ALREADY_VERIFIED",
                    }
                ),
                400,
            )

        data = request.get_json()
        if not data or "verification_token" not in data:
            return (
                jsonify(
                    {"error": "Verification token is required", "code": "TOKEN_MISSING"}
                ),
                400,
            )

        # Verify token (implement token validation logic)
        # For now, we'll mark as verified
        user.email_verified = True
        user.email_verified_at = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)

        db.session.commit()

        # Log email verification
        audit_logger.log_user_event(
            user_id=user.id,
            event_type="email_verified",
            details={"ip": request.remote_addr},
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Email verified successfully",
                    "email_verified": True,
                    "verified_at": user.email_verified_at.isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Verify email error: {str(e)}")
        return (
            jsonify(
                {"error": "Failed to verify email", "code": "EMAIL_VERIFICATION_ERROR"}
            ),
            500,
        )


@user_bp.route("/<user_id>/verify-phone", methods=["POST"])
@token_required
def verify_phone(user_id):
    """
    Verify user phone number

    Expected JSON payload:
    {
        "verification_code": "string"
    }
    """
    try:
        current_user = g.current_user

        # Check if user is verifying their own phone or is admin
        if str(current_user.id) != user_id and not current_user.is_admin:
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}), 404

        if user.phone_verified:
            return (
                jsonify(
                    {
                        "error": "Phone is already verified",
                        "code": "PHONE_ALREADY_VERIFIED",
                    }
                ),
                400,
            )

        data = request.get_json()
        if not data or "verification_code" not in data:
            return (
                jsonify(
                    {"error": "Verification code is required", "code": "CODE_MISSING"}
                ),
                400,
            )

        # Verify code (implement SMS verification logic)
        # For now, we'll mark as verified
        user.phone_verified = True
        user.phone_verified_at = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)

        db.session.commit()

        # Log phone verification
        audit_logger.log_user_event(
            user_id=user.id,
            event_type="phone_verified",
            details={"ip": request.remote_addr},
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Phone verified successfully",
                    "phone_verified": True,
                    "verified_at": user.phone_verified_at.isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Verify phone error: {str(e)}")
        return (
            jsonify(
                {"error": "Failed to verify phone", "code": "PHONE_VERIFICATION_ERROR"}
            ),
            500,
        )


@user_bp.route("/statistics", methods=["GET"])
@admin_required
def get_user_statistics():
    """Get user statistics (Admin only)"""
    try:
        # Get basic user counts
        total_users = User.query.count()
        active_users = User.query.filter_by(is_active=True).count()
        verified_users = User.query.filter_by(email_verified=True).count()

        # Get KYC status breakdown
        kyc_stats = (
            db.session.query(User.kyc_status, func.count(User.id))
            .group_by(User.kyc_status)
            .all()
        )

        # Get registration trends (last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_registrations = User.query.filter(
            User.created_at >= thirty_days_ago
        ).count()

        # Get login activity (last 7 days)
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_logins = User.query.filter(User.last_login_at >= seven_days_ago).count()

        return (
            jsonify(
                {
                    "success": True,
                    "statistics": {
                        "total_users": total_users,
                        "active_users": active_users,
                        "inactive_users": total_users - active_users,
                        "verified_users": verified_users,
                        "unverified_users": total_users - verified_users,
                        "recent_registrations_30d": recent_registrations,
                        "recent_logins_7d": recent_logins,
                        "kyc_breakdown": dict(kyc_stats),
                        "verification_rate": (
                            round((verified_users / total_users * 100), 2)
                            if total_users > 0
                            else 0
                        ),
                        "activity_rate": (
                            round((recent_logins / active_users * 100), 2)
                            if active_users > 0
                            else 0
                        ),
                    },
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get user statistics error: {str(e)}")
        return (
            jsonify(
                {
                    "error": "Failed to retrieve user statistics",
                    "code": "STATISTICS_ERROR",
                }
            ),
            500,
        )

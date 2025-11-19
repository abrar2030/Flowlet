import logging
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from functools import wraps

import jwt
from flask import Blueprint, jsonify, request
from src.models import Account, Transaction, User, db

# Configure logging
logger = logging.getLogger(__name__)

api_bp = Blueprint("api", __name__, url_prefix="/api/v1")

# ============================================================================
# AUTHENTICATION HELPERS
# ============================================================================


def generate_token(user_id):
    """Generate JWT token"""
    payload = {
        "user_id": user_id,
        "exp": datetime.utcnow()
        + timedelta(hours=1),  # Using a fixed timedelta for now
        "iat": datetime.utcnow(),
    }
    return jwt.encode(
        payload,
        os.environ.get("JWT_SECRET_KEY", secrets.token_urlsafe(32)),
        algorithm="HS256",
    )


def verify_token(token):
    """Verify JWT token"""
    try:
        payload = jwt.decode(
            token,
            os.environ.get("JWT_SECRET_KEY", secrets.token_urlsafe(32)),
            algorithms=["HS256"],
        )
        return payload["user_id"]
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def token_required(f):
    """JWT token validation decorator"""

    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            return (
                jsonify(
                    {"success": False, "error": "Authentication token is required"}
                ),
                401,
            )

        user_id = verify_token(token)
        if not user_id:
            return jsonify({"success": False, "error": "Invalid or expired token"}), 401

        current_user = User.query.get(user_id)
        if not current_user or not current_user.is_active:
            return (
                jsonify({"success": False, "error": "User not found or inactive"}),
                401,
            )

        request.current_user = current_user
        return f(*args, **kwargs)

    return decorated


# ============================================================================
# API ROUTES
# ============================================================================


@api_bp.route("/auth/register", methods=["POST"])
def register():
    """User registration"""
    try:
        data = request.get_json()
        if not data:
            return (
                jsonify(
                    {"success": False, "error": "Request body must contain valid JSON"}
                ),
                400,
            )

        # Validate required fields
        required_fields = ["email", "password", "first_name", "last_name"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Missing required fields: {", ".join(missing_fields)}",
                    }
                ),
                400,
            )

        # Check if user already exists
        existing_user = User.query.filter_by(email=data["email"].lower()).first()
        if existing_user:
            return (
                jsonify(
                    {"success": False, "error": "User with this email already exists"}
                ),
                409,
            )

        # Create new user
        user = User(
            email=data["email"].lower(),
            first_name=data["first_name"],
            last_name=data["last_name"],
            phone_number=data.get("phone_number"),
        )
        user.set_password(data["password"])

        db.session.add(user)
        db.session.flush()  # Get the user ID

        # Create default checking account
        account_number = f"ACC{str(uuid.uuid4()).replace('-', '')[:12].upper()}"
        account = Account(
            user_id=user.id,
            account_name=f"{user.first_name}'s Checking Account",
            account_number=account_number,
            account_type="checking",
            currency="USD",
        )
        # Set initial balance of $1000 for demo purposes
        account.available_balance = Decimal("1000.00")
        account.current_balance = Decimal("1000.00")

        db.session.add(account)
        db.session.commit()

        # Generate access token
        access_token = generate_token(user.id)

        logger.info(f"User registered successfully: {user.email}")

        return (
            jsonify(
                {
                    "success": True,
                    "message": "User registered successfully",
                    "user": user.to_dict(),
                    "account": account.to_dict(),
                    "access_token": access_token,
                    "token_type": "Bearer",
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}")
        return jsonify({"success": False, "error": "Registration failed"}), 500


@api_bp.route("/auth/login", methods=["POST"])
def login():
    """User login"""
    try:
        data = request.get_json()
        if not data:
            return (
                jsonify(
                    {"success": False, "error": "Request body must contain valid JSON"}
                ),
                400,
            )

        # Validate required fields
        if "email" not in data or "password" not in data:
            return (
                jsonify({"success": False, "error": "Email and password are required"}),
                400,
            )

        # Find user by email
        user = User.query.filter_by(email=data["email"].lower()).first()
        if not user:
            return (
                jsonify({"success": False, "error": "Invalid email or password"}),
                401,
            )

        # Check if account is locked
        if user.failed_login_attempts >= 5:
            if user.account_locked_until and user.account_locked_until > datetime.now(
                timezone.utc
            ):
                return (
                    jsonify(
                        {"success": False, "error": "Account is temporarily locked"}
                    ),
                    423,
                )

        # Check if user is active
        if not user.is_active:
            return jsonify({"success": False, "error": "User account is inactive"}), 401

        # Verify password
        if not user.check_password(data["password"]):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:
                user.account_locked_until = datetime.now(timezone.utc) + timedelta(
                    minutes=30
                )
            db.session.commit()
            return (
                jsonify({"success": False, "error": "Invalid email or password"}),
                401,
            )

        # Reset failed login attempts on successful login
        user.failed_login_attempts = 0
        user.account_locked_until = None
        user.last_login = datetime.now(timezone.utc)
        db.session.commit()

        # Generate access token
        access_token = generate_token(user.id)

        logger.info(f"User logged in successfully: {user.email}")

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Login successful",
                    "user": user.to_dict(),
                    "access_token": access_token,
                    "token_type": "Bearer",
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"success": False, "error": "Login failed"}), 500


@api_bp.route("/user/profile", methods=["GET"])
@token_required
def get_user_profile():
    """Get user profile"""
    try:
        user = request.current_user
        accounts = Account.query.filter_by(user_id=user.id).all()

        return (
            jsonify(
                {
                    "success": True,
                    "user": user.to_dict(),
                    "accounts": [account.to_dict() for account in accounts],
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get profile error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to get user profile"}), 500


@api_bp.route("/accounts", methods=["GET"])
@token_required
def get_accounts():
    """Get user accounts"""
    try:
        user = request.current_user
        accounts = Account.query.filter_by(user_id=user.id).all()

        return (
            jsonify(
                {
                    "success": True,
                    "accounts": [account.to_dict() for account in accounts],
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get accounts error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to get accounts"}), 500


@api_bp.route("/accounts/<account_id>/transactions", methods=["GET"])
@token_required
def get_transactions(account_id):
    """Get account transactions"""
    try:
        user = request.current_user

        # Verify account belongs to user
        account = Account.query.filter_by(id=account_id, user_id=user.id).first()
        if not account:
            return jsonify({"success": False, "error": "Account not found"}), 404

        # Get transactions with pagination
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)

        transactions = (
            Transaction.query.filter_by(account_id=account_id)
            .order_by(Transaction.created_at.desc())
            .paginate(page=page, per_page=per_page, error_out=False)
        )

        return (
            jsonify(
                {
                    "success": True,
                    "transactions": [
                        transaction.to_dict() for transaction in transactions.items
                    ],
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": transactions.total,
                        "pages": transactions.pages,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Get transactions error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to get transactions"}), 500


@api_bp.route("/transactions/send", methods=["POST"])
@token_required
def send_money():
    """Send money transaction"""
    try:
        user = request.current_user
        data = request.get_json()

        if not data:
            return (
                jsonify(
                    {"success": False, "error": "Request body must contain valid JSON"}
                ),
                400,
            )

        # Validate required fields
        required_fields = ["from_account_id", "amount", "description"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Missing required fields: {", ".join(missing_fields)}",
                    }
                ),
                400,
            )

        # Validate amount is a number and convert to Decimal
        try:
            amount = Decimal(str(data["amount"]))
        except Exception:
            return jsonify({"success": False, "error": "Invalid amount format"}), 400

        if amount <= 0:
            return jsonify({"success": False, "error": "Amount must be positive"}), 400

        # Verify account belongs to user
        from_account = Account.query.filter_by(
            id=data["from_account_id"], user_id=user.id
        ).first()
        if not from_account:
            return jsonify({"success": False, "error": "Account not found"}), 404

        if from_account.available_balance < amount:
            return jsonify({"success": False, "error": "Insufficient funds"}), 400

        # Create transaction
        transaction_id = f"TXN{str(uuid.uuid4()).replace('-', '')[:12].upper()}"
        transaction = Transaction(
            user_id=user.id,
            account_id=from_account.id,
            transaction_id=transaction_id,
            transaction_type="debit",
            transaction_category="transfer",
            description=data["description"],
            status="completed",
            processed_at=datetime.now(timezone.utc),
        )
        transaction.amount = amount

        # Update account balance
        from_account.available_balance -= amount
        from_account.current_balance -= amount
        from_account.updated_at = datetime.now(timezone.utc)

        db.session.add(transaction)
        db.session.commit()

        logger.info(f"Money sent successfully: {transaction_id}")

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Money sent successfully",
                    "transaction": transaction.to_dict(),
                    "updated_balance": str(from_account.available_balance),
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Send money error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to send money"}), 500


@api_bp.route("/transactions/deposit", methods=["POST"])
@token_required
def deposit_money():
    """Deposit money transaction"""
    try:
        user = request.current_user
        data = request.get_json()

        if not data:
            return (
                jsonify(
                    {"success": False, "error": "Request body must contain valid JSON"}
                ),
                400,
            )

        # Validate required fields
        required_fields = ["to_account_id", "amount", "description"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": f"Missing required fields: {", ".join(missing_fields)}",
                    }
                ),
                400,
            )

        # Verify account belongs to user
        to_account = Account.query.filter_by(
            id=data["to_account_id"], user_id=user.id
        ).first()
        if not to_account:
            return jsonify({"success": False, "error": "Account not found"}), 404

        amount = Decimal(str(data["amount"]))
        if amount <= 0:
            return jsonify({"success": False, "error": "Amount must be positive"}), 400

        # Create transaction
        transaction_id = f"TXN{str(uuid.uuid4()).replace('-', '')[:12].upper()}"
        transaction = Transaction(
            user_id=user.id,
            account_id=to_account.id,
            transaction_id=transaction_id,
            transaction_type="credit",
            transaction_category="deposit",
            description=data["description"],
            status="completed",
            processed_at=datetime.now(timezone.utc),
        )
        transaction.amount = amount

        # Update account balance
        to_account.available_balance += amount
        to_account.current_balance += amount
        to_account.updated_at = datetime.now(timezone.utc)

        db.session.add(transaction)
        db.session.commit()

        logger.info(f"Money deposited successfully: {transaction_id}")

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Money deposited successfully",
                    "transaction": transaction.to_dict(),
                    "updated_balance": str(to_account.available_balance),
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Deposit money error: {str(e)}")
        return jsonify({"success": False, "error": "Failed to deposit money"}), 500


@api_bp.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return (
        jsonify(
            {
                "success": True,
                "message": "Flowlet API is running",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        ),
        200,
    )


@api_bp.route("/info", methods=["GET"])
def api_info():
    """API information endpoint"""
    return (
        jsonify(
            {
                "name": "Flowlet API",
                "version": "1.0.0",
                "description": "Banking application API",
                "endpoints": {
                    "auth": {
                        "register": "/api/v1/auth/register",
                        "login": "/api/v1/auth/login",
                    },
                    "accounts": "/api/v1/accounts",
                    "health": "/api/v1/health",
                },
            }
        ),
        200,
    )

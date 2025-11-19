import structlog
from app import db, limiter
from app.models.audit_log import AuditAction, AuditLog
from app.models.user import User, UserStatus
from app.utils.security import log_security_event
from app.utils.validators import validate_password_strength
from flask import Blueprint, jsonify, request
from flask_jwt_extended import (API, Authentication, Schema, ValidationError,
                                """, create_access_token, create_refresh_token,
                                endpoints, fields, from, get_jwt,
                                get_jwt_identity, import, improved,
                                jwt_required, marshmallow, security, with)

logger = structlog.get_logger()

auth_bp = Blueprint("auth", __name__)

# Blacklisted tokens (in production, use Redis)
blacklisted_tokens = set()


class RegisterSchema(Schema):
    """Registration validation schema"""

    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate_password_strength)
    first_name = fields.Str(required=True, validate=lambda x: len(x.strip()) >= 2)
    last_name = fields.Str(required=True, validate=lambda x: len(x.strip()) >= 2)
    phone_number = fields.Str(missing=None)
    terms_accepted = fields.Bool(required=True, validate=lambda x: x is True)
    privacy_accepted = fields.Bool(required=True, validate=lambda x: x is True)


class LoginSchema(Schema):
    """Login validation schema"""

    email = fields.Email(required=True)
    password = fields.Str(required=True)
    remember_me = fields.Bool(missing=False)


@auth_bp.route("/register", methods=["POST"])
@limiter.limit("5 per minute")
def register():
    """User registration with improved validation"""
    try:
        # Validate request data
        schema = RegisterSchema()
        try:
            data = schema.load(request.get_json() or {})
        except ValidationError as err:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Validation failed",
                        "details": err.messages,
                    }
                ),
                400,
            )

        # Check if user already exists
        existing_user = User.query.filter_by(email=data["email"].lower()).first()
        if existing_user:
            # Log security event
            log_security_event(
                event_type="registration_attempt_existing_email",
                details={"email": data["email"]},
                ip_address=request.remote_addr,
            )
            return (
                jsonify(
                    {"success": False, "error": "User with this email already exists"}
                ),
                409,
            )

        # Create new user
        user = User(
            email=data["email"].lower(),
            first_name=data["first_name"].strip(),
            last_name=data["last_name"].strip(),
            phone_number=data.get("phone_number"),
            status=UserStatus.PENDING_VERIFICATION,
        )
        user.set_password(data["password"])

        db.session.add(user)
        db.session.flush()  # Get the user ID

        # Create default checking account
        import uuid

        from app.models.account import Account, AccountType

        account_number = f"ACC{str(uuid.uuid4()).replace('-', '')[:12].upper()}"
        account = Account(
            user_id=user.id,
            account_name=f"{user.first_name}'s Checking Account",
            account_number=account_number,
            account_type=AccountType.CHECKING,
            currency="USD",
            is_primary=True,
        )
        # Set initial demo balance
        account.available_balance = 1000.00
        account.current_balance = 1000.00

        db.session.add(account)

        # Create audit log
        audit_log = AuditLog(
            user_id=user.id,
            action=AuditAction.USER_REGISTERED,
            details={"email": user.email, "account_created": account.account_number},
            ip_address=request.remote_addr,
        )
        db.session.add(audit_log)

        db.session.commit()

        # Create tokens
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))

        logger.info(
            "User registered successfully", user_id=str(user.id), email=user.email
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "User registered successfully",
                    "user": user.to_dict(),
                    "account": account.to_dict(),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "Bearer",
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        logger.error("Registration failed", error=str(e))
        return jsonify({"success": False, "error": "Registration failed"}), 500


@auth_bp.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    """User login with improved security"""
    try:
        # Validate request data
        schema = LoginSchema()
        try:
            data = schema.load(request.get_json() or {})
        except ValidationError as err:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Validation failed",
                        "details": err.messages,
                    }
                ),
                400,
            )

        # Find user by email
        user = User.query.filter_by(email=data["email"].lower()).first()
        if not user:
            log_security_event(
                event_type="login_attempt_invalid_email",
                details={"email": data["email"]},
                ip_address=request.remote_addr,
            )
            return (
                jsonify({"success": False, "error": "Invalid email or password"}),
                401,
            )

        # Check if user can login
        if not user.can_login():
            log_security_event(
                event_type="login_attempt_locked_account",
                details={"user_id": str(user.id), "status": user.status.value},
                ip_address=request.remote_addr,
                user_id=user.id,
            )
            return (
                jsonify({"success": False, "error": "Account is locked or inactive"}),
                401,
            )

        # Verify password
        if not user.check_password(data["password"]):
            user.increment_failed_login()
            db.session.commit()

            log_security_event(
                event_type="login_attempt_invalid_password",
                details={
                    "user_id": str(user.id),
                    "failed_attempts": user.failed_login_attempts,
                },
                ip_address=request.remote_addr,
                user_id=user.id,
            )
            return (
                jsonify({"success": False, "error": "Invalid email or password"}),
                401,
            )

        # Successful login
        user.reset_failed_login()

        # Create audit log
        audit_log = AuditLog(
            user_id=user.id,
            action=AuditAction.USER_LOGIN,
            details={"ip_address": request.remote_addr},
            ip_address=request.remote_addr,
        )
        db.session.add(audit_log)
        db.session.commit()

        # Create tokens
        additional_claims = {"role": user.role.value, "status": user.status.value}
        access_token = create_access_token(
            identity=str(user.id), additional_claims=additional_claims
        )
        refresh_token = create_refresh_token(identity=str(user.id))

        logger.info(
            "User logged in successfully", user_id=str(user.id), email=user.email
        )

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Login successful",
                    "user": user.to_dict(),
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "Bearer",
                }
            ),
            200,
        )

    except Exception as e:
        logger.error("Login failed", error=str(e))
        return jsonify({"success": False, "error": "Login failed"}), 500


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user or not user.can_login():
            return jsonify({"success": False, "error": "Invalid user"}), 401

        # Create new access token
        additional_claims = {"role": user.role.value, "status": user.status.value}
        access_token = create_access_token(
            identity=str(user.id), additional_claims=additional_claims
        )

        return (
            jsonify(
                {"success": True, "access_token": access_token, "token_type": "Bearer"}
            ),
            200,
        )

    except Exception as e:
        logger.error("Token refresh failed", error=str(e))
        return jsonify({"success": False, "error": "Token refresh failed"}), 500


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    """Logout user and blacklist token"""
    try:
        current_user_id = get_jwt_identity()
        jti = get_jwt()["jti"]  # JWT ID

        # Add token to blacklist (in production, use Redis)
        blacklisted_tokens.add(jti)

        # Create audit log
        audit_log = AuditLog(
            user_id=current_user_id,
            action=AuditAction.USER_LOGOUT,
            details={"ip_address": request.remote_addr},
            ip_address=request.remote_addr,
        )
        db.session.add(audit_log)
        db.session.commit()

        logger.info("User logged out successfully", user_id=current_user_id)

        return jsonify({"success": True, "message": "Logout successful"}), 200

    except Exception as e:
        logger.error("Logout failed", error=str(e))
        return jsonify({"success": False, "error": "Logout failed"}), 500


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)

        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        return jsonify({"success": True, "user": user.to_dict()}), 200

    except Exception as e:
        logger.error("Get current user failed", error=str(e))
        return (
            jsonify({"success": False, "error": "Failed to get user information"}),
            500,
        )


# JWT token blacklist checker
@auth_bp.before_app_request
def check_if_token_revoked():
    """Check if JWT token is blacklisted"""
    pass  # Implementation would check Redis in production

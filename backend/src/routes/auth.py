"""
Enhanced Authentication System with Financial-Grade Security
"""

from flask import Blueprint, request, jsonify, g, current_app
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone, timedelta
import uuid
import re
import logging
from functools import wraps
import jwt
import secrets
import pyotp
import qrcode
import io
import base64

# Import refactored modules
from ..models.database import db
from ..models.user import User
from ..models.account import Account, AccountType, AccountStatus
from ..security.password_security import (
    hash_password,
    check_password,
    validate_password_strength,
)
from ..security.token_manager import TokenManager  # Assuming this will be created/fixed
from ..security.audit_logger import audit_logger
from ..models.audit_log import AuditEventType, AuditSeverity
from ..utils.validators import InputValidator
from ..utils.rate_limiter import RateLimiter  # Assuming this will be created/fixed

# Create blueprint
auth_bp = Blueprint("auth", __name__, url_prefix="/api/v1/auth")

# Configure logging
logger = logging.getLogger(__name__)

# Initialize security components (using imported singletons or classes)
token_manager = TokenManager()
rate_limiter = RateLimiter()  # Placeholder for now


def token_required(f):
    """Enhanced JWT token validation decorator"""

    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Get token from Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="Authentication failed: missing token",
                severity=AuditSeverity.MEDIUM,
                ip_address=request.remote_addr,
            )
            return (
                jsonify(
                    {
                        "error": "Authentication token is required",
                        "code": "TOKEN_MISSING",
                    }
                ),
                401,
            )

        try:
            # Validate and decode token
            payload = token_manager.validate_access_token(token)
            current_user = db.session.get(User, payload["user_id"])

            if not current_user:
                audit_logger.log_event(
                    event_type=AuditEventType.SECURITY_ALERT,
                    description="Authentication failed: user not found",
                    severity=AuditSeverity.HIGH,
                    details={"user_id": payload.get("user_id")},
                    ip_address=request.remote_addr,
                )
                return (
                    jsonify({"error": "User not found", "code": "USER_NOT_FOUND"}),
                    401,
                )

            if not current_user.is_active:
                audit_logger.log_event(
                    event_type=AuditEventType.SECURITY_ALERT,
                    description="Authentication failed: user inactive",
                    severity=AuditSeverity.HIGH,
                    user_id=current_user.id,
                    ip_address=request.remote_addr,
                )
                return (
                    jsonify(
                        {"error": "User account is inactive", "code": "USER_INACTIVE"}
                    ),
                    401,
                )

            # Store current user in request context
            g.current_user = current_user

            return f(*args, **kwargs)

        except jwt.ExpiredSignatureError:
            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="Authentication failed: token expired",
                severity=AuditSeverity.MEDIUM,
                ip_address=request.remote_addr,
            )
            return jsonify({"error": "Token has expired", "code": "TOKEN_EXPIRED"}), 401
        except jwt.InvalidTokenError:
            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="Authentication failed: invalid token",
                severity=AuditSeverity.MEDIUM,
                ip_address=request.remote_addr,
            )
            return jsonify({"error": "Invalid token", "code": "TOKEN_INVALID"}), 401
        except Exception as e:
            logger.error(f"Token validation error: {str(e)}")
            return (
                jsonify({"error": "Authentication failed", "code": "AUTH_ERROR"}),
                401,
            )

    return decorated


def admin_required(f):
    """Decorator to require admin privileges"""

    @wraps(f)
    @token_required
    def decorated(*args, **kwargs):
        if not g.current_user.is_admin:
            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="Authorization failed: insufficient privileges",
                severity=AuditSeverity.HIGH,
                user_id=g.current_user.id,
                ip_address=request.remote_addr,
            )
            return (
                jsonify(
                    {
                        "error": "Admin privileges required",
                        "code": "INSUFFICIENT_PRIVILEGES",
                    }
                ),
                403,
            )
        return f(*args, **kwargs)

    return decorated


@auth_bp.route("/register", methods=["POST"])
@rate_limiter.limit("5 per minute")
def register():
    """
    Enhanced user registration with comprehensive validation
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

        # Validate required fields
        required_fields = ["email", "password", "first_name", "last_name"]
        missing_fields = [field for field in required_fields if field not in data]
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

        # Validate email format
        is_valid, message = InputValidator.validate_email(data["email"])
        if not is_valid:
            return jsonify({"error": message, "code": "INVALID_EMAIL"}), 400
        data["email"] = message  # Use the normalized email

        # Validate password strength
        is_valid, message = InputValidator.validate_password(data["password"])
        if not is_valid:
            return jsonify({"error": message, "code": "WEAK_PASSWORD"}), 400

        # Check if user already exists
        existing_user = db.session.execute(
            db.select(User).filter_by(email=data["email"])
        ).scalar_one_or_none()
        if existing_user:
            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="Registration failed: email already exists",
                severity=AuditSeverity.MEDIUM,
                details={"email": data["email"]},
                ip_address=request.remote_addr,
            )
            return (
                jsonify(
                    {
                        "error": "User with this email already exists",
                        "code": "EMAIL_EXISTS",
                    }
                ),
                409,
            )  # Use 409 Conflict

        # Hash password securely
        password_hash = hash_password(data["password"])

        # Create new user
        user = User(
            email=data["email"],
            first_name=data["first_name"],
            last_name=data["last_name"],
            phone=data.get("phone"),
            password_hash=password_hash,
            is_active=True,
            email_verified=False,
            two_factor_enabled=False,
            failed_login_attempts=0,
            password_changed_at=datetime.now(timezone.utc),
        )

        # Set date of birth if provided
        if "date_of_birth" in data:
            is_valid, message, dob = InputValidator.validate_date(
                data["date_of_birth"], "%Y-%m-%d"
            )
            if not is_valid:
                return jsonify({"error": message, "code": "INVALID_DATE_FORMAT"}), 400
            user.date_of_birth = dob

        # Set address if provided
        if "address" in data and isinstance(data["address"], dict):
            address_data = data["address"]
            # Basic sanitization, full validation should be done in a dedicated service
            user.address_street = address_data.get("street", "")
            user.address_city = address_data.get("city", "")
            user.address_state = address_data.get("state", "")
            user.address_postal_code = address_data.get("postal_code", "")
            user.address_country = address_data.get("country", "")

        db.session.add(user)
        db.session.flush()  # Get the user ID

        # Create default checking account for the user
        account = Account(
            user_id=user.id,
            account_name=f"{user.first_name}'s Checking Account",
            account_type=AccountType.CHECKING,
            currency="USD",
            status=AccountStatus.ACTIVE,
        )

        db.session.add(account)
        db.session.commit()

        # Generate email verification token (stub)
        verification_token = token_manager.generate_verification_token(user.id, "email")

        # Log successful registration
        audit_logger.log_event(
            event_type=AuditEventType.USER_REGISTRATION,
            description="User registered successfully",
            user_id=user.id,
            severity=AuditSeverity.MEDIUM,
            ip_address=request.remote_addr,
        )

        return (
            jsonify(
                {
                    "message": "User registered successfully. Please check your email for verification.",
                    "user_id": user.id,
                    "email": user.email,
                    "verification_token": verification_token,  # Should be sent via email in production
                }
            ),
            201,
        )

    except IntegrityError:
        db.session.rollback()
        return (
            jsonify(
                {
                    "error": "A user with this email or phone already exists",
                    "code": "INTEGRITY_ERROR",
                }
            ),
            409,
        )
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during registration",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


@auth_bp.route("/login", methods=["POST"])
@rate_limiter.limit("10 per minute")
def login():
    """
    User login endpoint with enhanced security features (2FA, brute-force protection)
    """
    try:
        data = request.get_json()
        if not data or "email" not in data or "password" not in data:
            return (
                jsonify(
                    {
                        "error": "Missing email or password",
                        "code": "MISSING_CREDENTIALS",
                    }
                ),
                400,
            )

        email = data["email"].lower()
        password = data["password"]

        user = db.session.execute(
            db.select(User).filter_by(email=email)
        ).scalar_one_or_none()

        if not user:
            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="Login failed: user not found",
                severity=AuditSeverity.MEDIUM,
                details={"email": email},
                ip_address=request.remote_addr,
            )
            return (
                jsonify(
                    {"error": "Invalid credentials", "code": "INVALID_CREDENTIALS"}
                ),
                401,
            )

        # Brute-force protection check
        if user.is_locked():
            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="Login failed: account locked",
                user_id=user.id,
                severity=AuditSeverity.HIGH,
                ip_address=request.remote_addr,
            )
            return (
                jsonify(
                    {
                        "error": "Account locked due to too many failed attempts",
                        "code": "ACCOUNT_LOCKED",
                    }
                ),
                401,
            )

        if not check_password(user.password_hash, password):
            user.failed_login_attempts += 1
            db.session.commit()

            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="Login failed: incorrect password",
                user_id=user.id,
                severity=AuditSeverity.MEDIUM,
                ip_address=request.remote_addr,
            )

            if user.is_locked():
                return (
                    jsonify(
                        {
                            "error": "Account locked due to too many failed attempts",
                            "code": "ACCOUNT_LOCKED",
                        }
                    ),
                    401,
                )

            return (
                jsonify(
                    {"error": "Invalid credentials", "code": "INVALID_CREDENTIALS"}
                ),
                401,
            )

        # Successful password check, reset failed attempts
        user.failed_login_attempts = 0
        user.last_login_at = datetime.now(timezone.utc)
        db.session.commit()

        # Check for 2FA requirement
        if user.two_factor_enabled:
            # Generate a temporary token for 2FA verification
            temp_token = token_manager.generate_temp_token(user.id, "2fa_pending")

            audit_logger.log_event(
                event_type=AuditEventType.USER_LOGIN,
                description="Login successful, 2FA required",
                user_id=user.id,
                severity=AuditSeverity.LOW,
                ip_address=request.remote_addr,
            )

            return (
                jsonify(
                    {
                        "message": "Two-factor authentication required",
                        "code": "2FA_REQUIRED",
                        "temp_token": temp_token,
                    }
                ),
                202,
            )

        # Generate final tokens
        access_token = token_manager.generate_access_token(user.id)
        refresh_token = token_manager.generate_refresh_token(user.id)

        audit_logger.log_event(
            event_type=AuditEventType.USER_LOGIN,
            description="Login successful",
            user_id=user.id,
            severity=AuditSeverity.LOW,
            ip_address=request.remote_addr,
        )

        return (
            jsonify(
                {
                    "message": "Login successful",
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "token_type": "Bearer",
                    "expires_in": token_manager.ACCESS_TOKEN_EXPIRY_SECONDS,
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during login",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


@auth_bp.route("/2fa/verify", methods=["POST"])
@rate_limiter.limit("10 per minute")
def verify_2fa():
    """Verify 2FA code and issue final tokens"""
    try:
        data = request.get_json()
        if not data or "temp_token" not in data or "code" not in data:
            return (
                jsonify({"error": "Missing token or 2FA code", "code": "MISSING_DATA"}),
                400,
            )

        temp_token = data["temp_token"]
        code = data["code"]

        try:
            payload = token_manager.validate_temp_token(temp_token)
            if payload.get("purpose") != "2fa_pending":
                raise jwt.InvalidTokenError("Invalid token purpose")

            user = db.session.get(User, payload["user_id"])
            if not user or not user.two_factor_secret:
                return (
                    jsonify(
                        {
                            "error": "Invalid user or 2FA not enabled",
                            "code": "2FA_NOT_ENABLED",
                        }
                    ),
                    400,
                )

            totp = pyotp.TOTP(user.two_factor_secret)
            if not totp.verify(code):
                audit_logger.log_event(
                    event_type=AuditEventType.SECURITY_ALERT,
                    description="2FA verification failed: invalid code",
                    user_id=user.id,
                    severity=AuditSeverity.MEDIUM,
                    ip_address=request.remote_addr,
                )
                return (
                    jsonify({"error": "Invalid 2FA code", "code": "INVALID_2FA_CODE"}),
                    401,
                )

            # 2FA successful, generate final tokens
            access_token = token_manager.generate_access_token(user.id)
            refresh_token = token_manager.generate_refresh_token(user.id)

            audit_logger.log_event(
                event_type=AuditEventType.USER_LOGIN,
                description="2FA verification successful, user logged in",
                user_id=user.id,
                severity=AuditSeverity.LOW,
                ip_address=request.remote_addr,
            )

            return (
                jsonify(
                    {
                        "message": "Login successful",
                        "access_token": access_token,
                        "refresh_token": refresh_token,
                        "token_type": "Bearer",
                        "expires_in": token_manager.ACCESS_TOKEN_EXPIRY_SECONDS,
                    }
                ),
                200,
            )

        except jwt.ExpiredSignatureError:
            return (
                jsonify({"error": "Temporary token expired", "code": "TOKEN_EXPIRED"}),
                401,
            )
        except jwt.InvalidTokenError:
            return (
                jsonify({"error": "Invalid temporary token", "code": "TOKEN_INVALID"}),
                401,
            )

    except Exception as e:
        logger.error(f"2FA verification error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during 2FA verification",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


@auth_bp.route("/refresh", methods=["POST"])
@rate_limiter.limit("5 per minute")
def refresh_token():
    """Refresh access token using refresh token"""
    try:
        data = request.get_json()
        if not data or "refresh_token" not in data:
            return (
                jsonify({"error": "Missing refresh token", "code": "MISSING_TOKEN"}),
                400,
            )

        refresh_token = data["refresh_token"]

        try:
            new_access_token, new_refresh_token, user_id = token_manager.refresh_tokens(
                refresh_token
            )

            audit_logger.log_event(
                event_type=AuditEventType.DATA_ACCESS,
                description="Token refreshed successfully",
                user_id=user_id,
                severity=AuditSeverity.LOW,
                ip_address=request.remote_addr,
            )

            return (
                jsonify(
                    {
                        "message": "Token refreshed successfully",
                        "access_token": new_access_token,
                        "refresh_token": new_refresh_token,
                        "token_type": "Bearer",
                        "expires_in": token_manager.ACCESS_TOKEN_EXPIRY_SECONDS,
                    }
                ),
                200,
            )

        except jwt.ExpiredSignatureError:
            return (
                jsonify({"error": "Refresh token expired", "code": "TOKEN_EXPIRED"}),
                401,
            )
        except jwt.InvalidTokenError:
            return (
                jsonify({"error": "Invalid refresh token", "code": "TOKEN_INVALID"}),
                401,
            )

    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during token refresh",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


@auth_bp.route("/logout", methods=["POST"])
@token_required
def logout():
    """User logout (optional: blacklist token)"""
    # In a stateless JWT system, logout is client-side.
    # For security, we can optionally blacklist the access token.
    # The current implementation relies on token expiry.

    # Log the logout event
    audit_logger.log_event(
        event_type=AuditEventType.USER_LOGOUT,
        description="User logged out",
        user_id=g.current_user.id,
        severity=AuditSeverity.LOW,
        ip_address=request.remote_addr,
    )

    return jsonify({"message": "Logout successful"}), 200


# --- 2FA Management Endpoints ---


@auth_bp.route("/2fa/setup", methods=["POST"])
@token_required
def setup_2fa():
    """Initiate 2FA setup by generating a secret and QR code"""
    try:
        user = g.current_user

        if user.two_factor_enabled:
            return (
                jsonify(
                    {"error": "2FA is already enabled", "code": "2FA_ALREADY_ENABLED"}
                ),
                400,
            )

        # Generate a new secret
        secret = pyotp.random_base32()

        # Generate provisioning URI for QR code
        app_name = current_app.config.get("APP_NAME", "Flowlet")
        uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email, issuer_name=app_name
        )

        # Generate QR code image as base64 string
        img_buffer = io.BytesIO()
        qrcode.make(uri).save(img_buffer, format="PNG")
        qr_code_base64 = base64.b64encode(img_buffer.getvalue()).decode("utf-8")

        # Store the secret temporarily in the session or a temporary token
        # For this stateless API, we'll return the secret and require it back for finalization
        # NOTE: In a real app, this secret should be stored securely and temporarily.
        # For now, we'll return it, but the client must treat it as highly sensitive.

        return (
            jsonify(
                {
                    "message": "2FA setup initiated. Scan the QR code and verify the code.",
                    "secret": secret,
                    "qr_code_base64": qr_code_base64,
                    "uri": uri,
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"2FA setup error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during 2FA setup",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


@auth_bp.route("/2fa/enable", methods=["POST"])
@token_required
def enable_2fa():
    """Finalize 2FA setup by verifying the code and saving the secret"""
    try:
        data = request.get_json()
        if not data or "secret" not in data or "code" not in data:
            return (
                jsonify(
                    {"error": "Missing secret or 2FA code", "code": "MISSING_DATA"}
                ),
                400,
            )

        user = g.current_user
        secret = data["secret"]
        code = data["code"]

        if user.two_factor_enabled:
            return (
                jsonify(
                    {"error": "2FA is already enabled", "code": "2FA_ALREADY_ENABLED"}
                ),
                400,
            )

        # Verify the code with the provided secret
        totp = pyotp.TOTP(secret)
        if not totp.verify(code):
            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="2FA enablement failed: invalid code",
                user_id=user.id,
                severity=AuditSeverity.MEDIUM,
                ip_address=request.remote_addr,
            )
            return (
                jsonify(
                    {
                        "error": "Invalid 2FA code. Please try again.",
                        "code": "INVALID_2FA_CODE",
                    }
                ),
                401,
            )

        # Save the secret and enable 2FA
        user.two_factor_secret = secret
        user.two_factor_enabled = True
        db.session.commit()

        audit_logger.log_event(
            event_type=AuditEventType.SECURITY_ALERT,
            description="2FA enabled successfully",
            user_id=user.id,
            severity=AuditSeverity.MEDIUM,
            ip_address=request.remote_addr,
        )

        return (
            jsonify({"message": "Two-factor authentication enabled successfully"}),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"2FA enable error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during 2FA enablement",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


@auth_bp.route("/2fa/disable", methods=["POST"])
@token_required
def disable_2fa():
    """Disable 2FA by verifying the code"""
    try:
        data = request.get_json()
        if not data or "code" not in data:
            return jsonify({"error": "Missing 2FA code", "code": "MISSING_DATA"}), 400

        user = g.current_user
        code = data["code"]

        if not user.two_factor_enabled:
            return (
                jsonify({"error": "2FA is not enabled", "code": "2FA_NOT_ENABLED"}),
                400,
            )

        # Verify the code with the stored secret
        totp = pyotp.TOTP(user.two_factor_secret)
        if not totp.verify(code):
            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="2FA disable failed: invalid code",
                user_id=user.id,
                severity=AuditSeverity.MEDIUM,
                ip_address=request.remote_addr,
            )
            return (
                jsonify(
                    {
                        "error": "Invalid 2FA code. Please try again.",
                        "code": "INVALID_2FA_CODE",
                    }
                ),
                401,
            )

        # Disable 2FA
        user.two_factor_secret = None
        user.two_factor_enabled = False
        db.session.commit()

        audit_logger.log_event(
            event_type=AuditEventType.SECURITY_ALERT,
            description="2FA disabled successfully",
            user_id=user.id,
            severity=AuditSeverity.MEDIUM,
            ip_address=request.remote_addr,
        )

        return (
            jsonify({"message": "Two-factor authentication disabled successfully"}),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"2FA disable error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during 2FA disablement",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


# --- Password Management Endpoints ---


@auth_bp.route("/password/change", methods=["POST"])
@token_required
def change_password():
    """Change user password"""
    try:
        data = request.get_json()
        if not data or "old_password" not in data or "new_password" not in data:
            return (
                jsonify(
                    {"error": "Missing old or new password", "code": "MISSING_DATA"}
                ),
                400,
            )

        user = g.current_user
        old_password = data["old_password"]
        new_password = data["new_password"]

        # 1. Verify old password
        if not check_password(user.password_hash, old_password):
            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="Password change failed: incorrect old password",
                user_id=user.id,
                severity=AuditSeverity.MEDIUM,
                ip_address=request.remote_addr,
            )
            return (
                jsonify(
                    {"error": "Incorrect old password", "code": "INCORRECT_PASSWORD"}
                ),
                401,
            )

        # 2. Validate new password strength
        is_valid, message = InputValidator.validate_password(new_password)
        if not is_valid:
            return jsonify({"error": message, "code": "WEAK_PASSWORD"}), 400

        # 3. Check if new password is the same as old password
        if check_password(user.password_hash, new_password):
            return (
                jsonify(
                    {
                        "error": "New password cannot be the same as the old password",
                        "code": "PASSWORD_REUSE",
                    }
                ),
                400,
            )

        # 4. Hash and save new password
        user.password_hash = hash_password(new_password)
        user.password_changed_at = datetime.now(timezone.utc)
        db.session.commit()

        audit_logger.log_event(
            event_type=AuditEventType.PASSWORD_CHANGE,
            description="Password changed successfully",
            user_id=user.id,
            severity=AuditSeverity.MEDIUM,
            ip_address=request.remote_addr,
        )

        return jsonify({"message": "Password changed successfully"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Password change error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during password change",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


@auth_bp.route("/password/reset/request", methods=["POST"])
@rate_limiter.limit("3 per hour")
def request_password_reset():
    """Request a password reset token via email"""
    try:
        data = request.get_json()
        if not data or "email" not in data:
            return jsonify({"error": "Missing email", "code": "MISSING_DATA"}), 400

        email = data["email"].lower()
        user = db.session.execute(
            db.select(User).filter_by(email=email)
        ).scalar_one_or_none()

        # Always return a generic success message to prevent user enumeration
        generic_success = (
            jsonify(
                {
                    "message": "If an account with that email exists, a password reset link has been sent."
                }
            ),
            200,
        )

        if not user:
            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="Password reset request for non-existent email",
                severity=AuditSeverity.LOW,
                details={"email": email},
                ip_address=request.remote_addr,
            )
            return generic_success

        # Generate a secure, time-limited reset token
        reset_token = token_manager.generate_reset_token(user.id)

        # TODO: Send email with the reset token link
        # notification_service.send_email(user.email, "Password Reset", f"Your reset link: {reset_token}")

        audit_logger.log_event(
            event_type=AuditEventType.SECURITY_ALERT,
            description="Password reset token generated",
            user_id=user.id,
            severity=AuditSeverity.MEDIUM,
            ip_address=request.remote_addr,
        )

        # For development/testing, return the token
        if current_app.config.get("DEBUG"):
            return (
                jsonify(
                    {
                        "message": "Password reset token generated (DEBUG)",
                        "reset_token": reset_token,
                    }
                ),
                200,
            )

        return generic_success

    except Exception as e:
        logger.error(f"Password reset request error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during password reset request",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


@auth_bp.route("/password/reset/confirm", methods=["POST"])
@rate_limiter.limit("5 per hour")
def confirm_password_reset():
    """Confirm password reset with token and new password"""
    try:
        data = request.get_json()
        if not data or "token" not in data or "new_password" not in data:
            return (
                jsonify(
                    {"error": "Missing token or new password", "code": "MISSING_DATA"}
                ),
                400,
            )

        reset_token = data["token"]
        new_password = data["new_password"]

        try:
            payload = token_manager.validate_reset_token(reset_token)
            user = db.session.get(User, payload["user_id"])

            if not user:
                return (
                    jsonify(
                        {"error": "Invalid or expired token", "code": "TOKEN_INVALID"}
                    ),
                    401,
                )

            # 1. Validate new password strength
            is_valid, message = InputValidator.validate_password(new_password)
            if not is_valid:
                return jsonify({"error": message, "code": "WEAK_PASSWORD"}), 400

            # 2. Hash and save new password
            user.password_hash = hash_password(new_password)
            user.password_changed_at = datetime.now(timezone.utc)
            db.session.commit()

            audit_logger.log_event(
                event_type=AuditEventType.PASSWORD_CHANGE,
                description="Password reset confirmed successfully",
                user_id=user.id,
                severity=AuditSeverity.HIGH,
                ip_address=request.remote_addr,
            )

            return (
                jsonify(
                    {
                        "message": "Password reset successfully. You can now log in with your new password."
                    }
                ),
                200,
            )

        except jwt.ExpiredSignatureError:
            return (
                jsonify(
                    {"error": "Password reset token expired", "code": "TOKEN_EXPIRED"}
                ),
                401,
            )
        except jwt.InvalidTokenError:
            return (
                jsonify(
                    {"error": "Invalid password reset token", "code": "TOKEN_INVALID"}
                ),
                401,
            )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Password reset confirm error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during password reset confirmation",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


# --- Email Verification Endpoints ---


@auth_bp.route("/verify/email/request", methods=["POST"])
@token_required
@rate_limiter.limit("1 per minute")
def request_email_verification():
    """Request a new email verification token"""
    try:
        user = g.current_user

        if user.email_verified:
            return jsonify({"message": "Email is already verified"}), 200

        # Generate email verification token
        verification_token = token_manager.generate_verification_token(user.id, "email")

        # TODO: Send email with the verification token link
        # notification_service.send_email(user.email, "Email Verification", f"Your verification link: {verification_token}")

        audit_logger.log_event(
            event_type=AuditEventType.SECURITY_ALERT,
            description="Email verification token requested",
            user_id=user.id,
            severity=AuditSeverity.LOW,
            ip_address=request.remote_addr,
        )

        # For development/testing, return the token
        if current_app.config.get("DEBUG"):
            return (
                jsonify(
                    {
                        "message": "Email verification token generated (DEBUG)",
                        "verification_token": verification_token,
                    }
                ),
                200,
            )

        return (
            jsonify({"message": "Verification email sent. Please check your inbox."}),
            200,
        )

    except Exception as e:
        logger.error(f"Email verification request error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during email verification request",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


@auth_bp.route("/verify/email/confirm", methods=["POST"])
@rate_limiter.limit("5 per hour")
def confirm_email_verification():
    """Confirm email verification with token"""
    try:
        data = request.get_json()
        if not data or "token" not in data:
            return (
                jsonify(
                    {"error": "Missing verification token", "code": "MISSING_DATA"}
                ),
                400,
            )

        verification_token = data["token"]

        try:
            payload = token_manager.validate_verification_token(verification_token)
            user = db.session.get(User, payload["user_id"])

            if not user or payload.get("purpose") != "email_verification":
                return (
                    jsonify(
                        {"error": "Invalid or expired token", "code": "TOKEN_INVALID"}
                    ),
                    401,
                )

            if user.email_verified:
                return jsonify({"message": "Email is already verified"}), 200

            user.email_verified = True
            db.session.commit()

            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="Email verified successfully",
                user_id=user.id,
                severity=AuditSeverity.MEDIUM,
                ip_address=request.remote_addr,
            )

            return jsonify({"message": "Email verified successfully"}), 200

        except jwt.ExpiredSignatureError:
            return (
                jsonify(
                    {"error": "Verification token expired", "code": "TOKEN_EXPIRED"}
                ),
                401,
            )
        except jwt.InvalidTokenError:
            return (
                jsonify(
                    {"error": "Invalid verification token", "code": "TOKEN_INVALID"}
                ),
                401,
            )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Email verification confirm error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during email verification confirmation",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


# --- Utility Endpoints ---


@auth_bp.route("/status", methods=["GET"])
@token_required
def status():
    """Check user authentication status"""
    user = g.current_user
    return (
        jsonify(
            {
                "message": "Authenticated",
                "user_id": user.id,
                "email": user.email,
                "is_admin": user.is_admin,
                "two_factor_enabled": user.two_factor_enabled,
                "email_verified": user.email_verified,
            }
        ),
        200,
    )

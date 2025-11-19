import base64
import hashlib
import logging
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from io import BytesIO
from typing import Any, Dict, List, Optional

import pyotp
import qrcode
from sqlalchemy.orm import Session

"""
Advanced Authentication Service
===============================

Multi-factor authentication and advanced security features for financial applications.
"""


class AuthenticationMethod(Enum):
    """Authentication methods."""

    PASSWORD = "password"
    SMS = "sms"
    EMAIL = "email"
    TOTP = "totp"
    BIOMETRIC = "biometric"
    HARDWARE_TOKEN = "hardware_token"
    PUSH_NOTIFICATION = "push_notification"


class AuthenticationStatus(Enum):
    """Authentication status."""

    SUCCESS = "success"
    FAILED = "failed"
    PENDING = "pending"
    EXPIRED = "expired"
    BLOCKED = "blocked"


@dataclass
class AuthenticationResult:
    """Authentication result."""

    user_id: str
    session_id: str
    status: AuthenticationStatus
    methods_used: List[AuthenticationMethod]
    risk_score: float
    expires_at: datetime
    requires_additional_auth: bool = False
    next_auth_methods: List[AuthenticationMethod] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "session_id": self.session_id,
            "status": self.status.value,
            "methods_used": [method.value for method in self.methods_used],
            "risk_score": self.risk_score,
            "expires_at": self.expires_at.isoformat(),
            "requires_additional_auth": self.requires_additional_auth,
            "next_auth_methods": [
                method.value for method in (self.next_auth_methods or [])
            ],
        }


class AdvancedAuthenticationService:
    """
    Advanced authentication service with multi-factor authentication.

    Features:
    - Multi-factor authentication (MFA)
    - Risk-based authentication
    - Biometric authentication
    - Hardware token support
    - Session management
    - Account lockout protection
    - Adaptive authentication
    """

    def __init__(self, db_session: Session, config: Dict[str, Any] = None):
        self.db = db_session
        self.config = config or {}
        self.logger = logging.getLogger(__name__)

        # Authentication data
        self._user_credentials = {}
        self._mfa_secrets = {}
        self._active_sessions = {}
        self._failed_attempts = {}
        self._locked_accounts = {}

        # Initialize service
        self._initialize_auth_service()

    def _initialize_auth_service(self):
        """Initialize the authentication service."""
        self.logger.info("Advanced authentication service initialized")

    async def authenticate_user(
        self,
        user_id: str,
        credentials: Dict[str, Any],
        request_context: Dict[str, Any] = None,
    ) -> AuthenticationResult:
        """
        Authenticate a user with multiple factors.

        Args:
            user_id: User identifier
            credentials: Authentication credentials
            request_context: Request context for risk assessment

        Returns:
            AuthenticationResult
        """

        session_id = str(uuid.uuid4())

        try:
            # Check if account is locked
            if self._is_account_locked(user_id):
                return AuthenticationResult(
                    user_id=user_id,
                    session_id=session_id,
                    status=AuthenticationStatus.BLOCKED,
                    methods_used=[],
                    risk_score=1.0,
                    expires_at=datetime.utcnow(),
                )

            # Assess authentication risk
            risk_score = await self._assess_authentication_risk(
                user_id, request_context or {}
            )

            # Determine required authentication methods
            required_methods = self._determine_required_auth_methods(
                user_id, risk_score
            )

            # Validate provided credentials
            validated_methods = []

            # Password authentication
            if AuthenticationMethod.PASSWORD in required_methods:
                password = credentials.get("password", "")
                if await self._validate_password(user_id, password):
                    validated_methods.append(AuthenticationMethod.PASSWORD)
                else:
                    await self._record_failed_attempt(user_id)
                    return AuthenticationResult(
                        user_id=user_id,
                        session_id=session_id,
                        status=AuthenticationStatus.FAILED,
                        methods_used=[],
                        risk_score=risk_score,
                        expires_at=datetime.utcnow(),
                    )

            # TOTP authentication
            if AuthenticationMethod.TOTP in required_methods:
                totp_code = credentials.get("totp_code", "")
                if await self._validate_totp(user_id, totp_code):
                    validated_methods.append(AuthenticationMethod.TOTP)
                else:
                    return AuthenticationResult(
                        user_id=user_id,
                        session_id=session_id,
                        status=AuthenticationStatus.FAILED,
                        methods_used=validated_methods,
                        risk_score=risk_score,
                        expires_at=datetime.utcnow(),
                    )

            # SMS authentication
            if AuthenticationMethod.SMS in required_methods:
                sms_code = credentials.get("sms_code", "")
                if await self._validate_sms_code(user_id, sms_code):
                    validated_methods.append(AuthenticationMethod.SMS)
                else:
                    return AuthenticationResult(
                        user_id=user_id,
                        session_id=session_id,
                        status=AuthenticationStatus.FAILED,
                        methods_used=validated_methods,
                        risk_score=risk_score,
                        expires_at=datetime.utcnow(),
                    )

            # Check if all required methods are satisfied
            if set(validated_methods) >= set(required_methods):
                # Create session
                session_duration = self._calculate_session_duration(risk_score)
                expires_at = datetime.utcnow() + session_duration

                self._active_sessions[session_id] = {
                    "user_id": user_id,
                    "created_at": datetime.utcnow(),
                    "expires_at": expires_at,
                    "risk_score": risk_score,
                    "methods_used": validated_methods,
                    "last_activity": datetime.utcnow(),
                }

                # Clear failed attempts
                if user_id in self._failed_attempts:
                    del self._failed_attempts[user_id]

                return AuthenticationResult(
                    user_id=user_id,
                    session_id=session_id,
                    status=AuthenticationStatus.SUCCESS,
                    methods_used=validated_methods,
                    risk_score=risk_score,
                    expires_at=expires_at,
                )
            else:
                # Additional authentication required
                remaining_methods = [
                    m for m in required_methods if m not in validated_methods
                ]

                return AuthenticationResult(
                    user_id=user_id,
                    session_id=session_id,
                    status=AuthenticationStatus.PENDING,
                    methods_used=validated_methods,
                    risk_score=risk_score,
                    expires_at=datetime.utcnow() + timedelta(minutes=10),
                    requires_additional_auth=True,
                    next_auth_methods=remaining_methods,
                )

        except Exception as e:
            self.logger.error(f"Authentication error for user {user_id}: {str(e)}")
            return AuthenticationResult(
                user_id=user_id,
                session_id=session_id,
                status=AuthenticationStatus.FAILED,
                methods_used=[],
                risk_score=1.0,
                expires_at=datetime.utcnow(),
            )

    async def _assess_authentication_risk(
        self, user_id: str, request_context: Dict[str, Any]
    ) -> float:
        """Assess authentication risk based on context."""

        risk_score = 0.0

        # IP address risk
        ip_address = request_context.get("ip_address", "")
        if self._is_suspicious_ip(ip_address):
            risk_score += 0.3

        # Geographic risk
        location = request_context.get("location", {})
        if self._is_unusual_location(user_id, location):
            risk_score += 0.2

        # Device risk
        device_fingerprint = request_context.get("device_fingerprint", "")
        if self._is_new_device(user_id, device_fingerprint):
            risk_score += 0.2

        # Time-based risk
        if self._is_unusual_time(user_id):
            risk_score += 0.1

        # Recent failed attempts
        if user_id in self._failed_attempts:
            attempts = len(self._failed_attempts[user_id])
            risk_score += min(attempts * 0.1, 0.3)

        return min(risk_score, 1.0)

    def _determine_required_auth_methods(
        self, user_id: str, risk_score: float
    ) -> List[AuthenticationMethod]:
        """Determine required authentication methods based on risk."""

        methods = [AuthenticationMethod.PASSWORD]  # Always require password

        # Risk-based additional factors
        if risk_score >= 0.7:
            # High risk - require multiple factors
            methods.extend([AuthenticationMethod.TOTP, AuthenticationMethod.SMS])
        elif risk_score >= 0.4:
            # Medium risk - require one additional factor
            methods.append(AuthenticationMethod.TOTP)
        elif risk_score >= 0.2:
            # Low-medium risk - require TOTP if available
            if self._has_totp_enabled(user_id):
                methods.append(AuthenticationMethod.TOTP)

        return methods

    async def _validate_password(self, user_id: str, password: str) -> bool:
        """Validate user password."""

        # Mock password validation
        stored_hash = self._user_credentials.get(user_id, {}).get("password_hash", "")

        if not stored_hash:
            # User not found or no password set
            return False

        # In practice, would use proper password hashing (bcrypt, scrypt, etc.)
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        return password_hash == stored_hash

    async def _validate_totp(self, user_id: str, totp_code: str) -> bool:
        """Validate TOTP code."""

        secret = self._mfa_secrets.get(user_id, {}).get("totp_secret", "")

        if not secret:
            return False

        try:
            totp = pyotp.TOTP(secret)
            return totp.verify(totp_code, valid_window=1)  # Allow 1 window tolerance
        except Exception:
            return False

    async def _validate_sms_code(self, user_id: str, sms_code: str) -> bool:
        """Validate SMS verification code."""

        # Mock SMS code validation
        # In practice, would check against sent codes with expiration
        stored_code = self._mfa_secrets.get(user_id, {}).get("sms_code", "")
        code_timestamp = self._mfa_secrets.get(user_id, {}).get("sms_code_timestamp")

        if not stored_code or not code_timestamp:
            return False

        # Check if code has expired (5 minutes)
        if datetime.utcnow() - code_timestamp > timedelta(minutes=5):
            return False

        return sms_code == stored_code

    def _calculate_session_duration(self, risk_score: float) -> timedelta:
        """Calculate session duration based on risk score."""

        base_duration = timedelta(hours=8)  # 8 hours base

        if risk_score >= 0.7:
            return timedelta(minutes=30)  # High risk - short session
        elif risk_score >= 0.4:
            return timedelta(hours=2)  # Medium risk - medium session
        else:
            return base_duration  # Low risk - full session

    async def _record_failed_attempt(self, user_id: str):
        """Record failed authentication attempt."""

        if user_id not in self._failed_attempts:
            self._failed_attempts[user_id] = []

        self._failed_attempts[user_id].append(datetime.utcnow())

        # Remove old attempts (older than 1 hour)
        cutoff = datetime.utcnow() - timedelta(hours=1)
        self._failed_attempts[user_id] = [
            attempt for attempt in self._failed_attempts[user_id] if attempt > cutoff
        ]

        # Check if account should be locked
        if len(self._failed_attempts[user_id]) >= 5:  # 5 failed attempts
            await self._lock_account(user_id, timedelta(minutes=30))

    async def _lock_account(self, user_id: str, duration: timedelta):
        """Lock user account for specified duration."""

        self._locked_accounts[user_id] = {
            "locked_at": datetime.utcnow(),
            "expires_at": datetime.utcnow() + duration,
            "reason": "Multiple failed authentication attempts",
        }

        self.logger.warning(f"Account locked: {user_id}")

    def _is_account_locked(self, user_id: str) -> bool:
        """Check if account is currently locked."""

        if user_id not in self._locked_accounts:
            return False

        lock_info = self._locked_accounts[user_id]

        # Check if lock has expired
        if datetime.utcnow() > lock_info["expires_at"]:
            del self._locked_accounts[user_id]
            return False

        return True

    def _is_suspicious_ip(self, ip_address: str) -> bool:
        """Check if IP address is suspicious."""

        # Mock implementation
        suspicious_ips = ["192.168.1.100", "10.0.0.50"]
        return ip_address in suspicious_ips

    def _is_unusual_location(self, user_id: str, location: Dict[str, Any]) -> bool:
        """Check if location is unusual for user."""

        # Mock implementation
        # In practice, would check against user's typical locations
        return False

    def _is_new_device(self, user_id: str, device_fingerprint: str) -> bool:
        """Check if device is new for user."""

        # Mock implementation
        # In practice, would check against user's known devices
        return device_fingerprint not in ["known_device_1", "known_device_2"]

    def _is_unusual_time(self, user_id: str) -> bool:
        """Check if current time is unusual for user."""

        # Mock implementation
        # In practice, would check against user's typical login times
        current_hour = datetime.utcnow().hour
        return current_hour < 6 or current_hour > 22  # Outside normal hours

    def _has_totp_enabled(self, user_id: str) -> bool:
        """Check if user has TOTP enabled."""

        return (
            user_id in self._mfa_secrets and "totp_secret" in self._mfa_secrets[user_id]
        )

    async def setup_totp(self, user_id: str) -> Dict[str, Any]:
        """Set up TOTP for a user."""

        # Generate secret
        secret = pyotp.random_base32()

        # Store secret
        if user_id not in self._mfa_secrets:
            self._mfa_secrets[user_id] = {}

        self._mfa_secrets[user_id]["totp_secret"] = secret

        # Generate QR code
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user_id, issuer_name="Flowlet Financial"
        )

        # Create QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")

        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        qr_code_data = base64.b64encode(buffer.getvalue()).decode()

        return {
            "secret": secret,
            "qr_code": qr_code_data,
            "provisioning_uri": provisioning_uri,
        }

    async def send_sms_code(self, user_id: str, phone_number: str) -> bool:
        """Send SMS verification code."""

        # Generate 6-digit code
        code = f"{secrets.randbelow(1000000):06d}"

        # Store code with timestamp
        if user_id not in self._mfa_secrets:
            self._mfa_secrets[user_id] = {}

        self._mfa_secrets[user_id]["sms_code"] = code
        self._mfa_secrets[user_id]["sms_code_timestamp"] = datetime.utcnow()

        # Mock SMS sending
        # In practice, would integrate with SMS service (Twilio, AWS SNS, etc.)
        self.logger.info(f"SMS code sent to {phone_number}: {code}")

        return True

    def validate_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Validate and return session information."""

        if session_id not in self._active_sessions:
            return None

        session = self._active_sessions[session_id]

        # Check if session has expired
        if datetime.utcnow() > session["expires_at"]:
            del self._active_sessions[session_id]
            return None

        # Update last activity
        session["last_activity"] = datetime.utcnow()

        return session

    def logout_session(self, session_id: str) -> bool:
        """Logout and invalidate session."""

        if session_id in self._active_sessions:
            del self._active_sessions[session_id]
            return True

        return False

    def logout_all_sessions(self, user_id: str) -> int:
        """Logout all sessions for a user."""

        sessions_to_remove = [
            sid
            for sid, session in self._active_sessions.items()
            if session["user_id"] == user_id
        ]

        for session_id in sessions_to_remove:
            del self._active_sessions[session_id]

        return len(sessions_to_remove)

    def get_active_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """Get active sessions for a user."""

        user_sessions = []

        for session_id, session in self._active_sessions.items():
            if session["user_id"] == user_id:
                user_sessions.append(
                    {
                        "session_id": session_id,
                        "created_at": session["created_at"].isoformat(),
                        "expires_at": session["expires_at"].isoformat(),
                        "last_activity": session["last_activity"].isoformat(),
                        "risk_score": session["risk_score"],
                    }
                )

        return user_sessions

    def get_authentication_statistics(self) -> Dict[str, Any]:
        """Get authentication service statistics."""

        return {
            "active_sessions": len(self._active_sessions),
            "locked_accounts": len(self._locked_accounts),
            "users_with_totp": len(
                [u for u in self._mfa_secrets.values() if "totp_secret" in u]
            ),
            "users_with_failed_attempts": len(self._failed_attempts),
            "last_updated": datetime.utcnow().isoformat(),
        }

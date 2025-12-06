import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple
import jwt
import redis
from flask import current_app

"\nJWT Token Management for Financial-Grade Security\n"
logger = logging.getLogger(__name__)


class TokenManager:
    """JWT token management for financial industry standards"""

    ACCESS_TOKEN_EXPIRY = timedelta(minutes=15)
    REFRESH_TOKEN_EXPIRY = timedelta(days=7)
    RESET_TOKEN_EXPIRY = timedelta(hours=1)
    VERIFICATION_TOKEN_EXPIRY = timedelta(hours=24)
    ACCESS_TOKEN_EXPIRY_SECONDS = int(ACCESS_TOKEN_EXPIRY.total_seconds())

    def __init__(self, app: Any = None) -> Any:
        self.app = app
        self._redis_client = None

    @property
    def redis_client(self) -> Any:
        """Lazy load and configure Redis client within app context"""
        if self._redis_client is None and self.app:
            with self.app.app_context():
                redis_url = current_app.config.get(
                    "REDIS_URL", "redis://localhost:6379/0"
                )
                self._redis_client = redis.Redis.from_url(
                    redis_url, decode_responses=True
                )
        return self._redis_client

    def _get_config(self, key: Any, default: Any = None) -> Any:
        """Helper to get config values safely"""
        if self.app:
            with self.app.app_context():
                return current_app.config.get(key, default)
        return default

    def init_app(self, app: Any) -> Any:
        """Initialize the TokenManager with the Flask application"""
        self.app = app
        _ = self.redis_client

    def generate_token(
        self,
        user_id: str,
        token_type: str,
        expiry: timedelta,
        purpose: Optional[str] = None,
    ) -> str:
        """Internal function to generate a generic JWT token"""
        now = datetime.now(timezone.utc)
        payload = {
            "user_id": user_id,
            "iat": now.timestamp(),
            "exp": (now + expiry).timestamp(),
            "type": token_type,
            "jti": secrets.token_urlsafe(16),
        }
        if purpose:
            payload["purpose"] = purpose
        secret_key = self._get_config("JWT_SECRET_KEY")
        algorithm = self._get_config("JWT_ALGORITHM", "HS256")
        if not secret_key:
            raise RuntimeError("JWT_SECRET_KEY not configured")
        return jwt.encode(payload, secret_key, algorithm=algorithm)

    def validate_token(self, token: str, token_type: str) -> Dict[str, Any]:
        """Internal function to validate and decode a generic JWT token"""
        secret_key = self._get_config("JWT_SECRET_KEY")
        algorithm = self._get_config("JWT_ALGORITHM", "HS256")
        if not secret_key:
            raise RuntimeError("JWT_SECRET_KEY not configured")
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        if payload.get("type") != token_type:
            raise jwt.InvalidTokenError("Invalid token type")
        if token_type == "refresh" and self.is_token_blacklisted(payload.get("jti")):
            raise jwt.InvalidTokenError("Token is blacklisted")
        return payload

    def generate_access_token(self, user_id: str) -> str:
        """Generate a standard access token"""
        return self.generate_token(user_id, "access", self.ACCESS_TOKEN_EXPIRY)

    def generate_refresh_token(self, user_id: str) -> str:
        """Generate a refresh token and store its JTI in Redis"""
        refresh_token = self.generate_token(
            user_id, "refresh", self.REFRESH_TOKEN_EXPIRY
        )
        payload = jwt.decode(
            refresh_token,
            self._get_config("JWT_SECRET_KEY"),
            algorithms=[self._get_config("JWT_ALGORITHM", "HS256")],
            options={"verify_signature": False},
        )
        jti = payload["jti"]
        if self.redis_client:
            self.redis_client.setex(
                f"refresh_jti:{jti}",
                int(self.REFRESH_TOKEN_EXPIRY.total_seconds()),
                user_id,
            )
        return refresh_token

    def generate_temp_token(self, user_id: str, purpose: str) -> str:
        """Generate a short-lived temporary token for multi-step processes (e.g., 2FA)"""
        return self.generate_token(user_id, "temp", timedelta(minutes=5), purpose)

    def generate_reset_token(self, user_id: str) -> str:
        """Generate a password reset token"""
        return self.generate_token(
            user_id, "reset", self.RESET_TOKEN_EXPIRY, "password_reset"
        )

    def generate_verification_token(self, user_id: str, purpose: str) -> str:
        """Generate an email/phone verification token"""
        return self.generate_token(
            user_id, "verify", self.VERIFICATION_TOKEN_EXPIRY, f"{purpose}_verification"
        )

    def validate_access_token(self, token: str) -> Dict[str, Any]:
        """Validate an access token"""
        return self.validate_token(token, "access")

    def validate_refresh_token(self, token: str) -> Dict[str, Any]:
        """Validate a refresh token"""
        return self.validate_token(token, "refresh")

    def validate_temp_token(self, token: str) -> Dict[str, Any]:
        """Validate a temporary token"""
        return self.validate_token(token, "temp")

    def validate_reset_token(self, token: str) -> Dict[str, Any]:
        """Validate a password reset token"""
        payload = self.validate_token(token, "reset")
        if payload.get("purpose") != "password_reset":
            raise jwt.InvalidTokenError("Invalid token purpose")
        return payload

    def validate_verification_token(self, token: str) -> Dict[str, Any]:
        """Validate a verification token"""
        payload = self.validate_token(token, "verify")
        if not payload.get("purpose", "").endswith("_verification"):
            raise jwt.InvalidTokenError("Invalid token purpose")
        return payload

    def refresh_tokens(self, refresh_token: str) -> Tuple[str, str, str]:
        """Generate new access and refresh tokens from a valid refresh token"""
        payload = self.validate_refresh_token(refresh_token)
        user_id = payload["user_id"]
        jti = payload["jti"]
        self.blacklist_token(jti)
        new_access_token = self.generate_access_token(user_id)
        new_refresh_token = self.generate_refresh_token(user_id)
        return (new_access_token, new_refresh_token, user_id)

    def blacklist_token(self, jti: str) -> Any:
        """Add token JTI to blacklist"""
        if self.redis_client:
            expiry = self.REFRESH_TOKEN_EXPIRY
            self.redis_client.delete(f"refresh_jti:{jti}")
            self.redis_client.setex(
                f"blacklist:{jti}",
                int(expiry.total_seconds()),
                datetime.now(timezone.utc).isoformat(),
            )

    def is_token_blacklisted(self, jti: str) -> bool:
        """Check if token JTI is blacklisted"""
        if self.redis_client:
            return self.redis_client.exists(f"blacklist:{jti}")
        return False

    def revoke_all_user_tokens(self, user_id: str) -> Any:
        """Revoke all refresh tokens for a user"""
        if self.redis_client:
            for key in self.redis_client.scan_iter(match="refresh_jti:*"):
                if self.redis_client.get(key) == user_id:
                    jti = key.split(":")[1]
                    self.blacklist_token(jti)


token_manager = TokenManager()

"""
JWT Token Management for Financial-Grade Security
"""
import jwt
import redis
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Any, Tuple
from flask import current_app
import secrets
import json
import logging

logger = logging.getLogger(__name__)

class TokenManager:
    """JWT token management for financial industry standards"""
    
    # Define token expiry times (should be loaded from config)
    ACCESS_TOKEN_EXPIRY = timedelta(minutes=15)
    REFRESH_TOKEN_EXPIRY = timedelta(days=7)
    RESET_TOKEN_EXPIRY = timedelta(hours=1)
    VERIFICATION_TOKEN_EXPIRY = timedelta(hours=24)
    
    ACCESS_TOKEN_EXPIRY_SECONDS = int(ACCESS_TOKEN_EXPIRY.total_seconds())
    
    def __init__(self, app=None):
        self.app = app
        self._redis_client = None
    
    @property
    def redis_client(self):
        """Lazy load and configure Redis client within app context"""
        if self._redis_client is None and self.app:
            with self.app.app_context():
                redis_url = current_app.config.get('REDIS_URL', 'redis://localhost:6379/0')
                self._redis_client = redis.Redis.from_url(
                    redis_url,
                    decode_responses=True
                )
        return self._redis_client

    def _get_config(self, key, default=None):
        """Helper to get config values safely"""
        if self.app:
            with self.app.app_context():
                return current_app.config.get(key, default)
        return default

    def init_app(self, app):
        """Initialize the TokenManager with the Flask application"""
        self.app = app
        # Force initialization of Redis client
        _ = self.redis_client

    def generate_token(self, user_id: str, token_type: str, expiry: timedelta, purpose: Optional[str] = None) -> str:
        """Internal function to generate a generic JWT token"""
        now = datetime.now(timezone.utc)
        
        payload = {
            'user_id': user_id,
            'iat': now.timestamp(),
            'exp': (now + expiry).timestamp(),
            'type': token_type,
            'jti': secrets.token_urlsafe(16)
        }
        
        if purpose:
            payload['purpose'] = purpose
        
        secret_key = self._get_config('JWT_SECRET_KEY')
        algorithm = self._get_config('JWT_ALGORITHM', 'HS256')
        
        if not secret_key:
            raise RuntimeError("JWT_SECRET_KEY not configured")
        
        return jwt.encode(payload, secret_key, algorithm=algorithm)

    def validate_token(self, token: str, token_type: str) -> Dict[str, Any]:
        """Internal function to validate and decode a generic JWT token"""
        secret_key = self._get_config('JWT_SECRET_KEY')
        algorithm = self._get_config('JWT_ALGORITHM', 'HS256')
        
        if not secret_key:
            raise RuntimeError("JWT_SECRET_KEY not configured")
            
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        
        if payload.get('type') != token_type:
            raise jwt.InvalidTokenError("Invalid token type")
        
        # Check if token is blacklisted (only for refresh tokens for now)
        if token_type == 'refresh' and self.is_token_blacklisted(payload.get('jti')):
            raise jwt.InvalidTokenError("Token is blacklisted")
            
        return payload

    # --- Public Token Generation Methods ---

    def generate_access_token(self, user_id: str) -> str:
        """Generate a standard access token"""
        return self.generate_token(user_id, 'access', self.ACCESS_TOKEN_EXPIRY)

    def generate_refresh_token(self, user_id: str) -> str:
        """Generate a refresh token and store its JTI in Redis"""
        refresh_token = self.generate_token(user_id, 'refresh', self.REFRESH_TOKEN_EXPIRY)
        
        # Decode to get JTI
        payload = jwt.decode(refresh_token, self._get_config('JWT_SECRET_KEY'), algorithms=[self._get_config('JWT_ALGORITHM', 'HS256')], options={"verify_signature": False})
        jti = payload['jti']
        
        # Store JTI in Redis for blacklisting/revocation
        if self.redis_client:
            self.redis_client.setex(
                f"refresh_jti:{jti}",
                int(self.REFRESH_TOKEN_EXPIRY.total_seconds()),
                user_id
            )
        
        return refresh_token

    def generate_temp_token(self, user_id: str, purpose: str) -> str:
        """Generate a short-lived temporary token for multi-step processes (e.g., 2FA)"""
        return self.generate_token(user_id, 'temp', timedelta(minutes=5), purpose)

    def generate_reset_token(self, user_id: str) -> str:
        """Generate a password reset token"""
        return self.generate_token(user_id, 'reset', self.RESET_TOKEN_EXPIRY, 'password_reset')

    def generate_verification_token(self, user_id: str, purpose: str) -> str:
        """Generate an email/phone verification token"""
        return self.generate_token(user_id, 'verify', self.VERIFICATION_TOKEN_EXPIRY, f'{purpose}_verification')

    # --- Public Token Validation Methods ---

    def validate_access_token(self, token: str) -> Dict[str, Any]:
        """Validate an access token"""
        return self.validate_token(token, 'access')

    def validate_refresh_token(self, token: str) -> Dict[str, Any]:
        """Validate a refresh token"""
        return self.validate_token(token, 'refresh')

    def validate_temp_token(self, token: str) -> Dict[str, Any]:
        """Validate a temporary token"""
        return self.validate_token(token, 'temp')

    def validate_reset_token(self, token: str) -> Dict[str, Any]:
        """Validate a password reset token"""
        payload = self.validate_token(token, 'reset')
        if payload.get('purpose') != 'password_reset':
            raise jwt.InvalidTokenError("Invalid token purpose")
        return payload

    def validate_verification_token(self, token: str) -> Dict[str, Any]:
        """Validate a verification token"""
        payload = self.validate_token(token, 'verify')
        if not payload.get('purpose', '').endswith('_verification'):
            raise jwt.InvalidTokenError("Invalid token purpose")
        return payload

    # --- Token Management Methods ---

    def refresh_tokens(self, refresh_token: str) -> Tuple[str, str, str]:
        """Generate new access and refresh tokens from a valid refresh token"""
        payload = self.validate_refresh_token(refresh_token)
        user_id = payload['user_id']
        jti = payload['jti']
        
        # Blacklist the old refresh token immediately
        self.blacklist_token(jti)
        
        # Generate new tokens
        new_access_token = self.generate_access_token(user_id)
        new_refresh_token = self.generate_refresh_token(user_id)
        
        return new_access_token, new_refresh_token, user_id

    def blacklist_token(self, jti: str):
        """Add token JTI to blacklist"""
        if self.redis_client:
            # Check if it's a refresh token JTI and get its expiry
            expiry = self.REFRESH_TOKEN_EXPIRY
            
            # Remove from active refresh JTI set
            self.redis_client.delete(f"refresh_jti:{jti}")
            
            # Add to blacklist set
            self.redis_client.setex(
                f"blacklist:{jti}",
                int(expiry.total_seconds()),
                datetime.now(timezone.utc).isoformat()
            )

    def is_token_blacklisted(self, jti: str) -> bool:
        """Check if token JTI is blacklisted"""
        if self.redis_client:
            return self.redis_client.exists(f"blacklist:{jti}")
        return False

    def revoke_all_user_tokens(self, user_id: str):
        """Revoke all refresh tokens for a user"""
        if self.redis_client:
            # Find all refresh JTIs associated with the user
            for key in self.redis_client.scan_iter(match="refresh_jti:*"):
                if self.redis_client.get(key) == user_id:
                    jti = key.split(':')[1]
                    self.blacklist_token(jti)

# Global instance of the TokenManager (to be initialized with app later)
token_manager = TokenManager()

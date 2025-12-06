import os
from datetime import timedelta


class SecurityConfig:
    """Enhanced security configuration for financial industry standards"""

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_ALGORITHM = "HS256"
    PASSWORD_MIN_LENGTH = 12
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_REQUIRE_NUMBERS = True
    PASSWORD_REQUIRE_SPECIAL_CHARS = True
    PASSWORD_HISTORY_COUNT = 5
    API_KEY_LENGTH = 32
    API_KEY_PREFIX = "flw_"
    API_KEY_EXPIRY_DAYS = 90
    RATE_LIMIT_STORAGE_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
    DEFAULT_RATE_LIMIT = "1000 per hour"
    AUTH_RATE_LIMIT = "10 per minute"
    PAYMENT_RATE_LIMIT = "100 per hour"
    ENCRYPTION_KEY = os.environ.get("ENCRYPTION_KEY")
    FIELD_ENCRYPTION_ALGORITHM = "AES-256-GCM"
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Strict"
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
    AUDIT_LOG_RETENTION_DAYS = 2555
    AUDIT_LOG_ENCRYPTION = True
    DB_CONNECTION_TIMEOUT = 30
    DB_POOL_SIZE = 10
    DB_MAX_OVERFLOW = 20
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}
    ADMIN_IP_WHITELIST = os.environ.get("ADMIN_IP_WHITELIST", "").split(",")
    ENABLE_METRICS = True
    METRICS_PORT = 9090

    @classmethod
    def validate_config(cls: Any) -> Any:
        """Validate security configuration"""
        errors = []
        if not cls.JWT_SECRET_KEY or len(cls.JWT_SECRET_KEY) < 32:
            errors.append("JWT_SECRET_KEY must be set and at least 32 characters long.")
        if not cls.ENCRYPTION_KEY or len(cls.ENCRYPTION_KEY) < 32:
            errors.append("ENCRYPTION_KEY must be set and at least 32 bytes long.")
        if errors:
            raise ValueError(f"Security configuration errors: {', '.join(errors)}")
        return True


SecurityConfig.validate_config()

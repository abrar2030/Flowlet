"""
Configuration settings for Flowlet Financial Backend
Implements security best practices and financial industry standards
"""

import os
from datetime import timedelta
from dotenv import load_dotenv
from .security import SecurityConfig # Import SecurityConfig for consistency

# Load environment variables from .env file (handled in main.py/wsgi.py, but safe to keep here)
load_dotenv() 

class Config:
    """Base configuration class with security-focused defaults"""
    
    # Basic Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY')
    
    # Database configuration
    # Use DATABASE_URL from env, or a robust default for SQLite
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DEFAULT_DB_PATH = os.path.join(BASE_DIR, 'database', 'app.db')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f"sqlite:///{DEFAULT_DB_PATH}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 20,
        'max_overflow': 30,
        'pool_timeout': 30,
        'pool_pre_ping': True,
        'pool_recycle': 3600  # 1 hour
    }
    
    # Redis configuration
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    
    # Security configuration (Inherit from SecurityConfig for consistency)
    JWT_SECRET_KEY = SecurityConfig.JWT_SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = SecurityConfig.JWT_ACCESS_TOKEN_EXPIRES
    JWT_REFRESH_TOKEN_EXPIRES = SecurityConfig.JWT_REFRESH_TOKEN_EXPIRES
    JWT_ALGORITHM = SecurityConfig.JWT_ALGORITHM
    
    # Password policy
    PASSWORD_MIN_LENGTH = SecurityConfig.PASSWORD_MIN_LENGTH
    PASSWORD_REQUIRE_UPPERCASE = SecurityConfig.PASSWORD_REQUIRE_UPPERCASE
    PASSWORD_REQUIRE_LOWERCASE = SecurityConfig.PASSWORD_REQUIRE_LOWERCASE
    PASSWORD_REQUIRE_NUMBERS = SecurityConfig.PASSWORD_REQUIRE_NUMBERS
    PASSWORD_REQUIRE_SPECIAL_CHARS = SecurityConfig.PASSWORD_REQUIRE_SPECIAL_CHARS
    PASSWORD_MAX_AGE_DAYS = 90
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = REDIS_URL
    RATELIMIT_DEFAULT = SecurityConfig.DEFAULT_RATE_LIMIT
    RATELIMIT_HEADERS_ENABLED = True
    
    # Session configuration
    SESSION_TIMEOUT_MINUTES = 30
    SESSION_COOKIE_SECURE = SecurityConfig.SESSION_COOKIE_SECURE
    SESSION_COOKIE_HTTPONLY = SecurityConfig.SESSION_COOKIE_HTTPONLY
    SESSION_COOKIE_SAMESITE = SecurityConfig.SESSION_COOKIE_SAMESITE
    
    # CORS configuration
    CORS_ORIGINS = SecurityConfig.CORS_ORIGINS
    
    # Encryption configuration
    ENCRYPTION_KEY = SecurityConfig.ENCRYPTION_KEY
    
    # Audit logging
    AUDIT_LOG_RETENTION_DAYS = SecurityConfig.AUDIT_LOG_RETENTION_DAYS
    
    # File upload limits
    MAX_CONTENT_LENGTH = SecurityConfig.MAX_CONTENT_LENGTH
    
    # API configuration
    API_TITLE = 'Flowlet Financial Backend'
    API_VERSION = 'v1.0.0'
    
    # Compliance settings
    PCI_DSS_COMPLIANCE = True
    SOX_COMPLIANCE = True
    GDPR_COMPLIANCE = True
    
    # Monitoring and alerting
    ENABLE_METRICS = True
    ENABLE_HEALTH_CHECKS = True
    
    # Email configuration (for notifications)
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # Fraud detection thresholds
    FRAUD_DETECTION_ENABLED = True
    MAX_DAILY_TRANSACTION_AMOUNT = 50000.00  # $50,000
    MAX_SINGLE_TRANSACTION_AMOUNT = 10000.00  # $10,000
    SUSPICIOUS_ACTIVITY_THRESHOLD = 5  # Number of failed attempts
    
    # KYC/AML settings
    KYC_VERIFICATION_REQUIRED = True
    AML_MONITORING_ENABLED = True
    SANCTIONS_LIST_CHECK_ENABLED = True
    
    # Card management
    CARD_ENCRYPTION_ENABLED = True
    CARD_TOKENIZATION_ENABLED = True
    CARD_CVV_STORAGE_PROHIBITED = True  # PCI DSS requirement
    
    # Transaction limits
    DEFAULT_DAILY_LIMIT = 5000.00
    DEFAULT_MONTHLY_LIMIT = 50000.00
    DEFAULT_YEARLY_LIMIT = 500000.00
    
    # Multi-currency support
    SUPPORTED_CURRENCIES = [
        'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
        'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'ZAR',
        'BRL', 'INR', 'KRW', 'PLN'
    ]
    DEFAULT_CURRENCY = 'USD'
    
    # Backup and disaster recovery
    BACKUP_ENABLED = True
    BACKUP_RETENTION_DAYS = 90
    
    @staticmethod
    def validate_config():
        """Validate critical configuration settings"""
        errors = []
        
        # Check for critical secrets
        if not Config.SECRET_KEY:
            errors.append("SECRET_KEY must be set.")
        
        # Delegate security validation
        try:
            SecurityConfig.validate_config()
        except ValueError as e:
            errors.append(str(e))

        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")
        
        return True

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True
    SESSION_COOKIE_SECURE = False  # Allow HTTP in development
    
class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    SESSION_COOKIE_SECURE = False
    
class ProductionConfig(Config):
    """Production configuration with enhanced security"""
    DEBUG = False
    TESTING = False
    
    # Enhanced security for production
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    
    # Stricter rate limits for production
    RATELIMIT_DEFAULT = "500 per hour"
    
    # Production-specific settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        **Config.SQLALCHEMY_ENGINE_OPTIONS,
        'pool_size': 50,
        'max_overflow': 100
    }

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': ProductionConfig
}

# Validate configuration on import to ensure critical secrets are present
Config.validate_config()

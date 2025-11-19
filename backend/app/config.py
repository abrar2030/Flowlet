"""
Configuration settings for Flowlet Financial Backend
Implements security best practices and financial industry standards
"""

import os
from datetime import timedelta
from typing import List

class Config:
    """Base configuration class with security-focused defaults"""
    
    # Basic Flask configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        f"sqlite:///{os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database', 'flowlet.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 20,
        'max_overflow': 30,
        'pool_timeout': 30,
        'pool_pre_ping': True,
        'pool_recycle': 3600  # 1 hour
    }
    
    # Redis configuration
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379'
    
    # Security configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=15)  # Short-lived access tokens
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)    # Longer-lived refresh tokens
    JWT_ALGORITHM = 'HS256'
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']
    
    # Password policy
    PASSWORD_MIN_LENGTH = 12
    PASSWORD_REQUIRE_UPPERCASE = True
    PASSWORD_REQUIRE_LOWERCASE = True
    PASSWORD_REQUIRE_NUMBERS = True
    PASSWORD_REQUIRE_SPECIAL_CHARS = True
    PASSWORD_MAX_AGE_DAYS = 90
    
    # Rate limiting
    RATELIMIT_STORAGE_URL = REDIS_URL
    RATELIMIT_DEFAULT = "1000 per hour"
    RATELIMIT_HEADERS_ENABLED = True
    
    # Session configuration
    SESSION_TIMEOUT_MINUTES = 30
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    
    # CORS configuration - Allow all origins for development
    CORS_ORIGINS = ['*']
    
    # Encryption configuration
    ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY') or SECRET_KEY
    
    # Audit logging
    AUDIT_LOG_RETENTION_DAYS = 2555  # 7 years for financial compliance
    
    # File upload limits
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # API configuration
    API_TITLE = 'Flowlet Financial Backend'
    API_VERSION = 'v1.0.0'
    API_DESCRIPTION = 'Secure financial services API'
    
    # Compliance settings
    PCI_DSS_COMPLIANCE = True
    SOX_COMPLIANCE = True
    GDPR_COMPLIANCE = True
    
    # Monitoring and alerting
    ENABLE_METRICS = True
    ENABLE_HEALTH_CHECKS = True
    
    # Email configuration (for notifications)
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'localhost')
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 587)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@flowlet.com')
    
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
    
    # Celery configuration for async tasks
    CELERY_BROKER_URL = REDIS_URL
    CELERY_RESULT_BACKEND = REDIS_URL
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_RESULT_SERIALIZER = 'json'
    CELERY_ACCEPT_CONTENT = ['json']
    CELERY_TIMEZONE = 'UTC'
    CELERY_ENABLE_UTC = True
    
    @staticmethod
    def validate_config():
        """Validate critical configuration settings"""
        required_vars = ['SECRET_KEY']
        missing_vars = [var for var in required_vars if not os.environ.get(var)]
        
        if missing_vars and os.environ.get('FLASK_ENV') == 'production':
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        # Validate password policy
        if Config.PASSWORD_MIN_LENGTH < 8:
            raise ValueError("Password minimum length must be at least 8 characters")
        
        return True

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True
    SESSION_COOKIE_SECURE = False  # Allow HTTP in development
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)  # Longer tokens for development
    
    # Less strict rate limits for development
    RATELIMIT_DEFAULT = "10000 per hour"

class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    SESSION_COOKIE_SECURE = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=5)
    
    # Disable rate limiting for tests
    RATELIMIT_ENABLED = False

class ProductionConfig(Config):
    """Production configuration with improved security"""
    DEBUG = False
    TESTING = False
    
    # Improved security for production
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
    
    # Production CORS - should be configured with specific origins
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'https://app.flowlet.com').split(',')

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': ProductionConfig
}


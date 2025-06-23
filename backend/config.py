import os
from datetime import timedelta

class Config:
    """Base configuration class"""
    
    # Basic Flask Configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'postgresql://flowlet:password@localhost/flowlet'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'pool_timeout': 20,
        'max_overflow': 0
    }
    
    # Redis Configuration
    REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379'
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Rate Limiting
    RATELIMIT_STORAGE_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379'
    RATELIMIT_DEFAULT = "1000 per hour"
    
    # Security Configuration
    ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY')  # Must be 32 bytes base64 encoded
    BCRYPT_LOG_ROUNDS = 12
    
    # Email Configuration
    SMTP_SERVER = os.environ.get('SMTP_SERVER') or 'localhost'
    SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
    SMTP_USERNAME = os.environ.get('SMTP_USERNAME')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD')
    FROM_EMAIL = os.environ.get('FROM_EMAIL') or 'noreply@flowlet.com'
    
    # Payment Processor Configuration
    STRIPE_SECRET_KEY = os.environ.get('STRIPE_SECRET_KEY')
    STRIPE_WEBHOOK_SECRET = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    # Exchange Rate API Configuration
    EXCHANGE_RATE_API_KEY = os.environ.get('EXCHANGE_RATE_API_KEY')
    BACKUP_EXCHANGE_RATE_API_KEY = os.environ.get('BACKUP_EXCHANGE_RATE_API_KEY')
    EXCHANGE_RATE_CACHE_TTL = int(os.environ.get('EXCHANGE_RATE_CACHE_TTL', '300'))
    
    # KYC Provider Configuration
    JUMIO_API_TOKEN = os.environ.get('JUMIO_API_TOKEN')
    JUMIO_API_SECRET = os.environ.get('JUMIO_API_SECRET')
    ONFIDO_API_KEY = os.environ.get('ONFIDO_API_KEY')
    SHUFTI_CLIENT_ID = os.environ.get('SHUFTI_CLIENT_ID')
    SHUFTI_SECRET_KEY = os.environ.get('SHUFTI_SECRET_KEY')
    
    # Notification Configuration
    SMS_PROVIDER = os.environ.get('SMS_PROVIDER', 'twilio')
    SMS_API_KEY = os.environ.get('SMS_API_KEY')
    SMS_API_SECRET = os.environ.get('SMS_API_SECRET')
    SMS_FROM_NUMBER = os.environ.get('SMS_FROM_NUMBER')
    
    PUSH_PROVIDER = os.environ.get('PUSH_PROVIDER', 'firebase')
    PUSH_API_KEY = os.environ.get('PUSH_API_KEY')
    PUSH_PROJECT_ID = os.environ.get('PUSH_PROJECT_ID')
    
    # Compliance and Audit Configuration
    AUDIT_LOG_RETENTION_DAYS = int(os.environ.get('AUDIT_LOG_RETENTION_DAYS', '2555'))  # 7 years
    ENABLE_AUDIT_LOGGING = os.environ.get('ENABLE_AUDIT_LOGGING', 'true').lower() == 'true'
    
    # File Upload Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER') or 'uploads'
    ALLOWED_EXTENSIONS = {'pdf', 'png', 'jpg', 'jpeg', 'gif'}
    
    # API Configuration
    API_VERSION = 'v1'
    API_TITLE = 'Flowlet API'
    API_DESCRIPTION = 'Financial Services Platform API'
    
    # Logging Configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True
    
class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    BCRYPT_LOG_ROUNDS = 4  # Faster for testing
    
class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Enhanced security for production
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # Force HTTPS
    PREFERRED_URL_SCHEME = 'https'
    
    # Enhanced rate limiting for production
    RATELIMIT_DEFAULT = "500 per hour"

# Configuration mapping
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


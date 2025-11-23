import os
from datetime import timedelta


class Config:
    # Basic Flask Configuration
    SECRET_KEY = os.environ.get("SECRET_KEY")  # MUST be set in production
    SQLALCHEMY_DATABASE_URI = (
        os.environ.get("DATABASE_URL") or "sqlite:///flowlet_integrated.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")  # MUST be set in production
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)

    # Rate Limiting
    RATELIMIT_STORAGE_URL = os.environ.get("REDIS_URL") or "memory://"
    RATELIMIT_DEFAULT = "1000 per hour"


class DevelopmentConfig(Config):
    DEBUG = True
    TESTING = False
    SQLALCHEMY_ECHO = True


class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False

    # Enhanced rate limiting for production
    RATELIMIT_DEFAULT = "500 per hour"


# Configuration mapping
config = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    # "default": DevelopmentConfig # Removed to prevent accidental use of development settings
}

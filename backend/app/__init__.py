"""
Flowlet Financial Backend Application Factory
"""

import logging
import os

import redis
import structlog
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_mail import Mail
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()
limiter = Limiter(key_func=get_remote_address, default_limits=["1000 per hour"])


def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)

    # Load configuration
    config_name = config_name or os.environ.get("FLASK_ENV", "production")

    if config_name == "development":
        from app.config import DevelopmentConfig

        app.config.from_object(DevelopmentConfig)
    elif config_name == "testing":
        from app.config import TestingConfig

        app.config.from_object(TestingConfig)
    else:
        from app.config import ProductionConfig

        app.config.from_object(ProductionConfig)

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)

    # Configure CORS for frontend-backend interaction
    CORS(
        app,
        origins=app.config.get("CORS_ORIGINS", ["*"]),
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    # Initialize rate limiter
    try:
        redis_client = redis.from_url(
            app.config.get("REDIS_URL", "redis://localhost:6379")
        )
        limiter.init_app(app, storage_uri=app.config.get("REDIS_URL"))
    except Exception as e:
        app.logger.warning(f"Redis not available, using in-memory rate limiting: {e}")
        limiter.init_app(app)

    # Configure structured logging
    configure_logging(app)

    # Register blueprints
    register_blueprints(app)

    # Register error handlers
    register_error_handlers(app)

    # Register CLI commands
    register_cli_commands(app)

    # JWT configuration
    configure_jwt(app)

    return app


def configure_logging(app):
    """Configure structured logging"""
    if not app.debug and not app.testing:
        # Configure structlog for production
        structlog.configure(
            processors=[
                structlog.stdlib.filter_by_level,
                structlog.stdlib.add_logger_name,
                structlog.stdlib.add_log_level,
                structlog.stdlib.PositionalArgumentsFormatter(),
                structlog.processors.TimeStamper(fmt="iso"),
                structlog.processors.StackInfoRenderer(),
                structlog.processors.format_exc_info,
                structlog.processors.UnicodeDecoder(),
                structlog.processors.JSONRenderer(),
            ],
            context_class=dict,
            logger_factory=structlog.stdlib.LoggerFactory(),
            wrapper_class=structlog.stdlib.BoundLogger,
            cache_logger_on_first_use=True,
        )

        # Set up file logging
        if not os.path.exists("logs"):
            os.mkdir("logs")

        file_handler = logging.FileHandler("logs/flowlet.log")
        file_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"
            )
        )
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)

        app.logger.setLevel(logging.INFO)
        app.logger.info("Flowlet Financial Backend startup")


def register_blueprints(app):
    """Register application blueprints"""
    from app.api.accounts import accounts_bp
    from app.api.auth import auth_bp
    from app.api.cards import cards_bp
    from app.api.compliance import compliance_bp
    from app.api.security import security_bp
    from app.api.transactions import transactions_bp
    from app.api.users import users_bp

    # API v1 blueprints
    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(accounts_bp, url_prefix="/api/v1/accounts")
    app.register_blueprint(transactions_bp, url_prefix="/api/v1/transactions")
    app.register_blueprint(cards_bp, url_prefix="/api/v1/cards")
    app.register_blueprint(users_bp, url_prefix="/api/v1/users")
    app.register_blueprint(compliance_bp, url_prefix="/api/v1/compliance")
    app.register_blueprint(security_bp, url_prefix="/api/v1/security")

    # Health check and info endpoints
    from app.api.health import health_bp

    app.register_blueprint(health_bp)


def register_error_handlers(app):
    """Register error handlers"""
    from app.utils.error_handlers import \
        register_error_handlers as reg_handlers

    reg_handlers(app)


def register_cli_commands(app):
    """Register CLI commands"""
    from app.cli import register_commands

    register_commands(app)


def configure_jwt(app):
    """Configure JWT settings"""
    from app.utils.jwt_handlers import configure_jwt_handlers

    configure_jwt_handlers(app, jwt)

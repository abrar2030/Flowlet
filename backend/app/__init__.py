import logging
import os
from pathlib import Path
from logging.handlers import RotatingFileHandler
from typing import Optional

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

"""
Flowlet Financial Backend Application Factory
"""

# === Extensions (module-level so other modules can import them) ===
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
mail = Mail()
# Create an uninitialized Limiter — we'll init it with app-specific settings below
limiter = Limiter()


def create_app(config_name: Optional[str] = None) -> Flask:
    """Application factory pattern"""
    app = Flask(__name__)

    # Load configuration (fall back to PRODUCTION if FLASK_ENV not set)
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

    # safe defaults / performance tweaks
    app.config.setdefault("SQLALCHEMY_TRACK_MODIFICATIONS", False)
    # Example: app.config.setdefault("RATELIMIT_DEFAULT", ["1000 per hour"])

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)

    # Configure CORS for frontend-backend interaction
    # If you want to restrict origins, set CORS_ORIGINS in config to a list or string
    CORS(
        app,
        origins=app.config.get("CORS_ORIGINS", ["*"]),
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    )

    # Initialize rate limiter with optional Redis storage (fall back to in-memory)
    ratelimit_defaults = app.config.get("RATELIMIT_DEFAULT", ["1000 per hour"])
    limiter_init_kwargs = {
        "key_func": get_remote_address,
        "default_limits": ratelimit_defaults,
    }

    redis_url = app.config.get("REDIS_URL")
    if redis_url:
        try:
            # test redis connectivity (non-fatal)
            redis.from_url(redis_url).ping()
            limiter_init_kwargs["storage_uri"] = redis_url
            app.logger.info("Using Redis-backed rate limiting")
        except Exception as e:  # pragma: no cover - runtime behavior
            app.logger.warning("Redis not available for rate limiting: %s", e)

    # init limiter (will fall back to in-memory if no storage_uri)
    limiter.init_app(app, **limiter_init_kwargs)

    # Configure structured logging (should be done after config so log paths can come from config)
    configure_logging(app)

    # Register blueprints (wrapped to avoid failing startup if a blueprint import fails)
    try:
        register_blueprints(app)
    except (
        Exception
    ) as e:  # pragma: no cover - protects startup from misconfigured modules
        app.logger.exception("Failed to register all blueprints: %s", e)

    # Register error handlers from your utility module
    try:
        from src.utils.error_handlers import register_error_handlers as reg_handlers

        reg_handlers(app)
    except Exception as e:
        app.logger.exception("Failed to register error handlers: %s", e)

    return app


def configure_logging(app: Flask) -> None:
    """Configure structured and file logging."""
    # ensure basic logging so structlog has handlers to wrap
    logging.basicConfig(level=logging.INFO)
    root_logger = logging.getLogger()

    # Use file logging in non-debug / non-testing (production) environments
    if not app.debug and not app.testing:
        # configure structlog
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

        # logs directory and rotating file handler
        log_dir = Path(app.config.get("LOG_DIR", "logs"))
        log_dir.mkdir(parents=True, exist_ok=True)
        file_path = log_dir / app.config.get("LOG_FILE", "flowlet.log")

        file_handler = RotatingFileHandler(
            filename=str(file_path),
            maxBytes=10 * 1024 * 1024,  # 10 MB
            backupCount=5,
        )
        file_handler.setFormatter(
            logging.Formatter(
                "%(asctime)s %(levelname)s [%(name)s] %(message)s [in %(pathname)s:%(lineno)d]"
            )
        )
        file_handler.setLevel(logging.INFO)

        # Avoid duplicating handlers
        if not any(
            isinstance(h, RotatingFileHandler) and h.baseFilename == str(file_path)
            for h in root_logger.handlers
            if hasattr(h, "baseFilename")
        ):
            root_logger.addHandler(file_handler)

        root_logger.setLevel(logging.INFO)
        app.logger.info("Flowlet Financial Backend startup")


def register_blueprints(app: Flask) -> None:
    """Register application blueprints."""
    # Import blueprints lazily so missing ones won't stop the app from starting
    blueprint_imports = [
        ("app.api.auth", "auth_bp", "/api/v1/auth"),
        ("app.api.accounts", "accounts_bp", "/api/v1/accounts"),
        ("app.api.transactions", "transactions_bp", "/api/v1/transactions"),
        ("app.api.cards", "cards_bp", "/api/v1/cards"),
        ("app.api.users", "users_bp", "/api/v1/users"),
        ("app.api.compliance", "compliance_bp", "/api/v1/compliance"),
        ("app.api.security", "security_bp", "/api/v1/security"),
    ]

    for module_path, attr_name, url_prefix in blueprint_imports:
        try:
            module = __import__(module_path, fromlist=[attr_name])
            bp = getattr(module, attr_name)
            app.register_blueprint(bp, url_prefix=url_prefix)
            app.logger.debug("Registered blueprint %s -> %s", attr_name, url_prefix)
        except (ImportError, AttributeError) as e:
            # Log but do not raise — protects startup when a single blueprint is missing
            app.logger.warning(
                "Could not register blueprint %s from %s: %s", attr_name, module_path, e
            )

    # Health check (register without prefix)
    try:
        from app.api.health import health_bp

        app.register_blueprint(health_bp)
    except Exception as e:
        app.logger.warning("Health blueprint not registered: %s", e)

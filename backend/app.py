import logging
import os
from datetime import datetime
from decimal import Decimal

from flask import Flask, jsonify, send_from_directory
from flask.json import JSONEncoder
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate

from src.config.settings import config
from src.models import db
from src.routes import api_bp
from src.utils.error_handlers import register_error_handlers


def create_app():
    """Create and configure the Flask application."""
    app = Flask(__name__, static_folder="../web-frontend/dist", static_url_path="")

    # ---------------------------
    # Custom JSON encoder
    # ---------------------------
    class CustomJSONEncoder(JSONEncoder):
        def default(self, obj):
            if isinstance(obj, Decimal):
                # Convert Decimal to string so precision is preserved in JSON
                return str(obj)
            if isinstance(obj, datetime):
                # Convert datetime to ISO 8601 string
                return obj.isoformat()
            return super().default(obj)

    # Attach our JSON encoder (note: may raise a deprecation warning on very new Flask versions,
    # but this works for most Flask releases).
    app.json_encoder = CustomJSONEncoder

    # ---------------------------
    # Configuration
    # ---------------------------
    config_name = os.environ.get("FLASK_CONFIG", "default")
    app.config.from_object(config[config_name])

    # validate critical configuration if the config object exposes this method
    if hasattr(config[config_name], "validate_config"):
        config[config_name].validate_config()

    # ---------------------------
    # Ensure DB directory exists (for SQLite file-based DB)
    # ---------------------------
    db_uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if db_uri and db_uri.startswith("sqlite:///"):
        # support only the common sqlite:///file.db form
        # split only once so we don't accidentally replace multiple occurrences
        db_file = db_uri.split("sqlite:///", 1)[1]
        db_dir = os.path.dirname(os.path.abspath(db_file)) or None
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

    # ---------------------------
    # Initialize extensions
    # ---------------------------
    db.init_app(app)
    Migrate(app, db)
    Limiter(key_func=get_remote_address, app=app)

    # ---------------------------
    # Configure CORS
    # ---------------------------
    cors_origins = os.environ.get(
        "CORS_ORIGINS", "http://localhost:3000,http://localhost:5000"
    ).split(",")
    # restrict resources explicitly
    CORS(app, resources={r"/*": {"origins": cors_origins}}, supports_credentials=True)

    # ---------------------------
    # Configure logging
    # ---------------------------
    logging.basicConfig(level=logging.INFO)
    logger = app.logger
    logger.info("Starting Flask application")

    # ---------------------------
    # Register blueprints
    # ---------------------------
    app.register_blueprint(api_bp)

    # ---------------------------
    # Web frontend routes (serve SPA)
    # ---------------------------
    @app.route("/")
    def serve_web_frontend():
        """Serve the React web-frontend index page."""
        return send_from_directory(app.static_folder, "index.html")

    @app.route("/<path:path>")
    def serve_static_files(path):
        """Serve static files or fallback to index.html for SPA routing."""
        try:
            return send_from_directory(app.static_folder, path)
        except Exception:
            # Fallback to index.html for SPA routing (so client-side router works)
            return send_from_directory(app.static_folder, "index.html")

    # ---------------------------
    # Error handlers
    # ---------------------------
    register_error_handlers(app)

    @app.errorhandler(Exception)
    def handle_exception(e):
        # Log the error with traceback (do not return traceback to client)
        app.logger.error("Unhandled Exception", exc_info=True)
        response = {
            "status": "error",
            "message": "An internal server error occurred. Please try again later.",
        }
        return jsonify(response), 500

    # ---------------------------
    # Database initialization (SQLite file creation)
    # ---------------------------
    def _initialize_sqlite_if_missing():
        """Create SQLite DB file and tables if using file-based SQLite and file is missing."""
        db_uri_local = app.config.get("SQLALCHEMY_DATABASE_URI", "")
        if db_uri_local and db_uri_local.startswith("sqlite:///"):
            db_file_local = db_uri_local.split("sqlite:///", 1)[1]
            if not os.path.exists(db_file_local):
                with app.app_context():
                    db.create_all()
                    logger.info("Database initialized successfully (created tables)")

    _initialize_sqlite_if_missing()

    return app

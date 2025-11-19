
"""
Flowlet Integrated Application - Production Deployment
"""

from flask import Flask, send_from_directory, jsonify
from datetime import datetime
from decimal import Decimal
from flask_cors import CORS
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import secrets
import logging

from src.models import db
from src.routes import api_bp
from src.config.settings import config
from src.utils.error_handlers import register_error_handlers

def create_app():
    # Initialize Flask app
    app = Flask(__name__, static_folder=\'../unified-frontend/dist\', static_url_path=\'\')

    # Custom JSON encoder to handle Decimal and datetime objects
    class CustomJSONEncoder(Flask.json.JSONEncoder):
        def default(self, obj):
            if isinstance(obj, Decimal):
                # Convert Decimal to string for JSON serialization to maintain precision
                return str(obj)
            if isinstance(obj, datetime):
                # Convert datetime to ISO 8601 string
                return obj.isoformat()
            return super(CustomJSONEncoder, self).default(obj)

    app.json_encoder = CustomJSONEncoder

    # Configuration
    # Load configuration from settings.py
    config_name = os.environ.get('FLASK_CONFIG', 'default')
    app.config.from_object(config[config_name])
    
    # Validate critical configuration
    config[config_name].validate_config()

    # Ensure the database directory exists if using a file-based database
    # Ensure the database directory exists if using a file-based database
    db_path = app.config['SQLALCHEMY_DATABASE_URI']
    if db_path and db_path.startswith('sqlite:///'):
        db_file = db_path.replace('sqlite:///', '')
        db_dir = os.path.dirname(db_file)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)

    # Initialize extensions
    db.init_app(app)
    migrate = Migrate(app, db)
    limiter = Limiter(key_func=get_remote_address, app=app)

    # Configure CORS
    # CORS is too permissive, restricting to localhost for development, but should be more restrictive in production
    # The original code had origins="*", which is a security flaw.
    # Using a more secure default and allowing environment variable override.
    cors_origins = os.environ.get(\'CORS_ORIGINS\', \'http://localhost:3000,http://localhost:5000\').split(\',\')
    CORS(app, origins=cors_origins, supports_credentials=True)

    # Configure logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    # Register blueprints
    app.register_blueprint(api_bp)

    # ============================================================================
    # FRONTEND ROUTES
    # ============================================================================

    @app.route(\'/\')
    def serve_frontend():
        """Serve the React frontend"""
        return send_from_directory(app.static_folder, \'index.html\')

    @app.route(\'/<path:path>\')
    def serve_static_files(path):
        """Serve static files or fallback to index.html for SPA routing"""
        try:
            return send_from_directory(app.static_folder, path)
        except:
            # Fallback to index.html for SPA routing
            return send_from_directory(app.static_folder, \'index.html\')

    # ============================================================================
    # ERROR HANDLERS
    # ============================================================================

    # Register error handlers
    register_error_handlers(app)

    # Global exception handler for unhandled exceptions (Security Vulnerability: Missing Global Error Handling)
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Log the error internally with a traceback
        app.logger.error(f"Unhandled Exception: {e}", exc_info=True)
        # Return a generic error message to the client
        response = {
            "status": "error",
            "message": "An internal server error occurred. Please try again later."
        }
        return jsonify(response), 500
    
    # Initialize database if it's a file-based SQLite database and the file doesn't exist
    db_path = app.config['SQLALCHEMY_DATABASE_URI']
    if db_path and db_path.startswith('sqlite:///'):
        db_file = db_path.replace('sqlite:///', '')
        if not os.path.exists(db_file):
            with app.app_context():
                db.create_all()
                logger.info("Database initialized successfully")
    
    return app

# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db(app):
    """Initialize database (deprecated, logic moved to create_app)"""
    with app.app_context():
        db.create_all()
        app.logger.info("Database initialized successfully")




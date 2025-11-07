
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
    app.config.update({
        \'SECRET_KEY\': os.environ.get(\'SECRET_KEY\', secrets.token_urlsafe(32)),
        \'SQLALCHEMY_TRACK_MODIFICATIONS\': False,
        \'JWT_SECRET_KEY\': os.environ.get(\'JWT_SECRET_KEY\', secrets.token_urlsafe(32)),
        \'JWT_ACCESS_TOKEN_EXPIRES\': 3600 # seconds, 1 hour
    })

    # Ensure the database directory exists if using a file-based database
    db_path = os.environ.get(\'DATABASE_URL\', \'sqlite:///instance/flowlet_integrated.db\')
    if db_path.startswith(\'sqlite:///\'):
        db_file = db_path.replace(\'sqlite:///\', \'\')
        db_dir = os.path.dirname(db_file)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir, exist_ok=True)
    
    app.config[\'SQLALCHEMY_DATABASE_URI\'] = db_path

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

    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors by serving the React app"""
        return send_from_directory(app.static_folder, \'index.html\')

    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors"""
        db.session.rollback()
        # Log the error for debugging
        logger.error(f"Internal Server Error: {error}", exc_info=True)
        return jsonify({\'error\': \'Internal server error\'}), 500
    
    return app

# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db(app):
    """Initialize database"""
    with app.app_context():
        db.create_all()
        logger.info("Database initialized successfully")




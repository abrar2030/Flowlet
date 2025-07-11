
"""
Flowlet Integrated Application - Production Deployment
"""

from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_migrate import Migrate
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import os
import secrets
import logging

from src.models import db
from src.routes import api_bp

# Initialize Flask app
app = Flask(__name__, static_folder=\'../unified-frontend/dist\', static_url_path=\'\')

# Configuration
app.config.update({
    \'SECRET_KEY\': os.environ.get(\'SECRET_KEY\', secrets.token_urlsafe(32)),
    \'SQLALCHEMY_DATABASE_URI\': os.environ.get(\'DATABASE_URL\', \'sqlite:///flowlet_integrated.db\'),
    \'SQLALCHEMY_TRACK_MODIFICATIONS\': False,
    \'JWT_SECRET_KEY\': os.environ.get(\'JWT_SECRET_KEY\', secrets.token_urlsafe(32)),
    \'JWT_ACCESS_TOKEN_EXPIRES\': 3600 # seconds, 1 hour
})

# Initialize extensions
db.init_app(app)
migrate = Migrate(app, db)
limiter = Limiter(key_func=get_remote_address, app=app)

# Configure CORS
CORS(app, origins=[\'http://localhost:3000\', \'http://localhost:5000\'], supports_credentials=True)

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
    return jsonify({\'error\': \'Internal server error\'}), 500

# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db():
    """Initialize database"""
    with app.app_context():
        db.create_all()
        logger.info("Database initialized successfully")

# ============================================================================
# MAIN APPLICATION
# ============================================================================

if __name__ == \'__main__\':
    init_db()
    app.run(host=\'0.0.0.0\', port=5000, debug=True)




# Enhanced Main Application with Financial Industry Standards
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import redis
from datetime import datetime
import logging
from logging.handlers import RotatingFileHandler

# Import security modules
from src.config.security import SecurityConfig
from src.security.rate_limiter import GlobalRateLimitMiddleware
from src.security.audit_logger import AuditLogger
from src.security.token_manager import TokenManager
from src.security.encryption_manager import EncryptionManager

# Import route blueprints
from src.routes.auth import auth_bp
from src.routes.wallet import wallet_bp
from src.routes.payment import payment_bp
from src.routes.card import card_bp
from src.routes.kyc_aml import kyc_aml_bp
from src.routes.ledger import ledger_bp
from src.routes.ai_service import ai_bp
from src.routes.security import security_bp

# Import new enhanced routes
from src.routes.monitoring import monitoring_bp
from src.routes.compliance import compliance_bp
from src.routes.multicurrency import multicurrency_bp
from src.routes.enhanced_cards import enhanced_cards_bp

def create_app(config_name='production'):
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(SecurityConfig)
    
    # Validate security configuration
    SecurityConfig.validate_config()
    
    # Database configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 
        'postgresql://user:password@localhost/flowlet_db'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
        'pool_size': SecurityConfig.DB_POOL_SIZE,
        'max_overflow': SecurityConfig.DB_MAX_OVERFLOW,
        'pool_timeout': SecurityConfig.DB_CONNECTION_TIMEOUT,
        'pool_pre_ping': True
    }
    
    # Initialize extensions
    db = SQLAlchemy(app)
    
    # Configure CORS with security headers
    CORS(app, 
         origins=SecurityConfig.CORS_ORIGINS,
         supports_credentials=True,
         expose_headers=['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'])
    
    # Initialize Redis for caching and rate limiting
    redis_client = redis.Redis.from_url(
        app.config.get('REDIS_URL', 'redis://localhost:6379'),
        decode_responses=True
    )
    app.redis = redis_client
    
    # Initialize global rate limiting
    GlobalRateLimitMiddleware(app)
    
    # Configure logging
    configure_logging(app)
    
    # Register blueprints with URL prefixes
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(wallet_bp, url_prefix='/api/v1/wallet')
    app.register_blueprint(payment_bp, url_prefix='/api/v1/payment')
    app.register_blueprint(card_bp, url_prefix='/api/v1/card')
    app.register_blueprint(kyc_aml_bp, url_prefix='/api/v1/kyc')
    app.register_blueprint(ledger_bp, url_prefix='/api/v1/ledger')
    app.register_blueprint(ai_bp, url_prefix='/api/v1/ai')
    app.register_blueprint(security_bp, url_prefix='/api/v1/security')
    
    # Register new enhanced blueprints
    app.register_blueprint(monitoring_bp, url_prefix='/api/v1/monitoring')
    app.register_blueprint(compliance_bp, url_prefix='/api/v1/compliance')
    app.register_blueprint(multicurrency_bp, url_prefix='/api/v1/multicurrency')
    app.register_blueprint(enhanced_cards_bp, url_prefix='/api/v1/cards/enhanced')
    
    # Security middleware
    @app.before_request
    def security_headers():
        """Add security headers to all responses"""
        # Skip for health check
        if request.endpoint == 'health':
            return
        
        # Log all requests for audit
        AuditLogger.log_event(
            user_id=getattr(request, 'current_user', {}).get('user_id'),
            action='api_request',
            resource_type='api_endpoint',
            resource_id=request.endpoint,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            request_data={'method': request.method, 'path': request.path}
        )
    
    @app.after_request
    def add_security_headers(response):
        """Add security headers to all responses"""
        # Security headers for financial applications
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
        
        # Remove server information
        response.headers.pop('Server', None)
        
        return response
    
    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': 'Bad Request',
            'message': 'The request could not be understood by the server',
            'code': 'BAD_REQUEST'
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication is required to access this resource',
            'code': 'UNAUTHORIZED'
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({
            'error': 'Forbidden',
            'message': 'You do not have permission to access this resource',
            'code': 'FORBIDDEN'
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found',
            'code': 'NOT_FOUND'
        }), 404
    
    @app.errorhandler(429)
    def rate_limit_exceeded(error):
        return jsonify({
            'error': 'Rate Limit Exceeded',
            'message': 'Too many requests. Please try again later.',
            'code': 'RATE_LIMIT_EXCEEDED'
        }), 429
    
    @app.errorhandler(500)
    def internal_error(error):
        # Log the error
        app.logger.error(f'Internal Server Error: {str(error)}')
        
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred',
            'code': 'INTERNAL_ERROR'
        }), 500
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint for monitoring"""
        try:
            # Check database connection
            db.session.execute('SELECT 1')
            
            # Check Redis connection
            redis_client.ping()
            
            return jsonify({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'version': '2.0.0',
                'services': {
                    'database': 'healthy',
                    'redis': 'healthy',
                    'security': 'active'
                }
            }), 200
            
        except Exception as e:
            return jsonify({
                'status': 'unhealthy',
                'timestamp': datetime.utcnow().isoformat(),
                'error': str(e)
            }), 503
    
    # API documentation endpoint
    @app.route('/api/v1/docs', methods=['GET'])
    def api_documentation():
        """API documentation endpoint"""
        return jsonify({
            'api_version': 'v1',
            'documentation_url': '/api/v1/docs',
            'endpoints': {
                'authentication': '/api/v1/auth',
                'wallet_management': '/api/v1/wallet',
                'payments': '/api/v1/payment',
                'cards': '/api/v1/card',
                'enhanced_cards': '/api/v1/cards/enhanced',
                'kyc_aml': '/api/v1/kyc',
                'ledger': '/api/v1/ledger',
                'ai_services': '/api/v1/ai',
                'security': '/api/v1/security',
                'monitoring': '/api/v1/monitoring',
                'compliance': '/api/v1/compliance',
                'multicurrency': '/api/v1/multicurrency'
            },
            'security_features': [
                'JWT Authentication with Refresh Tokens',
                'Rate Limiting',
                'Input Validation',
                'Audit Logging',
                'Data Encryption',
                'Real-time Monitoring',
                'Compliance Reporting'
            ],
            'supported_currencies': [
                'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
                'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'ZAR',
                'BRL', 'INR', 'KRW', 'PLN'
            ]
        }), 200
    
    # Initialize database tables
    with app.app_context():
        try:
            db.create_all()
            app.logger.info('Database tables created successfully')
        except Exception as e:
            app.logger.error(f'Error creating database tables: {str(e)}')
    
    return app

def configure_logging(app):
    """Configure application logging"""
    if not app.debug and not app.testing:
        # Create logs directory if it doesn't exist
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        # Configure file handler
        file_handler = RotatingFileHandler(
            'logs/flowlet.log',
            maxBytes=10240000,  # 10MB
            backupCount=10
        )
        
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Flowlet Financial Backend startup')

# Create the application instance
app = create_app()

if __name__ == '__main__':
    # Development server configuration
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5000)),
        debug=os.environ.get('FLASK_ENV') == 'development'
    )


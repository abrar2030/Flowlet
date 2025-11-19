"""
Enhanced error handlers for financial applications
"""

from flask import jsonify, request, current_app
from datetime import datetime, timezone
import traceback
import logging
from sqlalchemy.exc import IntegrityError, OperationalError

# Import the audit logger and severity enum
from ..security.audit_logger import audit_logger
from ..models.audit_log import AuditSeverity

logger = logging.getLogger(__name__)

def register_error_handlers(app):
    """Register comprehensive error handlers"""
    
    @app.errorhandler(400)
    def bad_request(error):
        """Handle bad request errors"""
        audit_logger.log_security_event(
            f"Bad request from {request.remote_addr}: {str(error)}",
            severity=AuditSeverity.MEDIUM,
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'error': 'Bad Request',
            'message': 'The request could not be understood by the server',
            'code': 'BAD_REQUEST',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'request_id': getattr(request, 'request_id', None)
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        """Handle unauthorized access"""
        audit_logger.log_security_event(
            f"Unauthorized access attempt from {request.remote_addr}: {str(error)}",
            severity=AuditSeverity.HIGH,
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'error': 'Unauthorized',
            'message': 'Authentication is required to access this resource',
            'code': 'UNAUTHORIZED',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'request_id': getattr(request, 'request_id', None)
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        """Handle forbidden access"""
        audit_logger.log_security_event(
            f"Forbidden access attempt from {request.remote_addr}: {str(error)}",
            severity=AuditSeverity.HIGH,
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'error': 'Forbidden',
            'message': 'You do not have permission to access this resource',
            'code': 'FORBIDDEN',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'request_id': getattr(request, 'request_id', None)
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle not found errors"""
        return jsonify({
            'error': 'Not Found',
            'message': 'The requested resource was not found',
            'code': 'NOT_FOUND',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'request_id': getattr(request, 'request_id', None)
        }), 404
    
    @app.errorhandler(429)
    def rate_limit_exceeded(error):
        """Handle rate limit exceeded"""
        audit_logger.log_security_event(
            f"Rate limit exceeded from {request.remote_addr}",
            severity=AuditSeverity.HIGH,
            ip_address=request.remote_addr
        )
        
        return jsonify({
            'error': 'Rate Limit Exceeded',
            'message': 'Too many requests. Please try again later.',
            'code': 'RATE_LIMIT_EXCEEDED',
            'retry_after': 60,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'request_id': getattr(request, 'request_id', None)
        }), 429
    
    # Custom exception handlers for better error reporting
    @app.errorhandler(ValueError)
    def handle_value_error(error):
        """Handle ValueError exceptions"""
        return jsonify({
            'error': 'Invalid Value',
            'message': str(error),
            'code': 'INVALID_VALUE',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'request_id': getattr(request, 'request_id', None)
        }), 400
    
    @app.errorhandler(KeyError)
    def handle_key_error(error):
        """Handle KeyError exceptions"""
        return jsonify({
            'error': 'Missing Required Field',
            'message': f'Required field missing: {str(error)}',
            'code': 'MISSING_FIELD',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'request_id': getattr(request, 'request_id', None)
        }), 400

    @app.errorhandler(IntegrityError)
    def handle_integrity_error(error):
        """Handle SQLAlchemy IntegrityError (e.g., unique constraint violation)"""
        db.session.rollback() # Rollback the session to clear the error state
        logger.error(f'Integrity Error: {error}')
        return jsonify({
            'error': 'Data Integrity Error',
            'message': 'The operation violates data integrity constraints (e.g., duplicate entry)',
            'code': 'INTEGRITY_ERROR',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'request_id': getattr(request, 'request_id', None)
        }), 409

    @app.errorhandler(OperationalError)
    def handle_operational_error(error):
        """Handle SQLAlchemy OperationalError (e.g., database connection lost)"""
        db.session.rollback() # Rollback the session to clear the error state
        logger.error(f'Database Operational Error: {error}')
        return jsonify({
            'error': 'Database Operational Error',
            'message': 'A temporary database error occurred. Please try again.',
            'code': 'DATABASE_ERROR',
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'request_id': getattr(request, 'request_id', None)
        }), 503
    
    @app.errorhandler(Exception)
    def internal_server_error(error):
        """Handle all other internal server errors"""
        error_id = f"ERR-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Log the full error details
        logger.error(f'Internal Server Error [{error_id}]: {str(error)}')
        logger.error(f'Traceback [{error_id}]: {traceback.format_exc()}')
        
        # Log security event
        audit_logger.log_security_event(
            f"Internal server error [{error_id}]: {str(error)}",
            severity=AuditSeverity.CRITICAL,
            details={'traceback': traceback.format_exc()}
        )
        
        return jsonify({
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred',
            'code': 'INTERNAL_ERROR',
            'error_id': error_id,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'request_id': getattr(request, 'request_id', None)
        }), 500

"""
Enhanced error handlers for financial applications
"""

import logging
import traceback
from datetime import datetime, timezone

from flask import current_app, jsonify, request


def register_error_handlers(app):
    """Register comprehensive error handlers"""

    @app.errorhandler(400)
    def bad_request(error):
        """Handle bad request errors"""
        current_app.audit_logger.log_security_event(
            f"Bad request from {request.remote_addr}: {str(error)}", severity="MEDIUM"
        )

        return (
            jsonify(
                {
                    "error": "Bad Request",
                    "message": "The request could not be understood by the server",
                    "code": "BAD_REQUEST",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            400,
        )

    @app.errorhandler(401)
    def unauthorized(error):
        """Handle unauthorized access"""
        current_app.audit_logger.log_security_event(
            f"Unauthorized access attempt from {request.remote_addr}: {str(error)}",
            severity="HIGH",
        )

        return (
            jsonify(
                {
                    "error": "Unauthorized",
                    "message": "Authentication is required to access this resource",
                    "code": "UNAUTHORIZED",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            401,
        )

    @app.errorhandler(403)
    def forbidden(error):
        """Handle forbidden access"""
        current_app.audit_logger.log_security_event(
            f"Forbidden access attempt from {request.remote_addr}: {str(error)}",
            severity="HIGH",
        )

        return (
            jsonify(
                {
                    "error": "Forbidden",
                    "message": "You do not have permission to access this resource",
                    "code": "FORBIDDEN",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            403,
        )

    @app.errorhandler(404)
    def not_found(error):
        """Handle not found errors"""
        return (
            jsonify(
                {
                    "error": "Not Found",
                    "message": "The requested resource was not found",
                    "code": "NOT_FOUND",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            404,
        )

    @app.errorhandler(405)
    def method_not_allowed(error):
        """Handle method not allowed errors"""
        return (
            jsonify(
                {
                    "error": "Method Not Allowed",
                    "message": f"The {request.method} method is not allowed for this endpoint",
                    "code": "METHOD_NOT_ALLOWED",
                    "allowed_methods": (
                        error.valid_methods if hasattr(error, "valid_methods") else []
                    ),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            405,
        )

    @app.errorhandler(422)
    def unprocessable_entity(error):
        """Handle validation errors"""
        return (
            jsonify(
                {
                    "error": "Unprocessable Entity",
                    "message": "The request was well-formed but contains semantic errors",
                    "code": "UNPROCESSABLE_ENTITY",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            422,
        )

    @app.errorhandler(429)
    def rate_limit_exceeded(error):
        """Handle rate limit exceeded"""
        current_app.audit_logger.log_security_event(
            f"Rate limit exceeded from {request.remote_addr}", severity="HIGH"
        )

        return (
            jsonify(
                {
                    "error": "Rate Limit Exceeded",
                    "message": "Too many requests. Please try again later.",
                    "code": "RATE_LIMIT_EXCEEDED",
                    "retry_after": 60,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            429,
        )

    @app.errorhandler(500)
    def internal_server_error(error):
        """Handle internal server errors"""
        error_id = f"ERR-{datetime.now().strftime('%Y%m%d%H%M%S')}"

        # Log the full error details
        app.logger.error(f"Internal Server Error [{error_id}]: {str(error)}")
        app.logger.error(f"Traceback [{error_id}]: {traceback.format_exc()}")

        # Log security event
        current_app.audit_logger.log_security_event(
            f"Internal server error [{error_id}]: {str(error)}", severity="CRITICAL"
        )

        return (
            jsonify(
                {
                    "error": "Internal Server Error",
                    "message": "An unexpected error occurred",
                    "code": "INTERNAL_ERROR",
                    "error_id": error_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            500,
        )

    @app.errorhandler(502)
    def bad_gateway(error):
        """Handle bad gateway errors"""
        return (
            jsonify(
                {
                    "error": "Bad Gateway",
                    "message": "The server received an invalid response from an upstream server",
                    "code": "BAD_GATEWAY",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            502,
        )

    @app.errorhandler(503)
    def service_unavailable(error):
        """Handle service unavailable errors"""
        return (
            jsonify(
                {
                    "error": "Service Unavailable",
                    "message": "The service is temporarily unavailable",
                    "code": "SERVICE_UNAVAILABLE",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            503,
        )

    @app.errorhandler(504)
    def gateway_timeout(error):
        """Handle gateway timeout errors"""
        return (
            jsonify(
                {
                    "error": "Gateway Timeout",
                    "message": "The server did not receive a timely response from an upstream server",
                    "code": "GATEWAY_TIMEOUT",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            504,
        )

    # Custom exception handlers
    @app.errorhandler(ValueError)
    def handle_value_error(error):
        """Handle ValueError exceptions"""
        return (
            jsonify(
                {
                    "error": "Invalid Value",
                    "message": str(error),
                    "code": "INVALID_VALUE",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            400,
        )

    @app.errorhandler(KeyError)
    def handle_key_error(error):
        """Handle KeyError exceptions"""
        return (
            jsonify(
                {
                    "error": "Missing Required Field",
                    "message": f"Required field missing: {str(error)}",
                    "code": "MISSING_FIELD",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            400,
        )

    # Database-related error handlers
    @app.errorhandler(Exception)
    def handle_database_error(error):
        """Handle database-related errors"""
        error_type = type(error).__name__

        if "IntegrityError" in error_type:
            return (
                jsonify(
                    {
                        "error": "Data Integrity Error",
                        "message": "The operation violates data integrity constraints",
                        "code": "INTEGRITY_ERROR",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "request_id": getattr(request, "request_id", None),
                    }
                ),
                409,
            )

        elif "OperationalError" in error_type:
            return (
                jsonify(
                    {
                        "error": "Database Operational Error",
                        "message": "A database operational error occurred",
                        "code": "DATABASE_ERROR",
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "request_id": getattr(request, "request_id", None),
                    }
                ),
                503,
            )

        # For any other unhandled exceptions, log and return generic error
        error_id = f"ERR-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        app.logger.error(f"Unhandled Exception [{error_id}]: {str(error)}")
        app.logger.error(f"Traceback [{error_id}]: {traceback.format_exc()}")

        return (
            jsonify(
                {
                    "error": "Internal Server Error",
                    "message": "An unexpected error occurred",
                    "code": "INTERNAL_ERROR",
                    "error_id": error_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "request_id": getattr(request, "request_id", None),
                }
            ),
            500,
        )

"""
Error handlers for Flask application
Provides centralized error handling for common HTTP errors and exceptions
"""

from flask import jsonify
from werkzeug.exceptions import HTTPException
from pydantic import ValidationError


def register_error_handlers(app):
    """Register error handlers with the Flask app"""

    @app.errorhandler(400)
    def bad_request(error):
        return (
            jsonify({"status": "error", "message": "Bad request", "error": str(error)}),
            400,
        )

    @app.errorhandler(401)
    def unauthorized(error):
        return (
            jsonify(
                {
                    "status": "error",
                    "message": "Authentication required",
                    "error": str(error),
                }
            ),
            401,
        )

    @app.errorhandler(403)
    def forbidden(error):
        return (
            jsonify({"status": "error", "message": "Forbidden", "error": str(error)}),
            403,
        )

    @app.errorhandler(404)
    def not_found(error):
        return (
            jsonify({"status": "error", "message": "Not found", "error": str(error)}),
            404,
        )

    @app.errorhandler(500)
    def internal_server_error(error):
        app.logger.error(f"Internal server error: {error}", exc_info=True)
        return jsonify({"status": "error", "message": "Internal server error"}), 500

    @app.errorhandler(HTTPException)
    def handle_http_exception(error):
        return jsonify({"status": "error", "message": error.description}), error.code


def handle_validation_error(error: ValidationError):
    """Handle Pydantic validation errors"""
    errors = error.errors()
    formatted_errors = []
    for err in errors:
        field = ".".join(str(x) for x in err["loc"])
        formatted_errors.append({"field": field, "message": err["msg"]})

    return (
        jsonify(
            {
                "status": "error",
                "message": "Validation error",
                "errors": formatted_errors,
            }
        ),
        400,
    )


def handle_wallet_service_error(error):
    """Handle wallet service errors"""
    return jsonify(
        {"status": "error", "message": error.message, "code": error.error_code}
    ), getattr(error, "status_code", 400)


def handle_generic_exception(error: Exception):
    """Handle generic exceptions"""
    return (
        jsonify(
            {"status": "error", "message": "An error occurred", "error": str(error)}
        ),
        500,
    )

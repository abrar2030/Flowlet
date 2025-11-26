from flask import jsonify
from pydantic import ValidationError
from .services.wallet_service import WalletServiceError


def handle_validation_error(e: ValidationError):
    """Handles Pydantic validation errors."""
    errors = [
        {"loc": str(err["loc"]), "msg": err["msg"], "type": err["type"]}
        for err in e.errors()
    ]
    return (
        jsonify(
            {
                "error": "Validation Error",
                "code": "VALIDATION_ERROR",
                "details": errors,
            }
        ),
        400,
    )


def handle_wallet_service_error(e: WalletServiceError):
    """Handles custom WalletService errors."""
    return (
        jsonify(
            {
                "error": str(e),
                "code": e.error_code,
            }
        ),
        e.status_code,
    )


def handle_generic_exception(e: Exception):
    """Handles all other unhandled exceptions."""
    # Log the exception for debugging purposes
    import logging

    logger = logging.getLogger(__name__)
    logger.error(f"Unhandled exception: {str(e)}", exc_info=True)

    return (
        jsonify(
            {
                "error": "Internal Server Error",
                "code": "INTERNAL_ERROR",
            }
        ),
        500,
    )

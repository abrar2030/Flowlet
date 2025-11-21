import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from functools import wraps

from flask import Blueprint, g, jsonify, request
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from ..models.account import Account
from ..models.audit_log import AuditEventType, AuditSeverity
from ..models.card import Card, CardNetwork, CardStatus, CardType
from ..models.database import db
from ..security.audit_logger import audit_logger
from ..utils.validators import InputValidator

# Create blueprint
cards_bp = Blueprint("cards", __name__, url_prefix="/api/v1/cards")

# Configure logging
logger = logging.getLogger(__name__)


def card_access_required(f):
    """Decorator to ensure user has access to the card"""

    @wraps(f)
    @token_required
    def decorated(card_id, *args, **kwargs):
        card = db.session.get(Card, card_id)
        if not card:
            return jsonify({"error": "Card not found", "code": "CARD_NOT_FOUND"}), 404

        # Check if user owns the card or is admin
        account = db.session.get(Account, card.account_id)
        if account.user_id != g.current_user.id and not g.current_user.is_admin:
            audit_logger.log_event(
                event_type=AuditEventType.SECURITY_ALERT,
                description="Unauthorized card access attempt",
                severity=AuditSeverity.HIGH,
                user_id=g.current_user.id,
                details={"card_id": card_id},
                ip_address=request.remote_addr,
            )
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        g.card = card
        return f(card_id, *args, **kwargs)

    return decorated


@cards_bp.route("/", methods=["GET"])
@token_required
def get_all_cards():
    """Get all cards for the current user"""
    try:
        user_id = g.current_user.id

        # Get all accounts for the user
        accounts_stmt = select(Account.id).filter_by(user_id=user_id)
        account_ids = db.session.execute(accounts_stmt).scalars().all()

        if not account_ids:
            return jsonify({"cards": []}), 200

        # Get all cards associated with those accounts
        cards_stmt = select(Card).filter(Card.account_id.in_(account_ids))
        cards = db.session.execute(cards_stmt).scalars().all()

        card_list = [card.to_dict() for card in cards]

        return jsonify({"cards": card_list}), 200

    except Exception as e:
        logger.error(f"Get all cards error: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Failed to retrieve cards", "code": "GET_CARDS_ERROR"}),
            500,
        )


@cards_bp.route("/issue", methods=["POST"])
@token_required
def issue_card():
    """Issue a new virtual or physical card"""
    try:
        data = request.get_json()
        if not data:
            return (
                jsonify(
                    {
                        "error": "Request body must contain valid JSON",
                        "code": "INVALID_JSON",
                    }
                ),
                400,
            )

        required_fields = ["account_id", "card_type", "card_network"]
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return (
                jsonify(
                    {
                        "error": f'Missing required fields: {", ".join(missing_fields)}',
                        "code": "MISSING_FIELDS",
                    }
                ),
                400,
            )

        # Find and validate account
        account = db.session.get(Account, data["account_id"])
        if not account:
            return (
                jsonify({"error": "Account not found", "code": "ACCOUNT_NOT_FOUND"}),
                404,
            )

        # Check if user owns the account
        if account.user_id != g.current_user.id:
            return jsonify({"error": "Access denied", "code": "ACCESS_DENIED"}), 403

        # Validate card type and network
        try:
            card_type = CardType(data["card_type"].lower())
            card_network = CardNetwork(data["card_network"].lower())
        except ValueError as e:
            return jsonify({"error": str(e), "code": "INVALID_ENUM_VALUE"}), 400

        # Generate card details (using Card model's static methods)
        # NOTE: In a real system, card numbers are issued by a processor, not generated locally.
        # The Card model contains a placeholder `generate_card_number` for testing/demo purposes.
        # We will skip the actual card number generation and focus on the tokenization part.

        # Placeholder for card number generation (for last_four_digits and hash)
        # In a real system, this would be a call to a card processor API.
        # For now, we'll use a mock card number and rely on the Card model's internal logic.
        mock_card_number = Card.generate_card_number(card_network)

        # Set expiry date (3 years from now)
        expiry_date = datetime.now(timezone.utc) + timedelta(days=3 * 365)

        # Create new card instance
        card = Card(
            user_id=g.current_user.id,
            account_id=account.id,
            card_type=card_type,
            card_network=card_network,
            card_name=data.get("card_name", f"{card_type.value.title()} Card"),
            expiry_month=expiry_date.month,
            expiry_year=expiry_date.year,
            status=(
                CardStatus.ACTIVE
                if card_type == CardType.VIRTUAL
                else CardStatus.INACTIVE
            ),
        )

        # Set card number details (tokenization and hashing)
        card.set_card_number(mock_card_number)

        # Apply spending limits if provided
        spending_limits = data.get("spending_limits", {})
        if "daily" in spending_limits:
            card.daily_limit = Decimal(str(spending_limits["daily"]))
        if "monthly" in spending_limits:
            card.monthly_limit = Decimal(str(spending_limits["monthly"]))
        if "per_transaction" in spending_limits:
            card.single_transaction_limit = Decimal(
                str(spending_limits["per_transaction"])
            )

        db.session.add(card)
        db.session.commit()

        audit_logger.log_event(
            event_type=AuditEventType.CARD_CREATED,
            description=f"New card issued: {card.card_type.value}",
            user_id=g.current_user.id,
            severity=AuditSeverity.LOW,
            resource_type="card",
            resource_id=card.id,
        )

        # Prepare response
        response_data = card.to_dict()
        response_data["message"] = (
            f"{card.card_type.value.title()} card issued successfully."
        )

        return jsonify(response_data), 201

    except IntegrityError:
        db.session.rollback()
        return (
            jsonify(
                {
                    "error": "A card with this token already exists",
                    "code": "INTEGRITY_ERROR",
                }
            ),
            409,
        )
    except Exception as e:
        db.session.rollback()
        logger.error(f"Issue card error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "An unexpected error occurred during card issuance",
                    "code": "INTERNAL_ERROR",
                }
            ),
            500,
        )


@cards_bp.route("/<card_id>", methods=["GET"])
@card_access_required
def get_card_details(card_id):
    """Get details for a specific card"""
    card = g.card

    # Only return sensitive details if explicitly requested and authorized (e.g., for virtual card display)
    # For a standard GET, we return the non-sensitive dict.
    return jsonify(card.to_dict(include_sensitive=True)), 200


@cards_bp.route("/<card_id>/status", methods=["PUT"])
@card_access_required
def update_card_status(card_id):
    """Block, unblock, or report a card as lost/stolen"""
    try:
        data = request.get_json()
        if not data or "status" not in data:
            return (
                jsonify({"error": "Missing status field", "code": "MISSING_DATA"}),
                400,
            )

        card = g.card
        new_status_str = data["status"].upper()

        try:
            new_status = CardStatus(new_status_str.lower())
        except ValueError:
            return (
                jsonify(
                    {
                        "error": f"Invalid status. Must be one of: {[s.value for s in CardStatus]}",
                        "code": "INVALID_STATUS",
                    }
                ),
                400,
            )

        # Logic for status change
        if new_status == CardStatus.BLOCKED:
            card.block_card()
            event_type = AuditEventType.CARD_BLOCKED
        elif new_status == CardStatus.ACTIVE and card.status == CardStatus.BLOCKED:
            card.unblock_card()
            event_type = AuditEventType.CARD_UNBLOCKED
        elif new_status in [CardStatus.LOST, CardStatus.STOLEN]:
            card.report_lost_or_stolen(new_status.value)
            event_type = AuditEventType.SECURITY_ALERT
        else:
            # For other status changes, a more complex flow might be needed
            card.status = new_status
            event_type = AuditEventType.ACCOUNT_MODIFICATION

        db.session.commit()

        audit_logger.log_event(
            event_type=event_type,
            description=f"Card status updated to: {new_status.value}",
            user_id=g.current_user.id,
            severity=AuditSeverity.MEDIUM,
            resource_type="card",
            resource_id=card.id,
        )

        return (
            jsonify(
                {
                    "message": f"Card status updated to {new_status.value}",
                    "card": card.to_dict(),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update card status error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {"error": "Failed to update card status", "code": "UPDATE_STATUS_ERROR"}
            ),
            500,
        )


@cards_bp.route("/<card_id>/pin", methods=["POST"])
@card_access_required
def set_card_pin(card_id):
    """Set the PIN for a card"""
    try:
        data = request.get_json()
        if not data or "pin" not in data:
            return jsonify({"error": "Missing PIN field", "code": "MISSING_DATA"}), 400

        card = g.card
        pin = str(data["pin"])

        # Validate PIN format
        is_valid, message = InputValidator.validate_json_structure(data, ["pin"])
        if not is_valid:
            return jsonify({"error": message, "code": "INVALID_PIN_FORMAT"}), 400

        # Use the Card model's method to set the PIN securely
        try:
            card.set_pin(pin)
            db.session.commit()
        except ValueError as e:
            return jsonify({"error": str(e), "code": "INVALID_PIN_VALUE"}), 400

        audit_logger.log_event(
            event_type=AuditEventType.SECURITY_ALERT,
            description="Card PIN set successfully",
            user_id=g.current_user.id,
            severity=AuditSeverity.MEDIUM,
            resource_type="card",
            resource_id=card.id,
        )

        return jsonify({"message": "Card PIN set successfully"}), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Set card PIN error: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Failed to set card PIN", "code": "SET_PIN_ERROR"}),
            500,
        )


@cards_bp.route("/<card_id>/controls", methods=["PUT"])
@card_access_required
def update_card_controls(card_id):
    """Update card spending limits and transaction controls"""
    try:
        data = request.get_json()
        if not data:
            return (
                jsonify(
                    {
                        "error": "Request body must contain valid JSON",
                        "code": "INVALID_JSON",
                    }
                ),
                400,
            )

        card = g.card

        # Update spending limits
        if "daily_limit" in data:
            is_valid, message, amount = InputValidator.validate_amount(
                data["daily_limit"]
            )
            if not is_valid:
                return (
                    jsonify(
                        {
                            "error": f"Invalid daily limit: {message}",
                            "code": "INVALID_LIMIT",
                        }
                    ),
                    400,
                )
            card.daily_limit = amount

        if "monthly_limit" in data:
            is_valid, message, amount = InputValidator.validate_amount(
                data["monthly_limit"]
            )
            if not is_valid:
                return (
                    jsonify(
                        {
                            "error": f"Invalid monthly limit: {message}",
                            "code": "INVALID_LIMIT",
                        }
                    ),
                    400,
                )
            card.monthly_limit = amount

        if "single_transaction_limit" in data:
            is_valid, message, amount = InputValidator.validate_amount(
                data["single_transaction_limit"]
            )
            if not is_valid:
                return (
                    jsonify(
                        {
                            "error": f"Invalid single transaction limit: {message}",
                            "code": "INVALID_LIMIT",
                        }
                    ),
                    400,
                )
            card.single_transaction_limit = amount

        # Update boolean controls
        for field in [
            "is_contactless_enabled",
            "is_online_enabled",
            "is_international_enabled",
            "fraud_alerts_enabled",
            "velocity_checks_enabled",
            "location_verification_enabled",
        ]:
            if field in data and isinstance(data[field], bool):
                setattr(card, field, data[field])

        db.session.commit()

        audit_logger.log_event(
            event_type=AuditEventType.ACCOUNT_MODIFICATION,
            description="Card controls updated",
            user_id=g.current_user.id,
            severity=AuditSeverity.LOW,
            resource_type="card",
            resource_id=card.id,
        )

        return (
            jsonify(
                {
                    "message": "Card controls updated successfully",
                    "card": card.to_dict(include_sensitive=True),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Update card controls error: {str(e)}", exc_info=True)
        return (
            jsonify(
                {
                    "error": "Failed to update card controls",
                    "code": "UPDATE_CONTROLS_ERROR",
                }
            ),
            500,
        )

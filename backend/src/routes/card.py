import logging

from flask import Blueprint, g, jsonify, request
from src.models.user import User
from src.routes.auth import token_required
from src.services.card_service import CardService, CardServiceError

logger = logging.getLogger(__name__)
card_bp = Blueprint("card", __name__, url_prefix="/api/v1/cards")
card_service = CardService()


def get_current_user() -> User:
    # In a real Flask app, this would come from a session or token
    # For this refactoring, we'll assume g.current_user is populated by @token_required
    return g.current_user


@card_bp.route("/issue", methods=["POST"])
@token_required
def issue_card():
    """Issues a new virtual or physical card."""
    try:
        user = get_current_user()
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

        card, card_number, cvv = card_service.issue_card(
            user=user, data=data, ip_address=request.remote_addr
        )

        response_data = {
            "success": True,
            "card": card.to_dict(
                include_sensitive=True
            ),  # Use a method to format output
            "message": "Card issued successfully",
        }

        # For virtual cards, return sensitive data for immediate use
        if card.card_type == "virtual":
            response_data["card"]["card_number"] = card_number
            response_data["card"]["cvv"] = cvv

        return jsonify(response_data), 201

    except CardServiceError as e:
        return jsonify({"error": e.message, "code": e.code}), 400
    except Exception as e:
        logger.error(f"Unexpected card issuance error: {str(e)}")
        return (
            jsonify({"error": "Failed to issue card", "code": "CARD_ISSUANCE_ERROR"}),
            500,
        )


@card_bp.route("/<card_id>", methods=["GET"])
@token_required
def get_card(card_id):
    """Get card details."""
    try:
        user = get_current_user()
        card = card_service.get_card_details(user, card_id)
        return (
            jsonify({"success": True, "card": card.to_dict(include_sensitive=True)}),
            200,
        )
    except CardServiceError as e:
        return jsonify({"error": e.message, "code": e.code}), (
            404 if e.code == "CARD_NOT_FOUND" else 403
        )


@card_bp.route("/<card_id>/activate", methods=["POST"])
@token_required
def activate_card(card_id):
    """Activate a card (typically for physical cards)."""
    try:
        user = get_current_user()
        data = request.get_json()
        if not data or "pin" not in data:
            return (
                jsonify(
                    {"error": "PIN is required for activation", "code": "PIN_REQUIRED"}
                ),
                400,
            )

        card = card_service.activate_card(
            user=user,
            card_id=card_id,
            pin=data["pin"],
            activation_code=data.get("activation_code"),
        )
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Card activated successfully",
                    "card": card.to_dict(),
                }
            ),
            200,
        )

    except CardServiceError as e:
        return jsonify({"error": e.message, "code": e.code}), 400


@card_bp.route("/<card_id>/pin", methods=["PUT"])
@token_required
def update_pin(card_id):
    """Update card PIN."""
    try:
        user = get_current_user()
        data = request.get_json()
        if not data or "current_pin" not in data or "new_pin" not in data:
            return (
                jsonify(
                    {
                        "error": "Current PIN and new PIN are required",
                        "code": "PIN_REQUIRED",
                    }
                ),
                400,
            )

        card = card_service.update_pin(
            user=user,
            card_id=card_id,
            current_pin=data["current_pin"],
            new_pin=data["new_pin"],
        )
        return jsonify({"success": True, "message": "PIN updated successfully"}), 200

    except CardServiceError as e:
        return jsonify({"error": e.message, "code": e.code}), 400


@card_bp.route("/<card_id>/freeze", methods=["POST"])
@token_required
def freeze_card(card_id):
    """Freeze/block a card."""
    try:
        user = get_current_user()
        data = request.get_json() or {}
        reason = data.get("reason", "User requested freeze")

        card = card_service.freeze_card(user, card_id, reason, request.remote_addr)
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Card has been frozen successfully",
                    "card": card.to_dict(),
                }
            ),
            200,
        )

    except CardServiceError as e:
        return jsonify({"error": e.message, "code": e.code}), 400


@card_bp.route("/<card_id>/unfreeze", methods=["POST"])
@token_required
def unfreeze_card(card_id):
    """Unfreeze/unblock a card."""
    try:
        user = get_current_user()
        card = card_service.unfreeze_card(user, card_id, request.remote_addr)
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Card has been unfrozen successfully",
                    "card": card.to_dict(),
                }
            ),
            200,
        )

    except CardServiceError as e:
        return jsonify({"error": e.message, "code": e.code}), 400


@card_bp.route("/<card_id>/cancel", methods=["POST"])
@token_required
def cancel_card(card_id):
    """Cancel a card permanently."""
    try:
        user = get_current_user()
        data = request.get_json() or {}
        reason = data.get("reason", "User requested cancellation")

        if data.get("confirmation") != "CANCEL":
            return (
                jsonify(
                    {
                        "error": 'Confirmation required. Set confirmation field to "CANCEL"',
                        "code": "CONFIRMATION_REQUIRED",
                    }
                ),
                400,
            )

        card = card_service.cancel_card(user, card_id, reason, request.remote_addr)
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Card has been cancelled permanently",
                    "card": card.to_dict(),
                }
            ),
            200,
        )

    except CardServiceError as e:
        return jsonify({"error": e.message, "code": e.code}), 400


@card_bp.route("/<card_id>/limits", methods=["PUT"])
@token_required
def update_spending_limits(card_id):
    """Update card spending limits."""
    try:
        user = get_current_user()
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

        card, changes = card_service.update_spending_limits(user, card_id, data)
        return (
            jsonify(
                {
                    "success": True,
                    "card": card.to_dict(include_sensitive=True),
                    "changes": changes,
                }
            ),
            200,
        )

    except CardServiceError as e:
        return jsonify({"error": e.message, "code": e.code}), 400


@card_bp.route("/<card_id>/controls", methods=["PUT"])
@token_required
def update_card_controls(card_id):
    """Update card controls."""
    try:
        user = get_current_user()
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

        card, changes = card_service.update_card_controls(user, card_id, data)
        return (
            jsonify(
                {
                    "success": True,
                    "card": card.to_dict(include_sensitive=True),
                    "changes": changes,
                }
            ),
            200,
        )

    except CardServiceError as e:
        return jsonify({"error": e.message, "code": e.code}), 400


@card_bp.route("/account/<account_id>", methods=["GET"])
@token_required
def get_account_cards(account_id):
    """Get all cards for a specific account."""
    try:
        user = get_current_user()
        cards = card_service.get_cards_for_account(user, account_id)
        card_list = [card.to_dict() for card in cards]
        return jsonify({"success": True, "cards": card_list}), 200

    except CardServiceError as e:
        return jsonify({"error": e.message, "code": e.code}), 403

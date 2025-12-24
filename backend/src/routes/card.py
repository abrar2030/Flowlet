"""
Card management routes
"""

from typing import Any


from flask import Blueprint, jsonify, request

card_bp = Blueprint("card", __name__, url_prefix="/cards")


@card_bp.route("/", methods=["GET"])
def list_cards() -> Any:
    """List all cards"""
    return jsonify({"cards": [], "message": "Card listing endpoint"})


@card_bp.route("/<int:card_id>", methods=["GET"])
def get_card(card_id: int) -> Any:
    """Get specific card"""
    return jsonify({"card_id": card_id, "message": "Card details endpoint"})


@card_bp.route("/", methods=["POST"])
def create_card() -> Any:
    """Create a new card"""
    data = request.get_json()
    return jsonify({"message": "Card created", "data": data}), 201

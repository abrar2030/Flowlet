from flask import Blueprint

accounts_bp = Blueprint("accounts", __name__)

@accounts_bp.route("/", methods=["GET"])
def get_accounts():
    return {"message": "Accounts API endpoint"}, 200

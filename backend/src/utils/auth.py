"""Authentication utilities"""

from typing import Any
from functools import wraps
from flask import request, jsonify
import jwt
import os


def token_required(f: Any) -> Any:
    """Decorator to require valid JWT token"""

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"message": "Token is missing"}), 401

        try:
            if token.startswith("Bearer "):
                token = token[7:]
            data = jwt.decode(
                token, os.environ.get("JWT_SECRET_KEY", "secret"), algorithms=["HS256"]
            )
        except Exception:
            return jsonify({"message": "Token is invalid"}), 401

        return f(*args, **kwargs)

    return decorated


def admin_required(f: Any) -> Any:
    """Decorator to require admin role"""

    @wraps(f)
    def decorated(*args: Any, **kwargs: Any) -> Any:
        token = request.headers.get("Authorization")
        if not token:
            return jsonify({"message": "Token is missing"}), 401

        try:
            if token.startswith("Bearer "):
                token = token[7:]
            data = jwt.decode(
                token, os.environ.get("JWT_SECRET_KEY", "secret"), algorithms=["HS256"]
            )
            # Check if user has admin role
            if data.get("role") != "admin":
                return jsonify({"message": "Admin access required"}), 403
        except Exception:
            return jsonify({"message": "Token is invalid"}), 401

        return f(*args, **kwargs)

    return decorated

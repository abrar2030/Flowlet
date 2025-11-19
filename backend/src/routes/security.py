"""
Security and API Key Management Routes (Admin Only)
"""

import hashlib
import json
import logging
import secrets
import string
from datetime import datetime, timedelta, timezone
from functools import wraps

from flask import Blueprint, g, jsonify, request
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError

from ..models.api_key import APIKey
from ..models.audit_log import AuditEventType, AuditLog, AuditSeverity
# Import refactored modules
from ..models.database import db
from ..security.audit_logger import audit_logger
from .auth import (  # Assuming decorators are defined here for now
    admin_required, token_required)

# Create blueprint
security_bp = Blueprint("security", __name__, url_prefix="/api/v1/security")

# Configure logging
logger = logging.getLogger(__name__)

# --- Helper Functions ---


def generate_api_key():
    """Generate a secure API key"""
    return "flw_" + "".join(
        secrets.choice(string.ascii_letters + string.digits) for _ in range(32)
    )


def hash_api_key(api_key):
    """Hash API key for secure storage"""
    return hashlib.sha256(api_key.encode()).hexdigest()


# --- Routes ---


@security_bp.route("/api-keys", methods=["POST"])
@admin_required
def create_api_key():
    """Create a new API key (Admin only)"""
    try:
        data = request.get_json()
        key_name = data.get("key_name")
        if not key_name:
            return (
                jsonify(
                    {
                        "error": "Missing required field: key_name",
                        "code": "MISSING_FIELDS",
                    }
                ),
                400,
            )

        # Generate API key
        api_key = generate_api_key()
        api_key_hash = hash_api_key(api_key)

        # Set expiration date (default 1 year)
        expires_in_days = data.get("expires_in_days", 365)
        expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)

        # Create API key record
        key_record = APIKey(
            key_name=key_name,
            api_key_hash=api_key_hash,
            permissions=json.dumps(data.get("permissions", ["read", "write"])),
            rate_limit=data.get("rate_limit", 1000),
            expires_at=expires_at,
            created_by=g.current_user.id,
        )

        db.session.add(key_record)
        db.session.commit()

        audit_logger.log_event(
            event_type=AuditEventType.SECURITY_EVENT,
            description=f"API key '{key_name}' created by admin {g.current_user.id}",
            user_id=g.current_user.id,
            severity=AuditSeverity.HIGH,
            resource_type="api_key",
            resource_id=key_record.id,
        )

        return (
            jsonify(
                {
                    "key_id": key_record.id,
                    "api_key": api_key,  # Only returned once during creation
                    "key_name": key_record.key_name,
                    "permissions": json.loads(key_record.permissions),
                    "expires_at": key_record.expires_at.isoformat(),
                    "warning": "Store this API key securely. It will not be shown again.",
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error creating API key: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


@security_bp.route("/api-keys", methods=["GET"])
@admin_required
def list_api_keys():
    """List all API keys (Admin only)"""
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)

        stmt = select(APIKey).order_by(APIKey.created_at.desc())

        offset = (page - 1) * per_page
        paginated_stmt = stmt.limit(per_page).offset(offset)

        keys = db.session.execute(paginated_stmt).scalars().all()

        # Get total count for pagination metadata
        count_stmt = select(func.count()).select_from(APIKey)
        total_keys = db.session.execute(count_stmt).scalar_one()
        total_pages = (total_keys + per_page - 1) // per_page

        key_list = [key.to_dict() for key in keys]

        return (
            jsonify(
                {
                    "api_keys": key_list,
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": total_keys,
                        "pages": total_pages,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error listing API keys: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


@security_bp.route("/api-keys/<key_id>/revoke", methods=["POST"])
@admin_required
def revoke_api_key(key_id):
    """Revoke an API key (Admin only)"""
    try:
        key_record = db.session.get(APIKey, key_id)
        if not key_record:
            return jsonify({"error": "API key not found", "code": "NOT_FOUND"}), 404

        key_record.is_active = False
        db.session.commit()

        audit_logger.log_event(
            event_type=AuditEventType.SECURITY_EVENT,
            description=f"API key '{key_record.key_name}' revoked by admin {g.current_user.id}",
            user_id=g.current_user.id,
            severity=AuditSeverity.HIGH,
            resource_type="api_key",
            resource_id=key_id,
        )

        return (
            jsonify(
                {
                    "key_id": key_id,
                    "message": "API key revoked successfully",
                    "revoked_at": datetime.now(timezone.utc).isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error revoking API key: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )


@security_bp.route("/audit-logs", methods=["GET"])
@admin_required
def get_audit_logs():
    """Get audit logs with filtering (Admin only)"""
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 50, type=int)

        stmt = select(AuditLog).order_by(AuditLog.created_at.desc())

        offset = (page - 1) * per_page
        paginated_stmt = stmt.limit(per_page).offset(offset)

        logs = db.session.execute(paginated_stmt).scalars().all()

        # Get total count for pagination metadata
        count_stmt = select(func.count()).select_from(AuditLog)
        total_logs = db.session.execute(count_stmt).scalar_one()
        total_pages = (total_logs + per_page - 1) // per_page

        log_list = [log.to_dict() for log in logs]

        return (
            jsonify(
                {
                    "audit_logs": log_list,
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": total_logs,
                        "pages": total_pages,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        logger.error(f"Error getting audit logs: {str(e)}", exc_info=True)
        return (
            jsonify({"error": "Internal server error", "code": "INTERNAL_ERROR"}),
            500,
        )

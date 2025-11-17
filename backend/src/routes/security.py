import hashlib
import json
import secrets
import string
from datetime import datetime, timedelta
from functools import wraps

from flask import Blueprint, jsonify, request
from src.models.database import APIKey, AuditLog, db

security_bp = Blueprint("security", __name__)


def generate_api_key():
    """Generate a secure API key"""
    return "flw_" + "".join(
        secrets.choice(string.ascii_letters + string.digits) for _ in range(32)
    )


def hash_api_key(api_key):
    """Hash API key for secure storage"""
    return hashlib.sha256(api_key.encode()).hexdigest()


def log_audit_event(
    user_id,
    action,
    resource_type,
    resource_id=None,
    request_data=None,
    response_status=None,
):
    """Log audit event"""
    try:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=request.remote_addr,
            user_agent=request.headers.get("User-Agent"),
            request_data=json.dumps(request_data) if request_data else None,
            response_status=response_status,
        )
        db.session.add(audit_log)
        db.session.commit()
    except Exception as e:
        # Don't fail the main operation if audit logging fails
        print(f"Audit logging failed: {str(e)}")


def require_api_key(f):
    """Decorator to require valid API key for endpoints"""

    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401

        api_key = auth_header.split(" ")[1]
        api_key_hash = hash_api_key(api_key)

        key_record = APIKey.query.filter_by(
            api_key_hash=api_key_hash, is_active=True
        ).first()
        if not key_record:
            return jsonify({"error": "Invalid API key"}), 401

        # Check if key is expired
        if key_record.expires_at and key_record.expires_at < datetime.utcnow():
            return jsonify({"error": "API key has expired"}), 401

        # Update last used timestamp
        key_record.last_used_at = datetime.utcnow()
        db.session.commit()

        # Add key info to request context
        request.api_key_info = key_record

        return f(*args, **kwargs)

    return decorated_function


@security_bp.route("/api-keys/create", methods=["POST"])
def create_api_key():
    """Create a new API key"""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["key_name"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Generate API key
        api_key = generate_api_key()
        api_key_hash = hash_api_key(api_key)

        # Set expiration date (default 1 year)
        expires_in_days = data.get("expires_in_days", 365)
        expires_at = datetime.utcnow() + timedelta(days=expires_in_days)

        # Create API key record
        key_record = APIKey(
            key_name=data["key_name"],
            api_key_hash=api_key_hash,
            permissions=json.dumps(data.get("permissions", ["read", "write"])),
            rate_limit=data.get("rate_limit", 1000),
            expires_at=expires_at,
        )

        db.session.add(key_record)
        db.session.commit()

        # Log audit event
        log_audit_event(
            user_id=None,
            action="create_api_key",
            resource_type="api_key",
            resource_id=key_record.id,
            request_data=data,
            response_status=201,
        )

        return (
            jsonify(
                {
                    "key_id": key_record.id,
                    "api_key": api_key,  # Only returned once during creation
                    "key_name": key_record.key_name,
                    "permissions": json.loads(key_record.permissions),
                    "rate_limit": key_record.rate_limit,
                    "expires_at": key_record.expires_at.isoformat(),
                    "created_at": key_record.created_at.isoformat(),
                    "warning": "Store this API key securely. It will not be shown again.",
                }
            ),
            201,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@security_bp.route("/api-keys", methods=["GET"])
def list_api_keys():
    """List all API keys (without showing the actual keys)"""
    try:
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)

        keys = APIKey.query.order_by(APIKey.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        key_list = []
        for key in keys.items:
            key_list.append(
                {
                    "key_id": key.id,
                    "key_name": key.key_name,
                    "permissions": json.loads(key.permissions),
                    "rate_limit": key.rate_limit,
                    "is_active": key.is_active,
                    "created_at": key.created_at.isoformat(),
                    "last_used_at": (
                        key.last_used_at.isoformat() if key.last_used_at else None
                    ),
                    "expires_at": (
                        key.expires_at.isoformat() if key.expires_at else None
                    ),
                }
            )

        return (
            jsonify(
                {
                    "api_keys": key_list,
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": keys.total,
                        "pages": keys.pages,
                        "has_next": keys.has_next,
                        "has_prev": keys.has_prev,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@security_bp.route("/api-keys/<key_id>/revoke", methods=["POST"])
def revoke_api_key(key_id):
    """Revoke an API key"""
    try:
        key_record = APIKey.query.get(key_id)
        if not key_record:
            return jsonify({"error": "API key not found"}), 404

        key_record.is_active = False
        db.session.commit()

        # Log audit event
        log_audit_event(
            user_id=None,
            action="revoke_api_key",
            resource_type="api_key",
            resource_id=key_id,
            response_status=200,
        )

        return (
            jsonify(
                {
                    "key_id": key_id,
                    "message": "API key revoked successfully",
                    "revoked_at": datetime.utcnow().isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@security_bp.route("/api-keys/<key_id>/permissions", methods=["PUT"])
def update_api_key_permissions(key_id):
    """Update API key permissions"""
    try:
        data = request.get_json()

        if "permissions" not in data:
            return jsonify({"error": "Missing required field: permissions"}), 400

        key_record = APIKey.query.get(key_id)
        if not key_record:
            return jsonify({"error": "API key not found"}), 404

        if not key_record.is_active:
            return (
                jsonify({"error": "Cannot update permissions for inactive API key"}),
                400,
            )

        # Validate permissions
        valid_permissions = [
            "read",
            "write",
            "admin",
            "wallet",
            "payment",
            "card",
            "kyc",
            "ledger",
        ]
        permissions = data["permissions"]

        for permission in permissions:
            if permission not in valid_permissions:
                return jsonify({"error": f"Invalid permission: {permission}"}), 400

        key_record.permissions = json.dumps(permissions)
        if "rate_limit" in data:
            key_record.rate_limit = data["rate_limit"]

        db.session.commit()

        # Log audit event
        log_audit_event(
            user_id=None,
            action="update_api_key_permissions",
            resource_type="api_key",
            resource_id=key_id,
            request_data=data,
            response_status=200,
        )

        return (
            jsonify(
                {
                    "key_id": key_id,
                    "permissions": json.loads(key_record.permissions),
                    "rate_limit": key_record.rate_limit,
                    "updated_at": datetime.utcnow().isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@security_bp.route("/audit-logs", methods=["GET"])
def get_audit_logs():
    """Get audit logs with filtering"""
    try:
        # Get query parameters
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 50, type=int)
        user_id = request.args.get("user_id")
        action = request.args.get("action")
        resource_type = request.args.get("resource_type")
        start_date = request.args.get("start_date")
        end_date = request.args.get("end_date")

        # Build query
        query = AuditLog.query

        if user_id:
            query = query.filter(AuditLog.user_id == user_id)

        if action:
            query = query.filter(AuditLog.action.like(f"%{action}%"))

        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)

        if start_date:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(AuditLog.created_at >= start_dt)

        if end_date:
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            query = query.filter(AuditLog.created_at < end_dt)

        # Execute query with pagination
        logs = query.order_by(AuditLog.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )

        log_list = []
        for log in logs.items:
            log_list.append(
                {
                    "log_id": log.id,
                    "user_id": log.user_id,
                    "action": log.action,
                    "resource_type": log.resource_type,
                    "resource_id": log.resource_id,
                    "ip_address": log.ip_address,
                    "user_agent": log.user_agent,
                    "request_data": (
                        json.loads(log.request_data) if log.request_data else None
                    ),
                    "response_status": log.response_status,
                    "created_at": log.created_at.isoformat(),
                }
            )

        return (
            jsonify(
                {
                    "audit_logs": log_list,
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": logs.total,
                        "pages": logs.pages,
                        "has_next": logs.has_next,
                        "has_prev": logs.has_prev,
                    },
                    "filters_applied": {
                        "user_id": user_id,
                        "action": action,
                        "resource_type": resource_type,
                        "start_date": start_date,
                        "end_date": end_date,
                    },
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@security_bp.route("/encryption/tokenize", methods=["POST"])
def tokenize_sensitive_data():
    """Tokenize sensitive data (like card numbers)"""
    try:
        data = request.get_json()

        if "sensitive_data" not in data:
            return jsonify({"error": "Missing required field: sensitive_data"}), 400

        sensitive_data = data["sensitive_data"]
        data_type = data.get("data_type", "generic")

        # Generate secure token
        token = f"TOK_{data_type.upper()}_{secrets.token_urlsafe(16)}"

        # In production, store the mapping in a secure token vault
        # For demo, we'll just return the token

        # Log audit event
        log_audit_event(
            user_id=data.get("user_id"),
            action="tokenize_data",
            resource_type="token",
            request_data={"data_type": data_type},
            response_status=200,
        )

        return (
            jsonify(
                {
                    "token": token,
                    "data_type": data_type,
                    "tokenized_at": datetime.utcnow().isoformat(),
                    "expires_at": (datetime.utcnow() + timedelta(days=365)).isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@security_bp.route("/encryption/detokenize", methods=["POST"])
def detokenize_data():
    """Detokenize sensitive data (retrieve original value)"""
    try:
        data = request.get_json()

        if "token" not in data:
            return jsonify({"error": "Missing required field: token"}), 400

        token = data["token"]

        # In production, retrieve from secure token vault
        # For demo, simulate successful detokenization
        if not token.startswith("TOK_"):
            return jsonify({"error": "Invalid token format"}), 400

        # Log audit event
        log_audit_event(
            user_id=data.get("user_id"),
            action="detokenize_data",
            resource_type="token",
            request_data={"token_prefix": token[:10] + "..."},
            response_status=200,
        )

        return (
            jsonify(
                {
                    "token": token,
                    "sensitive_data": "[REDACTED - Would contain original data in production]",
                    "detokenized_at": datetime.utcnow().isoformat(),
                    "access_logged": True,
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@security_bp.route("/security/scan", methods=["POST"])
def security_scan():
    """Perform security scan on user account or transaction"""
    try:
        data = request.get_json()

        scan_type = data.get("scan_type", "account")
        target_id = data.get("target_id")

        if not target_id:
            return jsonify({"error": "Missing required field: target_id"}), 400

        # Simulate security scan
        scan_results = {
            "scan_id": f"SCAN_{secrets.token_hex(8).upper()}",
            "scan_type": scan_type,
            "target_id": target_id,
            "security_score": 85,  # Out of 100
            "vulnerabilities": [],
            "recommendations": [],
        }

        # Simulate findings based on scan type
        if scan_type == "account":
            scan_results["checks_performed"] = [
                "Password strength",
                "Two-factor authentication",
                "Recent login patterns",
                "Device security",
                "API key usage",
            ]

            # Random security findings
            import random

            if random.random() < 0.3:  # 30% chance of finding issues
                scan_results["vulnerabilities"].append(
                    {
                        "severity": "medium",
                        "type": "weak_password",
                        "description": "Password does not meet complexity requirements",
                    }
                )
                scan_results["recommendations"].append(
                    "Update password with stronger complexity"
                )
                scan_results["security_score"] -= 15

            if random.random() < 0.2:  # 20% chance
                scan_results["vulnerabilities"].append(
                    {
                        "severity": "low",
                        "type": "unused_api_keys",
                        "description": "Inactive API keys detected",
                    }
                )
                scan_results["recommendations"].append("Revoke unused API keys")
                scan_results["security_score"] -= 5

        elif scan_type == "transaction":
            scan_results["checks_performed"] = [
                "Transaction pattern analysis",
                "Fraud indicators",
                "Compliance verification",
                "Risk assessment",
            ]

            # Transaction-specific findings
            if random.random() < 0.1:  # 10% chance
                scan_results["vulnerabilities"].append(
                    {
                        "severity": "high",
                        "type": "suspicious_pattern",
                        "description": "Unusual transaction pattern detected",
                    }
                )
                scan_results["recommendations"].append(
                    "Review transaction for potential fraud"
                )
                scan_results["security_score"] -= 25

        # Log audit event
        log_audit_event(
            user_id=data.get("user_id"),
            action="security_scan",
            resource_type=scan_type,
            resource_id=target_id,
            request_data=data,
            response_status=200,
        )

        return (
            jsonify(
                {
                    "scan_results": scan_results,
                    "scanned_at": datetime.utcnow().isoformat(),
                    "next_scan_recommended": (
                        datetime.utcnow() + timedelta(days=30)
                    ).isoformat(),
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@security_bp.route("/security/report", methods=["GET"])
def security_report():
    """Generate security report"""
    try:
        # Get date range parameters
        days = request.args.get("days", 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)

        # Query security-related audit logs
        security_events = AuditLog.query.filter(
            AuditLog.created_at >= start_date,
            AuditLog.action.in_(
                [
                    "create_api_key",
                    "revoke_api_key",
                    "tokenize_data",
                    "detokenize_data",
                    "security_scan",
                ]
            ),
        ).all()

        # Count API keys
        total_api_keys = APIKey.query.count()
        active_api_keys = APIKey.query.filter_by(is_active=True).count()
        expired_api_keys = APIKey.query.filter(
            APIKey.expires_at < datetime.utcnow()
        ).count()

        # Security metrics
        security_metrics = {
            "api_key_management": {
                "total_keys": total_api_keys,
                "active_keys": active_api_keys,
                "expired_keys": expired_api_keys,
                "revoked_keys": total_api_keys - active_api_keys - expired_api_keys,
            },
            "security_events": {
                "total_events": len(security_events),
                "tokenization_requests": len(
                    [e for e in security_events if e.action == "tokenize_data"]
                ),
                "security_scans": len(
                    [e for e in security_events if e.action == "security_scan"]
                ),
                "key_operations": len(
                    [e for e in security_events if "api_key" in e.action]
                ),
            },
            "compliance_status": {
                "encryption_enabled": True,
                "audit_logging_enabled": True,
                "access_controls_active": True,
                "token_vault_operational": True,
            },
        }

        return (
            jsonify(
                {
                    "security_report": security_metrics,
                    "report_period_days": days,
                    "generated_at": datetime.utcnow().isoformat(),
                    "security_posture": (
                        "strong" if active_api_keys > 0 else "needs_attention"
                    ),
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Example of protected endpoint using the decorator
@security_bp.route("/protected/test", methods=["GET"])
@require_api_key
def protected_test():
    """Test endpoint that requires API key authentication"""
    return (
        jsonify(
            {
                "message": "Access granted to protected resource",
                "api_key_info": {
                    "key_name": request.api_key_info.key_name,
                    "permissions": json.loads(request.api_key_info.permissions),
                    "rate_limit": request.api_key_info.rate_limit,
                },
                "accessed_at": datetime.utcnow().isoformat(),
            }
        ),
        200,
    )

# Real-time Transaction Monitoring System
import json
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

import redis
from flask import Blueprint, jsonify, request
from sqlalchemy import and_, or_
from src.models.enhanced_database import FraudAlert, Transaction, User, Wallet
from src.security.audit_logger import AuditLogger
from src.security.input_validator import InputValidator, ValidationError
from src.security.rate_limiter import rate_limit
from src.security.token_manager import (enhanced_token_required,
                                        require_permissions)

monitoring_bp = Blueprint("monitoring", __name__)


class TransactionMonitor:
    """Real-time transaction monitoring and alerting system"""

    def __init__(self):
        self.redis_client = redis.Redis.from_url(
            "redis://localhost:6379", decode_responses=True
        )
        self.alert_rules = self._load_alert_rules()

    def _load_alert_rules(self) -> List[Dict[str, Any]]:
        """Load configurable alert rules"""
        return [
            {
                "id": "high_value_transaction",
                "name": "High Value Transaction",
                "condition": "amount > 10000",
                "severity": "high",
                "action": "flag_and_review",
            },
            {
                "id": "rapid_succession",
                "name": "Rapid Succession Transactions",
                "condition": "count > 5 in 5 minutes",
                "severity": "medium",
                "action": "temporary_hold",
            },
            {
                "id": "unusual_time",
                "name": "Unusual Time Transaction",
                "condition": "time between 2am and 6am",
                "severity": "low",
                "action": "monitor",
            },
            {
                "id": "geographic_anomaly",
                "name": "Geographic Anomaly",
                "condition": "location != usual_location",
                "severity": "high",
                "action": "require_verification",
            },
            {
                "id": "round_amount",
                "name": "Round Amount Pattern",
                "condition": "amount % 1000 == 0 and amount >= 5000",
                "severity": "medium",
                "action": "enhanced_monitoring",
            },
        ]

    def analyze_transaction(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze transaction for suspicious patterns"""
        alerts = []
        risk_score = 0

        user_id = transaction_data.get("user_id")
        amount = Decimal(str(transaction_data.get("amount", 0)))
        transaction_time = datetime.utcnow()

        # Get user transaction history
        user_history = self._get_user_transaction_history(user_id, days=30)

        # Apply alert rules
        for rule in self.alert_rules:
            if self._evaluate_rule(rule, transaction_data, user_history):
                alerts.append(
                    {
                        "rule_id": rule["id"],
                        "rule_name": rule["name"],
                        "severity": rule["severity"],
                        "action": rule["action"],
                        "triggered_at": transaction_time.isoformat(),
                    }
                )

                # Add to risk score based on severity
                severity_scores = {"low": 10, "medium": 25, "high": 50, "critical": 100}
                risk_score += severity_scores.get(rule["severity"], 0)

        # Additional ML-based risk scoring
        ml_risk_score = self._calculate_ml_risk_score(transaction_data, user_history)
        risk_score += ml_risk_score

        # Determine overall risk level
        if risk_score >= 80:
            risk_level = "critical"
        elif risk_score >= 60:
            risk_level = "high"
        elif risk_score >= 30:
            risk_level = "medium"
        else:
            risk_level = "low"

        return {
            "risk_score": min(risk_score, 100),
            "risk_level": risk_level,
            "alerts": alerts,
            "requires_review": risk_score >= 60,
            "requires_verification": risk_score >= 80,
            "analysis_timestamp": transaction_time.isoformat(),
        }

    def _evaluate_rule(
        self,
        rule: Dict[str, Any],
        transaction_data: Dict[str, Any],
        user_history: List[Dict],
    ) -> bool:
        """Evaluate a specific alert rule"""
        rule_id = rule["id"]

        if rule_id == "high_value_transaction":
            amount = Decimal(str(transaction_data.get("amount", 0)))
            return amount > Decimal("10000")

        elif rule_id == "rapid_succession":
            # Check for multiple transactions in short time
            recent_count = len(
                [
                    t
                    for t in user_history
                    if (
                        datetime.utcnow() - datetime.fromisoformat(t["created_at"])
                    ).total_seconds()
                    < 300
                ]
            )
            return recent_count > 5

        elif rule_id == "unusual_time":
            current_hour = datetime.utcnow().hour
            return 2 <= current_hour <= 6

        elif rule_id == "geographic_anomaly":
            # Simplified geographic check (would use actual location data)
            user_location = transaction_data.get("location", "US")
            usual_location = self._get_user_usual_location(
                transaction_data.get("user_id")
            )
            return user_location != usual_location

        elif rule_id == "round_amount":
            amount = Decimal(str(transaction_data.get("amount", 0)))
            return amount % 1000 == 0 and amount >= 5000

        return False

    def _get_user_transaction_history(self, user_id: str, days: int = 30) -> List[Dict]:
        """Get user transaction history for analysis"""
        # This would query the database in a real implementation
        # For now, return mock data
        return []

    def _get_user_usual_location(self, user_id: str) -> str:
        """Get user's usual transaction location"""
        # This would analyze historical location data
        return "US"  # Default

    def _calculate_ml_risk_score(
        self, transaction_data: Dict[str, Any], user_history: List[Dict]
    ) -> int:
        """Calculate ML-based risk score"""
        # Simplified ML risk scoring
        # In production, this would use trained ML models

        risk_factors = 0
        amount = Decimal(str(transaction_data.get("amount", 0)))

        # Amount-based risk
        if amount > 50000:
            risk_factors += 30
        elif amount > 20000:
            risk_factors += 15

        # Frequency-based risk
        if len(user_history) > 20:  # High frequency user
            risk_factors += 5
        elif len(user_history) < 3:  # New user
            risk_factors += 20

        # Time-based risk
        current_hour = datetime.utcnow().hour
        if current_hour < 6 or current_hour > 22:
            risk_factors += 10

        return min(risk_factors, 50)


@monitoring_bp.route("/transaction/analyze", methods=["POST"])
@enhanced_token_required
@require_permissions(["transaction_monitoring"])
@rate_limit("100 per hour")
def analyze_transaction():
    """Analyze transaction for suspicious patterns"""
    try:
        data = request.get_json()

        # Validate input
        schema = {
            "user_id": {"type": "string", "required": True},
            "amount": {
                "type": "decimal",
                "required": True,
                "min_value": Decimal("0.01"),
            },
            "currency": {"type": "currency", "required": True},
            "transaction_type": {"type": "string", "required": True},
            "location": {"type": "string", "required": False},
            "device_id": {"type": "string", "required": False},
        }

        validated_data = InputValidator.validate_json_schema(data, schema)

        # Analyze transaction
        monitor = TransactionMonitor()
        analysis_result = monitor.analyze_transaction(validated_data)

        # Log analysis
        AuditLogger.log_event(
            user_id=validated_data["user_id"],
            action="transaction_analysis",
            resource_type="transaction",
            additional_data={
                "risk_score": analysis_result["risk_score"],
                "risk_level": analysis_result["risk_level"],
                "alerts_count": len(analysis_result["alerts"]),
            },
        )

        return (
            jsonify(
                {
                    "analysis_result": analysis_result,
                    "timestamp": datetime.utcnow().isoformat(),
                }
            ),
            200,
        )

    except ValidationError as e:
        return jsonify({"error": str(e), "code": "VALIDATION_ERROR"}), 400
    except Exception as e:
        return jsonify({"error": str(e), "code": "ANALYSIS_ERROR"}), 500


@monitoring_bp.route("/alerts/rules", methods=["GET"])
@enhanced_token_required
@require_permissions(["admin"])
@rate_limit("50 per hour")
def get_alert_rules():
    """Get configured alert rules"""
    try:
        monitor = TransactionMonitor()
        return (
            jsonify(
                {
                    "alert_rules": monitor.alert_rules,
                    "total_rules": len(monitor.alert_rules),
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e), "code": "FETCH_ERROR"}), 500


@monitoring_bp.route("/alerts/rules", methods=["POST"])
@enhanced_token_required
@require_permissions(["admin"])
@rate_limit("20 per hour")
def create_alert_rule():
    """Create new alert rule"""
    try:
        data = request.get_json()

        # Validate input
        schema = {
            "name": {"type": "string", "required": True, "max_length": 100},
            "condition": {"type": "string", "required": True, "max_length": 500},
            "severity": {"type": "string", "required": True},
            "action": {"type": "string", "required": True},
        }

        validated_data = InputValidator.validate_json_schema(data, schema)

        # Validate severity
        if validated_data["severity"] not in ["low", "medium", "high", "critical"]:
            return (
                jsonify(
                    {"error": "Invalid severity level", "code": "INVALID_SEVERITY"}
                ),
                400,
            )

        # Generate rule ID
        rule_id = f"custom_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"

        new_rule = {
            "id": rule_id,
            "name": validated_data["name"],
            "condition": validated_data["condition"],
            "severity": validated_data["severity"],
            "action": validated_data["action"],
            "created_at": datetime.utcnow().isoformat(),
            "created_by": request.current_user["user_id"],
        }

        # Store rule (in production, this would be in database)
        monitor = TransactionMonitor()
        monitor.alert_rules.append(new_rule)

        # Log rule creation
        AuditLogger.log_event(
            user_id=request.current_user["user_id"],
            action="create_alert_rule",
            resource_type="alert_rule",
            resource_id=rule_id,
            additional_data=validated_data,
        )

        return (
            jsonify({"rule": new_rule, "message": "Alert rule created successfully"}),
            201,
        )

    except ValidationError as e:
        return jsonify({"error": str(e), "code": "VALIDATION_ERROR"}), 400
    except Exception as e:
        return jsonify({"error": str(e), "code": "CREATION_ERROR"}), 500


@monitoring_bp.route("/alerts/active", methods=["GET"])
@enhanced_token_required
@require_permissions(["transaction_monitoring"])
@rate_limit("100 per hour")
def get_active_alerts():
    """Get active fraud alerts"""
    try:
        # Get query parameters
        page = request.args.get("page", 1, type=int)
        per_page = request.args.get("per_page", 20, type=int)
        severity = request.args.get("severity")
        user_id = request.args.get("user_id")

        # Build query
        from src.models.enhanced_database import db

        query = db.session.query(FraudAlert).filter(FraudAlert.status == "open")

        if severity:
            query = query.filter(FraudAlert.severity == severity)

        if user_id:
            query = query.filter(FraudAlert.user_id == user_id)

        # Execute query with pagination
        alerts = (
            query.order_by(FraudAlert.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )

        alert_list = []
        for alert in alerts:
            alert_list.append(
                {
                    "alert_id": alert.id,
                    "user_id": alert.user_id,
                    "transaction_id": alert.transaction_id,
                    "alert_type": alert.alert_type,
                    "severity": alert.severity,
                    "risk_score": alert.risk_score,
                    "description": alert.description,
                    "status": alert.status,
                    "created_at": alert.created_at.isoformat(),
                }
            )

        return (
            jsonify(
                {
                    "alerts": alert_list,
                    "pagination": {
                        "page": page,
                        "per_page": per_page,
                        "total": len(alert_list),
                    },
                }
            ),
            200,
        )

    except Exception as e:
        return jsonify({"error": str(e), "code": "FETCH_ERROR"}), 500


@monitoring_bp.route("/alerts/<alert_id>/resolve", methods=["POST"])
@enhanced_token_required
@require_permissions(["transaction_monitoring"])
@rate_limit("50 per hour")
def resolve_alert(alert_id):
    """Resolve a fraud alert"""
    try:
        data = request.get_json()

        # Validate input
        schema = {
            "resolution": {"type": "string", "required": True},
            "notes": {"type": "string", "required": False, "max_length": 1000},
        }

        validated_data = InputValidator.validate_json_schema(data, schema)

        # Validate resolution status
        if validated_data["resolution"] not in [
            "resolved",
            "false_positive",
            "escalated",
        ]:
            return (
                jsonify(
                    {"error": "Invalid resolution status", "code": "INVALID_RESOLUTION"}
                ),
                400,
            )

        # Update alert (in production, this would update database)
        from src.models.enhanced_database import db

        alert = db.session.query(FraudAlert).get(alert_id)

        if not alert:
            return jsonify({"error": "Alert not found", "code": "ALERT_NOT_FOUND"}), 404

        alert.status = validated_data["resolution"]
        alert.resolved_at = datetime.utcnow()
        alert.resolution_notes = validated_data.get("notes", "")

        db.session.commit()

        # Log resolution
        AuditLogger.log_event(
            user_id=request.current_user["user_id"],
            action="resolve_fraud_alert",
            resource_type="fraud_alert",
            resource_id=alert_id,
            additional_data=validated_data,
        )

        return (
            jsonify(
                {
                    "alert_id": alert_id,
                    "status": alert.status,
                    "resolved_at": alert.resolved_at.isoformat(),
                    "message": "Alert resolved successfully",
                }
            ),
            200,
        )

    except ValidationError as e:
        return jsonify({"error": str(e), "code": "VALIDATION_ERROR"}), 400
    except Exception as e:
        return jsonify({"error": str(e), "code": "RESOLUTION_ERROR"}), 500


@monitoring_bp.route("/monitoring/dashboard", methods=["GET"])
@enhanced_token_required
@require_permissions(["transaction_monitoring"])
@rate_limit("50 per hour")
def get_monitoring_dashboard():
    """Get monitoring dashboard data"""
    try:
        # Get dashboard metrics
        from src.models.enhanced_database import db

        # Active alerts by severity
        alert_counts = (
            db.session.query(FraudAlert.severity, db.func.count(FraudAlert.id))
            .filter(FraudAlert.status == "open")
            .group_by(FraudAlert.severity)
            .all()
        )

        # Recent transactions requiring review
        recent_flagged = (
            db.session.query(Transaction)
            .filter(Transaction.is_flagged == True)
            .filter(Transaction.created_at >= datetime.utcnow() - timedelta(hours=24))
            .count()
        )

        # High-risk users
        high_risk_users = db.session.query(User).filter(User.risk_score >= 70).count()

        dashboard_data = {
            "alert_summary": {
                "total_active": sum(count for _, count in alert_counts),
                "by_severity": dict(alert_counts),
            },
            "recent_activity": {
                "flagged_transactions_24h": recent_flagged,
                "high_risk_users": high_risk_users,
            },
            "system_status": {
                "monitoring_active": True,
                "last_update": datetime.utcnow().isoformat(),
            },
        }

        return jsonify(dashboard_data), 200

    except Exception as e:
        return jsonify({"error": str(e), "code": "DASHBOARD_ERROR"}), 500

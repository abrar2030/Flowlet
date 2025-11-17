# Advanced Compliance and Regulatory Reporting
import json
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

import requests
from flask import Blueprint, jsonify, request
from sqlalchemy import and_, func, or_
from src.models.enhanced_database import (FraudAlert, KYCRecord, Transaction,
                                          User)
from src.security.audit_logger import AuditLogger
from src.security.input_validator import InputValidator, ValidationError
from src.security.rate_limiter import rate_limit
from src.security.token_manager import (enhanced_token_required,
                                        require_permissions)

compliance_bp = Blueprint("compliance", __name__)


class ComplianceManager:
    """Advanced compliance and regulatory reporting system"""

    def __init__(self):
        self.ofac_api_url = "https://api.treasury.gov/v1/sanctions"  # Example
        self.watchlist_sources = [
            "OFAC_SDN",
            "UN_SANCTIONS",
            "EU_SANCTIONS",
            "PEP_LIST",
        ]

    def generate_sar_report(
        self, user_id: str, suspicious_activity: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate Suspicious Activity Report (SAR)"""
        from src.models.enhanced_database import db

        # Get user information
        user = db.session.query(User).get(user_id)
        if not user:
            raise ValueError("User not found")

        # Get related transactions
        transactions = (
            db.session.query(Transaction)
            .filter(Transaction.wallet_id.in_([w.id for w in user.wallets]))
            .filter(Transaction.created_at >= datetime.utcnow() - timedelta(days=30))
            .all()
        )

        # Calculate suspicious activity metrics
        total_amount = sum(t.amount for t in transactions)
        transaction_count = len(transactions)

        sar_data = {
            "report_id": f"SAR_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}",
            "report_date": datetime.utcnow().isoformat(),
            "subject_information": {
                "user_id": user.id,
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "kyc_status": user.kyc_status,
                "risk_score": user.risk_score,
            },
            "suspicious_activity": {
                "description": suspicious_activity.get("description", ""),
                "activity_type": suspicious_activity.get("type", ""),
                "date_range": {
                    "start": (datetime.utcnow() - timedelta(days=30)).isoformat(),
                    "end": datetime.utcnow().isoformat(),
                },
                "total_amount": str(total_amount),
                "transaction_count": transaction_count,
            },
            "transactions": [
                {
                    "transaction_id": t.id,
                    "amount": str(t.amount),
                    "currency": t.currency,
                    "type": t.transaction_type,
                    "date": t.created_at.isoformat(),
                    "status": t.status,
                }
                for t in transactions
            ],
            "filing_institution": {
                "name": "Flowlet Financial Services",
                "ein": "12-3456789",
                "address": "123 Financial District, New York, NY 10001",
            },
        }

        return sar_data

    def generate_ctr_report(self, transactions: List[Transaction]) -> Dict[str, Any]:
        """Generate Currency Transaction Report (CTR) for transactions over $10,000"""
        if not transactions:
            return {}

        # Group transactions by user
        user_transactions = {}
        for transaction in transactions:
            user_id = transaction.wallet.user_id
            if user_id not in user_transactions:
                user_transactions[user_id] = []
            user_transactions[user_id].append(transaction)

        ctr_reports = []

        for user_id, user_txns in user_transactions.items():
            total_amount = sum(t.amount for t in user_txns)

            if total_amount >= 10000:  # CTR threshold
                from src.models.enhanced_database import db

                user = db.session.query(User).get(user_id)

                ctr_data = {
                    "report_id": f"CTR_{user_id}_{datetime.utcnow().strftime('%Y%m%d')}",
                    "report_date": datetime.utcnow().isoformat(),
                    "customer_information": {
                        "user_id": user.id,
                        "name": f"{user.first_name} {user.last_name}",
                        "email": user.email,
                        "phone": user.phone,
                        "address": user.address_encrypted,  # Would be decrypted in real implementation
                    },
                    "transaction_summary": {
                        "total_amount": str(total_amount),
                        "transaction_count": len(user_txns),
                        "date_range": {
                            "start": min(t.created_at for t in user_txns).isoformat(),
                            "end": max(t.created_at for t in user_txns).isoformat(),
                        },
                    },
                    "transactions": [
                        {
                            "transaction_id": t.id,
                            "amount": str(t.amount),
                            "currency": t.currency,
                            "type": t.transaction_type,
                            "date": t.created_at.isoformat(),
                        }
                        for t in user_txns
                    ],
                }

                ctr_reports.append(ctr_data)

        return {
            "ctr_reports": ctr_reports,
            "total_reports": len(ctr_reports),
            "generated_at": datetime.utcnow().isoformat(),
        }

    def screen_against_watchlists(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Screen user against various watchlists"""
        screening_results = {
            "user_id": user_data.get("user_id"),
            "screening_date": datetime.utcnow().isoformat(),
            "sources_checked": self.watchlist_sources,
            "matches": [],
            "overall_status": "clear",
        }

        name = f"{user_data.get('first_name', '')} {user_data.get('last_name', '')}".strip()

        # Screen against each watchlist source
        for source in self.watchlist_sources:
            matches = self._screen_against_source(source, name, user_data)
            if matches:
                screening_results["matches"].extend(matches)

        # Determine overall status
        if screening_results["matches"]:
            high_confidence_matches = [
                m for m in screening_results["matches"] if m["confidence"] >= 80
            ]
            if high_confidence_matches:
                screening_results["overall_status"] = "blocked"
            else:
                screening_results["overall_status"] = "review_required"

        return screening_results

    def _screen_against_source(
        self, source: str, name: str, user_data: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Screen against a specific watchlist source"""
        # Simplified screening logic (in production, this would call actual APIs)

        # Simulate some matches for demonstration
        high_risk_names = ["John Doe", "Jane Smith", "Test User"]

        matches = []

        if name in high_risk_names:
            matches.append(
                {
                    "source": source,
                    "matched_name": name,
                    "confidence": 85,
                    "match_type": "exact_name",
                    "list_entry": {
                        "name": name,
                        "aliases": [],
                        "date_of_birth": user_data.get("date_of_birth"),
                        "nationality": "Unknown",
                    },
                }
            )

        # Check for partial matches
        for risk_name in high_risk_names:
            if risk_name.lower() in name.lower() and risk_name != name:
                matches.append(
                    {
                        "source": source,
                        "matched_name": risk_name,
                        "confidence": 60,
                        "match_type": "partial_name",
                        "list_entry": {
                            "name": risk_name,
                            "aliases": [],
                            "date_of_birth": None,
                            "nationality": "Unknown",
                        },
                    }
                )

        return matches

    def analyze_transaction_patterns(
        self, user_id: str, days: int = 90
    ) -> Dict[str, Any]:
        """Analyze transaction patterns for compliance purposes"""
        from src.models.enhanced_database import db

        # Get user transactions
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        transactions = (
            db.session.query(Transaction)
            .join(Transaction.wallet)
            .filter(Wallet.user_id == user_id)
            .filter(Transaction.created_at >= start_date)
            .all()
        )

        if not transactions:
            return {"patterns": [], "risk_indicators": []}

        # Analyze patterns
        patterns = []
        risk_indicators = []

        # 1. Structuring analysis (amounts just below reporting thresholds)
        structuring_transactions = [t for t in transactions if 9000 <= t.amount <= 9999]

        if len(structuring_transactions) >= 3:
            patterns.append(
                {
                    "type": "potential_structuring",
                    "description": "Multiple transactions just below $10,000 threshold",
                    "transaction_count": len(structuring_transactions),
                    "total_amount": str(
                        sum(t.amount for t in structuring_transactions)
                    ),
                    "risk_level": "high",
                }
            )
            risk_indicators.append("structuring")

        # 2. Round amount analysis
        round_amounts = [
            t for t in transactions if t.amount % 1000 == 0 and t.amount >= 5000
        ]

        if len(round_amounts) >= 5:
            patterns.append(
                {
                    "type": "round_amount_pattern",
                    "description": "Frequent use of round amounts",
                    "transaction_count": len(round_amounts),
                    "risk_level": "medium",
                }
            )
            risk_indicators.append("round_amounts")

        # 3. Rapid succession analysis
        rapid_transactions = []
        for i in range(1, len(transactions)):
            time_diff = (
                transactions[i].created_at - transactions[i - 1].created_at
            ).total_seconds()
            if time_diff < 300:  # 5 minutes
                rapid_transactions.append(transactions[i])

        if len(rapid_transactions) >= 3:
            patterns.append(
                {
                    "type": "rapid_succession",
                    "description": "Multiple transactions in rapid succession",
                    "transaction_count": len(rapid_transactions),
                    "risk_level": "medium",
                }
            )
            risk_indicators.append("rapid_succession")

        # 4. Unusual timing analysis
        night_transactions = [
            t for t in transactions if t.created_at.hour < 6 or t.created_at.hour > 22
        ]

        if (
            len(night_transactions) > len(transactions) * 0.3
        ):  # More than 30% at unusual times
            patterns.append(
                {
                    "type": "unusual_timing",
                    "description": "High percentage of transactions at unusual times",
                    "transaction_count": len(night_transactions),
                    "percentage": round(
                        (len(night_transactions) / len(transactions)) * 100, 2
                    ),
                    "risk_level": "low",
                }
            )
            risk_indicators.append("unusual_timing")

        return {
            "analysis_period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days": days,
            },
            "transaction_summary": {
                "total_transactions": len(transactions),
                "total_amount": str(sum(t.amount for t in transactions)),
                "average_amount": str(
                    sum(t.amount for t in transactions) / len(transactions)
                ),
            },
            "patterns": patterns,
            "risk_indicators": risk_indicators,
            "overall_risk_level": self._calculate_pattern_risk_level(patterns),
        }

    def _calculate_pattern_risk_level(self, patterns: List[Dict[str, Any]]) -> str:
        """Calculate overall risk level based on detected patterns"""
        if not patterns:
            return "low"

        high_risk_count = len([p for p in patterns if p.get("risk_level") == "high"])
        medium_risk_count = len(
            [p for p in patterns if p.get("risk_level") == "medium"]
        )

        if high_risk_count >= 2:
            return "critical"
        elif high_risk_count >= 1:
            return "high"
        elif medium_risk_count >= 2:
            return "medium"
        else:
            return "low"


@compliance_bp.route("/screening/watchlist", methods=["POST"])
@enhanced_token_required
@require_permissions(["compliance"])
@rate_limit("50 per hour")
def screen_watchlist():
    """Screen user against watchlists"""
    try:
        data = request.get_json()

        # Validate input
        schema = {
            "user_id": {"type": "string", "required": True},
            "first_name": {"type": "string", "required": True},
            "last_name": {"type": "string", "required": True},
            "date_of_birth": {"type": "string", "required": False},
        }

        validated_data = InputValidator.validate_json_schema(data, schema)

        # Perform screening
        compliance_manager = ComplianceManager()
        screening_result = compliance_manager.screen_against_watchlists(validated_data)

        # Log screening
        AuditLogger.log_event(
            user_id=validated_data["user_id"],
            action="watchlist_screening",
            resource_type="compliance",
            additional_data={
                "sources_checked": screening_result["sources_checked"],
                "matches_found": len(screening_result["matches"]),
                "overall_status": screening_result["overall_status"],
            },
        )

        return jsonify(screening_result), 200

    except ValidationError as e:
        return jsonify({"error": str(e), "code": "VALIDATION_ERROR"}), 400
    except Exception as e:
        return jsonify({"error": str(e), "code": "SCREENING_ERROR"}), 500


@compliance_bp.route("/reports/sar", methods=["POST"])
@enhanced_token_required
@require_permissions(["compliance"])
@rate_limit("10 per hour")
def generate_sar():
    """Generate Suspicious Activity Report"""
    try:
        data = request.get_json()

        # Validate input
        schema = {
            "user_id": {"type": "string", "required": True},
            "suspicious_activity": {
                "type": "object",
                "required": True,
                "properties": {
                    "description": {"type": "string", "required": True},
                    "type": {"type": "string", "required": True},
                },
            },
        }

        # Custom validation for nested object
        if "suspicious_activity" not in data:
            raise ValidationError("suspicious_activity", "Field is required")

        activity = data["suspicious_activity"]
        if not isinstance(activity, dict):
            raise ValidationError("suspicious_activity", "Must be an object")

        if "description" not in activity or not activity["description"]:
            raise ValidationError(
                "suspicious_activity.description", "Field is required"
            )

        if "type" not in activity or not activity["type"]:
            raise ValidationError("suspicious_activity.type", "Field is required")

        # Generate SAR
        compliance_manager = ComplianceManager()
        sar_report = compliance_manager.generate_sar_report(data["user_id"], activity)

        # Log SAR generation
        AuditLogger.log_event(
            user_id=data["user_id"],
            action="generate_sar",
            resource_type="compliance_report",
            resource_id=sar_report["report_id"],
            additional_data={
                "activity_type": activity["type"],
                "transaction_count": sar_report["suspicious_activity"][
                    "transaction_count"
                ],
            },
        )

        return (
            jsonify(
                {
                    "sar_report": sar_report,
                    "message": "SAR report generated successfully",
                }
            ),
            201,
        )

    except ValidationError as e:
        return jsonify({"error": str(e), "code": "VALIDATION_ERROR"}), 400
    except Exception as e:
        return jsonify({"error": str(e), "code": "SAR_GENERATION_ERROR"}), 500


@compliance_bp.route("/reports/ctr", methods=["POST"])
@enhanced_token_required
@require_permissions(["compliance"])
@rate_limit("20 per hour")
def generate_ctr():
    """Generate Currency Transaction Report"""
    try:
        data = request.get_json()

        # Validate input
        schema = {
            "date_range": {
                "type": "object",
                "required": True,
                "properties": {
                    "start_date": {"type": "string", "required": True},
                    "end_date": {"type": "string", "required": True},
                },
            }
        }

        # Custom validation for date range
        if "date_range" not in data:
            raise ValidationError("date_range", "Field is required")

        date_range = data["date_range"]
        start_date = InputValidator.validate_date(
            date_range.get("start_date"), "start_date"
        )
        end_date = InputValidator.validate_date(date_range.get("end_date"), "end_date")

        if start_date >= end_date:
            raise ValidationError("date_range", "Start date must be before end date")

        # Get transactions in date range over $10,000
        from src.models.enhanced_database import db

        transactions = (
            db.session.query(Transaction)
            .filter(Transaction.created_at >= start_date)
            .filter(Transaction.created_at <= end_date)
            .filter(Transaction.amount >= 10000)
            .filter(Transaction.status == "completed")
            .all()
        )

        # Generate CTR
        compliance_manager = ComplianceManager()
        ctr_report = compliance_manager.generate_ctr_report(transactions)

        # Log CTR generation
        AuditLogger.log_event(
            user_id=request.current_user["user_id"],
            action="generate_ctr",
            resource_type="compliance_report",
            additional_data={
                "date_range": date_range,
                "reports_generated": ctr_report.get("total_reports", 0),
            },
        )

        return jsonify(ctr_report), 200

    except ValidationError as e:
        return jsonify({"error": str(e), "code": "VALIDATION_ERROR"}), 400
    except Exception as e:
        return jsonify({"error": str(e), "code": "CTR_GENERATION_ERROR"}), 500


@compliance_bp.route("/analysis/patterns/<user_id>", methods=["GET"])
@enhanced_token_required
@require_permissions(["compliance"])
@rate_limit("100 per hour")
def analyze_patterns(user_id):
    """Analyze transaction patterns for compliance"""
    try:
        # Get query parameters
        days = request.args.get("days", 90, type=int)

        if days < 1 or days > 365:
            return (
                jsonify(
                    {"error": "Days must be between 1 and 365", "code": "INVALID_RANGE"}
                ),
                400,
            )

        # Analyze patterns
        compliance_manager = ComplianceManager()
        analysis_result = compliance_manager.analyze_transaction_patterns(user_id, days)

        # Log analysis
        AuditLogger.log_event(
            user_id=user_id,
            action="analyze_transaction_patterns",
            resource_type="compliance_analysis",
            additional_data={
                "analysis_days": days,
                "patterns_found": len(analysis_result["patterns"]),
                "risk_level": analysis_result["overall_risk_level"],
            },
        )

        return jsonify(analysis_result), 200

    except Exception as e:
        return jsonify({"error": str(e), "code": "ANALYSIS_ERROR"}), 500


@compliance_bp.route("/compliance/dashboard", methods=["GET"])
@enhanced_token_required
@require_permissions(["compliance"])
@rate_limit("50 per hour")
def get_compliance_dashboard():
    """Get compliance dashboard data"""
    try:
        from src.models.enhanced_database import db

        # Get compliance metrics
        today = datetime.utcnow().date()
        week_ago = today - timedelta(days=7)
        month_ago = today - timedelta(days=30)

        # Pending KYC verifications
        pending_kyc = (
            db.session.query(KYCRecord)
            .filter(KYCRecord.verification_status == "pending")
            .count()
        )

        # High-risk users
        high_risk_users = db.session.query(User).filter(User.risk_score >= 70).count()

        # Recent large transactions (>$10k)
        large_transactions = (
            db.session.query(Transaction)
            .filter(Transaction.amount >= 10000)
            .filter(
                Transaction.created_at
                >= datetime.combine(week_ago, datetime.min.time())
            )
            .count()
        )

        # Open fraud alerts
        open_alerts = (
            db.session.query(FraudAlert).filter(FraudAlert.status == "open").count()
        )

        dashboard_data = {
            "compliance_metrics": {
                "pending_kyc_verifications": pending_kyc,
                "high_risk_users": high_risk_users,
                "large_transactions_week": large_transactions,
                "open_fraud_alerts": open_alerts,
            },
            "regulatory_status": {
                "sar_reports_pending": 0,  # Would be calculated from actual data
                "ctr_reports_pending": 0,
                "last_regulatory_update": datetime.utcnow().isoformat(),
            },
            "system_status": {
                "watchlist_last_updated": datetime.utcnow().isoformat(),
                "screening_active": True,
                "monitoring_active": True,
            },
        }

        return jsonify(dashboard_data), 200

    except Exception as e:
        return jsonify({"error": str(e), "code": "DASHBOARD_ERROR"}), 500

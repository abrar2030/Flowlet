"""
AI-Powered Risk Assessment and Predictive Analytics System
"""

import hashlib
import json
import logging
import math
import statistics
from collections import defaultdict, deque
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple

import numpy as np

logger = logging.getLogger(__name__)


class RiskCategory(Enum):
    """Risk assessment categories"""

    CREDIT_RISK = "credit_risk"
    FRAUD_RISK = "fraud_risk"
    LIQUIDITY_RISK = "liquidity_risk"
    OPERATIONAL_RISK = "operational_risk"
    MARKET_RISK = "market_risk"
    COMPLIANCE_RISK = "compliance_risk"


class RiskLevel(Enum):
    """Risk levels"""

    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"
    CRITICAL = "critical"


@dataclass
class RiskFactor:
    """Individual risk factor"""

    factor_name: str
    category: RiskCategory
    weight: float
    score: float
    description: str
    impact: str
    mitigation_suggestions: List[str]


@dataclass
class RiskAssessment:
    """Comprehensive risk assessment"""

    user_id: str
    assessment_id: str
    timestamp: datetime
    overall_risk_score: float
    overall_risk_level: RiskLevel
    risk_factors: List[RiskFactor]
    category_scores: Dict[str, float]
    predictions: Dict[str, Any]
    recommendations: List[str]
    monitoring_alerts: List[str]
    confidence_score: float


@dataclass
class PredictiveInsight:
    """AI-generated predictive insight"""

    insight_type: str
    prediction: str
    confidence: float
    time_horizon: str
    supporting_data: Dict[str, Any]
    recommended_actions: List[str]


class AIRiskAssessor:
    """AI-powered risk assessment system"""

    def __init__(self):
        # Risk factor weights by category
        self.risk_weights = {
            RiskCategory.CREDIT_RISK: {
                "payment_history": 0.35,
                "credit_utilization": 0.30,
                "account_age": 0.15,
                "income_stability": 0.20,
            },
            RiskCategory.FRAUD_RISK: {
                "transaction_patterns": 0.25,
                "device_consistency": 0.20,
                "location_patterns": 0.20,
                "velocity_patterns": 0.20,
                "behavioral_anomalies": 0.15,
            },
            RiskCategory.LIQUIDITY_RISK: {
                "cash_flow_patterns": 0.40,
                "account_balances": 0.30,
                "spending_volatility": 0.30,
            },
            RiskCategory.OPERATIONAL_RISK: {
                "system_usage_patterns": 0.30,
                "error_rates": 0.25,
                "security_incidents": 0.25,
                "compliance_violations": 0.20,
            },
        }

        # Historical data for ML models
        self.user_histories = {}
        self.market_data = {}
        self.fraud_patterns = {}

        # Risk thresholds
        self.risk_thresholds = {
            RiskLevel.VERY_LOW: 0.2,
            RiskLevel.LOW: 0.4,
            RiskLevel.MEDIUM: 0.6,
            RiskLevel.HIGH: 0.8,
            RiskLevel.VERY_HIGH: 0.9,
            RiskLevel.CRITICAL: 1.0,
        }

    def assess_user_risk(
        self, user_id: str, assessment_context: Dict[str, Any] = None
    ) -> RiskAssessment:
        """Perform comprehensive AI-powered risk assessment for a user"""
        assessment_context = assessment_context or {}

        # Collect user data
        user_data = self._collect_user_data(user_id)

        # Assess each risk category
        risk_factors = []
        category_scores = {}

        # Credit Risk Assessment
        credit_factors = self._assess_credit_risk(user_data)
        risk_factors.extend(credit_factors)
        category_scores[RiskCategory.CREDIT_RISK.value] = (
            self._calculate_category_score(credit_factors)
        )

        # Fraud Risk Assessment
        fraud_factors = self._assess_fraud_risk(user_data)
        risk_factors.extend(fraud_factors)
        category_scores[RiskCategory.FRAUD_RISK.value] = self._calculate_category_score(
            fraud_factors
        )

        # Liquidity Risk Assessment
        liquidity_factors = self._assess_liquidity_risk(user_data)
        risk_factors.extend(liquidity_factors)
        category_scores[RiskCategory.LIQUIDITY_RISK.value] = (
            self._calculate_category_score(liquidity_factors)
        )

        # Operational Risk Assessment
        operational_factors = self._assess_operational_risk(user_data)
        risk_factors.extend(operational_factors)
        category_scores[RiskCategory.OPERATIONAL_RISK.value] = (
            self._calculate_category_score(operational_factors)
        )

        # Calculate overall risk score
        overall_risk_score = self._calculate_overall_risk_score(category_scores)
        overall_risk_level = self._determine_risk_level(overall_risk_score)

        # Generate predictions
        predictions = self._generate_predictions(user_data, risk_factors)

        # Generate recommendations
        recommendations = self._generate_risk_recommendations(
            risk_factors, overall_risk_level
        )

        # Generate monitoring alerts
        monitoring_alerts = self._generate_monitoring_alerts(risk_factors, predictions)

        # Calculate confidence score
        confidence_score = self._calculate_confidence_score(user_data, risk_factors)

        assessment = RiskAssessment(
            user_id=user_id,
            assessment_id=self._generate_assessment_id(user_id),
            timestamp=datetime.now(timezone.utc),
            overall_risk_score=overall_risk_score,
            overall_risk_level=overall_risk_level,
            risk_factors=risk_factors,
            category_scores=category_scores,
            predictions=predictions,
            recommendations=recommendations,
            monitoring_alerts=monitoring_alerts,
            confidence_score=confidence_score,
        )

        # Store assessment for future reference
        self._store_assessment(assessment)

        return assessment

    def _collect_user_data(self, user_id: str) -> Dict[str, Any]:
        """Collect comprehensive user data for risk assessment"""
        # In a real implementation, this would query various data sources
        user_data = {
            "user_id": user_id,
            "account_age_days": 365,  # Placeholder
            "transaction_history": self._get_transaction_history(user_id),
            "account_balances": self._get_account_balances(user_id),
            "payment_history": self._get_payment_history(user_id),
            "kyc_status": "verified",
            "device_history": self._get_device_history(user_id),
            "location_history": self._get_location_history(user_id),
            "security_incidents": self._get_security_incidents(user_id),
            "compliance_records": self._get_compliance_records(user_id),
        }
        return user_data

    def _assess_credit_risk(self, user_data: Dict[str, Any]) -> List[RiskFactor]:
        """Assess credit-related risk factors"""
        factors = []

        # Payment History Analysis
        payment_history = user_data.get("payment_history", [])
        late_payments = sum(1 for p in payment_history if p.get("status") == "late")
        total_payments = len(payment_history)

        if total_payments > 0:
            late_payment_ratio = late_payments / total_payments
            payment_score = max(
                0, 1 - (late_payment_ratio * 2)
            )  # Penalize late payments
        else:
            payment_score = 0.5  # Neutral score for no history

        factors.append(
            RiskFactor(
                factor_name="payment_history",
                category=RiskCategory.CREDIT_RISK,
                weight=self.risk_weights[RiskCategory.CREDIT_RISK]["payment_history"],
                score=payment_score,
                description=f"Payment history shows {late_payment_ratio:.1%} late payments",
                impact=(
                    "High"
                    if payment_score < 0.5
                    else "Medium" if payment_score < 0.8 else "Low"
                ),
                mitigation_suggestions=(
                    [
                        "Set up automatic payments to avoid late fees",
                        "Monitor payment due dates closely",
                        "Maintain sufficient account balances",
                    ]
                    if payment_score < 0.7
                    else []
                ),
            )
        )

        # Credit Utilization Analysis
        account_balances = user_data.get("account_balances", {})
        total_balance = sum(
            Decimal(str(balance)) for balance in account_balances.values()
        )

        # Simulate credit limit (in real implementation, get from credit data)
        estimated_credit_limit = Decimal("10000")
        utilization_ratio = (
            float(total_balance / estimated_credit_limit)
            if estimated_credit_limit > 0
            else 0
        )

        utilization_score = max(
            0, 1 - (utilization_ratio * 1.5)
        )  # Penalize high utilization

        factors.append(
            RiskFactor(
                factor_name="credit_utilization",
                category=RiskCategory.CREDIT_RISK,
                weight=self.risk_weights[RiskCategory.CREDIT_RISK][
                    "credit_utilization"
                ],
                score=utilization_score,
                description=f"Credit utilization ratio: {utilization_ratio:.1%}",
                impact=(
                    "High"
                    if utilization_ratio > 0.7
                    else "Medium" if utilization_ratio > 0.3 else "Low"
                ),
                mitigation_suggestions=(
                    [
                        "Pay down existing balances",
                        "Request credit limit increases",
                        "Spread balances across multiple accounts",
                    ]
                    if utilization_ratio > 0.5
                    else []
                ),
            )
        )

        # Account Age Analysis
        account_age_days = user_data.get("account_age_days", 0)
        age_score = min(1.0, account_age_days / 365)  # Full score after 1 year

        factors.append(
            RiskFactor(
                factor_name="account_age",
                category=RiskCategory.CREDIT_RISK,
                weight=self.risk_weights[RiskCategory.CREDIT_RISK]["account_age"],
                score=age_score,
                description=f"Account age: {account_age_days} days",
                impact="Medium" if account_age_days < 180 else "Low",
                mitigation_suggestions=(
                    [
                        "Build longer credit history over time",
                        "Keep older accounts active",
                    ]
                    if account_age_days < 365
                    else []
                ),
            )
        )

        return factors

    def _assess_fraud_risk(self, user_data: Dict[str, Any]) -> List[RiskFactor]:
        """Assess fraud-related risk factors"""
        factors = []

        # Transaction Pattern Analysis
        transactions = user_data.get("transaction_history", [])
        pattern_score = self._analyze_transaction_patterns(transactions)

        factors.append(
            RiskFactor(
                factor_name="transaction_patterns",
                category=RiskCategory.FRAUD_RISK,
                weight=self.risk_weights[RiskCategory.FRAUD_RISK][
                    "transaction_patterns"
                ],
                score=pattern_score,
                description="Analysis of transaction timing, amounts, and frequency patterns",
                impact=(
                    "High"
                    if pattern_score < 0.3
                    else "Medium" if pattern_score < 0.7 else "Low"
                ),
                mitigation_suggestions=(
                    [
                        "Monitor for unusual transaction patterns",
                        "Implement transaction velocity limits",
                        "Require additional authentication for large transactions",
                    ]
                    if pattern_score < 0.5
                    else []
                ),
            )
        )

        # Device Consistency Analysis
        device_history = user_data.get("device_history", [])
        device_score = self._analyze_device_consistency(device_history)

        factors.append(
            RiskFactor(
                factor_name="device_consistency",
                category=RiskCategory.FRAUD_RISK,
                weight=self.risk_weights[RiskCategory.FRAUD_RISK]["device_consistency"],
                score=device_score,
                description="Analysis of device usage patterns and consistency",
                impact=(
                    "High"
                    if device_score < 0.3
                    else "Medium" if device_score < 0.7 else "Low"
                ),
                mitigation_suggestions=(
                    [
                        "Enable device registration and verification",
                        "Monitor for new device logins",
                        "Implement device fingerprinting",
                    ]
                    if device_score < 0.5
                    else []
                ),
            )
        )

        # Location Pattern Analysis
        location_history = user_data.get("location_history", [])
        location_score = self._analyze_location_patterns(location_history)

        factors.append(
            RiskFactor(
                factor_name="location_patterns",
                category=RiskCategory.FRAUD_RISK,
                weight=self.risk_weights[RiskCategory.FRAUD_RISK]["location_patterns"],
                score=location_score,
                description="Analysis of geographic usage patterns",
                impact=(
                    "High"
                    if location_score < 0.3
                    else "Medium" if location_score < 0.7 else "Low"
                ),
                mitigation_suggestions=(
                    [
                        "Implement geolocation verification",
                        "Monitor for impossible travel scenarios",
                        "Flag transactions from high-risk locations",
                    ]
                    if location_score < 0.5
                    else []
                ),
            )
        )

        return factors

    def _assess_liquidity_risk(self, user_data: Dict[str, Any]) -> List[RiskFactor]:
        """Assess liquidity-related risk factors"""
        factors = []

        # Cash Flow Analysis
        transactions = user_data.get("transaction_history", [])
        cash_flow_score = self._analyze_cash_flow_patterns(transactions)

        factors.append(
            RiskFactor(
                factor_name="cash_flow_patterns",
                category=RiskCategory.LIQUIDITY_RISK,
                weight=self.risk_weights[RiskCategory.LIQUIDITY_RISK][
                    "cash_flow_patterns"
                ],
                score=cash_flow_score,
                description="Analysis of income vs. expenditure patterns",
                impact=(
                    "High"
                    if cash_flow_score < 0.3
                    else "Medium" if cash_flow_score < 0.7 else "Low"
                ),
                mitigation_suggestions=(
                    [
                        "Improve income stability",
                        "Reduce unnecessary expenses",
                        "Build emergency fund reserves",
                    ]
                    if cash_flow_score < 0.5
                    else []
                ),
            )
        )

        # Account Balance Analysis
        account_balances = user_data.get("account_balances", {})
        balance_score = self._analyze_account_balances(account_balances)

        factors.append(
            RiskFactor(
                factor_name="account_balances",
                category=RiskCategory.LIQUIDITY_RISK,
                weight=self.risk_weights[RiskCategory.LIQUIDITY_RISK][
                    "account_balances"
                ],
                score=balance_score,
                description="Analysis of account balance levels and trends",
                impact=(
                    "High"
                    if balance_score < 0.3
                    else "Medium" if balance_score < 0.7 else "Low"
                ),
                mitigation_suggestions=(
                    [
                        "Maintain higher account balances",
                        "Set up overdraft protection",
                        "Monitor balance levels regularly",
                    ]
                    if balance_score < 0.5
                    else []
                ),
            )
        )

        return factors

    def _assess_operational_risk(self, user_data: Dict[str, Any]) -> List[RiskFactor]:
        """Assess operational risk factors"""
        factors = []

        # Security Incidents Analysis
        security_incidents = user_data.get("security_incidents", [])
        security_score = max(0, 1 - (len(security_incidents) * 0.2))

        factors.append(
            RiskFactor(
                factor_name="security_incidents",
                category=RiskCategory.OPERATIONAL_RISK,
                weight=self.risk_weights[RiskCategory.OPERATIONAL_RISK][
                    "security_incidents"
                ],
                score=security_score,
                description=f"Number of security incidents: {len(security_incidents)}",
                impact=(
                    "High"
                    if len(security_incidents) > 3
                    else "Medium" if len(security_incidents) > 1 else "Low"
                ),
                mitigation_suggestions=(
                    [
                        "Enhance security awareness training",
                        "Implement stronger authentication",
                        "Regular security audits",
                    ]
                    if len(security_incidents) > 0
                    else []
                ),
            )
        )

        # Compliance Records Analysis
        compliance_records = user_data.get("compliance_records", [])
        violations = [r for r in compliance_records if r.get("status") == "violation"]
        compliance_score = max(0, 1 - (len(violations) * 0.3))

        factors.append(
            RiskFactor(
                factor_name="compliance_violations",
                category=RiskCategory.OPERATIONAL_RISK,
                weight=self.risk_weights[RiskCategory.OPERATIONAL_RISK][
                    "compliance_violations"
                ],
                score=compliance_score,
                description=f"Number of compliance violations: {len(violations)}",
                impact=(
                    "High"
                    if len(violations) > 2
                    else "Medium" if len(violations) > 0 else "Low"
                ),
                mitigation_suggestions=(
                    [
                        "Enhance compliance monitoring",
                        "Provide compliance training",
                        "Regular compliance audits",
                    ]
                    if len(violations) > 0
                    else []
                ),
            )
        )

        return factors

    def _analyze_transaction_patterns(self, transactions: List[Dict]) -> float:
        """Analyze transaction patterns for fraud indicators"""
        if not transactions:
            return 0.5

        # Analyze timing patterns
        timestamps = [datetime.fromisoformat(t["timestamp"]) for t in transactions]
        hours = [ts.hour for ts in timestamps]

        # Check for unusual timing (e.g., many transactions at odd hours)
        odd_hour_count = sum(1 for hour in hours if hour < 6 or hour > 23)
        odd_hour_ratio = odd_hour_count / len(hours)

        # Analyze amount patterns
        amounts = [float(t["amount"]) for t in transactions]

        # Check for round amounts (potential testing)
        round_amounts = sum(1 for amount in amounts if amount % 10 == 0)
        round_ratio = round_amounts / len(amounts)

        # Check for amount clustering
        amount_variance = statistics.variance(amounts) if len(amounts) > 1 else 0
        amount_mean = statistics.mean(amounts)
        cv = math.sqrt(amount_variance) / amount_mean if amount_mean > 0 else 0

        # Calculate pattern score (higher = less suspicious)
        pattern_score = 1.0
        pattern_score -= odd_hour_ratio * 0.3  # Penalize odd hours
        pattern_score -= round_ratio * 0.2  # Penalize round amounts
        pattern_score -= min(cv, 1.0) * 0.2  # Penalize high variance

        return max(0, pattern_score)

    def _analyze_device_consistency(self, device_history: List[Dict]) -> float:
        """Analyze device usage consistency"""
        if not device_history:
            return 0.5

        # Count unique devices
        unique_devices = len(set(d["device_id"] for d in device_history))

        # Calculate device consistency score
        if unique_devices == 1:
            return 1.0  # Perfect consistency
        elif unique_devices <= 3:
            return 0.8  # Good consistency
        elif unique_devices <= 5:
            return 0.6  # Moderate consistency
        else:
            return 0.3  # Poor consistency

    def _analyze_location_patterns(self, location_history: List[Dict]) -> float:
        """Analyze location usage patterns"""
        if not location_history:
            return 0.5

        # Count unique countries
        unique_countries = len(set(l["country"] for l in location_history))

        # Check for impossible travel
        sorted_locations = sorted(location_history, key=lambda x: x["timestamp"])
        impossible_travel_count = 0

        for i in range(1, len(sorted_locations)):
            prev_loc = sorted_locations[i - 1]
            curr_loc = sorted_locations[i]

            if prev_loc["country"] != curr_loc["country"]:
                time_diff = (
                    datetime.fromisoformat(curr_loc["timestamp"])
                    - datetime.fromisoformat(prev_loc["timestamp"])
                ).total_seconds() / 3600

                if time_diff < 2:  # Less than 2 hours between countries
                    impossible_travel_count += 1

        # Calculate location score
        location_score = 1.0
        location_score -= min(unique_countries / 10, 0.5)  # Penalize many countries
        location_score -= impossible_travel_count * 0.3  # Penalize impossible travel

        return max(0, location_score)

    def _analyze_cash_flow_patterns(self, transactions: List[Dict]) -> float:
        """Analyze cash flow patterns for liquidity risk"""
        if not transactions:
            return 0.5

        # Separate income and expenses
        income_transactions = [t for t in transactions if float(t["amount"]) > 0]
        expense_transactions = [t for t in transactions if float(t["amount"]) < 0]

        total_income = sum(float(t["amount"]) for t in income_transactions)
        total_expenses = abs(sum(float(t["amount"]) for t in expense_transactions))

        # Calculate cash flow ratio
        if total_income == 0:
            return 0.1  # Very poor if no income

        cash_flow_ratio = (total_income - total_expenses) / total_income

        # Convert to score (0-1)
        if cash_flow_ratio > 0.3:
            return 1.0  # Excellent cash flow
        elif cash_flow_ratio > 0.1:
            return 0.8  # Good cash flow
        elif cash_flow_ratio > 0:
            return 0.6  # Marginal cash flow
        elif cash_flow_ratio > -0.1:
            return 0.4  # Poor cash flow
        else:
            return 0.1  # Very poor cash flow

    def _analyze_account_balances(self, account_balances: Dict[str, Any]) -> float:
        """Analyze account balance levels"""
        if not account_balances:
            return 0.3

        total_balance = sum(
            Decimal(str(balance)) for balance in account_balances.values()
        )

        # Score based on balance levels
        if total_balance > Decimal("10000"):
            return 1.0
        elif total_balance > Decimal("5000"):
            return 0.8
        elif total_balance > Decimal("1000"):
            return 0.6
        elif total_balance > Decimal("100"):
            return 0.4
        else:
            return 0.2

    def _calculate_category_score(self, factors: List[RiskFactor]) -> float:
        """Calculate weighted score for a risk category"""
        if not factors:
            return 0.5

        weighted_sum = sum(factor.score * factor.weight for factor in factors)
        total_weight = sum(factor.weight for factor in factors)

        return weighted_sum / total_weight if total_weight > 0 else 0.5

    def _calculate_overall_risk_score(self, category_scores: Dict[str, float]) -> float:
        """Calculate overall risk score from category scores"""
        # Category weights for overall score
        category_weights = {
            RiskCategory.CREDIT_RISK.value: 0.30,
            RiskCategory.FRAUD_RISK.value: 0.25,
            RiskCategory.LIQUIDITY_RISK.value: 0.25,
            RiskCategory.OPERATIONAL_RISK.value: 0.20,
        }

        weighted_sum = 0
        total_weight = 0

        for category, score in category_scores.items():
            weight = category_weights.get(category, 0.1)
            weighted_sum += score * weight
            total_weight += weight

        # Convert to risk score (higher score = higher risk)
        risk_score = 1 - (weighted_sum / total_weight) if total_weight > 0 else 0.5

        return min(max(risk_score, 0), 1)

    def _determine_risk_level(self, risk_score: float) -> RiskLevel:
        """Determine risk level from risk score"""
        for level, threshold in sorted(
            self.risk_thresholds.items(), key=lambda x: x[1]
        ):
            if risk_score <= threshold:
                return level
        return RiskLevel.CRITICAL

    def _generate_predictions(
        self, user_data: Dict[str, Any], risk_factors: List[RiskFactor]
    ) -> Dict[str, Any]:
        """Generate AI predictions based on risk assessment"""
        predictions = {}

        # Predict default probability
        credit_factors = [
            f for f in risk_factors if f.category == RiskCategory.CREDIT_RISK
        ]
        credit_score = self._calculate_category_score(credit_factors)
        default_probability = max(0, 1 - credit_score)

        predictions["default_probability"] = {
            "probability": round(default_probability, 3),
            "confidence": 0.75,
            "time_horizon": "12_months",
        }

        # Predict fraud likelihood
        fraud_factors = [
            f for f in risk_factors if f.category == RiskCategory.FRAUD_RISK
        ]
        fraud_score = self._calculate_category_score(fraud_factors)
        fraud_probability = max(0, 1 - fraud_score)

        predictions["fraud_likelihood"] = {
            "probability": round(fraud_probability, 3),
            "confidence": 0.80,
            "time_horizon": "30_days",
        }

        # Predict liquidity stress
        liquidity_factors = [
            f for f in risk_factors if f.category == RiskCategory.LIQUIDITY_RISK
        ]
        liquidity_score = self._calculate_category_score(liquidity_factors)
        liquidity_stress_probability = max(0, 1 - liquidity_score)

        predictions["liquidity_stress"] = {
            "probability": round(liquidity_stress_probability, 3),
            "confidence": 0.70,
            "time_horizon": "90_days",
        }

        return predictions

    def _generate_risk_recommendations(
        self, risk_factors: List[RiskFactor], overall_risk_level: RiskLevel
    ) -> List[str]:
        """Generate risk mitigation recommendations"""
        recommendations = []

        # Overall risk level recommendations
        if overall_risk_level in [
            RiskLevel.HIGH,
            RiskLevel.VERY_HIGH,
            RiskLevel.CRITICAL,
        ]:
            recommendations.append("Immediate risk review and mitigation required")
            recommendations.append(
                "Consider reducing credit limits or transaction limits"
            )
            recommendations.append("Implement enhanced monitoring and controls")

        # Factor-specific recommendations
        high_risk_factors = [f for f in risk_factors if f.score < 0.5]
        for factor in high_risk_factors:
            recommendations.extend(factor.mitigation_suggestions)

        # Remove duplicates while preserving order
        seen = set()
        unique_recommendations = []
        for rec in recommendations:
            if rec not in seen:
                seen.add(rec)
                unique_recommendations.append(rec)

        return unique_recommendations

    def _generate_monitoring_alerts(
        self, risk_factors: List[RiskFactor], predictions: Dict[str, Any]
    ) -> List[str]:
        """Generate monitoring alerts based on risk assessment"""
        alerts = []

        # High-risk factor alerts
        critical_factors = [f for f in risk_factors if f.score < 0.3]
        for factor in critical_factors:
            alerts.append(
                f"Critical risk detected in {factor.factor_name}: {factor.description}"
            )

        # Prediction-based alerts
        if predictions.get("fraud_likelihood", {}).get("probability", 0) > 0.7:
            alerts.append(
                "High fraud probability detected - implement additional verification"
            )

        if predictions.get("default_probability", {}).get("probability", 0) > 0.5:
            alerts.append("High default risk detected - review credit exposure")

        if predictions.get("liquidity_stress", {}).get("probability", 0) > 0.6:
            alerts.append("Liquidity stress risk detected - monitor cash flow closely")

        return alerts

    def _calculate_confidence_score(
        self, user_data: Dict[str, Any], risk_factors: List[RiskFactor]
    ) -> float:
        """Calculate confidence score for the risk assessment"""
        # Base confidence on data availability and quality
        data_completeness = 0

        # Check data availability
        if user_data.get("transaction_history"):
            data_completeness += 0.3
        if user_data.get("payment_history"):
            data_completeness += 0.2
        if user_data.get("account_balances"):
            data_completeness += 0.2
        if user_data.get("device_history"):
            data_completeness += 0.15
        if user_data.get("location_history"):
            data_completeness += 0.15

        # Adjust for account age (more history = higher confidence)
        account_age_days = user_data.get("account_age_days", 0)
        age_factor = min(1.0, account_age_days / 365)

        confidence = data_completeness * age_factor
        return round(confidence, 2)

    def _generate_assessment_id(self, user_id: str) -> str:
        """Generate unique assessment ID"""
        timestamp = datetime.now(timezone.utc).isoformat()
        data = f"{user_id}_{timestamp}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]

    def _store_assessment(self, assessment: RiskAssessment):
        """Store risk assessment for future reference"""
        # In production, store in database
        if assessment.user_id not in self.user_histories:
            self.user_histories[assessment.user_id] = []

        self.user_histories[assessment.user_id].append(
            {
                "assessment_id": assessment.assessment_id,
                "timestamp": assessment.timestamp.isoformat(),
                "overall_risk_score": assessment.overall_risk_score,
                "overall_risk_level": assessment.overall_risk_level.value,
                "category_scores": assessment.category_scores,
            }
        )

        # Keep only last 50 assessments per user
        if len(self.user_histories[assessment.user_id]) > 50:
            self.user_histories[assessment.user_id] = self.user_histories[
                assessment.user_id
            ][-50:]

    # Helper methods for data collection (placeholders for real implementation)
    def _get_transaction_history(self, user_id: str) -> List[Dict]:
        """Get user transaction history"""
        # Placeholder - in real implementation, query transaction database
        return []

    def _get_account_balances(self, user_id: str) -> Dict[str, Any]:
        """Get user account balances"""
        # Placeholder - in real implementation, query account database
        return {}

    def _get_payment_history(self, user_id: str) -> List[Dict]:
        """Get user payment history"""
        # Placeholder - in real implementation, query payment database
        return []

    def _get_device_history(self, user_id: str) -> List[Dict]:
        """Get user device history"""
        # Placeholder - in real implementation, query device tracking database
        return []

    def _get_location_history(self, user_id: str) -> List[Dict]:
        """Get user location history"""
        # Placeholder - in real implementation, query location tracking database
        return []

    def _get_security_incidents(self, user_id: str) -> List[Dict]:
        """Get user security incidents"""
        # Placeholder - in real implementation, query security incident database
        return []

    def _get_compliance_records(self, user_id: str) -> List[Dict]:
        """Get user compliance records"""
        # Placeholder - in real implementation, query compliance database
        return []

    def generate_risk_report(self, user_id: str) -> Dict[str, Any]:
        """Generate comprehensive risk report for a user"""
        assessment = self.assess_user_risk(user_id)

        # Get historical assessments
        historical_assessments = self.user_histories.get(user_id, [])

        # Calculate risk trends
        risk_trend = self._calculate_risk_trend(historical_assessments)

        report = {
            "user_id": user_id,
            "report_date": datetime.now(timezone.utc).isoformat(),
            "current_assessment": {
                "overall_risk_score": assessment.overall_risk_score,
                "overall_risk_level": assessment.overall_risk_level.value,
                "category_scores": assessment.category_scores,
                "confidence_score": assessment.confidence_score,
            },
            "risk_factors": [
                {
                    "factor_name": f.factor_name,
                    "category": f.category.value,
                    "score": f.score,
                    "weight": f.weight,
                    "impact": f.impact,
                    "description": f.description,
                }
                for f in assessment.risk_factors
            ],
            "predictions": assessment.predictions,
            "recommendations": assessment.recommendations,
            "monitoring_alerts": assessment.monitoring_alerts,
            "risk_trend": risk_trend,
            "historical_assessments_count": len(historical_assessments),
        }

        return report

    def _calculate_risk_trend(self, historical_assessments: List[Dict]) -> str:
        """Calculate risk trend from historical assessments"""
        if len(historical_assessments) < 2:
            return "insufficient_data"

        # Get last 5 assessments
        recent_assessments = historical_assessments[-5:]
        scores = [a["overall_risk_score"] for a in recent_assessments]

        # Calculate trend
        if len(scores) >= 3:
            first_half = statistics.mean(scores[: len(scores) // 2])
            second_half = statistics.mean(scores[len(scores) // 2 :])

            change_ratio = (
                (second_half - first_half) / first_half if first_half > 0 else 0
            )

            if change_ratio > 0.1:
                return "increasing"
            elif change_ratio < -0.1:
                return "decreasing"
            else:
                return "stable"

        return "stable"


# Global AI risk assessor instance
ai_risk_assessor = AIRiskAssessor()

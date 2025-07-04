"""
Fraud Detection Engine
=====================

Advanced fraud detection and prevention system for financial transactions.
Uses machine learning, rule-based detection, and behavioral analysis.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union, Tuple
from dataclasses import dataclass
from enum import Enum
import json
import numpy as np
from collections import defaultdict, deque
import hashlib
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func


class FraudRiskLevel(Enum):
    """Fraud risk levels."""
    VERY_LOW = "very_low"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FraudType(Enum):
    """Types of fraud patterns."""
    ACCOUNT_TAKEOVER = "account_takeover"
    IDENTITY_THEFT = "identity_theft"
    PAYMENT_FRAUD = "payment_fraud"
    MONEY_LAUNDERING = "money_laundering"
    SYNTHETIC_IDENTITY = "synthetic_identity"
    CARD_FRAUD = "card_fraud"
    WIRE_FRAUD = "wire_fraud"
    CHECK_FRAUD = "check_fraud"
    PHISHING = "phishing"
    SOCIAL_ENGINEERING = "social_engineering"


class ActionType(Enum):
    """Actions to take based on fraud detection."""
    ALLOW = "allow"
    REVIEW = "review"
    CHALLENGE = "challenge"
    BLOCK = "block"
    ESCALATE = "escalate"


@dataclass
class FraudSignal:
    """Individual fraud detection signal."""
    signal_id: str
    signal_type: str
    fraud_type: FraudType
    risk_score: float
    confidence: float
    description: str
    evidence: Dict[str, Any]
    timestamp: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'signal_id': self.signal_id,
            'signal_type': self.signal_type,
            'fraud_type': self.fraud_type.value,
            'risk_score': self.risk_score,
            'confidence': self.confidence,
            'description': self.description,
            'evidence': self.evidence,
            'timestamp': self.timestamp.isoformat()
        }


@dataclass
class FraudAssessment:
    """Comprehensive fraud assessment result."""
    assessment_id: str
    entity_id: str
    entity_type: str
    overall_risk_score: float
    risk_level: FraudRiskLevel
    recommended_action: ActionType
    fraud_signals: List[FraudSignal]
    behavioral_analysis: Dict[str, Any]
    device_analysis: Dict[str, Any]
    network_analysis: Dict[str, Any]
    assessment_timestamp: datetime
    expires_at: datetime
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'assessment_id': self.assessment_id,
            'entity_id': self.entity_id,
            'entity_type': self.entity_type,
            'overall_risk_score': self.overall_risk_score,
            'risk_level': self.risk_level.value,
            'recommended_action': self.recommended_action.value,
            'fraud_signals': [signal.to_dict() for signal in self.fraud_signals],
            'behavioral_analysis': self.behavioral_analysis,
            'device_analysis': self.device_analysis,
            'network_analysis': self.network_analysis,
            'assessment_timestamp': self.assessment_timestamp.isoformat(),
            'expires_at': self.expires_at.isoformat()
        }


class BehavioralProfile:
    """User behavioral profile for anomaly detection."""
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.transaction_patterns = defaultdict(list)
        self.login_patterns = defaultdict(list)
        self.device_patterns = defaultdict(list)
        self.location_patterns = defaultdict(list)
        self.time_patterns = defaultdict(list)
        self.last_updated = datetime.utcnow()
    
    def update_transaction_pattern(self, amount: float, merchant: str, 
                                 category: str, timestamp: datetime):
        """Update transaction behavioral patterns."""
        
        hour = timestamp.hour
        day_of_week = timestamp.weekday()
        
        self.transaction_patterns['amounts'].append(amount)
        self.transaction_patterns['merchants'].append(merchant)
        self.transaction_patterns['categories'].append(category)
        self.transaction_patterns['hours'].append(hour)
        self.transaction_patterns['days'].append(day_of_week)
        
        # Keep only recent patterns (last 90 days)
        cutoff = datetime.utcnow() - timedelta(days=90)
        self._cleanup_old_patterns(cutoff)
        
        self.last_updated = datetime.utcnow()
    
    def update_login_pattern(self, ip_address: str, user_agent: str,
                           location: str, timestamp: datetime):
        """Update login behavioral patterns."""
        
        hour = timestamp.hour
        day_of_week = timestamp.weekday()
        
        self.login_patterns['ip_addresses'].append(ip_address)
        self.login_patterns['user_agents'].append(user_agent)
        self.login_patterns['locations'].append(location)
        self.login_patterns['hours'].append(hour)
        self.login_patterns['days'].append(day_of_week)
        
        self.last_updated = datetime.utcnow()
    
    def _cleanup_old_patterns(self, cutoff: datetime):
        """Remove patterns older than cutoff date."""
        # Implementation would remove old entries based on timestamps
        pass
    
    def get_transaction_anomaly_score(self, amount: float, merchant: str,
                                    category: str, timestamp: datetime) -> float:
        """Calculate anomaly score for a transaction."""
        
        anomaly_score = 0.0
        
        # Amount anomaly
        if self.transaction_patterns['amounts']:
            amounts = self.transaction_patterns['amounts']
            mean_amount = np.mean(amounts)
            std_amount = np.std(amounts)
            
            if std_amount > 0:
                z_score = abs(amount - mean_amount) / std_amount
                if z_score > 3:  # 3 standard deviations
                    anomaly_score += 0.4
                elif z_score > 2:
                    anomaly_score += 0.2
        
        # Merchant anomaly
        if merchant not in self.transaction_patterns['merchants']:
            anomaly_score += 0.2
        
        # Category anomaly
        if category not in self.transaction_patterns['categories']:
            anomaly_score += 0.1
        
        # Time anomaly
        hour = timestamp.hour
        typical_hours = self.transaction_patterns['hours']
        if typical_hours and hour not in typical_hours:
            anomaly_score += 0.2
        
        # Day of week anomaly
        day_of_week = timestamp.weekday()
        typical_days = self.transaction_patterns['days']
        if typical_days and day_of_week not in typical_days:
            anomaly_score += 0.1
        
        return min(anomaly_score, 1.0)


class FraudDetectionEngine:
    """
    Advanced fraud detection engine for financial applications.
    
    Features:
    - Real-time transaction monitoring
    - Behavioral analysis and anomaly detection
    - Device fingerprinting and analysis
    - Network and geolocation analysis
    - Machine learning-based risk scoring
    - Rule-based fraud detection
    - Velocity checks and pattern recognition
    - Account takeover detection
    - Identity verification
    """
    
    def __init__(self, db_session: Session, config: Dict[str, Any] = None):
        self.db = db_session
        self.config = config or {}
        self.logger = logging.getLogger(__name__)
        
        # Fraud detection components
        self._behavioral_profiles = {}
        self._fraud_rules = {}
        self._ml_models = {}
        self._blacklists = {}
        self._whitelists = {}
        self._velocity_trackers = {}
        
        # Risk thresholds
        self._risk_thresholds = {
            FraudRiskLevel.VERY_LOW: 0.1,
            FraudRiskLevel.LOW: 0.3,
            FraudRiskLevel.MEDIUM: 0.5,
            FraudRiskLevel.HIGH: 0.7,
            FraudRiskLevel.CRITICAL: 0.9
        }
        
        # Action thresholds
        self._action_thresholds = {
            ActionType.ALLOW: 0.3,
            ActionType.REVIEW: 0.5,
            ActionType.CHALLENGE: 0.7,
            ActionType.BLOCK: 0.9
        }
        
        # Initialize fraud detection engine
        self._initialize_fraud_engine()
    
    def _initialize_fraud_engine(self):
        """Initialize the fraud detection engine."""
        
        # Load fraud detection rules
        self._load_fraud_rules()
        
        # Initialize ML models
        self._initialize_ml_models()
        
        # Load blacklists and whitelists
        self._load_security_lists()
        
        # Initialize velocity trackers
        self._initialize_velocity_trackers()
        
        self.logger.info("Fraud detection engine initialized successfully")
    
    def _load_fraud_rules(self):
        """Load fraud detection rules."""
        
        # Transaction amount rules
        self._fraud_rules['transaction_amount'] = {
            'large_transaction_threshold': 10000,
            'unusual_amount_multiplier': 5,  # 5x normal amount
            'round_amount_threshold': 1000
        }
        
        # Velocity rules
        self._fraud_rules['velocity'] = {
            'max_transactions_per_hour': 10,
            'max_transactions_per_day': 50,
            'max_amount_per_hour': 50000,
            'max_amount_per_day': 100000,
            'max_failed_attempts': 3
        }
        
        # Geographic rules
        self._fraud_rules['geographic'] = {
            'high_risk_countries': ['XX', 'YY', 'ZZ'],
            'impossible_travel_speed_kmh': 1000,  # km/h
            'suspicious_location_change_hours': 1
        }
        
        # Device rules
        self._fraud_rules['device'] = {
            'max_devices_per_user': 5,
            'new_device_risk_period_hours': 24,
            'suspicious_user_agent_patterns': ['bot', 'crawler', 'automated']
        }
        
        # Account rules
        self._fraud_rules['account'] = {
            'new_account_risk_period_days': 30,
            'dormant_account_reactivation_days': 90,
            'password_change_risk_period_hours': 24
        }
    
    def _initialize_ml_models(self):
        """Initialize machine learning models for fraud detection."""
        
        # Mock ML models - in practice, these would be trained models
        self._ml_models = {
            'transaction_risk_model': {
                'model_type': 'gradient_boosting',
                'version': '2.1',
                'features': [
                    'amount', 'merchant_category', 'time_of_day', 'day_of_week',
                    'user_age_days', 'transaction_count_24h', 'amount_sum_24h',
                    'device_risk_score', 'location_risk_score'
                ],
                'threshold': 0.7
            },
            'account_takeover_model': {
                'model_type': 'neural_network',
                'version': '1.5',
                'features': [
                    'login_time_anomaly', 'device_fingerprint_change',
                    'location_change', 'behavior_anomaly_score',
                    'failed_login_attempts', 'password_change_recent'
                ],
                'threshold': 0.8
            },
            'identity_verification_model': {
                'model_type': 'ensemble',
                'version': '3.0',
                'features': [
                    'document_confidence', 'biometric_confidence',
                    'address_verification', 'phone_verification',
                    'email_verification', 'credit_check_result'
                ],
                'threshold': 0.75
            }
        }
    
    def _load_security_lists(self):
        """Load blacklists and whitelists."""
        
        # IP blacklists
        self._blacklists['ip_addresses'] = {
            '192.168.1.100',  # Mock malicious IPs
            '10.0.0.50',
            '172.16.0.25'
        }
        
        # Email blacklists
        self._blacklists['email_domains'] = {
            'tempmail.com',
            'guerrillamail.com',
            '10minutemail.com'
        }
        
        # Device blacklists
        self._blacklists['device_fingerprints'] = {
            'suspicious_device_1',
            'known_fraud_device_2'
        }
        
        # Merchant whitelists
        self._whitelists['trusted_merchants'] = {
            'amazon.com',
            'paypal.com',
            'stripe.com'
        }
        
        # IP whitelists
        self._whitelists['trusted_ip_ranges'] = {
            '192.168.1.0/24',  # Corporate network
            '10.0.0.0/8'       # Internal network
        }
    
    def _initialize_velocity_trackers(self):
        """Initialize velocity tracking systems."""
        
        self._velocity_trackers = {
            'transaction_count': defaultdict(lambda: deque()),
            'transaction_amount': defaultdict(lambda: deque()),
            'login_attempts': defaultdict(lambda: deque()),
            'failed_attempts': defaultdict(lambda: deque())
        }
    
    async def assess_transaction_fraud(self, transaction_data: Dict[str, Any]) -> FraudAssessment:
        """
        Perform comprehensive fraud assessment for a transaction.
        
        Args:
            transaction_data: Transaction information for assessment
            
        Returns:
            FraudAssessment containing fraud analysis results
        """
        
        assessment_id = str(uuid.uuid4())
        transaction_id = transaction_data.get('transaction_id', 'unknown')
        user_id = transaction_data.get('user_id', 'unknown')
        
        try:
            self.logger.info(f"Starting fraud assessment for transaction {transaction_id}")
            
            fraud_signals = []
            
            # Rule-based fraud detection
            rule_signals = await self._apply_fraud_rules(transaction_data)
            fraud_signals.extend(rule_signals)
            
            # Behavioral analysis
            behavioral_analysis = await self._analyze_transaction_behavior(transaction_data)
            if behavioral_analysis['anomaly_score'] > 0.5:
                fraud_signals.append(FraudSignal(
                    signal_id=f"behavioral_{int(datetime.utcnow().timestamp())}",
                    signal_type="behavioral_anomaly",
                    fraud_type=FraudType.ACCOUNT_TAKEOVER,
                    risk_score=behavioral_analysis['anomaly_score'],
                    confidence=0.8,
                    description="Unusual behavioral pattern detected",
                    evidence=behavioral_analysis,
                    timestamp=datetime.utcnow()
                ))
            
            # Device analysis
            device_analysis = await self._analyze_device_risk(transaction_data)
            if device_analysis['risk_score'] > 0.6:
                fraud_signals.append(FraudSignal(
                    signal_id=f"device_{int(datetime.utcnow().timestamp())}",
                    signal_type="device_risk",
                    fraud_type=FraudType.ACCOUNT_TAKEOVER,
                    risk_score=device_analysis['risk_score'],
                    confidence=0.7,
                    description="High-risk device detected",
                    evidence=device_analysis,
                    timestamp=datetime.utcnow()
                ))
            
            # Network analysis
            network_analysis = await self._analyze_network_risk(transaction_data)
            if network_analysis['risk_score'] > 0.5:
                fraud_signals.append(FraudSignal(
                    signal_id=f"network_{int(datetime.utcnow().timestamp())}",
                    signal_type="network_risk",
                    fraud_type=FraudType.PAYMENT_FRAUD,
                    risk_score=network_analysis['risk_score'],
                    confidence=0.6,
                    description="Suspicious network activity detected",
                    evidence=network_analysis,
                    timestamp=datetime.utcnow()
                ))
            
            # ML-based risk scoring
            ml_risk_score = await self._calculate_ml_risk_score(transaction_data)
            if ml_risk_score > 0.7:
                fraud_signals.append(FraudSignal(
                    signal_id=f"ml_model_{int(datetime.utcnow().timestamp())}",
                    signal_type="ml_prediction",
                    fraud_type=FraudType.PAYMENT_FRAUD,
                    risk_score=ml_risk_score,
                    confidence=0.9,
                    description="Machine learning model flagged high risk",
                    evidence={'ml_score': ml_risk_score},
                    timestamp=datetime.utcnow()
                ))
            
            # Calculate overall risk score
            overall_risk_score = self._calculate_overall_risk_score(fraud_signals)
            
            # Determine risk level
            risk_level = self._determine_risk_level(overall_risk_score)
            
            # Determine recommended action
            recommended_action = self._determine_recommended_action(overall_risk_score, fraud_signals)
            
            assessment = FraudAssessment(
                assessment_id=assessment_id,
                entity_id=transaction_id,
                entity_type="transaction",
                overall_risk_score=overall_risk_score,
                risk_level=risk_level,
                recommended_action=recommended_action,
                fraud_signals=fraud_signals,
                behavioral_analysis=behavioral_analysis,
                device_analysis=device_analysis,
                network_analysis=network_analysis,
                assessment_timestamp=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(hours=1)
            )
            
            # Update behavioral profile
            await self._update_behavioral_profile(user_id, transaction_data)
            
            # Update velocity trackers
            self._update_velocity_trackers(user_id, transaction_data)
            
            self.logger.info(f"Fraud assessment completed for transaction {transaction_id}: {risk_level.value}")
            return assessment
            
        except Exception as e:
            self.logger.error(f"Error in fraud assessment for transaction {transaction_id}: {str(e)}")
            
            return FraudAssessment(
                assessment_id=assessment_id,
                entity_id=transaction_id,
                entity_type="transaction",
                overall_risk_score=0.5,
                risk_level=FraudRiskLevel.MEDIUM,
                recommended_action=ActionType.REVIEW,
                fraud_signals=[FraudSignal(
                    signal_id=f"error_{int(datetime.utcnow().timestamp())}",
                    signal_type="assessment_error",
                    fraud_type=FraudType.PAYMENT_FRAUD,
                    risk_score=0.5,
                    confidence=0.1,
                    description=f"Error in fraud assessment: {str(e)}",
                    evidence={'error': str(e)},
                    timestamp=datetime.utcnow()
                )],
                behavioral_analysis={'error': str(e)},
                device_analysis={'error': str(e)},
                network_analysis={'error': str(e)},
                assessment_timestamp=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(hours=1)
            )
    
    async def assess_login_fraud(self, login_data: Dict[str, Any]) -> FraudAssessment:
        """
        Perform fraud assessment for a login attempt.
        
        Args:
            login_data: Login attempt information
            
        Returns:
            FraudAssessment containing fraud analysis results
        """
        
        assessment_id = str(uuid.uuid4())
        user_id = login_data.get('user_id', 'unknown')
        
        try:
            self.logger.info(f"Starting fraud assessment for login attempt by user {user_id}")
            
            fraud_signals = []
            
            # Check for account takeover indicators
            ato_signals = await self._detect_account_takeover(login_data)
            fraud_signals.extend(ato_signals)
            
            # Analyze login patterns
            login_analysis = await self._analyze_login_patterns(login_data)
            
            # Device analysis
            device_analysis = await self._analyze_device_risk(login_data)
            
            # Network analysis
            network_analysis = await self._analyze_network_risk(login_data)
            
            # Calculate overall risk score
            overall_risk_score = self._calculate_overall_risk_score(fraud_signals)
            
            # Determine risk level and action
            risk_level = self._determine_risk_level(overall_risk_score)
            recommended_action = self._determine_recommended_action(overall_risk_score, fraud_signals)
            
            assessment = FraudAssessment(
                assessment_id=assessment_id,
                entity_id=user_id,
                entity_type="login",
                overall_risk_score=overall_risk_score,
                risk_level=risk_level,
                recommended_action=recommended_action,
                fraud_signals=fraud_signals,
                behavioral_analysis=login_analysis,
                device_analysis=device_analysis,
                network_analysis=network_analysis,
                assessment_timestamp=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(minutes=30)
            )
            
            # Update behavioral profile
            await self._update_login_profile(user_id, login_data)
            
            self.logger.info(f"Login fraud assessment completed for user {user_id}: {risk_level.value}")
            return assessment
            
        except Exception as e:
            self.logger.error(f"Error in login fraud assessment for user {user_id}: {str(e)}")
            
            return FraudAssessment(
                assessment_id=assessment_id,
                entity_id=user_id,
                entity_type="login",
                overall_risk_score=0.5,
                risk_level=FraudRiskLevel.MEDIUM,
                recommended_action=ActionType.CHALLENGE,
                fraud_signals=[],
                behavioral_analysis={'error': str(e)},
                device_analysis={'error': str(e)},
                network_analysis={'error': str(e)},
                assessment_timestamp=datetime.utcnow(),
                expires_at=datetime.utcnow() + timedelta(minutes=30)
            )
    
    async def _apply_fraud_rules(self, transaction_data: Dict[str, Any]) -> List[FraudSignal]:
        """Apply rule-based fraud detection."""
        
        signals = []
        amount = transaction_data.get('amount', 0)
        user_id = transaction_data.get('user_id')
        merchant = transaction_data.get('merchant', '')
        
        # Large transaction rule
        large_threshold = self._fraud_rules['transaction_amount']['large_transaction_threshold']
        if amount > large_threshold:
            signals.append(FraudSignal(
                signal_id=f"large_tx_{int(datetime.utcnow().timestamp())}",
                signal_type="large_transaction",
                fraud_type=FraudType.PAYMENT_FRAUD,
                risk_score=min(amount / large_threshold * 0.3, 0.8),
                confidence=0.9,
                description=f"Large transaction amount: ${amount:,.2f}",
                evidence={'amount': amount, 'threshold': large_threshold},
                timestamp=datetime.utcnow()
            ))
        
        # Round amount rule
        round_threshold = self._fraud_rules['transaction_amount']['round_amount_threshold']
        if amount >= round_threshold and amount % round_threshold == 0:
            signals.append(FraudSignal(
                signal_id=f"round_amount_{int(datetime.utcnow().timestamp())}",
                signal_type="round_amount",
                fraud_type=FraudType.MONEY_LAUNDERING,
                risk_score=0.3,
                confidence=0.6,
                description=f"Round amount transaction: ${amount:,.2f}",
                evidence={'amount': amount},
                timestamp=datetime.utcnow()
            ))
        
        # Velocity checks
        if user_id:
            velocity_signals = await self._check_velocity_rules(user_id, transaction_data)
            signals.extend(velocity_signals)
        
        # Geographic checks
        country_code = transaction_data.get('country_code', '')
        high_risk_countries = self._fraud_rules['geographic']['high_risk_countries']
        if country_code in high_risk_countries:
            signals.append(FraudSignal(
                signal_id=f"high_risk_country_{int(datetime.utcnow().timestamp())}",
                signal_type="high_risk_geography",
                fraud_type=FraudType.PAYMENT_FRAUD,
                risk_score=0.6,
                confidence=0.8,
                description=f"Transaction from high-risk country: {country_code}",
                evidence={'country_code': country_code},
                timestamp=datetime.utcnow()
            ))
        
        return signals
    
    async def _check_velocity_rules(self, user_id: str, transaction_data: Dict[str, Any]) -> List[FraudSignal]:
        """Check velocity-based fraud rules."""
        
        signals = []
        amount = transaction_data.get('amount', 0)
        
        # Get recent transactions for velocity analysis
        recent_transactions = await self._get_recent_transactions(user_id, timedelta(hours=24))
        
        # Transaction count velocity
        tx_count_24h = len(recent_transactions)
        max_tx_per_day = self._fraud_rules['velocity']['max_transactions_per_day']
        
        if tx_count_24h > max_tx_per_day:
            signals.append(FraudSignal(
                signal_id=f"velocity_count_{int(datetime.utcnow().timestamp())}",
                signal_type="velocity_count",
                fraud_type=FraudType.PAYMENT_FRAUD,
                risk_score=min((tx_count_24h / max_tx_per_day) * 0.5, 0.9),
                confidence=0.8,
                description=f"High transaction velocity: {tx_count_24h} transactions in 24h",
                evidence={'transaction_count_24h': tx_count_24h, 'threshold': max_tx_per_day},
                timestamp=datetime.utcnow()
            ))
        
        # Amount velocity
        total_amount_24h = sum(tx.get('amount', 0) for tx in recent_transactions) + amount
        max_amount_per_day = self._fraud_rules['velocity']['max_amount_per_day']
        
        if total_amount_24h > max_amount_per_day:
            signals.append(FraudSignal(
                signal_id=f"velocity_amount_{int(datetime.utcnow().timestamp())}",
                signal_type="velocity_amount",
                fraud_type=FraudType.PAYMENT_FRAUD,
                risk_score=min((total_amount_24h / max_amount_per_day) * 0.4, 0.8),
                confidence=0.8,
                description=f"High amount velocity: ${total_amount_24h:,.2f} in 24h",
                evidence={'total_amount_24h': total_amount_24h, 'threshold': max_amount_per_day},
                timestamp=datetime.utcnow()
            ))
        
        return signals
    
    async def _analyze_transaction_behavior(self, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze transaction behavioral patterns."""
        
        user_id = transaction_data.get('user_id')
        amount = transaction_data.get('amount', 0)
        merchant = transaction_data.get('merchant', '')
        category = transaction_data.get('category', '')
        timestamp = datetime.utcnow()
        
        if user_id not in self._behavioral_profiles:
            self._behavioral_profiles[user_id] = BehavioralProfile(user_id)
        
        profile = self._behavioral_profiles[user_id]
        anomaly_score = profile.get_transaction_anomaly_score(amount, merchant, category, timestamp)
        
        return {
            'anomaly_score': anomaly_score,
            'user_id': user_id,
            'profile_age_days': (datetime.utcnow() - profile.last_updated).days,
            'transaction_count': len(profile.transaction_patterns['amounts']),
            'analysis_timestamp': datetime.utcnow().isoformat()
        }
    
    async def _analyze_device_risk(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze device-related fraud risks."""
        
        device_fingerprint = data.get('device_fingerprint', '')
        user_agent = data.get('user_agent', '')
        ip_address = data.get('ip_address', '')
        
        risk_score = 0.0
        risk_factors = []
        
        # Check device blacklist
        if device_fingerprint in self._blacklists['device_fingerprints']:
            risk_score += 0.8
            risk_factors.append('blacklisted_device')
        
        # Check IP blacklist
        if ip_address in self._blacklists['ip_addresses']:
            risk_score += 0.7
            risk_factors.append('blacklisted_ip')
        
        # Check for suspicious user agent patterns
        suspicious_patterns = self._fraud_rules['device']['suspicious_user_agent_patterns']
        for pattern in suspicious_patterns:
            if pattern.lower() in user_agent.lower():
                risk_score += 0.4
                risk_factors.append(f'suspicious_user_agent_{pattern}')
                break
        
        # New device check
        user_id = data.get('user_id')
        if user_id and self._is_new_device(user_id, device_fingerprint):
            risk_score += 0.3
            risk_factors.append('new_device')
        
        return {
            'risk_score': min(risk_score, 1.0),
            'risk_factors': risk_factors,
            'device_fingerprint': device_fingerprint,
            'user_agent': user_agent,
            'ip_address': ip_address,
            'analysis_timestamp': datetime.utcnow().isoformat()
        }
    
    async def _analyze_network_risk(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze network-related fraud risks."""
        
        ip_address = data.get('ip_address', '')
        location = data.get('location', {})
        
        risk_score = 0.0
        risk_factors = []
        
        # Check for VPN/Proxy usage
        if self._is_vpn_or_proxy(ip_address):
            risk_score += 0.4
            risk_factors.append('vpn_or_proxy')
        
        # Check for Tor usage
        if self._is_tor_exit_node(ip_address):
            risk_score += 0.8
            risk_factors.append('tor_exit_node')
        
        # Geographic risk analysis
        country_code = location.get('country_code', '')
        if country_code in self._fraud_rules['geographic']['high_risk_countries']:
            risk_score += 0.5
            risk_factors.append('high_risk_country')
        
        # Impossible travel detection
        user_id = data.get('user_id')
        if user_id:
            impossible_travel = await self._detect_impossible_travel(user_id, location)
            if impossible_travel:
                risk_score += 0.7
                risk_factors.append('impossible_travel')
        
        return {
            'risk_score': min(risk_score, 1.0),
            'risk_factors': risk_factors,
            'ip_address': ip_address,
            'location': location,
            'analysis_timestamp': datetime.utcnow().isoformat()
        }
    
    async def _calculate_ml_risk_score(self, data: Dict[str, Any]) -> float:
        """Calculate ML-based risk score."""
        
        # Mock ML model prediction
        # In practice, this would use trained ML models
        
        features = {
            'amount': data.get('amount', 0),
            'merchant_category': hash(data.get('category', '')) % 100,
            'time_of_day': datetime.utcnow().hour,
            'day_of_week': datetime.utcnow().weekday(),
            'user_age_days': 30,  # Mock user age
            'transaction_count_24h': 5,  # Mock transaction count
            'amount_sum_24h': 1000,  # Mock amount sum
            'device_risk_score': 0.2,  # Mock device risk
            'location_risk_score': 0.1  # Mock location risk
        }
        
        # Simple mock scoring
        risk_score = 0.0
        
        # Amount-based risk
        if features['amount'] > 10000:
            risk_score += 0.3
        elif features['amount'] > 5000:
            risk_score += 0.2
        
        # Time-based risk
        if features['time_of_day'] < 6 or features['time_of_day'] > 22:
            risk_score += 0.1
        
        # Velocity-based risk
        if features['transaction_count_24h'] > 10:
            risk_score += 0.2
        
        # Device and location risk
        risk_score += features['device_risk_score'] * 0.3
        risk_score += features['location_risk_score'] * 0.2
        
        return min(risk_score, 1.0)
    
    def _calculate_overall_risk_score(self, fraud_signals: List[FraudSignal]) -> float:
        """Calculate overall risk score from fraud signals."""
        
        if not fraud_signals:
            return 0.0
        
        # Weighted average of signal risk scores
        total_weighted_score = 0.0
        total_weight = 0.0
        
        for signal in fraud_signals:
            weight = signal.confidence
            total_weighted_score += signal.risk_score * weight
            total_weight += weight
        
        if total_weight == 0:
            return 0.0
        
        base_score = total_weighted_score / total_weight
        
        # Apply signal count multiplier
        signal_multiplier = min(1.0 + (len(fraud_signals) - 1) * 0.1, 1.5)
        
        return min(base_score * signal_multiplier, 1.0)
    
    def _determine_risk_level(self, risk_score: float) -> FraudRiskLevel:
        """Determine risk level based on risk score."""
        
        if risk_score >= self._risk_thresholds[FraudRiskLevel.CRITICAL]:
            return FraudRiskLevel.CRITICAL
        elif risk_score >= self._risk_thresholds[FraudRiskLevel.HIGH]:
            return FraudRiskLevel.HIGH
        elif risk_score >= self._risk_thresholds[FraudRiskLevel.MEDIUM]:
            return FraudRiskLevel.MEDIUM
        elif risk_score >= self._risk_thresholds[FraudRiskLevel.LOW]:
            return FraudRiskLevel.LOW
        else:
            return FraudRiskLevel.VERY_LOW
    
    def _determine_recommended_action(self, risk_score: float, 
                                    fraud_signals: List[FraudSignal]) -> ActionType:
        """Determine recommended action based on risk assessment."""
        
        # Check for critical fraud types
        critical_fraud_types = {FraudType.ACCOUNT_TAKEOVER, FraudType.IDENTITY_THEFT}
        has_critical_fraud = any(signal.fraud_type in critical_fraud_types for signal in fraud_signals)
        
        if has_critical_fraud and risk_score >= 0.8:
            return ActionType.BLOCK
        elif risk_score >= self._action_thresholds[ActionType.BLOCK]:
            return ActionType.BLOCK
        elif risk_score >= self._action_thresholds[ActionType.CHALLENGE]:
            return ActionType.CHALLENGE
        elif risk_score >= self._action_thresholds[ActionType.REVIEW]:
            return ActionType.REVIEW
        else:
            return ActionType.ALLOW
    
    async def _detect_account_takeover(self, login_data: Dict[str, Any]) -> List[FraudSignal]:
        """Detect account takeover indicators."""
        
        signals = []
        user_id = login_data.get('user_id')
        
        # Device change detection
        device_fingerprint = login_data.get('device_fingerprint', '')
        if user_id and self._is_new_device(user_id, device_fingerprint):
            signals.append(FraudSignal(
                signal_id=f"ato_device_{int(datetime.utcnow().timestamp())}",
                signal_type="account_takeover_device",
                fraud_type=FraudType.ACCOUNT_TAKEOVER,
                risk_score=0.6,
                confidence=0.8,
                description="Login from new/unknown device",
                evidence={'device_fingerprint': device_fingerprint},
                timestamp=datetime.utcnow()
            ))
        
        # Location change detection
        location = login_data.get('location', {})
        if user_id and await self._detect_impossible_travel(user_id, location):
            signals.append(FraudSignal(
                signal_id=f"ato_location_{int(datetime.utcnow().timestamp())}",
                signal_type="account_takeover_location",
                fraud_type=FraudType.ACCOUNT_TAKEOVER,
                risk_score=0.8,
                confidence=0.9,
                description="Impossible travel detected",
                evidence={'location': location},
                timestamp=datetime.utcnow()
            ))
        
        # Failed login attempts
        failed_attempts = login_data.get('recent_failed_attempts', 0)
        max_failed = self._fraud_rules['velocity']['max_failed_attempts']
        if failed_attempts >= max_failed:
            signals.append(FraudSignal(
                signal_id=f"ato_failed_{int(datetime.utcnow().timestamp())}",
                signal_type="account_takeover_brute_force",
                fraud_type=FraudType.ACCOUNT_TAKEOVER,
                risk_score=min(failed_attempts / max_failed * 0.7, 0.9),
                confidence=0.9,
                description=f"Multiple failed login attempts: {failed_attempts}",
                evidence={'failed_attempts': failed_attempts},
                timestamp=datetime.utcnow()
            ))
        
        return signals
    
    async def _analyze_login_patterns(self, login_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze login behavioral patterns."""
        
        user_id = login_data.get('user_id')
        ip_address = login_data.get('ip_address', '')
        user_agent = login_data.get('user_agent', '')
        location = login_data.get('location', {})
        timestamp = datetime.utcnow()
        
        if user_id not in self._behavioral_profiles:
            self._behavioral_profiles[user_id] = BehavioralProfile(user_id)
        
        profile = self._behavioral_profiles[user_id]
        
        # Calculate login anomaly score
        anomaly_score = 0.0
        
        # Time-based anomaly
        hour = timestamp.hour
        typical_hours = profile.login_patterns['hours']
        if typical_hours and hour not in typical_hours:
            anomaly_score += 0.3
        
        # Location-based anomaly
        location_str = f"{location.get('city', '')}, {location.get('country', '')}"
        if location_str not in profile.login_patterns['locations']:
            anomaly_score += 0.4
        
        # IP-based anomaly
        if ip_address not in profile.login_patterns['ip_addresses']:
            anomaly_score += 0.2
        
        # User agent anomaly
        if user_agent not in profile.login_patterns['user_agents']:
            anomaly_score += 0.1
        
        return {
            'anomaly_score': min(anomaly_score, 1.0),
            'user_id': user_id,
            'profile_age_days': (datetime.utcnow() - profile.last_updated).days,
            'login_count': len(profile.login_patterns['ip_addresses']),
            'analysis_timestamp': datetime.utcnow().isoformat()
        }
    
    async def _update_behavioral_profile(self, user_id: str, transaction_data: Dict[str, Any]):
        """Update user behavioral profile with transaction data."""
        
        if user_id not in self._behavioral_profiles:
            self._behavioral_profiles[user_id] = BehavioralProfile(user_id)
        
        profile = self._behavioral_profiles[user_id]
        
        amount = transaction_data.get('amount', 0)
        merchant = transaction_data.get('merchant', '')
        category = transaction_data.get('category', '')
        timestamp = datetime.utcnow()
        
        profile.update_transaction_pattern(amount, merchant, category, timestamp)
    
    async def _update_login_profile(self, user_id: str, login_data: Dict[str, Any]):
        """Update user behavioral profile with login data."""
        
        if user_id not in self._behavioral_profiles:
            self._behavioral_profiles[user_id] = BehavioralProfile(user_id)
        
        profile = self._behavioral_profiles[user_id]
        
        ip_address = login_data.get('ip_address', '')
        user_agent = login_data.get('user_agent', '')
        location = login_data.get('location', {})
        location_str = f"{location.get('city', '')}, {location.get('country', '')}"
        timestamp = datetime.utcnow()
        
        profile.update_login_pattern(ip_address, user_agent, location_str, timestamp)
    
    def _update_velocity_trackers(self, user_id: str, transaction_data: Dict[str, Any]):
        """Update velocity tracking data."""
        
        timestamp = datetime.utcnow()
        amount = transaction_data.get('amount', 0)
        
        # Update transaction count tracker
        self._velocity_trackers['transaction_count'][user_id].append(timestamp)
        
        # Update transaction amount tracker
        self._velocity_trackers['transaction_amount'][user_id].append((timestamp, amount))
        
        # Clean old entries (keep only last 24 hours)
        cutoff = timestamp - timedelta(hours=24)
        
        # Clean transaction count
        while (self._velocity_trackers['transaction_count'][user_id] and 
               self._velocity_trackers['transaction_count'][user_id][0] < cutoff):
            self._velocity_trackers['transaction_count'][user_id].popleft()
        
        # Clean transaction amount
        while (self._velocity_trackers['transaction_amount'][user_id] and 
               self._velocity_trackers['transaction_amount'][user_id][0][0] < cutoff):
            self._velocity_trackers['transaction_amount'][user_id].popleft()
    
    async def _get_recent_transactions(self, user_id: str, time_window: timedelta) -> List[Dict[str, Any]]:
        """Get recent transactions for a user."""
        
        # Mock implementation - would query actual transaction database
        cutoff_time = datetime.utcnow() - time_window
        
        return [
            {
                'transaction_id': 'tx_001',
                'amount': 150.00,
                'merchant': 'Amazon',
                'category': 'retail',
                'timestamp': datetime.utcnow() - timedelta(hours=2)
            },
            {
                'transaction_id': 'tx_002',
                'amount': 75.50,
                'merchant': 'Starbucks',
                'category': 'food',
                'timestamp': datetime.utcnow() - timedelta(hours=6)
            }
        ]
    
    def _is_new_device(self, user_id: str, device_fingerprint: str) -> bool:
        """Check if device is new for the user."""
        
        # Mock implementation - would check device history
        return device_fingerprint not in ['known_device_1', 'known_device_2']
    
    def _is_vpn_or_proxy(self, ip_address: str) -> bool:
        """Check if IP address is from VPN or proxy."""
        
        # Mock implementation - would use IP intelligence services
        vpn_indicators = ['vpn', 'proxy', 'tor']
        return any(indicator in ip_address.lower() for indicator in vpn_indicators)
    
    def _is_tor_exit_node(self, ip_address: str) -> bool:
        """Check if IP address is a Tor exit node."""
        
        # Mock implementation - would check Tor exit node lists
        return 'tor' in ip_address.lower()
    
    async def _detect_impossible_travel(self, user_id: str, current_location: Dict[str, Any]) -> bool:
        """Detect impossible travel based on location changes."""
        
        # Mock implementation - would check previous locations and calculate travel time
        # For now, return False (no impossible travel detected)
        return False
    
    def get_fraud_statistics(self) -> Dict[str, Any]:
        """Get fraud detection engine statistics."""
        
        return {
            'behavioral_profiles': len(self._behavioral_profiles),
            'fraud_rules': len(self._fraud_rules),
            'ml_models': len(self._ml_models),
            'blacklisted_ips': len(self._blacklists['ip_addresses']),
            'blacklisted_devices': len(self._blacklists['device_fingerprints']),
            'risk_thresholds': {level.value: threshold for level, threshold in self._risk_thresholds.items()},
            'last_updated': datetime.utcnow().isoformat()
        }


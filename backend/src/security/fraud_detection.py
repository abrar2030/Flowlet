"""
Advanced Fraud Detection System for Financial Transactions
"""

import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple, Any
from enum import Enum
from dataclasses import dataclass
from decimal import Decimal
import statistics
import math
from collections import defaultdict, deque
import hashlib

logger = logging.getLogger(__name__)

class FraudRiskLevel(Enum):
    """Fraud risk levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class FraudRuleType(Enum):
    """Types of fraud detection rules"""
    VELOCITY = "velocity"
    AMOUNT = "amount"
    LOCATION = "location"
    PATTERN = "pattern"
    BEHAVIORAL = "behavioral"
    DEVICE = "device"
    MERCHANT = "merchant"

@dataclass
class TransactionContext:
    """Context information for fraud analysis"""
    user_id: str
    transaction_id: str
    amount: Decimal
    currency: str
    merchant_name: str
    merchant_category: str
    transaction_type: str
    ip_address: str
    device_fingerprint: str
    user_agent: str
    location_country: str
    location_city: str
    timestamp: datetime
    card_id: Optional[str] = None
    account_id: Optional[str] = None
    is_online: bool = True
    is_international: bool = False

@dataclass
class FraudAlert:
    """Fraud detection alert"""
    alert_id: str
    transaction_id: str
    user_id: str
    risk_level: FraudRiskLevel
    risk_score: float
    triggered_rules: List[str]
    details: Dict[str, Any]
    timestamp: datetime
    requires_manual_review: bool
    recommended_action: str

class FraudDetector:
    """Advanced fraud detection system"""
    
    def __init__(self):
        # Risk thresholds
        self.risk_thresholds = {
            FraudRiskLevel.LOW: 0.3,
            FraudRiskLevel.MEDIUM: 0.6,
            FraudRiskLevel.HIGH: 0.8,
            FraudRiskLevel.CRITICAL: 0.95
        }
        
        # Transaction history cache (in production, use Redis)
        self.transaction_history = defaultdict(deque)
        self.user_profiles = {}
        self.device_profiles = {}
        self.merchant_profiles = {}
        
        # Fraud rules configuration
        self.rules_config = {
            'velocity_rules': {
                'max_transactions_per_hour': 10,
                'max_transactions_per_day': 50,
                'max_amount_per_hour': Decimal('5000.00'),
                'max_amount_per_day': Decimal('25000.00')
            },
            'amount_rules': {
                'large_transaction_threshold': Decimal('2000.00'),
                'unusual_amount_multiplier': 5.0,
                'round_amount_threshold': Decimal('1000.00')
            },
            'location_rules': {
                'max_countries_per_day': 3,
                'impossible_travel_speed_kmh': 1000,
                'high_risk_countries': ['XX', 'YY']  # Placeholder
            },
            'pattern_rules': {
                'repeated_merchant_threshold': 5,
                'sequential_amount_threshold': 3,
                'time_pattern_threshold': 0.8
            }
        }
    
    def analyze_transaction(self, context: TransactionContext) -> FraudAlert:
        """Analyze transaction for fraud indicators"""
        risk_score = 0.0
        triggered_rules = []
        details = {}
        
        # Update user profile
        self._update_user_profile(context)
        
        # Run fraud detection rules
        velocity_score, velocity_rules = self._check_velocity_rules(context)
        amount_score, amount_rules = self._check_amount_rules(context)
        location_score, location_rules = self._check_location_rules(context)
        pattern_score, pattern_rules = self._check_pattern_rules(context)
        behavioral_score, behavioral_rules = self._check_behavioral_rules(context)
        device_score, device_rules = self._check_device_rules(context)
        merchant_score, merchant_rules = self._check_merchant_rules(context)
        
        # Combine scores with weights
        weights = {
            'velocity': 0.25,
            'amount': 0.20,
            'location': 0.15,
            'pattern': 0.15,
            'behavioral': 0.10,
            'device': 0.10,
            'merchant': 0.05
        }
        
        risk_score = (
            velocity_score * weights['velocity'] +
            amount_score * weights['amount'] +
            location_score * weights['location'] +
            pattern_score * weights['pattern'] +
            behavioral_score * weights['behavioral'] +
            device_score * weights['device'] +
            merchant_score * weights['merchant']
        )
        
        # Collect triggered rules
        triggered_rules.extend(velocity_rules)
        triggered_rules.extend(amount_rules)
        triggered_rules.extend(location_rules)
        triggered_rules.extend(pattern_rules)
        triggered_rules.extend(behavioral_rules)
        triggered_rules.extend(device_rules)
        triggered_rules.extend(merchant_rules)
        
        # Determine risk level
        risk_level = self._calculate_risk_level(risk_score)
        
        # Determine if manual review is required
        requires_manual_review = (
            risk_level in [FraudRiskLevel.HIGH, FraudRiskLevel.CRITICAL] or
            len(triggered_rules) >= 3
        )
        
        # Recommend action
        recommended_action = self._get_recommended_action(risk_level, triggered_rules)
        
        # Create fraud alert
        alert = FraudAlert(
            alert_id=self._generate_alert_id(context),
            transaction_id=context.transaction_id,
            user_id=context.user_id,
            risk_level=risk_level,
            risk_score=risk_score,
            triggered_rules=triggered_rules,
            details={
                'scores': {
                    'velocity': velocity_score,
                    'amount': amount_score,
                    'location': location_score,
                    'pattern': pattern_score,
                    'behavioral': behavioral_score,
                    'device': device_score,
                    'merchant': merchant_score
                },
                'context': {
                    'amount': float(context.amount),
                    'currency': context.currency,
                    'merchant_category': context.merchant_category,
                    'is_international': context.is_international,
                    'location_country': context.location_country
                }
            },
            timestamp=datetime.now(timezone.utc),
            requires_manual_review=requires_manual_review,
            recommended_action=recommended_action
        )
        
        # Store transaction in history
        self._store_transaction_history(context, alert)
        
        return alert
    
    def _check_velocity_rules(self, context: TransactionContext) -> Tuple[float, List[str]]:
        """Check velocity-based fraud rules"""
        score = 0.0
        triggered_rules = []
        
        user_transactions = self._get_user_transactions(context.user_id, hours=24)
        
        # Check transaction count per hour
        hour_ago = context.timestamp - timedelta(hours=1)
        recent_transactions = [t for t in user_transactions if t['timestamp'] >= hour_ago]
        
        if len(recent_transactions) > self.rules_config['velocity_rules']['max_transactions_per_hour']:
            score += 0.4
            triggered_rules.append('excessive_transaction_frequency_hourly')
        
        # Check transaction count per day
        if len(user_transactions) > self.rules_config['velocity_rules']['max_transactions_per_day']:
            score += 0.3
            triggered_rules.append('excessive_transaction_frequency_daily')
        
        # Check amount velocity per hour
        recent_amount = sum(Decimal(str(t['amount'])) for t in recent_transactions)
        if recent_amount > self.rules_config['velocity_rules']['max_amount_per_hour']:
            score += 0.5
            triggered_rules.append('excessive_amount_velocity_hourly')
        
        # Check amount velocity per day
        daily_amount = sum(Decimal(str(t['amount'])) for t in user_transactions)
        if daily_amount > self.rules_config['velocity_rules']['max_amount_per_day']:
            score += 0.4
            triggered_rules.append('excessive_amount_velocity_daily')
        
        return min(score, 1.0), triggered_rules
    
    def _check_amount_rules(self, context: TransactionContext) -> Tuple[float, List[str]]:
        """Check amount-based fraud rules"""
        score = 0.0
        triggered_rules = []
        
        # Check for large transactions
        if context.amount > self.rules_config['amount_rules']['large_transaction_threshold']:
            score += 0.3
            triggered_rules.append('large_transaction_amount')
        
        # Check for unusual amounts compared to user history
        user_profile = self.user_profiles.get(context.user_id, {})
        avg_amount = user_profile.get('average_transaction_amount', context.amount)
        
        if context.amount > avg_amount * self.rules_config['amount_rules']['unusual_amount_multiplier']:
            score += 0.4
            triggered_rules.append('unusual_transaction_amount')
        
        # Check for round amounts (potential testing)
        if (context.amount % self.rules_config['amount_rules']['round_amount_threshold']) == 0:
            score += 0.2
            triggered_rules.append('round_amount_pattern')
        
        # Check for very small amounts (potential card testing)
        if context.amount < Decimal('1.00'):
            score += 0.3
            triggered_rules.append('micro_transaction_testing')
        
        return min(score, 1.0), triggered_rules
    
    def _check_location_rules(self, context: TransactionContext) -> Tuple[float, List[str]]:
        """Check location-based fraud rules"""
        score = 0.0
        triggered_rules = []
        
        user_transactions = self._get_user_transactions(context.user_id, hours=24)
        
        # Check for multiple countries in a day
        countries_today = set(t['location_country'] for t in user_transactions)
        countries_today.add(context.location_country)
        
        if len(countries_today) > self.rules_config['location_rules']['max_countries_per_day']:
            score += 0.5
            triggered_rules.append('multiple_countries_same_day')
        
        # Check for impossible travel
        if len(user_transactions) > 0:
            last_transaction = max(user_transactions, key=lambda t: t['timestamp'])
            time_diff = (context.timestamp - last_transaction['timestamp']).total_seconds() / 3600  # hours
            
            if (last_transaction['location_country'] != context.location_country and 
                time_diff < 2):  # Less than 2 hours between countries
                score += 0.7
                triggered_rules.append('impossible_travel_speed')
        
        # Check for high-risk countries
        if context.location_country in self.rules_config['location_rules']['high_risk_countries']:
            score += 0.3
            triggered_rules.append('high_risk_country')
        
        # Check for international transactions if unusual for user
        user_profile = self.user_profiles.get(context.user_id, {})
        if (context.is_international and 
            user_profile.get('international_transaction_ratio', 0) < 0.1):
            score += 0.2
            triggered_rules.append('unusual_international_transaction')
        
        return min(score, 1.0), triggered_rules
    
    def _check_pattern_rules(self, context: TransactionContext) -> Tuple[float, List[str]]:
        """Check pattern-based fraud rules"""
        score = 0.0
        triggered_rules = []
        
        user_transactions = self._get_user_transactions(context.user_id, hours=24)
        
        # Check for repeated merchant transactions
        merchant_count = sum(1 for t in user_transactions if t['merchant_name'] == context.merchant_name)
        if merchant_count > self.rules_config['pattern_rules']['repeated_merchant_threshold']:
            score += 0.3
            triggered_rules.append('excessive_same_merchant_transactions')
        
        # Check for sequential amounts
        amounts = [float(t['amount']) for t in user_transactions[-5:]]  # Last 5 transactions
        amounts.append(float(context.amount))
        
        if self._is_sequential_pattern(amounts):
            score += 0.4
            triggered_rules.append('sequential_amount_pattern')
        
        # Check for time-based patterns
        if len(user_transactions) >= 3:
            times = [t['timestamp'] for t in user_transactions[-3:]]
            times.append(context.timestamp)
            
            if self._is_regular_time_pattern(times):
                score += 0.3
                triggered_rules.append('regular_time_pattern')
        
        # Check for merchant category switching
        recent_categories = [t['merchant_category'] for t in user_transactions[-5:]]
        unique_categories = len(set(recent_categories))
        if unique_categories >= 4:  # Many different categories in short time
            score += 0.2
            triggered_rules.append('rapid_merchant_category_switching')
        
        return min(score, 1.0), triggered_rules
    
    def _check_behavioral_rules(self, context: TransactionContext) -> Tuple[float, List[str]]:
        """Check behavioral fraud rules"""
        score = 0.0
        triggered_rules = []
        
        user_profile = self.user_profiles.get(context.user_id, {})
        
        # Check for unusual transaction time
        hour = context.timestamp.hour
        usual_hours = user_profile.get('usual_transaction_hours', [])
        
        if usual_hours and hour not in usual_hours:
            score += 0.2
            triggered_rules.append('unusual_transaction_time')
        
        # Check for unusual merchant category
        usual_categories = user_profile.get('usual_merchant_categories', [])
        if (usual_categories and 
            context.merchant_category not in usual_categories and
            len(usual_categories) >= 3):
            score += 0.2
            triggered_rules.append('unusual_merchant_category')
        
        # Check for deviation from spending patterns
        avg_daily_spending = user_profile.get('average_daily_spending', 0)
        if avg_daily_spending > 0:
            today_spending = self._get_daily_spending(context.user_id, context.timestamp.date())
            if today_spending > avg_daily_spending * 3:
                score += 0.3
                triggered_rules.append('excessive_daily_spending')
        
        return min(score, 1.0), triggered_rules
    
    def _check_device_rules(self, context: TransactionContext) -> Tuple[float, List[str]]:
        """Check device-based fraud rules"""
        score = 0.0
        triggered_rules = []
        
        user_profile = self.user_profiles.get(context.user_id, {})
        known_devices = user_profile.get('known_devices', [])
        
        # Check for new device
        if context.device_fingerprint not in known_devices:
            score += 0.3
            triggered_rules.append('new_device_detected')
        
        # Check for suspicious user agent
        if self._is_suspicious_user_agent(context.user_agent):
            score += 0.4
            triggered_rules.append('suspicious_user_agent')
        
        # Check for multiple devices in short time
        recent_devices = self._get_recent_devices(context.user_id, hours=1)
        if len(recent_devices) > 3:
            score += 0.5
            triggered_rules.append('multiple_devices_short_time')
        
        return min(score, 1.0), triggered_rules
    
    def _check_merchant_rules(self, context: TransactionContext) -> Tuple[float, List[str]]:
        """Check merchant-based fraud rules"""
        score = 0.0
        triggered_rules = []
        
        merchant_profile = self.merchant_profiles.get(context.merchant_name, {})
        
        # Check merchant risk level
        merchant_risk = merchant_profile.get('risk_level', 'unknown')
        if merchant_risk == 'high':
            score += 0.4
            triggered_rules.append('high_risk_merchant')
        elif merchant_risk == 'medium':
            score += 0.2
            triggered_rules.append('medium_risk_merchant')
        
        # Check for new merchant
        user_profile = self.user_profiles.get(context.user_id, {})
        known_merchants = user_profile.get('known_merchants', [])
        
        if context.merchant_name not in known_merchants:
            score += 0.1
            triggered_rules.append('new_merchant')
        
        return min(score, 1.0), triggered_rules
    
    def _update_user_profile(self, context: TransactionContext):
        """Update user behavioral profile"""
        if context.user_id not in self.user_profiles:
            self.user_profiles[context.user_id] = {
                'transaction_count': 0,
                'total_amount': Decimal('0'),
                'usual_transaction_hours': [],
                'usual_merchant_categories': [],
                'known_devices': [],
                'known_merchants': [],
                'international_transaction_count': 0,
                'average_transaction_amount': Decimal('0'),
                'average_daily_spending': 0
            }
        
        profile = self.user_profiles[context.user_id]
        
        # Update transaction statistics
        profile['transaction_count'] += 1
        profile['total_amount'] += context.amount
        profile['average_transaction_amount'] = profile['total_amount'] / profile['transaction_count']
        
        # Update usual hours
        hour = context.timestamp.hour
        if hour not in profile['usual_transaction_hours']:
            profile['usual_transaction_hours'].append(hour)
        
        # Update usual categories
        if context.merchant_category not in profile['usual_merchant_categories']:
            profile['usual_merchant_categories'].append(context.merchant_category)
        
        # Update known devices
        if context.device_fingerprint not in profile['known_devices']:
            profile['known_devices'].append(context.device_fingerprint)
        
        # Update known merchants
        if context.merchant_name not in profile['known_merchants']:
            profile['known_merchants'].append(context.merchant_name)
        
        # Update international transaction count
        if context.is_international:
            profile['international_transaction_count'] += 1
        
        profile['international_transaction_ratio'] = (
            profile['international_transaction_count'] / profile['transaction_count']
        )
    
    def _get_user_transactions(self, user_id: str, hours: int = 24) -> List[Dict]:
        """Get user transactions within specified hours"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        transactions = self.transaction_history.get(user_id, [])
        return [t for t in transactions if t['timestamp'] >= cutoff_time]
    
    def _get_daily_spending(self, user_id: str, date: datetime.date) -> Decimal:
        """Get total spending for a specific date"""
        transactions = self.transaction_history.get(user_id, [])
        daily_transactions = [
            t for t in transactions 
            if t['timestamp'].date() == date
        ]
        return sum(Decimal(str(t['amount'])) for t in daily_transactions)
    
    def _get_recent_devices(self, user_id: str, hours: int = 1) -> List[str]:
        """Get unique devices used in recent hours"""
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        transactions = self.transaction_history.get(user_id, [])
        recent_transactions = [t for t in transactions if t['timestamp'] >= cutoff_time]
        return list(set(t['device_fingerprint'] for t in recent_transactions))
    
    def _is_sequential_pattern(self, amounts: List[float]) -> bool:
        """Check if amounts follow a sequential pattern"""
        if len(amounts) < 3:
            return False
        
        # Check for arithmetic progression
        differences = [amounts[i+1] - amounts[i] for i in range(len(amounts)-1)]
        if len(set(differences)) == 1 and differences[0] != 0:
            return True
        
        # Check for geometric progression
        if all(amount > 0 for amount in amounts):
            ratios = [amounts[i+1] / amounts[i] for i in range(len(amounts)-1)]
            if len(set(round(r, 2) for r in ratios)) == 1 and ratios[0] != 1:
                return True
        
        return False
    
    def _is_regular_time_pattern(self, timestamps: List[datetime]) -> bool:
        """Check if timestamps follow a regular pattern"""
        if len(timestamps) < 3:
            return False
        
        intervals = []
        for i in range(len(timestamps)-1):
            interval = (timestamps[i+1] - timestamps[i]).total_seconds()
            intervals.append(interval)
        
        # Check if intervals are very similar (within 10% variance)
        if len(intervals) >= 2:
            avg_interval = statistics.mean(intervals)
            variance = statistics.variance(intervals)
            coefficient_of_variation = math.sqrt(variance) / avg_interval if avg_interval > 0 else 0
            
            return coefficient_of_variation < 0.1
        
        return False
    
    def _is_suspicious_user_agent(self, user_agent: str) -> bool:
        """Check if user agent is suspicious"""
        if not user_agent:
            return True
        
        suspicious_patterns = [
            'bot', 'crawler', 'spider', 'scraper', 'automated',
            'python', 'curl', 'wget', 'postman', 'insomnia'
        ]
        
        user_agent_lower = user_agent.lower()
        return any(pattern in user_agent_lower for pattern in suspicious_patterns)
    
    def _calculate_risk_level(self, risk_score: float) -> FraudRiskLevel:
        """Calculate risk level based on score"""
        if risk_score >= self.risk_thresholds[FraudRiskLevel.CRITICAL]:
            return FraudRiskLevel.CRITICAL
        elif risk_score >= self.risk_thresholds[FraudRiskLevel.HIGH]:
            return FraudRiskLevel.HIGH
        elif risk_score >= self.risk_thresholds[FraudRiskLevel.MEDIUM]:
            return FraudRiskLevel.MEDIUM
        else:
            return FraudRiskLevel.LOW
    
    def _get_recommended_action(self, risk_level: FraudRiskLevel, triggered_rules: List[str]) -> str:
        """Get recommended action based on risk level and rules"""
        if risk_level == FraudRiskLevel.CRITICAL:
            return "block_transaction"
        elif risk_level == FraudRiskLevel.HIGH:
            if any('velocity' in rule for rule in triggered_rules):
                return "block_transaction"
            else:
                return "require_additional_authentication"
        elif risk_level == FraudRiskLevel.MEDIUM:
            return "require_additional_authentication"
        else:
            return "allow_transaction"
    
    def _generate_alert_id(self, context: TransactionContext) -> str:
        """Generate unique alert ID"""
        data = f"{context.transaction_id}_{context.user_id}_{context.timestamp.isoformat()}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]
    
    def _store_transaction_history(self, context: TransactionContext, alert: FraudAlert):
        """Store transaction in history for future analysis"""
        transaction_data = {
            'transaction_id': context.transaction_id,
            'amount': float(context.amount),
            'currency': context.currency,
            'merchant_name': context.merchant_name,
            'merchant_category': context.merchant_category,
            'location_country': context.location_country,
            'device_fingerprint': context.device_fingerprint,
            'timestamp': context.timestamp,
            'risk_score': alert.risk_score,
            'risk_level': alert.risk_level.value
        }
        
        # Keep only last 1000 transactions per user
        user_history = self.transaction_history[context.user_id]
        user_history.append(transaction_data)
        
        if len(user_history) > 1000:
            user_history.popleft()
    
    def get_user_risk_profile(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive risk profile for a user"""
        profile = self.user_profiles.get(user_id, {})
        transactions = self._get_user_transactions(user_id, hours=24*30)  # Last 30 days
        
        if not transactions:
            return {
                'risk_level': 'unknown',
                'transaction_count': 0,
                'average_risk_score': 0,
                'high_risk_transactions': 0
            }
        
        risk_scores = [t['risk_score'] for t in transactions]
        high_risk_count = sum(1 for t in transactions if t['risk_level'] in ['high', 'critical'])
        
        avg_risk_score = statistics.mean(risk_scores) if risk_scores else 0
        
        # Determine overall user risk level
        if avg_risk_score >= 0.7 or high_risk_count > 5:
            user_risk_level = 'high'
        elif avg_risk_score >= 0.4 or high_risk_count > 2:
            user_risk_level = 'medium'
        else:
            user_risk_level = 'low'
        
        return {
            'risk_level': user_risk_level,
            'transaction_count': len(transactions),
            'average_risk_score': round(avg_risk_score, 3),
            'high_risk_transactions': high_risk_count,
            'international_transaction_ratio': profile.get('international_transaction_ratio', 0),
            'known_devices_count': len(profile.get('known_devices', [])),
            'known_merchants_count': len(profile.get('known_merchants', []))
        }

# Global fraud detector instance
fraud_detector = FraudDetector()


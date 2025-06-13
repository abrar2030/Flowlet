"""
Advanced fraud detection system for financial transactions
"""

import numpy as np
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Dict, List, Tuple, Optional
import json
import hashlib
from dataclasses import dataclass
from enum import Enum

class FraudRiskLevel(Enum):
    """Fraud risk levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class FraudReason(Enum):
    """Fraud detection reasons"""
    VELOCITY_CHECK = "velocity_check"
    AMOUNT_ANOMALY = "amount_anomaly"
    LOCATION_ANOMALY = "location_anomaly"
    TIME_ANOMALY = "time_anomaly"
    DEVICE_ANOMALY = "device_anomaly"
    PATTERN_ANOMALY = "pattern_anomaly"
    BLACKLIST_MATCH = "blacklist_match"
    ML_MODEL_ALERT = "ml_model_alert"

@dataclass
class FraudCheckResult:
    """Result of fraud detection check"""
    risk_level: FraudRiskLevel
    risk_score: int  # 0-100
    reasons: List[FraudReason]
    details: Dict
    recommended_action: str
    confidence: float  # 0.0-1.0

class AdvancedFraudDetection:
    """Advanced fraud detection system with multiple detection strategies"""
    
    def __init__(self, db_session):
        self.db = db_session
        self.risk_thresholds = {
            FraudRiskLevel.LOW: 25,
            FraudRiskLevel.MEDIUM: 50,
            FraudRiskLevel.HIGH: 75,
            FraudRiskLevel.CRITICAL: 90
        }
    
    def analyze_transaction(self, transaction_data: Dict, user_data: Dict, 
                          account_data: Dict) -> FraudCheckResult:
        """
        Comprehensive fraud analysis of a transaction
        
        Args:
            transaction_data: Transaction details
            user_data: User information
            account_data: Account information
        
        Returns:
            FraudCheckResult with risk assessment
        """
        risk_score = 0
        reasons = []
        details = {}
        
        # 1. Velocity checks
        velocity_score, velocity_reasons = self._check_velocity_patterns(
            transaction_data, user_data, account_data
        )
        risk_score += velocity_score
        reasons.extend(velocity_reasons)
        details['velocity_analysis'] = velocity_score
        
        # 2. Amount anomaly detection
        amount_score, amount_reasons = self._check_amount_anomalies(
            transaction_data, user_data, account_data
        )
        risk_score += amount_score
        reasons.extend(amount_reasons)
        details['amount_analysis'] = amount_score
        
        # 3. Location analysis
        location_score, location_reasons = self._check_location_anomalies(
            transaction_data, user_data
        )
        risk_score += location_score
        reasons.extend(location_reasons)
        details['location_analysis'] = location_score
        
        # 4. Time pattern analysis
        time_score, time_reasons = self._check_time_patterns(
            transaction_data, user_data
        )
        risk_score += time_score
        reasons.extend(time_reasons)
        details['time_analysis'] = time_score
        
        # 5. Device fingerprinting
        device_score, device_reasons = self._check_device_patterns(
            transaction_data, user_data
        )
        risk_score += device_score
        reasons.extend(device_reasons)
        details['device_analysis'] = device_score
        
        # 6. Behavioral pattern analysis
        behavior_score, behavior_reasons = self._check_behavioral_patterns(
            transaction_data, user_data, account_data
        )
        risk_score += behavior_score
        reasons.extend(behavior_reasons)
        details['behavior_analysis'] = behavior_score
        
        # 7. Blacklist checks
        blacklist_score, blacklist_reasons = self._check_blacklists(
            transaction_data, user_data
        )
        risk_score += blacklist_score
        reasons.extend(blacklist_reasons)
        details['blacklist_analysis'] = blacklist_score
        
        # Normalize risk score (0-100)
        risk_score = min(risk_score, 100)
        
        # Determine risk level
        risk_level = self._determine_risk_level(risk_score)
        
        # Calculate confidence based on number of signals
        confidence = min(len(reasons) * 0.15 + 0.4, 1.0)
        
        # Recommend action
        recommended_action = self._recommend_action(risk_level, risk_score)
        
        return FraudCheckResult(
            risk_level=risk_level,
            risk_score=risk_score,
            reasons=reasons,
            details=details,
            recommended_action=recommended_action,
            confidence=confidence
        )
    
    def _check_velocity_patterns(self, transaction_data: Dict, user_data: Dict, 
                               account_data: Dict) -> Tuple[int, List[FraudReason]]:
        """Check for suspicious velocity patterns"""
        score = 0
        reasons = []
        
        user_id = user_data.get('id')
        amount = Decimal(str(transaction_data.get('amount', 0)))
        
        # Check transaction frequency in last hour
        one_hour_ago = datetime.now(timezone.utc) - timedelta(hours=1)
        recent_transactions = self._get_recent_transactions(user_id, one_hour_ago)
        
        if len(recent_transactions) > 10:  # More than 10 transactions in 1 hour
            score += 30
            reasons.append(FraudReason.VELOCITY_CHECK)
        elif len(recent_transactions) > 5:
            score += 15
        
        # Check daily transaction volume
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)
        daily_transactions = self._get_recent_transactions(user_id, today_start)
        daily_volume = sum(Decimal(str(t.get('amount', 0))) for t in daily_transactions)
        
        # Compare with user's average daily volume
        avg_daily_volume = self._get_average_daily_volume(user_id)
        
        if daily_volume > avg_daily_volume * 5:  # 5x normal volume
            score += 25
            reasons.append(FraudReason.VELOCITY_CHECK)
        elif daily_volume > avg_daily_volume * 3:
            score += 15
        
        # Check for rapid-fire transactions (multiple transactions within minutes)
        five_minutes_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
        very_recent = self._get_recent_transactions(user_id, five_minutes_ago)
        
        if len(very_recent) > 3:
            score += 20
            reasons.append(FraudReason.VELOCITY_CHECK)
        
        return score, reasons
    
    def _check_amount_anomalies(self, transaction_data: Dict, user_data: Dict, 
                              account_data: Dict) -> Tuple[int, List[FraudReason]]:
        """Check for amount-based anomalies"""
        score = 0
        reasons = []
        
        amount = Decimal(str(transaction_data.get('amount', 0)))
        user_id = user_data.get('id')
        
        # Get user's transaction history for analysis
        historical_amounts = self._get_historical_amounts(user_id, days=90)
        
        if historical_amounts:
            avg_amount = np.mean(historical_amounts)
            std_amount = np.std(historical_amounts)
            max_amount = max(historical_amounts)
            
            # Check if amount is significantly higher than usual
            if float(amount) > avg_amount + (3 * std_amount):  # 3 standard deviations
                score += 25
                reasons.append(FraudReason.AMOUNT_ANOMALY)
            elif float(amount) > avg_amount + (2 * std_amount):
                score += 15
            
            # Check if amount is the highest ever
            if float(amount) > max_amount * 1.5:
                score += 20
                reasons.append(FraudReason.AMOUNT_ANOMALY)
        
        # Check against account limits
        daily_limit = account_data.get('daily_limit', 0)
        if amount > Decimal(str(daily_limit)) * Decimal('0.8'):  # 80% of daily limit
            score += 15
        
        # Check for round number amounts (often suspicious)
        if amount % 100 == 0 and amount >= 1000:  # Round hundreds above $1000
            score += 5
        
        return score, reasons
    
    def _check_location_anomalies(self, transaction_data: Dict, 
                                user_data: Dict) -> Tuple[int, List[FraudReason]]:
        """Check for location-based anomalies"""
        score = 0
        reasons = []
        
        current_location = transaction_data.get('location')
        current_country = transaction_data.get('country_code')
        user_id = user_data.get('id')
        
        if not current_location and not current_country:
            return score, reasons
        
        # Get user's recent locations
        recent_locations = self._get_recent_locations(user_id, days=30)
        
        # Check for international transactions
        user_country = user_data.get('country', 'US')
        if current_country and current_country != user_country:
            # Check if user has history of international transactions
            international_history = [loc for loc in recent_locations 
                                   if loc.get('country_code') != user_country]
            
            if not international_history:  # First international transaction
                score += 30
                reasons.append(FraudReason.LOCATION_ANOMALY)
            elif len(international_history) < 3:  # Rare international transactions
                score += 15
        
        # Check for impossible travel (geographically impossible in time frame)
        last_location = self._get_last_transaction_location(user_id)
        if last_location and current_location:
            time_diff = self._get_time_since_last_transaction(user_id)
            if self._is_impossible_travel(last_location, current_location, time_diff):
                score += 40
                reasons.append(FraudReason.LOCATION_ANOMALY)
        
        # Check for high-risk countries
        high_risk_countries = ['XX', 'YY']  # Placeholder for actual high-risk countries
        if current_country in high_risk_countries:
            score += 20
            reasons.append(FraudReason.LOCATION_ANOMALY)
        
        return score, reasons
    
    def _check_time_patterns(self, transaction_data: Dict, 
                           user_data: Dict) -> Tuple[int, List[FraudReason]]:
        """Check for time-based anomalies"""
        score = 0
        reasons = []
        
        transaction_time = datetime.now(timezone.utc)
        user_id = user_data.get('id')
        
        # Check if transaction is outside normal business hours
        hour = transaction_time.hour
        if hour < 6 or hour > 22:  # Outside 6 AM - 10 PM
            score += 10
        
        # Check user's historical transaction patterns
        historical_hours = self._get_historical_transaction_hours(user_id)
        
        if historical_hours:
            # Check if current hour is unusual for this user
            hour_frequency = historical_hours.count(hour) / len(historical_hours)
            if hour_frequency < 0.05:  # Less than 5% of transactions at this hour
                score += 15
                reasons.append(FraudReason.TIME_ANOMALY)
        
        # Check for weekend transactions (if user rarely transacts on weekends)
        if transaction_time.weekday() >= 5:  # Saturday or Sunday
            weekend_transactions = self._get_weekend_transaction_count(user_id)
            total_transactions = self._get_total_transaction_count(user_id)
            
            if total_transactions > 10:  # Only check if user has sufficient history
                weekend_ratio = weekend_transactions / total_transactions
                if weekend_ratio < 0.1:  # Less than 10% weekend transactions
                    score += 10
                    reasons.append(FraudReason.TIME_ANOMALY)
        
        return score, reasons
    
    def _check_device_patterns(self, transaction_data: Dict, 
                             user_data: Dict) -> Tuple[int, List[FraudReason]]:
        """Check for device-based anomalies"""
        score = 0
        reasons = []
        
        device_fingerprint = transaction_data.get('device_fingerprint')
        user_agent = transaction_data.get('user_agent')
        ip_address = transaction_data.get('ip_address')
        user_id = user_data.get('id')
        
        # Check for new device
        if device_fingerprint:
            known_devices = self._get_user_devices(user_id)
            if device_fingerprint not in known_devices:
                score += 20
                reasons.append(FraudReason.DEVICE_ANOMALY)
        
        # Check for suspicious user agents
        if user_agent:
            if self._is_suspicious_user_agent(user_agent):
                score += 15
                reasons.append(FraudReason.DEVICE_ANOMALY)
        
        # Check for VPN/Proxy usage
        if ip_address and self._is_vpn_or_proxy(ip_address):
            score += 25
            reasons.append(FraudReason.DEVICE_ANOMALY)
        
        # Check for IP reputation
        if ip_address and self._is_malicious_ip(ip_address):
            score += 30
            reasons.append(FraudReason.DEVICE_ANOMALY)
        
        return score, reasons
    
    def _check_behavioral_patterns(self, transaction_data: Dict, user_data: Dict, 
                                 account_data: Dict) -> Tuple[int, List[FraudReason]]:
        """Check for behavioral anomalies"""
        score = 0
        reasons = []
        
        user_id = user_data.get('id')
        merchant_name = transaction_data.get('merchant_name')
        transaction_type = transaction_data.get('transaction_type')
        
        # Check for unusual merchant
        if merchant_name:
            user_merchants = self._get_user_merchants(user_id)
            if merchant_name not in user_merchants:
                # New merchant - check if it's in a new category
                merchant_category = self._get_merchant_category(merchant_name)
                user_categories = self._get_user_merchant_categories(user_id)
                
                if merchant_category not in user_categories:
                    score += 15
                    reasons.append(FraudReason.PATTERN_ANOMALY)
        
        # Check for unusual transaction type
        user_transaction_types = self._get_user_transaction_types(user_id)
        if transaction_type not in user_transaction_types:
            score += 10
            reasons.append(FraudReason.PATTERN_ANOMALY)
        
        # Check for account age vs transaction risk
        account_age_days = self._get_account_age_days(user_id)
        if account_age_days < 30:  # New account
            amount = Decimal(str(transaction_data.get('amount', 0)))
            if amount > 1000:  # Large transaction on new account
                score += 25
                reasons.append(FraudReason.PATTERN_ANOMALY)
        
        return score, reasons
    
    def _check_blacklists(self, transaction_data: Dict, 
                        user_data: Dict) -> Tuple[int, List[FraudReason]]:
        """Check against various blacklists"""
        score = 0
        reasons = []
        
        email = user_data.get('email')
        ip_address = transaction_data.get('ip_address')
        merchant_name = transaction_data.get('merchant_name')
        
        # Check email blacklist
        if email and self._is_blacklisted_email(email):
            score += 50
            reasons.append(FraudReason.BLACKLIST_MATCH)
        
        # Check IP blacklist
        if ip_address and self._is_blacklisted_ip(ip_address):
            score += 40
            reasons.append(FraudReason.BLACKLIST_MATCH)
        
        # Check merchant blacklist
        if merchant_name and self._is_blacklisted_merchant(merchant_name):
            score += 35
            reasons.append(FraudReason.BLACKLIST_MATCH)
        
        return score, reasons
    
    def _determine_risk_level(self, risk_score: int) -> FraudRiskLevel:
        """Determine risk level based on score"""
        if risk_score >= self.risk_thresholds[FraudRiskLevel.CRITICAL]:
            return FraudRiskLevel.CRITICAL
        elif risk_score >= self.risk_thresholds[FraudRiskLevel.HIGH]:
            return FraudRiskLevel.HIGH
        elif risk_score >= self.risk_thresholds[FraudRiskLevel.MEDIUM]:
            return FraudRiskLevel.MEDIUM
        else:
            return FraudRiskLevel.LOW
    
    def _recommend_action(self, risk_level: FraudRiskLevel, risk_score: int) -> str:
        """Recommend action based on risk assessment"""
        if risk_level == FraudRiskLevel.CRITICAL:
            return "BLOCK_TRANSACTION"
        elif risk_level == FraudRiskLevel.HIGH:
            return "REQUIRE_ADDITIONAL_VERIFICATION"
        elif risk_level == FraudRiskLevel.MEDIUM:
            return "FLAG_FOR_REVIEW"
        else:
            return "ALLOW"
    
    # Helper methods (simplified implementations)
    def _get_recent_transactions(self, user_id: str, since: datetime) -> List[Dict]:
        """Get recent transactions for a user"""
        # Implementation would query the database
        return []
    
    def _get_average_daily_volume(self, user_id: str) -> Decimal:
        """Get user's average daily transaction volume"""
        # Implementation would calculate from historical data
        return Decimal('100.00')
    
    def _get_historical_amounts(self, user_id: str, days: int) -> List[float]:
        """Get historical transaction amounts"""
        # Implementation would query the database
        return []
    
    def _get_recent_locations(self, user_id: str, days: int) -> List[Dict]:
        """Get recent transaction locations"""
        return []
    
    def _get_last_transaction_location(self, user_id: str) -> Optional[str]:
        """Get location of last transaction"""
        return None
    
    def _get_time_since_last_transaction(self, user_id: str) -> timedelta:
        """Get time since last transaction"""
        return timedelta(hours=1)
    
    def _is_impossible_travel(self, loc1: str, loc2: str, time_diff: timedelta) -> bool:
        """Check if travel between locations is impossible in given time"""
        # Implementation would calculate distance and check against time
        return False
    
    def _get_historical_transaction_hours(self, user_id: str) -> List[int]:
        """Get hours when user typically transacts"""
        return []
    
    def _get_weekend_transaction_count(self, user_id: str) -> int:
        """Get count of weekend transactions"""
        return 0
    
    def _get_total_transaction_count(self, user_id: str) -> int:
        """Get total transaction count"""
        return 0
    
    def _get_user_devices(self, user_id: str) -> List[str]:
        """Get known devices for user"""
        return []
    
    def _is_suspicious_user_agent(self, user_agent: str) -> bool:
        """Check if user agent is suspicious"""
        suspicious_patterns = ['bot', 'crawler', 'scraper']
        return any(pattern in user_agent.lower() for pattern in suspicious_patterns)
    
    def _is_vpn_or_proxy(self, ip_address: str) -> bool:
        """Check if IP is from VPN or proxy"""
        # Implementation would check against VPN/proxy databases
        return False
    
    def _is_malicious_ip(self, ip_address: str) -> bool:
        """Check if IP is known to be malicious"""
        # Implementation would check against threat intelligence feeds
        return False
    
    def _get_user_merchants(self, user_id: str) -> List[str]:
        """Get merchants user has transacted with"""
        return []
    
    def _get_merchant_category(self, merchant_name: str) -> str:
        """Get merchant category code"""
        return "unknown"
    
    def _get_user_merchant_categories(self, user_id: str) -> List[str]:
        """Get merchant categories user has used"""
        return []
    
    def _get_user_transaction_types(self, user_id: str) -> List[str]:
        """Get transaction types user has used"""
        return []
    
    def _get_account_age_days(self, user_id: str) -> int:
        """Get account age in days"""
        return 365
    
    def _is_blacklisted_email(self, email: str) -> bool:
        """Check if email is blacklisted"""
        return False
    
    def _is_blacklisted_ip(self, ip_address: str) -> bool:
        """Check if IP is blacklisted"""
        return False
    
    def _is_blacklisted_merchant(self, merchant_name: str) -> bool:
        """Check if merchant is blacklisted"""
        return False


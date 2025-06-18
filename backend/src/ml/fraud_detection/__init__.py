"""
Fraud Detection ML Models Base Classes
Provides abstract base classes and common utilities for fraud detection
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    """Risk level enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FraudType(Enum):
    """Types of fraud that can be detected"""
    ACCOUNT_TAKEOVER = "account_takeover"
    IDENTITY_THEFT = "identity_theft"
    PAYMENT_FRAUD = "payment_fraud"
    CARD_FRAUD = "card_fraud"
    MONEY_LAUNDERING = "money_laundering"
    SYNTHETIC_IDENTITY = "synthetic_identity"
    FIRST_PARTY_FRAUD = "first_party_fraud"
    MERCHANT_FRAUD = "merchant_fraud"
    APPLICATION_FRAUD = "application_fraud"


class ModelType(Enum):
    """ML model types for fraud detection"""
    ISOLATION_FOREST = "isolation_forest"
    ONE_CLASS_SVM = "one_class_svm"
    AUTOENCODER = "autoencoder"
    RANDOM_FOREST = "random_forest"
    GRADIENT_BOOSTING = "gradient_boosting"
    NEURAL_NETWORK = "neural_network"
    ENSEMBLE = "ensemble"


@dataclass
class FraudAlert:
    """Fraud alert data structure"""
    alert_id: str
    transaction_id: str
    user_id: str
    risk_score: float
    risk_level: RiskLevel
    fraud_types: List[FraudType]
    confidence: float
    timestamp: datetime
    features_used: List[str]
    model_version: str
    explanation: Dict[str, Any]
    recommended_actions: List[str]
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class TransactionFeatures:
    """Transaction features for ML models"""
    transaction_id: str
    user_id: str
    amount: float
    currency: str
    timestamp: datetime
    merchant_category: Optional[str] = None
    location_country: Optional[str] = None
    location_city: Optional[str] = None
    device_fingerprint: Optional[str] = None
    ip_address: Optional[str] = None
    payment_method: Optional[str] = None
    channel: Optional[str] = None
    
    # Derived features
    hour_of_day: Optional[int] = None
    day_of_week: Optional[int] = None
    is_weekend: Optional[bool] = None
    amount_zscore: Optional[float] = None
    velocity_1h: Optional[int] = None
    velocity_24h: Optional[int] = None
    velocity_7d: Optional[int] = None
    
    # User behavior features
    user_age_days: Optional[int] = None
    avg_transaction_amount: Optional[float] = None
    transaction_count_30d: Optional[int] = None
    unique_merchants_30d: Optional[int] = None
    
    # Risk indicators
    new_device: Optional[bool] = None
    new_location: Optional[bool] = None
    unusual_time: Optional[bool] = None
    high_risk_merchant: Optional[bool] = None


class FraudDetectionError(Exception):
    """Base exception for fraud detection errors"""
    pass


class ModelNotTrainedError(FraudDetectionError):
    """Model not trained error"""
    pass


class FeatureExtractionError(FraudDetectionError):
    """Feature extraction error"""
    pass


class FraudModelBase(ABC):
    """
    Abstract base class for fraud detection models
    """
    
    def __init__(self, model_config: Dict[str, Any]):
        self.config = model_config
        self.model = None
        self.is_trained = False
        self.feature_columns = []
        self.model_version = str(uuid.uuid4())
        self.training_timestamp = None
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        
    @abstractmethod
    def train(self, training_data: pd.DataFrame, labels: Optional[pd.Series] = None) -> None:
        """
        Train the fraud detection model
        
        Args:
            training_data: Training dataset
            labels: Labels for supervised learning (None for unsupervised)
        """
        pass
    
    @abstractmethod
    def predict(self, features: pd.DataFrame) -> np.ndarray:
        """
        Predict fraud probability/anomaly score
        
        Args:
            features: Feature matrix
            
        Returns:
            np.ndarray: Fraud scores/probabilities
        """
        pass
    
    @abstractmethod
    def get_feature_importance(self) -> Dict[str, float]:
        """
        Get feature importance scores
        
        Returns:
            Dict[str, float]: Feature importance mapping
        """
        pass
    
    def preprocess_features(self, features: pd.DataFrame) -> pd.DataFrame:
        """
        Preprocess features before prediction
        
        Args:
            features: Raw features
            
        Returns:
            pd.DataFrame: Preprocessed features
        """
        # Handle missing values
        features = features.fillna(0)
        
        # Ensure all required columns are present
        for col in self.feature_columns:
            if col not in features.columns:
                features[col] = 0
        
        # Select only required columns in correct order
        features = features[self.feature_columns]
        
        return features
    
    def calculate_risk_level(self, score: float) -> RiskLevel:
        """
        Calculate risk level from fraud score
        
        Args:
            score: Fraud score (0-1)
            
        Returns:
            RiskLevel: Risk level
        """
        if score >= 0.8:
            return RiskLevel.CRITICAL
        elif score >= 0.6:
            return RiskLevel.HIGH
        elif score >= 0.3:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def save_model(self, filepath: str) -> None:
        """Save model to file"""
        import joblib
        
        model_data = {
            'model': self.model,
            'feature_columns': self.feature_columns,
            'model_version': self.model_version,
            'training_timestamp': self.training_timestamp,
            'config': self.config,
            'is_trained': self.is_trained
        }
        
        joblib.dump(model_data, filepath)
        self.logger.info(f"Model saved to {filepath}")
    
    def load_model(self, filepath: str) -> None:
        """Load model from file"""
        import joblib
        
        model_data = joblib.load(filepath)
        
        self.model = model_data['model']
        self.feature_columns = model_data['feature_columns']
        self.model_version = model_data['model_version']
        self.training_timestamp = model_data['training_timestamp']
        self.config = model_data['config']
        self.is_trained = model_data['is_trained']
        
        self.logger.info(f"Model loaded from {filepath}")


class FeatureEngineer:
    """
    Feature engineering for fraud detection
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def extract_transaction_features(
        self, 
        transaction_data: Dict[str, Any],
        user_history: Optional[pd.DataFrame] = None
    ) -> TransactionFeatures:
        """
        Extract features from transaction data
        
        Args:
            transaction_data: Raw transaction data
            user_history: Historical transactions for the user
            
        Returns:
            TransactionFeatures: Extracted features
        """
        try:
            timestamp = datetime.fromisoformat(transaction_data['timestamp']) \
                if isinstance(transaction_data['timestamp'], str) \
                else transaction_data['timestamp']
            
            features = TransactionFeatures(
                transaction_id=transaction_data['transaction_id'],
                user_id=transaction_data['user_id'],
                amount=float(transaction_data['amount']),
                currency=transaction_data.get('currency', 'USD'),
                timestamp=timestamp,
                merchant_category=transaction_data.get('merchant_category'),
                location_country=transaction_data.get('location_country'),
                location_city=transaction_data.get('location_city'),
                device_fingerprint=transaction_data.get('device_fingerprint'),
                ip_address=transaction_data.get('ip_address'),
                payment_method=transaction_data.get('payment_method'),
                channel=transaction_data.get('channel')
            )
            
            # Extract time-based features
            features.hour_of_day = timestamp.hour
            features.day_of_week = timestamp.weekday()
            features.is_weekend = timestamp.weekday() >= 5
            
            # Calculate user behavior features if history is available
            if user_history is not None and not user_history.empty:
                features = self._calculate_user_features(features, user_history)
                features = self._calculate_velocity_features(features, user_history)
                features = self._calculate_risk_indicators(features, user_history)
            
            return features
            
        except Exception as e:
            self.logger.error(f"Feature extraction error: {str(e)}")
            raise FeatureExtractionError(f"Feature extraction error: {str(e)}")
    
    def _calculate_user_features(
        self, 
        features: TransactionFeatures, 
        user_history: pd.DataFrame
    ) -> TransactionFeatures:
        """Calculate user behavior features"""
        
        # User age
        if not user_history.empty:
            first_transaction = user_history['timestamp'].min()
            features.user_age_days = (features.timestamp - first_transaction).days
        
        # Transaction statistics
        recent_30d = user_history[
            user_history['timestamp'] >= features.timestamp - timedelta(days=30)
        ]
        
        if not recent_30d.empty:
            features.avg_transaction_amount = recent_30d['amount'].mean()
            features.transaction_count_30d = len(recent_30d)
            features.unique_merchants_30d = recent_30d['merchant_category'].nunique()
        
        # Amount z-score
        if not user_history.empty and len(user_history) > 1:
            user_amounts = user_history['amount']
            mean_amount = user_amounts.mean()
            std_amount = user_amounts.std()
            if std_amount > 0:
                features.amount_zscore = (features.amount - mean_amount) / std_amount
        
        return features
    
    def _calculate_velocity_features(
        self, 
        features: TransactionFeatures, 
        user_history: pd.DataFrame
    ) -> TransactionFeatures:
        """Calculate transaction velocity features"""
        
        # 1 hour velocity
        hour_ago = features.timestamp - timedelta(hours=1)
        features.velocity_1h = len(user_history[user_history['timestamp'] >= hour_ago])
        
        # 24 hour velocity
        day_ago = features.timestamp - timedelta(hours=24)
        features.velocity_24h = len(user_history[user_history['timestamp'] >= day_ago])
        
        # 7 day velocity
        week_ago = features.timestamp - timedelta(days=7)
        features.velocity_7d = len(user_history[user_history['timestamp'] >= week_ago])
        
        return features
    
    def _calculate_risk_indicators(
        self, 
        features: TransactionFeatures, 
        user_history: pd.DataFrame
    ) -> TransactionFeatures:
        """Calculate risk indicator features"""
        
        # New device indicator
        if features.device_fingerprint:
            features.new_device = features.device_fingerprint not in \
                user_history['device_fingerprint'].values
        
        # New location indicator
        if features.location_country:
            features.new_location = features.location_country not in \
                user_history['location_country'].values
        
        # Unusual time indicator (outside normal hours)
        if not user_history.empty:
            user_hours = user_history['timestamp'].dt.hour
            common_hours = user_hours.mode().values
            features.unusual_time = features.hour_of_day not in common_hours
        
        # High risk merchant (placeholder - would be based on merchant risk database)
        high_risk_categories = ['gambling', 'adult', 'cryptocurrency']
        features.high_risk_merchant = features.merchant_category in high_risk_categories
        
        return features
    
    def features_to_dataframe(self, features: TransactionFeatures) -> pd.DataFrame:
        """
        Convert TransactionFeatures to DataFrame for ML models
        
        Args:
            features: Transaction features
            
        Returns:
            pd.DataFrame: Features as DataFrame
        """
        feature_dict = {
            'amount': features.amount,
            'hour_of_day': features.hour_of_day or 0,
            'day_of_week': features.day_of_week or 0,
            'is_weekend': int(features.is_weekend or False),
            'amount_zscore': features.amount_zscore or 0,
            'velocity_1h': features.velocity_1h or 0,
            'velocity_24h': features.velocity_24h or 0,
            'velocity_7d': features.velocity_7d or 0,
            'user_age_days': features.user_age_days or 0,
            'avg_transaction_amount': features.avg_transaction_amount or 0,
            'transaction_count_30d': features.transaction_count_30d or 0,
            'unique_merchants_30d': features.unique_merchants_30d or 0,
            'new_device': int(features.new_device or False),
            'new_location': int(features.new_location or False),
            'unusual_time': int(features.unusual_time or False),
            'high_risk_merchant': int(features.high_risk_merchant or False)
        }
        
        return pd.DataFrame([feature_dict])


class FraudExplainer:
    """
    Provides explanations for fraud detection decisions
    """
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def explain_prediction(
        self, 
        features: TransactionFeatures,
        risk_score: float,
        feature_importance: Dict[str, float]
    ) -> Dict[str, Any]:
        """
        Generate explanation for fraud prediction
        
        Args:
            features: Transaction features
            risk_score: Calculated risk score
            feature_importance: Feature importance from model
            
        Returns:
            Dict[str, Any]: Explanation details
        """
        explanation = {
            'risk_score': risk_score,
            'primary_risk_factors': [],
            'contributing_factors': [],
            'protective_factors': [],
            'summary': ''
        }
        
        # Analyze high-impact features
        high_impact_threshold = 0.1
        for feature, importance in feature_importance.items():
            if importance > high_impact_threshold:
                feature_value = getattr(features, feature, None)
                if feature_value:
                    explanation['primary_risk_factors'].append({
                        'feature': feature,
                        'value': feature_value,
                        'importance': importance,
                        'description': self._get_feature_description(feature, feature_value)
                    })
        
        # Generate summary
        if risk_score >= 0.8:
            explanation['summary'] = "High fraud risk detected due to multiple suspicious indicators"
        elif risk_score >= 0.6:
            explanation['summary'] = "Elevated fraud risk - additional verification recommended"
        elif risk_score >= 0.3:
            explanation['summary'] = "Moderate fraud risk - monitor transaction"
        else:
            explanation['summary'] = "Low fraud risk - transaction appears normal"
        
        return explanation
    
    def _get_feature_description(self, feature: str, value: Any) -> str:
        """Get human-readable description for feature"""
        descriptions = {
            'amount_zscore': f"Transaction amount is {abs(value):.1f} standard deviations from user's normal",
            'velocity_1h': f"User has made {value} transactions in the past hour",
            'velocity_24h': f"User has made {value} transactions in the past 24 hours",
            'new_device': "Transaction from a new device" if value else "Transaction from known device",
            'new_location': "Transaction from a new location" if value else "Transaction from known location",
            'unusual_time': "Transaction at unusual time" if value else "Transaction at normal time",
            'high_risk_merchant': "High-risk merchant category" if value else "Normal merchant category"
        }
        
        return descriptions.get(feature, f"{feature}: {value}")


"""
Comprehensive Test Suite for Fraud Detection
"""

import pytest
import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
import json

# Fraud Detection Tests
from src.ml.fraud_detection import (
    FraudAlert,
    RiskLevel,
    FraudType,
    TransactionFeatures,
    FeatureEngineer,
    FraudExplainer
)
from src.ml.fraud_detection.anomaly_models import IsolationForestModel
from src.ml.fraud_detection.supervised_models import XGBoostFraudModel
from src.ml.fraud_detection.ensemble_model import EnsembleFraudModel, RealTimeFraudDetector
from src.ml.fraud_detection.service import FraudDetectionService


class TestFraudDetection:
    """Test suite for fraud detection models"""
    
    @pytest.fixture
    def sample_features_data(self):
        """Generate sample feature data for testing"""
        np.random.seed(42)
        n_samples = 1000
        
        data = {
            'amount': np.random.lognormal(3, 1, n_samples),
            'hour_of_day': np.random.randint(0, 24, n_samples),
            'day_of_week': np.random.randint(0, 7, n_samples),
            'is_weekend': np.random.randint(0, 2, n_samples),
            'amount_zscore': np.random.normal(0, 1, n_samples),
            'velocity_1h': np.random.poisson(2, n_samples),
            'velocity_24h': np.random.poisson(10, n_samples),
            'velocity_7d': np.random.poisson(50, n_samples),
            'user_age_days': np.random.randint(1, 1000, n_samples),
            'avg_transaction_amount': np.random.lognormal(3, 1, n_samples),
            'transaction_count_30d': np.random.poisson(20, n_samples),
            'unique_merchants_30d': np.random.poisson(5, n_samples),
            'new_device': np.random.randint(0, 2, n_samples),
            'new_location': np.random.randint(0, 2, n_samples),
            'unusual_time': np.random.randint(0, 2, n_samples),
            'high_risk_merchant': np.random.randint(0, 2, n_samples)
        }
        
        return pd.DataFrame(data)
    
    @pytest.fixture
    def sample_labels(self, sample_features_data):
        """Generate sample labels (fraud/not fraud)"""
        np.random.seed(42)
        # Create imbalanced dataset (5% fraud)
        n_samples = len(sample_features_data)
        fraud_rate = 0.05
        n_fraud = int(n_samples * fraud_rate)
        
        labels = np.zeros(n_samples)
        fraud_indices = np.random.choice(n_samples, n_fraud, replace=False)
        labels[fraud_indices] = 1
        
        return pd.Series(labels)
    
    @pytest.fixture
    def sample_transaction_features(self):
        """Sample transaction features for testing"""
        return TransactionFeatures(
            transaction_id='txn_123',
            user_id='user_456',
            amount=100.0,
            currency='USD',
            timestamp=datetime.now(),
            merchant_category='grocery',
            location_country='US',
            location_city='New York',
            device_fingerprint='device_123',
            ip_address='192.168.1.1',
            payment_method='card',
            channel='online'
        )
    
    def test_feature_engineer_initialization(self):
        """Test feature engineer initialization"""
        engineer = FeatureEngineer()
        assert engineer is not None
    
    def test_transaction_features_extraction(self):
        """Test transaction features extraction"""
        engineer = FeatureEngineer()
        
        transaction_data = {
            'transaction_id': 'txn_123',
            'user_id': 'user_456',
            'amount': 100.0,
            'currency': 'USD',
            'timestamp': datetime.now().isoformat(),
            'merchant_category': 'grocery'
        }
        
        features = engineer.extract_transaction_features(transaction_data)
        
        assert features.transaction_id == 'txn_123'
        assert features.user_id == 'user_456'
        assert features.amount == 100.0
        assert features.currency == 'USD'
        assert features.merchant_category == 'grocery'
        assert features.hour_of_day is not None
        assert features.day_of_week is not None
        assert features.is_weekend is not None
    
    def test_features_to_dataframe(self, sample_transaction_features):
        """Test converting features to DataFrame"""
        engineer = FeatureEngineer()
        df = engineer.features_to_dataframe(sample_transaction_features)
        
        assert isinstance(df, pd.DataFrame)
        assert len(df) == 1
        assert 'amount' in df.columns
        assert 'hour_of_day' in df.columns
        assert 'day_of_week' in df.columns
    
    def test_isolation_forest_model(self, sample_features_data):
        """Test Isolation Forest model"""
        config = {
            'contamination': 0.1,
            'n_estimators': 10,  # Small for testing
            'random_state': 42
        }
        
        model = IsolationForestModel(config)
        assert not model.is_trained
        
        # Train model
        model.train(sample_features_data)
        assert model.is_trained
        
        # Test prediction
        predictions = model.predict(sample_features_data.head(10))
        assert len(predictions) == 10
        assert all(0 <= p <= 1 for p in predictions)
        
        # Test feature importance
        importance = model.get_feature_importance()
        assert isinstance(importance, dict)
        assert len(importance) == len(sample_features_data.columns)
    
    def test_xgboost_model(self, sample_features_data, sample_labels):
        """Test XGBoost model"""
        config = {
            'n_estimators': 10,  # Small for testing
            'max_depth': 3,
            'random_state': 42
        }
        
        model = XGBoostFraudModel(config)
        assert not model.is_trained
        
        # Train model
        model.train(sample_features_data, sample_labels)
        assert model.is_trained
        
        # Test prediction
        predictions = model.predict(sample_features_data.head(10))
        assert len(predictions) == 10
        assert all(0 <= p <= 1 for p in predictions)
        
        # Test feature importance
        importance = model.get_feature_importance()
        assert isinstance(importance, dict)
        assert len(importance) == len(sample_features_data.columns)
    
    def test_ensemble_model(self, sample_features_data, sample_labels):
        """Test ensemble fraud model"""
        config = {
            'voting_strategy': 'weighted',
            'models': {
                'isolation_forest': {
                    'contamination': 0.1,
                    'n_estimators': 10,
                    'random_state': 42
                },
                'xgboost': {
                    'n_estimators': 10,
                    'max_depth': 3,
                    'random_state': 42
                }
            }
        }
        
        model = EnsembleFraudModel(config)
        assert not model.is_trained
        assert len(model.models) == 2
        
        # Train model
        model.train(sample_features_data, sample_labels)
        assert model.is_trained
        
        # Test prediction
        predictions = model.predict(sample_features_data.head(10))
        assert len(predictions) == 10
        assert all(0 <= p <= 1 for p in predictions)
        
        # Test individual model predictions
        individual_predictions = model.get_model_predictions(sample_features_data.head(5))
        assert isinstance(individual_predictions, dict)
        assert len(individual_predictions) >= 1  # At least one model should be trained
    
    def test_real_time_fraud_detector(self, sample_features_data, sample_labels):
        """Test real-time fraud detector"""
        # Create and train ensemble model
        config = {
            'voting_strategy': 'weighted',
            'models': {
                'isolation_forest': {
                    'contamination': 0.1,
                    'n_estimators': 10,
                    'random_state': 42
                }
            }
        }
        
        ensemble_model = EnsembleFraudModel(config)
        ensemble_model.train(sample_features_data, sample_labels)
        
        # Create real-time detector
        detector = RealTimeFraudDetector(ensemble_model)
        
        # Test fraud detection
        transaction_data = {
            'transaction_id': 'txn_123',
            'user_id': 'user_456',
            'amount': 100.0,
            'currency': 'USD',
            'timestamp': datetime.now().isoformat()
        }
        
        alert = detector.detect_fraud(transaction_data)
        
        assert isinstance(alert, FraudAlert)
        assert alert.transaction_id == 'txn_123'
        assert alert.user_id == 'user_456'
        assert isinstance(alert.risk_score, float)
        assert isinstance(alert.risk_level, RiskLevel)
        assert isinstance(alert.fraud_types, list)
        assert isinstance(alert.recommended_actions, list)
    
    @pytest.mark.asyncio
    async def test_fraud_detection_service(self, sample_features_data, sample_labels):
        """Test fraud detection service"""
        config = {
            'model_path': '/tmp/test_fraud_model.joblib',
            'auto_retrain': False,
            'model_config': {
                'voting_strategy': 'weighted',
                'models': {
                    'isolation_forest': {
                        'contamination': 0.1,
                        'n_estimators': 10,
                        'random_state': 42
                    }
                }
            }
        }
        
        service = FraudDetectionService(config)
        
        # Train model
        training_results = await service.train_model(sample_features_data, sample_labels)
        assert 'training_samples' in training_results
        assert training_results['training_samples'] == len(sample_features_data)
        
        # Test fraud detection
        transaction_data = {
            'transaction_id': 'txn_123',
            'user_id': 'user_456',
            'amount': 100.0,
            'currency': 'USD',
            'timestamp': datetime.now().isoformat()
        }
        
        alert = await service.detect_fraud(transaction_data)
        assert isinstance(alert, FraudAlert)
        
        # Test model status
        status = service.get_model_status()
        assert status['model_initialized'] is True
        assert status['model_trained'] is True
        assert status['real_time_detector_ready'] is True
        
        # Test statistics
        stats = service.get_fraud_statistics(24)
        assert 'total_transactions' in stats
        assert 'fraud_detected' in stats
        assert 'fraud_rate' in stats
    
    def test_fraud_explainer(self, sample_transaction_features):
        """Test fraud explainer"""
        explainer = FraudExplainer()
        
        feature_importance = {
            'amount': 0.3,
            'velocity_1h': 0.2,
            'new_device': 0.15,
            'unusual_time': 0.1
        }
        
        explanation = explainer.explain_prediction(
            sample_transaction_features,
            0.75,  # High risk score
            feature_importance
        )
        
        assert 'risk_score' in explanation
        assert 'primary_risk_factors' in explanation
        assert 'summary' in explanation
        assert explanation['risk_score'] == 0.75
    
    def test_risk_level_calculation(self):
        """Test risk level calculation"""
        from src.ml.fraud_detection import FraudModelBase
        
        model = FraudModelBase({})
        
        assert model.calculate_risk_level(0.1) == RiskLevel.LOW
        assert model.calculate_risk_level(0.4) == RiskLevel.MEDIUM
        assert model.calculate_risk_level(0.7) == RiskLevel.HIGH
        assert model.calculate_risk_level(0.9) == RiskLevel.CRITICAL



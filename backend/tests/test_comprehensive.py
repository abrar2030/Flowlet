"""
Comprehensive Test Suite for Banking Integrations and Fraud Detection
"""

import pytest
import asyncio
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
import json

# Banking Integration Tests
from src.integrations.banking import (
    BankingIntegrationBase,
    BankAccount,
    Transaction,
    PaymentRequest,
    TransactionType,
    TransactionStatus,
    BankingIntegrationError
)
from src.integrations.banking.manager import BankingIntegrationManager, IntegrationType
from src.integrations.banking.plaid_integration import PlaidIntegration
from src.integrations.banking.open_banking_integration import OpenBankingIntegration
from src.integrations.banking.fdx_integration import FDXIntegration

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


class TestBankingIntegrations:
    """Test suite for banking integrations"""
    
    @pytest.fixture
    def sample_config(self):
        return {
            'client_id': 'test_client_id',
            'secret': 'test_secret',
            'environment': 'sandbox',
            'base_url': 'https://api.test.com'
        }
    
    @pytest.fixture
    def sample_account(self):
        return BankAccount(
            account_id='acc_123',
            account_number='1234567890',
            routing_number='123456789',
            account_type='checking',
            bank_name='Test Bank',
            currency='USD',
            balance=1000.0,
            available_balance=950.0,
            account_holder_name='John Doe'
        )
    
    @pytest.fixture
    def sample_transaction(self):
        return Transaction(
            transaction_id='txn_123',
            account_id='acc_123',
            amount=100.0,
            currency='USD',
            transaction_type=TransactionType.DEBIT,
            status=TransactionStatus.COMPLETED,
            description='Test transaction',
            timestamp=datetime.now(),
            counterparty_name='Test Merchant'
        )
    
    @pytest.fixture
    def sample_payment_request(self):
        return PaymentRequest(
            amount=100.0,
            currency='USD',
            from_account='acc_123',
            to_account='acc_456',
            description='Test payment'
        )
    
    def test_banking_integration_manager_initialization(self):
        """Test banking integration manager initialization"""
        manager = BankingIntegrationManager()
        assert len(manager.integrations) == 0
        assert len(manager.integration_classes) == 3
        assert IntegrationType.PLAID in manager.integration_classes
        assert IntegrationType.OPEN_BANKING in manager.integration_classes
        assert IntegrationType.FDX in manager.integration_classes
    
    def test_register_plaid_integration(self, sample_config):
        """Test registering Plaid integration"""
        manager = BankingIntegrationManager()
        
        manager.register_integration(
            'test_plaid',
            IntegrationType.PLAID,
            sample_config
        )
        
        assert 'test_plaid' in manager.integrations
        assert isinstance(manager.integrations['test_plaid'], PlaidIntegration)
    
    def test_register_open_banking_integration(self, sample_config):
        """Test registering Open Banking integration"""
        manager = BankingIntegrationManager()
        
        manager.register_integration(
            'test_open_banking',
            IntegrationType.OPEN_BANKING,
            sample_config
        )
        
        assert 'test_open_banking' in manager.integrations
        assert isinstance(manager.integrations['test_open_banking'], OpenBankingIntegration)
    
    def test_register_fdx_integration(self, sample_config):
        """Test registering FDX integration"""
        manager = BankingIntegrationManager()
        
        manager.register_integration(
            'test_fdx',
            IntegrationType.FDX,
            sample_config
        )
        
        assert 'test_fdx' in manager.integrations
        assert isinstance(manager.integrations['test_fdx'], FDXIntegration)
    
    def test_get_integration_health(self, sample_config):
        """Test getting integration health status"""
        manager = BankingIntegrationManager()
        
        manager.register_integration(
            'test_plaid',
            IntegrationType.PLAID,
            sample_config
        )
        
        health = manager.get_integration_health()
        assert 'test_plaid' in health
        assert 'authenticated' in health['test_plaid']
        assert 'type' in health['test_plaid']
    
    @pytest.mark.asyncio
    async def test_plaid_authentication_mock(self, sample_config):
        """Test Plaid authentication with mocking"""
        plaid = PlaidIntegration(sample_config)
        
        # Mock the HTTP session
        with patch('aiohttp.ClientSession') as mock_session:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value={'link_token': 'test_token'})
            
            mock_session.return_value.__aenter__.return_value.post.return_value.__aenter__.return_value = mock_response
            
            result = await plaid.authenticate()
            assert result is True
            assert plaid._authenticated is True
    
    def test_account_validation(self):
        """Test account number validation"""
        from src.integrations.banking import BankingIntegrationBase
        
        base = BankingIntegrationBase({})
        
        # Valid account numbers
        assert base.validate_account_number('12345678') is True
        assert base.validate_account_number('123456789012') is True
        
        # Invalid account numbers
        assert base.validate_account_number('1234567') is False  # Too short
        assert base.validate_account_number('12345abc') is False  # Contains letters
    
    def test_routing_number_validation(self):
        """Test routing number validation"""
        from src.integrations.banking import BankingIntegrationBase
        
        base = BankingIntegrationBase({})
        
        # Valid routing numbers
        assert base.validate_routing_number('123456789') is True
        
        # Invalid routing numbers
        assert base.validate_routing_number('12345678') is False  # Too short
        assert base.validate_routing_number('1234567890') is False  # Too long
        assert base.validate_routing_number('12345abc9') is False  # Contains letters


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


class TestIntegration:
    """Integration tests for the complete system"""
    
    @pytest.mark.asyncio
    async def test_end_to_end_fraud_detection(self):
        """Test end-to-end fraud detection workflow"""
        # Generate sample data
        np.random.seed(42)
        n_samples = 100
        
        features_data = pd.DataFrame({
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
        })
        
        labels = pd.Series(np.random.randint(0, 2, n_samples))
        
        # Initialize fraud detection service
        config = {
            'model_path': '/tmp/test_e2e_fraud_model.joblib',
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
        training_results = await service.train_model(features_data, labels)
        assert training_results['training_samples'] == n_samples
        
        # Test multiple transactions
        transactions = [
            {
                'transaction_id': f'txn_{i}',
                'user_id': f'user_{i % 10}',
                'amount': float(np.random.lognormal(3, 1)),
                'currency': 'USD',
                'timestamp': datetime.now().isoformat()
            }
            for i in range(10)
        ]
        
        alerts = await service.batch_detect_fraud(transactions)
        assert len(alerts) == 10
        
        # Verify all alerts have required fields
        for alert in alerts:
            assert alert.transaction_id.startswith('txn_')
            assert alert.user_id.startswith('user_')
            assert isinstance(alert.risk_score, float)
            assert isinstance(alert.risk_level, RiskLevel)
            assert isinstance(alert.fraud_types, list)
            assert isinstance(alert.recommended_actions, list)
        
        # Test feedback mechanism
        for alert in alerts[:3]:  # Test feedback for first 3 alerts
            await service.update_model_feedback(
                alert.transaction_id,
                alert.risk_score > 0.5,  # Simulate feedback
                'test_feedback'
            )
        
        # Verify performance metrics updated
        status = service.get_model_status()
        assert status['performance_metrics']['total_predictions'] >= 10
    
    def test_banking_integration_manager_workflow(self):
        """Test complete banking integration manager workflow"""
        manager = BankingIntegrationManager()
        
        # Register multiple integrations
        configs = {
            'plaid_test': {
                'client_id': 'test_plaid_client',
                'secret': 'test_plaid_secret',
                'environment': 'sandbox'
            },
            'fdx_test': {
                'client_id': 'test_fdx_client',
                'client_secret': 'test_fdx_secret',
                'base_url': 'https://api.fdx.test.com'
            }
        }
        
        manager.register_integration('plaid_test', IntegrationType.PLAID, configs['plaid_test'])
        manager.register_integration('fdx_test', IntegrationType.FDX, configs['fdx_test'])
        
        # Verify registrations
        integrations = manager.list_integrations()
        assert 'plaid_test' in integrations
        assert 'fdx_test' in integrations
        
        # Check health status
        health = manager.get_integration_health()
        assert 'plaid_test' in health
        assert 'fdx_test' in health
        
        for integration_name, status in health.items():
            assert 'authenticated' in status
            assert 'type' in status
            assert 'config_keys' in status


if __name__ == '__main__':
    # Run tests
    pytest.main([__file__, '-v', '--tb=short'])


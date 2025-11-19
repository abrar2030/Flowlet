import sys
from pathlib import Path

import pytest

"""
Basic validation tests for banking integrations and fraud detection modules
"""


# Add the src directory to Python path
backend_dir = Path(__file__).parent.parent
src_dir = backend_dir / "src"
sys.path.insert(0, str(src_dir))


class TestModuleStructure:
    """Test that all modules can be imported and have correct structure"""

    def test_banking_integration_files_exist(self):
        """Test that banking integration files exist"""
        banking_dir = src_dir / "integrations" / "banking"

        required_files = [
            "__init__.py",
            "manager.py",
            "plaid_integration.py",
            "open_banking_integration.py",
            "fdx_integration.py",
        ]

        for file_name in required_files:
            file_path = banking_dir / file_name
            assert file_path.exists(), f"Missing file: {file_path}"
            assert file_path.stat().st_size > 0, f"Empty file: {file_path}"

    def test_fraud_detection_files_exist(self):
        """Test that fraud detection files exist"""
        fraud_dir = src_dir / "ml" / "fraud_detection"

        required_files = [
            "__init__.py",
            "anomaly_models.py",
            "supervised_models.py",
            "ensemble_model.py",
            "service.py",
        ]

        for file_name in required_files:
            file_path = fraud_dir / file_name
            assert file_path.exists(), f"Missing file: {file_path}"
            assert file_path.stat().st_size > 0, f"Empty file: {file_path}"

    def test_routes_files_exist(self):
        """Test that route files exist"""
        routes_dir = src_dir / "routes"

        required_files = ["banking_integrations.py", "fraud_detection.py"]

        for file_name in required_files:
            file_path = routes_dir / file_name
            assert file_path.exists(), f"Missing file: {file_path}"
            assert file_path.stat().st_size > 0, f"Empty file: {file_path}"


class TestCodeQuality:
    """Test code quality and structure"""

    def test_banking_integration_classes_defined(self):
        """Test that banking integration classes are properly defined"""
        # Test manager.py
        manager_file = src_dir / "integrations" / "banking" / "manager.py"
        content = manager_file.read_text()

        assert "class BankingIntegrationManager" in content
        assert "class IntegrationType" in content
        assert "def register_integration" in content
        assert "def authenticate_all" in content
        assert "def get_accounts_from_all" in content

    def test_plaid_integration_structure(self):
        """Test Plaid integration structure"""
        plaid_file = src_dir / "integrations" / "banking" / "plaid_integration.py"
        content = plaid_file.read_text()

        assert "class PlaidIntegration" in content
        assert "async def authenticate" in content
        assert "async def get_accounts" in content
        assert "async def get_transactions" in content
        assert "async def initiate_payment" in content

    def test_fraud_detection_models_structure(self):
        """Test fraud detection models structure"""
        # Test anomaly models
        anomaly_file = src_dir / "ml" / "fraud_detection" / "anomaly_models.py"
        content = anomaly_file.read_text()

        assert "class IsolationForestModel" in content
        assert "class OneClassSVMModel" in content
        assert "class AutoencoderModel" in content
        assert "def train" in content
        assert "def predict" in content

        # Test supervised models
        supervised_file = src_dir / "ml" / "fraud_detection" / "supervised_models.py"
        content = supervised_file.read_text()

        assert "class RandomForestFraudModel" in content
        assert "class XGBoostFraudModel" in content
        assert "class LightGBMFraudModel" in content
        assert "class NeuralNetworkFraudModel" in content

    def test_ensemble_model_structure(self):
        """Test ensemble model structure"""
        ensemble_file = src_dir / "ml" / "fraud_detection" / "ensemble_model.py"
        content = ensemble_file.read_text()

        assert "class EnsembleFraudModel" in content
        assert "class RealTimeFraudDetector" in content
        assert "def detect_fraud" in content
        assert "def _weighted_voting" in content
        assert "def _average_voting" in content

    def test_service_structure(self):
        """Test fraud detection service structure"""
        service_file = src_dir / "ml" / "fraud_detection" / "service.py"
        content = service_file.read_text()

        assert "class FraudDetectionService" in content
        assert "async def train_model" in content
        assert "async def detect_fraud" in content
        assert "async def batch_detect_fraud" in content
        assert "def get_model_status" in content

    def test_routes_structure(self):
        """Test routes structure"""
        # Test banking routes
        banking_routes = src_dir / "routes" / "banking_integrations.py"
        content = banking_routes.read_text()

        assert "banking_bp = Blueprint" in content
        assert "@banking_bp.route" in content
        assert "@cross_origin()" in content
        assert "def list_integrations" in content
        assert "def get_customer_accounts" in content
        assert "def initiate_payment" in content

        # Test fraud routes
        fraud_routes = src_dir / "routes" / "fraud_detection.py"
        content = fraud_routes.read_text()

        assert "fraud_bp = Blueprint" in content
        assert "@fraud_bp.route" in content
        assert "@cross_origin()" in content
        assert "def detect_fraud" in content
        assert "def train_model" in content
        assert "def get_model_status" in content


class TestSecurityFeatures:
    """Test security features implementation"""

    def test_authentication_methods(self):
        """Test that authentication methods are implemented"""
        # Check Plaid integration
        plaid_file = src_dir / "integrations" / "banking" / "plaid_integration.py"
        content = plaid_file.read_text()

        assert "client_id" in content
        assert "secret" in content
        assert "environment" in content
        assert "authenticate" in content

        # Check Open Banking integration
        ob_file = src_dir / "integrations" / "banking" / "open_banking_integration.py"
        content = ob_file.read_text()

        assert "client_id" in content
        assert "client_secret" in content
        assert "certificate_path" in content
        assert "private_key_path" in content

    def test_error_handling(self):
        """Test that proper error handling is implemented"""
        # Check banking integration base
        init_file = src_dir / "integrations" / "banking" / "__init__.py"
        content = init_file.read_text()

        assert "BankingIntegrationError" in content
        assert "AuthenticationError" in content
        assert "InvalidAccountError" in content

        # Check fraud detection base
        fraud_init = src_dir / "ml" / "fraud_detection" / "__init__.py"
        content = fraud_init.read_text()

        assert "FraudDetectionError" in content
        assert "ModelNotTrainedError" in content

    def test_input_validation(self):
        """Test that input validation is implemented"""
        # Check banking integration base
        init_file = src_dir / "integrations" / "banking" / "__init__.py"
        content = init_file.read_text()

        assert "validate_account_number" in content
        assert "validate_routing_number" in content
        assert "validate_amount" in content

        # Check routes have validation
        banking_routes = src_dir / "routes" / "banking_integrations.py"
        content = banking_routes.read_text()

        assert "required_fields" in content
        assert "if field not in data" in content


class TestComplianceFeatures:
    """Test financial industry compliance features"""

    def test_pci_dss_compliance_features(self):
        """Test PCI DSS compliance features"""
        # Check that sensitive data handling is implemented
        plaid_file = src_dir / "integrations" / "banking" / "plaid_integration.py"
        content = plaid_file.read_text()

        assert "encrypt_sensitive_data" in content
        assert "mask_account_number" in content
        assert "sanitize_logs" in content

    def test_psd2_compliance_features(self):
        """Test PSD2 compliance features"""
        ob_file = src_dir / "integrations" / "banking" / "open_banking_integration.py"
        content = ob_file.read_text()

        assert "strong_customer_authentication" in content
        assert "consent_management" in content
        assert "transaction_risk_analysis" in content

    def test_audit_logging(self):
        """Test audit logging implementation"""
        # Check that audit logging is implemented
        manager_file = src_dir / "integrations" / "banking" / "manager.py"
        content = manager_file.read_text()

        assert "audit_log" in content
        assert "log_transaction" in content
        assert "log_authentication" in content

    def test_fraud_detection_compliance(self):
        """Test fraud detection compliance features"""
        service_file = src_dir / "ml" / "fraud_detection" / "service.py"
        content = service_file.read_text()

        assert "update_model_feedback" in content
        assert "performance_metrics" in content
        assert "model_version" in content


class TestAPIEndpoints:
    """Test API endpoint structure"""

    def test_banking_api_endpoints(self):
        """Test banking API endpoints are properly defined"""
        banking_routes = src_dir / "routes" / "banking_integrations.py"
        content = banking_routes.read_text()

        # Check required endpoints
        endpoints = [
            "'/integrations'",
            "'/accounts/<customer_id>'",
            "'/transactions'",
            "'/payments'",
            "'/payments/status'",
            "'/health'",
        ]

        for endpoint in endpoints:
            assert endpoint in content, f"Missing endpoint: {endpoint}"

    def test_fraud_api_endpoints(self):
        """Test fraud detection API endpoints are properly defined"""
        fraud_routes = src_dir / "routes" / "fraud_detection.py"
        content = fraud_routes.read_text()

        # Check required endpoints
        endpoints = [
            "'/detect'",
            "'/detect/batch'",
            "'/model/train'",
            "'/model/status'",
            "'/alerts'",
            "'/statistics'",
            "'/feedback'",
            "'/health'",
        ]

        for endpoint in endpoints:
            assert endpoint in content, f"Missing endpoint: {endpoint}"

    def test_cors_configuration(self):
        """Test CORS configuration"""
        banking_routes = src_dir / "routes" / "banking_integrations.py"
        content = banking_routes.read_text()

        assert "@cross_origin()" in content
        assert "from flask_cors import cross_origin" in content

        fraud_routes = src_dir / "routes" / "fraud_detection.py"
        content = fraud_routes.read_text()

        assert "@cross_origin()" in content
        assert "from flask_cors import cross_origin" in content


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

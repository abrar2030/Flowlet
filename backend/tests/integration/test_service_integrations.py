import json
import os
import sys
from unittest.mock import patch

import pytest
from src.main import create_app
from src.models.database import db

# Comprehensive Test Suite for Flowlet Backend Services


# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


class TestConfig:
    """Test configuration"""

    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = "test-secret-key"
    WTF_CSRF_ENABLED = False
    REDIS_URL = "redis://localhost:6379/1"


@pytest.fixture
def app():
    """Create application for testing"""
    app = create_app("testing")
    app.config.from_object(TestConfig)

    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()


@pytest.fixture
def auth_headers():
    """Create authentication headers for testing"""
    return {"Authorization": "Bearer test-token", "Content-Type": "application/json"}


@pytest.fixture
def sample_user_data():
    """Sample user data for testing"""
    return {
        "email": "test@flowlet.com",
        "password": "SecurePassword123!",
        "first_name": "Test",
        "last_name": "User",
        "phone": "+1234567890",
    }


@pytest.fixture
def sample_wallet_data():
    """Sample wallet data for testing"""
    return {"currency": "USD", "initial_balance": 1000.00}


@pytest.fixture
def sample_transaction_data():
    """Sample transaction data for testing"""
    return {
        "amount": 100.00,
        "currency": "USD",
        "recipient_wallet_id": "wallet_123",
        "description": "Test payment",
    }


class TestHealthEndpoints:
    """Test health check and API info endpoints"""

    def test_health_check_success(self, client):
        """Test successful health check"""
        response = client.get("/health")
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert "version" in data
        assert "services" in data

    def test_api_info(self, client):
        """Test API information endpoint"""
        response = client.get("/api/v1/info")
        assert response.status_code == 200

        data = json.loads(response.data)
        assert data["api_name"] == "Flowlet Financial Backend - Enhanced MVP"
        assert data["version"] == "2.0.0"
        assert "endpoints" in data
        assert "security_features" in data


class TestAuthenticationIntegration:
    """Test authentication service integration"""

    def test_user_registration_success(self, client, sample_user_data):
        """Test successful user registration"""
        response = client.post(
            "/api/v1/auth/register",
            data=json.dumps(sample_user_data),
            content_type="application/json",
        )

        assert response.status_code == 201
        data = json.loads(response.data)
        assert "user_id" in data
        assert data["email"] == sample_user_data["email"]

    def test_user_registration_duplicate_email(self, client, sample_user_data):
        """Test registration with duplicate email"""
        # First registration
        client.post(
            "/api/v1/auth/register",
            data=json.dumps(sample_user_data),
            content_type="application/json",
        )

        # Second registration with same email
        response = client.post(
            "/api/v1/auth/register",
            data=json.dumps(sample_user_data),
            content_type="application/json",
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data

    def test_user_login_success(self, client, sample_user_data):
        """Test successful user login"""
        # Register user first
        client.post(
            "/api/v1/auth/register",
            data=json.dumps(sample_user_data),
            content_type="application/json",
        )

        # Login
        login_data = {
            "email": sample_user_data["email"],
            "password": sample_user_data["password"],
        }
        response = client.post(
            "/api/v1/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert "access_token" in data
        assert "refresh_token" in data

    def test_user_login_invalid_credentials(self, client):
        """Test login with invalid credentials"""
        login_data = {"email": "nonexistent@flowlet.com", "password": "wrongpassword"}
        response = client.post(
            "/api/v1/auth/login",
            data=json.dumps(login_data),
            content_type="application/json",
        )

        assert response.status_code == 401
        data = json.loads(response.data)
        assert data["error"] == "Unauthorized"


class TestWalletServiceIntegration:
    """Test wallet service integration"""

    def test_wallet_creation_success(self, client, auth_headers, sample_wallet_data):
        """Test successful wallet creation"""
        response = client.post(
            "/api/v1/wallet/create",
            data=json.dumps(sample_wallet_data),
            headers=auth_headers,
        )

        assert response.status_code == 201
        data = json.loads(response.data)
        assert "wallet_id" in data
        assert data["currency"] == sample_wallet_data["currency"]
        assert data["balance"] == sample_wallet_data["initial_balance"]

    def test_wallet_balance_inquiry(self, client, auth_headers):
        """Test wallet balance inquiry"""
        # Create wallet first
        wallet_data = {"currency": "USD", "initial_balance": 500.00}
        create_response = client.post(
            "/api/v1/wallet/create", data=json.dumps(wallet_data), headers=auth_headers
        )
        wallet_id = json.loads(create_response.data)["wallet_id"]

        # Check balance
        response = client.get(
            f"/api/v1/wallet/{wallet_id}/balance", headers=auth_headers
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["balance"] == 500.00
        assert data["currency"] == "USD"

    def test_wallet_deposit_success(self, client, auth_headers):
        """Test successful wallet deposit"""
        # Create wallet first
        wallet_data = {"currency": "USD", "initial_balance": 100.00}
        create_response = client.post(
            "/api/v1/wallet/create", data=json.dumps(wallet_data), headers=auth_headers
        )
        wallet_id = json.loads(create_response.data)["wallet_id"]

        # Deposit funds
        deposit_data = {"amount": 200.00, "description": "Test deposit"}
        response = client.post(
            f"/api/v1/wallet/{wallet_id}/deposit",
            data=json.dumps(deposit_data),
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["new_balance"] == 300.00
        assert "transaction_id" in data

    def test_wallet_withdrawal_success(self, client, auth_headers):
        """Test successful wallet withdrawal"""
        # Create wallet with sufficient balance
        wallet_data = {"currency": "USD", "initial_balance": 500.00}
        create_response = client.post(
            "/api/v1/wallet/create", data=json.dumps(wallet_data), headers=auth_headers
        )
        wallet_id = json.loads(create_response.data)["wallet_id"]

        # Withdraw funds
        withdrawal_data = {"amount": 100.00, "description": "Test withdrawal"}
        response = client.post(
            f"/api/v1/wallet/{wallet_id}/withdraw",
            data=json.dumps(withdrawal_data),
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["new_balance"] == 400.00
        assert "transaction_id" in data

    def test_wallet_withdrawal_insufficient_funds(self, client, auth_headers):
        """Test withdrawal with insufficient funds"""
        # Create wallet with low balance
        wallet_data = {"currency": "USD", "initial_balance": 50.00}
        create_response = client.post(
            "/api/v1/wallet/create", data=json.dumps(wallet_data), headers=auth_headers
        )
        wallet_id = json.loads(create_response.data)["wallet_id"]

        # Attempt to withdraw more than available
        withdrawal_data = {"amount": 100.00, "description": "Test withdrawal"}
        response = client.post(
            f"/api/v1/wallet/{wallet_id}/withdraw",
            data=json.dumps(withdrawal_data),
            headers=auth_headers,
        )

        assert response.status_code == 400
        data = json.loads(response.data)
        assert "insufficient funds" in data["error"].lower()


class TestPaymentServiceIntegration:
    """Test payment service integration"""

    def test_p2p_payment_success(self, client, auth_headers):
        """Test successful peer-to-peer payment"""
        # Create sender wallet
        sender_wallet_data = {"currency": "USD", "initial_balance": 500.00}
        sender_response = client.post(
            "/api/v1/wallet/create",
            data=json.dumps(sender_wallet_data),
            headers=auth_headers,
        )
        sender_wallet_id = json.loads(sender_response.data)["wallet_id"]

        # Create recipient wallet
        recipient_wallet_data = {"currency": "USD", "initial_balance": 100.00}
        recipient_response = client.post(
            "/api/v1/wallet/create",
            data=json.dumps(recipient_wallet_data),
            headers=auth_headers,
        )
        recipient_wallet_id = json.loads(recipient_response.data)["wallet_id"]

        # Send payment
        payment_data = {
            "amount": 150.00,
            "recipient_wallet_id": recipient_wallet_id,
            "description": "Test P2P payment",
        }
        response = client.post(
            f"/api/v1/payment/{sender_wallet_id}/send",
            data=json.dumps(payment_data),
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert "transaction_id" in data
        assert data["amount"] == 150.00
        assert data["status"] == "completed"

    def test_payment_invalid_recipient(self, client, auth_headers):
        """Test payment to invalid recipient"""
        # Create sender wallet
        sender_wallet_data = {"currency": "USD", "initial_balance": 500.00}
        sender_response = client.post(
            "/api/v1/wallet/create",
            data=json.dumps(sender_wallet_data),
            headers=auth_headers,
        )
        sender_wallet_id = json.loads(sender_response.data)["wallet_id"]

        # Send payment to non-existent wallet
        payment_data = {
            "amount": 100.00,
            "recipient_wallet_id": "invalid_wallet_id",
            "description": "Test payment",
        }
        response = client.post(
            f"/api/v1/payment/{sender_wallet_id}/send",
            data=json.dumps(payment_data),
            headers=auth_headers,
        )

        assert response.status_code == 404
        data = json.loads(response.data)
        assert "not found" in data["error"].lower()


class TestCardServiceIntegration:
    """Test card service integration"""

    def test_card_issuance_success(self, client, auth_headers):
        """Test successful card issuance"""
        # Create wallet first
        wallet_data = {"currency": "USD", "initial_balance": 1000.00}
        wallet_response = client.post(
            "/api/v1/wallet/create", data=json.dumps(wallet_data), headers=auth_headers
        )
        wallet_id = json.loads(wallet_response.data)["wallet_id"]

        # Issue card
        card_data = {
            "wallet_id": wallet_id,
            "card_type": "virtual",
            "spending_limit": 500.00,
        }
        response = client.post(
            "/api/v1/card/issue", data=json.dumps(card_data), headers=auth_headers
        )

        assert response.status_code == 201
        data = json.loads(response.data)
        assert "card_id" in data
        assert data["card_type"] == "virtual"
        assert data["spending_limit"] == 500.00

    def test_card_transaction_success(self, client, auth_headers):
        """Test successful card transaction"""
        # Create wallet and card
        wallet_data = {"currency": "USD", "initial_balance": 1000.00}
        wallet_response = client.post(
            "/api/v1/wallet/create", data=json.dumps(wallet_data), headers=auth_headers
        )
        wallet_id = json.loads(wallet_response.data)["wallet_id"]

        card_data = {
            "wallet_id": wallet_id,
            "card_type": "virtual",
            "spending_limit": 500.00,
        }
        card_response = client.post(
            "/api/v1/card/issue", data=json.dumps(card_data), headers=auth_headers
        )
        card_id = json.loads(card_response.data)["card_id"]

        # Process card transaction
        transaction_data = {
            "amount": 50.00,
            "merchant": "Test Merchant",
            "description": "Test purchase",
        }
        response = client.post(
            f"/api/v1/card/{card_id}/transaction",
            data=json.dumps(transaction_data),
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert "transaction_id" in data
        assert data["amount"] == 50.00
        assert data["status"] == "approved"


class TestBankingIntegration:
    """Test banking service integrations"""

    @patch("src.integrations.banking.plaid_integration.PlaidClient")
    def test_plaid_account_linking(self, mock_plaid, client, auth_headers):
        """Test Plaid account linking integration"""
        mock_plaid.return_value.link_account.return_value = {
            "account_id": "plaid_account_123",
            "account_name": "Test Checking",
            "account_type": "depository",
            "balance": 2500.00,
        }

        link_data = {
            "public_token": "public-sandbox-token",
            "account_id": "account_123",
        }
        response = client.post(
            "/api/v1/banking/plaid/link",
            data=json.dumps(link_data),
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert "account_id" in data
        assert data["account_name"] == "Test Checking"

    @patch("src.integrations.banking.open_banking_integration.OpenBankingClient")
    def test_open_banking_balance_check(self, mock_ob, client, auth_headers):
        """Test Open Banking balance check integration"""
        mock_ob.return_value.get_balance.return_value = {
            "account_id": "ob_account_456",
            "available_balance": 1500.00,
            "current_balance": 1750.00,
            "currency": "USD",
        }

        response = client.get(
            "/api/v1/banking/open-banking/balance/ob_account_456", headers=auth_headers
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["available_balance"] == 1500.00
        assert data["currency"] == "USD"


class TestFraudDetectionIntegration:
    """Test fraud detection service integration"""

    @patch("src.ml.fraud_detection.service.FraudDetectionService")
    def test_transaction_fraud_check(self, mock_fraud_service, client, auth_headers):
        """Test transaction fraud detection"""
        mock_fraud_service.return_value.analyze_transaction.return_value = {
            "risk_score": 0.15,
            "risk_level": "low",
            "flags": [],
            "approved": True,
        }

        transaction_data = {
            "amount": 100.00,
            "merchant": "Test Store",
            "location": "New York, NY",
            "card_id": "card_123",
        }
        response = client.post(
            "/api/v1/fraud/analyze",
            data=json.dumps(transaction_data),
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["risk_level"] == "low"
        assert data["approved"] is True

    @patch("src.ml.fraud_detection.service.FraudDetectionService")
    def test_high_risk_transaction_blocking(
        self, mock_fraud_service, client, auth_headers
    ):
        """Test high-risk transaction blocking"""
        mock_fraud_service.return_value.analyze_transaction.return_value = {
            "risk_score": 0.95,
            "risk_level": "high",
            "flags": ["unusual_amount", "suspicious_location"],
            "approved": False,
        }

        transaction_data = {
            "amount": 5000.00,
            "merchant": "Suspicious Merchant",
            "location": "Unknown Location",
            "card_id": "card_123",
        }
        response = client.post(
            "/api/v1/fraud/analyze",
            data=json.dumps(transaction_data),
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["risk_level"] == "high"
        assert data["approved"] is False
        assert "unusual_amount" in data["flags"]


class TestComplianceIntegration:
    """Test compliance service integration"""

    @patch("src.services.compliance.sanctions_screening.SanctionsScreeningService")
    def test_sanctions_screening(self, mock_sanctions, client, auth_headers):
        """Test sanctions screening integration"""
        mock_sanctions.return_value.screen_entity.return_value = {
            "entity_id": "user_123",
            "screening_result": "clear",
            "matches": [],
            "risk_level": "low",
        }

        screening_data = {
            "entity_type": "individual",
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": "1990-01-01",
            "country": "US",
        }
        response = client.post(
            "/api/v1/compliance/sanctions/screen",
            data=json.dumps(screening_data),
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["screening_result"] == "clear"
        assert data["risk_level"] == "low"


class TestKYCAMLIntegration:
    """Test KYC/AML service integration"""

    def test_kyc_document_upload(self, client, auth_headers):
        """Test KYC document upload"""
        # Simulate file upload
        document_data = {
            "document_type": "passport",
            "document_number": "P123456789",
            "expiry_date": "2030-12-31",
            "issuing_country": "US",
        }
        response = client.post(
            "/api/v1/kyc/document/upload",
            data=json.dumps(document_data),
            headers=auth_headers,
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert "document_id" in data
        assert data["status"] == "pending_verification"

    def test_aml_risk_assessment(self, client, auth_headers):
        """Test AML risk assessment"""
        assessment_data = {
            "customer_id": "customer_123",
            "transaction_amount": 10000.00,
            "transaction_type": "wire_transfer",
            "source_country": "US",
            "destination_country": "CA",
        }
        response = client.post(
            "/api/v1/aml/assess", data=json.dumps(assessment_data), headers=auth_headers
        )

        assert response.status_code == 200
        data = json.loads(response.data)
        assert "risk_score" in data
        assert "risk_level" in data
        assert data["risk_level"] in ["low", "medium", "high"]


class TestSecurityIntegration:
    """Test security service integration"""

    def test_rate_limiting(self, client):
        """Test rate limiting functionality"""
        # Make multiple requests to trigger rate limiting
        for i in range(105):  # Exceed the 100 per minute limit
            response = client.get("/api/v1/info")
            if i < 100:
                assert response.status_code == 200
            else:
                assert response.status_code == 429

    def test_security_headers(self, client):
        """Test security headers are present"""
        response = client.get("/api/v1/info")

        assert "X-Content-Type-Options" in response.headers
        assert "X-Frame-Options" in response.headers
        assert "X-XSS-Protection" in response.headers
        assert "Content-Security-Policy" in response.headers
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["X-Frame-Options"] == "DENY"


class TestPerformanceIntegration:
    """Test performance and monitoring integration"""

    def test_response_time_monitoring(self, client):
        """Test response time is within acceptable limits"""
        import time

        start_time = time.time()
        response = client.get("/health")
        end_time = time.time()

        response_time = end_time - start_time
        assert response_time < 1.0  # Response should be under 1 second
        assert response.status_code == 200

    def test_concurrent_requests_handling(self, client):
        """Test handling of concurrent requests"""
        import threading

        results = []

        def make_request():
            response = client.get("/api/v1/info")
            results.append(response.status_code)

        # Create 10 concurrent threads
        threads = []
        for i in range(10):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # All requests should succeed
        assert len(results) == 10
        assert all(status == 200 for status in results)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

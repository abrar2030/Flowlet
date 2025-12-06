import os
import sys
from unittest.mock import Mock, patch
import pytest
from src.integrations.banking.fdx_integration import FDXIntegration
from src.integrations.banking.open_banking_integration import OpenBankingIntegration
from src.integrations.banking.plaid_integration import PlaidIntegration
from src.ml.fraud_detection.service import FraudDetectionService
from src.services.compliance.sanctions_screening import SanctionsScreeningService

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))


class TestExternalAPIIntegrations:
    """Test external API integrations with proper mocking"""

    @pytest.fixture
    def mock_plaid_client(self) -> Any:
        """Mock Plaid client for testing"""
        with patch("plaid.api.plaid_api.PlaidApi") as mock:
            yield mock

    @pytest.fixture
    def mock_requests(self) -> Any:
        """Mock requests for external API calls"""
        with patch("requests.post") as mock_post, patch("requests.get") as mock_get:
            yield {"post": mock_post, "get": mock_get}

    def test_plaid_link_token_creation(self, mock_plaid_client: Any) -> Any:
        """Test Plaid link token creation"""
        mock_response = Mock()
        mock_response.link_token = "link-sandbox-token-123"
        mock_plaid_client.return_value.link_token_create.return_value = mock_response
        plaid_integration = PlaidIntegration()
        result = plaid_integration.create_link_token("user_123")
        assert result["link_token"] == "link-sandbox-token-123"
        assert result["status"] == "success"

    def test_plaid_account_balance_retrieval(self, mock_plaid_client: Any) -> Any:
        """Test Plaid account balance retrieval"""
        mock_response = Mock()
        mock_response.accounts = [
            Mock(
                account_id="account_123",
                name="Test Checking",
                balances=Mock(
                    available=1500.0, current=1750.0, iso_currency_code="USD"
                ),
            )
        ]
        mock_plaid_client.return_value.accounts_balance_get.return_value = mock_response
        plaid_integration = PlaidIntegration()
        result = plaid_integration.get_account_balance("access_token_123")
        assert len(result["accounts"]) == 1
        assert result["accounts"][0]["available_balance"] == 1500.0
        assert result["accounts"][0]["currency"] == "USD"

    def test_open_banking_account_info(self, mock_requests: Any) -> Any:
        """Test Open Banking account information retrieval"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "Data": {
                "Account": [
                    {
                        "AccountId": "ob_account_456",
                        "Nickname": "Personal Account",
                        "Currency": "USD",
                        "AccountType": "Personal",
                        "AccountSubType": "CurrentAccount",
                    }
                ]
            }
        }
        mock_requests["get"].return_value = mock_response
        ob_integration = OpenBankingIntegration()
        result = ob_integration.get_account_info("access_token_456")
        assert result["status"] == "success"
        assert len(result["accounts"]) == 1
        assert result["accounts"][0]["account_id"] == "ob_account_456"

    def test_fdx_transaction_history(self, mock_requests: Any) -> Any:
        """Test FDX transaction history retrieval"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "transactions": [
                {
                    "transactionId": "txn_123",
                    "amount": -50.0,
                    "description": "Coffee Shop Purchase",
                    "postedTimestamp": "2024-01-15T10:30:00Z",
                    "transactionType": "DEBIT",
                },
                {
                    "transactionId": "txn_124",
                    "amount": 1000.0,
                    "description": "Salary Deposit",
                    "postedTimestamp": "2024-01-14T09:00:00Z",
                    "transactionType": "CREDIT",
                },
            ]
        }
        mock_requests["get"].return_value = mock_response
        fdx_integration = FDXIntegration()
        result = fdx_integration.get_transaction_history("account_789", days=30)
        assert result["status"] == "success"
        assert len(result["transactions"]) == 2
        assert result["transactions"][0]["amount"] == -50.0


class TestFraudDetectionIntegration:
    """Test fraud detection ML service integration"""

    @pytest.fixture
    def fraud_service(self) -> Any:
        """Create fraud detection service instance"""
        return FraudDetectionService()

    def test_transaction_risk_scoring(self, fraud_service: Any) -> Any:
        """Test transaction risk scoring"""
        transaction_data = {
            "amount": 100.0,
            "merchant_category": "grocery",
            "location": "New York, NY",
            "time_of_day": 14,
            "day_of_week": 2,
            "user_id": "user_123",
            "card_id": "card_456",
        }
        result = fraud_service.analyze_transaction(transaction_data)
        assert "risk_score" in result
        assert "risk_level" in result
        assert "flags" in result
        assert 0 <= result["risk_score"] <= 1
        assert result["risk_level"] in ["low", "medium", "high"]

    def test_anomaly_detection(self, fraud_service: Any) -> Any:
        """Test anomaly detection for unusual patterns"""
        unusual_transaction = {
            "amount": 5000.0,
            "merchant_category": "cash_advance",
            "location": "Unknown Location",
            "time_of_day": 3,
            "day_of_week": 0,
            "user_id": "user_123",
            "card_id": "card_456",
        }
        result = fraud_service.detect_anomalies(unusual_transaction)
        assert result["is_anomaly"] is True
        assert "anomaly_score" in result
        assert result["anomaly_score"] > 0.7

    def test_velocity_checking(self, fraud_service: Any) -> Any:
        """Test velocity checking for rapid transactions"""
        transactions = [
            {"amount": 100.0, "timestamp": "2024-01-15T10:00:00Z"},
            {"amount": 150.0, "timestamp": "2024-01-15T10:05:00Z"},
            {"amount": 200.0, "timestamp": "2024-01-15T10:10:00Z"},
            {"amount": 250.0, "timestamp": "2024-01-15T10:15:00Z"},
        ]
        result = fraud_service.check_velocity("user_123", transactions)
        assert "velocity_risk" in result
        assert "transaction_count" in result
        assert "total_amount" in result
        assert result["transaction_count"] == 4
        assert result["total_amount"] == 700.0


class TestComplianceIntegration:
    """Test compliance service integrations"""

    @pytest.fixture
    def sanctions_service(self) -> Any:
        """Create sanctions screening service instance"""
        return SanctionsScreeningService()

    @patch("requests.post")
    def test_sanctions_screening_clear(
        self, mock_post: Any, sanctions_service: Any
    ) -> Any:
        """Test sanctions screening with clear result"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "screening_id": "screen_123",
            "status": "completed",
            "result": "clear",
            "matches": [],
            "risk_score": 0.1,
        }
        mock_post.return_value = mock_response
        entity_data = {
            "type": "individual",
            "first_name": "John",
            "last_name": "Smith",
            "date_of_birth": "1985-06-15",
            "nationality": "US",
        }
        result = sanctions_service.screen_entity(entity_data)
        assert result["status"] == "clear"
        assert len(result["matches"]) == 0
        assert result["risk_score"] < 0.3

    @patch("requests.post")
    def test_sanctions_screening_match(
        self, mock_post: Any, sanctions_service: Any
    ) -> Any:
        """Test sanctions screening with potential match"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "screening_id": "screen_124",
            "status": "completed",
            "result": "potential_match",
            "matches": [
                {
                    "list_name": "OFAC SDN",
                    "match_score": 0.85,
                    "entity_name": "John Smith",
                    "entity_type": "individual",
                }
            ],
            "risk_score": 0.85,
        }
        mock_post.return_value = mock_response
        entity_data = {
            "type": "individual",
            "first_name": "John",
            "last_name": "Smith",
            "date_of_birth": "1975-03-20",
            "nationality": "Unknown",
        }
        result = sanctions_service.screen_entity(entity_data)
        assert result["status"] == "potential_match"
        assert len(result["matches"]) == 1
        assert result["risk_score"] > 0.8


class TestPaymentProcessorIntegration:
    """Test payment processor integrations"""

    @patch("stripe.PaymentIntent.create")
    def test_stripe_payment_processing(self, mock_stripe_create: Any) -> Any:
        """Test Stripe payment processing integration"""
        mock_payment_intent = Mock()
        mock_payment_intent.id = "pi_test_123"
        mock_payment_intent.status = "succeeded"
        mock_payment_intent.amount = 10000
        mock_payment_intent.currency = "usd"
        mock_stripe_create.return_value = mock_payment_intent
        from src.integrations.payments.stripe_integration import StripeIntegration

        stripe_integration = StripeIntegration()
        payment_data = {
            "amount": 100.0,
            "currency": "USD",
            "payment_method": "pm_test_card",
            "description": "Test payment",
        }
        result = stripe_integration.process_payment(payment_data)
        assert result["status"] == "succeeded"
        assert result["payment_intent_id"] == "pi_test_123"
        assert result["amount"] == 100.0

    @patch("requests.post")
    def test_ach_payment_processing(self, mock_post: Any) -> Any:
        """Test ACH payment processing integration"""
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "transaction_id": "ach_txn_456",
            "status": "pending",
            "amount": 250.0,
            "currency": "USD",
            "estimated_settlement": "2024-01-17",
        }
        mock_post.return_value = mock_response
        from src.integrations.payments.ach_integration import ACHIntegration

        ach_integration = ACHIntegration()
        payment_data = {
            "amount": 250.0,
            "source_account": "account_123",
            "destination_account": "account_456",
            "description": "ACH transfer",
        }
        result = ach_integration.process_transfer(payment_data)
        assert result["status"] == "pending"
        assert result["transaction_id"] == "ach_txn_456"
        assert result["amount"] == 250.0


class TestNotificationIntegration:
    """Test notification service integrations"""

    @patch("twilio.rest.Client")
    def test_sms_notification(self, mock_twilio: Any) -> Any:
        """Test SMS notification integration"""
        mock_message = Mock()
        mock_message.sid = "SM123456789"
        mock_message.status = "sent"
        mock_twilio.return_value.messages.create.return_value = mock_message
        from src.integrations.notifications.sms_service import SMSService

        sms_service = SMSService()
        result = sms_service.send_sms(
            to_number="+1234567890",
            message="Your transaction of $100.00 has been processed.",
        )
        assert result["status"] == "sent"
        assert result["message_id"] == "SM123456789"

    @patch("sendgrid.SendGridAPIClient")
    def test_email_notification(self, mock_sendgrid: Any) -> Any:
        """Test email notification integration"""
        mock_response = Mock()
        mock_response.status_code = 202
        mock_sendgrid.return_value.send.return_value = mock_response
        from src.integrations.notifications.email_service import EmailService

        email_service = EmailService()
        result = email_service.send_email(
            to_email="user@example.com",
            subject="Transaction Confirmation",
            content="Your payment has been processed successfully.",
        )
        assert result["status"] == "sent"
        assert result["status_code"] == 202


class TestDatabaseIntegration:
    """Test database integration and performance"""

    def test_database_connection_pool(self) -> Any:
        """Test database connection pooling"""
        from sqlalchemy import text
        from src.models.database import db

        connections = []
        for i in range(10):
            conn = db.engine.connect()
            result = conn.execute(text("SELECT 1"))
            assert result.fetchone()[0] == 1
            connections.append(conn)
        for conn in connections:
            conn.close()

    def test_database_transaction_rollback(self) -> Any:
        """Test database transaction rollback functionality"""
        from src.models.database import db
        from src.models.user import User

        try:
            with db.session.begin():
                user = User(
                    email="test@rollback.com", first_name="Test", last_name="User"
                )
                db.session.add(user)
                db.session.flush()
                raise Exception("Simulated error")
        except Exception:
            pass
        user = User.query.filter_by(email="test@rollback.com").first()
        assert user is None


class TestCacheIntegration:
    """Test cache integration (Redis)"""

    @patch("redis.Redis")
    def test_redis_cache_operations(self, mock_redis: Any) -> Any:
        """Test Redis cache operations"""
        mock_redis_client = Mock()
        mock_redis.return_value = mock_redis_client
        mock_redis_client.get.return_value = None
        mock_redis_client.set.return_value = True
        mock_redis_client.delete.return_value = 1
        from src.services.cache.redis_service import RedisService

        cache_service = RedisService()
        result = cache_service.set("test_key", "test_value", ttl=300)
        assert result is True
        mock_redis_client.get.return_value = "test_value"
        result = cache_service.get("test_key")
        assert result == "test_value"
        result = cache_service.delete("test_key")
        assert result is True


class TestMonitoringIntegration:
    """Test monitoring and logging integration"""

    def test_application_metrics_collection(self) -> Any:
        """Test application metrics collection"""
        from src.services.monitoring.metrics_service import MetricsService

        metrics_service = MetricsService()
        metrics_service.increment_counter(
            "api_requests_total", tags={"endpoint": "/health"}
        )
        metrics_service.record_histogram("request_duration_seconds", 0.15)
        metrics_service.set_gauge("active_connections", 25)
        metrics = metrics_service.get_metrics()
        assert "api_requests_total" in metrics
        assert "request_duration_seconds" in metrics
        assert "active_connections" in metrics

    def test_error_logging_integration(self) -> Any:
        """Test error logging integration"""
        from src.services.monitoring.error_tracking import ErrorTracker

        error_tracker = ErrorTracker()
        try:
            raise ValueError("Test error for logging")
        except Exception as e:
            error_tracker.log_error(e, context={"user_id": "user_123"})
        assert error_tracker.get_error_count() > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

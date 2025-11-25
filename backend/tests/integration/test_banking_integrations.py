from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from src.integrations.banking import BankAccount  # Banking Integration Tests
from src.integrations.banking import (BankingIntegrationManager,
                                      FDXIntegration, IntegrationType,
                                      OpenBankingIntegration, PaymentRequest,
                                      PlaidIntegration, Transaction,
                                      TransactionStatus, TransactionType)


class TestBankingIntegrations:
    """Test suite for banking integrations"""

    @pytest.fixture
    def sample_config(self):
        return {
            "client_id": "test_client_id",
            "secret": "test_secret",
            "environment": "sandbox",
            "base_url": "https://api.test.com",
        }

    @pytest.fixture
    def sample_account(self):
        return BankAccount(
            account_id="acc_123",
            account_number="1234567890",
            routing_number="123456789",
            account_type="checking",
            bank_name="Test Bank",
            currency="USD",
            balance=1000.0,
            available_balance=950.0,
            account_holder_name="John Doe",
        )

    @pytest.fixture
    def sample_transaction(self):
        return Transaction(
            transaction_id="txn_123",
            account_id="acc_123",
            amount=100.0,
            currency="USD",
            transaction_type=TransactionType.DEBIT,
            status=TransactionStatus.COMPLETED,
            description="Test transaction",
            timestamp=datetime.now(),
            counterparty_name="Test Merchant",
        )

    @pytest.fixture
    def sample_payment_request(self):
        return PaymentRequest(
            amount=100.0,
            currency="USD",
            from_account="acc_123",
            to_account="acc_456",
            description="Test payment",
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

        manager.register_integration("test_plaid", IntegrationType.PLAID, sample_config)

        assert "test_plaid" in manager.integrations
        assert isinstance(manager.integrations["test_plaid"], PlaidIntegration)

    def test_register_open_banking_integration(self, sample_config):
        """Test registering Open Banking integration"""
        manager = BankingIntegrationManager()

        manager.register_integration(
            "test_open_banking", IntegrationType.OPEN_BANKING, sample_config
        )

        assert "test_open_banking" in manager.integrations
        assert isinstance(
            manager.integrations["test_open_banking"], OpenBankingIntegration
        )

    def test_register_fdx_integration(self, sample_config):
        """Test registering FDX integration"""
        manager = BankingIntegrationManager()

        manager.register_integration("test_fdx", IntegrationType.FDX, sample_config)

        assert "test_fdx" in manager.integrations
        assert isinstance(manager.integrations["test_fdx"], FDXIntegration)

    def test_get_integration_health(self, sample_config):
        """Test getting integration health status"""
        manager = BankingIntegrationManager()

        manager.register_integration("test_plaid", IntegrationType.PLAID, sample_config)

        health = manager.get_integration_health()
        assert "test_plaid" in health
        assert "authenticated" in health["test_plaid"]
        assert "type" in health["test_plaid"]

    @pytest.mark.asyncio
    async def test_plaid_authentication_mock(self, sample_config):
        """Test Plaid authentication with mocking"""
        plaid = PlaidIntegration(sample_config)

        # Mock the HTTP session
        with patch("aiohttp.ClientSession") as mock_session:
            mock_response = AsyncMock()
            mock_response.status = 200
            mock_response.json = AsyncMock(return_value={"link_token": "test_token"})

            mock_session.return_value.__aenter__.return_value.post.return_value.__aenter__.return_value = (
                mock_response
            )

            result = await plaid.authenticate()
            assert result is True
            assert plaid._authenticated is True

    def test_account_validation(self):
        """Test account number validation"""
        from src.integrations.banking import BankingIntegrationBase

        base = BankingIntegrationBase({})

        # Valid account numbers
        assert base.validate_account_number("12345678") is True
        assert base.validate_account_number("123456789012") is True

        # Invalid account numbers
        assert base.validate_account_number("1234567") is False  # Too short
        assert base.validate_account_number("12345abc") is False  # Contains letters

    def test_routing_number_validation(self):
        """Test routing number validation"""
        from src.integrations.banking import BankingIntegrationBase

        base = BankingIntegrationBase({})

        # Valid routing numbers
        assert base.validate_routing_number("123456789") is True

        # Invalid routing numbers
        assert base.validate_routing_number("12345678") is False  # Too short
        assert base.validate_routing_number("1234567890") is False  # Too long
        assert base.validate_routing_number("12345abc9") is False  # Contains letters

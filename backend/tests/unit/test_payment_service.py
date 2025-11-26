import unittest
from unittest.mock import patch, MagicMock
from decimal import Decimal
import os
import stripe


# Set up mock environment variables for Stripe key
os.environ["STRIPE_SECRET_KEY"] = "sk_test_mock_key"

# Import the modules to be tested
from src.clients.stripe_client import StripeClient
from src.services.payment_service import process_external_payment
from src.services.payment_service_errors import (
    PaymentProcessorError,
    AccountAccessDenied,
)
from src.schemas import ProcessPaymentRequest


# Mock database models and session
class MockAccount:
    def __init__(self, id, user_id, balance, status, currency):
        self.id = id
        self.user_id = user_id
        self.balance = Decimal(str(balance))
        self.status = status
        self.currency = currency

    def credit(self, amount):
        self.balance += amount

    def can_debit(self, amount):
        return self.balance >= amount


class MockTransaction:
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)
        self.id = "mock_txn_id"


class MockDBSession:
    def __init__(self, accounts=None):
        self.accounts = accounts or {}
        self.committed = False
        self.rolledback = False

    def get(self, model, id):
        if model.__name__ == "Account":
            return self.accounts.get(id)
        return None

    def add(self, obj):
        pass

    def commit(self):
        self.committed = True

    def rollback(self):
        self.rolledback = True


# Mocking the models used in payment_service.py
# This is necessary because the test environment doesn't have the full Flask/SQLAlchemy setup
class MockModels:
    class Account:
        def __init__(self, id, user_id, balance, status, currency):
            self.id = id
            self.user_id = user_id
            self.balance = Decimal(str(balance))
            self.status = status
            self.currency = currency

        def credit(self, amount):
            self.balance += amount

        def can_debit(self, amount):
            return self.balance >= amount

    class Transaction:
        def __init__(self, **kwargs):
            self.__dict__.update(kwargs)
            self.id = "mock_txn_id"

    class AccountStatus:
        ACTIVE = "active"

    class TransactionStatus:
        COMPLETED = "completed"

    class TransactionType:
        CREDIT = "credit"

    class TransactionCategory:
        PAYMENT = "payment"


# Patch the imports in payment_service to use the mock models
@patch("src.services.payment_service.Account", MockModels.Account)
@patch("src.services.payment_service.Transaction", MockModels.Transaction)
@patch("src.services.payment_service.AccountStatus", MockModels.AccountStatus)
@patch("src.services.payment_service.TransactionStatus", MockModels.TransactionStatus)
@patch(
    "src.services.payment_service.TransactionCategory", MockModels.TransactionCategory
)
class TestPaymentService(unittest.TestCase):

    def setUp(self):
        self.user_id = "user_123"
        self.account_id = "acc_456"
        self.mock_account = MockAccount(
            id=self.account_id,
            user_id=self.user_id,
            balance=Decimal("100.00"),
            status=MockModels.AccountStatus.ACTIVE,
            currency="USD",
        )
        self.mock_session = MockDBSession(accounts={self.account_id: self.mock_account})
        self.payment_data = ProcessPaymentRequest(
            account_id=self.account_id,
            amount=Decimal("50.00"),
            currency="USD",
            payment_method="stripe",
            payment_details={"token": "tok_visa"},
            description="Test Deposit",
        )

    @patch("src.clients.stripe_client.stripe.Charge.create")
    def test_process_external_payment_success(self, mock_stripe_create):
        # Simulate a successful Stripe charge
        mock_stripe_create.return_value = MagicMock(
            id="ch_success_123",
            status="succeeded",
            to_dict=lambda: {"id": "ch_success_123", "status": "succeeded"},
        )

        # Re-initialize StripeClient to ensure mock key is used and not a real API call
        StripeClient()

        result = process_external_payment(
            self.mock_session, self.user_id, self.payment_data
        )

        self.assertTrue(self.mock_session.committed)
        self.assertEqual(result["status"], "success")
        self.assertEqual(self.mock_account.balance, Decimal("150.00"))
        mock_stripe_create.assert_called_once()

    @patch("src.clients.stripe_client.stripe.Charge.create")
    def test_process_external_payment_stripe_card_error(self, mock_stripe_create):
        # Simulate a Stripe stripe.error.CardError
        mock_stripe_create.side_effect = stripe.error.CardError(
            message="Your card was declined.",
            param="source",
            code="card_declined",
            http_status=400,
            json_body={"error": {"message": "Your card was declined."}},
        )

        # Re-initialize StripeClient
        StripeClient()

        with self.assertRaisesRegex(
            PaymentProcessorError, "Payment failed: Your card was declined."
        ):
            process_external_payment(self.mock_session, self.user_id, self.payment_data)

        self.assertTrue(self.mock_session.rolledback)
        self.assertEqual(
            self.mock_account.balance, Decimal("100.00")
        )  # Balance should not change

    @patch("src.clients.stripe_client.stripe.Charge.create")
    def test_process_external_payment_stripe_api_error(self, mock_stripe_create):
        # Simulate a general Stripe API error (e.g., authentication failure)
        mock_stripe_create.side_effect = stripe.error.StripeError(
            message="Invalid API Key provided.",
            http_status=500,
            json_body={"error": {"message": "Invalid API Key provided."}},
        )

        # Re-initialize StripeClient
        StripeClient()

        with self.assertRaisesRegex(
            PaymentProcessorError, "Stripe processing error: Invalid API Key provided."
        ):
            process_external_payment(self.mock_session, self.user_id, self.payment_data)

        self.assertTrue(self.mock_session.rolledback)
        self.assertEqual(self.mock_account.balance, Decimal("100.00"))

    def test_process_external_payment_account_access_denied(self):
        # Test with a different user ID
        with self.assertRaises(AccountAccessDenied):
            process_external_payment(
                self.mock_session, "another_user", self.payment_data
            )

    def test_stripe_client_create_charge_success_mocked(self):
        # Test the StripeClient directly when using the mock key
        client = StripeClient()
        data = client.create_charge(
            amount=Decimal("10.00"),
            currency="EUR",
            source="tok_test",
            description="Test Charge",
        )
        self.assertEqual(data["status"], "succeeded")
        self.assertIn("ch_mock_", data["id"])
        self.assertEqual(data["amount"], 1000)  # 10.00 EUR in cents


if __name__ == "__main__":
    unittest.main(argv=["first-arg-is-ignored"], exit=False)

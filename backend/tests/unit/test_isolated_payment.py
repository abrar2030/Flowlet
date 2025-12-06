import unittest
from unittest.mock import patch, MagicMock
from decimal import Decimal
import os
import stripe

os.environ["STRIPE_SECRET_KEY"] = "sk_test_123"
from src.clients.stripe_client import StripeClient
from src.services.payment_service_errors import PaymentProcessorError


class TestStripeClient(unittest.TestCase):

    @patch("stripe.Charge.create")
    def test_create_charge_success(self, mock_stripe_create: Any) -> Any:
        mock_charge = MagicMock(
            id="ch_123",
            status="succeeded",
            to_dict=lambda: {
                "id": "ch_123",
                "status": "succeeded",
                "amount": 1000,
                "currency": "usd",
            },
        )
        mock_stripe_create.return_value = mock_charge
        client = StripeClient()
        result = client.create_charge(
            Decimal("10.00"), "USD", "tok_visa", "test charge"
        )
        self.assertEqual(result["status"], "succeeded")
        mock_stripe_create.assert_called_once_with(
            amount=1000,
            currency="usd",
            source="tok_visa",
            description="test charge",
            metadata={},
        )

    @patch("stripe.Charge.create")
    def test_create_charge_card_error(self, mock_stripe_create: Any) -> Any:
        mock_stripe_create.side_effect = stripe.error.CardError(
            message="Your card was declined.",
            param="source",
            code="card_declined",
            http_status=400,
            json_body={"error": {"message": "Your card was declined."}},
        )
        client = StripeClient()
        with self.assertRaisesRegex(
            PaymentProcessorError, "Payment failed: Your card was declined."
        ):
            client.create_charge(Decimal("10.00"), "USD", "tok_visa", "test charge")

    @patch("stripe.Charge.create")
    def test_create_charge_api_error(self, mock_stripe_create: Any) -> Any:
        mock_stripe_create.side_effect = stripe.error.StripeError(
            message="Invalid API Key provided.",
            http_status=500,
            json_body={"error": {"message": "Invalid API Key provided."}},
        )
        client = StripeClient()
        with self.assertRaisesRegex(
            PaymentProcessorError, "Stripe processing error: Invalid API Key provided."
        ):
            client.create_charge(Decimal("10.00"), "USD", "tok_visa", "test charge")


if __name__ == "__main__":
    unittest.main()

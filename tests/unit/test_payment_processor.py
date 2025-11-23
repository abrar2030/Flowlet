import unittest

# Assuming a simplified payment processing module structure
# In a real scenario, you would import the actual classes/functions


class PaymentProcessor:
    def __init__(self, api_key):
        self.api_key = api_key

    def process_payment(self, amount, currency, card_details, user_id):
        if not all([amount, currency, card_details, user_id]):
            return {"status": "failed", "message": "Missing required payment details"}
        if amount <= 0:
            return {"status": "failed", "message": "Amount must be positive"}

        # In a real system, this would involve API calls to a payment gateway
        # For testing, we'll simulate success or failure based on some conditions
        if card_details.get("number") == "invalid":
            return {"status": "failed", "message": "Invalid card details"}

        # Simulate a successful transaction
        transaction_id = f"txn_{user_id}_{amount}_{currency}"
        return {
            "status": "success",
            "transaction_id": transaction_id,
            "amount": amount,
            "currency": currency,
        }

    def refund_payment(self, transaction_id, amount):
        if not all([transaction_id, amount]):
            return {"status": "failed", "message": "Missing required refund details"}
        if amount <= 0:
            return {"status": "failed", "message": "Refund amount must be positive"}

        # Simulate interaction with an external payment gateway for refund
        if transaction_id == "non_existent_txn":
            return {"status": "failed", "message": "Transaction not found"}

        # Simulate a successful refund
        refund_id = f"ref_{transaction_id}_{amount}"
        return {
            "status": "success",
            "refund_id": refund_id,
            "transaction_id": transaction_id,
            "amount": amount,
        }


class TestPaymentProcessor(unittest.TestCase):
    def setUp(self):
        self.processor = PaymentProcessor(api_key="test_api_key")
        self.valid_card = {
            "number": "1234-5678-9012-3456",
            "expiry": "12/25",
            "cvv": "123",
        }
        self.invalid_card = {"number": "invalid", "expiry": "12/25", "cvv": "123"}

    def test_process_payment_success(self):
        result = self.processor.process_payment(
            100.00, "USD", self.valid_card, "user123"
        )
        self.assertEqual(result["status"], "success")
        self.assertIn("transaction_id", result)
        self.assertEqual(result["amount"], 100.00)
        self.assertEqual(result["currency"], "USD")

    def test_process_payment_invalid_card(self):
        result = self.processor.process_payment(
            50.00, "EUR", self.invalid_card, "user456"
        )
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Invalid card details")

    def test_process_payment_missing_details(self):
        result = self.processor.process_payment(
            10.00, "GBP", {}, "user789"
        )  # Missing card details
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Missing required payment details")

        result = self.processor.process_payment(
            10.00, "GBP", self.valid_card, None
        )  # Missing user_id
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Missing required payment details")

    def test_process_payment_zero_amount(self):
        result = self.processor.process_payment(0, "USD", self.valid_card, "user123")
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Amount must be positive")

    def test_refund_payment_success(self):
        # First, simulate a successful payment to get a transaction_id
        payment_result = self.processor.process_payment(
            100.00, "USD", self.valid_card, "user123"
        )
        transaction_id = payment_result["transaction_id"]

        refund_result = self.processor.refund_payment(transaction_id, 50.00)
        self.assertEqual(refund_result["status"], "success")
        self.assertIn("refund_id", refund_result)
        self.assertEqual(refund_result["transaction_id"], transaction_id)
        self.assertEqual(refund_result["amount"], 50.00)

    def test_refund_payment_non_existent_transaction(self):
        result = self.processor.refund_payment("non_existent_txn", 25.00)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Transaction not found")

    def test_refund_payment_missing_details(self):
        result = self.processor.refund_payment(None, 25.00)  # Missing transaction_id
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Missing required refund details")

        result = self.processor.refund_payment("txn_123", 0)  # Zero amount
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Refund amount must be positive")


if __name__ == "__main__":
    unittest.main()

    def test_calculate_fee_credit_card(self):
        fee = self.processor.calculate_fee(100.00, "credit_card")
        self.assertAlmostEqual(fee, 2.30)

    def test_calculate_fee_bank_transfer(self):
        fee = self.processor.calculate_fee(500.00, "bank_transfer")
        self.assertAlmostEqual(fee, 1.00)

    def test_calculate_fee_unknown_method(self):
        fee = self.processor.calculate_fee(100.00, "unknown_method")
        self.assertAlmostEqual(fee, 0.00)

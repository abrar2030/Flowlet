import unittest

# Mocking the services that would interact in a card transaction flow


class MockCardService:
    def __init__(self):
        self.frozen_cards = set()

    def process_transaction(self, card_id, amount, merchant_id):
        if card_id in self.frozen_cards:
            return {"status": "declined", "message": "Card is frozen"}
        if amount > 1000:  # Simulate a spending limit
            return {"status": "declined", "message": "Spending limit exceeded"}
        return {"status": "approved", "transaction_id": f"card_txn_{card_id}_{amount}"}

    def freeze_card(self, card_id):
        self.frozen_cards.add(card_id)
        return {"status": "success", "message": "Card frozen"}

    def unfreeze_card(self, card_id):
        if card_id in self.frozen_cards:
            self.frozen_cards.remove(card_id)
            return {"status": "success", "message": "Card unfrozen"}
        return {"status": "failed", "message": "Card not frozen"}


class MockWalletService:
    def withdraw(self, wallet_id, amount):
        if wallet_id == "wallet_insufficient_funds":
            raise ValueError("Insufficient funds")
        return {"status": "success", "wallet_id": wallet_id, "new_balance": 500}

    def deposit(self, wallet_id, amount):
        return {"status": "success", "wallet_id": wallet_id, "new_balance": 1000}


class MockLedgerService:
    def create_journal_entry(
        self, debit_account, credit_account, amount, description, transaction_id=None
    ):
        return {"status": "success", "entry_id": "entry_mock_789"}


class CardTransactionFlowIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.card_service = MockCardService()
        self.wallet_service = MockWalletService()
        self.ledger_service = MockLedgerService()

    def test_successful_card_transaction_flow(self):
        card_id = "card_user_1"
        user_wallet_id = "user_wallet_1"
        merchant_wallet_id = "merchant_wallet_1"
        amount = 50.00
        merchant_id = "merchant_abc"

        # 1. Card swipe/online transaction
        transaction_result = self.card_service.process_transaction(
            card_id, amount, merchant_id
        )
        self.assertEqual(transaction_result["status"], "approved")

        # 2. Wallet balance updated (withdrawal from user, deposit to merchant)
        withdrawal_result = self.wallet_service.withdraw(user_wallet_id, amount)
        self.assertEqual(withdrawal_result["status"], "success")

        deposit_result = self.wallet_service.deposit(merchant_wallet_id, amount)
        self.assertEqual(deposit_result["status"], "success")

        # 3. Ledger entry created
        ledger_entry_result = self.ledger_service.create_journal_entry(
            debit_account=user_wallet_id,
            credit_account=merchant_wallet_id,
            amount=amount,
            description="Card transaction from user to merchant",
            transaction_id=transaction_result["transaction_id"],
        )
        self.assertEqual(ledger_entry_result["status"], "success")

    def test_card_transaction_frozen_card(self):
        card_id = "card_frozen_1"
        merchant_id = "merchant_xyz"
        amount = 25.00

        self.card_service.freeze_card(card_id)

        # 1. Card swipe/online transaction with frozen card
        transaction_result = self.card_service.process_transaction(
            card_id, amount, merchant_id
        )
        self.assertEqual(transaction_result["status"], "declined")
        self.assertEqual(transaction_result["message"], "Card is frozen")

    def test_card_transaction_spending_limit_exceeded(self):
        card_id = "card_limit_1"
        merchant_id = "merchant_pqr"
        amount = 1500.00  # Exceeds simulated limit of 1000

        # 1. Card swipe/online transaction exceeding limit
        transaction_result = self.card_service.process_transaction(
            card_id, amount, merchant_id
        )
        self.assertEqual(transaction_result["status"], "declined")
        self.assertEqual(transaction_result["message"], "Spending limit exceeded")

    def test_card_transaction_insufficient_funds(self):
        card_id = "card_funds_1"
        user_wallet_id = "wallet_insufficient_funds"
        amount = 100.00
        merchant_id = "merchant_def"

        # 1. Card swipe/online transaction
        transaction_result = self.card_service.process_transaction(
            card_id, amount, merchant_id
        )
        self.assertEqual(transaction_result["status"], "approved")

        # 2. Wallet withdrawal fails due to insufficient funds
        with self.assertRaises(ValueError) as cm:
            self.wallet_service.withdraw(user_wallet_id, amount)
        self.assertIn("Insufficient funds", str(cm.exception))


if __name__ == "__main__":
    unittest.main()

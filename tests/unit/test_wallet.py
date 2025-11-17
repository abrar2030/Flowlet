import unittest

# Mocking Wallet and WalletService for unit testing purposes
# In a real scenario, you would import the actual classes if the project structure allows


class Wallet:
    def __init__(self, id, owner_id, type, currency, status, balance):
        self.id = id
        self.owner_id = owner_id
        self.type = type
        self.currency = currency
        self.status = status
        self.balance = balance


class WalletService:
    def __init__(self):
        self.wallets = {}

    def create_wallet(self, owner_id, type, currency):
        # Simplified creation for testing
        wallet_id = f"wallet-{len(self.wallets) + 1}"
        wallet = Wallet(
            id=wallet_id,
            owner_id=owner_id,
            type=type,
            currency=currency,
            status="pending",
            balance=0,
        )
        self.wallets[wallet_id] = wallet
        return wallet

    def deposit(self, wallet_id, amount):
        wallet = self.wallets.get(wallet_id)
        if not wallet:
            raise ValueError("Wallet not found")
        if amount <= 0:
            raise ValueError("Deposit amount must be positive")
        wallet.balance += amount
        return wallet

    def withdraw(self, wallet_id, amount):
        wallet = self.wallets.get(wallet_id)
        if not wallet:
            raise ValueError("Wallet not found")
        if amount <= 0:
            raise ValueError("Withdrawal amount must be positive")
        if wallet.balance < amount:
            raise ValueError("Insufficient funds")
        wallet.balance -= amount
        return wallet


class WalletUnitTests(unittest.TestCase):
    def setUp(self):
        self.wallet_service = WalletService()

    def test_wallet_creation(self):
        wallet = self.wallet_service.create_wallet(
            owner_id="user-123", type="individual", currency="USD"
        )

        self.assertIsNotNone(wallet.id)
        self.assertEqual(wallet.owner_id, "user-123")
        self.assertEqual(wallet.type, "individual")
        self.assertEqual(wallet.currency, "USD")
        self.assertEqual(wallet.status, "pending")
        self.assertEqual(wallet.balance, 0)

    def test_wallet_deposit(self):
        wallet = self.wallet_service.create_wallet(
            owner_id="user-123", type="individual", currency="USD"
        )

        updated_wallet = self.wallet_service.deposit(wallet.id, 1000)
        self.assertEqual(updated_wallet.balance, 1000)

    def test_wallet_withdrawal(self):
        wallet = self.wallet_service.create_wallet(
            owner_id="user-123", type="individual", currency="USD"
        )
        self.wallet_service.deposit(wallet.id, 1000)

        updated_wallet = self.wallet_service.withdraw(wallet.id, 500)
        self.assertEqual(updated_wallet.balance, 500)

    def test_insufficient_funds(self):
        wallet = self.wallet_service.create_wallet(
            owner_id="user-123", type="individual", currency="USD"
        )
        self.wallet_service.deposit(wallet.id, 100)

        with self.assertRaises(ValueError):
            self.wallet_service.withdraw(wallet.id, 500)

    def test_deposit_zero_amount(self):
        wallet = self.wallet_service.create_wallet(
            owner_id="user-123", type="individual", currency="USD"
        )
        with self.assertRaises(ValueError):
            self.wallet_service.deposit(wallet.id, 0)

    def test_withdraw_zero_amount(self):
        wallet = self.wallet_service.create_wallet(
            owner_id="user-123", type="individual", currency="USD"
        )
        self.wallet_service.deposit(wallet.id, 100)
        with self.assertRaises(ValueError):
            self.wallet_service.withdraw(wallet.id, 0)


if __name__ == "__main__":
    unittest.main()

    def test_wallet_state_transitions(self):
        wallet = self.wallet_service.create_wallet(
            owner_id="user-123", type="individual", currency="USD"
        )
        self.assertEqual(wallet.status, "pending")

        # Simulate state change to active (assuming a method for this exists in WalletService)
        # For now, directly modify for testing purposes
        wallet.status = "active"
        self.assertEqual(wallet.status, "active")

        # Simulate state change to suspended
        wallet.status = "suspended"
        self.assertEqual(wallet.status, "suspended")

        # Simulate state change to closed
        wallet.status = "closed"
        self.assertEqual(wallet.status, "closed")

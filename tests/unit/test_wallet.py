import unittest
from src.wallet.models import Wallet
from src.wallet.services import WalletService

class WalletUnitTests(unittest.TestCase):
    def setUp(self):
        self.wallet_service = WalletService()
    
    def test_wallet_creation(self):
        wallet = self.wallet_service.create_wallet(
            owner_id="user-123",
            type="individual",
            currency="USD"
        )
        
        self.assertIsNotNone(wallet.id)
        self.assertEqual(wallet.owner_id, "user-123")
        self.assertEqual(wallet.type, "individual")
        self.assertEqual(wallet.currency, "USD")
        self.assertEqual(wallet.status, "pending")
        self.assertEqual(wallet.balance, 0)
    
    def test_wallet_deposit(self):
        wallet = Wallet(
            id="wallet-123",
            owner_id="user-123",
            type="individual",
            currency="USD",
            status="active",
            balance=0
        )
        
        updated_wallet = self.wallet_service.deposit(wallet.id, 1000)
        self.assertEqual(updated_wallet.balance, 1000)
    
    def test_wallet_withdrawal(self):
        wallet = Wallet(
            id="wallet-123",
            owner_id="user-123",
            type="individual",
            currency="USD",
            status="active",
            balance=1000
        )
        
        updated_wallet = self.wallet_service.withdraw(wallet.id, 500)
        self.assertEqual(updated_wallet.balance, 500)
    
    def test_insufficient_funds(self):
        wallet = Wallet(
            id="wallet-123",
            owner_id="user-123",
            type="individual",
            currency="USD",
            status="active",
            balance=100
        )
        
        with self.assertRaises(ValueError):
            self.wallet_service.withdraw(wallet.id, 500)

if __name__ == '__main__':
    unittest.main()

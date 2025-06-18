import unittest

# Mocking a simplified UI interaction for E2E tests

class MockUI:
    def __init__(self):
        self.users = {}
        self.logged_in_user = None

    def register(self, username, password):
        if username in self.users:
            return {"status": "failed", "message": "User already exists"}
        self.users[username] = {"password": password, "wallets": [], "cards": []}
        return {"status": "success", "message": "Registration successful"}

    def login(self, username, password):
        user = self.users.get(username)
        if user and user["password"] == password:
            self.logged_in_user = username
            return {"status": "success", "message": "Login successful"}
        return {"status": "failed", "message": "Invalid credentials"}

    def logout(self):
        self.logged_in_user = None
        return {"status": "success", "message": "Logged out"}

    def is_logged_in(self):
        return self.logged_in_user is not None

    def create_wallet_ui(self, currency):
        if not self.is_logged_in():
            return {"status": "failed", "message": "Not logged in"}
        wallet_id = f"wallet_{self.logged_in_user}_{currency}"
        self.users[self.logged_in_user]["wallets"].append({"id": wallet_id, "currency": currency, "balance": 0})
        return {"status": "success", "wallet_id": wallet_id}

    def deposit_ui(self, wallet_id, amount):
        if not self.is_logged_in():
            return {"status": "failed", "message": "Not logged in"}
        for wallet in self.users[self.logged_in_user]["wallets"]:
            if wallet["id"] == wallet_id:
                wallet["balance"] += amount
                return {"status": "success", "new_balance": wallet["balance"]}
        return {"status": "failed", "message": "Wallet not found"}

    def withdraw_ui(self, wallet_id, amount):
        if not self.is_logged_in():
            return {"status": "failed", "message": "Not logged in"}
        for wallet in self.users[self.logged_in_user]["wallets"]:
            if wallet["id"] == wallet_id:
                if wallet["balance"] >= amount:
                    wallet["balance"] -= amount
                    return {"status": "success", "new_balance": wallet["balance"]}
                else:
                    return {"status": "failed", "message": "Insufficient funds"}
        return {"status": "failed", "message": "Wallet not found"}

    def get_transaction_history_ui(self, wallet_id):
        if not self.is_logged_in():
            return {"status": "failed", "message": "Not logged in"}
        # Simplified: In a real app, this would fetch from a backend
        return {"status": "success", "history": ["txn1", "txn2"]}

    def request_new_card_ui(self, card_type):
        if not self.is_logged_in():
            return {"status": "failed", "message": "Not logged in"}
        card_id = f"card_{self.logged_in_user}_{card_type}"
        self.users[self.logged_in_user]["cards"].append({"id": card_id, "type": card_type, "status": "active"})
        return {"status": "success", "card_id": card_id}

    def freeze_card_ui(self, card_id):
        if not self.is_logged_in():
            return {"status": "failed", "message": "Not logged in"}
        for card in self.users[self.logged_in_user]["cards"]:
            if card["id"] == card_id:
                card["status"] = "frozen"
                return {"status": "success", "card_id": card_id, "new_status": "frozen"}
        return {"status": "failed", "message": "Card not found"}

    def unfreeze_card_ui(self, card_id):
        if not self.is_logged_in():
            return {"status": "failed", "message": "Not logged in"}
        for card in self.users[self.logged_in_user]["cards"]:
            if card["id"] == card_id:
                card["status"] = "active"
                return {"status": "success", "card_id": card_id, "new_status": "active"}
        return {"status": "failed", "message": "Card not found"}

    def make_payment_ui(self, recipient, amount, currency):
        if not self.is_logged_in():
            return {"status": "failed", "message": "Not logged in"}
        # Simplified: In a real app, this would involve complex payment processing
        return {"status": "success", "message": f"Payment of {amount} {currency} to {recipient} successful"}

    def view_payment_status_ui(self, payment_id):
        if not self.is_logged_in():
            return {"status": "failed", "message": "Not logged in"}
        # Simplified: In a real app, this would fetch from a backend
        return {"status": "success", "status": "completed"}


class TestUserFlow(unittest.TestCase):

    def setUp(self):
        self.ui = MockUI()

    def test_full_user_registration_and_login(self):
        # Test successful registration
        reg_result = self.ui.register("testuser", "password123")
        self.assertEqual(reg_result["status"], "success")

        # Test successful login
        login_result = self.ui.login("testuser", "password123")
        self.assertEqual(login_result["status"], "success")
        self.assertTrue(self.ui.is_logged_in())

        # Test login with incorrect password
        login_fail_result = self.ui.login("testuser", "wrongpass")
        self.assertEqual(login_fail_result["status"], "failed")
        self.assertFalse(self.ui.is_logged_in())

        # Test login with non-existent user
        login_fail_result = self.ui.login("nonexistent", "password123")
        self.assertEqual(login_fail_result["status"], "failed")
        self.assertFalse(self.ui.is_logged_in())

        # Test registration with existing user
        reg_fail_result = self.ui.register("testuser", "password123")
        self.assertEqual(reg_fail_result["status"], "failed")

    def test_wallet_operations_via_ui(self):
        self.ui.register("walletuser", "pass")
        self.ui.login("walletuser", "pass")

        # Create wallet
        wallet_result = self.ui.create_wallet_ui("USD")
        self.assertEqual(wallet_result["status"], "success")
        wallet_id = wallet_result["wallet_id"]

        # Deposit
        deposit_result = self.ui.deposit_ui(wallet_id, 500)
        self.assertEqual(deposit_result["status"], "success")
        self.assertEqual(deposit_result["new_balance"], 500)

        # Withdraw
        withdraw_result = self.ui.withdraw_ui(wallet_id, 200)
        self.assertEqual(withdraw_result["status"], "success")
        self.assertEqual(withdraw_result["new_balance"], 300)

        # Insufficient funds withdrawal
        withdraw_fail_result = self.ui.withdraw_ui(wallet_id, 500)
        self.assertEqual(withdraw_fail_result["status"], "failed")
        self.assertEqual(withdraw_fail_result["message"], "Insufficient funds")

        # View transaction history
        history_result = self.ui.get_transaction_history_ui(wallet_id)
        self.assertEqual(history_result["status"], "success")
        self.assertIn("history", history_result)

    def test_card_management_via_ui(self):
        self.ui.register("carduser", "pass")
        self.ui.login("carduser", "pass")

        # Request new card
        card_result = self.ui.request_new_card_ui("virtual")
        self.assertEqual(card_result["status"], "success")
        card_id = card_result["card_id"]

        # Freeze card
        freeze_result = self.ui.freeze_card_ui(card_id)
        self.assertEqual(freeze_result["status"], "success")
        self.assertEqual(freeze_result["new_status"], "frozen")

        # Unfreeze card
        unfreeze_result = self.ui.unfreeze_card_ui(card_id)
        self.assertEqual(unfreeze_result["status"], "success")
        self.assertEqual(unfreeze_result["new_status"], "active")

    def test_payment_initiation_via_ui(self):
        self.ui.register("payuser", "pass")
        self.ui.login("payuser", "pass")

        # Make a payment
        payment_result = self.ui.make_payment_ui("merchant_xyz", 50.00, "USD")
        self.assertEqual(payment_result["status"], "success")

        # View payment status (mocked)
        status_result = self.ui.view_payment_status_ui("mock_payment_id_123")
        self.assertEqual(status_result["status"], "success")
        self.assertEqual(status_result["status"], "completed")

if __name__ == '__main__':
    unittest.main()



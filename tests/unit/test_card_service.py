import unittest
from unittest.mock import MagicMock


class CardService:

    def __init__(self, issuer_api: Any) -> Any:
        self.issuer_api = issuer_api

    def issue_card(
        self, user_id: Any, card_type: Any = "virtual", initial_limit: Any = 1000.0
    ) -> Any:
        if not user_id:
            return {"status": "failed", "message": "User ID is required"}
        if initial_limit <= 0:
            return {"status": "failed", "message": "Initial limit must be positive"}
        try:
            response = self.issuer_api.create_card(user_id, card_type, initial_limit)
            if response.get("success"):
                card_id = response.get("card_id")
                return {
                    "status": "success",
                    "card_id": card_id,
                    "user_id": user_id,
                    "card_type": card_type,
                }
            else:
                return {
                    "status": "failed",
                    "message": response.get("error", "Card issuance failed"),
                }
        except Exception as e:
            return {"status": "failed", "message": f"API error: {str(e)}"}

    def activate_card(self, card_id: Any) -> Any:
        if not card_id:
            return {"status": "failed", "message": "Card ID is required"}
        try:
            response = self.issuer_api.set_card_status(card_id, "active")
            if response.get("success"):
                return {"status": "success", "card_id": card_id, "new_status": "active"}
            else:
                return {
                    "status": "failed",
                    "message": response.get("error", "Card activation failed"),
                }
        except Exception as e:
            return {"status": "failed", "message": f"API error: {str(e)}"}

    def deactivate_card(self, card_id: Any) -> Any:
        if not card_id:
            return {"status": "failed", "message": "Card ID is required"}
        try:
            response = self.issuer_api.set_card_status(card_id, "inactive")
            if response.get("success"):
                return {
                    "status": "success",
                    "card_id": card_id,
                    "new_status": "inactive",
                }
            else:
                return {
                    "status": "failed",
                    "message": response.get("error", "Card deactivation failed"),
                }
        except Exception as e:
            return {"status": "failed", "message": f"API error: {str(e)}"}

    def update_spending_limit(self, card_id: Any, new_limit: Any) -> Any:
        if not card_id:
            return {"status": "failed", "message": "Card ID is required"}
        if new_limit <= 0:
            return {"status": "failed", "message": "New limit must be positive"}
        try:
            response = self.issuer_api.set_spending_limit(card_id, new_limit)
            if response.get("success"):
                return {"status": "success", "card_id": card_id, "new_limit": new_limit}
            else:
                return {
                    "status": "failed",
                    "message": response.get("error", "Spending limit update failed"),
                }
        except Exception as e:
            return {"status": "failed", "message": f"API error: {str(e)}"}


class TestCardService(unittest.TestCase):

    def setUp(self) -> Any:
        self.mock_issuer_api = MagicMock()
        self.card_service = CardService(issuer_api=self.mock_issuer_api)

    def test_issue_card_success(self) -> Any:
        self.mock_issuer_api.create_card.return_value = {
            "success": True,
            "card_id": "card123",
        }
        result = self.card_service.issue_card("user123", "virtual", 500.0)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["card_id"], "card123")
        self.mock_issuer_api.create_card.assert_called_once_with(
            "user123", "virtual", 500.0
        )

    def test_issue_card_missing_user_id(self) -> Any:
        result = self.card_service.issue_card(None)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "User ID is required")
        self.mock_issuer_api.create_card.assert_not_called()

    def test_issue_card_zero_initial_limit(self) -> Any:
        result = self.card_service.issue_card("user123", "virtual", 0)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Initial limit must be positive")
        self.mock_issuer_api.create_card.assert_not_called()

    def test_issue_card_api_failure(self) -> Any:
        self.mock_issuer_api.create_card.return_value = {
            "success": False,
            "error": "Issuer system down",
        }
        result = self.card_service.issue_card("user123")
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Issuer system down")

    def test_activate_card_success(self) -> Any:
        self.mock_issuer_api.set_card_status.return_value = {"success": True}
        result = self.card_service.activate_card("card123")
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["new_status"], "active")
        self.mock_issuer_api.set_card_status.assert_called_once_with(
            "card123", "active"
        )

    def test_activate_card_missing_card_id(self) -> Any:
        result = self.card_service.activate_card(None)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Card ID is required")
        self.mock_issuer_api.set_card_status.assert_not_called()

    def test_deactivate_card_success(self) -> Any:
        self.mock_issuer_api.set_card_status.return_value = {"success": True}
        result = self.card_service.deactivate_card("card123")
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["new_status"], "inactive")
        self.mock_issuer_api.set_card_status.assert_called_once_with(
            "card123", "inactive"
        )

    def test_update_spending_limit_success(self) -> Any:
        self.mock_issuer_api.set_spending_limit.return_value = {"success": True}
        result = self.card_service.update_spending_limit("card123", 2000.0)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["new_limit"], 2000.0)
        self.mock_issuer_api.set_spending_limit.assert_called_once_with(
            "card123", 2000.0
        )

    def test_update_spending_limit_zero_limit(self) -> Any:
        result = self.card_service.update_spending_limit("card123", 0)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "New limit must be positive")
        self.mock_issuer_api.set_spending_limit.assert_not_called()


if __name__ == "__main__":
    unittest.main()

    def test_freeze_card_success(self) -> Any:
        self.mock_issuer_api.set_card_status.return_value = {"success": True}
        result = self.card_service.freeze_card("card123")
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["new_status"], "frozen")
        self.mock_issuer_api.set_card_status.assert_called_once_with(
            "card123", "frozen"
        )

    def test_freeze_card_missing_card_id(self) -> Any:
        result = self.card_service.freeze_card(None)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Card ID is required")
        self.mock_issuer_api.set_card_status.assert_not_called()

    def test_unfreeze_card_success(self) -> Any:
        self.mock_issuer_api.set_card_status.return_value = {"success": True}
        result = self.card_service.unfreeze_card("card123")
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["new_status"], "active")
        self.mock_issuer_api.set_card_status.assert_called_once_with(
            "card123", "active"
        )

    def test_unfreeze_card_missing_card_id(self) -> Any:
        result = self.card_service.unfreeze_card(None)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Card ID is required")
        self.mock_issuer_api.set_card_status.assert_not_called()

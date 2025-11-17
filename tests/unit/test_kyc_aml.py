import unittest
from unittest.mock import MagicMock, patch

# Mocking KYC/AML related classes and functions
# In a real scenario, these would be imported from the actual source code


class UserProfile:
    def __init__(self, user_id, name, dob, address, id_document=None, status="pending"):
        self.user_id = user_id
        self.name = name
        self.dob = dob
        self.address = address
        self.id_document = id_document
        self.status = status


class KYCService:
    def __init__(self):
        self.user_profiles = {}

    def submit_for_verification(self, user_id, name, dob, address, id_document):
        if not all([user_id, name, dob, address, id_document]):
            return {
                "status": "failed",
                "message": "All fields are required for submission",
            }

        profile = UserProfile(user_id, name, dob, address, id_document)
        self.user_profiles[user_id] = profile

        # Simulate an asynchronous verification process
        # In a real system, this would trigger an external service or a background task
        profile.status = "submitted"
        return {
            "status": "success",
            "message": "Verification submitted",
            "user_id": user_id,
        }

    def get_verification_status(self, user_id):
        profile = self.user_profiles.get(user_id)
        if not profile:
            return {"status": "failed", "message": "User profile not found"}
        return {"status": "success", "user_id": user_id, "status": profile.status}

    def approve_verification(self, user_id):
        profile = self.user_profiles.get(user_id)
        if not profile:
            return {"status": "failed", "message": "User profile not found"}
        if profile.status != "submitted":
            return {"status": "failed", "message": "Profile not in submitted state"}
        profile.status = "approved"
        return {"status": "success", "user_id": user_id, "new_status": "approved"}

    def reject_verification(self, user_id, reason):
        profile = self.user_profiles.get(user_id)
        if not profile:
            return {"status": "failed", "message": "User profile not found"}
        if profile.status != "submitted":
            return {"status": "failed", "message": "Profile not in submitted state"}
        profile.status = "rejected"
        profile.rejection_reason = reason
        return {
            "status": "success",
            "user_id": user_id,
            "new_status": "rejected",
            "reason": reason,
        }


class AMLService:
    def __init__(self):
        self.flagged_users = set()

    def screen_transaction(self, user_id, amount, recipient_id):
        # Simulate AML screening logic
        if (
            amount > 10000
            or user_id in self.flagged_users
            or recipient_id in self.flagged_users
        ):
            return {
                "status": "flagged",
                "reason": "High value transaction or flagged user",
            }
        return {"status": "clean"}

    def add_to_watchlist(self, user_id):
        self.flagged_users.add(user_id)
        return {"status": "success", "message": f"User {user_id} added to watchlist"}

    def remove_from_watchlist(self, user_id):
        if user_id in self.flagged_users:
            self.flagged_users.remove(user_id)
            return {
                "status": "success",
                "message": f"User {user_id} removed from watchlist",
            }
        return {"status": "failed", "message": f"User {user_id} not found in watchlist"}


class TestKYCService(unittest.TestCase):
    def setUp(self):
        self.kyc_service = KYCService()

    def test_submit_for_verification_success(self):
        result = self.kyc_service.submit_for_verification(
            user_id="user123",
            name="John Doe",
            dob="1990-01-01",
            address="123 Main St",
            id_document="passport.pdf",
        )
        self.assertEqual(result["status"], "success")
        self.assertEqual(self.kyc_service.user_profiles["user123"].status, "submitted")

    def test_submit_for_verification_missing_fields(self):
        result = self.kyc_service.submit_for_verification(
            user_id="user123",
            name="John Doe",
            dob="1990-01-01",
            address="123 Main St",
            id_document=None,
        )
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "All fields are required for submission")

    def test_get_verification_status(self):
        self.kyc_service.submit_for_verification(
            user_id="user123",
            name="John Doe",
            dob="1990-01-01",
            address="123 Main St",
            id_document="passport.pdf",
        )
        result = self.kyc_service.get_verification_status("user123")
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["status"], "submitted")

    def test_get_verification_status_not_found(self):
        result = self.kyc_service.get_verification_status("nonexistent_user")
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "User profile not found")

    def test_approve_verification_success(self):
        self.kyc_service.submit_for_verification(
            user_id="user123",
            name="John Doe",
            dob="1990-01-01",
            address="123 Main St",
            id_document="passport.pdf",
        )
        result = self.kyc_service.approve_verification("user123")
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["new_status"], "approved")
        self.assertEqual(self.kyc_service.user_profiles["user123"].status, "approved")

    def test_approve_verification_not_submitted(self):
        # Create a profile but don't submit it
        self.kyc_service.user_profiles["user123"] = UserProfile(
            "user123", "John Doe", "1990-01-01", "123 Main St"
        )
        result = self.kyc_service.approve_verification("user123")
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Profile not in submitted state")

    def test_reject_verification_success(self):
        self.kyc_service.submit_for_verification(
            user_id="user123",
            name="John Doe",
            dob="1990-01-01",
            address="123 Main St",
            id_document="passport.pdf",
        )
        result = self.kyc_service.reject_verification("user123", "Document unclear")
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["new_status"], "rejected")
        self.assertEqual(self.kyc_service.user_profiles["user123"].status, "rejected")
        self.assertEqual(
            self.kyc_service.user_profiles["user123"].rejection_reason,
            "Document unclear",
        )


class TestAMLService(unittest.TestCase):
    def setUp(self):
        self.aml_service = AMLService()

    def test_screen_transaction_clean(self):
        result = self.aml_service.screen_transaction("user1", 100, "user2")
        self.assertEqual(result["status"], "clean")

    def test_screen_transaction_high_value(self):
        result = self.aml_service.screen_transaction("user1", 15000, "user2")
        self.assertEqual(result["status"], "flagged")
        self.assertEqual(result["reason"], "High value transaction or flagged user")

    def test_screen_transaction_flagged_user(self):
        self.aml_service.add_to_watchlist("user1")
        result = self.aml_service.screen_transaction("user1", 500, "user2")
        self.assertEqual(result["status"], "flagged")
        self.assertEqual(result["reason"], "High value transaction or flagged user")

    def test_add_to_watchlist(self):
        result = self.aml_service.add_to_watchlist("user3")
        self.assertEqual(result["status"], "success")
        self.assertIn("user3", self.aml_service.flagged_users)

    def test_remove_from_watchlist(self):
        self.aml_service.add_to_watchlist("user4")
        result = self.aml_service.remove_from_watchlist("user4")
        self.assertEqual(result["status"], "success")
        self.assertNotIn("user4", self.aml_service.flagged_users)

    def test_remove_from_watchlist_not_found(self):
        result = self.aml_service.remove_from_watchlist("nonexistent_user")
        self.assertEqual(result["status"], "failed")
        self.assertEqual(
            result["message"], "User nonexistent_user not found in watchlist"
        )


if __name__ == "__main__":
    unittest.main()

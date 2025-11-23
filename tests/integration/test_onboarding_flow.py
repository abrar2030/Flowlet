import unittest

# Mocking the services that would interact in an onboarding flow


class MockUserService:
    def create_user(self, username, password):
        if username == "existing_user":
            return {"status": "failed", "message": "User already exists"}
        return {"status": "success", "user_id": f"user_{username}"}


class MockWalletService:
    def create_wallet(self, owner_id, type, currency):
        if owner_id == "user_fail_wallet":
            return {"status": "failed", "message": "Wallet creation failed"}
        return {"status": "success", "wallet_id": f"wallet_{owner_id}"}


class MockKYCService:
    def submit_for_verification(self, user_id, name, dob, address, id_document):
        if user_id == "user_fail_kyc":
            return {"status": "failed", "message": "KYC submission failed"}
        return {"status": "success", "message": "Verification submitted"}

    def get_verification_status(self, user_id):
        if user_id == "user_kyc_pending":
            return {"status": "success", "user_id": user_id, "status": "submitted"}
        elif user_id == "user_kyc_approved":
            return {"status": "success", "user_id": user_id, "status": "approved"}
        elif user_id == "user_kyc_rejected":
            return {"status": "success", "user_id": user_id, "status": "rejected"}
        return {"status": "failed", "message": "User profile not found"}


class OnboardingFlowIntegrationTests(unittest.TestCase):
    def setUp(self):
        self.user_service = MockUserService()
        self.wallet_service = MockWalletService()
        self.kyc_service = MockKYCService()

    def test_successful_onboarding_flow(self):
        username = "new_user_1"
        password = "password123"
        name = "Test User"
        dob = "2000-01-01"
        address = "123 Test St"
        id_document = "passport.pdf"

        # 1. User signup
        user_creation_result = self.user_service.create_user(username, password)
        self.assertEqual(user_creation_result["status"], "success")
        user_id = user_creation_result["user_id"]

        # 2. Wallet creation
        wallet_creation_result = self.wallet_service.create_wallet(
            user_id, "individual", "USD"
        )
        self.assertEqual(wallet_creation_result["status"], "success")

        # 3. KYC/AML verification process
        kyc_submission_result = self.kyc_service.submit_for_verification(
            user_id, name, dob, address, id_document
        )
        self.assertEqual(kyc_submission_result["status"], "success")

        # Simulate KYC approval
        kyc_status_result = self.kyc_service.get_verification_status(
            "user_kyc_approved"
        )
        self.assertEqual(kyc_status_result["status"], "success")
        self.assertEqual(kyc_status_result["status"], "approved")

    def test_onboarding_flow_existing_user(self):
        username = "existing_user"
        password = "password123"

        # 1. User signup (fails)
        user_creation_result = self.user_service.create_user(username, password)
        self.assertEqual(user_creation_result["status"], "failed")
        self.assertEqual(user_creation_result["message"], "User already exists")

    def test_onboarding_flow_wallet_creation_failure(self):
        username = "new_user_2"
        password = "password123"
        user_id = "user_fail_wallet"

        # 1. User signup
        user_creation_result = self.user_service.create_user(username, password)
        self.assertEqual(user_creation_result["status"], "success")

        # 2. Wallet creation (fails)
        wallet_creation_result = self.wallet_service.create_wallet(
            user_id, "individual", "USD"
        )
        self.assertEqual(wallet_creation_result["status"], "failed")
        self.assertEqual(wallet_creation_result["message"], "Wallet creation failed")

    def test_onboarding_flow_kyc_submission_failure(self):
        username = "new_user_3"
        password = "password123"
        user_id = "user_fail_kyc"
        name = "Test User"
        dob = "2000-01-01"
        address = "123 Test St"
        id_document = "passport.pdf"

        # 1. User signup
        user_creation_result = self.user_service.create_user(username, password)
        self.assertEqual(user_creation_result["status"], "success")

        # 2. Wallet creation
        wallet_creation_result = self.wallet_service.create_wallet(
            user_id, "individual", "USD"
        )
        self.assertEqual(wallet_creation_result["status"], "success")

        # 3. KYC/AML verification process (submission fails)
        kyc_submission_result = self.kyc_service.submit_for_verification(
            user_id, name, dob, address, id_document
        )
        self.assertEqual(kyc_submission_result["status"], "failed")
        self.assertEqual(kyc_submission_result["message"], "KYC submission failed")

    def test_onboarding_flow_kyc_rejection(self):
        username = "new_user_4"
        password = "password123"
        user_id = "user_kyc_rejected"
        name = "Test User"
        dob = "2000-01-01"
        address = "123 Test St"
        id_document = "passport.pdf"

        # 1. User signup
        user_creation_result = self.user_service.create_user(username, password)
        self.assertEqual(user_creation_result["status"], "success")

        # 2. Wallet creation
        wallet_creation_result = self.wallet_service.create_wallet(
            user_id, "individual", "USD"
        )
        self.assertEqual(wallet_creation_result["status"], "success")

        # 3. KYC/AML verification process
        kyc_submission_result = self.kyc_service.submit_for_verification(
            user_id, name, dob, address, id_document
        )
        self.assertEqual(kyc_submission_result["status"], "success")

        # Simulate KYC rejection
        kyc_status_result = self.kyc_service.get_verification_status(user_id)
        self.assertEqual(kyc_status_result["status"], "success")
        self.assertEqual(kyc_status_result["status"], "rejected")


if __name__ == "__main__":
    unittest.main()

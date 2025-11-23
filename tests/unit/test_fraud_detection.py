import unittest
from unittest.mock import MagicMock

# Assuming a simplified FraudDetectionService module structure
# In a real scenario, you would import the actual classes/functions


class FraudDetectionService:
    def __init__(self, ml_model_api):
        self.ml_model_api = ml_model_api  # Mock this for testing

    def analyze_transaction_for_fraud(self, transaction_data):
        if not transaction_data:
            return {"status": "failed", "message": "Transaction data is required"}

        try:
            # Simulate calling an ML model API for fraud prediction
            prediction_result = self.ml_model_api.predict_fraud(transaction_data)

            if prediction_result.get("is_fraudulent"):
                score = prediction_result.get("score", 0.0)
                if score > 0.8:
                    return {
                        "status": "fraud_detected",
                        "score": score,
                        "action": "block_transaction",
                    }
                elif score > 0.5:
                    return {
                        "status": "suspicious",
                        "score": score,
                        "action": "review_transaction",
                    }
                else:
                    return {
                        "status": "clean",
                        "score": score,
                        "action": "allow_transaction",
                    }
            else:
                return {
                    "status": "clean",
                    "score": prediction_result.get("score", 0.0),
                    "action": "allow_transaction",
                }
        except Exception as e:
            return {"status": "failed", "message": f"ML model API error: {str(e)}"}

    def get_fraud_report(self, transaction_id):
        # Simulate retrieving a fraud report for a given transaction
        if not transaction_id:
            return {"status": "failed", "message": "Transaction ID is required"}

        if transaction_id == "fraud_txn_123":
            return {
                "status": "success",
                "report": {
                    "transaction_id": transaction_id,
                    "reason": "Unusual spending pattern",
                    "severity": "high",
                },
            }
        elif transaction_id == "suspicious_txn_456":
            return {
                "status": "success",
                "report": {
                    "transaction_id": transaction_id,
                    "reason": "Multiple small transactions",
                    "severity": "medium",
                },
            }
        else:
            return {
                "status": "not_found",
                "message": "Fraud report not found for this transaction",
            }


class TestFraudDetectionService(unittest.TestCase):
    def setUp(self):
        self.mock_ml_model_api = MagicMock()
        self.fraud_detection_service = FraudDetectionService(
            ml_model_api=self.mock_ml_model_api
        )

    def test_analyze_transaction_fraud_detected(self):
        self.mock_ml_model_api.predict_fraud.return_value = {
            "is_fraudulent": True,
            "score": 0.9,
        }
        transaction_data = {"amount": 1000, "location": "NY", "user_id": "user1"}
        result = self.fraud_detection_service.analyze_transaction_for_fraud(
            transaction_data
        )
        self.assertEqual(result["status"], "fraud_detected")
        self.assertEqual(result["action"], "block_transaction")
        self.assertEqual(result["score"], 0.9)
        self.mock_ml_model_api.predict_fraud.assert_called_once_with(transaction_data)

    def test_analyze_transaction_suspicious(self):
        self.mock_ml_model_api.predict_fraud.return_value = {
            "is_fraudulent": True,
            "score": 0.6,
        }
        transaction_data = {"amount": 500, "location": "CA", "user_id": "user2"}
        result = self.fraud_detection_service.analyze_transaction_for_fraud(
            transaction_data
        )
        self.assertEqual(result["status"], "suspicious")
        self.assertEqual(result["action"], "review_transaction")
        self.assertEqual(result["score"], 0.6)

    def test_analyze_transaction_clean_not_fraudulent(self):
        self.mock_ml_model_api.predict_fraud.return_value = {
            "is_fraudulent": False,
            "score": 0.1,
        }
        transaction_data = {"amount": 50, "location": "TX", "user_id": "user3"}
        result = self.fraud_detection_service.analyze_transaction_for_fraud(
            transaction_data
        )
        self.assertEqual(result["status"], "clean")
        self.assertEqual(result["action"], "allow_transaction")
        self.assertEqual(result["score"], 0.1)

    def test_analyze_transaction_clean_low_score_fraudulent(self):
        self.mock_ml_model_api.predict_fraud.return_value = {
            "is_fraudulent": True,
            "score": 0.4,
        }
        transaction_data = {"amount": 200, "location": "FL", "user_id": "user4"}
        result = self.fraud_detection_service.analyze_transaction_for_fraud(
            transaction_data
        )
        self.assertEqual(result["status"], "clean")
        self.assertEqual(result["action"], "allow_transaction")
        self.assertEqual(result["score"], 0.4)

    def test_analyze_transaction_missing_data(self):
        result = self.fraud_detection_service.analyze_transaction_for_fraud(None)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Transaction data is required")
        self.mock_ml_model_api.predict_fraud.assert_not_called()

    def test_get_fraud_report_found_fraud(self):
        result = self.fraud_detection_service.get_fraud_report("fraud_txn_123")
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["report"]["severity"], "high")

    def test_get_fraud_report_found_suspicious(self):
        result = self.fraud_detection_service.get_fraud_report("suspicious_txn_456")
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["report"]["severity"], "medium")

    def test_get_fraud_report_not_found(self):
        result = self.fraud_detection_service.get_fraud_report("non_existent_txn")
        self.assertEqual(result["status"], "not_found")
        self.assertEqual(
            result["message"], "Fraud report not found for this transaction"
        )

    def test_get_fraud_report_missing_id(self):
        result = self.fraud_detection_service.get_fraud_report(None)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Transaction ID is required")


if __name__ == "__main__":
    unittest.main()

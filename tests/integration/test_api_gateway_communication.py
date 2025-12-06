import unittest


class MockUserService:

    def get_user_data(self, user_id: Any) -> Any:
        if user_id == "user123":
            return {"status": "success", "data": {"id": user_id, "name": "John Doe"}}
        return {"status": "failed", "message": "User not found"}


class MockPaymentService:

    def get_payment_details(self, payment_id: Any) -> Any:
        if payment_id == "pay123":
            return {"status": "success", "data": {"id": payment_id, "amount": 100}}
        return {"status": "failed", "message": "Payment not found"}


class MockAPIGateway:

    def __init__(self, user_service: Any, payment_service: Any) -> Any:
        self.user_service = user_service
        self.payment_service = payment_service

    def route_request(self, path: Any, params: Any) -> Any:
        if path == "/users":
            user_id = params.get("user_id")
            return self.user_service.get_user_data(user_id)
        elif path == "/payments":
            payment_id = params.get("payment_id")
            return self.payment_service.get_payment_details(payment_id)
        elif path == "/error_service":
            raise Exception("Service is down")
        else:
            return {"status": "failed", "message": "Unknown path"}


class APIGatewayCommunicationIntegrationTests(unittest.TestCase):

    def setUp(self) -> Any:
        self.mock_user_service = MockUserService()
        self.mock_payment_service = MockPaymentService()
        self.api_gateway = MockAPIGateway(
            user_service=self.mock_user_service,
            payment_service=self.mock_payment_service,
        )

    def test_successful_routing_to_user_service(self) -> Any:
        path = "/users"
        params = {"user_id": "user123"}
        result = self.api_gateway.route_request(path, params)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["data"]["name"], "John Doe")

    def test_successful_routing_to_payment_service(self) -> Any:
        path = "/payments"
        params = {"payment_id": "pay123"}
        result = self.api_gateway.route_request(path, params)
        self.assertEqual(result["status"], "success")
        self.assertEqual(result["data"]["amount"], 100)

    def test_error_handling_service_unavailable(self) -> Any:
        path = "/error_service"
        params = {}
        with self.assertRaises(Exception) as cm:
            self.api_gateway.route_request(path, params)
        self.assertIn("Service is down", str(cm.exception))

    def test_error_handling_unknown_path(self) -> Any:
        path = "/nonexistent_service"
        params = {}
        result = self.api_gateway.route_request(path, params)
        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["message"], "Unknown path")


if __name__ == "__main__":
    unittest.main()

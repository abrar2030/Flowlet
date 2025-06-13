import unittest
from unittest.mock import MagicMock, patch

# Mocking APIGateway related classes and functions
# In a real scenario, these would be imported from the actual source code

class APIGateway:
    def __init__(self, auth_service, rate_limiter, router):
        self.auth_service = auth_service
        self.rate_limiter = rate_limiter
        self.router = router

    def process_request(self, request):
        # 1. Authentication and Authorization
        if not self.auth_service.authenticate(request.get("token")):
            return {"status": 401, "message": "Unauthorized"}
        if not self.auth_service.authorize(request.get("token"), request.get("resource")):
            return {"status": 403, "message": "Forbidden"}

        # 2. Rate Limiting
        if not self.rate_limiter.allow_request(request.get("client_ip")):
            return {"status": 429, "message": "Too Many Requests"}

        # 3. Routing
        try:
            response = self.router.route_request(request)
            return {"status": 200, "data": response}
        except ValueError as e:
            return {"status": 404, "message": str(e)}
        except Exception as e:
            return {"status": 500, "message": f"Internal Server Error: {str(e)}"}

class AuthService:
    def authenticate(self, token):
        return token == "valid_token"

    def authorize(self, token, resource):
        if token == "valid_token" and resource in ["/users", "/payments"]:
            return True
        return False

class RateLimiter:
    def __init__(self):
        self.requests = {}

    def allow_request(self, client_ip):
        # Simplified rate limiting: allow 3 requests per IP
        self.requests[client_ip] = self.requests.get(client_ip, 0) + 1
        return self.requests[client_ip] <= 3

class Router:
    def route_request(self, request):
        path = request.get("path")
        if path == "/users":
            return {"user_data": "some_user_info"}
        elif path == "/payments":
            return {"payment_data": "some_payment_info"}
        else:
            raise ValueError("Resource not found")


class TestAPIGateway(unittest.TestCase):

    def setUp(self):
        self.mock_auth_service = MagicMock(spec=AuthService)
        self.mock_rate_limiter = MagicMock(spec=RateLimiter)
        self.mock_router = MagicMock(spec=Router)
        self.api_gateway = APIGateway(
            auth_service=self.mock_auth_service,
            rate_limiter=self.mock_rate_limiter,
            router=self.mock_router
        )

    def test_process_request_success(self):
        self.mock_auth_service.authenticate.return_value = True
        self.mock_auth_service.authorize.return_value = True
        self.mock_rate_limiter.allow_request.return_value = True
        self.mock_router.route_request.return_value = {"data": "success"}

        request = {"token": "valid_token", "resource": "/users", "client_ip": "192.168.1.1", "path": "/users"}
        result = self.api_gateway.process_request(request)
        self.assertEqual(result["status"], 200)
        self.assertEqual(result["data"], {"data": "success"})

    def test_process_request_unauthorized(self):
        self.mock_auth_service.authenticate.return_value = False

        request = {"token": "invalid_token", "resource": "/users", "client_ip": "192.168.1.1", "path": "/users"}
        result = self.api_gateway.process_request(request)
        self.assertEqual(result["status"], 401)
        self.assertEqual(result["message"], "Unauthorized")

    def test_process_request_forbidden(self):
        self.mock_auth_service.authenticate.return_value = True
        self.mock_auth_service.authorize.return_value = False

        request = {"token": "valid_token", "resource": "/admin", "client_ip": "192.168.1.1", "path": "/admin"}
        result = self.api_gateway.process_request(request)
        self.assertEqual(result["status"], 403)
        self.assertEqual(result["message"], "Forbidden")

    def test_process_request_rate_limited(self):
        self.mock_auth_service.authenticate.return_value = True
        self.mock_auth_service.authorize.return_value = True
        self.mock_rate_limiter.allow_request.return_value = False

        request = {"token": "valid_token", "resource": "/users", "client_ip": "192.168.1.1", "path": "/users"}
        result = self.api_gateway.process_request(request)
        self.assertEqual(result["status"], 429)
        self.assertEqual(result["message"], "Too Many Requests")

    def test_process_request_resource_not_found(self):
        self.mock_auth_service.authenticate.return_value = True
        self.mock_auth_service.authorize.return_value = True
        self.mock_rate_limiter.allow_request.return_value = True
        self.mock_router.route_request.side_effect = ValueError("Resource not found")

        request = {"token": "valid_token", "resource": "/nonexistent", "client_ip": "192.168.1.1", "path": "/nonexistent"}
        result = self.api_gateway.process_request(request)
        self.assertEqual(result["status"], 404)
        self.assertEqual(result["message"], "Resource not found")

    def test_process_request_internal_server_error(self):
        self.mock_auth_service.authenticate.return_value = True
        self.mock_auth_service.authorize.return_value = True
        self.mock_rate_limiter.allow_request.return_value = True
        self.mock_router.route_request.side_effect = Exception("DB connection failed")

        request = {"token": "valid_token", "resource": "/users", "client_ip": "192.168.1.1", "path": "/users"}
        result = self.api_gateway.process_request(request)
        self.assertEqual(result["status"], 500)
        self.assertIn("Internal Server Error", result["message"])


class TestAuthService(unittest.TestCase):
    def setUp(self):
        self.auth_service = AuthService()

    def test_authenticate_valid_token(self):
        self.assertTrue(self.auth_service.authenticate("valid_token"))

    def test_authenticate_invalid_token(self):
        self.assertFalse(self.auth_service.authenticate("invalid_token"))

    def test_authorize_valid_access(self):
        self.assertTrue(self.auth_service.authorize("valid_token", "/users"))
        self.assertTrue(self.auth_service.authorize("valid_token", "/payments"))

    def test_authorize_invalid_access(self):
        self.assertFalse(self.auth_service.authorize("valid_token", "/admin"))
        self.assertFalse(self.auth_service.authorize("invalid_token", "/users"))


class TestRateLimiter(unittest.TestCase):
    def setUp(self):
        self.rate_limiter = RateLimiter()

    def test_allow_request(self):
        ip = "1.1.1.1"
        self.assertTrue(self.rate_limiter.allow_request(ip))
        self.assertTrue(self.rate_limiter.allow_request(ip))
        self.assertTrue(self.rate_limiter.allow_request(ip))
        self.assertFalse(self.rate_limiter.allow_request(ip)) # Should be rate limited now

    def test_allow_request_multiple_ips(self):
        ip1 = "1.1.1.1"
        ip2 = "2.2.2.2"
        self.assertTrue(self.rate_limiter.allow_request(ip1))
        self.assertTrue(self.rate_limiter.allow_request(ip2))
        self.assertTrue(self.rate_limiter.allow_request(ip1))
        self.assertTrue(self.rate_limiter.allow_request(ip2))


class TestRouter(unittest.TestCase):
    def setUp(self):
        self.router = Router()

    def test_route_request_valid_path(self):
        result = self.router.route_request({"path": "/users"})
        self.assertEqual(result, {"user_data": "some_user_info"})

        result = self.router.route_request({"path": "/payments"})
        self.assertEqual(result, {"payment_data": "some_payment_info"})

    def test_route_request_invalid_path(self):
        with self.assertRaises(ValueError) as cm:
            self.router.route_request({"path": "/nonexistent"})
        self.assertEqual(str(cm.exception), "Resource not found")

if __name__ == '__main__':
    unittest.main()



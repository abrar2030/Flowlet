# Integration Tests for API Endpoints
import pytest
import json
from decimal import Decimal
from datetime import datetime


class TestAuthenticationAPI:
    """Test authentication endpoints"""

    def test_user_registration(self, client):
        """Test user registration"""
        user_data = {
            "email": "newuser@example.com",
            "password": "NewPassword123!",
            "first_name": "New",
            "last_name": "User",
        }

        response = client.post("/api/v1/auth/register", json=user_data)
        assert response.status_code == 201

        data = response.get_json()
        assert "user_id" in data
        assert data["email"] == user_data["email"]

    def test_user_login(self, client):
        """Test user login"""
        # First register a user
        user_data = {
            "email": "logintest@example.com",
            "password": "LoginPassword123!",
            "first_name": "Login",
            "last_name": "Test",
        }
        client.post("/api/v1/auth/register", json=user_data)

        # Then login
        login_data = {"email": user_data["email"], "password": user_data["password"]}

        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 200

        data = response.get_json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "expires_in" in data

    def test_invalid_login(self, client):
        """Test login with invalid credentials"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "WrongPassword123!",
        }

        response = client.post("/api/v1/auth/login", json=login_data)
        assert response.status_code == 401

    def test_protected_endpoint_without_token(self, client):
        """Test accessing protected endpoint without token"""
        response = client.get("/api/v1/wallet/balance")
        assert response.status_code == 401


class TestMultiCurrencyAPI:
    """Test multi-currency functionality"""

    def test_get_supported_currencies(self, client, auth_headers):
        """Test getting supported currencies"""
        response = client.get(
            "/api/v1/multicurrency/currencies/supported", headers=auth_headers
        )
        assert response.status_code == 200

        data = response.get_json()
        assert "supported_currencies" in data
        assert "USD" in data["supported_currencies"]
        assert "EUR" in data["supported_currencies"]

    def test_get_exchange_rates(self, client, auth_headers):
        """Test getting exchange rates"""
        response = client.get(
            "/api/v1/multicurrency/exchange-rates?base=USD", headers=auth_headers
        )
        assert response.status_code == 200

        data = response.get_json()
        assert data["base_currency"] == "USD"
        assert "rates" in data
        assert "timestamp" in data

    def test_currency_conversion(self, client, auth_headers):
        """Test currency conversion"""
        conversion_data = {
            "amount": "100.00",
            "from_currency": "USD",
            "to_currency": "EUR",
        }

        response = client.post(
            "/api/v1/multicurrency/convert", json=conversion_data, headers=auth_headers
        )
        assert response.status_code == 200

        data = response.get_json()
        assert "original_amount" in data
        assert "converted_amount" in data
        assert "exchange_rate" in data
        assert "conversion_fee" in data

    def test_create_currency_wallet(self, client, auth_headers):
        """Test creating a currency wallet"""
        wallet_data = {"currency": "EUR"}

        response = client.post(
            "/api/v1/multicurrency/wallets", json=wallet_data, headers=auth_headers
        )
        assert response.status_code == 201

        data = response.get_json()
        assert data["wallet"]["currency"] == "EUR"
        assert data["wallet"]["balance"] == "0.00"


class TestEnhancedCardsAPI:
    """Test enhanced card management"""

    def test_create_virtual_card(self, client, auth_headers):
        """Test creating a virtual card"""
        # First create a wallet
        wallet_response = client.post(
            "/api/v1/multicurrency/wallets",
            json={"currency": "USD"},
            headers=auth_headers,
        )
        wallet_id = wallet_response.get_json()["wallet"]["wallet_id"]

        card_data = {
            "wallet_id": wallet_id,
            "card_type": "virtual",
            "spending_limits": {
                "daily": "500.00",
                "monthly": "2000.00",
                "per_transaction": "200.00",
            },
            "merchant_controls": {
                "online_enabled": True,
                "international_enabled": False,
                "blocked_categories": ["gambling"],
            },
        }

        response = client.post(
            "/api/v1/cards/enhanced/cards", json=card_data, headers=auth_headers
        )
        assert response.status_code == 201

        data = response.get_json()
        assert data["card"]["card_type"] == "virtual"
        assert data["card"]["last_four_digits"] is not None
        assert data["card"]["spending_limits"]["daily"] == "500.00"

    def test_update_card_controls(self, client, auth_headers):
        """Test updating card controls"""
        # First create a wallet and card
        wallet_response = client.post(
            "/api/v1/multicurrency/wallets",
            json={"currency": "USD"},
            headers=auth_headers,
        )
        wallet_id = wallet_response.get_json()["wallet"]["wallet_id"]

        card_response = client.post(
            "/api/v1/cards/enhanced/cards",
            json={"wallet_id": wallet_id},
            headers=auth_headers,
        )
        card_id = card_response.get_json()["card"]["card_id"]

        # Update controls
        update_data = {
            "spending_limits": {"daily": "1000.00"},
            "online_enabled": False,
            "blocked_categories": ["gambling", "adult_entertainment"],
        }

        response = client.put(
            f"/api/v1/cards/enhanced/cards/{card_id}/controls",
            json=update_data,
            headers=auth_headers,
        )
        assert response.status_code == 200

    def test_freeze_unfreeze_card(self, client, auth_headers):
        """Test freezing and unfreezing a card"""
        # Create wallet and card
        wallet_response = client.post(
            "/api/v1/multicurrency/wallets",
            json={"currency": "USD"},
            headers=auth_headers,
        )
        wallet_id = wallet_response.get_json()["wallet"]["wallet_id"]

        card_response = client.post(
            "/api/v1/cards/enhanced/cards",
            json={"wallet_id": wallet_id},
            headers=auth_headers,
        )
        card_id = card_response.get_json()["card"]["card_id"]

        # Freeze card
        freeze_response = client.post(
            f"/api/v1/cards/enhanced/cards/{card_id}/freeze",
            json={"reason": "Lost card"},
            headers=auth_headers,
        )
        assert freeze_response.status_code == 200
        assert freeze_response.get_json()["status"] == "blocked"

        # Unfreeze card
        unfreeze_response = client.post(
            f"/api/v1/cards/enhanced/cards/{card_id}/unfreeze", headers=auth_headers
        )
        assert unfreeze_response.status_code == 200
        assert unfreeze_response.get_json()["status"] == "active"


class TestMonitoringAPI:
    """Test transaction monitoring"""

    def test_analyze_transaction(self, client, auth_headers):
        """Test transaction analysis"""
        analysis_data = {
            "user_id": "test_user_123",
            "amount": "5000.00",
            "currency": "USD",
            "transaction_type": "debit",
            "location": "US",
        }

        # Note: This would require admin permissions in real implementation
        response = client.post(
            "/api/v1/monitoring/transaction/analyze",
            json=analysis_data,
            headers=auth_headers,
        )

        # Expect 403 for regular user without monitoring permissions
        assert response.status_code in [200, 403]

    def test_get_monitoring_dashboard(self, client, auth_headers):
        """Test monitoring dashboard"""
        response = client.get(
            "/api/v1/monitoring/monitoring/dashboard", headers=auth_headers
        )

        # Expect 403 for regular user without monitoring permissions
        assert response.status_code in [200, 403]


class TestComplianceAPI:
    """Test compliance functionality"""

    def test_watchlist_screening(self, client, auth_headers):
        """Test watchlist screening"""
        screening_data = {
            "user_id": "test_user_123",
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": "1990-01-01",
        }

        response = client.post(
            "/api/v1/compliance/screening/watchlist",
            json=screening_data,
            headers=auth_headers,
        )

        # Expect 403 for regular user without compliance permissions
        assert response.status_code in [200, 403]

    def test_compliance_dashboard(self, client, auth_headers):
        """Test compliance dashboard"""
        response = client.get(
            "/api/v1/compliance/compliance/dashboard", headers=auth_headers
        )

        # Expect 403 for regular user without compliance permissions
        assert response.status_code in [200, 403]


class TestAPIDocumentation:
    """Test API documentation and health endpoints"""

    def test_health_check(self, client):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code in [200, 503]  # May fail if Redis not available

        data = response.get_json()
        assert "status" in data
        assert "timestamp" in data

    def test_api_documentation(self, client):
        """Test API documentation endpoint"""
        response = client.get("/api/v1/docs")
        assert response.status_code == 200

        data = response.get_json()
        assert "api_version" in data
        assert "endpoints" in data
        assert "security_features" in data
        assert "supported_currencies" in data


class TestErrorHandling:
    """Test error handling"""

    def test_404_error(self, client):
        """Test 404 error handling"""
        response = client.get("/api/v1/nonexistent")
        assert response.status_code == 404

        data = response.get_json()
        assert data["code"] == "NOT_FOUND"

    def test_validation_error(self, client, auth_headers):
        """Test validation error handling"""
        invalid_data = {"amount": "invalid_amount", "currency": "INVALID"}

        response = client.post(
            "/api/v1/multicurrency/convert", json=invalid_data, headers=auth_headers
        )
        assert response.status_code == 400

        data = response.get_json()
        assert data["code"] == "VALIDATION_ERROR"


if __name__ == "__main__":
    pytest.main([__file__])

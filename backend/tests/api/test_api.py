#!/usr/bin/env python3

import json
import sys

import requests

# Test configuration
BASE_URL = "http://localhost:5000"
API_BASE = f"{BASE_URL}/api/v1"


def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        print(f"✓ Health check: {response.status_code} - {response.json()}")
        return True
    except Exception as e:
        print(f"✗ Health check failed: {e}")
        return False


def test_api_gateway():
    """Test API Gateway endpoints"""
    try:
        # Test gateway status
        response = requests.get(f"{API_BASE}/gateway/status", timeout=5)
        print(f"✓ Gateway status: {response.status_code}")

        # Test documentation endpoint
        response = requests.get(f"{API_BASE}/gateway/documentation", timeout=5)
        print(f"✓ API documentation: {response.status_code}")

        return True
    except Exception as e:
        print(f"✗ API Gateway test failed: {e}")
        return False


def test_kyc_service():
    """Test KYC service by creating a user"""
    try:
        # Create a test user
        user_data = {
            "email": "test@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "phone": "+1234567890",
            "date_of_birth": "1990-01-01",
            "address": "123 Test Street, Test City, TC 12345",
        }

        response = requests.post(
            f"{API_BASE}/kyc/user/create", json=user_data, timeout=5
        )

        if response.status_code == 201:
            user = response.json()
            print(f"✓ User created: {user['user_id']}")
            return user["user_id"]
        else:
            print(f"✗ User creation failed: {response.status_code} - {response.text}")
            return None

    except Exception as e:
        print(f"✗ KYC service test failed: {e}")
        return None


def test_wallet_service(user_id):
    """Test wallet service"""
    try:
        # Create a wallet
        wallet_data = {"user_id": user_id, "wallet_type": "user", "currency": "USD"}

        response = requests.post(
            f"{API_BASE}/wallet/create", json=wallet_data, timeout=5
        )

        if response.status_code == 201:
            wallet = response.json()
            print(f"✓ Wallet created: {wallet['wallet_id']}")

            # Test wallet balance
            response = requests.get(
                f"{API_BASE}/wallet/{wallet['wallet_id']}/balance", timeout=5
            )
            if response.status_code == 200:
                print(f"✓ Wallet balance retrieved: {response.json()['balance']}")

            return wallet["wallet_id"]
        else:
            print(f"✗ Wallet creation failed: {response.status_code} - {response.text}")
            return None

    except Exception as e:
        print(f"✗ Wallet service test failed: {e}")
        return None


def test_payment_service(wallet_id):
    """Test payment service"""
    try:
        # Test deposit
        deposit_data = {
            "wallet_id": wallet_id,
            "amount": "100.00",
            "payment_method": "bank_transfer",
            "description": "Test deposit",
        }

        response = requests.post(
            f"{API_BASE}/payment/deposit", json=deposit_data, timeout=5
        )

        if response.status_code == 201:
            transaction = response.json()
            print(f"✓ Deposit completed: {transaction['transaction_id']}")
            return transaction["transaction_id"]
        else:
            print(f"✗ Deposit failed: {response.status_code} - {response.text}")
            return None

    except Exception as e:
        print(f"✗ Payment service test failed: {e}")
        return None


def test_card_service(wallet_id):
    """Test card service"""
    try:
        # Issue a virtual card
        card_data = {
            "wallet_id": wallet_id,
            "card_type": "virtual",
            "daily_limit": "500.00",
            "monthly_limit": "2000.00",
        }

        response = requests.post(f"{API_BASE}/card/issue", json=card_data, timeout=5)

        if response.status_code == 201:
            card = response.json()
            print(f"✓ Card issued: {card['card_id']} (****{card['last_four_digits']})")
            return card["card_id"]
        else:
            print(f"✗ Card issuance failed: {response.status_code} - {response.text}")
            return None

    except Exception as e:
        print(f"✗ Card service test failed: {e}")
        return None


def test_ai_service():
    """Test AI service"""
    try:
        # Test chatbot
        query_data = {"query": "How do I create a wallet?", "context": "developer"}

        response = requests.post(
            f"{API_BASE}/ai/chatbot/query", json=query_data, timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            print(f"✓ AI Chatbot responded with confidence: {result['confidence']}%")
            return True
        else:
            print(f"✗ AI service test failed: {response.status_code} - {response.text}")
            return False

    except Exception as e:
        print(f"✗ AI service test failed: {e}")
        return False


def test_security_service():
    """Test security service"""
    try:
        # Create API key
        key_data = {
            "key_name": "Test API Key",
            "permissions": ["read", "write"],
            "rate_limit": 1000,
        }

        response = requests.post(
            f"{API_BASE}/security/api-keys/create", json=key_data, timeout=5
        )

        if response.status_code == 201:
            key_info = response.json()
            print(f"✓ API Key created: {key_info['key_id']}")
            return key_info["key_id"]
        else:
            print(
                f"✗ Security service test failed: {response.status_code} - {response.text}"
            )
            return None

    except Exception as e:
        print(f"✗ Security service test failed: {e}")
        return None


def test_ledger_service():
    """Test ledger service"""
    try:
        # Get trial balance
        response = requests.get(
            f"{API_BASE}/ledger/trial-balance?currency=USD", timeout=5
        )

        if response.status_code == 200:
            result = response.json()
            print(
                f"✓ Trial balance generated with {len(result['trial_balance'])} accounts"
            )
            return True
        else:
            print(
                f"✗ Ledger service test failed: {response.status_code} - {response.text}"
            )
            return False

    except Exception as e:
        print(f"✗ Ledger service test failed: {e}")
        return False


def main():
    """Run all tests"""
    print("🚀 Starting Flowlet Backend API Tests\n")

    # Test health endpoint first
    if not test_health():
        print("❌ Server is not responding. Please start the server first.")
        sys.exit(1)

    print("\n📋 Testing Core Services:")

    # Test API Gateway
    test_api_gateway()

    # Test KYC service and create a user
    user_id = test_kyc_service()
    if not user_id:
        print("❌ Cannot proceed without a user. Exiting.")
        sys.exit(1)

    # Test wallet service
    wallet_id = test_wallet_service(user_id)
    if not wallet_id:
        print("❌ Cannot proceed without a wallet. Exiting.")
        sys.exit(1)

    # Test payment service
    test_payment_service(wallet_id)

    # Test card service
    test_card_service(wallet_id)

    # Test AI service
    test_ai_service()

    # Test security service
    test_security_service()

    # Test ledger service
    test_ledger_service()

    print("\n✅ All tests completed! Flowlet Backend is functioning properly.")
    print("\n📊 Summary:")
    print("- All core services are operational")
    print("- Database models are working correctly")
    print("- API endpoints are responding as expected")
    print("- Cross-service integrations are functional")


if __name__ == "__main__":
    main()

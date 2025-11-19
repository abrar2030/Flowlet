"""
Simple test script for MVP functionality
"""

import json
import uuid
from datetime import datetime

import requests

# Base URL for the API
BASE_URL = "http://localhost:5001"


def test_health_check():
    """Test the health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health Check: {response.status_code}")
        if response.status_code == 200:
            print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False


def test_api_info():
    """Test the API info endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/info")
        print(f"API Info: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"API Name: {data.get('api_name')}")
            print(f"Version: {data.get('version')}")
            print(f"MVP Features: {data.get('mvp_features')}")
        return response.status_code == 200
    except Exception as e:
        print(f"API info failed: {e}")
        return False


def create_test_user():
    """Create a test user (mock function since we don't have user creation endpoint)"""
    # For testing purposes, we'll use a mock user ID
    return str(uuid.uuid4())


def test_wallet_creation(user_id):
    """Test wallet creation"""
    try:
        payload = {
            "user_id": user_id,
            "account_name": "Test Checking Account",
            "account_type": "checking",
            "currency": "USD",
            "initial_deposit": "100.00",
        }

        response = requests.post(
            f"{BASE_URL}/api/v1/wallet/create",
            json=payload,
            headers={"Content-Type": "application/json"},
        )

        print(f"Wallet Creation: {response.status_code}")
        if response.status_code == 201:
            data = response.json()
            print(f"Created wallet: {data.get('wallet', {}).get('id')}")
            return data.get("wallet", {}).get("id")
        else:
            print(f"Error: {response.text}")
            return None
    except Exception as e:
        print(f"Wallet creation failed: {e}")
        return None


def test_wallet_balance(wallet_id):
    """Test wallet balance inquiry"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/wallet/{wallet_id}/balance")
        print(f"Balance Inquiry: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Available Balance: ${data.get('available_balance')}")
            print(f"Current Balance: ${data.get('current_balance')}")
        else:
            print(f"Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Balance inquiry failed: {e}")
        return False


def test_deposit(wallet_id, amount):
    """Test deposit functionality"""
    try:
        payload = {"amount": str(amount), "description": "Test deposit"}

        response = requests.post(
            f"{BASE_URL}/api/v1/wallet/{wallet_id}/deposit",
            json=payload,
            headers={"Content-Type": "application/json"},
        )

        print(f"Deposit: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"New balance: ${data.get('new_balance')}")
        else:
            print(f"Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Deposit failed: {e}")
        return False


def test_withdrawal(wallet_id, amount):
    """Test withdrawal functionality"""
    try:
        payload = {"amount": str(amount), "description": "Test withdrawal"}

        response = requests.post(
            f"{BASE_URL}/api/v1/wallet/{wallet_id}/withdraw",
            json=payload,
            headers={"Content-Type": "application/json"},
        )

        print(f"Withdrawal: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"New balance: ${data.get('new_balance')}")
        else:
            print(f"Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Withdrawal failed: {e}")
        return False


def test_transaction_history(wallet_id):
    """Test transaction history"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/wallet/{wallet_id}/transactions")
        print(f"Transaction History: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            transactions = data.get("transactions", [])
            print(f"Found {len(transactions)} transactions")
            for tx in transactions[:3]:  # Show first 3 transactions
                print(
                    f"  - {tx.get('transaction_type')}: ${tx.get('amount')} - {tx.get('description')}"
                )
        else:
            print(f"Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Transaction history failed: {e}")
        return False


def test_transfer(from_wallet_id, to_wallet_id, amount):
    """Test transfer between wallets"""
    try:
        payload = {
            "from_wallet_id": from_wallet_id,
            "to_wallet_id": to_wallet_id,
            "amount": str(amount),
            "description": "Test transfer",
        }

        response = requests.post(
            f"{BASE_URL}/api/v1/payment/transfer",
            json=payload,
            headers={"Content-Type": "application/json"},
        )

        print(f"Transfer: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Transfer reference: {data.get('transfer_reference')}")
            print(
                f"From wallet new balance: ${data.get('from_wallet', {}).get('new_balance')}"
            )
            print(
                f"To wallet new balance: ${data.get('to_wallet', {}).get('new_balance')}"
            )
        else:
            print(f"Error: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Transfer failed: {e}")
        return False


def main():
    """Run all tests"""
    print("=== Flowlet MVP Testing ===")
    print()

    # Test basic endpoints
    print("1. Testing Health Check...")
    if not test_health_check():
        print("Health check failed. Is the server running?")
        return
    print()

    print("2. Testing API Info...")
    test_api_info()
    print()

    # Create test users
    print("3. Creating test users...")
    user1_id = create_test_user()
    user2_id = create_test_user()
    print(f"User 1 ID: {user1_id}")
    print(f"User 2 ID: {user2_id}")
    print()

    # Test wallet creation
    print("4. Testing Wallet Creation...")
    wallet1_id = test_wallet_creation(user1_id)
    wallet2_id = test_wallet_creation(user2_id)

    if not wallet1_id or not wallet2_id:
        print("Wallet creation failed. Cannot continue with tests.")
        return
    print()

    # Test balance inquiry
    print("5. Testing Balance Inquiry...")
    test_wallet_balance(wallet1_id)
    test_wallet_balance(wallet2_id)
    print()

    # Test deposit
    print("6. Testing Deposit...")
    test_deposit(wallet1_id, 50.00)
    test_wallet_balance(wallet1_id)
    print()

    # Test withdrawal
    print("7. Testing Withdrawal...")
    test_withdrawal(wallet1_id, 25.00)
    test_wallet_balance(wallet1_id)
    print()

    # Test transfer
    print("8. Testing Transfer...")
    test_transfer(wallet1_id, wallet2_id, 30.00)
    print("Balances after transfer:")
    test_wallet_balance(wallet1_id)
    test_wallet_balance(wallet2_id)
    print()

    # Test transaction history
    print("9. Testing Transaction History...")
    test_transaction_history(wallet1_id)
    test_transaction_history(wallet2_id)
    print()

    print("=== Testing Complete ===")


if __name__ == "__main__":
    main()

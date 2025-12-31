# Basic Wallet Operations

This example demonstrates creating a user account, wallet, and performing basic operations.

## Prerequisites

- Flowlet backend running at `http://localhost:5000`
- Python 3.11+ or cURL installed

## Complete Example

### Python Implementation

```python
import requests
import json

BASE_URL = "http://localhost:5000/api/v1"

# Step 1: Register a new user
print("1. Registering new user...")
register_response = requests.post(f"{BASE_URL}/auth/register", json={
    "email": "alice@example.com",
    "password": "SecurePass123!",
    "first_name": "Alice",
    "last_name": "Johnson"
})
user_data = register_response.json()
print(f"User registered: {user_data}")

# Step 2: Login to get access token
print("\n2. Logging in...")
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "alice@example.com",
    "password": "SecurePass123!"
})
auth_data = login_response.json()
access_token = auth_data["access_token"]
print(f"Access token obtained: {access_token[:20]}...")

# Step 3: Create authenticated headers
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# Step 4: Create a wallet
print("\n3. Creating wallet...")
wallet_response = requests.post(
    f"{BASE_URL}/accounts/wallets",
    headers=headers,
    json={
        "currency": "USD",
        "type": "personal",
        "name": "My Savings"
    }
)
wallet = wallet_response.json()
wallet_id = wallet["id"]
print(f"Wallet created: ID={wallet_id}, Balance={wallet['balance']}")

# Step 5: Deposit funds
print("\n4. Depositing funds...")
deposit_response = requests.post(
    f"{BASE_URL}/accounts/{wallet_id}/deposit",
    headers=headers,
    json={
        "amount": 500.00,
        "source": "bank_transfer",
        "description": "Initial deposit"
    }
)
deposit_result = deposit_response.json()
print(f"Deposit completed: {deposit_result}")

# Step 6: Check balance
print("\n5. Checking balance...")
balance_response = requests.get(
    f"{BASE_URL}/accounts/{wallet_id}",
    headers=headers
)
account_details = balance_response.json()
print(f"Current balance: ${account_details['account']['balance']}")

# Step 7: Get transaction history
print("\n6. Getting transaction history...")
print("Recent transactions:")
for txn in account_details['recent_transactions']:
    print(f"  - {txn['type']}: ${txn['amount']} on {txn['timestamp']}")
```

### cURL Implementation

```bash
#!/bin/bash

BASE_URL="http://localhost:5000/api/v1"

# Step 1: Register user
echo "1. Registering user..."
curl -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123!",
    "first_name": "Alice",
    "last_name": "Johnson"
  }'

# Step 2: Login
echo -e "\n\n2. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123!"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')
echo "Token: $TOKEN"

# Step 3: Create wallet
echo -e "\n3. Creating wallet..."
WALLET_RESPONSE=$(curl -s -X POST "$BASE_URL/accounts/wallets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currency": "USD",
    "type": "personal"
  }')

WALLET_ID=$(echo $WALLET_RESPONSE | jq -r '.id')
echo "Wallet ID: $WALLET_ID"

# Step 4: Deposit funds
echo -e "\n4. Depositing funds..."
curl -X POST "$BASE_URL/accounts/$WALLET_ID/deposit" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500.00,
    "source": "bank_transfer"
  }'

# Step 5: Check balance
echo -e "\n\n5. Checking balance..."
curl -X GET "$BASE_URL/accounts/$WALLET_ID" \
  -H "Authorization: Bearer $TOKEN"
```

## Expected Output

```
1. Registering user...
User registered: {'user_id': 'usr_abc123', 'email': 'alice@example.com', ...}

2. Logging in...
Access token obtained: eyJhbGciOiJIUzI1NiIs...

3. Creating wallet...
Wallet created: ID=acc_xyz789, Balance=0.00

4. Depositing funds...
Deposit completed: {'transaction_id': 'txn_def456', 'status': 'completed', ...}

5. Checking balance...
Current balance: $500.00

6. Getting transaction history...
Recent transactions:
  - deposit: $500.00 on 2025-01-01T12:00:00Z
```

## Error Handling

```python
try:
    response = requests.post(
        f"{BASE_URL}/accounts/wallets",
        headers=headers,
        json={"currency": "USD"}
    )
    response.raise_for_status()  # Raise exception for 4xx/5xx
    wallet = response.json()
except requests.exceptions.HTTPError as e:
    if response.status_code == 401:
        print("Error: Invalid or expired token")
    elif response.status_code == 400:
        print(f"Error: Invalid request - {response.json()}")
    else:
        print(f"Error: {e}")
except requests.exceptions.ConnectionError:
    print("Error: Could not connect to API server")
```

## Next Steps

- Try [payment-processing-flow.md](payment-processing-flow.md) to make a payment
- See [kyc-verification-workflow.md](kyc-verification-workflow.md) for KYC verification
- Review [API.md](../API.md) for complete API reference

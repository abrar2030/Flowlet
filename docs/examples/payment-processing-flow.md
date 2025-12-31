# Payment Processing Flow

Complete example of making a peer-to-peer payment between two users.

## Prerequisites

- Two user accounts with wallets
- Sufficient balance in sender's wallet
- Backend running at `http://localhost:5000`

## Example Code

```python
import requests
import time

BASE_URL = "http://localhost:5000/api/v1"

# Setup: Create two users (sender and recipient)
# User 1: Sender
sender_token = "SENDER_ACCESS_TOKEN"
sender_wallet_id = "acc_sender_123"

# User 2: Recipient
recipient_email = "bob@example.com"
recipient_wallet_id = "acc_recipient_456"

headers_sender = {
    "Authorization": f"Bearer {sender_token}",
    "Content-Type": "application/json"
}

# Step 1: Check sender balance
print("1. Checking sender balance...")
balance_response = requests.get(
    f"{BASE_URL}/accounts/{sender_wallet_id}",
    headers=headers_sender
)
sender_balance = float(balance_response.json()['account']['balance'])
print(f"Sender balance: ${sender_balance}")

# Step 2: Create payment
payment_amount = 100.00
print(f"\n2. Creating payment of ${payment_amount}...")

payment_response = requests.post(
    f"{BASE_URL}/payments",
    headers=headers_sender,
    json={
        "amount": payment_amount,
        "currency": "USD",
        "source_wallet_id": sender_wallet_id,
        "destination": recipient_email,
        "description": "Dinner payment",
        "metadata": {
            "occasion": "birthday_dinner",
            "participants": 4
        }
    }
)

if payment_response.status_code != 201:
    print(f"Error creating payment: {payment_response.json()}")
    exit(1)

payment = payment_response.json()
payment_id = payment["payment_id"]
print(f"Payment created: ID={payment_id}")
print(f"Status: {payment['status']}")

# Step 3: Monitor payment status
print("\n3. Monitoring payment status...")
max_attempts = 10
for attempt in range(max_attempts):
    status_response = requests.get(
        f"{BASE_URL}/payments/{payment_id}",
        headers=headers_sender
    )
    status_data = status_response.json()
    current_status = status_data['status']
    print(f"Attempt {attempt + 1}: Status = {current_status}")

    if current_status in ['completed', 'failed']:
        break

    time.sleep(2)

# Step 4: Verify final status
print("\n4. Payment final status...")
if current_status == 'completed':
    print(f"✓ Payment completed successfully!")
    print(f"Transaction ID: {status_data.get('transaction_id')}")
    print(f"Completed at: {status_data.get('completed_at')}")
else:
    print(f"✗ Payment failed")
    print(f"Reason: {status_data.get('failure_reason')}")

# Step 5: Verify balances updated
print("\n5. Verifying updated balances...")

# Check sender balance
sender_balance_after = requests.get(
    f"{BASE_URL}/accounts/{sender_wallet_id}",
    headers=headers_sender
).json()['account']['balance']

print(f"Sender balance after: ${sender_balance_after}")
print(f"Change: ${float(sender_balance_after) - sender_balance}")
```

## Batch Payment Example

```python
def send_batch_payments(sender_token, sender_wallet_id, payments):
    """Send multiple payments in batch."""
    headers = {
        "Authorization": f"Bearer {sender_token}",
        "Content-Type": "application/json"
    }

    results = []
    for payment_data in payments:
        response = requests.post(
            f"{BASE_URL}/payments",
            headers=headers,
            json={
                "source_wallet_id": sender_wallet_id,
                **payment_data
            }
        )
        results.append({
            "recipient": payment_data['destination'],
            "amount": payment_data['amount'],
            "payment_id": response.json().get('payment_id'),
            "status": response.status_code
        })

    return results

# Usage
batch_payments = [
    {"destination": "alice@example.com", "amount": 50.00, "description": "Payment 1"},
    {"destination": "bob@example.com", "amount": 75.00, "description": "Payment 2"},
    {"destination": "charlie@example.com", "amount": 100.00, "description": "Payment 3"},
]

results = send_batch_payments(sender_token, sender_wallet_id, batch_payments)
for result in results:
    print(f"Sent ${result['amount']} to {result['recipient']}: {result['payment_id']}")
```

## Error Handling

```python
try:
    payment_response = requests.post(
        f"{BASE_URL}/payments",
        headers=headers,
        json=payment_data
    )
    payment_response.raise_for_status()
    payment = payment_response.json()

except requests.exceptions.HTTPError as e:
    error_data = payment_response.json()
    error_code = error_data.get('error', {}).get('code')

    if error_code == 'INSUFFICIENT_BALANCE':
        print("Error: Not enough funds in wallet")
    elif error_code == 'KYC_REQUIRED':
        print("Error: KYC verification required before making payments")
    elif error_code == 'DAILY_LIMIT_EXCEEDED':
        print("Error: Daily transaction limit exceeded")
    else:
        print(f"Error: {error_data}")
```

## Expected Output

```
1. Checking sender balance...
Sender balance: $1000.00

2. Creating payment of $100.00...
Payment created: ID=pmt_abc123
Status: pending

3. Monitoring payment status...
Attempt 1: Status = pending
Attempt 2: Status = processing
Attempt 3: Status = completed

4. Payment final status...
✓ Payment completed successfully!
Transaction ID: txn_def456
Completed at: 2025-01-01T12:05:30Z

5. Verifying updated balances...
Sender balance after: $900.00
Change: $-100.00
```

## See Also

- [basic-wallet-operations.md](basic-wallet-operations.md) - Wallet setup
- [kyc-verification-workflow.md](kyc-verification-workflow.md) - KYC process
- [API.md](../API.md#payment-api) - Payment API reference

# KYC Verification Workflow

Complete Know Your Customer (KYC) verification process example.

## Prerequisites

- User account created
- Backend running at `http://localhost:5000`
- Valid identification documents

## Complete KYC Flow

```python
import requests
import time

BASE_URL = "http://localhost:5000/api/v1"
access_token = "YOUR_ACCESS_TOKEN"

headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}

# Step 1: Check current KYC status
print("1. Checking KYC status...")
status_response = requests.get(
    f"{BASE_URL}/kyc/status",
    headers=headers
)
kyc_status = status_response.json()
print(f"Current status: {kyc_status['status']}")

# Step 2: Submit KYC information
print("\n2. Submitting KYC information...")
kyc_data = {
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-05-15",
    "ssn": "123-45-6789",  # Or equivalent national ID
    "address": {
        "street": "123 Main Street",
        "city": "New York",
        "state": "NY",
        "postal_code": "10001",
        "country": "US"
    },
    "document_type": "passport",
    "document_number": "X12345678",
    "document_expiry": "2030-12-31"
}

kyc_response = requests.post(
    f"{BASE_URL}/kyc/submit",
    headers=headers,
    json=kyc_data
)

if kyc_response.status_code == 201:
    kyc_result = kyc_response.json()
    print(f"KYC submitted successfully!")
    print(f"Request ID: {kyc_result['request_id']}")
else:
    print(f"Error: {kyc_response.json()}")
    exit(1)

# Step 3: Upload document (if required)
print("\n3. Uploading identity document...")
# Note: File upload endpoint
with open('passport.jpg', 'rb') as doc_file:
    files = {'document': doc_file}
    upload_response = requests.post(
        f"{BASE_URL}/kyc/documents",
        headers={"Authorization": f"Bearer {access_token}"},
        files=files,
        data={'document_type': 'passport'}
    )
    if upload_response.status_code == 201:
        print("Document uploaded successfully")
    else:
        print(f"Upload failed: {upload_response.json()}")

# Step 4: Monitor verification status
print("\n4. Monitoring verification status...")
max_attempts = 20
for attempt in range(max_attempts):
    status_response = requests.get(
        f"{BASE_URL}/kyc/status",
        headers=headers
    )
    status_data = status_response.json()
    current_status = status_data['status']

    print(f"Attempt {attempt + 1}: {current_status}")

    if current_status in ['verified', 'rejected']:
        break

    time.sleep(5)  # Check every 5 seconds

# Step 5: Display final result
print("\n5. KYC Verification Result:")
if current_status == 'verified':
    print("✓ KYC Verification Successful!")
    print(f"Verification level: {status_data['verification_level']}")
    print(f"Transaction limits:")
    print(f"  - Daily: ${status_data['limits']['daily_transaction']}")
    print(f"  - Monthly: ${status_data['limits']['monthly_transaction']}")
else:
    print("✗ KYC Verification Failed")
    print(f"Reason: {status_data.get('rejection_reason')}")
    print(f"Next steps: {status_data.get('next_steps')}")
```

## Verification Tiers

| Tier       | Requirements          | Daily Limit | Monthly Limit | Features              |
| ---------- | --------------------- | ----------- | ------------- | --------------------- |
| **Tier 0** | Email only            | $100        | $500          | Basic wallet          |
| **Tier 1** | Basic info + Phone    | $1,000      | $5,000        | Deposits, withdrawals |
| **Tier 2** | Full KYC + Document   | $10,000     | $50,000       | Cards, payments       |
| **Tier 3** | Enhanced verification | $100,000    | $500,000      | Business accounts     |

## Document Requirements

```python
document_requirements = {
    "passport": {
        "required_fields": ["document_number", "expiry_date", "country"],
        "accepted_formats": ["JPG", "PNG", "PDF"],
        "max_file_size": "5MB"
    },
    "drivers_license": {
        "required_fields": ["license_number", "state", "expiry_date"],
        "accepted_formats": ["JPG", "PNG"],
        "max_file_size": "5MB"
    },
    "national_id": {
        "required_fields": ["id_number", "country"],
        "accepted_formats": ["JPG", "PNG", "PDF"],
        "max_file_size": "5MB"
    }
}
```

## Expected Output

```
1. Checking KYC status...
Current status: pending

2. Submitting KYC information...
KYC submitted successfully!
Request ID: kyc_req_abc123

3. Uploading identity document...
Document uploaded successfully

4. Monitoring verification status...
Attempt 1: pending
Attempt 2: under_review
Attempt 3: under_review
Attempt 4: verified

5. KYC Verification Result:
✓ KYC Verification Successful!
Verification level: tier_2
Transaction limits:
  - Daily: $10000.0
  - Monthly: $50000.0
```

## See Also

- [basic-wallet-operations.md](basic-wallet-operations.md) - Wallet management
- [API.md](../API.md#kycaml-api) - KYC API reference
- [CONFIGURATION.md](../CONFIGURATION.md) - KYC settings

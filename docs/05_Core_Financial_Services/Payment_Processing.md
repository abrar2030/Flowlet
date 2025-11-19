
# Payment API Documentation

The Payment API handles various financial transactions, including deposits, withdrawals, bank transfers, and card payments. It also includes functionality for managing transaction statuses and creating ledger entries.

## Base URL

`/api/v1/payment`

## Endpoints

### 1. Deposit Funds into a Wallet

`POST /api/v1/payment/deposit`

Deposits a specified amount of funds into a user's wallet.

#### Request Body

| Field               | Type     | Description                                     | Required |
| :------------------ | :------- | :---------------------------------------------- | :------- |
| `wallet_id`         | `string` | The unique ID of the target wallet.             | Yes      |
| `amount`            | `number` | The amount to deposit.                          | Yes      |
| `payment_method`    | `string` | The method of payment (e.g., `bank_transfer`, `credit_card`). | Yes      |
| `description`       | `string` | A description for the deposit.                  | Yes      |
| `external_transaction_id` | `string` | Optional: An ID from an external payment system. | No       |

#### Example Request

```json
{
    "wallet_id": "wallet_abc",
    "amount": 500.00,
    "payment_method": "bank_transfer",
    "description": "Initial funding"
}
```

#### Example Success Response (201 Created)

```json
{
    "transaction_id": "<generated_transaction_id>",
    "wallet_id": "wallet_abc",
    "amount": "500.00",
    "currency": "USD",
    "status": "completed",
    "reference_id": "PAY_ABC123DEF456",
    "payment_method": "bank_transfer",
    "new_balance": "500.00",
    "created_at": "2024-01-16T09:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Missing required field: amount"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Wallet not found"
}
```

### 2. Withdraw Funds from a Wallet

`POST /api/v1/payment/withdraw`

Withdraws a specified amount of funds from a user's wallet.

#### Request Body

| Field               | Type     | Description                                     | Required |
| :------------------ | :------- | :---------------------------------------------- | :------- |
| `wallet_id`         | `string` | The unique ID of the source wallet.             | Yes      |
| `amount`            | `number` | The amount to withdraw.                         | Yes      |
| `payment_method`    | `string` | The method of withdrawal (e.g., `bank_transfer`, `paypal`). | Yes      |
| `description`       | `string` | A description for the withdrawal.               | Yes      |
| `external_transaction_id` | `string` | Optional: An ID from an external payment system. | No       |

#### Example Request

```json
{
    "wallet_id": "wallet_abc",
    "amount": 100.00,
    "payment_method": "paypal",
    "description": "Withdrawal to PayPal"
}
```

#### Example Success Response (201 Created)

```json
{
    "transaction_id": "<generated_transaction_id>",
    "wallet_id": "wallet_abc",
    "amount": "100.00",
    "currency": "USD",
    "status": "completed",
    "reference_id": "PAY_XYZ789UVW012",
    "payment_method": "paypal",
    "new_balance": "400.00",
    "created_at": "2024-01-16T10:30:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Insufficient balance"
}
```

### 3. Process Bank Transfer (ACH, SEPA, Wire)

`POST /api/v1/payment/bank-transfer`

Initiates a bank transfer (ACH, SEPA, or Wire) to or from a wallet.

#### Request Body

| Field             | Type     | Description                                     | Required |
| :---------------- | :------- | :---------------------------------------------- | :------- |
| `wallet_id`       | `string` | The unique ID of the wallet involved.           | Yes      |
| `amount`          | `number` | The amount to transfer.                         | Yes      |
| `transfer_type`   | `string` | Type of bank transfer (`ACH`, `SEPA`, `WIRE`). | Yes      |
| `bank_details`    | `object` | Details of the recipient/sender bank account.   | Yes      |
| `description`     | `string` | A description for the bank transfer.            | Yes      |
| `direction`       | `string` | Optional: `incoming` or `outgoing`. Defaults to `outgoing`. | No       |
| `external_transaction_id` | `string` | Optional: An ID from an external payment system. | No       |

#### `bank_details` Object Structure

| Field             | Type     | Description                                     | Required |
| :---------------- | :------- | :---------------------------------------------- | :------- |
| `account_number`  | `string` | Bank account number.                            | Yes      |
| `routing_number`  | `string` | Bank routing number (e.g., ABA for ACH, BIC/SWIFT for SEPA/WIRE). | Yes      |
| `account_holder_name` | `string` | Name of the account holder.                     | Yes      |
| `bank_name`       | `string` | Name of the bank.                               | Yes      |

#### Example Request (Outgoing ACH)

```json
{
    "wallet_id": "wallet_abc",
    "amount": 250.00,
    "transfer_type": "ACH",
    "bank_details": {
        "account_number": "1234567890",
        "routing_number": "012345678",
        "account_holder_name": "John Doe",
        "bank_name": "Example Bank"
    },
    "description": "Payment for vendor services"
}
```

#### Example Success Response (201 Created)

```json
{
    "transaction_id": "<generated_transaction_id>",
    "wallet_id": "wallet_abc",
    "amount": "250.00",
    "currency": "USD",
    "transfer_type": "ACH",
    "status": "pending",
    "reference_id": "PAY_MNO345PQR678",
    "estimated_completion": "1-3 business days",
    "created_at": "2024-01-16T11:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Invalid transfer type"
}
```

### 4. Process Card Payment

`POST /api/v1/payment/card-payment`

Processes a payment using a card associated with a wallet.

#### Request Body

| Field             | Type     | Description                                     | Required |
| :---------------- | :------- | :---------------------------------------------- | :------- |
| `wallet_id`       | `string` | The unique ID of the wallet.                    | Yes      |
| `amount`          | `number` | The amount of the payment.                      | Yes      |
| `card_token`      | `string` | A token representing the card (e.g., from a payment gateway). | Yes      |
| `merchant_info`   | `object` | Details about the merchant.                     | Yes      |
| `description`     | `string` | A description for the card payment.             | Yes      |
| `external_transaction_id` | `string` | Optional: An ID from an external payment system. | No       |

#### `merchant_info` Object Structure

| Field             | Type     | Description                                     | Required |
| :---------------- | :------- | :---------------------------------------------- | :------- |
| `name`            | `string` | Name of the merchant.                           | Yes      |
| `category`        | `string` | Merchant category (e.g., `retail`, `food`).     | Yes      |
| `city`            | `string` | City of the merchant.                           | No       |
| `country`         | `string` | Country of the merchant.                        | No       |

#### Example Request

```json
{
    "wallet_id": "wallet_abc",
    "amount": 45.50,
    "card_token": "CTK_ABCDEFGHIJKLMNO",
    "merchant_info": {
        "name": "Online Store XYZ",
        "category": "online_retail",
        "city": "New York",
        "country": "USA"
    },
    "description": "Online purchase of electronics"
}
```

#### Example Success Response (201 Created)

```json
{
    "transaction_id": "<generated_transaction_id>",
    "wallet_id": "wallet_abc",
    "amount": "45.50",
    "currency": "USD",
    "status": "completed",
    "reference_id": "PAY_STU901VWX234",
    "merchant_info": {
        "name": "Online Store XYZ",
        "category": "online_retail",
        "city": "New York",
        "country": "USA"
    },
    "new_balance": "354.50",
    "created_at": "2024-01-16T12:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Insufficient balance"
}
```

### 5. Get Transaction Details

`GET /api/v1/payment/transaction/{transaction_id}`

Retrieves the details of a specific transaction.

#### Path Parameters

| Parameter        | Type     | Description                       |
| :--------------- | :------- | :-------------------------------- |
| `transaction_id` | `string` | The unique ID of the transaction. |

#### Example Request

```
GET /api/v1/payment/transaction/txn_001
```

#### Example Success Response (200 OK)

```json
{
    "transaction_id": "txn_001",
    "wallet_id": "wallet_abc",
    "type": "credit",
    "amount": "100.00",
    "currency": "USD",
    "description": "Initial deposit",
    "status": "completed",
    "payment_method": "bank_transfer",
    "reference_id": "REF12345",
    "external_transaction_id": null,
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-01T12:00:00.000Z"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Transaction not found"
}
```

### 6. Update Transaction Status

`PUT /api/v1/payment/transaction/{transaction_id}/status`

Updates the status of a transaction. This is typically used for external system callbacks (e.g., confirming a pending bank transfer).

#### Path Parameters

| Parameter        | Type     | Description                       |
| :--------------- | :------- | :-------------------------------- |
| `transaction_id` | `string` | The unique ID of the transaction. |

#### Request Body

| Field    | Type     | Description                                     | Required |
| :------- | :------- | :---------------------------------------------- | :------- |
| `status` | `string` | The new status of the transaction (`pending`, `completed`, `failed`, `cancelled`). | Yes      |

#### Example Request

```json
{
    "status": "completed"
}
```

#### Example Success Response (200 OK)

```json
{
    "transaction_id": "txn_001",
    "old_status": "pending",
    "new_status": "completed",
    "updated_at": "2024-01-16T13:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Invalid status"
}
```

### 7. Get Exchange Rate

`GET /api/v1/payment/exchange-rate/{from_currency}/{to_currency}`

Retrieves the current exchange rate between two currencies.

#### Path Parameters

| Parameter     | Type     | Description                               |
| :------------ | :------- | :---------------------------------------- |
| `from_currency` | `string` | The currency to convert from (e.g., `USD`). | Yes      |
| `to_currency` | `string` | The currency to convert to (e.g., `EUR`).   | Yes      |

#### Example Request

```
GET /api/v1/payment/exchange-rate/USD/EUR
```

#### Example Success Response (200 OK)

```json
{
    "from_currency": "USD",
    "to_currency": "EUR",
    "rate": "0.92",
    "last_updated": "2024-01-16T14:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Invalid currency codes"
}
```





### 8. Convert Amount Between Currencies

`POST /api/v1/payment/currency-conversion`

Converts a specified amount between two different currencies, transferring funds from a source wallet to a destination wallet.

#### Request Body

| Field            | Type     | Description                                     | Required |
| :--------------- | :------- | :---------------------------------------------- | :------- |
| `from_wallet_id` | `string` | The unique ID of the source wallet.             | Yes      |
| `to_wallet_id`   | `string` | The unique ID of the destination wallet.        | Yes      |
| `amount`         | `number` | The amount to convert from the source wallet.   | Yes      |

#### Example Request

```json
{
    "from_wallet_id": "wallet_abc",
    "to_wallet_id": "wallet_xyz",
    "amount": 100.00
}
```

#### Example Success Response (201 Created)

```json
{
    "conversion_id": "<generated_transaction_id>",
    "from_wallet_id": "wallet_abc",
    "to_wallet_id": "wallet_xyz",
    "original_amount": "100.00",
    "original_currency": "USD",
    "converted_amount": "92.00",
    "converted_currency": "EUR",
    "exchange_rate": "0.92",
    "status": "completed",
    "created_at": "2024-01-16T15:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Insufficient balance"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "One or both wallets not found"
}
```




## Financial Industry Standards and Considerations

As a critical component of a FinTech platform, the Payment API is developed with rigorous adherence to financial industry standards, emphasizing security, data integrity, compliance, and auditability. Each operation within this API incorporates best practices to ensure the reliability and trustworthiness of financial transactions and user data.

### Security

- **Secure Transaction Processing**: All payment transactions are processed over secure channels, utilizing encryption (e.g., TLS 1.2+) for data in transit to protect sensitive payment information from interception.
- **Tokenization**: For card payments, sensitive card details are not stored directly but are replaced with secure tokens. This minimizes the risk of data breaches and reduces PCI DSS compliance scope.
- **Fraud Prevention**: The API integrates with advanced fraud detection mechanisms, leveraging AI and machine learning models to analyze transaction patterns and identify suspicious activities in real-time. This includes checks for velocity, geographic, and behavioral anomalies.
- **Access Control**: Strict Role-Based Access Control (RBAC) and API key management are enforced to ensure that only authorized entities can initiate or query payment transactions. All API calls are authenticated and authorized against predefined permissions.

### Data Integrity

- **Atomic Transactions**: All payment operations, especially those involving fund movements (deposits, withdrawals, transfers, conversions), are designed as atomic transactions. This ensures that either all steps of a transaction are completed successfully, or none are, preventing partial updates and maintaining data consistency.
- **Double-Entry Accounting**: Every payment transaction generates corresponding double-entry ledger entries, ensuring that the financial books are always balanced. This provides an accurate and immutable record of all financial flows, crucial for reconciliation and auditing.
- **Precision for Monetary Values**: All monetary amounts are handled using `Decimal` data types to guarantee exact precision and avoid rounding errors or floating-point inaccuracies that can occur with standard floating-point numbers.

### Compliance

- **Regulatory Reporting**: The API facilitates the generation of data necessary for regulatory reporting, including transaction logs, audit trails, and customer activity records, to comply with financial regulations such as AML (Anti-Money Laundering) and CFT (Combating the Financing of Terrorism).
- **Sanctions Screening**: Payments are subject to real-time sanctions screening against global watchlists to prevent transactions with sanctioned entities or individuals, ensuring compliance with international financial regulations.
- **Payment Scheme Rules**: The API design and transaction flows adhere to the specific rules and requirements of various payment schemes (e.g., ACH, SEPA, SWIFT, card network rules) to ensure interoperability and compliance.

### Auditability

- **Comprehensive Audit Trails**: Detailed audit logs are maintained for every payment transaction, capturing essential information such as transaction initiation time, status changes, involved parties, amounts, and any associated fees. These logs are immutable and provide a complete historical record.
- **Unique Reference IDs**: Each transaction is assigned a unique, traceable reference ID, allowing for easy tracking and reconciliation across internal systems and external payment processors.
- **Timestamping**: All transaction events and status updates are precisely timestamped, providing a clear chronological record for forensic analysis, dispute resolution, and regulatory audits.

These considerations collectively ensure that the Payment API operates within the highest standards of the financial industry, providing a secure, reliable, and compliant platform for all payment-related activities.


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



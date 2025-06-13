
# Wallet API Documentation

The Wallet API provides endpoints for managing user wallets, including creation, retrieval, balance inquiries, transaction history, and internal transfers.

## Base URL

`/api/v1/wallet`

## Endpoints

### 1. Create a New Wallet

`POST /api/v1/wallet/create`

Creates a new digital wallet for a specified user.

#### Request Body

| Field         | Type     | Description                                     | Required |
| :------------ | :------- | :---------------------------------------------- | :------- |
| `user_id`     | `string` | The unique identifier of the user.              | Yes      |
| `wallet_type` | `string` | The type of wallet (e.g., `fiat`, `crypto`).    | Yes      |
| `currency`    | `string` | The currency of the wallet (e.g., `USD`, `EUR`). | Yes      |

#### Example Request

```json
{
    "user_id": "user_123",
    "wallet_type": "fiat",
    "currency": "USD"
}
```

#### Example Success Response (201 Created)

```json
{
    "wallet_id": "<generated_wallet_id>",
    "user_id": "user_123",
    "wallet_type": "fiat",
    "currency": "USD",
    "balance": "0.00",
    "available_balance": "0.00",
    "status": "active",
    "created_at": "2024-01-01T12:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Missing required field: user_id"
}
```

### 2. Get Wallet Details by ID

`GET /api/v1/wallet/{wallet_id}`

Retrieves the details of a specific wallet using its ID.

#### Path Parameters

| Parameter   | Type     | Description                |
| :---------- | :------- | :------------------------- |
| `wallet_id` | `string` | The unique ID of the wallet. |

#### Example Request

```
GET /api/v1/wallet/wallet_abc
```

#### Example Success Response (200 OK)

```json
{
    "wallet_id": "wallet_abc",
    "user_id": "user_123",
    "wallet_type": "fiat",
    "currency": "USD",
    "balance": "150.75",
    "available_balance": "150.75",
    "status": "active",
    "created_at": "2024-01-01T12:00:00.000Z",
    "updated_at": "2024-01-05T10:30:00.000Z"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Wallet not found"
}
```

### 3. Get Current Wallet Balance

`GET /api/v1/wallet/{wallet_id}/balance`

Retrieves the current balance and available balance of a specific wallet.

#### Path Parameters

| Parameter   | Type     | Description                |
| :---------- | :------- | :------------------------- |
| `wallet_id` | `string` | The unique ID of the wallet. |

#### Example Request

```
GET /api/v1/wallet/wallet_abc/balance
```

#### Example Success Response (200 OK)

```json
{
    "wallet_id": "wallet_abc",
    "balance": "150.75",
    "available_balance": "150.75",
    "currency": "USD",
    "last_updated": "2024-01-05T10:30:00.000Z"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Wallet not found"
}
```

### 4. Get Transaction History for a Wallet

`GET /api/v1/wallet/{wallet_id}/transactions`

Retrieves a paginated list of transaction history for a specific wallet.

#### Path Parameters

| Parameter   | Type     | Description                |
| :---------- | :------- | :------------------------- |
| `wallet_id` | `string` | The unique ID of the wallet. |

#### Query Parameters

| Parameter  | Type      | Description                                | Default |
| :--------- | :-------- | :----------------------------------------- | :------ |
| `page`     | `integer` | The page number for pagination.            | `1`     |
| `per_page` | `integer` | The number of transactions per page.       | `20`    |

#### Example Request

```
GET /api/v1/wallet/wallet_abc/transactions?page=1&per_page=10
```

#### Example Success Response (200 OK)

```json
{
    "wallet_id": "wallet_abc",
    "transactions": [
        {
            "transaction_id": "txn_001",
            "type": "credit",
            "amount": "100.00",
            "currency": "USD",
            "description": "Initial deposit",
            "status": "completed",
            "payment_method": "bank_transfer",
            "reference_id": "REF12345",
            "created_at": "2024-01-01T12:00:00.000Z"
        },
        {
            "transaction_id": "txn_002",
            "type": "debit",
            "amount": "50.00",
            "currency": "USD",
            "description": "Online purchase",
            "status": "completed",
            "payment_method": "card_payment",
            "reference_id": "REF67890",
            "created_at": "2024-01-02T14:30:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "per_page": 10,
        "total": 2,
        "pages": 1,
        "has_next": false,
        "has_prev": false
    }
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Wallet not found"
}
```

### 5. Freeze/Suspend a Wallet

`POST /api/v1/wallet/{wallet_id}/freeze`

Changes the status of a wallet to `suspended`, preventing further transactions.

#### Path Parameters

| Parameter   | Type     | Description                |
| :---------- | :------- | :------------------------- |
| `wallet_id` | `string` | The unique ID of the wallet. |

#### Example Request

```
POST /api/v1/wallet/wallet_abc/freeze
```

#### Example Success Response (200 OK)

```json
{
    "wallet_id": "wallet_abc",
    "status": "suspended",
    "message": "Wallet has been frozen successfully"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Wallet not found"
}
```

### 6. Unfreeze/Activate a Wallet

`POST /api/v1/wallet/{wallet_id}/unfreeze`

Changes the status of a wallet to `active`, allowing transactions again.

#### Path Parameters

| Parameter   | Type     | Description                |
| :---------- | :------- | :------------------------- |
| `wallet_id` | `string` | The unique ID of the wallet. |

#### Example Request

```
POST /api/v1/wallet/wallet_abc/unfreeze
```

#### Example Success Response (200 OK)

```json
{
    "wallet_id": "wallet_abc",
    "status": "active",
    "message": "Wallet has been unfrozen successfully"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Wallet not found"
}
```

### 7. Get All Wallets for a Specific User

`GET /api/v1/wallet/user/{user_id}`

Retrieves a list of all wallets associated with a given user ID.

#### Path Parameters

| Parameter | Type     | Description                            |
| :-------- | :------- | :------------------------------------- |
| `user_id` | `string` | The unique identifier of the user.     |

#### Example Request

```
GET /api/v1/wallet/user/user_123
```

#### Example Success Response (200 OK)

```json
{
    "user_id": "user_123",
    "wallets": [
        {
            "wallet_id": "wallet_abc",
            "wallet_type": "fiat",
            "currency": "USD",
            "balance": "150.75",
            "available_balance": "150.75",
            "status": "active",
            "created_at": "2024-01-01T12:00:00.000Z"
        },
        {
            "wallet_id": "wallet_xyz",
            "wallet_type": "crypto",
            "currency": "BTC",
            "balance": "0.5",
            "available_balance": "0.5",
            "status": "active",
            "created_at": "2024-01-10T09:00:00.000Z"
        }
    ],
    "total_wallets": 2
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "User not found"
}
```

### 8. Transfer Funds Between Wallets

`POST /api/v1/wallet/{wallet_id}/transfer`

Facilitates an internal transfer of funds from one wallet to another within the system.

#### Path Parameters

| Parameter   | Type     | Description                         |
| :---------- | :------- | :---------------------------------- |
| `wallet_id` | `string` | The unique ID of the source wallet. |

#### Request Body

| Field          | Type     | Description                                     | Required |
| :------------- | :------- | :---------------------------------------------- | :------- |
| `to_wallet_id` | `string` | The unique ID of the destination wallet.        | Yes      |
| `amount`       | `number` | The amount to transfer.                         | Yes      |
| `description`  | `string` | A description for the transfer.                 | Yes      |

#### Example Request

```json
{
    "to_wallet_id": "wallet_xyz",
    "amount": 25.00,
    "description": "Transfer for services rendered"
}
```

#### Example Success Response (200 OK)

```json
{
    "transfer_id": "<generated_transaction_id>",
    "from_wallet_id": "wallet_abc",
    "to_wallet_id": "wallet_xyz",
    "amount": "25.00",
    "currency": "USD",
    "status": "completed",
    "description": "Transfer for services rendered",
    "created_at": "2024-01-15T11:00:00.000Z"
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
    "error": "Source wallet not found"
}
```



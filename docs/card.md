
# Card API Documentation

The Card API enables the issuance and management of virtual and physical cards, including setting spending limits, controlling card usage, and retrieving card-related transactions.

## Base URL

`/api/v1/card`

## Endpoints

### 1. Issue a New Virtual or Physical Card

`POST /api/v1/card/issue`

Issues a new card linked to a specific wallet.

#### Request Body

| Field                | Type     | Description                                     | Required |
| :------------------- | :------- | :---------------------------------------------- | :------- |
| `wallet_id`          | `string` | The unique ID of the wallet to link the card to. | Yes      |
| `card_type`          | `string` | The type of card to issue (`virtual` or `physical`). | Yes      |
| `daily_limit`        | `number` | Optional: Daily spending limit for the card.    | No       |
| `monthly_limit`      | `number` | Optional: Monthly spending limit for the card.  | No       |
| `blocked_categories` | `array`  | Optional: List of merchant categories to block (e.g., `gambling`, `atm_withdrawals`). | No       |
| `online_enabled`     | `boolean` | Optional: Whether online transactions are enabled. Defaults to `true`. | No       |

#### Example Request

```json
{
    "wallet_id": "wallet_abc",
    "card_type": "virtual",
    "daily_limit": 500.00,
    "blocked_categories": ["gambling"]
}
```

#### Example Success Response (201 Created)

```json
{
    "card_id": "<generated_card_id>",
    "wallet_id": "wallet_abc",
    "card_type": "virtual",
    "last_four_digits": "1234",
    "expiry_month": 12,
    "expiry_year": 2027,
    "status": "active",
    "spending_limits": {
        "daily": "500.00",
        "monthly": "10000.00"
    },
    "controls": {
        "online_transactions_enabled": true,
        "blocked_categories": ["gambling"]
    },
    "created_at": "2024-01-17T09:00:00.000Z",
    "card_token": "CTK_ABCDEFGHIJKLMNO",
    "ready_for_use": true
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Invalid card type. Must be virtual or physical"
}
```

### 2. Get Card Details

`GET /api/v1/card/{card_id}`

Retrieves the details of a specific card.

#### Path Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `card_id` | `string` | The unique ID of the card. |

#### Example Request

```
GET /api/v1/card/card_xyz
```

#### Example Success Response (200 OK)

```json
{
    "card_id": "card_xyz",
    "wallet_id": "wallet_abc",
    "card_type": "physical",
    "last_four_digits": "5678",
    "expiry_month": 10,
    "expiry_year": 2026,
    "status": "active",
    "spending_limits": {
        "daily": "1000.00",
        "monthly": "10000.00"
    },
    "controls": {
        "online_transactions_enabled": true,
        "blocked_categories": []
    },
    "created_at": "2024-01-17T10:00:00.000Z",
    "updated_at": "2024-01-17T10:00:00.000Z"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Card not found"
}
```

### 3. Activate a Card

`POST /api/v1/card/{card_id}/activate`

Activates a card, typically used for physical cards after delivery.

#### Path Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `card_id` | `string` | The unique ID of the card. |

#### Request Body (for physical cards)

| Field             | Type     | Description                                     | Required |
| :---------------- | :------- | :---------------------------------------------- | :------- |
| `activation_code` | `string` | A 6-digit activation code provided with the physical card. | Yes      |

#### Example Request (Physical Card)

```json
{
    "activation_code": "123456"
}
```

#### Example Request (Virtual Card - no body needed)

```
POST /api/v1/card/card_xyz/activate
```

#### Example Success Response (200 OK)

```json
{
    "card_id": "card_xyz",
    "status": "active",
    "message": "Card activated successfully",
    "activated_at": "2024-01-17T11:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Activation code required for physical cards"
}
```

### 4. Freeze/Block a Card

`POST /api/v1/card/{card_id}/freeze`

Changes the status of a card to `blocked`, preventing further transactions.

#### Path Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `card_id` | `string` | The unique ID of the card. |

#### Example Request

```
POST /api/v1/card/card_xyz/freeze
```

#### Example Success Response (200 OK)

```json
{
    "card_id": "card_xyz",
    "status": "blocked",
    "message": "Card has been frozen successfully",
    "frozen_at": "2024-01-17T12:00:00.000Z"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Card not found"
}
```

### 5. Unfreeze/Unblock a Card

`POST /api/v1/card/{card_id}/unfreeze`

Changes the status of a card back to `active`.

#### Path Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `card_id` | `string` | The unique ID of the card. |

#### Example Request

```
POST /api/v1/card/card_xyz/unfreeze
```

#### Example Success Response (200 OK)

```json
{
    "card_id": "card_xyz",
    "status": "active",
    "message": "Card has been unfrozen successfully",
    "unfrozen_at": "2024-01-17T13:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Cannot unfreeze a cancelled card"
}
```

### 6. Cancel a Card Permanently

`POST /api/v1/card/{card_id}/cancel`

Cancels a card permanently.

#### Path Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `card_id` | `string` | The unique ID of the card. |

#### Request Body

| Field    | Type     | Description                                     | Required |
| :------- | :------- | :---------------------------------------------- | :------- |
| `reason` | `string` | Optional: Reason for cancellation.              | No       |

#### Example Request

```json
{
    "reason": "Lost card"
}
```

#### Example Success Response (200 OK)

```json
{
    "card_id": "card_xyz",
    "status": "cancelled",
    "reason": "Lost card",
    "message": "Card has been cancelled permanently",
    "cancelled_at": "2024-01-17T14:00:00.000Z"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Card not found"
}
```

### 7. Update Card Spending Limits

`PUT /api/v1/card/{card_id}/limits`

Updates the daily and/or monthly spending limits for a card.

#### Path Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `card_id` | `string` | The unique ID of the card. |

#### Request Body

| Field           | Type     | Description                                     | Required |
| :-------------- | :------- | :---------------------------------------------- | :------- |
| `daily_limit`   | `number` | Optional: New daily spending limit.             | No       |
| `monthly_limit` | `number` | Optional: New monthly spending limit.           | No       |

#### Example Request

```json
{
    "daily_limit": 750.00
}
```

#### Example Success Response (200 OK)

```json
{
    "card_id": "card_xyz",
    "spending_limits": {
        "daily": "750.00",
        "monthly": "10000.00"
    },
    "updated_at": "2024-01-17T15:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Cannot update limits for cancelled or expired cards"
}
```

### 8. Update Card Controls

`PUT /api/v1/card/{card_id}/controls`

Updates card controls such as enabling/disabling online transactions or blocking merchant categories.

#### Path Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `card_id` | `string` | The unique ID of the card. |

#### Request Body

| Field                | Type      | Description                                     | Required |
| :------------------- | :-------- | :---------------------------------------------- | :------- |
| `online_transactions_enabled` | `boolean` | Optional: Whether online transactions are enabled. | No       |
| `blocked_categories` | `array`   | Optional: List of merchant categories to block. | No       |

#### Example Request

```json
{
    "online_transactions_enabled": false,
    "blocked_categories": ["restaurants", "travel"]
}
```

#### Example Success Response (200 OK)

```json
{
    "card_id": "card_xyz",
    "controls": {
        "online_transactions_enabled": false,
        "blocked_categories": ["restaurants", "travel"]
    },
    "updated_at": "2024-01-17T16:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Invalid merchant category: invalid_category"
}
```

### 9. Update Card PIN

`PUT /api/v1/card/{card_id}/pin`

Updates the PIN for a card.

#### Path Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `card_id` | `string` | The unique ID of the card. |

#### Request Body

| Field     | Type     | Description                                     | Required |
| :-------- | :------- | :---------------------------------------------- | :------- |
| `new_pin` | `string` | The new 4-digit PIN.                            | Yes      |

#### Example Request

```json
{
    "new_pin": "4321"
}
```

#### Example Success Response (200 OK)

```json
{
    "card_id": "card_xyz",
    "message": "PIN updated successfully",
    "updated_at": "2024-01-17T17:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "PIN must be exactly 4 digits"
}
```

### 10. Get Transaction History for a Specific Card

`GET /api/v1/card/{card_id}/transactions`

Retrieves a paginated list of transaction history related to a specific card.

#### Path Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `card_id` | `string` | The unique ID of the card. |

#### Query Parameters

| Parameter  | Type      | Description                                | Default |
| :--------- | :-------- | :----------------------------------------- | :------ |
| `page`     | `integer` | The page number for pagination.            | `1`     |
| `per_page` | `integer` | The number of transactions per page.       | `20`    |

#### Example Request

```
GET /api/v1/card/card_xyz/transactions?page=1&per_page=10
```

#### Example Success Response (200 OK)

```json
{
    "card_id": "card_xyz",
    "transactions": [
        {
            "transaction_id": "txn_003",
            "type": "debit",
            "amount": "25.00",
            "currency": "USD",
            "description": "Coffee shop purchase",
            "status": "completed",
            "reference_id": "CARD_TXN_001",
            "created_at": "2024-01-17T18:00:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "per_page": 10,
        "total": 1,
        "pages": 1,
        "has_next": false,
        "has_prev": false
    }
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Card not found"
}
```

### 11. Get All Cards for a Specific Wallet

`GET /api/v1/card/wallet/{wallet_id}`

Retrieves a list of all cards associated with a given wallet ID.

#### Path Parameters

| Parameter   | Type     | Description                |
| :---------- | :------- | :------------------------- |
| `wallet_id` | `string` | The unique ID of the wallet. |

#### Example Request

```
GET /api/v1/card/wallet/wallet_abc
```

#### Example Success Response (200 OK)

```json
{
    "wallet_id": "wallet_abc",
    "cards": [
        {
            "card_id": "card_xyz",
            "card_type": "physical",
            "last_four_digits": "5678",
            "expiry_month": 10,
            "expiry_year": 2026,
            "status": "active",
            "spending_limits": {
                "daily": "1000.00",
                "monthly": "10000.00"
            },
            "created_at": "2024-01-17T10:00:00.000Z"
        },
        {
            "card_id": "card_uvw",
            "card_type": "virtual",
            "last_four_digits": "9012",
            "expiry_month": 12,
            "expiry_year": 2027,
            "status": "active",
            "spending_limits": {
                "daily": "500.00",
                "monthly": "5000.00"
            },
            "created_at": "2024-01-17T09:00:00.000Z"
        }
    ],
    "total_cards": 2
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Wallet not found"
}
```

### 12. Get Card Spending Analysis

`GET /api/v1/card/{card_id}/spending-analysis`

Provides an analysis of spending patterns for a specific card, categorized by merchant type.

#### Path Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `card_id` | `string` | The unique ID of the card. |

#### Query Parameters

| Parameter | Type     | Description                                     | Default |
| :-------- | :------- | :---------------------------------------------- | :------ |
| `period`  | `string` | Optional: Time period for analysis (`daily`, `weekly`, `monthly`, `yearly`). | `monthly` |

#### Example Request

```
GET /api/v1/card/card_xyz/spending-analysis?period=monthly
```

#### Example Success Response (200 OK)

```json
{
    "card_id": "card_xyz",
    "period": "monthly",
    "total_spent": "150.75",
    "spending_by_category": {
        "restaurants": "75.25",
        "online_retail": "50.00",
        "transportation": "25.50"
    },
    "currency": "USD",
    "analysis_date": "2024-01-31T23:59:59.000Z"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Card not found"
}
```



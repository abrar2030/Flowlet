
# AI Service API Documentation

The AI Service API provides functionalities for fraud detection and a chatbot for assistance. It leverages AI algorithms to analyze transactions for suspicious activities and offers automated responses to common queries.

## Base URL

`/api/v1/ai`

## Endpoints

### 1. Analyze Transaction for Fraud

`POST /api/v1/ai/fraud-detection/analyze`

Analyzes a given transaction for potential fraud using AI algorithms. It considers various factors like transaction amount, velocity, geographic location, and merchant category.

#### Request Body

| Field           | Type     | Description                                     | Required |
| :-------------- | :------- | :---------------------------------------------- | :------- |
| `transaction_id` | `string` | The unique ID of the transaction to analyze.    | Yes      |
| `user_id`       | `string` | The unique ID of the user involved in the transaction. | Yes      |
| `amount`        | `number` | The amount of the transaction.                  | Yes      |
| `merchant_info` | `object` | Details about the merchant.                     | Yes      |
| `wallet_id`     | `string` | Optional: The unique ID of the wallet involved. | No       |
| `user_location` | `string` | Optional: The user's current geographic location (e.g., `US`, `GB`). | No       |
| `new_device`    | `boolean` | Optional: Indicates if the transaction is from a new device. | No       |
| `suspicious_ip` | `boolean` | Optional: Indicates if the transaction is from a suspicious IP address. | No       |

#### `merchant_info` Object Structure

| Field      | Type     | Description                                     | Required |
| :--------- | :------- | :---------------------------------------------- | :------- |
| `name`     | `string` | Name of the merchant.                           | Yes      |
| `category` | `string` | Merchant category (e.g., `retail`, `food`).     | Yes      |
| `location` | `string` | Optional: Geographic location of the merchant.  | No       |

#### Example Request

```json
{
    "transaction_id": "txn_001",
    "user_id": "user_123",
    "amount": 150.75,
    "merchant_info": {
        "name": "Online Gadgets",
        "category": "electronics",
        "location": "US"
    },
    "user_location": "US",
    "new_device": false,
    "suspicious_ip": false
}
```

#### Example Success Response (200 OK)

```json
{
    "transaction_id": "txn_001",
    "fraud_analysis": {
        "risk_score": 20,
        "risk_level": "low",
        "risk_factors": [],
        "recommended_action": "monitor",
        "confidence": 64
    },
    "alert_created": false,
    "alert_id": null,
    "analysis_timestamp": "2024-01-19T10:00:00.000Z",
    "model_version": "FlowletAI-FraudDetection-v2.1"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Missing required field: transaction_id"
}
```

### 2. Get Fraud Alerts

`GET /api/v1/ai/fraud-detection/alerts`

Retrieves a paginated list of fraud alerts, with optional filtering by status, risk level, or user ID.

#### Query Parameters

| Parameter  | Type     | Description                                     | Default |
| :--------- | :------- | :---------------------------------------------- | :------ |
| `page`     | `integer` | The page number for pagination.                 | `1`     |
| `per_page` | `integer` | The number of alerts per page.                  | `20`    |
| `status`   | `string` | Optional: Filter by alert status (`open`, `resolved`, `false_positive`, `investigating`). | No       |
| `risk_level` | `string` | Optional: Filter by risk level (`high`, `medium`, `low`, `very_low`). | No       |
| `user_id`  | `string` | Optional: Filter alerts for a specific user.    | No       |

#### Example Request

```
GET /api/v1/ai/fraud-detection/alerts?status=open&risk_level=high
```

#### Example Success Response (200 OK)

```json
{
    "alerts": [
        {
            "alert_id": "ALERT_XYZ789",
            "transaction_id": "txn_005",
            "user_id": "user_456",
            "alert_type": "suspicious_transaction",
            "risk_score": 75,
            "description": "AI detected suspicious transaction: unusually_high_amount, geographic_mismatch",
            "status": "open",
            "created_at": "2024-01-19T11:00:00.000Z",
            "resolved_at": null
        }
    ],
    "pagination": {
        "page": 1,
        "per_page": 20,
        "total": 1,
        "pages": 1,
        "has_next": false,
        "has_prev": false
    },
    "filters_applied": {
        "status": "open",
        "risk_level": "high",
        "user_id": null
    }
}
```

### 3. Resolve Fraud Alert

`POST /api/v1/ai/fraud-detection/alerts/{alert_id}/resolve`

Resolves a specific fraud alert, updating its status and adding resolution notes.

#### Path Parameters

| Parameter  | Type     | Description                       |
| :--------- | :------- | :-------------------------------- |
| `alert_id` | `string` | The unique ID of the fraud alert. |

#### Request Body

| Field        | Type     | Description                                     | Required |
| :----------- | :------- | :---------------------------------------------- | :------- |
| `resolution` | `string` | The resolution status (`resolved`, `false_positive`, `investigating`). | No       |
| `notes`      | `string` | Optional: Additional notes about the resolution. | No       |

#### Example Request

```json
{
    "resolution": "false_positive",
    "notes": "Confirmed legitimate transaction with user."
}
```

#### Example Success Response (200 OK)

```json
{
    "alert_id": "ALERT_XYZ789",
    "status": "false_positive",
    "resolved_at": "2024-01-19T12:00:00.000Z",
    "message": "Alert resolved successfully"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Alert not found"
}
```

### 4. AI Support Chatbot Query

`POST /api/v1/ai/chatbot/query`

Provides an AI-powered chatbot interface for developer and user assistance, answering queries related to Flowlet APIs and services.

#### Request Body

| Field     | Type     | Description                                     | Required |
| :-------- | :------- | :---------------------------------------------- | :------- |
| `query`   | `string` | The user's query or question.                   | Yes      |
| `context` | `string` | Optional: The context of the query (`general`, `developer`, `user`). | No       |

#### Example Request

```json
{
    "query": "How do I create a wallet?",
    "context": "developer"
}
```

#### Example Success Response (200 OK)

```json
{
    "conversation_id": "CONV_ABC123",
    "response": "To create a wallet, use the POST /api/v1/wallet/create endpoint. You'll need to provide user_id, wallet_type, and currency in the request body.",
    "confidence": 95,
    "timestamp": "2024-01-19T13:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Missing required field: query"
}
```



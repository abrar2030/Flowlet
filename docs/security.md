
# Security API Documentation

The Security API provides functionalities for managing API keys, auditing system events, and handling sensitive data tokenization. It ensures secure access to Flowlet services and maintains a comprehensive log of all critical actions.

## Base URL

`/api/v1/security`

## Endpoints

### 1. Create a New API Key

`POST /api/v1/security/api-keys/create`

Generates a new API key with specified permissions and rate limits. The API key is returned only once upon creation.

#### Request Body

| Field            | Type     | Description                                     | Required |
| :--------------- | :------- | :---------------------------------------------- | :------- |
| `key_name`       | `string` | A descriptive name for the API key.             | Yes      |
| `permissions`    | `array`  | Optional: List of permissions (e.g., `read`, `write`, `admin`, `wallet`, `payment`). Defaults to `["read", "write"]`. | No       |
| `rate_limit`     | `integer` | Optional: Maximum requests per hour. Defaults to `1000`. | No       |
| `expires_in_days` | `integer` | Optional: Number of days until the key expires. Defaults to `365`. | No       |

#### Example Request

```json
{
    "key_name": "MyWebAppIntegration",
    "permissions": ["wallet", "payment"],
    "rate_limit": 5000
}
```

#### Example Success Response (201 Created)

```json
{
    "key_id": "<generated_key_id>",
    "api_key": "flw_abcdefghijklmnopqrstuvwxyz1234567890",
    "key_name": "MyWebAppIntegration",
    "permissions": ["wallet", "payment"],
    "rate_limit": 5000,
    "expires_at": "2025-01-19T10:00:00.000Z",
    "created_at": "2024-01-19T10:00:00.000Z",
    "warning": "Store this API key securely. It will not be shown again."
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Missing required field: key_name"
}
```

### 2. List All API Keys

`GET /api/v1/security/api-keys`

Retrieves a paginated list of all API keys, without exposing the actual key values.

#### Query Parameters

| Parameter  | Type     | Description                                     | Default |
| :--------- | :------- | :---------------------------------------------- | :------ |
| `page`     | `integer` | The page number for pagination.                 | `1`     |
| `per_page` | `integer` | The number of API keys per page.                | `20`    |

#### Example Request

```
GET /api/v1/security/api-keys?page=1
```

#### Example Success Response (200 OK)

```json
{
    "api_keys": [
        {
            "key_id": "key_abc",
            "key_name": "MyWebAppIntegration",
            "permissions": ["wallet", "payment"],
            "rate_limit": 5000,
            "is_active": true,
            "created_at": "2024-01-19T10:00:00.000Z",
            "last_used_at": "2024-01-19T11:30:00.000Z",
            "expires_at": "2025-01-19T10:00:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "per_page": 20,
        "total": 1,
        "pages": 1,
        "has_next": false,
        "has_prev": false
    }
}
```

### 3. Revoke an API Key

`POST /api/v1/security/api-keys/{key_id}/revoke`

Deactivates an API key, rendering it unusable for further requests.

#### Path Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `key_id`  | `string` | The unique ID of the API key to revoke. |

#### Example Request

```
POST /api/v1/security/api-keys/key_abc/revoke
```

#### Example Success Response (200 OK)

```json
{
    "key_id": "key_abc",
    "message": "API key revoked successfully",
    "revoked_at": "2024-01-19T12:00:00.000Z"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "API key not found"
}
```

### 4. Update API Key Permissions

`PUT /api/v1/security/api-keys/{key_id}/permissions`

Modifies the permissions and/or rate limit of an existing API key.

#### Path Parameters

| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `key_id`  | `string` | The unique ID of the API key to update. |

#### Request Body

| Field          | Type     | Description                                     | Required |
| :------------- | :------- | :---------------------------------------------- | :------- |
| `permissions`  | `array`  | New list of permissions for the API key.        | Yes      |
| `rate_limit`   | `integer` | Optional: New maximum requests per hour.        | No       |

#### Example Request

```json
{
    "permissions": ["read", "admin"],
    "rate_limit": 10000
}
```

#### Example Success Response (200 OK)

```json
{
    "key_id": "key_abc",
    "permissions": ["read", "admin"],
    "rate_limit": 10000,
    "updated_at": "2024-01-19T13:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Invalid permission: invalid_permission"
}
```

### 5. Get Audit Logs

`GET /api/v1/security/audit-logs`

Retrieves a paginated list of system audit logs, with filtering options.

#### Query Parameters

| Parameter     | Type     | Description                                     | Default |
| :------------ | :------- | :---------------------------------------------- | :------ |
| `page`        | `integer` | The page number for pagination.                 | `1`     |
| `per_page`    | `integer` | The number of logs per page.                    | `50`    |
| `user_id`     | `string` | Optional: Filter logs by user ID.               | No       |
| `action`      | `string` | Optional: Filter logs by action (e.g., `create_api_key`, `login`). | No       |
| `resource_type` | `string` | Optional: Filter logs by resource type (e.g., `api_key`, `wallet`). | No       |
| `start_date`  | `string` | Optional: Start date for log filtering (`YYYY-MM-DD`). | No       |
| `end_date`    | `string` | Optional: End date for log filtering (`YYYY-MM-DD`).   | No       |

#### Example Request

```
GET /api/v1/security/audit-logs?action=create_api_key&start_date=2024-01-01
```

#### Example Success Response (200 OK)

```json
{
    "audit_logs": [
        {
            "log_id": "log_001",
            "user_id": "user_admin",
            "action": "create_api_key",
            "resource_type": "api_key",
            "resource_id": "key_abc",
            "ip_address": "192.168.1.1",
            "user_agent": "Mozilla/5.0",
            "request_data": {
                "key_name": "MyWebAppIntegration"
            },
            "response_status": 201,
            "created_at": "2024-01-19T10:00:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "per_page": 50,
        "total": 1,
        "pages": 1,
        "has_next": false,
        "has_prev": false
    },
    "filters_applied": {
        "user_id": null,
        "action": "create_api_key",
        "resource_type": null,
        "start_date": "2024-01-01",
        "end_date": null
    }
}
```

### 6. Tokenize Sensitive Data

`POST /api/v1/security/encryption/tokenize`

Converts sensitive data (e.g., credit card numbers, bank account details) into a non-sensitive token. In a production environment, this token would map to the actual data in a secure vault.

#### Request Body

| Field          | Type     | Description                                     | Required |
| :------------- | :------- | :---------------------------------------------- | :------- |
| `sensitive_data` | `string` | The sensitive data to tokenize.                 | Yes      |
| `data_type`    | `string` | Optional: Type of data being tokenized (e.g., `credit_card`, `bank_account`). Defaults to `generic`. | No       |
| `user_id`      | `string` | Optional: The user ID associated with the data. | No       |

#### Example Request

```json
{
    "sensitive_data": "4111222233334444",
    "data_type": "credit_card"
}
```

#### Example Success Response (200 OK)

```json
{
    "token": "TOK_CREDIT_CARD_AbcDefGhIjKlMnOpQrStUv",
    "data_type": "credit_card",
    "tokenized_at": "2024-01-19T14:00:00.000Z",
    "expires_at": "2025-01-19T14:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Missing required field: sensitive_data"
}
```

### 7. Detokenize Sensitive Data

`POST /api/v1/security/encryption/detokenize`

Retrieves the original sensitive data from a given token. This operation should be highly restricted and auditable.

#### Request Body

| Field   | Type     | Description                                     | Required |
| :------ | :------- | :---------------------------------------------- | :------- |
| `token` | `string` | The token representing the sensitive data.      | Yes      |
| `user_id` | `string` | Optional: The user ID associated with the data. | No       |

#### Example Request

```json
{
    "token": "TOK_CREDIT_CARD_AbcDefGhIjKlMnOpQrStUv"
}
```

#### Example Success Response (200 OK)

```json
{
    "token": "TOK_CREDIT_CARD_AbcDefGhIjKlMnOpQrStUv",
    "sensitive_data": "[REDACTED - Would contain original data in production]",
    "detokenized_at": "2024-01-19T15:00:00.000Z",
    "access_logged": true
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Invalid token format"
}
```

### 8. Perform Security Scan

`POST /api/v1/security/scan`

Initiates a security scan on a user account or transaction to identify potential vulnerabilities or risks.

#### Request Body

| Field       | Type     | Description                                     | Required |
| :---------- | :------- | :---------------------------------------------- | :------- |
| `scan_type` | `string` | Optional: Type of scan (`account` or `transaction`). Defaults to `account`. | No       |
| `target_id` | `string` | The ID of the account or transaction to scan.   | Yes      |

#### Example Request

```json
{
    "scan_type": "account",
    "target_id": "user_123"
}
```

#### Example Success Response (200 OK)

```json
{
    "scan_id": "SCAN_ABC123DEF456",
    "scan_type": "account",
    "target_id": "user_123",
    "security_score": 85,
    "vulnerabilities": [
        {
            "severity": "medium",
            "type": "weak_password",
            "description": "Password does not meet complexity requirements"
        }
    ],
    "recommendations": [
        "Update password with stronger complexity"
    ],
    "checks_performed": [
        "Password strength",
        "Two-factor authentication",
        "Recent login patterns",
        "Device security",
        "API key usage"
    ],
    "scan_timestamp": "2024-01-19T16:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Missing required field: target_id"
}
```



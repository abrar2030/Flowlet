# Security API Documentation

The Security API provides a suite of functionalities essential for maintaining the integrity, confidentiality, and availability of the Flowlet platform and its financial data. It encompasses API key management, audit logging, data tokenization, and security scanning, all designed to meet stringent financial industry security standards.

## Base URL

`/api/v1/security`

## Financial Industry Standards and Considerations

- **API Key Management**: Implements a robust system for generating, listing, revoking, and updating permissions for API keys. API keys are hashed for secure storage, have configurable expiration dates, and their usage is logged, aligning with best practices for secure API access in financial services.
- **Comprehensive Audit Logging**: All significant security-related events and API key actions are meticulously logged. Audit logs include details such as user ID, action performed, resource type, IP address, and response status, providing an immutable record for compliance, forensic analysis, and security monitoring.
- **Data Tokenization and Detokenization**: Provides mechanisms for tokenizing sensitive data (e.g., card numbers, bank account details) to reduce the scope of PCI DSS and other data privacy compliance requirements. Original sensitive data is replaced with non-sensitive tokens, minimizing exposure in systems and logs. Detokenization is a controlled process with strict access logging.
- **Security Scanning**: Offers an endpoint to perform security scans on user accounts or transactions. While simulated in this implementation, in a production environment, this would integrate with advanced security tools to identify vulnerabilities, suspicious patterns, and provide actionable recommendations, crucial for proactive threat management in Fintech.
- **Secure Hashing and Cryptography**: Utilizes strong cryptographic hashing algorithms (SHA256) for API key storage and password management, preventing plaintext exposure of sensitive credentials.
- **Access Control and Permissions**: API key permissions are granular, allowing for fine-grained control over what actions an API key can perform. This adheres to the principle of least privilege, a cornerstone of financial security.
- **Rate Limiting**: Although not explicitly implemented in this `security.py` file for its own endpoints, the underlying framework and other modules (like `auth.py`) utilize rate limiting to protect against brute-force attacks and API abuse, a standard security measure.

## Endpoints

### 1. Create API Key

`POST /api/v1/security/api-keys/create`

Generates a new API key with specified permissions and an optional expiration date. The API key itself is returned only once upon creation; subsequent retrieval will only show its metadata.

**Permissions**: Requires appropriate authentication and authorization (e.g., `admin_required` or specific `developer_access` role).

**Request Body**:

```json
{
  "key_name": "string" (required): A descriptive name for the API key.
  "permissions": [
    "string"
  ] (optional, default: ["read", "write"]): A list of permissions for the API key (e.g., "read", "write", "admin", "wallet", "payment", "card", "kyc", "ledger").
  "rate_limit": "integer" (optional, default: 1000): The maximum number of requests per hour for this API key.
  "expires_in_days": "integer" (optional, default: 365): The number of days until the API key expires.
}
```

**Responses**:

- `201 Created`: API key created successfully.
  ```json
  {
    "key_id": "string",
    "api_key": "string": The generated API key (returned only once).
    "key_name": "string",
    "permissions": [
      "string"
    ],
    "rate_limit": "integer",
    "expires_at": "string (ISO 8601 datetime)",
    "created_at": "string (ISO 8601 datetime)",
    "warning": "Store this API key securely. It will not be shown again."
  }
  ```
- `400 Bad Request`: Missing required fields or invalid input.
- `500 Internal Server Error`: An unexpected error occurred.

### 2. List All API Keys

`GET /api/v1/security/api-keys`

Retrieves a paginated list of all API keys registered in the system, without exposing the actual key values. Provides metadata such as key name, permissions, rate limit, and status.

**Permissions**: Requires appropriate authentication and authorization (e.g., `admin_required` or specific `developer_access` role).

**Query Parameters**:

- `page` (integer, optional): Page number for pagination. Default is `1`.
- `per_page` (integer, optional): Number of items per page. Default is `20`.

**Responses**:

- `200 OK`: Successfully retrieved API key list.
  ```json
  {
    "api_keys": [
      {
        "key_id": "string",
        "key_name": "string",
        "permissions": [
          "string"
        ],
        "rate_limit": "integer",
        "is_active": "boolean",
        "created_at": "string (ISO 8601 datetime)",
        "last_used_at": "string (ISO 8601 datetime)" (optional),
        "expires_at": "string (ISO 8601 datetime)" (optional)
      }
    ],
    "pagination": {
      "page": "integer",
      "per_page": "integer",
      "total": "integer",
      "pages": "integer",
      "has_next": "boolean",
      "has_prev": "boolean"
    }
  }
  ```
- `500 Internal Server Error`: An unexpected error occurred.

### 3. Revoke API Key

`POST /api/v1/security/api-keys/{key_id}/revoke`

Revokes an existing API key, rendering it inactive and preventing further use. This is a critical security measure for compromised or no longer needed keys.

**Permissions**: Requires appropriate authentication and authorization (e.g., `admin_required` or specific `developer_access` role).

**Path Parameters**:

- `key_id` (string, required): The unique identifier of the API key to revoke.

**Responses**:

- `200 OK`: API key revoked successfully.
  ```json
  {
    "key_id": "string",
    "message": "API key revoked successfully",
    "revoked_at": "string (ISO 8601 datetime)"
  }
  ```
- `404 Not Found`: API key not found.
- `500 Internal Server Error`: An unexpected error occurred.

### 4. Update API Key Permissions

`PUT /api/v1/security/api-keys/{key_id}/permissions`

Updates the permissions and optionally the rate limit for an existing API key. This allows for dynamic adjustment of access rights without revoking and re-issuing keys.

**Permissions**: Requires appropriate authentication and authorization (e.g., `admin_required` or specific `developer_access` role).

**Path Parameters**:

- `key_id` (string, required): The unique identifier of the API key to update.

**Request Body**:

```json
{
  "permissions": [
    "string"
  ] (required): A list of new permissions for the API key.
  "rate_limit": "integer" (optional): The new maximum number of requests per hour for this API key.
}
```

**Responses**:

- `200 OK`: API key permissions updated successfully.
  ```json
  {
    "key_id": "string",
    "permissions": ["string"],
    "rate_limit": "integer",
    "updated_at": "string (ISO 8601 datetime)"
  }
  ```
- `400 Bad Request`: Missing required fields, invalid permissions, or attempting to update an inactive key.
- `404 Not Found`: API key not found.
- `500 Internal Server Error`: An unexpected error occurred.

### 5. Get Audit Logs

`GET /api/v1/security/audit-logs`

Retrieves a paginated list of audit logs, with filtering options. This endpoint provides access to the comprehensive audit trail of system events, crucial for compliance and security monitoring.

**Permissions**: Requires appropriate authentication and authorization (e.g., `admin_required` or specific `auditor` role).

**Query Parameters**:

- `page` (integer, optional): Page number for pagination. Default is `1`.
- `per_page` (integer, optional): Number of items per page. Default is `50`.
- `user_id` (string, optional): Filter logs by the user ID who performed the action.
- `action` (string, optional): Filter by the type of action performed (e.g., `create_api_key`, `login_success`).
- `resource_type` (string, optional): Filter by the type of resource affected (e.g., `api_key`, `user`, `transaction`).
- `start_date` (string, optional): Start date for filtering logs (YYYY-MM-DD).
- `end_date` (string, optional): End date for filtering logs (YYYY-MM-DD).

**Responses**:

- `200 OK`: Successfully retrieved audit logs.
  ```json
  {
    "audit_logs": [
      {
        "log_id": "string",
        "user_id": "string" (optional),
        "action": "string",
        "resource_type": "string",
        "resource_id": "string" (optional),
        "ip_address": "string",
        "user_agent": "string" (optional),
        "request_data": "object" (optional),
        "response_status": "integer" (optional),
        "created_at": "string (ISO 8601 datetime)"
      }
    ],
    "pagination": {
      "page": "integer",
      "per_page": "integer",
      "total": "integer",
      "pages": "integer",
      "has_next": "boolean",
      "has_prev": "boolean"
    },
    "filters_applied": {
      "user_id": "string",
      "action": "string",
      "resource_type": "string",
      "start_date": "string",
      "end_date": "string"
    }
  }
  ```
- `500 Internal Server Error`: An unexpected error occurred.

### 6. Tokenize Sensitive Data

`POST /api/v1/security/encryption/tokenize`

Tokenizes sensitive data (e.g., credit card numbers, bank account details) by replacing it with a non-sensitive token. In a production environment, this token would map to the actual data stored securely in a token vault.

**Permissions**: Requires appropriate authentication and authorization.

**Request Body**:

```json
{
  "sensitive_data": "string" (required): The sensitive data to tokenize.
  "data_type": "string" (optional, default: "generic"): The type of data being tokenized (e.g., "card_number", "bank_account").
  "user_id": "string" (optional): The user ID associated with the data, for audit logging.
}
```

**Responses**:

- `200 OK`: Data tokenized successfully.
  ```json
  {
    "token": "string": The generated token.
    "data_type": "string",
    "tokenized_at": "string (ISO 8601 datetime)",
    "expires_at": "string (ISO 8601 datetime)" (optional)
  }
  ```
- `400 Bad Request`: Missing required fields.
- `500 Internal Server Error`: An unexpected error occurred.

### 7. Detokenize Sensitive Data

`POST /api/v1/security/encryption/detokenize`

Retrieves the original sensitive data associated with a given token. This operation is highly privileged and all access is logged for audit purposes.

**Permissions**: Requires highly privileged authentication and authorization (e.g., `admin_required` or specific `data_access` role).

**Request Body**:

```json
{
  "token": "string" (required): The token to detokenize.
  "user_id": "string" (optional): The user ID requesting detokenization, for audit logging.
}
```

**Responses**:

- `200 OK`: Data detokenized successfully.
  ```json
  {
    "token": "string",
    "sensitive_data": "string": The original sensitive data (redacted in demo).
    "detokenized_at": "string (ISO 8601 datetime)",
    "access_logged": "boolean": Indicates if the access was logged.
  }
  ```
- `400 Bad Request`: Missing required fields or invalid token format.
- `500 Internal Server Error`: An unexpected error occurred.

### 8. Perform Security Scan

`POST /api/v1/security/scan`

Initiates a security scan on a specified target (e.g., user account, transaction). This endpoint simulates a security assessment, identifying potential vulnerabilities and recommending actions.

**Permissions**: Requires appropriate authentication and authorization (e.g., `admin_required` or `security_analyst` role).

**Request Body**:

```json
{
  "scan_type": "string" (optional, default: "account"): The type of scan to perform (e.g., "account", "transaction").
  "target_id": "string" (required): The ID of the target for the scan (e.g., user_id, transaction_id).
}
```

**Responses**:

- `200 OK`: Security scan initiated successfully.
  ```json
  {
    "scan_id": "string",
    "scan_type": "string",
    "target_id": "string",
    "security_score": "integer (0-100)",
    "vulnerabilities": [
      {
        "severity": "string (e.g., "low", "medium", "high")",
        "type": "string",
        "description": "string"
      }
    ],
    "recommendations": [
      "string"
    ],
    "checks_performed": [
      "string"
    ]
  }
  ```
- `400 Bad Request`: Missing required fields.
- `500 Internal Server Error`: An unexpected error occurred.

# User Management API Documentation

The User Management API provides comprehensive functionalities for managing user profiles, authentication-related actions, and administrative controls. It is built with a strong emphasis on security, data integrity, and compliance with financial industry standards.

## Base URL

`/api/v1/users`

## Financial Industry Standards and Considerations

- **Role-Based Access Control (RBAC)**: Endpoints are protected with `token_required` and `admin_required` decorators, ensuring that only authenticated and authorized users (or administrators) can access sensitive information or perform critical actions.
- **Secure Password Management**: User passwords are never stored directly. Instead, they are hashed using robust algorithms (`PasswordManager`) and securely verified. Password reset mechanisms are implemented to prevent unauthorized access.
- **Two-Factor Authentication (2FA)**: Users can enable and manage 2FA (TOTP-based) for an additional layer of security, significantly reducing the risk of unauthorized account access.
- **KYC Status Integration**: User profiles include a `kyc_status` field, indicating their Know Your Customer verification level, which is crucial for compliance in financial services.
- **Audit Logging**: All significant user actions, such as profile updates, password changes, and status modifications, are meticulously logged using `AuditLogger`. These logs include details like user ID, event type, IP address, and changes made, providing a comprehensive audit trail for regulatory compliance and security monitoring.
- **Rate Limiting**: To prevent brute-force attacks and abuse, rate limiting is applied to endpoints like password reset requests.
- **Account Lockout Policies**: Accounts are temporarily locked after multiple failed login attempts, mitigating brute-force attacks and enhancing security.
- **Data Validation and Sanitization**: All incoming user data is rigorously validated and sanitized (`InputValidator`) to prevent common vulnerabilities like SQL injection and cross-site scripting (XSS).
- **Data Privacy**: Sensitive user information is handled with care, and access is restricted based on user roles and permissions.

## Endpoints

### 1. Get All Users (Admin Only)

`GET /api/v1/users/`

Retrieves a paginated and filterable list of all registered users. This endpoint is restricted to administrators for compliance and oversight.

**Permissions**: `admin_required`

**Query Parameters**:

- `page` (integer, optional): Page number for pagination. Default is `1`.
- `per_page` (integer, optional): Number of items per page. Default is `20`, maximum is `100`.
- `search` (string, optional): Search users by first name, last name, or email (case-insensitive).
- `kyc_status` (string, optional): Filter by KYC status (e.g., `pending`, `approved`, `rejected`).
- `status` (string, optional): Filter by user account status (`active` or `inactive`).
- `sort_by` (string, optional): Field to sort by (e.g., `created_at`, `last_login_at`, `email`). Default is `created_at`.
- `sort_order` (string, optional): Sort order (`asc` for ascending, `desc` for descending). Default is `desc`.

**Responses**:

- `200 OK`: Successfully retrieved user list.
  ```json
  {
    "success": true,
    "users": [
      {
        "id": "string",
        "email": "string",
        "first_name": "string",
        "last_name": "string",
        "phone": "string",
        "kyc_status": "string",
        "is_active": "boolean",
        "email_verified": "boolean",
        "phone_verified": "boolean",
        "two_factor_enabled": "boolean",
        "last_login_at": "string (ISO 8601 datetime)",
        "created_at": "string (ISO 8601 datetime)",
        "account_summary": {
          "total_accounts": "integer",
          "total_balance": "float",
          "primary_currency": "string"
        }
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
    "filters": {
      "search": "string",
      "kyc_status": "string",
      "status": "string",
      "sort_by": "string",
      "sort_order": "string"
    }
  }
  ```
- `403 Forbidden`: Insufficient privileges.
- `500 Internal Server Error`: An unexpected error occurred.

### 2. Get User Details by ID

`GET /api/v1/users/{user_id}`

Retrieves detailed information for a specific user, including their accounts, recent transactions, and various statistics. Users can access their own profile, and administrators can access any user's profile.

**Permissions**: `token_required` (User must be `user_id` or `admin_required`)

**Path Parameters**:

- `user_id` (string, required): The unique identifier of the user.

**Responses**:

- `200 OK`: Successfully retrieved user details.
  ```json
  {
    "success": true,
    "user": {
      "id": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "phone": "string",
      "date_of_birth": "string (YYYY-MM-DD)",
      "address": {
        "street": "string",
        "city": "string",
        "state": "string",
        "postal_code": "string",
        "country": "string"
      },
      "kyc_status": "string",
      "is_active": "boolean",
      "email_verified": "boolean",
      "phone_verified": "boolean",
      "two_factor_enabled": "boolean",
      "last_login_at": "string (ISO 8601 datetime)",
      "last_login_ip": "string",
      "failed_login_attempts": "integer",
      "created_at": "string (ISO 8601 datetime)",
      "updated_at": "string (ISO 8601 datetime)"
    },
    "accounts": [
      {
        "id": "string",
        "account_name": "string",
        "account_type": "string (e.g., CHECKING, SAVINGS)",
        "currency": "string",
        "available_balance": "float",
        "current_balance": "float",
        "status": "string (e.g., ACTIVE, INACTIVE)",
        "created_at": "string (ISO 8601 datetime)"
      }
    ],
    "recent_transactions": [
      {
        "id": "string",
        "type": "string (e.g., DEBIT, CREDIT)",
        "category": "string",
        "amount": "float",
        "currency": "string",
        "description": "string",
        "status": "string (e.g., COMPLETED, PENDING)",
        "created_at": "string (ISO 8601 datetime)"
      }
    ],
    "statistics": {
      "total_accounts": "integer",
      "total_balance": "float",
      "total_transactions": "integer",
      "monthly_volume": "float",
      "account_age_days": "integer"
    }
  }
  ```
- `403 Forbidden`: Access denied.
- `404 Not Found`: User not found.
- `500 Internal Server Error`: An unexpected error occurred.

### 3. Update User Details

`PUT /api/v1/users/{user_id}`

Updates the details of a specific user. Users can update their own profile, and administrators can update any user's profile, including sensitive fields like KYC status and account activity.

**Permissions**: `token_required` (User must be `user_id` or `admin_required`)

**Path Parameters**:

- `user_id` (string, required): The unique identifier of the user to update.

**Request Body**:

```json
{
  "first_name": "string" (optional),
  "last_name": "string" (optional),
  "phone": "string" (optional),
  "date_of_birth": "YYYY-MM-DD" (optional),
  "address": {
    "street": "string" (optional),
    "city": "string" (optional),
    "state": "string" (optional),
    "postal_code": "string" (optional),
    "country": "string" (optional)
  } (optional),
  "kyc_status": "string" (optional, admin only),
  "is_active": "boolean" (optional, admin only)
}
```

**Responses**:

- `200 OK`: User profile updated successfully.
  ```json
  {
    "success": true,
    "message": "Profile updated successfully",
    "user": {
      "id": "string",
      "email": "string",
      "first_name": "string",
      "last_name": "string",
      "phone": "string",
      "date_of_birth": "string (YYYY-MM-DD)",
      "kyc_status": "string",
      "is_active": "boolean",
      "updated_at": "string (ISO 8601 datetime)"
    },
    "changes": {
      "field_name": {
        "old": "old_value",
        "new": "new_value"
      }
    }
  }
  ```
- `400 Bad Request`: Invalid JSON, missing required fields, or invalid data format.
- `403 Forbidden`: Access denied.
- `404 Not Found`: User not found.
- `500 Internal Server Error`: An unexpected error occurred.

### 4. Soft Delete User (Admin Only)

`DELETE /api/v1/users/{user_id}`

Performs a soft delete on a user account, marking it as inactive rather than permanently removing it. This is crucial for maintaining historical data and audit trails in a financial system.

**Permissions**: `admin_required`

**Path Parameters**:

- `user_id` (string, required): The unique identifier of the user to soft delete.

**Responses**:

- `200 OK`: User soft deleted successfully.
  ```json
  {
    "success": true,
    "message": "User soft deleted successfully",
    "user_id": "string"
  }
  ```
- `403 Forbidden`: Insufficient privileges.
- `404 Not Found`: User not found.
- `500 Internal Server Error`: An unexpected error occurred.

### 5. Reactivate User (Admin Only)

`POST /api/v1/users/{user_id}/reactivate`

Reactivates a previously soft-deleted or inactive user account.

**Permissions**: `admin_required`

**Path Parameters**:

- `user_id` (string, required): The unique identifier of the user to reactivate.

**Responses**:

- `200 OK`: User reactivated successfully.
  ```json
  {
    "success": true,
    "message": "User reactivated successfully",
    "user_id": "string"
  }
  ```
- `403 Forbidden`: Insufficient privileges.
- `404 Not Found`: User not found.
- `400 Bad Request`: User is already active.
- `500 Internal Server Error`: An unexpected error occurred.

### 6. Set User Status (Admin Only)

`PUT /api/v1/users/{user_id}/status`

Sets the active/inactive status of a user account. This can be used to temporarily suspend or reactivate accounts.

**Permissions**: `admin_required`

**Path Parameters**:

- `user_id` (string, required): The unique identifier of the user.

**Request Body**:

```json
{
  "is_active": "boolean" (required)
}
```

**Responses**:

- `200 OK`: User status updated successfully.
  ```json
  {
    "success": true,
    "message": "User status updated successfully",
    "user_id": "string",
    "is_active": "boolean"
  }
  ```
- `400 Bad Request`: Invalid JSON or missing `is_active` field.
- `403 Forbidden`: Insufficient privileges.
- `404 Not Found`: User not found.
- `500 Internal Server Error`: An unexpected error occurred.

### 7. Update Password

`PUT /api/v1/users/password`

Allows an authenticated user to change their password. Requires the current password for verification.

**Permissions**: `token_required`

**Request Body**:

```json
{
  "current_password": "string" (required),
  "new_password": "string" (required)
}
```

**Responses**:

- `200 OK`: Password updated successfully.
  ```json
  {
    "success": true,
    "message": "Password updated successfully"
  }
  ```
- `400 Bad Request`: Invalid JSON, missing fields, or new password does not meet strength requirements.
- `401 Unauthorized`: Invalid current password.
- `500 Internal Server Error`: An unexpected error occurred.

### 8. Request Password Reset

`POST /api/v1/users/password/reset/request`

Initiates the password reset process by sending a reset token to the user's registered email address. This endpoint is rate-limited to prevent abuse.

**Permissions**: None (publicly accessible)

**Request Body**:

```json
{
  "email": "string" (required)
}
```

**Responses**:

- `200 OK`: Password reset email sent (or simulated) successfully. (Always returns 200 to prevent email enumeration).
  ```json
  {
    "success": true,
    "message": "If a matching email address was found, a password reset link has been sent."
  }
  ```
- `400 Bad Request`: Invalid JSON or email format.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: An unexpected error occurred.

### 9. Confirm Password Reset

`POST /api/v1/users/password/reset/confirm`

Confirms the password reset using the token received via email and sets a new password.

**Permissions**: None (publicly accessible)

**Request Body**:

```json
{
  "token": "string" (required),
  "new_password": "string" (required)
}
```

**Responses**:

- `200 OK`: Password reset successfully.
  ```json
  {
    "success": true,
    "message": "Password has been reset successfully."
  }
  ```
- `400 Bad Request`: Invalid JSON, missing fields, invalid token, or new password does not meet strength requirements.
- `401 Unauthorized`: Invalid or expired token.
- `500 Internal Server Error`: An unexpected error occurred.

### 10. Enable Two-Factor Authentication

`POST /api/v1/users/2fa/enable`

Initiates the 2FA setup process for the authenticated user. Returns a QR code image (base64 encoded) and a secret key for the authenticator app.

**Permissions**: `token_required`

**Responses**:

- `200 OK`: 2FA setup initiated successfully.
  ```json
  {
    "success": true,
    "message": "Scan the QR code with your authenticator app",
    "qr_code_image": "base64_encoded_png_image",
    "secret": "string" (TOTP secret key)
  }
  ```
- `400 Bad Request`: 2FA already enabled.
- `500 Internal Server Error`: An unexpected error occurred.

### 11. Verify Two-Factor Authentication

`POST /api/v1/users/2fa/verify`

Verifies the 2FA code provided by the user during login or setup.

**Permissions**: `token_required`

**Request Body**:

```json
{
  "two_factor_code": "string" (required)
}
```

**Responses**:

- `200 OK`: 2FA code verified successfully.
  ```json
  {
    "success": true,
    "message": "Two-factor authentication verified."
  }
  ```
- `400 Bad Request`: Invalid JSON or missing code.
- `401 Unauthorized`: Invalid 2FA code.
- `500 Internal Server Error`: An unexpected error occurred.

### 12. Disable Two-Factor Authentication

`POST /api/v1/users/2fa/disable`

Disables 2FA for the authenticated user. Requires the current 2FA code for security.

**Permissions**: `token_required`

**Request Body**:

```json
{
  "two_factor_code": "string" (required)
}
```

**Responses**:

- `200 OK`: 2FA disabled successfully.
  ```json
  {
    "success": true,
    "message": "Two-factor authentication disabled."
  }
  ```
- `400 Bad Request`: Invalid JSON, missing code, or 2FA not enabled.
- `401 Unauthorized`: Invalid 2FA code.
- `500 Internal Server Error`: An unexpected error occurred.

### 13. Verify Email

`POST /api/v1/users/verify-email`

Verifies the user's email address using a token sent to their email.

**Permissions**: None (publicly accessible)

**Request Body**:

```json
{
  "token": "string" (required)
}
```

**Responses**:

- `200 OK`: Email verified successfully.
  ```json
  {
    "success": true,
    "message": "Email verified successfully."
  }
  ```
- `400 Bad Request`: Invalid JSON or missing token.
- `401 Unauthorized`: Invalid or expired token.
- `500 Internal Server Error`: An unexpected error occurred.

### 14. Verify Phone

`POST /api/v1/users/verify-phone`

Verifies the user's phone number using a code sent via SMS.

**Permissions**: `token_required`

**Request Body**:

```json
{
  "phone_code": "string" (required)
}
```

**Responses**:

- `200 OK`: Phone verified successfully.
  ```json
  {
    "success": true,
    "message": "Phone number verified successfully."
  }
  ```
- `400 Bad Request`: Invalid JSON or missing code.
- `401 Unauthorized`: Invalid phone code.
- `500 Internal Server Error`: An unexpected error occurred.

### 15. Request KYC Verification

`POST /api/v1/users/kyc/request`

Allows a user to request a KYC verification. This will typically redirect to or initiate a process handled by the dedicated KYC/AML service.

**Permissions**: `token_required`

**Request Body**:

```json
{
  "verification_level": "string" (e.g., "basic", "enhanced", "premium")
}
```

**Responses**:

- `200 OK`: KYC verification request initiated.
  ```json
  {
    "success": true,
    "message": "KYC verification request initiated. Please follow the instructions in the KYC/AML section."
  }
  ```
- `400 Bad Request`: Invalid JSON, missing fields, or invalid verification level.
- `500 Internal Server Error`: An unexpected error occurred.

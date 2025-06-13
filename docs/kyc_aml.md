
# KYC/AML API Documentation

The KYC/AML API facilitates the Know Your Customer (KYC) and Anti-Money Laundering (AML) verification processes. It allows for user creation, information updates, and managing verification workflows with different levels of scrutiny.

## Base URL

`/api/v1/kyc`

## Endpoints

### 1. Create a New User

`POST /api/v1/kyc/user/create`

Creates a new user record with basic information. This is typically the first step before initiating KYC verification.

#### Request Body

| Field         | Type     | Description                                     | Required |
| :------------ | :------- | :---------------------------------------------- | :------- |
| `email`       | `string` | The user's email address (must be unique).      | Yes      |
| `first_name`  | `string` | The user's first name.                          | Yes      |
| `last_name`   | `string` | The user's last name.                           | Yes      |
| `phone`       | `string` | Optional: The user's phone number.              | No       |
| `date_of_birth` | `string` | Optional: The user's date of birth in `YYYY-MM-DD` format. | No       |
| `address`     | `string` | Optional: The user's residential address.       | No       |

#### Example Request

```json
{
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+15551234567",
    "date_of_birth": "1990-05-15",
    "address": "123 Main St, Anytown, USA"
}
```

#### Example Success Response (201 Created)

```json
{
    "user_id": "<generated_user_id>",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "kyc_status": "pending",
    "created_at": "2024-01-18T09:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Invalid email format"
}
```

#### Example Error Response (409 Conflict)

```json
{
    "error": "User with this email already exists"
}
```

### 2. Get User Information

`GET /api/v1/kyc/user/{user_id}`

Retrieves detailed information about a specific user.

#### Path Parameters

| Parameter | Type     | Description                            |
| :-------- | :------- | :------------------------------------- |
| `user_id` | `string` | The unique identifier of the user.     |

#### Example Request

```
GET /api/v1/kyc/user/user_123
```

#### Example Success Response (200 OK)

```json
{
    "user_id": "user_123",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+15551234567",
    "date_of_birth": "1990-05-15",
    "address": "123 Main St, Anytown, USA",
    "kyc_status": "pending",
    "created_at": "2024-01-18T09:00:00.000Z",
    "updated_at": "2024-01-18T09:00:00.000Z"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "User not found"
}
```

### 3. Update User Information

`PUT /api/v1/kyc/user/{user_id}`

Updates existing user information.

#### Path Parameters

| Parameter | Type     | Description                            |
| :-------- | :------- | :------------------------------------- |
| `user_id` | `string` | The unique identifier of the user.     |

#### Request Body

| Field         | Type     | Description                                     | Required |
| :------------ | :------- | :---------------------------------------------- | :------- |
| `first_name`  | `string` | Optional: The user's updated first name.        | No       |
| `last_name`   | `string` | Optional: The user's updated last name.         | No       |
| `phone`       | `string` | Optional: The user's updated phone number.      | No       |
| `date_of_birth` | `string` | Optional: The user's updated date of birth in `YYYY-MM-DD` format. | No       |
| `address`     | `string` | Optional: The user's updated residential address. | No       |

#### Example Request

```json
{
    "phone": "+15559876543",
    "address": "456 Oak Ave, Othertown, USA"
}
```

#### Example Success Response (200 OK)

```json
{
    "user_id": "user_123",
    "message": "User updated successfully",
    "updated_at": "2024-01-18T10:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Invalid phone format"
}
```

### 4. Start KYC Verification Process

`POST /api/v1/kyc/verification/start`

Initiates a new KYC verification process for a user at a specified level.

#### Request Body

| Field              | Type     | Description                                     | Required |
| :----------------- | :------- | :---------------------------------------------- | :------- |
| `user_id`          | `string` | The unique ID of the user to verify.            | Yes      |
| `verification_level` | `string` | The desired level of verification (`basic`, `enhanced`, `premium`). | Yes      |
| `provider`         | `string` | Optional: The verification provider (e.g., `Flowlet_Internal`, `ThirdParty_KYC`). | No       |

#### Example Request

```json
{
    "user_id": "user_123",
    "verification_level": "enhanced"
}
```

#### Example Success Response (201 Created)

```json
{
    "verification_id": "<generated_verification_id>",
    "user_id": "user_123",
    "verification_level": "enhanced",
    "status": "pending",
    "next_steps": [
        "email_verification",
        "phone_verification",
        "document_upload",
        "address_verification"
    ],
    "created_at": "2024-01-18T11:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Invalid verification level"
}
```

#### Example Error Response (409 Conflict)

```json
{
    "error": "User already has a pending verification"
}
```

### 5. Submit Identity Document for Verification

`POST /api/v1/kyc/verification/{verification_id}/document`

Submits identity document details for a pending KYC verification.

#### Path Parameters

| Parameter        | Type     | Description                       |
| :--------------- | :------- | :-------------------------------- |
| `verification_id` | `string` | The unique ID of the KYC record. |

#### Request Body

| Field           | Type     | Description                                     | Required |
| :-------------- | :------- | :---------------------------------------------- | :------- |
| `document_type` | `string` | The type of document (`passport`, `drivers_license`, `national_id`). | Yes      |
| `document_number` | `string` | The document's identification number.           | Yes      |

#### Example Request

```json
{
    "document_type": "passport",
    "document_number": "P12345678"
}
```

#### Example Success Response (200 OK)

```json
{
    "verification_id": "<verification_id>",
    "document_type": "passport",
    "status": "document_submitted",
    "message": "Document submitted successfully for verification",
    "estimated_processing_time": "1-2 business days"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Invalid document type"
}
```

### 6. Complete Verification Process (Simulate External Results)

`POST /api/v1/kyc/verification/{verification_id}/complete`

Simulates the completion of a KYC verification process, typically triggered by an external verification provider. This endpoint calculates a risk score and updates the user's KYC status.

#### Path Parameters

| Parameter        | Type     | Description                       |
| :--------------- | :------- | :-------------------------------- |
| `verification_id` | `string` | The unique ID of the KYC record. |

#### Request Body (Optional - for simulating specific outcomes)

| Field                  | Type      | Description                                     | Required |
| :--------------------- | :-------- | :---------------------------------------------- | :------- |
| `document_verified`    | `boolean` | Optional: Simulate document verification result. | No       |
| `biometric_verified`   | `boolean` | Optional: Simulate biometric verification result. | No       |
| `watchlist_match`      | `boolean` | Optional: Simulate a watchlist match.           | No       |
| `address_verified`     | `boolean` | Optional: Simulate address verification result. | No       |

#### Example Request

```json
{
    "document_verified": true,
    "watchlist_match": false
}
```

#### Example Success Response (200 OK)

```json
{
    "verification_id": "<verification_id>",
    "user_id": "user_123",
    "verification_status": "verified",
    "risk_score": 25,
    "verification_level": "enhanced",
    "verification_results": {
        "document_verified": true,
        "biometric_verified": true,
        "watchlist_match": false,
        "address_verified": true
    },
    "completed_at": "2024-01-18T12:00:00.000Z",
    "notes": "Automated verification completed. Risk score: 25"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Verification is not in pending status"
}
```

### 7. Get Verification Status and Details

`GET /api/v1/kyc/verification/{verification_id}`

Retrieves the current status and details of a specific KYC verification record.

#### Path Parameters

| Parameter        | Type     | Description                       |
| :--------------- | :------- | :-------------------------------- |
| `verification_id` | `string` | The unique ID of the KYC record. |

#### Example Request

```
GET /api/v1/kyc/verification/verification_xyz
```

#### Example Success Response (200 OK)

```json
{
    "verification_id": "verification_xyz",
    "user_id": "user_123",
    "verification_level": "enhanced",
    "document_type": "passport",
    "verification_status": "verified",
    "verification_provider": "Flowlet_Internal",
    "verification_date": "2024-01-18T12:00:00.000Z",
    "risk_score": 25,
    "notes": "Automated verification completed. Risk score: 25",
    "created_at": "2024-01-18T11:00:00.000Z",
    "updated_at": "2024-01-18T12:00:00.000Z"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "Verification record not found"
}
```

### 8. Get All Verification Records for a User

`GET /api/v1/kyc/user/{user_id}/verifications`

Retrieves a list of all KYC verification records associated with a given user ID.

#### Path Parameters

| Parameter | Type     | Description                            |
| :-------- | :------- | :------------------------------------- |
| `user_id` | `string` | The unique identifier of the user.     |

#### Example Request

```
GET /api/v1/kyc/user/user_123/verifications
```

#### Example Success Response (200 OK)

```json
{
    "user_id": "user_123",
    "current_kyc_status": "verified",
    "verifications": [
        {
            "verification_id": "verification_xyz",
            "verification_level": "enhanced",
            "verification_status": "verified",
            "verification_date": "2024-01-18T12:00:00.000Z",
            "risk_score": 25,
            "created_at": "2024-01-18T11:00:00.000Z"
        },
        {
            "verification_id": "verification_abc",
            "verification_level": "basic",
            "verification_status": "rejected",
            "verification_date": "2024-01-10T10:00:00.000Z",
            "risk_score": 70,
            "created_at": "2024-01-10T09:00:00.000Z"
        }
    ],
    "total_verifications": 2
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "User not found"
}
```

### 9. AML Screening

`POST /api/v1/kyc/aml/screen`

Performs an AML (Anti-Money Laundering) screening on a user based on provided data. This endpoint simulates checking against watchlists and sanctions lists.

#### Request Body

| Field         | Type     | Description                                     | Required |
| :------------ | :------- | :---------------------------------------------- | :------- |
| `user_id`     | `string` | The unique ID of the user to screen.            | Yes      |
| `full_name`   | `string` | The full name of the individual to screen.      | Yes      |
| `date_of_birth` | `string` | Optional: Date of birth in `YYYY-MM-DD` format. | No       |
| `country`     | `string` | Optional: Country of residence/citizenship.     | No       |

#### Example Request

```json
{
    "user_id": "user_123",
    "full_name": "John Doe",
    "date_of_birth": "1990-05-15",
    "country": "USA"
}
```

#### Example Success Response (200 OK)

```json
{
    "user_id": "user_123",
    "screening_id": "<generated_screening_id>",
    "status": "completed",
    "match_found": false,
    "risk_score": 10,
    "details": "No adverse media or watchlist matches found.",
    "screened_at": "2024-01-18T13:00:00.000Z"
}
```

#### Example Error Response (400 Bad Request)

```json
{
    "error": "Missing required field: full_name"
}
```

### 10. Get AML Screening Results

`GET /api/v1/kyc/aml/screen/{screening_id}`

Retrieves the results of a specific AML screening.

#### Path Parameters

| Parameter      | Type     | Description                       |
| :------------- | :------- | :-------------------------------- |
| `screening_id` | `string` | The unique ID of the AML screening record. |

#### Example Request

```
GET /api/v1/kyc/aml/screen/aml_screen_abc
```

#### Example Success Response (200 OK)

```json
{
    "screening_id": "aml_screen_abc",
    "user_id": "user_123",
    "status": "completed",
    "match_found": false,
    "risk_score": 10,
    "details": "No adverse media or watchlist matches found.",
    "screened_at": "2024-01-18T13:00:00.000Z"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "error": "AML screening record not found"
}
```



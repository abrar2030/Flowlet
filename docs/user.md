
# User Management API Documentation

The User Management API provides basic functionalities for managing user records, including retrieving, creating, updating, and deleting users.

## Base URL

`/api/v1/user`

## Endpoints

### 1. Get All Users

`GET /api/v1/user/users`

Retrieves a list of all registered users.

#### Example Request

```
GET /api/v1/user/users
```

#### Example Success Response (200 OK)

```json
[
    {
        "id": 1,
        "username": "john_doe",
        "email": "john.doe@example.com"
    },
    {
        "id": 2,
        "username": "jane_smith",
        "email": "jane.smith@example.com"
    }
]
```

### 2. Create a New User

`POST /api/v1/user/users`

Creates a new user record.

#### Request Body

| Field      | Type     | Description                                     | Required |
| :--------- | :------- | :---------------------------------------------- | :------- |
| `username` | `string` | The desired username for the new user.          | Yes      |
| `email`    | `string` | The email address for the new user.             | Yes      |

#### Example Request

```json
{
    "username": "new_user",
    "email": "new.user@example.com"
}
```

#### Example Success Response (201 Created)

```json
{
    "id": 3,
    "username": "new_user",
    "email": "new.user@example.com"
}
```

### 3. Get User by ID

`GET /api/v1/user/users/{user_id}`

Retrieves the details of a specific user by their ID.

#### Path Parameters

| Parameter | Type      | Description                            |
| :-------- | :-------- | :------------------------------------- |
| `user_id` | `integer` | The unique ID of the user to retrieve. |

#### Example Request

```
GET /api/v1/user/users/1
```

#### Example Success Response (200 OK)

```json
{
    "id": 1,
    "username": "john_doe",
    "email": "john.doe@example.com"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "message": "Not Found"
}
```

### 4. Update User Information

`PUT /api/v1/user/users/{user_id}`

Updates the information for an existing user.

#### Path Parameters

| Parameter | Type      | Description                            |
| :-------- | :-------- | :------------------------------------- |
| `user_id` | `integer` | The unique ID of the user to update.   |

#### Request Body

| Field      | Type     | Description                                     | Required |
| :--------- | :------- | :---------------------------------------------- | :------- |
| `username` | `string` | Optional: The new username.                     | No       |
| `email`    | `string` | Optional: The new email address.                | No       |

#### Example Request

```json
{
    "email": "john.updated@example.com"
}
```

#### Example Success Response (200 OK)

```json
{
    "id": 1,
    "username": "john_doe",
    "email": "john.updated@example.com"
}
```

#### Example Error Response (404 Not Found)

```json
{
    "message": "Not Found"
}
```

### 5. Delete User

`DELETE /api/v1/user/users/{user_id}`

Deletes a user record from the system.

#### Path Parameters

| Parameter | Type      | Description                            |
| :-------- | :-------- | :------------------------------------- |
| `user_id` | `integer` | The unique ID of the user to delete.   |

#### Example Request

```
DELETE /api/v1/user/users/1
```

#### Example Success Response (204 No Content)

(No content returned for successful deletion)

#### Example Error Response (404 Not Found)

```json
{
    "message": "Not Found"
}
```



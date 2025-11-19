# Analytics API Documentation

The Analytics API provides endpoints for retrieving various financial analytics and insights for users, including dashboard summaries, spending patterns, income analysis, and balance history. These analytics are crucial for users to understand their financial behavior and for the platform to monitor financial trends.

## Base URL

`/api/v1/analytics`

## Financial Industry Standards and Considerations

- **Data Aggregation and Privacy**: While aggregating data for analytics, strict measures are in place to ensure user data privacy. Aggregated data is anonymized where appropriate, and individual user data is only accessible with proper authentication and authorization.
- **Real-time vs. Historical Data**: The API provides both real-time snapshots (e.g., current balance) and historical trends (e.g., spending over time). For historical data, robust data warehousing and processing ensure accuracy and availability.
- **Categorization and Insights**: Spending and income are categorized to provide meaningful insights. While some categorization is automated, mechanisms for user-defined categories or adjustments are considered for enhanced accuracy.
- **Performance and Scalability**: Analytics endpoints are optimized for performance to handle large volumes of transactional data and provide timely responses, crucial for a responsive user experience in a financial application.
- **Auditability of Data**: Although analytics are derived, the underlying transactional data remains auditable, ensuring that all figures can be traced back to their source for compliance and reconciliation purposes.

## Endpoints

### 1. Get Dashboard Analytics

`GET /api/v1/analytics/dashboard/{user_id}`

Retrieves a summary of key financial metrics for a specific user, suitable for a dashboard display. This includes total balance, monthly spending, and card counts.

**Permissions**: `token_required` (User must be `user_id` or `admin_required`)

**Path Parameters**:
- `user_id` (string, required): The unique identifier of the user.

**Responses**:
- `200 OK`: Successfully retrieved dashboard analytics.
  ```json
  {
    "user_id": "string",
    "summary": {
      "total_balance": "string (Decimal)",
      "monthly_spending": "string (Decimal)",
      "total_wallets": "integer",
      "total_cards": "integer",
      "active_cards": "integer"
    },
    "recent_transactions": [
      {
        "id": "string",
        "type": "string (e.g., debit, credit)",
        "amount": "string (Decimal)",
        "currency": "string",
        "description": "string",
        "status": "string",
        "created_at": "string (ISO 8601 datetime)"
      }
    ],
    "generated_at": "string (ISO 8601 datetime)"
  }
  ```
- `404 Not Found`: User not found.
- `500 Internal Server Error`: An unexpected error occurred.

### 2. Get Spending Analytics

`GET /api/v1/analytics/spending/{user_id}`

Provides detailed spending analytics for a user over a specified period, including daily spending and category breakdowns.

**Permissions**: `token_required` (User must be `user_id` or `admin_required`)

**Path Parameters**:
- `user_id` (string, required): The unique identifier of the user.

**Query Parameters**:
- `period` (string, optional): The period for which to retrieve spending data. Supported values: `7d` (7 days), `30d` (30 days, default), `90d` (90 days), `1y` (1 year).

**Responses**:
- `200 OK`: Successfully retrieved spending analytics.
  ```json
  {
    "user_id": "string",
    "period": "string",
    "total_spending": "string (Decimal)",
    "daily_spending": [
      {
        "date": "string (YYYY-MM-DD)",
        "amount": "string (Decimal)"
      }
    ],
    "category_breakdown": [
      {
        "category": "string",
        "amount": "string (Decimal)"
      }
    ],
    "transaction_count": "integer",
    "generated_at": "string (ISO 8601 datetime)"
  }
  ```
- `404 Not Found`: User not found.
- `500 Internal Server Error`: An unexpected error occurred.

### 3. Get Income Analytics

`GET /api/v1/analytics/income/{user_id}`

Provides detailed income analytics for a user over a specified period, including daily income and source breakdowns.

**Permissions**: `token_required` (User must be `user_id` or `admin_required`)

**Path Parameters**:
- `user_id` (string, required): The unique identifier of the user.

**Query Parameters**:
- `period` (string, optional): The period for which to retrieve income data. Supported values: `7d` (7 days), `30d` (30 days, default), `90d` (90 days), `1y` (1 year).

**Responses**:
- `200 OK`: Successfully retrieved income analytics.
  ```json
  {
    "user_id": "string",
    "period": "string",
    "total_income": "string (Decimal)",
    "daily_income": [
      {
        "date": "string (YYYY-MM-DD)",
        "amount": "string (Decimal)"
      }
    ],
    "source_breakdown": [
      {
        "source": "string",
        "amount": "string (Decimal)"
      }
    ],
    "transaction_count": "integer",
    "generated_at": "string (ISO 8601 datetime)"
  }
  ```
- `404 Not Found`: User not found.
- `500 Internal Server Error`: An unexpected error occurred.

### 4. Get Balance History

`GET /api/v1/analytics/balance-history/{user_id}`

Retrieves the historical balance trend for a user over a specified period. Note: In a production environment, this would typically rely on stored daily balance snapshots rather than simulating.

**Permissions**: `token_required` (User must be `user_id` or `admin_required`)

**Path Parameters**:
- `user_id` (string, required): The unique identifier of the user.

**Query Parameters**:
- `period` (string, optional): The period for which to retrieve balance history. Supported values: `7d` (7 days), `30d` (30 days, default), `90d` (90 days), `1y` (1 year).

**Responses**:
- `200 OK`: Successfully retrieved balance history.
  ```json
  {
    "user_id": "string",
    "period": "string",
    "current_balance": "string (Decimal)",
    "balance_history": [
      {
        "date": "string (YYYY-MM-DD)",
        "balance": "string (Decimal)"
      }
    ],
    "generated_at": "string (ISO 8601 datetime)"
  }
  ```
- `404 Not Found`: User not found.
- `500 Internal Server Error`: An unexpected error occurred.

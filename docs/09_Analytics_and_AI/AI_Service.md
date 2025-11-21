# AI Service API Documentation

The AI Service API provides advanced artificial intelligence capabilities to enhance various aspects of the Flowlet platform, primarily focusing on fraud detection and providing intelligent support through a chatbot. These AI-driven features are crucial for maintaining the security and efficiency of financial operations in a Fintech environment.

## Base URL

`/api/v1/ai`

## Financial Industry Standards and Considerations

- **Fraud Detection and Prevention**: The AI fraud detection module employs machine learning algorithms to analyze transaction patterns and identify suspicious activities. This is a critical component for financial institutions to mitigate financial crime, protect customer assets, and comply with anti-fraud regulations.
- **Risk Scoring and Actionable Insights**: Transactions are assigned a risk score and categorized into risk levels (e.g., very low, low, medium, high). Based on these scores, recommended actions are provided, enabling rapid response to potential threats. This proactive approach aligns with risk management best practices in the financial sector.
- **Auditability of AI Decisions**: While AI models make predictions, the system ensures that the factors contributing to a fraud alert are logged and auditable. This transparency is vital for regulatory compliance, allowing human reviewers to understand and validate AI-driven decisions.
- **Continuous Learning and Adaptation**: In a production environment, the AI models would continuously learn from new data and feedback (e.g., resolved alerts, false positives) to improve their accuracy and adapt to evolving fraud techniques. This iterative improvement is key to maintaining effective fraud prevention.
- **Intelligent Support and Efficiency**: The AI Support Chatbot provides instant, accurate assistance, reducing the load on human support teams and improving user experience. For developers, it offers quick access to API documentation and troubleshooting, accelerating integration and development cycles.
- **Data Privacy in AI**: When processing data for AI models, strict adherence to data privacy regulations (e.g., GDPR, CCPA) is maintained. Sensitive data is handled securely, and anonymization or pseudonymization techniques are applied where appropriate.

## Endpoints

### 1. Analyze Transaction for Fraud

`POST /api/v1/ai/fraud-detection/analyze`

Analyzes a given transaction for potential fraud using AI algorithms. The analysis considers various factors such as transaction amount, velocity, geographic location, time, merchant category, and device/IP information to determine a risk score and recommended action.

**Permissions**: Requires appropriate authentication and authorization (e.g., `internal_service_token` or `fraud_analyst` role).

**Request Body**:

```json
{
  "transaction_id": "string" (required): The unique identifier of the transaction to analyze.
  "user_id": "string" (required): The unique identifier of the user associated with the transaction.
  "amount": "float" (required): The transaction amount.
  "merchant_info": {
    "name": "string" (optional),
    "category": "string" (optional, e.g., "gambling", "retail", "travel"),
    "location": "string" (optional, e.g., "US", "UK")
  } (required): Information about the merchant involved in the transaction.
  "wallet_id": "string" (optional): The wallet ID associated with the transaction.
  "user_location": "string" (optional): The user's current geographic location (e.g., "US", "UK").
  "new_device": "boolean" (optional): Indicates if the transaction is from a new device for the user.
  "suspicious_ip": "boolean" (optional): Indicates if the transaction originates from a suspicious IP address.
}
```

**Responses**:

- `200 OK`: Successfully performed fraud analysis.
  ```json
  {
    "transaction_id": "string",
    "fraud_analysis": {
      "risk_score": "integer (0-100)",
      "risk_level": "string (e.g., "very_low", "low", "medium", "high")",
      "risk_factors": [
        "string" (e.g., "unusually_high_amount", "high_velocity", "geographic_mismatch", "unusual_time", "high_risk_merchant", "new_device", "suspicious_ip", "unusual_daily_spending")
      ],
      "recommended_action": "string (e.g., "approve", "monitor", "require_additional_verification", "block_transaction")",
      "confidence": "integer (0-100)"
    },
    "alert_created": "boolean": True if a fraud alert was created, false otherwise.
    "alert_id": "string" (optional): The ID of the created fraud alert, if any.
    "analysis_timestamp": "string (ISO 8601 datetime)",
    "model_version": "string": The version of the AI model used for analysis.
  }
  ```
- `400 Bad Request`: Missing required fields or invalid input.
- `404 Not Found`: User or transaction not found.
- `500 Internal Server Error`: An unexpected error occurred during analysis.

### 2. Get Fraud Alerts

`GET /api/v1/ai/fraud-detection/alerts`

Retrieves a paginated list of fraud alerts, with options for filtering by status, risk level, and user ID. This endpoint allows compliance and security teams to monitor and manage potential fraud cases.

**Permissions**: Requires appropriate authentication and authorization (e.g., `fraud_analyst` or `admin` role).

**Query Parameters**:

- `page` (integer, optional): Page number for pagination. Default is `1`.
- `per_page` (integer, optional): Number of items per page. Default is `20`.
- `status` (string, optional): Filter by alert status (e.g., `open`, `resolved`, `false_positive`, `investigating`).
- `risk_level` (string, optional): Filter by risk level (e.g., `very_low`, `low`, `medium`, `high`).
- `user_id` (string, optional): Filter alerts by the associated user ID.

**Responses**:

- `200 OK`: Successfully retrieved fraud alerts.
  ```json
  {
    "alerts": [
      {
        "alert_id": "string",
        "transaction_id": "string",
        "user_id": "string",
        "alert_type": "string (e.g., "suspicious_transaction")",
        "risk_score": "integer",
        "description": "string",
        "status": "string",
        "created_at": "string (ISO 8601 datetime)",
        "resolved_at": "string (ISO 8601 datetime)" (optional)
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
      "status": "string",
      "risk_level": "string",
      "user_id": "string"
    }
  }
  ```
- `500 Internal Server Error`: An unexpected error occurred.

### 3. Resolve Fraud Alert

`POST /api/v1/ai/fraud-detection/alerts/{alert_id}/resolve`

Resolves a specific fraud alert, updating its status and optionally adding resolution notes. This action is typically performed by a fraud analyst after reviewing the alert.

**Permissions**: Requires appropriate authentication and authorization (e.g., `fraud_analyst` or `admin` role).

**Path Parameters**:

- `alert_id` (string, required): The unique identifier of the fraud alert to resolve.

**Request Body**:

```json
{
  "resolution": "string" (optional, default: "resolved"): The resolution status (e.g., "resolved", "false_positive", "investigating").
  "notes": "string" (optional): Any additional notes or comments regarding the resolution.
}
```

**Responses**:

- `200 OK`: Alert resolved successfully.
  ```json
  {
    "alert_id": "string",
    "status": "string",
    "resolved_at": "string (ISO 8601 datetime)",
    "message": "Alert resolved successfully"
  }
  ```
- `400 Bad Request`: Invalid resolution status.
- `404 Not Found`: Alert not found.
- `500 Internal Server Error`: An unexpected error occurred.

### 4. AI Support Chatbot Query

`POST /api/v1/ai/chatbot/query`

Provides an interface for the AI-powered support chatbot, allowing users and developers to ask questions and receive intelligent responses related to Flowlet APIs, services, and general assistance.

**Permissions**: None (publicly accessible, or requires basic user authentication)

**Request Body**:

```json
{
  "query": "string" (required): The user's query or question.
  "context": "string" (optional, default: "general"): The context of the query (e.g., "general", "developer", "user").
}
```

**Responses**:

- `200 OK`: Successfully received and processed the chatbot query.
  ```json
  {
    "conversation_id": "string",
    "response": "string": The chatbot's response to the query.
    "confidence": "integer (0-100)": The confidence level of the chatbot's response.
    "analysis_timestamp": "string (ISO 8601 datetime)"
  }
  ```
- `400 Bad Request`: Missing required fields.
- `500 Internal Server Error`: An unexpected error occurred.

# Compliance API Documentation

The Compliance API provides advanced functionalities for regulatory reporting, watchlist screening, and transaction pattern analysis, crucial for a Fintech startup operating in a highly regulated financial industry. It is designed to assist in meeting Anti-Money Laundering (AML) and Counter-Terrorist Financing (CTF) obligations.

## Base URL

`/api/v1/compliance`

## Financial Industry Standards and Considerations

- **Regulatory Reporting (SAR/CTR)**: The API facilitates the generation of Suspicious Activity Reports (SAR) and Currency Transaction Reports (CTR), which are mandatory filings for financial institutions to report suspicious or large cash transactions to regulatory bodies (e.g., FinCEN in the US).
- **Watchlist Screening**: Integrates with various watchlist sources (OFAC, UN, EU sanctions, PEP lists) to screen users and transactions against known sanctioned entities, politically exposed persons, and other high-risk individuals or organizations. This is a critical component of AML/CTF compliance.
- **Transaction Monitoring and Pattern Analysis**: Implements sophisticated algorithms to analyze transaction patterns for anomalies, such as structuring (breaking large transactions into smaller ones to avoid reporting thresholds), round amount transactions, rapid succession transactions, and unusual timing. This proactive monitoring helps identify potential money laundering or fraud activities.
- **Audit Trails**: All compliance-related actions, including screening results and report generations, are meticulously logged to provide a comprehensive audit trail, essential for regulatory examinations and internal compliance reviews.
- **Data Security and Privacy**: Handles sensitive user and transaction data with the highest level of security, ensuring data encryption in transit and at rest, and strict access controls. Data used for analysis is anonymized or pseudonymized where possible to protect privacy while maintaining analytical utility.
- **Scalability and Performance**: Designed to handle large volumes of transactional data and perform real-time or near real-time screening and analysis, critical for high-throughput financial operations.
- **Configurable Thresholds**: Reporting thresholds and risk parameters are configurable, allowing the system to adapt to evolving regulatory requirements and risk appetites.

## Endpoints

### 1. Screen User Against Watchlists

`POST /api/v1/compliance/screening/watchlist`

Screens a user against various predefined watchlists (e.g., OFAC, UN sanctions, PEP lists) to identify potential matches. This is a crucial step in the customer onboarding and ongoing monitoring processes.

**Permissions**: `enhanced_token_required`, `require_permissions(['compliance'])`, `rate_limit('50 per hour')`

**Request Body**:

```json
{
  "user_id": "string" (required): The unique identifier of the user to screen.
  "first_name": "string" (required): The first name of the user.
  "last_name": "string" (required): The last name of the user.
  "date_of_birth": "string (YYYY-MM-DD)" (optional): The date of birth of the user.
}
```

**Responses**:

- `200 OK`: Successfully performed watchlist screening.
  ```json
  {
    "user_id": "string",
    "screening_date": "string (ISO 8601 datetime)",
    "sources_checked": [
      "string" (e.g., "OFAC_SDN", "UN_SANCTIONS", "EU_SANCTIONS", "PEP_LIST")
    ],
    "matches": [
      {
        "source": "string",
        "matched_name": "string",
        "confidence": "integer (0-100)",
        "match_type": "string (e.g., "exact_name", "partial_name")",
        "list_entry": {
          "name": "string",
          "aliases": [
            "string"
          ],
          "date_of_birth": "string (YYYY-MM-DD)" (optional),
          "nationality": "string" (optional)
        }
      }
    ],
    "overall_status": "string (e.g., "clear", "review_required", "blocked")"
  }
  ```
- `400 Bad Request`: Invalid input or validation error.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Insufficient permissions.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: An unexpected error occurred.

### 2. Generate Suspicious Activity Report (SAR)

`POST /api/v1/compliance/reports/sar`

Generates a Suspicious Activity Report (SAR) based on identified suspicious user activity. This report includes user information, details of the suspicious activity, and related transactions.

**Permissions**: `enhanced_token_required`, `require_permissions(['compliance'])`, `rate_limit('10 per hour')`

**Request Body**:

```json
{
  "user_id": "string" (required): The unique identifier of the user associated with the suspicious activity.
  "suspicious_activity": {
    "description": "string" (required): A detailed description of the suspicious activity.
    "type": "string" (required): The type of suspicious activity (e.g., "money_laundering", "fraud", "structuring").
  }
}
```

**Responses**:

- `200 OK`: Successfully generated SAR.
  ```json
  {
    "report_id": "string",
    "report_date": "string (ISO 8601 datetime)",
    "subject_information": {
      "user_id": "string",
      "name": "string",
      "email": "string",
      "kyc_status": "string",
      "risk_score": "integer"
    },
    "suspicious_activity": {
      "description": "string",
      "activity_type": "string",
      "date_range": {
        "start": "string (ISO 8601 datetime)",
        "end": "string (ISO 8601 datetime)"
      },
      "total_amount": "string (Decimal)",
      "transaction_count": "integer"
    },
    "transactions": [
      {
        "transaction_id": "string",
        "amount": "string (Decimal)",
        "currency": "string",
        "type": "string",
        "date": "string (ISO 8601 datetime)",
        "status": "string"
      }
    ],
    "filing_institution": {
      "name": "string",
      "ein": "string",
      "address": "string"
    }
  }
  ```
- `400 Bad Request`: Invalid input or validation error.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Insufficient permissions.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: An unexpected error occurred.

### 3. Generate Currency Transaction Report (CTR)

`POST /api/v1/compliance/reports/ctr`

Generates a Currency Transaction Report (CTR) for transactions exceeding a specified threshold (e.g., $10,000). This endpoint would typically be triggered by an internal system monitoring large cash movements.

**Permissions**: `enhanced_token_required`, `require_permissions(['compliance'])`, `rate_limit('10 per hour')`

**Request Body**:

```json
{
  "transaction_ids": [
    "string" (required): A list of transaction IDs to include in the CTR. The system will aggregate these by user.
  ]
}
```

**Responses**:

- `200 OK`: Successfully generated CTR(s).
  ```json
  {
    "ctr_reports": [
      {
        "report_id": "string",
        "report_date": "string (ISO 8601 datetime)",
        "customer_information": {
          "user_id": "string",
          "name": "string",
          "email": "string",
          "phone": "string",
          "address": "string"
        },
        "transaction_summary": {
          "total_amount": "string (Decimal)",
          "transaction_count": "integer",
          "date_range": {
            "start": "string (ISO 8601 datetime)",
            "end": "string (ISO 8601 datetime)"
          }
        },
        "transactions": [
          {
            "transaction_id": "string",
            "amount": "string (Decimal)",
            "currency": "string",
            "type": "string",
            "date": "string (ISO 8601 datetime)"
          }
        ]
      }
    ],
    "total_reports": "integer",
    "generated_at": "string (ISO 8601 datetime)"
  }
  ```
- `400 Bad Request`: Invalid input or validation error.
- `401 Unauthorized`: Missing or invalid authentication token.
- `403 Forbidden`: Insufficient permissions.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: An unexpected error occurred.

### 4. Analyze Transaction Patterns

`GET /api/v1/compliance/analysis/patterns/{user_id}`

Analyzes a user's transaction patterns over a specified period to identify potential suspicious behaviors (e.g., structuring, round amounts, rapid succession, unusual timing). This endpoint provides insights into potential money laundering or fraud risks.

**Permissions**: `enhanced_token_required`, `require_permissions(['compliance'])`

**Path Parameters**:

- `user_id` (string, required): The unique identifier of the user whose transactions are to be analyzed.

**Query Parameters**:

- `days` (integer, optional): The number of past days to include in the analysis. Default is `90`.

**Responses**:

- `200 OK`: Successfully performed transaction pattern analysis.
  ```json
  {
    "analysis_period": {
      "start_date": "string (ISO 8601 datetime)",
      "end_date": "string (ISO 8601 datetime)",
      "days": "integer"
    },
    "transaction_summary": {
      "total_transactions": "integer",
      "total_amount": "string (Decimal)",
      "average_amount": "string (Decimal)"
    },
    "patterns": [
      {
        "type": "string (e.g., "potential_structuring", "round_amount_pattern", "rapid_succession", "unusual_timing")",
        "description": "string",
        "transaction_count": "integer",
        "total_amount": "string (Decimal)" (optional),
        "percentage": "float" (optional),
        "risk_level": "string (e.g., "low", "medium", "high", "critical")"
      }
    ],
    "risk_indicators": [
      "string" (e.g., "structuring", "round_amounts", "rapid_succession", "unusual_timing")
    ],
    "overall_risk_level": "string (e.g., "low", "medium", "high", "critical")"
  }
  ```
- `404 Not Found`: User not found.
- `500 Internal Server Error`: An unexpected error occurred.

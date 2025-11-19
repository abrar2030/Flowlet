# Ledger API Documentation

The Ledger API provides a robust and auditable system for managing all financial transactions and generating key financial reports, including ledger entries, trial balances, balance sheets, income statements, and cash flow statements. This API is fundamental for maintaining accurate financial records and ensuring compliance with accounting principles in a Fintech environment.

## Base URL

`/api/v1/ledger`

## Financial Industry Standards and Considerations

- **Double-Entry Accounting**: The underlying ledger system is based on double-entry accounting principles, ensuring that every financial transaction has an equal and opposite effect in at least two different accounts. This fundamental principle ensures the accuracy and balance of financial records.
- **Immutability of Entries**: Once a ledger entry is recorded, it is immutable, meaning it cannot be altered or deleted. Any corrections or adjustments are made through new, offsetting entries, preserving a complete and auditable history of all financial movements. This is critical for regulatory compliance and fraud prevention.
- **Audit Trail**: Every ledger entry is timestamped and linked to a transaction, providing a comprehensive audit trail. This allows for the tracing of all financial movements from their origin to their final destination, which is essential for regulatory examinations, internal audits, and dispute resolution.
- **Financial Reporting Standards**: The API supports the generation of standard financial statements (Trial Balance, Balance Sheet, Income Statement, Cash Flow Statement) that adhere to generally accepted accounting principles (GAAP) or International Financial Reporting Standards (IFRS), enabling accurate financial analysis and reporting.
- **Data Integrity and Reconciliation**: Robust mechanisms are in place to ensure the integrity of financial data, including regular reconciliation processes to verify that all accounts balance and that reported figures are accurate.
- **Granular Access Control**: Access to ledger data and financial reports is strictly controlled based on roles and permissions, ensuring that only authorized personnel can view or generate sensitive financial information.
- **Scalability**: The ledger system is designed to handle a high volume of transactions and maintain performance as the financial activities of the platform grow.

## Endpoints

### 1. Get Ledger Entries

`GET /api/v1/ledger/entries`

Retrieves a paginated list of all ledger entries, with options for filtering by account type, account name, currency, and date range. This endpoint provides a detailed view of all debits and credits within the system.

**Permissions**: Requires appropriate authentication and authorization (e.g., `admin_required` or specific `finance` role).

**Query Parameters**:
- `page` (integer, optional): Page number for pagination. Default is `1`.
- `per_page` (integer, optional): Number of items per page. Default is `50`.
- `account_type` (string, optional): Filter by account type (e.g., `asset`, `liability`, `equity`, `revenue`, `expense`).
- `account_name` (string, optional): Filter by account name (partial match).
- `currency` (string, optional): Filter by currency (e.g., `USD`, `EUR`).
- `start_date` (string, optional): Start date for filtering entries (YYYY-MM-DD).
- `end_date` (string, optional): End date for filtering entries (YYYY-MM-DD).

**Responses**:
- `200 OK`: Successfully retrieved ledger entries.
  ```json
  {
    "entries": [
      {
        "entry_id": "string",
        "transaction_id": "string",
        "account_type": "string",
        "account_name": "string",
        "debit_amount": "string (Decimal)",
        "credit_amount": "string (Decimal)",
        "currency": "string",
        "description": "string",
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
      "account_type": "string",
      "account_name": "string",
      "currency": "string",
      "start_date": "string",
      "end_date": "string"
    }
  }
  ```
- `500 Internal Server Error`: An unexpected error occurred.

### 2. Generate Trial Balance Report

`GET /api/v1/ledger/trial-balance`

Generates a trial balance report as of a specified date. The trial balance is a list of all the general ledger accounts (both revenue and capital) contained in the ledger of a business, showing the balance of each account. It is a key internal report to ensure the debits equal the credits.

**Permissions**: Requires appropriate authentication and authorization (e.g., `admin_required` or specific `finance` role).

**Query Parameters**:
- `as_of_date` (string, optional): The date for which to generate the trial balance (YYYY-MM-DD). Defaults to current UTC date.
- `currency` (string, optional): The currency for the report. Default is `USD`.

**Responses**:
- `200 OK`: Successfully generated trial balance report.
  ```json
  {
    "trial_balance": [
      {
        "account_type": "string",
        "account_name": "string",
        "total_debits": "string (Decimal)",
        "total_credits": "string (Decimal)",
        "balance": "string (Decimal)"
      }
    ],
    "summary": {
      "total_debits": "string (Decimal)",
      "total_credits": "string (Decimal)",
      "difference": "string (Decimal)",
      "balanced": "boolean"
    },
    "as_of_date": "string (YYYY-MM-DD)",
    "currency": "string",
    "generated_at": "string (ISO 8601 datetime)"
  }
  ```
- `500 Internal Server Error`: An unexpected error occurred.

### 3. Generate Balance Sheet Report

`GET /api/v1/ledger/balance-sheet`

Generates a balance sheet report as of a specified date. The balance sheet provides a snapshot of a company's financial position at a specific point in time, detailing its assets, liabilities, and equity.

**Permissions**: Requires appropriate authentication and authorization (e.g., `admin_required` or specific `finance` role).

**Query Parameters**:
- `as_of_date` (string, optional): The date for which to generate the balance sheet (YYYY-MM-DD). Defaults to current UTC date.
- `currency` (string, optional): The currency for the report. Default is `USD`.

**Responses**:
- `200 OK`: Successfully generated balance sheet report.
  ```json
  {
    "balance_sheet": {
      "assets": {
        "accounts": [
          {
            "account": "string",
            "balance": "string (Decimal)"
          }
        ],
        "total": "string (Decimal)"
      },
      "liabilities": {
        "accounts": [
          {
            "account": "string",
            "balance": "string (Decimal)"
          }
        ],
        "total": "string (Decimal)"
      },
      "equity": {
        "accounts": [
          {
            "account": "string",
            "balance": "string (Decimal)"
          }
        ],
        "total": "string (Decimal)"
      }
    },
    "totals": {
      "total_assets": "string (Decimal)",
      "total_liabilities_and_equity": "string (Decimal)",
      "balanced": "boolean"
    },
    "as_of_date": "string (YYYY-MM-DD)",
    "currency": "string",
    "generated_at": "string (ISO 8601 datetime)"
  }
  ```
- `500 Internal Server Error`: An unexpected error occurred.

### 4. Generate Income Statement (P&L) Report

`GET /api/v1/ledger/income-statement`

Generates an income statement (Profit & Loss report) for a specified period. This report summarizes the revenues, costs, and expenses incurred during a specific period, typically a fiscal quarter or year, providing insights into the company's profitability.

**Permissions**: Requires appropriate authentication and authorization (e.g., `admin_required` or specific `finance` role).

**Query Parameters**:
- `start_date` (string, required): The start date for the income statement (YYYY-MM-DD). Defaults to the first day of the current month.
- `end_date` (string, required): The end date for the income statement (YYYY-MM-DD). Defaults to the current date.
- `currency` (string, optional): The currency for the report. Default is `USD`.

**Responses**:
- `200 OK`: Successfully generated income statement report.
  ```json
  {
    "income_statement": {
      "revenue": {
        "accounts": [
          {
            "account": "string",
            "amount": "string (Decimal)"
          }
        ],
        "total": "string (Decimal)"
      },
      "expenses": {
        "accounts": [
          {
            "account": "string",
            "amount": "string (Decimal)"
          }
        ],
        "total": "string (Decimal)"
      },
      "net_income": "string (Decimal)"
    },
    "period": {
      "start_date": "string (YYYY-MM-DD)",
      "end_date": "string (YYYY-MM-DD)"
    },
    "currency": "string",
    "generated_at": "string (ISO 8601 datetime)"
  }
  ```
- `500 Internal Server Error`: An unexpected error occurred.

### 5. Generate Cash Flow Statement

`GET /api/v1/ledger/cash-flow`

Generates a cash flow statement for a specified period. This report provides a detailed breakdown of cash inflows and outflows from operating, investing, and financing activities, offering insights into the company's liquidity and solvency.

**Permissions**: Requires appropriate authentication and authorization (e.g., `admin_required` or specific `finance` role).

**Query Parameters**:
- `start_date` (string, required): The start date for the cash flow statement (YYYY-MM-DD). Defaults to the first day of the current month.
- `end_date` (string, required): The end date for the cash flow statement (YYYY-MM-DD). Defaults to the current date.
- `currency` (string, optional): The currency for the report. Default is `USD`.

**Responses**:
- `200 OK`: Successfully generated cash flow statement report.
  ```json
  {
    "cash_flow_statement": {
      "operating_activities": {
        "total": "string (Decimal)",
        "details": [
          {
            "description": "string",
            "amount": "string (Decimal)",
            "date": "string (ISO 8601 datetime)"
          }
        ]
      },
      "investing_activities": {
        "total": "string (Decimal)",
        "details": [
          {
            "description": "string",
            "amount": "string (Decimal)",
            "date": "string (ISO 8601 datetime)"
          }
        ]
      },
      "financing_activities": {
        "total": "string (Decimal)",
        "details": [
          {
            "description": "string",
            "amount": "string (Decimal)",
            "date": "string (ISO 8601 datetime)"
          }
        ]
      },
      "net_cash_flow": "string (Decimal)"
    },
    "period": {
      "start_date": "string (YYYY-MM-DD)",
      "end_date": "string (YYYY-MM-DD)"
    },
    "currency": "string",
    "generated_at": "string (ISO 8601 datetime)"
  }
  ```
- `500 Internal Server Error`: An unexpected error occurred.

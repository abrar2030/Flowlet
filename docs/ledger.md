
# Ledger API Documentation

The Ledger API provides functionalities for managing and reporting on financial transactions using a double-entry accounting system. It allows retrieval of ledger entries, generation of trial balances, balance sheets, income statements, and cash flow statements.

## Base URL

`/api/v1/ledger`

## Endpoints

### 1. Get Ledger Entries

`GET /api/v1/ledger/entries`

Retrieves a paginated list of individual ledger entries, with filtering options for account type, account name, currency, and date range.

#### Query Parameters

| Parameter     | Type     | Description                                     | Default |
| :------------ | :------- | :---------------------------------------------- | :------ |
| `page`        | `integer` | The page number for pagination.                 | `1`     |
| `per_page`    | `integer` | The number of entries per page.                 | `50`    |
| `account_type` | `string` | Optional: Filter by account type (`asset`, `liability`, `equity`, `revenue`, `expense`). | No       |
| `account_name` | `string` | Optional: Filter by account name (e.g., `Cash_and_Bank`, `Customer_Wallet_123`). | No       |
| `currency`    | `string` | Optional: Filter by currency (e.g., `USD`, `EUR`). | No       |
| `start_date`  | `string` | Optional: Start date for filtering (`YYYY-MM-DD`). | No       |
| `end_date`    | `string` | Optional: End date for filtering (`YYYY-MM-DD`).   | No       |

#### Example Request

```
GET /api/v1/ledger/entries?account_type=asset&currency=USD&start_date=2024-01-01
```

#### Example Success Response (200 OK)

```json
{
    "entries": [
        {
            "entry_id": "entry_001",
            "transaction_id": "txn_001",
            "account_type": "asset",
            "account_name": "Cash_and_Bank",
            "debit_amount": "100.00",
            "credit_amount": "0.00",
            "currency": "USD",
            "description": "Cash received for wallet wallet_abc",
            "created_at": "2024-01-01T12:00:00.000Z"
        },
        {
            "entry_id": "entry_002",
            "transaction_id": "txn_001",
            "account_type": "liability",
            "account_name": "Customer_Wallet_wallet_abc",
            "debit_amount": "0.00",
            "credit_amount": "100.00",
            "currency": "USD",
            "description": "Customer wallet credit for Initial deposit",
            "created_at": "2024-01-01T12:00:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "per_page": 50,
        "total": 2,
        "pages": 1,
        "has_next": false,
        "has_prev": false
    },
    "filters_applied": {
        "account_type": "asset",
        "account_name": null,
        "currency": "USD",
        "start_date": "2024-01-01",
        "end_date": null
    }
}
```

### 2. Generate Trial Balance Report

`GET /api/v1/ledger/trial-balance`

Generates a trial balance report, summarizing the debit and credit balances for all accounts as of a specified date.

#### Query Parameters

| Parameter    | Type     | Description                                     | Default |
| :----------- | :------- | :---------------------------------------------- | :------ |
| `as_of_date` | `string` | Optional: The date for which to generate the trial balance (`YYYY-MM-DD`). Defaults to current date. | No       |
| `currency`   | `string` | Optional: The currency for the report. Defaults to `USD`. | `USD`   |

#### Example Request

```
GET /api/v1/ledger/trial-balance?as_of_date=2024-01-31&currency=USD
```

#### Example Success Response (200 OK)

```json
{
    "trial_balance": [
        {
            "account_type": "asset",
            "account_name": "Cash_and_Bank",
            "total_debits": "1500.00",
            "total_credits": "500.00",
            "balance": "1000.00"
        },
        {
            "account_type": "liability",
            "account_name": "Customer_Wallet_wallet_abc",
            "total_debits": "500.00",
            "total_credits": "1500.00",
            "balance": "1000.00"
        }
    ],
    "summary": {
        "total_debits": "2000.00",
        "total_credits": "2000.00",
        "difference": "0.00",
        "balanced": true
    },
    "as_of_date": "2024-01-31",
    "currency": "USD",
    "generated_at": "2024-01-20T10:00:00.000Z"
}
```

### 3. Generate Balance Sheet Report

`GET /api/v1/ledger/balance-sheet`

Generates a balance sheet report, showing assets, liabilities, and equity as of a specified date.

#### Query Parameters

| Parameter    | Type     | Description                                     | Default |
| :----------- | :------- | :---------------------------------------------- | :------ |
| `as_of_date` | `string` | Optional: The date for which to generate the balance sheet (`YYYY-MM-DD`). Defaults to current date. | No       |
| `currency`   | `string` | Optional: The currency for the report. Defaults to `USD`. | `USD`   |

#### Example Request

```
GET /api/v1/ledger/balance-sheet?as_of_date=2024-01-31
```

#### Example Success Response (200 OK)

```json
{
    "balance_sheet": {
        "assets": {
            "accounts": [
                {
                    "account": "Cash_and_Bank",
                    "balance": "1000.00"
                }
            ],
            "total": "1000.00"
        },
        "liabilities": {
            "accounts": [
                {
                    "account": "Customer_Wallet_wallet_abc",
                    "balance": "1000.00"
                }
            ],
            "total": "1000.00"
        },
        "equity": {
            "accounts": [],
            "total": "0.00"
        }
    },
    "totals": {
        "total_assets": "1000.00",
        "total_liabilities_and_equity": "1000.00",
        "balanced": true
    },
    "as_of_date": "2024-01-31",
    "currency": "USD",
    "generated_at": "2024-01-20T11:00:00.000Z"
}
```

### 4. Generate Income Statement (Profit & Loss) Report

`GET /api/v1/ledger/income-statement`

Generates an income statement (Profit & Loss) report for a specified period, showing revenues and expenses.

#### Query Parameters

| Parameter  | Type     | Description                                     | Default |
| :--------- | :------- | :---------------------------------------------- | :------ |
| `start_date` | `string` | The start date for the report (`YYYY-MM-DD`).   | Current month start |
| `end_date` | `string` | The end date for the report (`YYYY-MM-DD`).     | Current date |
| `currency` | `string` | Optional: The currency for the report. Defaults to `USD`. | `USD`   |

#### Example Request

```
GET /api/v1/ledger/income-statement?start_date=2024-01-01&end_date=2024-01-31
```

#### Example Success Response (200 OK)

```json
{
    "income_statement": {
        "revenue": {
            "accounts": [
                {
                    "account": "Service_Fees",
                    "amount": "50.00"
                }
            ],
            "total": "50.00"
        },
        "expenses": {
            "accounts": [
                {
                    "account": "Operating_Expenses",
                    "amount": "20.00"
                }
            ],
            "total": "20.00"
        },
        "net_income": "30.00"
    },
    "period": {
        "start_date": "2024-01-01",
        "end_date": "2024-01-31"
    },
    "currency": "USD",
    "generated_at": "2024-01-20T12:00:00.000Z"
}
```

### 5. Generate Cash Flow Statement

`GET /api/v1/ledger/cash-flow`

Generates a cash flow statement for a specified period, categorizing cash flows into operating, investing, and financing activities.

#### Query Parameters

| Parameter  | Type     | Description                                     | Default |
| :--------- | :------- | :---------------------------------------------- | :------ |
| `start_date` | `string` | The start date for the report (`YYYY-MM-DD`).   | Current month start |
| `end_date` | `string` | The end date for the report (`YYYY-MM-DD`).     | Current date |
| `currency` | `string` | Optional: The currency for the report. Defaults to `USD`. | `USD`   |

#### Example Request

```
GET /api/v1/ledger/cash-flow?start_date=2024-01-01&end_date=2024-01-31
```

#### Example Success Response (200 OK)

```json
{
    "cash_flow_statement": {
        "operating_activities": {
            "total": "100.00",
            "details": [
                {
                    "description": "Cash received from sales",
                    "amount": "150.00",
                    "date": "2024-01-10T09:00:00.000Z"
                },
                {
                    "description": "Cash paid for expenses",
                    "amount": "-50.00",
                    "date": "2024-01-15T14:00:00.000Z"
                }
            ]
        },
        "investing_activities": {
            "total": "-200.00",
            "details": [
                {
                    "description": "Purchase of equipment",
                    "amount": "-200.00",
                    "date": "2024-01-20T10:00:00.000Z"
                }
            ]
        },
        "financing_activities": {
            "total": "500.00",
            "details": [
                {
                    "description": "Issuance of debt",
                    "amount": "500.00",
                    "date": "2024-01-25T11:00:00.000Z"
                }
            ]
        },
        "net_cash_flow": "400.00"
    },
    "period": {
        "start_date": "2024-01-01",
        "end_date": "2024-01-31"
    },
    "currency": "USD",
    "generated_at": "2024-01-20T13:00:00.000Z"
}
```



# Flowlet Backend Architecture Overview

This document outlines the current architecture and key functionalities of the Flowlet backend. The backend is built using Flask and interacts with a SQL database (SQLite for development, configurable for production).

## Core Components

The backend is structured into several modules, each responsible for a specific domain:

- **`main.py`**: The main Flask application entry point. It initializes the Flask app, configures the database, registers blueprints for different functionalities, and serves static files.
- **`src/database/`**: Contains the database models (defined using SQLAlchemy) and the database initialization logic. It defines the schema for `User`, `Wallet`, `Transaction`, `Card`, `KYCRecord`, `LedgerEntry`, `APIKey`, `AuditLog`, and `FraudAlert`.
- **`src/routes/`**: This directory contains separate blueprint modules for different API endpoints, promoting modularity and organization. Each blueprint handles a specific set of related functionalities:
    - **`auth.py`**: Manages user authentication, including registration, login, profile management, and JWT token verification. It uses SHA256 for password hashing (though bcrypt is recommended for production) and JWT for session management.
    - **`wallet.py`**: Handles wallet-related operations such as creating wallets, retrieving wallet details, fetching transaction history for a wallet, freezing/unfreezing wallets, and internal fund transfers between wallets.
    - **`payment.py`**: Manages various payment processing functionalities, including deposits, withdrawals, bank transfers (ACH, SEPA, Wire), and card payments. It also includes logic for generating unique reference IDs and creating double-entry ledger entries for transactions.
    - **`card.py`**: Provides functionalities for issuing virtual and physical cards, retrieving card details, activating/freezing/cancelling cards, updating spending limits, and managing card controls (e.g., online transactions, blocked merchant categories). It also includes a simulated PIN update function.
    - **`kyc_aml.py`**: Implements Know Your Customer (KYC) and Anti-Money Laundering (AML) processes. This includes user creation with basic information, starting verification processes (basic, enhanced, premium), submitting identity documents, and simulating verification completion with risk scoring. It also has basic email and phone validation.
    - **`ledger.py`**: Manages the financial ledger, providing endpoints to retrieve ledger entries with filtering and pagination. It also generates financial reports such as Trial Balance, Balance Sheet, and Income Statement based on ledger data.
    - **`ai_service.py`**: Contains AI-related functionalities, primarily a simulated fraud detection system that analyzes transactions based on various risk factors (amount, velocity, geographic, time, merchant category, device/IP, behavioral patterns) and generates fraud alerts. It also includes a simple rule-based chatbot for API documentation and support.
    - **`security.py`**: Handles security-related features, including API key management (creation, listing, revocation, permission updates), audit logging for key actions, and simulated tokenization/detokenization of sensitive data. It also includes a simulated security scan function.
- **`src/models/`**: Contains the SQLAlchemy models for the database tables. (Note: The actual model definitions are within `src/database.py` in the provided code, which is a slight deviation from the typical `models` directory usage, but functionally serves the same purpose).

## Key Features & Considerations

- **Modular Design**: The use of Flask Blueprints helps organize the API endpoints into logical groups.
- **Database**: Uses SQLAlchemy ORM for database interactions, providing an abstraction layer over the underlying database.
- **Authentication**: JWT-based authentication for API access, with API key management for external integrations.
- **Financial Operations**: Comprehensive modules for wallet, payment, card, and ledger management, including double-entry accounting principles for financial transactions.
- **KYC/AML**: Basic framework for user verification and risk assessment.
- **Fraud Detection**: Simulated AI-driven fraud detection with risk scoring and alert generation.
- **Security**: API key management, audit logging, and simulated data tokenization.
- **Error Handling**: Basic error handling with JSON responses for API errors.

## Areas for Refactoring (Initial Thoughts for Financial Industry Standards)

Based on a preliminary review, the following areas will require attention to meet financial industry standards:

1.  **Security Enhancements**: 
    - **Password Hashing**: Replace SHA256 with a stronger, more secure hashing algorithm like bcrypt or Argon2 for password storage.
    - **Sensitive Data Handling**: Review and enhance tokenization/encryption for all sensitive data (e.g., card numbers, bank account details). Ensure proper key management.
    - **API Key Security**: Implement more robust API key management, including granular permissions, IP whitelisting, and stricter rate limiting.
    - **Input Validation**: Implement more comprehensive and stricter input validation across all API endpoints to prevent injection attacks and other vulnerabilities.
    - **Session Management**: Review JWT implementation for best practices, including token revocation mechanisms and shorter expiry times with refresh tokens.
    - **Access Control**: Ensure proper role-based access control (RBAC) is enforced consistently across all endpoints.
2.  **Data Integrity and Consistency**: 
    - **Transactions**: Implement proper database transactions for all financial operations to ensure atomicity, consistency, isolation, and durability (ACID properties). Currently, `db.session.commit()` is used, but explicit transaction blocks with rollback handling for all operations are crucial.
    - **Decimal Precision**: Ensure consistent use of `Decimal` type for all monetary values to prevent floating-point inaccuracies.
    - **Ledger Accuracy**: Thoroughly review ledger entry creation logic to ensure strict adherence to double-entry accounting principles for all financial flows.
3.  **Compliance and Auditability**: 
    - **Audit Logging**: Enhance audit logging to capture more detailed information, including user context, request parameters, and changes to critical data. Ensure logs are immutable and securely stored.
    - **KYC/AML**: Strengthen KYC/AML processes to meet regulatory requirements (e.g., proper document verification, real-time watchlist screening, enhanced due diligence).
    - **Reporting**: Improve financial reporting (Trial Balance, Balance Sheet, Income Statement) to meet regulatory and internal audit requirements.
4.  **Error Handling and Resilience**: 
    - **Granular Error Responses**: Provide more specific and standardized error codes and messages for API responses.
    - **Rate Limiting**: Implement robust rate limiting to protect against abuse and DDoS attacks.
    - **Circuit Breakers/Retries**: Consider implementing patterns for external service calls (e.g., payment gateways, KYC providers) to improve resilience.
5.  **Code Quality and Maintainability**: 
    - **Code Standards**: Enforce consistent coding standards and best practices.
    - **Testing**: Expand unit and integration test coverage, especially for critical financial logic.
    - **Configuration Management**: Externalize sensitive configurations (database credentials, API keys) from the codebase using environment variables or secure configuration management tools.

This initial analysis will guide the refactoring and new feature implementation phases.


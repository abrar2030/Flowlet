
# Flowlet: Embedded Finance Platform

Flowlet is a comprehensive embedded finance platform designed to integrate financial services seamlessly into any application or business. It provides a robust set of APIs for managing wallets, processing payments, issuing cards, handling KYC/AML, and more. Flowlet aims to simplify financial operations for businesses, enabling them to offer innovative financial products and services to their customers.

## Key Features

*   **Wallet Management:** Create, manage, and track digital wallets for users.
*   **Payment Processing:** Facilitate deposits, withdrawals, bank transfers, and card payments.
*   **Card Issuance:** Issue virtual and physical cards with customizable spending limits and controls.
*   **KYC/AML Compliance:** Streamline Know Your Customer (KYC) and Anti-Money Laundering (AML) verification processes.
*   **Ledger & Accounting:** Maintain a double-entry ledger for all financial transactions.
*   **AI Services:** Integrate AI-powered functionalities for enhanced financial operations.
*   **Security:** Implement robust security measures to protect sensitive financial data.
*   **API Gateway:** Centralized access point for all Flowlet APIs.

## Architecture Overview

Flowlet is built with a modular architecture, primarily consisting of a Python Flask backend and a React-based frontend (both web and mobile). The backend exposes a set of RESTful APIs that interact with a SQLite database (for demonstration purposes, can be configured for other databases). The frontend applications consume these APIs to provide a user interface for financial operations.

### Backend (Flask)

The backend is developed using Python Flask and provides the core business logic and API endpoints. Key components include:

*   **API Endpoints:** Organized into blueprints for different financial services (e.g., Wallet, Payment, Card, KYC/AML).
*   **Database Models:** SQLAlchemy ORM is used to define database schemas for entities like Wallets, Transactions, Cards, Users, and Ledger Entries.
*   **Business Logic:** Handles transaction processing, balance updates, compliance checks, and other financial operations.

### Frontend (React)

The frontend consists of two separate React applications:

*   **Web Frontend:** A web-based interface for administrative tasks and user management.
*   **Mobile Frontend:** A mobile-optimized interface for end-users to manage their wallets, cards, and transactions.

### Database

Flowlet uses SQLite as its default database for simplicity and ease of setup. For production deployments, it can be configured to use more robust database systems like PostgreSQL or MySQL.

### Security

Security is a paramount concern for Flowlet. The platform incorporates measures such as:

*   **API Key Authentication:** Secure access to API endpoints.
*   **CORS Configuration:** Proper Cross-Origin Resource Sharing setup.
*   **Data Encryption:** (Planned/Future Enhancement) Encryption of sensitive data at rest and in transit.

## Getting Started

To get started with Flowlet, refer to the `06_Developer_Guides/Setup_Guide.md` documentation for instructions on setting up the development environment and running the application.



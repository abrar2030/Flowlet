# Flowlet Backend

## Overview

The Flowlet Backend is a robust, modular platform designed to support financial technology operations. It is built using **Python and Flask**, following a microservices-like architecture to emphasize security, compliance, and advanced financial intelligence.

## 1. Core Directory Structure

The backend is organized to separate the application entry point, configuration, and core business logic.

| Directory       | Primary Function             | Key Components                                                                                                              |
| :-------------- | :--------------------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| **app.py**      | **Application Entry Point**  | Contains the `create_app()` factory function, initializes extensions (DB, Migrations, Limiter), and registers blueprints.   |
| **src/**        | **Core Business Logic**      | Houses all specialized modules: `ai/`, `analytics/`, `compliance/`, `integrations/`, `security/`, `routes/`, and `models/`. |
| **src/config/** | **Configuration Management** | Centralized application settings (`settings.py`) and security policies (`security.py`).                                     |
| **src/models/** | **Database Models**          | SQLAlchemy models for core entities: `user.py`, `account.py`, `transaction.py`, `card.py`, etc.                             |
| **src/routes/** | **API Endpoints**            | Flask Blueprints defining all API routes (e.g., `/auth`, `/payment`, `/analytics`).                                         |
| **instance/**   | **Runtime Data**             | Directory for environment-specific data (e.g., SQLite DB files, if used). Currently empty after cleanup.                    |
| **logs/**       | **Application Logging**      | Stores application logs (`flowlet.log`).                                                                                    |
| **tests/**      | **Comprehensive Testing**    | Structured suite for Unit, Integration, Functional, Performance, and Security testing.                                      |

## 2. Specialized Services in `src/`

The `src/` directory is the heart of the Flowlet backend, containing highly specialized, domain-specific modules.

| Module            | Primary Function                       | Key Sub-Components/Files                                                                                         |
| :---------------- | :------------------------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **ai/**           | **Financial AI/ML**                    | `fraud_detection.py`, `risk_assessment.py`, `transaction_intelligence.py`, `support_chatbot.py`.                 |
| **analytics/**    | **Data Processing & Reporting**        | `dashboard_service.py`, `reporting_engine.py`, `real_time_analytics.py`, `metrics_calculator.py`.                |
| **compliance/**   | **Regulatory Adherence**               | `aml_engine.py`, `kyc_service.py`, `regulatory_framework.py`, `compliance_engine.py`.                            |
| **integrations/** | **External System Connectivity**       | Sub-modules for `banking/` (Plaid, FDX), `payments/` (Stripe), and `currency/` (Exchange Rates).                 |
| **nocode/**       | **Business Logic Configuration**       | `rule_engine.py`, `workflow_builder.py`, `config_engine.py` for dynamic business rules.                          |
| **security/**     | **Authentication & Threat Prevention** | `authentication.py`, `encryption_service.py`, `rate_limiter.py`, `threat_prevention.py`, `password_security.py`. |
| **services/**     | **Core Business Services**             | `payment_service.py`, `card_service.py`, `wallet_service.py` implementing core financial logic.                  |
| **gateway/**      | **API Gateway Logic**                  | `optimized_gateway.py` for handling and routing external API requests.                                           |

## 3. Configuration and Security

Configuration is split into two primary files for clarity and separation of concerns.

| File                       | Description              | Key Responsibilities                                                                                                                                     |
| :------------------------- | :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **src/config/settings.py** | **Application Settings** | Defines environment-specific settings (e.g., `SQLALCHEMY_DATABASE_URI`, `REDIS_URL`), API metadata, and feature flags (e.g., `FRAUD_DETECTION_ENABLED`). |
| **src/config/security.py** | **Security Policies**    | Defines strict security parameters, including JWT configuration, password policy, rate limiting rules, and encryption key requirements.                  |

## 4. API Routes Overview

The `src/routes/` directory contains Flask Blueprints, each managing a set of related API endpoints.

| Blueprint File     | Domain          | Key Functionality                                                              |
| :----------------- | :-------------- | :----------------------------------------------------------------------------- |
| **auth.py**        | Authentication  | User registration, login, token refresh, and password management.              |
| **user.py**        | User Management | Profile retrieval, updates, and administrative user operations.                |
| **payment.py**     | Payments        | Processing transactions, managing payment methods, and payment status checks.  |
| **wallet.py**      | Wallet          | Managing user wallets, balances, and internal transfers.                       |
| **analytics.py**   | Analytics       | Access to dashboard data, metrics, and reporting endpoints.                    |
| **kyc_aml.py**     | Compliance      | Endpoints for Know Your Customer (KYC) and Anti-Money Laundering (AML) checks. |
| **security.py**    | Security        | Audit log access, security status checks, and threat monitoring data.          |
| **api_gateway.py** | Gateway         | External API routing and centralized request handling.                         |

## 5. Testing Suite Overview

The `tests/` directory is structured to ensure comprehensive quality assurance across all layers of the application.

| Test Category   | Location             | Purpose                                                                                                       |
| :-------------- | :------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Unit**        | `tests/unit/`        | Verifies individual functions, classes, and service methods in isolation (e.g., `test_payment_service.py`).   |
| **Functional**  | `tests/functional/`  | Tests end-to-end user flows and core business logic (e.g., `test_fraud_detection.py`).                        |
| **Integration** | `tests/integration/` | Verifies interactions between different services and external systems (e.g., `test_banking_integrations.py`). |
| **API**         | `tests/api/`         | Validates API endpoint responses, data contracts, and status codes (e.g., `test_api_integration.py`).         |
| **Performance** | `tests/performance/` | Measures latency and throughput of critical paths (e.g., `test_gateway_performance.py`).                      |
| **Security**    | `tests/security/`    | Validates security controls like rate limiting, authentication, and input validation.                         |

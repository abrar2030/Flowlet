# Flowlet Backend

## Overview

The Flowlet Backend is a robust, modular platform designed to support financial technology operations. It is built around a microservices-like structure within a Python framework, emphasizing security, compliance, and advanced analytics.

## 1. Core Directory Structure

The backend is organized into a main application (`app/`) and a comprehensive source directory (`src/`) that houses the core business logic and specialized services.

| Directory     | Primary Function                                  | Key Components                                                               |
| :------------ | :------------------------------------------------ | :--------------------------------------------------------------------------- |
| **app/**      | Main application entry point and basic structure. | `api/` (Basic Auth), `models/` (Core User/Account models).                   |
| **src/**      | Core business logic and specialized services.     | `ai/`, `analytics/`, `compliance/`, `integrations/`, `security/`, `nocode/`. |
| **instance/** | Runtime data and configuration.                   | SQLite database files (`flowlet_*.db`).                                      |
| **logs/**     | Application logging.                              | `flowlet.log`.                                                               |
| **tests/**    | Comprehensive testing suite.                      | `api/`, `functional/`, `integration/`, `performance/`, `security/`, `unit/`. |

## 2. Specialized Services in `src/`

The `src/` directory is the heart of the Flowlet backend, containing highly specialized modules.

| Module            | Primary Function                                      | Key Sub-Components/Files                                                                         |
| :---------------- | :---------------------------------------------------- | :----------------------------------------------------------------------------------------------- |
| **ai/**           | Advanced AI/ML services for financial intelligence.   | `fraud_detection.py`, `risk_assessment.py`, `transaction_intelligence.py`, `support_chatbot.py`. |
| **analytics/**    | Data processing and reporting.                        | `dashboard_service.py`, `reporting_engine.py`, `real_time_analytics.py`.                         |
| **compliance/**   | Regulatory adherence and legal services.              | `aml_engine.py`, `kyc_service.py`, `regulatory_framework.py`, `compliance_engine.py`.            |
| **integrations/** | External system connectivity.                         | `banking/` (Plaid, Open Banking), `payments/` (Stripe), `currency/`.                             |
| **nocode/**       | Business logic configuration tools.                   | `rule_engine.py`, `workflow_builder.py`, `config_engine.py`.                                     |
| **security/**     | Authentication, authorization, and threat prevention. | `authentication.py`, `encryption_service.py`, `rate_limiter.py`, `threat_prevention.py`.         |
| **database/**     | Database setup and connection.                        | `app.db`, `flowlet.db`.                                                                          |
| **routes/**       | API endpoint definitions.                             | `auth.py`, `payment.py`, `wallet.py`, `analytics.py`, `kyc_aml.py`.                              |

## 3. Testing Suite Overview

The `tests/` directory is structured to cover all aspects of the application, from low-level units to end-to-end performance.

| Test Category   | Location             | Purpose                                                            |
| :-------------- | :------------------- | :----------------------------------------------------------------- |
| **Unit**        | `tests/unit/`        | Verify individual functions and classes in isolation.              |
| **API**         | `tests/api/`         | Validate API endpoint responses and data contracts.                |
| **Functional**  | `tests/functional/`  | Test end-to-end user flows and core business logic.                |
| **Integration** | `tests/integration/` | Verify interactions between services (e.g., banking integrations). |
| **Performance** | `tests/performance/` | Measure latency and throughput of critical paths (e.g., gateway).  |
| **Security**    | `tests/security/`    | Validate security controls (e.g., rate limiting, authentication).  |

## 4. Key Configuration and Entry Points

| File/Component           | Description                            | Role                                                               |
| :----------------------- | :------------------------------------- | :----------------------------------------------------------------- |
| `main.py`                | Main application entry point.          | Initializes the application and runs the development server.       |
| `wsgi.py`                | WSGI entry point.                      | Used for production deployment with WSGI servers (e.g., Gunicorn). |
| `config.py`              | Base configuration file.               | Contains environment-agnostic settings.                            |
| `src/config/settings.py` | Detailed application settings.         | Defines environment-specific variables and feature flags.          |
| `requirements.txt`       | Python dependencies.                   | Lists all required libraries for the project.                      |
| `Procfile`               | Heroku/Cloud deployment configuration. | Defines processes for the application (e.g., web, worker).         |

## 5. Development and Operations

The backend uses a standard Python development setup.

| Area               | Detail                                                                                    |
| :----------------- | :---------------------------------------------------------------------------------------- |
| **Language**       | Python 3.x                                                                                |
| **Framework**      | Flask (implied by file structure) or similar lightweight framework.                       |
| **Database**       | SQLite for development/testing, production-ready RDBMS (e.g., PostgreSQL) for deployment. |
| **Testing**        | `pytest` (implied by `conftest.py` in test structure).                                    |
| **Test Execution** | `./run_tests.sh` script for comprehensive test execution.                                 |

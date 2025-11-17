# Flowlet Backend

The Flowlet Backend is a robust, modular platform designed to support financial technology operations. It is built using the **Flask** framework and follows a structured, feature-rich architecture, emphasizing security, compliance, and advanced analytics.

## 1. Core Technologies and Dependencies

The backend is a Python application with a comprehensive set of dependencies for a modern, scalable service.

| Category | Key Technologies | Purpose |
| :--- | :--- | :--- |
| **Web Framework** | `Flask`, `Flask-CORS`, `gunicorn` | Core web application, API routing, and production serving. |
| **Database** | `SQLAlchemy 2.0`, `Flask-SQLAlchemy`, `psycopg2-binary` | Object-Relational Mapper (ORM) and PostgreSQL adapter for robust data management. |
| **Security** | `Flask-JWT-Extended`, `bcrypt`, `cryptography` | User authentication, token management, and password hashing. |
| **Asynchronous Tasks** | `celery`, `kombu`, `redis` | Background job processing, task queuing, and inter-process communication. |
| **Validation/Serialization** | `marshmallow`, `pydantic` | Data validation, object serialization, and data contract enforcement. |
| **Testing** | `pytest`, `factory-boy`, `faker` | Comprehensive testing suite for unit, integration, and functional tests. |
| **Monitoring/Logging** | `structlog`, `prometheus-client` | Structured logging and application metrics for observability. |

## 2. Directory Structure

The application is organized into logical directories to separate concerns, making the codebase maintainable and scalable.

| Directory | Primary Function | Key Contents |
| :--- | :--- | :--- |
| **app/** | Main application package. | Contains core application components like `api/` endpoints, `models/` (DB schemas), and utility functions. |
| **src/** | Core business logic and specialized services. | Houses feature-specific modules like `ai/`, `compliance/`, `security/`, and main routing logic (`routes.py`). |
| **tests/** | Comprehensive testing suite. | Structured testing for `api/`, `functional/`, `integration/`, `performance/`, and `security/`. |
| **instance/** | Runtime data and configuration. | Holds environment-specific data, e.g., SQLite database files for development. |
| **logs/** | Application logging. | Stores application log files. |
| `requirements.txt` | Dependency manifest. | Lists all required Python packages and their versions. |
| `app.py`, `main.py` | Application entry points. | Initialization and development server startup. |
| `wsgi.py` | WSGI entry point. | Used for production deployment with WSGI servers (e.g., Gunicorn). |

## 3. Specialized Services in `src/`

The `src/` directory is the heart of the Flowlet backend, containing highly specialized modules that implement the core financial logic.

| Module | Primary Function | Key Sub-Components/Files |
| :--- | :--- | :--- |
| **ai/** | Advanced AI/ML services. | `fraud_detection.py`, `risk_assessment.py`, `transaction_intelligence.py`, `support_chatbot.py`. |
| **analytics/** | Data processing and reporting. | Contains logic for dashboards and real-time data analysis. |
| **compliance/** | Regulatory adherence. | Logic for Anti-Money Laundering (AML) and Know Your Customer (KYC) services. |
| **database/** | Database setup and connection. | Contains database configuration and connection utilities. |
| **gateway/** | External service communication. | Handles routing and communication with external APIs. |
| **integrations/** | External system connectivity. | Modules for connecting to third-party services (e.g., banking, payments). |
| **ml/** | Machine Learning models. | Contains ML model definitions and related logic, including a `fraud_detection/` subdirectory. |
| **nocode/** | Business logic configuration. | Tools for defining business rules and workflows without code. |
| **security/** | Authentication and threat prevention. | Services for encryption, rate limiting, and threat detection. |
| **routes.py** | Main API routing. | Defines core API endpoints for authentication, user profiles, accounts, and transactions. |

## 4. Core API Endpoints (Defined in `src/routes.py`)

The main API routes handle user management, account information, and financial transactions. All protected routes require a valid JWT Bearer token.

| Endpoint | Method | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | Creates a new user account and a default checking account. | None |
| `/auth/login` | `POST` | Authenticates a user and returns a JWT access token. | None |
| `/user/profile` | `GET` | Retrieves the current user's profile and associated accounts. | Required |
| `/accounts` | `GET` | Lists all financial accounts belonging to the current user. | Required |
| `/accounts/<id>/transactions` | `GET` | Retrieves a paginated list of transactions for a specific account. | Required |
| `/transactions/send` | `POST` | Executes a money transfer (debit) from a user's account. | Required |
| `/transactions/deposit` | `POST` | Executes a money deposit (credit) to a user's account. | Required |
| `/health` | `GET` | Basic health check to confirm the API is running. | None |
| `/info` | `GET` | Returns basic API version and endpoint information. | None |

## 5. Testing Suite Overview

The `tests/` directory is structured to ensure high code quality and reliability across all application layers.

| Test Category | Location | Purpose |
| :--- | :--- | :--- |
| **Unit** | `tests/unit/` | Verifies individual functions and classes in isolation. |
| **API** | `tests/api/` | Validates API endpoint responses and data contracts. |
| **Functional** | `tests/functional/` | Tests end-to-end user flows and core business logic. |
| **Integration** | `tests/integration/` | Verifies interactions between services (e.g., database, external integrations). |
| **Performance** | `tests/performance/` | Measures latency and throughput of critical paths. |
| **Security** | `tests/security/` | Validates security controls (e.g., authentication, rate limiting). |
| `test_runner.py` | Root of `tests/` | Central script for managing and executing the test suite. |
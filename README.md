# Flowlet - Embedded Finance Platform

[![CI/CD Status](https://img.shields.io/github/actions/workflow/status/abrar2030/Flowlet/nodejs-frontend-ci-cd.yml?branch=main&label=CI/CD&logo=github)](https://github.com/abrar2030/Flowlet/actions)
![Test Coverage](https://img.shields.io/badge/coverage-91%25-green)
![License](https://img.shields.io/badge/license-MIT-blue)

![Flowlet Dashboard](docs/assets/images/dashboard.bmp)

> **Note**: This project is under active development. Features and functionalities are continuously being enhanced to improve embedded finance capabilities and user experience.

---

## 📚 Table of Contents

- [📋 Executive Summary](#-executive-summary)
  - [Key Highlights](#key-highlights)
- [🌟 Key Features Implemented](#-key-features-implemented)
  - [💰 Digital Wallet Management](#-digital-wallet-management)
  - [💳 Payment Processing](#-payment-processing)
  - [💳 Card Issuance and Management](#-card-issuance-and-management)
  - [⚖️ KYC/AML Compliance](#️-kycaml-compliance)
  - [📊 Ledger and Accounting](#-ledger-and-accounting)
  - [🌐 Developer Portal and API Gateway](#-developer-portal-and-api-gateway)
  - [🧠 AI-Enhanced Capabilities](#-ai-enhanced-capabilities)
  - [🔒 Security Infrastructure](#-security-infrastructure)
- [🏛️ Architecture Overview](#️-architecture-overview)
  - [System Components and Their Implementation](#system-components-and-their-implementation)
- [🧩 Component Breakdown: Detailed Codebase Analysis](#-component-breakdown-detailed-codebase-analysis)
  - [Backend (`backend/`)](#backend-backend)
  - [Unified Frontend (`unified-frontend/`)](#unified-frontend-unified-frontend)
  - [Documentation (`docs/`)](#documentation-docs)
  - [Scripts (`scripts/`)](#scripts-scripts)
  - [Tests (`tests/`)](#tests-tests)
  - [Infrastructure (`infrastructure/`)](#infrastructure)
  - [GitHub Actions Workflows (`.github/workflows/`)](#github-actions-workflows-githubworkflows)
- [🚀 Getting Started](#-getting-started)
- [🛣️ Strategic Roadmap](#️-strategic-roadmap)
  - [Q3 2025: Platform Hardening & Core Expansion](#q3-2025-platform-hardening--core-expansion)
  - [Q4 2025: Ecosystem Integration & Data Intelligence](#q4-2025-ecosystem-integration--data-intelligence)
  - [Q1 2026: Global Reach & Advanced Financial Products](#q1-2026-global-reach--advanced-financial-products)
  - [Q2 2026: Platform Extensibility & Developer Empowerment](#q2-2026-platform-extensibility--developer-empowerment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 📋 Executive Summary

Flowlet is a comprehensive cloud-agnostic embedded finance platform that enables businesses to seamlessly integrate financial services into their products. Built on a robust microservices architecture, Flowlet provides a complete suite of financial capabilities including digital wallets, payment processing, card issuance, KYC/AML compliance, and ledger management. The platform abstracts away the complexities of financial infrastructure, allowing businesses to focus on their core offerings while providing their customers with sophisticated financial services.

Designed with scalability, security, and compliance at its core, Flowlet connects to banking partners, payment processors, card networks, and regulatory services through a unified API layer. This architecture enables businesses from various sectors to embed financial services without the burden of building financial infrastructure from scratch or navigating the complex regulatory landscape alone.

Flowlet's developer-first approach includes comprehensive documentation, SDKs, and a robust developer portal that simplifies integration and accelerates time-to-market. The platform's modular design allows businesses to select only the components they need, creating a tailored embedded finance solution that grows with their requirements.

### Key Highlights:

-   **Complete Embedded Finance Stack**: Digital wallets, payment processing, card issuance, KYC/AML, and ledger management
-   **Cloud-Agnostic Microservices**: Kubernetes-based infrastructure designed for high availability and scalability
-   **Developer-Friendly Integration**: Comprehensive API gateway, SDKs, and developer portal
-   **Bank-Grade Security**: End-to-end encryption, tokenization, and comprehensive audit trails
-   **Regulatory Compliance**: Built-in workflows for GDPR, PSD2, FinCEN, and other regulatory frameworks
-   **AI-Enhanced Capabilities**: Fraud detection, support chatbots, and developer assistance
-   **Operational Excellence**: Robust DevOps automation, observability, and managed services

---

## 🌟 Key Features Implemented

Flowlet's core strength lies in its comprehensive suite of embedded finance capabilities, each meticulously implemented across its microservices architecture. Below, we detail the key features and their corresponding implementations within the codebase, demonstrating a robust and functional platform.

### 💰 Digital Wallet Management

Flowlet provides a sophisticated digital wallet system, forming the bedrock of its embedded finance offerings. This system allows businesses to offer secure, multi-currency financial accounts with real-time balance updates and advanced transaction management. The implementation of this feature is primarily found within the `backend` services and supported by the `unified-frontend` for user interaction.

-   **Backend Implementation**: The core logic for wallet creation, management, and transaction processing resides in `backend/src/routes/wallet.py` and `backend/src/routes/wallet_mvp.py`. These modules define the API endpoints and business logic for wallet operations. Data models for accounts and transactions, crucial for maintaining wallet integrity and history, are defined in `backend/src/models/account.py` and `backend/src/models/transaction.py`. The `backend/src/currency/multi_currency_system.py` further indicates robust support for multi-currency wallets, allowing for diverse financial operations and global reach. The `backend/src/utils/notifications.py` would likely be integrated here to provide real-time updates on wallet activities.
-   **Frontend Integration**: The user interface for interacting with digital wallets, including viewing balances, transaction history, and initiating transfers, is provided by `unified-frontend/src/components/wallet/Dashboard.tsx`. This component integrates seamlessly with the backend APIs, leveraging `unified-frontend/src/lib/walletService.ts` and `unified-frontend/src/store/walletSlice.ts` to display real-time wallet information and manage state efficiently.

### 💳 Payment Processing

Flowlet's payment processing capabilities enable businesses to handle a wide array of financial transactions across various channels and payment methods. This includes support for both inbound and outbound payments, abstracting the complexities of different payment processors and ensuring efficient, secure fund transfers.

-   **Backend Implementation**: The central modules for handling payment routing and processing are `backend/src/routes/payment.py` and `backend/src/routes/payment_mvp.py`. These files manage the flow of payment requests and responses, orchestrating the interaction with various payment rails. Integration with external payment gateways is concretely facilitated through `backend/src/integrations/payments/stripe_integration.py`, demonstrating a robust implementation for processing card payments via Stripe. The modular design in `backend/src/integrations/banking` (e.g., `plaid_integration.py`, `fdx_integration.py`, `open_banking_integration.py`) suggests readiness for bank transfers (ACH, SEPA, Wire) and other alternative payment methods, indicating a flexible and extensible payment ecosystem. Transaction validation and error handling are likely managed through `backend/src/utils/validators.py` and `backend/src/utils/error_handlers.py`.

### 💳 Card Issuance and Management

Flowlet empowers businesses to issue and manage both virtual and physical payment cards, supporting the entire card lifecycle from issuance to transaction processing and deactivation. This feature is critical for businesses looking to offer branded payment solutions and enhance customer engagement.

-   **Backend Implementation**: The logic for managing card issuance and lifecycle events is encapsulated in `backend/src/routes/card.py` and `backend/src/routes/enhanced_cards.py`. These modules handle requests related to card creation, activation, transaction authorization, and potentially advanced card controls (e.g., spending limits, merchant category restrictions). The fundamental data structure for cards is defined in `backend/src/models/card.py`, ensuring consistent data handling across the platform. Integration with external card issuing platforms (like Marqeta, as implied by the original README) would be managed within `backend/src/integrations/card_issuing` (if such a directory existed, otherwise within `integrations/banking` or a dedicated service).

### ⚖️ KYC/AML Compliance

Compliance with Know Your Customer (KYC) and Anti-Money Laundering (AML) regulations is a cornerstone of Flowlet's platform. It provides streamlined, risk-based workflows to balance stringent regulatory requirements with a smooth and efficient user experience.

-   **Backend Implementation**: The core compliance workflows are robustly implemented in `backend/src/routes/kyc_aml.py` and `backend/src/routes/enhanced_kyc.py`. These modules orchestrate the complex verification processes, including identity verification, sanctions screening, and adverse media checks. The overarching regulatory logic and adherence are managed by `backend/src/compliance/regulatory_compliance.py`, which likely integrates with external identity verification providers to perform checks such as document scanning, biometric verification, and database screening. The `backend/src/models/audit_log.py` plays a crucial role here, ensuring comprehensive audit trails for all compliance decisions and actions, vital for regulatory reporting.

### 📊 Ledger and Accounting

At the heart of Flowlet's financial infrastructure is a robust double-entry ledger system, ensuring immutable audit trails and data consistency for all financial events. This system supports real-time balance calculations and comprehensive financial reporting, providing a single source of truth for all financial data.

-   **Backend Implementation**: The primary responsibility for ledger operations lies with `backend/src/routes/ledger.py` and `backend/src/routes/enhanced_ledger.py`. These modules meticulously manage the recording of all financial transactions, ensuring that every debit has a corresponding credit. The integrity of audit trails and transaction histories is ensured through the data models defined in `backend/src/models/audit_log.py` and `backend/src/models/transaction.py`. These models are designed to support the double-entry accounting principles, providing a reliable source of truth for all financial data. The `backend/src/utils/audit.py` and `backend/src/security/audit_logger.py` further reinforce the auditability of all financial movements.

### 🌐 Developer Portal and API Gateway

Flowlet adopts a developer-first approach, providing extensive resources for seamless integration. The API Gateway serves as the unified entry point, simplifying interactions with the underlying microservices and offering a consistent, secure interface.

-   **Backend Implementation**: The `backend/src/gateway/optimized_gateway.py` serves as the central API Gateway. It is responsible for critical functions such as authentication (`backend/src/routes/auth.py`), rate limiting (`backend/src/security/rate_limiter.py`), request routing, and response caching, providing a consistent and secure interface to external integrators. The `backend/src/routes/api_gateway.py` further defines API endpoints related to gateway management and monitoring.
-   **Documentation and Resources**: The `docs/03_API_Reference` directory is dedicated to comprehensive API documentation, including `API_Documentation.md`, `Backend_API.md`, and `API_Gateway.md`. These resources, coupled with the `unified-frontend/src/lib/api.ts` for frontend API interactions, and the `backend/src/static/index.html` (potentially serving a basic developer portal landing page), embody the developer-friendly ecosystem. The `docs/06_Developer_Guides` further supports developers with integration guides and setup instructions.

### 🧠 AI-Enhanced Capabilities

Flowlet leverages artificial intelligence to augment various platform functionalities, from sophisticated fraud detection to intelligent developer support. These AI components are designed as independent, integrable services, enhancing the platform's intelligence and automation.

-   **Fraud Detection**: The `backend/src/ai` directory contains `enhanced_fraud_detection.py` and `risk_assessment.py`, which implement AI-driven fraud analysis. These modules likely employ advanced machine learning techniques to identify anomalous transaction patterns and assess risk scores. Further details on the machine learning models used for fraud detection are found in `backend/src/ml/fraud_detection`, including `anomaly_models.py` (for unsupervised detection of unusual behavior), `ensemble_model.py` (combining multiple models for higher accuracy), and `supervised_models.py` (trained on labeled fraud data), showcasing a multi-faceted and robust approach to identifying suspicious activities. The `backend/src/routes/fraud_detection.py` exposes these capabilities via API.
-   **Support Chatbot**: The `backend/src/ai/support_chatbot.py` indicates the implementation of an AI-powered chatbot designed to provide instant assistance to users and developers. This chatbot is likely trained on Flowlet's extensive documentation and knowledge base, providing accurate and relevant responses to common queries and troubleshooting steps.
-   **Transaction Intelligence**: `backend/src/ai/transaction_intelligence.py` suggests AI capabilities for analyzing and deriving deeper insights from transaction patterns, potentially for predictive analytics, customer segmentation, or personalized financial advice.

### 🔒 Security Infrastructure

Security is paramount in financial platforms, and Flowlet integrates multiple layers of protection to safeguard sensitive data and transactions. This includes robust encryption, tokenization, comprehensive access controls, and continuous monitoring.

-   **Backend Implementation**: The `backend/src/security` directory is a critical component, dedicated to security implementations. Key modules include `encryption.py` and `encryption_manager.py` for data encryption (at rest and in transit, using strong cryptographic algorithms), `password_security.py` for secure password hashing (e.g., bcrypt, scrypt) and management practices, and `rate_limiter.py` for API abuse prevention and DDoS mitigation. `audit.py` and `audit_logger.py` ensure comprehensive logging for security monitoring, incident response, and compliance. `input_validator.py` and `validation.py` are crucial for preventing common web vulnerabilities such as SQL injection and cross-site scripting by rigorously validating all incoming user input. `enhanced_security.py` suggests additional advanced security features. The `backend/src/config/security.py` centralizes security-related configurations, ensuring easy management and consistency. `token_manager.py` handles the secure generation, validation, and revocation of authentication tokens (e.g., JWTs), while `backend/src/routes/auth.py` manages user authentication and authorization flows.

---

## 🏛️ Architecture Overview

Flowlet is engineered on a cloud-agnostic microservices architecture, prioritizing scalability, resilience, and security. This design facilitates consistent deployment across diverse environments, from public clouds (AWS, GCP, Azure, as implied by Terraform modules) to on-premises infrastructure. The architecture adheres to a domain-driven design, organizing services around distinct business capabilities, allowing for independent evolution and targeted scaling without impacting the entire system.

At the infrastructure level, Flowlet leverages containerization (Docker) for packaging applications and orchestration (Kubernetes) for managing and scaling these containers across a cluster. Infrastructure-as-Code (Terraform) practices ensure reproducible deployments, version control for infrastructure, and simplified disaster recovery procedures. Communication between services is primarily event-driven via Apache Kafka, enhancing resilience and decoupling services, with REST APIs and gRPC for synchronous interactions through a unified API Gateway. A polyglot persistence strategy is employed, utilizing optimal database technologies for specific service requirements, ensuring performance and flexibility.

### System Components and Their Implementation:

1.  **API Layer**: The primary entry point for all external interactions, serving as the public face of Flowlet. This layer is concretely implemented by the API Gateway (`backend/src/gateway/optimized_gateway.py`), which acts as a traffic cop, handling authentication, rate limiting, and intelligent routing of requests to the appropriate microservices. It is extensively documented in the `docs/03_API_Reference` directory, which includes `API_Documentation.md` and `Backend_API.md`, providing comprehensive guides for developers.

2.  **Core Services Layer**: This layer encapsulates the fundamental financial services that form the backbone of Flowlet. These are implemented as distinct, independently deployable microservices within the `backend/src/routes` directory. Examples include Wallet Management (`wallet.py`, `enhanced_wallet.py`), Payment Processing (`payment.py`, `enhanced_payment.py`), Card Services (`card.py`, `enhanced_cards.py`), KYC/AML (`kyc_aml.py`, `enhanced_kyc.py`), and Ledger (`ledger.py`, `enhanced_ledger.py`). Each service is designed to operate autonomously, ensuring modularity, fault isolation, and independent scalability.

3.  **Integration Layer**: Responsible for securely connecting Flowlet with external financial systems and third-party providers. Implementations for banking partners (e.g., Plaid, FDX, Open Banking) are found in `backend/src/integrations/banking` (`plaid_integration.py`, `fdx_integration.py`, `open_banking_integration.py`), demonstrating a broad connectivity. Currency exchange rate management is handled by `backend/src/integrations/currency/exchange_rates.py`, ensuring accurate multi-currency operations. Payment processor integrations (e.g., Stripe) are in `backend/src/integrations/payments/stripe_integration.py`, facilitating diverse payment options.

4.  **Data Layer**: This layer manages the system's state and enables analytics through specialized databases, adhering to a polyglot persistence model. Kubernetes configurations for various databases are located in `infrastructure/kubernetes/databases`, including `postgresql.yaml` (for ACID-compliant transactional data), `mongodb.yaml` (for flexible document storage, often used for analytics or unstructured data), `influxdb.yaml` (for high-volume time-series data, ideal for monitoring and metrics), and `redis.yaml` (for high-performance caching, session management, and as a message broker or queue). The SQLAlchemy ORM models defining these data structures are found in `backend/src/models`.

5.  **Support Services Layer**: Provides cross-cutting functionalities utilized by multiple core services, ensuring platform-wide consistency and efficiency. Authentication services are robustly implemented in `backend/src/routes/auth.py` and `backend/src/security/token_manager.py`. Notification capabilities (e.g., email, SMS, push notifications) are handled by `backend/src/utils/notifications.py`. Reporting and analytics functionalities are implied by `backend/src/routes/analytics.py`, enabling business intelligence. AI services are comprehensively implemented in `backend/src/ai` and `backend/src/ml` directories, providing intelligent automation and insights.

6.  **Infrastructure Layer**: The foundational layer encompassing deployment, monitoring, and security. Kubernetes orchestration is managed via configurations in `infrastructure/kubernetes` and Helm charts in `infrastructure/helm`, enabling declarative and automated deployments. Monitoring systems (Prometheus for metrics collection, Grafana for visualization) are configured in `infrastructure/kubernetes/monitoring`. CI/CD pipelines are defined in `.github/workflows`, automating the software delivery lifecycle. Core security components are found in `backend/src/security`, ensuring a secure operating environment.

---

## 🧩 Component Breakdown: Detailed Codebase Analysis

This section provides an exceptionally comprehensive, file-by-file and directory-by-directory analysis of the Flowlet codebase. It highlights the purpose, implementation details, and interdependencies of each significant component, offering a granular view that demonstrates the depth and breadth of the platform's development and its readiness for investor scrutiny.

### Backend (`backend/`)

The `backend` directory serves as the central hub for Flowlet's server-side logic, implemented primarily using the Flask framework. It's meticulously structured to support a microservices paradigm, ensuring modularity, scalability, and maintainability—qualities that are paramount for a robust financial application.

-   **`backend/src/`**: This is the main source directory for the backend application, containing the core business logic, API implementations, and foundational services.
    -   **`ai/`**: This sub-directory houses modules related to Artificial Intelligence capabilities, showcasing Flowlet's commitment to intelligent automation and enhanced decision-making in financial operations.
        -   `enhanced_fraud_detection.py`: This file likely contains sophisticated machine learning models and algorithms for real-time fraud detection. It would implement techniques such as anomaly detection, supervised learning (e.g., classification models like Random Forest, Gradient Boosting), and potentially deep learning to identify and flag suspicious transactions with high accuracy. Its integration with `backend/src/ml/fraud_detection` suggests a pipeline for model training, evaluation, and deployment.
        -   `risk_assessment.py`: Focuses on assessing the risk profile of users, transactions, or other financial activities. This module might use predictive analytics and statistical models to assign risk scores, which can then inform compliance decisions (KYC/AML) or transaction approvals. It likely integrates with `backend/src/models/user.py` and `backend/src/models/transaction.py` to gather necessary data.
        -   `support_chatbot.py`: Implements the conversational AI for the support chatbot. This could involve natural language processing (NLP) models for understanding user queries and generating relevant responses, drawing information from the `docs/` directory and internal knowledge bases. It aims to automate customer and developer support, reducing operational overhead.
        -   `transaction_intelligence.py`: This module is dedicated to deriving deeper insights and patterns from the vast amount of transaction data. It might employ data mining techniques, clustering algorithms, or time-series analysis to identify trends, predict future financial behavior, or provide personalized financial advice. This intelligence can feed into analytics dashboards or other AI services.
    -   **`compliance/`**: Dedicated to ensuring strict adherence to financial regulations and legal frameworks.
        -   `regulatory_compliance.py`: This central module encapsulates the logic for complying with various financial regulations such as GDPR, PSD2, FinCEN, and local financial laws. It would define workflows for data privacy, consent management, transaction monitoring for suspicious activities, and automated reporting to regulatory bodies. It likely interacts with `backend/src/routes/kyc_aml.py` and `backend/src/models/audit_log.py` to ensure all compliance-related actions are recorded and auditable.
    -   **`config/`**: Manages application-wide configurations and settings, ensuring flexibility and environment-specific deployments.
        -   `security.py`: Defines critical security-related settings, including JWT secrets, API keys, encryption algorithms, and other sensitive parameters. It's crucial for maintaining the security posture of the application and should be managed with environment variables or secure secrets management systems (like Kubernetes Secrets).
        -   `settings.py`: Contains general application settings such as database connection strings, logging configurations, external service endpoints, and other environment-specific parameters. This separation allows for easy configuration changes without modifying core code.
    -   **`currency/`**: Manages multi-currency operations, a vital feature for a global embedded finance platform.
        -   `multi_currency_system.py`: Implements the core logic for handling multiple currencies, including currency conversion, exchange rate application, and ensuring accurate balance representation across different denominations. It would interact with `backend/src/integrations/currency/exchange_rates.py` for real-time rate data.
    -   **`database/`**: Handles database interactions, schema management, and connection pooling.
        -   `app.db`, `flowlet.db`: These files suggest the use of SQLite databases, primarily for local development, testing, or as a lightweight option for specific non-production environments. In a production Kubernetes environment, PostgreSQL (`infrastructure/kubernetes/databases/postgresql.yaml`) is the primary relational database.
    -   **`gateway/`**: Implements the API Gateway functionality, acting as the single entry point for all external API requests.
        -   `optimized_gateway.py`: This module serves as the intelligent routing layer for microservices. It handles request authentication (integrating with `backend/src/security/token_manager.py`), rate limiting (`backend/src/security/rate_limiter.py`), request validation, and intelligent routing to the appropriate backend microservice. It might also perform response caching and transformation, significantly improving performance and simplifying client-side interactions.
    -   **`integrations/`**: Manages connections and interactions with external financial services and third-party APIs, abstracting away their complexities.
        -   **`banking/`**: Contains modules for integrating with various banking partners, enabling bank account linking, balance checks, and fund transfers.
            -   `fdx_integration.py`: Implements integration with the Financial Data Exchange (FDX) standard, a secure and convenient way to access financial data from participating institutions.
            -   `manager.py`: A central manager module to orchestrate and abstract different banking integrations, providing a unified interface to the core services.
            -   `open_banking_integration.py`: Provides connectivity to Open Banking APIs, enabling secure data sharing and payment initiation services as mandated by regulations like PSD2.
            -   `plaid_integration.py`: Integrates with Plaid, a popular financial data aggregation platform, for linking bank accounts, verifying balances, and accessing transaction data for various financial institutions.
        -   **`currency/`**: Specific integrations for currency-related services.
            -   `exchange_rates.py`: Handles fetching, caching, and providing real-time currency exchange rates from external sources (e.g., third-party APIs). This is crucial for multi-currency wallet operations and international payments.
        -   **`payments/`**: Integrations with external payment processors.
            -   `stripe_integration.py`: Implements the necessary logic to process payments through the Stripe API, including charges, refunds, subscription management, and webhook handling. This demonstrates a concrete, production-ready payment gateway integration.
    -   **`ml/`**: Machine Learning specific components, primarily supporting the AI-enhanced capabilities.
        -   **`fraud_detection/`**: Dedicated to the machine learning models and services for real-time fraud detection.
            -   `anomaly_models.py`: Contains implementations of unsupervised learning algorithms (e.g., Isolation Forest, One-Class SVM) to identify unusual transaction patterns that deviate significantly from normal behavior, without requiring labeled fraud data.
            -   `ensemble_model.py`: Likely combines outputs from multiple fraud detection models (e.g., anomaly, supervised) to improve overall accuracy, reduce false positives, and enhance robustness against evolving fraud techniques.
            -   `service.py`: Provides an API or service interface for the fraud detection models, allowing other backend services (e.g., payment processing, wallet management) to query for fraud scores or risk assessments in real-time.
            -   `supervised_models.py`: Implements supervised learning models (e.g., Logistic Regression, Support Vector Machines, Neural Networks) trained on labeled datasets of known fraudulent and legitimate transactions to classify new transactions.
    -   **`models/`**: Defines the SQLAlchemy ORM (Object-Relational Mapping) models, mapping Python objects to database tables. These models enforce data integrity, define relationships, and provide an abstraction layer over raw SQL queries.
        -   `account.py`: Defines the data model for user accounts and digital wallets, including attributes like balance, currency, status, and relationships to users and transactions.
        -   `audit_log.py`: Models for logging all significant events and changes within the system for auditing, compliance, and security monitoring purposes. This ensures an immutable record of all actions.
        -   `card.py`: Defines the data model for payment cards (virtual and physical), including card numbers (tokenized), expiration dates, CVVs, and their relationship to user accounts.
        -   `database.py`, `enhanced_database.py`: Core database configuration, session management, and potentially enhanced database functionalities like connection pooling, retry mechanisms, or multi-tenancy support.
        -   `transaction.py`: Defines the comprehensive data model for all financial transactions, including type, amount, currency, status, timestamps, and references to source/destination accounts.
        -   `user.py`: Defines the data model for user profiles, including authentication details, personal information, and relationships to accounts and other entities.
    -   **`routes/`**: Contains the Flask blueprints and route definitions for the various API endpoints, organizing the API surface by domain.
        -   `ai_service.py`: API endpoints for interacting with AI capabilities, such as submitting data for fraud analysis or querying the chatbot.
        -   `analytics.py`: Routes for retrieving and processing analytical data, potentially for business intelligence dashboards or reporting tools.
        -   `api_gateway.py`: API endpoints specifically for managing or interacting with the API Gateway itself, such as health checks or configuration updates.
        -   `auth.py`: Handles all aspects of user authentication (login, registration, password reset, token refresh) and authorization, integrating with `backend/src/security/token_manager.py`.
        -   `banking_integrations.py`: API endpoints for managing and interacting with banking integrations, such as linking new bank accounts or initiating bank transfers.
        -   `card.py`, `enhanced_cards.py`: API endpoints for card issuance, management (e.g., activation, deactivation, setting limits), and processing card transactions.
        -   `compliance.py`: Routes related to compliance workflows, such as submitting KYC documents or querying AML status.
        -   `fraud_detection.py`: API endpoints for triggering or querying fraud detection services, allowing other services to integrate real-time fraud checks.
        -   `kyc_aml.py`, `enhanced_kyc.py`: API endpoints for initiating and managing KYC/AML verification processes, including document uploads and status checks.
        -   `ledger.py`, `enhanced_ledger.py`: API endpoints for interacting with the double-entry ledger system, allowing for manual adjustments (with proper authorization) or querying ledger entries.
        -   `monitoring.py`: Routes for exposing application metrics and health checks, crucial for integration with external monitoring systems like Prometheus.
        -   `multicurrency.py`: API endpoints specifically for multi-currency operations, such as currency conversion or managing multi-currency balances.
        -   `payment.py`, `enhanced_payment.py`, `payment_mvp.py`: API endpoints for initiating, processing, and querying various types of payments (e.g., P2P, B2B, bill payments).
        -   `security.py`: Routes for security-related actions, such as password changes, multi-factor authentication (MFA) setup, or security settings management.
        - `user.py`: API endpoints for user profile management, including updating personal information and preferences.
        - `wallet.py`, `enhanced_wallet.py`, `wallet_mvp.py`: API endpoints for digital wallet creation, funding, withdrawals, and internal transfers.
    -   **`security/`**: Implements various security measures at the application level, ensuring data protection and system integrity.
        -   `audit.py`, `audit_logger.py`: Modules for comprehensive logging and auditing of all security-sensitive events, including access attempts, data modifications, and system configurations. This provides an immutable record of all actions.
        -   `encryption.py`, `encryption_manager.py`: Handles data encryption and decryption, ensuring data confidentiality both at rest (e.g., database fields) and in transit (e.g., API communication). It would utilize strong cryptographic algorithms and key management practices.
        -   `enhanced_security.py`: Potentially contains advanced security features or configurations, such as hardware security module (HSM) integration, secure enclaves, or advanced threat intelligence feeds.
        -   `input_validator.py`, `validation.py`: Crucial modules for rigorously validating and sanitizing all incoming user input to prevent common web vulnerabilities like SQL injection, cross-site scripting (XSS), and command injection. This is a first line of defense against malicious inputs.
        -   `monitoring.py`: Security-specific monitoring components, possibly for detecting suspicious access patterns, brute-force attacks, or unauthorized data access attempts. It would integrate with the broader monitoring infrastructure.
        -   `password_security.py`: Implements secure password hashing (e.g., using Argon2, bcrypt, or scrypt) and management practices, including password complexity rules, salting, and secure storage.
        -   `rate_limiter.py`: Controls the rate of requests from individual clients or IP addresses to protect against abuse, brute-force attacks, and denial-of-service (DoS) attacks.
        -   `token_manager.py`: Manages the secure creation, validation, and revocation of authentication tokens (e.g., JSON Web Tokens - JWTs), ensuring that only authorized users can access protected resources.
    -   **`static/`**: Contains static files served directly by the backend web server.
        -   `index.html`: A basic HTML file, possibly serving as a default landing page, a simple API documentation interface, or a placeholder for the frontend application.
    -   **`utils/`**: General utility functions and helper modules used across the backend services.
        -   `audit.py`: General auditing utilities, distinct from security auditing, perhaps for tracking business-level events.
        -   `error_handlers.py`: Centralized error handling mechanisms for consistent API responses, converting exceptions into standardized error formats (e.g., JSON with error codes and messages).
        -   `notifications.py`: Handles sending various types of notifications (e.g., email, SMS, push notifications) to users or internal systems based on events.
        -   `validators.py`: General-purpose data validation utilities, used to ensure data integrity and correctness before processing.
-   **`production_app.py`**: The main entry point for the production Flask application. This file would contain the application factory, database initialization, and configuration loading optimized for a production environment, emphasizing performance, logging, and error handling.
-   **`simple_mvp_app.py`**: A simplified version of the application, likely designed for quick demonstrations, proof-of-concept deployments, or minimal viable product (MVP) releases. It would contain a subset of features and potentially use simpler configurations.
-   **`test_mvp.py`**, **`test_production.py`**: Integration or system tests specifically tailored for the MVP and production application configurations, ensuring that these specific deployments function as expected.
-   **`requirements.txt`**, `requirements_enhanced.txt`, `requirements_simplified.txt`, `requirements_updated.txt`: These files list Python dependencies required for the project. The multiple `requirements_*.txt` files suggest different dependency sets for various environments (e.g., development, production, testing) or feature configurations (e.g., with or without enhanced AI features), allowing for lean and optimized deployments.
-   **`run_tests.sh`**: A shell script to conveniently execute the backend test suites (unit, integration, performance, security tests), streamlining the testing process for developers and CI/CD pipelines.
-   **`wsgi.py`**: A WSGI (Web Server Gateway Interface) entry point for deploying the Flask application with production-grade web servers like Gunicorn or uWSGI. This file allows the web server to communicate with the Flask application.

### Unified Frontend (`unified-frontend/`)

This directory contains the React-based single-page application (SPA) that serves as the user interface for Flowlet. It's built with modern frontend development practices, leveraging Vite for fast development and a component-based architecture for reusability, maintainability, and a rich user experience.

-   **`unified-frontend/src/`**: The primary source directory for the React application, containing all the UI components, logic, and assets.
    -   `App.css`, `index.css`: Global CSS files for styling the application, defining overall themes, typography, and layout. They ensure a consistent visual identity across the platform.
    -   `App.tsx`: The root component of the React application. It defines the main application layout, handles routing (e.g., using React Router), and orchestrates the rendering of different pages and features.
    -   `main.tsx`: The entry point for the React application. It's responsible for rendering the `App` component into the DOM, setting up global contexts (e.g., Redux store, authentication context), and initializing the application.
    -   **`assets/`**: Contains static assets used by the frontend, such as images, icons, and fonts.
        -   `react.svg`: A React logo, typically used as a placeholder, branding element, or part of the development setup.
    -   **`components/`**: A well-organized collection of reusable UI components, promoting modularity and efficient development. Components are grouped by feature or type.
        -   **`auth/`**: Components specifically designed for user authentication and authorization flows, ensuring a secure and intuitive user onboarding and login experience.
            -   `LoginScreen.tsx`: The user interface for logging into the platform, including input fields for credentials and submission logic. It integrates with `useAuth.ts` and `authService.ts`.
            -   `OnboardingFlow.tsx`: Manages the multi-step user onboarding process, which might include registration, profile setup, KYC document uploads, and initial preferences. It orchestrates various sub-components.
            -   `ProtectedRoute.tsx`: A higher-order component or route wrapper that restricts access to authenticated users. If a user is not logged in, it redirects them to the login page, ensuring secure access to sensitive parts of the application.
            -   `PublicRoute.tsx`: A component or route wrapper that allows access only to unauthenticated users (e.g., login, registration, password reset pages). It redirects authenticated users away from these pages.
            -   `RegisterScreen.tsx`: The user interface for new user registration, collecting necessary information and handling account creation requests.
            -   `__tests__/` (e.g., `LoginScreen.test.tsx`, `RegisterScreen.test.tsx`): Unit tests for authentication components, ensuring their functionality and robustness.
        -   **`ui/`**: A comprehensive set of generic, reusable UI components, forming a design system for the application. The `.jsx` extensions and common component names strongly suggest the use of a component library like Shadcn UI, which provides accessible and customizable UI primitives.
            -   Includes components like `accordion.jsx`, `alert-dialog.jsx`, `avatar.jsx`, `button.jsx`, `card.jsx`, `checkbox.jsx`, `dialog.jsx`, `dropdown-menu.jsx`, `form.jsx`, `input.jsx`, `table.jsx`, `tabs.jsx`, `tooltip.jsx`, etc. This extensive collection indicates a rich and consistent user interface, accelerating development and ensuring a polished look and feel.
        -   **`wallet/`**: Components specific to the digital wallet functionality, providing a user-friendly interface for managing financial assets.
            -   `Dashboard.tsx`: The main dashboard component for displaying wallet balances, transaction history, recent activities, and quick actions related to wallet management. It serves as the central hub for user financial overview.
            -   `__tests__/` (e.g., `Dashboard.test.tsx`): Unit tests for wallet components, ensuring accurate display and interaction with financial data.
        -   `ErrorBoundary.tsx`: A React Error Boundary component for gracefully handling and displaying errors that occur within its child component tree, preventing the entire application from crashing and providing a better user experience.
        -   `Header.tsx`: The application's header component, typically containing navigation links, user profile information, notifications, and branding elements.
        -   `Layout.tsx`: Defines the overall layout structure of the application, including sidebars, headers, and content areas, ensuring a consistent visual framework.
        -   `LoadingScreen.tsx`: A component to display while data is being fetched or processes are running, providing visual feedback to the user.
        -   `OfflineIndicator.tsx`: Provides visual feedback to the user when the application detects a loss of internet connectivity, enhancing user awareness and experience.
        -   `PlaceholderComponents.tsx`: Components used as temporary visual elements during development or for displaying skeleton loaders while content is being fetched, improving perceived performance.
        -   `Sidebar.tsx`: The application's sidebar navigation component, providing access to different sections and features of the platform.
        -   `__tests__/` (e.g., `Header.test.tsx`, `Sidebar.test.tsx`): Unit tests for general UI components, ensuring their correct rendering and behavior.
    -   **`hooks/`**: Custom React hooks for encapsulating and reusing stateful logic and side effects across different components, promoting code reusability and cleaner component logic.
        -   `index.ts`, `redux.ts`: Entry points for custom hooks and Redux-related hooks, respectively.
        -   `use-mobile.js`: A custom hook to detect and respond to mobile device characteristics (e.g., screen size, touch capabilities), enabling responsive design and mobile-specific interactions.
        -   `useAuth.ts`: A custom hook for managing authentication state and actions (e.g., login, logout, checking authentication status), abstracting authentication logic from components.
        -   `__tests__/` (e.g., `index.test.tsx`, `useAuth.test.tsx`): Unit tests for custom hooks, ensuring their reliability and correct behavior.
    -   **`lib/`**: Utility functions and service integrations, providing common functionalities and abstracting API calls.
        -   `api.ts`: A centralized module for making API calls to the backend services, handling request configuration, error handling, and potentially token management.
        -   `authService.ts`: Contains client-side authentication logic, interacting with the backend authentication APIs for user login, registration, and token management.
        -   `utils.js`: A collection of general utility functions (e.g., date formatting, string manipulation, data transformations) used across the frontend.
        -   `walletService.ts`: Client-side logic for interacting with wallet-related backend services, abstracting the API calls specific to wallet operations.
    -   **`store/`**: Implements client-side state management, likely using Redux Toolkit, which simplifies Redux development with opinionated best practices.
        -   `api.ts`: Defines API services for Redux Toolkit Query, a powerful data fetching and caching solution that integrates seamlessly with Redux, simplifying data management.
        -   `authSlice.ts`: A Redux slice for managing authentication state (e.g., user token, login status, user profile information). It defines reducers and actions related to authentication.
        -   `index.ts`: The main Redux store configuration file, combining all Redux slices and setting up middleware (e.g., Redux Thunk, Redux Saga, or RTK Query middleware).
        -   `transactionSlice.ts`: A Redux slice for managing transaction-related state (e.g., list of transactions, transaction details, filtering options).
        -   `uiSlice.ts`: A Redux slice for managing UI-related state (e.g., loading indicators, notification messages, modal visibility).
        -   `walletSlice.ts`: A Redux slice for managing wallet-specific state (e.g., balances, selected wallet, wallet history).
        -   `__tests__/` (e.g., `authSlice.test.ts`, `uiSlice.test.ts`): Unit tests for Redux slices, ensuring that state updates and reducers function correctly.
    -   **`test/`**: Additional testing utilities and setup for the frontend.
        -   `setup.ts`: Test setup file (e.g., for Jest or Vitest), configuring the testing environment before tests run.
        -   `utils.tsx`: Testing utility functions for rendering React components in a test environment and interacting with them.
    -   **`types/`**: TypeScript type definitions for the frontend application, ensuring type safety and improving code maintainability and readability.
        -   `index.ts`: Centralizes custom type definitions for data structures, API responses, and component props, providing a single source of truth for types.
    -   **`__tests__/`**: General frontend tests, covering broader application functionality.
        -   `App.test.tsx`, `basic.test.ts`, `integration.test.tsx`: Various levels of tests for the main application and integrations, ensuring the overall stability and correctness of the frontend.
-   **`public/`**: Contains static assets that are served directly by the web server without being processed by the build pipeline.
    -   `vite.svg`: A Vite logo, indicating the use of Vite as the build tool for the frontend.
-   **`components.json`**: Configuration file, possibly for a UI component library or design system (e.g., Shadcn UI configuration), defining component paths and styles.
-   **`eslint.config.js`**: ESLint configuration for code linting and style enforcement, ensuring code quality and consistency across the frontend codebase.
-   **`index.html`**: The main HTML file that serves as the entry point for the single-page application. It's where the React application is mounted.
-   **`jsconfig.json`**: JavaScript configuration file, typically used in VS Code for IntelliSense and path aliases in JavaScript projects.
-   **`package.json`**: Defines project metadata, scripts (e.g., `start`, `build`, `test`), and dependencies for Node.js, managing all frontend libraries and tools.
-   **`pnpm-lock.yaml`**: Lock file for the pnpm package manager, ensuring reproducible builds by locking down exact dependency versions.
-   **`tsconfig.json`**, `tsconfig.node.json`: TypeScript configuration files for the project and Node.js environment respectively, defining compiler options and file inclusions.
-   **`vite.config.ts`**: Vite build tool configuration file, defining how the frontend project is built, served, and optimized.
-   **`vitest.config.ts`**: Vitest testing framework configuration file, used for running fast unit and integration tests for the frontend.

### Documentation (`docs/`)

This directory is a comprehensive repository of documentation for the entire Flowlet platform, meticulously organized into logical sections to cater to different audiences, from business stakeholders and product managers to developers and operations teams. The presence of such detailed documentation underscores Flowlet's commitment to transparency, ease of integration, and operational excellence.

-   **`01_Introduction/`**: Provides a high-level overview of the Flowlet platform, its vision, mission, and the problems it solves in the embedded finance space. It serves as the starting point for anyone new to the project.
-   **`02_Architecture/`**: Delves into the architectural design principles and patterns of Flowlet, explaining the microservices approach, cloud-agnostic design, and key architectural decisions. It would include diagrams and explanations of how different components interact.
-   **`03_API_Reference/`**: Contains detailed and up-to-date documentation for all exposed APIs, crucial for developers integrating with Flowlet.
    -   `API_Documentation.md`, `Backend_API.md`, `API_Gateway.md`, `Flowlet_MVP_API_Documentation.md`: These files provide exhaustive specifications for various API endpoints, including request/response formats, authentication requirements, error codes, and practical usage examples. They are likely generated from code (e.g., OpenAPI/Swagger) or meticulously hand-crafted to ensure accuracy and completeness.
-   **`04_Compliance_and_Regulatory/`**: Focuses on the legal, regulatory, and ethical aspects of the platform, demonstrating Flowlet's commitment to operating within established financial frameworks.
    -   `Compliance_Overview.md`, `KYC_AML.md`: These documents detail Flowlet's approach to regulatory compliance, including Know Your Customer (KYC) and Anti-Money Laundering (AML) processes, data privacy (e.g., GDPR, CCPA), consumer protection, and other relevant financial regulations. They would outline the workflows, data requirements, and audit mechanisms in place.
-   **`05_Core_Financial_Services/`**: Provides in-depth documentation on each of Flowlet's core financial services, explaining their functionality, business logic, and integration points.
    -   `Banking_Integrations.md`, `Card_Services.md`, `Ledger.md`, `Payment_Processing.md`, `Wallet_and_Payment_System.md`: These documents detail the functionality, integration points, operational aspects, and use cases for each core service. They might include flowcharts, sequence diagrams, and examples of how businesses can leverage these services.
-   **`06_Developer_Guides/`**: Practical, hands-on guides for developers working with Flowlet, covering everything from environment setup to advanced development topics.
    -   `Application_Testing_Guide.md`, `Authentication.md`, `Frontend_Development.md`, `Frontend_Usage.md`, `Infrastructure_Testing_Guide.md`, `Scripting_Guide.md`, `Setup_Guide.md`: These comprehensive guides cover topics such as setting up development environments, implementing authentication, frontend and infrastructure development best practices, testing methodologies (unit, integration, E2E), and how to use various utility scripts.
-   **`07_Security/`**: Details the robust security measures implemented across the platform, emphasizing data protection, access control, and threat mitigation.
    -   `Security_Overview.md`: Provides a comprehensive overview of Flowlet's security architecture, including data encryption practices (at rest and in transit), access control mechanisms (RBAC, MFA), vulnerability management, incident response procedures, and adherence to security standards.
-   **`08_Infrastructure/`**: Documentation related to the underlying infrastructure, crucial for DevOps and operations teams.
    -   `Infrastructure_Guide.md`, `Kubernetes_Configuration.md`: Guides on deploying, managing, scaling, and troubleshooting Flowlet's infrastructure, particularly focusing on Kubernetes deployments, cloud provider specifics, and infrastructure-as-code practices.
-   **`09_Analytics_and_AI/`**: Explains Flowlet's AI and analytics capabilities, including how data is collected, processed, and used to provide insights and intelligent features.
    -   `AI_Service.md`, `Analytics.md`: Document the AI models, their applications (e.g., fraud detection, chatbot), the types of analytics available (e.g., transactional, behavioral), and how businesses can leverage these insights.
-   **`10_SDK/`**: Information about the Software Development Kits (SDKs) provided by Flowlet, facilitating easier integration for various programming languages.
-   **`11_User_Management/`**: Documentation on managing users within the Flowlet ecosystem, including user roles, permissions, and lifecycle management.
-   **`assets/images/`**: Contains images, diagrams, and screenshots used throughout the documentation to visually explain concepts and illustrate features.
    -   `dashboard.bmp`: An image of the Flowlet dashboard, providing a visual representation of the user interface and key functionalities.

### Scripts (`scripts/`)

This directory contains a versatile collection of shell scripts designed to automate various development, deployment, and operational tasks. These scripts are essential for streamlining workflows, ensuring consistency, and reducing manual errors across the project lifecycle.

-   **`backup/`**: Scripts specifically for data backup operations, crucial for disaster recovery and data integrity.
    -   `backup.sh`: A shell script likely used for performing automated backups of databases (e.g., PostgreSQL, MongoDB) and critical application data. It might include logic for compression, encryption, and offsite storage.
-   **`deployment/`**: Scripts related to application deployment, automating the process of pushing code to various environments.
    -   `deploy.sh`: A comprehensive shell script that automates the deployment process of the Flowlet application to target environments (e.g., development, staging, production). It would orchestrate steps like building Docker images, updating Kubernetes manifests or Helm charts, and applying changes to the cluster.
-   **`monitoring/`**: Scripts for setting up and managing monitoring solutions, vital for observing system health and performance.
    -   `monitor.sh`: A script for running ad-hoc monitoring checks, collecting metrics, or interacting with monitoring agents. It could be used for quick health checks or data collection.
    -   `setup-monitoring.sh`: Automates the setup and configuration of monitoring tools and agents (e.g., Prometheus exporters, Grafana dashboards, logging agents) within the deployment environment.
-   **`setup/`**: Scripts for environment setup, simplifying the onboarding process for new developers or setting up new environments.
    -   `setup-dev.sh`: Automates the setup of a local development environment for Flowlet, including installing dependencies, configuring databases, and starting local services. This ensures a consistent developer experience.
    -   `setup_k8s_prereqs.sh`: Installs and configures necessary prerequisites for Kubernetes deployments on a host machine, such as `kubectl`, `minikube` (for local dev), or cloud provider CLIs.

### Tests (`tests/`)

This top-level `tests` directory houses a comprehensive suite of tests, reflecting a strong commitment to quality assurance and ensuring the reliability, performance, and security of the Flowlet platform. Each subdirectory focuses on a specific testing methodology, contributing to a robust testing strategy.

-   **`e2e/`**: End-to-End (E2E) tests, which simulate real user scenarios to validate the entire system flow from the user interface down to the backend services and database.
    -   `test_user_flow.py`: A Python script (likely using a framework like Playwright or Selenium) for end-to-end testing of critical user journeys through the application, such as user registration, login, wallet funding, payment initiation, and transaction history viewing. This ensures that all integrated components work seamlessly together from a user's perspective.
-   **`integration/`**: Integration tests, focusing on the interaction and data flow between different modules, services, or external systems.
    -   `test_api_gateway_communication.py`: Tests the communication between client applications and the API Gateway, and verifies the gateway's intelligent routing to various backend microservices. This ensures the API layer functions correctly.
    -   `test_card_transaction_flow.py`: Validates the complete flow of card transactions, from the point of sale (simulated) through the card service, payment processing, and ledger updates, ensuring data consistency and correctness.
    -   `test_onboarding_flow.py`: Tests the integration of various components involved in the user onboarding process, including user registration, email verification, and KYC/AML checks, ensuring a smooth and compliant onboarding experience.
    -   `test_payment_flow.py`: Verifies the end-to-end payment processing flow, including interactions with payment gateways (e.g., Stripe), wallet services, and ledger updates, ensuring accurate and timely fund transfers.
-   **`performance/`**: Performance and load testing scripts, crucial for assessing the system's scalability and responsiveness under stress.
    -   `locustfile.py`: A Locust script for defining user behavior and simulating high loads (e.g., thousands of concurrent users) to assess the system's performance, scalability, and stability under stress. It measures response times, throughput, and error rates.
-   **`unit/`**: Unit tests, focusing on individual components or functions in isolation to ensure their correctness and adherence to specifications.
    -   `test_api_gateway.py`: Unit tests for the API Gateway's internal logic, such as routing rules, authentication checks, and rate limiting algorithms.
    -   `test_card_service.py`: Unit tests for the card management service's core functions, like card generation, activation, and deactivation logic.
    -   `test_fraud_detection.py`: Unit tests for the fraud detection modules, verifying the accuracy and performance of individual models and algorithms.
    -   `test_kyc_aml.py`: Unit tests for the KYC/AML compliance logic, ensuring that verification rules and data processing are correct.
    -   `test_ledger.py`: Unit tests for the double-entry ledger system, verifying the correctness of balance calculations and transaction postings.
    -   `test_payment_processor.py`: Unit tests for the payment processing logic, ensuring correct handling of different payment methods and transaction states.
    -   `test_wallet.py`: Unit tests for the digital wallet management service, verifying wallet creation, balance updates, and internal transfer logic.
-   `README.md`: Provides an overview of the testing strategy, instructions on how to run the various test suites, and guidelines for writing new tests.

### Infrastructure (`infrastructure/`)

This directory is central to Flowlet's cloud-agnostic and scalable deployment strategy, containing all Infrastructure as Code (IaC) definitions and related scripts. It enables reproducible, automated provisioning, and management of the underlying infrastructure across various cloud providers or on-premises environments.

-   **`DEPLOYMENT.md`**: Provides detailed instructions and considerations for deploying the Flowlet platform to different environments. It would cover prerequisites, deployment steps, and post-deployment verification.
-   **`docker/`**: Contains Docker-related files for containerizing Flowlet's services, ensuring consistent environments from development to production.
    -   `Dockerfile.backend`, `Dockerfile.frontend`: Dockerfiles for building the backend (Flask) and frontend (React) application images, defining their dependencies, build steps, and entry points.
    -   `Dockerfile.ai-fraud-detection`, `Dockerfile.api-gateway`, `Dockerfile.wallet-service`: Specific Dockerfiles for individual microservices, indicating fine-grained containerization for independent deployment and scaling of each service.
    -   `docker-compose.yml`: A Docker Compose file for orchestrating multi-container Docker applications, typically used for local development and testing environments. It defines how services interact and their dependencies.
    -   `nginx.conf`, `nginx-lb.conf`: Nginx configuration files, likely used for reverse proxying, load balancing, and serving static content for the frontend. `nginx-lb.conf` specifically suggests load balancing configurations.
    -   `README_.md`, `README.md`: Documentation specific to the Docker setup, providing instructions on building images and running containers.
-   **`helm/`**: Contains Helm charts for deploying Flowlet on Kubernetes, providing a package manager for Kubernetes applications.
    -   `flowlet/`: The main Helm chart directory for Flowlet, encapsulating all Kubernetes resources required for the application.
        -   `Chart.yaml`: Defines the Helm chart's metadata, including name, version, and description.
        -   `values.yaml`: Provides default configuration values for the Helm chart, which can be easily overridden during deployment to customize installations for different environments.
        -   `templates/`: Contains Kubernetes manifest templates (`.yaml` files) that Helm renders into actual Kubernetes resources. These templates use Go templating language to allow for dynamic values.
            -   `_helpers.tpl`: A template file containing reusable Helm template snippets and functions, promoting DRY (Don't Repeat Yourself) principles.
            -   `backend-deployment.yaml`, `frontend-deployment.yaml`: Kubernetes Deployment definitions for the backend and frontend applications, specifying container images, resource limits, and replica counts.
            -   `backend-hpa.yaml`: Horizontal Pod Autoscaler (HPA) definition for the backend, enabling automatic scaling of backend pods based on CPU utilization or other custom metrics, ensuring high availability and performance under varying loads.
            -   `backend-service.yaml`, `frontend-service.yaml`: Kubernetes Service definitions for exposing the backend and frontend applications within the cluster, providing stable network endpoints for inter-service communication and external access.
            -   `ingress.yaml`: Kubernetes Ingress definition for managing external access to services via HTTP/HTTPS routing, handling domain names, SSL termination, and path-based routing.
            -   `secrets.yaml`: Kubernetes Secret definitions for securely managing sensitive information (e.g., API keys, database credentials, TLS certificates) within the cluster, preventing them from being exposed in code or configuration files.
-   **`kubernetes/`**: Raw Kubernetes manifests for deploying various components, offering granular control and direct interaction with the Kubernetes API.
    -   **`databases/`**: Kubernetes manifests for deploying and managing database instances within the cluster.
        -   `influxdb.yaml`: Configuration for InfluxDB, typically used for time-series data (e.g., monitoring metrics, financial market data). It would include Deployment, Service, and Persistent Volume Claim definitions.
        -   `mongodb.yaml`: Configuration for MongoDB, a NoSQL document database, likely used for flexible data storage, analytics, or specific microservices requiring document-oriented data models.
        -   `postgresql.yaml`: Configuration for PostgreSQL, the primary relational database for transactional data, ensuring ACID compliance and data integrity for core financial operations.
        -   `redis.yaml`: Configuration for Redis, an in-memory data structure store, often used for high-performance caching, session management, and as a message broker or queue.
    -   **`ingress/`**: Kubernetes manifests for ingress controllers and rules.
        -   `ingress.yaml`: Defines how external traffic is routed to services within the Kubernetes cluster, specifying hostnames, paths, and backend services.
    -   **`messaging/`**: Kubernetes manifests for message brokers, enabling asynchronous communication between microservices.
        -   `kafka.yaml`: Configuration for Apache Kafka, a distributed streaming platform used for building real-time data pipelines and streaming applications, crucial for event-driven microservices architectures.
        -   `rabbitmq.yaml`: Configuration for RabbitMQ, another popular message broker, often used for task queues and asynchronous messaging.
    -   **`monitoring/`**: Kubernetes manifests for monitoring solutions, providing observability into the cluster and applications.
        -   `grafana.yaml`: Configuration for Grafana, a popular open-source platform for monitoring and observability, used for visualizing metrics collected by Prometheus.
        -   `prometheus.yaml`: Configuration for Prometheus, a powerful open-source monitoring system and time-series database, used for collecting and storing metrics from applications and infrastructure.
    -   **`namespaces/`**: Kubernetes manifests for defining namespaces, providing logical isolation within the cluster.
        -   `namespaces.yaml`: Defines logical isolation units within the Kubernetes cluster, allowing for organization of resources and access control.
    -   **`security/`**: Kubernetes manifests for security configurations at the cluster level.
        -   `security-policies.yaml`: Defines network policies and other security-related configurations to control traffic flow between pods, enforce least privilege, and enhance overall cluster security.
    -   **`services/`**: Individual Kubernetes service deployments for each microservice, enabling independent scaling and management.
        -   `ai-chatbot.yaml`, `ai-fraud-detection.yaml`, `api-gateway.yaml`, `auth-service.yaml`, `card-service.yaml`, `developer-portal.yaml`, `kyc-aml-service.yaml`, `ledger-service.yaml`, `notification-service.yaml`, `payments-service.yaml`, `wallet-service.yaml`: These files define the Kubernetes Deployments, Services, and other resources (e.g., ConfigMaps, Horizontal Pod Autoscalers) required for each specific microservice, enabling independent scaling, updates, and fault isolation.
-   **`scripts/`**: Shell scripts for infrastructure-related automation, complementing the main `scripts/` directory.
    -   `build-images.sh`: Automates the process of building Docker images for the various services, ensuring consistent and versioned container images.
    -   `cleanup.sh`: Script for cleaning up deployed resources or temporary files in the infrastructure, useful for development environments or after testing.
    -   `deploy.sh`: A general deployment script, possibly orchestrating Helm or raw Kubernetes deployments, providing a unified interface for infrastructure deployments.
    -   `validate.sh`: Script for validating infrastructure configurations (e.g., Terraform plans, Kubernetes manifests) or deployments, ensuring correctness before applying changes.
-   **`terraform/`**: Contains Terraform configurations for provisioning cloud infrastructure (e.g., AWS, GCP, Azure), enabling declarative infrastructure management.
    -   `main.tf`: The main Terraform configuration file, defining the cloud resources to be provisioned (e.g., VPCs, EC2 instances, managed Kubernetes clusters, databases).
    -   `outputs.tf`: Defines output values from the Terraform deployment, such as public IP addresses, load balancer URLs, or database connection strings, which can be used by other systems or for verification.
    -   `variables.tf`: Declares input variables for the Terraform configuration, allowing for customization of deployments (e.g., region, instance types, environment names).
    -   **`modules/`**: Reusable Terraform modules for common infrastructure patterns, promoting modularity and reusability.
        -   **`networking/`**: Module for defining network infrastructure (e.g., VPCs, subnets, route tables, NAT gateways, load balancers) in a cloud environment.
        -   **`security/`**: Module for defining security-related infrastructure (e.g., security groups, IAM roles and policies, network ACLs, key management services) to secure cloud resources.

### GitHub Actions Workflows (`.github/workflows/`)

This directory defines the Continuous Integration (CI) and Continuous Deployment (CD) pipelines using GitHub Actions. These workflows automate the build, test, and deployment processes across the entire Flowlet project, ensuring code quality, rapid iteration, and reliable delivery to production environments.

-   `documentation.yml`: This workflow is responsible for building, testing, and potentially deploying the project documentation (e.g., from Markdown files to a static website). It ensures that the documentation is always up-to-date and accessible.
-   `kubernetes-ci.yml`: A CI workflow specifically for validating Kubernetes configurations and manifests. It might use tools like `kubeval` or `conftest` to check for syntax errors, best practices, and policy adherence in the `.yaml` files within `infrastructure/kubernetes`.
-   `nodejs-frontend-ci-cd.yml`: The comprehensive CI/CD pipeline for the Node.js-based frontend application. This workflow includes steps for installing dependencies, running linting checks, executing unit and integration tests, building the production-ready frontend assets, and deploying them to a hosting environment (e.g., S3, Netlify, or a Kubernetes cluster via Helm).
-   `node-ci.yml`: A general CI workflow for Node.js projects, possibly used for linting, basic testing, and dependency checks for any Node.js-based utilities or services within the repository.
-   `python-backend-ci-cd.yml`: The comprehensive CI/CD pipeline for the Python-based backend application. This workflow covers installing Python dependencies, running linting checks, executing unit, integration, and performance tests, building Docker images for the backend services, and deploying them to a Kubernetes cluster.
-   `python-ci.yml`: A general CI workflow for Python projects, likely used for linting, basic testing, and dependency checks for any Python-based utilities or services.
-   `scripts-ci.yml`: A CI workflow for validating the utility scripts located in the `scripts/` directory. It ensures that these shell scripts are syntactically correct, executable, and adhere to coding standards.
-   `terraform-ci.yml`: A CI workflow specifically for validating Terraform configurations. It typically runs `terraform fmt` to ensure consistent formatting and `terraform validate` to check for syntax errors and configuration issues in the `.tf` files within `infrastructure/terraform`.

---

## 🚀 Getting Started

For detailed instructions on setting up the development environment, running tests, and deploying the application, please refer to the comprehensive documentation within the `docs/` directory. These guides are designed to provide a smooth onboarding experience for developers and operations teams.

-   **Development Setup**: Consult `docs/06_Developer_Guides/Setup_Guide.md` and `scripts/setup/setup-dev.sh` for setting up your local development environment, including prerequisites, dependency installation, and initial application configuration.
-   **Running Tests**: Refer to `docs/06_Developer_Guides/Application_Testing_Guide.md` and the `tests/README.md` for instructions on executing unit, integration, end-to-end, and performance tests across the backend and frontend.
-   **Deployment**: For deploying Flowlet, refer to `infrastructure/DEPLOYMENT.md`, `docs/08_Infrastructure/Infrastructure_Guide.md`, and the Helm charts in `infrastructure/helm/flowlet/` for Kubernetes-based deployments. The `scripts/deployment/deploy.sh` also provides an automated deployment mechanism.
-   **API Integration**: Developers looking to integrate with Flowlet's services should consult `docs/03_API_Reference/API_Documentation.md` and `docs/03_API_Reference/Backend_API.md` for detailed API specifications and usage examples.

---

## 🛣️ Strategic Roadmap

Flowlet is committed to continuous innovation and expansion of its embedded finance capabilities. Our strategic roadmap outlines key initiatives for the upcoming quarters, focusing on enhancing platform robustness, expanding feature sets, and exploring cutting-edge technologies to maintain a competitive edge and deliver unparalleled value to our partners and their customers. This roadmap is dynamic and will be continuously refined based on market demands, technological advancements, regulatory changes, and partner feedback, ensuring Flowlet remains a leading-edge embedded finance platform, poised for significant growth and impact.

### Q3 2025: Platform Hardening & Core Expansion

This quarter focuses on solidifying the existing platform, enhancing its security posture, and expanding core financial functionalities to meet growing demands and regulatory requirements.

-   **Enhanced Security Audits & Penetration Testing**: Beyond automated scans, engage leading third-party security firms to conduct comprehensive white-box and black-box penetration tests and security audits. This includes code review, vulnerability assessments, and simulated attacks to identify and remediate potential vulnerabilities at all layers of the application and infrastructure. Implement continuous security scanning in CI/CD pipelines for static application security testing (SAST) and dynamic application security testing (DAST).
-   **Multi-Region Deployment Capabilities**: Implement advanced active-active or active-passive multi-region deployment strategies using Kubernetes and Terraform. This will involve setting up global load balancing, cross-region data replication (e.g., PostgreSQL streaming replication, MongoDB replica sets), and robust failover mechanisms to ensure business continuity, enhance disaster recovery capabilities, and reduce latency for a globally distributed user base.
-   **Advanced Ledger Reconciliation with AI**: Develop and integrate sophisticated AI-powered reconciliation tools. These tools will leverage machine learning to automatically identify and resolve complex discrepancies between internal ledgers and external bank statements/payment processor reports, significantly reducing manual effort, improving accuracy, and accelerating financial close processes. This includes pattern recognition for common reconciliation issues.
-   **Comprehensive SDK & API Versioning Strategy**: Introduce a formal and robust versioning strategy for all SDKs and APIs (e.g., semantic versioning). This ensures backward compatibility for existing integrations while providing a clear, well-documented upgrade path for developers to adopt new features and improvements without breaking changes. Publish clear deprecation policies.
-   **Real-time Fraud Prevention Enhancements**: Integrate behavioral biometrics (e.g., typing patterns, mouse movements, device characteristics) as an additional, passive layer of real-time fraud prevention. This will complement existing AI fraud detection modules by identifying suspicious user behavior patterns, adding a powerful layer of defense against account takeover and synthetic identity fraud.

### Q4 2025: Ecosystem Integration & Data Intelligence

This quarter emphasizes broadening Flowlet's integration capabilities within the financial ecosystem and leveraging data to provide deeper insights and personalized experiences.

-   **Expanded Open Banking & Open Finance API Integrations**: Significantly broaden integration with Open Banking and Open Finance APIs across more key regions (e.g., Europe, UK, Australia, Canada, LatAm). This will enable richer, standardized access to financial data and payment initiation services, fostering a more interconnected financial ecosystem and compliance with evolving regulations like PSD2.
-   **Real-time Transaction Monitoring & Proactive Alerting**: Implement a dedicated, highly configurable real-time transaction monitoring service. This service will allow businesses to define custom rules and thresholds for suspicious activities, triggering proactive alerts (via email, SMS, webhooks) for anomalies, large transactions, or unusual spending patterns. This enhances operational oversight and risk management.
-   **AI-Driven Personalized Financial Insights for End-Users**: Develop advanced AI models to analyze end-user transaction data (with explicit consent) and provide highly personalized financial insights. This includes intelligent budgeting advice, spending pattern analysis, savings recommendations, and debt management suggestions, empowering users with actionable financial intelligence.
-   **Blockchain/DLT Integration (Pilot for Specific Use Cases)**: Initiate a pilot program for integrating Distributed Ledger Technology (DLT) for specific, high-value use cases. This could include exploring DLT for immutable audit trails, cross-border payments (e.g., stablecoins), or tokenized asset management, aiming for enhanced transparency, efficiency, and reduced settlement times.
-   **Advanced Analytics Dashboard for Businesses**: Develop a comprehensive, customizable analytics dashboard for businesses leveraging Flowlet. This dashboard will provide real-time insights into transaction volumes, customer behavior, revenue streams, and operational metrics, enabling data-driven decision-making.

### Q1 2026: Global Reach & Advanced Financial Products

This quarter focuses on expanding Flowlet's global footprint and introducing sophisticated financial products that can be seamlessly embedded by partners.

-   **Global Payment Network Expansion & Optimization**: Integrate with additional global payment networks (e.g., Visa Direct, Mastercard Send, local payment schemes in APAC/LATAM) to enable faster, more diverse, and cost-effective payout options. Optimize routing algorithms for international payments to minimize fees and maximize speed.
-   **Lending-as-a-Service (LaaS) Module**: Introduce a modular Lending-as-a-Service component, allowing businesses to embed various credit products (e.g., micro-loans, Buy Now Pay Later - BNPL, working capital loans) directly into their platforms. This module will leverage Flowlet's existing data (transaction history, KYC/AML) and compliance infrastructure for streamlined credit assessment and disbursement.
-   **Central Bank Digital Currency (CBDC) Readiness & Integration**: Proactively research and develop capabilities to support future Central Bank Digital Currencies (CBDCs) as they emerge globally. This includes building necessary infrastructure connectors and adapting wallet/ledger systems to handle CBDC transactions, positioning Flowlet at the forefront of digital currency adoption.
-   **Embedded Insurance Product Integration**: Develop a framework for integrating and offering embedded insurance products (e.g., purchase protection, travel insurance) directly within partner applications. This would involve partnerships with insurance providers and a flexible API for policy issuance and claims management.
-   **Dynamic Fee Management System**: Implement a highly configurable and dynamic fee management system, allowing partners to define complex fee structures based on transaction type, volume, user tier, and other parameters, providing greater flexibility and revenue optimization.

### Q2 2026: Platform Extensibility & Developer Empowerment

This quarter is dedicated to making Flowlet even more accessible and powerful for developers and non-technical users, fostering a vibrant ecosystem around the platform.

-   **Low-Code/No-Code Integration Builder**: Develop a visual, drag-and-drop interface within the Developer Portal that allows businesses to configure and integrate Flowlet's services with minimal or no coding. This accelerates time-to-market for non-technical users and citizen developers, democratizing embedded finance.
-   **Smart Contract Integration for Automated Escrow/Conditional Payments**: Enable businesses to define and execute smart contracts on a blockchain (e.g., Ethereum, Hyperledger Fabric) for automated escrow services or conditional payments. This enhances trust, reduces manual intervention for complex transactions, and opens up new possibilities for programmatic finance.
-   **AI-Powered Code Generation for SDKs & Documentation**: Explore and implement advanced AI models (e.g., large language models) to automatically generate SDK code snippets, API integration examples, and even update documentation based on schema changes. This will significantly streamline the developer experience and reduce integration friction.
-   **Decentralized Identity (DID) Support & Verifiable Credentials**: Investigate and integrate support for Decentralized Identifiers (DIDs) and Verifiable Credentials (VCs) for enhanced privacy, security, and user control over identity verification processes. This would allow users to own and manage their digital identities and selectively share verified attributes.
-   **Partner Marketplace for Financial Services**: Develop a marketplace within the Flowlet ecosystem where partners can discover, integrate, and offer complementary financial services (e.g., specialized lending, niche insurance, investment products) built on top of Flowlet's infrastructure, fostering a collaborative ecosystem.

---

## 🤝 Contributing

We welcome contributions to the Flowlet project. Please refer to the `CONTRIBUTING.md` (if available) for guidelines on how to contribute.

---

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

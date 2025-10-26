# Flowlet - Embedded Finance Platform

[![CI/CD Status](https://img.shields.io/github/actions/workflow/status/abrar2030/Flowlet/cicd.yml?branch=main&label=CI/CD&logo=github)]
![Test Coverage](https://img.shields.io/badge/coverage-91%25-green)
![License](https://img.shields.io/badge/license-MIT-blue)

![Flowlet Dashboard](docs/assets/images/dashboard.bmp)

> **Note**: This project is under active development. Features and functionalities are continuously being enhanced to improve embedded finance capabilities and user experience.

---

## 📚 Table of Contents

| Section | Description |
| :--- | :--- |
| [Executive Summary](#-executive-summary) | High-level overview and key platform highlights. |
| [Key Features Implemented](#-key-features-implemented) | Detailed breakdown of core financial capabilities. |
| [Architecture Overview](#️-architecture-overview) | Insight into the cloud-agnostic microservices design. |
| [Component Breakdown](#-component-breakdown-detailed-codebase-analysis) | Granular analysis of the codebase structure and purpose. |
| [Getting Started](#-getting-started) | Instructions for setting up and running the platform. |
| [Contributing](#-contributing) | Guidelines for community contributions. |
| [License](#-license) | Licensing information. |

---

## 📋 Executive Summary

Flowlet is a comprehensive, cloud-agnostic embedded finance platform designed to enable businesses to seamlessly integrate financial services into their core products. Built on a robust microservices architecture, Flowlet offers a complete suite of financial capabilities, including digital wallets, payment processing, card issuance, KYC/AML compliance, and ledger management. The platform is engineered to abstract away the complexities of financial infrastructure, allowing businesses to concentrate on their primary offerings while delivering sophisticated financial services to their customers.

The platform's design prioritizes **scalability, security, and regulatory compliance**. Flowlet connects to banking partners, payment processors, card networks, and regulatory services through a unified API layer. This strategic architecture allows businesses across various sectors to embed financial services without the burden of building complex financial infrastructure from scratch or navigating the intricate regulatory landscape independently.

Flowlet maintains a **developer-first approach**, providing comprehensive documentation, SDKs, and a robust developer portal to simplify integration and accelerate time-to-market. Its modular design ensures businesses can select and implement only the necessary components, creating a tailored embedded finance solution that is flexible and scalable to meet evolving requirements.

### Key Highlights

The platform's core value proposition is defined by the following key highlights, presented here as a descriptive list rather than traditional bullet points:

1.  **Complete Embedded Finance Stack**: Provides a full range of services, including digital wallets, payment processing, card issuance, KYC/AML, and ledger management.
2.  **Cloud-Agnostic Microservices**: Utilizes a Kubernetes-based infrastructure for high availability and horizontal scalability across any major cloud provider.
3.  **Developer-Friendly Integration**: Features a comprehensive API gateway, detailed SDKs, and a dedicated developer portal to ensure seamless and rapid integration.
4.  **Bank-Grade Security**: Implements end-to-end encryption, tokenization, and comprehensive audit trails to safeguard all sensitive data and transactions.
5.  **Regulatory Compliance**: Offers built-in workflows for adherence to critical regulatory frameworks, including GDPR, PSD2, and FinCEN.
6.  **AI-Enhanced Capabilities**: Incorporates artificial intelligence for advanced fraud detection, intelligent support chatbots, and developer assistance.
7.  **Operational Excellence**: Achieved through robust DevOps automation, advanced observability tools, and managed services for reliable operation.

---

## 🌟 Key Features Implemented

Flowlet's strength lies in its comprehensive suite of embedded finance capabilities, meticulously implemented across its microservices architecture. The following sections detail these core features and their corresponding implementation within the codebase.

### 💰 Digital Wallet Management

Flowlet provides a sophisticated digital wallet system that forms the foundation of its embedded finance offerings. This system enables businesses to offer secure, multi-currency financial accounts with real-time balance updates and advanced transaction management.

| Component | Key Files/Modules | Purpose |
| :--- | :--- | :--- |
| **Backend Implementation** | `backend/src/routes/wallet.py`, `backend/src/routes/wallet_mvp.py`, `backend/src/models/account.py`, `backend/src/models/transaction.py`, `backend/src/currency/multi_currency_system.py`, `backend/src/utils/notifications.py` | Core logic for wallet creation, management, and transaction processing; defines API endpoints, business logic, data models, multi-currency support, and real-time updates. |
| **Frontend Integration** | `unified-frontend/src/components/wallet/Dashboard.tsx`, `unified-frontend/src/lib/walletService.ts`, `unified-frontend/src/store/walletSlice.ts` | User interface for viewing balances and transaction history, integrating with the backend and managing state for real-time display. |

### 💳 Payment Processing

Flowlet's payment processing capabilities allow businesses to handle a wide array of financial transactions across various channels and payment methods. The system abstracts the complexities of different payment processors to ensure efficient and secure fund transfers.

| Component | Key Files/Modules | Purpose |
| :--- | :--- | :--- |
| **Backend Implementation** | `backend/src/routes/payment.py`, `backend/src/routes/payment_mvp.py`, `backend/src/integrations/payments/stripe_integration.py`, `backend/src/integrations/banking/`, `backend/src/utils/validators.py`, `backend/src/utils/error_handlers.py` | Central modules for payment routing and processing, external payment gateway integration, support for bank transfers, and transaction validation/error handling. |

### 💳 Card Issuance and Management

The platform enables businesses to issue and manage both virtual and physical payment cards, supporting the entire card lifecycle from issuance to transaction processing and deactivation.

| Component | Key Files/Modules | Purpose |
| :--- | :--- | :--- |
| **Backend Implementation** | `backend/src/routes/card.py`, `backend/src/routes/enhanced_cards.py`, `backend/src/models/card.py` | Encapsulates logic for card issuance, lifecycle events, creation, activation, transaction authorization, advanced controls, and defining the fundamental card data structure. |

### ⚖️ KYC/AML Compliance

Compliance with Know Your Customer (KYC) and Anti-Money Laundering (AML) regulations is a cornerstone of Flowlet. The platform provides streamlined, risk-based workflows to balance stringent regulatory requirements with a smooth user experience.

| Component | Key Files/Modules | Purpose |
| :--- | :--- | :--- |
| **Backend Implementation** | `backend/src/routes/kyc_aml.py`, `backend/src/routes/enhanced_kyc.py`, `backend/src/compliance/regulatory_compliance.py`, `backend/src/models/audit_log.py` | Implements core compliance workflows, orchestrates complex verification processes (identity/sanctions screening), manages overarching regulatory logic, and ensures comprehensive audit trails. |

### 📊 Ledger and Accounting

At the heart of Flowlet's financial infrastructure is a robust double-entry ledger system, which ensures immutable audit trails and data consistency for all financial events.

| Component | Key Files/Modules | Purpose |
| :--- | :--- | :--- |
| **Backend Implementation** | `backend/src/routes/ledger.py`, `backend/src/routes/enhanced_ledger.py`, `backend/src/models/audit_log.py`, `backend/src/models/transaction.py`, `backend/src/utils/audit.py`, `backend/src/security/audit_logger.py` | Manages the meticulous recording of all financial transactions, reinforces the integrity of audit trails for double-entry accounting, and provides further auditability. |

### 🌐 Developer Portal and API Gateway

Flowlet adopts a developer-first approach, offering extensive resources for seamless integration. The API Gateway serves as the unified, secure entry point for all interactions with the underlying microservices.

| Component | Key Files/Modules | Purpose |
| :--- | :--- | :--- |
| **Backend Implementation** | `backend/src/gateway/optimized_gateway.py`, `docs/03_API_Reference` | Implements gateway functionality (authentication, rate limiting, intelligent routing) and supports the developer experience with comprehensive documentation. |

### 🧠 AI-Enhanced Capabilities

Flowlet leverages artificial intelligence to augment platform functionalities, from sophisticated fraud detection to intelligent developer support. These AI components are designed as independent, integrable services.

| Component | Key Files/Modules | Purpose |
| :--- | :--- | :--- |
| **Implementation Details** | `backend/src/ai/enhanced_fraud_detection.py`, `backend/src/ai/risk_assessment.py`, `backend/src/ml/fraud_detection/`, `backend/src/ai/support_chatbot.py`, `backend/src/ai/transaction_intelligence.py` | Implements AI-driven fraud analysis, risk assessment, and machine learning models; provides AI-powered support and derives deeper insights from transaction patterns. |

### 🔒 Security Infrastructure

Security is paramount, and Flowlet integrates multiple layers of protection to safeguard sensitive data and transactions, including robust encryption, tokenization, and comprehensive access controls.

| Component | Key Files/Modules | Purpose |
| :--- | :--- | :--- |
| **Implementation Details** | `backend/src/security/`, `backend/src/routes/auth.py`, `backend/src/security/token_manager.py` | Dedicated to security, featuring modules for data protection (encryption), secure password hashing, API abuse prevention (rate limiting), comprehensive logging (audit), input validation, and managing authentication/authorization flows. |

---

## 🏛️ Architecture Overview

Flowlet is engineered on a **cloud-agnostic microservices architecture**, designed for maximum scalability, resilience, and security. This approach facilitates consistent deployment across diverse environments, from public clouds to on-premises infrastructure. The system adheres to a **Domain-Driven Design (DDD)**, organizing services around distinct business capabilities for independent evolution and targeted scaling.

The infrastructure leverages **containerization (Docker)** for application packaging and **orchestration (Kubernetes)** for managing and scaling containers. **Infrastructure-as-Code (Terraform)** ensures reproducible deployments and simplified disaster recovery. Communication is primarily **event-driven via Apache Kafka**, enhancing resilience and decoupling services, supplemented by REST APIs and gRPC for synchronous interactions through the unified API Gateway. A **polyglot persistence strategy** is employed, utilizing optimal database technologies for specific service requirements.

### System Components and Implementation Layers

The Flowlet platform is logically divided into six key layers, each with a defined role and corresponding implementation within the codebase:

1.  **API Layer**: The primary entry point for all external interactions. Implemented by the API Gateway (`backend/src/gateway/optimized_gateway.py`), which handles authentication, rate limiting, and intelligent routing. Documentation is extensive in `docs/03_API_Reference`.
2.  **Core Services Layer**: Encapsulates the fundamental financial services. These are distinct, independently deployable microservices found in `backend/src/routes`, such as Wallet Management (`wallet.py`), Payment Processing (`payment.py`), and KYC/AML (`kyc_aml.py`).
3.  **Integration Layer**: Responsible for securely connecting Flowlet with external financial systems. Integrations for banking partners (e.g., Plaid, FDX) are in `backend/src/integrations/banking`, and payment processor integrations (e.g., Stripe) are in `backend/src/integrations/payments`.
4.  **Data Layer**: Manages system state and analytics using a polyglot persistence model. Kubernetes configurations for various databases (`postgresql.yaml`, `mongodb.yaml`, `redis.yaml`) are in `infrastructure/kubernetes/databases`. The SQLAlchemy ORM models are defined in `backend/src/models`.
5.  **Support Services Layer**: Provides cross-cutting functionalities. This includes authentication services (`backend/src/routes/auth.py`), notification capabilities (`backend/src/utils/notifications.py`), and the comprehensive AI services in `backend/src/ai` and `backend/src/ml`.
6.  **Infrastructure Layer**: The foundational layer for deployment, monitoring, and security. Kubernetes orchestration is managed via configurations in `infrastructure/kubernetes` and Helm charts in `infrastructure/helm`. Monitoring systems (Prometheus/Grafana) are configured in `infrastructure/kubernetes/monitoring`, and CI/CD pipelines are defined in `.github/workflows`.

---

## 🧩 Component Breakdown: Detailed Codebase Analysis

This section provides a granular, file-by-file and directory-by-directory analysis of the Flowlet codebase, highlighting the purpose and implementation details of each significant component.

### Backend (`backend/`)

The `backend` directory is the central hub for Flowlet's server-side logic, implemented using the Flask framework and structured for a microservices paradigm.

| Directory/File | Description | Key Components and Files |
| :--- | :--- | :--- |
| `backend/src/ai/` | Houses modules for Artificial Intelligence capabilities, focusing on intelligent automation and enhanced decision-making. | `enhanced_fraud_detection.py`, `risk_assessment.py`, `support_chatbot.py`, `transaction_intelligence.py` |
| `backend/src/compliance/` | Dedicated to ensuring strict adherence to financial regulations and legal frameworks. | `regulatory_compliance.py` (Manages GDPR, PSD2, FinCEN adherence) |
| `backend/src/config/` | Manages application-wide configurations and settings. | `security.py` (JWT secrets, encryption), `settings.py` (DB connections, logging) |
| `backend/src/currency/` | Manages multi-currency operations for a global platform. | `multi_currency_system.py` (Conversion, exchange rate application) |
| `backend/src/gateway/` | Implements the API Gateway functionality, acting as the single entry point. | `optimized_gateway.py` (Routing, authentication, rate limiting) |
| `backend/src/integrations/` | Manages connections with external financial services and third-party APIs. | `banking/` (`plaid_integration.py`, `open_banking_integration.py`), `currency/` (`exchange_rates.py`), `payments/` (`stripe_integration.py`) |
| `backend/src/ml/` | Contains Machine Learning specific components, primarily for fraud detection. | `fraud_detection/` (`anomaly_models.py`, `ensemble_model.py`, `supervised_models.py`) |
| `backend/src/models/` | Defines the SQLAlchemy ORM models for database mapping. | `account.py`, `audit_log.py`, `card.py`, `transaction.py`, `user.py` |
| `backend/src/routes/` | Contains Flask blueprints and API endpoint definitions, organized by domain. | `auth.py`, `card.py`, `kyc_aml.py`, `ledger.py`, `payment.py`, `wallet.py` |
| `backend/src/security/` | Implements application-level security measures. | `encryption.py`, `password_security.py`, `rate_limiter.py`, `token_manager.py`, `input_validator.py` |
| `backend/src/utils/` | General utility functions and helper modules. | `error_handlers.py`, `notifications.py`, `validators.py` |
| Root Files | Main application entry points and configuration. | `production_app.py`, `simple_mvp_app.py`, `requirements.txt`, `run_tests.sh`, `wsgi.py` |

### Unified Frontend (`unified-frontend/`)

This directory contains the React-based Single-Page Application (SPA) built with modern frontend development practices.

| Directory/File | Description | Key Components and Files |
| :--- | :--- | :--- |
| `unified-frontend/src/components/` | Reusable UI components, promoting modularity and efficiency. | `auth/` (Login, Register, Onboarding), `ui/` (Generic components like `button.jsx`, `card.jsx`), `wallet/` (`Dashboard.tsx`) |
| `unified-frontend/src/hooks/` | Custom React hooks for encapsulating and reusing stateful logic. | `useAuth.ts` (Authentication state), `use-mobile.js` (Responsive design logic) |
| `unified-frontend/src/lib/` | Utility functions and service integrations. | `api.ts` (Centralized API calls), `authService.ts`, `walletService.ts`, `utils.js` |
| `unified-frontend/src/store/` | Client-side state management, likely using Redux Toolkit. | `authSlice.ts`, `transactionSlice.ts`, `walletSlice.ts`, `index.ts` (Store configuration) |
| `unified-frontend/src/types/` | TypeScript type definitions for type safety. | `index.ts` (Centralized custom type definitions) |
| Root Files | Main application files and configuration. | `main.tsx` (Entry point), `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts` |

### Documentation (`docs/`)

The `docs/` directory is a comprehensive repository of documentation catering to various audiences.

| Directory | Description | Key Documents |
| :--- | :--- | :--- |
| `01_Introduction/` | High-level overview of the platform's vision and mission. | `Introduction.md` |
| `02_Architecture/` | Detailed explanation of the microservices design and principles. | `Architecture_Overview.md`, `Microservices_Design.md` |
| `03_API_Reference/` | Exhaustive documentation for all exposed APIs. | `API_Documentation.md`, `Backend_API.md`, `API_Gateway.md` |
| `04_Compliance_and_Regulatory/` | Details on adherence to financial regulations. | `Compliance_Overview.md`, `KYC_AML.md` |
| `05_Core_Financial_Services/` | In-depth documentation on each core financial service. | `Banking_Integrations.md`, `Card_Services.md`, `Ledger.md`, `Payment_Processing.md` |
| `06_Developer_Guides/` | Practical, hands-on guides for developers. | `Setup_Guide.md`, `Authentication.md`, `Frontend_Development.md` |
| `07_Security/` | Details on robust security measures and architecture. | `Security_Overview.md` |
| `08_Infrastructure/` | Documentation for DevOps and operations teams. | `Deployment_Guide.md`, `Monitoring_and_Observability.md` |

### Infrastructure (`infrastructure/`)

This directory contains all the Infrastructure-as-Code (IaC) definitions for deploying and managing the Flowlet platform.

| Directory/File | Description | Key Components and Files |
| :--- | :--- | :--- |
| `infrastructure/kubernetes/` | Kubernetes manifests for deploying the application and its dependencies. | `databases/` (`postgresql.yaml`, `mongodb.yaml`, `redis.yaml`), `monitoring/` (Prometheus, Grafana), `services/` (Core service deployments) |
| `infrastructure/helm/` | Helm charts for templating and managing Kubernetes deployments. | `flowlet-chart/` (Main application chart) |
| `infrastructure/terraform/` | Terraform configurations for provisioning cloud resources (e.g., AWS, GCP). | `aws/`, `gcp/` (Provider-specific resource definitions) |

### GitHub Actions Workflows (`.github/workflows/`)

Contains the CI/CD pipeline definitions, automating the software delivery lifecycle.

| Workflow File | Description | Key Stages |
| :--- | :--- | :--- |
| `backend-ci-cd.yml` | Continuous Integration and Deployment for the backend services. | Testing, Linting, Building Docker Images, Pushing to Registry, Deploying to Staging/Production |
| `nodejs-frontend-ci-cd.yml` | CI/CD for the unified frontend application. | Testing, Linting, Building Static Assets, Deployment to CDN/Web Server |
| `infrastructure-ci.yml` | Continuous Integration for Infrastructure-as-Code (Terraform/Helm). | Plan/Validate Infrastructure Changes |

---

## 🚀 Getting Started

To get a local copy of the project up and running, follow these steps:

1.  **Prerequisites**: Ensure you have Docker, Docker Compose, and Python 3.11+ installed.
2.  **Clone the Repository**:
    \`\`\`bash
    git clone [repository-url]
    cd Flowlet
    \`\`\`
3.  **Setup the Backend**:
    \`\`\`bash
    cd backend
    pip install -r requirements.txt
    python production_app.py
    \`\`\`
4.  **Setup the Frontend**:
    \`\`\`bash
    cd ../unified-frontend
    pnpm install
    pnpm run dev
    \`\`\`
5.  **Access the Application**: The frontend will typically be available at \`http://localhost:5173\` and the backend API at \`http://localhost:5000\`.

---

## 🤝 Contributing

We welcome contributions from the community. Please refer to our `CONTRIBUTING.md` (implied) for detailed guidelines on setting up your development environment, submitting pull requests, and our code of conduct.

## 📄 License

Flowlet is distributed under the MIT License. See the `LICENSE` file (implied) for more information.
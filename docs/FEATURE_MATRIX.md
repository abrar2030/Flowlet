# Feature Matrix

Comprehensive overview of all Flowlet features, their implementation status, and location in the codebase.

## Table of Contents

- [Core Financial Services](#core-financial-services)
- [Authentication & Security](#authentication--security)
- [Compliance & Regulatory](#compliance--regulatory)
- [AI & Machine Learning](#ai--machine-learning)
- [Developer Tools](#developer-tools)
- [Infrastructure & Operations](#infrastructure--operations)

## Core Financial Services

| Feature                       | Short description                            | Module / File                                             | CLI flag / API                        | Example (path)                                                             | Notes                                  |
| ----------------------------- | -------------------------------------------- | --------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------- |
| **Digital Wallet Management** | Create and manage multi-currency wallets     | `backend/src/routes/wallet.py`                            | `POST /api/v1/accounts/wallets`       | [examples/basic-wallet-operations.md](examples/basic-wallet-operations.md) | Supports USD, EUR, GBP, JPY, CAD, AUD  |
| **Wallet Balance Inquiry**    | Query wallet balance and transaction history | `backend/src/routes/wallet.py`                            | `GET /api/v1/accounts/{id}`           | [examples/basic-wallet-operations.md](examples/basic-wallet-operations.md) | Real-time balance updates              |
| **Fund Deposits**             | Deposit funds from external sources          | `backend/src/routes/wallet.py`                            | `POST /api/v1/accounts/{id}/deposit`  | [examples/basic-wallet-operations.md](examples/basic-wallet-operations.md) | Supports bank transfer, card, external |
| **Fund Withdrawals**          | Withdraw funds to external accounts          | `backend/src/routes/wallet.py`                            | `POST /api/v1/accounts/{id}/withdraw` | [examples/basic-wallet-operations.md](examples/basic-wallet-operations.md) | Requires KYC verification              |
| **Payment Processing**        | Send and receive payments                    | `backend/src/routes/payment.py`                           | `POST /api/v1/payments`               | [examples/payment-processing-flow.md](examples/payment-processing-flow.md) | P2P, B2B, B2C supported                |
| **Payment Status Tracking**   | Real-time payment status monitoring          | `backend/src/routes/payment.py`                           | `GET /api/v1/payments/{id}`           | [examples/payment-processing-flow.md](examples/payment-processing-flow.md) | Webhook notifications available        |
| **Stripe Integration**        | Process card payments via Stripe             | `backend/src/integrations/payments/stripe_integration.py` | Configured via `STRIPE_SECRET_KEY`    | [examples/payment-processing-flow.md](examples/payment-processing-flow.md) | Requires Stripe account                |
| **Virtual Card Issuance**     | Issue virtual debit/credit cards             | `backend/src/routes/card.py`                              | `POST /api/v1/cards`                  | docs/05_Core_Financial_Services/Card_Services.md                           | Instant activation                     |
| **Physical Card Issuance**    | Order physical cards                         | `backend/src/routes/card.py`                              | `POST /api/v1/cards` (type: physical) | docs/05_Core_Financial_Services/Card_Services.md                           | 7-10 business days delivery            |
| **Card Activation**           | Activate issued cards                        | `backend/src/routes/card.py`                              | `POST /api/v1/cards/{id}/activate`    | docs/05_Core_Financial_Services/Card_Services.md                           | Required before first use              |
| **Card Limits Management**    | Set and update spending limits               | `backend/src/routes/card.py`                              | `PATCH /api/v1/cards/{id}`            | docs/05_Core_Financial_Services/Card_Services.md                           | Daily, monthly, per-transaction        |
| **Card Freeze/Unfreeze**      | Temporarily disable cards                    | `backend/src/routes/card.py`                              | `POST /api/v1/cards/{id}/freeze`      | docs/05_Core_Financial_Services/Card_Services.md                           | Instant effect                         |
| **Multi-Currency Support**    | Handle multiple currencies                   | `backend/src/currency/multi_currency_system.py`           | `POST /api/v1/currency/convert`       | docs/05_Core_Financial_Services/Wallet_and_Payment_System.md               | 6+ currencies supported                |
| **Currency Conversion**       | Convert between currencies                   | `backend/src/routes/multicurrency.py`                     | `POST /api/v1/currency/convert`       | docs/05_Core_Financial_Services/Wallet_and_Payment_System.md               | Real-time exchange rates               |
| **Exchange Rate API**         | Get current exchange rates                   | `backend/src/integrations/currency/exchange_rates.py`     | `GET /api/v1/currency/rates`          | docs/05_Core_Financial_Services/Wallet_and_Payment_System.md               | Updated every 15 minutes               |
| **Ledger Management**         | Double-entry bookkeeping                     | `backend/src/routes/ledger.py`                            | `GET /api/v1/ledger/transactions`     | docs/05_Core_Financial_Services/Ledger.md                                  | ACID compliant                         |
| **Transaction History**       | Detailed transaction logs                    | `backend/src/routes/ledger.py`                            | `GET /api/v1/ledger/transactions`     | docs/05_Core_Financial_Services/Ledger.md                                  | Filterable, exportable                 |
| **Account Statements**        | Generate formal statements                   | `backend/src/routes/ledger.py`                            | `POST /api/v1/ledger/statements`      | docs/05_Core_Financial_Services/Ledger.md                                  | PDF, CSV formats                       |
| **Plaid Bank Integration**    | Connect external bank accounts               | `backend/src/integrations/banking/plaid_integration.py`   | Configured via `PLAID_CLIENT_ID`      | docs/05_Core_Financial_Services/Banking_Integrations.md                    | 11,000+ banks supported                |
| **ACH Transfers**             | Automated Clearing House payments            | `backend/src/routes/banking_integrations.py`              | Configured via `ACH_ENABLED`          | docs/05_Core_Financial_Services/Banking_Integrations.md                    | 2-3 business days                      |

## Authentication & Security

| Feature                       | Short description                  | Module / File                               | CLI flag / API                           | Example (path)                                                             | Notes                           |
| ----------------------------- | ---------------------------------- | ------------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------- | ------------------------------- |
| **User Registration**         | Create new user accounts           | `backend/src/routes/auth.py`                | `POST /api/v1/auth/register`             | [examples/basic-wallet-operations.md](examples/basic-wallet-operations.md) | Email verification optional     |
| **User Login**                | JWT-based authentication           | `backend/src/routes/auth.py`                | `POST /api/v1/auth/login`                | [examples/basic-wallet-operations.md](examples/basic-wallet-operations.md) | Returns access + refresh tokens |
| **JWT Token Management**      | Secure token generation/validation | `backend/src/security/token_manager.py`     | Automatic                                | docs/06_Developer_Guides/Authentication.md                                 | HS256 algorithm                 |
| **Token Refresh**             | Renew expired access tokens        | `backend/src/routes/auth.py`                | `POST /api/v1/auth/refresh`              | docs/06_Developer_Guides/Authentication.md                                 | Uses refresh token              |
| **Two-Factor Authentication** | TOTP-based 2FA                     | `backend/src/routes/auth.py`                | `POST /api/v1/auth/2fa/enable`           | docs/07_Security/Security_Overview.md                                      | Google Authenticator compatible |
| **Password Hashing**          | Bcrypt password security           | `backend/src/security/password_security.py` | Automatic                                | docs/07_Security/Security_Overview.md                                      | Salt rounds: 12                 |
| **Rate Limiting**             | API abuse prevention               | `backend/src/security/rate_limiter.py`      | Automatic                                | docs/07_Security/Security_Overview.md                                      | Configurable per endpoint       |
| **Input Validation**          | Request data sanitization          | `backend/src/security/input_validator.py`   | Automatic                                | docs/07_Security/Security_Overview.md                                      | Prevents injection attacks      |
| **Data Encryption**           | Fernet symmetric encryption        | `backend/src/security/encryption.py`        | Configured via `ENCRYPTION_KEY`          | docs/07_Security/Security_Overview.md                                      | For PII and sensitive data      |
| **Audit Logging**             | Comprehensive activity logs        | `backend/src/security/audit_logger.py`      | Automatic                                | docs/07_Security/Security_Overview.md                                      | Tamper-proof logs               |
| **CORS Protection**           | Cross-origin security              | `backend/app.py`                            | Configured via `CORS_ORIGINS`            | docs/07_Security/Security_Overview.md                                      | Whitelist-based                 |
| **Session Management**        | Secure session handling            | `backend/src/config/settings.py`            | Configured via `SESSION_TIMEOUT_MINUTES` | docs/07_Security/Security_Overview.md                                      | HTTPOnly, Secure cookies        |

## Compliance & Regulatory

| Feature                    | Short description              | Module / File                                     | CLI flag / API                               | Example (path)                                                                 | Notes                         |
| -------------------------- | ------------------------------ | ------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------- |
| **KYC Submission**         | Identity verification workflow | `backend/src/routes/kyc_aml.py`                   | `POST /api/v1/kyc/submit`                    | [examples/kyc-verification-workflow.md](examples/kyc-verification-workflow.md) | Required for tier 2+          |
| **KYC Status Check**       | Verification status inquiry    | `backend/src/routes/kyc_aml.py`                   | `GET /api/v1/kyc/status`                     | [examples/kyc-verification-workflow.md](examples/kyc-verification-workflow.md) | Real-time updates             |
| **Document Upload**        | ID document submission         | `backend/src/routes/kyc_aml.py`                   | `POST /api/v1/kyc/documents`                 | [examples/kyc-verification-workflow.md](examples/kyc-verification-workflow.md) | Passport, driver's license    |
| **AML Monitoring**         | Anti-money laundering checks   | `backend/src/compliance/aml_engine.py`            | Configured via `AML_MONITORING_ENABLED`      | docs/04_Compliance_and_Regulatory/KYC_AML.md                                   | Continuous monitoring         |
| **Sanctions Screening**    | Check against sanctions lists  | `backend/src/compliance/regulatory_compliance.py` | Configured via `SANCTIONS_SCREENING_ENABLED` | docs/04_Compliance_and_Regulatory/KYC_AML.md                                   | OFAC, UN, EU lists            |
| **Transaction Monitoring** | Suspicious activity detection  | `backend/src/compliance/compliance_engine.py`     | Automatic                                    | docs/04_Compliance_and_Regulatory/Compliance_Overview.md                       | Real-time alerts              |
| **Regulatory Reporting**   | Compliance report generation   | `backend/src/compliance/regulatory_framework.py`  | `GET /api/v1/compliance/reports`             | docs/04_Compliance_and_Regulatory/Compliance_Overview.md                       | FinCEN, GDPR, PSD2            |
| **GDPR Compliance**        | Data protection framework      | `backend/src/compliance/data_protection.py`       | Automatic                                    | docs/04_Compliance_and_Regulatory/Compliance_Overview.md                       | Right to erasure, portability |
| **PCI-DSS Compliance**     | Payment card data security     | `backend/src/security/`                           | Configured via `PCI_DSS_COMPLIANCE=true`     | docs/07_Security/Security_Overview.md                                          | Level 1 compliant             |

## AI & Machine Learning

| Feature                      | Short description              | Module / File                                         | CLI flag / API               | Example (path)                         | Notes                          |
| ---------------------------- | ------------------------------ | ----------------------------------------------------- | ---------------------------- | -------------------------------------- | ------------------------------ |
| **Fraud Detection**          | ML-based fraud analysis        | `backend/src/ai/fraud_detection.py`                   | `POST /api/v1/fraud/analyze` | docs/09_Analytics_and_AI/AI_Service.md | 95%+ accuracy                  |
| **Risk Assessment**          | Transaction risk scoring       | `backend/src/ai/risk_assessment.py`                   | Automatic                    | docs/09_Analytics_and_AI/AI_Service.md | Real-time scoring              |
| **Anomaly Detection**        | Unusual pattern identification | `backend/src/ml/fraud_detection/anomaly_models.py`    | Automatic                    | docs/09_Analytics_and_AI/AI_Service.md | Unsupervised learning          |
| **Ensemble Model**           | Combined ML predictions        | `backend/src/ml/fraud_detection/ensemble_model.py`    | Automatic                    | docs/09_Analytics_and_AI/AI_Service.md | Random Forest + XGBoost        |
| **Support Chatbot**          | AI-powered customer support    | `backend/src/ai/support_chatbot.py`                   | `POST /api/v1/ai/chat`       | docs/09_Analytics_and_AI/AI_Service.md | GPT-4 powered                  |
| **Transaction Intelligence** | Smart transaction insights     | `backend/src/ai/transaction_intelligence.py`          | `GET /api/v1/ai/insights`    | docs/09_Analytics_and_AI/AI_Service.md | Spending patterns, predictions |
| **Model Training**           | Retrain fraud models           | `backend/src/ml/fraud_detection/supervised_models.py` | `make train-models`          | docs/09_Analytics_and_AI/AI_Service.md | Weekly retraining              |

## Developer Tools

| Feature                 | Short description           | Module / File                              | CLI flag / API             | Example (path)                             | Notes                       |
| ----------------------- | --------------------------- | ------------------------------------------ | -------------------------- | ------------------------------------------ | --------------------------- |
| **API Gateway**         | Centralized API routing     | `backend/src/gateway/optimized_gateway.py` | Automatic                  | docs/03_API_Reference/API_Gateway.md       | Rate limiting, auth         |
| **API Documentation**   | Interactive API docs        | `docs/03_API_Reference/`                   | `GET /api/v1/docs`         | docs/03_API_Reference/                     | OpenAPI/Swagger             |
| **Developer Portal**    | Comprehensive dev resources | `docs/06_Developer_Guides/`                | N/A                        | docs/06_Developer_Guides/                  | Guides, tutorials, examples |
| **Python SDK**          | Python client library       | `backend/src/clients/`                     | `pip install flowlet-sdk`  | docs/10_SDK/                               | Not yet published           |
| **JavaScript SDK**      | Node.js/Browser client      | `web-frontend/src/lib/`                    | `npm install @flowlet/sdk` | docs/10_SDK/                               | Not yet published           |
| **Webhooks**            | Event notifications         | `backend/src/utils/notifications.py`       | Configure webhook URLs     | docs/03_API_Reference/Backend_API.md       | Transaction, KYC events     |
| **API Versioning**      | Backward compatibility      | `backend/src/routes/`                      | `/api/v1/`, `/api/v2/`     | docs/03_API_Reference/API_Documentation.md | Currently v1 only           |
| **Sandbox Environment** | Test environment            | Docker Compose                             | `make docker-dev`          | docs/06_Developer_Guides/Setup_Guide.md    | Mock external services      |

## Infrastructure & Operations

| Feature                   | Short description         | Module / File                                     | CLI flag / API              | Example (path)                                     | Notes                        |
| ------------------------- | ------------------------- | ------------------------------------------------- | --------------------------- | -------------------------------------------------- | ---------------------------- |
| **Docker Containers**     | Containerized services    | `infrastructure/docker/`                          | `make docker-build`         | docs/08_Infrastructure/Infrastructure_Guide.md     | Backend, frontend, databases |
| **Kubernetes Deployment** | K8s orchestration         | `infrastructure/kubernetes/`                      | `kubectl apply -f ...`      | docs/08_Infrastructure/Kubernetes_Configuration.md | Production-ready manifests   |
| **Terraform IaC**         | Infrastructure as Code    | `infrastructure/terraform/`                       | `terraform apply`           | docs/08_Infrastructure/Infrastructure_Guide.md     | AWS, GCP, Azure support      |
| **Ansible Automation**    | Configuration management  | `infrastructure/ansible/`                         | `ansible-playbook site.yml` | docs/08_Infrastructure/Infrastructure_Guide.md     | Automated provisioning       |
| **CI/CD Pipeline**        | Automated deployments     | `.github/workflows/`, `infrastructure/ci-cd/`     | Automatic                   | docs/08_Infrastructure/Infrastructure_Guide.md     | GitHub Actions               |
| **Prometheus Monitoring** | Metrics collection        | `infrastructure/docker/monitoring/prometheus.yml` | `GET /metrics`              | docs/08_Infrastructure/Infrastructure_Guide.md     | 50+ metrics tracked          |
| **Grafana Dashboards**    | Metrics visualization     | `infrastructure/docker/monitoring/`               | http://localhost:3001       | docs/08_Infrastructure/Infrastructure_Guide.md     | Pre-configured dashboards    |
| **Health Checks**         | Service health monitoring | `backend/src/routes/monitoring.py`                | `GET /health`               | docs/08_Infrastructure/Infrastructure_Guide.md     | Liveness, readiness probes   |
| **Database Backups**      | Automated backup/restore  | `scripts/backup/`                                 | `make db-backup`            | docs/08_Infrastructure/Infrastructure_Guide.md     | Daily backups                |
| **Disaster Recovery**     | Velero K8s backups        | `infrastructure/kubernetes/backup-dr/`            | `velero backup create`      | docs/08_Infrastructure/Infrastructure_Guide.md     | Point-in-time recovery       |
| **Log Aggregation**       | Centralized logging       | `infrastructure/kubernetes/observability/`        | Automatic                   | docs/08_Infrastructure/Infrastructure_Guide.md     | ELK stack ready              |
| **Secrets Management**    | Secure secret storage     | Kubernetes Secrets                                | Configured via K8s          | docs/07_Security/Security_Overview.md              | Encrypted at rest            |

## Analytics & Reporting

| Feature                   | Short description        | Module / File                                  | CLI flag / API                       | Example (path)                        | Notes                    |
| ------------------------- | ------------------------ | ---------------------------------------------- | ------------------------------------ | ------------------------------------- | ------------------------ |
| **Dashboard Analytics**   | Business intelligence    | `backend/src/analytics/dashboard_service.py`   | `GET /api/v1/analytics/dashboard`    | docs/09_Analytics_and_AI/Analytics.md | Real-time metrics        |
| **Transaction Analytics** | Payment insights         | `backend/src/analytics/metrics_calculator.py`  | `GET /api/v1/analytics/transactions` | docs/09_Analytics_and_AI/Analytics.md | Volume, trends, patterns |
| **User Analytics**        | User behavior tracking   | `backend/src/analytics/data_models.py`         | `GET /api/v1/analytics/users`        | docs/09_Analytics_and_AI/Analytics.md | Engagement metrics       |
| **Data Warehouse**        | Analytics data store     | `backend/src/analytics/data_warehouse.py`      | Automatic                            | docs/09_Analytics_and_AI/Analytics.md | Optimized for queries    |
| **Reporting Engine**      | Custom report generation | `backend/src/analytics/reporting_engine.py`    | `POST /api/v1/analytics/reports`     | docs/09_Analytics_and_AI/Analytics.md | PDF, CSV, Excel export   |
| **Real-Time Analytics**   | Live data processing     | `backend/src/analytics/real_time_analytics.py` | Automatic                            | docs/09_Analytics_and_AI/Analytics.md | Sub-second latency       |

## See Also

- [API Reference](API.md) - Detailed API endpoint documentation
- [Configuration Guide](CONFIGURATION.md) - Environment variable setup
- [Installation Guide](INSTALLATION.md) - Setup instructions
- [Usage Examples](examples/) - Working code examples

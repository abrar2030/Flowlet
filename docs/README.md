# Flowlet Documentation

Flowlet is a comprehensive, cloud-agnostic embedded finance platform that enables businesses to seamlessly integrate financial services into their core products. Built on a robust microservices architecture, Flowlet offers digital wallets, payment processing, card issuance, KYC/AML compliance, and ledger management.

## Quick Start

Get started with Flowlet in three simple steps:

1. **Clone and Setup**: `git clone https://github.com/abrar2030/Flowlet && cd Flowlet && make setup`
2. **Configure Environment**: Copy `backend/.env.example` to `backend/.env` and update with your credentials
3. **Run with Docker**: `make docker-dev` to start the development environment

## 📚 Table of Contents

| Document                                 | Description                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------- |
| [Installation Guide](INSTALLATION.md)    | Complete installation instructions for different platforms and environments |
| [Usage Guide](USAGE.md)                  | Common usage patterns, CLI commands, and library integration                |
| [API Reference](API.md)                  | Comprehensive REST API documentation with endpoints and examples            |
| [CLI Reference](CLI.md)                  | Command-line interface documentation with all available commands            |
| [Configuration Guide](CONFIGURATION.md)  | Environment variables, config files, and feature flags                      |
| [Feature Matrix](FEATURE_MATRIX.md)      | Complete list of features, modules, and capabilities                        |
| [Architecture Overview](ARCHITECTURE.md) | System design, components, and infrastructure patterns                      |
| [Examples](examples/)                    | Working code examples demonstrating key features                            |
| [Contributing Guide](CONTRIBUTING.md)    | How to contribute, code style, and development workflow                     |
| [Troubleshooting](TROUBLESHOOTING.md)    | Common issues, solutions, and debugging tips                                |

## Core Features

- **💰 Digital Wallet Management**: Multi-currency wallets with real-time balance tracking
- **💳 Payment Processing**: Support for Stripe, ACH, bank transfers, and card payments
- **💳 Card Issuance**: Virtual and physical card creation with advanced controls
- **⚖️ KYC/AML Compliance**: Identity verification, sanctions screening, and regulatory reporting
- **📊 Ledger & Accounting**: Double-entry bookkeeping with comprehensive audit trails
- **🧠 AI-Powered Features**: Fraud detection, risk assessment, and transaction intelligence
- **🔒 Bank-Grade Security**: End-to-end encryption, tokenization, and PCI-DSS compliance
- **🌐 Developer Portal**: Comprehensive API gateway with rate limiting and authentication

## Technology Stack

- **Backend**: Python 3.11+, Flask, SQLAlchemy, PostgreSQL/SQLite
- **Frontend**: React 18+, TypeScript, Redux Toolkit, Vite
- **Infrastructure**: Docker, Kubernetes, Terraform, Ansible
- **AI/ML**: OpenAI GPT, scikit-learn, custom fraud detection models
- **Integrations**: Stripe, Plaid, Twilio

## Project Status

![CI/CD Status](https://img.shields.io/github/actions/workflow/status/abrar2030/Flowlet/cicd.yml?branch=main)
![Test Coverage](https://img.shields.io/badge/coverage-91%25-green)
![License](https://img.shields.io/badge/license-MIT-blue)

This project is under active development with continuous enhancements to embedded finance capabilities.

## License

Flowlet is released under the MIT License. See [LICENSE](../LICENSE) for details.

# Flowlet Test Suite Documentation

This directory contains the comprehensive test suite for the Flowlet application, designed to ensure its robustness, security, compliance, and performance in a financial context.

## 1. Test Architecture

The test suite is organized into several categories, each focusing on a specific aspect of the application's functionality and quality. For a detailed overview of the test architecture, including the rationale behind each category and the frameworks used, please refer to `test_architecture.md`.

## 2. Directory Structure

The `test` directory follows a structured approach to maintain modularity and clarity:

```
Flowlet/frontend/src/test/
├── unit/                 # Unit tests for individual components and functions
│   ├── financial_calculations/
│   ├── business_logic/
│   └── utility_functions/
├── integration/          # Integration tests for inter-module communication and APIs
│   └── api_endpoints/
├── security/             # Security tests for authentication, authorization, and vulnerabilities
│   ├── authentication/
│   └── penetration/
├── compliance/           # Compliance tests for regulatory standards (GDPR, PCI DSS, etc.)
│   ├── gdpr/
│   └── pci_dss/
├── performance/          # Performance tests for load, stress, and concurrency
│   └── load_testing/
├── config/               # Test runner configurations (Jest, etc.)
│   └── jest.config.js
├── setup.ts              # Global test setup and environment configuration
├── utils.tsx             # Utility functions and mock data for testing
├── README.md             # This documentation file
└── test_architecture.md  # Detailed document on test architecture and strategy
```

## 3. Setup and Installation

To run the tests, ensure you have Node.js and npm/yarn installed. Navigate to the `frontend` directory and install the necessary dependencies:

```bash
cd Flowlet/frontend
npm install # or yarn install
```

## 4. Running Tests

All tests can be run using the configured test runner (Jest). Make sure your `package.json` includes a test script similar to this:

```json
"scripts": {
  "test": "jest --config src/test/config/jest.config.js"
}
```

Then, you can execute the tests from the `frontend` directory:

```bash
npm test # or yarn test
```

### Running Specific Test Categories

You can run specific test files or categories by providing their paths to the `jest` command:

```bash
npm test src/test/unit/financial_calculations/calculations.test.ts
npm test src/test/security/
```

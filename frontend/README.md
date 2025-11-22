# Flowlet Frontend

The Flowlet Frontend is a comprehensive, production-ready component library and application built for financial technology. It is developed using **React**, **TypeScript**, and modern tooling to ensure high performance, security, and maintainability.

## 1. Core Technologies and Dependencies

The frontend is built on a modern stack, leveraging key libraries for state management, UI components, and data handling.

| Category             | Key Technologies                                          | Purpose                                                                     |
| :------------------- | :-------------------------------------------------------- | :-------------------------------------------------------------------------- |
| **Core Framework**   | `React 19`, `TypeScript`, `Vite`                          | Application foundation, type safety, and fast development environment.      |
| **State Management** | `@reduxjs/toolkit`, `react-redux`                         | Predictable and scalable state management for the application.              |
| **UI/Styling**       | `Tailwind CSS`, `@radix-ui/*`, `class-variance-authority` | Utility-first styling, accessible UI primitives, and component variants.    |
| **Routing**          | `react-router-dom`                                        | Declarative routing for navigation within the single-page application.      |
| **Form Handling**    | `react-hook-form`, `@hookform/resolvers`, `zod`           | Performant form management, validation, and schema-based data parsing.      |
| **Data Fetching**    | `axios`                                                   | Promise-based HTTP client for API communication.                            |
| **Security/Auth**    | `jose`, `crypto-js`, `helmet`, `js-cookie`                | Token handling, encryption, security headers, and secure cookie management. |
| **Testing**          | `vitest`, `@testing-library/*`, `jsdom`                   | Unit and integration testing framework with DOM simulation.                 |
| **Visualization**    | `recharts`                                                | Composable charting library for financial data visualization.               |

## 2. Directory Structure

The application follows a modular and feature-driven architecture for clear separation of concerns.

| Directory          | Primary Function                                 | Key Contents                                                                                          |
| :----------------- | :----------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **components/**    | Reusable UI and feature-specific components.     | Organized into sub-directories like `auth/`, `security/`, `compliance/`, and `ui/` (base components). |
| **hooks/**         | Custom React hooks for reusable logic.           | Contains hooks like `useAuth`, `use-responsive`, and other utility hooks.                             |
| **lib/**           | Utility functions and service wrappers.          | Includes API clients (`api.ts`), authentication services (`authService.ts`), and security utilities.  |
| **store/**         | Redux store configuration and slices.            | Contains state slices for features like `auth`, `wallet`, and `transactions`.                         |
| **types/**         | Global TypeScript type definitions.              | Centralized location for application-wide interfaces and types.                                       |
| **assets/**        | Static assets like images and fonts.             | Visual resources used throughout the application.                                                     |
| **tests/**      | Test files for various components and utilities. | Houses unit and integration tests.                                                                    |
| `package.json`     | Project manifest.                                | Defines dependencies, scripts, and project metadata.                                                  |
| `vite.config.ts`   | Build configuration.                             | Configuration for the Vite development and build tool.                                                |

## 3. Specialized Component and Logic Modules

The `components/` and `lib/` directories are further organized to handle specific financial and technical domains.

| Module                  | Location                      | Primary Function                                                         | Examples                                                   |
| :---------------------- | :---------------------------- | :----------------------------------------------------------------------- | :--------------------------------------------------------- |
| **Authentication**      | `components/auth/`            | User login, registration, and Multi-Factor Authentication (MFA) screens. | `LoginScreen`, `RegisterForm`, `MFAVerification`.          |
| **UI Primitives**       | `components/ui/`              | Reusable, styled, and accessible base components.                        | `Button`, `Input`, `Card`, `AlertDialog` (using Radix UI). |
| **Data Protection**     | `components/data-protection/` | Components related to data privacy and compliance.                       | `GDPRConsentBanner`, `DataEncryptionStatus`.               |
| **Security**            | `components/security/`        | Components for security monitoring and settings.                         | `SecurityDashboard`, `TokenManagement`.                    |
| **Compliance**          | `components/compliance/`      | Components for regulatory adherence features.                            | `KYCForm`, `AMLMonitoring`.                                |
| **Wallet/Transactions** | `components/wallet/`          | Components for managing user accounts and transactions.                  | `WalletScreen`, `TransactionHistory`, `SendMoneyForm`.     |
| **API Services**        | `lib/`                        | Wrappers for backend API calls and token management.                     | `api.ts`, `authService.ts`, `walletService.ts`.            |

## 4. Development Scripts and Tooling

The `package.json` defines a comprehensive set of scripts for development, testing, and quality assurance.

| Script           | Command                         | Purpose                                                                    |
| :--------------- | :------------------------------ | :------------------------------------------------------------------------- |
| `dev`            | `vite`                          | Starts the development server with hot module replacement.                 |
| `build`          | `tsc && vite build`             | Compiles TypeScript and builds the production-ready bundle.                |
| `test`           | `vitest`                        | Runs all unit and integration tests.                                       |
| `test:coverage`  | `vitest --coverage`             | Runs tests and generates a code coverage report.                           |
| `test:security`  | `vitest run src/tests/security` | Executes security-focused tests.                                           |
| `lint`           | `eslint . --ext ts,tsx`         | Runs ESLint for code quality and style checking.                           |
| `lint:fix`       | `eslint . --ext ts,tsx --fix`   | Automatically fixes linting issues.                                        |
| `type-check`     | `tsc --noEmit`                  | Performs a TypeScript type check without emitting files.                   |
| `storybook`      | `storybook dev -p 6006`         | Starts the Storybook server for component documentation and isolation.     |
| `security-audit` | `npm audit && npm audit fix`    | Runs a security audit on dependencies and attempts to fix vulnerabilities. |

## 5. Getting Started

### Prerequisites

- Node.js (version 18.0.0 or higher)
- pnpm (version 8.0.0 or higher)

### Setup and Run

```bash
# Navigate to the frontend directory
cd Flowlet/frontend

# Install dependencies using pnpm
pnpm install

# Start the development server
pnpm dev
```

The application will typically be available at `http://localhost:5173` (or another port specified by Vite).

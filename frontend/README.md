# Flowlet Frontend

A comprehensive, production-ready frontend component library and utilities for financial applications, built with React, TypeScript, and modern web technologies.

## 🏦 Financial Industry Standards

This library is designed to meet strict financial industry requirements including:

- **Security**: Bank-level security with proper token management, encryption, and secure storage
- **Compliance**: GDPR, PCI DSS, and AML compliance components
- **Audit Trail**: Comprehensive logging and audit capabilities
- **Performance**: Optimized for high-performance financial applications
- **Accessibility**: WCAG 2.1 AA compliant components
- **Testing**: Extensive test coverage for critical financial operations

## 🚀 Features

### Core Components
- **Authentication**: Secure login, registration, MFA, and biometric authentication
- **Wallet Management**: Balance display, transaction history, money transfers
- **Card Management**: Virtual and physical card controls, spending limits
- **Security**: Real-time fraud detection, security monitoring
- **Compliance**: Built-in compliance tools and reporting
- **Analytics**: Financial insights and spending analytics

### Technical Features
- **TypeScript**: Full type safety for financial data
- **React 19**: Latest React features with concurrent rendering
- **Tailwind CSS**: Utility-first styling with financial design tokens
- **Redux Toolkit**: Predictable state management
- **React Hook Form**: Performant form handling with validation
- **Zod**: Runtime type validation for API responses
- **Axios**: HTTP client with automatic token refresh
- **Recharts**: Financial data visualization

## 📦 Installation

```bash
# Using npm
npm install flowlet-frontend

# Using pnpm
pnpm add flowlet-frontend

# Using yarn
yarn add flowlet-frontend
```

## 🛠️ Usage

### Basic Setup

```tsx
import React from 'react';
import { App, store } from 'flowlet-frontend';
import { Provider } from 'react-redux';

function MyApp() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

export default MyApp;
```

### Using Individual Components

```tsx
import { 
  WalletScreen, 
  TransactionHistory, 
  CardsScreen,
  SendMoney 
} from 'flowlet-frontend';

function Dashboard() {
  return (
    <div>
      <WalletScreen />
      <TransactionHistory />
      <CardsScreen />
    </div>
  );
}
```

### Authentication

```tsx
import { LoginScreen, useAuth } from 'flowlet-frontend';

function AuthenticatedApp() {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <Dashboard user={user} />;
}
```

### API Integration

```tsx
import { api, TokenManager } from 'flowlet-frontend';

// Configure API base URL
const apiClient = api;

// Make authenticated requests
async function getTransactions() {
  try {
    const transactions = await api.get('/api/v1/transactions');
    return transactions;
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
  }
}
```

## 🏗️ Architecture

### Directory Structure

```
frontend/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── pages/           # Page-level components
│   │   ├── wallet/      # Wallet-related pages
│   │   ├── transactions/ # Transaction pages
│   │   └── cards/       # Card management pages
│   ├── security/        # Security components
│   ├── compliance/      # Compliance components
│   └── ui/             # Base UI components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and services
│   └── security/       # Security utilities
├── store/              # Redux store and slices
├── types/              # TypeScript type definitions
└── __tests__/          # Test files
```

### Component Organization

Components are organized by feature and responsibility:

- **Pages**: Complete page components for specific features
- **Auth**: Authentication and authorization components
- **Security**: Security-focused components and utilities
- **Compliance**: Regulatory compliance components
- **UI**: Reusable base components (buttons, forms, etc.)

## 🔐 Security Features

### Token Management
- Secure token storage with automatic refresh
- JWT validation and expiry checking
- Secure logout and session management

### Input Validation
- Client-side validation with Zod schemas
- Sanitization of user inputs
- Protection against XSS and injection attacks

### Error Handling
- Comprehensive error logging
- Secure error messages (no sensitive data exposure)
- Global error boundaries

### Compliance
- GDPR consent management
- PCI DSS compliance utilities
- Audit trail logging
- Data classification and protection

## 📊 Performance

### Optimizations
- Code splitting and lazy loading
- Memoized components and hooks
- Optimized bundle size
- Performance monitoring

### Metrics
- First Contentful Paint (FCP) < 1.5s
- Largest Contentful Paint (LCP) < 2.5s
- Cumulative Layout Shift (CLS) < 0.1
- First Input Delay (FID) < 100ms

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run security tests
npm run test:security

# Run compliance tests
npm run test:compliance
```

### Test Coverage
- Unit tests for all components
- Integration tests for critical flows
- Security tests for authentication and authorization
- Compliance tests for regulatory requirements

## 🚀 Development

### Prerequisites
- Node.js 18+
- npm 8+ or pnpm 8+

### Setup

```bash
# Clone the repository
git clone https://github.com/abrar2030/Flowlet.git
cd Flowlet/frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run linting
pnpm lint

# Run type checking
pnpm type-check
```

### Scripts

- `dev`: Start development server
- `build`: Build for production
- `test`: Run tests
- `lint`: Run ESLint
- `type-check`: Run TypeScript type checking
- `security-audit`: Run security audit

## 📚 Documentation

### Storybook
View component documentation and examples:

```bash
npm run storybook
```

### API Documentation
API documentation is available in the `/docs` directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

### Code Standards
- TypeScript for all new code
- ESLint and Prettier for code formatting
- Comprehensive test coverage
- Security-first development practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

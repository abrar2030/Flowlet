// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  // KYC/User Management
  KYC: {
    CREATE_USER: '/kyc/user/create',
    GET_USER: '/kyc/user',
    UPDATE_USER: '/kyc/user',
    START_VERIFICATION: '/kyc/verification/start',
    SUBMIT_DOCUMENT: '/kyc/verification/{id}/document',
    GET_VERIFICATION_STATUS: '/kyc/verification/{id}/status',
    GET_RISK_ASSESSMENT: '/kyc/user/{id}/risk-assessment',
  },
  
  // Wallet Management
  WALLET: {
    CREATE: '/wallet/create',
    GET_WALLET: '/wallet/{id}',
    GET_BALANCE: '/wallet/{id}/balance',
    GET_TRANSACTIONS: '/wallet/{id}/transactions',
    TRANSFER: '/wallet/{id}/transfer',
    GET_USER_WALLETS: '/wallet/user/{userId}',
    FREEZE: '/wallet/{id}/freeze',
    UNFREEZE: '/wallet/{id}/unfreeze',
  },
  
  // Payment Processing
  PAYMENT: {
    DEPOSIT: '/payment/deposit',
    WITHDRAW: '/payment/withdraw',
    BANK_TRANSFER: '/payment/bank-transfer',
    CARD_PAYMENT: '/payment/card-payment',
    GET_PAYMENT_METHODS: '/payment/methods',
    GET_EXCHANGE_RATES: '/payment/exchange-rates',
  },
  
  // Card Management
  CARD: {
    ISSUE: '/card/issue',
    GET_CARD: '/card/{id}',
    GET_USER_CARDS: '/card/user/{userId}',
    FREEZE: '/card/{id}/freeze',
    UNFREEZE: '/card/{id}/unfreeze',
    UPDATE_LIMITS: '/card/{id}/limits',
    GET_TRANSACTIONS: '/card/{id}/transactions',
    UPDATE_PIN: '/card/{id}/pin',
  },
  
  // Ledger and Analytics
  LEDGER: {
    GET_ENTRIES: '/ledger/entries',
    TRIAL_BALANCE: '/ledger/trial-balance',
    BALANCE_SHEET: '/ledger/balance-sheet',
    INCOME_STATEMENT: '/ledger/income-statement',
    CASH_FLOW: '/ledger/cash-flow-statement',
  },
  
  // AI Services
  AI: {
    FRAUD_DETECTION: '/ai/fraud-detection/analyze',
    CHATBOT_QUERY: '/ai/chatbot/query',
    GET_INSIGHTS: '/ai/insights',
    GET_RECOMMENDATIONS: '/ai/recommendations',
  },
  
  // Security
  SECURITY: {
    CREATE_API_KEY: '/security/api-keys/create',
    GET_API_KEYS: '/security/api-keys',
    REVOKE_API_KEY: '/security/api-keys/{id}/revoke',
    GET_AUDIT_LOGS: '/security/audit-logs',
    TOKENIZE_DATA: '/security/encryption/tokenize',
    SECURITY_SCAN: '/security/scan',
    GET_SECURITY_REPORT: '/security/report',
  },
  
  // API Gateway
  GATEWAY: {
    STATUS: '/gateway/status',
    DOCUMENTATION: '/gateway/documentation',
    SDK_INFO: '/gateway/sdk-info',
    WEBHOOKS_INFO: '/gateway/webhooks/info',
    RATE_LIMITS: '/gateway/rate-limits',
  },
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
};

// Request timeout
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Default headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Error codes
export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

// Storage keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'flowlet_access_token',
  REFRESH_TOKEN: 'flowlet_refresh_token',
  USER_DATA: 'flowlet_user_data',
  THEME: 'flowlet_theme',
  LANGUAGE: 'flowlet_language',
  BIOMETRIC_ENABLED: 'flowlet_biometric_enabled',
  PUSH_NOTIFICATIONS: 'flowlet_push_notifications',
  OFFLINE_DATA: 'flowlet_offline_data',
};

// App configuration
export const APP_CONFIG = {
  APP_NAME: 'Flowlet',
  VERSION: '1.0.0',
  SUPPORTED_CURRENCIES: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  SUPPORTED_LANGUAGES: ['en', 'es', 'fr', 'de', 'it'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  PAGINATION_LIMIT: 20,
  REFRESH_INTERVAL: 30000, // 30 seconds
};

// Theme configuration
export const THEME_CONFIG = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

// Transaction types
export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  TRANSFER: 'transfer',
  CARD_PAYMENT: 'card_payment',
  REFUND: 'refund',
  FEE: 'fee',
};

// Transaction status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

// Card types
export const CARD_TYPES = {
  VIRTUAL: 'virtual',
  PHYSICAL: 'physical',
};

// Card status
export const CARD_STATUS = {
  ACTIVE: 'active',
  FROZEN: 'frozen',
  BLOCKED: 'blocked',
  EXPIRED: 'expired',
};

// KYC verification levels
export const KYC_LEVELS = {
  BASIC: 'basic',
  ENHANCED: 'enhanced',
  PREMIUM: 'premium',
};

// KYC status
export const KYC_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
};

// Wallet types
export const WALLET_TYPES = {
  USER: 'user',
  BUSINESS: 'business',
  ESCROW: 'escrow',
  OPERATING: 'operating',
};

// Payment methods
export const PAYMENT_METHODS = {
  BANK_TRANSFER: 'bank_transfer',
  CARD: 'card',
  DIGITAL_WALLET: 'digital_wallet',
  CRYPTO: 'crypto',
};

// Fraud alert levels
export const FRAUD_ALERT_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  HTTP_METHODS,
  REQUEST_TIMEOUT,
  DEFAULT_HEADERS,
  ERROR_CODES,
  STORAGE_KEYS,
  APP_CONFIG,
  THEME_CONFIG,
  NOTIFICATION_TYPES,
  TRANSACTION_TYPES,
  TRANSACTION_STATUS,
  CARD_TYPES,
  CARD_STATUS,
  KYC_LEVELS,
  KYC_STATUS,
  WALLET_TYPES,
  PAYMENT_METHODS,
  FRAUD_ALERT_LEVELS,
};


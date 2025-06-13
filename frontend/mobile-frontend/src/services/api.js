import { API_BASE_URL, API_ENDPOINTS, DEFAULT_HEADERS, REQUEST_TIMEOUT, ERROR_CODES, STORAGE_KEYS } from './constants.js';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.timeout = REQUEST_TIMEOUT;
    this.defaultHeaders = DEFAULT_HEADERS;
  }

  // Get stored auth token
  getAuthToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  // Set auth token
  setAuthToken(token) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  // Remove auth token
  removeAuthToken() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  // Get headers with auth token
  getHeaders(customHeaders = {}) {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    const token = this.getAuthToken();
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  // Handle API response
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const error = new Error(data.error || data.message || 'API request failed');
      error.status = response.status;
      error.code = this.getErrorCode(response.status);
      error.data = data;
      throw error;
    }

    return data;
  }

  // Get error code based on status
  getErrorCode(status) {
    switch (status) {
      case 401:
        return ERROR_CODES.UNAUTHORIZED;
      case 403:
        return ERROR_CODES.FORBIDDEN;
      case 404:
        return ERROR_CODES.NOT_FOUND;
      case 422:
        return ERROR_CODES.VALIDATION_ERROR;
      case 500:
        return ERROR_CODES.SERVER_ERROR;
      default:
        return ERROR_CODES.UNKNOWN_ERROR;
    }
  }

  // Replace URL parameters
  replaceUrlParams(url, params = {}) {
    let replacedUrl = url;
    Object.keys(params).forEach(key => {
      replacedUrl = replacedUrl.replace(`{${key}}`, params[key]);
    });
    return replacedUrl;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      data = null,
      params = {},
      headers = {},
      timeout = this.timeout,
    } = options;

    const url = this.replaceUrlParams(endpoint, params);
    const fullUrl = `${this.baseURL}${url}`;

    const config = {
      method,
      headers: this.getHeaders(headers),
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      config.signal = controller.signal;

      const response = await fetch(fullUrl, config);
      clearTimeout(timeoutId);

      return await this.handleResponse(response);
    } catch (error) {
      if (error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        timeoutError.code = ERROR_CODES.TIMEOUT_ERROR;
        throw timeoutError;
      }

      if (!navigator.onLine) {
        const networkError = new Error('Network error - please check your connection');
        networkError.code = ERROR_CODES.NETWORK_ERROR;
        throw networkError;
      }

      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET', params });
  }

  // POST request
  async post(endpoint, data = null, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', data });
  }

  // PUT request
  async put(endpoint, data = null, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', data });
  }

  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // PATCH request
  async patch(endpoint, data = null, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', data });
  }
}

// Create singleton instance
const apiService = new ApiService();

// Authentication API
export const authAPI = {
  login: (credentials) => apiService.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  register: (userData) => apiService.post(API_ENDPOINTS.AUTH.REGISTER, userData),
  logout: () => apiService.post(API_ENDPOINTS.AUTH.LOGOUT),
  refreshToken: (refreshToken) => apiService.post(API_ENDPOINTS.AUTH.REFRESH, { refresh_token: refreshToken }),
  verifyEmail: (token) => apiService.post(API_ENDPOINTS.AUTH.VERIFY_EMAIL, { token }),
  forgotPassword: (email) => apiService.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email }),
  resetPassword: (token, password) => apiService.post(API_ENDPOINTS.AUTH.RESET_PASSWORD, { token, password }),
};

// KYC API
export const kycAPI = {
  createUser: (userData) => apiService.post(API_ENDPOINTS.KYC.CREATE_USER, userData),
  getUser: (userId) => apiService.get(API_ENDPOINTS.KYC.GET_USER, { id: userId }),
  updateUser: (userId, userData) => apiService.put(API_ENDPOINTS.KYC.UPDATE_USER, userData, { params: { id: userId } }),
  startVerification: (userId, level) => apiService.post(API_ENDPOINTS.KYC.START_VERIFICATION, { user_id: userId, verification_level: level }),
  submitDocument: (verificationId, documentData) => apiService.post(API_ENDPOINTS.KYC.SUBMIT_DOCUMENT, documentData, { params: { id: verificationId } }),
  getVerificationStatus: (verificationId) => apiService.get(API_ENDPOINTS.KYC.GET_VERIFICATION_STATUS, { id: verificationId }),
  getRiskAssessment: (userId) => apiService.get(API_ENDPOINTS.KYC.GET_RISK_ASSESSMENT, { id: userId }),
};

// Wallet API
export const walletAPI = {
  create: (walletData) => apiService.post(API_ENDPOINTS.WALLET.CREATE, walletData),
  getWallet: (walletId) => apiService.get(API_ENDPOINTS.WALLET.GET_WALLET, { id: walletId }),
  getBalance: (walletId) => apiService.get(API_ENDPOINTS.WALLET.GET_BALANCE, { id: walletId }),
  getTransactions: (walletId, page = 1, perPage = 20) => apiService.get(API_ENDPOINTS.WALLET.GET_TRANSACTIONS, { id: walletId }, { 
    params: { page, per_page: perPage } 
  }),
  transfer: (walletId, transferData) => apiService.post(API_ENDPOINTS.WALLET.TRANSFER, transferData, { params: { id: walletId } }),
  getUserWallets: (userId) => apiService.get(API_ENDPOINTS.WALLET.GET_USER_WALLETS, { userId }),
  freeze: (walletId) => apiService.post(API_ENDPOINTS.WALLET.FREEZE, {}, { params: { id: walletId } }),
  unfreeze: (walletId) => apiService.post(API_ENDPOINTS.WALLET.UNFREEZE, {}, { params: { id: walletId } }),
};

// Payment API
export const paymentAPI = {
  deposit: (depositData) => apiService.post(API_ENDPOINTS.PAYMENT.DEPOSIT, depositData),
  withdraw: (withdrawData) => apiService.post(API_ENDPOINTS.PAYMENT.WITHDRAW, withdrawData),
  bankTransfer: (transferData) => apiService.post(API_ENDPOINTS.PAYMENT.BANK_TRANSFER, transferData),
  cardPayment: (paymentData) => apiService.post(API_ENDPOINTS.PAYMENT.CARD_PAYMENT, paymentData),
  getPaymentMethods: () => apiService.get(API_ENDPOINTS.PAYMENT.GET_PAYMENT_METHODS),
  getExchangeRates: (baseCurrency = 'USD') => apiService.get(API_ENDPOINTS.PAYMENT.GET_EXCHANGE_RATES, { base: baseCurrency }),
};

// Card API
export const cardAPI = {
  issue: (cardData) => apiService.post(API_ENDPOINTS.CARD.ISSUE, cardData),
  getCard: (cardId) => apiService.get(API_ENDPOINTS.CARD.GET_CARD, { id: cardId }),
  getUserCards: (userId) => apiService.get(API_ENDPOINTS.CARD.GET_USER_CARDS, { userId }),
  freeze: (cardId) => apiService.post(API_ENDPOINTS.CARD.FREEZE, {}, { params: { id: cardId } }),
  unfreeze: (cardId) => apiService.post(API_ENDPOINTS.CARD.UNFREEZE, {}, { params: { id: cardId } }),
  updateLimits: (cardId, limits) => apiService.put(API_ENDPOINTS.CARD.UPDATE_LIMITS, limits, { params: { id: cardId } }),
  getTransactions: (cardId, page = 1, perPage = 20) => apiService.get(API_ENDPOINTS.CARD.GET_TRANSACTIONS, { id: cardId }, {
    params: { page, per_page: perPage }
  }),
  updatePin: (cardId, pinData) => apiService.put(API_ENDPOINTS.CARD.UPDATE_PIN, pinData, { params: { id: cardId } }),
};

// Ledger API
export const ledgerAPI = {
  getEntries: (filters = {}) => apiService.get(API_ENDPOINTS.LEDGER.GET_ENTRIES, filters),
  getTrialBalance: (asOfDate, currency = 'USD') => apiService.get(API_ENDPOINTS.LEDGER.TRIAL_BALANCE, { as_of_date: asOfDate, currency }),
  getBalanceSheet: (asOfDate, currency = 'USD') => apiService.get(API_ENDPOINTS.LEDGER.BALANCE_SHEET, { as_of_date: asOfDate, currency }),
  getIncomeStatement: (startDate, endDate, currency = 'USD') => apiService.get(API_ENDPOINTS.LEDGER.INCOME_STATEMENT, { 
    start_date: startDate, end_date: endDate, currency 
  }),
  getCashFlow: (startDate, endDate, currency = 'USD') => apiService.get(API_ENDPOINTS.LEDGER.CASH_FLOW, { 
    start_date: startDate, end_date: endDate, currency 
  }),
};

// AI API
export const aiAPI = {
  analyzeFraud: (transactionData) => apiService.post(API_ENDPOINTS.AI.FRAUD_DETECTION, transactionData),
  chatbotQuery: (query, context = 'user') => apiService.post(API_ENDPOINTS.AI.CHATBOT_QUERY, { query, context }),
  getInsights: (userId) => apiService.get(API_ENDPOINTS.AI.GET_INSIGHTS, { user_id: userId }),
  getRecommendations: (userId) => apiService.get(API_ENDPOINTS.AI.GET_RECOMMENDATIONS, { user_id: userId }),
};

// Security API
export const securityAPI = {
  createApiKey: (keyData) => apiService.post(API_ENDPOINTS.SECURITY.CREATE_API_KEY, keyData),
  getApiKeys: () => apiService.get(API_ENDPOINTS.SECURITY.GET_API_KEYS),
  revokeApiKey: (keyId) => apiService.post(API_ENDPOINTS.SECURITY.REVOKE_API_KEY, {}, { params: { id: keyId } }),
  getAuditLogs: (filters = {}) => apiService.get(API_ENDPOINTS.SECURITY.GET_AUDIT_LOGS, filters),
  tokenizeData: (sensitiveData, dataType) => apiService.post(API_ENDPOINTS.SECURITY.TOKENIZE_DATA, { 
    sensitive_data: sensitiveData, data_type: dataType 
  }),
  securityScan: (scanType, targetId) => apiService.post(API_ENDPOINTS.SECURITY.SECURITY_SCAN, { 
    scan_type: scanType, target_id: targetId 
  }),
  getSecurityReport: (days = 30) => apiService.get(API_ENDPOINTS.SECURITY.GET_SECURITY_REPORT, { days }),
};

// Gateway API
export const gatewayAPI = {
  getStatus: () => apiService.get(API_ENDPOINTS.GATEWAY.STATUS),
  getDocumentation: () => apiService.get(API_ENDPOINTS.GATEWAY.DOCUMENTATION),
  getSdkInfo: () => apiService.get(API_ENDPOINTS.GATEWAY.SDK_INFO),
  getWebhooksInfo: () => apiService.get(API_ENDPOINTS.GATEWAY.WEBHOOKS_INFO),
  getRateLimits: () => apiService.get(API_ENDPOINTS.GATEWAY.RATE_LIMITS),
};

// Analytics API
export const analyticsAPI = {
  getTransactionAnalytics: (params) => apiService.get('/analytics/transactions', params),
  getSpendingAnalytics: (params) => apiService.get('/analytics/spending', params),
  getBudgetAnalytics: (params) => apiService.get('/analytics/budgets', params),
  getGoalAnalytics: (params) => apiService.get('/analytics/goals', params),
  getInsights: (params) => apiService.get('/analytics/insights', params),
};

export default apiService;


// User API (alias for KYC API for backward compatibility)
export const userAPI = {
  ...kycAPI,
  getProfile: (userId) => kycAPI.getUser(userId),
  updateProfile: (userId, userData) => kycAPI.updateUser(userId, userData),
  createProfile: (userData) => kycAPI.createUser(userData),
};


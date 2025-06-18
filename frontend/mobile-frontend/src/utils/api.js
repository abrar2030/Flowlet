// Enhanced API utilities for financial applications
import { SecurityUtils } from './security.js';

// API Configuration
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  maxRetryDelay: 5000
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

// Custom API Error class
class APIError extends Error {
  constructor(message, status, code, details = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Request interceptor for adding authentication and security headers
const addSecurityHeaders = (config) => {
  const token = localStorage.getItem('accessToken');
  const deviceId = SecurityUtils.generateDeviceFingerprint();
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Device-ID': deviceId,
    'X-Request-ID': SecurityUtils.generateSessionToken(),
    'X-Timestamp': Date.now().toString(),
    ...config.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return { ...config, headers };
};

// Response interceptor for handling common scenarios
const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type');
  let data;
  
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }
  
  if (!response.ok) {
    const error = new APIError(
      data.message || `HTTP ${response.status}: ${response.statusText}`,
      response.status,
      data.code || 'UNKNOWN_ERROR',
      data.details || null
    );
    
    // Handle specific error cases
    if (response.status === HTTP_STATUS.UNAUTHORIZED) {
      // Token expired or invalid
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    
    throw error;
  }
  
  return data;
};

// Retry mechanism with exponential backoff
const retryRequest = async (requestFn, maxAttempts = API_CONFIG.retryAttempts) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) except for rate limiting
      if (error.status >= 400 && error.status < 500 && error.status !== HTTP_STATUS.TOO_MANY_REQUESTS) {
        throw error;
      }
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        API_CONFIG.retryDelay * Math.pow(2, attempt - 1),
        API_CONFIG.maxRetryDelay
      );
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Main API client
export class APIClient {
  constructor(config = {}) {
    this.config = { ...API_CONFIG, ...config };
    this.abortControllers = new Map();
  }
  
  // Generic request method
  async request(endpoint, options = {}) {
    const requestId = SecurityUtils.generateSessionToken();
    const controller = new AbortController();
    this.abortControllers.set(requestId, controller);
    
    try {
      const config = addSecurityHeaders({
        method: 'GET',
        ...options,
        signal: controller.signal
      });
      
      const url = `${this.config.baseURL}${endpoint}`;
      
      const requestFn = async () => {
        const response = await fetch(url, {
          ...config,
          timeout: this.config.timeout
        });
        return handleResponse(response);
      };
      
      const result = await retryRequest(requestFn, this.config.retryAttempts);
      return result;
    } finally {
      this.abortControllers.delete(requestId);
    }
  }
  
  // GET request
  async get(endpoint, params = {}, options = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, {
      method: 'GET',
      ...options
    });
  }
  
  // POST request
  async post(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      ...options
    });
  }
  
  // PUT request
  async put(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      ...options
    });
  }
  
  // PATCH request
  async patch(endpoint, data = {}, options = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
      ...options
    });
  }
  
  // DELETE request
  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: 'DELETE',
      ...options
    });
  }
  
  // Upload file
  async upload(endpoint, file, additionalData = {}, onProgress = null) {
    const formData = new FormData();
    formData.append('file', file);
    
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    
    const config = addSecurityHeaders({
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
    
    // Remove Content-Type header to let browser set it with boundary
    delete config.headers['Content-Type'];
    
    const url = `${this.config.baseURL}${endpoint}`;
    
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });
      
      xhr.addEventListener('load', async () => {
        try {
          const response = new Response(xhr.response, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: new Headers(xhr.getAllResponseHeaders().split('\r\n').reduce((headers, line) => {
              const [key, value] = line.split(': ');
              if (key && value) headers[key] = value;
              return headers;
            }, {}))
          });
          
          const result = await handleResponse(response);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new APIError('Upload failed', 0, 'UPLOAD_ERROR'));
      });
      
      xhr.open('POST', url);
      
      // Set headers
      Object.entries(config.headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      xhr.send(formData);
    });
  }
  
  // Cancel all pending requests
  cancelAllRequests() {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }
  
  // Cancel specific request
  cancelRequest(requestId) {
    const controller = this.abortControllers.get(requestId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(requestId);
    }
  }
}

// Financial API endpoints
export class FinancialAPI extends APIClient {
  // Authentication endpoints
  async login(credentials) {
    return this.post('/auth/login', {
      ...credentials,
      deviceFingerprint: SecurityUtils.generateDeviceFingerprint()
    });
  }
  
  async register(userData) {
    return this.post('/auth/register', userData);
  }
  
  async refreshToken(refreshToken) {
    return this.post('/auth/refresh', { refreshToken });
  }
  
  async logout() {
    return this.post('/auth/logout');
  }
  
  async verifyMFA(code, sessionId) {
    return this.post('/auth/mfa/verify', { code, sessionId });
  }
  
  // Account endpoints
  async getAccounts() {
    return this.get('/accounts');
  }
  
  async getAccount(accountId) {
    return this.get(`/accounts/${accountId}`);
  }
  
  async getAccountBalance(accountId) {
    return this.get(`/accounts/${accountId}/balance`);
  }
  
  async getAccountTransactions(accountId, params = {}) {
    return this.get(`/accounts/${accountId}/transactions`, params);
  }
  
  // Transaction endpoints
  async createTransaction(transactionData) {
    return this.post('/transactions', transactionData);
  }
  
  async getTransaction(transactionId) {
    return this.get(`/transactions/${transactionId}`);
  }
  
  async getTransactions(params = {}) {
    return this.get('/transactions', params);
  }
  
  async cancelTransaction(transactionId) {
    return this.patch(`/transactions/${transactionId}/cancel`);
  }
  
  // Card endpoints
  async getCards() {
    return this.get('/cards');
  }
  
  async getCard(cardId) {
    return this.get(`/cards/${cardId}`);
  }
  
  async createCard(cardData) {
    return this.post('/cards', cardData);
  }
  
  async activateCard(cardId, activationData) {
    return this.patch(`/cards/${cardId}/activate`, activationData);
  }
  
  async blockCard(cardId, reason) {
    return this.patch(`/cards/${cardId}/block`, { reason });
  }
  
  async unblockCard(cardId) {
    return this.patch(`/cards/${cardId}/unblock`);
  }
  
  // Payment endpoints
  async initiatePayment(paymentData) {
    return this.post('/payments', paymentData);
  }
  
  async confirmPayment(paymentId, confirmationData) {
    return this.patch(`/payments/${paymentId}/confirm`, confirmationData);
  }
  
  async getPaymentStatus(paymentId) {
    return this.get(`/payments/${paymentId}/status`);
  }
  
  // Security endpoints
  async changePassword(passwordData) {
    return this.patch('/security/password', passwordData);
  }
  
  async enableMFA(mfaData) {
    return this.post('/security/mfa/enable', mfaData);
  }
  
  async disableMFA(confirmationData) {
    return this.post('/security/mfa/disable', confirmationData);
  }
  
  async getSecuritySettings() {
    return this.get('/security/settings');
  }
  
  async updateSecuritySettings(settings) {
    return this.patch('/security/settings', settings);
  }
  
  // Analytics endpoints
  async getSpendingAnalytics(params = {}) {
    return this.get('/analytics/spending', params);
  }
  
  async getIncomeAnalytics(params = {}) {
    return this.get('/analytics/income', params);
  }
  
  async getBudgetAnalytics(params = {}) {
    return this.get('/analytics/budget', params);
  }
  
  // Notification endpoints
  async getNotifications(params = {}) {
    return this.get('/notifications', params);
  }
  
  async markNotificationRead(notificationId) {
    return this.patch(`/notifications/${notificationId}/read`);
  }
  
  async updateNotificationSettings(settings) {
    return this.patch('/notifications/settings', settings);
  }
}

// Create singleton instance
export const financialAPI = new FinancialAPI();

// Error handling utilities
export const APIErrorHandler = {
  // Handle API errors with user-friendly messages
  handleError: (error) => {
    if (error instanceof APIError) {
      switch (error.status) {
        case HTTP_STATUS.BAD_REQUEST:
          return 'Invalid request. Please check your input and try again.';
        case HTTP_STATUS.UNAUTHORIZED:
          return 'Your session has expired. Please log in again.';
        case HTTP_STATUS.FORBIDDEN:
          return 'You do not have permission to perform this action.';
        case HTTP_STATUS.NOT_FOUND:
          return 'The requested resource was not found.';
        case HTTP_STATUS.CONFLICT:
          return 'This action conflicts with the current state. Please refresh and try again.';
        case HTTP_STATUS.UNPROCESSABLE_ENTITY:
          return error.details?.message || 'The provided data is invalid.';
        case HTTP_STATUS.TOO_MANY_REQUESTS:
          return 'Too many requests. Please wait a moment and try again.';
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          return 'A server error occurred. Please try again later.';
        case HTTP_STATUS.SERVICE_UNAVAILABLE:
          return 'Service is temporarily unavailable. Please try again later.';
        default:
          return error.message || 'An unexpected error occurred.';
      }
    }
    
    if (error.name === 'AbortError') {
      return 'Request was cancelled.';
    }
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    return 'An unexpected error occurred. Please try again.';
  },
  
  // Check if error is retryable
  isRetryable: (error) => {
    if (!(error instanceof APIError)) return false;
    
    return [
      HTTP_STATUS.TOO_MANY_REQUESTS,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      HTTP_STATUS.SERVICE_UNAVAILABLE
    ].includes(error.status);
  },
  
  // Log error for monitoring
  logError: (error, context = {}) => {
    const errorLog = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        status: error.status,
        code: error.code,
        stack: error.stack
      },
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // In production, send to error monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service (e.g., Sentry, LogRocket)
      console.error('API Error:', errorLog);
    } else {
      console.error('API Error:', errorLog);
    }
  }
};

export default { APIClient, FinancialAPI, financialAPI, APIError, APIErrorHandler };


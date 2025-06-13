// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : 'http://localhost:5001';

// API Service Class
class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    return this.request('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(email, password) {
    return this.request('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request('/api/v1/auth/profile');
  }

  async updateProfile(userData) {
    return this.request('/api/v1/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async verifyToken() {
    return this.request('/api/v1/auth/verify-token', {
      method: 'POST',
    });
  }

  // Wallet methods
  async createWallet(walletData) {
    return this.request('/api/v1/wallet/create', {
      method: 'POST',
      body: JSON.stringify(walletData),
    });
  }

  async getWallet(walletId) {
    return this.request(`/api/v1/wallet/${walletId}`);
  }

  async getWalletBalance(walletId) {
    return this.request(`/api/v1/wallet/${walletId}/balance`);
  }

  async getWalletTransactions(walletId, page = 1, perPage = 20) {
    return this.request(`/api/v1/wallet/${walletId}/transactions?page=${page}&per_page=${perPage}`);
  }

  async getUserWallets(userId) {
    return this.request(`/api/v1/wallet/user/${userId}`);
  }

  async transferFunds(walletId, transferData) {
    return this.request(`/api/v1/wallet/${walletId}/transfer`, {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  }

  async freezeWallet(walletId) {
    return this.request(`/api/v1/wallet/${walletId}/freeze`, {
      method: 'POST',
    });
  }

  async unfreezeWallet(walletId) {
    return this.request(`/api/v1/wallet/${walletId}/unfreeze`, {
      method: 'POST',
    });
  }

  // Payment methods
  async processPayment(paymentData) {
    return this.request('/api/v1/payment/process', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getPaymentHistory(userId, page = 1, perPage = 20) {
    return this.request(`/api/v1/payment/history/${userId}?page=${page}&per_page=${perPage}`);
  }

  async getPaymentStatus(paymentId) {
    return this.request(`/api/v1/payment/status/${paymentId}`);
  }

  // Card methods
  async createCard(cardData) {
    return this.request('/api/v1/card/create', {
      method: 'POST',
      body: JSON.stringify(cardData),
    });
  }

  async getUserCards(userId) {
    return this.request(`/api/v1/card/user/${userId}`);
  }

  async getCard(cardId) {
    return this.request(`/api/v1/card/${cardId}`);
  }

  async updateCardControls(cardId, controls) {
    return this.request(`/api/v1/card/${cardId}/controls`, {
      method: 'PUT',
      body: JSON.stringify(controls),
    });
  }

  async freezeCard(cardId) {
    return this.request(`/api/v1/card/${cardId}/freeze`, {
      method: 'POST',
    });
  }

  async unfreezeCard(cardId) {
    return this.request(`/api/v1/card/${cardId}/unfreeze`, {
      method: 'POST',
    });
  }

  // KYC methods
  async submitKYC(kycData) {
    return this.request('/api/v1/kyc/submit', {
      method: 'POST',
      body: JSON.stringify(kycData),
    });
  }

  async getKYCStatus(userId) {
    return this.request(`/api/v1/kyc/status/${userId}`);
  }

  async uploadKYCDocument(userId, documentData) {
    return this.request(`/api/v1/kyc/upload/${userId}`, {
      method: 'POST',
      body: JSON.stringify(documentData),
    });
  }

  // Analytics methods
  async getDashboardAnalytics(userId) {
    return this.request(`/api/v1/analytics/dashboard/${userId}`);
  }

  async getTransactionAnalytics(userId, period = '30d') {
    return this.request(`/api/v1/analytics/transactions/${userId}?period=${period}`);
  }

  async getSpendingAnalytics(userId, period = '30d') {
    return this.request(`/api/v1/analytics/spending/${userId}?period=${period}`);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export individual methods for convenience
export const {
  setToken,
  register,
  login,
  getProfile,
  updateProfile,
  verifyToken,
  createWallet,
  getWallet,
  getWalletBalance,
  getWalletTransactions,
  getUserWallets,
  transferFunds,
  freezeWallet,
  unfreezeWallet,
  processPayment,
  getPaymentHistory,
  getPaymentStatus,
  createCard,
  getUserCards,
  getCard,
  updateCardControls,
  freezeCard,
  unfreezeCard,
  submitKYC,
  getKYCStatus,
  uploadKYCDocument,
  getDashboardAnalytics,
  getTransactionAnalytics,
  getSpendingAnalytics,
} = apiService;


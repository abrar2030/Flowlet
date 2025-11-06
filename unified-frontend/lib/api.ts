// Improved API Client Configuration for Flowlet Frontend
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Utility function for safe base64 decoding (JWT payload)
const safeB64Decode = (str: string): string => {
  try {
    // Replace characters that might be missing in a URL-safe base64 string
    const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with '=' until it's a multiple of 4
    const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    return atob(padded);
  } catch (e) {
    console.error('Base64 decoding failed:', e);
    return '{}'; // Return empty object string on failure
  }
};

// API Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Create axios instance
const apiClient: AxiosInstance = axios.create(API_CONFIG);

// Improved Token Manager with better security practices
class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = 'flowlet_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'flowlet_refresh_token';
  private static readonly USER_KEY = 'flowlet_user';
  private static readonly TOKEN_EXPIRY_BUFFER = 5 * 60 * 1000; // 5 minutes buffer

  // Check if secure storage is available (for sensitive tokens)
  private static isSecureStorageAvailable(): boolean {
    return typeof window !== 'undefined' && 'crypto' in window && 'subtle' in window.crypto;
  }

  static getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve access token:', error);
      return null;
    }
  }

  static setAccessToken(token: string): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store access token:', error);
    }
  }

  static getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to retrieve refresh token:', error);
      return null;
    }
  }

  static setRefreshToken(token: string): void {
    try {
      localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to store refresh token:', error);
    }
  }

  static getUser(): any {
    try {
      const user = localStorage.getItem(this.USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Failed to retrieve user data:', error);
      return null;
    }
  }

  static setUser(user: any): void {
    try {
      // Sanitize user data before storing
      const sanitizedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        // Exclude sensitive information
      };
      localStorage.setItem(this.USER_KEY, JSON.stringify(sanitizedUser));
    } catch (error) {
      console.error('Failed to store user data:', error);
    }
  }

  static clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('Failed to clear tokens:', error);
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      if (!token) return true;
      
      const payload = JSON.parse(safeB64Decode(token.split('.')[1]));
      const currentTime = Date.now();
      const expiryTime = (payload.exp * 1000) - this.TOKEN_EXPIRY_BUFFER;
      
      return currentTime >= expiryTime;
    } catch (error) {
      console.error('Failed to parse token:', error);
      return true;
    }
  }

  static getTokenExpiryTime(token: string): number | null {
    try {
      if (!token) return null;
      const payload = JSON.parse(safeB64Decode(token.split('.')[1]));
      return payload.exp * 1000;
    } catch (error) {
      console.error('Failed to get token expiry:', error);
      return null;
    }
  }
}

// Request interceptor to add auth token and security headers
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    if (token && !TokenManager.isTokenExpired(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add security headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['X-Client-Version'] = import.meta.env.VITE_APP_VERSION || '1.0.0';
    
    // Add CSRF token if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh and error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized responses
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = TokenManager.getRefreshToken();
      if (refreshToken && !TokenManager.isTokenExpired(refreshToken)) {
        try {
          const response = await axios.post(`${API_CONFIG.baseURL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data.data;
          TokenManager.setAccessToken(access_token);
          
          if (newRefreshToken) {
            TokenManager.setRefreshToken(newRefreshToken);
          }

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return apiClient(originalRequest);
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          TokenManager.clearTokens();
          
          // Dispatch custom event for auth failure
          window.dispatchEvent(new CustomEvent('auth:logout', { 
            detail: { reason: 'token_refresh_failed' } 
          }));
          
          return Promise.reject(refreshError);
        }
      } else {
        TokenManager.clearTokens();
        window.dispatchEvent(new CustomEvent('auth:logout', { 
          detail: { reason: 'no_valid_refresh_token' } 
        }));
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      if (retryAfter && !originalRequest._retryCount) {
        originalRequest._retryCount = 1;
        const delay = parseInt(retryAfter) * 1000;
        
        return new Promise((resolve) => {
          setTimeout(() => resolve(apiClient(originalRequest)), delay);
        });
      }
    }

    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
  meta?: {
    timestamp: string;
    request_id: string;
    version: string;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    per_page: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Improved API Error Class
export class ApiError extends Error {
  public status: number;
  public data: any;
  public requestId?: string;
  public timestamp: string;

  constructor(message: string, status: number, data?: any, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      data: this.data,
      requestId: this.requestId,
      timestamp: this.timestamp,
    };
  }
}

// Improved API Service with better error handling and logging
class ApiService {
  private logError(error: ApiError, context?: string): void {
    const errorLog = {
      ...error.toJSON(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // In production, send to error reporting service
    if (import.meta.env.PROD) {
      // Example: Sentry, LogRocket, etc.
      console.error('API Error:', errorLog);
    } else {
      console.error('API Error:', errorLog);
    }
  }

  private async handleResponse<T>(response: AxiosResponse): Promise<T> {
    if (response.data.success) {
      return response.data.data;
    } else {
      const error = new ApiError(
        response.data.message || 'API request failed',
        response.status,
        response.data,
        response.data.meta?.request_id
      );
      this.logError(error, 'API Response Error');
      throw error;
    }
  }

  private async handleError(error: any, context?: string): Promise<never> {
    let apiError: ApiError;

    if (error.response) {
      // Server responded with error status
      apiError = new ApiError(
        error.response.data?.message || `HTTP ${error.response.status} Error`,
        error.response.status,
        error.response.data,
        error.response.data?.meta?.request_id
      );
    } else if (error.request) {
      // Network error
      apiError = new ApiError(
        'Network error - please check your connection',
        0,
        { type: 'network_error' }
      );
    } else {
      // Other error
      apiError = new ApiError(
        error.message || 'Unknown error occurred',
        0,
        { type: 'unknown_error' }
      );
    }

    this.logError(apiError, context);
    throw apiError;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.get(url, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error, `GET ${url}`);
    }
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.post(url, data, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error, `POST ${url}`);
    }
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.put(url, data, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error, `PUT ${url}`);
    }
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.patch(url, data, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error, `PATCH ${url}`);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await apiClient.delete(url, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError(error, `DELETE ${url}`);
    }
  }

  // Utility method for file uploads
  async uploadFile<T>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    return this.post<T>(url, formData, config);
  }
}

// Health check utility
export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health');
    return true;
  } catch {
    return false;
  }
};

// Export instances
export const api = new ApiService();
export { TokenManager };
export default apiClient;


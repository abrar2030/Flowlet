import { 
  LoginCredentials, 
  RegisterData, 
  ApiResponse, 
  User 
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

const apiClient = new ApiClient(API_BASE_URL);

// Auth API
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> => {
    // Mock implementation for demo purposes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (credentials.email === 'demo@flowlet.com' && credentials.password === 'demo123') {
      return {
        success: true,
        data: {
          user: {
            id: '1',
            email: credentials.email,
            name: 'Demo User',
            avatar: '',
            role: 'user' as any,
            preferences: {
              theme: 'system',
              language: 'en',
              currency: 'USD',
              notifications: {
                email: true,
                push: true,
                sms: false,
                transactionAlerts: true,
                securityAlerts: true,
                marketingEmails: false,
              },
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token: 'demo-jwt-token-' + Date.now(),
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    throw new Error('Invalid credentials');
  },

  register: async (userData: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      data: {
        user: {
          id: Date.now().toString(),
          email: userData.email,
          name: userData.name,
          avatar: '',
          role: 'user' as any,
          preferences: {
            theme: 'system',
            language: 'en',
            currency: 'USD',
            notifications: {
              email: true,
              push: true,
              sms: false,
              transactionAlerts: true,
              securityAlerts: true,
              marketingEmails: false,
            },
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'demo-jwt-token-' + Date.now(),
      },
      timestamp: new Date().toISOString(),
    };
  },

  logout: async (): Promise<ApiResponse> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString(),
    };
  },

  validateToken: async (token: string): Promise<ApiResponse<{ user: User; token: string }>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (token.startsWith('demo-jwt-token-')) {
      return {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'demo@flowlet.com',
            name: 'Demo User',
            avatar: '',
            role: 'user' as any,
            preferences: {
              theme: 'system',
              language: 'en',
              currency: 'USD',
              notifications: {
                email: true,
                push: true,
                sms: false,
                transactionAlerts: true,
                securityAlerts: true,
                marketingEmails: false,
              },
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          token,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    throw new Error('Invalid token');
  },

  refreshToken: async (): Promise<ApiResponse<{ user: User; token: string }>> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      data: {
        user: {
          id: '1',
          email: 'demo@flowlet.com',
          name: 'Demo User',
          avatar: '',
          role: 'user' as any,
          preferences: {
            theme: 'system',
            language: 'en',
            currency: 'USD',
            notifications: {
              email: true,
              push: true,
              sms: false,
              transactionAlerts: true,
              securityAlerts: true,
              marketingEmails: false,
            },
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        token: 'demo-jwt-token-' + Date.now(),
      },
      timestamp: new Date().toISOString(),
    };
  },
};

export default apiClient;


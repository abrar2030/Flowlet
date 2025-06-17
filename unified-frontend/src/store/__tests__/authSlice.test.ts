import { describe, it, expect, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { 
  loginUser, 
  registerUser, 
  logoutUser, 
  validateToken,
  clearError,
  updateUser 
} from '@/store/authSlice';
import { authApi } from '@/lib/api';

// Mock the API
vi.mock('@/lib/api', () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    validateToken: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: authReducer,
    },
    preloadedState: {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        ...initialState,
      },
    },
  });
};

describe('authSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('reducers', () => {
    it('should handle clearError', () => {
      const initialState = {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Some error',
      };

      const action = clearError();
      const newState = authReducer(initialState, action);

      expect(newState.error).toBeNull();
    });

    it('should handle updateUser', () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        avatar: '',
        role: 'user' as const,
        preferences: {
          theme: 'light' as const,
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
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      const initialState = {
        user: mockUser,
        token: 'token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      const updates = { name: 'Updated Name' };
      const action = updateUser(updates);
      const newState = authReducer(initialState, action);

      expect(newState.user?.name).toBe('Updated Name');
      expect(newState.user?.email).toBe('test@example.com'); // Other fields unchanged
    });
  });

  describe('async thunks', () => {
    it('should handle successful login', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            avatar: '',
            role: 'user' as const,
            preferences: {
              theme: 'light' as const,
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
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
          token: 'test-token',
        },
        timestamp: '2023-01-01T00:00:00Z',
      };

      vi.mocked(authApi.login).mockResolvedValue(mockResponse);

      const store = createTestStore();
      const credentials = { email: 'test@example.com', password: 'password' };

      await store.dispatch(loginUser(credentials));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@example.com');
      expect(state.token).toBe('test-token');
      expect(state.error).toBeNull();
    });

    it('should handle failed login', async () => {
      vi.mocked(authApi.login).mockRejectedValue(new Error('Invalid credentials'));

      const store = createTestStore();
      const credentials = { email: 'test@example.com', password: 'wrong' };

      await store.dispatch(loginUser(credentials));

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBe('Invalid credentials');
    });

    it('should handle successful logout', async () => {
      vi.mocked(authApi.logout).mockResolvedValue({
        success: true,
        message: 'Logged out successfully',
        timestamp: '2023-01-01T00:00:00Z',
      });

      const initialState = {
        user: { id: '1', email: 'test@example.com' } as any,
        token: 'test-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      const store = createTestStore(initialState);

      await store.dispatch(logoutUser());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });

    it('should handle successful token validation', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User',
            avatar: '',
            role: 'user' as const,
            preferences: {
              theme: 'light' as const,
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
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
          },
          token: 'valid-token',
        },
        timestamp: '2023-01-01T00:00:00Z',
      };

      vi.mocked(authApi.validateToken).mockResolvedValue(mockResponse);

      const store = createTestStore();

      await store.dispatch(validateToken());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@example.com');
      expect(state.token).toBe('valid-token');
    });

    it('should handle failed token validation', async () => {
      vi.mocked(authApi.validateToken).mockRejectedValue(new Error('Invalid token'));

      const store = createTestStore();

      await store.dispatch(validateToken());

      const state = store.getState().auth;
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBe('Invalid token');
    });
  });
});


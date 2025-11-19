import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/authSlice';

// Mock the API
vi.mock('@/lib/api', () => ({
  authApi: {
    validateToken: vi.fn(),
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

const wrapper = ({ children, store = createTestStore() }: any) => (
  <Provider store={store}>{children}</Provider>
);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('returns initial unauthenticated state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('returns authenticated state when user is logged in', () => {
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

    const store = createTestStore({
      user: mockUser,
      token: 'test-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => wrapper({ children, store })
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('test-token');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('shows loading state initially', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
  });

  it('handles token validation on initialization', async () => {
    localStorage.setItem('authToken', 'stored-token');

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading should be true
    expect(result.current.isLoading).toBe(true);
  });
});

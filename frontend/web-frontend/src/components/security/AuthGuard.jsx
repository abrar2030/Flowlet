/**
 * Authentication Guard Component for Flowlet Financial Application
 * Provides route protection and authentication state management
 */

import React, { useState, useEffect, useContext, createContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import AuthService from '../../services/auth/AuthService';
import { SECURITY_CONFIG } from '../../config/security';

// Authentication Context
const AuthContext = createContext(null);

// Authentication Provider Component
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
    requiresMFA: false,
    sessionExpiry: null
  });

  const [authService] = useState(() => new AuthService());

  useEffect(() => {
    initializeAuth();
    setupEventListeners();

    return () => {
      cleanupEventListeners();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // Initialize auth service
      const initialized = await authService.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize authentication service');
      }

      // Check if user is already authenticated
      const isAuthenticated = await authService.isAuthenticated();
      
      if (isAuthenticated) {
        const user = await authService.getCurrentUser();
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          user,
          isLoading: false
        }));
      } else {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error.message
      }));
    }
  };

  const setupEventListeners = () => {
    // Listen for session timeout
    window.addEventListener('sessionTimeout', handleSessionTimeout);
    
    // Listen for storage changes (multi-tab logout)
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for visibility change (security feature)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for beforeunload (cleanup)
    window.addEventListener('beforeunload', handleBeforeUnload);
  };

  const cleanupEventListeners = () => {
    window.removeEventListener('sessionTimeout', handleSessionTimeout);
    window.removeEventListener('storage', handleStorageChange);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };

  const handleSessionTimeout = () => {
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: false,
      user: null,
      error: 'Your session has expired. Please log in again.'
    }));
  };

  const handleStorageChange = (event) => {
    // Handle logout in other tabs
    if (event.key === 'auth-logout' && event.newValue) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        user: null,
        error: 'You have been logged out from another tab.'
      }));
    }
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page is hidden - could implement additional security measures
      console.log('Page hidden - security monitoring active');
    } else {
      // Page is visible - verify session is still valid
      if (authState.isAuthenticated) {
        verifySession();
      }
    }
  };

  const handleBeforeUnload = () => {
    // Cleanup sensitive data before page unload
    if (authService) {
      authService.clearAuthCache();
    }
  };

  const verifySession = async () => {
    try {
      const isAuthenticated = await authService.isAuthenticated();
      if (!isAuthenticated && authState.isAuthenticated) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          error: 'Session verification failed. Please log in again.'
        }));
      }
    } catch (error) {
      console.error('Session verification failed:', error);
    }
  };

  const login = async (credentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await authService.login(credentials);
      
      if (result.success) {
        if (result.requiresMFA) {
          setAuthState(prev => ({
            ...prev,
            requiresMFA: true,
            isLoading: false
          }));
          return { success: true, requiresMFA: true };
        } else {
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: result.user,
            requiresMFA: false,
            isLoading: false
          }));
          return { success: true, requiresMFA: false };
        }
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  };

  const verifyMFA = async (token, method) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await authService.verifyMFA(token, method);
      
      if (result.success) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: result.user,
          requiresMFA: false,
          isLoading: false
        }));
        return { success: true };
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  };

  const loginWithWebAuthn = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await authService.authenticateWithWebAuthn();
      
      if (result.success) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: result.user,
          isLoading: false
        }));
        return { success: true };
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  };

  const loginWithBiometric = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await authService.authenticateWithBiometric();
      
      if (result.success) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: result.user,
          isLoading: false
        }));
        return { success: true };
      }
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      await authService.logout();
      
      // Signal logout to other tabs
      localStorage.setItem('auth-logout', Date.now().toString());
      localStorage.removeItem('auth-logout');

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        requiresMFA: false,
        sessionExpiry: null
      });
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout even if server request fails
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
        requiresMFA: false,
        sessionExpiry: null
      });
    }
  };

  const refreshToken = async () => {
    try {
      const result = await authService.refreshToken();
      return result.success;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      return false;
    }
  };

  const contextValue = {
    ...authState,
    login,
    verifyMFA,
    loginWithWebAuthn,
    loginWithBiometric,
    logout,
    refreshToken,
    authService
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication Guard Component
export const AuthGuard = ({ 
  children, 
  requireAuth = true, 
  requiredRoles = [], 
  fallback = null,
  redirectTo = '/login'
}) => {
  const { isAuthenticated, isLoading, user, error } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background p-4">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role requirements
  if (isAuthenticated && requiredRoles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
          <Alert className="max-w-md">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to access this page.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  // Render fallback if provided and not authenticated
  if (!requireAuth && !isAuthenticated && fallback) {
    return fallback;
  }

  return children;
};

// Higher-order component for route protection
export const withAuthGuard = (Component, options = {}) => {
  return function AuthGuardedComponent(props) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
};

// Role-based access control component
export const RoleGuard = ({ children, allowedRoles, fallback = null }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return fallback || null;
  }

  const userRoles = user?.roles || [];
  const hasAccess = allowedRoles.some(role => userRoles.includes(role));

  if (!hasAccess) {
    return fallback || (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Insufficient permissions to view this content.
        </AlertDescription>
      </Alert>
    );
  }

  return children;
};

// Permission-based access control component
export const PermissionGuard = ({ children, requiredPermissions, fallback = null }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return fallback || null;
  }

  const userPermissions = user?.permissions || [];
  const hasPermission = requiredPermissions.every(permission => 
    userPermissions.includes(permission)
  );

  if (!hasPermission) {
    return fallback || (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have the required permissions to view this content.
        </AlertDescription>
      </Alert>
    );
  }

  return children;
};

// Session timeout warning component
export const SessionTimeoutWarning = () => {
  const { refreshToken, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const warningTime = SECURITY_CONFIG.AUTH.SESSION_TIMEOUT - (5 * 60 * 1000); // 5 minutes before timeout
    
    const warningTimer = setTimeout(() => {
      setShowWarning(true);
      setCountdown(300); // 5 minutes in seconds
    }, warningTime);

    return () => clearTimeout(warningTimer);
  }, []);

  useEffect(() => {
    if (showWarning && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (showWarning && countdown === 0) {
      logout();
    }
  }, [showWarning, countdown, logout]);

  const handleExtendSession = async () => {
    try {
      const success = await refreshToken();
      if (success) {
        setShowWarning(false);
        setCountdown(0);
      }
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  };

  if (!showWarning) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Alert className="max-w-md">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-4">
            <p>Your session will expire in {minutes}:{seconds.toString().padStart(2, '0')}</p>
            <div className="flex space-x-2">
              <button
                onClick={handleExtendSession}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Extend Session
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90"
              >
                Logout
              </button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default AuthGuard;


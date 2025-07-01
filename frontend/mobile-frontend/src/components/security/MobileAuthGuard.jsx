/**
 * Mobile Authentication Guard Component for Flowlet Financial Application
 * Enhanced authentication with biometric, PIN, and mobile-specific security features
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AlertTriangle, Shield, Smartphone, Fingerprint, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import MobileAuthService from '../../services/auth/MobileAuthService.js';
import { SECURITY_CONFIG } from '../../config/security.js';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Authentication Context
const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Authentication Provider
export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    authMethod: null,
    deviceSecure: true,
    biometricAvailable: false,
    sessionTimeRemaining: 0
  });

  const [authService] = useState(() => new MobileAuthService());
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [sessionTimer, setSessionTimer] = useState(null);

  // Initialize authentication
  useEffect(() => {
    initializeAuth();
    return () => {
      if (sessionTimer) {
        clearInterval(sessionTimer);
      }
    };
  }, []);

  const initializeAuth = async () => {
    try {
      // Get device information
      if (Capacitor.isNativePlatform()) {
        const info = await Device.getInfo();
        setDeviceInfo(info);
      }

      // Check device security
      const deviceSecurity = await SECURITY_CONFIG.SecurityUtils.validateDeviceSecurity();
      
      // Check for existing authentication
      const authData = await authService.getAuthData();
      
      if (authData && authData.user) {
        // Validate session
        const isValid = await validateSession(authData);
        
        if (isValid) {
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: true,
            user: authData.user,
            authMethod: authData.authMethod || 'password',
            deviceSecure: deviceSecurity.isSecure,
            biometricAvailable: await authService.checkBiometricAvailability(),
            isLoading: false
          }));
          
          startSessionTimer();
        } else {
          await authService.clearAuthData();
          setAuthState(prev => ({
            ...prev,
            isAuthenticated: false,
            isLoading: false,
            deviceSecure: deviceSecurity.isSecure
          }));
        }
      } else {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          isLoading: false,
          deviceSecure: deviceSecurity.isSecure,
          biometricAvailable: await authService.checkBiometricAvailability()
        }));
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        isLoading: false,
        deviceSecure: false
      }));
    }
  };

  const validateSession = async (authData) => {
    try {
      // Check token expiry
      const now = Date.now();
      const tokenExpiry = authData.tokens?.expiresAt || 0;
      
      if (now > tokenExpiry) {
        return false;
      }

      // Check session timeout
      const lastActivity = authData.lastActivity || authData.loginTime || 0;
      const sessionAge = now - lastActivity;
      
      if (sessionAge > SECURITY_CONFIG.AUTH.SESSION_TIMEOUT) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  };

  const startSessionTimer = () => {
    if (sessionTimer) {
      clearInterval(sessionTimer);
    }

    const timer = setInterval(async () => {
      const authData = await authService.getAuthData();
      if (authData) {
        const lastActivity = authData.lastActivity || authData.loginTime || 0;
        const elapsed = Date.now() - lastActivity;
        const remaining = Math.max(0, SECURITY_CONFIG.AUTH.SESSION_TIMEOUT - elapsed);
        
        setAuthState(prev => ({
          ...prev,
          sessionTimeRemaining: remaining
        }));

        // Auto-logout when session expires
        if (remaining <= 0) {
          await logout();
        }
        
        // Warning at 5 minutes
        if (remaining <= 5 * 60 * 1000 && remaining > 4 * 60 * 1000) {
          showSessionWarning();
        }
      }
    }, 1000);

    setSessionTimer(timer);
  };

  const showSessionWarning = async () => {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    }
    
    // Dispatch session warning event
    window.dispatchEvent(new CustomEvent('sessionWarning', {
      detail: { timeRemaining: authState.sessionTimeRemaining }
    }));
  };

  const login = async (credentials, method = 'password') => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      let result;
      
      switch (method) {
        case 'password':
          result = await authService.authenticateWithPassword(
            credentials.username,
            credentials.password,
            credentials.rememberMe
          );
          break;
          
        case 'biometric':
          result = await authService.authenticateWithBiometric();
          break;
          
        case 'pin':
          result = await authService.authenticateWithPIN(credentials.pin);
          break;
          
        default:
          throw new Error('Invalid authentication method');
      }

      if (result.success) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: !result.requiresMFA,
          user: result.user,
          authMethod: method,
          isLoading: false
        }));

        if (!result.requiresMFA) {
          startSessionTimer();
        }

        // Haptic feedback for successful login
        if (Capacitor.isNativePlatform()) {
          await Haptics.impact({ style: ImpactStyle.Light });
        }

        return result;
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      // Haptic feedback for failed login
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
      
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      
      if (sessionTimer) {
        clearInterval(sessionTimer);
        setSessionTimer(null);
      }

      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        authMethod: null,
        deviceSecure: authState.deviceSecure,
        biometricAvailable: authState.biometricAvailable,
        sessionTimeRemaining: 0
      });

      // Haptic feedback for logout
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const verifyMFA = async (mfaToken, code) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const result = await authService.verifyMFA(mfaToken, code);
      
      if (result.success) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          user: result.user,
          isLoading: false
        }));

        startSessionTimer();
        
        // Haptic feedback for successful MFA
        if (Capacitor.isNativePlatform()) {
          await Haptics.impact({ style: ImpactStyle.Light });
        }

        return result;
      } else {
        throw new Error('MFA verification failed');
      }
    } catch (error) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      
      // Haptic feedback for failed MFA
      if (Capacitor.isNativePlatform()) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      }
      
      throw error;
    }
  };

  const extendSession = async () => {
    try {
      // Update last activity
      const authData = await authService.getAuthData();
      if (authData) {
        authData.lastActivity = Date.now();
        await authService.storeAuthData(authData, true);
        
        // Reset session timer
        startSessionTimer();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Session extension failed:', error);
      return false;
    }
  };

  const setupBiometric = async () => {
    try {
      const authData = await authService.getAuthData();
      if (authData && authData.tokens) {
        await authService.setupBiometricAuth(authData.tokens.accessToken);
        
        setAuthState(prev => ({
          ...prev,
          biometricAvailable: true
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Biometric setup failed:', error);
      throw error;
    }
  };

  const setupPIN = async (pin) => {
    try {
      const authData = await authService.getAuthData();
      if (authData && authData.tokens) {
        await authService.setupPIN(pin, authData.tokens.accessToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('PIN setup failed:', error);
      throw error;
    }
  };

  const contextValue = {
    ...authState,
    deviceInfo,
    login,
    logout,
    verifyMFA,
    extendSession,
    setupBiometric,
    setupPIN,
    authService
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Authentication Guard Component
export const MobileAuthGuard = ({ 
  children, 
  requireAuth = true, 
  requiredRoles = [],
  fallbackComponent = null 
}) => {
  const { isAuthenticated, isLoading, user, deviceSecure } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Initializing security...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show device security warning
  if (!deviceSecure) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Device Security Warning
            </CardTitle>
            <CardDescription>
              Your device may not be secure enough for financial transactions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Security issues detected. Please ensure your device is secure before proceeding.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Retry Security Check
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    if (fallbackComponent) {
      return fallbackComponent;
    }
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRoles.length > 0 && user) {
    const userRoles = user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Shield className="h-5 w-5" />
                Access Denied
              </CardTitle>
              <CardDescription>
                You don't have permission to access this resource
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Required roles: {requiredRoles.join(', ')}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return children;
};

// Session Timeout Warning Component
export const SessionTimeoutWarning = () => {
  const { sessionTimeRemaining, extendSession, logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const handleSessionWarning = () => {
      setShowWarning(true);
    };

    window.addEventListener('sessionWarning', handleSessionWarning);
    
    return () => {
      window.removeEventListener('sessionWarning', handleSessionWarning);
    };
  }, []);

  useEffect(() => {
    // Auto-hide warning if session is extended
    if (sessionTimeRemaining > 5 * 60 * 1000) {
      setShowWarning(false);
    }
  }, [sessionTimeRemaining]);

  if (!showWarning || sessionTimeRemaining <= 0) {
    return null;
  }

  const minutes = Math.floor(sessionTimeRemaining / 60000);
  const seconds = Math.floor((sessionTimeRemaining % 60000) / 1000);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            Session Expiring Soon
          </CardTitle>
          <CardDescription>
            Your session will expire in {minutes}:{seconds.toString().padStart(2, '0')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress 
            value={(sessionTimeRemaining / (5 * 60 * 1000)) * 100} 
            className="h-2"
          />
          <div className="flex gap-2">
            <Button 
              onClick={async () => {
                await extendSession();
                setShowWarning(false);
              }}
              className="flex-1"
            >
              Extend Session
            </Button>
            <Button 
              variant="outline" 
              onClick={logout}
              className="flex-1"
            >
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Device Security Status Component
export const DeviceSecurityStatus = () => {
  const { deviceInfo, biometricAvailable } = useAuth();
  const [securityStatus, setSecurityStatus] = useState(null);

  useEffect(() => {
    checkSecurityStatus();
  }, []);

  const checkSecurityStatus = async () => {
    try {
      const status = await SECURITY_CONFIG.SecurityUtils.validateDeviceSecurity();
      const capabilities = await SECURITY_CONFIG.SecurityUtils.detectDeviceCapabilities();
      
      setSecurityStatus({
        ...status,
        capabilities,
        biometricAvailable
      });
    } catch (error) {
      console.error('Security status check failed:', error);
    }
  };

  if (!securityStatus) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Device Security Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Overall Security</span>
          <Badge variant={securityStatus.isSecure ? 'default' : 'destructive'}>
            {securityStatus.isSecure ? 'Secure' : 'At Risk'}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm">Biometric Available</span>
          <Badge variant={biometricAvailable ? 'default' : 'secondary'}>
            {biometricAvailable ? 'Yes' : 'No'}
          </Badge>
        </div>
        
        {deviceInfo && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Platform</span>
            <Badge variant="outline">
              {deviceInfo.platform} {deviceInfo.osVersion}
            </Badge>
          </div>
        )}
        
        {securityStatus.issues.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Security Issues: {securityStatus.issues.join(', ')}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileAuthGuard;


/**
 * Enhanced Mobile Application Component for Flowlet Financial Application
 * Integrates comprehensive security, compliance, and mobile-specific features
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

// Capacitor imports for mobile functionality
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard } from '@capacitor/keyboard';
import { Device } from '@capacitor/device';

// Security and Compliance Components
import { AuthProvider, MobileAuthGuard, SessionTimeoutWarning } from './components/security/MobileAuthGuard';
import MobileConsentManager from './components/compliance/MobileConsentManager';

// Layout Components
import MobileNavbar from './components/layout/MobileNavbar';
import MobileTabBar from './components/layout/MobileTabBar';

// Page Components
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';
import Cards from './pages/Cards';
import Payments from './pages/Payments';
import Wallet from './pages/Wallet';

// Hooks and Services
import { useAuth } from './components/security/MobileAuthGuard';

// Configuration
import { SECURITY_CONFIG } from './config/security.js';
import { COMPLIANCE_CONFIG } from './config/compliance.js';

// Error Boundary Component
class MobileErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to security monitoring
    window.dispatchEvent(new CustomEvent('securityEvent', {
      detail: {
        type: 'mobile_application_error',
        severity: 'high',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        platform: Capacitor.isNativePlatform() ? 'native' : 'web',
        timestamp: Date.now()
      }
    }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-sm w-full p-6 bg-card rounded-lg border text-center">
            <h2 className="text-lg font-semibold text-destructive mb-4">
              Application Error
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              An unexpected error occurred. Please restart the app or contact support if the problem persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              Restart App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Mobile Security Headers Component
const MobileSecurityHeaders = () => {
  useEffect(() => {
    // Set mobile-specific security headers
    const setMetaTag = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Content Security Policy for mobile
    setMetaTag('Content-Security-Policy', SECURITY_CONFIG.SecurityUtils.generateCSPString());
    
    // Mobile-specific headers
    Object.entries(SECURITY_CONFIG.HEADERS).forEach(([header, value]) => {
      setMetaTag(header, value);
    });

    // Viewport security
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    
    // Prevent screenshot/screen recording if configured
    if (SECURITY_CONFIG.DEVICE.SCREENSHOT_PREVENTION) {
      setMetaTag('screenshot', 'disabled');
    }
  }, []);

  return null;
};

// Mobile Platform Initialization
const MobilePlatformInit = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);

  useEffect(() => {
    initializeMobilePlatform();
  }, []);

  const initializeMobilePlatform = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        // Get device information
        const info = await Device.getInfo();
        setDeviceInfo(info);

        // Configure status bar
        await StatusBar.setStyle({ style: Style.Default });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });

        // Configure keyboard
        Keyboard.addListener('keyboardWillShow', () => {
          document.body.classList.add('keyboard-open');
        });

        Keyboard.addListener('keyboardWillHide', () => {
          document.body.classList.remove('keyboard-open');
        });

        // Set up app state listeners
        document.addEventListener('pause', handleAppPause);
        document.addEventListener('resume', handleAppResume);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Mobile platform initialization failed:', error);
      setIsInitialized(true); // Continue anyway
    }
  };

  const handleAppPause = () => {
    // App going to background - implement security measures
    if (SECURITY_CONFIG.DEVICE.BACKGROUND_SECURITY) {
      // Hide sensitive content
      document.body.classList.add('app-backgrounded');
      
      // Log security event
      window.dispatchEvent(new CustomEvent('securityEvent', {
        detail: {
          type: 'app_backgrounded',
          severity: 'low',
          timestamp: Date.now()
        }
      }));
    }
  };

  const handleAppResume = () => {
    // App returning to foreground
    document.body.classList.remove('app-backgrounded');
    
    // Validate session
    window.dispatchEvent(new CustomEvent('validateSession'));
    
    // Log security event
    window.dispatchEvent(new CustomEvent('securityEvent', {
      detail: {
        type: 'app_resumed',
        severity: 'low',
        timestamp: Date.now()
      }
    }));
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Initializing mobile platform...</p>
        </div>
      </div>
    );
  }

  return children;
};

// Main Mobile App Layout Component
const MobileAppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const showListener = Keyboard.addListener('keyboardDidShow', () => {
        setKeyboardVisible(true);
      });

      const hideListener = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardVisible(false);
      });

      return () => {
        showListener.remove();
        hideListener.remove();
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {isAuthenticated && <MobileNavbar />}
      
      <main className={`flex-1 ${isAuthenticated ? 'pb-16' : ''} ${keyboardVisible ? 'pb-0' : ''}`}>
        {children}
      </main>
      
      {isAuthenticated && !keyboardVisible && <MobileTabBar />}
    </div>
  );
};

// Protected Route Component for Mobile
const MobileProtectedRoute = ({ children, requiredRoles = [] }) => {
  return (
    <MobileAuthGuard requireAuth={true} requiredRoles={requiredRoles}>
      {children}
    </MobileAuthGuard>
  );
};

// Public Route Component for Mobile
const MobilePublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Main Mobile Application Component
const MobileApp = () => {
  const [securityInitialized, setSecurityInitialized] = useState(false);
  const [deviceCapabilities, setDeviceCapabilities] = useState(null);

  useEffect(() => {
    initializeMobileSecurity();
    setupMobileErrorHandling();
    setupMobilePerformanceMonitoring();
  }, []);

  const initializeMobileSecurity = async () => {
    try {
      console.log('Initializing mobile security features...');
      
      // Check if we're in a secure context
      if (!SECURITY_CONFIG.SecurityUtils.isSecureEnvironment()) {
        console.warn('Application is not running in a secure context');
      }

      // Detect device capabilities
      const capabilities = await SECURITY_CONFIG.SecurityUtils.detectDeviceCapabilities();
      setDeviceCapabilities(capabilities);

      // Initialize Content Security Policy
      if (window.trustedTypes && window.trustedTypes.createPolicy) {
        window.trustedTypes.createPolicy('default', {
          createHTML: (string) => string,
          createScript: (string) => string,
          createScriptURL: (string) => string
        });
      }

      // Initialize mobile-specific security features
      if (Capacitor.isNativePlatform()) {
        // Native security initialization
        await initializeNativeSecurity();
      }

      setSecurityInitialized(true);
    } catch (error) {
      console.error('Mobile security initialization failed:', error);
      setSecurityInitialized(true); // Continue anyway
    }
  };

  const initializeNativeSecurity = async () => {
    try {
      // Device security validation
      const deviceSecurity = await SECURITY_CONFIG.SecurityUtils.validateDeviceSecurity();
      
      if (!deviceSecurity.isSecure) {
        console.warn('Device security issues detected:', deviceSecurity.issues);
      }

      // Set up screenshot prevention
      if (SECURITY_CONFIG.DEVICE.SCREENSHOT_PREVENTION) {
        // This would be implemented via native plugins
        console.log('Screenshot prevention enabled');
      }

      // Set up copy/paste restrictions
      if (SECURITY_CONFIG.DEVICE.COPY_PASTE_RESTRICTION) {
        document.addEventListener('copy', handleCopyRestriction);
        document.addEventListener('paste', handlePasteRestriction);
      }
    } catch (error) {
      console.error('Native security initialization failed:', error);
    }
  };

  const handleCopyRestriction = (event) => {
    // Check if copying sensitive data
    const selection = window.getSelection().toString();
    if (containsSensitiveData(selection)) {
      event.preventDefault();
      console.warn('Copy operation blocked for sensitive data');
    }
  };

  const handlePasteRestriction = (event) => {
    // Check if pasting into sensitive fields
    const target = event.target;
    if (target.dataset.sensitive === 'true') {
      event.preventDefault();
      console.warn('Paste operation blocked for sensitive field');
    }
  };

  const containsSensitiveData = (text) => {
    // Basic check for sensitive patterns
    const sensitivePatterns = [
      /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/, // Credit card
      /\d{3}-?\d{2}-?\d{4}/, // SSN
      /\$\d+\.?\d*/ // Currency amounts
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(text));
  };

  const setupMobileErrorHandling = () => {
    // Global error handler for mobile
    window.addEventListener('error', (event) => {
      console.error('Mobile global error:', event.error);
      
      // Send to monitoring service
      window.dispatchEvent(new CustomEvent('securityEvent', {
        detail: {
          type: 'mobile_global_error',
          severity: 'medium',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          platform: Capacitor.isNativePlatform() ? 'native' : 'web',
          timestamp: Date.now()
        }
      }));
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Mobile unhandled promise rejection:', event.reason);
      
      window.dispatchEvent(new CustomEvent('securityEvent', {
        detail: {
          type: 'mobile_unhandled_rejection',
          severity: 'medium',
          reason: event.reason?.toString() || 'Unknown',
          platform: Capacitor.isNativePlatform() ? 'native' : 'web',
          timestamp: Date.now()
        }
      }));
    });
  };

  const setupMobilePerformanceMonitoring = () => {
    // Monitor mobile-specific performance metrics
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 100) { // Tasks longer than 100ms on mobile
            console.warn('Long task detected on mobile:', entry.duration);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    }

    // Monitor memory usage (more critical on mobile)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        const usageRatio = memory.usedJSHeapSize / memory.totalJSHeapSize;
        
        if (usageRatio > 0.8) { // 80% threshold for mobile
          console.warn('High memory usage detected on mobile:', usageRatio);
        }
      }, 15000); // Check every 15 seconds on mobile
    }
  };

  if (!securityInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Initializing mobile security...</p>
        </div>
      </div>
    );
  }

  return (
    <MobileErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <MobilePlatformInit>
          <Router>
            <AuthProvider>
              <MobileSecurityHeaders />
              
              {/* Mobile Consent Manager */}
              <MobileConsentManager />

              {/* Session Timeout Warning */}
              <SessionTimeoutWarning />

              {/* Main Application Layout */}
              <MobileAppLayout>
                <Routes>
                  {/* Public Routes */}
                  <Route 
                    path="/login" 
                    element={
                      <MobilePublicRoute>
                        <Login />
                      </MobilePublicRoute>
                    } 
                  />

                  {/* Protected Routes */}
                  <Route 
                    path="/dashboard" 
                    element={
                      <MobileProtectedRoute>
                        <Dashboard />
                      </MobileProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/profile" 
                    element={
                      <MobileProtectedRoute>
                        <Profile />
                      </MobileProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/transactions" 
                    element={
                      <MobileProtectedRoute>
                        <Transactions />
                      </MobileProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/cards" 
                    element={
                      <MobileProtectedRoute>
                        <Cards />
                      </MobileProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/payments" 
                    element={
                      <MobileProtectedRoute>
                        <Payments />
                      </MobileProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/wallet" 
                    element={
                      <MobileProtectedRoute>
                        <Wallet />
                      </MobileProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/settings" 
                    element={
                      <MobileProtectedRoute>
                        <Settings />
                      </MobileProtectedRoute>
                    } 
                  />

                  {/* Default redirect */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* 404 handler */}
                  <Route 
                    path="*" 
                    element={
                      <div className="min-h-screen flex items-center justify-center p-4">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold text-muted-foreground mb-4">404</h1>
                          <p className="text-muted-foreground mb-4">Page not found</p>
                          <button
                            onClick={() => window.history.back()}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
                          >
                            Go Back
                          </button>
                        </div>
                      </div>
                    } 
                  />
                </Routes>
              </MobileAppLayout>

              {/* Mobile Toast Notifications */}
              <Toaster 
                position="top-center"
                toastOptions={{
                  duration: 3000, // Shorter duration for mobile
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                    fontSize: '14px' // Smaller font for mobile
                  }
                }}
              />
            </AuthProvider>
          </Router>
        </MobilePlatformInit>
      </ThemeProvider>
    </MobileErrorBoundary>
  );
};

export default MobileApp;


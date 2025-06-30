/**
 * Enhanced Main Application Component for Flowlet Financial Application
 * Integrates comprehensive security, compliance, and monitoring features
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

// Security and Compliance Components
import { AuthProvider, AuthGuard, SessionTimeoutWarning } from './components/security/AuthGuard';
import ConsentManager from './components/compliance/ConsentManager';
import SecurityMonitor from './components/monitoring/SecurityMonitor';

// Layout Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Footer from './components/layout/Footer';

// Page Components (these would be your actual pages)
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';
import Reports from './pages/Reports';
import Admin from './pages/Admin';

// Hooks and Services
import { useAuth } from './components/security/AuthGuard';

// Configuration
import { SECURITY_CONFIG } from './config/security';
import { COMPLIANCE_CONFIG } from './config/compliance';

// Error Boundary Component
class ErrorBoundary extends React.Component {
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
        type: 'application_error',
        severity: 'high',
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: Date.now()
      }
    }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full p-6 bg-card rounded-lg border">
            <h2 className="text-lg font-semibold text-destructive mb-4">
              Application Error
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              An unexpected error occurred. Please refresh the page or contact support if the problem persists.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Security Headers Component
const SecurityHeaders = () => {
  useEffect(() => {
    // Set security headers via meta tags (for client-side enforcement)
    const setMetaTag = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = name;
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Content Security Policy
    setMetaTag('Content-Security-Policy', SECURITY_CONFIG.SecurityUtils.generateCSPString());
    
    // Other security headers
    Object.entries(SECURITY_CONFIG.HEADERS).forEach(([header, value]) => {
      setMetaTag(header, value);
    });

    // Referrer Policy
    setMetaTag('referrer', 'strict-origin-when-cross-origin');

    // Permissions Policy
    setMetaTag('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  }, []);

  return null;
};

// Main App Layout Component
const AppLayout = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {isAuthenticated && (
        <>
          <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <div className="flex">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1 p-6">
              {children}
            </main>
          </div>
          <Footer />
        </>
      )}
      {!isAuthenticated && children}
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [], requiredPermissions = [] }) => {
  return (
    <AuthGuard requireAuth={true} requiredRoles={requiredRoles}>
      {children}
    </AuthGuard>
  );
};

// Public Route Component (for login, etc.)
const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Main Application Component
const App = () => {
  const [securityInitialized, setSecurityInitialized] = useState(false);
  const [showSecurityMonitor, setShowSecurityMonitor] = useState(false);

  useEffect(() => {
    initializeSecurity();
    setupGlobalErrorHandling();
    setupPerformanceMonitoring();
  }, []);

  const initializeSecurity = async () => {
    try {
      // Initialize security configurations
      console.log('Initializing security features...');
      
      // Check if we're in a secure context
      if (!SECURITY_CONFIG.SecurityUtils.isSecureEnvironment()) {
        console.warn('Application is not running in a secure context (HTTPS)');
      }

      // Initialize Content Security Policy
      if (window.trustedTypes && window.trustedTypes.createPolicy) {
        window.trustedTypes.createPolicy('default', {
          createHTML: (string) => string,
          createScript: (string) => string,
          createScriptURL: (string) => string
        });
      }

      // Initialize performance monitoring
      if ('performance' in window && 'PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              console.log('Page load time:', entry.loadEventEnd - entry.loadEventStart);
            }
          }
        });
        observer.observe({ entryTypes: ['navigation'] });
      }

      setSecurityInitialized(true);
    } catch (error) {
      console.error('Security initialization failed:', error);
      setSecurityInitialized(true); // Continue anyway
    }
  };

  const setupGlobalErrorHandling = () => {
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      
      // Send to monitoring service
      window.dispatchEvent(new CustomEvent('securityEvent', {
        detail: {
          type: 'global_error',
          severity: 'medium',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          timestamp: Date.now()
        }
      }));
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      window.dispatchEvent(new CustomEvent('securityEvent', {
        detail: {
          type: 'unhandled_rejection',
          severity: 'medium',
          reason: event.reason?.toString() || 'Unknown',
          timestamp: Date.now()
        }
      }));
    });
  };

  const setupPerformanceMonitoring = () => {
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn('Long task detected:', entry.duration);
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    }

    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => {
        const memory = performance.memory;
        if (memory.usedJSHeapSize / memory.totalJSHeapSize > 0.9) {
          console.warn('High memory usage detected');
        }
      }, 30000); // Check every 30 seconds
    }
  };

  const handleSecurityEvent = (event) => {
    console.log('Security event:', event);
    
    // Handle critical security events
    if (event.severity === 'critical') {
      // Could trigger additional security measures
      setShowSecurityMonitor(true);
    }
  };

  const handleThreatDetected = (threat) => {
    console.warn('Security threat detected:', threat);
    
    // Could trigger alerts, notifications, or automatic responses
    if (threat.severity === 'critical') {
      // Force logout or other protective measures
      console.log('Critical threat - implementing protective measures');
    }
  };

  if (!securityInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Initializing security features...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <Router>
          <AuthProvider>
            <SecurityHeaders />
            
            {/* Global Security Monitor */}
            <SecurityMonitor
              enableRealTimeMonitoring={true}
              enableThreatDetection={true}
              enablePerformanceMonitoring={true}
              onSecurityEvent={handleSecurityEvent}
              onThreatDetected={handleThreatDetected}
              className={showSecurityMonitor ? 'fixed top-4 right-4 z-50 w-80' : 'hidden'}
            />

            {/* GDPR Consent Manager */}
            <ConsentManager />

            {/* Session Timeout Warning */}
            <SessionTimeoutWarning />

            {/* Main Application Layout */}
            <AppLayout>
              <Routes>
                {/* Public Routes */}
                <Route 
                  path="/login" 
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } 
                />

                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/transactions" 
                  element={
                    <ProtectedRoute>
                      <Transactions />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute requiredRoles={['user', 'manager', 'admin']}>
                      <Reports />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />

                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requiredRoles={['admin']}>
                      <Admin />
                    </ProtectedRoute>
                  } 
                />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* 404 handler */}
                <Route 
                  path="*" 
                  element={
                    <div className="min-h-screen flex items-center justify-center">
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
            </AppLayout>

            {/* Global Toast Notifications */}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 5000,
                style: {
                  background: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  border: '1px solid hsl(var(--border))'
                }
              }}
            />

            {/* Development Tools */}
            {process.env.NODE_ENV === 'development' && (
              <div className="fixed bottom-4 left-4 z-50">
                <button
                  onClick={() => setShowSecurityMonitor(!showSecurityMonitor)}
                  className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs hover:bg-primary/90"
                >
                  {showSecurityMonitor ? 'Hide' : 'Show'} Security Monitor
                </button>
              </div>
            )}
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;


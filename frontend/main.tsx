import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Performance monitoring with better error handling
if (import.meta.env.PROD) {
  // Performance monitoring in production
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          // Log navigation timing for monitoring
          console.log('Navigation timing:', {
            loadTime: entry.loadEventEnd - entry.loadEventStart,
            domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
            firstPaint: entry.responseEnd - entry.requestStart,
          });
        }
      }
    });
    observer.observe({ entryTypes: ['navigation'] });
  } catch (error) {
    console.warn('Performance monitoring not available:', error);
  }
}

// Global error handling with improved logging
window.addEventListener('error', (event) => {
  const errorInfo = {
    message: event.error?.message || event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  console.error('Global error:', errorInfo);

  // In production, send to error reporting service
  if (import.meta.env.PROD) {
    // Example: Send to error reporting service
    // errorReportingService.captureException(errorInfo);
  }
});

window.addEventListener('unhandledrejection', (event) => {
  const errorInfo = {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  console.error('Unhandled promise rejection:', errorInfo);

  // In production, send to error reporting service
  if (import.meta.env.PROD) {
    // Example: Send to error reporting service
    // errorReportingService.captureException(errorInfo);
  }
});

// Security: Remove console in production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
}

// Initialize app
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

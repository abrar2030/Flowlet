/**
 * Security Monitoring Component for Flowlet Financial Application
 * Implements real-time security monitoring, threat detection, and incident response
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Shield, AlertTriangle, Activity, Eye, Lock, Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { SECURITY_CONFIG } from '../../config/security';
import { ComplianceUtils } from '../../config/compliance';

const SecurityMonitor = ({ 
  enableRealTimeMonitoring = true,
  enableThreatDetection = true,
  enablePerformanceMonitoring = true,
  onSecurityEvent,
  onThreatDetected,
  className = ''
}) => {
  const [securityState, setSecurityState] = useState({
    status: 'secure',
    threats: [],
    events: [],
    performance: {
      responseTime: 0,
      errorRate: 0,
      securityScore: 100
    },
    network: {
      isOnline: navigator.onLine,
      connectionType: 'unknown',
      isSecure: window.location.protocol === 'https:'
    },
    session: {
      isActive: true,
      timeRemaining: 0,
      lastActivity: Date.now()
    }
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitoringInterval = useRef(null);
  const threatDetectionInterval = useRef(null);
  const performanceMetrics = useRef({
    requests: [],
    errors: [],
    securityEvents: []
  });

  // Initialize monitoring
  useEffect(() => {
    if (enableRealTimeMonitoring) {
      startMonitoring();
    }

    setupEventListeners();
    
    return () => {
      stopMonitoring();
      cleanupEventListeners();
    };
  }, [enableRealTimeMonitoring]);

  // Start security monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);

    // Real-time monitoring interval
    monitoringInterval.current = setInterval(() => {
      updateSecurityStatus();
      checkSessionStatus();
      monitorNetworkStatus();
    }, 5000); // Check every 5 seconds

    // Threat detection interval
    if (enableThreatDetection) {
      threatDetectionInterval.current = setInterval(() => {
        detectThreats();
        analyzeUserBehavior();
      }, 10000); // Check every 10 seconds
    }

    // Performance monitoring
    if (enablePerformanceMonitoring) {
      monitorPerformance();
    }

    logSecurityEvent('monitoring_started', { timestamp: Date.now() });
  }, [isMonitoring, enableThreatDetection, enablePerformanceMonitoring]);

  // Stop security monitoring
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;

    setIsMonitoring(false);

    if (monitoringInterval.current) {
      clearInterval(monitoringInterval.current);
      monitoringInterval.current = null;
    }

    if (threatDetectionInterval.current) {
      clearInterval(threatDetectionInterval.current);
      threatDetectionInterval.current = null;
    }

    logSecurityEvent('monitoring_stopped', { timestamp: Date.now() });
  }, [isMonitoring]);

  // Setup event listeners
  const setupEventListeners = useCallback(() => {
    // Network status
    window.addEventListener('online', handleNetworkOnline);
    window.addEventListener('offline', handleNetworkOffline);

    // Page visibility
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // User activity
    document.addEventListener('mousedown', handleUserActivity);
    document.addEventListener('keydown', handleUserActivity);
    document.addEventListener('scroll', handleUserActivity);
    document.addEventListener('touchstart', handleUserActivity);

    // Security events
    window.addEventListener('securityEvent', handleSecurityEvent);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Performance events
    window.addEventListener('load', handlePageLoad);
    window.addEventListener('beforeunload', handlePageUnload);

    // CSP violations
    document.addEventListener('securitypolicyviolation', handleCSPViolation);
  }, []);

  // Cleanup event listeners
  const cleanupEventListeners = useCallback(() => {
    window.removeEventListener('online', handleNetworkOnline);
    window.removeEventListener('offline', handleNetworkOffline);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('mousedown', handleUserActivity);
    document.removeEventListener('keydown', handleUserActivity);
    document.removeEventListener('scroll', handleUserActivity);
    document.removeEventListener('touchstart', handleUserActivity);
    window.removeEventListener('securityEvent', handleSecurityEvent);
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('load', handlePageLoad);
    window.removeEventListener('beforeunload', handlePageUnload);
    document.removeEventListener('securitypolicyviolation', handleCSPViolation);
  }, []);

  // Update overall security status
  const updateSecurityStatus = useCallback(() => {
    const threats = securityState.threats.filter(threat => 
      Date.now() - threat.timestamp < 300000 // Last 5 minutes
    );

    const criticalThreats = threats.filter(threat => threat.severity === 'critical');
    const highThreats = threats.filter(threat => threat.severity === 'high');

    let status = 'secure';
    if (criticalThreats.length > 0) {
      status = 'critical';
    } else if (highThreats.length > 0) {
      status = 'warning';
    } else if (threats.length > 0) {
      status = 'caution';
    }

    // Calculate security score
    const baseScore = 100;
    const threatPenalty = criticalThreats.length * 30 + highThreats.length * 15 + threats.length * 5;
    const networkPenalty = !securityState.network.isSecure ? 20 : 0;
    const sessionPenalty = !securityState.session.isActive ? 10 : 0;

    const securityScore = Math.max(0, baseScore - threatPenalty - networkPenalty - sessionPenalty);

    setSecurityState(prev => ({
      ...prev,
      status,
      threats,
      performance: {
        ...prev.performance,
        securityScore
      }
    }));
  }, [securityState.threats, securityState.network.isSecure, securityState.session.isActive]);

  // Check session status
  const checkSessionStatus = useCallback(() => {
    const sessionTimeout = SECURITY_CONFIG.AUTH.SESSION_TIMEOUT;
    const lastActivity = securityState.session.lastActivity;
    const timeElapsed = Date.now() - lastActivity;
    const timeRemaining = Math.max(0, sessionTimeout - timeElapsed);

    setSecurityState(prev => ({
      ...prev,
      session: {
        ...prev.session,
        timeRemaining,
        isActive: timeRemaining > 0
      }
    }));

    // Warn about session expiry
    if (timeRemaining < 300000 && timeRemaining > 0) { // 5 minutes warning
      logSecurityEvent('session_expiry_warning', { 
        timeRemaining: Math.floor(timeRemaining / 1000) 
      });
    }
  }, [securityState.session.lastActivity]);

  // Monitor network status
  const monitorNetworkStatus = useCallback(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    setSecurityState(prev => ({
      ...prev,
      network: {
        isOnline: navigator.onLine,
        connectionType: connection?.effectiveType || 'unknown',
        isSecure: window.location.protocol === 'https:'
      }
    }));
  }, []);

  // Detect security threats
  const detectThreats = useCallback(() => {
    const threats = [];

    // Check for suspicious DOM modifications
    const suspiciousElements = document.querySelectorAll('script[src*="eval"], iframe[src*="javascript:"]');
    if (suspiciousElements.length > 0) {
      threats.push({
        id: `dom-${Date.now()}`,
        type: 'DOM_MANIPULATION',
        severity: 'high',
        message: 'Suspicious DOM elements detected',
        timestamp: Date.now(),
        details: { count: suspiciousElements.length }
      });
    }

    // Check for console access attempts
    if (window.console && window.console._commandLineAPI) {
      threats.push({
        id: `console-${Date.now()}`,
        type: 'CONSOLE_ACCESS',
        severity: 'medium',
        message: 'Console access detected',
        timestamp: Date.now(),
        details: { source: 'developer_tools' }
      });
    }

    // Check for clipboard access
    if (document.hasFocus() && navigator.clipboard) {
      // Monitor clipboard access patterns
      const clipboardEvents = performanceMetrics.current.securityEvents.filter(
        event => event.type === 'clipboard_access' && Date.now() - event.timestamp < 60000
      );
      
      if (clipboardEvents.length > 5) {
        threats.push({
          id: `clipboard-${Date.now()}`,
          type: 'EXCESSIVE_CLIPBOARD_ACCESS',
          severity: 'medium',
          message: 'Excessive clipboard access detected',
          timestamp: Date.now(),
          details: { count: clipboardEvents.length }
        });
      }
    }

    // Check for rapid form submissions
    const formEvents = performanceMetrics.current.securityEvents.filter(
      event => event.type === 'form_submission' && Date.now() - event.timestamp < 30000
    );
    
    if (formEvents.length > 10) {
      threats.push({
        id: `form-${Date.now()}`,
        type: 'RAPID_FORM_SUBMISSION',
        severity: 'high',
        message: 'Rapid form submissions detected - possible bot activity',
        timestamp: Date.now(),
        details: { count: formEvents.length }
      });
    }

    // Add new threats to state
    if (threats.length > 0) {
      setSecurityState(prev => ({
        ...prev,
        threats: [...prev.threats, ...threats]
      }));

      threats.forEach(threat => {
        logSecurityEvent('threat_detected', threat);
        if (onThreatDetected) {
          onThreatDetected(threat);
        }
      });
    }
  }, [onThreatDetected]);

  // Analyze user behavior patterns
  const analyzeUserBehavior = useCallback(() => {
    const recentEvents = performanceMetrics.current.securityEvents.filter(
      event => Date.now() - event.timestamp < 300000 // Last 5 minutes
    );

    // Check for unusual activity patterns
    const clickEvents = recentEvents.filter(event => event.type === 'user_click');
    const keyEvents = recentEvents.filter(event => event.type === 'user_key');

    // Detect rapid clicking (possible automation)
    if (clickEvents.length > 100) {
      const threat = {
        id: `behavior-${Date.now()}`,
        type: 'SUSPICIOUS_USER_BEHAVIOR',
        severity: 'medium',
        message: 'Unusual click patterns detected',
        timestamp: Date.now(),
        details: { clickCount: clickEvents.length }
      };

      setSecurityState(prev => ({
        ...prev,
        threats: [...prev.threats, threat]
      }));

      logSecurityEvent('suspicious_behavior', threat);
    }
  }, []);

  // Monitor performance metrics
  const monitorPerformance = useCallback(() => {
    // Monitor API response times
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        performanceMetrics.current.requests.push({
          url: args[0],
          responseTime,
          status: response.status,
          timestamp: Date.now()
        });

        // Update performance metrics
        const recentRequests = performanceMetrics.current.requests.filter(
          req => Date.now() - req.timestamp < 60000 // Last minute
        );

        const avgResponseTime = recentRequests.reduce((sum, req) => sum + req.responseTime, 0) / recentRequests.length;
        const errorRate = recentRequests.filter(req => req.status >= 400).length / recentRequests.length * 100;

        setSecurityState(prev => ({
          ...prev,
          performance: {
            ...prev.performance,
            responseTime: avgResponseTime || 0,
            errorRate: errorRate || 0
          }
        }));

        return response;
      } catch (error) {
        const endTime = performance.now();
        const responseTime = endTime - startTime;

        performanceMetrics.current.errors.push({
          url: args[0],
          error: error.message,
          responseTime,
          timestamp: Date.now()
        });

        throw error;
      }
    };
  }, []);

  // Event handlers
  const handleNetworkOnline = useCallback(() => {
    setSecurityState(prev => ({
      ...prev,
      network: { ...prev.network, isOnline: true }
    }));
    logSecurityEvent('network_online', { timestamp: Date.now() });
  }, []);

  const handleNetworkOffline = useCallback(() => {
    setSecurityState(prev => ({
      ...prev,
      network: { ...prev.network, isOnline: false }
    }));
    logSecurityEvent('network_offline', { timestamp: Date.now() });
  }, []);

  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    logSecurityEvent('page_visibility_change', { 
      visible: isVisible,
      timestamp: Date.now() 
    });
  }, []);

  const handleUserActivity = useCallback((event) => {
    setSecurityState(prev => ({
      ...prev,
      session: {
        ...prev.session,
        lastActivity: Date.now()
      }
    }));

    // Log user activity for behavior analysis
    performanceMetrics.current.securityEvents.push({
      type: `user_${event.type}`,
      timestamp: Date.now(),
      target: event.target?.tagName || 'unknown'
    });
  }, []);

  const handleSecurityEvent = useCallback((event) => {
    logSecurityEvent('custom_security_event', event.detail);
    if (onSecurityEvent) {
      onSecurityEvent(event.detail);
    }
  }, [onSecurityEvent]);

  const handleError = useCallback((event) => {
    performanceMetrics.current.errors.push({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      timestamp: Date.now()
    });

    logSecurityEvent('javascript_error', {
      message: event.message,
      source: event.filename
    });
  }, []);

  const handleUnhandledRejection = useCallback((event) => {
    performanceMetrics.current.errors.push({
      reason: event.reason?.toString() || 'Unknown rejection',
      timestamp: Date.now()
    });

    logSecurityEvent('unhandled_promise_rejection', {
      reason: event.reason?.toString() || 'Unknown'
    });
  }, []);

  const handlePageLoad = useCallback(() => {
    logSecurityEvent('page_load', { 
      loadTime: performance.now(),
      timestamp: Date.now() 
    });
  }, []);

  const handlePageUnload = useCallback(() => {
    logSecurityEvent('page_unload', { timestamp: Date.now() });
  }, []);

  const handleCSPViolation = useCallback((event) => {
    const violation = {
      id: `csp-${Date.now()}`,
      type: 'CSP_VIOLATION',
      severity: 'high',
      message: `CSP violation: ${event.violatedDirective}`,
      timestamp: Date.now(),
      details: {
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        documentURI: event.documentURI,
        originalPolicy: event.originalPolicy
      }
    };

    setSecurityState(prev => ({
      ...prev,
      threats: [...prev.threats, violation]
    }));

    logSecurityEvent('csp_violation', violation);
  }, []);

  // Log security events
  const logSecurityEvent = useCallback((eventType, data) => {
    if (!ComplianceUtils.isAuditLoggingRequired(eventType)) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      type: eventType,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: sessionStorage.getItem('sessionId') || 'unknown'
    };

    // Add to local events
    setSecurityState(prev => ({
      ...prev,
      events: [logEntry, ...prev.events.slice(0, 99)] // Keep last 100 events
    }));

    // Send to server (implement based on your logging infrastructure)
    sendToSecurityLog(logEntry);
  }, []);

  // Send log to security service
  const sendToSecurityLog = useCallback(async (logEntry) => {
    try {
      await fetch('/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Failed to send security log:', error);
    }
  }, []);

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'secure': return 'text-green-500';
      case 'caution': return 'text-yellow-500';
      case 'warning': return 'text-orange-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'secure': return <Shield className="h-4 w-4 text-green-500" />;
      case 'caution': return <Eye className="h-4 w-4 text-yellow-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Security Status Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(securityState.status)}
            Security Status
            <Badge variant={securityState.status === 'secure' ? 'default' : 'destructive'}>
              {securityState.status.toUpperCase()}
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time security monitoring and threat detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Security Score */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Security Score</span>
                <span className="text-sm text-muted-foreground">
                  {securityState.performance.securityScore}/100
                </span>
              </div>
              <Progress 
                value={securityState.performance.securityScore} 
                className="h-2"
              />
            </div>

            {/* Active Threats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Threats</span>
                <Badge variant={securityState.threats.length > 0 ? 'destructive' : 'default'}>
                  {securityState.threats.length}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {securityState.threats.length === 0 ? 'No threats detected' : 'Threats require attention'}
              </div>
            </div>

            {/* Network Status */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network</span>
                <div className="flex items-center gap-1">
                  {securityState.network.isOnline ? (
                    <Wifi className="h-4 w-4 text-green-500" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-500" />
                  )}
                  {securityState.network.isSecure && (
                    <Lock className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                {securityState.network.isOnline ? 'Online' : 'Offline'} • 
                {securityState.network.isSecure ? ' Secure' : ' Insecure'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Threats */}
      {securityState.threats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Active Security Threats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {securityState.threats.slice(0, 5).map((threat) => (
                <Alert key={threat.id} variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{threat.message}</span>
                      <Badge variant="outline">
                        {threat.severity}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(threat.timestamp).toLocaleTimeString()}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {enablePerformanceMonitoring && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Average Response Time</div>
                <div className="text-2xl font-bold">
                  {securityState.performance.responseTime.toFixed(0)}ms
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Error Rate</div>
                <div className="text-2xl font-bold">
                  {securityState.performance.errorRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monitoring Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Monitoring Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={isMonitoring ? 'default' : 'secondary'}>
              {isMonitoring ? 'Active' : 'Inactive'}
            </Badge>
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className="text-sm text-blue-500 hover:text-blue-700"
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityMonitor;


import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Clock,
  Shield,
  Monitor,
  Smartphone,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogOut,
  RefreshCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Activity,
  MapPin,
  Wifi
} from 'lucide-react';

interface Session {
  id: string;
  userId: string;
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    os: string;
    userAgent: string;
  };
  location: {
    ip: string;
    country: string;
    city: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  isActive: boolean;
  isCurrent: boolean;
  securityLevel: 'low' | 'medium' | 'high';
  mfaVerified: boolean;
  riskScore: number;
  activities: SessionActivity[];
}

interface SessionActivity {
  id: string;
  type: 'login' | 'logout' | 'page_view' | 'api_call' | 'permission_check' | 'security_event';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface SessionConfig {
  maxSessions: number;
  sessionTimeout: number; // in minutes
  idleTimeout: number; // in minutes
  extendOnActivity: boolean;
  requireMfaForSensitive: boolean;
  allowConcurrentSessions: boolean;
  trackLocation: boolean;
  trackDeviceFingerprint: boolean;
}

interface SessionManagerProps {
  currentSession?: Session;
  allSessions?: Session[];
  sessionConfig?: SessionConfig;
  onSessionTerminate?: (sessionId: string) => Promise<void>;
  onSessionExtend?: (sessionId: string) => Promise<void>;
  onSessionTerminateAll?: () => Promise<void>;
  onConfigUpdate?: (config: Partial<SessionConfig>) => Promise<void>;
  onActivityLog?: (activity: Omit<SessionActivity, 'id' | 'timestamp'>) => void;
  className?: string;
}

interface ComponentState {
  activeTab: string;
  timeRemaining: number;
  isIdle: boolean;
  idleTime: number;
  showWarning: boolean;
  isExtending: boolean;
  isTerminating: boolean;
  error: string | null;
  success: string | null;
  selectedSession: Session | null;
  showSessionDetails: boolean;
}

export function SessionManager({
  currentSession,
  allSessions = [],
  sessionConfig = {
    maxSessions: 5,
    sessionTimeout: 480, // 8 hours
    idleTimeout: 30, // 30 minutes
    extendOnActivity: true,
    requireMfaForSensitive: true,
    allowConcurrentSessions: true,
    trackLocation: true,
    trackDeviceFingerprint: true
  },
  onSessionTerminate,
  onSessionExtend,
  onSessionTerminateAll,
  onConfigUpdate,
  onActivityLog,
  className = ''
}: SessionManagerProps) {
  const [state, setState] = useState<ComponentState>({
    activeTab: 'current',
    timeRemaining: 0,
    isIdle: false,
    idleTime: 0,
    showWarning: false,
    isExtending: false,
    isTerminating: false,
    error: null,
    success: null,
    selectedSession: null,
    showSessionDetails: false
  });

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Calculate time remaining for current session
  useEffect(() => {
    if (!currentSession) return;

    const updateTimeRemaining = () => {
      const now = Date.now();
      const expiresAt = new Date(currentSession.expiresAt).getTime();
      const remaining = Math.max(0, expiresAt - now);

      setState(prev => ({
        ...prev,
        timeRemaining: remaining,
        showWarning: remaining < 300000 && remaining > 0 // Show warning when < 5 minutes
      }));

      if (remaining === 0) {
        // Session expired
        if (onActivityLog) {
          onActivityLog({
            type: 'security_event',
            description: 'Session expired due to timeout'
          });
        }
      }
    };

    updateTimeRemaining();
    const timer = setInterval(updateTimeRemaining, 1000);
    sessionTimerRef.current = timer;

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [currentSession, onActivityLog]);

  // Track user activity and idle time
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now();
      setState(prev => ({ ...prev, isIdle: false, idleTime: 0 }));

      if (sessionConfig.extendOnActivity && currentSession && onSessionExtend) {
        // Auto-extend session on activity
        onSessionExtend(currentSession.id);
      }

      if (onActivityLog) {
        onActivityLog({
          type: 'page_view',
          description: 'User activity detected'
        });
      }
    };

    const checkIdleTime = () => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;
      const idleMinutes = idleTime / (1000 * 60);

      setState(prev => ({
        ...prev,
        idleTime: idleTime,
        isIdle: idleMinutes >= sessionConfig.idleTimeout
      }));

      if (idleMinutes >= sessionConfig.idleTimeout) {
        if (onActivityLog) {
          onActivityLog({
            type: 'security_event',
            description: `User idle for ${Math.round(idleMinutes)} minutes`
          });
        }
      }
    };

    // Add activity listeners
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Check idle time every minute
    const idleTimer = setInterval(checkIdleTime, 60000);
    idleTimerRef.current = idleTimer;

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (idleTimer) clearInterval(idleTimer);
    };
  }, [sessionConfig, currentSession, onSessionExtend, onActivityLog]);

  // Handle session extension
  const handleExtendSession = useCallback(async () => {
    if (!currentSession || !onSessionExtend) return;

    setState(prev => ({ ...prev, isExtending: true, error: null }));

    try {
      await onSessionExtend(currentSession.id);
      setState(prev => ({ ...prev, success: 'Session extended successfully' }));

      if (onActivityLog) {
        onActivityLog({
          type: 'security_event',
          description: 'Session manually extended'
        });
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to extend session' }));
    } finally {
      setState(prev => ({ ...prev, isExtending: false }));
    }
  }, [currentSession, onSessionExtend, onActivityLog]);

  // Handle session termination
  const handleTerminateSession = useCallback(async (sessionId: string) => {
    if (!onSessionTerminate) return;

    setState(prev => ({ ...prev, isTerminating: true, error: null }));

    try {
      await onSessionTerminate(sessionId);
      setState(prev => ({ ...prev, success: 'Session terminated successfully' }));

      if (onActivityLog) {
        onActivityLog({
          type: 'logout',
          description: `Session ${sessionId} terminated`
        });
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to terminate session' }));
    } finally {
      setState(prev => ({ ...prev, isTerminating: false }));
    }
  }, [onSessionTerminate, onActivityLog]);

  // Handle terminate all sessions
  const handleTerminateAllSessions = useCallback(async () => {
    if (!onSessionTerminateAll) return;
    if (!confirm('Are you sure you want to terminate all other sessions?')) return;

    setState(prev => ({ ...prev, isTerminating: true, error: null }));

    try {
      await onSessionTerminateAll();
      setState(prev => ({ ...prev, success: 'All sessions terminated successfully' }));

      if (onActivityLog) {
        onActivityLog({
          type: 'security_event',
          description: 'All sessions terminated by user'
        });
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to terminate sessions' }));
    } finally {
      setState(prev => ({ ...prev, isTerminating: false }));
    }
  }, [onSessionTerminateAll, onActivityLog]);

  const formatTimeRemaining = (milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatIdleTime = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    return `${minutes} minutes`;
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'desktop': return <Monitor className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Monitor className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-green-100 text-green-600';
      case 'medium': return 'bg-yellow-100 text-yellow-600';
      case 'low': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score < 30) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const activeSessions = allSessions.filter(s => s.isActive);
  const otherSessions = activeSessions.filter(s => !s.isCurrent);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-6 h-6 mr-3 text-blue-600" />
              Session Management
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-600">
                <Activity className="w-3 h-3 mr-1" />
                {activeSessions.length} Active
              </Badge>
              {state.isIdle && (
                <Badge className="bg-yellow-100 text-yellow-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Idle
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Monitor and manage your active sessions across all devices and locations.
          </p>
        </CardContent>
      </Card>

      {/* Session Warnings */}
      {state.showWarning && currentSession && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="flex items-center justify-between">
              <span>
                Your session will expire in {formatTimeRemaining(state.timeRemaining)}
              </span>
              <Button
                onClick={handleExtendSession}
                disabled={state.isExtending}
                size="sm"
                className="ml-4"
              >
                {state.isExtending ? 'Extending...' : 'Extend Session'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {state.isIdle && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Clock className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            You have been idle for {formatIdleTime(state.idleTime)}.
            Your session may be terminated for security.
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts */}
      {state.error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{state.error}</AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{state.success}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={state.activeTab} onValueChange={(value) => setState(prev => ({ ...prev, activeTab: value }))}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="current">Current Session</TabsTrigger>
          <TabsTrigger value="all">All Sessions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Current Session Tab */}
        <TabsContent value="current">
          {currentSession ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Current Session Details</span>
                  <Badge className={getSecurityLevelColor(currentSession.securityLevel)}>
                    <Shield className="w-3 h-3 mr-1" />
                    {currentSession.securityLevel} Security
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Session Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Session Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Session ID:</span>
                          <span className="font-mono">{currentSession.id.substring(0, 8)}...</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created:</span>
                          <span>{new Date(currentSession.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Activity:</span>
                          <span>{new Date(currentSession.lastActivity).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Expires:</span>
                          <span>{new Date(currentSession.expiresAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Security Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">MFA Verified:</span>
                          <Badge className={currentSession.mfaVerified ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}>
                            {currentSession.mfaVerified ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3 mr-1" />
                                Not Verified
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Risk Score:</span>
                          <span className={`font-medium ${getRiskScoreColor(currentSession.riskScore)}`}>
                            {currentSession.riskScore}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Device Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          {getDeviceIcon(currentSession.deviceInfo.type)}
                          <span className="capitalize">{currentSession.deviceInfo.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Browser:</span>
                          <span>{currentSession.deviceInfo.browser}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">OS:</span>
                          <span>{currentSession.deviceInfo.os}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Location</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{currentSession.location.city}, {currentSession.location.country}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Wifi className="w-4 h-4 text-gray-400" />
                          <span className="font-mono">{currentSession.location.ip}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Session Timer */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Time Remaining</span>
                    <span className={state.timeRemaining < 300000 ? 'text-red-600 font-medium' : ''}>
                      {formatTimeRemaining(state.timeRemaining)}
                    </span>
                  </div>
                  <Progress
                    value={(state.timeRemaining / (sessionConfig.sessionTimeout * 60 * 1000)) * 100}
                    className="h-2"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button
                    onClick={handleExtendSession}
                    disabled={state.isExtending}
                    variant="outline"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${state.isExtending ? 'animate-spin' : ''}`} />
                    Extend Session
                  </Button>
                  <Button
                    onClick={() => handleTerminateSession(currentSession.id)}
                    disabled={state.isTerminating}
                    variant="destructive"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    End Session
                  </Button>
                </div>

                {/* Recent Activities */}
                <div>
                  <h4 className="font-medium mb-2">Recent Activities</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {currentSession.activities.slice(0, 10).map(activity => (
                      <div key={activity.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <span>{activity.description}</span>
                        <span className="text-gray-500">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <XCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Session</h3>
                <p className="text-sm text-gray-600">Please log in to view session details.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* All Sessions Tab */}
        <TabsContent value="all">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">All Active Sessions</h3>
              {otherSessions.length > 0 && (
                <Button
                  onClick={handleTerminateAllSessions}
                  disabled={state.isTerminating}
                  variant="destructive"
                  size="sm"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Terminate All Others
                </Button>
              )}
            </div>

            <div className="grid gap-4">
              {activeSessions.map(session => (
                <Card key={session.id} className={session.isCurrent ? 'ring-2 ring-blue-500' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getDeviceIcon(session.deviceInfo.type)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">
                              {session.deviceInfo.browser} on {session.deviceInfo.os}
                            </h4>
                            {session.isCurrent && (
                              <Badge className="bg-blue-100 text-blue-600">Current</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {session.location.city}, {session.location.country} • {session.location.ip}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={getSecurityLevelColor(session.securityLevel)}>
                              {session.securityLevel}
                            </Badge>
                            <Badge className={session.mfaVerified ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}>
                              {session.mfaVerified ? 'MFA' : 'No MFA'}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Risk: {session.riskScore}/100
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Last activity: {new Date(session.lastActivity).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => setState(prev => ({
                            ...prev,
                            selectedSession: session,
                            showSessionDetails: true
                          }))}
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                        {!session.isCurrent && (
                          <Button
                            onClick={() => handleTerminateSession(session.id)}
                            disabled={state.isTerminating}
                            size="sm"
                            variant="destructive"
                          >
                            <LogOut className="w-3 h-3 mr-1" />
                            Terminate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {activeSessions.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
                  <p className="text-sm text-gray-600">No sessions are currently active.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Session Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Maximum Sessions</Label>
                    <p className="text-xs text-gray-600 mb-2">
                      Maximum number of concurrent sessions allowed
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{sessionConfig.maxSessions}</span>
                      <span className="text-sm text-gray-600">sessions</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Session Timeout</Label>
                    <p className="text-xs text-gray-600 mb-2">
                      Automatic session expiration time
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{sessionConfig.sessionTimeout}</span>
                      <span className="text-sm text-gray-600">minutes</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Idle Timeout</Label>
                    <p className="text-xs text-gray-600 mb-2">
                      Time before session is considered idle
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{sessionConfig.idleTimeout}</span>
                      <span className="text-sm text-gray-600">minutes</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Extend on Activity</Label>
                        <p className="text-xs text-gray-600">
                          Automatically extend session when user is active
                        </p>
                      </div>
                      <Badge className={sessionConfig.extendOnActivity ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                        {sessionConfig.extendOnActivity ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Require MFA for Sensitive</Label>
                        <p className="text-xs text-gray-600">
                          Require MFA for sensitive operations
                        </p>
                      </div>
                      <Badge className={sessionConfig.requireMfaForSensitive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                        {sessionConfig.requireMfaForSensitive ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Allow Concurrent Sessions</Label>
                        <p className="text-xs text-gray-600">
                          Allow multiple sessions from different devices
                        </p>
                      </div>
                      <Badge className={sessionConfig.allowConcurrentSessions ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                        {sessionConfig.allowConcurrentSessions ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-sm font-medium">Track Location</Label>
                        <p className="text-xs text-gray-600">
                          Track and log session locations
                        </p>
                      </div>
                      <Badge className={sessionConfig.trackLocation ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}>
                        {sessionConfig.trackLocation ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    if (onConfigUpdate) {
                      onConfigUpdate(sessionConfig);
                    }
                  }}
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default SessionManager;

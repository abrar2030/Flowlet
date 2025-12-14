import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Clock,
  Shield,
  Monitor,
  Smartphone,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogOut,
  RefreshCw,
  Eye,
  Activity,
  MapPin,
  Wifi,
} from "lucide-react";
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
    trackDeviceFingerprint: true,
  },
  onSessionTerminate,
  onSessionExtend,
  onSessionTerminateAll,
  onConfigUpdate,
  onActivityLog,
  className = "",
}) {
  const [state, setState] = useState({
    activeTab: "current",
    timeRemaining: 0,
    isIdle: false,
    idleTime: 0,
    showWarning: false,
    isExtending: false,
    isTerminating: false,
    error: null,
    success: null,
    selectedSession: null,
    showSessionDetails: false,
  });
  const idleTimerRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  // Calculate time remaining for current session
  useEffect(() => {
    if (!currentSession) return;
    const updateTimeRemaining = () => {
      const now = Date.now();
      const expiresAt = new Date(currentSession.expiresAt).getTime();
      const remaining = Math.max(0, expiresAt - now);
      setState((prev) => ({
        ...prev,
        timeRemaining: remaining,
        showWarning: remaining < 300000 && remaining > 0, // Show warning when < 5 minutes
      }));
      if (remaining === 0) {
        // Session expired
        if (onActivityLog) {
          onActivityLog({
            type: "security_event",
            description: "Session expired due to timeout",
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
      setState((prev) => ({ ...prev, isIdle: false, idleTime: 0 }));
      if (sessionConfig.extendOnActivity && currentSession && onSessionExtend) {
        // Auto-extend session on activity
        onSessionExtend(currentSession.id);
      }
      if (onActivityLog) {
        onActivityLog({
          type: "page_view",
          description: "User activity detected",
        });
      }
    };
    const checkIdleTime = () => {
      const now = Date.now();
      const idleTime = now - lastActivityRef.current;
      const idleMinutes = idleTime / (1000 * 60);
      setState((prev) => ({
        ...prev,
        idleTime: idleTime,
        isIdle: idleMinutes >= sessionConfig.idleTimeout,
      }));
      if (idleMinutes >= sessionConfig.idleTimeout) {
        if (onActivityLog) {
          onActivityLog({
            type: "security_event",
            description: `User idle for ${Math.round(idleMinutes)} minutes`,
          });
        }
      }
    };
    // Add activity listeners
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });
    // Check idle time every minute
    const idleTimer = setInterval(checkIdleTime, 60000);
    idleTimerRef.current = idleTimer;
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (idleTimer) clearInterval(idleTimer);
    };
  }, [sessionConfig, currentSession, onSessionExtend, onActivityLog]);
  // Handle session extension
  const handleExtendSession = useCallback(async () => {
    if (!currentSession || !onSessionExtend) return;
    setState((prev) => ({ ...prev, isExtending: true, error: null }));
    try {
      await onSessionExtend(currentSession.id);
      setState((prev) => ({
        ...prev,
        success: "Session extended successfully",
      }));
      if (onActivityLog) {
        onActivityLog({
          type: "security_event",
          description: "Session manually extended",
        });
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to extend session" }));
    } finally {
      setState((prev) => ({ ...prev, isExtending: false }));
    }
  }, [currentSession, onSessionExtend, onActivityLog]);
  // Handle session termination
  const handleTerminateSession = useCallback(
    async (sessionId) => {
      if (!onSessionTerminate) return;
      setState((prev) => ({ ...prev, isTerminating: true, error: null }));
      try {
        await onSessionTerminate(sessionId);
        setState((prev) => ({
          ...prev,
          success: "Session terminated successfully",
        }));
        if (onActivityLog) {
          onActivityLog({
            type: "logout",
            description: `Session ${sessionId} terminated`,
          });
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to terminate session" }));
      } finally {
        setState((prev) => ({ ...prev, isTerminating: false }));
      }
    },
    [onSessionTerminate, onActivityLog],
  );
  // Handle terminate all sessions
  const handleTerminateAllSessions = useCallback(async () => {
    if (!onSessionTerminateAll) return;
    if (!confirm("Are you sure you want to terminate all other sessions?"))
      return;
    setState((prev) => ({ ...prev, isTerminating: true, error: null }));
    try {
      await onSessionTerminateAll();
      setState((prev) => ({
        ...prev,
        success: "All sessions terminated successfully",
      }));
      if (onActivityLog) {
        onActivityLog({
          type: "security_event",
          description: "All sessions terminated by user",
        });
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to terminate sessions" }));
    } finally {
      setState((prev) => ({ ...prev, isTerminating: false }));
    }
  }, [onSessionTerminateAll, onActivityLog]);
  const formatTimeRemaining = (milliseconds) => {
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
  const formatIdleTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    return `${minutes} minutes`;
  };
  const getDeviceIcon = (type) => {
    switch (type) {
      case "desktop":
        return _jsx(Monitor, { className: "w-4 h-4" });
      case "mobile":
        return _jsx(Smartphone, { className: "w-4 h-4" });
      case "tablet":
        return _jsx(Monitor, { className: "w-4 h-4" });
      default:
        return _jsx(Monitor, { className: "w-4 h-4" });
    }
  };
  const getSecurityLevelColor = (level) => {
    switch (level) {
      case "high":
        return "bg-green-100 text-green-600";
      case "medium":
        return "bg-yellow-100 text-yellow-600";
      case "low":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const getRiskScoreColor = (score) => {
    if (score < 30) return "text-green-600";
    if (score < 70) return "text-yellow-600";
    return "text-red-600";
  };
  const activeSessions = allSessions.filter((s) => s.isActive);
  const otherSessions = activeSessions.filter((s) => !s.isCurrent);
  return _jsxs("div", {
    className: `space-y-6 ${className}`,
    children: [
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsxs(CardTitle, {
              className: "flex items-center justify-between",
              children: [
                _jsxs("div", {
                  className: "flex items-center",
                  children: [
                    _jsx(Shield, { className: "w-6 h-6 mr-3 text-blue-600" }),
                    "Session Management",
                  ],
                }),
                _jsxs("div", {
                  className: "flex items-center space-x-2",
                  children: [
                    _jsxs(Badge, {
                      className: "bg-blue-100 text-blue-600",
                      children: [
                        _jsx(Activity, { className: "w-3 h-3 mr-1" }),
                        activeSessions.length,
                        " Active",
                      ],
                    }),
                    state.isIdle &&
                      _jsxs(Badge, {
                        className: "bg-yellow-100 text-yellow-600",
                        children: [
                          _jsx(Clock, { className: "w-3 h-3 mr-1" }),
                          "Idle",
                        ],
                      }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(CardContent, {
            children: _jsx("p", {
              className: "text-sm text-gray-600",
              children:
                "Monitor and manage your active sessions across all devices and locations.",
            }),
          }),
        ],
      }),
      state.showWarning &&
        currentSession &&
        _jsxs(Alert, {
          className: "border-amber-200 bg-amber-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-amber-600" }),
            _jsx(AlertDescription, {
              className: "text-amber-800",
              children: _jsxs("div", {
                className: "flex items-center justify-between",
                children: [
                  _jsxs("span", {
                    children: [
                      "Your session will expire in",
                      " ",
                      formatTimeRemaining(state.timeRemaining),
                    ],
                  }),
                  _jsx(Button, {
                    onClick: handleExtendSession,
                    disabled: state.isExtending,
                    size: "sm",
                    className: "ml-4",
                    children: state.isExtending
                      ? "Extending..."
                      : "Extend Session",
                  }),
                ],
              }),
            }),
          ],
        }),
      state.isIdle &&
        _jsxs(Alert, {
          className: "border-yellow-200 bg-yellow-50",
          children: [
            _jsx(Clock, { className: "h-4 w-4 text-yellow-600" }),
            _jsxs(AlertDescription, {
              className: "text-yellow-800",
              children: [
                "You have been idle for ",
                formatIdleTime(state.idleTime),
                ". Your session may be terminated for security.",
              ],
            }),
          ],
        }),
      state.error &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(XCircle, { className: "h-4 w-4 text-red-600" }),
            _jsx(AlertDescription, {
              className: "text-red-800",
              children: state.error,
            }),
          ],
        }),
      state.success &&
        _jsxs(Alert, {
          className: "border-green-200 bg-green-50",
          children: [
            _jsx(CheckCircle, { className: "h-4 w-4 text-green-600" }),
            _jsx(AlertDescription, {
              className: "text-green-800",
              children: state.success,
            }),
          ],
        }),
      _jsxs(Tabs, {
        value: state.activeTab,
        onValueChange: (value) =>
          setState((prev) => ({ ...prev, activeTab: value })),
        children: [
          _jsxs(TabsList, {
            className: "grid w-full grid-cols-3",
            children: [
              _jsx(TabsTrigger, {
                value: "current",
                children: "Current Session",
              }),
              _jsx(TabsTrigger, { value: "all", children: "All Sessions" }),
              _jsx(TabsTrigger, { value: "settings", children: "Settings" }),
            ],
          }),
          _jsx(TabsContent, {
            value: "current",
            children: currentSession
              ? _jsxs(Card, {
                  children: [
                    _jsx(CardHeader, {
                      children: _jsxs(CardTitle, {
                        className: "flex items-center justify-between",
                        children: [
                          _jsx("span", { children: "Current Session Details" }),
                          _jsxs(Badge, {
                            className: getSecurityLevelColor(
                              currentSession.securityLevel,
                            ),
                            children: [
                              _jsx(Shield, { className: "w-3 h-3 mr-1" }),
                              currentSession.securityLevel,
                              " Security",
                            ],
                          }),
                        ],
                      }),
                    }),
                    _jsxs(CardContent, {
                      className: "space-y-6",
                      children: [
                        _jsxs("div", {
                          className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                          children: [
                            _jsxs("div", {
                              className: "space-y-4",
                              children: [
                                _jsxs("div", {
                                  children: [
                                    _jsx("h4", {
                                      className: "font-medium mb-2",
                                      children: "Session Information",
                                    }),
                                    _jsxs("div", {
                                      className: "space-y-2 text-sm",
                                      children: [
                                        _jsxs("div", {
                                          className: "flex justify-between",
                                          children: [
                                            _jsx("span", {
                                              className: "text-gray-600",
                                              children: "Session ID:",
                                            }),
                                            _jsxs("span", {
                                              className: "font-mono",
                                              children: [
                                                currentSession.id.substring(
                                                  0,
                                                  8,
                                                ),
                                                "...",
                                              ],
                                            }),
                                          ],
                                        }),
                                        _jsxs("div", {
                                          className: "flex justify-between",
                                          children: [
                                            _jsx("span", {
                                              className: "text-gray-600",
                                              children: "Created:",
                                            }),
                                            _jsx("span", {
                                              children: new Date(
                                                currentSession.createdAt,
                                              ).toLocaleString(),
                                            }),
                                          ],
                                        }),
                                        _jsxs("div", {
                                          className: "flex justify-between",
                                          children: [
                                            _jsx("span", {
                                              className: "text-gray-600",
                                              children: "Last Activity:",
                                            }),
                                            _jsx("span", {
                                              children: new Date(
                                                currentSession.lastActivity,
                                              ).toLocaleString(),
                                            }),
                                          ],
                                        }),
                                        _jsxs("div", {
                                          className: "flex justify-between",
                                          children: [
                                            _jsx("span", {
                                              className: "text-gray-600",
                                              children: "Expires:",
                                            }),
                                            _jsx("span", {
                                              children: new Date(
                                                currentSession.expiresAt,
                                              ).toLocaleString(),
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                _jsxs("div", {
                                  children: [
                                    _jsx("h4", {
                                      className: "font-medium mb-2",
                                      children: "Security Status",
                                    }),
                                    _jsxs("div", {
                                      className: "space-y-2",
                                      children: [
                                        _jsxs("div", {
                                          className:
                                            "flex items-center justify-between",
                                          children: [
                                            _jsx("span", {
                                              className:
                                                "text-sm text-gray-600",
                                              children: "MFA Verified:",
                                            }),
                                            _jsx(Badge, {
                                              className:
                                                currentSession.mfaVerified
                                                  ? "bg-green-100 text-green-600"
                                                  : "bg-red-100 text-red-600",
                                              children:
                                                currentSession.mfaVerified
                                                  ? _jsxs(_Fragment, {
                                                      children: [
                                                        _jsx(CheckCircle, {
                                                          className:
                                                            "w-3 h-3 mr-1",
                                                        }),
                                                        "Verified",
                                                      ],
                                                    })
                                                  : _jsxs(_Fragment, {
                                                      children: [
                                                        _jsx(XCircle, {
                                                          className:
                                                            "w-3 h-3 mr-1",
                                                        }),
                                                        "Not Verified",
                                                      ],
                                                    }),
                                            }),
                                          ],
                                        }),
                                        _jsxs("div", {
                                          className:
                                            "flex items-center justify-between",
                                          children: [
                                            _jsx("span", {
                                              className:
                                                "text-sm text-gray-600",
                                              children: "Risk Score:",
                                            }),
                                            _jsxs("span", {
                                              className: `font-medium ${getRiskScoreColor(currentSession.riskScore)}`,
                                              children: [
                                                currentSession.riskScore,
                                                "/100",
                                              ],
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            _jsxs("div", {
                              className: "space-y-4",
                              children: [
                                _jsxs("div", {
                                  children: [
                                    _jsx("h4", {
                                      className: "font-medium mb-2",
                                      children: "Device Information",
                                    }),
                                    _jsxs("div", {
                                      className: "space-y-2 text-sm",
                                      children: [
                                        _jsxs("div", {
                                          className:
                                            "flex items-center space-x-2",
                                          children: [
                                            getDeviceIcon(
                                              currentSession.deviceInfo.type,
                                            ),
                                            _jsx("span", {
                                              className: "capitalize",
                                              children:
                                                currentSession.deviceInfo.type,
                                            }),
                                          ],
                                        }),
                                        _jsxs("div", {
                                          className: "flex justify-between",
                                          children: [
                                            _jsx("span", {
                                              className: "text-gray-600",
                                              children: "Browser:",
                                            }),
                                            _jsx("span", {
                                              children:
                                                currentSession.deviceInfo
                                                  .browser,
                                            }),
                                          ],
                                        }),
                                        _jsxs("div", {
                                          className: "flex justify-between",
                                          children: [
                                            _jsx("span", {
                                              className: "text-gray-600",
                                              children: "OS:",
                                            }),
                                            _jsx("span", {
                                              children:
                                                currentSession.deviceInfo.os,
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                _jsxs("div", {
                                  children: [
                                    _jsx("h4", {
                                      className: "font-medium mb-2",
                                      children: "Location",
                                    }),
                                    _jsxs("div", {
                                      className: "space-y-2 text-sm",
                                      children: [
                                        _jsxs("div", {
                                          className:
                                            "flex items-center space-x-2",
                                          children: [
                                            _jsx(MapPin, {
                                              className:
                                                "w-4 h-4 text-gray-400",
                                            }),
                                            _jsxs("span", {
                                              children: [
                                                currentSession.location.city,
                                                ",",
                                                " ",
                                                currentSession.location.country,
                                              ],
                                            }),
                                          ],
                                        }),
                                        _jsxs("div", {
                                          className:
                                            "flex items-center space-x-2",
                                          children: [
                                            _jsx(Wifi, {
                                              className:
                                                "w-4 h-4 text-gray-400",
                                            }),
                                            _jsx("span", {
                                              className: "font-mono",
                                              children:
                                                currentSession.location.ip,
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        _jsxs("div", {
                          className: "space-y-2",
                          children: [
                            _jsxs("div", {
                              className: "flex justify-between text-sm",
                              children: [
                                _jsx("span", { children: "Time Remaining" }),
                                _jsx("span", {
                                  className:
                                    state.timeRemaining < 300000
                                      ? "text-red-600 font-medium"
                                      : "",
                                  children: formatTimeRemaining(
                                    state.timeRemaining,
                                  ),
                                }),
                              ],
                            }),
                            _jsx(Progress, {
                              value:
                                (state.timeRemaining /
                                  (sessionConfig.sessionTimeout * 60 * 1000)) *
                                100,
                              className: "h-2",
                            }),
                          ],
                        }),
                        _jsxs("div", {
                          className: "flex space-x-2",
                          children: [
                            _jsxs(Button, {
                              onClick: handleExtendSession,
                              disabled: state.isExtending,
                              variant: "outline",
                              children: [
                                _jsx(RefreshCw, {
                                  className: `w-4 h-4 mr-2 ${state.isExtending ? "animate-spin" : ""}`,
                                }),
                                "Extend Session",
                              ],
                            }),
                            _jsxs(Button, {
                              onClick: () =>
                                handleTerminateSession(currentSession.id),
                              disabled: state.isTerminating,
                              variant: "destructive",
                              children: [
                                _jsx(LogOut, { className: "w-4 h-4 mr-2" }),
                                "End Session",
                              ],
                            }),
                          ],
                        }),
                        _jsxs("div", {
                          children: [
                            _jsx("h4", {
                              className: "font-medium mb-2",
                              children: "Recent Activities",
                            }),
                            _jsx("div", {
                              className: "space-y-2 max-h-48 overflow-y-auto",
                              children: currentSession.activities
                                .slice(0, 10)
                                .map((activity) =>
                                  _jsxs(
                                    "div",
                                    {
                                      className:
                                        "flex items-center justify-between p-2 bg-gray-50 rounded text-sm",
                                      children: [
                                        _jsx("span", {
                                          children: activity.description,
                                        }),
                                        _jsx("span", {
                                          className: "text-gray-500",
                                          children: new Date(
                                            activity.timestamp,
                                          ).toLocaleTimeString(),
                                        }),
                                      ],
                                    },
                                    activity.id,
                                  ),
                                ),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                })
              : _jsx(Card, {
                  children: _jsxs(CardContent, {
                    className: "p-6 text-center",
                    children: [
                      _jsx(XCircle, {
                        className: "w-12 h-12 mx-auto mb-4 text-gray-400",
                      }),
                      _jsx("h3", {
                        className: "text-lg font-medium text-gray-900 mb-2",
                        children: "No Active Session",
                      }),
                      _jsx("p", {
                        className: "text-sm text-gray-600",
                        children: "Please log in to view session details.",
                      }),
                    ],
                  }),
                }),
          }),
          _jsx(TabsContent, {
            value: "all",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsx("h3", {
                      className: "text-lg font-medium",
                      children: "All Active Sessions",
                    }),
                    otherSessions.length > 0 &&
                      _jsxs(Button, {
                        onClick: handleTerminateAllSessions,
                        disabled: state.isTerminating,
                        variant: "destructive",
                        size: "sm",
                        children: [
                          _jsx(LogOut, { className: "w-4 h-4 mr-2" }),
                          "Terminate All Others",
                        ],
                      }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: activeSessions.map((session) =>
                    _jsx(
                      Card,
                      {
                        className: session.isCurrent
                          ? "ring-2 ring-blue-500"
                          : "",
                        children: _jsx(CardContent, {
                          className: "p-4",
                          children: _jsxs("div", {
                            className: "flex items-center justify-between",
                            children: [
                              _jsxs("div", {
                                className: "flex items-center space-x-3",
                                children: [
                                  getDeviceIcon(session.deviceInfo.type),
                                  _jsxs("div", {
                                    children: [
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-2",
                                        children: [
                                          _jsxs("h4", {
                                            className: "font-medium",
                                            children: [
                                              session.deviceInfo.browser,
                                              " on",
                                              " ",
                                              session.deviceInfo.os,
                                            ],
                                          }),
                                          session.isCurrent &&
                                            _jsx(Badge, {
                                              className:
                                                "bg-blue-100 text-blue-600",
                                              children: "Current",
                                            }),
                                        ],
                                      }),
                                      _jsxs("p", {
                                        className: "text-sm text-gray-600",
                                        children: [
                                          session.location.city,
                                          ", ",
                                          session.location.country,
                                          " ",
                                          "\u2022 ",
                                          session.location.ip,
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-2 mt-1",
                                        children: [
                                          _jsx(Badge, {
                                            className: getSecurityLevelColor(
                                              session.securityLevel,
                                            ),
                                            children: session.securityLevel,
                                          }),
                                          _jsx(Badge, {
                                            className: session.mfaVerified
                                              ? "bg-green-100 text-green-600"
                                              : "bg-red-100 text-red-600",
                                            children: session.mfaVerified
                                              ? "MFA"
                                              : "No MFA",
                                          }),
                                          _jsxs("span", {
                                            className: "text-xs text-gray-500",
                                            children: [
                                              "Risk: ",
                                              session.riskScore,
                                              "/100",
                                            ],
                                          }),
                                        ],
                                      }),
                                      _jsxs("p", {
                                        className: "text-xs text-gray-500 mt-1",
                                        children: [
                                          "Last activity:",
                                          " ",
                                          new Date(
                                            session.lastActivity,
                                          ).toLocaleString(),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex space-x-2",
                                children: [
                                  _jsxs(Button, {
                                    onClick: () =>
                                      setState((prev) => ({
                                        ...prev,
                                        selectedSession: session,
                                        showSessionDetails: true,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Eye, { className: "w-3 h-3 mr-1" }),
                                      "Details",
                                    ],
                                  }),
                                  !session.isCurrent &&
                                    _jsxs(Button, {
                                      onClick: () =>
                                        handleTerminateSession(session.id),
                                      disabled: state.isTerminating,
                                      size: "sm",
                                      variant: "destructive",
                                      children: [
                                        _jsx(LogOut, {
                                          className: "w-3 h-3 mr-1",
                                        }),
                                        "Terminate",
                                      ],
                                    }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      },
                      session.id,
                    ),
                  ),
                }),
                activeSessions.length === 0 &&
                  _jsx(Card, {
                    children: _jsxs(CardContent, {
                      className: "p-6 text-center",
                      children: [
                        _jsx(Activity, {
                          className: "w-12 h-12 mx-auto mb-4 text-gray-400",
                        }),
                        _jsx("h3", {
                          className: "text-lg font-medium text-gray-900 mb-2",
                          children: "No Active Sessions",
                        }),
                        _jsx("p", {
                          className: "text-sm text-gray-600",
                          children: "No sessions are currently active.",
                        }),
                      ],
                    }),
                  }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "settings",
            children: _jsxs(Card, {
              children: [
                _jsx(CardHeader, {
                  children: _jsx(CardTitle, {
                    children: "Session Configuration",
                  }),
                }),
                _jsxs(CardContent, {
                  className: "space-y-6",
                  children: [
                    _jsxs("div", {
                      className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                      children: [
                        _jsxs("div", {
                          className: "space-y-4",
                          children: [
                            _jsxs("div", {
                              children: [
                                _jsx(Label, {
                                  className: "text-sm font-medium",
                                  children: "Maximum Sessions",
                                }),
                                _jsx("p", {
                                  className: "text-xs text-gray-600 mb-2",
                                  children:
                                    "Maximum number of concurrent sessions allowed",
                                }),
                                _jsxs("div", {
                                  className: "flex items-center space-x-2",
                                  children: [
                                    _jsx("span", {
                                      className: "text-2xl font-bold",
                                      children: sessionConfig.maxSessions,
                                    }),
                                    _jsx("span", {
                                      className: "text-sm text-gray-600",
                                      children: "sessions",
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            _jsxs("div", {
                              children: [
                                _jsx(Label, {
                                  className: "text-sm font-medium",
                                  children: "Session Timeout",
                                }),
                                _jsx("p", {
                                  className: "text-xs text-gray-600 mb-2",
                                  children: "Automatic session expiration time",
                                }),
                                _jsxs("div", {
                                  className: "flex items-center space-x-2",
                                  children: [
                                    _jsx("span", {
                                      className: "text-2xl font-bold",
                                      children: sessionConfig.sessionTimeout,
                                    }),
                                    _jsx("span", {
                                      className: "text-sm text-gray-600",
                                      children: "minutes",
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            _jsxs("div", {
                              children: [
                                _jsx(Label, {
                                  className: "text-sm font-medium",
                                  children: "Idle Timeout",
                                }),
                                _jsx("p", {
                                  className: "text-xs text-gray-600 mb-2",
                                  children:
                                    "Time before session is considered idle",
                                }),
                                _jsxs("div", {
                                  className: "flex items-center space-x-2",
                                  children: [
                                    _jsx("span", {
                                      className: "text-2xl font-bold",
                                      children: sessionConfig.idleTimeout,
                                    }),
                                    _jsx("span", {
                                      className: "text-sm text-gray-600",
                                      children: "minutes",
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        _jsx("div", {
                          className: "space-y-4",
                          children: _jsxs("div", {
                            className: "space-y-3",
                            children: [
                              _jsxs("div", {
                                className: "flex items-center justify-between",
                                children: [
                                  _jsxs("div", {
                                    children: [
                                      _jsx(Label, {
                                        className: "text-sm font-medium",
                                        children: "Extend on Activity",
                                      }),
                                      _jsx("p", {
                                        className: "text-xs text-gray-600",
                                        children:
                                          "Automatically extend session when user is active",
                                      }),
                                    ],
                                  }),
                                  _jsx(Badge, {
                                    className: sessionConfig.extendOnActivity
                                      ? "bg-green-100 text-green-600"
                                      : "bg-gray-100 text-gray-600",
                                    children: sessionConfig.extendOnActivity
                                      ? "Enabled"
                                      : "Disabled",
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex items-center justify-between",
                                children: [
                                  _jsxs("div", {
                                    children: [
                                      _jsx(Label, {
                                        className: "text-sm font-medium",
                                        children: "Require MFA for Sensitive",
                                      }),
                                      _jsx("p", {
                                        className: "text-xs text-gray-600",
                                        children:
                                          "Require MFA for sensitive operations",
                                      }),
                                    ],
                                  }),
                                  _jsx(Badge, {
                                    className:
                                      sessionConfig.requireMfaForSensitive
                                        ? "bg-green-100 text-green-600"
                                        : "bg-gray-100 text-gray-600",
                                    children:
                                      sessionConfig.requireMfaForSensitive
                                        ? "Enabled"
                                        : "Disabled",
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex items-center justify-between",
                                children: [
                                  _jsxs("div", {
                                    children: [
                                      _jsx(Label, {
                                        className: "text-sm font-medium",
                                        children: "Allow Concurrent Sessions",
                                      }),
                                      _jsx("p", {
                                        className: "text-xs text-gray-600",
                                        children:
                                          "Allow multiple sessions from different devices",
                                      }),
                                    ],
                                  }),
                                  _jsx(Badge, {
                                    className:
                                      sessionConfig.allowConcurrentSessions
                                        ? "bg-green-100 text-green-600"
                                        : "bg-gray-100 text-gray-600",
                                    children:
                                      sessionConfig.allowConcurrentSessions
                                        ? "Enabled"
                                        : "Disabled",
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex items-center justify-between",
                                children: [
                                  _jsxs("div", {
                                    children: [
                                      _jsx(Label, {
                                        className: "text-sm font-medium",
                                        children: "Track Location",
                                      }),
                                      _jsx("p", {
                                        className: "text-xs text-gray-600",
                                        children:
                                          "Track and log session locations",
                                      }),
                                    ],
                                  }),
                                  _jsx(Badge, {
                                    className: sessionConfig.trackLocation
                                      ? "bg-green-100 text-green-600"
                                      : "bg-gray-100 text-gray-600",
                                    children: sessionConfig.trackLocation
                                      ? "Enabled"
                                      : "Disabled",
                                  }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      ],
                    }),
                    _jsx("div", {
                      className: "pt-4 border-t",
                      children: _jsxs(Button, {
                        onClick: () => {
                          if (onConfigUpdate) {
                            onConfigUpdate(sessionConfig);
                          }
                        },
                        variant: "outline",
                        children: [
                          _jsx(RefreshCw, { className: "w-4 h-4 mr-2" }),
                          "Update Configuration",
                        ],
                      }),
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}
export default SessionManager;

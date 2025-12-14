import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Eye,
  Lock,
  Wifi,
  Globe,
  Clock,
  TrendingUp,
  RefreshCw,
  Download,
} from "lucide-react";
export function SecurityMonitor({
  events = [],
  metrics,
  threatLevel,
  onRefresh,
  onExport,
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  className = "",
}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [filter, setFilter] = useState("all");
  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && onRefresh) {
      const interval = setInterval(() => {
        handleRefresh();
      }, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, onRefresh]);
  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-100 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-100 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "low":
        return "text-green-600 bg-green-100 border-green-200";
      default:
        return "text-gray-600 bg-gray-100 border-gray-200";
    }
  };
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "critical":
        return _jsx(XCircle, { className: "w-4 h-4" });
      case "high":
        return _jsx(AlertTriangle, { className: "w-4 h-4" });
      case "medium":
        return _jsx(Activity, { className: "w-4 h-4" });
      case "low":
        return _jsx(CheckCircle, { className: "w-4 h-4" });
      default:
        return _jsx(Activity, { className: "w-4 h-4" });
    }
  };
  const getThreatLevelColor = (level) => {
    switch (level) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };
  const filteredEvents = events.filter(
    (event) => filter === "all" || event.severity === filter,
  );
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  const calculateThreatScore = () => {
    if (threatLevel) return threatLevel.score;
    if (!metrics) return 0;
    const { criticalEvents, highEvents, mediumEvents, totalEvents } = metrics;
    if (totalEvents === 0) return 0;
    const score =
      ((criticalEvents * 4 + highEvents * 3 + mediumEvents * 2) / totalEvents) *
      25;
    return Math.min(100, Math.round(score));
  };
  const getThreatLevelFromScore = (score) => {
    if (score >= 75) return "critical";
    if (score >= 50) return "high";
    if (score >= 25) return "medium";
    return "low";
  };
  const currentThreatScore = calculateThreatScore();
  const currentThreatLevel =
    threatLevel?.level || getThreatLevelFromScore(currentThreatScore);
  return _jsxs("div", {
    className: `space-y-6 ${className}`,
    children: [
      _jsxs("div", {
        className: "flex items-center justify-between",
        children: [
          _jsxs("div", {
            className: "flex items-center space-x-3",
            children: [
              _jsx(Shield, { className: "w-6 h-6 text-blue-600" }),
              _jsx("h2", {
                className: "text-2xl font-bold text-gray-900",
                children: "Security Monitor",
              }),
            ],
          }),
          _jsxs("div", {
            className: "flex space-x-2",
            children: [
              _jsxs(Button, {
                onClick: handleRefresh,
                disabled: isRefreshing,
                size: "sm",
                variant: "outline",
                children: [
                  _jsx(RefreshCw, {
                    className: `w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`,
                  }),
                  "Refresh",
                ],
              }),
              onExport &&
                _jsxs(Button, {
                  onClick: onExport,
                  size: "sm",
                  variant: "outline",
                  children: [
                    _jsx(Download, { className: "w-4 h-4 mr-2" }),
                    "Export",
                  ],
                }),
            ],
          }),
        ],
      }),
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsxs(CardTitle, {
              className: "flex items-center",
              children: [
                _jsx(TrendingUp, { className: "w-5 h-5 mr-2" }),
                "Threat Level Assessment",
              ],
            }),
          }),
          _jsx(CardContent, {
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [
                    _jsx("span", {
                      className: "text-sm font-medium",
                      children: "Current Threat Level",
                    }),
                    _jsxs(Badge, {
                      className: `${getSeverityColor(currentThreatLevel)} border`,
                      children: [
                        getSeverityIcon(currentThreatLevel),
                        _jsx("span", {
                          className: "ml-1 capitalize",
                          children: currentThreatLevel,
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
                        _jsx("span", { children: "Threat Score" }),
                        _jsxs("span", {
                          children: [currentThreatScore, "/100"],
                        }),
                      ],
                    }),
                    _jsx(Progress, {
                      value: currentThreatScore,
                      className: "h-2",
                      style: {
                        background: `linear-gradient(to right, ${getThreatLevelColor(currentThreatLevel)} 0%, ${getThreatLevelColor(currentThreatLevel)} ${currentThreatScore}%, #e5e7eb ${currentThreatScore}%, #e5e7eb 100%)`,
                      },
                    }),
                  ],
                }),
                threatLevel?.factors &&
                  threatLevel.factors.length > 0 &&
                  _jsxs("div", {
                    children: [
                      _jsx("h4", {
                        className: "text-sm font-medium mb-2",
                        children: "Contributing Factors:",
                      }),
                      _jsx("ul", {
                        className: "text-sm text-gray-600 space-y-1",
                        children: threatLevel.factors.map((factor, index) =>
                          _jsxs(
                            "li",
                            {
                              className: "flex items-center",
                              children: [
                                _jsx(AlertTriangle, {
                                  className: "w-3 h-3 mr-2 text-amber-500",
                                }),
                                factor,
                              ],
                            },
                            index,
                          ),
                        ),
                      }),
                    ],
                  }),
                threatLevel?.recommendations &&
                  threatLevel.recommendations.length > 0 &&
                  _jsxs("div", {
                    children: [
                      _jsx("h4", {
                        className: "text-sm font-medium mb-2",
                        children: "Recommendations:",
                      }),
                      _jsx("ul", {
                        className: "text-sm text-blue-600 space-y-1",
                        children: threatLevel.recommendations.map(
                          (rec, index) =>
                            _jsxs(
                              "li",
                              {
                                className: "flex items-center",
                                children: [
                                  _jsx(CheckCircle, {
                                    className: "w-3 h-3 mr-2 text-blue-500",
                                  }),
                                  rec,
                                ],
                              },
                              index,
                            ),
                        ),
                      }),
                    ],
                  }),
              ],
            }),
          }),
        ],
      }),
      metrics &&
        _jsxs("div", {
          className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
          children: [
            _jsx(Card, {
              children: _jsx(CardContent, {
                className: "p-4",
                children: _jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [
                    _jsxs("div", {
                      children: [
                        _jsx("p", {
                          className: "text-sm font-medium text-gray-600",
                          children: "Total Events",
                        }),
                        _jsx("p", {
                          className: "text-2xl font-bold",
                          children: metrics.totalEvents,
                        }),
                      ],
                    }),
                    _jsx(Activity, { className: "w-8 h-8 text-blue-500" }),
                  ],
                }),
              }),
            }),
            _jsx(Card, {
              children: _jsx(CardContent, {
                className: "p-4",
                children: _jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [
                    _jsxs("div", {
                      children: [
                        _jsx("p", {
                          className: "text-sm font-medium text-gray-600",
                          children: "Critical Events",
                        }),
                        _jsx("p", {
                          className: "text-2xl font-bold text-red-600",
                          children: metrics.criticalEvents,
                        }),
                      ],
                    }),
                    _jsx(XCircle, { className: "w-8 h-8 text-red-500" }),
                  ],
                }),
              }),
            }),
            _jsx(Card, {
              children: _jsx(CardContent, {
                className: "p-4",
                children: _jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [
                    _jsxs("div", {
                      children: [
                        _jsx("p", {
                          className: "text-sm font-medium text-gray-600",
                          children: "Failed Logins",
                        }),
                        _jsx("p", {
                          className: "text-2xl font-bold text-orange-600",
                          children: metrics.failedLogins,
                        }),
                      ],
                    }),
                    _jsx(Lock, { className: "w-8 h-8 text-orange-500" }),
                  ],
                }),
              }),
            }),
            _jsx(Card, {
              children: _jsx(CardContent, {
                className: "p-4",
                children: _jsxs("div", {
                  className: "flex items-center justify-between",
                  children: [
                    _jsxs("div", {
                      children: [
                        _jsx("p", {
                          className: "text-sm font-medium text-gray-600",
                          children: "Data Accesses",
                        }),
                        _jsx("p", {
                          className: "text-2xl font-bold text-green-600",
                          children: metrics.dataAccesses,
                        }),
                      ],
                    }),
                    _jsx(Eye, { className: "w-8 h-8 text-green-500" }),
                  ],
                }),
              }),
            }),
          ],
        }),
      _jsxs(Card, {
        children: [
          _jsx(CardHeader, {
            children: _jsxs("div", {
              className: "flex items-center justify-between",
              children: [
                _jsxs(CardTitle, {
                  className: "flex items-center",
                  children: [
                    _jsx(Clock, { className: "w-5 h-5 mr-2" }),
                    "Security Events",
                  ],
                }),
                _jsx("div", {
                  className: "flex space-x-2",
                  children: ["all", "critical", "high", "medium", "low"].map(
                    (severity) =>
                      _jsx(
                        Button,
                        {
                          onClick: () => setFilter(severity),
                          size: "sm",
                          variant: filter === severity ? "default" : "outline",
                          className: "capitalize",
                          children: severity,
                        },
                        severity,
                      ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(CardContent, {
            children: _jsx("div", {
              className: "space-y-3 max-h-96 overflow-y-auto",
              children:
                filteredEvents.length === 0
                  ? _jsxs("div", {
                      className: "text-center py-8 text-gray-500",
                      children: [
                        _jsx(Activity, {
                          className: "w-12 h-12 mx-auto mb-4 text-gray-300",
                        }),
                        _jsx("p", { children: "No security events found" }),
                      ],
                    })
                  : filteredEvents.map((event) =>
                      _jsx(
                        "div",
                        {
                          className: `p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 ${selectedEvent?.id === event.id ? "ring-2 ring-blue-500" : ""}`,
                          onClick: () => setSelectedEvent(event),
                          children: _jsx("div", {
                            className: "flex items-start justify-between",
                            children: _jsxs("div", {
                              className: "flex items-start space-x-3",
                              children: [
                                _jsxs(Badge, {
                                  className: `${getSeverityColor(event.severity)} border`,
                                  children: [
                                    getSeverityIcon(event.severity),
                                    _jsx("span", {
                                      className: "ml-1 capitalize",
                                      children: event.severity,
                                    }),
                                  ],
                                }),
                                _jsxs("div", {
                                  children: [
                                    _jsx("p", {
                                      className: "font-medium text-sm",
                                      children: event.description,
                                    }),
                                    _jsxs("div", {
                                      className:
                                        "flex items-center space-x-4 text-xs text-gray-500 mt-1",
                                      children: [
                                        _jsxs("span", {
                                          className: "flex items-center",
                                          children: [
                                            _jsx(Clock, {
                                              className: "w-3 h-3 mr-1",
                                            }),
                                            formatTimestamp(event.timestamp),
                                          ],
                                        }),
                                        event.ipAddress &&
                                          _jsxs("span", {
                                            className: "flex items-center",
                                            children: [
                                              _jsx(Globe, {
                                                className: "w-3 h-3 mr-1",
                                              }),
                                              event.ipAddress,
                                            ],
                                          }),
                                        event.location &&
                                          _jsxs("span", {
                                            className: "flex items-center",
                                            children: [
                                              _jsx(Wifi, {
                                                className: "w-3 h-3 mr-1",
                                              }),
                                              event.location,
                                            ],
                                          }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          }),
                        },
                        event.id,
                      ),
                    ),
            }),
          }),
        ],
      }),
      selectedEvent &&
        _jsxs(Card, {
          className: "border-blue-200 bg-blue-50",
          children: [
            _jsx(CardHeader, {
              children: _jsxs("div", {
                className: "flex items-center justify-between",
                children: [
                  _jsx(CardTitle, {
                    className: "text-lg",
                    children: "Event Details",
                  }),
                  _jsx(Button, {
                    onClick: () => setSelectedEvent(null),
                    size: "sm",
                    variant: "outline",
                    children: "Close",
                  }),
                ],
              }),
            }),
            _jsx(CardContent, {
              children: _jsxs("div", {
                className: "space-y-4",
                children: [
                  _jsxs("div", {
                    className: "grid grid-cols-2 gap-4",
                    children: [
                      _jsxs("div", {
                        children: [
                          _jsx("label", {
                            className: "text-sm font-medium text-gray-600",
                            children: "Event ID",
                          }),
                          _jsx("p", {
                            className: "font-mono text-sm",
                            children: selectedEvent.id,
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        children: [
                          _jsx("label", {
                            className: "text-sm font-medium text-gray-600",
                            children: "Type",
                          }),
                          _jsx("p", {
                            className: "capitalize",
                            children: selectedEvent.type.replace("_", " "),
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        children: [
                          _jsx("label", {
                            className: "text-sm font-medium text-gray-600",
                            children: "Severity",
                          }),
                          _jsxs(Badge, {
                            className: `${getSeverityColor(selectedEvent.severity)} border`,
                            children: [
                              getSeverityIcon(selectedEvent.severity),
                              _jsx("span", {
                                className: "ml-1 capitalize",
                                children: selectedEvent.severity,
                              }),
                            ],
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        children: [
                          _jsx("label", {
                            className: "text-sm font-medium text-gray-600",
                            children: "Timestamp",
                          }),
                          _jsx("p", {
                            children: formatTimestamp(selectedEvent.timestamp),
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    children: [
                      _jsx("label", {
                        className: "text-sm font-medium text-gray-600",
                        children: "Description",
                      }),
                      _jsx("p", {
                        className: "mt-1",
                        children: selectedEvent.description,
                      }),
                    ],
                  }),
                  selectedEvent.userAgent &&
                    _jsxs("div", {
                      children: [
                        _jsx("label", {
                          className: "text-sm font-medium text-gray-600",
                          children: "User Agent",
                        }),
                        _jsx("p", {
                          className:
                            "font-mono text-xs bg-gray-100 p-2 rounded mt-1",
                          children: selectedEvent.userAgent,
                        }),
                      ],
                    }),
                  selectedEvent.metadata &&
                    _jsxs("div", {
                      children: [
                        _jsx("label", {
                          className: "text-sm font-medium text-gray-600",
                          children: "Metadata",
                        }),
                        _jsx("pre", {
                          className:
                            "text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto",
                          children: JSON.stringify(
                            selectedEvent.metadata,
                            null,
                            2,
                          ),
                        }),
                      ],
                    }),
                ],
              }),
            }),
          ],
        }),
      metrics?.lastUpdated &&
        _jsxs("div", {
          className: "text-xs text-gray-500 text-center",
          children: ["Last updated: ", formatTimestamp(metrics.lastUpdated)],
        }),
    ],
  });
}
export default SecurityMonitor;

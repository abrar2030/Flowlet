import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Progress } from "../ui/progress";
import {
  Shield,
  AlertTriangle,
  Activity,
  Eye,
  TrendingUp,
  TrendingDown,
  Monitor,
  Globe,
  Database,
  Key,
  FileText,
  Clock,
  Flag,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Search,
  MapPin,
  Server,
  HardDrive,
  Network,
} from "lucide-react";
export function SecurityDashboard({
  metrics = [],
  events = [],
  threats = [],
  systemHealth = [],
  complianceStatus = [],
  onEventInvestigate,
  onThreatMitigate,
  onMetricRefresh,
  onExportReport,
  realTimeUpdates = true,
  refreshInterval = 30,
  className = "",
}) {
  const [state, setState] = useState({
    activeTab: "overview",
    selectedEvent: null,
    selectedThreat: null,
    timeRange: "24h",
    searchTerm: "",
    filterSeverity: "all",
    filterType: "all",
    filterStatus: "all",
    showEventDetails: false,
    showThreatDetails: false,
    isRefreshing: false,
    isExporting: false,
    error: null,
    success: null,
    lastRefresh: new Date().toISOString(),
  });
  // Auto-refresh functionality
  useEffect(() => {
    if (!realTimeUpdates) return;
    const interval = setInterval(() => {
      setState((prev) => ({ ...prev, lastRefresh: new Date().toISOString() }));
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [realTimeUpdates, refreshInterval]);
  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const now = new Date();
    const timeRangeMs = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    }[state.timeRange];
    const cutoffTime = new Date(now.getTime() - timeRangeMs);
    // Filter events by time range
    const recentEvents = events.filter(
      (event) => new Date(event.timestamp) > cutoffTime,
    );
    const totalEvents = recentEvents.length;
    const criticalEvents = recentEvents.filter(
      (e) => e.severity === "critical",
    ).length;
    const highSeverityEvents = recentEvents.filter(
      (e) => e.severity === "high",
    ).length;
    const newEvents = recentEvents.filter((e) => e.status === "new").length;
    const activeThreats = threats.filter((t) => t.isActive).length;
    const criticalThreats = threats.filter(
      (t) => t.severity === "critical" && t.isActive,
    ).length;
    const healthyComponents = systemHealth.filter(
      (s) => s.status === "healthy",
    ).length;
    const degradedComponents = systemHealth.filter(
      (s) => s.status === "degraded",
    ).length;
    const downComponents = systemHealth.filter(
      (s) => s.status === "down",
    ).length;
    const averageUptime =
      systemHealth.length > 0
        ? systemHealth.reduce((sum, s) => sum + s.uptime, 0) /
          systemHealth.length
        : 100;
    const averageResponseTime =
      systemHealth.length > 0
        ? systemHealth.reduce((sum, s) => sum + s.responseTime, 0) /
          systemHealth.length
        : 0;
    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});
    const eventsBySeverity = recentEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {});
    const threatsByType = threats.reduce((acc, threat) => {
      acc[threat.type] = (acc[threat.type] || 0) + 1;
      return acc;
    }, {});
    const complianceOverall =
      complianceStatus.length > 0
        ? complianceStatus.reduce((sum, c) => sum + c.score, 0) /
          complianceStatus.length
        : 100;
    return {
      totalEvents,
      criticalEvents,
      highSeverityEvents,
      newEvents,
      activeThreats,
      criticalThreats,
      healthyComponents,
      degradedComponents,
      downComponents,
      averageUptime,
      averageResponseTime,
      eventsByType,
      eventsBySeverity,
      threatsByType,
      complianceOverall,
      systemHealthScore:
        systemHealth.length > 0
          ? (healthyComponents / systemHealth.length) * 100
          : 100,
    };
  }, [events, threats, systemHealth, complianceStatus, state.timeRange]);
  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.type.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        event.source.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        (event.userName &&
          event.userName
            .toLowerCase()
            .includes(state.searchTerm.toLowerCase()));
      const matchesSeverity =
        state.filterSeverity === "all" ||
        event.severity === state.filterSeverity;
      const matchesType =
        state.filterType === "all" || event.type === state.filterType;
      const matchesStatus =
        state.filterStatus === "all" || event.status === state.filterStatus;
      return matchesSearch && matchesSeverity && matchesType && matchesStatus;
    });
  }, [
    events,
    state.searchTerm,
    state.filterSeverity,
    state.filterType,
    state.filterStatus,
  ]);
  // Handle event investigation
  const handleEventInvestigate = useCallback(
    async (eventId) => {
      setState((prev) => ({ ...prev, isRefreshing: true, error: null }));
      try {
        if (onEventInvestigate) {
          await onEventInvestigate(eventId);
          setState((prev) => ({
            ...prev,
            success: "Event investigation initiated",
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Failed to initiate investigation",
        }));
      } finally {
        setState((prev) => ({ ...prev, isRefreshing: false }));
      }
    },
    [onEventInvestigate],
  );
  // Handle threat mitigation
  const handleThreatMitigate = useCallback(
    async (threatId, action) => {
      setState((prev) => ({ ...prev, isRefreshing: true, error: null }));
      try {
        if (onThreatMitigate) {
          await onThreatMitigate(threatId, action);
          setState((prev) => ({
            ...prev,
            success: "Threat mitigation initiated",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to mitigate threat" }));
      } finally {
        setState((prev) => ({ ...prev, isRefreshing: false }));
      }
    },
    [onThreatMitigate],
  );
  // Handle metric refresh
  const handleMetricRefresh = useCallback(
    async (metricId) => {
      setState((prev) => ({ ...prev, isRefreshing: true, error: null }));
      try {
        if (onMetricRefresh && metricId) {
          await onMetricRefresh(metricId);
        }
        setState((prev) => ({
          ...prev,
          success: "Metrics refreshed successfully",
          lastRefresh: new Date().toISOString(),
        }));
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to refresh metrics" }));
      } finally {
        setState((prev) => ({ ...prev, isRefreshing: false }));
      }
    },
    [onMetricRefresh],
  );
  // Handle export
  const handleExport = useCallback(
    async (type) => {
      setState((prev) => ({ ...prev, isExporting: true, error: null }));
      try {
        if (onExportReport) {
          const filters = {
            timeRange: state.timeRange,
            severity: state.filterSeverity,
            type: state.filterType,
            status: state.filterStatus,
            search: state.searchTerm,
          };
          const blob = await onExportReport(type, filters);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${type}-report-${new Date().toISOString().split("T")[0]}.csv`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setState((prev) => ({
            ...prev,
            success: "Report exported successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to export report" }));
      } finally {
        setState((prev) => ({ ...prev, isExporting: false }));
      }
    },
    [
      onExportReport,
      state.timeRange,
      state.filterSeverity,
      state.filterType,
      state.filterStatus,
      state.searchTerm,
    ],
  );
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "low":
        return "bg-green-100 text-green-600";
      case "medium":
        return "bg-yellow-100 text-yellow-600";
      case "high":
        return "bg-orange-100 text-orange-600";
      case "critical":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
      case "compliant":
      case "resolved":
        return "bg-green-100 text-green-600";
      case "degraded":
      case "partial":
      case "investigating":
        return "bg-yellow-100 text-yellow-600";
      case "down":
      case "non_compliant":
      case "new":
        return "bg-red-100 text-red-600";
      case "maintenance":
      case "unknown":
      case "false_positive":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const getMetricStatusColor = (metric) => {
    switch (metric.status) {
      case "normal":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };
  const getTrendIcon = (trend, percentage) => {
    if (trend === "up") {
      return _jsx(TrendingUp, {
        className: `w-4 h-4 ${percentage > 0 ? "text-red-500" : "text-green-500"}`,
      });
    } else if (trend === "down") {
      return _jsx(TrendingDown, {
        className: `w-4 h-4 ${percentage > 0 ? "text-green-500" : "text-red-500"}`,
      });
    }
    return _jsx(Activity, { className: "w-4 h-4 text-gray-500" });
  };
  const getEventTypeIcon = (type) => {
    switch (type) {
      case "login_attempt":
        return _jsx(Key, { className: "w-4 h-4" });
      case "data_access":
        return _jsx(Database, { className: "w-4 h-4" });
      case "permission_change":
        return _jsx(Shield, { className: "w-4 h-4" });
      case "system_alert":
        return _jsx(Monitor, { className: "w-4 h-4" });
      case "threat_detected":
        return _jsx(AlertTriangle, { className: "w-4 h-4" });
      case "compliance_violation":
        return _jsx(FileText, { className: "w-4 h-4" });
      default:
        return _jsx(Activity, { className: "w-4 h-4" });
    }
  };
  const getSystemIcon = (component) => {
    if (component.toLowerCase().includes("database"))
      return _jsx(Database, { className: "w-4 h-4" });
    if (component.toLowerCase().includes("api"))
      return _jsx(Globe, { className: "w-4 h-4" });
    if (component.toLowerCase().includes("auth"))
      return _jsx(Key, { className: "w-4 h-4" });
    if (component.toLowerCase().includes("network"))
      return _jsx(Network, { className: "w-4 h-4" });
    if (component.toLowerCase().includes("storage"))
      return _jsx(HardDrive, { className: "w-4 h-4" });
    return _jsx(Server, { className: "w-4 h-4" });
  };
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
                    "Security Operations Center",
                  ],
                }),
                _jsxs("div", {
                  className: "flex items-center space-x-2",
                  children: [
                    _jsxs(Select, {
                      value: state.timeRange,
                      onValueChange: (value) =>
                        setState((prev) => ({ ...prev, timeRange: value })),
                      children: [
                        _jsx(SelectTrigger, {
                          className: "w-32",
                          children: _jsx(SelectValue, {}),
                        }),
                        _jsxs(SelectContent, {
                          children: [
                            _jsx(SelectItem, {
                              value: "1h",
                              children: "Last Hour",
                            }),
                            _jsx(SelectItem, {
                              value: "24h",
                              children: "Last 24h",
                            }),
                            _jsx(SelectItem, {
                              value: "7d",
                              children: "Last 7 days",
                            }),
                            _jsx(SelectItem, {
                              value: "30d",
                              children: "Last 30 days",
                            }),
                          ],
                        }),
                      ],
                    }),
                    _jsxs(Button, {
                      onClick: () => handleMetricRefresh(),
                      disabled: state.isRefreshing,
                      size: "sm",
                      variant: "outline",
                      children: [
                        _jsx(RefreshCw, {
                          className: `w-4 h-4 mr-2 ${state.isRefreshing ? "animate-spin" : ""}`,
                        }),
                        "Refresh",
                      ],
                    }),
                    realTimeUpdates &&
                      _jsxs(Badge, {
                        className: "bg-green-100 text-green-600",
                        children: [
                          _jsx(Activity, { className: "w-3 h-3 mr-1" }),
                          "Live",
                        ],
                      }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(CardContent, {
            children: _jsxs("div", {
              className: "flex justify-between items-center",
              children: [
                _jsx("p", {
                  className: "text-sm text-gray-600",
                  children:
                    "Real-time security monitoring and threat detection dashboard.",
                }),
                _jsxs("p", {
                  className: "text-xs text-gray-500",
                  children: [
                    "Last updated: ",
                    new Date(state.lastRefresh).toLocaleTimeString(),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
      state.error &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-red-600" }),
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
      dashboardMetrics.criticalEvents > 0 &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-red-600" }),
            _jsxs(AlertDescription, {
              className: "text-red-800",
              children: [
                _jsx("strong", { children: "Critical Alert:" }),
                " ",
                dashboardMetrics.criticalEvents,
                " ",
                "critical security events detected.",
              ],
            }),
          ],
        }),
      dashboardMetrics.criticalThreats > 0 &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(Flag, { className: "h-4 w-4 text-red-600" }),
            _jsxs(AlertDescription, {
              className: "text-red-800",
              children: [
                _jsx("strong", { children: "Threat Alert:" }),
                " ",
                dashboardMetrics.criticalThreats,
                " ",
                "critical threats require immediate attention.",
              ],
            }),
          ],
        }),
      dashboardMetrics.downComponents > 0 &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(XCircle, { className: "h-4 w-4 text-red-600" }),
            _jsxs(AlertDescription, {
              className: "text-red-800",
              children: [
                _jsx("strong", { children: "System Alert:" }),
                " ",
                dashboardMetrics.downComponents,
                " ",
                "system components are down.",
              ],
            }),
          ],
        }),
      _jsxs(Tabs, {
        value: state.activeTab,
        onValueChange: (value) =>
          setState((prev) => ({ ...prev, activeTab: value })),
        children: [
          _jsxs(TabsList, {
            className: "grid w-full grid-cols-6",
            children: [
              _jsx(TabsTrigger, { value: "overview", children: "Overview" }),
              _jsx(TabsTrigger, { value: "events", children: "Events" }),
              _jsx(TabsTrigger, { value: "threats", children: "Threats" }),
              _jsx(TabsTrigger, { value: "systems", children: "Systems" }),
              _jsx(TabsTrigger, {
                value: "compliance",
                children: "Compliance",
              }),
              _jsx(TabsTrigger, { value: "metrics", children: "Metrics" }),
            ],
          }),
          _jsx(TabsContent, {
            value: "overview",
            children: _jsxs("div", {
              className: "space-y-6",
              children: [
                _jsxs("div", {
                  className:
                    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
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
                                  className:
                                    "text-sm font-medium text-gray-600",
                                  children: "Security Events",
                                }),
                                _jsx("p", {
                                  className: "text-2xl font-bold",
                                  children: dashboardMetrics.totalEvents,
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    dashboardMetrics.criticalEvents,
                                    " critical",
                                  ],
                                }),
                              ],
                            }),
                            _jsx(AlertTriangle, {
                              className: "w-8 h-8 text-orange-500",
                            }),
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
                                  className:
                                    "text-sm font-medium text-gray-600",
                                  children: "Active Threats",
                                }),
                                _jsx("p", {
                                  className: "text-2xl font-bold text-red-600",
                                  children: dashboardMetrics.activeThreats,
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    dashboardMetrics.criticalThreats,
                                    " critical",
                                  ],
                                }),
                              ],
                            }),
                            _jsx(Flag, { className: "w-8 h-8 text-red-500" }),
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
                                  className:
                                    "text-sm font-medium text-gray-600",
                                  children: "System Health",
                                }),
                                _jsxs("p", {
                                  className:
                                    "text-2xl font-bold text-green-600",
                                  children: [
                                    dashboardMetrics.systemHealthScore.toFixed(
                                      1,
                                    ),
                                    "%",
                                  ],
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    dashboardMetrics.healthyComponents,
                                    "/",
                                    systemHealth.length,
                                    " healthy",
                                  ],
                                }),
                              ],
                            }),
                            _jsx(Monitor, {
                              className: "w-8 h-8 text-green-500",
                            }),
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
                                  className:
                                    "text-sm font-medium text-gray-600",
                                  children: "Compliance Score",
                                }),
                                _jsxs("p", {
                                  className: "text-2xl font-bold text-blue-600",
                                  children: [
                                    dashboardMetrics.complianceOverall.toFixed(
                                      1,
                                    ),
                                    "%",
                                  ],
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    complianceStatus.length,
                                    " frameworks",
                                  ],
                                }),
                              ],
                            }),
                            _jsx(CheckCircle, {
                              className: "w-8 h-8 text-blue-500",
                            }),
                          ],
                        }),
                      }),
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                  children: [
                    _jsxs(Card, {
                      children: [
                        _jsx(CardHeader, {
                          children: _jsx(CardTitle, {
                            children: "Events by Type",
                          }),
                        }),
                        _jsx(CardContent, {
                          children: _jsx("div", {
                            className: "space-y-3",
                            children: Object.entries(
                              dashboardMetrics.eventsByType,
                            ).map(([type, count]) =>
                              _jsxs(
                                "div",
                                {
                                  className:
                                    "flex items-center justify-between p-2 bg-gray-50 rounded",
                                  children: [
                                    _jsxs("div", {
                                      className: "flex items-center space-x-2",
                                      children: [
                                        getEventTypeIcon(type),
                                        _jsx("span", {
                                          className: "font-medium capitalize",
                                          children: type.replace("_", " "),
                                        }),
                                      ],
                                    }),
                                    _jsxs(Badge, {
                                      className: "bg-blue-100 text-blue-600",
                                      children: [count, " events"],
                                    }),
                                  ],
                                },
                                type,
                              ),
                            ),
                          }),
                        }),
                      ],
                    }),
                    _jsxs(Card, {
                      children: [
                        _jsx(CardHeader, {
                          children: _jsx(CardTitle, {
                            children: "Events by Severity",
                          }),
                        }),
                        _jsx(CardContent, {
                          children: _jsx("div", {
                            className: "space-y-3",
                            children: Object.entries(
                              dashboardMetrics.eventsBySeverity,
                            ).map(([severity, count]) =>
                              _jsxs(
                                "div",
                                {
                                  className:
                                    "flex items-center justify-between p-2 bg-gray-50 rounded",
                                  children: [
                                    _jsxs("div", {
                                      className: "flex items-center space-x-2",
                                      children: [
                                        _jsx(AlertTriangle, {
                                          className: "w-4 h-4 text-gray-400",
                                        }),
                                        _jsx("span", {
                                          className: "font-medium capitalize",
                                          children: severity,
                                        }),
                                      ],
                                    }),
                                    _jsxs(Badge, {
                                      className: getSeverityColor(severity),
                                      children: [count, " events"],
                                    }),
                                  ],
                                },
                                severity,
                              ),
                            ),
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
                _jsxs(Card, {
                  children: [
                    _jsx(CardHeader, {
                      children: _jsx(CardTitle, {
                        children: "Recent Critical Events",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsx("div", {
                        className: "space-y-3",
                        children: filteredEvents
                          .filter(
                            (e) =>
                              e.severity === "critical" ||
                              e.severity === "high",
                          )
                          .slice(0, 5)
                          .map((event) =>
                            _jsxs(
                              "div",
                              {
                                className:
                                  "flex items-center justify-between p-3 bg-gray-50 rounded",
                                children: [
                                  _jsxs("div", {
                                    className: "flex items-center space-x-3",
                                    children: [
                                      getEventTypeIcon(event.type),
                                      _jsxs("div", {
                                        children: [
                                          _jsx("p", {
                                            className:
                                              "font-medium text-sm capitalize",
                                            children: event.type.replace(
                                              "_",
                                              " ",
                                            ),
                                          }),
                                          _jsxs("p", {
                                            className: "text-xs text-gray-600",
                                            children: [
                                              event.source,
                                              " \u2022 ",
                                              event.userName || "System",
                                              " \u2022",
                                              " ",
                                              event.ipAddress,
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  _jsxs("div", {
                                    className: "flex items-center space-x-2",
                                    children: [
                                      _jsx(Badge, {
                                        className: getSeverityColor(
                                          event.severity,
                                        ),
                                        children: event.severity,
                                      }),
                                      _jsx(Badge, {
                                        className: getStatusColor(event.status),
                                        children: event.status.replace(
                                          "_",
                                          " ",
                                        ),
                                      }),
                                      _jsx("span", {
                                        className: "text-xs text-gray-500",
                                        children: new Date(
                                          event.timestamp,
                                        ).toLocaleTimeString(),
                                      }),
                                    ],
                                  }),
                                ],
                              },
                              event.id,
                            ),
                          ),
                      }),
                    }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "events",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsx(Card, {
                  children: _jsxs(CardContent, {
                    className: "p-4",
                    children: [
                      _jsxs("div", {
                        className: "flex space-x-4 mb-4",
                        children: [
                          _jsx("div", {
                            className: "flex-1",
                            children: _jsxs("div", {
                              className: "relative",
                              children: [
                                _jsx(Search, {
                                  className:
                                    "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4",
                                }),
                                _jsx(Input, {
                                  placeholder:
                                    "Search events by type, source, user...",
                                  value: state.searchTerm,
                                  onChange: (e) =>
                                    setState((prev) => ({
                                      ...prev,
                                      searchTerm: e.target.value,
                                    })),
                                  className: "pl-10",
                                }),
                              ],
                            }),
                          }),
                          _jsxs(Select, {
                            value: state.filterSeverity,
                            onValueChange: (value) =>
                              setState((prev) => ({
                                ...prev,
                                filterSeverity: value,
                              })),
                            children: [
                              _jsx(SelectTrigger, {
                                className: "w-40",
                                children: _jsx(SelectValue, {
                                  placeholder: "Severity",
                                }),
                              }),
                              _jsxs(SelectContent, {
                                children: [
                                  _jsx(SelectItem, {
                                    value: "all",
                                    children: "All Severity",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "low",
                                    children: "Low",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "medium",
                                    children: "Medium",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "high",
                                    children: "High",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "critical",
                                    children: "Critical",
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsxs(Select, {
                            value: state.filterType,
                            onValueChange: (value) =>
                              setState((prev) => ({
                                ...prev,
                                filterType: value,
                              })),
                            children: [
                              _jsx(SelectTrigger, {
                                className: "w-48",
                                children: _jsx(SelectValue, {
                                  placeholder: "Event Type",
                                }),
                              }),
                              _jsxs(SelectContent, {
                                children: [
                                  _jsx(SelectItem, {
                                    value: "all",
                                    children: "All Types",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "login_attempt",
                                    children: "Login Attempt",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "data_access",
                                    children: "Data Access",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "permission_change",
                                    children: "Permission Change",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "system_alert",
                                    children: "System Alert",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "threat_detected",
                                    children: "Threat Detected",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "compliance_violation",
                                    children: "Compliance Violation",
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsxs(Select, {
                            value: state.filterStatus,
                            onValueChange: (value) =>
                              setState((prev) => ({
                                ...prev,
                                filterStatus: value,
                              })),
                            children: [
                              _jsx(SelectTrigger, {
                                className: "w-40",
                                children: _jsx(SelectValue, {
                                  placeholder: "Status",
                                }),
                              }),
                              _jsxs(SelectContent, {
                                children: [
                                  _jsx(SelectItem, {
                                    value: "all",
                                    children: "All Status",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "new",
                                    children: "New",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "investigating",
                                    children: "Investigating",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "resolved",
                                    children: "Resolved",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "false_positive",
                                    children: "False Positive",
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className: "flex justify-between items-center",
                        children: [
                          _jsxs("p", {
                            className: "text-sm text-gray-600",
                            children: [
                              "Showing ",
                              filteredEvents.length,
                              " of ",
                              events.length,
                              " events",
                            ],
                          }),
                          _jsxs(Button, {
                            onClick: () => handleExport("security"),
                            disabled: state.isExporting,
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
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: filteredEvents.slice(0, 50).map((event) =>
                    _jsx(
                      Card,
                      {
                        className: "hover:shadow-md transition-shadow",
                        children: _jsx(CardContent, {
                          className: "p-4",
                          children: _jsxs("div", {
                            className: "flex items-start justify-between",
                            children: [
                              _jsxs("div", {
                                className: "flex items-start space-x-3",
                                children: [
                                  getEventTypeIcon(event.type),
                                  _jsxs("div", {
                                    className: "flex-1 min-w-0",
                                    children: [
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-2 mb-2",
                                        children: [
                                          _jsx("h4", {
                                            className: "font-medium capitalize",
                                            children: event.type.replace(
                                              "_",
                                              " ",
                                            ),
                                          }),
                                          _jsx(Badge, {
                                            className: getSeverityColor(
                                              event.severity,
                                            ),
                                            children: event.severity,
                                          }),
                                          _jsx(Badge, {
                                            className: getStatusColor(
                                              event.status,
                                            ),
                                            children: event.status.replace(
                                              "_",
                                              " ",
                                            ),
                                          }),
                                          _jsxs(Badge, {
                                            className:
                                              "bg-purple-100 text-purple-600",
                                            children: [
                                              "Risk: ",
                                              event.riskScore,
                                              "/100",
                                            ],
                                          }),
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2",
                                        children: [
                                          _jsxs("span", {
                                            children: [
                                              "Source: ",
                                              event.source,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Target: ",
                                              event.target,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "User: ",
                                              event.userName || "System",
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: ["IP: ", event.ipAddress],
                                          }),
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-2 text-xs text-gray-600",
                                        children: [
                                          _jsx(Clock, { className: "w-3 h-3" }),
                                          _jsx("span", {
                                            children: new Date(
                                              event.timestamp,
                                            ).toLocaleString(),
                                          }),
                                          event.location &&
                                            _jsxs(_Fragment, {
                                              children: [
                                                _jsx(MapPin, {
                                                  className: "w-3 h-3 ml-2",
                                                }),
                                                _jsxs("span", {
                                                  children: [
                                                    event.location.city,
                                                    ",",
                                                    " ",
                                                    event.location.country,
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
                                className: "flex space-x-2",
                                children: [
                                  _jsxs(Button, {
                                    onClick: () =>
                                      setState((prev) => ({
                                        ...prev,
                                        selectedEvent: event,
                                        showEventDetails: true,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Eye, { className: "w-3 h-3 mr-1" }),
                                      "Details",
                                    ],
                                  }),
                                  event.status === "new" &&
                                    _jsxs(Button, {
                                      onClick: () =>
                                        handleEventInvestigate(event.id),
                                      disabled: state.isRefreshing,
                                      size: "sm",
                                      children: [
                                        _jsx(Search, {
                                          className: "w-3 h-3 mr-1",
                                        }),
                                        "Investigate",
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
                filteredEvents.length === 0 &&
                  _jsx(Card, {
                    children: _jsxs(CardContent, {
                      className: "p-6 text-center",
                      children: [
                        _jsx(Activity, {
                          className: "w-12 h-12 mx-auto mb-4 text-gray-400",
                        }),
                        _jsx("h3", {
                          className: "text-lg font-medium text-gray-900 mb-2",
                          children: "No Events Found",
                        }),
                        _jsx("p", {
                          className: "text-sm text-gray-600",
                          children:
                            "No security events match your current filters. Try adjusting your search criteria.",
                        }),
                      ],
                    }),
                  }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "threats",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsx("h3", {
                      className: "text-lg font-medium",
                      children: "Threat Intelligence",
                    }),
                    _jsxs(Button, {
                      onClick: () => handleExport("threats"),
                      disabled: state.isExporting,
                      size: "sm",
                      variant: "outline",
                      children: [
                        _jsx(Download, { className: "w-4 h-4 mr-2" }),
                        "Export Threats",
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: threats
                    .filter((t) => t.isActive)
                    .map((threat) =>
                      _jsx(
                        Card,
                        {
                          className: "hover:shadow-md transition-shadow",
                          children: _jsx(CardContent, {
                            className: "p-4",
                            children: _jsxs("div", {
                              className: "flex items-start justify-between",
                              children: [
                                _jsxs("div", {
                                  className: "flex-1",
                                  children: [
                                    _jsxs("div", {
                                      className:
                                        "flex items-center space-x-2 mb-2",
                                      children: [
                                        _jsx("h4", {
                                          className: "font-medium",
                                          children: threat.value,
                                        }),
                                        _jsx(Badge, {
                                          className: getSeverityColor(
                                            threat.severity,
                                          ),
                                          children: threat.severity,
                                        }),
                                        _jsx(Badge, {
                                          className:
                                            "bg-blue-100 text-blue-600",
                                          children: threat.type.replace(
                                            "_",
                                            " ",
                                          ),
                                        }),
                                        _jsxs(Badge, {
                                          className:
                                            "bg-purple-100 text-purple-600",
                                          children: [
                                            "Confidence: ",
                                            threat.confidence,
                                            "%",
                                          ],
                                        }),
                                      ],
                                    }),
                                    _jsx("p", {
                                      className: "text-sm text-gray-600 mb-2",
                                      children: threat.description,
                                    }),
                                    _jsxs("div", {
                                      className:
                                        "grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2",
                                      children: [
                                        _jsxs("span", {
                                          children: ["Source: ", threat.source],
                                        }),
                                        _jsxs("span", {
                                          children: [
                                            "Occurrences: ",
                                            threat.occurrences,
                                          ],
                                        }),
                                        _jsxs("span", {
                                          children: [
                                            "First Seen:",
                                            " ",
                                            new Date(
                                              threat.firstSeen,
                                            ).toLocaleDateString(),
                                          ],
                                        }),
                                        _jsxs("span", {
                                          children: [
                                            "Last Seen:",
                                            " ",
                                            new Date(
                                              threat.lastSeen,
                                            ).toLocaleDateString(),
                                          ],
                                        }),
                                      ],
                                    }),
                                    _jsx("div", {
                                      className: "flex flex-wrap gap-1",
                                      children: threat.tags.map((tag) =>
                                        _jsx(
                                          Badge,
                                          {
                                            className:
                                              "bg-gray-100 text-gray-600 text-xs",
                                            children: tag,
                                          },
                                          tag,
                                        ),
                                      ),
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
                                          selectedThreat: threat,
                                          showThreatDetails: true,
                                        })),
                                      size: "sm",
                                      variant: "outline",
                                      children: [
                                        _jsx(Eye, {
                                          className: "w-3 h-3 mr-1",
                                        }),
                                        "Details",
                                      ],
                                    }),
                                    _jsxs(Button, {
                                      onClick: () =>
                                        handleThreatMitigate(
                                          threat.id,
                                          "block",
                                        ),
                                      disabled: state.isRefreshing,
                                      size: "sm",
                                      variant: "destructive",
                                      children: [
                                        _jsx(Shield, {
                                          className: "w-3 h-3 mr-1",
                                        }),
                                        "Block",
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          }),
                        },
                        threat.id,
                      ),
                    ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "systems",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsx("h3", {
                  className: "text-lg font-medium",
                  children: "System Health Monitoring",
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: systemHealth.map((system) =>
                    _jsx(
                      Card,
                      {
                        children: _jsx(CardContent, {
                          className: "p-4",
                          children: _jsxs("div", {
                            className: "flex items-start justify-between",
                            children: [
                              _jsxs("div", {
                                className: "flex items-start space-x-3",
                                children: [
                                  getSystemIcon(system.component),
                                  _jsxs("div", {
                                    className: "flex-1",
                                    children: [
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-2 mb-2",
                                        children: [
                                          _jsx("h4", {
                                            className: "font-medium",
                                            children: system.component,
                                          }),
                                          _jsx(Badge, {
                                            className: getStatusColor(
                                              system.status,
                                            ),
                                            children: system.status,
                                          }),
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3",
                                        children: [
                                          _jsxs("span", {
                                            children: [
                                              "Uptime: ",
                                              system.uptime.toFixed(2),
                                              "%",
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Response: ",
                                              system.responseTime,
                                              "ms",
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Error Rate: ",
                                              system.errorRate.toFixed(2),
                                              "%",
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Throughput: ",
                                              system.throughput,
                                              " req/s",
                                            ],
                                          }),
                                        ],
                                      }),
                                      _jsx("div", {
                                        className: "space-y-2",
                                        children: _jsxs("div", {
                                          children: [
                                            _jsxs("div", {
                                              className:
                                                "flex justify-between text-sm mb-1",
                                              children: [
                                                _jsx("span", {
                                                  children: "Uptime",
                                                }),
                                                _jsxs("span", {
                                                  children: [
                                                    system.uptime.toFixed(1),
                                                    "%",
                                                  ],
                                                }),
                                              ],
                                            }),
                                            _jsx(Progress, {
                                              value: system.uptime,
                                              className: "h-2",
                                            }),
                                          ],
                                        }),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              _jsx("div", {
                                className: "flex space-x-2",
                                children: _jsxs(Button, {
                                  onClick: () => handleMetricRefresh(system.id),
                                  disabled: state.isRefreshing,
                                  size: "sm",
                                  variant: "outline",
                                  children: [
                                    _jsx(RefreshCw, {
                                      className: "w-3 h-3 mr-1",
                                    }),
                                    "Refresh",
                                  ],
                                }),
                              }),
                            ],
                          }),
                        }),
                      },
                      system.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "compliance",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsx("h3", {
                      className: "text-lg font-medium",
                      children: "Compliance Status",
                    }),
                    _jsxs(Button, {
                      onClick: () => handleExport("compliance"),
                      disabled: state.isExporting,
                      size: "sm",
                      variant: "outline",
                      children: [
                        _jsx(Download, { className: "w-4 h-4 mr-2" }),
                        "Export Report",
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: complianceStatus.map((compliance) =>
                    _jsx(
                      Card,
                      {
                        children: _jsx(CardContent, {
                          className: "p-4",
                          children: _jsx("div", {
                            className: "flex items-start justify-between",
                            children: _jsxs("div", {
                              className: "flex-1",
                              children: [
                                _jsxs("div", {
                                  className: "flex items-center space-x-2 mb-2",
                                  children: [
                                    _jsx("h4", {
                                      className: "font-medium",
                                      children: compliance.framework,
                                    }),
                                    _jsx(Badge, {
                                      className: getStatusColor(
                                        compliance.status,
                                      ),
                                      children: compliance.status.replace(
                                        "_",
                                        " ",
                                      ),
                                    }),
                                    _jsxs(Badge, {
                                      className: "bg-blue-100 text-blue-600",
                                      children: [
                                        "Score: ",
                                        compliance.score,
                                        "%",
                                      ],
                                    }),
                                  ],
                                }),
                                _jsxs("div", {
                                  className:
                                    "grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3",
                                  children: [
                                    _jsxs("span", {
                                      children: [
                                        "Total: ",
                                        compliance.requirements.total,
                                      ],
                                    }),
                                    _jsxs("span", {
                                      children: [
                                        "Passed: ",
                                        compliance.requirements.passed,
                                      ],
                                    }),
                                    _jsxs("span", {
                                      children: [
                                        "Failed: ",
                                        compliance.requirements.failed,
                                      ],
                                    }),
                                    _jsxs("span", {
                                      children: [
                                        "Pending: ",
                                        compliance.requirements.pending,
                                      ],
                                    }),
                                  ],
                                }),
                                _jsx("div", {
                                  className: "space-y-2",
                                  children: _jsxs("div", {
                                    children: [
                                      _jsxs("div", {
                                        className:
                                          "flex justify-between text-sm mb-1",
                                        children: [
                                          _jsx("span", {
                                            children: "Compliance Score",
                                          }),
                                          _jsxs("span", {
                                            children: [compliance.score, "%"],
                                          }),
                                        ],
                                      }),
                                      _jsx(Progress, {
                                        value: compliance.score,
                                        className: "h-2",
                                      }),
                                    ],
                                  }),
                                }),
                                compliance.criticalFindings.length > 0 &&
                                  _jsxs("div", {
                                    className: "mt-3",
                                    children: [
                                      _jsx("p", {
                                        className:
                                          "text-sm font-medium text-red-600 mb-1",
                                        children: "Critical Findings:",
                                      }),
                                      _jsx("ul", {
                                        className:
                                          "text-xs text-red-600 space-y-1",
                                        children: compliance.criticalFindings
                                          .slice(0, 3)
                                          .map((finding, index) =>
                                            _jsxs(
                                              "li",
                                              {
                                                children: ["\u2022 ", finding],
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
                        }),
                      },
                      compliance.framework,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "metrics",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsx("h3", {
                  className: "text-lg font-medium",
                  children: "Security Metrics",
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: metrics.map((metric) =>
                    _jsx(
                      Card,
                      {
                        children: _jsx(CardContent, {
                          className: "p-4",
                          children: _jsxs("div", {
                            className: "flex items-center justify-between",
                            children: [
                              _jsxs("div", {
                                className: "flex-1",
                                children: [
                                  _jsxs("div", {
                                    className:
                                      "flex items-center space-x-2 mb-1",
                                    children: [
                                      _jsx("h4", {
                                        className: "font-medium",
                                        children: metric.name,
                                      }),
                                      _jsx(Badge, {
                                        className: getStatusColor(
                                          metric.status,
                                        ),
                                        children: metric.status,
                                      }),
                                    ],
                                  }),
                                  _jsxs("div", {
                                    className: "flex items-center space-x-4",
                                    children: [
                                      _jsxs("span", {
                                        className: `text-2xl font-bold ${getMetricStatusColor(metric)}`,
                                        children: [
                                          metric.value,
                                          " ",
                                          metric.unit,
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-1",
                                        children: [
                                          getTrendIcon(
                                            metric.trend,
                                            metric.trendPercentage,
                                          ),
                                          _jsxs("span", {
                                            className: "text-sm text-gray-600",
                                            children: [
                                              metric.trendPercentage.toFixed(1),
                                              "%",
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  _jsxs("p", {
                                    className: "text-xs text-gray-500 mt-1",
                                    children: [
                                      "Last updated:",
                                      " ",
                                      new Date(
                                        metric.lastUpdated,
                                      ).toLocaleString(),
                                    ],
                                  }),
                                ],
                              }),
                              _jsxs(Button, {
                                onClick: () => handleMetricRefresh(metric.id),
                                disabled: state.isRefreshing,
                                size: "sm",
                                variant: "outline",
                                children: [
                                  _jsx(RefreshCw, {
                                    className: "w-3 h-3 mr-1",
                                  }),
                                  "Refresh",
                                ],
                              }),
                            ],
                          }),
                        }),
                      },
                      metric.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
        ],
      }),
      state.showEventDetails &&
        state.selectedEvent &&
        _jsx("div", {
          className:
            "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
          children: _jsxs(Card, {
            className: "w-full max-w-4xl max-h-[90vh] overflow-y-auto",
            children: [
              _jsx(CardHeader, {
                children: _jsxs(CardTitle, {
                  className: "flex items-center justify-between",
                  children: [
                    _jsx("span", { children: "Event Details" }),
                    _jsx(Button, {
                      onClick: () =>
                        setState((prev) => ({
                          ...prev,
                          showEventDetails: false,
                          selectedEvent: null,
                        })),
                      variant: "outline",
                      size: "sm",
                      children: "\u2715",
                    }),
                  ],
                }),
              }),
              _jsxs(CardContent, {
                className: "space-y-4",
                children: [
                  _jsxs("div", {
                    className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                    children: [
                      _jsxs("div", {
                        children: [
                          _jsx(Label, {
                            className: "text-sm font-medium",
                            children: "Event Information",
                          }),
                          _jsxs("div", {
                            className: "space-y-2 text-sm",
                            children: [
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "ID:",
                                  }),
                                  _jsx("span", {
                                    className: "font-mono",
                                    children: state.selectedEvent.id,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Type:",
                                  }),
                                  _jsx("span", {
                                    className: "capitalize",
                                    children: state.selectedEvent.type.replace(
                                      "_",
                                      " ",
                                    ),
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Severity:",
                                  }),
                                  _jsx(Badge, {
                                    className: getSeverityColor(
                                      state.selectedEvent.severity,
                                    ),
                                    children: state.selectedEvent.severity,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Status:",
                                  }),
                                  _jsx(Badge, {
                                    className: getStatusColor(
                                      state.selectedEvent.status,
                                    ),
                                    children:
                                      state.selectedEvent.status.replace(
                                        "_",
                                        " ",
                                      ),
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Risk Score:",
                                  }),
                                  _jsxs("span", {
                                    children: [
                                      state.selectedEvent.riskScore,
                                      "/100",
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        children: [
                          _jsx(Label, {
                            className: "text-sm font-medium",
                            children: "Source Information",
                          }),
                          _jsxs("div", {
                            className: "space-y-2 text-sm",
                            children: [
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Source:",
                                  }),
                                  _jsx("span", {
                                    children: state.selectedEvent.source,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Target:",
                                  }),
                                  _jsx("span", {
                                    children: state.selectedEvent.target,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "User:",
                                  }),
                                  _jsx("span", {
                                    children:
                                      state.selectedEvent.userName || "System",
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "IP Address:",
                                  }),
                                  _jsx("span", {
                                    className: "font-mono",
                                    children: state.selectedEvent.ipAddress,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Timestamp:",
                                  }),
                                  _jsx("span", {
                                    children: new Date(
                                      state.selectedEvent.timestamp,
                                    ).toLocaleString(),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  state.selectedEvent.details &&
                    _jsxs("div", {
                      children: [
                        _jsx(Label, {
                          className: "text-sm font-medium",
                          children: "Event Details",
                        }),
                        _jsx("pre", {
                          className:
                            "mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto",
                          children: JSON.stringify(
                            state.selectedEvent.details,
                            null,
                            2,
                          ),
                        }),
                      ],
                    }),
                  state.selectedEvent.actionsTaken.length > 0 &&
                    _jsxs("div", {
                      children: [
                        _jsx(Label, {
                          className: "text-sm font-medium",
                          children: "Actions Taken",
                        }),
                        _jsx("div", {
                          className: "flex flex-wrap gap-2 mt-2",
                          children: state.selectedEvent.actionsTaken.map(
                            (action) =>
                              _jsx(
                                Badge,
                                {
                                  className: "bg-blue-100 text-blue-600",
                                  children: action,
                                },
                                action,
                              ),
                          ),
                        }),
                      ],
                    }),
                  _jsx("div", {
                    className: "flex space-x-2",
                    children:
                      state.selectedEvent.status === "new" &&
                      _jsxs(Button, {
                        onClick: () =>
                          handleEventInvestigate(state.selectedEvent.id),
                        disabled: state.isRefreshing,
                        size: "sm",
                        children: [
                          _jsx(Search, { className: "w-4 h-4 mr-2" }),
                          "Start Investigation",
                        ],
                      }),
                  }),
                ],
              }),
            ],
          }),
        }),
    ],
  });
}
export default SecurityDashboard;

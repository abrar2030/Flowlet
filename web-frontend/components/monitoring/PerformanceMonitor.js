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
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Globe,
  Database,
  Server,
  Monitor,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
  Eye,
  Gauge,
  Timer,
  Wifi,
  WifiOff,
  Smartphone,
  Laptop,
  Tablet,
} from "lucide-react";
export function PerformanceMonitor({
  metrics = [],
  resources = [],
  userExperience = [],
  apiPerformance = [],
  onMetricRefresh,
  onAlertAcknowledge,
  onResourceRestart,
  onExportReport,
  realTimeUpdates = true,
  refreshInterval = 30,
  className = "",
}) {
  const [state, setState] = useState({
    activeTab: "overview",
    selectedResource: null,
    selectedMetric: null,
    timeRange: "24h",
    filterCategory: "all",
    filterStatus: "all",
    filterEnvironment: "all",
    searchTerm: "",
    showResourceDetails: false,
    showMetricDetails: false,
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
  // Calculate performance overview
  const performanceOverview = useMemo(() => {
    const now = new Date();
    const timeRangeMs = {
      "1h": 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    }[state.timeRange];
    const cutoffTime = new Date(now.getTime() - timeRangeMs);
    // Filter data by time range
    const recentUX = userExperience.filter(
      (ux) => new Date(ux.timestamp) > cutoffTime,
    );
    const recentAPI = apiPerformance.filter(
      (api) => new Date(api.timestamp) > cutoffTime,
    );
    // System health
    const healthyResources = resources.filter(
      (r) => r.status === "healthy",
    ).length;
    const degradedResources = resources.filter(
      (r) => r.status === "degraded",
    ).length;
    const downResources = resources.filter((r) => r.status === "down").length;
    const totalResources = resources.length;
    const systemHealthScore =
      totalResources > 0 ? (healthyResources / totalResources) * 100 : 100;
    // Average metrics
    const avgCpuUsage =
      resources.length > 0
        ? resources.reduce((sum, r) => sum + r.metrics.cpu.usage, 0) /
          resources.length
        : 0;
    const avgMemoryUsage =
      resources.length > 0
        ? resources.reduce((sum, r) => sum + r.metrics.memory.percentage, 0) /
          resources.length
        : 0;
    const avgDiskUsage =
      resources.length > 0
        ? resources.reduce((sum, r) => sum + r.metrics.disk.percentage, 0) /
          resources.length
        : 0;
    const avgResponseTime =
      resources.length > 0
        ? resources.reduce((sum, r) => sum + r.responseTime, 0) /
          resources.length
        : 0;
    // User experience metrics
    const avgLoadTime =
      recentUX.length > 0
        ? recentUX.reduce((sum, ux) => sum + ux.metrics.loadTime, 0) /
          recentUX.length
        : 0;
    const avgFCP =
      recentUX.length > 0
        ? recentUX.reduce(
            (sum, ux) => sum + ux.metrics.firstContentfulPaint,
            0,
          ) / recentUX.length
        : 0;
    const avgLCP =
      recentUX.length > 0
        ? recentUX.reduce(
            (sum, ux) => sum + ux.metrics.largestContentfulPaint,
            0,
          ) / recentUX.length
        : 0;
    const avgCLS =
      recentUX.length > 0
        ? recentUX.reduce(
            (sum, ux) => sum + ux.metrics.cumulativeLayoutShift,
            0,
          ) / recentUX.length
        : 0;
    // API performance
    const avgAPIResponseTime =
      recentAPI.length > 0
        ? recentAPI.reduce((sum, api) => sum + api.responseTime, 0) /
          recentAPI.length
        : 0;
    const apiErrorRate =
      recentAPI.length > 0
        ? (recentAPI.filter((api) => api.statusCode >= 400).length /
            recentAPI.length) *
          100
        : 0;
    const totalAPIRequests = recentAPI.length;
    // Alerts
    const totalAlerts = resources.reduce((sum, r) => sum + r.alerts.length, 0);
    const criticalAlerts = resources.reduce(
      (sum, r) =>
        sum + r.alerts.filter((a) => a.severity === "critical").length,
      0,
    );
    const unacknowledgedAlerts = resources.reduce(
      (sum, r) => sum + r.alerts.filter((a) => !a.acknowledged).length,
      0,
    );
    // Device breakdown
    const deviceBreakdown = recentUX.reduce((acc, ux) => {
      acc[ux.device.type] = (acc[ux.device.type] || 0) + 1;
      return acc;
    }, {});
    // Network breakdown
    const networkBreakdown = recentUX.reduce((acc, ux) => {
      acc[ux.network.type] = (acc[ux.network.type] || 0) + 1;
      return acc;
    }, {});
    // Performance by category
    const metricsByCategory = metrics.reduce((acc, metric) => {
      acc[metric.category] = acc[metric.category] || [];
      acc[metric.category].push(metric);
      return acc;
    }, {});
    return {
      systemHealthScore,
      healthyResources,
      degradedResources,
      downResources,
      totalResources,
      avgCpuUsage,
      avgMemoryUsage,
      avgDiskUsage,
      avgResponseTime,
      avgLoadTime,
      avgFCP,
      avgLCP,
      avgCLS,
      avgAPIResponseTime,
      apiErrorRate,
      totalAPIRequests,
      totalAlerts,
      criticalAlerts,
      unacknowledgedAlerts,
      deviceBreakdown,
      networkBreakdown,
      metricsByCategory,
    };
  }, [metrics, resources, userExperience, apiPerformance, state.timeRange]);
  // Filter resources
  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesSearch =
        resource.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        resource.location
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase());
      const matchesStatus =
        state.filterStatus === "all" || resource.status === state.filterStatus;
      const matchesEnvironment =
        state.filterEnvironment === "all" ||
        resource.environment === state.filterEnvironment;
      return matchesSearch && matchesStatus && matchesEnvironment;
    });
  }, [
    resources,
    state.searchTerm,
    state.filterStatus,
    state.filterEnvironment,
  ]);
  // Handle metric refresh
  const handleMetricRefresh = useCallback(
    async (metricId) => {
      setState((prev) => ({ ...prev, isRefreshing: true, error: null }));
      try {
        if (onMetricRefresh) {
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
  // Handle alert acknowledgment
  const handleAlertAcknowledge = useCallback(
    async (alertId) => {
      try {
        if (onAlertAcknowledge) {
          await onAlertAcknowledge(alertId);
          setState((prev) => ({ ...prev, success: "Alert acknowledged" }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to acknowledge alert" }));
      }
    },
    [onAlertAcknowledge],
  );
  // Handle resource restart
  const handleResourceRestart = useCallback(
    async (resourceId) => {
      setState((prev) => ({ ...prev, isRefreshing: true, error: null }));
      try {
        if (onResourceRestart) {
          await onResourceRestart(resourceId);
          setState((prev) => ({
            ...prev,
            success: "Resource restart initiated",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to restart resource" }));
      } finally {
        setState((prev) => ({ ...prev, isRefreshing: false }));
      }
    },
    [onResourceRestart],
  );
  // Handle export
  const handleExport = useCallback(
    async (type) => {
      setState((prev) => ({ ...prev, isExporting: true, error: null }));
      try {
        if (onExportReport) {
          const filters = {
            timeRange: state.timeRange,
            category: state.filterCategory,
            status: state.filterStatus,
            environment: state.filterEnvironment,
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
      state.filterCategory,
      state.filterStatus,
      state.filterEnvironment,
      state.searchTerm,
    ],
  );
  const getStatusColor = (status) => {
    switch (status) {
      case "healthy":
      case "normal":
        return "bg-green-100 text-green-600";
      case "degraded":
      case "warning":
        return "bg-yellow-100 text-yellow-600";
      case "down":
      case "critical":
        return "bg-red-100 text-red-600";
      case "maintenance":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
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
  const getResourceIcon = (type) => {
    switch (type) {
      case "server":
        return _jsx(Server, { className: "w-4 h-4" });
      case "database":
        return _jsx(Database, { className: "w-4 h-4" });
      case "application":
        return _jsx(Monitor, { className: "w-4 h-4" });
      case "service":
        return _jsx(Globe, { className: "w-4 h-4" });
      case "endpoint":
        return _jsx(Network, { className: "w-4 h-4" });
      default:
        return _jsx(Activity, { className: "w-4 h-4" });
    }
  };
  const getDeviceIcon = (type) => {
    switch (type) {
      case "desktop":
        return _jsx(Laptop, { className: "w-4 h-4" });
      case "mobile":
        return _jsx(Smartphone, { className: "w-4 h-4" });
      case "tablet":
        return _jsx(Tablet, { className: "w-4 h-4" });
      default:
        return _jsx(Monitor, { className: "w-4 h-4" });
    }
  };
  const getNetworkIcon = (type) => {
    switch (type) {
      case "wifi":
        return _jsx(Wifi, { className: "w-4 h-4" });
      case "ethernet":
        return _jsx(Network, { className: "w-4 h-4" });
      case "4g":
      case "3g":
        return _jsx(Smartphone, { className: "w-4 h-4" });
      default:
        return _jsx(WifiOff, { className: "w-4 h-4" });
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
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
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
                    _jsx(Gauge, { className: "w-6 h-6 mr-3 text-blue-600" }),
                    "Performance Monitoring",
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
                              value: "6h",
                              children: "Last 6h",
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
                    "Real-time system performance, user experience, and API monitoring.",
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
      performanceOverview.criticalAlerts > 0 &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-red-600" }),
            _jsxs(AlertDescription, {
              className: "text-red-800",
              children: [
                _jsx("strong", { children: "Critical Alerts:" }),
                " ",
                performanceOverview.criticalAlerts,
                " critical performance alerts require attention.",
              ],
            }),
          ],
        }),
      performanceOverview.downResources > 0 &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(XCircle, { className: "h-4 w-4 text-red-600" }),
            _jsxs(AlertDescription, {
              className: "text-red-800",
              children: [
                _jsx("strong", { children: "System Down:" }),
                " ",
                performanceOverview.downResources,
                " ",
                "system resources are currently down.",
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
            className: "grid w-full grid-cols-5",
            children: [
              _jsx(TabsTrigger, { value: "overview", children: "Overview" }),
              _jsx(TabsTrigger, { value: "resources", children: "Resources" }),
              _jsx(TabsTrigger, {
                value: "user-experience",
                children: "User Experience",
              }),
              _jsx(TabsTrigger, { value: "api", children: "API Performance" }),
              _jsx(TabsTrigger, { value: "alerts", children: "Alerts" }),
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
                                  children: "System Health",
                                }),
                                _jsxs("p", {
                                  className:
                                    "text-2xl font-bold text-green-600",
                                  children: [
                                    performanceOverview.systemHealthScore.toFixed(
                                      1,
                                    ),
                                    "%",
                                  ],
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    performanceOverview.healthyResources,
                                    "/",
                                    performanceOverview.totalResources,
                                    " healthy",
                                  ],
                                }),
                              ],
                            }),
                            _jsx(CheckCircle, {
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
                                  children: "Avg Response Time",
                                }),
                                _jsxs("p", {
                                  className: "text-2xl font-bold",
                                  children: [
                                    performanceOverview.avgResponseTime.toFixed(
                                      0,
                                    ),
                                    "ms",
                                  ],
                                }),
                                _jsx("p", {
                                  className: "text-xs text-gray-500",
                                  children: "across all services",
                                }),
                              ],
                            }),
                            _jsx(Timer, { className: "w-8 h-8 text-blue-500" }),
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
                                  children: "Page Load Time",
                                }),
                                _jsx("p", {
                                  className: "text-2xl font-bold",
                                  children: formatDuration(
                                    performanceOverview.avgLoadTime,
                                  ),
                                }),
                                _jsx("p", {
                                  className: "text-xs text-gray-500",
                                  children: "average user experience",
                                }),
                              ],
                            }),
                            _jsx(Globe, {
                              className: "w-8 h-8 text-purple-500",
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
                                  children: "API Error Rate",
                                }),
                                _jsxs("p", {
                                  className: "text-2xl font-bold text-red-600",
                                  children: [
                                    performanceOverview.apiErrorRate.toFixed(1),
                                    "%",
                                  ],
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    performanceOverview.totalAPIRequests,
                                    " requests",
                                  ],
                                }),
                              ],
                            }),
                            _jsx(AlertTriangle, {
                              className: "w-8 h-8 text-red-500",
                            }),
                          ],
                        }),
                      }),
                    }),
                  ],
                }),
                _jsxs("div", {
                  className:
                    "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4",
                  children: [
                    _jsx(Card, {
                      children: _jsxs(CardContent, {
                        className: "p-4",
                        children: [
                          _jsxs("div", {
                            className: "flex items-center justify-between mb-2",
                            children: [
                              _jsxs("div", {
                                className: "flex items-center space-x-2",
                                children: [
                                  _jsx(Cpu, {
                                    className: "w-4 h-4 text-blue-500",
                                  }),
                                  _jsx("span", {
                                    className: "text-sm font-medium",
                                    children: "CPU Usage",
                                  }),
                                ],
                              }),
                              _jsxs("span", {
                                className: "text-lg font-bold",
                                children: [
                                  performanceOverview.avgCpuUsage.toFixed(1),
                                  "%",
                                ],
                              }),
                            ],
                          }),
                          _jsx(Progress, {
                            value: performanceOverview.avgCpuUsage,
                            className: "h-2",
                          }),
                        ],
                      }),
                    }),
                    _jsx(Card, {
                      children: _jsxs(CardContent, {
                        className: "p-4",
                        children: [
                          _jsxs("div", {
                            className: "flex items-center justify-between mb-2",
                            children: [
                              _jsxs("div", {
                                className: "flex items-center space-x-2",
                                children: [
                                  _jsx(MemoryStick, {
                                    className: "w-4 h-4 text-green-500",
                                  }),
                                  _jsx("span", {
                                    className: "text-sm font-medium",
                                    children: "Memory Usage",
                                  }),
                                ],
                              }),
                              _jsxs("span", {
                                className: "text-lg font-bold",
                                children: [
                                  performanceOverview.avgMemoryUsage.toFixed(1),
                                  "%",
                                ],
                              }),
                            ],
                          }),
                          _jsx(Progress, {
                            value: performanceOverview.avgMemoryUsage,
                            className: "h-2",
                          }),
                        ],
                      }),
                    }),
                    _jsx(Card, {
                      children: _jsxs(CardContent, {
                        className: "p-4",
                        children: [
                          _jsxs("div", {
                            className: "flex items-center justify-between mb-2",
                            children: [
                              _jsxs("div", {
                                className: "flex items-center space-x-2",
                                children: [
                                  _jsx(HardDrive, {
                                    className: "w-4 h-4 text-orange-500",
                                  }),
                                  _jsx("span", {
                                    className: "text-sm font-medium",
                                    children: "Disk Usage",
                                  }),
                                ],
                              }),
                              _jsxs("span", {
                                className: "text-lg font-bold",
                                children: [
                                  performanceOverview.avgDiskUsage.toFixed(1),
                                  "%",
                                ],
                              }),
                            ],
                          }),
                          _jsx(Progress, {
                            value: performanceOverview.avgDiskUsage,
                            className: "h-2",
                          }),
                        ],
                      }),
                    }),
                    _jsx(Card, {
                      children: _jsxs(CardContent, {
                        className: "p-4",
                        children: [
                          _jsxs("div", {
                            className: "flex items-center justify-between mb-2",
                            children: [
                              _jsxs("div", {
                                className: "flex items-center space-x-2",
                                children: [
                                  _jsx(Network, {
                                    className: "w-4 h-4 text-purple-500",
                                  }),
                                  _jsx("span", {
                                    className: "text-sm font-medium",
                                    children: "Network I/O",
                                  }),
                                ],
                              }),
                              _jsx("span", {
                                className: "text-lg font-bold",
                                children: "Active",
                              }),
                            ],
                          }),
                          _jsx("div", {
                            className: "text-xs text-gray-500",
                            children: "Monitoring network traffic",
                          }),
                        ],
                      }),
                    }),
                  ],
                }),
                _jsxs(Card, {
                  children: [
                    _jsx(CardHeader, {
                      children: _jsx(CardTitle, {
                        children: "Core Web Vitals",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsxs("div", {
                        className: "grid grid-cols-1 md:grid-cols-4 gap-4",
                        children: [
                          _jsxs("div", {
                            className: "text-center",
                            children: [
                              _jsx("p", {
                                className: "text-sm font-medium text-gray-600",
                                children: "First Contentful Paint",
                              }),
                              _jsx("p", {
                                className: "text-2xl font-bold text-blue-600",
                                children: formatDuration(
                                  performanceOverview.avgFCP,
                                ),
                              }),
                              _jsx("p", {
                                className: "text-xs text-gray-500",
                                children: "Good: < 1.8s",
                              }),
                            ],
                          }),
                          _jsxs("div", {
                            className: "text-center",
                            children: [
                              _jsx("p", {
                                className: "text-sm font-medium text-gray-600",
                                children: "Largest Contentful Paint",
                              }),
                              _jsx("p", {
                                className: "text-2xl font-bold text-green-600",
                                children: formatDuration(
                                  performanceOverview.avgLCP,
                                ),
                              }),
                              _jsx("p", {
                                className: "text-xs text-gray-500",
                                children: "Good: < 2.5s",
                              }),
                            ],
                          }),
                          _jsxs("div", {
                            className: "text-center",
                            children: [
                              _jsx("p", {
                                className: "text-sm font-medium text-gray-600",
                                children: "Cumulative Layout Shift",
                              }),
                              _jsx("p", {
                                className: "text-2xl font-bold text-yellow-600",
                                children: performanceOverview.avgCLS.toFixed(3),
                              }),
                              _jsx("p", {
                                className: "text-xs text-gray-500",
                                children: "Good: < 0.1",
                              }),
                            ],
                          }),
                          _jsxs("div", {
                            className: "text-center",
                            children: [
                              _jsx("p", {
                                className: "text-sm font-medium text-gray-600",
                                children: "Page Load Time",
                              }),
                              _jsx("p", {
                                className: "text-2xl font-bold text-purple-600",
                                children: formatDuration(
                                  performanceOverview.avgLoadTime,
                                ),
                              }),
                              _jsx("p", {
                                className: "text-xs text-gray-500",
                                children: "Target: < 3s",
                              }),
                            ],
                          }),
                        ],
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
                            children: "Device Breakdown",
                          }),
                        }),
                        _jsx(CardContent, {
                          children: _jsx("div", {
                            className: "space-y-3",
                            children: Object.entries(
                              performanceOverview.deviceBreakdown,
                            ).map(([device, count]) =>
                              _jsxs(
                                "div",
                                {
                                  className:
                                    "flex items-center justify-between p-2 bg-gray-50 rounded",
                                  children: [
                                    _jsxs("div", {
                                      className: "flex items-center space-x-2",
                                      children: [
                                        getDeviceIcon(device),
                                        _jsx("span", {
                                          className: "font-medium capitalize",
                                          children: device,
                                        }),
                                      ],
                                    }),
                                    _jsxs(Badge, {
                                      className: "bg-blue-100 text-blue-600",
                                      children: [count, " sessions"],
                                    }),
                                  ],
                                },
                                device,
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
                            children: "Network Types",
                          }),
                        }),
                        _jsx(CardContent, {
                          children: _jsx("div", {
                            className: "space-y-3",
                            children: Object.entries(
                              performanceOverview.networkBreakdown,
                            ).map(([network, count]) =>
                              _jsxs(
                                "div",
                                {
                                  className:
                                    "flex items-center justify-between p-2 bg-gray-50 rounded",
                                  children: [
                                    _jsxs("div", {
                                      className: "flex items-center space-x-2",
                                      children: [
                                        getNetworkIcon(network),
                                        _jsx("span", {
                                          className: "font-medium uppercase",
                                          children: network,
                                        }),
                                      ],
                                    }),
                                    _jsxs(Badge, {
                                      className: "bg-green-100 text-green-600",
                                      children: [count, " sessions"],
                                    }),
                                  ],
                                },
                                network,
                              ),
                            ),
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "resources",
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
                            children: _jsx(Input, {
                              placeholder: "Search resources...",
                              value: state.searchTerm,
                              onChange: (e) =>
                                setState((prev) => ({
                                  ...prev,
                                  searchTerm: e.target.value,
                                })),
                            }),
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
                                    value: "healthy",
                                    children: "Healthy",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "degraded",
                                    children: "Degraded",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "down",
                                    children: "Down",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "maintenance",
                                    children: "Maintenance",
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsxs(Select, {
                            value: state.filterEnvironment,
                            onValueChange: (value) =>
                              setState((prev) => ({
                                ...prev,
                                filterEnvironment: value,
                              })),
                            children: [
                              _jsx(SelectTrigger, {
                                className: "w-40",
                                children: _jsx(SelectValue, {
                                  placeholder: "Environment",
                                }),
                              }),
                              _jsxs(SelectContent, {
                                children: [
                                  _jsx(SelectItem, {
                                    value: "all",
                                    children: "All Environments",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "production",
                                    children: "Production",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "staging",
                                    children: "Staging",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "development",
                                    children: "Development",
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
                              filteredResources.length,
                              " of ",
                              resources.length,
                              " ",
                              "resources",
                            ],
                          }),
                          _jsxs(Button, {
                            onClick: () => handleExport("resources"),
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
                  children: filteredResources.map((resource) =>
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
                                  getResourceIcon(resource.type),
                                  _jsxs("div", {
                                    className: "flex-1 min-w-0",
                                    children: [
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-2 mb-2",
                                        children: [
                                          _jsx("h4", {
                                            className: "font-medium",
                                            children: resource.name,
                                          }),
                                          _jsx(Badge, {
                                            className: getStatusColor(
                                              resource.status,
                                            ),
                                            children: resource.status,
                                          }),
                                          _jsx(Badge, {
                                            className:
                                              "bg-blue-100 text-blue-600",
                                            children: resource.type,
                                          }),
                                          _jsx(Badge, {
                                            className:
                                              "bg-purple-100 text-purple-600",
                                            children: resource.environment,
                                          }),
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3",
                                        children: [
                                          _jsxs("span", {
                                            children: [
                                              "CPU: ",
                                              resource.metrics.cpu.usage.toFixed(
                                                1,
                                              ),
                                              "%",
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Memory:",
                                              " ",
                                              resource.metrics.memory.percentage.toFixed(
                                                1,
                                              ),
                                              "%",
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Disk:",
                                              " ",
                                              resource.metrics.disk.percentage.toFixed(
                                                1,
                                              ),
                                              "%",
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Uptime: ",
                                              resource.uptime.toFixed(1),
                                              "%",
                                            ],
                                          }),
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "grid grid-cols-1 md:grid-cols-4 gap-2",
                                        children: [
                                          _jsxs("div", {
                                            children: [
                                              _jsxs("div", {
                                                className:
                                                  "flex justify-between text-xs mb-1",
                                                children: [
                                                  _jsx("span", {
                                                    children: "CPU",
                                                  }),
                                                  _jsxs("span", {
                                                    children: [
                                                      resource.metrics.cpu.usage.toFixed(
                                                        1,
                                                      ),
                                                      "%",
                                                    ],
                                                  }),
                                                ],
                                              }),
                                              _jsx(Progress, {
                                                value:
                                                  resource.metrics.cpu.usage,
                                                className: "h-1",
                                              }),
                                            ],
                                          }),
                                          _jsxs("div", {
                                            children: [
                                              _jsxs("div", {
                                                className:
                                                  "flex justify-between text-xs mb-1",
                                                children: [
                                                  _jsx("span", {
                                                    children: "Memory",
                                                  }),
                                                  _jsxs("span", {
                                                    children: [
                                                      resource.metrics.memory.percentage.toFixed(
                                                        1,
                                                      ),
                                                      "%",
                                                    ],
                                                  }),
                                                ],
                                              }),
                                              _jsx(Progress, {
                                                value:
                                                  resource.metrics.memory
                                                    .percentage,
                                                className: "h-1",
                                              }),
                                            ],
                                          }),
                                          _jsxs("div", {
                                            children: [
                                              _jsxs("div", {
                                                className:
                                                  "flex justify-between text-xs mb-1",
                                                children: [
                                                  _jsx("span", {
                                                    children: "Disk",
                                                  }),
                                                  _jsxs("span", {
                                                    children: [
                                                      resource.metrics.disk.percentage.toFixed(
                                                        1,
                                                      ),
                                                      "%",
                                                    ],
                                                  }),
                                                ],
                                              }),
                                              _jsx(Progress, {
                                                value:
                                                  resource.metrics.disk
                                                    .percentage,
                                                className: "h-1",
                                              }),
                                            ],
                                          }),
                                          _jsxs("div", {
                                            children: [
                                              _jsxs("div", {
                                                className:
                                                  "flex justify-between text-xs mb-1",
                                                children: [
                                                  _jsx("span", {
                                                    children: "Uptime",
                                                  }),
                                                  _jsxs("span", {
                                                    children: [
                                                      resource.uptime.toFixed(
                                                        1,
                                                      ),
                                                      "%",
                                                    ],
                                                  }),
                                                ],
                                              }),
                                              _jsx(Progress, {
                                                value: resource.uptime,
                                                className: "h-1",
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
                                        selectedResource: resource,
                                        showResourceDetails: true,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Eye, { className: "w-3 h-3 mr-1" }),
                                      "Details",
                                    ],
                                  }),
                                  resource.status === "down" &&
                                    _jsxs(Button, {
                                      onClick: () =>
                                        handleResourceRestart(resource.id),
                                      disabled: state.isRefreshing,
                                      size: "sm",
                                      children: [
                                        _jsx(RefreshCw, {
                                          className: "w-3 h-3 mr-1",
                                        }),
                                        "Restart",
                                      ],
                                    }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      },
                      resource.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "user-experience",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsx("h3", {
                      className: "text-lg font-medium",
                      children: "User Experience Metrics",
                    }),
                    _jsxs(Button, {
                      onClick: () => handleExport("ux"),
                      disabled: state.isExporting,
                      size: "sm",
                      variant: "outline",
                      children: [
                        _jsx(Download, { className: "w-4 h-4 mr-2" }),
                        "Export UX Data",
                      ],
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                  children: [
                    _jsx(Card, {
                      children: _jsx(CardContent, {
                        className: "p-4",
                        children: _jsxs("div", {
                          className: "text-center",
                          children: [
                            _jsx("p", {
                              className: "text-sm font-medium text-gray-600",
                              children: "Average Load Time",
                            }),
                            _jsx("p", {
                              className: "text-3xl font-bold text-blue-600",
                              children: formatDuration(
                                performanceOverview.avgLoadTime,
                              ),
                            }),
                            _jsx("p", {
                              className: "text-xs text-gray-500",
                              children: "Target: < 3s",
                            }),
                          ],
                        }),
                      }),
                    }),
                    _jsx(Card, {
                      children: _jsx(CardContent, {
                        className: "p-4",
                        children: _jsxs("div", {
                          className: "text-center",
                          children: [
                            _jsx("p", {
                              className: "text-sm font-medium text-gray-600",
                              children: "First Contentful Paint",
                            }),
                            _jsx("p", {
                              className: "text-3xl font-bold text-green-600",
                              children: formatDuration(
                                performanceOverview.avgFCP,
                              ),
                            }),
                            _jsx("p", {
                              className: "text-xs text-gray-500",
                              children: "Target: < 1.8s",
                            }),
                          ],
                        }),
                      }),
                    }),
                    _jsx(Card, {
                      children: _jsx(CardContent, {
                        className: "p-4",
                        children: _jsxs("div", {
                          className: "text-center",
                          children: [
                            _jsx("p", {
                              className: "text-sm font-medium text-gray-600",
                              children: "Cumulative Layout Shift",
                            }),
                            _jsx("p", {
                              className: "text-3xl font-bold text-yellow-600",
                              children: performanceOverview.avgCLS.toFixed(3),
                            }),
                            _jsx("p", {
                              className: "text-xs text-gray-500",
                              children: "Target: < 0.1",
                            }),
                          ],
                        }),
                      }),
                    }),
                  ],
                }),
                _jsxs(Card, {
                  children: [
                    _jsx(CardHeader, {
                      children: _jsx(CardTitle, {
                        children: "Recent User Sessions",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsx("div", {
                        className: "space-y-3",
                        children: userExperience.slice(0, 10).map((ux) =>
                          _jsxs(
                            "div",
                            {
                              className:
                                "flex items-center justify-between p-3 bg-gray-50 rounded",
                              children: [
                                _jsxs("div", {
                                  className: "flex items-center space-x-3",
                                  children: [
                                    getDeviceIcon(ux.device.type),
                                    _jsxs("div", {
                                      children: [
                                        _jsx("p", {
                                          className: "font-medium text-sm",
                                          children: ux.page,
                                        }),
                                        _jsxs("p", {
                                          className: "text-xs text-gray-600",
                                          children: [
                                            ux.device.browser,
                                            " on ",
                                            ux.device.os,
                                            " \u2022",
                                            " ",
                                            ux.location.city,
                                            ", ",
                                            ux.location.country,
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                _jsxs("div", {
                                  className:
                                    "flex items-center space-x-4 text-xs",
                                  children: [
                                    _jsxs("div", {
                                      className: "text-center",
                                      children: [
                                        _jsx("p", {
                                          className: "font-medium",
                                          children: "Load Time",
                                        }),
                                        _jsx("p", {
                                          className: "text-gray-600",
                                          children: formatDuration(
                                            ux.metrics.loadTime,
                                          ),
                                        }),
                                      ],
                                    }),
                                    _jsxs("div", {
                                      className: "text-center",
                                      children: [
                                        _jsx("p", {
                                          className: "font-medium",
                                          children: "FCP",
                                        }),
                                        _jsx("p", {
                                          className: "text-gray-600",
                                          children: formatDuration(
                                            ux.metrics.firstContentfulPaint,
                                          ),
                                        }),
                                      ],
                                    }),
                                    _jsxs("div", {
                                      className: "text-center",
                                      children: [
                                        _jsx("p", {
                                          className: "font-medium",
                                          children: "CLS",
                                        }),
                                        _jsx("p", {
                                          className: "text-gray-600",
                                          children:
                                            ux.metrics.cumulativeLayoutShift.toFixed(
                                              3,
                                            ),
                                        }),
                                      ],
                                    }),
                                    _jsxs("div", {
                                      className: "text-center",
                                      children: [
                                        _jsx("p", {
                                          className: "font-medium",
                                          children: "Network",
                                        }),
                                        _jsx("p", {
                                          className: "text-gray-600 uppercase",
                                          children: ux.network.type,
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            },
                            ux.id,
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
            value: "api",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsx("h3", {
                      className: "text-lg font-medium",
                      children: "API Performance",
                    }),
                    _jsxs(Button, {
                      onClick: () => handleExport("api"),
                      disabled: state.isExporting,
                      size: "sm",
                      variant: "outline",
                      children: [
                        _jsx(Download, { className: "w-4 h-4 mr-2" }),
                        "Export API Data",
                      ],
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "grid grid-cols-1 md:grid-cols-4 gap-4",
                  children: [
                    _jsx(Card, {
                      children: _jsx(CardContent, {
                        className: "p-4",
                        children: _jsxs("div", {
                          className: "text-center",
                          children: [
                            _jsx("p", {
                              className: "text-sm font-medium text-gray-600",
                              children: "Total Requests",
                            }),
                            _jsx("p", {
                              className: "text-2xl font-bold",
                              children: performanceOverview.totalAPIRequests,
                            }),
                            _jsx("p", {
                              className: "text-xs text-gray-500",
                              children: "in selected timeframe",
                            }),
                          ],
                        }),
                      }),
                    }),
                    _jsx(Card, {
                      children: _jsx(CardContent, {
                        className: "p-4",
                        children: _jsxs("div", {
                          className: "text-center",
                          children: [
                            _jsx("p", {
                              className: "text-sm font-medium text-gray-600",
                              children: "Avg Response Time",
                            }),
                            _jsxs("p", {
                              className: "text-2xl font-bold text-blue-600",
                              children: [
                                performanceOverview.avgAPIResponseTime.toFixed(
                                  0,
                                ),
                                "ms",
                              ],
                            }),
                            _jsx("p", {
                              className: "text-xs text-gray-500",
                              children: "across all endpoints",
                            }),
                          ],
                        }),
                      }),
                    }),
                    _jsx(Card, {
                      children: _jsx(CardContent, {
                        className: "p-4",
                        children: _jsxs("div", {
                          className: "text-center",
                          children: [
                            _jsx("p", {
                              className: "text-sm font-medium text-gray-600",
                              children: "Error Rate",
                            }),
                            _jsxs("p", {
                              className: "text-2xl font-bold text-red-600",
                              children: [
                                performanceOverview.apiErrorRate.toFixed(1),
                                "%",
                              ],
                            }),
                            _jsx("p", {
                              className: "text-xs text-gray-500",
                              children: "4xx and 5xx responses",
                            }),
                          ],
                        }),
                      }),
                    }),
                    _jsx(Card, {
                      children: _jsx(CardContent, {
                        className: "p-4",
                        children: _jsxs("div", {
                          className: "text-center",
                          children: [
                            _jsx("p", {
                              className: "text-sm font-medium text-gray-600",
                              children: "Cache Hit Rate",
                            }),
                            _jsxs("p", {
                              className: "text-2xl font-bold text-green-600",
                              children: [
                                apiPerformance.length > 0
                                  ? (
                                      (apiPerformance.filter(
                                        (api) => api.cached,
                                      ).length /
                                        apiPerformance.length) *
                                      100
                                    ).toFixed(1)
                                  : 0,
                                "%",
                              ],
                            }),
                            _jsx("p", {
                              className: "text-xs text-gray-500",
                              children: "cached responses",
                            }),
                          ],
                        }),
                      }),
                    }),
                  ],
                }),
                _jsxs(Card, {
                  children: [
                    _jsx(CardHeader, {
                      children: _jsx(CardTitle, {
                        children: "Recent API Calls",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsx("div", {
                        className: "space-y-3",
                        children: apiPerformance.slice(0, 10).map((api) =>
                          _jsxs(
                            "div",
                            {
                              className:
                                "flex items-center justify-between p-3 bg-gray-50 rounded",
                              children: [
                                _jsxs("div", {
                                  className: "flex items-center space-x-3",
                                  children: [
                                    _jsx(Badge, {
                                      className:
                                        api.statusCode >= 400
                                          ? "bg-red-100 text-red-600"
                                          : "bg-green-100 text-green-600",
                                      children: api.method,
                                    }),
                                    _jsxs("div", {
                                      children: [
                                        _jsx("p", {
                                          className: "font-medium text-sm",
                                          children: api.endpoint,
                                        }),
                                        _jsxs("p", {
                                          className: "text-xs text-gray-600",
                                          children: [
                                            api.ipAddress,
                                            " \u2022 ",
                                            api.region,
                                            " \u2022",
                                            " ",
                                            new Date(
                                              api.timestamp,
                                            ).toLocaleTimeString(),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                _jsxs("div", {
                                  className:
                                    "flex items-center space-x-4 text-xs",
                                  children: [
                                    _jsxs("div", {
                                      className: "text-center",
                                      children: [
                                        _jsx("p", {
                                          className: "font-medium",
                                          children: "Status",
                                        }),
                                        _jsx(Badge, {
                                          className:
                                            api.statusCode >= 400
                                              ? "bg-red-100 text-red-600"
                                              : "bg-green-100 text-green-600",
                                          children: api.statusCode,
                                        }),
                                      ],
                                    }),
                                    _jsxs("div", {
                                      className: "text-center",
                                      children: [
                                        _jsx("p", {
                                          className: "font-medium",
                                          children: "Response Time",
                                        }),
                                        _jsxs("p", {
                                          className: "text-gray-600",
                                          children: [api.responseTime, "ms"],
                                        }),
                                      ],
                                    }),
                                    _jsxs("div", {
                                      className: "text-center",
                                      children: [
                                        _jsx("p", {
                                          className: "font-medium",
                                          children: "Size",
                                        }),
                                        _jsx("p", {
                                          className: "text-gray-600",
                                          children: formatBytes(
                                            api.responseSize,
                                          ),
                                        }),
                                      ],
                                    }),
                                    api.cached &&
                                      _jsx(Badge, {
                                        className: "bg-blue-100 text-blue-600",
                                        children: "Cached",
                                      }),
                                  ],
                                }),
                              ],
                            },
                            api.id,
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
            value: "alerts",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsxs("h3", {
                      className: "text-lg font-medium",
                      children: [
                        "Performance Alerts (",
                        performanceOverview.totalAlerts,
                        ")",
                      ],
                    }),
                    _jsxs("div", {
                      className: "flex space-x-2",
                      children: [
                        _jsxs(Badge, {
                          className: "bg-red-100 text-red-600",
                          children: [
                            performanceOverview.criticalAlerts,
                            " Critical",
                          ],
                        }),
                        _jsxs(Badge, {
                          className: "bg-yellow-100 text-yellow-600",
                          children: [
                            performanceOverview.unacknowledgedAlerts,
                            " Unacknowledged",
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: resources.flatMap((resource) =>
                    resource.alerts.map((alert) =>
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
                                    _jsx(AlertTriangle, {
                                      className: "w-5 h-5 text-red-500 mt-0.5",
                                    }),
                                    _jsxs("div", {
                                      className: "flex-1",
                                      children: [
                                        _jsxs("div", {
                                          className:
                                            "flex items-center space-x-2 mb-2",
                                          children: [
                                            _jsx("h4", {
                                              className: "font-medium",
                                              children: alert.message,
                                            }),
                                            _jsx(Badge, {
                                              className: getSeverityColor(
                                                alert.severity,
                                              ),
                                              children: alert.severity,
                                            }),
                                            _jsx(Badge, {
                                              className:
                                                "bg-blue-100 text-blue-600",
                                              children: alert.type,
                                            }),
                                            alert.acknowledged &&
                                              _jsx(Badge, {
                                                className:
                                                  "bg-green-100 text-green-600",
                                                children: "Acknowledged",
                                              }),
                                          ],
                                        }),
                                        _jsxs("div", {
                                          className:
                                            "text-sm text-gray-600 mb-2",
                                          children: [
                                            _jsx("strong", {
                                              children: "Resource:",
                                            }),
                                            " ",
                                            resource.name,
                                            " (",
                                            resource.type,
                                            ")",
                                          ],
                                        }),
                                        _jsxs("div", {
                                          className: "text-xs text-gray-500",
                                          children: [
                                            _jsx(Clock, {
                                              className: "w-3 h-3 inline mr-1",
                                            }),
                                            new Date(
                                              alert.timestamp,
                                            ).toLocaleString(),
                                            alert.resolvedAt &&
                                              _jsxs(_Fragment, {
                                                children: [
                                                  _jsx("span", {
                                                    className: "mx-2",
                                                    children: "\u2022",
                                                  }),
                                                  _jsxs("span", {
                                                    children: [
                                                      "Resolved:",
                                                      " ",
                                                      new Date(
                                                        alert.resolvedAt,
                                                      ).toLocaleString(),
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
                                _jsx("div", {
                                  className: "flex space-x-2",
                                  children:
                                    !alert.acknowledged &&
                                    _jsxs(Button, {
                                      onClick: () =>
                                        handleAlertAcknowledge(alert.id),
                                      size: "sm",
                                      variant: "outline",
                                      children: [
                                        _jsx(CheckCircle, {
                                          className: "w-3 h-3 mr-1",
                                        }),
                                        "Acknowledge",
                                      ],
                                    }),
                                }),
                              ],
                            }),
                          }),
                        },
                        alert.id,
                      ),
                    ),
                  ),
                }),
                performanceOverview.totalAlerts === 0 &&
                  _jsx(Card, {
                    children: _jsxs(CardContent, {
                      className: "p-6 text-center",
                      children: [
                        _jsx(CheckCircle, {
                          className: "w-12 h-12 mx-auto mb-4 text-green-400",
                        }),
                        _jsx("h3", {
                          className: "text-lg font-medium text-gray-900 mb-2",
                          children: "No Active Alerts",
                        }),
                        _jsx("p", {
                          className: "text-sm text-gray-600",
                          children:
                            "All systems are operating normally with no performance alerts.",
                        }),
                      ],
                    }),
                  }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}
export default PerformanceMonitor;

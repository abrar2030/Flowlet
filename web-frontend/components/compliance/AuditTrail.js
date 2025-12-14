import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useState, useCallback, useMemo } from "react";
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
import { DatePicker } from "../ui/date-picker";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Shield,
  Database,
  Key,
  Monitor,
  Globe,
  Smartphone,
  Edit,
  Plus,
  RefreshCw,
  Settings,
  XCircle,
} from "lucide-react";
export function AuditTrail({
  events = [],
  reports = [],
  onEventSearch,
  onEventExport,
  onReportGenerate,
  onReportExport,
  onEventDetails,
  realTimeEnabled = true,
  retentionPolicyDays = 2555, // 7 years default for financial compliance
  className = "",
}) {
  const [state, setState] = useState({
    activeTab: "events",
    selectedEvent: null,
    selectedReport: null,
    filters: {
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        end: new Date(),
      },
      eventTypes: [],
      outcomes: [],
      riskLevels: [],
      users: [],
      resources: [],
      searchTerm: "",
      complianceOnly: false,
    },
    isSearching: false,
    isExporting: false,
    isGenerating: false,
    error: null,
    success: null,
    showAdvancedFilters: false,
    showEventDetails: false,
    showReportConfig: false,
    newReportName: "",
    newReportDescription: "",
  });
  // Calculate audit metrics
  const auditMetrics = useMemo(() => {
    const totalEvents = events.length;
    const criticalEvents = events.filter(
      (e) => e.riskLevel === "critical",
    ).length;
    const failedEvents = events.filter((e) => e.outcome === "failure").length;
    const complianceEvents = events.filter((e) => e.complianceRelevant).length;
    const eventsByType = events.reduce((acc, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});
    const eventsByUser = events.reduce((acc, event) => {
      const key = `${event.userId}:${event.userName}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const eventsByHour = events.reduce((acc, event) => {
      const hour = new Date(event.timestamp).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    return {
      totalEvents,
      criticalEvents,
      failedEvents,
      complianceEvents,
      failureRate: totalEvents > 0 ? (failedEvents / totalEvents) * 100 : 0,
      eventsByType,
      eventsByUser,
      eventsByHour,
      topUsers: Object.entries(eventsByUser)
        .map(([key, count]) => {
          const [userId, userName] = key.split(":");
          return { userId, userName, eventCount: count };
        })
        .sort((a, b) => b.eventCount - a.eventCount)
        .slice(0, 10),
      topEventTypes: Object.entries(eventsByType)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    };
  }, [events]);
  // Filter events based on current filters
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Date range filter
      if (
        state.filters.dateRange.start &&
        new Date(event.timestamp) < state.filters.dateRange.start
      ) {
        return false;
      }
      if (
        state.filters.dateRange.end &&
        new Date(event.timestamp) > state.filters.dateRange.end
      ) {
        return false;
      }
      // Event type filter
      if (
        state.filters.eventTypes.length > 0 &&
        !state.filters.eventTypes.includes(event.eventType)
      ) {
        return false;
      }
      // Outcome filter
      if (
        state.filters.outcomes.length > 0 &&
        !state.filters.outcomes.includes(event.outcome)
      ) {
        return false;
      }
      // Risk level filter
      if (
        state.filters.riskLevels.length > 0 &&
        !state.filters.riskLevels.includes(event.riskLevel)
      ) {
        return false;
      }
      // User filter
      if (
        state.filters.users.length > 0 &&
        !state.filters.users.includes(event.userId)
      ) {
        return false;
      }
      // Resource filter
      if (
        state.filters.resources.length > 0 &&
        !state.filters.resources.some((r) => event.resource.includes(r))
      ) {
        return false;
      }
      // Search term filter
      if (state.filters.searchTerm) {
        const searchLower = state.filters.searchTerm.toLowerCase();
        const searchableText =
          `${event.action} ${event.resource} ${event.userName} ${event.details}`.toLowerCase();
        if (!searchableText.includes(searchLower)) {
          return false;
        }
      }
      // Compliance filter
      if (state.filters.complianceOnly && !event.complianceRelevant) {
        return false;
      }
      return true;
    });
  }, [events, state.filters]);
  // Handle search
  const handleSearch = useCallback(async () => {
    setState((prev) => ({ ...prev, isSearching: true, error: null }));
    try {
      if (onEventSearch) {
        const results = await onEventSearch(state.filters);
        setState((prev) => ({
          ...prev,
          success: `Found ${results.length} events`,
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to search events" }));
    } finally {
      setState((prev) => ({ ...prev, isSearching: false }));
    }
  }, [onEventSearch, state.filters]);
  // Handle export
  const handleExport = useCallback(
    async (format) => {
      setState((prev) => ({ ...prev, isExporting: true, error: null }));
      try {
        if (onEventExport) {
          const blob = await onEventExport(state.filters, format);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `audit-trail-${new Date().toISOString().split("T")[0]}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setState((prev) => ({
            ...prev,
            success: "Export completed successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to export events" }));
      } finally {
        setState((prev) => ({ ...prev, isExporting: false }));
      }
    },
    [onEventExport, state.filters],
  );
  // Handle report generation
  const handleReportGenerate = useCallback(async () => {
    if (!state.newReportName.trim()) {
      setState((prev) => ({ ...prev, error: "Report name is required" }));
      return;
    }
    setState((prev) => ({ ...prev, isGenerating: true, error: null }));
    try {
      if (onReportGenerate) {
        await onReportGenerate({
          name: state.newReportName,
          description: state.newReportDescription,
          filters: state.filters,
          period: {
            start: state.filters.dateRange.start?.toISOString() || "",
            end: state.filters.dateRange.end?.toISOString() || "",
          },
        });
        setState((prev) => ({
          ...prev,
          success: "Report generation started",
          showReportConfig: false,
          newReportName: "",
          newReportDescription: "",
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to generate report" }));
    } finally {
      setState((prev) => ({ ...prev, isGenerating: false }));
    }
  }, [
    onReportGenerate,
    state.filters,
    state.newReportName,
    state.newReportDescription,
  ]);
  // Handle event details
  const handleEventDetails = useCallback(
    async (eventId) => {
      try {
        if (onEventDetails) {
          const event = await onEventDetails(eventId);
          setState((prev) => ({
            ...prev,
            selectedEvent: event,
            showEventDetails: true,
          }));
        } else {
          const event = events.find((e) => e.id === eventId);
          if (event) {
            setState((prev) => ({
              ...prev,
              selectedEvent: event,
              showEventDetails: true,
            }));
          }
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Failed to load event details",
        }));
      }
    },
    [onEventDetails, events],
  );
  const getEventTypeIcon = (type) => {
    switch (type) {
      case "authentication":
        return _jsx(Key, { className: "w-4 h-4" });
      case "authorization":
        return _jsx(Shield, { className: "w-4 h-4" });
      case "data_access":
        return _jsx(Eye, { className: "w-4 h-4" });
      case "data_modification":
        return _jsx(Edit, { className: "w-4 h-4" });
      case "system_access":
        return _jsx(Monitor, { className: "w-4 h-4" });
      case "configuration_change":
        return _jsx(Settings, { className: "w-4 h-4" });
      case "security_event":
        return _jsx(AlertTriangle, { className: "w-4 h-4" });
      case "compliance_event":
        return _jsx(FileText, { className: "w-4 h-4" });
      default:
        return _jsx(Clock, { className: "w-4 h-4" });
    }
  };
  const getOutcomeColor = (outcome) => {
    switch (outcome) {
      case "success":
        return "bg-green-100 text-green-600";
      case "failure":
        return "bg-red-100 text-red-600";
      case "warning":
        return "bg-yellow-100 text-yellow-600";
      case "info":
        return "bg-blue-100 text-blue-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const getRiskLevelColor = (level) => {
    switch (level) {
      case "critical":
        return "bg-red-100 text-red-600";
      case "high":
        return "bg-orange-100 text-orange-600";
      case "medium":
        return "bg-yellow-100 text-yellow-600";
      case "low":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const getDeviceIcon = (type) => {
    switch (type) {
      case "mobile":
        return _jsx(Smartphone, { className: "w-4 h-4" });
      case "tablet":
        return _jsx(Monitor, { className: "w-4 h-4" });
      case "api":
        return _jsx(Database, { className: "w-4 h-4" });
      default:
        return _jsx(Monitor, { className: "w-4 h-4" });
    }
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
                    _jsx(FileText, { className: "w-6 h-6 mr-3 text-blue-600" }),
                    "Audit Trail Management",
                  ],
                }),
                _jsxs("div", {
                  className: "flex items-center space-x-2",
                  children: [
                    _jsxs(Badge, {
                      className: "bg-blue-100 text-blue-600",
                      children: [
                        _jsx(Clock, { className: "w-3 h-3 mr-1" }),
                        filteredEvents.length,
                        " Events",
                      ],
                    }),
                    realTimeEnabled &&
                      _jsxs(Badge, {
                        className: "bg-green-100 text-green-600",
                        children: [
                          _jsx(RefreshCw, { className: "w-3 h-3 mr-1" }),
                          "Real-time",
                        ],
                      }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(CardContent, {
            children: _jsxs("p", {
              className: "text-sm text-gray-600",
              children: [
                "Comprehensive audit logging and monitoring for compliance and security analysis. Retention period: ",
                retentionPolicyDays,
                " days.",
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
      auditMetrics.criticalEvents > 0 &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-red-600" }),
            _jsxs(AlertDescription, {
              className: "text-red-800",
              children: [
                _jsx("strong", { children: "Critical Alert:" }),
                " ",
                auditMetrics.criticalEvents,
                " ",
                "critical security events detected.",
              ],
            }),
          ],
        }),
      _jsx(Card, {
        children: _jsx(CardContent, {
          className: "p-4",
          children: _jsxs("div", {
            className: "space-y-4",
            children: [
              _jsxs("div", {
                className: "flex space-x-4",
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
                            "Search events, actions, resources, users...",
                          value: state.filters.searchTerm,
                          onChange: (e) =>
                            setState((prev) => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                searchTerm: e.target.value,
                              },
                            })),
                          className: "pl-10",
                        }),
                      ],
                    }),
                  }),
                  _jsxs(Button, {
                    onClick: () =>
                      setState((prev) => ({
                        ...prev,
                        showAdvancedFilters: !prev.showAdvancedFilters,
                      })),
                    variant: "outline",
                    children: [
                      _jsx(Filter, { className: "w-4 h-4 mr-2" }),
                      "Filters",
                    ],
                  }),
                  _jsxs(Button, {
                    onClick: handleSearch,
                    disabled: state.isSearching,
                    children: [
                      _jsx(Search, {
                        className: `w-4 h-4 mr-2 ${state.isSearching ? "animate-spin" : ""}`,
                      }),
                      "Search",
                    ],
                  }),
                ],
              }),
              state.showAdvancedFilters &&
                _jsxs("div", {
                  className:
                    "grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg",
                  children: [
                    _jsxs("div", {
                      children: [
                        _jsx(Label, {
                          className: "text-sm",
                          children: "Start Date",
                        }),
                        _jsx(DatePicker, {
                          selected: state.filters.dateRange.start,
                          onChange: (date) =>
                            setState((prev) => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                dateRange: {
                                  ...prev.filters.dateRange,
                                  start: date,
                                },
                              },
                            })),
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      children: [
                        _jsx(Label, {
                          className: "text-sm",
                          children: "End Date",
                        }),
                        _jsx(DatePicker, {
                          selected: state.filters.dateRange.end,
                          onChange: (date) =>
                            setState((prev) => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                dateRange: {
                                  ...prev.filters.dateRange,
                                  end: date,
                                },
                              },
                            })),
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      children: [
                        _jsx(Label, {
                          className: "text-sm",
                          children: "Event Type",
                        }),
                        _jsxs(Select, {
                          value: state.filters.eventTypes[0] || "all",
                          onValueChange: (value) =>
                            setState((prev) => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                eventTypes: value === "all" ? [] : [value],
                              },
                            })),
                          children: [
                            _jsx(SelectTrigger, {
                              children: _jsx(SelectValue, {
                                placeholder: "All types",
                              }),
                            }),
                            _jsxs(SelectContent, {
                              children: [
                                _jsx(SelectItem, {
                                  value: "all",
                                  children: "All Types",
                                }),
                                _jsx(SelectItem, {
                                  value: "authentication",
                                  children: "Authentication",
                                }),
                                _jsx(SelectItem, {
                                  value: "authorization",
                                  children: "Authorization",
                                }),
                                _jsx(SelectItem, {
                                  value: "data_access",
                                  children: "Data Access",
                                }),
                                _jsx(SelectItem, {
                                  value: "data_modification",
                                  children: "Data Modification",
                                }),
                                _jsx(SelectItem, {
                                  value: "system_access",
                                  children: "System Access",
                                }),
                                _jsx(SelectItem, {
                                  value: "configuration_change",
                                  children: "Configuration",
                                }),
                                _jsx(SelectItem, {
                                  value: "security_event",
                                  children: "Security Event",
                                }),
                                _jsx(SelectItem, {
                                  value: "compliance_event",
                                  children: "Compliance",
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
                          className: "text-sm",
                          children: "Outcome",
                        }),
                        _jsxs(Select, {
                          value: state.filters.outcomes[0] || "all",
                          onValueChange: (value) =>
                            setState((prev) => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                outcomes: value === "all" ? [] : [value],
                              },
                            })),
                          children: [
                            _jsx(SelectTrigger, {
                              children: _jsx(SelectValue, {
                                placeholder: "All outcomes",
                              }),
                            }),
                            _jsxs(SelectContent, {
                              children: [
                                _jsx(SelectItem, {
                                  value: "all",
                                  children: "All Outcomes",
                                }),
                                _jsx(SelectItem, {
                                  value: "success",
                                  children: "Success",
                                }),
                                _jsx(SelectItem, {
                                  value: "failure",
                                  children: "Failure",
                                }),
                                _jsx(SelectItem, {
                                  value: "warning",
                                  children: "Warning",
                                }),
                                _jsx(SelectItem, {
                                  value: "info",
                                  children: "Info",
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
                          className: "text-sm",
                          children: "Risk Level",
                        }),
                        _jsxs(Select, {
                          value: state.filters.riskLevels[0] || "all",
                          onValueChange: (value) =>
                            setState((prev) => ({
                              ...prev,
                              filters: {
                                ...prev.filters,
                                riskLevels: value === "all" ? [] : [value],
                              },
                            })),
                          children: [
                            _jsx(SelectTrigger, {
                              children: _jsx(SelectValue, {
                                placeholder: "All levels",
                              }),
                            }),
                            _jsxs(SelectContent, {
                              children: [
                                _jsx(SelectItem, {
                                  value: "all",
                                  children: "All Levels",
                                }),
                                _jsx(SelectItem, {
                                  value: "critical",
                                  children: "Critical",
                                }),
                                _jsx(SelectItem, {
                                  value: "high",
                                  children: "High",
                                }),
                                _jsx(SelectItem, {
                                  value: "medium",
                                  children: "Medium",
                                }),
                                _jsx(SelectItem, {
                                  value: "low",
                                  children: "Low",
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
        }),
      }),
      _jsxs(Tabs, {
        value: state.activeTab,
        onValueChange: (value) =>
          setState((prev) => ({ ...prev, activeTab: value })),
        children: [
          _jsxs(TabsList, {
            className: "grid w-full grid-cols-4",
            children: [
              _jsx(TabsTrigger, { value: "events", children: "Events" }),
              _jsx(TabsTrigger, { value: "analytics", children: "Analytics" }),
              _jsx(TabsTrigger, { value: "reports", children: "Reports" }),
              _jsx(TabsTrigger, { value: "settings", children: "Settings" }),
            ],
          }),
          _jsx(TabsContent, {
            value: "events",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsxs("h3", {
                      className: "text-lg font-medium",
                      children: ["Audit Events (", filteredEvents.length, ")"],
                    }),
                    _jsxs("div", {
                      className: "flex space-x-2",
                      children: [
                        _jsxs(Button, {
                          onClick: () => handleExport("csv"),
                          disabled: state.isExporting,
                          size: "sm",
                          variant: "outline",
                          children: [
                            _jsx(Download, { className: "w-4 h-4 mr-2" }),
                            "Export CSV",
                          ],
                        }),
                        _jsxs(Button, {
                          onClick: () => handleExport("json"),
                          disabled: state.isExporting,
                          size: "sm",
                          variant: "outline",
                          children: [
                            _jsx(Download, { className: "w-4 h-4 mr-2" }),
                            "Export JSON",
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-2",
                  children: filteredEvents
                    .slice(0, 100)
                    .map((event) =>
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
                                    getEventTypeIcon(event.eventType),
                                    _jsxs("div", {
                                      className: "flex-1 min-w-0",
                                      children: [
                                        _jsxs("div", {
                                          className:
                                            "flex items-center space-x-2 mb-1",
                                          children: [
                                            _jsx("h4", {
                                              className: "font-medium truncate",
                                              children: event.action,
                                            }),
                                            _jsx(Badge, {
                                              className: getOutcomeColor(
                                                event.outcome,
                                              ),
                                              children: event.outcome,
                                            }),
                                            _jsx(Badge, {
                                              className: getRiskLevelColor(
                                                event.riskLevel,
                                              ),
                                              children: event.riskLevel,
                                            }),
                                            event.complianceRelevant &&
                                              _jsx(Badge, {
                                                className:
                                                  "bg-purple-100 text-purple-600",
                                                children: "Compliance",
                                              }),
                                          ],
                                        }),
                                        _jsxs("div", {
                                          className:
                                            "flex items-center space-x-4 text-sm text-gray-600 mb-1",
                                          children: [
                                            _jsxs("span", {
                                              className: "flex items-center",
                                              children: [
                                                _jsx(User, {
                                                  className: "w-3 h-3 mr-1",
                                                }),
                                                event.userName,
                                              ],
                                            }),
                                            _jsxs("span", {
                                              className: "flex items-center",
                                              children: [
                                                _jsx(Database, {
                                                  className: "w-3 h-3 mr-1",
                                                }),
                                                event.resource,
                                              ],
                                            }),
                                            _jsxs("span", {
                                              className: "flex items-center",
                                              children: [
                                                _jsx(Globe, {
                                                  className: "w-3 h-3 mr-1",
                                                }),
                                                event.sourceIp,
                                              ],
                                            }),
                                            event.deviceInfo &&
                                              _jsxs("span", {
                                                className: "flex items-center",
                                                children: [
                                                  getDeviceIcon(
                                                    event.deviceInfo.type,
                                                  ),
                                                  _jsx("span", {
                                                    className: "ml-1",
                                                    children:
                                                      event.deviceInfo.type,
                                                  }),
                                                ],
                                              }),
                                          ],
                                        }),
                                        _jsxs("div", {
                                          className:
                                            "flex items-center space-x-2 text-xs text-gray-500",
                                          children: [
                                            _jsx(Clock, {
                                              className: "w-3 h-3",
                                            }),
                                            _jsx("span", {
                                              children: new Date(
                                                event.timestamp,
                                              ).toLocaleString(),
                                            }),
                                            event.location &&
                                              _jsxs(_Fragment, {
                                                children: [
                                                  _jsx("span", {
                                                    children: "\u2022",
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
                                _jsxs(Button, {
                                  onClick: () => handleEventDetails(event.id),
                                  size: "sm",
                                  variant: "outline",
                                  children: [
                                    _jsx(Eye, { className: "w-3 h-3 mr-1" }),
                                    "Details",
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
                        _jsx(FileText, {
                          className: "w-12 h-12 mx-auto mb-4 text-gray-400",
                        }),
                        _jsx("h3", {
                          className: "text-lg font-medium text-gray-900 mb-2",
                          children: "No Events Found",
                        }),
                        _jsx("p", {
                          className: "text-sm text-gray-600",
                          children:
                            "No audit events match your current filters. Try adjusting your search criteria.",
                        }),
                      ],
                    }),
                  }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "analytics",
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
                                  children: "Total Events",
                                }),
                                _jsx("p", {
                                  className: "text-2xl font-bold",
                                  children: auditMetrics.totalEvents,
                                }),
                              ],
                            }),
                            _jsx(FileText, {
                              className: "w-8 h-8 text-blue-500",
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
                                  children: "Critical Events",
                                }),
                                _jsx("p", {
                                  className: "text-2xl font-bold text-red-600",
                                  children: auditMetrics.criticalEvents,
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
                                  children: "Failure Rate",
                                }),
                                _jsxs("p", {
                                  className:
                                    "text-2xl font-bold text-orange-600",
                                  children: [
                                    auditMetrics.failureRate.toFixed(1),
                                    "%",
                                  ],
                                }),
                              ],
                            }),
                            _jsx(XCircle, {
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
                                  children: "Compliance Events",
                                }),
                                _jsx("p", {
                                  className:
                                    "text-2xl font-bold text-purple-600",
                                  children: auditMetrics.complianceEvents,
                                }),
                              ],
                            }),
                            _jsx(Shield, {
                              className: "w-8 h-8 text-purple-500",
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
                        children: "Top Active Users",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsx("div", {
                        className: "space-y-2",
                        children: auditMetrics.topUsers
                          .slice(0, 10)
                          .map((user, index) =>
                            _jsxs(
                              "div",
                              {
                                className:
                                  "flex items-center justify-between p-2 bg-gray-50 rounded",
                                children: [
                                  _jsxs("div", {
                                    className: "flex items-center space-x-2",
                                    children: [
                                      _jsxs("span", {
                                        className: "text-sm font-medium",
                                        children: ["#", index + 1],
                                      }),
                                      _jsx(User, {
                                        className: "w-4 h-4 text-gray-400",
                                      }),
                                      _jsx("span", {
                                        className: "text-sm",
                                        children: user.userName,
                                      }),
                                    ],
                                  }),
                                  _jsxs(Badge, {
                                    className: "bg-blue-100 text-blue-600",
                                    children: [user.eventCount, " events"],
                                  }),
                                ],
                              },
                              user.userId,
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
                        children: "Event Types Distribution",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsx("div", {
                        className: "space-y-2",
                        children: auditMetrics.topEventTypes.map(
                          ([type, count]) =>
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
                                        className: "text-sm capitalize",
                                        children: type.replace("_", " "),
                                      }),
                                    ],
                                  }),
                                  _jsxs(Badge, {
                                    className: "bg-green-100 text-green-600",
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
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "reports",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsx("h3", {
                      className: "text-lg font-medium",
                      children: "Audit Reports",
                    }),
                    _jsxs(Button, {
                      onClick: () =>
                        setState((prev) => ({
                          ...prev,
                          showReportConfig: true,
                        })),
                      size: "sm",
                      children: [
                        _jsx(Plus, { className: "w-4 h-4 mr-2" }),
                        "Generate Report",
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: reports.map((report) =>
                    _jsx(
                      Card,
                      {
                        children: _jsx(CardContent, {
                          className: "p-4",
                          children: _jsxs("div", {
                            className: "flex items-center justify-between",
                            children: [
                              _jsxs("div", {
                                children: [
                                  _jsx("h4", {
                                    className: "font-medium",
                                    children: report.name,
                                  }),
                                  _jsx("p", {
                                    className: "text-sm text-gray-600 mb-2",
                                    children: report.description,
                                  }),
                                  _jsxs("div", {
                                    className:
                                      "flex items-center space-x-4 text-xs text-gray-500",
                                    children: [
                                      _jsxs("span", {
                                        children: [
                                          "Generated:",
                                          " ",
                                          new Date(
                                            report.generatedAt,
                                          ).toLocaleDateString(),
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Period:",
                                          " ",
                                          new Date(
                                            report.period.start,
                                          ).toLocaleDateString(),
                                          " ",
                                          "- ",
                                          new Date(
                                            report.period.end,
                                          ).toLocaleDateString(),
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Events: ",
                                          report.totalEvents,
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Critical: ",
                                          report.criticalEvents,
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
                                    className:
                                      report.status === "completed"
                                        ? "bg-green-100 text-green-600"
                                        : report.status === "generating"
                                          ? "bg-yellow-100 text-yellow-600"
                                          : "bg-red-100 text-red-600",
                                    children: report.status,
                                  }),
                                  report.status === "completed" &&
                                    _jsxs(Button, {
                                      onClick: () => {
                                        if (onReportExport) {
                                          onReportExport(report.id);
                                        }
                                      },
                                      size: "sm",
                                      variant: "outline",
                                      children: [
                                        _jsx(Download, {
                                          className: "w-3 h-3 mr-1",
                                        }),
                                        "Export",
                                      ],
                                    }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      },
                      report.id,
                    ),
                  ),
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
                    children: "Audit Trail Configuration",
                  }),
                }),
                _jsx(CardContent, {
                  className: "space-y-6",
                  children: _jsxs("div", {
                    className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                    children: [
                      _jsxs("div", {
                        className: "space-y-4",
                        children: [
                          _jsxs("div", {
                            children: [
                              _jsx(Label, {
                                className: "text-sm font-medium",
                                children: "Retention Policy",
                              }),
                              _jsx("p", {
                                className: "text-xs text-gray-600 mb-2",
                                children: "How long audit events are stored",
                              }),
                              _jsxs("div", {
                                className: "flex items-center space-x-2",
                                children: [
                                  _jsx("span", {
                                    className: "text-2xl font-bold",
                                    children: retentionPolicyDays,
                                  }),
                                  _jsx("span", {
                                    className: "text-sm text-gray-600",
                                    children: "days",
                                  }),
                                ],
                              }),
                            ],
                          }),
                          _jsxs("div", {
                            children: [
                              _jsx(Label, {
                                className: "text-sm font-medium",
                                children: "Real-time Monitoring",
                              }),
                              _jsx("p", {
                                className: "text-xs text-gray-600 mb-2",
                                children: "Enable real-time event streaming",
                              }),
                              _jsx(Badge, {
                                className: realTimeEnabled
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-100 text-gray-600",
                                children: realTimeEnabled
                                  ? "Enabled"
                                  : "Disabled",
                              }),
                            ],
                          }),
                        ],
                      }),
                      _jsx("div", {
                        className: "space-y-4",
                        children: _jsxs("div", {
                          children: [
                            _jsx(Label, {
                              className: "text-sm font-medium",
                              children: "Event Categories",
                            }),
                            _jsx("p", {
                              className: "text-xs text-gray-600 mb-2",
                              children: "Types of events being logged",
                            }),
                            _jsx("div", {
                              className: "space-y-1",
                              children: [
                                "Authentication",
                                "Authorization",
                                "Data Access",
                                "System Access",
                                "Security Events",
                                "Compliance",
                              ].map((category) =>
                                _jsxs(
                                  "div",
                                  {
                                    className:
                                      "flex items-center justify-between",
                                    children: [
                                      _jsx("span", {
                                        className: "text-sm",
                                        children: category,
                                      }),
                                      _jsx(Badge, {
                                        className:
                                          "bg-green-100 text-green-600",
                                        children: "Active",
                                      }),
                                    ],
                                  },
                                  category,
                                ),
                              ),
                            }),
                          ],
                        }),
                      }),
                    ],
                  }),
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
                                    children: "Timestamp:",
                                  }),
                                  _jsx("span", {
                                    children: new Date(
                                      state.selectedEvent.timestamp,
                                    ).toLocaleString(),
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
                                    children:
                                      state.selectedEvent.eventType.replace(
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
                                    children: "Action:",
                                  }),
                                  _jsx("span", {
                                    children: state.selectedEvent.action,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Resource:",
                                  }),
                                  _jsx("span", {
                                    children: state.selectedEvent.resource,
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
                            children: "User Information",
                          }),
                          _jsxs("div", {
                            className: "space-y-2 text-sm",
                            children: [
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "User ID:",
                                  }),
                                  _jsx("span", {
                                    children: state.selectedEvent.userId,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Name:",
                                  }),
                                  _jsx("span", {
                                    children: state.selectedEvent.userName,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Role:",
                                  }),
                                  _jsx("span", {
                                    children: state.selectedEvent.userRole,
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
                                    children: state.selectedEvent.sourceIp,
                                  }),
                                ],
                              }),
                              state.selectedEvent.location &&
                                _jsxs("div", {
                                  className: "flex justify-between",
                                  children: [
                                    _jsx("span", {
                                      className: "text-gray-600",
                                      children: "Location:",
                                    }),
                                    _jsxs("span", {
                                      children: [
                                        state.selectedEvent.location.city,
                                        ",",
                                        " ",
                                        state.selectedEvent.location.country,
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
                  state.selectedEvent.metadata &&
                    _jsxs("div", {
                      children: [
                        _jsx(Label, {
                          className: "text-sm font-medium",
                          children: "Metadata",
                        }),
                        _jsx("pre", {
                          className:
                            "mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto",
                          children: JSON.stringify(
                            state.selectedEvent.metadata,
                            null,
                            2,
                          ),
                        }),
                      ],
                    }),
                ],
              }),
            ],
          }),
        }),
      state.showReportConfig &&
        _jsx("div", {
          className:
            "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
          children: _jsxs(Card, {
            className: "w-full max-w-md",
            children: [
              _jsx(CardHeader, {
                children: _jsx(CardTitle, {
                  children: "Generate Audit Report",
                }),
              }),
              _jsxs(CardContent, {
                className: "space-y-4",
                children: [
                  _jsxs("div", {
                    children: [
                      _jsx(Label, { children: "Report Name" }),
                      _jsx(Input, {
                        value: state.newReportName,
                        onChange: (e) =>
                          setState((prev) => ({
                            ...prev,
                            newReportName: e.target.value,
                          })),
                        placeholder: "Enter report name",
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    children: [
                      _jsx(Label, { children: "Description" }),
                      _jsx(Input, {
                        value: state.newReportDescription,
                        onChange: (e) =>
                          setState((prev) => ({
                            ...prev,
                            newReportDescription: e.target.value,
                          })),
                        placeholder: "Enter report description",
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "flex space-x-2",
                    children: [
                      _jsx(Button, {
                        onClick: handleReportGenerate,
                        disabled:
                          state.isGenerating || !state.newReportName.trim(),
                        children: state.isGenerating
                          ? "Generating..."
                          : "Generate Report",
                      }),
                      _jsx(Button, {
                        onClick: () =>
                          setState((prev) => ({
                            ...prev,
                            showReportConfig: false,
                            newReportName: "",
                            newReportDescription: "",
                          })),
                        variant: "outline",
                        children: "Cancel",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
    ],
  });
}
export default AuditTrail;

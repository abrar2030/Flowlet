import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
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
import { Checkbox } from "../ui/checkbox";
import {
  Shield,
  AlertTriangle,
  Eye,
  Lock,
  FileText,
  Database,
  Globe,
  Mail,
  CreditCard,
  User,
  Search,
  Download,
  Upload,
  Play,
  Settings,
  CheckCircle,
  TrendingDown,
  Activity,
  Zap,
  Target,
  Flag,
  Bell,
  Trash2,
  Edit,
  Plus,
} from "lucide-react";
export function DataLossPrevention({
  rules = [],
  incidents = [],
  scanResults = [],
  onRuleCreate,
  onRuleUpdate,
  onRuleDelete,
  onRuleTest,
  onIncidentUpdate,
  onScanStart,
  onScan,
  onExportReport,
  realTimeMonitoring = true,
  className = "",
}) {
  const [state, setState] = useState({
    activeTab: "overview",
    selectedRule: null,
    selectedIncident: null,
    selectedScan: null,
    searchTerm: "",
    filterSeverity: "all",
    filterStatus: "all",
    filterCategory: "all",
    filterChannel: "all",
    showRuleEditor: false,
    showIncidentDetails: false,
    showScanConfig: false,
    showTestDialog: false,
    isCreating: false,
    isTesting: false,
    isScanning: false,
    isExporting: false,
    error: null,
    success: null,
    newRule: {
      name: "",
      description: "",
      category: "pii",
      severity: "medium",
      status: "active",
      patterns: [],
      actions: [],
      conditions: [],
      scope: {
        channels: [],
        locations: [],
        users: [],
        timeWindows: [],
      },
      exceptions: {
        users: [],
        locations: [],
        justifications: [],
      },
      createdBy: "current-user",
    },
    testData: "",
    testResults: null,
    scanConfig: {
      scope: {
        locations: [],
        fileTypes: ["*"],
        sizeLimit: 100 * 1024 * 1024, // 100MB
      },
      rules: [],
    },
  });
  // Calculate DLP metrics
  const dlpMetrics = useMemo(() => {
    const totalRules = rules.length;
    const activeRules = rules.filter((r) => r.status === "active").length;
    const totalIncidents = incidents.length;
    const openIncidents = incidents.filter((i) => i.status === "open").length;
    const criticalIncidents = incidents.filter(
      (i) => i.severity === "critical",
    ).length;
    const falsePositives = incidents.filter(
      (i) => i.status === "false_positive",
    ).length;
    const incidentsByCategory = incidents.reduce((acc, incident) => {
      const rule = rules.find((r) => r.id === incident.ruleId);
      if (rule) {
        acc[rule.category] = (acc[rule.category] || 0) + 1;
      }
      return acc;
    }, {});
    const incidentsBySeverity = incidents.reduce((acc, incident) => {
      acc[incident.severity] = (acc[incident.severity] || 0) + 1;
      return acc;
    }, {});
    const incidentsByChannel = incidents.reduce((acc, incident) => {
      acc[incident.channel] = (acc[incident.channel] || 0) + 1;
      return acc;
    }, {});
    const averageRiskScore =
      incidents.length > 0
        ? incidents.reduce((sum, i) => sum + i.riskScore, 0) / incidents.length
        : 0;
    const recentIncidents = incidents.filter((i) => {
      const incidentDate = new Date(i.timestamp);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return incidentDate > dayAgo;
    }).length;
    return {
      totalRules,
      activeRules,
      totalIncidents,
      openIncidents,
      criticalIncidents,
      falsePositives,
      falsePositiveRate:
        totalIncidents > 0 ? (falsePositives / totalIncidents) * 100 : 0,
      incidentsByCategory,
      incidentsBySeverity,
      incidentsByChannel,
      averageRiskScore,
      recentIncidents,
    };
  }, [rules, incidents]);
  // Filter incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      const matchesSearch =
        incident.ruleName
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase()) ||
        incident.userName
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase()) ||
        incident.dataType
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase());
      const matchesSeverity =
        state.filterSeverity === "all" ||
        incident.severity === state.filterSeverity;
      const matchesStatus =
        state.filterStatus === "all" || incident.status === state.filterStatus;
      const matchesChannel =
        state.filterChannel === "all" ||
        incident.channel === state.filterChannel;
      const rule = rules.find((r) => r.id === incident.ruleId);
      const matchesCategory =
        state.filterCategory === "all" ||
        (rule && rule.category === state.filterCategory);
      return (
        matchesSearch &&
        matchesSeverity &&
        matchesStatus &&
        matchesChannel &&
        matchesCategory
      );
    });
  }, [
    incidents,
    rules,
    state.searchTerm,
    state.filterSeverity,
    state.filterStatus,
    state.filterChannel,
    state.filterCategory,
  ]);
  // Handle rule creation
  const handleRuleCreate = useCallback(async () => {
    if (!state.newRule.name || !state.newRule.description) {
      setState((prev) => ({
        ...prev,
        error: "Name and description are required",
      }));
      return;
    }
    setState((prev) => ({ ...prev, isCreating: true, error: null }));
    try {
      if (onRuleCreate) {
        await onRuleCreate(state.newRule);
        setState((prev) => ({
          ...prev,
          success: "DLP rule created successfully",
          showRuleEditor: false,
          newRule: {
            name: "",
            description: "",
            category: "pii",
            severity: "medium",
            status: "active",
            patterns: [],
            actions: [],
            conditions: [],
            scope: {
              channels: [],
              locations: [],
              users: [],
              timeWindows: [],
            },
            exceptions: {
              users: [],
              locations: [],
              justifications: [],
            },
            createdBy: "current-user",
          },
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to create DLP rule" }));
    } finally {
      setState((prev) => ({ ...prev, isCreating: false }));
    }
  }, [onRuleCreate, state.newRule]);
  // Handle rule testing
  const handleRuleTest = useCallback(
    async (ruleId) => {
      if (!state.testData.trim()) {
        setState((prev) => ({ ...prev, error: "Test data is required" }));
        return;
      }
      setState((prev) => ({ ...prev, isTesting: true, error: null }));
      try {
        if (onRuleTest) {
          const results = await onRuleTest(ruleId, state.testData);
          setState((prev) => ({
            ...prev,
            testResults: results,
            success: "Rule test completed",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to test rule" }));
      } finally {
        setState((prev) => ({ ...prev, isTesting: false }));
      }
    },
    [onRuleTest, state.testData],
  );
  // Handle scan start
  const handleScanStart = useCallback(async () => {
    if (state.scanConfig.rules.length === 0) {
      setState((prev) => ({
        ...prev,
        error: "Please select at least one rule for scanning",
      }));
      return;
    }
    setState((prev) => ({ ...prev, isScanning: true, error: null }));
    try {
      if (onScanStart) {
        await onScanStart(state.scanConfig);
        setState((prev) => ({
          ...prev,
          success: "Data scan started successfully",
          showScanConfig: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to start scan" }));
    } finally {
      setState((prev) => ({ ...prev, isScanning: false }));
    }
  }, [onScanStart, state.scanConfig]);
  // Handle incident update
  const handleIncidentUpdate = useCallback(
    async (incidentId, updates) => {
      setState((prev) => ({ ...prev, isCreating: true, error: null }));
      try {
        if (onIncidentUpdate) {
          await onIncidentUpdate(incidentId, updates);
          setState((prev) => ({
            ...prev,
            success: "Incident updated successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to update incident" }));
      } finally {
        setState((prev) => ({ ...prev, isCreating: false }));
      }
    },
    [onIncidentUpdate],
  );
  // Handle export
  const handleExport = useCallback(async () => {
    setState((prev) => ({ ...prev, isExporting: true, error: null }));
    try {
      if (onExportReport) {
        const filters = {
          severity: state.filterSeverity,
          status: state.filterStatus,
          category: state.filterCategory,
          channel: state.filterChannel,
          search: state.searchTerm,
        };
        const blob = await onExportReport(filters);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dlp-report-${new Date().toISOString().split("T")[0]}.csv`;
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
  }, [
    onExportReport,
    state.filterSeverity,
    state.filterStatus,
    state.filterCategory,
    state.filterChannel,
    state.searchTerm,
  ]);
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
      case "active":
        return "bg-green-100 text-green-600";
      case "inactive":
        return "bg-gray-100 text-gray-600";
      case "testing":
        return "bg-blue-100 text-blue-600";
      case "open":
        return "bg-red-100 text-red-600";
      case "investigating":
        return "bg-yellow-100 text-yellow-600";
      case "resolved":
        return "bg-green-100 text-green-600";
      case "false_positive":
        return "bg-gray-100 text-gray-600";
      case "suppressed":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const getCategoryIcon = (category) => {
    switch (category) {
      case "pii":
        return _jsx(User, { className: "w-4 h-4" });
      case "financial":
        return _jsx(CreditCard, { className: "w-4 h-4" });
      case "health":
        return _jsx(Activity, { className: "w-4 h-4" });
      case "intellectual_property":
        return _jsx(FileText, { className: "w-4 h-4" });
      case "confidential":
        return _jsx(Lock, { className: "w-4 h-4" });
      case "custom":
        return _jsx(Settings, { className: "w-4 h-4" });
      default:
        return _jsx(Shield, { className: "w-4 h-4" });
    }
  };
  const getChannelIcon = (channel) => {
    switch (channel) {
      case "email":
        return _jsx(Mail, { className: "w-4 h-4" });
      case "file_upload":
        return _jsx(Upload, { className: "w-4 h-4" });
      case "web_form":
        return _jsx(Globe, { className: "w-4 h-4" });
      case "api":
        return _jsx(Database, { className: "w-4 h-4" });
      case "chat":
        return _jsx(MessageCircle, { className: "w-4 h-4" });
      default:
        return _jsx(Globe, { className: "w-4 h-4" });
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
                    _jsx(Shield, { className: "w-6 h-6 mr-3 text-blue-600" }),
                    "Data Loss Prevention",
                  ],
                }),
                _jsxs("div", {
                  className: "flex items-center space-x-2",
                  children: [
                    _jsxs(Badge, {
                      className: "bg-blue-100 text-blue-600",
                      children: [
                        _jsx(Target, { className: "w-3 h-3 mr-1" }),
                        dlpMetrics.activeRules,
                        " Active Rules",
                      ],
                    }),
                    _jsxs(Badge, {
                      className:
                        dlpMetrics.openIncidents > 0
                          ? "bg-red-100 text-red-600"
                          : "bg-green-100 text-green-600",
                      children: [
                        _jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }),
                        dlpMetrics.openIncidents,
                        " Open Incidents",
                      ],
                    }),
                    realTimeMonitoring &&
                      _jsxs(Badge, {
                        className: "bg-green-100 text-green-600",
                        children: [
                          _jsx(Activity, { className: "w-3 h-3 mr-1" }),
                          "Real-time",
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
                "Monitor, detect, and prevent unauthorized data access, sharing, and exfiltration across all channels.",
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
      dlpMetrics.criticalIncidents > 0 &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-red-600" }),
            _jsxs(AlertDescription, {
              className: "text-red-800",
              children: [
                _jsx("strong", { children: "Critical Alert:" }),
                " ",
                dlpMetrics.criticalIncidents,
                " ",
                "critical data loss incidents require immediate attention.",
              ],
            }),
          ],
        }),
      dlpMetrics.recentIncidents > 0 &&
        _jsxs(Alert, {
          className: "border-amber-200 bg-amber-50",
          children: [
            _jsx(Bell, { className: "h-4 w-4 text-amber-600" }),
            _jsxs(AlertDescription, {
              className: "text-amber-800",
              children: [
                _jsx("strong", { children: "Recent Activity:" }),
                " ",
                dlpMetrics.recentIncidents,
                " new incidents detected in the last 24 hours.",
              ],
            }),
          ],
        }),
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
                        placeholder: "Search incidents, rules, users...",
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
                    setState((prev) => ({ ...prev, filterSeverity: value })),
                  children: [
                    _jsx(SelectTrigger, {
                      className: "w-40",
                      children: _jsx(SelectValue, { placeholder: "Severity" }),
                    }),
                    _jsxs(SelectContent, {
                      children: [
                        _jsx(SelectItem, {
                          value: "all",
                          children: "All Severity",
                        }),
                        _jsx(SelectItem, { value: "low", children: "Low" }),
                        _jsx(SelectItem, {
                          value: "medium",
                          children: "Medium",
                        }),
                        _jsx(SelectItem, { value: "high", children: "High" }),
                        _jsx(SelectItem, {
                          value: "critical",
                          children: "Critical",
                        }),
                      ],
                    }),
                  ],
                }),
                _jsxs(Select, {
                  value: state.filterStatus,
                  onValueChange: (value) =>
                    setState((prev) => ({ ...prev, filterStatus: value })),
                  children: [
                    _jsx(SelectTrigger, {
                      className: "w-40",
                      children: _jsx(SelectValue, { placeholder: "Status" }),
                    }),
                    _jsxs(SelectContent, {
                      children: [
                        _jsx(SelectItem, {
                          value: "all",
                          children: "All Status",
                        }),
                        _jsx(SelectItem, { value: "open", children: "Open" }),
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
                _jsxs(Select, {
                  value: state.filterCategory,
                  onValueChange: (value) =>
                    setState((prev) => ({ ...prev, filterCategory: value })),
                  children: [
                    _jsx(SelectTrigger, {
                      className: "w-40",
                      children: _jsx(SelectValue, { placeholder: "Category" }),
                    }),
                    _jsxs(SelectContent, {
                      children: [
                        _jsx(SelectItem, {
                          value: "all",
                          children: "All Categories",
                        }),
                        _jsx(SelectItem, { value: "pii", children: "PII" }),
                        _jsx(SelectItem, {
                          value: "financial",
                          children: "Financial",
                        }),
                        _jsx(SelectItem, {
                          value: "health",
                          children: "Health",
                        }),
                        _jsx(SelectItem, {
                          value: "intellectual_property",
                          children: "IP",
                        }),
                        _jsx(SelectItem, {
                          value: "confidential",
                          children: "Confidential",
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
                _jsx("div", {
                  className: "flex space-x-2",
                  children: _jsxs(Button, {
                    onClick: () =>
                      setState((prev) => ({ ...prev, showScanConfig: true })),
                    size: "sm",
                    variant: "outline",
                    children: [
                      _jsx(Play, { className: "w-4 h-4 mr-2" }),
                      "Start Scan",
                    ],
                  }),
                }),
                _jsx("div", {
                  className: "flex space-x-2",
                  children: _jsxs(Button, {
                    onClick: handleExport,
                    disabled: state.isExporting,
                    size: "sm",
                    variant: "outline",
                    children: [
                      _jsx(Download, { className: "w-4 h-4 mr-2" }),
                      "Export Report",
                    ],
                  }),
                }),
              ],
            }),
          ],
        }),
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
              _jsx(TabsTrigger, { value: "incidents", children: "Incidents" }),
              _jsx(TabsTrigger, { value: "rules", children: "Rules" }),
              _jsx(TabsTrigger, { value: "scans", children: "Scans" }),
              _jsx(TabsTrigger, { value: "analytics", children: "Analytics" }),
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
                                  children: "Total Incidents",
                                }),
                                _jsx("p", {
                                  className: "text-2xl font-bold",
                                  children: dlpMetrics.totalIncidents,
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    "+",
                                    dlpMetrics.recentIncidents,
                                    " today",
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
                                  children: "Open Incidents",
                                }),
                                _jsx("p", {
                                  className: "text-2xl font-bold text-red-600",
                                  children: dlpMetrics.openIncidents,
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    dlpMetrics.criticalIncidents,
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
                                  children: "Active Rules",
                                }),
                                _jsx("p", {
                                  className: "text-2xl font-bold text-blue-600",
                                  children: dlpMetrics.activeRules,
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    "of ",
                                    dlpMetrics.totalRules,
                                    " total",
                                  ],
                                }),
                              ],
                            }),
                            _jsx(Target, {
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
                                  children: "False Positive Rate",
                                }),
                                _jsxs("p", {
                                  className:
                                    "text-2xl font-bold text-green-600",
                                  children: [
                                    dlpMetrics.falsePositiveRate.toFixed(1),
                                    "%",
                                  ],
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    dlpMetrics.falsePositives,
                                    " incidents",
                                  ],
                                }),
                              ],
                            }),
                            _jsx(TrendingDown, {
                              className: "w-8 h-8 text-green-500",
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
                        children: "Recent Critical Incidents",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsx("div", {
                        className: "space-y-3",
                        children: filteredIncidents
                          .filter(
                            (i) =>
                              i.severity === "critical" ||
                              i.severity === "high",
                          )
                          .slice(0, 5)
                          .map((incident) =>
                            _jsxs(
                              "div",
                              {
                                className:
                                  "flex items-center justify-between p-3 bg-gray-50 rounded",
                                children: [
                                  _jsxs("div", {
                                    className: "flex items-center space-x-3",
                                    children: [
                                      getCategoryIcon(
                                        rules.find(
                                          (r) => r.id === incident.ruleId,
                                        )?.category || "custom",
                                      ),
                                      _jsxs("div", {
                                        children: [
                                          _jsx("p", {
                                            className: "font-medium text-sm",
                                            children: incident.ruleName,
                                          }),
                                          _jsxs("p", {
                                            className: "text-xs text-gray-600",
                                            children: [
                                              incident.userName,
                                              " \u2022 ",
                                              incident.channel,
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
                                          incident.severity,
                                        ),
                                        children: incident.severity,
                                      }),
                                      _jsx(Badge, {
                                        className: getStatusColor(
                                          incident.status,
                                        ),
                                        children: incident.status.replace(
                                          "_",
                                          " ",
                                        ),
                                      }),
                                      _jsx("span", {
                                        className: "text-xs text-gray-500",
                                        children: new Date(
                                          incident.timestamp,
                                        ).toLocaleDateString(),
                                      }),
                                    ],
                                  }),
                                ],
                              },
                              incident.id,
                            ),
                          ),
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
                            children: "Incidents by Category",
                          }),
                        }),
                        _jsx(CardContent, {
                          children: _jsx("div", {
                            className: "space-y-3",
                            children: Object.entries(
                              dlpMetrics.incidentsByCategory,
                            ).map(([category, count]) =>
                              _jsxs(
                                "div",
                                {
                                  className:
                                    "flex items-center justify-between p-2 bg-gray-50 rounded",
                                  children: [
                                    _jsxs("div", {
                                      className: "flex items-center space-x-2",
                                      children: [
                                        getCategoryIcon(category),
                                        _jsx("span", {
                                          className: "font-medium capitalize",
                                          children: category.replace("_", " "),
                                        }),
                                      ],
                                    }),
                                    _jsxs(Badge, {
                                      className: "bg-blue-100 text-blue-600",
                                      children: [count, " incidents"],
                                    }),
                                  ],
                                },
                                category,
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
                            children: "Incidents by Channel",
                          }),
                        }),
                        _jsx(CardContent, {
                          children: _jsx("div", {
                            className: "space-y-3",
                            children: Object.entries(
                              dlpMetrics.incidentsByChannel,
                            ).map(([channel, count]) =>
                              _jsxs(
                                "div",
                                {
                                  className:
                                    "flex items-center justify-between p-2 bg-gray-50 rounded",
                                  children: [
                                    _jsxs("div", {
                                      className: "flex items-center space-x-2",
                                      children: [
                                        getChannelIcon(channel),
                                        _jsx("span", {
                                          className: "font-medium capitalize",
                                          children: channel.replace("_", " "),
                                        }),
                                      ],
                                    }),
                                    _jsxs(Badge, {
                                      className: "bg-green-100 text-green-600",
                                      children: [count, " incidents"],
                                    }),
                                  ],
                                },
                                channel,
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
            value: "incidents",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsx("div", {
                  className: "flex justify-between items-center",
                  children: _jsxs("h3", {
                    className: "text-lg font-medium",
                    children: [
                      "DLP Incidents (",
                      filteredIncidents.length,
                      ")",
                    ],
                  }),
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: filteredIncidents.map((incident) =>
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
                                  getCategoryIcon(
                                    rules.find((r) => r.id === incident.ruleId)
                                      ?.category || "custom",
                                  ),
                                  _jsxs("div", {
                                    className: "flex-1 min-w-0",
                                    children: [
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-2 mb-2",
                                        children: [
                                          _jsx("h4", {
                                            className: "font-medium truncate",
                                            children: incident.ruleName,
                                          }),
                                          _jsx(Badge, {
                                            className: getSeverityColor(
                                              incident.severity,
                                            ),
                                            children: incident.severity,
                                          }),
                                          _jsx(Badge, {
                                            className: getStatusColor(
                                              incident.status,
                                            ),
                                            children: incident.status.replace(
                                              "_",
                                              " ",
                                            ),
                                          }),
                                          _jsxs(Badge, {
                                            className:
                                              "bg-purple-100 text-purple-600",
                                            children: [
                                              "Risk: ",
                                              incident.riskScore,
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
                                              "User: ",
                                              incident.userName,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Channel: ",
                                              incident.channel,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Location: ",
                                              incident.location,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Time:",
                                              " ",
                                              new Date(
                                                incident.timestamp,
                                              ).toLocaleString(),
                                            ],
                                          }),
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-2 text-xs text-gray-600",
                                        children: [
                                          _jsxs("span", {
                                            children: [
                                              "Patterns: ",
                                              incident.matchedPatterns.length,
                                            ],
                                          }),
                                          _jsx("span", { children: "\u2022" }),
                                          _jsxs("span", {
                                            children: [
                                              "Confidence: ",
                                              incident.confidence,
                                              "%",
                                            ],
                                          }),
                                          _jsx("span", { children: "\u2022" }),
                                          _jsxs("span", {
                                            children: [
                                              "Actions: ",
                                              incident.actionsTaken.join(", "),
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
                                        selectedIncident: incident,
                                        showIncidentDetails: true,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Eye, { className: "w-3 h-3 mr-1" }),
                                      "Details",
                                    ],
                                  }),
                                  incident.status === "open" &&
                                    _jsxs(Button, {
                                      onClick: () =>
                                        handleIncidentUpdate(incident.id, {
                                          status: "investigating",
                                        }),
                                      size: "sm",
                                      children: [
                                        _jsx(Play, {
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
                      incident.id,
                    ),
                  ),
                }),
                filteredIncidents.length === 0 &&
                  _jsx(Card, {
                    children: _jsxs(CardContent, {
                      className: "p-6 text-center",
                      children: [
                        _jsx(Shield, {
                          className: "w-12 h-12 mx-auto mb-4 text-gray-400",
                        }),
                        _jsx("h3", {
                          className: "text-lg font-medium text-gray-900 mb-2",
                          children: "No Incidents Found",
                        }),
                        _jsx("p", {
                          className: "text-sm text-gray-600",
                          children:
                            "No DLP incidents match your current filters. Try adjusting your search criteria.",
                        }),
                      ],
                    }),
                  }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "rules",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsxs("h3", {
                      className: "text-lg font-medium",
                      children: ["DLP Rules (", rules.length, ")"],
                    }),
                    _jsxs(Button, {
                      onClick: () =>
                        setState((prev) => ({ ...prev, showRuleEditor: true })),
                      size: "sm",
                      children: [
                        _jsx(Plus, { className: "w-4 h-4 mr-2" }),
                        "Create Rule",
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: rules.map((rule) =>
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
                                  getCategoryIcon(rule.category),
                                  _jsxs("div", {
                                    className: "flex-1 min-w-0",
                                    children: [
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-2 mb-2",
                                        children: [
                                          _jsx("h4", {
                                            className: "font-medium",
                                            children: rule.name,
                                          }),
                                          _jsx(Badge, {
                                            className: getStatusColor(
                                              rule.status,
                                            ),
                                            children: rule.status,
                                          }),
                                          _jsx(Badge, {
                                            className: getSeverityColor(
                                              rule.severity,
                                            ),
                                            children: rule.severity,
                                          }),
                                          _jsx(Badge, {
                                            className:
                                              "bg-blue-100 text-blue-600",
                                            children: rule.category.replace(
                                              "_",
                                              " ",
                                            ),
                                          }),
                                        ],
                                      }),
                                      _jsx("p", {
                                        className: "text-sm text-gray-600 mb-2",
                                        children: rule.description,
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2",
                                        children: [
                                          _jsxs("span", {
                                            children: [
                                              "Patterns: ",
                                              rule.patterns.length,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Actions: ",
                                              rule.actions.length,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Triggered: ",
                                              rule.triggerCount,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "False Positives: ",
                                              rule.falsePositiveCount,
                                            ],
                                          }),
                                        ],
                                      }),
                                      _jsx("div", {
                                        className: "flex flex-wrap gap-1",
                                        children: rule.scope.channels.map(
                                          (channel) =>
                                            _jsx(
                                              Badge,
                                              {
                                                className:
                                                  "bg-gray-100 text-gray-600 text-xs",
                                                children: channel,
                                              },
                                              channel,
                                            ),
                                        ),
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
                                        selectedRule: rule,
                                        showTestDialog: true,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Zap, { className: "w-3 h-3 mr-1" }),
                                      "Test",
                                    ],
                                  }),
                                  _jsxs(Button, {
                                    onClick: () =>
                                      setState((prev) => ({
                                        ...prev,
                                        selectedRule: rule,
                                        showRuleEditor: true,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Edit, { className: "w-3 h-3 mr-1" }),
                                      "Edit",
                                    ],
                                  }),
                                  _jsxs(Button, {
                                    onClick: () => {
                                      if (onRuleDelete) {
                                        onRuleDelete(rule.id);
                                      }
                                    },
                                    size: "sm",
                                    variant: "destructive",
                                    children: [
                                      _jsx(Trash2, {
                                        className: "w-3 h-3 mr-1",
                                      }),
                                      "Delete",
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      },
                      rule.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "scans",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsx("h3", {
                      className: "text-lg font-medium",
                      children: "Data Scans",
                    }),
                    _jsxs(Button, {
                      onClick: () =>
                        setState((prev) => ({ ...prev, showScanConfig: true })),
                      size: "sm",
                      children: [
                        _jsx(Play, { className: "w-4 h-4 mr-2" }),
                        "Start New Scan",
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: scanResults.map((scan) =>
                    _jsx(
                      Card,
                      {
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
                                      _jsxs("h4", {
                                        className: "font-medium",
                                        children: ["Scan ", scan.id],
                                      }),
                                      _jsx(Badge, {
                                        className: getStatusColor(scan.status),
                                        children: scan.status,
                                      }),
                                      _jsx(Badge, {
                                        className: "bg-blue-100 text-blue-600",
                                        children: scan.scanType.replace(
                                          "_",
                                          " ",
                                        ),
                                      }),
                                    ],
                                  }),
                                  _jsxs("div", {
                                    className:
                                      "grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3",
                                    children: [
                                      _jsxs("span", {
                                        children: [
                                          "Files: ",
                                          scan.results.filesScanned.toLocaleString(),
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Violations: ",
                                          scan.results.violationsFound,
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Risk Score: ",
                                          scan.results.riskScore,
                                          "/100",
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Started: ",
                                          new Date(
                                            scan.startTime,
                                          ).toLocaleString(),
                                        ],
                                      }),
                                    ],
                                  }),
                                  scan.status === "running" &&
                                    _jsxs("div", {
                                      className: "space-y-2",
                                      children: [
                                        _jsxs("div", {
                                          className:
                                            "flex justify-between text-sm",
                                          children: [
                                            _jsx("span", {
                                              children: "Progress",
                                            }),
                                            _jsxs("span", {
                                              children: [scan.progress, "%"],
                                            }),
                                          ],
                                        }),
                                        _jsx(Progress, {
                                          value: scan.progress,
                                          className: "h-2",
                                        }),
                                      ],
                                    }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex space-x-2",
                                children: [
                                  scan.status === "running" &&
                                    _jsxs(Button, {
                                      onClick: () => {
                                        if (onScanStop) {
                                          onScanStop(scan.id);
                                        }
                                      },
                                      size: "sm",
                                      variant: "destructive",
                                      children: [
                                        _jsx(Stop, {
                                          className: "w-3 h-3 mr-1",
                                        }),
                                        "Stop",
                                      ],
                                    }),
                                  _jsxs(Button, {
                                    onClick: () =>
                                      setState((prev) => ({
                                        ...prev,
                                        selectedScan: scan,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Eye, { className: "w-3 h-3 mr-1" }),
                                      "Details",
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      },
                      scan.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "analytics",
            children: _jsx("div", {
              className: "space-y-6",
              children: _jsxs("div", {
                className: "grid grid-cols-1 md:grid-cols-2 gap-6",
                children: [
                  _jsxs(Card, {
                    children: [
                      _jsx(CardHeader, {
                        children: _jsx(CardTitle, {
                          children: "Severity Distribution",
                        }),
                      }),
                      _jsx(CardContent, {
                        children: _jsx("div", {
                          className: "space-y-3",
                          children: Object.entries(
                            dlpMetrics.incidentsBySeverity,
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
                                    children: [count, " incidents"],
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
                  _jsxs(Card, {
                    children: [
                      _jsx(CardHeader, {
                        children: _jsx(CardTitle, {
                          children: "Performance Metrics",
                        }),
                      }),
                      _jsx(CardContent, {
                        children: _jsxs("div", {
                          className: "space-y-4",
                          children: [
                            _jsxs("div", {
                              className: "flex justify-between items-center",
                              children: [
                                _jsx("span", {
                                  className: "text-sm font-medium",
                                  children: "Average Risk Score",
                                }),
                                _jsxs("span", {
                                  className: "text-lg font-bold",
                                  children: [
                                    dlpMetrics.averageRiskScore.toFixed(1),
                                    "/100",
                                  ],
                                }),
                              ],
                            }),
                            _jsxs("div", {
                              className: "flex justify-between items-center",
                              children: [
                                _jsx("span", {
                                  className: "text-sm font-medium",
                                  children: "False Positive Rate",
                                }),
                                _jsxs("span", {
                                  className: "text-lg font-bold text-green-600",
                                  children: [
                                    dlpMetrics.falsePositiveRate.toFixed(1),
                                    "%",
                                  ],
                                }),
                              ],
                            }),
                            _jsxs("div", {
                              className: "flex justify-between items-center",
                              children: [
                                _jsx("span", {
                                  className: "text-sm font-medium",
                                  children: "Detection Accuracy",
                                }),
                                _jsxs("span", {
                                  className: "text-lg font-bold text-blue-600",
                                  children: [
                                    (
                                      100 - dlpMetrics.falsePositiveRate
                                    ).toFixed(1),
                                    "%",
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            }),
          }),
        ],
      }),
      state.showTestDialog &&
        state.selectedRule &&
        _jsx("div", {
          className:
            "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
          children: _jsxs(Card, {
            className: "w-full max-w-2xl",
            children: [
              _jsx(CardHeader, {
                children: _jsxs(CardTitle, {
                  children: ["Test Rule: ", state.selectedRule.name],
                }),
              }),
              _jsxs(CardContent, {
                className: "space-y-4",
                children: [
                  _jsxs("div", {
                    children: [
                      _jsx(Label, { children: "Test Data" }),
                      _jsx(Textarea, {
                        value: state.testData,
                        onChange: (e) =>
                          setState((prev) => ({
                            ...prev,
                            testData: e.target.value,
                          })),
                        placeholder:
                          "Enter test data to check against this rule...",
                        rows: 6,
                      }),
                    ],
                  }),
                  state.testResults &&
                    _jsxs("div", {
                      className: "p-4 bg-gray-50 rounded",
                      children: [
                        _jsx("h4", {
                          className: "font-medium mb-2",
                          children: "Test Results",
                        }),
                        _jsxs("div", {
                          className: "space-y-2 text-sm",
                          children: [
                            _jsxs("div", {
                              className: "flex justify-between",
                              children: [
                                _jsx("span", { children: "Match Found:" }),
                                _jsx(Badge, {
                                  className: state.testResults.matches
                                    ? "bg-red-100 text-red-600"
                                    : "bg-green-100 text-green-600",
                                  children: state.testResults.matches
                                    ? "Yes"
                                    : "No",
                                }),
                              ],
                            }),
                            _jsxs("div", {
                              className: "flex justify-between",
                              children: [
                                _jsx("span", { children: "Confidence:" }),
                                _jsxs("span", {
                                  children: [state.testResults.confidence, "%"],
                                }),
                              ],
                            }),
                            _jsxs("div", {
                              className: "flex justify-between",
                              children: [
                                _jsx("span", { children: "Matched Patterns:" }),
                                _jsx("span", {
                                  children:
                                    state.testResults.patterns.join(", ") ||
                                    "None",
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
                      _jsx(Button, {
                        onClick: () => handleRuleTest(state.selectedRule.id),
                        disabled: state.isTesting || !state.testData.trim(),
                        children: state.isTesting ? "Testing..." : "Test Rule",
                      }),
                      _jsx(Button, {
                        onClick: () =>
                          setState((prev) => ({
                            ...prev,
                            showTestDialog: false,
                            selectedRule: null,
                            testData: "",
                            testResults: null,
                          })),
                        variant: "outline",
                        children: "Close",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      state.showScanConfig &&
        _jsx("div", {
          className:
            "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
          children: _jsxs(Card, {
            className: "w-full max-w-2xl",
            children: [
              _jsx(CardHeader, {
                children: _jsx(CardTitle, { children: "Configure Data Scan" }),
              }),
              _jsxs(CardContent, {
                className: "space-y-4",
                children: [
                  _jsxs("div", {
                    children: [
                      _jsx(Label, { children: "Scan Locations" }),
                      _jsx(Textarea, {
                        value: state.scanConfig.scope.locations.join("\n"),
                        onChange: (e) =>
                          setState((prev) => ({
                            ...prev,
                            scanConfig: {
                              ...prev.scanConfig,
                              scope: {
                                ...prev.scanConfig.scope,
                                locations: e.target.value
                                  .split("\n")
                                  .filter((l) => l.trim()),
                              },
                            },
                          })),
                        placeholder:
                          "Enter file paths or URLs to scan (one per line)",
                        rows: 4,
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    children: [
                      _jsx(Label, { children: "Rules to Apply" }),
                      _jsx("div", {
                        className: "space-y-2 max-h-40 overflow-y-auto",
                        children: rules
                          .filter((r) => r.status === "active")
                          .map((rule) =>
                            _jsxs(
                              "div",
                              {
                                className: "flex items-center space-x-2",
                                children: [
                                  _jsx(Checkbox, {
                                    checked: state.scanConfig.rules.includes(
                                      rule.id,
                                    ),
                                    onCheckedChange: (checked) => {
                                      setState((prev) => ({
                                        ...prev,
                                        scanConfig: {
                                          ...prev.scanConfig,
                                          rules: checked
                                            ? [
                                                ...prev.scanConfig.rules,
                                                rule.id,
                                              ]
                                            : prev.scanConfig.rules.filter(
                                                (id) => id !== rule.id,
                                              ),
                                        },
                                      }));
                                    },
                                  }),
                                  _jsx("span", {
                                    className: "text-sm",
                                    children: rule.name,
                                  }),
                                  _jsx(Badge, {
                                    className: getSeverityColor(rule.severity),
                                    size: "sm",
                                    children: rule.severity,
                                  }),
                                ],
                              },
                              rule.id,
                            ),
                          ),
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "flex space-x-2",
                    children: [
                      _jsx(Button, {
                        onClick: handleScanStart,
                        disabled:
                          state.isScanning ||
                          state.scanConfig.rules.length === 0,
                        children: state.isScanning
                          ? "Starting..."
                          : "Start Scan",
                      }),
                      _jsx(Button, {
                        onClick: () =>
                          setState((prev) => ({
                            ...prev,
                            showScanConfig: false,
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
export default DataLossPrevention;

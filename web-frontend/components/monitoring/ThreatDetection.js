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
import { Progress } from "../ui/progress";
import { Checkbox } from "../ui/checkbox";
import {
  Shield,
  AlertTriangle,
  Target,
  Zap,
  Eye,
  Search,
  Download,
  Play,
  Stop,
  Settings,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  Database,
  Network,
  Mail,
  Users,
  Flag,
  Trash2,
  Edit,
  Plus,
  Brain,
  Radar,
} from "lucide-react";
export function ThreatDetection({
  signatures = [],
  detections = [],
  hunts = [],
  onSignatureCreate,
  onSignatureUpdate,
  onSignatureDelete,
  onDetectionInvestigate,
  onDetectionRespond,
  onHuntCreate,
  onHuntStart,
  onHuntStop,
  onExportReport,
  realTimeDetection = true,
  className = "",
}) {
  const [state, setState] = useState({
    activeTab: "overview",
    selectedSignature: null,
    selectedDetection: null,
    selectedHunt: null,
    searchTerm: "",
    filterSeverity: "all",
    filterStatus: "all",
    filterCategory: "all",
    timeRange: "24h",
    showSignatureEditor: false,
    showDetectionDetails: false,
    showHuntEditor: false,
    showResponseDialog: false,
    isCreating: false,
    isInvestigating: false,
    isResponding: false,
    isExporting: false,
    error: null,
    success: null,
    newSignature: {
      name: "",
      description: "",
      category: "malware",
      severity: "medium",
      confidence: 80,
      patterns: [],
      indicators: [],
      mitreTactics: [],
      mitreAttackIds: [],
      killChainPhases: [],
      createdBy: "current-user",
      version: "1.0",
      isActive: true,
      falsePositiveRate: 0,
    },
    newHunt: {
      name: "",
      description: "",
      hypothesis: "",
      status: "planning",
      priority: "medium",
      huntType: "proactive",
      scope: {
        timeRange: { start: "", end: "" },
        systems: [],
        dataTypes: [],
        indicators: [],
      },
      queries: [],
      findings: [],
      createdBy: "current-user",
    },
    responseActions: [],
  });
  // Calculate threat metrics
  const threatMetrics = useMemo(() => {
    const now = new Date();
    const timeRangeMs = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    }[state.timeRange];
    const cutoffTime = new Date(now.getTime() - timeRangeMs);
    const recentDetections = detections.filter(
      (d) => new Date(d.timestamp) > cutoffTime,
    );
    const totalDetections = recentDetections.length;
    const criticalDetections = recentDetections.filter(
      (d) => d.severity === "critical",
    ).length;
    const activeDetections = recentDetections.filter(
      (d) => d.status === "active",
    ).length;
    const containedDetections = recentDetections.filter(
      (d) => d.status === "contained",
    ).length;
    const activeSignatures = signatures.filter((s) => s.isActive).length;
    const activeHunts = hunts.filter((h) => h.status === "active").length;
    const detectionsByCategory = recentDetections.reduce((acc, detection) => {
      const signature = signatures.find((s) => s.id === detection.signatureId);
      if (signature) {
        acc[signature.category] = (acc[signature.category] || 0) + 1;
      }
      return acc;
    }, {});
    const detectionsBySeverity = recentDetections.reduce((acc, detection) => {
      acc[detection.severity] = (acc[detection.severity] || 0) + 1;
      return acc;
    }, {});
    const detectionsByKillChain = recentDetections.reduce((acc, detection) => {
      acc[detection.killChainPhase] = (acc[detection.killChainPhase] || 0) + 1;
      return acc;
    }, {});
    const averageRiskScore =
      recentDetections.length > 0
        ? recentDetections.reduce((sum, d) => sum + d.riskScore, 0) /
          recentDetections.length
        : 0;
    const averageConfidence =
      recentDetections.length > 0
        ? recentDetections.reduce((sum, d) => sum + d.confidence, 0) /
          recentDetections.length
        : 0;
    const containmentRate =
      totalDetections > 0 ? (containedDetections / totalDetections) * 100 : 0;
    return {
      totalDetections,
      criticalDetections,
      activeDetections,
      containedDetections,
      activeSignatures,
      activeHunts,
      detectionsByCategory,
      detectionsBySeverity,
      detectionsByKillChain,
      averageRiskScore,
      averageConfidence,
      containmentRate,
    };
  }, [detections, signatures, hunts, state.timeRange]);
  // Filter detections
  const filteredDetections = useMemo(() => {
    return detections.filter((detection) => {
      const signature = signatures.find((s) => s.id === detection.signatureId);
      const matchesSearch =
        detection.signatureName
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase()) ||
        detection.source.identifier
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase()) ||
        detection.target.identifier
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase());
      const matchesSeverity =
        state.filterSeverity === "all" ||
        detection.severity === state.filterSeverity;
      const matchesStatus =
        state.filterStatus === "all" || detection.status === state.filterStatus;
      const matchesCategory =
        state.filterCategory === "all" ||
        (signature && signature.category === state.filterCategory);
      return (
        matchesSearch && matchesSeverity && matchesStatus && matchesCategory
      );
    });
  }, [
    detections,
    signatures,
    state.searchTerm,
    state.filterSeverity,
    state.filterStatus,
    state.filterCategory,
  ]);
  // Handle signature creation
  const handleSignatureCreate = useCallback(async () => {
    if (!state.newSignature.name || !state.newSignature.description) {
      setState((prev) => ({
        ...prev,
        error: "Name and description are required",
      }));
      return;
    }
    setState((prev) => ({ ...prev, isCreating: true, error: null }));
    try {
      if (onSignatureCreate) {
        await onSignatureCreate(state.newSignature);
        setState((prev) => ({
          ...prev,
          success: "Threat signature created successfully",
          showSignatureEditor: false,
          newSignature: {
            name: "",
            description: "",
            category: "malware",
            severity: "medium",
            confidence: 80,
            patterns: [],
            indicators: [],
            mitreTactics: [],
            mitreAttackIds: [],
            killChainPhases: [],
            createdBy: "current-user",
            version: "1.0",
            isActive: true,
            falsePositiveRate: 0,
          },
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to create threat signature",
      }));
    } finally {
      setState((prev) => ({ ...prev, isCreating: false }));
    }
  }, [onSignatureCreate, state.newSignature]);
  // Handle detection investigation
  const handleDetectionInvestigate = useCallback(
    async (detectionId) => {
      setState((prev) => ({ ...prev, isInvestigating: true, error: null }));
      try {
        if (onDetectionInvestigate) {
          await onDetectionInvestigate(detectionId);
          setState((prev) => ({
            ...prev,
            success: "Investigation initiated successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Failed to initiate investigation",
        }));
      } finally {
        setState((prev) => ({ ...prev, isInvestigating: false }));
      }
    },
    [onDetectionInvestigate],
  );
  // Handle threat response
  const handleThreatResponse = useCallback(
    async (detectionId) => {
      if (state.responseActions.length === 0) {
        setState((prev) => ({
          ...prev,
          error: "Please select at least one response action",
        }));
        return;
      }
      setState((prev) => ({ ...prev, isResponding: true, error: null }));
      try {
        if (onDetectionRespond) {
          await onDetectionRespond(detectionId, state.responseActions);
          setState((prev) => ({
            ...prev,
            success: "Threat response initiated successfully",
            showResponseDialog: false,
            responseActions: [],
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Failed to initiate threat response",
        }));
      } finally {
        setState((prev) => ({ ...prev, isResponding: false }));
      }
    },
    [onDetectionRespond, state.responseActions],
  );
  // Handle hunt creation
  const handleHuntCreate = useCallback(async () => {
    if (
      !state.newHunt.name ||
      !state.newHunt.description ||
      !state.newHunt.hypothesis
    ) {
      setState((prev) => ({
        ...prev,
        error: "Name, description, and hypothesis are required",
      }));
      return;
    }
    setState((prev) => ({ ...prev, isCreating: true, error: null }));
    try {
      if (onHuntCreate) {
        await onHuntCreate(state.newHunt);
        setState((prev) => ({
          ...prev,
          success: "Threat hunt created successfully",
          showHuntEditor: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to create threat hunt" }));
    } finally {
      setState((prev) => ({ ...prev, isCreating: false }));
    }
  }, [onHuntCreate, state.newHunt]);
  // Handle export
  const handleExport = useCallback(
    async (type) => {
      setState((prev) => ({ ...prev, isExporting: true, error: null }));
      try {
        if (onExportReport) {
          const filters = {
            timeRange: state.timeRange,
            severity: state.filterSeverity,
            status: state.filterStatus,
            category: state.filterCategory,
            search: state.searchTerm,
          };
          const blob = await onExportReport(type, filters);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `threat-${type}-${new Date().toISOString().split("T")[0]}.csv`;
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
      state.filterStatus,
      state.filterCategory,
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
      case "active":
      case "planning":
        return "bg-red-100 text-red-600";
      case "investigating":
      case "in_progress":
        return "bg-yellow-100 text-yellow-600";
      case "contained":
      case "completed":
        return "bg-green-100 text-green-600";
      case "resolved":
        return "bg-blue-100 text-blue-600";
      case "false_positive":
      case "cancelled":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const getCategoryIcon = (category) => {
    switch (category) {
      case "malware":
        return _jsx(Target, { className: "w-4 h-4" });
      case "phishing":
        return _jsx(Mail, { className: "w-4 h-4" });
      case "ddos":
        return _jsx(Network, { className: "w-4 h-4" });
      case "intrusion":
        return _jsx(Shield, { className: "w-4 h-4" });
      case "data_exfiltration":
        return _jsx(Database, { className: "w-4 h-4" });
      case "insider_threat":
        return _jsx(Users, { className: "w-4 h-4" });
      case "apt":
        return _jsx(Brain, { className: "w-4 h-4" });
      case "custom":
        return _jsx(Settings, { className: "w-4 h-4" });
      default:
        return _jsx(AlertTriangle, { className: "w-4 h-4" });
    }
  };
  const getKillChainIcon = (phase) => {
    switch (phase.toLowerCase()) {
      case "reconnaissance":
        return _jsx(Eye, { className: "w-4 h-4" });
      case "weaponization":
        return _jsx(Zap, { className: "w-4 h-4" });
      case "delivery":
        return _jsx(Mail, { className: "w-4 h-4" });
      case "exploitation":
        return _jsx(Target, { className: "w-4 h-4" });
      case "installation":
        return _jsx(Download, { className: "w-4 h-4" });
      case "command_and_control":
        return _jsx(Network, { className: "w-4 h-4" });
      case "actions_on_objectives":
        return _jsx(Flag, { className: "w-4 h-4" });
      default:
        return _jsx(Activity, { className: "w-4 h-4" });
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
                    _jsx(Radar, { className: "w-6 h-6 mr-3 text-red-600" }),
                    "Threat Detection & Response",
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
                    _jsxs(Badge, {
                      className: "bg-red-100 text-red-600",
                      children: [
                        _jsx(Target, { className: "w-3 h-3 mr-1" }),
                        threatMetrics.totalDetections,
                        " Detections",
                      ],
                    }),
                    _jsxs(Badge, {
                      className: "bg-orange-100 text-orange-600",
                      children: [
                        _jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }),
                        threatMetrics.criticalDetections,
                        " Critical",
                      ],
                    }),
                    realTimeDetection &&
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
                "Advanced threat detection, hunting, and automated response capabilities.",
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
      threatMetrics.criticalDetections > 0 &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-red-600" }),
            _jsxs(AlertDescription, {
              className: "text-red-800",
              children: [
                _jsx("strong", { children: "Critical Threats:" }),
                " ",
                threatMetrics.criticalDetections,
                " critical threats detected and require immediate response.",
              ],
            }),
          ],
        }),
      threatMetrics.activeDetections > 0 &&
        _jsxs(Alert, {
          className: "border-amber-200 bg-amber-50",
          children: [
            _jsx(Flag, { className: "h-4 w-4 text-amber-600" }),
            _jsxs(AlertDescription, {
              className: "text-amber-800",
              children: [
                _jsx("strong", { children: "Active Threats:" }),
                " ",
                threatMetrics.activeDetections,
                " ",
                "active threats are currently being monitored.",
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
                        placeholder: "Search threats, signatures, targets...",
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
                        _jsx(SelectItem, {
                          value: "active",
                          children: "Active",
                        }),
                        _jsx(SelectItem, {
                          value: "investigating",
                          children: "Investigating",
                        }),
                        _jsx(SelectItem, {
                          value: "contained",
                          children: "Contained",
                        }),
                        _jsx(SelectItem, {
                          value: "resolved",
                          children: "Resolved",
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
                        _jsx(SelectItem, {
                          value: "malware",
                          children: "Malware",
                        }),
                        _jsx(SelectItem, {
                          value: "phishing",
                          children: "Phishing",
                        }),
                        _jsx(SelectItem, { value: "ddos", children: "DDoS" }),
                        _jsx(SelectItem, {
                          value: "intrusion",
                          children: "Intrusion",
                        }),
                        _jsx(SelectItem, {
                          value: "data_exfiltration",
                          children: "Data Exfiltration",
                        }),
                        _jsx(SelectItem, {
                          value: "insider_threat",
                          children: "Insider Threat",
                        }),
                        _jsx(SelectItem, { value: "apt", children: "APT" }),
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
                      setState((prev) => ({ ...prev, showHuntEditor: true })),
                    size: "sm",
                    variant: "outline",
                    children: [
                      _jsx(Search, { className: "w-4 h-4 mr-2" }),
                      "Start Hunt",
                    ],
                  }),
                }),
                _jsx("div", {
                  className: "flex space-x-2",
                  children: _jsxs(Button, {
                    onClick: () => handleExport("detections"),
                    disabled: state.isExporting,
                    size: "sm",
                    variant: "outline",
                    children: [
                      _jsx(Download, { className: "w-4 h-4 mr-2" }),
                      "Export",
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
              _jsx(TabsTrigger, {
                value: "detections",
                children: "Detections",
              }),
              _jsx(TabsTrigger, {
                value: "signatures",
                children: "Signatures",
              }),
              _jsx(TabsTrigger, { value: "hunts", children: "Threat Hunts" }),
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
                                  children: "Total Detections",
                                }),
                                _jsx("p", {
                                  className: "text-2xl font-bold",
                                  children: threatMetrics.totalDetections,
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    threatMetrics.criticalDetections,
                                    " critical",
                                  ],
                                }),
                              ],
                            }),
                            _jsx(Target, { className: "w-8 h-8 text-red-500" }),
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
                                  children: threatMetrics.activeDetections,
                                }),
                                _jsx("p", {
                                  className: "text-xs text-gray-500",
                                  children: "requiring response",
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
                                  children: "Containment Rate",
                                }),
                                _jsxs("p", {
                                  className:
                                    "text-2xl font-bold text-green-600",
                                  children: [
                                    threatMetrics.containmentRate.toFixed(1),
                                    "%",
                                  ],
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    threatMetrics.containedDetections,
                                    " contained",
                                  ],
                                }),
                              ],
                            }),
                            _jsx(Shield, {
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
                                  children: "Avg Risk Score",
                                }),
                                _jsx("p", {
                                  className:
                                    "text-2xl font-bold text-orange-600",
                                  children:
                                    threatMetrics.averageRiskScore.toFixed(1),
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    "confidence: ",
                                    threatMetrics.averageConfidence.toFixed(1),
                                    "%",
                                  ],
                                }),
                              ],
                            }),
                            _jsx(BarChart3, {
                              className: "w-8 h-8 text-orange-500",
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
                        children: "Recent Critical Detections",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsx("div", {
                        className: "space-y-3",
                        children: filteredDetections
                          .filter(
                            (d) =>
                              d.severity === "critical" ||
                              d.severity === "high",
                          )
                          .slice(0, 5)
                          .map((detection) =>
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
                                        signatures.find(
                                          (s) => s.id === detection.signatureId,
                                        )?.category || "custom",
                                      ),
                                      _jsxs("div", {
                                        children: [
                                          _jsx("p", {
                                            className: "font-medium text-sm",
                                            children: detection.signatureName,
                                          }),
                                          _jsxs("p", {
                                            className: "text-xs text-gray-600",
                                            children: [
                                              detection.source.identifier,
                                              " \u2192",
                                              " ",
                                              detection.target.identifier,
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
                                          detection.severity,
                                        ),
                                        children: detection.severity,
                                      }),
                                      _jsx(Badge, {
                                        className: getStatusColor(
                                          detection.status,
                                        ),
                                        children: detection.status,
                                      }),
                                      _jsx("span", {
                                        className: "text-xs text-gray-500",
                                        children: new Date(
                                          detection.timestamp,
                                        ).toLocaleTimeString(),
                                      }),
                                    ],
                                  }),
                                ],
                              },
                              detection.id,
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
                            children: "Threats by Category",
                          }),
                        }),
                        _jsx(CardContent, {
                          children: _jsx("div", {
                            className: "space-y-3",
                            children: Object.entries(
                              threatMetrics.detectionsByCategory,
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
                                      className: "bg-red-100 text-red-600",
                                      children: [count, " detections"],
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
                            children: "Kill Chain Phases",
                          }),
                        }),
                        _jsx(CardContent, {
                          children: _jsx("div", {
                            className: "space-y-3",
                            children: Object.entries(
                              threatMetrics.detectionsByKillChain,
                            ).map(([phase, count]) =>
                              _jsxs(
                                "div",
                                {
                                  className:
                                    "flex items-center justify-between p-2 bg-gray-50 rounded",
                                  children: [
                                    _jsxs("div", {
                                      className: "flex items-center space-x-2",
                                      children: [
                                        getKillChainIcon(phase),
                                        _jsx("span", {
                                          className: "font-medium capitalize",
                                          children: phase.replace("_", " "),
                                        }),
                                      ],
                                    }),
                                    _jsxs(Badge, {
                                      className:
                                        "bg-orange-100 text-orange-600",
                                      children: [count, " detections"],
                                    }),
                                  ],
                                },
                                phase,
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
            value: "detections",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsx("div", {
                  className: "flex justify-between items-center",
                  children: _jsxs("h3", {
                    className: "text-lg font-medium",
                    children: [
                      "Threat Detections (",
                      filteredDetections.length,
                      ")",
                    ],
                  }),
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: filteredDetections.map((detection) =>
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
                                    signatures.find(
                                      (s) => s.id === detection.signatureId,
                                    )?.category || "custom",
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
                                            children: detection.signatureName,
                                          }),
                                          _jsx(Badge, {
                                            className: getSeverityColor(
                                              detection.severity,
                                            ),
                                            children: detection.severity,
                                          }),
                                          _jsx(Badge, {
                                            className: getStatusColor(
                                              detection.status,
                                            ),
                                            children: detection.status,
                                          }),
                                          _jsxs(Badge, {
                                            className:
                                              "bg-purple-100 text-purple-600",
                                            children: [
                                              "Risk: ",
                                              detection.riskScore,
                                              "/100",
                                            ],
                                          }),
                                          _jsxs(Badge, {
                                            className:
                                              "bg-blue-100 text-blue-600",
                                            children: [
                                              detection.confidence,
                                              "% confidence",
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
                                              detection.source.identifier,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Target: ",
                                              detection.target.identifier,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Vector: ",
                                              detection.attackVector,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Phase: ",
                                              detection.killChainPhase,
                                            ],
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
                                              detection.timestamp,
                                            ).toLocaleString(),
                                          }),
                                          _jsx("span", { children: "\u2022" }),
                                          _jsxs("span", {
                                            children: [
                                              "MITRE: ",
                                              detection.mitreAttackId,
                                            ],
                                          }),
                                          _jsx("span", { children: "\u2022" }),
                                          _jsxs("span", {
                                            children: [
                                              "Patterns: ",
                                              detection.matchedPatterns.length,
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
                                        selectedDetection: detection,
                                        showDetectionDetails: true,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Eye, { className: "w-3 h-3 mr-1" }),
                                      "Details",
                                    ],
                                  }),
                                  detection.status === "active" &&
                                    _jsxs(_Fragment, {
                                      children: [
                                        _jsxs(Button, {
                                          onClick: () =>
                                            handleDetectionInvestigate(
                                              detection.id,
                                            ),
                                          disabled: state.isInvestigating,
                                          size: "sm",
                                          variant: "outline",
                                          children: [
                                            _jsx(Search, {
                                              className: "w-3 h-3 mr-1",
                                            }),
                                            "Investigate",
                                          ],
                                        }),
                                        _jsxs(Button, {
                                          onClick: () =>
                                            setState((prev) => ({
                                              ...prev,
                                              selectedDetection: detection,
                                              showResponseDialog: true,
                                            })),
                                          size: "sm",
                                          children: [
                                            _jsx(Shield, {
                                              className: "w-3 h-3 mr-1",
                                            }),
                                            "Respond",
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
                      detection.id,
                    ),
                  ),
                }),
                filteredDetections.length === 0 &&
                  _jsx(Card, {
                    children: _jsxs(CardContent, {
                      className: "p-6 text-center",
                      children: [
                        _jsx(Target, {
                          className: "w-12 h-12 mx-auto mb-4 text-gray-400",
                        }),
                        _jsx("h3", {
                          className: "text-lg font-medium text-gray-900 mb-2",
                          children: "No Detections Found",
                        }),
                        _jsx("p", {
                          className: "text-sm text-gray-600",
                          children:
                            "No threat detections match your current filters. Try adjusting your search criteria.",
                        }),
                      ],
                    }),
                  }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "signatures",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsxs("h3", {
                      className: "text-lg font-medium",
                      children: ["Threat Signatures (", signatures.length, ")"],
                    }),
                    _jsxs(Button, {
                      onClick: () =>
                        setState((prev) => ({
                          ...prev,
                          showSignatureEditor: true,
                        })),
                      size: "sm",
                      children: [
                        _jsx(Plus, { className: "w-4 h-4 mr-2" }),
                        "Create Signature",
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: signatures.map((signature) =>
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
                                  getCategoryIcon(signature.category),
                                  _jsxs("div", {
                                    className: "flex-1 min-w-0",
                                    children: [
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-2 mb-2",
                                        children: [
                                          _jsx("h4", {
                                            className: "font-medium",
                                            children: signature.name,
                                          }),
                                          _jsx(Badge, {
                                            className: signature.isActive
                                              ? "bg-green-100 text-green-600"
                                              : "bg-gray-100 text-gray-600",
                                            children: signature.isActive
                                              ? "Active"
                                              : "Inactive",
                                          }),
                                          _jsx(Badge, {
                                            className: getSeverityColor(
                                              signature.severity,
                                            ),
                                            children: signature.severity,
                                          }),
                                          _jsx(Badge, {
                                            className:
                                              "bg-blue-100 text-blue-600",
                                            children:
                                              signature.category.replace(
                                                "_",
                                                " ",
                                              ),
                                          }),
                                          _jsxs(Badge, {
                                            className:
                                              "bg-purple-100 text-purple-600",
                                            children: [
                                              signature.confidence,
                                              "% confidence",
                                            ],
                                          }),
                                        ],
                                      }),
                                      _jsx("p", {
                                        className: "text-sm text-gray-600 mb-2",
                                        children: signature.description,
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2",
                                        children: [
                                          _jsxs("span", {
                                            children: [
                                              "Patterns: ",
                                              signature.patterns.length,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Indicators: ",
                                              signature.indicators.length,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Detections: ",
                                              signature.detectionCount,
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "FP Rate: ",
                                              signature.falsePositiveRate.toFixed(
                                                1,
                                              ),
                                              "%",
                                            ],
                                          }),
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className: "flex flex-wrap gap-1",
                                        children: [
                                          signature.mitreTactics
                                            .slice(0, 3)
                                            .map((tactic) =>
                                              _jsx(
                                                Badge,
                                                {
                                                  className:
                                                    "bg-gray-100 text-gray-600 text-xs",
                                                  children: tactic,
                                                },
                                                tactic,
                                              ),
                                            ),
                                          signature.mitreTactics.length > 3 &&
                                            _jsxs(Badge, {
                                              className:
                                                "bg-gray-100 text-gray-600 text-xs",
                                              children: [
                                                "+",
                                                signature.mitreTactics.length -
                                                  3,
                                                " more",
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
                                        selectedSignature: signature,
                                        showSignatureEditor: true,
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
                                      if (onSignatureDelete) {
                                        onSignatureDelete(signature.id);
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
                      signature.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "hunts",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsxs("h3", {
                      className: "text-lg font-medium",
                      children: ["Threat Hunts (", hunts.length, ")"],
                    }),
                    _jsxs(Button, {
                      onClick: () =>
                        setState((prev) => ({ ...prev, showHuntEditor: true })),
                      size: "sm",
                      children: [
                        _jsx(Plus, { className: "w-4 h-4 mr-2" }),
                        "Create Hunt",
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: hunts.map((hunt) =>
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
                                      _jsx("h4", {
                                        className: "font-medium",
                                        children: hunt.name,
                                      }),
                                      _jsx(Badge, {
                                        className: getStatusColor(hunt.status),
                                        children: hunt.status,
                                      }),
                                      _jsx(Badge, {
                                        className: getSeverityColor(
                                          hunt.priority,
                                        ),
                                        children: hunt.priority,
                                      }),
                                      _jsx(Badge, {
                                        className: "bg-blue-100 text-blue-600",
                                        children: hunt.huntType.replace(
                                          "_",
                                          " ",
                                        ),
                                      }),
                                    ],
                                  }),
                                  _jsx("p", {
                                    className: "text-sm text-gray-600 mb-2",
                                    children: hunt.description,
                                  }),
                                  _jsxs("p", {
                                    className: "text-sm text-blue-600 mb-2",
                                    children: [
                                      _jsx("strong", {
                                        children: "Hypothesis:",
                                      }),
                                      " ",
                                      hunt.hypothesis,
                                    ],
                                  }),
                                  _jsxs("div", {
                                    className:
                                      "grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3",
                                    children: [
                                      _jsxs("span", {
                                        children: [
                                          "Queries: ",
                                          hunt.queries.length,
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Findings: ",
                                          hunt.findings.length,
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Systems: ",
                                          hunt.scope.systems.length,
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Created:",
                                          " ",
                                          new Date(
                                            hunt.createdAt,
                                          ).toLocaleDateString(),
                                        ],
                                      }),
                                    ],
                                  }),
                                  hunt.status === "active" &&
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
                                              children: [hunt.progress, "%"],
                                            }),
                                          ],
                                        }),
                                        _jsx(Progress, {
                                          value: hunt.progress,
                                          className: "h-2",
                                        }),
                                      ],
                                    }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex space-x-2",
                                children: [
                                  hunt.status === "planning" &&
                                    _jsxs(Button, {
                                      onClick: () => {
                                        if (onHuntStart) {
                                          onHuntStart(hunt.id);
                                        }
                                      },
                                      size: "sm",
                                      children: [
                                        _jsx(Play, {
                                          className: "w-3 h-3 mr-1",
                                        }),
                                        "Start",
                                      ],
                                    }),
                                  hunt.status === "active" &&
                                    _jsxs(Button, {
                                      onClick: () => {
                                        if (onHuntStop) {
                                          onHuntStop(hunt.id);
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
                                        selectedHunt: hunt,
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
                      hunt.id,
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
                          children: "Detection Trends",
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
                                  children: "Detection Rate",
                                }),
                                _jsx("span", {
                                  className: "text-lg font-bold",
                                  children: threatMetrics.totalDetections,
                                }),
                              ],
                            }),
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
                                    threatMetrics.averageRiskScore.toFixed(1),
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
                                  children: "Containment Rate",
                                }),
                                _jsxs("span", {
                                  className: "text-lg font-bold text-green-600",
                                  children: [
                                    threatMetrics.containmentRate.toFixed(1),
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
                  _jsxs(Card, {
                    children: [
                      _jsx(CardHeader, {
                        children: _jsx(CardTitle, {
                          children: "Signature Performance",
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
                                  children: "Active Signatures",
                                }),
                                _jsx("span", {
                                  className: "text-lg font-bold",
                                  children: threatMetrics.activeSignatures,
                                }),
                              ],
                            }),
                            _jsxs("div", {
                              className: "flex justify-between items-center",
                              children: [
                                _jsx("span", {
                                  className: "text-sm font-medium",
                                  children: "Average Confidence",
                                }),
                                _jsxs("span", {
                                  className: "text-lg font-bold",
                                  children: [
                                    threatMetrics.averageConfidence.toFixed(1),
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
                                  children: "Active Hunts",
                                }),
                                _jsx("span", {
                                  className: "text-lg font-bold text-blue-600",
                                  children: threatMetrics.activeHunts,
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
      state.showResponseDialog &&
        state.selectedDetection &&
        _jsx("div", {
          className:
            "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
          children: _jsxs(Card, {
            className: "w-full max-w-2xl",
            children: [
              _jsx(CardHeader, {
                children: _jsxs(CardTitle, {
                  children: [
                    "Threat Response: ",
                    state.selectedDetection.signatureName,
                  ],
                }),
              }),
              _jsxs(CardContent, {
                className: "space-y-4",
                children: [
                  _jsxs("div", {
                    className: "space-y-2",
                    children: [
                      _jsx(Label, { children: "Response Actions" }),
                      _jsx("div", {
                        className: "space-y-2",
                        children: [
                          "isolate",
                          "block",
                          "quarantine",
                          "monitor",
                          "alert",
                        ].map((action) =>
                          _jsxs(
                            "div",
                            {
                              className: "flex items-center space-x-2",
                              children: [
                                _jsx(Checkbox, {
                                  checked: state.responseActions.some(
                                    (a) => a.type === action,
                                  ),
                                  onCheckedChange: (checked) => {
                                    setState((prev) => ({
                                      ...prev,
                                      responseActions: checked
                                        ? [
                                            ...prev.responseActions,
                                            {
                                              id: `${action}-${Date.now()}`,
                                              type: action,
                                              target:
                                                prev.selectedDetection?.source
                                                  .identifier || "",
                                              status: "pending",
                                              timestamp:
                                                new Date().toISOString(),
                                              automated: true,
                                            },
                                          ]
                                        : prev.responseActions.filter(
                                            (a) => a.type !== action,
                                          ),
                                    }));
                                  },
                                }),
                                _jsxs("span", {
                                  className: "text-sm capitalize",
                                  children: [
                                    action,
                                    " ",
                                    state.selectedDetection.source.identifier,
                                  ],
                                }),
                              ],
                            },
                            action,
                          ),
                        ),
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "flex space-x-2",
                    children: [
                      _jsx(Button, {
                        onClick: () =>
                          handleThreatResponse(state.selectedDetection.id),
                        disabled:
                          state.isResponding ||
                          state.responseActions.length === 0,
                        children: state.isResponding
                          ? "Executing..."
                          : "Execute Response",
                      }),
                      _jsx(Button, {
                        onClick: () =>
                          setState((prev) => ({
                            ...prev,
                            showResponseDialog: false,
                            responseActions: [],
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
export default ThreatDetection;

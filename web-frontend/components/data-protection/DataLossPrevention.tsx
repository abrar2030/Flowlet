import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  EyeOff,
  Lock,
  Unlock,
  FileText,
  Database,
  Globe,
  Mail,
  Phone,
  CreditCard,
  User,
  Calendar,
  MapPin,
  Hash,
  Search,
  Filter,
  Download,
  Upload,
  Play,
  Pause,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Target,
  Flag,
  Bell,
  Archive,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
} from "lucide-react";

interface DLPRule {
  id: string;
  name: string;
  description: string;
  category:
    | "pii"
    | "financial"
    | "health"
    | "intellectual_property"
    | "confidential"
    | "custom";
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "inactive" | "testing";
  patterns: DLPPattern[];
  actions: DLPAction[];
  conditions: DLPCondition[];
  scope: {
    channels: string[]; // email, file_upload, web_form, api, etc.
    locations: string[]; // specific endpoints or locations
    users: string[]; // specific users or groups
    timeWindows: string[]; // time-based restrictions
  };
  exceptions: {
    users: string[];
    locations: string[];
    justifications: string[];
  };
  createdBy: string;
  createdAt: string;
  lastModified: string;
  lastTriggered?: string;
  triggerCount: number;
  falsePositiveCount: number;
}

interface DLPPattern {
  id: string;
  type: "regex" | "keyword" | "ml_model" | "checksum" | "fingerprint";
  pattern: string;
  confidence: number; // 0-100
  context?: string;
  description: string;
}

interface DLPAction {
  type:
    | "block"
    | "quarantine"
    | "encrypt"
    | "redact"
    | "alert"
    | "log"
    | "require_approval";
  parameters: Record<string, any>;
  priority: number;
}

interface DLPCondition {
  field: string;
  operator: "equals" | "contains" | "regex" | "greater_than" | "less_than";
  value: string;
  caseSensitive: boolean;
}

interface DLPIncident {
  id: string;
  ruleId: string;
  ruleName: string;
  severity: "low" | "medium" | "high" | "critical";
  status:
    | "open"
    | "investigating"
    | "resolved"
    | "false_positive"
    | "suppressed";
  timestamp: string;
  userId: string;
  userName: string;
  channel: string;
  location: string;
  dataType: string;
  matchedPatterns: string[];
  confidence: number;
  actionsTaken: string[];
  content: {
    original: string;
    redacted: string;
    metadata: Record<string, any>;
  };
  investigation: {
    assignedTo?: string;
    notes: string[];
    resolution?: string;
    resolvedAt?: string;
    escalated: boolean;
  };
  riskScore: number;
  businessImpact: "none" | "low" | "medium" | "high" | "critical";
}

interface DLPScanResult {
  id: string;
  scanType: "real_time" | "scheduled" | "on_demand";
  startTime: string;
  endTime?: string;
  status: "running" | "completed" | "failed" | "cancelled";
  scope: {
    locations: string[];
    fileTypes: string[];
    sizeLimit: number;
  };
  results: {
    filesScanned: number;
    violationsFound: number;
    falsePositives: number;
    dataClassified: number;
    riskScore: number;
  };
  incidents: string[]; // incident IDs
  progress: number; // 0-100
}

interface DataLossPreventionProps {
  rules?: DLPRule[];
  incidents?: DLPIncident[];
  scanResults?: DLPScanResult[];
  onRuleCreate?: (
    rule: Omit<
      DLPRule,
      "id" | "createdAt" | "triggerCount" | "falsePositiveCount"
    >,
  ) => Promise<void>;
  onRuleUpdate?: (ruleId: string, updates: Partial<DLPRule>) => Promise<void>;
  onRuleDelete?: (ruleId: string) => Promise<void>;
  onRuleTest?: (
    ruleId: string,
    testData: string,
  ) => Promise<{ matches: boolean; confidence: number; patterns: string[] }>;
  onIncidentUpdate?: (
    incidentId: string,
    updates: Partial<DLPIncident>,
  ) => Promise<void>;
  onScanStart?: (config: { scope: any; rules: string[] }) => Promise<void>;
  onScanStop?: (scanId: string) => Promise<void>;
  onExportReport?: (filters: any) => Promise<Blob>;
  realTimeMonitoring?: boolean;
  className?: string;
}

interface ComponentState {
  activeTab: string;
  selectedRule: DLPRule | null;
  selectedIncident: DLPIncident | null;
  selectedScan: DLPScanResult | null;
  searchTerm: string;
  filterSeverity: string;
  filterStatus: string;
  filterCategory: string;
  filterChannel: string;
  showRuleEditor: boolean;
  showIncidentDetails: boolean;
  showScanConfig: boolean;
  showTestDialog: boolean;
  isCreating: boolean;
  isTesting: boolean;
  isScanning: boolean;
  isExporting: boolean;
  error: string | null;
  success: string | null;
  newRule: Partial<DLPRule>;
  testData: string;
  testResults: any;
  scanConfig: {
    scope: {
      locations: string[];
      fileTypes: string[];
      sizeLimit: number;
    };
    rules: string[];
  };
}

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
}: DataLossPreventionProps) {
  const [state, setState] = useState<ComponentState>({
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

    const incidentsByCategory = incidents.reduce(
      (acc, incident) => {
        const rule = rules.find((r) => r.id === incident.ruleId);
        if (rule) {
          acc[rule.category] = (acc[rule.category] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const incidentsBySeverity = incidents.reduce(
      (acc, incident) => {
        acc[incident.severity] = (acc[incident.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const incidentsByChannel = incidents.reduce(
      (acc, incident) => {
        acc[incident.channel] = (acc[incident.channel] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

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
        await onRuleCreate(
          state.newRule as Omit<
            DLPRule,
            "id" | "createdAt" | "triggerCount" | "falsePositiveCount"
          >,
        );
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
    async (ruleId: string) => {
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
    async (incidentId: string, updates: Partial<DLPIncident>) => {
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

  const getSeverityColor = (severity: string) => {
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

  const getStatusColor = (status: string) => {
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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "pii":
        return <User className="w-4 h-4" />;
      case "financial":
        return <CreditCard className="w-4 h-4" />;
      case "health":
        return <Activity className="w-4 h-4" />;
      case "intellectual_property":
        return <FileText className="w-4 h-4" />;
      case "confidential":
        return <Lock className="w-4 h-4" />;
      case "custom":
        return <Settings className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "file_upload":
        return <Upload className="w-4 h-4" />;
      case "web_form":
        return <Globe className="w-4 h-4" />;
      case "api":
        return <Database className="w-4 h-4" />;
      case "chat":
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-6 h-6 mr-3 text-blue-600" />
              Data Loss Prevention
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-600">
                <Target className="w-3 h-3 mr-1" />
                {dlpMetrics.activeRules} Active Rules
              </Badge>
              <Badge
                className={
                  dlpMetrics.openIncidents > 0
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-600"
                }
              >
                <AlertTriangle className="w-3 h-3 mr-1" />
                {dlpMetrics.openIncidents} Open Incidents
              </Badge>
              {realTimeMonitoring && (
                <Badge className="bg-green-100 text-green-600">
                  <Activity className="w-3 h-3 mr-1" />
                  Real-time
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Monitor, detect, and prevent unauthorized data access, sharing, and
            exfiltration across all channels.
          </p>
        </CardContent>
      </Card>

      {/* Alerts */}
      {state.error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {state.error}
          </AlertDescription>
        </Alert>
      )}

      {state.success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {state.success}
          </AlertDescription>
        </Alert>
      )}

      {dlpMetrics.criticalIncidents > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Alert:</strong> {dlpMetrics.criticalIncidents}{" "}
            critical data loss incidents require immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {dlpMetrics.recentIncidents > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <Bell className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Recent Activity:</strong> {dlpMetrics.recentIncidents} new
            incidents detected in the last 24 hours.
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search incidents, rules, users..."
                  value={state.searchTerm}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      searchTerm: e.target.value,
                    }))
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={state.filterSeverity}
              onValueChange={(value) =>
                setState((prev) => ({ ...prev, filterSeverity: value }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={state.filterStatus}
              onValueChange={(value) =>
                setState((prev) => ({ ...prev, filterStatus: value }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="false_positive">False Positive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={state.filterCategory}
              onValueChange={(value) =>
                setState((prev) => ({ ...prev, filterCategory: value }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="pii">PII</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="intellectual_property">IP</SelectItem>
                <SelectItem value="confidential">Confidential</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button
                onClick={() =>
                  setState((prev) => ({ ...prev, showScanConfig: true }))
                }
                size="sm"
                variant="outline"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Scan
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={handleExport}
                disabled={state.isExporting}
                size="sm"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs
        value={state.activeTab}
        onValueChange={(value) =>
          setState((prev) => ({ ...prev, activeTab: value }))
        }
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="scans">Scans</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Incidents
                      </p>
                      <p className="text-2xl font-bold">
                        {dlpMetrics.totalIncidents}
                      </p>
                      <p className="text-xs text-gray-500">
                        +{dlpMetrics.recentIncidents} today
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Open Incidents
                      </p>
                      <p className="text-2xl font-bold text-red-600">
                        {dlpMetrics.openIncidents}
                      </p>
                      <p className="text-xs text-gray-500">
                        {dlpMetrics.criticalIncidents} critical
                      </p>
                    </div>
                    <Flag className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Rules
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {dlpMetrics.activeRules}
                      </p>
                      <p className="text-xs text-gray-500">
                        of {dlpMetrics.totalRules} total
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        False Positive Rate
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {dlpMetrics.falsePositiveRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500">
                        {dlpMetrics.falsePositives} incidents
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Incidents */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Critical Incidents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredIncidents
                    .filter(
                      (i) => i.severity === "critical" || i.severity === "high",
                    )
                    .slice(0, 5)
                    .map((incident) => (
                      <div
                        key={incident.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-3">
                          {getCategoryIcon(
                            rules.find((r) => r.id === incident.ruleId)
                              ?.category || "custom",
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              {incident.ruleName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {incident.userName} • {incident.channel}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            className={getSeverityColor(incident.severity)}
                          >
                            {incident.severity}
                          </Badge>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(incident.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Incidents by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(dlpMetrics.incidentsByCategory).map(
                      ([category, count]) => (
                        <div
                          key={category}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(category)}
                            <span className="font-medium capitalize">
                              {category.replace("_", " ")}
                            </span>
                          </div>
                          <Badge className="bg-blue-100 text-blue-600">
                            {count} incidents
                          </Badge>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Incidents by Channel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(dlpMetrics.incidentsByChannel).map(
                      ([channel, count]) => (
                        <div
                          key={channel}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            {getChannelIcon(channel)}
                            <span className="font-medium capitalize">
                              {channel.replace("_", " ")}
                            </span>
                          </div>
                          <Badge className="bg-green-100 text-green-600">
                            {count} incidents
                          </Badge>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Incidents Tab */}
        <TabsContent value="incidents">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                DLP Incidents ({filteredIncidents.length})
              </h3>
            </div>

            <div className="grid gap-4">
              {filteredIncidents.map((incident) => (
                <Card
                  key={incident.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getCategoryIcon(
                          rules.find((r) => r.id === incident.ruleId)
                            ?.category || "custom",
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium truncate">
                              {incident.ruleName}
                            </h4>
                            <Badge
                              className={getSeverityColor(incident.severity)}
                            >
                              {incident.severity}
                            </Badge>
                            <Badge className={getStatusColor(incident.status)}>
                              {incident.status.replace("_", " ")}
                            </Badge>
                            <Badge className="bg-purple-100 text-purple-600">
                              Risk: {incident.riskScore}/100
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2">
                            <span>User: {incident.userName}</span>
                            <span>Channel: {incident.channel}</span>
                            <span>Location: {incident.location}</span>
                            <span>
                              Time:{" "}
                              {new Date(incident.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-600">
                            <span>
                              Patterns: {incident.matchedPatterns.length}
                            </span>
                            <span>•</span>
                            <span>Confidence: {incident.confidence}%</span>
                            <span>•</span>
                            <span>
                              Actions: {incident.actionsTaken.join(", ")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              selectedIncident: incident,
                              showIncidentDetails: true,
                            }))
                          }
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                        {incident.status === "open" && (
                          <Button
                            onClick={() =>
                              handleIncidentUpdate(incident.id, {
                                status: "investigating",
                              })
                            }
                            size="sm"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Investigate
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredIncidents.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Incidents Found
                  </h3>
                  <p className="text-sm text-gray-600">
                    No DLP incidents match your current filters. Try adjusting
                    your search criteria.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                DLP Rules ({rules.length})
              </h3>
              <Button
                onClick={() =>
                  setState((prev) => ({ ...prev, showRuleEditor: true }))
                }
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
            </div>

            <div className="grid gap-4">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getCategoryIcon(rule.category)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium">{rule.name}</h4>
                            <Badge className={getStatusColor(rule.status)}>
                              {rule.status}
                            </Badge>
                            <Badge className={getSeverityColor(rule.severity)}>
                              {rule.severity}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-600">
                              {rule.category.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {rule.description}
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2">
                            <span>Patterns: {rule.patterns.length}</span>
                            <span>Actions: {rule.actions.length}</span>
                            <span>Triggered: {rule.triggerCount}</span>
                            <span>
                              False Positives: {rule.falsePositiveCount}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {rule.scope.channels.map((channel) => (
                              <Badge
                                key={channel}
                                className="bg-gray-100 text-gray-600 text-xs"
                              >
                                {channel}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              selectedRule: rule,
                              showTestDialog: true,
                            }))
                          }
                          size="sm"
                          variant="outline"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Test
                        </Button>
                        <Button
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              selectedRule: rule,
                              showRuleEditor: true,
                            }))
                          }
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => {
                            if (onRuleDelete) {
                              onRuleDelete(rule.id);
                            }
                          }}
                          size="sm"
                          variant="destructive"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Scans Tab */}
        <TabsContent value="scans">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Data Scans</h3>
              <Button
                onClick={() =>
                  setState((prev) => ({ ...prev, showScanConfig: true }))
                }
                size="sm"
              >
                <Play className="w-4 h-4 mr-2" />
                Start New Scan
              </Button>
            </div>

            <div className="grid gap-4">
              {scanResults.map((scan) => (
                <Card key={scan.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">Scan {scan.id}</h4>
                          <Badge className={getStatusColor(scan.status)}>
                            {scan.status}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-600">
                            {scan.scanType.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3">
                          <span>
                            Files: {scan.results.filesScanned.toLocaleString()}
                          </span>
                          <span>
                            Violations: {scan.results.violationsFound}
                          </span>
                          <span>Risk Score: {scan.results.riskScore}/100</span>
                          <span>
                            Started: {new Date(scan.startTime).toLocaleString()}
                          </span>
                        </div>
                        {scan.status === "running" && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span>{scan.progress}%</span>
                            </div>
                            <Progress value={scan.progress} className="h-2" />
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {scan.status === "running" && (
                          <Button
                            onClick={() => {
                              if (onScanStop) {
                                onScanStop(scan.id);
                              }
                            }}
                            size="sm"
                            variant="destructive"
                          >
                            <Stop className="w-3 h-3 mr-1" />
                            Stop
                          </Button>
                        )}
                        <Button
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              selectedScan: scan,
                            }))
                          }
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Severity Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(dlpMetrics.incidentsBySeverity).map(
                      ([severity, count]) => (
                        <div
                          key={severity}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-gray-400" />
                            <span className="font-medium capitalize">
                              {severity}
                            </span>
                          </div>
                          <Badge className={getSeverityColor(severity)}>
                            {count} incidents
                          </Badge>
                        </div>
                      ),
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Average Risk Score
                      </span>
                      <span className="text-lg font-bold">
                        {dlpMetrics.averageRiskScore.toFixed(1)}/100
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        False Positive Rate
                      </span>
                      <span className="text-lg font-bold text-green-600">
                        {dlpMetrics.falsePositiveRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Detection Accuracy
                      </span>
                      <span className="text-lg font-bold text-blue-600">
                        {(100 - dlpMetrics.falsePositiveRate).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Rule Test Modal */}
      {state.showTestDialog && state.selectedRule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Test Rule: {state.selectedRule.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Test Data</Label>
                <Textarea
                  value={state.testData}
                  onChange={(e) =>
                    setState((prev) => ({ ...prev, testData: e.target.value }))
                  }
                  placeholder="Enter test data to check against this rule..."
                  rows={6}
                />
              </div>

              {state.testResults && (
                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Test Results</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Match Found:</span>
                      <Badge
                        className={
                          state.testResults.matches
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }
                      >
                        {state.testResults.matches ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Confidence:</span>
                      <span>{state.testResults.confidence}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Matched Patterns:</span>
                      <span>
                        {state.testResults.patterns.join(", ") || "None"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleRuleTest(state.selectedRule!.id)}
                  disabled={state.isTesting || !state.testData.trim()}
                >
                  {state.isTesting ? "Testing..." : "Test Rule"}
                </Button>
                <Button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      showTestDialog: false,
                      selectedRule: null,
                      testData: "",
                      testResults: null,
                    }))
                  }
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scan Configuration Modal */}
      {state.showScanConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Configure Data Scan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Scan Locations</Label>
                <Textarea
                  value={state.scanConfig.scope.locations.join("\n")}
                  onChange={(e) =>
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
                    }))
                  }
                  placeholder="Enter file paths or URLs to scan (one per line)"
                  rows={4}
                />
              </div>

              <div>
                <Label>Rules to Apply</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {rules
                    .filter((r) => r.status === "active")
                    .map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          checked={state.scanConfig.rules.includes(rule.id)}
                          onCheckedChange={(checked) => {
                            setState((prev) => ({
                              ...prev,
                              scanConfig: {
                                ...prev.scanConfig,
                                rules: checked
                                  ? [...prev.scanConfig.rules, rule.id]
                                  : prev.scanConfig.rules.filter(
                                      (id) => id !== rule.id,
                                    ),
                              },
                            }));
                          }}
                        />
                        <span className="text-sm">{rule.name}</span>
                        <Badge
                          className={getSeverityColor(rule.severity)}
                          size="sm"
                        >
                          {rule.severity}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleScanStart}
                  disabled={
                    state.isScanning || state.scanConfig.rules.length === 0
                  }
                >
                  {state.isScanning ? "Starting..." : "Start Scan"}
                </Button>
                <Button
                  onClick={() =>
                    setState((prev) => ({ ...prev, showScanConfig: false }))
                  }
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default DataLossPrevention;

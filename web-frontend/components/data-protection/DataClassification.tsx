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
import { Checkbox } from "../ui/checkbox";
import {
  Shield,
  Database,
  Tag,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Key,
  Globe,
  Users,
  Clock,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Plus,
  Settings,
} from "lucide-react";

interface DataClassificationLevel {
  id: string;
  name: string;
  description: string;
  color: string;
  priority: number;
  requirements: {
    encryption: boolean;
    accessControl: boolean;
    auditLogging: boolean;
    dataLossPrevention: boolean;
    retentionPolicy: boolean;
    geographicRestrictions: boolean;
  };
  handlingInstructions: string[];
  retentionPeriod: number; // in days
  allowedLocations: string[];
  allowedUsers: string[];
}

interface DataAsset {
  id: string;
  name: string;
  description: string;
  type: "database" | "file" | "api" | "stream" | "document" | "backup";
  location: string;
  owner: string;
  classification: string;
  tags: string[];
  sensitivity:
    | "public"
    | "internal"
    | "confidential"
    | "restricted"
    | "top_secret";
  personalData: boolean;
  financialData: boolean;
  healthData: boolean;
  createdAt: string;
  lastModified: string;
  lastClassified: string;
  classifiedBy: string;
  size: number; // in bytes
  recordCount?: number;
  encryptionStatus: "encrypted" | "not_encrypted" | "partially_encrypted";
  accessCount: number;
  lastAccessed: string;
  complianceFlags: string[];
}

interface ClassificationRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    field: string;
    operator: "contains" | "equals" | "regex" | "starts_with" | "ends_with";
    value: string;
  }[];
  action: {
    classification: string;
    tags: string[];
    sensitivity: string;
  };
  priority: number;
  enabled: boolean;
  createdBy: string;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

interface DataClassificationProps {
  classificationLevels?: DataClassificationLevel[];
  dataAssets?: DataAsset[];
  classificationRules?: ClassificationRule[];
  onAssetClassify?: (
    assetId: string,
    classification: string,
    sensitivity: string,
    tags: string[],
  ) => Promise<void>;
  onRuleCreate?: (
    rule: Omit<ClassificationRule, "id" | "createdAt" | "triggerCount">,
  ) => Promise<void>;
  onRuleUpdate?: (
    ruleId: string,
    updates: Partial<ClassificationRule>,
  ) => Promise<void>;
  onRuleDelete?: (ruleId: string) => Promise<void>;
  onAssetScan?: (assetId: string) => Promise<void>;
  onBulkClassify?: (
    assetIds: string[],
    classification: string,
  ) => Promise<void>;
  onExportReport?: (filters: any) => Promise<Blob>;
  className?: string;
}

interface ComponentState {
  activeTab: string;
  selectedAsset: DataAsset | null;
  selectedRule: ClassificationRule | null;
  searchTerm: string;
  filterClassification: string;
  filterSensitivity: string;
  filterType: string;
  showAssetDetails: boolean;
  showRuleEditor: boolean;
  showBulkActions: boolean;
  selectedAssets: string[];
  isClassifying: boolean;
  isScanning: boolean;
  isExporting: boolean;
  error: string | null;
  success: string | null;
  newRule: Partial<ClassificationRule>;
  bulkClassification: string;
  bulkSensitivity: string;
}

export function DataClassification({
  classificationLevels = [],
  dataAssets = [],
  classificationRules = [],
  onAssetClassify,
  onRuleCreate,
  onRuleUpdate,
  onRuleDelete,
  onAssetScan,
  onBulkClassify,
  onExportReport,
  className = "",
}: DataClassificationProps) {
  const [state, setState] = useState<ComponentState>({
    activeTab: "assets",
    selectedAsset: null,
    selectedRule: null,
    searchTerm: "",
    filterClassification: "all",
    filterSensitivity: "all",
    filterType: "all",
    showAssetDetails: false,
    showRuleEditor: false,
    showBulkActions: false,
    selectedAssets: [],
    isClassifying: false,
    isScanning: false,
    isExporting: false,
    error: null,
    success: null,
    newRule: {
      name: "",
      description: "",
      conditions: [],
      action: {
        classification: "",
        tags: [],
        sensitivity: "internal",
      },
      priority: 1,
      enabled: true,
      createdBy: "current-user",
    },
    bulkClassification: "",
    bulkSensitivity: "internal",
  });

  // Calculate classification metrics
  const classificationMetrics = useMemo(() => {
    const total = dataAssets.length;
    const classified = dataAssets.filter(
      (asset) => asset.classification,
    ).length;
    const unclassified = total - classified;

    const byClassification = dataAssets.reduce(
      (acc, asset) => {
        if (asset.classification) {
          acc[asset.classification] = (acc[asset.classification] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    const bySensitivity = dataAssets.reduce(
      (acc, asset) => {
        acc[asset.sensitivity] = (acc[asset.sensitivity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const personalDataAssets = dataAssets.filter(
      (asset) => asset.personalData,
    ).length;
    const financialDataAssets = dataAssets.filter(
      (asset) => asset.financialData,
    ).length;
    const encryptedAssets = dataAssets.filter(
      (asset) => asset.encryptionStatus === "encrypted",
    ).length;

    const totalSize = dataAssets.reduce((sum, asset) => sum + asset.size, 0);
    const totalRecords = dataAssets.reduce(
      (sum, asset) => sum + (asset.recordCount || 0),
      0,
    );

    return {
      total,
      classified,
      unclassified,
      classificationRate: total > 0 ? (classified / total) * 100 : 0,
      byClassification,
      bySensitivity,
      personalDataAssets,
      financialDataAssets,
      encryptedAssets,
      encryptionRate: total > 0 ? (encryptedAssets / total) * 100 : 0,
      totalSize,
      totalRecords,
    };
  }, [dataAssets]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return dataAssets.filter((asset) => {
      const matchesSearch =
        asset.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        asset.description
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase()) ||
        asset.tags.some((tag) =>
          tag.toLowerCase().includes(state.searchTerm.toLowerCase()),
        );

      const matchesClassification =
        state.filterClassification === "all" ||
        asset.classification === state.filterClassification;

      const matchesSensitivity =
        state.filterSensitivity === "all" ||
        asset.sensitivity === state.filterSensitivity;

      const matchesType =
        state.filterType === "all" || asset.type === state.filterType;

      return (
        matchesSearch &&
        matchesClassification &&
        matchesSensitivity &&
        matchesType
      );
    });
  }, [
    dataAssets,
    state.searchTerm,
    state.filterClassification,
    state.filterSensitivity,
    state.filterType,
  ]);

  // Handle asset classification
  const handleAssetClassify = useCallback(
    async (
      assetId: string,
      classification: string,
      sensitivity: string,
      tags: string[],
    ) => {
      setState((prev) => ({ ...prev, isClassifying: true, error: null }));

      try {
        if (onAssetClassify) {
          await onAssetClassify(assetId, classification, sensitivity, tags);
          setState((prev) => ({
            ...prev,
            success: "Asset classified successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to classify asset" }));
      } finally {
        setState((prev) => ({ ...prev, isClassifying: false }));
      }
    },
    [onAssetClassify],
  );

  // Handle bulk classification
  const handleBulkClassify = useCallback(async () => {
    if (state.selectedAssets.length === 0 || !state.bulkClassification) {
      setState((prev) => ({
        ...prev,
        error: "Please select assets and classification level",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isClassifying: true, error: null }));

    try {
      if (onBulkClassify) {
        await onBulkClassify(state.selectedAssets, state.bulkClassification);
        setState((prev) => ({
          ...prev,
          success: `${state.selectedAssets.length} assets classified successfully`,
          selectedAssets: [],
          showBulkActions: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to classify assets" }));
    } finally {
      setState((prev) => ({ ...prev, isClassifying: false }));
    }
  }, [onBulkClassify, state.selectedAssets, state.bulkClassification]);

  // Handle rule creation
  const handleRuleCreate = useCallback(async () => {
    if (!state.newRule.name || !state.newRule.description) {
      setState((prev) => ({
        ...prev,
        error: "Name and description are required",
      }));
      return;
    }

    setState((prev) => ({ ...prev, isClassifying: true, error: null }));

    try {
      if (onRuleCreate) {
        await onRuleCreate(
          state.newRule as Omit<
            ClassificationRule,
            "id" | "createdAt" | "triggerCount"
          >,
        );
        setState((prev) => ({
          ...prev,
          success: "Classification rule created successfully",
          showRuleEditor: false,
          newRule: {
            name: "",
            description: "",
            conditions: [],
            action: {
              classification: "",
              tags: [],
              sensitivity: "internal",
            },
            priority: 1,
            enabled: true,
            createdBy: "current-user",
          },
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to create rule" }));
    } finally {
      setState((prev) => ({ ...prev, isClassifying: false }));
    }
  }, [onRuleCreate, state.newRule]);

  // Handle asset scanning
  const handleAssetScan = useCallback(
    async (assetId: string) => {
      setState((prev) => ({ ...prev, isScanning: true, error: null }));

      try {
        if (onAssetScan) {
          await onAssetScan(assetId);
          setState((prev) => ({
            ...prev,
            success: "Asset scan initiated successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to scan asset" }));
      } finally {
        setState((prev) => ({ ...prev, isScanning: false }));
      }
    },
    [onAssetScan],
  );

  // Handle export
  const handleExport = useCallback(async () => {
    setState((prev) => ({ ...prev, isExporting: true, error: null }));

    try {
      if (onExportReport) {
        const filters = {
          classification: state.filterClassification,
          sensitivity: state.filterSensitivity,
          type: state.filterType,
          search: state.searchTerm,
        };

        const blob = await onExportReport(filters);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `data-classification-report-${new Date().toISOString().split("T")[0]}.csv`;
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
    state.filterClassification,
    state.filterSensitivity,
    state.filterType,
    state.searchTerm,
  ]);

  const getSensitivityColor = (sensitivity: string) => {
    switch (sensitivity) {
      case "public":
        return "bg-green-100 text-green-600";
      case "internal":
        return "bg-blue-100 text-blue-600";
      case "confidential":
        return "bg-yellow-100 text-yellow-600";
      case "restricted":
        return "bg-orange-100 text-orange-600";
      case "top_secret":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "database":
        return <Database className="w-4 h-4" />;
      case "file":
        return <FileText className="w-4 h-4" />;
      case "api":
        return <Globe className="w-4 h-4" />;
      case "stream":
        return <Clock className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      case "backup":
        return <Shield className="w-4 h-4" />;
      default:
        return <Database className="w-4 h-4" />;
    }
  };

  const getEncryptionIcon = (status: string) => {
    switch (status) {
      case "encrypted":
        return <Lock className="w-4 h-4 text-green-600" />;
      case "not_encrypted":
        return <Unlock className="w-4 h-4 text-red-600" />;
      case "partially_encrypted":
        return <Key className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Tag className="w-6 h-6 mr-3 text-blue-600" />
              Data Classification Management
            </div>
            <div className="flex items-center space-x-2">
              <Badge className="bg-blue-100 text-blue-600">
                <Database className="w-3 h-3 mr-1" />
                {classificationMetrics.total} Assets
              </Badge>
              <Badge
                className={
                  classificationMetrics.classificationRate >= 80
                    ? "bg-green-100 text-green-600"
                    : "bg-yellow-100 text-yellow-600"
                }
              >
                <Tag className="w-3 h-3 mr-1" />
                {classificationMetrics.classificationRate.toFixed(1)}%
                Classified
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Classify and manage data assets according to sensitivity levels and
            compliance requirements.
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

      {classificationMetrics.unclassified > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Classification Required:</strong>{" "}
            {classificationMetrics.unclassified} assets need classification.
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
                  placeholder="Search assets by name, description, or tags..."
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
              value={state.filterClassification}
              onValueChange={(value) =>
                setState((prev) => ({ ...prev, filterClassification: value }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Classification" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classifications</SelectItem>
                {classificationLevels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={state.filterSensitivity}
              onValueChange={(value) =>
                setState((prev) => ({ ...prev, filterSensitivity: value }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sensitivity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sensitivity</SelectItem>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
                <SelectItem value="confidential">Confidential</SelectItem>
                <SelectItem value="restricted">Restricted</SelectItem>
                <SelectItem value="top_secret">Top Secret</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={state.filterType}
              onValueChange={(value) =>
                setState((prev) => ({ ...prev, filterType: value }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="file">File</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="stream">Stream</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="backup">Backup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              {state.selectedAssets.length > 0 && (
                <Button
                  onClick={() =>
                    setState((prev) => ({ ...prev, showBulkActions: true }))
                  }
                  size="sm"
                  variant="outline"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Bulk Classify ({state.selectedAssets.length})
                </Button>
              )}
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="levels">Levels</TabsTrigger>
        </TabsList>

        {/* Assets Tab */}
        <TabsContent value="assets">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Data Assets ({filteredAssets.length})
              </h3>
              <Button
                onClick={() =>
                  setState((prev) => ({ ...prev, showRuleEditor: true }))
                }
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Rule
              </Button>
            </div>

            <div className="grid gap-4">
              {filteredAssets.map((asset) => (
                <Card
                  key={asset.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          checked={state.selectedAssets.includes(asset.id)}
                          onCheckedChange={(checked) => {
                            setState((prev) => ({
                              ...prev,
                              selectedAssets: checked
                                ? [...prev.selectedAssets, asset.id]
                                : prev.selectedAssets.filter(
                                    (id) => id !== asset.id,
                                  ),
                            }));
                          }}
                        />
                        {getTypeIcon(asset.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium truncate">
                              {asset.name}
                            </h4>
                            {asset.classification ? (
                              <Badge className="bg-blue-100 text-blue-600">
                                {classificationLevels.find(
                                  (l) => l.id === asset.classification,
                                )?.name || asset.classification}
                              </Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-600">
                                Unclassified
                              </Badge>
                            )}
                            <Badge
                              className={getSensitivityColor(asset.sensitivity)}
                            >
                              {asset.sensitivity}
                            </Badge>
                            {getEncryptionIcon(asset.encryptionStatus)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {asset.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                            <span>Owner: {asset.owner}</span>
                            <span>Size: {formatBytes(asset.size)}</span>
                            {asset.recordCount && (
                              <span>
                                Records: {asset.recordCount.toLocaleString()}
                              </span>
                            )}
                            <span>
                              Last Modified:{" "}
                              {new Date(
                                asset.lastModified,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {asset.tags.map((tag) => (
                              <Badge
                                key={tag}
                                className="bg-gray-100 text-gray-600 text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {asset.personalData && (
                              <Badge className="bg-purple-100 text-purple-600 text-xs">
                                Personal Data
                              </Badge>
                            )}
                            {asset.financialData && (
                              <Badge className="bg-green-100 text-green-600 text-xs">
                                Financial Data
                              </Badge>
                            )}
                            {asset.healthData && (
                              <Badge className="bg-red-100 text-red-600 text-xs">
                                Health Data
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() =>
                            setState((prev) => ({
                              ...prev,
                              selectedAsset: asset,
                              showAssetDetails: true,
                            }))
                          }
                          size="sm"
                          variant="outline"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Details
                        </Button>
                        <Button
                          onClick={() => handleAssetScan(asset.id)}
                          disabled={state.isScanning}
                          size="sm"
                          variant="outline"
                        >
                          <Search className="w-3 h-3 mr-1" />
                          Scan
                        </Button>
                        {!asset.classification && (
                          <Button
                            onClick={() => {
                              // Quick classify as internal
                              handleAssetClassify(
                                asset.id,
                                "internal",
                                "internal",
                                [],
                              );
                            }}
                            disabled={state.isClassifying}
                            size="sm"
                          >
                            <Tag className="w-3 h-3 mr-1" />
                            Classify
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredAssets.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <Database className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No Assets Found
                  </h3>
                  <p className="text-sm text-gray-600">
                    No data assets match your current filters. Try adjusting
                    your search criteria.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Assets
                      </p>
                      <p className="text-2xl font-bold">
                        {classificationMetrics.total}
                      </p>
                    </div>
                    <Database className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Classified
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {classificationMetrics.classified}
                      </p>
                      <p className="text-xs text-gray-500">
                        {classificationMetrics.classificationRate.toFixed(1)}%
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Encrypted
                      </p>
                      <p className="text-2xl font-bold text-blue-600">
                        {classificationMetrics.encryptedAssets}
                      </p>
                      <p className="text-xs text-gray-500">
                        {classificationMetrics.encryptionRate.toFixed(1)}%
                      </p>
                    </div>
                    <Lock className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Personal Data
                      </p>
                      <p className="text-2xl font-bold text-purple-600">
                        {classificationMetrics.personalDataAssets}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Classification Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Classification Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(classificationMetrics.byClassification).map(
                    ([classification, count]) => {
                      const level = classificationLevels.find(
                        (l) => l.id === classification,
                      );
                      return (
                        <div
                          key={classification}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <Tag className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">
                              {level?.name || classification}
                            </span>
                          </div>
                          <Badge className="bg-blue-100 text-blue-600">
                            {count} assets
                          </Badge>
                        </div>
                      );
                    },
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sensitivity Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Sensitivity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(classificationMetrics.bySensitivity).map(
                    ([sensitivity, count]) => (
                      <div
                        key={sensitivity}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <Shield className="w-4 h-4 text-gray-400" />
                          <span className="font-medium capitalize">
                            {sensitivity}
                          </span>
                        </div>
                        <Badge className={getSensitivityColor(sensitivity)}>
                          {count} assets
                        </Badge>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rules Tab */}
        <TabsContent value="rules">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Classification Rules</h3>
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
              {classificationRules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{rule.name}</h4>
                          <Badge
                            className={
                              rule.enabled
                                ? "bg-green-100 text-green-600"
                                : "bg-gray-100 text-gray-600"
                            }
                          >
                            {rule.enabled ? "Enabled" : "Disabled"}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-600">
                            Priority: {rule.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {rule.description}
                        </p>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Conditions: {rule.conditions.length}</p>
                          <p>Triggered: {rule.triggerCount} times</p>
                          <p>Created by: {rule.createdBy}</p>
                          {rule.lastTriggered && (
                            <p>
                              Last triggered:{" "}
                              {new Date(
                                rule.lastTriggered,
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
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

        {/* Levels Tab */}
        <TabsContent value="levels">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Classification Levels</h3>

            <div className="grid gap-4">
              {classificationLevels.map((level) => (
                <Card key={level.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium">{level.name}</h4>
                          <Badge
                            style={{
                              backgroundColor: level.color,
                              color: "white",
                            }}
                          >
                            Priority: {level.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {level.description}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-sm mb-2">
                              Requirements
                            </h5>
                            <div className="space-y-1 text-xs">
                              {Object.entries(level.requirements).map(
                                ([req, required]) => (
                                  <div
                                    key={req}
                                    className="flex items-center space-x-2"
                                  >
                                    {required ? (
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                    ) : (
                                      <XCircle className="w-3 h-3 text-gray-400" />
                                    )}
                                    <span className="capitalize">
                                      {req.replace(/([A-Z])/g, " $1").trim()}
                                    </span>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>

                          <div>
                            <h5 className="font-medium text-sm mb-2">
                              Details
                            </h5>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p>Retention: {level.retentionPeriod} days</p>
                              <p>
                                Allowed Locations:{" "}
                                {level.allowedLocations.length}
                              </p>
                              <p>Allowed Users: {level.allowedUsers.length}</p>
                            </div>
                          </div>
                        </div>

                        {level.handlingInstructions.length > 0 && (
                          <div className="mt-3">
                            <h5 className="font-medium text-sm mb-2">
                              Handling Instructions
                            </h5>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {level.handlingInstructions.map(
                                (instruction, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start space-x-1"
                                  >
                                    <span>•</span>
                                    <span>{instruction}</span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Asset Details Modal */}
      {state.showAssetDetails && state.selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Asset Details: {state.selectedAsset.name}</span>
                <Button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      showAssetDetails: false,
                      selectedAsset: null,
                    }))
                  }
                  variant="outline"
                  size="sm"
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">
                    Basic Information
                  </Label>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="capitalize">
                        {state.selectedAsset.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Owner:</span>
                      <span>{state.selectedAsset.owner}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span>{state.selectedAsset.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span>{formatBytes(state.selectedAsset.size)}</span>
                    </div>
                    {state.selectedAsset.recordCount && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Records:</span>
                        <span>
                          {state.selectedAsset.recordCount.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Classification</Label>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Level:</span>
                      <span>
                        {state.selectedAsset.classification || "Unclassified"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sensitivity:</span>
                      <Badge
                        className={getSensitivityColor(
                          state.selectedAsset.sensitivity,
                        )}
                      >
                        {state.selectedAsset.sensitivity}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Encryption:</span>
                      <div className="flex items-center space-x-1">
                        {getEncryptionIcon(
                          state.selectedAsset.encryptionStatus,
                        )}
                        <span className="capitalize">
                          {state.selectedAsset.encryptionStatus.replace(
                            "_",
                            " ",
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Classified By:</span>
                      <span>{state.selectedAsset.classifiedBy || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Data Types</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {state.selectedAsset.personalData && (
                    <Badge className="bg-purple-100 text-purple-600">
                      Personal Data
                    </Badge>
                  )}
                  {state.selectedAsset.financialData && (
                    <Badge className="bg-green-100 text-green-600">
                      Financial Data
                    </Badge>
                  )}
                  {state.selectedAsset.healthData && (
                    <Badge className="bg-red-100 text-red-600">
                      Health Data
                    </Badge>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {state.selectedAsset.tags.map((tag) => (
                    <Badge key={tag} className="bg-gray-100 text-gray-600">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Compliance Flags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {state.selectedAsset.complianceFlags.map((flag) => (
                    <Badge key={flag} className="bg-orange-100 text-orange-600">
                      {flag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleAssetScan(state.selectedAsset!.id)}
                  disabled={state.isScanning}
                  size="sm"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Rescan Asset
                </Button>
                <Button
                  onClick={() => {
                    // Open classification editor
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Update Classification
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Actions Modal */}
      {state.showBulkActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Bulk Classification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Classify {state.selectedAssets.length} selected assets.
              </p>
              <div>
                <Label>Classification Level</Label>
                <Select
                  value={state.bulkClassification}
                  onValueChange={(value) =>
                    setState((prev) => ({ ...prev, bulkClassification: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select classification" />
                  </SelectTrigger>
                  <SelectContent>
                    {classificationLevels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sensitivity Level</Label>
                <Select
                  value={state.bulkSensitivity}
                  onValueChange={(value) =>
                    setState((prev) => ({ ...prev, bulkSensitivity: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sensitivity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="internal">Internal</SelectItem>
                    <SelectItem value="confidential">Confidential</SelectItem>
                    <SelectItem value="restricted">Restricted</SelectItem>
                    <SelectItem value="top_secret">Top Secret</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={handleBulkClassify}
                  disabled={state.isClassifying || !state.bulkClassification}
                >
                  {state.isClassifying
                    ? "Classifying..."
                    : "Apply Classification"}
                </Button>
                <Button
                  onClick={() =>
                    setState((prev) => ({ ...prev, showBulkActions: false }))
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

export default DataClassification;

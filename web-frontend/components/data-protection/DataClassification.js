import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
import { Checkbox } from "../ui/checkbox";
import {
  Shield,
  Database,
  Tag,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Key,
  Globe,
  Users,
  Clock,
  Search,
  Download,
  Edit,
  Trash2,
  Plus,
  Unlock,
} from "lucide-react";
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
}) {
  const [state, setState] = useState({
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
    const byClassification = dataAssets.reduce((acc, asset) => {
      if (asset.classification) {
        acc[asset.classification] = (acc[asset.classification] || 0) + 1;
      }
      return acc;
    }, {});
    const bySensitivity = dataAssets.reduce((acc, asset) => {
      acc[asset.sensitivity] = (acc[asset.sensitivity] || 0) + 1;
      return acc;
    }, {});
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
    async (assetId, classification, sensitivity, tags) => {
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
        await onRuleCreate(state.newRule);
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
    async (assetId) => {
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
  const getSensitivityColor = (sensitivity) => {
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
  const getTypeIcon = (type) => {
    switch (type) {
      case "database":
        return _jsx(Database, { className: "w-4 h-4" });
      case "file":
        return _jsx(FileText, { className: "w-4 h-4" });
      case "api":
        return _jsx(Globe, { className: "w-4 h-4" });
      case "stream":
        return _jsx(Clock, { className: "w-4 h-4" });
      case "document":
        return _jsx(FileText, { className: "w-4 h-4" });
      case "backup":
        return _jsx(Shield, { className: "w-4 h-4" });
      default:
        return _jsx(Database, { className: "w-4 h-4" });
    }
  };
  const getEncryptionIcon = (status) => {
    switch (status) {
      case "encrypted":
        return _jsx(Lock, { className: "w-4 h-4 text-green-600" });
      case "not_encrypted":
        return _jsx(Unlock, { className: "w-4 h-4 text-red-600" });
      case "partially_encrypted":
        return _jsx(Key, { className: "w-4 h-4 text-yellow-600" });
      default:
        return _jsx(AlertTriangle, { className: "w-4 h-4 text-gray-600" });
    }
  };
  const formatBytes = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
                    _jsx(Tag, { className: "w-6 h-6 mr-3 text-blue-600" }),
                    "Data Classification Management",
                  ],
                }),
                _jsxs("div", {
                  className: "flex items-center space-x-2",
                  children: [
                    _jsxs(Badge, {
                      className: "bg-blue-100 text-blue-600",
                      children: [
                        _jsx(Database, { className: "w-3 h-3 mr-1" }),
                        classificationMetrics.total,
                        " Assets",
                      ],
                    }),
                    _jsxs(Badge, {
                      className:
                        classificationMetrics.classificationRate >= 80
                          ? "bg-green-100 text-green-600"
                          : "bg-yellow-100 text-yellow-600",
                      children: [
                        _jsx(Tag, { className: "w-3 h-3 mr-1" }),
                        classificationMetrics.classificationRate.toFixed(1),
                        "% Classified",
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
                "Classify and manage data assets according to sensitivity levels and compliance requirements.",
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
      classificationMetrics.unclassified > 0 &&
        _jsxs(Alert, {
          className: "border-amber-200 bg-amber-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-amber-600" }),
            _jsxs(AlertDescription, {
              className: "text-amber-800",
              children: [
                _jsx("strong", { children: "Classification Required:" }),
                " ",
                classificationMetrics.unclassified,
                " assets need classification.",
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
                        placeholder:
                          "Search assets by name, description, or tags...",
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
                  value: state.filterClassification,
                  onValueChange: (value) =>
                    setState((prev) => ({
                      ...prev,
                      filterClassification: value,
                    })),
                  children: [
                    _jsx(SelectTrigger, {
                      className: "w-48",
                      children: _jsx(SelectValue, {
                        placeholder: "Classification",
                      }),
                    }),
                    _jsxs(SelectContent, {
                      children: [
                        _jsx(SelectItem, {
                          value: "all",
                          children: "All Classifications",
                        }),
                        classificationLevels.map((level) =>
                          _jsx(
                            SelectItem,
                            { value: level.id, children: level.name },
                            level.id,
                          ),
                        ),
                      ],
                    }),
                  ],
                }),
                _jsxs(Select, {
                  value: state.filterSensitivity,
                  onValueChange: (value) =>
                    setState((prev) => ({ ...prev, filterSensitivity: value })),
                  children: [
                    _jsx(SelectTrigger, {
                      className: "w-48",
                      children: _jsx(SelectValue, {
                        placeholder: "Sensitivity",
                      }),
                    }),
                    _jsxs(SelectContent, {
                      children: [
                        _jsx(SelectItem, {
                          value: "all",
                          children: "All Sensitivity",
                        }),
                        _jsx(SelectItem, {
                          value: "public",
                          children: "Public",
                        }),
                        _jsx(SelectItem, {
                          value: "internal",
                          children: "Internal",
                        }),
                        _jsx(SelectItem, {
                          value: "confidential",
                          children: "Confidential",
                        }),
                        _jsx(SelectItem, {
                          value: "restricted",
                          children: "Restricted",
                        }),
                        _jsx(SelectItem, {
                          value: "top_secret",
                          children: "Top Secret",
                        }),
                      ],
                    }),
                  ],
                }),
                _jsxs(Select, {
                  value: state.filterType,
                  onValueChange: (value) =>
                    setState((prev) => ({ ...prev, filterType: value })),
                  children: [
                    _jsx(SelectTrigger, {
                      className: "w-48",
                      children: _jsx(SelectValue, { placeholder: "Type" }),
                    }),
                    _jsxs(SelectContent, {
                      children: [
                        _jsx(SelectItem, {
                          value: "all",
                          children: "All Types",
                        }),
                        _jsx(SelectItem, {
                          value: "database",
                          children: "Database",
                        }),
                        _jsx(SelectItem, { value: "file", children: "File" }),
                        _jsx(SelectItem, { value: "api", children: "API" }),
                        _jsx(SelectItem, {
                          value: "stream",
                          children: "Stream",
                        }),
                        _jsx(SelectItem, {
                          value: "document",
                          children: "Document",
                        }),
                        _jsx(SelectItem, {
                          value: "backup",
                          children: "Backup",
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
                  children:
                    state.selectedAssets.length > 0 &&
                    _jsxs(Button, {
                      onClick: () =>
                        setState((prev) => ({
                          ...prev,
                          showBulkActions: true,
                        })),
                      size: "sm",
                      variant: "outline",
                      children: [
                        _jsx(Tag, { className: "w-4 h-4 mr-2" }),
                        "Bulk Classify (",
                        state.selectedAssets.length,
                        ")",
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
            className: "grid w-full grid-cols-4",
            children: [
              _jsx(TabsTrigger, { value: "assets", children: "Assets" }),
              _jsx(TabsTrigger, { value: "overview", children: "Overview" }),
              _jsx(TabsTrigger, { value: "rules", children: "Rules" }),
              _jsx(TabsTrigger, { value: "levels", children: "Levels" }),
            ],
          }),
          _jsx(TabsContent, {
            value: "assets",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsxs("h3", {
                      className: "text-lg font-medium",
                      children: ["Data Assets (", filteredAssets.length, ")"],
                    }),
                    _jsxs(Button, {
                      onClick: () =>
                        setState((prev) => ({ ...prev, showRuleEditor: true })),
                      size: "sm",
                      children: [
                        _jsx(Plus, { className: "w-4 h-4 mr-2" }),
                        "Add Rule",
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: filteredAssets.map((asset) =>
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
                                  _jsx(Checkbox, {
                                    checked: state.selectedAssets.includes(
                                      asset.id,
                                    ),
                                    onCheckedChange: (checked) => {
                                      setState((prev) => ({
                                        ...prev,
                                        selectedAssets: checked
                                          ? [...prev.selectedAssets, asset.id]
                                          : prev.selectedAssets.filter(
                                              (id) => id !== asset.id,
                                            ),
                                      }));
                                    },
                                  }),
                                  getTypeIcon(asset.type),
                                  _jsxs("div", {
                                    className: "flex-1 min-w-0",
                                    children: [
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-2 mb-2",
                                        children: [
                                          _jsx("h4", {
                                            className: "font-medium truncate",
                                            children: asset.name,
                                          }),
                                          asset.classification
                                            ? _jsx(Badge, {
                                                className:
                                                  "bg-blue-100 text-blue-600",
                                                children:
                                                  classificationLevels.find(
                                                    (l) =>
                                                      l.id ===
                                                      asset.classification,
                                                  )?.name ||
                                                  asset.classification,
                                              })
                                            : _jsx(Badge, {
                                                className:
                                                  "bg-gray-100 text-gray-600",
                                                children: "Unclassified",
                                              }),
                                          _jsx(Badge, {
                                            className: getSensitivityColor(
                                              asset.sensitivity,
                                            ),
                                            children: asset.sensitivity,
                                          }),
                                          getEncryptionIcon(
                                            asset.encryptionStatus,
                                          ),
                                        ],
                                      }),
                                      _jsx("p", {
                                        className: "text-sm text-gray-600 mb-2",
                                        children: asset.description,
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-4 text-xs text-gray-500 mb-2",
                                        children: [
                                          _jsxs("span", {
                                            children: ["Owner: ", asset.owner],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Size: ",
                                              formatBytes(asset.size),
                                            ],
                                          }),
                                          asset.recordCount &&
                                            _jsxs("span", {
                                              children: [
                                                "Records: ",
                                                asset.recordCount.toLocaleString(),
                                              ],
                                            }),
                                          _jsxs("span", {
                                            children: [
                                              "Last Modified:",
                                              " ",
                                              new Date(
                                                asset.lastModified,
                                              ).toLocaleDateString(),
                                            ],
                                          }),
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className: "flex flex-wrap gap-1",
                                        children: [
                                          asset.tags.map((tag) =>
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
                                          asset.personalData &&
                                            _jsx(Badge, {
                                              className:
                                                "bg-purple-100 text-purple-600 text-xs",
                                              children: "Personal Data",
                                            }),
                                          asset.financialData &&
                                            _jsx(Badge, {
                                              className:
                                                "bg-green-100 text-green-600 text-xs",
                                              children: "Financial Data",
                                            }),
                                          asset.healthData &&
                                            _jsx(Badge, {
                                              className:
                                                "bg-red-100 text-red-600 text-xs",
                                              children: "Health Data",
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
                                        selectedAsset: asset,
                                        showAssetDetails: true,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Eye, { className: "w-3 h-3 mr-1" }),
                                      "Details",
                                    ],
                                  }),
                                  _jsxs(Button, {
                                    onClick: () => handleAssetScan(asset.id),
                                    disabled: state.isScanning,
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Search, {
                                        className: "w-3 h-3 mr-1",
                                      }),
                                      "Scan",
                                    ],
                                  }),
                                  !asset.classification &&
                                    _jsxs(Button, {
                                      onClick: () => {
                                        // Quick classify as internal
                                        handleAssetClassify(
                                          asset.id,
                                          "internal",
                                          "internal",
                                          [],
                                        );
                                      },
                                      disabled: state.isClassifying,
                                      size: "sm",
                                      children: [
                                        _jsx(Tag, {
                                          className: "w-3 h-3 mr-1",
                                        }),
                                        "Classify",
                                      ],
                                    }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      },
                      asset.id,
                    ),
                  ),
                }),
                filteredAssets.length === 0 &&
                  _jsx(Card, {
                    children: _jsxs(CardContent, {
                      className: "p-6 text-center",
                      children: [
                        _jsx(Database, {
                          className: "w-12 h-12 mx-auto mb-4 text-gray-400",
                        }),
                        _jsx("h3", {
                          className: "text-lg font-medium text-gray-900 mb-2",
                          children: "No Assets Found",
                        }),
                        _jsx("p", {
                          className: "text-sm text-gray-600",
                          children:
                            "No data assets match your current filters. Try adjusting your search criteria.",
                        }),
                      ],
                    }),
                  }),
              ],
            }),
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
                                  children: "Total Assets",
                                }),
                                _jsx("p", {
                                  className: "text-2xl font-bold",
                                  children: classificationMetrics.total,
                                }),
                              ],
                            }),
                            _jsx(Database, {
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
                                  children: "Classified",
                                }),
                                _jsx("p", {
                                  className:
                                    "text-2xl font-bold text-green-600",
                                  children: classificationMetrics.classified,
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    classificationMetrics.classificationRate.toFixed(
                                      1,
                                    ),
                                    "%",
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
                                  children: "Encrypted",
                                }),
                                _jsx("p", {
                                  className: "text-2xl font-bold text-blue-600",
                                  children:
                                    classificationMetrics.encryptedAssets,
                                }),
                                _jsxs("p", {
                                  className: "text-xs text-gray-500",
                                  children: [
                                    classificationMetrics.encryptionRate.toFixed(
                                      1,
                                    ),
                                    "%",
                                  ],
                                }),
                              ],
                            }),
                            _jsx(Lock, { className: "w-8 h-8 text-blue-500" }),
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
                                  children: "Personal Data",
                                }),
                                _jsx("p", {
                                  className:
                                    "text-2xl font-bold text-purple-600",
                                  children:
                                    classificationMetrics.personalDataAssets,
                                }),
                              ],
                            }),
                            _jsx(Users, {
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
                        children: "Classification Distribution",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsx("div", {
                        className: "space-y-3",
                        children: Object.entries(
                          classificationMetrics.byClassification,
                        ).map(([classification, count]) => {
                          const level = classificationLevels.find(
                            (l) => l.id === classification,
                          );
                          return _jsxs(
                            "div",
                            {
                              className:
                                "flex items-center justify-between p-3 bg-gray-50 rounded",
                              children: [
                                _jsxs("div", {
                                  className: "flex items-center space-x-2",
                                  children: [
                                    _jsx(Tag, {
                                      className: "w-4 h-4 text-gray-400",
                                    }),
                                    _jsx("span", {
                                      className: "font-medium",
                                      children: level?.name || classification,
                                    }),
                                  ],
                                }),
                                _jsxs(Badge, {
                                  className: "bg-blue-100 text-blue-600",
                                  children: [count, " assets"],
                                }),
                              ],
                            },
                            classification,
                          );
                        }),
                      }),
                    }),
                  ],
                }),
                _jsxs(Card, {
                  children: [
                    _jsx(CardHeader, {
                      children: _jsx(CardTitle, {
                        children: "Sensitivity Distribution",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsx("div", {
                        className: "space-y-3",
                        children: Object.entries(
                          classificationMetrics.bySensitivity,
                        ).map(([sensitivity, count]) =>
                          _jsxs(
                            "div",
                            {
                              className:
                                "flex items-center justify-between p-3 bg-gray-50 rounded",
                              children: [
                                _jsxs("div", {
                                  className: "flex items-center space-x-2",
                                  children: [
                                    _jsx(Shield, {
                                      className: "w-4 h-4 text-gray-400",
                                    }),
                                    _jsx("span", {
                                      className: "font-medium capitalize",
                                      children: sensitivity,
                                    }),
                                  ],
                                }),
                                _jsxs(Badge, {
                                  className: getSensitivityColor(sensitivity),
                                  children: [count, " assets"],
                                }),
                              ],
                            },
                            sensitivity,
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
            value: "rules",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsx("h3", {
                      className: "text-lg font-medium",
                      children: "Classification Rules",
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
                  children: classificationRules.map((rule) =>
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
                                        children: rule.name,
                                      }),
                                      _jsx(Badge, {
                                        className: rule.enabled
                                          ? "bg-green-100 text-green-600"
                                          : "bg-gray-100 text-gray-600",
                                        children: rule.enabled
                                          ? "Enabled"
                                          : "Disabled",
                                      }),
                                      _jsxs(Badge, {
                                        className: "bg-blue-100 text-blue-600",
                                        children: ["Priority: ", rule.priority],
                                      }),
                                    ],
                                  }),
                                  _jsx("p", {
                                    className: "text-sm text-gray-600 mb-2",
                                    children: rule.description,
                                  }),
                                  _jsxs("div", {
                                    className:
                                      "text-xs text-gray-500 space-y-1",
                                    children: [
                                      _jsxs("p", {
                                        children: [
                                          "Conditions: ",
                                          rule.conditions.length,
                                        ],
                                      }),
                                      _jsxs("p", {
                                        children: [
                                          "Triggered: ",
                                          rule.triggerCount,
                                          " times",
                                        ],
                                      }),
                                      _jsxs("p", {
                                        children: [
                                          "Created by: ",
                                          rule.createdBy,
                                        ],
                                      }),
                                      rule.lastTriggered &&
                                        _jsxs("p", {
                                          children: [
                                            "Last triggered:",
                                            " ",
                                            new Date(
                                              rule.lastTriggered,
                                            ).toLocaleDateString(),
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
            value: "levels",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsx("h3", {
                  className: "text-lg font-medium",
                  children: "Classification Levels",
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: classificationLevels.map((level) =>
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
                                      children: level.name,
                                    }),
                                    _jsxs(Badge, {
                                      style: {
                                        backgroundColor: level.color,
                                        color: "white",
                                      },
                                      children: ["Priority: ", level.priority],
                                    }),
                                  ],
                                }),
                                _jsx("p", {
                                  className: "text-sm text-gray-600 mb-3",
                                  children: level.description,
                                }),
                                _jsxs("div", {
                                  className:
                                    "grid grid-cols-1 md:grid-cols-2 gap-4",
                                  children: [
                                    _jsxs("div", {
                                      children: [
                                        _jsx("h5", {
                                          className: "font-medium text-sm mb-2",
                                          children: "Requirements",
                                        }),
                                        _jsx("div", {
                                          className: "space-y-1 text-xs",
                                          children: Object.entries(
                                            level.requirements,
                                          ).map(([req, required]) =>
                                            _jsxs(
                                              "div",
                                              {
                                                className:
                                                  "flex items-center space-x-2",
                                                children: [
                                                  required
                                                    ? _jsx(CheckCircle, {
                                                        className:
                                                          "w-3 h-3 text-green-600",
                                                      })
                                                    : _jsx(XCircle, {
                                                        className:
                                                          "w-3 h-3 text-gray-400",
                                                      }),
                                                  _jsx("span", {
                                                    className: "capitalize",
                                                    children: req
                                                      .replace(
                                                        /([A-Z])/g,
                                                        " $1",
                                                      )
                                                      .trim(),
                                                  }),
                                                ],
                                              },
                                              req,
                                            ),
                                          ),
                                        }),
                                      ],
                                    }),
                                    _jsxs("div", {
                                      children: [
                                        _jsx("h5", {
                                          className: "font-medium text-sm mb-2",
                                          children: "Details",
                                        }),
                                        _jsxs("div", {
                                          className:
                                            "space-y-1 text-xs text-gray-600",
                                          children: [
                                            _jsxs("p", {
                                              children: [
                                                "Retention: ",
                                                level.retentionPeriod,
                                                " days",
                                              ],
                                            }),
                                            _jsxs("p", {
                                              children: [
                                                "Allowed Locations:",
                                                " ",
                                                level.allowedLocations.length,
                                              ],
                                            }),
                                            _jsxs("p", {
                                              children: [
                                                "Allowed Users: ",
                                                level.allowedUsers.length,
                                              ],
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                level.handlingInstructions.length > 0 &&
                                  _jsxs("div", {
                                    className: "mt-3",
                                    children: [
                                      _jsx("h5", {
                                        className: "font-medium text-sm mb-2",
                                        children: "Handling Instructions",
                                      }),
                                      _jsx("ul", {
                                        className:
                                          "text-xs text-gray-600 space-y-1",
                                        children:
                                          level.handlingInstructions.map(
                                            (instruction, index) =>
                                              _jsxs(
                                                "li",
                                                {
                                                  className:
                                                    "flex items-start space-x-1",
                                                  children: [
                                                    _jsx("span", {
                                                      children: "\u2022",
                                                    }),
                                                    _jsx("span", {
                                                      children: instruction,
                                                    }),
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
                        }),
                      },
                      level.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
        ],
      }),
      state.showAssetDetails &&
        state.selectedAsset &&
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
                    _jsxs("span", {
                      children: ["Asset Details: ", state.selectedAsset.name],
                    }),
                    _jsx(Button, {
                      onClick: () =>
                        setState((prev) => ({
                          ...prev,
                          showAssetDetails: false,
                          selectedAsset: null,
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
                            children: "Basic Information",
                          }),
                          _jsxs("div", {
                            className: "space-y-2 text-sm",
                            children: [
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Type:",
                                  }),
                                  _jsx("span", {
                                    className: "capitalize",
                                    children: state.selectedAsset.type,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Owner:",
                                  }),
                                  _jsx("span", {
                                    children: state.selectedAsset.owner,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Location:",
                                  }),
                                  _jsx("span", {
                                    children: state.selectedAsset.location,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Size:",
                                  }),
                                  _jsx("span", {
                                    children: formatBytes(
                                      state.selectedAsset.size,
                                    ),
                                  }),
                                ],
                              }),
                              state.selectedAsset.recordCount &&
                                _jsxs("div", {
                                  className: "flex justify-between",
                                  children: [
                                    _jsx("span", {
                                      className: "text-gray-600",
                                      children: "Records:",
                                    }),
                                    _jsx("span", {
                                      children:
                                        state.selectedAsset.recordCount.toLocaleString(),
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
                            children: "Classification",
                          }),
                          _jsxs("div", {
                            className: "space-y-2 text-sm",
                            children: [
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Level:",
                                  }),
                                  _jsx("span", {
                                    children:
                                      state.selectedAsset.classification ||
                                      "Unclassified",
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Sensitivity:",
                                  }),
                                  _jsx(Badge, {
                                    className: getSensitivityColor(
                                      state.selectedAsset.sensitivity,
                                    ),
                                    children: state.selectedAsset.sensitivity,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Encryption:",
                                  }),
                                  _jsxs("div", {
                                    className: "flex items-center space-x-1",
                                    children: [
                                      getEncryptionIcon(
                                        state.selectedAsset.encryptionStatus,
                                      ),
                                      _jsx("span", {
                                        className: "capitalize",
                                        children:
                                          state.selectedAsset.encryptionStatus.replace(
                                            "_",
                                            " ",
                                          ),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "flex justify-between",
                                children: [
                                  _jsx("span", {
                                    className: "text-gray-600",
                                    children: "Classified By:",
                                  }),
                                  _jsx("span", {
                                    children:
                                      state.selectedAsset.classifiedBy || "N/A",
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
                    children: [
                      _jsx(Label, {
                        className: "text-sm font-medium",
                        children: "Data Types",
                      }),
                      _jsxs("div", {
                        className: "flex flex-wrap gap-2 mt-2",
                        children: [
                          state.selectedAsset.personalData &&
                            _jsx(Badge, {
                              className: "bg-purple-100 text-purple-600",
                              children: "Personal Data",
                            }),
                          state.selectedAsset.financialData &&
                            _jsx(Badge, {
                              className: "bg-green-100 text-green-600",
                              children: "Financial Data",
                            }),
                          state.selectedAsset.healthData &&
                            _jsx(Badge, {
                              className: "bg-red-100 text-red-600",
                              children: "Health Data",
                            }),
                        ],
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    children: [
                      _jsx(Label, {
                        className: "text-sm font-medium",
                        children: "Tags",
                      }),
                      _jsx("div", {
                        className: "flex flex-wrap gap-2 mt-2",
                        children: state.selectedAsset.tags.map((tag) =>
                          _jsx(
                            Badge,
                            {
                              className: "bg-gray-100 text-gray-600",
                              children: tag,
                            },
                            tag,
                          ),
                        ),
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    children: [
                      _jsx(Label, {
                        className: "text-sm font-medium",
                        children: "Compliance Flags",
                      }),
                      _jsx("div", {
                        className: "flex flex-wrap gap-2 mt-2",
                        children: state.selectedAsset.complianceFlags.map(
                          (flag) =>
                            _jsx(
                              Badge,
                              {
                                className: "bg-orange-100 text-orange-600",
                                children: flag,
                              },
                              flag,
                            ),
                        ),
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "flex space-x-2",
                    children: [
                      _jsxs(Button, {
                        onClick: () => handleAssetScan(state.selectedAsset.id),
                        disabled: state.isScanning,
                        size: "sm",
                        children: [
                          _jsx(Search, { className: "w-4 h-4 mr-2" }),
                          "Rescan Asset",
                        ],
                      }),
                      _jsxs(Button, {
                        onClick: () => {
                          // Open classification editor
                        },
                        size: "sm",
                        variant: "outline",
                        children: [
                          _jsx(Tag, { className: "w-4 h-4 mr-2" }),
                          "Update Classification",
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      state.showBulkActions &&
        _jsx("div", {
          className:
            "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
          children: _jsxs(Card, {
            className: "w-full max-w-md",
            children: [
              _jsx(CardHeader, {
                children: _jsx(CardTitle, { children: "Bulk Classification" }),
              }),
              _jsxs(CardContent, {
                className: "space-y-4",
                children: [
                  _jsxs("p", {
                    className: "text-sm text-gray-600",
                    children: [
                      "Classify ",
                      state.selectedAssets.length,
                      " selected assets.",
                    ],
                  }),
                  _jsxs("div", {
                    children: [
                      _jsx(Label, { children: "Classification Level" }),
                      _jsxs(Select, {
                        value: state.bulkClassification,
                        onValueChange: (value) =>
                          setState((prev) => ({
                            ...prev,
                            bulkClassification: value,
                          })),
                        children: [
                          _jsx(SelectTrigger, {
                            children: _jsx(SelectValue, {
                              placeholder: "Select classification",
                            }),
                          }),
                          _jsx(SelectContent, {
                            children: classificationLevels.map((level) =>
                              _jsx(
                                SelectItem,
                                { value: level.id, children: level.name },
                                level.id,
                              ),
                            ),
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    children: [
                      _jsx(Label, { children: "Sensitivity Level" }),
                      _jsxs(Select, {
                        value: state.bulkSensitivity,
                        onValueChange: (value) =>
                          setState((prev) => ({
                            ...prev,
                            bulkSensitivity: value,
                          })),
                        children: [
                          _jsx(SelectTrigger, {
                            children: _jsx(SelectValue, {
                              placeholder: "Select sensitivity",
                            }),
                          }),
                          _jsxs(SelectContent, {
                            children: [
                              _jsx(SelectItem, {
                                value: "public",
                                children: "Public",
                              }),
                              _jsx(SelectItem, {
                                value: "internal",
                                children: "Internal",
                              }),
                              _jsx(SelectItem, {
                                value: "confidential",
                                children: "Confidential",
                              }),
                              _jsx(SelectItem, {
                                value: "restricted",
                                children: "Restricted",
                              }),
                              _jsx(SelectItem, {
                                value: "top_secret",
                                children: "Top Secret",
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
                        onClick: handleBulkClassify,
                        disabled:
                          state.isClassifying || !state.bulkClassification,
                        children: state.isClassifying
                          ? "Classifying..."
                          : "Apply Classification",
                      }),
                      _jsx(Button, {
                        onClick: () =>
                          setState((prev) => ({
                            ...prev,
                            showBulkActions: false,
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
export default DataClassification;

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
import {
  Key,
  Shield,
  Lock,
  RefreshCw,
  Upload,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Globe,
  Settings,
  FileText,
  Plus,
  Edit,
  RotateCcw,
} from "lucide-react";
export function KeyManagement({
  keys = [],
  vaults = [],
  policies = [],
  onKeyGenerate,
  onKeyRotate,
  onKeyRevoke,
  onKeyExport,
  onKeyImport,
  onPolicyCreate,
  onPolicyUpdate,
  onVaultStatus,
  className = "",
}) {
  const [state, setState] = useState({
    activeTab: "keys",
    selectedKey: null,
    selectedVault: null,
    selectedPolicy: null,
    searchTerm: "",
    filterStatus: "all",
    filterType: "all",
    filterVault: "all",
    showKeyDetails: false,
    showKeyGenerator: false,
    showPolicyEditor: false,
    showImportDialog: false,
    isGenerating: false,
    isRotating: false,
    isExporting: false,
    isImporting: false,
    error: null,
    success: null,
    newKey: {
      name: "",
      description: "",
      type: "symmetric",
      algorithm: "AES-256",
      purpose: "encryption",
      metadata: {
        environment: "production",
        classification: "confidential",
        compliance: [],
        tags: [],
      },
      accessControl: {
        allowedUsers: [],
        allowedRoles: [],
        allowedApplications: [],
        requireMfa: true,
        requireApproval: false,
      },
    },
    newPolicy: {
      name: "",
      description: "",
      keyTypes: [],
      minKeySize: 256,
      maxKeyAge: 365,
      rotationRequired: true,
      rotationInterval: 90,
      backupRequired: true,
      auditRequired: true,
      approvalRequired: false,
      mfaRequired: true,
      allowedEnvironments: ["production"],
      complianceRequirements: [],
      createdBy: "current-user",
      isActive: true,
    },
    importData: {
      keyData: "",
      format: "pem",
      name: "",
      description: "",
    },
    revocationReason: "",
    showRevocationDialog: null,
  });
  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const total = keys.length;
    const active = keys.filter((k) => k.status === "active").length;
    const expired = keys.filter((k) => k.status === "expired").length;
    const compromised = keys.filter((k) => k.status === "compromised").length;
    const nearExpiry = keys.filter((k) => {
      if (!k.expiresAt) return false;
      const daysUntilExpiry =
        (new Date(k.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;
    const byType = keys.reduce((acc, key) => {
      acc[key.type] = (acc[key.type] || 0) + 1;
      return acc;
    }, {});
    const byAlgorithm = keys.reduce((acc, key) => {
      acc[key.algorithm] = (acc[key.algorithm] || 0) + 1;
      return acc;
    }, {});
    const totalUsage = keys.reduce((sum, key) => sum + key.usageCount, 0);
    const averageUsage = total > 0 ? totalUsage / total : 0;
    return {
      total,
      active,
      expired,
      compromised,
      nearExpiry,
      byType,
      byAlgorithm,
      totalUsage,
      averageUsage,
    };
  }, [keys]);
  // Filter keys
  const filteredKeys = useMemo(() => {
    return keys.filter((key) => {
      const matchesSearch =
        key.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
        key.description
          .toLowerCase()
          .includes(state.searchTerm.toLowerCase()) ||
        key.metadata.tags.some((tag) =>
          tag.toLowerCase().includes(state.searchTerm.toLowerCase()),
        );
      const matchesStatus =
        state.filterStatus === "all" || key.status === state.filterStatus;
      const matchesType =
        state.filterType === "all" || key.type === state.filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [keys, state.searchTerm, state.filterStatus, state.filterType]);
  // Handle key generation
  const handleKeyGenerate = useCallback(async () => {
    if (!state.newKey.name || !state.newKey.description) {
      setState((prev) => ({
        ...prev,
        error: "Name and description are required",
      }));
      return;
    }
    setState((prev) => ({ ...prev, isGenerating: true, error: null }));
    try {
      if (onKeyGenerate) {
        await onKeyGenerate(state.newKey);
        setState((prev) => ({
          ...prev,
          success: "Key generated successfully",
          showKeyGenerator: false,
          newKey: {
            name: "",
            description: "",
            type: "symmetric",
            algorithm: "AES-256",
            purpose: "encryption",
            metadata: {
              environment: "production",
              classification: "confidential",
              compliance: [],
              tags: [],
            },
            accessControl: {
              allowedUsers: [],
              allowedRoles: [],
              allowedApplications: [],
              requireMfa: true,
              requireApproval: false,
            },
          },
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to generate key" }));
    } finally {
      setState((prev) => ({ ...prev, isGenerating: false }));
    }
  }, [onKeyGenerate, state.newKey]);
  // Handle key rotation
  const handleKeyRotate = useCallback(
    async (keyId) => {
      setState((prev) => ({ ...prev, isRotating: true, error: null }));
      try {
        if (onKeyRotate) {
          await onKeyRotate(keyId);
          setState((prev) => ({
            ...prev,
            success: "Key rotation initiated successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to rotate key" }));
      } finally {
        setState((prev) => ({ ...prev, isRotating: false }));
      }
    },
    [onKeyRotate],
  );
  // Handle key revocation
  const handleKeyRevoke = useCallback(
    async (keyId) => {
      if (!state.revocationReason.trim()) {
        setState((prev) => ({
          ...prev,
          error: "Revocation reason is required",
        }));
        return;
      }
      setState((prev) => ({ ...prev, isRotating: true, error: null }));
      try {
        if (onKeyRevoke) {
          await onKeyRevoke(keyId, state.revocationReason);
          setState((prev) => ({
            ...prev,
            success: "Key revoked successfully",
            showRevocationDialog: null,
            revocationReason: "",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to revoke key" }));
      } finally {
        setState((prev) => ({ ...prev, isRotating: false }));
      }
    },
    [onKeyRevoke, state.revocationReason],
  );
  // Handle key export
  const handleKeyExport = useCallback(
    async (keyId, format) => {
      setState((prev) => ({ ...prev, isExporting: true, error: null }));
      try {
        if (onKeyExport) {
          const blob = await onKeyExport(keyId, format);
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `key-${keyId}.${format}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setState((prev) => ({
            ...prev,
            success: "Key exported successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to export key" }));
      } finally {
        setState((prev) => ({ ...prev, isExporting: false }));
      }
    },
    [onKeyExport],
  );
  // Handle key import
  const handleKeyImport = useCallback(async () => {
    if (!state.importData.keyData || !state.importData.name) {
      setState((prev) => ({
        ...prev,
        error: "Key data and name are required",
      }));
      return;
    }
    setState((prev) => ({ ...prev, isImporting: true, error: null }));
    try {
      if (onKeyImport) {
        await onKeyImport(state.importData.keyData, state.importData.format, {
          name: state.importData.name,
          description: state.importData.description,
        });
        setState((prev) => ({
          ...prev,
          success: "Key imported successfully",
          showImportDialog: false,
          importData: {
            keyData: "",
            format: "pem",
            name: "",
            description: "",
          },
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to import key" }));
    } finally {
      setState((prev) => ({ ...prev, isImporting: false }));
    }
  }, [onKeyImport, state.importData]);
  // Handle policy creation
  const handlePolicyCreate = useCallback(async () => {
    if (!state.newPolicy.name || !state.newPolicy.description) {
      setState((prev) => ({
        ...prev,
        error: "Name and description are required",
      }));
      return;
    }
    setState((prev) => ({ ...prev, isGenerating: true, error: null }));
    try {
      if (onPolicyCreate) {
        await onPolicyCreate(state.newPolicy);
        setState((prev) => ({
          ...prev,
          success: "Policy created successfully",
          showPolicyEditor: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to create policy" }));
    } finally {
      setState((prev) => ({ ...prev, isGenerating: false }));
    }
  }, [onPolicyCreate, state.newPolicy]);
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-600";
      case "inactive":
        return "bg-gray-100 text-gray-600";
      case "compromised":
        return "bg-red-100 text-red-600";
      case "expired":
        return "bg-orange-100 text-orange-600";
      case "revoked":
        return "bg-red-100 text-red-600";
      case "pending_activation":
        return "bg-yellow-100 text-yellow-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const getTypeIcon = (type) => {
    switch (type) {
      case "symmetric":
        return _jsx(Key, { className: "w-4 h-4" });
      case "asymmetric":
        return _jsx(Shield, { className: "w-4 h-4" });
      case "master":
        return _jsx(Lock, { className: "w-4 h-4" });
      case "data":
        return _jsx(Database, { className: "w-4 h-4" });
      case "signing":
        return _jsx(FileText, { className: "w-4 h-4" });
      case "transport":
        return _jsx(Globe, { className: "w-4 h-4" });
      default:
        return _jsx(Key, { className: "w-4 h-4" });
    }
  };
  const getVaultStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-100 text-green-600";
      case "offline":
        return "bg-red-100 text-red-600";
      case "maintenance":
        return "bg-yellow-100 text-yellow-600";
      case "error":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const formatKeySize = (algorithm, keySize) => {
    if (algorithm.includes("RSA")) {
      return `${keySize} bits`;
    } else if (algorithm.includes("AES")) {
      return `${keySize} bits`;
    } else if (algorithm.includes("ECDSA")) {
      return `${keySize} bits`;
    }
    return `${keySize} bits`;
  };
  const getDaysUntilExpiry = (expiresAt) => {
    if (!expiresAt) return null;
    const days = Math.ceil(
      (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return days;
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
                    _jsx(Key, { className: "w-6 h-6 mr-3 text-blue-600" }),
                    "Key Management System",
                  ],
                }),
                _jsxs("div", {
                  className: "flex items-center space-x-2",
                  children: [
                    _jsxs(Badge, {
                      className: "bg-blue-100 text-blue-600",
                      children: [
                        _jsx(Key, { className: "w-3 h-3 mr-1" }),
                        keyMetrics.total,
                        " Keys",
                      ],
                    }),
                    _jsxs(Badge, {
                      className: "bg-green-100 text-green-600",
                      children: [
                        _jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
                        keyMetrics.active,
                        " Active",
                      ],
                    }),
                    keyMetrics.nearExpiry > 0 &&
                      _jsxs(Badge, {
                        className: "bg-yellow-100 text-yellow-600",
                        children: [
                          _jsx(Clock, { className: "w-3 h-3 mr-1" }),
                          keyMetrics.nearExpiry,
                          " Expiring",
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
                "Centralized management of encryption keys, certificates, and cryptographic policies.",
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
      keyMetrics.compromised > 0 &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-red-600" }),
            _jsxs(AlertDescription, {
              className: "text-red-800",
              children: [
                _jsx("strong", { children: "Security Alert:" }),
                " ",
                keyMetrics.compromised,
                " ",
                "compromised keys require immediate attention.",
              ],
            }),
          ],
        }),
      keyMetrics.nearExpiry > 0 &&
        _jsxs(Alert, {
          className: "border-amber-200 bg-amber-50",
          children: [
            _jsx(Clock, { className: "h-4 w-4 text-amber-600" }),
            _jsxs(AlertDescription, {
              className: "text-amber-800",
              children: [
                _jsx("strong", { children: "Expiry Warning:" }),
                " ",
                keyMetrics.nearExpiry,
                " keys will expire within 30 days.",
              ],
            }),
          ],
        }),
      _jsx(Card, {
        children: _jsx(CardContent, {
          className: "p-4",
          children: _jsxs("div", {
            className: "flex space-x-4",
            children: [
              _jsx("div", {
                className: "flex-1",
                children: _jsxs("div", {
                  className: "relative",
                  children: [
                    _jsx(Key, {
                      className:
                        "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4",
                    }),
                    _jsx(Input, {
                      placeholder:
                        "Search keys by name, description, or tags...",
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
                value: state.filterStatus,
                onValueChange: (value) =>
                  setState((prev) => ({ ...prev, filterStatus: value })),
                children: [
                  _jsx(SelectTrigger, {
                    className: "w-48",
                    children: _jsx(SelectValue, { placeholder: "Status" }),
                  }),
                  _jsxs(SelectContent, {
                    children: [
                      _jsx(SelectItem, {
                        value: "all",
                        children: "All Status",
                      }),
                      _jsx(SelectItem, { value: "active", children: "Active" }),
                      _jsx(SelectItem, {
                        value: "inactive",
                        children: "Inactive",
                      }),
                      _jsx(SelectItem, {
                        value: "expired",
                        children: "Expired",
                      }),
                      _jsx(SelectItem, {
                        value: "compromised",
                        children: "Compromised",
                      }),
                      _jsx(SelectItem, {
                        value: "revoked",
                        children: "Revoked",
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
                      _jsx(SelectItem, { value: "all", children: "All Types" }),
                      _jsx(SelectItem, {
                        value: "symmetric",
                        children: "Symmetric",
                      }),
                      _jsx(SelectItem, {
                        value: "asymmetric",
                        children: "Asymmetric",
                      }),
                      _jsx(SelectItem, { value: "master", children: "Master" }),
                      _jsx(SelectItem, { value: "data", children: "Data" }),
                      _jsx(SelectItem, {
                        value: "signing",
                        children: "Signing",
                      }),
                      _jsx(SelectItem, {
                        value: "transport",
                        children: "Transport",
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
              _jsx(TabsTrigger, { value: "keys", children: "Keys" }),
              _jsx(TabsTrigger, { value: "vaults", children: "Vaults" }),
              _jsx(TabsTrigger, { value: "policies", children: "Policies" }),
              _jsx(TabsTrigger, { value: "overview", children: "Overview" }),
            ],
          }),
          _jsx(TabsContent, {
            value: "keys",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsxs("h3", {
                      className: "text-lg font-medium",
                      children: ["Encryption Keys (", filteredKeys.length, ")"],
                    }),
                    _jsxs("div", {
                      className: "flex space-x-2",
                      children: [
                        _jsxs(Button, {
                          onClick: () =>
                            setState((prev) => ({
                              ...prev,
                              showImportDialog: true,
                            })),
                          size: "sm",
                          variant: "outline",
                          children: [
                            _jsx(Upload, { className: "w-4 h-4 mr-2" }),
                            "Import Key",
                          ],
                        }),
                        _jsxs(Button, {
                          onClick: () =>
                            setState((prev) => ({
                              ...prev,
                              showKeyGenerator: true,
                            })),
                          size: "sm",
                          children: [
                            _jsx(Plus, { className: "w-4 h-4 mr-2" }),
                            "Generate Key",
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: filteredKeys.map((key) => {
                    const daysUntilExpiry = getDaysUntilExpiry(key.expiresAt);
                    const isNearExpiry =
                      daysUntilExpiry !== null &&
                      daysUntilExpiry <= 30 &&
                      daysUntilExpiry > 0;
                    return _jsx(
                      Card,
                      {
                        className: `hover:shadow-md transition-shadow ${isNearExpiry ? "border-yellow-300" : ""}`,
                        children: _jsx(CardContent, {
                          className: "p-4",
                          children: _jsxs("div", {
                            className: "flex items-start justify-between",
                            children: [
                              _jsxs("div", {
                                className: "flex items-start space-x-3",
                                children: [
                                  getTypeIcon(key.type),
                                  _jsxs("div", {
                                    className: "flex-1 min-w-0",
                                    children: [
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-2 mb-2",
                                        children: [
                                          _jsx("h4", {
                                            className: "font-medium truncate",
                                            children: key.name,
                                          }),
                                          _jsx(Badge, {
                                            className: getStatusColor(
                                              key.status,
                                            ),
                                            children: key.status.replace(
                                              "_",
                                              " ",
                                            ),
                                          }),
                                          _jsx(Badge, {
                                            className:
                                              "bg-blue-100 text-blue-600",
                                            children: key.algorithm,
                                          }),
                                          _jsx(Badge, {
                                            className:
                                              "bg-purple-100 text-purple-600",
                                            children: key.type,
                                          }),
                                        ],
                                      }),
                                      _jsx("p", {
                                        className: "text-sm text-gray-600 mb-2",
                                        children: key.description,
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2",
                                        children: [
                                          _jsxs("span", {
                                            children: [
                                              "Size:",
                                              " ",
                                              formatKeySize(
                                                key.algorithm,
                                                key.keySize,
                                              ),
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Usage: ",
                                              key.usageCount.toLocaleString(),
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Created:",
                                              " ",
                                              new Date(
                                                key.createdAt,
                                              ).toLocaleDateString(),
                                            ],
                                          }),
                                          key.expiresAt &&
                                            _jsxs("span", {
                                              className: isNearExpiry
                                                ? "text-yellow-600 font-medium"
                                                : "",
                                              children: [
                                                "Expires:",
                                                " ",
                                                daysUntilExpiry !== null
                                                  ? `${daysUntilExpiry} days`
                                                  : "Never",
                                              ],
                                            }),
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className: "flex flex-wrap gap-1",
                                        children: [
                                          _jsx(Badge, {
                                            className:
                                              "bg-gray-100 text-gray-600 text-xs",
                                            children: key.metadata.environment,
                                          }),
                                          _jsx(Badge, {
                                            className:
                                              "bg-gray-100 text-gray-600 text-xs",
                                            children:
                                              key.metadata.classification,
                                          }),
                                          key.metadata.tags.map((tag) =>
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
                                        selectedKey: key,
                                        showKeyDetails: true,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Eye, { className: "w-3 h-3 mr-1" }),
                                      "Details",
                                    ],
                                  }),
                                  key.status === "active" &&
                                    _jsxs(_Fragment, {
                                      children: [
                                        _jsxs(Button, {
                                          onClick: () =>
                                            handleKeyRotate(key.id),
                                          disabled: state.isRotating,
                                          size: "sm",
                                          variant: "outline",
                                          children: [
                                            _jsx(RotateCcw, {
                                              className: "w-3 h-3 mr-1",
                                            }),
                                            "Rotate",
                                          ],
                                        }),
                                        _jsxs(Button, {
                                          onClick: () =>
                                            setState((prev) => ({
                                              ...prev,
                                              showRevocationDialog: key.id,
                                            })),
                                          size: "sm",
                                          variant: "destructive",
                                          children: [
                                            _jsx(XCircle, {
                                              className: "w-3 h-3 mr-1",
                                            }),
                                            "Revoke",
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
                      key.id,
                    );
                  }),
                }),
                filteredKeys.length === 0 &&
                  _jsx(Card, {
                    children: _jsxs(CardContent, {
                      className: "p-6 text-center",
                      children: [
                        _jsx(Key, {
                          className: "w-12 h-12 mx-auto mb-4 text-gray-400",
                        }),
                        _jsx("h3", {
                          className: "text-lg font-medium text-gray-900 mb-2",
                          children: "No Keys Found",
                        }),
                        _jsx("p", {
                          className: "text-sm text-gray-600",
                          children:
                            "No encryption keys match your current filters. Try adjusting your search criteria.",
                        }),
                      ],
                    }),
                  }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "vaults",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsx("h3", {
                  className: "text-lg font-medium",
                  children: "Key Vaults",
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: vaults.map((vault) =>
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
                                        children: vault.name,
                                      }),
                                      _jsx(Badge, {
                                        className: getVaultStatusColor(
                                          vault.status,
                                        ),
                                        children: vault.status,
                                      }),
                                      _jsx(Badge, {
                                        className: "bg-blue-100 text-blue-600",
                                        children: vault.type,
                                      }),
                                      _jsx(Badge, {
                                        className:
                                          "bg-green-100 text-green-600",
                                        children: vault.encryptionLevel,
                                      }),
                                    ],
                                  }),
                                  _jsx("p", {
                                    className: "text-sm text-gray-600 mb-2",
                                    children: vault.description,
                                  }),
                                  _jsxs("div", {
                                    className:
                                      "grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2",
                                    children: [
                                      _jsxs("span", {
                                        children: [
                                          "Provider: ",
                                          vault.provider,
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Location: ",
                                          vault.location,
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Keys: ",
                                          vault.keyCount,
                                          "/",
                                          vault.maxKeys,
                                        ],
                                      }),
                                      vault.lastBackup &&
                                        _jsxs("span", {
                                          children: [
                                            "Last Backup:",
                                            " ",
                                            new Date(
                                              vault.lastBackup,
                                            ).toLocaleDateString(),
                                          ],
                                        }),
                                    ],
                                  }),
                                  _jsxs("div", {
                                    className: "space-y-2",
                                    children: [
                                      _jsxs("div", {
                                        children: [
                                          _jsxs("div", {
                                            className:
                                              "flex justify-between text-sm mb-1",
                                            children: [
                                              _jsx("span", {
                                                children: "Capacity",
                                              }),
                                              _jsxs("span", {
                                                children: [
                                                  vault.keyCount,
                                                  "/",
                                                  vault.maxKeys,
                                                ],
                                              }),
                                            ],
                                          }),
                                          _jsx(Progress, {
                                            value:
                                              (vault.keyCount / vault.maxKeys) *
                                              100,
                                            className: "h-2",
                                          }),
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-4 text-xs",
                                        children: [
                                          _jsxs("span", {
                                            className: "flex items-center",
                                            children: [
                                              vault.backupEnabled
                                                ? _jsx(CheckCircle, {
                                                    className:
                                                      "w-3 h-3 mr-1 text-green-600",
                                                  })
                                                : _jsx(XCircle, {
                                                    className:
                                                      "w-3 h-3 mr-1 text-red-600",
                                                  }),
                                              "Backup",
                                              " ",
                                              vault.backupEnabled
                                                ? "Enabled"
                                                : "Disabled",
                                            ],
                                          }),
                                          _jsxs("span", {
                                            className: "flex items-center",
                                            children: [
                                              vault.accessLogs
                                                ? _jsx(CheckCircle, {
                                                    className:
                                                      "w-3 h-3 mr-1 text-green-600",
                                                  })
                                                : _jsx(XCircle, {
                                                    className:
                                                      "w-3 h-3 mr-1 text-red-600",
                                                  }),
                                              "Access Logs",
                                              " ",
                                              vault.accessLogs
                                                ? "Enabled"
                                                : "Disabled",
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
                                    onClick: () => {
                                      if (onVaultStatus) {
                                        onVaultStatus(vault.id);
                                      }
                                    },
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(RefreshCw, {
                                        className: "w-3 h-3 mr-1",
                                      }),
                                      "Refresh",
                                    ],
                                  }),
                                  _jsxs(Button, {
                                    onClick: () =>
                                      setState((prev) => ({
                                        ...prev,
                                        selectedVault: vault,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Settings, {
                                        className: "w-3 h-3 mr-1",
                                      }),
                                      "Configure",
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      },
                      vault.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "policies",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsx("h3", {
                      className: "text-lg font-medium",
                      children: "Key Policies",
                    }),
                    _jsxs(Button, {
                      onClick: () =>
                        setState((prev) => ({
                          ...prev,
                          showPolicyEditor: true,
                        })),
                      size: "sm",
                      children: [
                        _jsx(Plus, { className: "w-4 h-4 mr-2" }),
                        "Create Policy",
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: policies.map((policy) =>
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
                                        children: policy.name,
                                      }),
                                      _jsx(Badge, {
                                        className: policy.isActive
                                          ? "bg-green-100 text-green-600"
                                          : "bg-gray-100 text-gray-600",
                                        children: policy.isActive
                                          ? "Active"
                                          : "Inactive",
                                      }),
                                    ],
                                  }),
                                  _jsx("p", {
                                    className: "text-sm text-gray-600 mb-2",
                                    children: policy.description,
                                  }),
                                  _jsxs("div", {
                                    className:
                                      "grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-2",
                                    children: [
                                      _jsxs("span", {
                                        children: [
                                          "Min Key Size: ",
                                          policy.minKeySize,
                                          " bits",
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Max Age: ",
                                          policy.maxKeyAge,
                                          " days",
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Rotation: ",
                                          policy.rotationInterval,
                                          " days",
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Types: ",
                                          policy.keyTypes.length,
                                        ],
                                      }),
                                    ],
                                  }),
                                  _jsxs("div", {
                                    className:
                                      "flex items-center space-x-4 text-xs",
                                    children: [
                                      _jsxs("span", {
                                        className: "flex items-center",
                                        children: [
                                          policy.rotationRequired
                                            ? _jsx(CheckCircle, {
                                                className:
                                                  "w-3 h-3 mr-1 text-green-600",
                                              })
                                            : _jsx(XCircle, {
                                                className:
                                                  "w-3 h-3 mr-1 text-gray-400",
                                              }),
                                          "Rotation Required",
                                        ],
                                      }),
                                      _jsxs("span", {
                                        className: "flex items-center",
                                        children: [
                                          policy.mfaRequired
                                            ? _jsx(CheckCircle, {
                                                className:
                                                  "w-3 h-3 mr-1 text-green-600",
                                              })
                                            : _jsx(XCircle, {
                                                className:
                                                  "w-3 h-3 mr-1 text-gray-400",
                                              }),
                                          "MFA Required",
                                        ],
                                      }),
                                      _jsxs("span", {
                                        className: "flex items-center",
                                        children: [
                                          policy.auditRequired
                                            ? _jsx(CheckCircle, {
                                                className:
                                                  "w-3 h-3 mr-1 text-green-600",
                                              })
                                            : _jsx(XCircle, {
                                                className:
                                                  "w-3 h-3 mr-1 text-gray-400",
                                              }),
                                          "Audit Required",
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              _jsx("div", {
                                className: "flex space-x-2",
                                children: _jsxs(Button, {
                                  onClick: () =>
                                    setState((prev) => ({
                                      ...prev,
                                      selectedPolicy: policy,
                                      showPolicyEditor: true,
                                    })),
                                  size: "sm",
                                  variant: "outline",
                                  children: [
                                    _jsx(Edit, { className: "w-3 h-3 mr-1" }),
                                    "Edit",
                                  ],
                                }),
                              }),
                            ],
                          }),
                        }),
                      },
                      policy.id,
                    ),
                  ),
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
                                  children: "Total Keys",
                                }),
                                _jsx("p", {
                                  className: "text-2xl font-bold",
                                  children: keyMetrics.total,
                                }),
                              ],
                            }),
                            _jsx(Key, { className: "w-8 h-8 text-blue-500" }),
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
                                  children: "Active Keys",
                                }),
                                _jsx("p", {
                                  className:
                                    "text-2xl font-bold text-green-600",
                                  children: keyMetrics.active,
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
                                  children: "Total Usage",
                                }),
                                _jsx("p", {
                                  className: "text-2xl font-bold text-blue-600",
                                  children:
                                    keyMetrics.totalUsage.toLocaleString(),
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
                                  children: "Key Vaults",
                                }),
                                _jsx("p", {
                                  className:
                                    "text-2xl font-bold text-purple-600",
                                  children: vaults.length,
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
                        children: "Key Types Distribution",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsx("div", {
                        className: "space-y-3",
                        children: Object.entries(keyMetrics.byType).map(
                          ([type, count]) =>
                            _jsxs(
                              "div",
                              {
                                className:
                                  "flex items-center justify-between p-3 bg-gray-50 rounded",
                                children: [
                                  _jsxs("div", {
                                    className: "flex items-center space-x-2",
                                    children: [
                                      getTypeIcon(type),
                                      _jsx("span", {
                                        className: "font-medium capitalize",
                                        children: type,
                                      }),
                                    ],
                                  }),
                                  _jsxs(Badge, {
                                    className: "bg-blue-100 text-blue-600",
                                    children: [count, " keys"],
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
                        children: "Algorithm Distribution",
                      }),
                    }),
                    _jsx(CardContent, {
                      children: _jsx("div", {
                        className: "space-y-3",
                        children: Object.entries(keyMetrics.byAlgorithm).map(
                          ([algorithm, count]) =>
                            _jsxs(
                              "div",
                              {
                                className:
                                  "flex items-center justify-between p-3 bg-gray-50 rounded",
                                children: [
                                  _jsxs("div", {
                                    className: "flex items-center space-x-2",
                                    children: [
                                      _jsx(Lock, {
                                        className: "w-4 h-4 text-gray-400",
                                      }),
                                      _jsx("span", {
                                        className: "font-medium",
                                        children: algorithm,
                                      }),
                                    ],
                                  }),
                                  _jsxs(Badge, {
                                    className: "bg-green-100 text-green-600",
                                    children: [count, " keys"],
                                  }),
                                ],
                              },
                              algorithm,
                            ),
                        ),
                      }),
                    }),
                  ],
                }),
              ],
            }),
          }),
        ],
      }),
      state.showKeyGenerator &&
        _jsx("div", {
          className:
            "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
          children: _jsxs(Card, {
            className: "w-full max-w-2xl max-h-[90vh] overflow-y-auto",
            children: [
              _jsx(CardHeader, {
                children: _jsx(CardTitle, { children: "Generate New Key" }),
              }),
              _jsxs(CardContent, {
                className: "space-y-4",
                children: [
                  _jsxs("div", {
                    className: "grid grid-cols-2 gap-4",
                    children: [
                      _jsxs("div", {
                        children: [
                          _jsx(Label, { children: "Key Name" }),
                          _jsx(Input, {
                            value: state.newKey.name || "",
                            onChange: (e) =>
                              setState((prev) => ({
                                ...prev,
                                newKey: {
                                  ...prev.newKey,
                                  name: e.target.value,
                                },
                              })),
                            placeholder: "Enter key name",
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        children: [
                          _jsx(Label, { children: "Key Type" }),
                          _jsxs(Select, {
                            value: state.newKey.type,
                            onValueChange: (value) =>
                              setState((prev) => ({
                                ...prev,
                                newKey: { ...prev.newKey, type: value },
                              })),
                            children: [
                              _jsx(SelectTrigger, {
                                children: _jsx(SelectValue, {}),
                              }),
                              _jsxs(SelectContent, {
                                children: [
                                  _jsx(SelectItem, {
                                    value: "symmetric",
                                    children: "Symmetric",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "asymmetric",
                                    children: "Asymmetric",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "master",
                                    children: "Master",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "data",
                                    children: "Data",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "signing",
                                    children: "Signing",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "transport",
                                    children: "Transport",
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
                      _jsx(Label, { children: "Description" }),
                      _jsx(Textarea, {
                        value: state.newKey.description || "",
                        onChange: (e) =>
                          setState((prev) => ({
                            ...prev,
                            newKey: {
                              ...prev.newKey,
                              description: e.target.value,
                            },
                          })),
                        placeholder: "Enter key description",
                        rows: 3,
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "grid grid-cols-2 gap-4",
                    children: [
                      _jsxs("div", {
                        children: [
                          _jsx(Label, { children: "Algorithm" }),
                          _jsxs(Select, {
                            value: state.newKey.algorithm,
                            onValueChange: (value) =>
                              setState((prev) => ({
                                ...prev,
                                newKey: { ...prev.newKey, algorithm: value },
                              })),
                            children: [
                              _jsx(SelectTrigger, {
                                children: _jsx(SelectValue, {}),
                              }),
                              _jsxs(SelectContent, {
                                children: [
                                  _jsx(SelectItem, {
                                    value: "AES-256",
                                    children: "AES-256",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "RSA-2048",
                                    children: "RSA-2048",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "RSA-4096",
                                    children: "RSA-4096",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "ECDSA-P256",
                                    children: "ECDSA-P256",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "ECDSA-P384",
                                    children: "ECDSA-P384",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "ChaCha20-Poly1305",
                                    children: "ChaCha20-Poly1305",
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        children: [
                          _jsx(Label, { children: "Purpose" }),
                          _jsxs(Select, {
                            value: state.newKey.purpose,
                            onValueChange: (value) =>
                              setState((prev) => ({
                                ...prev,
                                newKey: { ...prev.newKey, purpose: value },
                              })),
                            children: [
                              _jsx(SelectTrigger, {
                                children: _jsx(SelectValue, {}),
                              }),
                              _jsxs(SelectContent, {
                                children: [
                                  _jsx(SelectItem, {
                                    value: "encryption",
                                    children: "Encryption",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "decryption",
                                    children: "Decryption",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "signing",
                                    children: "Signing",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "verification",
                                    children: "Verification",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "key_wrapping",
                                    children: "Key Wrapping",
                                  }),
                                  _jsx(SelectItem, {
                                    value: "key_derivation",
                                    children: "Key Derivation",
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
                      _jsx(Button, {
                        onClick: handleKeyGenerate,
                        disabled: state.isGenerating,
                        children: state.isGenerating
                          ? "Generating..."
                          : "Generate Key",
                      }),
                      _jsx(Button, {
                        onClick: () =>
                          setState((prev) => ({
                            ...prev,
                            showKeyGenerator: false,
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
      state.showRevocationDialog &&
        _jsx("div", {
          className:
            "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
          children: _jsxs(Card, {
            className: "w-full max-w-md",
            children: [
              _jsx(CardHeader, {
                children: _jsx(CardTitle, { children: "Revoke Key" }),
              }),
              _jsxs(CardContent, {
                className: "space-y-4",
                children: [
                  _jsx("p", {
                    className: "text-sm text-gray-600",
                    children:
                      "Please provide a reason for revoking this key. This action cannot be undone.",
                  }),
                  _jsxs("div", {
                    children: [
                      _jsx(Label, { children: "Revocation Reason" }),
                      _jsx(Textarea, {
                        value: state.revocationReason,
                        onChange: (e) =>
                          setState((prev) => ({
                            ...prev,
                            revocationReason: e.target.value,
                          })),
                        placeholder: "Enter reason for revocation...",
                        rows: 3,
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "flex space-x-2",
                    children: [
                      _jsx(Button, {
                        onClick: () =>
                          handleKeyRevoke(state.showRevocationDialog),
                        disabled:
                          state.isRotating || !state.revocationReason.trim(),
                        variant: "destructive",
                        children: state.isRotating
                          ? "Revoking..."
                          : "Revoke Key",
                      }),
                      _jsx(Button, {
                        onClick: () =>
                          setState((prev) => ({
                            ...prev,
                            showRevocationDialog: null,
                            revocationReason: "",
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
export default KeyManagement;

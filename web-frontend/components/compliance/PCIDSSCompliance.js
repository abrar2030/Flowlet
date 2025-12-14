import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Shield,
  CreditCard,
  Eye,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  Network,
  Database,
  Key,
  Monitor,
  Settings,
  Download,
} from "lucide-react";
export function PCIDSSCompliance({
  requirements = [],
  securityControls = [],
  vulnerabilities = [],
  complianceReports = [],
  overallComplianceScore = 0,
  onRequirementUpdate,
  onControlTest,
  onVulnerabilityUpdate,
  onGenerateReport,
  onExportReport,
  className = "",
}) {
  const [state, setState] = useState({
    activeTab: "overview",
    selectedRequirement: null,
    selectedVulnerability: null,
    isUpdating: false,
    isGenerating: false,
    isTesting: false,
    error: null,
    success: null,
    filterCategory: "all",
    filterStatus: "all",
    showDetails: false,
  });
  // Calculate compliance metrics
  const complianceMetrics = React.useMemo(() => {
    const total = requirements.length;
    const compliant = requirements.filter(
      (r) => r.status === "compliant",
    ).length;
    const nonCompliant = requirements.filter(
      (r) => r.status === "non_compliant",
    ).length;
    const inProgress = requirements.filter(
      (r) => r.status === "in_progress",
    ).length;
    const notApplicable = requirements.filter(
      (r) => r.status === "not_applicable",
    ).length;
    const criticalVulns = vulnerabilities.filter(
      (v) => v.severity === "critical" && v.status === "open",
    ).length;
    const highVulns = vulnerabilities.filter(
      (v) => v.severity === "high" && v.status === "open",
    ).length;
    const implementedControls = securityControls.filter(
      (c) => c.implemented,
    ).length;
    const totalControls = securityControls.length;
    return {
      total,
      compliant,
      nonCompliant,
      inProgress,
      notApplicable,
      complianceRate: total > 0 ? (compliant / total) * 100 : 0,
      criticalVulns,
      highVulns,
      implementedControls,
      totalControls,
      controlImplementationRate:
        totalControls > 0 ? (implementedControls / totalControls) * 100 : 0,
    };
  }, [requirements, vulnerabilities, securityControls]);
  // Filter requirements
  const filteredRequirements = React.useMemo(() => {
    return requirements.filter((req) => {
      const categoryMatch =
        state.filterCategory === "all" || req.category === state.filterCategory;
      const statusMatch =
        state.filterStatus === "all" || req.status === state.filterStatus;
      return categoryMatch && statusMatch;
    });
  }, [requirements, state.filterCategory, state.filterStatus]);
  // Handle requirement update
  const handleRequirementUpdate = useCallback(
    async (requirementId, status, evidence) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));
      try {
        if (onRequirementUpdate) {
          await onRequirementUpdate(requirementId, status, evidence);
          setState((prev) => ({
            ...prev,
            success: "Requirement updated successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Failed to update requirement",
        }));
      } finally {
        setState((prev) => ({ ...prev, isUpdating: false }));
      }
    },
    [onRequirementUpdate],
  );
  // Handle control test
  const handleControlTest = useCallback(
    async (controlId) => {
      setState((prev) => ({ ...prev, isTesting: true, error: null }));
      try {
        if (onControlTest) {
          await onControlTest(controlId);
          setState((prev) => ({
            ...prev,
            success: "Control test initiated successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to test control" }));
      } finally {
        setState((prev) => ({ ...prev, isTesting: false }));
      }
    },
    [onControlTest],
  );
  // Handle vulnerability update
  const handleVulnerabilityUpdate = useCallback(
    async (vulnerabilityId, status, notes) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));
      try {
        if (onVulnerabilityUpdate) {
          await onVulnerabilityUpdate(vulnerabilityId, status, notes);
          setState((prev) => ({
            ...prev,
            success: "Vulnerability updated successfully",
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: "Failed to update vulnerability",
        }));
      } finally {
        setState((prev) => ({ ...prev, isUpdating: false }));
      }
    },
    [onVulnerabilityUpdate],
  );
  // Handle report generation
  const handleGenerateReport = useCallback(
    async (type) => {
      setState((prev) => ({ ...prev, isGenerating: true, error: null }));
      try {
        if (onGenerateReport) {
          await onGenerateReport(type);
          setState((prev) => ({
            ...prev,
            success: "Report generation initiated",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to generate report" }));
      } finally {
        setState((prev) => ({ ...prev, isGenerating: false }));
      }
    },
    [onGenerateReport],
  );
  const getStatusColor = (status) => {
    switch (status) {
      case "compliant":
        return "bg-green-100 text-green-600";
      case "non_compliant":
        return "bg-red-100 text-red-600";
      case "in_progress":
        return "bg-yellow-100 text-yellow-600";
      case "not_applicable":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const getSeverityColor = (severity) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-600";
      case "high":
        return "bg-orange-100 text-orange-600";
      case "medium":
        return "bg-yellow-100 text-yellow-600";
      case "low":
        return "bg-blue-100 text-blue-600";
      case "info":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const getCategoryIcon = (category) => {
    switch (category) {
      case "network":
        return _jsx(Network, { className: "w-4 h-4" });
      case "data":
        return _jsx(Database, { className: "w-4 h-4" });
      case "vulnerability":
        return _jsx(AlertTriangle, { className: "w-4 h-4" });
      case "access":
        return _jsx(Key, { className: "w-4 h-4" });
      case "monitoring":
        return _jsx(Monitor, { className: "w-4 h-4" });
      case "policy":
        return _jsx(FileText, { className: "w-4 h-4" });
      default:
        return _jsx(Shield, { className: "w-4 h-4" });
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
                    _jsx(CreditCard, {
                      className: "w-6 h-6 mr-3 text-blue-600",
                    }),
                    "PCI DSS Compliance Dashboard",
                  ],
                }),
                _jsx("div", {
                  className: "flex items-center space-x-2",
                  children: _jsxs(Badge, {
                    className:
                      overallComplianceScore >= 90
                        ? "bg-green-100 text-green-600"
                        : overallComplianceScore >= 70
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-red-100 text-red-600",
                    children: [
                      _jsx(Shield, { className: "w-3 h-3 mr-1" }),
                      overallComplianceScore.toFixed(1),
                      "% Compliant",
                    ],
                  }),
                }),
              ],
            }),
          }),
          _jsx(CardContent, {
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  children: [
                    _jsxs("div", {
                      className: "flex justify-between text-sm mb-2",
                      children: [
                        _jsx("span", { children: "Overall Compliance Score" }),
                        _jsxs("span", {
                          children: [overallComplianceScore.toFixed(1), "%"],
                        }),
                      ],
                    }),
                    _jsx(Progress, {
                      value: overallComplianceScore,
                      className: "h-3",
                    }),
                  ],
                }),
                _jsx("p", {
                  className: "text-sm text-gray-600",
                  children:
                    "Monitor and maintain PCI DSS compliance for secure payment card data handling.",
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
      complianceMetrics.criticalVulns > 0 &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-red-600" }),
            _jsxs(AlertDescription, {
              className: "text-red-800",
              children: [
                _jsx("strong", { children: "Critical Alert:" }),
                " ",
                complianceMetrics.criticalVulns,
                " ",
                "critical vulnerabilities require immediate attention.",
              ],
            }),
          ],
        }),
      complianceMetrics.complianceRate < 80 &&
        _jsxs(Alert, {
          className: "border-amber-200 bg-amber-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-amber-600" }),
            _jsxs(AlertDescription, {
              className: "text-amber-800",
              children: [
                _jsx("strong", { children: "Compliance Warning:" }),
                " Current compliance rate is below 80%. Immediate action required.",
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
              _jsx(TabsTrigger, {
                value: "requirements",
                children: "Requirements",
              }),
              _jsx(TabsTrigger, { value: "controls", children: "Controls" }),
              _jsx(TabsTrigger, {
                value: "vulnerabilities",
                children: "Vulnerabilities",
              }),
              _jsx(TabsTrigger, { value: "reports", children: "Reports" }),
            ],
          }),
          _jsxs(TabsContent, {
            value: "overview",
            children: [
              _jsxs("div", {
                className:
                  "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6",
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
                                children: "Compliant Requirements",
                              }),
                              _jsx("p", {
                                className: "text-2xl font-bold text-green-600",
                                children: complianceMetrics.compliant,
                              }),
                              _jsxs("p", {
                                className: "text-xs text-gray-500",
                                children: [
                                  "of ",
                                  complianceMetrics.total,
                                  " total",
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
                                className: "text-sm font-medium text-gray-600",
                                children: "Non-Compliant",
                              }),
                              _jsx("p", {
                                className: "text-2xl font-bold text-red-600",
                                children: complianceMetrics.nonCompliant,
                              }),
                              _jsx("p", {
                                className: "text-xs text-gray-500",
                                children: "require attention",
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
                                children: "Critical Vulnerabilities",
                              }),
                              _jsx("p", {
                                className: "text-2xl font-bold text-red-600",
                                children: complianceMetrics.criticalVulns,
                              }),
                              _jsx("p", {
                                className: "text-xs text-gray-500",
                                children: "immediate action",
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
                                className: "text-sm font-medium text-gray-600",
                                children: "Security Controls",
                              }),
                              _jsx("p", {
                                className: "text-2xl font-bold text-blue-600",
                                children: complianceMetrics.implementedControls,
                              }),
                              _jsxs("p", {
                                className: "text-xs text-gray-500",
                                children: [
                                  "of ",
                                  complianceMetrics.totalControls,
                                  " implemented",
                                ],
                              }),
                            ],
                          }),
                          _jsx(Shield, { className: "w-8 h-8 text-blue-500" }),
                        ],
                      }),
                    }),
                  }),
                ],
              }),
              _jsxs(Card, {
                className: "mb-6",
                children: [
                  _jsx(CardHeader, {
                    children: _jsx(CardTitle, {
                      children: "Compliance by Category",
                    }),
                  }),
                  _jsx(CardContent, {
                    children: _jsx("div", {
                      className:
                        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
                      children: [
                        "network",
                        "data",
                        "vulnerability",
                        "access",
                        "monitoring",
                        "policy",
                      ].map((category) => {
                        const categoryReqs = requirements.filter(
                          (r) => r.category === category,
                        );
                        const categoryCompliant = categoryReqs.filter(
                          (r) => r.status === "compliant",
                        ).length;
                        const categoryRate =
                          categoryReqs.length > 0
                            ? (categoryCompliant / categoryReqs.length) * 100
                            : 0;
                        return _jsxs(
                          "div",
                          {
                            className: "p-4 border rounded-lg",
                            children: [
                              _jsxs("div", {
                                className: "flex items-center space-x-2 mb-2",
                                children: [
                                  getCategoryIcon(category),
                                  _jsx("h4", {
                                    className: "font-medium capitalize",
                                    children: category,
                                  }),
                                ],
                              }),
                              _jsxs("div", {
                                className: "space-y-2",
                                children: [
                                  _jsxs("div", {
                                    className: "flex justify-between text-sm",
                                    children: [
                                      _jsxs("span", {
                                        children: [
                                          categoryCompliant,
                                          "/",
                                          categoryReqs.length,
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          categoryRate.toFixed(1),
                                          "%",
                                        ],
                                      }),
                                    ],
                                  }),
                                  _jsx(Progress, {
                                    value: categoryRate,
                                    className: "h-2",
                                  }),
                                ],
                              }),
                            ],
                          },
                          category,
                        );
                      }),
                    }),
                  }),
                ],
              }),
              _jsxs(Card, {
                children: [
                  _jsx(CardHeader, {
                    children: _jsx(CardTitle, { children: "Quick Actions" }),
                  }),
                  _jsx(CardContent, {
                    children: _jsxs("div", {
                      className: "grid grid-cols-1 md:grid-cols-4 gap-4",
                      children: [
                        _jsxs(Button, {
                          onClick: () =>
                            handleGenerateReport("self_assessment"),
                          disabled: state.isGenerating,
                          variant: "outline",
                          className:
                            "h-20 flex flex-col items-center justify-center",
                          children: [
                            _jsx(FileText, { className: "w-6 h-6 mb-2" }),
                            _jsx("span", { children: "Generate Assessment" }),
                          ],
                        }),
                        _jsxs(Button, {
                          onClick: () =>
                            setState((prev) => ({
                              ...prev,
                              activeTab: "vulnerabilities",
                            })),
                          variant: "outline",
                          className:
                            "h-20 flex flex-col items-center justify-center",
                          children: [
                            _jsx(AlertTriangle, { className: "w-6 h-6 mb-2" }),
                            _jsx("span", {
                              children: "Review Vulnerabilities",
                            }),
                          ],
                        }),
                        _jsxs(Button, {
                          onClick: () =>
                            setState((prev) => ({
                              ...prev,
                              activeTab: "controls",
                            })),
                          variant: "outline",
                          className:
                            "h-20 flex flex-col items-center justify-center",
                          children: [
                            _jsx(Shield, { className: "w-6 h-6 mb-2" }),
                            _jsx("span", { children: "Test Controls" }),
                          ],
                        }),
                        _jsxs(Button, {
                          onClick: () =>
                            setState((prev) => ({
                              ...prev,
                              activeTab: "reports",
                            })),
                          variant: "outline",
                          className:
                            "h-20 flex flex-col items-center justify-center",
                          children: [
                            _jsx(Download, { className: "w-6 h-6 mb-2" }),
                            _jsx("span", { children: "Export Reports" }),
                          ],
                        }),
                      ],
                    }),
                  }),
                ],
              }),
            ],
          }),
          _jsx(TabsContent, {
            value: "requirements",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsx("h3", {
                      className: "text-lg font-medium",
                      children: "PCI DSS Requirements",
                    }),
                    _jsxs("div", {
                      className: "flex space-x-2",
                      children: [
                        _jsxs("select", {
                          value: state.filterCategory,
                          onChange: (e) =>
                            setState((prev) => ({
                              ...prev,
                              filterCategory: e.target.value,
                            })),
                          className: "px-3 py-1 border rounded-md text-sm",
                          children: [
                            _jsx("option", {
                              value: "all",
                              children: "All Categories",
                            }),
                            _jsx("option", {
                              value: "network",
                              children: "Network Security",
                            }),
                            _jsx("option", {
                              value: "data",
                              children: "Data Protection",
                            }),
                            _jsx("option", {
                              value: "vulnerability",
                              children: "Vulnerability Management",
                            }),
                            _jsx("option", {
                              value: "access",
                              children: "Access Control",
                            }),
                            _jsx("option", {
                              value: "monitoring",
                              children: "Monitoring",
                            }),
                            _jsx("option", {
                              value: "policy",
                              children: "Policy",
                            }),
                          ],
                        }),
                        _jsxs("select", {
                          value: state.filterStatus,
                          onChange: (e) =>
                            setState((prev) => ({
                              ...prev,
                              filterStatus: e.target.value,
                            })),
                          className: "px-3 py-1 border rounded-md text-sm",
                          children: [
                            _jsx("option", {
                              value: "all",
                              children: "All Statuses",
                            }),
                            _jsx("option", {
                              value: "compliant",
                              children: "Compliant",
                            }),
                            _jsx("option", {
                              value: "non_compliant",
                              children: "Non-Compliant",
                            }),
                            _jsx("option", {
                              value: "in_progress",
                              children: "In Progress",
                            }),
                            _jsx("option", {
                              value: "not_applicable",
                              children: "Not Applicable",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: filteredRequirements.map((requirement) =>
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
                                  getCategoryIcon(requirement.category),
                                  _jsxs("div", {
                                    className: "flex-1",
                                    children: [
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-2 mb-2",
                                        children: [
                                          _jsxs("h4", {
                                            className: "font-medium",
                                            children: [
                                              requirement.number,
                                              ": ",
                                              requirement.title,
                                            ],
                                          }),
                                          _jsx(Badge, {
                                            className: getStatusColor(
                                              requirement.status,
                                            ),
                                            children:
                                              requirement.status.replace(
                                                "_",
                                                " ",
                                              ),
                                          }),
                                          requirement.priority === "critical" &&
                                            _jsx(Badge, {
                                              className:
                                                "bg-red-100 text-red-600",
                                              children: "Critical",
                                            }),
                                        ],
                                      }),
                                      _jsx("p", {
                                        className: "text-sm text-gray-600 mb-2",
                                        children: requirement.description,
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-4 text-xs text-gray-500",
                                        children: [
                                          _jsxs("span", {
                                            children: [
                                              "Last Assessed:",
                                              " ",
                                              new Date(
                                                requirement.lastAssessed,
                                              ).toLocaleDateString(),
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Next Assessment:",
                                              " ",
                                              new Date(
                                                requirement.nextAssessment,
                                              ).toLocaleDateString(),
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Evidence: ",
                                              requirement.evidence.length,
                                              " items",
                                            ],
                                          }),
                                        ],
                                      }),
                                      requirement.remediation &&
                                        _jsxs("div", {
                                          className:
                                            "mt-2 p-2 bg-yellow-50 rounded text-sm",
                                          children: [
                                            _jsx("strong", {
                                              children: "Remediation:",
                                            }),
                                            " ",
                                            requirement.remediation,
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
                                        selectedRequirement: requirement,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Eye, { className: "w-3 h-3 mr-1" }),
                                      "Details",
                                    ],
                                  }),
                                  requirement.status !== "compliant" &&
                                    _jsx(Button, {
                                      onClick: () =>
                                        handleRequirementUpdate(
                                          requirement.id,
                                          "in_progress",
                                        ),
                                      disabled: state.isUpdating,
                                      size: "sm",
                                      children: "Update Status",
                                    }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      },
                      requirement.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "controls",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsx("h3", {
                  className: "text-lg font-medium",
                  children: "Security Controls",
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: securityControls.map((control) =>
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
                                        children: control.name,
                                      }),
                                      _jsx(Badge, {
                                        className: control.implemented
                                          ? "bg-green-100 text-green-600"
                                          : "bg-red-100 text-red-600",
                                        children: control.implemented
                                          ? "Implemented"
                                          : "Not Implemented",
                                      }),
                                      _jsx(Badge, {
                                        className: "bg-blue-100 text-blue-600",
                                        children:
                                          control.automationLevel.replace(
                                            "_",
                                            " ",
                                          ),
                                      }),
                                    ],
                                  }),
                                  _jsx("p", {
                                    className: "text-sm text-gray-600 mb-2",
                                    children: control.description,
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
                                                children: "Effectiveness",
                                              }),
                                              _jsxs("span", {
                                                children: [
                                                  control.effectiveness,
                                                  "%",
                                                ],
                                              }),
                                            ],
                                          }),
                                          _jsx(Progress, {
                                            value: control.effectiveness,
                                            className: "h-2",
                                          }),
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "flex items-center space-x-4 text-xs text-gray-500",
                                        children: [
                                          _jsxs("span", {
                                            children: [
                                              "Last Tested:",
                                              " ",
                                              new Date(
                                                control.lastTested,
                                              ).toLocaleDateString(),
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              "Owner: ",
                                              control.owner,
                                            ],
                                          }),
                                        ],
                                      }),
                                      control.testResults &&
                                        _jsxs("div", {
                                          className:
                                            "mt-2 p-2 bg-gray-50 rounded text-sm",
                                          children: [
                                            _jsx("strong", {
                                              children: "Test Results:",
                                            }),
                                            " ",
                                            control.testResults,
                                          ],
                                        }),
                                    ],
                                  }),
                                ],
                              }),
                              _jsx("div", {
                                className: "flex space-x-2",
                                children: _jsxs(Button, {
                                  onClick: () => handleControlTest(control.id),
                                  disabled: state.isTesting,
                                  size: "sm",
                                  variant: "outline",
                                  children: [
                                    _jsx(Settings, {
                                      className: "w-3 h-3 mr-1",
                                    }),
                                    "Test Control",
                                  ],
                                }),
                              }),
                            ],
                          }),
                        }),
                      },
                      control.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "vulnerabilities",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsx("h3", {
                  className: "text-lg font-medium",
                  children: "Vulnerability Management",
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: vulnerabilities.map((vulnerability) =>
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
                                        children: vulnerability.title,
                                      }),
                                      _jsx(Badge, {
                                        className: getSeverityColor(
                                          vulnerability.severity,
                                        ),
                                        children: vulnerability.severity,
                                      }),
                                      _jsx(Badge, {
                                        className:
                                          vulnerability.status === "open"
                                            ? "bg-red-100 text-red-600"
                                            : vulnerability.status ===
                                                "resolved"
                                              ? "bg-green-100 text-green-600"
                                              : "bg-yellow-100 text-yellow-600",
                                        children: vulnerability.status.replace(
                                          "_",
                                          " ",
                                        ),
                                      }),
                                      vulnerability.cvssScore &&
                                        _jsxs(Badge, {
                                          className:
                                            "bg-gray-100 text-gray-600",
                                          children: [
                                            "CVSS: ",
                                            vulnerability.cvssScore,
                                          ],
                                        }),
                                    ],
                                  }),
                                  _jsx("p", {
                                    className: "text-sm text-gray-600 mb-2",
                                    children: vulnerability.description,
                                  }),
                                  _jsxs("div", {
                                    className:
                                      "flex items-center space-x-4 text-xs text-gray-500 mb-2",
                                    children: [
                                      _jsxs("span", {
                                        children: [
                                          "Discovered:",
                                          " ",
                                          new Date(
                                            vulnerability.discoveredAt,
                                          ).toLocaleDateString(),
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Assigned to: ",
                                          vulnerability.assignedTo,
                                        ],
                                      }),
                                      _jsxs("span", {
                                        children: [
                                          "Due:",
                                          " ",
                                          new Date(
                                            vulnerability.dueDate,
                                          ).toLocaleDateString(),
                                        ],
                                      }),
                                    ],
                                  }),
                                  _jsxs("div", {
                                    className: "p-2 bg-blue-50 rounded text-sm",
                                    children: [
                                      _jsx("strong", {
                                        children: "Remediation:",
                                      }),
                                      " ",
                                      vulnerability.remediation,
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
                                        selectedVulnerability: vulnerability,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: [
                                      _jsx(Eye, { className: "w-3 h-3 mr-1" }),
                                      "Details",
                                    ],
                                  }),
                                  vulnerability.status === "open" &&
                                    _jsx(Button, {
                                      onClick: () =>
                                        handleVulnerabilityUpdate(
                                          vulnerability.id,
                                          "in_progress",
                                        ),
                                      disabled: state.isUpdating,
                                      size: "sm",
                                      children: "Start Remediation",
                                    }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      },
                      vulnerability.id,
                    ),
                  ),
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "reports",
            children: _jsxs("div", {
              className: "space-y-6",
              children: [
                _jsxs("div", {
                  className: "flex justify-between items-center",
                  children: [
                    _jsx("h3", {
                      className: "text-lg font-medium",
                      children: "Compliance Reports",
                    }),
                    _jsxs("div", {
                      className: "flex space-x-2",
                      children: [
                        _jsxs(Button, {
                          onClick: () =>
                            handleGenerateReport("self_assessment"),
                          disabled: state.isGenerating,
                          size: "sm",
                          children: [
                            _jsx(FileText, { className: "w-4 h-4 mr-2" }),
                            "Generate Self-Assessment",
                          ],
                        }),
                        _jsxs(Button, {
                          onClick: () =>
                            handleGenerateReport("vulnerability_scan"),
                          disabled: state.isGenerating,
                          size: "sm",
                          variant: "outline",
                          children: [
                            _jsx(AlertTriangle, { className: "w-4 h-4 mr-2" }),
                            "Vulnerability Scan",
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                _jsx("div", {
                  className: "grid gap-4",
                  children: complianceReports.map((report) =>
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
                                  _jsxs("div", {
                                    className:
                                      "flex items-center space-x-2 mb-2",
                                    children: [
                                      _jsx("h4", {
                                        className: "font-medium capitalize",
                                        children: report.type.replace("_", " "),
                                      }),
                                      _jsx(Badge, {
                                        className:
                                          report.status === "final"
                                            ? "bg-green-100 text-green-600"
                                            : report.status === "submitted"
                                              ? "bg-blue-100 text-blue-600"
                                              : "bg-yellow-100 text-yellow-600",
                                        children: report.status,
                                      }),
                                    ],
                                  }),
                                  _jsxs("div", {
                                    className:
                                      "space-y-1 text-sm text-gray-600",
                                    children: [
                                      _jsxs("p", {
                                        children: ["Period: ", report.period],
                                      }),
                                      _jsxs("p", {
                                        children: [
                                          "Generated:",
                                          " ",
                                          new Date(
                                            report.generatedAt,
                                          ).toLocaleDateString(),
                                        ],
                                      }),
                                      _jsxs("p", {
                                        children: [
                                          "Assessor: ",
                                          report.assessor,
                                        ],
                                      }),
                                      _jsxs("p", {
                                        children: [
                                          "Overall Score:",
                                          " ",
                                          _jsxs("span", {
                                            className: "font-medium",
                                            children: [
                                              report.overallScore,
                                              "%",
                                            ],
                                          }),
                                        ],
                                      }),
                                      _jsxs("p", {
                                        children: [
                                          "Findings: ",
                                          report.findings,
                                          " | Recommendations:",
                                          " ",
                                          report.recommendations,
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              _jsx("div", {
                                className: "flex space-x-2",
                                children: _jsxs(Button, {
                                  onClick: () => {
                                    if (onExportReport) {
                                      onExportReport(report.id);
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
        ],
      }),
    ],
  });
}
export default PCIDSSCompliance;

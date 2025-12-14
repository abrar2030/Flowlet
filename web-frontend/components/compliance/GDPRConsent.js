import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Checkbox } from "../ui/checkbox";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import {
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Download,
  Trash2,
  Edit,
  Clock,
  Cookie,
  Database,
  Lock,
  FileText,
  Settings,
} from "lucide-react";
export function GDPRConsent({
  categories = [],
  consentRecords = [],
  dataSubjectRequests = [],
  currentConsents = {},
  onConsentUpdate,
  onConsentWithdraw,
  onDataSubjectRequest,
  onExportData,
  onDeleteData,
  showBanner = false,
  onBannerAccept,
  onBannerReject,
  className = "",
}) {
  const [state, setState] = useState({
    activeTab: "overview",
    showBanner: showBanner,
    bannerConsents: {},
    isUpdating: false,
    isExporting: false,
    isDeleting: false,
    error: null,
    success: null,
    selectedRequest: null,
    newRequestType: "access",
    newRequestDescription: "",
    withdrawalReason: "",
    showWithdrawalDialog: null,
  });
  // Initialize banner consents with required categories
  useEffect(() => {
    const initialConsents = {};
    categories.forEach((category) => {
      initialConsents[category.id] =
        category.required || currentConsents[category.id] || false;
    });
    setState((prev) => ({ ...prev, bannerConsents: initialConsents }));
  }, [categories, currentConsents]);
  // Handle consent update
  const handleConsentUpdate = useCallback(
    async (categoryId, granted) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));
      try {
        if (onConsentUpdate) {
          await onConsentUpdate(categoryId, granted);
          setState((prev) => ({
            ...prev,
            success: `Consent ${granted ? "granted" : "withdrawn"} successfully`,
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to update consent" }));
      } finally {
        setState((prev) => ({ ...prev, isUpdating: false }));
      }
    },
    [onConsentUpdate],
  );
  // Handle consent withdrawal
  const handleConsentWithdraw = useCallback(
    async (categoryId) => {
      setState((prev) => ({ ...prev, isUpdating: true, error: null }));
      try {
        if (onConsentWithdraw) {
          await onConsentWithdraw(categoryId, state.withdrawalReason);
          setState((prev) => ({
            ...prev,
            success: "Consent withdrawn successfully",
            showWithdrawalDialog: null,
            withdrawalReason: "",
          }));
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Failed to withdraw consent" }));
      } finally {
        setState((prev) => ({ ...prev, isUpdating: false }));
      }
    },
    [onConsentWithdraw, state.withdrawalReason],
  );
  // Handle data subject request
  const handleDataSubjectRequest = useCallback(async () => {
    if (!state.newRequestDescription.trim()) {
      setState((prev) => ({
        ...prev,
        error: "Please provide a description for your request",
      }));
      return;
    }
    setState((prev) => ({ ...prev, isUpdating: true, error: null }));
    try {
      if (onDataSubjectRequest) {
        await onDataSubjectRequest({
          userId: "current-user", // This would come from auth context
          type: state.newRequestType,
          description: state.newRequestDescription,
        });
        setState((prev) => ({
          ...prev,
          success: "Data subject request submitted successfully",
          newRequestDescription: "",
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to submit request" }));
    } finally {
      setState((prev) => ({ ...prev, isUpdating: false }));
    }
  }, [onDataSubjectRequest, state.newRequestType, state.newRequestDescription]);
  // Handle data export
  const handleDataExport = useCallback(async () => {
    setState((prev) => ({ ...prev, isExporting: true, error: null }));
    try {
      if (onExportData) {
        const blob = await onExportData();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `personal-data-export-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setState((prev) => ({
          ...prev,
          success: "Data export completed successfully",
        }));
      }
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to export data" }));
    } finally {
      setState((prev) => ({ ...prev, isExporting: false }));
    }
  }, [onExportData]);
  // Handle data deletion
  const handleDataDeletion = useCallback(async () => {
    if (
      !confirm(
        "Are you sure you want to delete all your personal data? This action cannot be undone.",
      )
    ) {
      return;
    }
    setState((prev) => ({ ...prev, isDeleting: true, error: null }));
    try {
      if (onDeleteData) {
        await onDeleteData();
        setState((prev) => ({
          ...prev,
          success: "Data deletion request submitted successfully",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to submit deletion request",
      }));
    } finally {
      setState((prev) => ({ ...prev, isDeleting: false }));
    }
  }, [onDeleteData]);
  // Handle banner accept
  const handleBannerAccept = useCallback(() => {
    if (onBannerAccept) {
      onBannerAccept(state.bannerConsents);
    }
    setState((prev) => ({ ...prev, showBanner: false }));
  }, [onBannerAccept, state.bannerConsents]);
  // Handle banner reject
  const handleBannerReject = useCallback(() => {
    if (onBannerReject) {
      onBannerReject();
    }
    setState((prev) => ({ ...prev, showBanner: false }));
  }, [onBannerReject]);
  const getLegalBasisColor = (basis) => {
    switch (basis) {
      case "consent":
        return "bg-green-100 text-green-600";
      case "legitimate_interest":
        return "bg-blue-100 text-blue-600";
      case "contract":
        return "bg-purple-100 text-purple-600";
      case "legal_obligation":
        return "bg-orange-100 text-orange-600";
      case "vital_interests":
        return "bg-red-100 text-red-600";
      case "public_task":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const getRequestStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-600";
      case "in_progress":
        return "bg-blue-100 text-blue-600";
      case "completed":
        return "bg-green-100 text-green-600";
      case "rejected":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };
  const getRequestTypeIcon = (type) => {
    switch (type) {
      case "access":
        return _jsx(Eye, { className: "w-4 h-4" });
      case "rectification":
        return _jsx(Edit, { className: "w-4 h-4" });
      case "erasure":
        return _jsx(Trash2, { className: "w-4 h-4" });
      case "portability":
        return _jsx(Download, { className: "w-4 h-4" });
      case "restriction":
        return _jsx(Lock, { className: "w-4 h-4" });
      case "objection":
        return _jsx(XCircle, { className: "w-4 h-4" });
      default:
        return _jsx(FileText, { className: "w-4 h-4" });
    }
  };
  const requiredCategories = categories.filter((c) => c.required);
  const optionalCategories = categories.filter((c) => !c.required);
  const grantedConsents = Object.values(currentConsents).filter(Boolean).length;
  return _jsxs("div", {
    className: `space-y-6 ${className}`,
    children: [
      state.showBanner &&
        _jsx("div", {
          className:
            "fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg p-4",
          children: _jsx("div", {
            className: "max-w-6xl mx-auto",
            children: _jsxs("div", {
              className: "flex items-start justify-between space-x-4",
              children: [
                _jsxs("div", {
                  className: "flex-1",
                  children: [
                    _jsxs("div", {
                      className: "flex items-center space-x-2 mb-2",
                      children: [
                        _jsx(Cookie, { className: "w-5 h-5 text-blue-600" }),
                        _jsx("h3", {
                          className: "font-medium",
                          children: "Cookie and Privacy Preferences",
                        }),
                      ],
                    }),
                    _jsx("p", {
                      className: "text-sm text-gray-600 mb-3",
                      children:
                        "We use cookies and similar technologies to provide, protect, and improve our services. You can choose which categories of data processing you consent to.",
                    }),
                    _jsx("div", {
                      className:
                        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4",
                      children: categories.map((category) =>
                        _jsxs(
                          "div",
                          {
                            className: "flex items-center space-x-2",
                            children: [
                              _jsx(Checkbox, {
                                checked: state.bannerConsents[category.id],
                                onCheckedChange: (checked) => {
                                  if (!category.required) {
                                    setState((prev) => ({
                                      ...prev,
                                      bannerConsents: {
                                        ...prev.bannerConsents,
                                        [category.id]: checked,
                                      },
                                    }));
                                  }
                                },
                                disabled: category.required,
                              }),
                              _jsxs("div", {
                                children: [
                                  _jsx("span", {
                                    className: "text-sm font-medium",
                                    children: category.name,
                                  }),
                                  category.required &&
                                    _jsx(Badge, {
                                      className:
                                        "ml-1 text-xs bg-red-100 text-red-600",
                                      children: "Required",
                                    }),
                                  _jsx("p", {
                                    className: "text-xs text-gray-500",
                                    children: category.description,
                                  }),
                                ],
                              }),
                            ],
                          },
                          category.id,
                        ),
                      ),
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "flex space-x-2",
                  children: [
                    _jsx(Button, {
                      onClick: handleBannerReject,
                      variant: "outline",
                      size: "sm",
                      children: "Reject All",
                    }),
                    _jsx(Button, {
                      onClick: handleBannerAccept,
                      size: "sm",
                      children: "Accept Selected",
                    }),
                  ],
                }),
              ],
            }),
          }),
        }),
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
                    "GDPR Compliance & Privacy",
                  ],
                }),
                _jsxs("div", {
                  className: "flex items-center space-x-2",
                  children: [
                    _jsxs(Badge, {
                      className: "bg-blue-100 text-blue-600",
                      children: [
                        _jsx(Database, { className: "w-3 h-3 mr-1" }),
                        grantedConsents,
                        " Consents",
                      ],
                    }),
                    _jsxs(Badge, {
                      className: "bg-green-100 text-green-600",
                      children: [
                        _jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
                        "GDPR Compliant",
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
                "Manage your privacy preferences and exercise your data protection rights under GDPR.",
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
      _jsxs(Tabs, {
        value: state.activeTab,
        onValueChange: (value) =>
          setState((prev) => ({ ...prev, activeTab: value })),
        children: [
          _jsxs(TabsList, {
            className: "grid w-full grid-cols-4",
            children: [
              _jsx(TabsTrigger, { value: "overview", children: "Overview" }),
              _jsx(TabsTrigger, { value: "consents", children: "Consents" }),
              _jsx(TabsTrigger, { value: "rights", children: "Your Rights" }),
              _jsx(TabsTrigger, { value: "requests", children: "Requests" }),
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
                                children: "Total Categories",
                              }),
                              _jsx("p", {
                                className: "text-2xl font-bold",
                                children: categories.length,
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
                                className: "text-sm font-medium text-gray-600",
                                children: "Granted Consents",
                              }),
                              _jsx("p", {
                                className: "text-2xl font-bold text-green-600",
                                children: grantedConsents,
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
                                children: "Consent Records",
                              }),
                              _jsx("p", {
                                className: "text-2xl font-bold",
                                children: consentRecords.length,
                              }),
                            ],
                          }),
                          _jsx(FileText, {
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
                                className: "text-sm font-medium text-gray-600",
                                children: "Active Requests",
                              }),
                              _jsx("p", {
                                className: "text-2xl font-bold text-orange-600",
                                children: dataSubjectRequests.filter(
                                  (r) =>
                                    r.status === "pending" ||
                                    r.status === "in_progress",
                                ).length,
                              }),
                            ],
                          }),
                          _jsx(Clock, { className: "w-8 h-8 text-orange-500" }),
                        ],
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
                      className: "grid grid-cols-1 md:grid-cols-3 gap-4",
                      children: [
                        _jsxs(Button, {
                          onClick: handleDataExport,
                          disabled: state.isExporting,
                          variant: "outline",
                          className:
                            "h-20 flex flex-col items-center justify-center",
                          children: [
                            _jsx(Download, {
                              className: `w-6 h-6 mb-2 ${state.isExporting ? "animate-pulse" : ""}`,
                            }),
                            _jsx("span", { children: "Export My Data" }),
                          ],
                        }),
                        _jsxs(Button, {
                          onClick: () =>
                            setState((prev) => ({
                              ...prev,
                              activeTab: "consents",
                            })),
                          variant: "outline",
                          className:
                            "h-20 flex flex-col items-center justify-center",
                          children: [
                            _jsx(Settings, { className: "w-6 h-6 mb-2" }),
                            _jsx("span", { children: "Manage Consents" }),
                          ],
                        }),
                        _jsxs(Button, {
                          onClick: () =>
                            setState((prev) => ({
                              ...prev,
                              activeTab: "rights",
                            })),
                          variant: "outline",
                          className:
                            "h-20 flex flex-col items-center justify-center",
                          children: [
                            _jsx(Shield, { className: "w-6 h-6 mb-2" }),
                            _jsx("span", { children: "Exercise Rights" }),
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
            value: "consents",
            children: _jsxs("div", {
              className: "space-y-6",
              children: [
                requiredCategories.length > 0 &&
                  _jsxs(Card, {
                    children: [
                      _jsx(CardHeader, {
                        children: _jsxs(CardTitle, {
                          className: "flex items-center",
                          children: [
                            _jsx(Lock, {
                              className: "w-5 h-5 mr-2 text-red-600",
                            }),
                            "Required Data Processing",
                          ],
                        }),
                      }),
                      _jsx(CardContent, {
                        className: "space-y-4",
                        children: requiredCategories.map((category) =>
                          _jsx(
                            "div",
                            {
                              className: "p-4 border rounded-lg bg-red-50",
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
                                            children: category.name,
                                          }),
                                          _jsx(Badge, {
                                            className:
                                              "bg-red-100 text-red-600",
                                            children: "Required",
                                          }),
                                          _jsx(Badge, {
                                            className: getLegalBasisColor(
                                              category.legalBasis,
                                            ),
                                            children:
                                              category.legalBasis.replace(
                                                "_",
                                                " ",
                                              ),
                                          }),
                                        ],
                                      }),
                                      _jsx("p", {
                                        className: "text-sm text-gray-600 mb-2",
                                        children: category.description,
                                      }),
                                      _jsxs("p", {
                                        className: "text-sm text-gray-600 mb-2",
                                        children: [
                                          _jsx("strong", {
                                            children: "Purpose:",
                                          }),
                                          " ",
                                          category.purpose,
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "flex flex-wrap gap-2 text-xs",
                                        children: [
                                          _jsxs("span", {
                                            children: [
                                              _jsx("strong", {
                                                children: "Data Types:",
                                              }),
                                              " ",
                                              category.dataTypes.join(", "),
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              _jsx("strong", {
                                                children: "Retention:",
                                              }),
                                              " ",
                                              category.retentionPeriod,
                                              " days",
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  _jsxs(Badge, {
                                    className: "bg-green-100 text-green-600",
                                    children: [
                                      _jsx(CheckCircle, {
                                        className: "w-3 h-3 mr-1",
                                      }),
                                      "Active",
                                    ],
                                  }),
                                ],
                              }),
                            },
                            category.id,
                          ),
                        ),
                      }),
                    ],
                  }),
                optionalCategories.length > 0 &&
                  _jsxs(Card, {
                    children: [
                      _jsx(CardHeader, {
                        children: _jsxs(CardTitle, {
                          className: "flex items-center",
                          children: [
                            _jsx(Settings, {
                              className: "w-5 h-5 mr-2 text-blue-600",
                            }),
                            "Optional Data Processing",
                          ],
                        }),
                      }),
                      _jsx(CardContent, {
                        className: "space-y-4",
                        children: optionalCategories.map((category) => {
                          const isGranted = currentConsents[category.id];
                          return _jsx(
                            "div",
                            {
                              className: "p-4 border rounded-lg",
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
                                            children: category.name,
                                          }),
                                          _jsx(Badge, {
                                            className: getLegalBasisColor(
                                              category.legalBasis,
                                            ),
                                            children:
                                              category.legalBasis.replace(
                                                "_",
                                                " ",
                                              ),
                                          }),
                                        ],
                                      }),
                                      _jsx("p", {
                                        className: "text-sm text-gray-600 mb-2",
                                        children: category.description,
                                      }),
                                      _jsxs("p", {
                                        className: "text-sm text-gray-600 mb-2",
                                        children: [
                                          _jsx("strong", {
                                            children: "Purpose:",
                                          }),
                                          " ",
                                          category.purpose,
                                        ],
                                      }),
                                      _jsxs("div", {
                                        className:
                                          "flex flex-wrap gap-2 text-xs text-gray-500 mb-3",
                                        children: [
                                          _jsxs("span", {
                                            children: [
                                              _jsx("strong", {
                                                children: "Data Types:",
                                              }),
                                              " ",
                                              category.dataTypes.join(", "),
                                            ],
                                          }),
                                          _jsxs("span", {
                                            children: [
                                              _jsx("strong", {
                                                children: "Retention:",
                                              }),
                                              " ",
                                              category.retentionPeriod,
                                              " days",
                                            ],
                                          }),
                                          category.thirdParties.length > 0 &&
                                            _jsxs("span", {
                                              children: [
                                                _jsx("strong", {
                                                  children: "Third Parties:",
                                                }),
                                                " ",
                                                category.thirdParties.join(
                                                  ", ",
                                                ),
                                              ],
                                            }),
                                          category.transferCountries.length >
                                            0 &&
                                            _jsxs("span", {
                                              children: [
                                                _jsx("strong", {
                                                  children: "Countries:",
                                                }),
                                                " ",
                                                category.transferCountries.join(
                                                  ", ",
                                                ),
                                              ],
                                            }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  _jsxs("div", {
                                    className: "flex items-center space-x-3",
                                    children: [
                                      _jsx(Badge, {
                                        className: isGranted
                                          ? "bg-green-100 text-green-600"
                                          : "bg-gray-100 text-gray-600",
                                        children: isGranted
                                          ? "Granted"
                                          : "Not Granted",
                                      }),
                                      _jsx(Switch, {
                                        checked: isGranted,
                                        onCheckedChange: (checked) =>
                                          handleConsentUpdate(
                                            category.id,
                                            checked,
                                          ),
                                        disabled: state.isUpdating,
                                      }),
                                      isGranted &&
                                        _jsx(Button, {
                                          onClick: () =>
                                            setState((prev) => ({
                                              ...prev,
                                              showWithdrawalDialog: category.id,
                                            })),
                                          size: "sm",
                                          variant: "outline",
                                          children: "Withdraw",
                                        }),
                                    ],
                                  }),
                                ],
                              }),
                            },
                            category.id,
                          );
                        }),
                      }),
                    ],
                  }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "rights",
            children: _jsxs("div", {
              className: "space-y-6",
              children: [
                _jsxs(Card, {
                  children: [
                    _jsx(CardHeader, {
                      children: _jsx(CardTitle, {
                        children: "Your Data Protection Rights",
                      }),
                    }),
                    _jsxs(CardContent, {
                      children: [
                        _jsx("p", {
                          className: "text-sm text-gray-600 mb-4",
                          children:
                            "Under GDPR, you have several rights regarding your personal data. You can exercise these rights by submitting a request below.",
                        }),
                        _jsxs("div", {
                          className: "grid grid-cols-1 md:grid-cols-2 gap-4",
                          children: [
                            _jsxs("div", {
                              className: "space-y-4",
                              children: [
                                _jsxs("div", {
                                  className: "p-4 border rounded-lg",
                                  children: [
                                    _jsxs("div", {
                                      className:
                                        "flex items-center space-x-2 mb-2",
                                      children: [
                                        _jsx(Eye, {
                                          className: "w-5 h-5 text-blue-600",
                                        }),
                                        _jsx("h4", {
                                          className: "font-medium",
                                          children: "Right of Access",
                                        }),
                                      ],
                                    }),
                                    _jsx("p", {
                                      className: "text-sm text-gray-600",
                                      children:
                                        "Request a copy of all personal data we hold about you.",
                                    }),
                                  ],
                                }),
                                _jsxs("div", {
                                  className: "p-4 border rounded-lg",
                                  children: [
                                    _jsxs("div", {
                                      className:
                                        "flex items-center space-x-2 mb-2",
                                      children: [
                                        _jsx(Edit, {
                                          className: "w-5 h-5 text-green-600",
                                        }),
                                        _jsx("h4", {
                                          className: "font-medium",
                                          children: "Right to Rectification",
                                        }),
                                      ],
                                    }),
                                    _jsx("p", {
                                      className: "text-sm text-gray-600",
                                      children:
                                        "Request correction of inaccurate or incomplete personal data.",
                                    }),
                                  ],
                                }),
                                _jsxs("div", {
                                  className: "p-4 border rounded-lg",
                                  children: [
                                    _jsxs("div", {
                                      className:
                                        "flex items-center space-x-2 mb-2",
                                      children: [
                                        _jsx(Trash2, {
                                          className: "w-5 h-5 text-red-600",
                                        }),
                                        _jsx("h4", {
                                          className: "font-medium",
                                          children: "Right to Erasure",
                                        }),
                                      ],
                                    }),
                                    _jsx("p", {
                                      className: "text-sm text-gray-600",
                                      children:
                                        "Request deletion of your personal data (right to be forgotten).",
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            _jsxs("div", {
                              className: "space-y-4",
                              children: [
                                _jsxs("div", {
                                  className: "p-4 border rounded-lg",
                                  children: [
                                    _jsxs("div", {
                                      className:
                                        "flex items-center space-x-2 mb-2",
                                      children: [
                                        _jsx(Download, {
                                          className: "w-5 h-5 text-purple-600",
                                        }),
                                        _jsx("h4", {
                                          className: "font-medium",
                                          children: "Right to Data Portability",
                                        }),
                                      ],
                                    }),
                                    _jsx("p", {
                                      className: "text-sm text-gray-600",
                                      children:
                                        "Receive your personal data in a structured, machine-readable format.",
                                    }),
                                  ],
                                }),
                                _jsxs("div", {
                                  className: "p-4 border rounded-lg",
                                  children: [
                                    _jsxs("div", {
                                      className:
                                        "flex items-center space-x-2 mb-2",
                                      children: [
                                        _jsx(Lock, {
                                          className: "w-5 h-5 text-orange-600",
                                        }),
                                        _jsx("h4", {
                                          className: "font-medium",
                                          children: "Right to Restriction",
                                        }),
                                      ],
                                    }),
                                    _jsx("p", {
                                      className: "text-sm text-gray-600",
                                      children:
                                        "Request restriction of processing of your personal data.",
                                    }),
                                  ],
                                }),
                                _jsxs("div", {
                                  className: "p-4 border rounded-lg",
                                  children: [
                                    _jsxs("div", {
                                      className:
                                        "flex items-center space-x-2 mb-2",
                                      children: [
                                        _jsx(XCircle, {
                                          className: "w-5 h-5 text-gray-600",
                                        }),
                                        _jsx("h4", {
                                          className: "font-medium",
                                          children: "Right to Object",
                                        }),
                                      ],
                                    }),
                                    _jsx("p", {
                                      className: "text-sm text-gray-600",
                                      children:
                                        "Object to processing of your personal data for specific purposes.",
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        _jsxs("div", {
                          className: "mt-6 p-4 bg-blue-50 rounded-lg",
                          children: [
                            _jsx("h4", {
                              className: "font-medium mb-2",
                              children: "Quick Actions",
                            }),
                            _jsxs("div", {
                              className: "flex space-x-2",
                              children: [
                                _jsxs(Button, {
                                  onClick: handleDataExport,
                                  disabled: state.isExporting,
                                  size: "sm",
                                  children: [
                                    _jsx(Download, {
                                      className: "w-4 h-4 mr-2",
                                    }),
                                    "Export My Data",
                                  ],
                                }),
                                _jsxs(Button, {
                                  onClick: handleDataDeletion,
                                  disabled: state.isDeleting,
                                  size: "sm",
                                  variant: "destructive",
                                  children: [
                                    _jsx(Trash2, { className: "w-4 h-4 mr-2" }),
                                    "Delete My Data",
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
                _jsxs(Card, {
                  children: [
                    _jsx(CardHeader, {
                      children: _jsx(CardTitle, {
                        children: "Submit Data Subject Request",
                      }),
                    }),
                    _jsxs(CardContent, {
                      className: "space-y-4",
                      children: [
                        _jsxs("div", {
                          children: [
                            _jsx(Label, { children: "Request Type" }),
                            _jsxs("select", {
                              value: state.newRequestType,
                              onChange: (e) =>
                                setState((prev) => ({
                                  ...prev,
                                  newRequestType: e.target.value,
                                })),
                              className: "w-full mt-1 p-2 border rounded-md",
                              children: [
                                _jsx("option", {
                                  value: "access",
                                  children: "Right of Access",
                                }),
                                _jsx("option", {
                                  value: "rectification",
                                  children: "Right to Rectification",
                                }),
                                _jsx("option", {
                                  value: "erasure",
                                  children: "Right to Erasure",
                                }),
                                _jsx("option", {
                                  value: "portability",
                                  children: "Right to Data Portability",
                                }),
                                _jsx("option", {
                                  value: "restriction",
                                  children: "Right to Restriction",
                                }),
                                _jsx("option", {
                                  value: "objection",
                                  children: "Right to Object",
                                }),
                              ],
                            }),
                          ],
                        }),
                        _jsxs("div", {
                          children: [
                            _jsx(Label, { children: "Description" }),
                            _jsx(Textarea, {
                              value: state.newRequestDescription,
                              onChange: (e) =>
                                setState((prev) => ({
                                  ...prev,
                                  newRequestDescription: e.target.value,
                                })),
                              placeholder:
                                "Please describe your request in detail...",
                              className: "mt-1",
                              rows: 4,
                            }),
                          ],
                        }),
                        _jsx(Button, {
                          onClick: handleDataSubjectRequest,
                          disabled:
                            state.isUpdating ||
                            !state.newRequestDescription.trim(),
                          children: "Submit Request",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "requests",
            children: _jsxs("div", {
              className: "space-y-4",
              children: [
                _jsx("h3", {
                  className: "text-lg font-medium",
                  children: "Your Data Subject Requests",
                }),
                dataSubjectRequests.length === 0
                  ? _jsx(Card, {
                      children: _jsxs(CardContent, {
                        className: "p-6 text-center",
                        children: [
                          _jsx(FileText, {
                            className: "w-12 h-12 mx-auto mb-4 text-gray-400",
                          }),
                          _jsx("h3", {
                            className: "text-lg font-medium text-gray-900 mb-2",
                            children: "No Requests",
                          }),
                          _jsx("p", {
                            className: "text-sm text-gray-600",
                            children:
                              "You haven't submitted any data subject requests yet.",
                          }),
                        ],
                      }),
                    })
                  : _jsx("div", {
                      className: "grid gap-4",
                      children: dataSubjectRequests.map((request) =>
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
                                      getRequestTypeIcon(request.type),
                                      _jsxs("div", {
                                        children: [
                                          _jsxs("h4", {
                                            className: "font-medium capitalize",
                                            children: [
                                              request.type.replace("_", " "),
                                              " Request",
                                            ],
                                          }),
                                          _jsx("p", {
                                            className:
                                              "text-sm text-gray-600 mt-1",
                                            children: request.description,
                                          }),
                                          _jsxs("div", {
                                            className:
                                              "flex items-center space-x-2 mt-2",
                                            children: [
                                              _jsx(Badge, {
                                                className:
                                                  getRequestStatusColor(
                                                    request.status,
                                                  ),
                                                children:
                                                  request.status.replace(
                                                    "_",
                                                    " ",
                                                  ),
                                              }),
                                              _jsxs("span", {
                                                className:
                                                  "text-xs text-gray-500",
                                                children: [
                                                  "Submitted:",
                                                  " ",
                                                  new Date(
                                                    request.requestedAt,
                                                  ).toLocaleDateString(),
                                                ],
                                              }),
                                              request.completedAt &&
                                                _jsxs("span", {
                                                  className:
                                                    "text-xs text-gray-500",
                                                  children: [
                                                    "Completed:",
                                                    " ",
                                                    new Date(
                                                      request.completedAt,
                                                    ).toLocaleDateString(),
                                                  ],
                                                }),
                                            ],
                                          }),
                                          request.response &&
                                            _jsxs("div", {
                                              className:
                                                "mt-2 p-2 bg-gray-50 rounded text-sm",
                                              children: [
                                                _jsx("strong", {
                                                  children: "Response:",
                                                }),
                                                " ",
                                                request.response,
                                              ],
                                            }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  _jsx(Button, {
                                    onClick: () =>
                                      setState((prev) => ({
                                        ...prev,
                                        selectedRequest: request,
                                      })),
                                    size: "sm",
                                    variant: "outline",
                                    children: "View Details",
                                  }),
                                ],
                              }),
                            }),
                          },
                          request.id,
                        ),
                      ),
                    }),
              ],
            }),
          }),
        ],
      }),
      state.showWithdrawalDialog &&
        _jsx("div", {
          className:
            "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
          children: _jsxs(Card, {
            className: "w-full max-w-md",
            children: [
              _jsx(CardHeader, {
                children: _jsx(CardTitle, { children: "Withdraw Consent" }),
              }),
              _jsxs(CardContent, {
                className: "space-y-4",
                children: [
                  _jsx("p", {
                    className: "text-sm text-gray-600",
                    children:
                      "Please provide a reason for withdrawing your consent (optional):",
                  }),
                  _jsx(Textarea, {
                    value: state.withdrawalReason,
                    onChange: (e) =>
                      setState((prev) => ({
                        ...prev,
                        withdrawalReason: e.target.value,
                      })),
                    placeholder: "Reason for withdrawal...",
                    rows: 3,
                  }),
                  _jsxs("div", {
                    className: "flex space-x-2",
                    children: [
                      _jsx(Button, {
                        onClick: () =>
                          handleConsentWithdraw(state.showWithdrawalDialog),
                        disabled: state.isUpdating,
                        children: "Withdraw Consent",
                      }),
                      _jsx(Button, {
                        onClick: () =>
                          setState((prev) => ({
                            ...prev,
                            showWithdrawalDialog: null,
                            withdrawalReason: "",
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
export default GDPRConsent;

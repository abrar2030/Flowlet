import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Progress } from "../ui/progress";
import {
  Shield,
  Smartphone,
  Key,
  QrCode,
  CheckCircle,
  AlertTriangle,
  Copy,
  RefreshCw,
  Download,
  Fingerprint,
  Mail,
} from "lucide-react";
export function MFASetup({
  currentMethods = [],
  onMethodEnable,
  onMethodDisable,
  onMethodVerify,
  onGenerateBackupCodes,
  onDownloadBackupCodes,
  requireMultipleMethods = true,
  className = "",
}) {
  const [state, setState] = useState({
    activeTab: "overview",
    isLoading: false,
    error: null,
    success: null,
    totpSecret: null,
    totpQrCode: null,
    verificationCode: "",
    backupCodes: [],
    phoneNumber: "",
    emailAddress: "",
    biometricSupported: false,
    setupProgress: 0,
  });
  // Check biometric support
  useEffect(() => {
    const checkBiometricSupport = async () => {
      if ("credentials" in navigator && "create" in navigator.credentials) {
        try {
          const available = await navigator.credentials.get({
            publicKey: {
              challenge: new Uint8Array(32),
              rp: { name: "Test" },
              user: {
                id: new Uint8Array(16),
                name: "test",
                displayName: "Test",
              },
              pubKeyCredParams: [{ alg: -7, type: "public-key" }],
              timeout: 1000,
            },
          });
          setState((prev) => ({ ...prev, biometricSupported: true }));
        } catch (error) {
          // Biometric not available or user cancelled
          setState((prev) => ({ ...prev, biometricSupported: false }));
        }
      }
    };
    checkBiometricSupport();
  }, []);
  // Calculate setup progress
  useEffect(() => {
    const enabledMethods = currentMethods.filter(
      (m) => m.enabled && m.verified,
    );
    const totalMethods = 4; // TOTP, SMS, Email, Backup Codes
    const progress = (enabledMethods.length / totalMethods) * 100;
    setState((prev) => ({ ...prev, setupProgress: Math.min(100, progress) }));
  }, [currentMethods]);
  const handleMethodToggle = useCallback(
    async (method) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        if (method.enabled) {
          if (onMethodDisable) {
            await onMethodDisable(method.id);
            setState((prev) => ({
              ...prev,
              success: `${method.name} disabled successfully`,
            }));
          }
        } else {
          if (onMethodEnable) {
            await onMethodEnable(method);
            setState((prev) => ({
              ...prev,
              success: `${method.name} enabled successfully`,
            }));
          }
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: `Failed to ${method.enabled ? "disable" : "enable"} ${method.name}`,
        }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [onMethodEnable, onMethodDisable],
  );
  const handleVerification = useCallback(
    async (methodId) => {
      if (!state.verificationCode.trim()) {
        setState((prev) => ({
          ...prev,
          error: "Please enter verification code",
        }));
        return;
      }
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        if (onMethodVerify) {
          const success = await onMethodVerify(
            methodId,
            state.verificationCode,
          );
          if (success) {
            setState((prev) => ({
              ...prev,
              success: "Method verified successfully",
              verificationCode: "",
            }));
          } else {
            setState((prev) => ({
              ...prev,
              error: "Invalid verification code",
            }));
          }
        }
      } catch (error) {
        setState((prev) => ({ ...prev, error: "Verification failed" }));
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [state.verificationCode, onMethodVerify],
  );
  const handleGenerateBackupCodes = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      if (onGenerateBackupCodes) {
        const codes = await onGenerateBackupCodes();
        setState((prev) => ({
          ...prev,
          backupCodes: codes,
          success: "Backup codes generated successfully",
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to generate backup codes",
      }));
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [onGenerateBackupCodes]);
  const handleDownloadBackupCodes = useCallback(() => {
    if (onDownloadBackupCodes && state.backupCodes.length > 0) {
      onDownloadBackupCodes(state.backupCodes);
    }
  }, [onDownloadBackupCodes, state.backupCodes]);
  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setState((prev) => ({ ...prev, success: "Copied to clipboard" }));
    } catch (error) {
      setState((prev) => ({ ...prev, error: "Failed to copy to clipboard" }));
    }
  }, []);
  const getMethodIcon = (type) => {
    switch (type) {
      case "totp":
        return _jsx(Key, { className: "w-5 h-5" });
      case "sms":
        return _jsx(Smartphone, { className: "w-5 h-5" });
      case "email":
        return _jsx(Mail, { className: "w-5 h-5" });
      case "backup_codes":
        return _jsx(Download, { className: "w-5 h-5" });
      case "biometric":
        return _jsx(Fingerprint, { className: "w-5 h-5" });
      default:
        return _jsx(Shield, { className: "w-5 h-5" });
    }
  };
  const getMethodStatus = (method) => {
    if (!method.enabled)
      return { color: "bg-gray-100 text-gray-600", text: "Disabled" };
    if (!method.verified)
      return { color: "bg-yellow-100 text-yellow-600", text: "Pending" };
    return { color: "bg-green-100 text-green-600", text: "Active" };
  };
  const enabledMethods = currentMethods.filter((m) => m.enabled && m.verified);
  const isSecure = enabledMethods.length >= (requireMultipleMethods ? 2 : 1);
  return _jsxs("div", {
    className: `max-w-4xl mx-auto space-y-6 ${className}`,
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
                    "Multi-Factor Authentication Setup",
                  ],
                }),
                _jsx(Badge, {
                  className: isSecure
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600",
                  children: isSecure
                    ? _jsxs(_Fragment, {
                        children: [
                          _jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
                          "Secure",
                        ],
                      })
                    : _jsxs(_Fragment, {
                        children: [
                          _jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }),
                          "Needs Setup",
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
                        _jsx("span", { children: "Setup Progress" }),
                        _jsxs("span", {
                          children: [Math.round(state.setupProgress), "%"],
                        }),
                      ],
                    }),
                    _jsx(Progress, {
                      value: state.setupProgress,
                      className: "h-2",
                    }),
                  ],
                }),
                _jsxs("p", {
                  className: "text-sm text-gray-600",
                  children: [
                    "Multi-factor authentication adds an extra layer of security to your account.",
                    requireMultipleMethods &&
                      " We recommend enabling at least two methods.",
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
      _jsxs(Tabs, {
        value: state.activeTab,
        onValueChange: (value) =>
          setState((prev) => ({ ...prev, activeTab: value })),
        children: [
          _jsxs(TabsList, {
            className: "grid w-full grid-cols-5",
            children: [
              _jsx(TabsTrigger, { value: "overview", children: "Overview" }),
              _jsx(TabsTrigger, { value: "totp", children: "Authenticator" }),
              _jsx(TabsTrigger, { value: "sms", children: "SMS" }),
              _jsx(TabsTrigger, { value: "email", children: "Email" }),
              _jsx(TabsTrigger, { value: "backup", children: "Backup" }),
            ],
          }),
          _jsx(TabsContent, {
            value: "overview",
            children: _jsx("div", {
              className: "grid gap-4",
              children: currentMethods.map((method) => {
                const status = getMethodStatus(method);
                return _jsx(
                  Card,
                  {
                    children: _jsx(CardContent, {
                      className: "p-4",
                      children: _jsxs("div", {
                        className: "flex items-center justify-between",
                        children: [
                          _jsxs("div", {
                            className: "flex items-center space-x-3",
                            children: [
                              getMethodIcon(method.type),
                              _jsxs("div", {
                                children: [
                                  _jsx("h3", {
                                    className: "font-medium",
                                    children: method.name,
                                  }),
                                  _jsx("p", {
                                    className: "text-sm text-gray-600",
                                    children: method.description,
                                  }),
                                  method.lastUsed &&
                                    _jsxs("p", {
                                      className: "text-xs text-gray-500",
                                      children: [
                                        "Last used:",
                                        " ",
                                        new Date(
                                          method.lastUsed,
                                        ).toLocaleString(),
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
                                className: status.color,
                                children: status.text,
                              }),
                              _jsx(Button, {
                                onClick: () => handleMethodToggle(method),
                                disabled: state.isLoading,
                                size: "sm",
                                variant: method.enabled
                                  ? "destructive"
                                  : "default",
                                children: method.enabled ? "Disable" : "Enable",
                              }),
                            ],
                          }),
                        ],
                      }),
                    }),
                  },
                  method.id,
                );
              }),
            }),
          }),
          _jsx(TabsContent, {
            value: "totp",
            children: _jsxs(Card, {
              children: [
                _jsx(CardHeader, {
                  children: _jsxs(CardTitle, {
                    className: "flex items-center",
                    children: [
                      _jsx(Key, { className: "w-5 h-5 mr-2" }),
                      "Authenticator App",
                    ],
                  }),
                }),
                _jsxs(CardContent, {
                  className: "space-y-4",
                  children: [
                    _jsx("p", {
                      className: "text-sm text-gray-600",
                      children:
                        "Use an authenticator app like Google Authenticator, Authy, or 1Password to generate time-based codes.",
                    }),
                    state.totpQrCode &&
                      _jsxs("div", {
                        className: "space-y-4",
                        children: [
                          _jsx("div", {
                            className: "flex justify-center",
                            children: _jsxs("div", {
                              className: "p-4 bg-white border rounded-lg",
                              children: [
                                _jsx(QrCode, {
                                  className: "w-32 h-32 text-gray-400",
                                }),
                                _jsx("p", {
                                  className: "text-xs text-center mt-2",
                                  children: "QR Code Placeholder",
                                }),
                              ],
                            }),
                          }),
                          _jsxs("div", {
                            children: [
                              _jsx(Label, { children: "Manual Entry Key" }),
                              _jsxs("div", {
                                className: "flex space-x-2 mt-1",
                                children: [
                                  _jsx(Input, {
                                    value: state.totpSecret || "",
                                    readOnly: true,
                                    className: "font-mono text-sm",
                                  }),
                                  _jsx(Button, {
                                    onClick: () =>
                                      copyToClipboard(state.totpSecret || ""),
                                    size: "sm",
                                    variant: "outline",
                                    children: _jsx(Copy, {
                                      className: "w-4 h-4",
                                    }),
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    _jsxs("div", {
                      className: "space-y-2",
                      children: [
                        _jsx(Label, { children: "Verification Code" }),
                        _jsxs("div", {
                          className: "flex space-x-2",
                          children: [
                            _jsx(Input, {
                              value: state.verificationCode,
                              onChange: (e) =>
                                setState((prev) => ({
                                  ...prev,
                                  verificationCode: e.target.value,
                                })),
                              placeholder: "Enter 6-digit code",
                              maxLength: 6,
                              className: "font-mono",
                            }),
                            _jsx(Button, {
                              onClick: () => handleVerification("totp"),
                              disabled:
                                state.isLoading || !state.verificationCode,
                              children: "Verify",
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
          _jsx(TabsContent, {
            value: "sms",
            children: _jsxs(Card, {
              children: [
                _jsx(CardHeader, {
                  children: _jsxs(CardTitle, {
                    className: "flex items-center",
                    children: [
                      _jsx(Smartphone, { className: "w-5 h-5 mr-2" }),
                      "SMS Authentication",
                    ],
                  }),
                }),
                _jsxs(CardContent, {
                  className: "space-y-4",
                  children: [
                    _jsx("p", {
                      className: "text-sm text-gray-600",
                      children:
                        "Receive verification codes via SMS to your mobile phone.",
                    }),
                    _jsxs("div", {
                      className: "space-y-2",
                      children: [
                        _jsx(Label, { children: "Phone Number" }),
                        _jsx(Input, {
                          value: state.phoneNumber,
                          onChange: (e) =>
                            setState((prev) => ({
                              ...prev,
                              phoneNumber: e.target.value,
                            })),
                          placeholder: "+1 (555) 123-4567",
                          type: "tel",
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "space-y-2",
                      children: [
                        _jsx(Label, { children: "Verification Code" }),
                        _jsxs("div", {
                          className: "flex space-x-2",
                          children: [
                            _jsx(Input, {
                              value: state.verificationCode,
                              onChange: (e) =>
                                setState((prev) => ({
                                  ...prev,
                                  verificationCode: e.target.value,
                                })),
                              placeholder: "Enter code from SMS",
                              maxLength: 6,
                              className: "font-mono",
                            }),
                            _jsx(Button, {
                              onClick: () => handleVerification("sms"),
                              disabled:
                                state.isLoading || !state.verificationCode,
                              children: "Verify",
                            }),
                          ],
                        }),
                      ],
                    }),
                    _jsx(Button, {
                      onClick: () => {
                        /* Send SMS code */
                      },
                      disabled: state.isLoading || !state.phoneNumber,
                      variant: "outline",
                      className: "w-full",
                      children: "Send Verification Code",
                    }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "email",
            children: _jsxs(Card, {
              children: [
                _jsx(CardHeader, {
                  children: _jsxs(CardTitle, {
                    className: "flex items-center",
                    children: [
                      _jsx(Mail, { className: "w-5 h-5 mr-2" }),
                      "Email Authentication",
                    ],
                  }),
                }),
                _jsxs(CardContent, {
                  className: "space-y-4",
                  children: [
                    _jsx("p", {
                      className: "text-sm text-gray-600",
                      children:
                        "Receive verification codes via email as a backup method.",
                    }),
                    _jsxs("div", {
                      className: "space-y-2",
                      children: [
                        _jsx(Label, { children: "Email Address" }),
                        _jsx(Input, {
                          value: state.emailAddress,
                          onChange: (e) =>
                            setState((prev) => ({
                              ...prev,
                              emailAddress: e.target.value,
                            })),
                          placeholder: "your.email@example.com",
                          type: "email",
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "space-y-2",
                      children: [
                        _jsx(Label, { children: "Verification Code" }),
                        _jsxs("div", {
                          className: "flex space-x-2",
                          children: [
                            _jsx(Input, {
                              value: state.verificationCode,
                              onChange: (e) =>
                                setState((prev) => ({
                                  ...prev,
                                  verificationCode: e.target.value,
                                })),
                              placeholder: "Enter code from email",
                              maxLength: 6,
                              className: "font-mono",
                            }),
                            _jsx(Button, {
                              onClick: () => handleVerification("email"),
                              disabled:
                                state.isLoading || !state.verificationCode,
                              children: "Verify",
                            }),
                          ],
                        }),
                      ],
                    }),
                    _jsx(Button, {
                      onClick: () => {
                        /* Send email code */
                      },
                      disabled: state.isLoading || !state.emailAddress,
                      variant: "outline",
                      className: "w-full",
                      children: "Send Verification Code",
                    }),
                  ],
                }),
              ],
            }),
          }),
          _jsx(TabsContent, {
            value: "backup",
            children: _jsxs(Card, {
              children: [
                _jsx(CardHeader, {
                  children: _jsxs(CardTitle, {
                    className: "flex items-center",
                    children: [
                      _jsx(Download, { className: "w-5 h-5 mr-2" }),
                      "Backup Codes",
                    ],
                  }),
                }),
                _jsxs(CardContent, {
                  className: "space-y-4",
                  children: [
                    _jsx("p", {
                      className: "text-sm text-gray-600",
                      children:
                        "Backup codes can be used when your other MFA methods are unavailable. Each code can only be used once.",
                    }),
                    state.backupCodes.length > 0
                      ? _jsxs("div", {
                          className: "space-y-4",
                          children: [
                            _jsx("div", {
                              className:
                                "grid grid-cols-2 gap-2 p-4 bg-gray-50 rounded-lg",
                              children: state.backupCodes.map((code, index) =>
                                _jsx(
                                  "div",
                                  {
                                    className:
                                      "font-mono text-sm p-2 bg-white rounded border",
                                    children: code,
                                  },
                                  index,
                                ),
                              ),
                            }),
                            _jsxs("div", {
                              className: "flex space-x-2",
                              children: [
                                _jsxs(Button, {
                                  onClick: handleDownloadBackupCodes,
                                  variant: "outline",
                                  className: "flex-1",
                                  children: [
                                    _jsx(Download, {
                                      className: "w-4 h-4 mr-2",
                                    }),
                                    "Download",
                                  ],
                                }),
                                _jsxs(Button, {
                                  onClick: () =>
                                    copyToClipboard(
                                      state.backupCodes.join("\n"),
                                    ),
                                  variant: "outline",
                                  className: "flex-1",
                                  children: [
                                    _jsx(Copy, { className: "w-4 h-4 mr-2" }),
                                    "Copy All",
                                  ],
                                }),
                              ],
                            }),
                            _jsxs(Alert, {
                              className: "border-amber-200 bg-amber-50",
                              children: [
                                _jsx(AlertTriangle, {
                                  className: "h-4 w-4 text-amber-600",
                                }),
                                _jsx(AlertDescription, {
                                  className: "text-amber-800",
                                  children:
                                    "Store these codes in a safe place. They won't be shown again.",
                                }),
                              ],
                            }),
                          ],
                        })
                      : _jsxs(Button, {
                          onClick: handleGenerateBackupCodes,
                          disabled: state.isLoading,
                          className: "w-full",
                          children: [
                            _jsx(RefreshCw, {
                              className: `w-4 h-4 mr-2 ${state.isLoading ? "animate-spin" : ""}`,
                            }),
                            "Generate Backup Codes",
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
  });
}
export default MFASetup;

import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { EncryptionService } from "../../lib/security/encryption";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import {
  Eye,
  EyeOff,
  Shield,
  Lock,
  Unlock,
  Copy,
  CheckCircle,
  AlertTriangle,
  Clock,
  Key,
} from "lucide-react";
export function EncryptedDisplay({
  data,
  label,
  type = "text",
  maskPattern,
  allowDecryption = true,
  autoHideDelay = 30000, // 30 seconds
  showMetadata = false,
  onDecrypt,
  onCopy,
  className = "",
}) {
  const [state, setState] = useState({
    isDecrypted: false,
    decryptedData: null,
    isDecrypting: false,
    error: null,
    showCopied: false,
    autoHideTimer: null,
  });
  // Parse encrypted data
  const encryptedData = typeof data === "string" ? JSON.parse(data) : data;
  // Clear auto-hide timer on unmount
  useEffect(() => {
    return () => {
      if (state.autoHideTimer) {
        clearTimeout(state.autoHideTimer);
      }
    };
  }, [state.autoHideTimer]);
  const handleDecrypt = useCallback(async () => {
    if (!allowDecryption) return;
    setState((prev) => ({ ...prev, isDecrypting: true, error: null }));
    try {
      const decrypted = EncryptionService.decrypt(encryptedData);
      setState((prev) => ({
        ...prev,
        isDecrypted: true,
        decryptedData: decrypted,
        isDecrypting: false,
      }));
      // Set auto-hide timer
      if (autoHideDelay > 0) {
        const timer = setTimeout(() => {
          setState((prev) => ({
            ...prev,
            isDecrypted: false,
            decryptedData: null,
            autoHideTimer: null,
          }));
        }, autoHideDelay);
        setState((prev) => ({ ...prev, autoHideTimer: timer }));
      }
      if (onDecrypt) {
        onDecrypt(decrypted);
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: "Failed to decrypt data",
        isDecrypting: false,
      }));
    }
  }, [encryptedData, allowDecryption, autoHideDelay, onDecrypt]);
  const handleHide = useCallback(() => {
    if (state.autoHideTimer) {
      clearTimeout(state.autoHideTimer);
    }
    setState((prev) => ({
      ...prev,
      isDecrypted: false,
      decryptedData: null,
      autoHideTimer: null,
    }));
  }, [state.autoHideTimer]);
  const handleCopy = useCallback(
    async (dataToCopy) => {
      try {
        await navigator.clipboard.writeText(dataToCopy);
        setState((prev) => ({ ...prev, showCopied: true }));
        setTimeout(() => {
          setState((prev) => ({ ...prev, showCopied: false }));
        }, 2000);
        if (onCopy) {
          onCopy(dataToCopy);
        }
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
      }
    },
    [onCopy],
  );
  const getMaskedDisplay = useCallback(
    (decryptedData) => {
      if (!decryptedData) return "";
      switch (type) {
        case "email":
          const [localPart, domain] = decryptedData.split("@");
          if (localPart && domain) {
            const maskedLocal =
              localPart.length > 2
                ? localPart[0] +
                  "*".repeat(localPart.length - 2) +
                  localPart.slice(-1)
                : "*".repeat(localPart.length);
            return `${maskedLocal}@${domain}`;
          }
          return decryptedData;
        case "phone":
          const digits = decryptedData.replace(/\D/g, "");
          if (digits.length === 10) {
            return `(***) ***-${digits.slice(-4)}`;
          }
          return `***-***-${digits.slice(-4)}`;
        case "ssn":
          const ssnDigits = decryptedData.replace(/\D/g, "");
          return `***-**-${ssnDigits.slice(-4)}`;
        case "card":
          const cardDigits = decryptedData.replace(/\D/g, "");
          return `**** **** **** ${cardDigits.slice(-4)}`;
        case "custom":
          if (maskPattern) {
            return maskPattern.replace(/\*/g, () => "*");
          }
          return (
            "*".repeat(Math.max(4, decryptedData.length - 4)) +
            decryptedData.slice(-4)
          );
        default:
          return decryptedData.length > 8
            ? "*".repeat(decryptedData.length - 4) + decryptedData.slice(-4)
            : "*".repeat(decryptedData.length);
      }
    },
    [type, maskPattern],
  );
  const getTypeIcon = () => {
    switch (type) {
      case "email":
        return "📧";
      case "phone":
        return "📱";
      case "ssn":
        return "🆔";
      case "card":
        return "💳";
      default:
        return "🔒";
    }
  };
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleString();
  };
  return _jsxs(Card, {
    className: `w-full max-w-md ${className}`,
    children: [
      _jsx(CardHeader, {
        className: "pb-3",
        children: _jsxs(CardTitle, {
          className: "flex items-center justify-between text-sm",
          children: [
            _jsxs("span", {
              className: "flex items-center",
              children: [
                _jsx(Shield, { className: "w-4 h-4 mr-2 text-blue-600" }),
                label || "Encrypted Data",
                _jsx("span", { className: "ml-2", children: getTypeIcon() }),
              ],
            }),
            _jsxs(Badge, {
              variant: "secondary",
              className: "text-xs",
              children: [
                _jsx(Lock, { className: "w-3 h-3 mr-1" }),
                "Encrypted",
              ],
            }),
          ],
        }),
      }),
      _jsxs(CardContent, {
        className: "space-y-4",
        children: [
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
          _jsxs("div", {
            className: "space-y-3",
            children: [
              _jsxs("div", {
                className: "p-3 bg-gray-50 rounded-md border",
                children: [
                  _jsxs("div", {
                    className: "flex items-center justify-between mb-2",
                    children: [
                      _jsx("span", {
                        className: "text-xs font-medium text-gray-600",
                        children: state.isDecrypted
                          ? "Decrypted Data"
                          : "Encrypted Data",
                      }),
                      state.isDecrypted &&
                        _jsxs(Badge, {
                          variant: "outline",
                          className: "text-xs",
                          children: [
                            _jsx(Unlock, { className: "w-3 h-3 mr-1" }),
                            "Visible",
                          ],
                        }),
                    ],
                  }),
                  _jsx("div", {
                    className: "font-mono text-sm break-all",
                    children:
                      state.isDecrypted && state.decryptedData
                        ? _jsxs("div", {
                            className: "space-y-2",
                            children: [
                              _jsx("div", {
                                className:
                                  "text-green-700 bg-green-50 p-2 rounded border",
                                children: state.decryptedData,
                              }),
                              _jsxs("div", {
                                className: "text-xs text-gray-500",
                                children: [
                                  "Masked: ",
                                  getMaskedDisplay(state.decryptedData),
                                ],
                              }),
                            ],
                          })
                        : _jsxs("div", {
                            className: "text-gray-600",
                            children: [
                              encryptedData.encrypted.substring(0, 32),
                              "...",
                            ],
                          }),
                  }),
                ],
              }),
              _jsxs("div", {
                className: "flex space-x-2",
                children: [
                  allowDecryption &&
                    _jsx(Button, {
                      onClick: state.isDecrypted ? handleHide : handleDecrypt,
                      disabled: state.isDecrypting,
                      size: "sm",
                      variant: state.isDecrypted ? "outline" : "default",
                      className: "flex-1",
                      children: state.isDecrypting
                        ? _jsxs(_Fragment, {
                            children: [
                              _jsx("div", {
                                className:
                                  "animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2",
                              }),
                              "Decrypting...",
                            ],
                          })
                        : state.isDecrypted
                          ? _jsxs(_Fragment, {
                              children: [
                                _jsx(EyeOff, { className: "w-3 h-3 mr-2" }),
                                "Hide",
                              ],
                            })
                          : _jsxs(_Fragment, {
                              children: [
                                _jsx(Eye, { className: "w-3 h-3 mr-2" }),
                                "Decrypt",
                              ],
                            }),
                    }),
                  state.isDecrypted &&
                    state.decryptedData &&
                    _jsx(Button, {
                      onClick: () => handleCopy(state.decryptedData),
                      size: "sm",
                      variant: "outline",
                      children: state.showCopied
                        ? _jsxs(_Fragment, {
                            children: [
                              _jsx(CheckCircle, {
                                className: "w-3 h-3 mr-2 text-green-600",
                              }),
                              "Copied!",
                            ],
                          })
                        : _jsxs(_Fragment, {
                            children: [
                              _jsx(Copy, { className: "w-3 h-3 mr-2" }),
                              "Copy",
                            ],
                          }),
                    }),
                ],
              }),
              state.isDecrypted &&
                autoHideDelay > 0 &&
                _jsxs("div", {
                  className: "text-xs text-amber-600 flex items-center",
                  children: [
                    _jsx(Clock, { className: "w-3 h-3 mr-1" }),
                    "Data will be hidden automatically in",
                    " ",
                    Math.ceil(autoHideDelay / 1000),
                    " seconds",
                  ],
                }),
              showMetadata &&
                _jsxs("div", {
                  className: "space-y-2 text-xs text-gray-500",
                  children: [
                    _jsx("div", {
                      className: "border-t pt-2",
                      children: _jsxs("div", {
                        className: "grid grid-cols-2 gap-2",
                        children: [
                          _jsxs("div", {
                            children: [
                              _jsx("span", {
                                className: "font-medium",
                                children: "Algorithm:",
                              }),
                              " AES-256-GCM",
                            ],
                          }),
                          _jsxs("div", {
                            children: [
                              _jsx("span", {
                                className: "font-medium",
                                children: "Key Size:",
                              }),
                              " 256 bits",
                            ],
                          }),
                          encryptedData.timestamp &&
                            _jsxs("div", {
                              className: "col-span-2",
                              children: [
                                _jsx("span", {
                                  className: "font-medium",
                                  children: "Encrypted:",
                                }),
                                " ",
                                formatTimestamp(encryptedData.timestamp),
                              ],
                            }),
                        ],
                      }),
                    }),
                    encryptedData.metadata &&
                      _jsxs("div", {
                        className: "border-t pt-2",
                        children: [
                          _jsx("span", {
                            className: "font-medium",
                            children: "Metadata:",
                          }),
                          _jsx("pre", {
                            className:
                              "mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto",
                            children: JSON.stringify(
                              encryptedData.metadata,
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
          _jsxs("div", {
            className:
              "text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-200",
            children: [
              _jsxs("div", {
                className: "flex items-center",
                children: [
                  _jsx(Key, { className: "w-3 h-3 mr-1 text-blue-600" }),
                  _jsx("span", {
                    className: "font-medium text-blue-800",
                    children: "Security Notice:",
                  }),
                ],
              }),
              _jsx("p", {
                className: "mt-1 text-blue-700",
                children:
                  "This data is encrypted using AES-256-GCM. Decryption occurs client-side only.",
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
export default EncryptedDisplay;

import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Alert, AlertDescription } from "../ui/alert";
import { Progress } from "../ui/progress";
import {
  Fingerprint,
  Eye,
  Mic,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lock,
  Unlock,
  RefreshCw,
  Settings,
} from "lucide-react";
export function BiometricAuth({
  onAuthenticate,
  onEnroll,
  onUnenroll,
  allowEnrollment = true,
  requireBiometric = false,
  fallbackToPassword = true,
  className = "",
}) {
  const [state, setState] = useState({
    isSupported: false,
    isAuthenticating: false,
    isEnrolling: false,
    capabilities: [],
    lastAuthResult: null,
    error: null,
    enrollmentProgress: 0,
    authAttempts: 0,
    maxAttempts: 3,
    lockoutEndTime: null,
  });
  // Initialize biometric capabilities
  useEffect(() => {
    const initializeBiometrics = async () => {
      const capabilities = [
        {
          type: "fingerprint",
          available: false,
          enrolled: false,
          name: "Fingerprint",
          description: "Use your fingerprint to authenticate",
          icon: _jsx(Fingerprint, { className: "w-6 h-6" }),
        },
        {
          type: "face",
          available: false,
          enrolled: false,
          name: "Face Recognition",
          description: "Use facial recognition to authenticate",
          icon: _jsx(Eye, { className: "w-6 h-6" }),
        },
        {
          type: "voice",
          available: false,
          enrolled: false,
          name: "Voice Recognition",
          description: "Use voice recognition to authenticate",
          icon: _jsx(Mic, { className: "w-6 h-6" }),
        },
        {
          type: "iris",
          available: false,
          enrolled: false,
          name: "Iris Scan",
          description: "Use iris scanning to authenticate",
          icon: _jsx(Eye, { className: "w-6 h-6" }),
        },
      ];
      // Check WebAuthn support
      if ("credentials" in navigator && "create" in navigator.credentials) {
        try {
          // Check for platform authenticator (built-in biometrics)
          const available = await navigator.credentials.get({
            publicKey: {
              challenge: new Uint8Array(32),
              timeout: 60000,
              userVerification: "required",
              authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required",
              },
            },
          });
          // Update fingerprint availability (most common platform authenticator)
          capabilities[0].available = true;
          setState((prev) => ({
            ...prev,
            isSupported: true,
            capabilities,
          }));
        } catch (error) {
          // Check for specific biometric APIs
          await checkSpecificBiometrics(capabilities);
        }
      } else {
        await checkSpecificBiometrics(capabilities);
      }
    };
    const checkSpecificBiometrics = async (capabilities) => {
      // Check for Touch ID / Face ID on iOS Safari
      if ("TouchID" in window || "FaceID" in window) {
        capabilities[0].available = "TouchID" in window;
        capabilities[1].available = "FaceID" in window;
      }
      // Check for Windows Hello
      if ("msCredentials" in navigator) {
        capabilities[0].available = true;
        capabilities[1].available = true;
      }
      // Check for Android biometrics
      if ("userAgent" in navigator && /Android/i.test(navigator.userAgent)) {
        capabilities[0].available = true; // Most Android devices have fingerprint
      }
      // Check for media devices (camera/microphone for face/voice)
      if (
        "mediaDevices" in navigator &&
        "getUserMedia" in navigator.mediaDevices
      ) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasCamera = devices.some(
            (device) => device.kind === "videoinput",
          );
          const hasMicrophone = devices.some(
            (device) => device.kind === "audioinput",
          );
          if (hasCamera) capabilities[1].available = true; // Face recognition
          if (hasMicrophone) capabilities[2].available = true; // Voice recognition
        } catch (error) {
          console.warn("Could not enumerate media devices:", error);
        }
      }
      setState((prev) => ({
        ...prev,
        isSupported: capabilities.some((cap) => cap.available),
        capabilities,
      }));
    };
    initializeBiometrics();
  }, []);
  // Handle lockout timer
  useEffect(() => {
    if (state.lockoutEndTime) {
      const timer = setInterval(() => {
        if (Date.now() >= state.lockoutEndTime) {
          setState((prev) => ({
            ...prev,
            lockoutEndTime: null,
            authAttempts: 0,
          }));
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [state.lockoutEndTime]);
  const handleAuthenticate = useCallback(
    async (type) => {
      if (state.lockoutEndTime && Date.now() < state.lockoutEndTime) {
        setState((prev) => ({
          ...prev,
          error: "Authentication locked. Please try again later.",
        }));
        return;
      }
      setState((prev) => ({ ...prev, isAuthenticating: true, error: null }));
      try {
        let result;
        switch (type) {
          case "fingerprint":
            result = await authenticateWithFingerprint();
            break;
          case "face":
            result = await authenticateWithFace();
            break;
          case "voice":
            result = await authenticateWithVoice();
            break;
          case "iris":
            result = await authenticateWithIris();
            break;
          default:
            throw new Error("Unsupported biometric type");
        }
        if (result.success) {
          setState((prev) => ({
            ...prev,
            lastAuthResult: result,
            authAttempts: 0,
            lockoutEndTime: null,
          }));
          if (onAuthenticate) {
            onAuthenticate(result);
          }
        } else {
          const newAttempts = state.authAttempts + 1;
          const shouldLock = newAttempts >= state.maxAttempts;
          setState((prev) => ({
            ...prev,
            authAttempts: newAttempts,
            lockoutEndTime: shouldLock ? Date.now() + 300000 : null, // 5 minutes
            error: result.error || "Authentication failed",
          }));
        }
      } catch (error) {
        const newAttempts = state.authAttempts + 1;
        const shouldLock = newAttempts >= state.maxAttempts;
        setState((prev) => ({
          ...prev,
          authAttempts: newAttempts,
          lockoutEndTime: shouldLock ? Date.now() + 300000 : null,
          error:
            error instanceof Error ? error.message : "Authentication failed",
        }));
      } finally {
        setState((prev) => ({ ...prev, isAuthenticating: false }));
      }
    },
    [
      state.authAttempts,
      state.maxAttempts,
      state.lockoutEndTime,
      onAuthenticate,
    ],
  );
  const authenticateWithFingerprint = async () => {
    if ("credentials" in navigator) {
      try {
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            timeout: 60000,
            userVerification: "required",
            authenticatorSelection: {
              authenticatorAttachment: "platform",
              userVerification: "required",
            },
          },
        });
        return {
          success: true,
          type: "fingerprint",
          credential,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          success: false,
          type: "fingerprint",
          error: "Fingerprint authentication failed",
          timestamp: new Date().toISOString(),
        };
      }
    }
    throw new Error("WebAuthn not supported");
  };
  const authenticateWithFace = async () => {
    // Simulate face recognition (would integrate with actual face recognition API)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.3, // 70% success rate for demo
          type: "face",
          timestamp: new Date().toISOString(),
        });
      }, 2000);
    });
  };
  const authenticateWithVoice = async () => {
    // Simulate voice recognition (would integrate with actual voice recognition API)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.4, // 60% success rate for demo
          type: "voice",
          timestamp: new Date().toISOString(),
        });
      }, 3000);
    });
  };
  const authenticateWithIris = async () => {
    // Simulate iris scanning (would integrate with actual iris scanning API)
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: Math.random() > 0.2, // 80% success rate for demo
          type: "iris",
          timestamp: new Date().toISOString(),
        });
      }, 2500);
    });
  };
  const handleEnroll = useCallback(
    async (type) => {
      if (!allowEnrollment) return;
      setState((prev) => ({
        ...prev,
        isEnrolling: true,
        error: null,
        enrollmentProgress: 0,
      }));
      try {
        // Simulate enrollment progress
        for (let i = 0; i <= 100; i += 10) {
          setState((prev) => ({ ...prev, enrollmentProgress: i }));
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
        if (onEnroll) {
          await onEnroll(type);
        }
        // Update capability as enrolled
        setState((prev) => ({
          ...prev,
          capabilities: prev.capabilities.map((cap) =>
            cap.type === type ? { ...cap, enrolled: true } : cap,
          ),
          enrollmentProgress: 100,
        }));
        setTimeout(() => {
          setState((prev) => ({ ...prev, enrollmentProgress: 0 }));
        }, 1000);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: `Failed to enroll ${type}`,
          enrollmentProgress: 0,
        }));
      } finally {
        setState((prev) => ({ ...prev, isEnrolling: false }));
      }
    },
    [allowEnrollment, onEnroll],
  );
  const handleUnenroll = useCallback(
    async (type) => {
      try {
        if (onUnenroll) {
          await onUnenroll(type);
        }
        setState((prev) => ({
          ...prev,
          capabilities: prev.capabilities.map((cap) =>
            cap.type === type ? { ...cap, enrolled: false } : cap,
          ),
        }));
      } catch (error) {
        setState((prev) => ({ ...prev, error: `Failed to unenroll ${type}` }));
      }
    },
    [onUnenroll],
  );
  const remainingLockoutTime = state.lockoutEndTime
    ? Math.ceil((state.lockoutEndTime - Date.now()) / 1000)
    : 0;
  const enrolledCapabilities = state.capabilities.filter((cap) => cap.enrolled);
  const availableCapabilities = state.capabilities.filter(
    (cap) => cap.available,
  );
  if (!state.isSupported) {
    return _jsx(Card, {
      className: className,
      children: _jsxs(CardContent, {
        className: "p-6 text-center",
        children: [
          _jsx(XCircle, { className: "w-12 h-12 mx-auto mb-4 text-gray-400" }),
          _jsx("h3", {
            className: "text-lg font-medium text-gray-900 mb-2",
            children: "Biometric Authentication Not Supported",
          }),
          _jsx("p", {
            className: "text-sm text-gray-600 mb-4",
            children:
              "Your device or browser doesn't support biometric authentication.",
          }),
          fallbackToPassword &&
            _jsxs(Button, {
              variant: "outline",
              children: [
                _jsx(Lock, { className: "w-4 h-4 mr-2" }),
                "Use Password Instead",
              ],
            }),
        ],
      }),
    });
  }
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
                    "Biometric Authentication",
                  ],
                }),
                _jsx(Badge, {
                  className:
                    enrolledCapabilities.length > 0
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-600",
                  children:
                    enrolledCapabilities.length > 0
                      ? _jsxs(_Fragment, {
                          children: [
                            _jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
                            enrolledCapabilities.length,
                            " Enrolled",
                          ],
                        })
                      : _jsxs(_Fragment, {
                          children: [
                            _jsx(Settings, { className: "w-3 h-3 mr-1" }),
                            "Setup Required",
                          ],
                        }),
                }),
              ],
            }),
          }),
          _jsx(CardContent, {
            children: _jsx("p", {
              className: "text-sm text-gray-600",
              children:
                "Use your device's built-in biometric sensors for secure, convenient authentication.",
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
      state.lockoutEndTime &&
        remainingLockoutTime > 0 &&
        _jsxs(Alert, {
          className: "border-red-200 bg-red-50",
          children: [
            _jsx(Lock, { className: "h-4 w-4 text-red-600" }),
            _jsxs(AlertDescription, {
              className: "text-red-800",
              children: [
                "Authentication locked for ",
                remainingLockoutTime,
                " seconds due to multiple failed attempts.",
              ],
            }),
          ],
        }),
      state.lastAuthResult?.success &&
        _jsxs(Alert, {
          className: "border-green-200 bg-green-50",
          children: [
            _jsx(CheckCircle, { className: "h-4 w-4 text-green-600" }),
            _jsxs(AlertDescription, {
              className: "text-green-800",
              children: [
                "Successfully authenticated with ",
                state.lastAuthResult.type,
                " at",
                " ",
                new Date(state.lastAuthResult.timestamp).toLocaleTimeString(),
              ],
            }),
          ],
        }),
      state.isEnrolling &&
        _jsx(Card, {
          children: _jsx(CardContent, {
            className: "p-4",
            children: _jsxs("div", {
              className: "space-y-2",
              children: [
                _jsxs("div", {
                  className: "flex justify-between text-sm",
                  children: [
                    _jsx("span", { children: "Enrollment Progress" }),
                    _jsxs("span", {
                      children: [state.enrollmentProgress, "%"],
                    }),
                  ],
                }),
                _jsx(Progress, {
                  value: state.enrollmentProgress,
                  className: "h-2",
                }),
                _jsx("p", {
                  className: "text-xs text-gray-600",
                  children:
                    "Follow the on-screen instructions to complete enrollment.",
                }),
              ],
            }),
          }),
        }),
      _jsx("div", {
        className: "grid gap-4",
        children: availableCapabilities.map((capability) =>
          _jsx(
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
                        _jsx("div", {
                          className: "text-blue-600",
                          children: capability.icon,
                        }),
                        _jsxs("div", {
                          children: [
                            _jsx("h3", {
                              className: "font-medium",
                              children: capability.name,
                            }),
                            _jsx("p", {
                              className: "text-sm text-gray-600",
                              children: capability.description,
                            }),
                          ],
                        }),
                      ],
                    }),
                    _jsxs("div", {
                      className: "flex items-center space-x-3",
                      children: [
                        _jsx(Badge, {
                          className: capability.enrolled
                            ? "bg-green-100 text-green-600"
                            : "bg-gray-100 text-gray-600",
                          children: capability.enrolled
                            ? "Enrolled"
                            : "Not Enrolled",
                        }),
                        _jsx("div", {
                          className: "flex space-x-2",
                          children: capability.enrolled
                            ? _jsxs(_Fragment, {
                                children: [
                                  _jsx(Button, {
                                    onClick: () =>
                                      handleAuthenticate(capability.type),
                                    disabled:
                                      state.isAuthenticating ||
                                      state.lockoutEndTime !== null,
                                    size: "sm",
                                    children: state.isAuthenticating
                                      ? _jsxs(_Fragment, {
                                          children: [
                                            _jsx(RefreshCw, {
                                              className:
                                                "w-3 h-3 mr-2 animate-spin",
                                            }),
                                            "Authenticating...",
                                          ],
                                        })
                                      : _jsxs(_Fragment, {
                                          children: [
                                            _jsx(Unlock, {
                                              className: "w-3 h-3 mr-2",
                                            }),
                                            "Authenticate",
                                          ],
                                        }),
                                  }),
                                  _jsx(Button, {
                                    onClick: () =>
                                      handleUnenroll(capability.type),
                                    disabled: state.isEnrolling,
                                    size: "sm",
                                    variant: "outline",
                                    children: "Unenroll",
                                  }),
                                ],
                              })
                            : _jsx(Button, {
                                onClick: () => handleEnroll(capability.type),
                                disabled: state.isEnrolling || !allowEnrollment,
                                size: "sm",
                                variant: "outline",
                                children: state.isEnrolling
                                  ? "Enrolling..."
                                  : "Enroll",
                              }),
                        }),
                      ],
                    }),
                  ],
                }),
              }),
            },
            capability.type,
          ),
        ),
      }),
      requireBiometric &&
        enrolledCapabilities.length === 0 &&
        _jsxs(Alert, {
          className: "border-amber-200 bg-amber-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-amber-600" }),
            _jsx(AlertDescription, {
              className: "text-amber-800",
              children:
                "Biometric authentication is required. Please enroll at least one biometric method.",
            }),
          ],
        }),
      fallbackToPassword &&
        !requireBiometric &&
        _jsx(Card, {
          children: _jsxs(CardContent, {
            className: "p-4 text-center",
            children: [
              _jsx("p", {
                className: "text-sm text-gray-600 mb-3",
                children: "Having trouble with biometric authentication?",
              }),
              _jsxs(Button, {
                variant: "outline",
                size: "sm",
                children: [
                  _jsx(Lock, { className: "w-4 h-4 mr-2" }),
                  "Use Password Instead",
                ],
              }),
            ],
          }),
        }),
      _jsx(Card, {
        children: _jsx(CardContent, {
          className: "p-4",
          children: _jsxs("div", {
            className: "flex items-start space-x-3",
            children: [
              _jsx(Shield, { className: "w-5 h-5 text-blue-600 mt-0.5" }),
              _jsxs("div", {
                className: "text-sm text-gray-600",
                children: [
                  _jsx("p", {
                    className: "font-medium text-gray-900 mb-1",
                    children: "Security Information",
                  }),
                  _jsxs("ul", {
                    className: "space-y-1 text-xs",
                    children: [
                      _jsx("li", {
                        children:
                          "\u2022 Biometric data is stored securely on your device",
                      }),
                      _jsxs("li", {
                        children: [
                          "\u2022 Authentication attempts: ",
                          state.authAttempts,
                          "/",
                          state.maxAttempts,
                        ],
                      }),
                      _jsxs("li", {
                        children: [
                          "\u2022 Fallback authentication is",
                          " ",
                          fallbackToPassword ? "available" : "disabled",
                        ],
                      }),
                      _jsx("li", {
                        children:
                          "\u2022 All authentication attempts are logged for security",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        }),
      }),
    ],
  });
}
export default BiometricAuth;

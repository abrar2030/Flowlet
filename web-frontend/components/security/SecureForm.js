import {
  jsx as _jsx,
  jsxs as _jsxs,
  Fragment as _Fragment,
} from "react/jsx-runtime";
import { useState, useCallback, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ValidationService } from "../../lib/security/validation";
import { CSRFService } from "../../lib/security/headers";
import { EncryptionService } from "../../lib/security/encryption";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";
export function SecureForm({
  fields,
  onSubmit,
  onValidationError,
  schema,
  title,
  description,
  submitText = "Submit",
  className = "",
  enableCSRF = true,
  enableEncryption = true,
  enableRealTimeValidation = true,
  maxAttempts = 5,
  lockoutDuration = 300000, // 5 minutes
}) {
  const [formState, setFormState] = useState({
    isSubmitting: false,
    submitAttempts: 0,
    isLocked: false,
    lockoutEndTime: null,
    showPasswords: {},
    validationErrors: {},
    securityWarnings: [],
  });
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
  } = useForm({
    resolver: zodResolver(schema),
    mode: enableRealTimeValidation ? "onChange" : "onSubmit",
    defaultValues: {},
  });
  // Watch all form values for real-time validation
  const watchedValues = watch();
  // Initialize CSRF token
  useEffect(() => {
    if (enableCSRF && !CSRFService.getToken()) {
      const token = CSRFService.generateToken();
      CSRFService.setToken(token);
    }
  }, [enableCSRF]);
  // Handle lockout timer
  useEffect(() => {
    if (formState.isLocked && formState.lockoutEndTime) {
      const timer = setInterval(() => {
        if (Date.now() >= formState.lockoutEndTime) {
          setFormState((prev) => ({
            ...prev,
            isLocked: false,
            lockoutEndTime: null,
            submitAttempts: 0,
          }));
          clearInterval(timer);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [formState.isLocked, formState.lockoutEndTime]);
  // Real-time validation
  useEffect(() => {
    if (enableRealTimeValidation) {
      const validateFields = async () => {
        const newErrors = {};
        const warnings = [];
        for (const field of fields) {
          const value = watchedValues[field.name];
          if (value) {
            try {
              // Custom validation based on field type
              if (field.type === "email") {
                const emailValidation = ValidationService.validateEmail(value);
                if (!emailValidation.isValid) {
                  newErrors[field.name] = emailValidation.errors[0];
                }
              } else if (field.type === "password") {
                const passwordValidation =
                  ValidationService.validatePassword(value);
                if (!passwordValidation.isValid) {
                  newErrors[field.name] = passwordValidation.errors[0];
                }
                if (passwordValidation.strength === "weak") {
                  warnings.push(`${field.label} strength is weak`);
                }
              } else if (field.type === "tel") {
                const phoneValidation = ValidationService.validatePhone(value);
                if (!phoneValidation.isValid) {
                  newErrors[field.name] = phoneValidation.errors[0];
                }
              }
            } catch (error) {
              console.error("Validation error:", error);
            }
          }
        }
        setFormState((prev) => ({
          ...prev,
          validationErrors: newErrors,
          securityWarnings: warnings,
        }));
      };
      validateFields();
    }
  }, [watchedValues, fields, enableRealTimeValidation]);
  const togglePasswordVisibility = useCallback((fieldName) => {
    setFormState((prev) => ({
      ...prev,
      showPasswords: {
        ...prev.showPasswords,
        [fieldName]: !prev.showPasswords[fieldName],
      },
    }));
  }, []);
  const handleFormSubmit = useCallback(
    async (data) => {
      if (formState.isLocked) {
        return;
      }
      setFormState((prev) => ({ ...prev, isSubmitting: true }));
      try {
        // Validate CSRF token
        if (enableCSRF) {
          const csrfToken = CSRFService.getToken();
          if (!csrfToken) {
            throw new Error("CSRF token missing");
          }
        }
        // Encrypt sensitive data
        let encryptedData = {};
        if (enableEncryption) {
          for (const field of fields) {
            if (field.encrypted || field.sensitive) {
              const value = data[field.name];
              if (value) {
                encryptedData[field.name] = EncryptionService.encrypt(
                  String(value),
                );
              }
            }
          }
        }
        // Submit form
        await onSubmit(data, encryptedData);
        // Reset attempts on successful submission
        setFormState((prev) => ({
          ...prev,
          submitAttempts: 0,
          isSubmitting: false,
        }));
      } catch (error) {
        console.error("Form submission error:", error);
        const newAttempts = formState.submitAttempts + 1;
        const shouldLock = newAttempts >= maxAttempts;
        setFormState((prev) => ({
          ...prev,
          submitAttempts: newAttempts,
          isSubmitting: false,
          isLocked: shouldLock,
          lockoutEndTime: shouldLock ? Date.now() + lockoutDuration : null,
        }));
        if (onValidationError) {
          onValidationError({
            submit:
              error instanceof Error ? error.message : "Submission failed",
          });
        }
      }
    },
    [
      formState,
      enableCSRF,
      enableEncryption,
      fields,
      onSubmit,
      onValidationError,
      maxAttempts,
      lockoutDuration,
    ],
  );
  const renderField = (field) => {
    const fieldError =
      errors[field.name]?.message || formState.validationErrors[field.name];
    const isPassword = field.type === "password";
    const showPassword = formState.showPasswords[field.name];
    return _jsxs(
      "div",
      {
        className: "space-y-2",
        children: [
          _jsxs(Label, {
            htmlFor: field.name,
            className: "text-sm font-medium",
            children: [
              field.label,
              field.required &&
                _jsx("span", { className: "text-red-500 ml-1", children: "*" }),
              field.sensitive &&
                _jsx(Shield, {
                  className: "inline w-3 h-3 ml-1 text-amber-500",
                }),
            ],
          }),
          _jsxs("div", {
            className: "relative",
            children: [
              _jsx(Controller, {
                name: field.name,
                control: control,
                render: ({ field: { onChange, value, ...fieldProps } }) =>
                  _jsx(Input, {
                    ...fieldProps,
                    id: field.name,
                    type: isPassword
                      ? showPassword
                        ? "text"
                        : "password"
                      : field.type,
                    placeholder: field.placeholder,
                    autoComplete: field.autoComplete,
                    maxLength: field.maxLength,
                    pattern: field.pattern,
                    value: value || "",
                    onChange: (e) => {
                      onChange(e.target.value);
                      if (enableRealTimeValidation) {
                        trigger(field.name);
                      }
                    },
                    className: `pr-10 ${fieldError ? "border-red-500" : ""} ${field.sensitive ? "bg-yellow-50" : ""}`,
                    disabled: formState.isSubmitting || formState.isLocked,
                    "aria-describedby": fieldError
                      ? `${field.name}-error`
                      : undefined,
                  }),
              }),
              isPassword &&
                _jsx("button", {
                  type: "button",
                  onClick: () => togglePasswordVisibility(field.name),
                  className:
                    "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700",
                  disabled: formState.isSubmitting || formState.isLocked,
                  children: showPassword
                    ? _jsx(EyeOff, { className: "w-4 h-4" })
                    : _jsx(Eye, { className: "w-4 h-4" }),
                }),
            ],
          }),
          fieldError &&
            _jsxs("p", {
              id: `${field.name}-error`,
              className: "text-sm text-red-600 flex items-center",
              children: [
                _jsx(AlertTriangle, { className: "w-3 h-3 mr-1" }),
                fieldError,
              ],
            }),
        ],
      },
      field.name,
    );
  };
  const remainingTime = formState.lockoutEndTime
    ? Math.ceil((formState.lockoutEndTime - Date.now()) / 1000)
    : 0;
  return _jsxs("div", {
    className: `max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`,
    children: [
      title &&
        _jsxs("div", {
          className: "text-center mb-6",
          children: [
            _jsxs("h2", {
              className:
                "text-2xl font-bold text-gray-900 flex items-center justify-center",
              children: [
                _jsx(Shield, { className: "w-6 h-6 mr-2 text-blue-600" }),
                title,
              ],
            }),
            description &&
              _jsx("p", {
                className: "text-sm text-gray-600 mt-2",
                children: description,
              }),
          ],
        }),
      formState.securityWarnings.length > 0 &&
        _jsxs(Alert, {
          className: "mb-4 border-amber-200 bg-amber-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-amber-600" }),
            _jsx(AlertDescription, {
              className: "text-amber-800",
              children: _jsx("ul", {
                className: "list-disc list-inside",
                children: formState.securityWarnings.map((warning, index) =>
                  _jsx("li", { children: warning }, index),
                ),
              }),
            }),
          ],
        }),
      formState.isLocked &&
        _jsxs(Alert, {
          className: "mb-4 border-red-200 bg-red-50",
          children: [
            _jsx(AlertTriangle, { className: "h-4 w-4 text-red-600" }),
            _jsxs(AlertDescription, {
              className: "text-red-800",
              children: [
                "Form locked due to multiple failed attempts. Please wait",
                " ",
                remainingTime,
                " seconds before trying again.",
              ],
            }),
          ],
        }),
      _jsxs("form", {
        onSubmit: handleSubmit(handleFormSubmit),
        className: "space-y-4",
        children: [
          fields.map(renderField),
          _jsx("div", {
            className: "pt-4",
            children: _jsx(Button, {
              type: "submit",
              disabled:
                formState.isSubmitting || formState.isLocked || !isValid,
              className: "w-full",
              children: formState.isSubmitting
                ? _jsxs(_Fragment, {
                    children: [
                      _jsx("div", {
                        className:
                          "animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2",
                      }),
                      "Processing...",
                    ],
                  })
                : _jsxs(_Fragment, {
                    children: [
                      _jsx(CheckCircle, { className: "w-4 h-4 mr-2" }),
                      submitText,
                    ],
                  }),
            }),
          }),
          formState.submitAttempts > 0 &&
            !formState.isLocked &&
            _jsxs("p", {
              className: "text-sm text-amber-600 text-center",
              children: [
                maxAttempts - formState.submitAttempts,
                " attempts remaining",
              ],
            }),
          enableCSRF &&
            _jsx("input", {
              type: "hidden",
              name: "csrf_token",
              value: CSRFService.getToken() || "",
            }),
        ],
      }),
      _jsx("div", {
        className: "mt-6 text-xs text-gray-500 text-center",
        children: _jsxs("div", {
          className: "flex items-center justify-center space-x-4",
          children: [
            _jsxs("span", {
              className: "flex items-center",
              children: [
                _jsx(Shield, { className: "w-3 h-3 mr-1" }),
                "Secure Form",
              ],
            }),
            enableEncryption &&
              _jsxs("span", {
                className: "flex items-center",
                children: [
                  _jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
                  "Encrypted",
                ],
              }),
            enableCSRF &&
              _jsxs("span", {
                className: "flex items-center",
                children: [
                  _jsx(CheckCircle, { className: "w-3 h-3 mr-1" }),
                  "CSRF Protected",
                ],
              }),
          ],
        }),
      }),
    ],
  });
}
export default SecureForm;

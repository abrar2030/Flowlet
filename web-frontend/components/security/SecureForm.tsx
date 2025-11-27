import React, { useState, useCallback, useEffect } from "react";
import {
  useForm,
  Controller,
  FieldValues,
  Path,
  PathValue,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ValidationService } from "../../lib/security/validation";
import { CSRFService } from "../../lib/security/headers";
import { EncryptionService } from "../../lib/security/encryption";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle } from "lucide-react";

interface SecureFormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "tel" | "number" | "hidden";
  validation: z.ZodType<any>;
  encrypted?: boolean;
  sensitive?: boolean;
  placeholder?: string;
  autoComplete?: string;
  maxLength?: number;
  pattern?: string;
  required?: boolean;
}

interface SecureFormProps<T extends FieldValues> {
  fields: SecureFormField[];
  onSubmit: (data: T, encryptedData?: Record<string, any>) => Promise<void>;
  onValidationError?: (errors: Record<string, string>) => void;
  schema: z.ZodType<T>;
  title?: string;
  description?: string;
  submitText?: string;
  className?: string;
  enableCSRF?: boolean;
  enableEncryption?: boolean;
  enableRealTimeValidation?: boolean;
  maxAttempts?: number;
  lockoutDuration?: number;
}

interface FormState {
  isSubmitting: boolean;
  submitAttempts: number;
  isLocked: boolean;
  lockoutEndTime: number | null;
  showPasswords: Record<string, boolean>;
  validationErrors: Record<string, string>;
  securityWarnings: string[];
}

export function SecureForm<T extends FieldValues>({
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
}: SecureFormProps<T>) {
  const [formState, setFormState] = useState<FormState>({
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
  } = useForm<T>({
    resolver: zodResolver(schema),
    mode: enableRealTimeValidation ? "onChange" : "onSubmit",
    defaultValues: {} as T,
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
        if (Date.now() >= formState.lockoutEndTime!) {
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
        const newErrors: Record<string, string> = {};
        const warnings: string[] = [];

        for (const field of fields) {
          const value = watchedValues[field.name as Path<T>];
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

  const togglePasswordVisibility = useCallback((fieldName: string) => {
    setFormState((prev) => ({
      ...prev,
      showPasswords: {
        ...prev.showPasswords,
        [fieldName]: !prev.showPasswords[fieldName],
      },
    }));
  }, []);

  const handleFormSubmit = useCallback(
    async (data: T) => {
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
        let encryptedData: Record<string, any> = {};
        if (enableEncryption) {
          for (const field of fields) {
            if (field.encrypted || field.sensitive) {
              const value = data[field.name as Path<T>];
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

  const renderField = (field: SecureFormField) => {
    const fieldError =
      errors[field.name as Path<T>]?.message ||
      formState.validationErrors[field.name];
    const isPassword = field.type === "password";
    const showPassword = formState.showPasswords[field.name];

    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name} className="text-sm font-medium">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
          {field.sensitive && (
            <Shield className="inline w-3 h-3 ml-1 text-amber-500" />
          )}
        </Label>

        <div className="relative">
          <Controller
            name={field.name as Path<T>}
            control={control}
            render={({ field: { onChange, value, ...fieldProps } }) => (
              <Input
                {...fieldProps}
                id={field.name}
                type={
                  isPassword ? (showPassword ? "text" : "password") : field.type
                }
                placeholder={field.placeholder}
                autoComplete={field.autoComplete}
                maxLength={field.maxLength}
                pattern={field.pattern}
                value={value || ""}
                onChange={(e) => {
                  onChange(e.target.value);
                  if (enableRealTimeValidation) {
                    trigger(field.name as Path<T>);
                  }
                }}
                className={`pr-10 ${fieldError ? "border-red-500" : ""} ${
                  field.sensitive ? "bg-yellow-50" : ""
                }`}
                disabled={formState.isSubmitting || formState.isLocked}
                aria-describedby={
                  fieldError ? `${field.name}-error` : undefined
                }
              />
            )}
          />

          {isPassword && (
            <button
              type="button"
              onClick={() => togglePasswordVisibility(field.name)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              disabled={formState.isSubmitting || formState.isLocked}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          )}
        </div>

        {fieldError && (
          <p
            id={`${field.name}-error`}
            className="text-sm text-red-600 flex items-center"
          >
            <AlertTriangle className="w-3 h-3 mr-1" />
            {fieldError}
          </p>
        )}
      </div>
    );
  };

  const remainingTime = formState.lockoutEndTime
    ? Math.ceil((formState.lockoutEndTime - Date.now()) / 1000)
    : 0;

  return (
    <div
      className={`max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg ${className}`}
    >
      {title && (
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center justify-center">
            <Shield className="w-6 h-6 mr-2 text-blue-600" />
            {title}
          </h2>
          {description && (
            <p className="text-sm text-gray-600 mt-2">{description}</p>
          )}
        </div>
      )}

      {formState.securityWarnings.length > 0 && (
        <Alert className="mb-4 border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <ul className="list-disc list-inside">
              {formState.securityWarnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {formState.isLocked && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Form locked due to multiple failed attempts. Please wait{" "}
            {remainingTime} seconds before trying again.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {fields.map(renderField)}

        <div className="pt-4">
          <Button
            type="submit"
            disabled={formState.isSubmitting || formState.isLocked || !isValid}
            className="w-full"
          >
            {formState.isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {submitText}
              </>
            )}
          </Button>
        </div>

        {formState.submitAttempts > 0 && !formState.isLocked && (
          <p className="text-sm text-amber-600 text-center">
            {maxAttempts - formState.submitAttempts} attempts remaining
          </p>
        )}

        {enableCSRF && (
          <input
            type="hidden"
            name="csrf_token"
            value={CSRFService.getToken() || ""}
          />
        )}
      </form>

      <div className="mt-6 text-xs text-gray-500 text-center">
        <div className="flex items-center justify-center space-x-4">
          <span className="flex items-center">
            <Shield className="w-3 h-3 mr-1" />
            Secure Form
          </span>
          {enableEncryption && (
            <span className="flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              Encrypted
            </span>
          )}
          {enableCSRF && (
            <span className="flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" />
              CSRF Protected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default SecureForm;

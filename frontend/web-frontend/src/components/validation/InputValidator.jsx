/**
 * Comprehensive Input Validation Component for Flowlet Financial Application
 * Implements real-time validation, sanitization, and security checks
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AlertCircle, Check, Shield, Eye, EyeOff } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { SECURITY_CONFIG } from '../../config/security';
import DOMPurify from 'dompurify';

const InputValidator = ({
  type = 'text',
  name,
  label,
  value = '',
  onChange,
  onValidationChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  validationRules = {},
  sanitize = true,
  showStrengthMeter = false,
  showSecurityIndicator = false,
  maxLength,
  autoComplete = 'off',
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const [validationState, setValidationState] = useState({
    isValid: true,
    errors: [],
    warnings: [],
    strength: 0,
    sanitized: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Validation rules configuration
  const defaultRules = useMemo(() => ({
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address'
    },
    phone: {
      pattern: /^\+?[\d\s\-\(\)]+$/,
      message: 'Please enter a valid phone number'
    },
    ssn: {
      pattern: /^\d{3}-?\d{2}-?\d{4}$/,
      message: 'Please enter a valid SSN (XXX-XX-XXXX)'
    },
    creditCard: {
      pattern: /^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/,
      message: 'Please enter a valid credit card number'
    },
    bankAccount: {
      pattern: /^\d{8,17}$/,
      message: 'Please enter a valid bank account number'
    },
    routingNumber: {
      pattern: /^\d{9}$/,
      message: 'Please enter a valid 9-digit routing number'
    },
    currency: {
      pattern: /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/,
      message: 'Please enter a valid currency amount'
    },
    password: {
      minLength: SECURITY_CONFIG.AUTH.PASSWORD_MIN_LENGTH,
      complexity: SECURITY_CONFIG.AUTH.PASSWORD_COMPLEXITY
    }
  }), []);

  const rules = { ...defaultRules, ...validationRules };

  // Security patterns to detect and prevent
  const securityPatterns = useMemo(() => [
    {
      pattern: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      type: 'XSS',
      severity: 'high'
    },
    {
      pattern: /javascript:/gi,
      type: 'XSS',
      severity: 'high'
    },
    {
      pattern: /on\w+\s*=/gi,
      type: 'XSS',
      severity: 'medium'
    },
    {
      pattern: /(union|select|insert|update|delete|drop|create|alter)\s+/gi,
      type: 'SQL Injection',
      severity: 'high'
    },
    {
      pattern: /(\.\.|\/\.\.|\\\.\.)/g,
      type: 'Path Traversal',
      severity: 'medium'
    },
    {
      pattern: /eval\s*\(/gi,
      type: 'Code Injection',
      severity: 'high'
    }
  ], []);

  // Update internal value when prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Validate input on value change
  useEffect(() => {
    if (internalValue !== undefined) {
      validateInput(internalValue);
    }
  }, [internalValue, rules, type]);

  // Sanitize input
  const sanitizeInput = useCallback((input) => {
    if (!sanitize || typeof input !== 'string') return input;

    let sanitized = input;

    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>'"&]/g, (match) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    });

    // Use DOMPurify for additional sanitization
    if (type === 'textarea' || type === 'rich-text') {
      sanitized = DOMPurify.sanitize(sanitized, {
        ALLOWED_TAGS: SECURITY_CONFIG.VALIDATION.SANITIZATION_OPTIONS.ALLOWED_TAGS,
        ALLOWED_ATTR: SECURITY_CONFIG.VALIDATION.SANITIZATION_OPTIONS.ALLOWED_ATTRIBUTES,
        ALLOW_DATA_ATTR: SECURITY_CONFIG.VALIDATION.SANITIZATION_OPTIONS.ALLOW_DATA_ATTR
      });
    }

    return sanitized;
  }, [sanitize, type]);

  // Security validation
  const validateSecurity = useCallback((input) => {
    const securityIssues = [];

    securityPatterns.forEach(({ pattern, type: issueType, severity }) => {
      if (pattern.test(input)) {
        securityIssues.push({
          type: issueType,
          severity,
          message: `Potential ${issueType} detected`
        });
      }
    });

    return securityIssues;
  }, [securityPatterns]);

  // Password strength calculation
  const calculatePasswordStrength = useCallback((password) => {
    if (type !== 'password') return 0;

    let strength = 0;
    const checks = {
      length: password.length >= SECURITY_CONFIG.AUTH.PASSWORD_MIN_LENGTH,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      numbers: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      unique: new Set(password).size >= 8
    };

    Object.values(checks).forEach(check => {
      if (check) strength += 1;
    });

    // Additional strength factors
    if (password.length >= 16) strength += 1;
    if (password.length >= 20) strength += 1;
    if (/[^\w\s]/.test(password)) strength += 1; // Special characters beyond basic set

    return Math.min(100, (strength / 9) * 100);
  }, [type]);

  // Main validation function
  const validateInput = useCallback((input) => {
    const errors = [];
    const warnings = [];
    let isValid = true;

    // Required field validation
    if (required && (!input || input.toString().trim() === '')) {
      errors.push('This field is required');
      isValid = false;
    }

    if (input && input.toString().trim() !== '') {
      // Length validation
      if (maxLength && input.length > maxLength) {
        errors.push(`Maximum length is ${maxLength} characters`);
        isValid = false;
      }

      if (rules[type]?.minLength && input.length < rules[type].minLength) {
        errors.push(`Minimum length is ${rules[type].minLength} characters`);
        isValid = false;
      }

      // Pattern validation
      if (rules[type]?.pattern && !rules[type].pattern.test(input)) {
        errors.push(rules[type].message || 'Invalid format');
        isValid = false;
      }

      // Custom validation rules
      if (rules.custom) {
        const customResult = rules.custom(input);
        if (customResult !== true) {
          errors.push(customResult || 'Validation failed');
          isValid = false;
        }
      }

      // Security validation
      const securityIssues = validateSecurity(input);
      securityIssues.forEach(issue => {
        if (issue.severity === 'high') {
          errors.push(issue.message);
          isValid = false;
        } else {
          warnings.push(issue.message);
        }
      });

      // Password complexity validation
      if (type === 'password' && rules.password?.complexity) {
        const complexity = rules.password.complexity;
        const passwordChecks = SECURITY_CONFIG.SecurityUtils.validatePasswordStrength(input);
        
        if (!passwordChecks.passed) {
          Object.entries(passwordChecks.checks).forEach(([check, passed]) => {
            if (!passed) {
              switch (check) {
                case 'length':
                  errors.push(`Password must be at least ${SECURITY_CONFIG.AUTH.PASSWORD_MIN_LENGTH} characters`);
                  break;
                case 'uppercase':
                  errors.push('Password must contain uppercase letters');
                  break;
                case 'lowercase':
                  errors.push('Password must contain lowercase letters');
                  break;
                case 'numbers':
                  errors.push('Password must contain numbers');
                  break;
                case 'specialChars':
                  errors.push('Password must contain special characters');
                  break;
                case 'uniqueChars':
                  errors.push('Password must have more unique characters');
                  break;
              }
            }
          });
          isValid = false;
        }
      }

      // Financial data validation
      if (type === 'ssn' || type === 'creditCard' || type === 'bankAccount') {
        // Additional validation for sensitive financial data
        if (input.length > SECURITY_CONFIG.VALIDATION.MAX_INPUT_LENGTH) {
          errors.push('Input too long for security reasons');
          isValid = false;
        }
      }
    }

    const strength = calculatePasswordStrength(input);
    const sanitized = sanitizeInput(input) !== input;

    const newValidationState = {
      isValid,
      errors,
      warnings,
      strength,
      sanitized
    };

    setValidationState(newValidationState);

    // Notify parent component
    if (onValidationChange) {
      onValidationChange(newValidationState);
    }
  }, [
    required,
    maxLength,
    rules,
    type,
    validateSecurity,
    calculatePasswordStrength,
    sanitizeInput,
    onValidationChange
  ]);

  // Handle input change
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    // Apply length limit
    if (maxLength && newValue.length > maxLength) {
      return;
    }

    // Sanitize input
    const sanitizedValue = sanitizeInput(newValue);
    
    setInternalValue(sanitizedValue);
    
    if (onChange) {
      onChange({
        ...e,
        target: {
          ...e.target,
          value: sanitizedValue,
          name: name
        }
      });
    }
  }, [maxLength, sanitizeInput, onChange, name]);

  // Handle focus events
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // Toggle password visibility
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  // Render password strength meter
  const renderPasswordStrengthMeter = () => {
    if (!showStrengthMeter || type !== 'password' || !internalValue) return null;

    const getStrengthColor = (strength) => {
      if (strength < 30) return 'bg-red-500';
      if (strength < 60) return 'bg-yellow-500';
      if (strength < 80) return 'bg-blue-500';
      return 'bg-green-500';
    };

    const getStrengthText = (strength) => {
      if (strength < 30) return 'Weak';
      if (strength < 60) return 'Fair';
      if (strength < 80) return 'Good';
      return 'Strong';
    };

    return (
      <div className="mt-2 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password strength:</span>
          <Badge 
            variant={validationState.strength >= 80 ? 'default' : 'secondary'}
            className={validationState.strength >= 80 ? 'bg-green-500' : ''}
          >
            {getStrengthText(validationState.strength)}
          </Badge>
        </div>
        <Progress 
          value={validationState.strength} 
          className="h-2"
        />
      </div>
    );
  };

  // Render security indicator
  const renderSecurityIndicator = () => {
    if (!showSecurityIndicator) return null;

    const hasSecurityIssues = validationState.errors.some(error => 
      error.includes('XSS') || error.includes('SQL') || error.includes('injection')
    ) || validationState.warnings.length > 0;

    return (
      <div className="flex items-center gap-2 mt-1">
        <Shield className={`h-4 w-4 ${hasSecurityIssues ? 'text-red-500' : 'text-green-500'}`} />
        <span className="text-xs text-muted-foreground">
          {hasSecurityIssues ? 'Security issues detected' : 'Input appears secure'}
        </span>
        {validationState.sanitized && (
          <Badge variant="outline" className="text-xs">
            Sanitized
          </Badge>
        )}
      </div>
    );
  };

  // Render validation messages
  const renderValidationMessages = () => {
    if (validationState.errors.length === 0 && validationState.warnings.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 space-y-1">
        {validationState.errors.map((error, index) => (
          <Alert key={`error-${index}`} variant="destructive" className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        ))}
        {validationState.warnings.map((warning, index) => (
          <Alert key={`warning-${index}`} className="py-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">{warning}</AlertDescription>
          </Alert>
        ))}
      </div>
    );
  };

  // Determine input type for rendering
  const inputType = type === 'password' ? (showPassword ? 'text' : 'password') : type;

  // Common input props
  const inputProps = {
    name,
    value: internalValue,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    placeholder,
    disabled,
    autoComplete,
    maxLength,
    className: `${className} ${
      validationState.errors.length > 0 
        ? 'border-red-500 focus:border-red-500' 
        : validationState.isValid && internalValue 
          ? 'border-green-500 focus:border-green-500' 
          : ''
    }`,
    ...props
  };

  return (
    <div className="space-y-2">
      {label && (
        <Label htmlFor={name} className="flex items-center gap-2">
          {label}
          {required && <span className="text-red-500">*</span>}
          {validationState.isValid && internalValue && (
            <Check className="h-4 w-4 text-green-500" />
          )}
        </Label>
      )}

      <div className="relative">
        {type === 'textarea' ? (
          <Textarea
            id={name}
            {...inputProps}
            rows={4}
          />
        ) : (
          <Input
            id={name}
            type={inputType}
            {...inputProps}
          />
        )}

        {type === 'password' && (
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>

      {renderPasswordStrengthMeter()}
      {renderSecurityIndicator()}
      {renderValidationMessages()}

      {maxLength && (
        <div className="text-xs text-muted-foreground text-right">
          {internalValue?.length || 0} / {maxLength}
        </div>
      )}
    </div>
  );
};

export default InputValidator;


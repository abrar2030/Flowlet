import validator from "validator";
import DOMPurify from "dompurify";
import { z } from "zod";

/**
 * Comprehensive input validation and sanitization service
 * Implements financial industry security standards for data validation
 */
export class ValidationService {
  /**
   * Sanitize HTML content to prevent XSS attacks
   * @param html - HTML content to sanitize
   * @param options - DOMPurify options
   * @returns Sanitized HTML
   */
  static sanitizeHTML(html: string, options?: DOMPurify.Config): string {
    const defaultOptions: DOMPurify.Config = {
      ALLOWED_TAGS: [
        "b",
        "i",
        "em",
        "strong",
        "a",
        "p",
        "br",
        "ul",
        "ol",
        "li",
      ],
      ALLOWED_ATTR: ["href", "title"],
      ALLOW_DATA_ATTR: false,
      FORBID_SCRIPT: true,
      FORBID_TAGS: ["script", "object", "embed", "form", "input"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    };

    return DOMPurify.sanitize(html, { ...defaultOptions, ...options });
  }

  /**
   * Validate and sanitize email addresses
   * @param email - Email to validate
   * @returns Validation result with sanitized email
   */
  static validateEmail(email: string): {
    isValid: boolean;
    sanitized: string;
    errors: string[];
  } {
    const errors: string[] = [];
    let sanitized = validator.normalizeEmail(email) || email;

    // Remove potentially dangerous characters
    sanitized = sanitized.replace(/[<>'"]/g, "");

    const isValid = validator.isEmail(sanitized, {
      allow_utf8_local_part: false,
      require_tld: true,
      blacklisted_chars: "<>\"'",
    });

    if (!isValid) {
      errors.push("Invalid email format");
    }

    if (sanitized.length > 254) {
      errors.push("Email address too long");
    }

    return { isValid: errors.length === 0, sanitized, errors };
  }

  /**
   * Validate password strength according to financial industry standards
   * @param password - Password to validate
   * @returns Validation result with strength score
   */
  static validatePassword(password: string): {
    isValid: boolean;
    strength: "weak" | "medium" | "strong" | "very-strong";
    score: number;
    errors: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const suggestions: string[] = [];
    let score = 0;

    // Length check (minimum 12 characters for financial applications)
    if (password.length < 12) {
      errors.push("Password must be at least 12 characters long");
    } else if (password.length >= 12) {
      score += 2;
    }

    if (password.length >= 16) {
      score += 1;
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain lowercase letters");
      suggestions.push("Add lowercase letters");
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain uppercase letters");
      suggestions.push("Add uppercase letters");
    } else {
      score += 1;
    }

    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain numbers");
      suggestions.push("Add numbers");
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      errors.push("Password must contain special characters");
      suggestions.push("Add special characters (!@#$%^&*)");
    } else {
      score += 2;
    }

    // Common password patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push("Password contains repeated characters");
      suggestions.push("Avoid repeated characters");
      score -= 1;
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      errors.push("Password contains common patterns");
      suggestions.push('Avoid common patterns like "123", "abc", "password"');
      score -= 2;
    }

    // Determine strength
    let strength: "weak" | "medium" | "strong" | "very-strong" = "weak";
    if (score >= 7) strength = "very-strong";
    else if (score >= 5) strength = "strong";
    else if (score >= 3) strength = "medium";

    return {
      isValid: errors.length === 0,
      strength,
      score: Math.max(0, score),
      errors,
      suggestions,
    };
  }

  /**
   * Validate phone numbers with international support
   * @param phone - Phone number to validate
   * @param locale - Locale for validation (default: 'US')
   * @returns Validation result
   */
  static validatePhone(
    phone: string,
    locale: string = "US",
  ): {
    isValid: boolean;
    sanitized: string;
    formatted: string;
    errors: string[];
  } {
    const errors: string[] = [];
    let sanitized = phone.replace(/[^\d+\-\(\)\s]/g, "");

    const isValid = validator.isMobilePhone(sanitized, locale as any, {
      strictMode: true,
    });

    if (!isValid) {
      errors.push(`Invalid phone number format for ${locale}`);
    }

    // Format phone number
    let formatted = sanitized;
    if (locale === "US" && sanitized.length === 10) {
      formatted = `(${sanitized.slice(0, 3)}) ${sanitized.slice(3, 6)}-${sanitized.slice(6)}`;
    }

    return { isValid: errors.length === 0, sanitized, formatted, errors };
  }

  /**
   * Validate credit card numbers using Luhn algorithm
   * @param cardNumber - Credit card number to validate
   * @returns Validation result with card type
   */
  static validateCreditCard(cardNumber: string): {
    isValid: boolean;
    sanitized: string;
    cardType: string;
    masked: string;
    errors: string[];
  } {
    const errors: string[] = [];
    const sanitized = cardNumber.replace(/\D/g, "");

    if (!validator.isCreditCard(sanitized)) {
      errors.push("Invalid credit card number");
    }

    // Determine card type
    let cardType = "unknown";
    if (/^4/.test(sanitized)) cardType = "visa";
    else if (/^5[1-5]/.test(sanitized)) cardType = "mastercard";
    else if (/^3[47]/.test(sanitized)) cardType = "amex";
    else if (/^6(?:011|5)/.test(sanitized)) cardType = "discover";

    // Create masked version (show only last 4 digits)
    const masked = "*".repeat(sanitized.length - 4) + sanitized.slice(-4);

    return {
      isValid: errors.length === 0,
      sanitized,
      cardType,
      masked,
      errors,
    };
  }

  /**
   * Validate and sanitize general text input
   * @param input - Text input to validate
   * @param options - Validation options
   * @returns Validation result
   */
  static validateTextInput(
    input: string,
    options: {
      minLength?: number;
      maxLength?: number;
      allowHTML?: boolean;
      allowSpecialChars?: boolean;
      pattern?: RegExp;
    } = {},
  ): {
    isValid: boolean;
    sanitized: string;
    errors: string[];
  } {
    const errors: string[] = [];
    let sanitized = input.trim();

    // Length validation
    if (options.minLength && sanitized.length < options.minLength) {
      errors.push(
        `Input must be at least ${options.minLength} characters long`,
      );
    }

    if (options.maxLength && sanitized.length > options.maxLength) {
      errors.push(
        `Input must be no more than ${options.maxLength} characters long`,
      );
      sanitized = sanitized.slice(0, options.maxLength);
    }

    // HTML sanitization
    if (!options.allowHTML) {
      sanitized = this.sanitizeHTML(sanitized, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
      });
    }

    // Special characters
    if (!options.allowSpecialChars) {
      sanitized = sanitized.replace(/[<>'"&]/g, "");
    }

    // Pattern validation
    if (options.pattern && !options.pattern.test(sanitized)) {
      errors.push("Input does not match required pattern");
    }

    return { isValid: errors.length === 0, sanitized, errors };
  }

  /**
   * Validate financial amounts
   * @param amount - Amount to validate
   * @param currency - Currency code (default: 'USD')
   * @returns Validation result
   */
  static validateAmount(
    amount: string,
    currency: string = "USD",
  ): {
    isValid: boolean;
    sanitized: string;
    numeric: number;
    formatted: string;
    errors: string[];
  } {
    const errors: string[] = [];
    const sanitized = amount.replace(/[^\d.-]/g, "");

    if (!validator.isFloat(sanitized, { min: 0 })) {
      errors.push("Invalid amount format");
    }

    const numeric = parseFloat(sanitized);

    if (numeric < 0) {
      errors.push("Amount cannot be negative");
    }

    if (numeric > 999999999.99) {
      errors.push("Amount exceeds maximum limit");
    }

    // Format currency
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(numeric);

    return {
      isValid: errors.length === 0,
      sanitized,
      numeric,
      formatted,
      errors,
    };
  }

  /**
   * Validate Social Security Number (US)
   * @param ssn - SSN to validate
   * @returns Validation result with masked version
   */
  static validateSSN(ssn: string): {
    isValid: boolean;
    sanitized: string;
    masked: string;
    errors: string[];
  } {
    const errors: string[] = [];
    const sanitized = ssn.replace(/\D/g, "");

    if (sanitized.length !== 9) {
      errors.push("SSN must be 9 digits");
    }

    if (/^000|^666|^9/.test(sanitized)) {
      errors.push("Invalid SSN format");
    }

    if (/^(\d)\1{8}$/.test(sanitized)) {
      errors.push("SSN cannot be all the same digit");
    }

    const masked = `***-**-${sanitized.slice(-4)}`;

    return { isValid: errors.length === 0, sanitized, masked, errors };
  }
}

/**
 * Zod schemas for comprehensive form validation
 */
export const ValidationSchemas = {
  email: z.string().email("Invalid email format").max(254, "Email too long"),

  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[a-z]/, "Password must contain lowercase letters")
    .regex(/[A-Z]/, "Password must contain uppercase letters")
    .regex(/[0-9]/, "Password must contain numbers")
    .regex(
      /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/,
      "Password must contain special characters",
    ),

  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, "Invalid phone number format"),

  amount: z
    .number()
    .min(0, "Amount cannot be negative")
    .max(999999999.99, "Amount exceeds limit"),

  creditCard: z.string().regex(/^\d{13,19}$/, "Invalid credit card format"),

  ssn: z.string().regex(/^\d{9}$/, "SSN must be 9 digits"),

  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name too long")
    .regex(/^[a-zA-Z\s\-'\.]+$/, "Name contains invalid characters"),

  address: z.string().min(5, "Address too short").max(200, "Address too long"),

  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"),

  dateOfBirth: z
    .date()
    .max(new Date(), "Date of birth cannot be in the future")
    .min(new Date("1900-01-01"), "Invalid date of birth"),
};

export default ValidationService;

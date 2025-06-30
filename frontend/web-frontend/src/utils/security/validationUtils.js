/**
 * Validation Utilities for Flowlet Financial Application
 * Comprehensive validation functions for financial data and security
 */

import { SECURITY_CONFIG } from '../../config/security.js';
import DOMPurify from 'dompurify';

export const ValidationUtils = {
  /**
   * Validate email address
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const result = {
      isValid: emailRegex.test(email),
      errors: []
    };

    if (!result.isValid) {
      result.errors.push('Please enter a valid email address');
    }

    // Additional security checks
    if (email && email.length > 254) {
      result.isValid = false;
      result.errors.push('Email address is too long');
    }

    return result;
  },

  /**
   * Validate phone number
   */
  validatePhone(phone) {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    const result = {
      isValid: phoneRegex.test(phone),
      errors: []
    };

    if (!result.isValid) {
      result.errors.push('Please enter a valid phone number');
    }

    return result;
  },

  /**
   * Validate Social Security Number
   */
  validateSSN(ssn) {
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
    const result = {
      isValid: ssnRegex.test(ssn),
      errors: []
    };

    if (!result.isValid) {
      result.errors.push('Please enter a valid SSN (XXX-XX-XXXX)');
    }

    // Check for invalid SSN patterns
    const cleanSSN = ssn.replace(/\D/g, '');
    const invalidPatterns = [
      '000000000', '111111111', '222222222', '333333333',
      '444444444', '555555555', '666666666', '777777777',
      '888888888', '999999999', '123456789'
    ];

    if (invalidPatterns.includes(cleanSSN)) {
      result.isValid = false;
      result.errors.push('Invalid SSN pattern');
    }

    return result;
  },

  /**
   * Validate credit card number using Luhn algorithm
   */
  validateCreditCard(cardNumber) {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const result = {
      isValid: false,
      errors: [],
      cardType: null
    };

    // Check length
    if (cleanNumber.length < 13 || cleanNumber.length > 19) {
      result.errors.push('Credit card number must be 13-19 digits');
      return result;
    }

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleanNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cleanNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    result.isValid = sum % 10 === 0;

    if (!result.isValid) {
      result.errors.push('Invalid credit card number');
    } else {
      // Determine card type
      result.cardType = this.getCreditCardType(cleanNumber);
    }

    return result;
  },

  /**
   * Get credit card type
   */
  getCreditCardType(cardNumber) {
    const patterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      discover: /^6(?:011|5)/,
      dinersclub: /^3[0689]/,
      jcb: /^35/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber)) {
        return type;
      }
    }

    return 'unknown';
  },

  /**
   * Validate bank account number
   */
  validateBankAccount(accountNumber) {
    const cleanNumber = accountNumber.replace(/\D/g, '');
    const result = {
      isValid: cleanNumber.length >= 8 && cleanNumber.length <= 17,
      errors: []
    };

    if (!result.isValid) {
      result.errors.push('Bank account number must be 8-17 digits');
    }

    return result;
  },

  /**
   * Validate routing number
   */
  validateRoutingNumber(routingNumber) {
    const cleanNumber = routingNumber.replace(/\D/g, '');
    const result = {
      isValid: false,
      errors: []
    };

    // Check length
    if (cleanNumber.length !== 9) {
      result.errors.push('Routing number must be 9 digits');
      return result;
    }

    // ABA routing number checksum
    const digits = cleanNumber.split('').map(Number);
    const checksum = (
      3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      1 * (digits[2] + digits[5] + digits[8])
    ) % 10;

    result.isValid = checksum === 0;

    if (!result.isValid) {
      result.errors.push('Invalid routing number');
    }

    return result;
  },

  /**
   * Validate currency amount
   */
  validateCurrency(amount) {
    const currencyRegex = /^\$?\d{1,3}(,\d{3})*(\.\d{2})?$/;
    const result = {
      isValid: currencyRegex.test(amount),
      errors: [],
      numericValue: null
    };

    if (result.isValid) {
      // Extract numeric value
      const numericString = amount.replace(/[$,]/g, '');
      result.numericValue = parseFloat(numericString);

      // Check for reasonable limits
      if (result.numericValue < 0) {
        result.isValid = false;
        result.errors.push('Amount cannot be negative');
      } else if (result.numericValue > 999999999.99) {
        result.isValid = false;
        result.errors.push('Amount exceeds maximum limit');
      }
    } else {
      result.errors.push('Please enter a valid currency amount');
    }

    return result;
  },

  /**
   * Validate password strength
   */
  validatePassword(password) {
    return SECURITY_CONFIG.SecurityUtils.validatePasswordStrength(password);
  },

  /**
   * Validate date
   */
  validateDate(dateString, format = 'YYYY-MM-DD') {
    const result = {
      isValid: false,
      errors: [],
      date: null
    };

    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) {
        result.errors.push('Invalid date format');
        return result;
      }

      result.date = date;
      result.isValid = true;

      // Check for reasonable date ranges
      const now = new Date();
      const minDate = new Date('1900-01-01');
      const maxDate = new Date(now.getFullYear() + 10, 11, 31);

      if (date < minDate || date > maxDate) {
        result.isValid = false;
        result.errors.push('Date is outside acceptable range');
      }

    } catch (error) {
      result.errors.push('Invalid date');
    }

    return result;
  },

  /**
   * Validate age (for financial services)
   */
  validateAge(birthDate, minAge = 18) {
    const result = {
      isValid: false,
      errors: [],
      age: null
    };

    const dateValidation = this.validateDate(birthDate);
    if (!dateValidation.isValid) {
      return dateValidation;
    }

    const birth = dateValidation.date;
    const now = new Date();
    const age = Math.floor((now - birth) / (365.25 * 24 * 60 * 60 * 1000));

    result.age = age;
    result.isValid = age >= minAge;

    if (!result.isValid) {
      result.errors.push(`Must be at least ${minAge} years old`);
    }

    return result;
  },

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') {
      return input;
    }

    const defaultOptions = {
      ALLOWED_TAGS: SECURITY_CONFIG.VALIDATION.SANITIZATION_OPTIONS.ALLOWED_TAGS,
      ALLOWED_ATTR: SECURITY_CONFIG.VALIDATION.SANITIZATION_OPTIONS.ALLOWED_ATTRIBUTES,
      ALLOW_DATA_ATTR: SECURITY_CONFIG.VALIDATION.SANITIZATION_OPTIONS.ALLOW_DATA_ATTR
    };

    const sanitizeOptions = { ...defaultOptions, ...options };

    return DOMPurify.sanitize(input, sanitizeOptions);
  },

  /**
   * Validate input length
   */
  validateLength(input, minLength = 0, maxLength = SECURITY_CONFIG.VALIDATION.MAX_INPUT_LENGTH) {
    const result = {
      isValid: true,
      errors: []
    };

    const length = input ? input.length : 0;

    if (length < minLength) {
      result.isValid = false;
      result.errors.push(`Minimum length is ${minLength} characters`);
    }

    if (length > maxLength) {
      result.isValid = false;
      result.errors.push(`Maximum length is ${maxLength} characters`);
    }

    return result;
  },

  /**
   * Validate file upload
   */
  validateFile(file, allowedTypes = SECURITY_CONFIG.VALIDATION.ALLOWED_FILE_TYPES, maxSize = SECURITY_CONFIG.VALIDATION.MAX_FILE_SIZE) {
    const result = {
      isValid: true,
      errors: []
    };

    if (!file) {
      result.isValid = false;
      result.errors.push('No file selected');
      return result;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      result.isValid = false;
      result.errors.push(`File type .${fileExtension} is not allowed`);
    }

    // Check file size
    if (file.size > maxSize) {
      result.isValid = false;
      result.errors.push(`File size exceeds ${Math.round(maxSize / 1024 / 1024)}MB limit`);
    }

    // Check for suspicious file names
    const suspiciousPatterns = [
      /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i,
      /\.vbs$/i, /\.js$/i, /\.jar$/i, /\.php$/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(file.name))) {
      result.isValid = false;
      result.errors.push('Suspicious file type detected');
    }

    return result;
  },

  /**
   * Validate URL
   */
  validateURL(url) {
    const result = {
      isValid: false,
      errors: []
    };

    try {
      const urlObj = new URL(url);
      
      // Only allow HTTPS for security
      if (urlObj.protocol !== 'https:') {
        result.errors.push('Only HTTPS URLs are allowed');
        return result;
      }

      result.isValid = true;
    } catch (error) {
      result.errors.push('Invalid URL format');
    }

    return result;
  },

  /**
   * Validate IP address
   */
  validateIPAddress(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    const result = {
      isValid: ipv4Regex.test(ip) || ipv6Regex.test(ip),
      errors: [],
      type: null
    };

    if (result.isValid) {
      result.type = ipv4Regex.test(ip) ? 'IPv4' : 'IPv6';
    } else {
      result.errors.push('Invalid IP address format');
    }

    return result;
  },

  /**
   * Comprehensive form validation
   */
  validateForm(formData, validationRules) {
    const results = {};
    let isFormValid = true;

    for (const [fieldName, value] of Object.entries(formData)) {
      const rules = validationRules[fieldName];
      if (!rules) continue;

      const fieldResult = {
        isValid: true,
        errors: [],
        warnings: []
      };

      // Required field validation
      if (rules.required && (!value || value.toString().trim() === '')) {
        fieldResult.isValid = false;
        fieldResult.errors.push('This field is required');
      }

      // Type-specific validation
      if (value && rules.type) {
        let typeValidation;
        
        switch (rules.type) {
          case 'email':
            typeValidation = this.validateEmail(value);
            break;
          case 'phone':
            typeValidation = this.validatePhone(value);
            break;
          case 'ssn':
            typeValidation = this.validateSSN(value);
            break;
          case 'creditCard':
            typeValidation = this.validateCreditCard(value);
            break;
          case 'bankAccount':
            typeValidation = this.validateBankAccount(value);
            break;
          case 'routingNumber':
            typeValidation = this.validateRoutingNumber(value);
            break;
          case 'currency':
            typeValidation = this.validateCurrency(value);
            break;
          case 'password':
            typeValidation = this.validatePassword(value);
            break;
          case 'date':
            typeValidation = this.validateDate(value);
            break;
          case 'url':
            typeValidation = this.validateURL(value);
            break;
          default:
            typeValidation = { isValid: true, errors: [] };
        }

        if (!typeValidation.isValid) {
          fieldResult.isValid = false;
          fieldResult.errors.push(...typeValidation.errors);
        }
      }

      // Length validation
      if (value && (rules.minLength || rules.maxLength)) {
        const lengthValidation = this.validateLength(
          value, 
          rules.minLength || 0, 
          rules.maxLength || SECURITY_CONFIG.VALIDATION.MAX_INPUT_LENGTH
        );

        if (!lengthValidation.isValid) {
          fieldResult.isValid = false;
          fieldResult.errors.push(...lengthValidation.errors);
        }
      }

      // Custom validation
      if (rules.custom && typeof rules.custom === 'function') {
        const customResult = rules.custom(value, formData);
        if (customResult !== true) {
          fieldResult.isValid = false;
          fieldResult.errors.push(customResult || 'Validation failed');
        }
      }

      results[fieldName] = fieldResult;
      
      if (!fieldResult.isValid) {
        isFormValid = false;
      }
    }

    return {
      isValid: isFormValid,
      fields: results
    };
  }
};

export default ValidationUtils;


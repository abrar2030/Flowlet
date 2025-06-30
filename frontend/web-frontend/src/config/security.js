/**
 * Security Configuration for Flowlet Financial Application
 * Implements comprehensive security settings for financial-grade applications
 */

export const SECURITY_CONFIG = {
  // Content Security Policy Configuration
  CSP: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Only for development - remove in production
      "https://cdn.jsdelivr.net",
      "https://unpkg.com"
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com"
    ],
    'img-src': [
      "'self'",
      "data:",
      "https:",
      "blob:"
    ],
    'connect-src': [
      "'self'",
      "https://api.flowlet.com",
      "https://*.flowlet.com",
      "wss://api.flowlet.com"
    ],
    'font-src': [
      "'self'",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com"
    ],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': true
  },

  // Security Headers
  HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  },

  // Authentication Configuration
  AUTH: {
    TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutes
    REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    MFA_REQUIRED: true,
    PASSWORD_MIN_LENGTH: 12,
    PASSWORD_COMPLEXITY: {
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      minUniqueChars: 8
    }
  },

  // Encryption Configuration
  ENCRYPTION: {
    ALGORITHM: 'AES-GCM',
    KEY_LENGTH: 256,
    IV_LENGTH: 12,
    TAG_LENGTH: 16,
    PBKDF2_ITERATIONS: 100000,
    SALT_LENGTH: 32
  },

  // Rate Limiting
  RATE_LIMITING: {
    LOGIN_ATTEMPTS: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5
    },
    API_REQUESTS: {
      windowMs: 60 * 1000, // 1 minute
      max: 100
    },
    PASSWORD_RESET: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3
    }
  },

  // Input Validation
  VALIDATION: {
    MAX_INPUT_LENGTH: 1000,
    ALLOWED_FILE_TYPES: ['pdf', 'jpg', 'jpeg', 'png'],
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    SANITIZATION_OPTIONS: {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTRIBUTES: {},
      ALLOW_DATA_ATTR: false
    }
  },

  // Monitoring and Logging
  MONITORING: {
    LOG_LEVEL: 'info',
    SECURITY_EVENTS: [
      'login_attempt',
      'login_success',
      'login_failure',
      'logout',
      'password_change',
      'mfa_setup',
      'mfa_verification',
      'suspicious_activity',
      'data_access',
      'permission_change'
    ],
    PERFORMANCE_METRICS: true,
    ERROR_REPORTING: true
  },

  // WebAuthn Configuration
  WEBAUTHN: {
    RP_NAME: 'Flowlet Financial',
    RP_ID: 'flowlet.com',
    ORIGIN: 'https://app.flowlet.com',
    TIMEOUT: 60000,
    USER_VERIFICATION: 'required',
    AUTHENTICATOR_ATTACHMENT: 'platform'
  },

  // Biometric Authentication
  BIOMETRIC: {
    ENABLED: true,
    FALLBACK_TO_PIN: true,
    MAX_ATTEMPTS: 3,
    TIMEOUT: 30000
  },

  // Session Security
  SESSION: {
    SECURE: true,
    HTTP_ONLY: true,
    SAME_SITE: 'strict',
    DOMAIN: '.flowlet.com',
    PATH: '/',
    MAX_AGE: 30 * 60 * 1000 // 30 minutes
  },

  // Development vs Production
  ENVIRONMENT: {
    IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    API_BASE_URL: process.env.VITE_API_BASE_URL || 'https://api.flowlet.com',
    WS_BASE_URL: process.env.VITE_WS_BASE_URL || 'wss://api.flowlet.com'
  }
};

// Security utility functions
export const SecurityUtils = {
  /**
   * Generate Content Security Policy string
   */
  generateCSPString() {
    return Object.entries(SECURITY_CONFIG.CSP)
      .map(([directive, sources]) => {
        if (typeof sources === 'boolean') {
          return sources ? directive : '';
        }
        return `${directive} ${sources.join(' ')}`;
      })
      .filter(Boolean)
      .join('; ');
  },

  /**
   * Check if current environment is secure
   */
  isSecureEnvironment() {
    return window.location.protocol === 'https:' || 
           window.location.hostname === 'localhost';
  },

  /**
   * Validate security headers
   */
  validateSecurityHeaders(headers) {
    const requiredHeaders = Object.keys(SECURITY_CONFIG.HEADERS);
    const missingHeaders = requiredHeaders.filter(header => !headers[header]);
    
    if (missingHeaders.length > 0) {
      console.warn('Missing security headers:', missingHeaders);
      return false;
    }
    
    return true;
  },

  /**
   * Generate secure random string
   */
  generateSecureRandom(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Validate password strength
   */
  validatePasswordStrength(password) {
    const config = SECURITY_CONFIG.AUTH.PASSWORD_COMPLEXITY;
    const checks = {
      length: password.length >= SECURITY_CONFIG.AUTH.PASSWORD_MIN_LENGTH,
      uppercase: config.requireUppercase ? /[A-Z]/.test(password) : true,
      lowercase: config.requireLowercase ? /[a-z]/.test(password) : true,
      numbers: config.requireNumbers ? /\d/.test(password) : true,
      specialChars: config.requireSpecialChars ? /[!@#$%^&*(),.?":{}|<>]/.test(password) : true,
      uniqueChars: new Set(password).size >= config.minUniqueChars
    };

    const passed = Object.values(checks).every(Boolean);
    return { passed, checks };
  }
};

export default SECURITY_CONFIG;


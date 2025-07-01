/**
 * Mobile Security Configuration for Flowlet Financial Application
 * Enhanced security settings optimized for mobile environments
 */

import CryptoJS from 'crypto-js';

export const SECURITY_CONFIG = {
  // Mobile-specific authentication settings
  AUTH: {
    SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutes for mobile
    TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hour
    REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 days
    PASSWORD_MIN_LENGTH: 12,
    PASSWORD_COMPLEXITY: {
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      minUniqueChars: 8
    },
    MFA_ENABLED: true,
    BIOMETRIC_ENABLED: true,
    WEBAUTHN_ENABLED: true,
    MAX_LOGIN_ATTEMPTS: 3,
    LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
    REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days
    PIN_LENGTH: 6,
    PIN_COMPLEXITY: true
  },

  // Mobile encryption settings
  ENCRYPTION: {
    ALGORITHM: 'AES-256-GCM',
    KEY_SIZE: 256,
    IV_SIZE: 12,
    TAG_SIZE: 16,
    PBKDF2_ITERATIONS: 100000,
    SALT_SIZE: 32,
    SECURE_STORAGE_KEY: 'flowlet_mobile_secure_key',
    KEYCHAIN_SERVICE: 'com.flowlet.mobile',
    BIOMETRIC_KEY_ALIAS: 'flowlet_biometric_key'
  },

  // Mobile-specific headers
  HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Mobile-App': 'Flowlet-Mobile/1.0.0',
    'X-Device-Type': 'mobile'
  },

  // Content Security Policy for mobile
  CSP: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for mobile frameworks
      "https://cdn.jsdelivr.net",
      "capacitor://localhost",
      "ionic://localhost"
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
      "blob:",
      "capacitor://localhost",
      "ionic://localhost"
    ],
    'connect-src': [
      "'self'",
      "https://api.flowlet.com",
      "wss://api.flowlet.com",
      "capacitor://localhost",
      "ionic://localhost"
    ],
    'font-src': [
      "'self'",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com"
    ]
  },

  // Mobile validation settings
  VALIDATION: {
    MAX_INPUT_LENGTH: 1000,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB for mobile
    ALLOWED_FILE_TYPES: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    SANITIZATION_OPTIONS: {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTRIBUTES: [],
      ALLOW_DATA_ATTR: false
    }
  },

  // Mobile device security
  DEVICE: {
    REQUIRE_SCREEN_LOCK: true,
    REQUIRE_BIOMETRIC: false, // Optional but recommended
    JAILBREAK_DETECTION: true,
    ROOT_DETECTION: true,
    DEBUG_DETECTION: true,
    EMULATOR_DETECTION: true,
    SCREENSHOT_PREVENTION: true,
    SCREEN_RECORDING_PREVENTION: true,
    COPY_PASTE_RESTRICTION: true
  },

  // Mobile network security
  NETWORK: {
    CERTIFICATE_PINNING: true,
    REQUIRE_HTTPS: true,
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    OFFLINE_SUPPORT: true,
    CACHE_ENCRYPTION: true
  },

  // Mobile app security
  APP: {
    OBFUSCATION_ENABLED: true,
    ANTI_TAMPERING: true,
    RUNTIME_PROTECTION: true,
    BACKGROUND_SECURITY: true,
    TASK_SWITCHING_SECURITY: true,
    DEEP_LINK_VALIDATION: true
  },

  // Security utilities for mobile
  SecurityUtils: {
    /**
     * Generate secure random string for mobile
     */
    generateSecureRandom(length = 32) {
      const array = new Uint8Array(length);
      if (window.crypto && window.crypto.getRandomValues) {
        window.crypto.getRandomValues(array);
      } else {
        // Fallback for older mobile browsers
        for (let i = 0; i < length; i++) {
          array[i] = Math.floor(Math.random() * 256);
        }
      }
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    },

    /**
     * Validate password strength for mobile
     */
    validatePasswordStrength(password) {
      const checks = {
        length: password.length >= SECURITY_CONFIG.AUTH.PASSWORD_MIN_LENGTH,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        numbers: /\d/.test(password),
        specialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        uniqueChars: new Set(password).size >= SECURITY_CONFIG.AUTH.PASSWORD_COMPLEXITY.minUniqueChars
      };

      const passed = Object.values(checks).every(check => check);
      const score = Object.values(checks).filter(check => check).length;

      return {
        passed,
        score: (score / Object.keys(checks).length) * 100,
        checks
      };
    },

    /**
     * Check if environment is secure for mobile
     */
    isSecureEnvironment() {
      // Check for HTTPS or mobile app context
      const isHTTPS = window.location.protocol === 'https:';
      const isMobileApp = window.location.protocol === 'capacitor:' || 
                         window.location.protocol === 'ionic:' ||
                         window.navigator.userAgent.includes('Flowlet-Mobile');
      
      return isHTTPS || isMobileApp;
    },

    /**
     * Generate CSP string for mobile
     */
    generateCSPString() {
      const csp = SECURITY_CONFIG.CSP;
      return Object.entries(csp)
        .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
        .join('; ');
    },

    /**
     * Detect mobile device capabilities
     */
    async detectDeviceCapabilities() {
      const capabilities = {
        biometric: false,
        faceId: false,
        touchId: false,
        fingerprint: false,
        secureStorage: false,
        keychain: false,
        hardwareKeystore: false
      };

      // Check for biometric authentication
      if (window.PublicKeyCredential) {
        try {
          capabilities.biometric = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        } catch (error) {
          console.warn('Biometric detection failed:', error);
        }
      }

      // Check for secure storage (Capacitor)
      if (window.Capacitor) {
        capabilities.secureStorage = true;
        capabilities.keychain = window.Capacitor.platform === 'ios';
        capabilities.hardwareKeystore = window.Capacitor.platform === 'android';
      }

      return capabilities;
    },

    /**
     * Validate mobile device security
     */
    async validateDeviceSecurity() {
      const issues = [];

      // Check for jailbreak/root
      if (SECURITY_CONFIG.DEVICE.JAILBREAK_DETECTION) {
        const isJailbroken = await this.detectJailbreak();
        if (isJailbroken) {
          issues.push('Device appears to be jailbroken/rooted');
        }
      }

      // Check for debugger
      if (SECURITY_CONFIG.DEVICE.DEBUG_DETECTION) {
        const isDebugging = this.detectDebugger();
        if (isDebugging) {
          issues.push('Debugger detected');
        }
      }

      // Check for emulator
      if (SECURITY_CONFIG.DEVICE.EMULATOR_DETECTION) {
        const isEmulator = this.detectEmulator();
        if (isEmulator) {
          issues.push('Running on emulator');
        }
      }

      return {
        isSecure: issues.length === 0,
        issues
      };
    },

    /**
     * Detect jailbreak/root (basic detection)
     */
    async detectJailbreak() {
      // Basic jailbreak detection for web context
      const suspiciousUserAgents = [
        'Cydia', 'Substrate', 'Frida', 'Xposed'
      ];

      const userAgent = navigator.userAgent;
      return suspiciousUserAgents.some(agent => userAgent.includes(agent));
    },

    /**
     * Detect debugger
     */
    detectDebugger() {
      let isDebugging = false;
      
      // Check for developer tools
      const threshold = 160;
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        isDebugging = true;
      }

      // Check for console access
      if (window.console && window.console.clear) {
        try {
          const start = performance.now();
          console.clear();
          const end = performance.now();
          if (end - start > 100) {
            isDebugging = true;
          }
        } catch (error) {
          // Console access restricted
        }
      }

      return isDebugging;
    },

    /**
     * Detect emulator
     */
    detectEmulator() {
      const userAgent = navigator.userAgent.toLowerCase();
      const emulatorIndicators = [
        'android sdk built for x86',
        'generic',
        'emulator',
        'simulator',
        'genymotion'
      ];

      return emulatorIndicators.some(indicator => userAgent.includes(indicator));
    },

    /**
     * Generate device fingerprint
     */
    async generateDeviceFingerprint() {
      const fingerprint = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        touchSupport: 'ontouchstart' in window,
        deviceMemory: navigator.deviceMemory || 'unknown',
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown'
      };

      // Generate hash of fingerprint
      const fingerprintString = JSON.stringify(fingerprint);
      const hash = CryptoJS.SHA256(fingerprintString).toString();

      return {
        fingerprint,
        hash
      };
    }
  }
};

export default SECURITY_CONFIG;


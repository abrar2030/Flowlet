// Enhanced security utilities for financial applications
import CryptoJS from 'crypto-js';

// Encryption/Decryption utilities
export const SecurityUtils = {
  // Generate secure random key
  generateSecureKey: () => {
    return CryptoJS.lib.WordArray.random(256/8).toString();
  },

  // Encrypt sensitive data
  encryptData: (data, key) => {
    try {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption failed:', error);
      return null;
    }
  },

  // Decrypt sensitive data
  decryptData: (encryptedData, key) => {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  },

  // Hash sensitive data (one-way)
  hashData: (data) => {
    return CryptoJS.SHA256(data).toString();
  },

  // Generate secure session token
  generateSessionToken: () => {
    const timestamp = Date.now().toString();
    const randomBytes = CryptoJS.lib.WordArray.random(128/8).toString();
    return CryptoJS.SHA256(timestamp + randomBytes).toString();
  },

  // Validate password strength
  validatePasswordStrength: (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const score = [
      password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    ].filter(Boolean).length;

    return {
      isValid: score >= 4,
      score,
      requirements: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  },

  // Sanitize input to prevent XSS
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  },

  // Generate secure PIN
  generateSecurePIN: (length = 6) => {
    const digits = '0123456789';
    let pin = '';
    for (let i = 0; i < length; i++) {
      pin += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    return pin;
  },

  // Validate financial account numbers (basic validation)
  validateAccountNumber: (accountNumber) => {
    // Remove spaces and hyphens
    const cleaned = accountNumber.replace(/[\s-]/g, '');
    
    // Check if it's numeric and has appropriate length
    const isNumeric = /^\d+$/.test(cleaned);
    const hasValidLength = cleaned.length >= 8 && cleaned.length <= 17;
    
    return {
      isValid: isNumeric && hasValidLength,
      cleaned,
      length: cleaned.length
    };
  },

  // Generate secure device fingerprint
  generateDeviceFingerprint: () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvasFingerprint: canvas.toDataURL(),
      timestamp: Date.now()
    };
    
    return CryptoJS.SHA256(JSON.stringify(fingerprint)).toString();
  }
};

// Biometric authentication utilities
export const BiometricUtils = {
  // Check if biometric authentication is available
  isAvailable: async () => {
    if (!window.PublicKeyCredential) {
      return false;
    }
    
    try {
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return available;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  },

  // Register biometric authentication
  register: async (userId, userName) => {
    try {
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "Flowlet Financial",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(userId),
            name: userName,
            displayName: userName,
          },
          pubKeyCredParams: [{alg: -7, type: "public-key"}],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "direct"
        }
      });
      
      return credential;
    } catch (error) {
      console.error('Biometric registration failed:', error);
      throw error;
    }
  },

  // Authenticate using biometrics
  authenticate: async (credentialId) => {
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: [{
            id: credentialId,
            type: 'public-key'
          }],
          userVerification: 'required',
          timeout: 60000
        }
      });
      
      return assertion;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      throw error;
    }
  }
};

// Session management utilities
export const SessionUtils = {
  // Set secure session data
  setSecureSession: (key, data, expirationMinutes = 30) => {
    const sessionData = {
      data,
      timestamp: Date.now(),
      expiration: Date.now() + (expirationMinutes * 60 * 1000)
    };
    
    const encryptionKey = SecurityUtils.generateSecureKey();
    const encryptedData = SecurityUtils.encryptData(sessionData, encryptionKey);
    
    sessionStorage.setItem(key, encryptedData);
    sessionStorage.setItem(`${key}_key`, encryptionKey);
  },

  // Get secure session data
  getSecureSession: (key) => {
    const encryptedData = sessionStorage.getItem(key);
    const encryptionKey = sessionStorage.getItem(`${key}_key`);
    
    if (!encryptedData || !encryptionKey) {
      return null;
    }
    
    const sessionData = SecurityUtils.decryptData(encryptedData, encryptionKey);
    
    if (!sessionData || Date.now() > sessionData.expiration) {
      SessionUtils.clearSecureSession(key);
      return null;
    }
    
    return sessionData.data;
  },

  // Clear secure session data
  clearSecureSession: (key) => {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(`${key}_key`);
  },

  // Clear all secure sessions
  clearAllSecureSessions: () => {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.endsWith('_key') || sessionStorage.getItem(`${key}_key`)) {
        sessionStorage.removeItem(key);
      }
    });
  }
};

export default { SecurityUtils, BiometricUtils, SessionUtils };


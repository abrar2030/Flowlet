/**
 * Enhanced Authentication Service for Flowlet Financial Application
 * Implements multi-factor authentication, biometric authentication, and WebAuthn
 */

import { SECURITY_CONFIG } from '../../config/security.js';
import { ComplianceUtils } from '../../config/compliance.js';
import CryptoService from '../encryption/CryptoService.js';
import TokenManager from './TokenManager.js';
import SessionManager from './SessionManager.js';

class AuthService {
  constructor() {
    this.tokenManager = new TokenManager();
    this.sessionManager = new SessionManager();
    this.cryptoService = new CryptoService();
    this.loginAttempts = new Map();
    this.lockedAccounts = new Map();
  }

  /**
   * Initialize authentication service
   */
  async initialize() {
    try {
      // Check for existing session
      await this.sessionManager.validateSession();
      
      // Initialize WebAuthn if supported
      if (this.isWebAuthnSupported()) {
        await this.initializeWebAuthn();
      }

      // Initialize biometric authentication if supported
      if (this.isBiometricSupported()) {
        await this.initializeBiometric();
      }

      // Set up session timeout
      this.setupSessionTimeout();

      return true;
    } catch (error) {
      console.error('Failed to initialize auth service:', error);
      return false;
    }
  }

  /**
   * Authenticate user with email and password
   */
  async login(credentials) {
    try {
      const { email, password, rememberMe = false } = credentials;

      // Validate input
      if (!this.validateCredentials(email, password)) {
        throw new Error('Invalid credentials format');
      }

      // Check account lockout
      if (this.isAccountLocked(email)) {
        const lockoutTime = this.lockedAccounts.get(email);
        const remainingTime = Math.ceil((lockoutTime - Date.now()) / 1000 / 60);
        throw new Error(`Account locked. Try again in ${remainingTime} minutes.`);
      }

      // Rate limiting check
      if (this.isRateLimited(email)) {
        throw new Error('Too many login attempts. Please try again later.');
      }

      // Encrypt password for transmission
      const encryptedPassword = await this.cryptoService.encrypt(password);

      // Attempt authentication
      const response = await this.makeAuthRequest('/auth/login', {
        email,
        password: encryptedPassword,
        deviceFingerprint: await this.generateDeviceFingerprint(),
        timestamp: Date.now()
      });

      if (response.success) {
        // Clear login attempts on success
        this.loginAttempts.delete(email);
        this.lockedAccounts.delete(email);

        // Handle successful authentication
        await this.handleSuccessfulAuth(response, rememberMe);

        // Log successful login
        this.logSecurityEvent('login_success', { email, method: 'password' });

        return {
          success: true,
          requiresMFA: response.requiresMFA,
          user: response.user,
          sessionId: response.sessionId
        };
      } else {
        // Handle failed authentication
        this.handleFailedAuth(email);
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (error) {
      this.logSecurityEvent('login_failure', { 
        email: credentials.email, 
        error: error.message,
        method: 'password'
      });
      throw error;
    }
  }

  /**
   * Verify MFA token
   */
  async verifyMFA(token, method = 'totp') {
    try {
      const sessionId = this.sessionManager.getSessionId();
      if (!sessionId) {
        throw new Error('No active session for MFA verification');
      }

      const response = await this.makeAuthRequest('/auth/verify-mfa', {
        sessionId,
        token,
        method,
        timestamp: Date.now()
      });

      if (response.success) {
        // Complete authentication process
        await this.completeAuthentication(response);
        
        this.logSecurityEvent('mfa_verification_success', { 
          method,
          sessionId 
        });

        return { success: true, user: response.user };
      } else {
        this.logSecurityEvent('mfa_verification_failure', { 
          method,
          sessionId,
          error: response.message
        });
        throw new Error(response.message || 'MFA verification failed');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * WebAuthn authentication
   */
  async authenticateWithWebAuthn() {
    try {
      if (!this.isWebAuthnSupported()) {
        throw new Error('WebAuthn not supported');
      }

      // Get authentication options from server
      const optionsResponse = await this.makeAuthRequest('/auth/webauthn/options');
      
      // Start WebAuthn authentication
      const credential = await navigator.credentials.get({
        publicKey: optionsResponse.options
      });

      // Verify credential with server
      const verificationResponse = await this.makeAuthRequest('/auth/webauthn/verify', {
        credential: {
          id: credential.id,
          rawId: Array.from(new Uint8Array(credential.rawId)),
          response: {
            authenticatorData: Array.from(new Uint8Array(credential.response.authenticatorData)),
            clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON)),
            signature: Array.from(new Uint8Array(credential.response.signature)),
            userHandle: credential.response.userHandle ? 
              Array.from(new Uint8Array(credential.response.userHandle)) : null
          },
          type: credential.type
        }
      });

      if (verificationResponse.success) {
        await this.handleSuccessfulAuth(verificationResponse);
        
        this.logSecurityEvent('login_success', { 
          method: 'webauthn',
          credentialId: credential.id
        });

        return { success: true, user: verificationResponse.user };
      } else {
        throw new Error(verificationResponse.message || 'WebAuthn verification failed');
      }
    } catch (error) {
      this.logSecurityEvent('login_failure', { 
        method: 'webauthn',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Biometric authentication
   */
  async authenticateWithBiometric() {
    try {
      if (!this.isBiometricSupported()) {
        throw new Error('Biometric authentication not supported');
      }

      // Check if biometric is enrolled
      const isEnrolled = await this.isBiometricEnrolled();
      if (!isEnrolled) {
        throw new Error('Biometric authentication not enrolled');
      }

      // Perform biometric authentication
      const result = await this.performBiometricAuth();
      
      if (result.success) {
        // Verify biometric token with server
        const verificationResponse = await this.makeAuthRequest('/auth/biometric/verify', {
          biometricToken: result.token,
          deviceId: await this.getDeviceId(),
          timestamp: Date.now()
        });

        if (verificationResponse.success) {
          await this.handleSuccessfulAuth(verificationResponse);
          
          this.logSecurityEvent('login_success', { 
            method: 'biometric',
            biometricType: result.type
          });

          return { success: true, user: verificationResponse.user };
        } else {
          throw new Error(verificationResponse.message || 'Biometric verification failed');
        }
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error) {
      this.logSecurityEvent('login_failure', { 
        method: 'biometric',
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      const sessionId = this.sessionManager.getSessionId();
      
      if (sessionId) {
        // Notify server of logout
        await this.makeAuthRequest('/auth/logout', { sessionId });
        
        this.logSecurityEvent('logout', { sessionId });
      }

      // Clear local session data
      await this.sessionManager.clearSession();
      await this.tokenManager.clearTokens();

      // Clear any cached data
      this.clearAuthCache();

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if server request fails
      await this.sessionManager.clearSession();
      await this.tokenManager.clearTokens();
      this.clearAuthCache();
      
      return { success: true };
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken() {
    try {
      const refreshToken = await this.tokenManager.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.makeAuthRequest('/auth/refresh', {
        refreshToken,
        deviceFingerprint: await this.generateDeviceFingerprint()
      });

      if (response.success) {
        await this.tokenManager.setTokens(response.accessToken, response.refreshToken);
        await this.sessionManager.updateSession(response.sessionData);
        
        return { success: true, accessToken: response.accessToken };
      } else {
        // Refresh failed, clear tokens and redirect to login
        await this.logout();
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      await this.logout();
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated() {
    try {
      const accessToken = await this.tokenManager.getAccessToken();
      if (!accessToken) {
        return false;
      }

      // Validate token
      const isValid = await this.tokenManager.validateToken(accessToken);
      if (!isValid) {
        // Try to refresh token
        try {
          await this.refreshToken();
          return true;
        } catch (error) {
          return false;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const sessionData = await this.sessionManager.getSessionData();
      return sessionData?.user || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword, newPassword) {
    try {
      // Validate new password strength
      const passwordValidation = SECURITY_CONFIG.SecurityUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.passed) {
        throw new Error('New password does not meet security requirements');
      }

      // Encrypt passwords
      const encryptedCurrentPassword = await this.cryptoService.encrypt(currentPassword);
      const encryptedNewPassword = await this.cryptoService.encrypt(newPassword);

      const response = await this.makeAuthRequest('/auth/change-password', {
        currentPassword: encryptedCurrentPassword,
        newPassword: encryptedNewPassword,
        sessionId: this.sessionManager.getSessionId()
      });

      if (response.success) {
        this.logSecurityEvent('password_change', { 
          sessionId: this.sessionManager.getSessionId()
        });
        
        return { success: true };
      } else {
        throw new Error(response.message || 'Password change failed');
      }
    } catch (error) {
      throw error;
    }
  }

  // Private helper methods

  /**
   * Validate credentials format
   */
  validateCredentials(email, password) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && password && password.length >= SECURITY_CONFIG.AUTH.PASSWORD_MIN_LENGTH;
  }

  /**
   * Check if account is locked
   */
  isAccountLocked(email) {
    const lockoutTime = this.lockedAccounts.get(email);
    if (!lockoutTime) return false;
    
    if (Date.now() > lockoutTime) {
      this.lockedAccounts.delete(email);
      return false;
    }
    
    return true;
  }

  /**
   * Check rate limiting
   */
  isRateLimited(email) {
    const attempts = this.loginAttempts.get(email) || [];
    const recentAttempts = attempts.filter(
      time => Date.now() - time < SECURITY_CONFIG.RATE_LIMITING.LOGIN_ATTEMPTS.windowMs
    );
    
    return recentAttempts.length >= SECURITY_CONFIG.RATE_LIMITING.LOGIN_ATTEMPTS.max;
  }

  /**
   * Handle failed authentication
   */
  handleFailedAuth(email) {
    const attempts = this.loginAttempts.get(email) || [];
    attempts.push(Date.now());
    this.loginAttempts.set(email, attempts);

    // Check if account should be locked
    const recentAttempts = attempts.filter(
      time => Date.now() - time < SECURITY_CONFIG.RATE_LIMITING.LOGIN_ATTEMPTS.windowMs
    );

    if (recentAttempts.length >= SECURITY_CONFIG.AUTH.MAX_LOGIN_ATTEMPTS) {
      const lockoutTime = Date.now() + SECURITY_CONFIG.AUTH.LOCKOUT_DURATION;
      this.lockedAccounts.set(email, lockoutTime);
      
      this.logSecurityEvent('account_locked', { 
        email,
        lockoutTime,
        attempts: recentAttempts.length
      });
    }
  }

  /**
   * Handle successful authentication
   */
  async handleSuccessfulAuth(response, rememberMe = false) {
    // Store tokens
    await this.tokenManager.setTokens(
      response.accessToken, 
      response.refreshToken,
      rememberMe
    );

    // Initialize session
    await this.sessionManager.initializeSession(response.sessionData);

    // Set up session timeout
    this.setupSessionTimeout();
  }

  /**
   * Complete authentication process
   */
  async completeAuthentication(response) {
    await this.sessionManager.updateSession(response.sessionData);
    await this.tokenManager.updateTokens(response.accessToken, response.refreshToken);
  }

  /**
   * Generate device fingerprint
   */
  async generateDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas: canvas.toDataURL(),
      webgl: this.getWebGLFingerprint(),
      timestamp: Date.now()
    };

    return await this.cryptoService.hash(JSON.stringify(fingerprint));
  }

  /**
   * Get WebGL fingerprint
   */
  getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return null;

      return {
        vendor: gl.getParameter(gl.VENDOR),
        renderer: gl.getParameter(gl.RENDERER),
        version: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Check WebAuthn support
   */
  isWebAuthnSupported() {
    return window.PublicKeyCredential && 
           typeof window.PublicKeyCredential === 'function';
  }

  /**
   * Check biometric support
   */
  isBiometricSupported() {
    return 'credentials' in navigator && 
           'authentication' in window &&
           window.authentication.biometric;
  }

  /**
   * Setup session timeout
   */
  setupSessionTimeout() {
    // Clear existing timeout
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }

    // Set new timeout
    this.sessionTimeout = setTimeout(async () => {
      await this.logout();
      this.logSecurityEvent('session_timeout', {});
      
      // Notify user of session timeout
      window.dispatchEvent(new CustomEvent('sessionTimeout'));
    }, SECURITY_CONFIG.AUTH.SESSION_TIMEOUT);
  }

  /**
   * Clear authentication cache
   */
  clearAuthCache() {
    this.loginAttempts.clear();
    // Keep locked accounts for security
    
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  /**
   * Make authenticated request
   */
  async makeAuthRequest(endpoint, data = {}) {
    const accessToken = await this.tokenManager.getAccessToken();
    
    const response = await fetch(`${SECURITY_CONFIG.ENVIRONMENT.API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-Token': await this.getCSRFToken()
      },
      body: JSON.stringify(data),
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get CSRF token
   */
  async getCSRFToken() {
    // Implementation depends on your CSRF token strategy
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  }

  /**
   * Log security event
   */
  logSecurityEvent(event, data) {
    if (ComplianceUtils.isAuditLoggingRequired(event)) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        event,
        data,
        userAgent: navigator.userAgent,
        ip: 'client-side', // Server should log actual IP
        sessionId: this.sessionManager.getSessionId()
      };

      // Send to logging service
      this.sendToLoggingService(logEntry);
    }
  }

  /**
   * Send log entry to logging service
   */
  async sendToLoggingService(logEntry) {
    try {
      await fetch(`${SECURITY_CONFIG.ENVIRONMENT.API_BASE_URL}/audit/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.tokenManager.getAccessToken()}`
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Failed to send log entry:', error);
    }
  }
}

export default AuthService;


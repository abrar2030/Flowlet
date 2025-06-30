/**
 * Session Management Service for Flowlet Financial Application
 * Handles secure session management and user state
 */

import { SECURITY_CONFIG } from '../../config/security.js';
import CryptoService from '../encryption/CryptoService.js';

class SessionManager {
  constructor() {
    this.cryptoService = new CryptoService();
    this.sessionData = null;
    this.sessionTimeout = null;
  }

  /**
   * Initialize session
   */
  async initializeSession(sessionData) {
    try {
      // Encrypt session data
      const encryptedData = await this.cryptoService.encryptForStorage(sessionData, 'session');
      
      // Store in session storage
      sessionStorage.setItem('session-data', encryptedData);
      
      // Cache session data
      this.sessionData = sessionData;
      
      // Set session timeout
      this.setupSessionTimeout();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize session:', error);
      return false;
    }
  }

  /**
   * Update session data
   */
  async updateSession(newSessionData) {
    try {
      const currentData = await this.getSessionData();
      const updatedData = { ...currentData, ...newSessionData };
      
      return await this.initializeSession(updatedData);
    } catch (error) {
      console.error('Failed to update session:', error);
      return false;
    }
  }

  /**
   * Get session data
   */
  async getSessionData() {
    try {
      // Return cached data if available
      if (this.sessionData) {
        return this.sessionData;
      }

      // Get from storage
      const encryptedData = sessionStorage.getItem('session-data');
      if (!encryptedData) return null;

      // Decrypt and cache
      this.sessionData = await this.cryptoService.decryptFromStorage(encryptedData, 'session');
      
      return this.sessionData;
    } catch (error) {
      console.error('Failed to get session data:', error);
      return null;
    }
  }

  /**
   * Get session ID
   */
  getSessionId() {
    return this.sessionData?.sessionId || sessionStorage.getItem('session-id');
  }

  /**
   * Validate session
   */
  async validateSession() {
    try {
      const sessionData = await this.getSessionData();
      if (!sessionData) return false;

      // Check session expiry
      const now = Date.now();
      const sessionAge = now - (sessionData.createdAt || 0);
      
      if (sessionAge > SECURITY_CONFIG.AUTH.SESSION_TIMEOUT) {
        await this.clearSession();
        return false;
      }

      // Check last activity
      const lastActivity = sessionData.lastActivity || sessionData.createdAt || 0;
      const inactivityTime = now - lastActivity;
      
      if (inactivityTime > SECURITY_CONFIG.AUTH.SESSION_TIMEOUT) {
        await this.clearSession();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  }

  /**
   * Update last activity
   */
  async updateLastActivity() {
    try {
      const sessionData = await this.getSessionData();
      if (sessionData) {
        sessionData.lastActivity = Date.now();
        await this.updateSession(sessionData);
      }
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  /**
   * Clear session
   */
  async clearSession() {
    try {
      // Clear storage
      sessionStorage.removeItem('session-data');
      sessionStorage.removeItem('session-id');
      
      // Clear cache
      this.sessionData = null;
      
      // Clear timeout
      if (this.sessionTimeout) {
        clearTimeout(this.sessionTimeout);
        this.sessionTimeout = null;
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear session:', error);
      return false;
    }
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
      await this.clearSession();
      
      // Dispatch session timeout event
      window.dispatchEvent(new CustomEvent('sessionTimeout'));
    }, SECURITY_CONFIG.AUTH.SESSION_TIMEOUT);
  }

  /**
   * Extend session
   */
  async extendSession() {
    try {
      const sessionData = await this.getSessionData();
      if (sessionData) {
        sessionData.lastActivity = Date.now();
        await this.updateSession(sessionData);
        this.setupSessionTimeout();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to extend session:', error);
      return false;
    }
  }

  /**
   * Get session remaining time
   */
  async getSessionRemainingTime() {
    try {
      const sessionData = await this.getSessionData();
      if (!sessionData) return 0;

      const lastActivity = sessionData.lastActivity || sessionData.createdAt || 0;
      const elapsed = Date.now() - lastActivity;
      const remaining = SECURITY_CONFIG.AUTH.SESSION_TIMEOUT - elapsed;
      
      return Math.max(0, remaining);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if session is active
   */
  async isSessionActive() {
    const remainingTime = await this.getSessionRemainingTime();
    return remainingTime > 0;
  }
}

export default SessionManager;


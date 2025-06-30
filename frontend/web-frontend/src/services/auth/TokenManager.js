/**
 * Token Management Service for Flowlet Financial Application
 * Handles secure storage and management of authentication tokens
 */

import { SECURITY_CONFIG } from '../../config/security.js';
import CryptoService from '../encryption/CryptoService.js';

class TokenManager {
  constructor() {
    this.cryptoService = new CryptoService();
    this.tokenCache = new Map();
    this.refreshPromise = null;
  }

  /**
   * Set authentication tokens
   */
  async setTokens(accessToken, refreshToken, rememberMe = false) {
    try {
      // Encrypt tokens before storage
      const encryptedAccessToken = await this.cryptoService.encrypt(accessToken, 'access-token');
      const encryptedRefreshToken = await this.cryptoService.encrypt(refreshToken, 'refresh-token');

      const tokenData = {
        accessToken: encryptedAccessToken,
        refreshToken: encryptedRefreshToken,
        timestamp: Date.now(),
        expiresAt: Date.now() + SECURITY_CONFIG.AUTH.TOKEN_EXPIRY,
        rememberMe
      };

      // Store in appropriate storage based on rememberMe preference
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('auth-tokens', JSON.stringify(tokenData));

      // Cache decrypted tokens temporarily
      this.tokenCache.set('access', accessToken);
      this.tokenCache.set('refresh', refreshToken);

      return true;
    } catch (error) {
      console.error('Failed to set tokens:', error);
      return false;
    }
  }

  /**
   * Get access token
   */
  async getAccessToken() {
    try {
      // Check cache first
      if (this.tokenCache.has('access')) {
        const token = this.tokenCache.get('access');
        if (await this.validateToken(token)) {
          return token;
        }
        this.tokenCache.delete('access');
      }

      // Get from storage
      const tokenData = this.getStoredTokenData();
      if (!tokenData) return null;

      // Check if token is expired
      if (Date.now() > tokenData.expiresAt) {
        await this.clearTokens();
        return null;
      }

      // Decrypt and return
      const accessToken = await this.cryptoService.decrypt(tokenData.accessToken, 'access-token');
      this.tokenCache.set('access', accessToken);
      
      return accessToken;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token
   */
  async getRefreshToken() {
    try {
      // Check cache first
      if (this.tokenCache.has('refresh')) {
        return this.tokenCache.get('refresh');
      }

      // Get from storage
      const tokenData = this.getStoredTokenData();
      if (!tokenData) return null;

      // Decrypt and return
      const refreshToken = await this.cryptoService.decrypt(tokenData.refreshToken, 'refresh-token');
      this.tokenCache.set('refresh', refreshToken);
      
      return refreshToken;
    } catch (error) {
      console.error('Failed to get refresh token:', error);
      return null;
    }
  }

  /**
   * Update tokens
   */
  async updateTokens(accessToken, refreshToken) {
    const tokenData = this.getStoredTokenData();
    if (!tokenData) return false;

    return await this.setTokens(accessToken, refreshToken, tokenData.rememberMe);
  }

  /**
   * Validate token
   */
  async validateToken(token) {
    if (!token) return false;

    try {
      // Parse JWT token (simplified validation)
      const parts = token.split('.');
      if (parts.length !== 3) return false;

      const payload = JSON.parse(atob(parts[1]));
      const now = Math.floor(Date.now() / 1000);

      // Check expiration
      if (payload.exp && payload.exp < now) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all tokens
   */
  async clearTokens() {
    try {
      // Clear from both storages
      localStorage.removeItem('auth-tokens');
      sessionStorage.removeItem('auth-tokens');

      // Clear cache
      this.tokenCache.clear();

      // Clear refresh promise
      this.refreshPromise = null;

      return true;
    } catch (error) {
      console.error('Failed to clear tokens:', error);
      return false;
    }
  }

  /**
   * Get stored token data
   */
  getStoredTokenData() {
    try {
      // Try session storage first, then local storage
      let tokenDataStr = sessionStorage.getItem('auth-tokens') || 
                        localStorage.getItem('auth-tokens');
      
      if (!tokenDataStr) return null;

      return JSON.parse(tokenDataStr);
    } catch (error) {
      console.error('Failed to get stored token data:', error);
      return null;
    }
  }

  /**
   * Check if tokens exist
   */
  hasTokens() {
    return this.getStoredTokenData() !== null;
  }

  /**
   * Get token expiry time
   */
  getTokenExpiry() {
    const tokenData = this.getStoredTokenData();
    return tokenData ? tokenData.expiresAt : null;
  }

  /**
   * Check if token is about to expire
   */
  isTokenExpiringSoon(thresholdMs = 5 * 60 * 1000) { // 5 minutes
    const expiryTime = this.getTokenExpiry();
    if (!expiryTime) return false;

    return (expiryTime - Date.now()) < thresholdMs;
  }
}

export default TokenManager;


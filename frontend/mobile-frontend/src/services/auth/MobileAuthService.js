/**
 * Mobile Authentication Service for Flowlet Financial Application
 * Enhanced authentication with biometric, PIN, and mobile-specific features
 */

import { SECURITY_CONFIG } from '../../config/security.js';
import MobileCryptoService from '../encryption/MobileCryptoService.js';
import { Capacitor } from '@capacitor/core';
import { BiometricAuth } from '@capacitor/biometric-auth';
import { Device } from '@capacitor/device';
import { SecureStoragePlugin } from '@capacitor/secure-storage';

class MobileAuthService {
  constructor() {
    this.cryptoService = new MobileCryptoService();
    this.isNative = Capacitor.isNativePlatform();
    this.deviceInfo = null;
    this.biometricAvailable = false;
    this.initializeService();
  }

  /**
   * Initialize the mobile auth service
   */
  async initializeService() {
    try {
      // Get device information
      this.deviceInfo = await Device.getInfo();
      
      // Check biometric availability
      if (this.isNative) {
        this.biometricAvailable = await this.checkBiometricAvailability();
      }

      // Initialize secure storage
      await this.initializeSecureStorage();
      
      console.log('Mobile Auth Service initialized');
    } catch (error) {
      console.error('Failed to initialize Mobile Auth Service:', error);
    }
  }

  /**
   * Check if biometric authentication is available
   */
  async checkBiometricAvailability() {
    try {
      if (!this.isNative) return false;
      
      const result = await BiometricAuth.checkBiometry();
      return result.isAvailable;
    } catch (error) {
      console.error('Biometric check failed:', error);
      return false;
    }
  }

  /**
   * Initialize secure storage
   */
  async initializeSecureStorage() {
    try {
      if (this.isNative) {
        // Native secure storage initialization
        await SecureStoragePlugin.configure({
          group: SECURITY_CONFIG.ENCRYPTION.KEYCHAIN_SERVICE,
          synchronize: true
        });
      } else {
        // Web fallback - use encrypted localStorage
        console.log('Using web-based secure storage fallback');
      }
    } catch (error) {
      console.error('Secure storage initialization failed:', error);
    }
  }

  /**
   * Authenticate user with username/password
   */
  async authenticateWithPassword(username, password, rememberMe = false) {
    try {
      // Validate inputs
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      // Check device security
      const deviceSecurity = await SECURITY_CONFIG.SecurityUtils.validateDeviceSecurity();
      if (!deviceSecurity.isSecure) {
        throw new Error(`Device security issues: ${deviceSecurity.issues.join(', ')}`);
      }

      // Generate device fingerprint
      const deviceFingerprint = await SECURITY_CONFIG.SecurityUtils.generateDeviceFingerprint();

      // Prepare authentication request
      const authRequest = {
        username,
        password: await this.cryptoService.hashPassword(password),
        deviceInfo: this.deviceInfo,
        deviceFingerprint: deviceFingerprint.hash,
        platform: this.isNative ? 'mobile-native' : 'mobile-web',
        timestamp: Date.now()
      };

      // Send authentication request
      const response = await this.sendAuthRequest('/api/auth/login', authRequest);

      if (response.success) {
        // Store authentication data
        await this.storeAuthData(response.data, rememberMe);
        
        // Set up biometric authentication if available
        if (this.biometricAvailable && response.data.user.biometricEnabled) {
          await this.setupBiometricAuth(response.data.tokens.accessToken);
        }

        return {
          success: true,
          user: response.data.user,
          requiresMFA: response.data.requiresMFA,
          mfaToken: response.data.mfaToken
        };
      } else {
        throw new Error(response.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Password authentication failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate with biometric
   */
  async authenticateWithBiometric() {
    try {
      if (!this.biometricAvailable) {
        throw new Error('Biometric authentication not available');
      }

      // Check if biometric data exists
      const biometricData = await this.getBiometricData();
      if (!biometricData) {
        throw new Error('Biometric authentication not set up');
      }

      // Perform biometric authentication
      const biometricResult = await BiometricAuth.authenticate({
        reason: 'Authenticate to access your Flowlet account',
        title: 'Biometric Authentication',
        subtitle: 'Use your fingerprint or face to sign in',
        description: 'Place your finger on the sensor or look at the camera',
        fallbackTitle: 'Use PIN instead',
        negativeText: 'Cancel'
      });

      if (biometricResult.isAuthenticated) {
        // Decrypt stored authentication token
        const decryptedToken = await this.cryptoService.decryptWithBiometric(
          biometricData.encryptedToken,
          SECURITY_CONFIG.ENCRYPTION.BIOMETRIC_KEY_ALIAS
        );

        // Validate token with server
        const response = await this.validateBiometricToken(decryptedToken);
        
        if (response.success) {
          await this.storeAuthData(response.data, true);
          return {
            success: true,
            user: response.data.user
          };
        } else {
          throw new Error('Biometric token validation failed');
        }
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate with PIN
   */
  async authenticateWithPIN(pin) {
    try {
      if (!pin || pin.length !== SECURITY_CONFIG.AUTH.PIN_LENGTH) {
        throw new Error(`PIN must be ${SECURITY_CONFIG.AUTH.PIN_LENGTH} digits`);
      }

      // Get stored PIN data
      const pinData = await this.getPINData();
      if (!pinData) {
        throw new Error('PIN authentication not set up');
      }

      // Verify PIN
      const hashedPIN = await this.cryptoService.hashPIN(pin, pinData.salt);
      if (hashedPIN !== pinData.hashedPIN) {
        throw new Error('Invalid PIN');
      }

      // Decrypt stored authentication token
      const decryptedToken = await this.cryptoService.decrypt(
        pinData.encryptedToken,
        pin
      );

      // Validate token with server
      const response = await this.validatePINToken(decryptedToken);
      
      if (response.success) {
        await this.storeAuthData(response.data, true);
        return {
          success: true,
          user: response.data.user
        };
      } else {
        throw new Error('PIN token validation failed');
      }
    } catch (error) {
      console.error('PIN authentication failed:', error);
      throw error;
    }
  }

  /**
   * Setup biometric authentication
   */
  async setupBiometricAuth(accessToken) {
    try {
      if (!this.biometricAvailable) {
        throw new Error('Biometric authentication not available');
      }

      // Encrypt access token with biometric key
      const encryptedToken = await this.cryptoService.encryptWithBiometric(
        accessToken,
        SECURITY_CONFIG.ENCRYPTION.BIOMETRIC_KEY_ALIAS
      );

      // Store biometric data
      const biometricData = {
        encryptedToken,
        setupDate: Date.now(),
        deviceId: this.deviceInfo.identifier
      };

      await this.storeBiometricData(biometricData);
      
      return true;
    } catch (error) {
      console.error('Biometric setup failed:', error);
      throw error;
    }
  }

  /**
   * Setup PIN authentication
   */
  async setupPIN(pin, accessToken) {
    try {
      if (!pin || pin.length !== SECURITY_CONFIG.AUTH.PIN_LENGTH) {
        throw new Error(`PIN must be ${SECURITY_CONFIG.AUTH.PIN_LENGTH} digits`);
      }

      // Validate PIN complexity if required
      if (SECURITY_CONFIG.AUTH.PIN_COMPLEXITY) {
        if (!/^\d+$/.test(pin)) {
          throw new Error('PIN must contain only digits');
        }
        
        // Check for simple patterns
        if (this.isSimplePIN(pin)) {
          throw new Error('PIN is too simple. Please choose a more complex PIN');
        }
      }

      // Generate salt and hash PIN
      const salt = SECURITY_CONFIG.SecurityUtils.generateSecureRandom(32);
      const hashedPIN = await this.cryptoService.hashPIN(pin, salt);

      // Encrypt access token with PIN
      const encryptedToken = await this.cryptoService.encrypt(accessToken, pin);

      // Store PIN data
      const pinData = {
        hashedPIN,
        salt,
        encryptedToken,
        setupDate: Date.now(),
        deviceId: this.deviceInfo.identifier
      };

      await this.storePINData(pinData);
      
      return true;
    } catch (error) {
      console.error('PIN setup failed:', error);
      throw error;
    }
  }

  /**
   * Verify MFA token
   */
  async verifyMFA(mfaToken, code) {
    try {
      const response = await this.sendAuthRequest('/api/auth/verify-mfa', {
        mfaToken,
        code,
        deviceInfo: this.deviceInfo,
        timestamp: Date.now()
      });

      if (response.success) {
        await this.storeAuthData(response.data, true);
        return {
          success: true,
          user: response.data.user
        };
      } else {
        throw new Error(response.message || 'MFA verification failed');
      }
    } catch (error) {
      console.error('MFA verification failed:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout() {
    try {
      // Get current tokens
      const accessToken = await this.getAccessToken();
      
      if (accessToken) {
        // Notify server of logout
        await this.sendAuthRequest('/api/auth/logout', {
          deviceInfo: this.deviceInfo,
          timestamp: Date.now()
        });
      }

      // Clear all stored authentication data
      await this.clearAuthData();
      
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear local data even if server request fails
      await this.clearAuthData();
      return true;
    }
  }

  /**
   * Store authentication data securely
   */
  async storeAuthData(authData, persistent = false) {
    try {
      const encryptedData = await this.cryptoService.encryptForStorage(authData, 'auth-data');
      
      if (this.isNative) {
        // Use native secure storage
        await SecureStoragePlugin.set({
          key: 'auth-data',
          value: encryptedData
        });
      } else {
        // Use encrypted web storage
        const storage = persistent ? localStorage : sessionStorage;
        storage.setItem('auth-data', encryptedData);
      }
    } catch (error) {
      console.error('Failed to store auth data:', error);
      throw error;
    }
  }

  /**
   * Get stored authentication data
   */
  async getAuthData() {
    try {
      let encryptedData;
      
      if (this.isNative) {
        // Get from native secure storage
        const result = await SecureStoragePlugin.get({ key: 'auth-data' });
        encryptedData = result.value;
      } else {
        // Get from web storage
        encryptedData = sessionStorage.getItem('auth-data') || 
                      localStorage.getItem('auth-data');
      }

      if (!encryptedData) return null;

      return await this.cryptoService.decryptFromStorage(encryptedData, 'auth-data');
    } catch (error) {
      console.error('Failed to get auth data:', error);
      return null;
    }
  }

  /**
   * Get access token
   */
  async getAccessToken() {
    try {
      const authData = await this.getAuthData();
      return authData?.tokens?.accessToken || null;
    } catch (error) {
      console.error('Failed to get access token:', error);
      return null;
    }
  }

  /**
   * Clear all authentication data
   */
  async clearAuthData() {
    try {
      if (this.isNative) {
        // Clear native secure storage
        await SecureStoragePlugin.remove({ key: 'auth-data' });
        await SecureStoragePlugin.remove({ key: 'biometric-data' });
        await SecureStoragePlugin.remove({ key: 'pin-data' });
      } else {
        // Clear web storage
        sessionStorage.removeItem('auth-data');
        localStorage.removeItem('auth-data');
        localStorage.removeItem('biometric-data');
        localStorage.removeItem('pin-data');
      }
    } catch (error) {
      console.error('Failed to clear auth data:', error);
    }
  }

  /**
   * Store biometric data
   */
  async storeBiometricData(data) {
    try {
      const encryptedData = await this.cryptoService.encryptForStorage(data, 'biometric');
      
      if (this.isNative) {
        await SecureStoragePlugin.set({
          key: 'biometric-data',
          value: encryptedData
        });
      } else {
        localStorage.setItem('biometric-data', encryptedData);
      }
    } catch (error) {
      console.error('Failed to store biometric data:', error);
      throw error;
    }
  }

  /**
   * Get biometric data
   */
  async getBiometricData() {
    try {
      let encryptedData;
      
      if (this.isNative) {
        const result = await SecureStoragePlugin.get({ key: 'biometric-data' });
        encryptedData = result.value;
      } else {
        encryptedData = localStorage.getItem('biometric-data');
      }

      if (!encryptedData) return null;

      return await this.cryptoService.decryptFromStorage(encryptedData, 'biometric');
    } catch (error) {
      console.error('Failed to get biometric data:', error);
      return null;
    }
  }

  /**
   * Store PIN data
   */
  async storePINData(data) {
    try {
      const encryptedData = await this.cryptoService.encryptForStorage(data, 'pin');
      
      if (this.isNative) {
        await SecureStoragePlugin.set({
          key: 'pin-data',
          value: encryptedData
        });
      } else {
        localStorage.setItem('pin-data', encryptedData);
      }
    } catch (error) {
      console.error('Failed to store PIN data:', error);
      throw error;
    }
  }

  /**
   * Get PIN data
   */
  async getPINData() {
    try {
      let encryptedData;
      
      if (this.isNative) {
        const result = await SecureStoragePlugin.get({ key: 'pin-data' });
        encryptedData = result.value;
      } else {
        encryptedData = localStorage.getItem('pin-data');
      }

      if (!encryptedData) return null;

      return await this.cryptoService.decryptFromStorage(encryptedData, 'pin');
    } catch (error) {
      console.error('Failed to get PIN data:', error);
      return null;
    }
  }

  /**
   * Check if PIN is too simple
   */
  isSimplePIN(pin) {
    // Check for sequential numbers
    const sequential = ['123456', '654321', '012345', '543210'];
    if (sequential.includes(pin)) return true;

    // Check for repeated digits
    if (/^(\d)\1+$/.test(pin)) return true;

    // Check for common patterns
    const common = ['000000', '111111', '123123', '456456'];
    if (common.includes(pin)) return true;

    return false;
  }

  /**
   * Send authentication request
   */
  async sendAuthRequest(endpoint, data) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Mobile-App': SECURITY_CONFIG.HEADERS['X-Mobile-App'],
          'X-Device-Type': SECURITY_CONFIG.HEADERS['X-Device-Type']
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Auth request failed:', error);
      throw error;
    }
  }

  /**
   * Validate biometric token
   */
  async validateBiometricToken(token) {
    return await this.sendAuthRequest('/api/auth/validate-biometric', {
      token,
      deviceInfo: this.deviceInfo,
      timestamp: Date.now()
    });
  }

  /**
   * Validate PIN token
   */
  async validatePINToken(token) {
    return await this.sendAuthRequest('/api/auth/validate-pin', {
      token,
      deviceInfo: this.deviceInfo,
      timestamp: Date.now()
    });
  }
}

export default MobileAuthService;


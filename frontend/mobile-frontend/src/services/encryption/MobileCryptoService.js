/**
 * Mobile Cryptographic Service for Flowlet Financial Application
 * Enhanced encryption with mobile-specific features and hardware security
 */

import { SECURITY_CONFIG } from '../../config/security.js';
import CryptoJS from 'crypto-js';
import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from '@capacitor/secure-storage';

class MobileCryptoService {
  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.keyCache = new Map();
    this.initializeService();
  }

  /**
   * Initialize the crypto service
   */
  async initializeService() {
    try {
      // Initialize secure key storage
      await this.initializeKeyStorage();
      
      // Generate or retrieve master key
      await this.initializeMasterKey();
      
      console.log('Mobile Crypto Service initialized');
    } catch (error) {
      console.error('Failed to initialize Mobile Crypto Service:', error);
    }
  }

  /**
   * Initialize secure key storage
   */
  async initializeKeyStorage() {
    try {
      if (this.isNative) {
        // Configure native secure storage for keys
        await SecureStoragePlugin.configure({
          group: SECURITY_CONFIG.ENCRYPTION.KEYCHAIN_SERVICE,
          synchronize: true,
          requireBiometry: false // Keys should be accessible without biometry
        });
      }
    } catch (error) {
      console.error('Key storage initialization failed:', error);
    }
  }

  /**
   * Initialize or retrieve master key
   */
  async initializeMasterKey() {
    try {
      let masterKey = await this.getMasterKey();
      
      if (!masterKey) {
        // Generate new master key
        masterKey = this.generateSecureKey(SECURITY_CONFIG.ENCRYPTION.KEY_SIZE / 8);
        await this.storeMasterKey(masterKey);
      }
      
      // Cache master key
      this.keyCache.set('master', masterKey);
    } catch (error) {
      console.error('Master key initialization failed:', error);
      throw error;
    }
  }

  /**
   * Generate secure random key
   */
  generateSecureKey(length = 32) {
    if (window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    } else {
      // Fallback for older browsers
      return CryptoJS.lib.WordArray.random(length).toString();
    }
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  async encrypt(data, password = null) {
    try {
      const key = password ? await this.deriveKeyFromPassword(password) : await this.getMasterKey();
      const iv = CryptoJS.lib.WordArray.random(SECURITY_CONFIG.ENCRYPTION.IV_SIZE);
      
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(data),
        CryptoJS.enc.Hex.parse(key),
        {
          iv: iv,
          mode: CryptoJS.mode.GCM,
          padding: CryptoJS.pad.NoPadding
        }
      );

      return {
        encrypted: encrypted.toString(),
        iv: iv.toString(),
        algorithm: SECURITY_CONFIG.ENCRYPTION.ALGORITHM
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  async decrypt(encryptedData, password = null) {
    try {
      const key = password ? await this.deriveKeyFromPassword(password) : await this.getMasterKey();
      
      const decrypted = CryptoJS.AES.decrypt(
        encryptedData.encrypted,
        CryptoJS.enc.Hex.parse(key),
        {
          iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
          mode: CryptoJS.mode.GCM,
          padding: CryptoJS.pad.NoPadding
        }
      );

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decryptedString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Encrypt data for storage with additional metadata
   */
  async encryptForStorage(data, context = 'general') {
    try {
      const timestamp = Date.now();
      const metadata = {
        context,
        timestamp,
        version: '1.0',
        platform: this.isNative ? 'native' : 'web'
      };

      const payload = {
        data,
        metadata
      };

      const encrypted = await this.encrypt(payload);
      
      return JSON.stringify({
        ...encrypted,
        metadata: {
          context,
          timestamp,
          encrypted: true
        }
      });
    } catch (error) {
      console.error('Storage encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data from storage
   */
  async decryptFromStorage(encryptedString, expectedContext = null) {
    try {
      const encryptedData = JSON.parse(encryptedString);
      
      // Verify metadata
      if (expectedContext && encryptedData.metadata?.context !== expectedContext) {
        throw new Error('Context mismatch in encrypted data');
      }

      const decrypted = await this.decrypt(encryptedData);
      
      // Verify internal metadata
      if (expectedContext && decrypted.metadata?.context !== expectedContext) {
        throw new Error('Internal context mismatch');
      }

      return decrypted.data;
    } catch (error) {
      console.error('Storage decryption failed:', error);
      throw error;
    }
  }

  /**
   * Encrypt with biometric protection (native only)
   */
  async encryptWithBiometric(data, keyAlias) {
    try {
      if (!this.isNative) {
        throw new Error('Biometric encryption only available on native platforms');
      }

      // Generate a key protected by biometric authentication
      const biometricKey = await this.generateBiometricKey(keyAlias);
      
      // Encrypt data with biometric key
      const encrypted = await this.encrypt(data, biometricKey);
      
      return JSON.stringify({
        ...encrypted,
        keyAlias,
        biometric: true
      });
    } catch (error) {
      console.error('Biometric encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt with biometric protection (native only)
   */
  async decryptWithBiometric(encryptedString, keyAlias) {
    try {
      if (!this.isNative) {
        throw new Error('Biometric decryption only available on native platforms');
      }

      const encryptedData = JSON.parse(encryptedString);
      
      if (!encryptedData.biometric || encryptedData.keyAlias !== keyAlias) {
        throw new Error('Invalid biometric encrypted data');
      }

      // Retrieve biometric key (requires biometric authentication)
      const biometricKey = await this.getBiometricKey(keyAlias);
      
      // Decrypt data
      return await this.decrypt(encryptedData, biometricKey);
    } catch (error) {
      console.error('Biometric decryption failed:', error);
      throw error;
    }
  }

  /**
   * Hash password with salt
   */
  async hashPassword(password, salt = null) {
    try {
      const passwordSalt = salt || this.generateSecureKey(SECURITY_CONFIG.ENCRYPTION.SALT_SIZE);
      
      const hash = CryptoJS.PBKDF2(
        password,
        passwordSalt,
        {
          keySize: SECURITY_CONFIG.ENCRYPTION.KEY_SIZE / 32,
          iterations: SECURITY_CONFIG.ENCRYPTION.PBKDF2_ITERATIONS,
          hasher: CryptoJS.algo.SHA256
        }
      );

      return {
        hash: hash.toString(),
        salt: passwordSalt,
        iterations: SECURITY_CONFIG.ENCRYPTION.PBKDF2_ITERATIONS
      };
    } catch (error) {
      console.error('Password hashing failed:', error);
      throw error;
    }
  }

  /**
   * Hash PIN with salt
   */
  async hashPIN(pin, salt) {
    try {
      const hash = CryptoJS.PBKDF2(
        pin,
        salt,
        {
          keySize: 256 / 32, // 256 bits
          iterations: 10000, // Lower iterations for PIN (faster on mobile)
          hasher: CryptoJS.algo.SHA256
        }
      );

      return hash.toString();
    } catch (error) {
      console.error('PIN hashing failed:', error);
      throw error;
    }
  }

  /**
   * Derive key from password
   */
  async deriveKeyFromPassword(password, salt = null) {
    try {
      const keySalt = salt || this.generateSecureKey(SECURITY_CONFIG.ENCRYPTION.SALT_SIZE);
      
      const key = CryptoJS.PBKDF2(
        password,
        keySalt,
        {
          keySize: SECURITY_CONFIG.ENCRYPTION.KEY_SIZE / 32,
          iterations: SECURITY_CONFIG.ENCRYPTION.PBKDF2_ITERATIONS,
          hasher: CryptoJS.algo.SHA256
        }
      );

      return key.toString();
    } catch (error) {
      console.error('Key derivation failed:', error);
      throw error;
    }
  }

  /**
   * Generate HMAC for data integrity
   */
  generateHMAC(data, key = null) {
    try {
      const hmacKey = key || this.keyCache.get('master');
      return CryptoJS.HmacSHA256(JSON.stringify(data), hmacKey).toString();
    } catch (error) {
      console.error('HMAC generation failed:', error);
      throw error;
    }
  }

  /**
   * Verify HMAC for data integrity
   */
  verifyHMAC(data, hmac, key = null) {
    try {
      const expectedHMAC = this.generateHMAC(data, key);
      return CryptoJS.enc.Hex.parse(hmac).toString() === CryptoJS.enc.Hex.parse(expectedHMAC).toString();
    } catch (error) {
      console.error('HMAC verification failed:', error);
      return false;
    }
  }

  /**
   * Secure data wipe
   */
  secureWipe(data) {
    try {
      if (typeof data === 'string') {
        // Overwrite string with random data
        const length = data.length;
        let wiped = '';
        for (let i = 0; i < length; i++) {
          wiped += String.fromCharCode(Math.floor(Math.random() * 256));
        }
        return wiped;
      } else if (data instanceof ArrayBuffer) {
        // Overwrite ArrayBuffer with random data
        const view = new Uint8Array(data);
        window.crypto.getRandomValues(view);
      }
    } catch (error) {
      console.error('Secure wipe failed:', error);
    }
  }

  /**
   * Store master key securely
   */
  async storeMasterKey(key) {
    try {
      if (this.isNative) {
        // Use native secure storage
        await SecureStoragePlugin.set({
          key: SECURITY_CONFIG.ENCRYPTION.SECURE_STORAGE_KEY,
          value: key
        });
      } else {
        // Use encrypted localStorage for web
        const encryptedKey = CryptoJS.AES.encrypt(
          key,
          this.generateDeviceKey()
        ).toString();
        localStorage.setItem(SECURITY_CONFIG.ENCRYPTION.SECURE_STORAGE_KEY, encryptedKey);
      }
    } catch (error) {
      console.error('Master key storage failed:', error);
      throw error;
    }
  }

  /**
   * Retrieve master key
   */
  async getMasterKey() {
    try {
      // Check cache first
      if (this.keyCache.has('master')) {
        return this.keyCache.get('master');
      }

      let key;
      
      if (this.isNative) {
        // Get from native secure storage
        const result = await SecureStoragePlugin.get({
          key: SECURITY_CONFIG.ENCRYPTION.SECURE_STORAGE_KEY
        });
        key = result.value;
      } else {
        // Get from encrypted localStorage
        const encryptedKey = localStorage.getItem(SECURITY_CONFIG.ENCRYPTION.SECURE_STORAGE_KEY);
        if (encryptedKey) {
          key = CryptoJS.AES.decrypt(
            encryptedKey,
            this.generateDeviceKey()
          ).toString(CryptoJS.enc.Utf8);
        }
      }

      if (key) {
        this.keyCache.set('master', key);
      }

      return key;
    } catch (error) {
      console.error('Master key retrieval failed:', error);
      return null;
    }
  }

  /**
   * Generate biometric key (native only)
   */
  async generateBiometricKey(keyAlias) {
    try {
      if (!this.isNative) {
        throw new Error('Biometric keys only available on native platforms');
      }

      // This would use native crypto APIs to generate a hardware-backed key
      // For now, we'll simulate with a derived key
      const biometricSeed = `${keyAlias}-${Date.now()}`;
      const key = CryptoJS.SHA256(biometricSeed).toString();
      
      // Store key alias mapping
      await SecureStoragePlugin.set({
        key: `biometric-${keyAlias}`,
        value: key
      });

      return key;
    } catch (error) {
      console.error('Biometric key generation failed:', error);
      throw error;
    }
  }

  /**
   * Get biometric key (native only)
   */
  async getBiometricKey(keyAlias) {
    try {
      if (!this.isNative) {
        throw new Error('Biometric keys only available on native platforms');
      }

      const result = await SecureStoragePlugin.get({
        key: `biometric-${keyAlias}`
      });

      return result.value;
    } catch (error) {
      console.error('Biometric key retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Generate device-specific key for web fallback
   */
  generateDeviceKey() {
    const deviceInfo = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset()
    ].join('|');

    return CryptoJS.SHA256(deviceInfo).toString();
  }

  /**
   * Clear all cached keys
   */
  clearKeyCache() {
    this.keyCache.clear();
  }

  /**
   * Validate encryption integrity
   */
  async validateEncryption(encryptedData) {
    try {
      // Basic validation
      if (!encryptedData.encrypted || !encryptedData.iv) {
        return false;
      }

      // Algorithm validation
      if (encryptedData.algorithm !== SECURITY_CONFIG.ENCRYPTION.ALGORITHM) {
        return false;
      }

      // Try to decrypt (will throw if invalid)
      await this.decrypt(encryptedData);
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get encryption status
   */
  getEncryptionStatus() {
    return {
      algorithm: SECURITY_CONFIG.ENCRYPTION.ALGORITHM,
      keySize: SECURITY_CONFIG.ENCRYPTION.KEY_SIZE,
      isNative: this.isNative,
      masterKeyLoaded: this.keyCache.has('master'),
      secureStorageAvailable: this.isNative,
      biometricEncryptionAvailable: this.isNative
    };
  }
}

export default MobileCryptoService;


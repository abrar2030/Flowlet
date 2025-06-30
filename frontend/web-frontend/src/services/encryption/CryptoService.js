/**
 * Comprehensive Encryption Service for Flowlet Financial Application
 * Implements client-side encryption, key management, and cryptographic utilities
 */

import { SECURITY_CONFIG } from '../../config/security.js';

class CryptoService {
  constructor() {
    this.keyCache = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the crypto service
   */
  async initialize() {
    try {
      // Check for Web Crypto API support
      if (!window.crypto || !window.crypto.subtle) {
        throw new Error('Web Crypto API not supported');
      }

      // Initialize master key if not exists
      await this.initializeMasterKey();
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize crypto service:', error);
      return false;
    }
  }

  /**
   * Encrypt data using AES-GCM
   */
  async encrypt(data, keyId = 'default') {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Convert data to ArrayBuffer if it's a string
      const dataBuffer = typeof data === 'string' 
        ? new TextEncoder().encode(data)
        : data;

      // Get or generate encryption key
      const key = await this.getOrGenerateKey(keyId);

      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(SECURITY_CONFIG.ENCRYPTION.IV_LENGTH));

      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: SECURITY_CONFIG.ENCRYPTION.ALGORITHM,
          iv: iv,
          tagLength: SECURITY_CONFIG.ENCRYPTION.TAG_LENGTH * 8
        },
        key,
        dataBuffer
      );

      // Combine IV and encrypted data
      const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      result.set(iv, 0);
      result.set(new Uint8Array(encryptedBuffer), iv.length);

      // Return base64 encoded result
      return this.arrayBufferToBase64(result.buffer);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data using AES-GCM
   */
  async decrypt(encryptedData, keyId = 'default') {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      // Convert base64 to ArrayBuffer
      const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
      const encryptedArray = new Uint8Array(encryptedBuffer);

      // Extract IV and encrypted data
      const iv = encryptedArray.slice(0, SECURITY_CONFIG.ENCRYPTION.IV_LENGTH);
      const data = encryptedArray.slice(SECURITY_CONFIG.ENCRYPTION.IV_LENGTH);

      // Get decryption key
      const key = await this.getOrGenerateKey(keyId);

      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: SECURITY_CONFIG.ENCRYPTION.ALGORITHM,
          iv: iv,
          tagLength: SECURITY_CONFIG.ENCRYPTION.TAG_LENGTH * 8
        },
        key,
        data
      );

      // Convert back to string
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash data using SHA-256
   */
  async hash(data) {
    try {
      const dataBuffer = typeof data === 'string' 
        ? new TextEncoder().encode(data)
        : data;

      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      return this.arrayBufferToHex(hashBuffer);
    } catch (error) {
      console.error('Hashing failed:', error);
      throw new Error('Failed to hash data');
    }
  }

  /**
   * Generate HMAC for data integrity
   */
  async generateHMAC(data, keyId = 'hmac') {
    try {
      const key = await this.getOrGenerateHMACKey(keyId);
      const dataBuffer = typeof data === 'string' 
        ? new TextEncoder().encode(data)
        : data;

      const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        dataBuffer
      );

      return this.arrayBufferToBase64(signature);
    } catch (error) {
      console.error('HMAC generation failed:', error);
      throw new Error('Failed to generate HMAC');
    }
  }

  /**
   * Verify HMAC
   */
  async verifyHMAC(data, signature, keyId = 'hmac') {
    try {
      const key = await this.getOrGenerateHMACKey(keyId);
      const dataBuffer = typeof data === 'string' 
        ? new TextEncoder().encode(data)
        : data;
      const signatureBuffer = this.base64ToArrayBuffer(signature);

      return await crypto.subtle.verify(
        'HMAC',
        key,
        signatureBuffer,
        dataBuffer
      );
    } catch (error) {
      console.error('HMAC verification failed:', error);
      return false;
    }
  }

  /**
   * Derive key from password using PBKDF2
   */
  async deriveKeyFromPassword(password, salt) {
    try {
      // Import password as key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
      );

      // Derive key using PBKDF2
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: SECURITY_CONFIG.ENCRYPTION.PBKDF2_ITERATIONS,
          hash: 'SHA-256'
        },
        keyMaterial,
        {
          name: SECURITY_CONFIG.ENCRYPTION.ALGORITHM,
          length: SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH
        },
        false,
        ['encrypt', 'decrypt']
      );

      return derivedKey;
    } catch (error) {
      console.error('Key derivation failed:', error);
      throw new Error('Failed to derive key from password');
    }
  }

  /**
   * Generate secure random bytes
   */
  generateRandomBytes(length) {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Generate secure random string
   */
  generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomBytes = this.generateRandomBytes(length);
    
    return Array.from(randomBytes, byte => chars[byte % chars.length]).join('');
  }

  /**
   * Generate UUID v4
   */
  generateUUID() {
    const randomBytes = this.generateRandomBytes(16);
    
    // Set version (4) and variant bits
    randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40;
    randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80;

    const hex = Array.from(randomBytes, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  }

  /**
   * Encrypt form data for secure transmission
   */
  async encryptFormData(formData) {
    try {
      const serializedData = JSON.stringify(formData);
      const encryptedData = await this.encrypt(serializedData, 'form-data');
      
      // Add integrity check
      const hmac = await this.generateHMAC(encryptedData, 'form-integrity');
      
      return {
        data: encryptedData,
        integrity: hmac,
        timestamp: Date.now(),
        version: '1.0'
      };
    } catch (error) {
      console.error('Form data encryption failed:', error);
      throw new Error('Failed to encrypt form data');
    }
  }

  /**
   * Decrypt form data
   */
  async decryptFormData(encryptedFormData) {
    try {
      const { data, integrity, timestamp, version } = encryptedFormData;

      // Verify integrity
      const isValid = await this.verifyHMAC(data, integrity, 'form-integrity');
      if (!isValid) {
        throw new Error('Data integrity check failed');
      }

      // Check timestamp (prevent replay attacks)
      const age = Date.now() - timestamp;
      if (age > 5 * 60 * 1000) { // 5 minutes
        throw new Error('Encrypted data has expired');
      }

      // Decrypt data
      const decryptedData = await this.decrypt(data, 'form-data');
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Form data decryption failed:', error);
      throw new Error('Failed to decrypt form data');
    }
  }

  /**
   * Secure local storage encryption
   */
  async encryptForStorage(data, key = 'storage') {
    try {
      const serializedData = JSON.stringify(data);
      return await this.encrypt(serializedData, key);
    } catch (error) {
      console.error('Storage encryption failed:', error);
      throw new Error('Failed to encrypt data for storage');
    }
  }

  /**
   * Secure local storage decryption
   */
  async decryptFromStorage(encryptedData, key = 'storage') {
    try {
      const decryptedData = await this.decrypt(encryptedData, key);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Storage decryption failed:', error);
      throw new Error('Failed to decrypt data from storage');
    }
  }

  /**
   * Generate digital signature for data
   */
  async signData(data, keyId = 'signing') {
    try {
      const signingKey = await this.getOrGenerateSigningKey(keyId);
      const dataBuffer = typeof data === 'string' 
        ? new TextEncoder().encode(data)
        : data;

      const signature = await crypto.subtle.sign(
        {
          name: 'ECDSA',
          hash: 'SHA-256'
        },
        signingKey.privateKey,
        dataBuffer
      );

      return this.arrayBufferToBase64(signature);
    } catch (error) {
      console.error('Data signing failed:', error);
      throw new Error('Failed to sign data');
    }
  }

  /**
   * Verify digital signature
   */
  async verifySignature(data, signature, keyId = 'signing') {
    try {
      const signingKey = await this.getOrGenerateSigningKey(keyId);
      const dataBuffer = typeof data === 'string' 
        ? new TextEncoder().encode(data)
        : data;
      const signatureBuffer = this.base64ToArrayBuffer(signature);

      return await crypto.subtle.verify(
        {
          name: 'ECDSA',
          hash: 'SHA-256'
        },
        signingKey.publicKey,
        signatureBuffer,
        dataBuffer
      );
    } catch (error) {
      console.error('Signature verification failed:', error);
      return false;
    }
  }

  // Private helper methods

  /**
   * Initialize master key
   */
  async initializeMasterKey() {
    try {
      let masterKey = await this.getStoredKey('master');
      
      if (!masterKey) {
        // Generate new master key
        masterKey = await crypto.subtle.generateKey(
          {
            name: SECURITY_CONFIG.ENCRYPTION.ALGORITHM,
            length: SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH
          },
          false, // Not extractable for security
          ['encrypt', 'decrypt']
        );

        // Store master key (in a real implementation, this would be more secure)
        await this.storeKey('master', masterKey);
      }

      this.keyCache.set('master', masterKey);
    } catch (error) {
      console.error('Master key initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get or generate encryption key
   */
  async getOrGenerateKey(keyId) {
    if (this.keyCache.has(keyId)) {
      return this.keyCache.get(keyId);
    }

    let key = await this.getStoredKey(keyId);
    
    if (!key) {
      // Generate new key
      key = await crypto.subtle.generateKey(
        {
          name: SECURITY_CONFIG.ENCRYPTION.ALGORITHM,
          length: SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH
        },
        false,
        ['encrypt', 'decrypt']
      );

      await this.storeKey(keyId, key);
    }

    this.keyCache.set(keyId, key);
    return key;
  }

  /**
   * Get or generate HMAC key
   */
  async getOrGenerateHMACKey(keyId) {
    const cacheKey = `hmac-${keyId}`;
    
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }

    let key = await this.getStoredKey(cacheKey);
    
    if (!key) {
      key = await crypto.subtle.generateKey(
        {
          name: 'HMAC',
          hash: 'SHA-256'
        },
        false,
        ['sign', 'verify']
      );

      await this.storeKey(cacheKey, key);
    }

    this.keyCache.set(cacheKey, key);
    return key;
  }

  /**
   * Get or generate signing key pair
   */
  async getOrGenerateSigningKey(keyId) {
    const cacheKey = `signing-${keyId}`;
    
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }

    let keyPair = await this.getStoredKey(cacheKey);
    
    if (!keyPair) {
      keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256'
        },
        false,
        ['sign', 'verify']
      );

      await this.storeKey(cacheKey, keyPair);
    }

    this.keyCache.set(cacheKey, keyPair);
    return keyPair;
  }

  /**
   * Store key securely (simplified implementation)
   */
  async storeKey(keyId, key) {
    try {
      // In a real implementation, keys would be stored more securely
      // This is a simplified version for demonstration
      const keyData = await crypto.subtle.exportKey('raw', key);
      const keyBase64 = this.arrayBufferToBase64(keyData);
      
      sessionStorage.setItem(`crypto-key-${keyId}`, keyBase64);
    } catch (error) {
      console.error('Key storage failed:', error);
    }
  }

  /**
   * Retrieve stored key
   */
  async getStoredKey(keyId) {
    try {
      const keyBase64 = sessionStorage.getItem(`crypto-key-${keyId}`);
      if (!keyBase64) return null;

      const keyData = this.base64ToArrayBuffer(keyBase64);
      
      return await crypto.subtle.importKey(
        'raw',
        keyData,
        {
          name: SECURITY_CONFIG.ENCRYPTION.ALGORITHM,
          length: SECURITY_CONFIG.ENCRYPTION.KEY_LENGTH
        },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Key retrieval failed:', error);
      return null;
    }
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Convert ArrayBuffer to Hex
   */
  arrayBufferToHex(buffer) {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes, byte => 
      byte.toString(16).padStart(2, '0')
    ).join('');
  }

  /**
   * Clear all cached keys
   */
  clearKeyCache() {
    this.keyCache.clear();
  }

  /**
   * Securely wipe sensitive data from memory
   */
  secureWipe(data) {
    if (typeof data === 'string') {
      // Overwrite string data (limited effectiveness in JavaScript)
      data = '\0'.repeat(data.length);
    } else if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
      // Overwrite array data
      const view = new Uint8Array(data);
      crypto.getRandomValues(view);
    }
  }
}

export default CryptoService;


import CryptoJS from "crypto-js";
/**
 * Encryption utility class for client-side data protection
 * Implements AES-256-GCM encryption for sensitive data
 */
export class EncryptionService {
  /**
   * Generate a cryptographically secure random key
   */
  static generateKey() {
    return CryptoJS.lib.WordArray.random(this.KEY_SIZE / 8).toString();
  }
  /**
   * Generate a cryptographically secure random IV
   */
  static generateIV() {
    return CryptoJS.lib.WordArray.random(this.IV_SIZE / 8).toString();
  }
  /**
   * Encrypt sensitive data using AES-256-GCM
   * @param data - The data to encrypt
   * @param key - The encryption key (optional, generates if not provided)
   * @returns Object containing encrypted data, IV, and key
   */
  static encrypt(data, key) {
    try {
      const encryptionKey = key || this.generateKey();
      const iv = this.generateIV();
      const encrypted = CryptoJS.AES.encrypt(data, encryptionKey, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.GCM,
        padding: CryptoJS.pad.NoPadding,
      });
      return {
        encrypted: encrypted.ciphertext.toString(),
        iv,
        key: encryptionKey,
        tag: encrypted.tag?.toString() || "",
      };
    } catch (error) {
      throw new Error(
        `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
  /**
   * Decrypt data using AES-256-GCM
   * @param encryptedData - The encrypted data object
   * @returns Decrypted string
   */
  static decrypt(encryptedData) {
    try {
      const { encrypted, iv, key, tag } = encryptedData;
      const decrypted = CryptoJS.AES.decrypt(
        {
          ciphertext: CryptoJS.enc.Hex.parse(encrypted),
          tag: CryptoJS.enc.Hex.parse(tag),
        },
        key,
        {
          iv: CryptoJS.enc.Hex.parse(iv),
          mode: CryptoJS.mode.GCM,
          padding: CryptoJS.pad.NoPadding,
        },
      );
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error(
        `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
  /**
   * Hash sensitive data using SHA-256
   * @param data - The data to hash
   * @returns SHA-256 hash
   */
  static hash(data) {
    return CryptoJS.SHA256(data).toString();
  }
  /**
   * Generate HMAC for data integrity verification
   * @param data - The data to sign
   * @param key - The signing key
   * @returns HMAC signature
   */
  static generateHMAC(data, key) {
    return CryptoJS.HmacSHA256(data, key).toString();
  }
  /**
   * Verify HMAC signature
   * @param data - The original data
   * @param signature - The HMAC signature to verify
   * @param key - The signing key
   * @returns True if signature is valid
   */
  static verifyHMAC(data, signature, key) {
    const expectedSignature = this.generateHMAC(data, key);
    return signature === expectedSignature;
  }
  /**
   * Securely generate a random password
   * @param length - Password length (default: 16)
   * @param includeSymbols - Include special characters (default: true)
   * @returns Secure random password
   */
  static generateSecurePassword(length = 16, includeSymbols = true) {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    let charset = lowercase + uppercase + numbers;
    if (includeSymbols) {
      charset += symbols;
    }
    let password = "";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  }
  /**
   * Derive key from password using PBKDF2
   * @param password - The password to derive from
   * @param salt - The salt (optional, generates if not provided)
   * @param iterations - Number of iterations (default: 100000)
   * @returns Object containing derived key and salt
   */
  static deriveKeyFromPassword(password, salt, iterations = 100000) {
    const derivedSalt =
      salt || CryptoJS.lib.WordArray.random(128 / 8).toString();
    const key = CryptoJS.PBKDF2(password, derivedSalt, {
      keySize: this.KEY_SIZE / 32,
      iterations,
    }).toString();
    return { key, salt: derivedSalt };
  }
}
Object.defineProperty(EncryptionService, "ALGORITHM", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: "AES",
});
Object.defineProperty(EncryptionService, "KEY_SIZE", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: 256,
});
Object.defineProperty(EncryptionService, "IV_SIZE", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: 96,
}); // 12 bytes for GCM
Object.defineProperty(EncryptionService, "TAG_SIZE", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: 128,
}); // 16 bytes for GCM
/**
 * Secure storage utility for encrypted data
 */
export class SecureStorage {
  /**
   * Store encrypted data in localStorage
   * @param key - Storage key
   * @param data - Data to encrypt and store
   * @param encryptionKey - Optional encryption key
   */
  static setItem(key, data, encryptionKey) {
    try {
      const serializedData = JSON.stringify(data);
      const encrypted = EncryptionService.encrypt(
        serializedData,
        encryptionKey,
      );
      localStorage.setItem(
        this.STORAGE_PREFIX + key,
        JSON.stringify(encrypted),
      );
    } catch (error) {
      throw new Error(
        `Secure storage failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
  /**
   * Retrieve and decrypt data from localStorage
   * @param key - Storage key
   * @returns Decrypted data or null if not found
   */
  static getItem(key) {
    try {
      const encryptedData = localStorage.getItem(this.STORAGE_PREFIX + key);
      if (!encryptedData) return null;
      const encrypted = JSON.parse(encryptedData);
      const decrypted = EncryptionService.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Secure storage retrieval failed:", error);
      return null;
    }
  }
  /**
   * Remove item from secure storage
   * @param key - Storage key
   */
  static removeItem(key) {
    localStorage.removeItem(this.STORAGE_PREFIX + key);
  }
  /**
   * Clear all secure storage items
   */
  static clear() {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}
Object.defineProperty(SecureStorage, "STORAGE_PREFIX", {
  enumerable: true,
  configurable: true,
  writable: true,
  value: "secure_",
});
export default EncryptionService;

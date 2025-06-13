"""
Encryption manager for secure data handling
"""

import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import secrets

class EncryptionManager:
    """Handles encryption and decryption of sensitive data"""
    
    def __init__(self, secret_key):
        """Initialize encryption manager with secret key"""
        self.secret_key = secret_key.encode() if isinstance(secret_key, str) else secret_key
        self._fernet = None
    
    def _get_fernet(self):
        """Get or create Fernet instance"""
        if self._fernet is None:
            # Derive a key from the secret key
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b'flowlet_salt',  # In production, use a random salt per encryption
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(self.secret_key))
            self._fernet = Fernet(key)
        return self._fernet
    
    def encrypt(self, data):
        """Encrypt sensitive data"""
        if data is None:
            return None
        
        if isinstance(data, str):
            data = data.encode()
        
        fernet = self._get_fernet()
        encrypted_data = fernet.encrypt(data)
        return base64.urlsafe_b64encode(encrypted_data).decode()
    
    def decrypt(self, encrypted_data):
        """Decrypt sensitive data"""
        if encrypted_data is None:
            return None
        
        try:
            fernet = self._get_fernet()
            decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = fernet.decrypt(decoded_data)
            return decrypted_data.decode()
        except Exception:
            # Return None if decryption fails
            return None
    
    def encrypt_pii(self, pii_data):
        """Encrypt personally identifiable information"""
        if not pii_data:
            return None
        
        # Add additional security measures for PII
        return self.encrypt(pii_data)
    
    def decrypt_pii(self, encrypted_pii):
        """Decrypt personally identifiable information"""
        return self.decrypt(encrypted_pii)
    
    @staticmethod
    def generate_token(length=32):
        """Generate a secure random token"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def hash_sensitive_data(data):
        """Create a one-way hash of sensitive data"""
        import hashlib
        if isinstance(data, str):
            data = data.encode()
        return hashlib.sha256(data).hexdigest()


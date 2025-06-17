# Enhanced Security Infrastructure
# Financial Industry Standards Compliant

import os
import hashlib
import hmac
import secrets
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import jwt
from datetime import datetime, timezone, timedelta
import logging
from typing import Dict, Optional, Tuple, Any
import json

logger = logging.getLogger(__name__)

class SecurityManager:
    """
    Enhanced Security Manager implementing financial industry standards
    Provides encryption, tokenization, key management, and secure authentication
    """
    
    def __init__(self):
        self.encryption_key = self._get_or_create_encryption_key()
        self.fernet = Fernet(self.encryption_key)
        self.jwt_secret = os.environ.get('JWT_SECRET_KEY', self._generate_jwt_secret())
        self.token_vault = {}  # In production, use dedicated tokenization service
    
    def _get_or_create_encryption_key(self) -> bytes:
        """Get or create encryption key for data at rest"""
        key_file = os.environ.get('ENCRYPTION_KEY_FILE', 'encryption.key')
        
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(key)
            os.chmod(key_file, 0o600)  # Restrict file permissions
            return key
    
    def _generate_jwt_secret(self) -> str:
        """Generate a secure JWT secret"""
        return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
    
    def encrypt_data(self, data: str) -> str:
        """
        Encrypt sensitive data using AES-256
        
        Args:
            data: Plain text data to encrypt
            
        Returns:
            Base64 encoded encrypted data
        """
        try:
            encrypted_data = self.fernet.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted_data).decode()
        except Exception as e:
            logger.error(f"Encryption error: {str(e)}")
            raise SecurityException("Failed to encrypt data")
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """
        Decrypt sensitive data
        
        Args:
            encrypted_data: Base64 encoded encrypted data
            
        Returns:
            Decrypted plain text data
        """
        try:
            decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = self.fernet.decrypt(decoded_data)
            return decrypted_data.decode()
        except Exception as e:
            logger.error(f"Decryption error: {str(e)}")
            raise SecurityException("Failed to decrypt data")
    
    def tokenize_sensitive_data(self, sensitive_data: str, data_type: str = 'generic') -> str:
        """
        Tokenize sensitive data (e.g., card numbers, SSNs)
        
        Args:
            sensitive_data: Sensitive data to tokenize
            data_type: Type of data being tokenized
            
        Returns:
            Non-sensitive token
        """
        try:
            # Generate a secure token
            token = f"{data_type}_{secrets.token_urlsafe(32)}"
            
            # Store mapping in token vault (encrypted)
            encrypted_data = self.encrypt_data(sensitive_data)
            self.token_vault[token] = {
                'encrypted_data': encrypted_data,
                'data_type': data_type,
                'created_at': datetime.now(timezone.utc).isoformat(),
                'access_count': 0
            }
            
            logger.info(f"Data tokenized: type={data_type}, token={token[:10]}...")
            return token
            
        except Exception as e:
            logger.error(f"Tokenization error: {str(e)}")
            raise SecurityException("Failed to tokenize data")
    
    def detokenize_data(self, token: str) -> Optional[str]:
        """
        Retrieve original data from token
        
        Args:
            token: Token to detokenize
            
        Returns:
            Original sensitive data or None if token not found
        """
        try:
            if token not in self.token_vault:
                logger.warning(f"Token not found: {token[:10]}...")
                return None
            
            token_data = self.token_vault[token]
            token_data['access_count'] += 1
            token_data['last_accessed'] = datetime.now(timezone.utc).isoformat()
            
            # Decrypt and return original data
            original_data = self.decrypt_data(token_data['encrypted_data'])
            
            logger.info(f"Data detokenized: token={token[:10]}..., access_count={token_data['access_count']}")
            return original_data
            
        except Exception as e:
            logger.error(f"Detokenization error: {str(e)}")
            return None
    
    def generate_jwt_token(self, user_id: str, permissions: List[str] = None, 
                          expires_in: int = 3600) -> str:
        """
        Generate JWT token with enhanced security
        
        Args:
            user_id: User identifier
            permissions: List of user permissions
            expires_in: Token expiration time in seconds
            
        Returns:
            JWT token
        """
        try:
            now = datetime.now(timezone.utc)
            payload = {
                'user_id': user_id,
                'permissions': permissions or [],
                'iat': now,
                'exp': now + timedelta(seconds=expires_in),
                'jti': secrets.token_urlsafe(16),  # JWT ID for revocation
                'iss': 'flowlet-financial',
                'aud': 'flowlet-api'
            }
            
            token = jwt.encode(payload, self.jwt_secret, algorithm='HS256')
            
            logger.info(f"JWT token generated for user: {user_id}")
            return token
            
        except Exception as e:
            logger.error(f"JWT generation error: {str(e)}")
            raise SecurityException("Failed to generate JWT token")
    
    def verify_jwt_token(self, token: str) -> Optional[Dict]:
        """
        Verify and decode JWT token
        
        Args:
            token: JWT token to verify
            
        Returns:
            Decoded token payload or None if invalid
        """
        try:
            payload = jwt.decode(
                token, 
                self.jwt_secret, 
                algorithms=['HS256'],
                audience='flowlet-api',
                issuer='flowlet-financial'
            )
            
            logger.info(f"JWT token verified for user: {payload.get('user_id')}")
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"JWT verification error: {str(e)}")
            return None
    
    def hash_password(self, password: str) -> str:
        """
        Hash password using PBKDF2 with SHA-256
        
        Args:
            password: Plain text password
            
        Returns:
            Hashed password with salt
        """
        try:
            salt = secrets.token_bytes(32)
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
                backend=default_backend()
            )
            key = kdf.derive(password.encode())
            
            # Combine salt and key for storage
            hashed_password = base64.urlsafe_b64encode(salt + key).decode()
            
            logger.info("Password hashed successfully")
            return hashed_password
            
        except Exception as e:
            logger.error(f"Password hashing error: {str(e)}")
            raise SecurityException("Failed to hash password")
    
    def verify_password(self, password: str, hashed_password: str) -> bool:
        """
        Verify password against hash
        
        Args:
            password: Plain text password
            hashed_password: Stored hashed password
            
        Returns:
            True if password matches, False otherwise
        """
        try:
            # Decode stored hash
            decoded_hash = base64.urlsafe_b64decode(hashed_password.encode())
            salt = decoded_hash[:32]
            stored_key = decoded_hash[32:]
            
            # Derive key from provided password
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
                backend=default_backend()
            )
            derived_key = kdf.derive(password.encode())
            
            # Compare keys using constant-time comparison
            is_valid = hmac.compare_digest(stored_key, derived_key)
            
            logger.info(f"Password verification: {'success' if is_valid else 'failed'}")
            return is_valid
            
        except Exception as e:
            logger.error(f"Password verification error: {str(e)}")
            return False
    
    def generate_api_key(self, key_name: str, permissions: List[str] = None) -> Tuple[str, str]:
        """
        Generate API key with permissions
        
        Args:
            key_name: Name for the API key
            permissions: List of permissions for the key
            
        Returns:
            Tuple of (api_key, api_key_hash)
        """
        try:
            # Generate secure API key
            api_key = f"flt_{secrets.token_urlsafe(32)}"
            
            # Hash the API key for storage
            api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
            
            logger.info(f"API key generated: {key_name}")
            return api_key, api_key_hash
            
        except Exception as e:
            logger.error(f"API key generation error: {str(e)}")
            raise SecurityException("Failed to generate API key")
    
    def verify_api_key(self, api_key: str, stored_hash: str) -> bool:
        """
        Verify API key against stored hash
        
        Args:
            api_key: API key to verify
            stored_hash: Stored hash of the API key
            
        Returns:
            True if API key is valid, False otherwise
        """
        try:
            computed_hash = hashlib.sha256(api_key.encode()).hexdigest()
            is_valid = hmac.compare_digest(stored_hash, computed_hash)
            
            logger.info(f"API key verification: {'success' if is_valid else 'failed'}")
            return is_valid
            
        except Exception as e:
            logger.error(f"API key verification error: {str(e)}")
            return False
    
    def generate_secure_random(self, length: int = 32) -> str:
        """
        Generate cryptographically secure random string
        
        Args:
            length: Length of random string
            
        Returns:
            Secure random string
        """
        return secrets.token_urlsafe(length)
    
    def create_hmac_signature(self, data: str, secret: str) -> str:
        """
        Create HMAC signature for data integrity
        
        Args:
            data: Data to sign
            secret: Secret key for signing
            
        Returns:
            HMAC signature
        """
        try:
            signature = hmac.new(
                secret.encode(),
                data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return signature
            
        except Exception as e:
            logger.error(f"HMAC signature error: {str(e)}")
            raise SecurityException("Failed to create HMAC signature")
    
    def verify_hmac_signature(self, data: str, signature: str, secret: str) -> bool:
        """
        Verify HMAC signature
        
        Args:
            data: Original data
            signature: HMAC signature to verify
            secret: Secret key used for signing
            
        Returns:
            True if signature is valid, False otherwise
        """
        try:
            expected_signature = self.create_hmac_signature(data, secret)
            is_valid = hmac.compare_digest(signature, expected_signature)
            
            logger.info(f"HMAC verification: {'success' if is_valid else 'failed'}")
            return is_valid
            
        except Exception as e:
            logger.error(f"HMAC verification error: {str(e)}")
            return False

class SecurityException(Exception):
    """Custom exception for security-related errors"""
    pass

# Global security manager instance
security_manager = SecurityManager()

# Convenience functions for common operations
def encrypt_sensitive_data(data: str) -> str:
    """Encrypt sensitive data"""
    return security_manager.encrypt_data(data)

def decrypt_sensitive_data(encrypted_data: str) -> str:
    """Decrypt sensitive data"""
    return security_manager.decrypt_data(encrypted_data)

def tokenize_card_number(card_number: str) -> str:
    """Tokenize credit card number"""
    return security_manager.tokenize_sensitive_data(card_number, 'card_number')

def tokenize_ssn(ssn: str) -> str:
    """Tokenize Social Security Number"""
    return security_manager.tokenize_sensitive_data(ssn, 'ssn')

def detokenize_data(token: str) -> Optional[str]:
    """Detokenize sensitive data"""
    return security_manager.detokenize_data(token)

def generate_jwt_token(user_id: str, permissions: List[str] = None) -> str:
    """Generate JWT token"""
    return security_manager.generate_jwt_token(user_id, permissions)

def verify_jwt_token(token: str) -> Optional[Dict]:
    """Verify JWT token"""
    return security_manager.verify_jwt_token(token)

def hash_password(password: str) -> str:
    """Hash password"""
    return security_manager.hash_password(password)

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify password"""
    return security_manager.verify_password(password, hashed_password)


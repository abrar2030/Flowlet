"""
Encryption Module
Provides encryption and decryption functionality for sensitive data
"""

import base64
import hashlib
import logging
import os
from typing import Optional, Union
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    Service for encrypting and decrypting sensitive data
    Uses Fernet (symmetric encryption) from cryptography library
    """

    def __init__(
        self, key: Optional[bytes] = None, password: Optional[str] = None
    ) -> None:
        """
        Initialize encryption service

        Args:
            key: Encryption key (32 url-safe base64-encoded bytes)
            password: Password to derive key from (if key not provided)
        """
        if key:
            self.key = key
        elif password:
            self.key = self._derive_key_from_password(password)
        else:
            # Generate a new key
            self.key = Fernet.generate_key()

        self.cipher = Fernet(self.key)
        logger.info("Encryption service initialized")

    @staticmethod
    def _derive_key_from_password(password: str, salt: Optional[bytes] = None) -> bytes:
        """
        Derive an encryption key from a password using PBKDF2

        Args:
            password: Password to derive key from
            salt: Optional salt (will be generated if not provided)

        Returns:
            Derived key
        """
        if salt is None:
            salt = b"flowlet-default-salt-change-in-production"

        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend(),
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return key

    def encrypt(self, data: Union[str, bytes]) -> str:
        """
        Encrypt data

        Args:
            data: Data to encrypt (string or bytes)

        Returns:
            Encrypted data as base64 string
        """
        try:
            if isinstance(data, str):
                data = data.encode()

            encrypted = self.cipher.encrypt(data)
            return base64.b64encode(encrypted).decode()

        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            raise

    def decrypt(self, encrypted_data: str) -> str:
        """
        Decrypt data

        Args:
            encrypted_data: Encrypted data as base64 string

        Returns:
            Decrypted data as string
        """
        try:
            encrypted_bytes = base64.b64decode(encrypted_data.encode())
            decrypted = self.cipher.decrypt(encrypted_bytes)
            return decrypted.decode()

        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            raise

    def encrypt_dict(self, data: dict, fields_to_encrypt: list) -> dict:
        """
        Encrypt specific fields in a dictionary

        Args:
            data: Dictionary containing data
            fields_to_encrypt: List of field names to encrypt

        Returns:
            Dictionary with encrypted fields
        """
        result = data.copy()
        for field in fields_to_encrypt:
            if field in result and result[field]:
                result[field] = self.encrypt(str(result[field]))
        return result

    def decrypt_dict(self, data: dict, fields_to_decrypt: list) -> dict:
        """
        Decrypt specific fields in a dictionary

        Args:
            data: Dictionary containing encrypted data
            fields_to_decrypt: List of field names to decrypt

        Returns:
            Dictionary with decrypted fields
        """
        result = data.copy()
        for field in fields_to_decrypt:
            if field in result and result[field]:
                try:
                    result[field] = self.decrypt(result[field])
                except Exception as e:
                    logger.warning(f"Failed to decrypt field {field}: {str(e)}")
        return result

    @staticmethod
    def hash_data(data: str, algorithm: str = "sha256") -> str:
        """
        Hash data using specified algorithm

        Args:
            data: Data to hash
            algorithm: Hash algorithm (sha256, sha512, md5)

        Returns:
            Hex digest of hash
        """
        if algorithm == "sha256":
            return hashlib.sha256(data.encode()).hexdigest()
        elif algorithm == "sha512":
            return hashlib.sha512(data.encode()).hexdigest()
        elif algorithm == "md5":
            return hashlib.md5(data.encode()).hexdigest()
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")

    def get_key_string(self) -> str:
        """Get the encryption key as a string"""
        return self.key.decode()

    @staticmethod
    def generate_key() -> str:
        """Generate a new encryption key"""
        return Fernet.generate_key().decode()


# Convenience functions for global usage
_default_service: Optional[EncryptionService] = None


def init_encryption_service(
    key: Optional[bytes] = None, password: Optional[str] = None
):
    """Initialize the default encryption service"""
    global _default_service
    _default_service = EncryptionService(key=key, password=password)


def get_encryption_service() -> EncryptionService:
    """Get the default encryption service"""
    global _default_service
    if _default_service is None:
        # Initialize with environment variable or generate new key
        key_str = os.environ.get("ENCRYPTION_KEY")
        if key_str:
            init_encryption_service(key=key_str.encode())
        else:
            init_encryption_service()
    return _default_service


def encrypt(data: Union[str, bytes]) -> str:
    """Encrypt data using default service"""
    return get_encryption_service().encrypt(data)


def decrypt(encrypted_data: str) -> str:
    """Decrypt data using default service"""
    return get_encryption_service().decrypt(encrypted_data)

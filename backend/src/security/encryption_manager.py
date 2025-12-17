"""
Encryption Manager
Manages multiple encryption services and key rotation
"""

import logging
from datetime import datetime
from typing import Dict, Optional, Any
from .encryption import EncryptionService

logger = logging.getLogger(__name__)


class EncryptionManager:
    """
    Manages encryption services with support for key rotation
    """

    def __init__(self):
        """Initialize encryption manager"""
        self.services: Dict[str, EncryptionService] = {}
        self.current_key_id: Optional[str] = None
        self.key_metadata: Dict[str, Dict[str, Any]] = {}
        logger.info("Encryption Manager initialized")

    def add_key(self, key_id: str, key: bytes, set_as_current: bool = False) -> None:
        """
        Add an encryption key

        Args:
            key_id: Unique identifier for the key
            key: Encryption key
            set_as_current: Whether to set as current key
        """
        try:
            self.services[key_id] = EncryptionService(key=key)
            self.key_metadata[key_id] = {
                "created_at": datetime.utcnow().isoformat(),
                "active": True,
            }

            if set_as_current or self.current_key_id is None:
                self.current_key_id = key_id

            logger.info(f"Added encryption key: {key_id}")

        except Exception as e:
            logger.error(f"Failed to add key {key_id}: {str(e)}")
            raise

    def remove_key(self, key_id: str) -> None:
        """
        Remove an encryption key

        Args:
            key_id: Key identifier to remove
        """
        if key_id == self.current_key_id:
            raise ValueError("Cannot remove current key")

        if key_id in self.services:
            del self.services[key_id]
            self.key_metadata[key_id]["active"] = False
            logger.info(f"Removed encryption key: {key_id}")
        else:
            logger.warning(f"Key not found: {key_id}")

    def rotate_key(self, new_key_id: str, new_key: bytes) -> None:
        """
        Rotate to a new encryption key

        Args:
            new_key_id: New key identifier
            new_key: New encryption key
        """
        # Add the new key
        self.add_key(new_key_id, new_key, set_as_current=True)
        logger.info(f"Key rotated to: {new_key_id}")

    def encrypt(self, data: str, key_id: Optional[str] = None) -> tuple[str, str]:
        """
        Encrypt data with specified or current key

        Args:
            data: Data to encrypt
            key_id: Optional key ID (uses current if not specified)

        Returns:
            Tuple of (encrypted_data, key_id_used)
        """
        key_id = key_id or self.current_key_id
        if key_id is None:
            raise ValueError("No encryption key available")

        if key_id not in self.services:
            raise ValueError(f"Key not found: {key_id}")

        encrypted = self.services[key_id].encrypt(data)
        return encrypted, key_id

    def decrypt(self, encrypted_data: str, key_id: str) -> str:
        """
        Decrypt data with specified key

        Args:
            encrypted_data: Encrypted data
            key_id: Key ID used for encryption

        Returns:
            Decrypted data
        """
        if key_id not in self.services:
            raise ValueError(f"Key not found: {key_id}")

        return self.services[key_id].decrypt(encrypted_data)

    def re_encrypt(
        self, encrypted_data: str, old_key_id: str, new_key_id: Optional[str] = None
    ) -> tuple[str, str]:
        """
        Re-encrypt data with a new key

        Args:
            encrypted_data: Data encrypted with old key
            old_key_id: Old key identifier
            new_key_id: New key identifier (uses current if not specified)

        Returns:
            Tuple of (re_encrypted_data, new_key_id)
        """
        # Decrypt with old key
        decrypted = self.decrypt(encrypted_data, old_key_id)

        # Encrypt with new key
        new_encrypted, used_key_id = self.encrypt(decrypted, new_key_id)

        logger.info(f"Re-encrypted data from {old_key_id} to {used_key_id}")
        return new_encrypted, used_key_id

    def get_current_key_id(self) -> Optional[str]:
        """Get the current key ID"""
        return self.current_key_id

    def get_active_keys(self) -> list[str]:
        """Get list of active key IDs"""
        return [
            key_id
            for key_id, metadata in self.key_metadata.items()
            if metadata.get("active", False)
        ]

    def get_key_metadata(self, key_id: str) -> Optional[Dict[str, Any]]:
        """Get metadata for a specific key"""
        return self.key_metadata.get(key_id)


# Global instance
_manager: Optional[EncryptionManager] = None


def get_encryption_manager() -> EncryptionManager:
    """Get the global encryption manager instance"""
    global _manager
    if _manager is None:
        _manager = EncryptionManager()
    return _manager

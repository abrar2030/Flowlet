"""
Encryption Service
==================

Advanced encryption and cryptographic services for financial applications.
Provides data encryption, key management, and cryptographic operations.
"""

import base64
import hashlib
import json
import logging
import os
import secrets
import uuid
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple, Union

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


class EncryptionAlgorithm(Enum):
    """Supported encryption algorithms."""

    AES_256_GCM = "aes_256_gcm"
    AES_256_CBC = "aes_256_cbc"
    RSA_2048 = "rsa_2048"
    RSA_4096 = "rsa_4096"
    FERNET = "fernet"


class KeyType(Enum):
    """Types of encryption keys."""

    SYMMETRIC = "symmetric"
    ASYMMETRIC_PUBLIC = "asymmetric_public"
    ASYMMETRIC_PRIVATE = "asymmetric_private"
    DERIVED = "derived"


@dataclass
class EncryptionKey:
    """Encryption key metadata."""

    key_id: str
    key_type: KeyType
    algorithm: EncryptionAlgorithm
    created_at: datetime
    expires_at: Optional[datetime]
    purpose: str
    metadata: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "key_id": self.key_id,
            "key_type": self.key_type.value,
            "algorithm": self.algorithm.value,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "purpose": self.purpose,
            "metadata": self.metadata,
        }


@dataclass
class EncryptionResult:
    """Result of encryption operation."""

    encrypted_data: bytes
    key_id: str
    algorithm: EncryptionAlgorithm
    iv: Optional[bytes] = None
    tag: Optional[bytes] = None
    metadata: Dict[str, Any] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "encrypted_data": base64.b64encode(self.encrypted_data).decode(),
            "key_id": self.key_id,
            "algorithm": self.algorithm.value,
            "iv": base64.b64encode(self.iv).decode() if self.iv else None,
            "tag": base64.b64encode(self.tag).decode() if self.tag else None,
            "metadata": self.metadata or {},
        }


class EncryptionService:
    """
    Advanced encryption service for financial applications.

    Features:
    - Multiple encryption algorithms (AES, RSA, Fernet)
    - Key generation and management
    - Key rotation and lifecycle management
    - Data encryption and decryption
    - Digital signatures
    - Key derivation functions
    - Secure random number generation
    - Cryptographic hashing
    """

    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        self.logger = logging.getLogger(__name__)

        # Key storage (in production, would use HSM or key management service)
        self._keys = {}
        self._key_metadata = {}

        # Initialize encryption service
        self._initialize_encryption_service()

    def _initialize_encryption_service(self):
        """Initialize the encryption service."""

        # Generate master key if not exists
        if "master_key" not in self._keys:
            self._generate_master_key()

        self.logger.info("Encryption service initialized successfully")

    def _generate_master_key(self):
        """Generate master encryption key."""

        master_key = Fernet.generate_key()
        key_id = "master_key"

        self._keys[key_id] = master_key
        self._key_metadata[key_id] = EncryptionKey(
            key_id=key_id,
            key_type=KeyType.SYMMETRIC,
            algorithm=EncryptionAlgorithm.FERNET,
            created_at=datetime.utcnow(),
            expires_at=None,  # Master key doesn't expire
            purpose="master_encryption",
            metadata={"is_master": True},
        )

        self.logger.info("Master encryption key generated")

    def generate_symmetric_key(
        self,
        algorithm: EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM,
        purpose: str = "data_encryption",
        expires_in: timedelta = None,
    ) -> str:
        """
        Generate a symmetric encryption key.

        Args:
            algorithm: Encryption algorithm
            purpose: Purpose of the key
            expires_in: Key expiration time

        Returns:
            Key ID
        """

        key_id = str(uuid.uuid4())

        if (
            algorithm == EncryptionAlgorithm.AES_256_GCM
            or algorithm == EncryptionAlgorithm.AES_256_CBC
        ):
            # Generate 256-bit AES key
            key = secrets.token_bytes(32)
        elif algorithm == EncryptionAlgorithm.FERNET:
            # Generate Fernet key
            key = Fernet.generate_key()
        else:
            raise ValueError(f"Unsupported symmetric algorithm: {algorithm}")

        # Store key
        self._keys[key_id] = key

        # Store metadata
        expires_at = datetime.utcnow() + expires_in if expires_in else None
        self._key_metadata[key_id] = EncryptionKey(
            key_id=key_id,
            key_type=KeyType.SYMMETRIC,
            algorithm=algorithm,
            created_at=datetime.utcnow(),
            expires_at=expires_at,
            purpose=purpose,
            metadata={},
        )

        self.logger.info(f"Generated symmetric key: {key_id}")
        return key_id

    def generate_asymmetric_key_pair(
        self,
        algorithm: EncryptionAlgorithm = EncryptionAlgorithm.RSA_2048,
        purpose: str = "asymmetric_encryption",
        expires_in: timedelta = None,
    ) -> Tuple[str, str]:
        """
        Generate an asymmetric key pair.

        Args:
            algorithm: Encryption algorithm
            purpose: Purpose of the key pair
            expires_in: Key expiration time

        Returns:
            Tuple of (private_key_id, public_key_id)
        """

        if algorithm == EncryptionAlgorithm.RSA_2048:
            key_size = 2048
        elif algorithm == EncryptionAlgorithm.RSA_4096:
            key_size = 4096
        else:
            raise ValueError(f"Unsupported asymmetric algorithm: {algorithm}")

        # Generate RSA key pair
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=key_size)
        public_key = private_key.public_key()

        # Serialize keys
        private_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )

        public_pem = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )

        # Generate key IDs
        private_key_id = str(uuid.uuid4())
        public_key_id = str(uuid.uuid4())

        # Store keys
        self._keys[private_key_id] = private_pem
        self._keys[public_key_id] = public_pem

        # Store metadata
        expires_at = datetime.utcnow() + expires_in if expires_in else None

        self._key_metadata[private_key_id] = EncryptionKey(
            key_id=private_key_id,
            key_type=KeyType.ASYMMETRIC_PRIVATE,
            algorithm=algorithm,
            created_at=datetime.utcnow(),
            expires_at=expires_at,
            purpose=purpose,
            metadata={"public_key_id": public_key_id},
        )

        self._key_metadata[public_key_id] = EncryptionKey(
            key_id=public_key_id,
            key_type=KeyType.ASYMMETRIC_PUBLIC,
            algorithm=algorithm,
            created_at=datetime.utcnow(),
            expires_at=expires_at,
            purpose=purpose,
            metadata={"private_key_id": private_key_id},
        )

        self.logger.info(
            f"Generated asymmetric key pair: {private_key_id}, {public_key_id}"
        )
        return private_key_id, public_key_id

    def derive_key(
        self,
        password: str,
        salt: bytes = None,
        algorithm: EncryptionAlgorithm = EncryptionAlgorithm.AES_256_GCM,
        purpose: str = "derived_encryption",
    ) -> str:
        """
        Derive a key from a password using PBKDF2.

        Args:
            password: Password to derive key from
            salt: Salt for key derivation (generated if None)
            algorithm: Target encryption algorithm
            purpose: Purpose of the derived key

        Returns:
            Key ID
        """

        if salt is None:
            salt = secrets.token_bytes(16)

        # Derive key using PBKDF2
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,  # 256 bits
            salt=salt,
            iterations=100000,  # OWASP recommended minimum
        )

        derived_key = kdf.derive(password.encode())

        # Generate key ID
        key_id = str(uuid.uuid4())

        # Store key
        self._keys[key_id] = derived_key

        # Store metadata
        self._key_metadata[key_id] = EncryptionKey(
            key_id=key_id,
            key_type=KeyType.DERIVED,
            algorithm=algorithm,
            created_at=datetime.utcnow(),
            expires_at=None,
            purpose=purpose,
            metadata={"salt": base64.b64encode(salt).decode()},
        )

        self.logger.info(f"Derived key from password: {key_id}")
        return key_id

    def encrypt_data(
        self,
        data: Union[str, bytes],
        key_id: str,
        algorithm: EncryptionAlgorithm = None,
    ) -> EncryptionResult:
        """
        Encrypt data using specified key.

        Args:
            data: Data to encrypt
            key_id: ID of encryption key
            algorithm: Encryption algorithm (uses key's algorithm if None)

        Returns:
            EncryptionResult
        """

        if key_id not in self._keys:
            raise ValueError(f"Key not found: {key_id}")

        key_metadata = self._key_metadata[key_id]

        # Check if key has expired
        if key_metadata.expires_at and datetime.utcnow() > key_metadata.expires_at:
            raise ValueError(f"Key has expired: {key_id}")

        # Use key's algorithm if not specified
        if algorithm is None:
            algorithm = key_metadata.algorithm

        # Convert string to bytes
        if isinstance(data, str):
            data = data.encode("utf-8")

        key = self._keys[key_id]

        if algorithm == EncryptionAlgorithm.AES_256_GCM:
            return self._encrypt_aes_gcm(data, key, key_id)
        elif algorithm == EncryptionAlgorithm.AES_256_CBC:
            return self._encrypt_aes_cbc(data, key, key_id)
        elif algorithm == EncryptionAlgorithm.FERNET:
            return self._encrypt_fernet(data, key, key_id)
        elif algorithm in [EncryptionAlgorithm.RSA_2048, EncryptionAlgorithm.RSA_4096]:
            return self._encrypt_rsa(data, key, key_id, algorithm)
        else:
            raise ValueError(f"Unsupported encryption algorithm: {algorithm}")

    def decrypt_data(
        self, encryption_result: Union[EncryptionResult, Dict[str, Any]]
    ) -> bytes:
        """
        Decrypt data using encryption result.

        Args:
            encryption_result: EncryptionResult or dict containing encryption info

        Returns:
            Decrypted data as bytes
        """

        if isinstance(encryption_result, dict):
            # Convert dict to EncryptionResult
            encryption_result = EncryptionResult(
                encrypted_data=base64.b64decode(encryption_result["encrypted_data"]),
                key_id=encryption_result["key_id"],
                algorithm=EncryptionAlgorithm(encryption_result["algorithm"]),
                iv=(
                    base64.b64decode(encryption_result["iv"])
                    if encryption_result.get("iv")
                    else None
                ),
                tag=(
                    base64.b64decode(encryption_result["tag"])
                    if encryption_result.get("tag")
                    else None
                ),
                metadata=encryption_result.get("metadata", {}),
            )

        key_id = encryption_result.key_id

        if key_id not in self._keys:
            raise ValueError(f"Key not found: {key_id}")

        key = self._keys[key_id]
        algorithm = encryption_result.algorithm

        if algorithm == EncryptionAlgorithm.AES_256_GCM:
            return self._decrypt_aes_gcm(encryption_result, key)
        elif algorithm == EncryptionAlgorithm.AES_256_CBC:
            return self._decrypt_aes_cbc(encryption_result, key)
        elif algorithm == EncryptionAlgorithm.FERNET:
            return self._decrypt_fernet(encryption_result, key)
        elif algorithm in [EncryptionAlgorithm.RSA_2048, EncryptionAlgorithm.RSA_4096]:
            return self._decrypt_rsa(encryption_result, key)
        else:
            raise ValueError(f"Unsupported decryption algorithm: {algorithm}")

    def _encrypt_aes_gcm(
        self, data: bytes, key: bytes, key_id: str
    ) -> EncryptionResult:
        """Encrypt data using AES-256-GCM."""

        # Generate random IV
        iv = secrets.token_bytes(12)  # 96-bit IV for GCM

        # Create cipher
        cipher = Cipher(algorithms.AES(key), modes.GCM(iv))
        encryptor = cipher.encryptor()

        # Encrypt data
        ciphertext = encryptor.update(data) + encryptor.finalize()

        return EncryptionResult(
            encrypted_data=ciphertext,
            key_id=key_id,
            algorithm=EncryptionAlgorithm.AES_256_GCM,
            iv=iv,
            tag=encryptor.tag,
        )

    def _decrypt_aes_gcm(
        self, encryption_result: EncryptionResult, key: bytes
    ) -> bytes:
        """Decrypt data using AES-256-GCM."""

        # Create cipher
        cipher = Cipher(
            algorithms.AES(key), modes.GCM(encryption_result.iv, encryption_result.tag)
        )
        decryptor = cipher.decryptor()

        # Decrypt data
        plaintext = (
            decryptor.update(encryption_result.encrypted_data) + decryptor.finalize()
        )

        return plaintext

    def _encrypt_aes_cbc(
        self, data: bytes, key: bytes, key_id: str
    ) -> EncryptionResult:
        """Encrypt data using AES-256-CBC."""

        # Generate random IV
        iv = secrets.token_bytes(16)  # 128-bit IV for CBC

        # Pad data to block size
        block_size = 16
        padding_length = block_size - (len(data) % block_size)
        padded_data = data + bytes([padding_length] * padding_length)

        # Create cipher
        cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
        encryptor = cipher.encryptor()

        # Encrypt data
        ciphertext = encryptor.update(padded_data) + encryptor.finalize()

        return EncryptionResult(
            encrypted_data=ciphertext,
            key_id=key_id,
            algorithm=EncryptionAlgorithm.AES_256_CBC,
            iv=iv,
        )

    def _decrypt_aes_cbc(
        self, encryption_result: EncryptionResult, key: bytes
    ) -> bytes:
        """Decrypt data using AES-256-CBC."""

        # Create cipher
        cipher = Cipher(algorithms.AES(key), modes.CBC(encryption_result.iv))
        decryptor = cipher.decryptor()

        # Decrypt data
        padded_data = (
            decryptor.update(encryption_result.encrypted_data) + decryptor.finalize()
        )

        # Remove padding
        padding_length = padded_data[-1]
        plaintext = padded_data[:-padding_length]

        return plaintext

    def _encrypt_fernet(self, data: bytes, key: bytes, key_id: str) -> EncryptionResult:
        """Encrypt data using Fernet."""

        fernet = Fernet(key)
        ciphertext = fernet.encrypt(data)

        return EncryptionResult(
            encrypted_data=ciphertext,
            key_id=key_id,
            algorithm=EncryptionAlgorithm.FERNET,
        )

    def _decrypt_fernet(self, encryption_result: EncryptionResult, key: bytes) -> bytes:
        """Decrypt data using Fernet."""

        fernet = Fernet(key)
        plaintext = fernet.decrypt(encryption_result.encrypted_data)

        return plaintext

    def _encrypt_rsa(
        self, data: bytes, key_pem: bytes, key_id: str, algorithm: EncryptionAlgorithm
    ) -> EncryptionResult:
        """Encrypt data using RSA."""

        # Load public key
        public_key = serialization.load_pem_public_key(key_pem)

        # RSA can only encrypt small amounts of data
        max_chunk_size = (
            (public_key.key_size // 8) - 2 * (hashes.SHA256().digest_size) - 2
        )

        if len(data) > max_chunk_size:
            raise ValueError(
                f"Data too large for RSA encryption. Max size: {max_chunk_size} bytes"
            )

        # Encrypt data
        ciphertext = public_key.encrypt(
            data,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )

        return EncryptionResult(
            encrypted_data=ciphertext, key_id=key_id, algorithm=algorithm
        )

    def _decrypt_rsa(
        self, encryption_result: EncryptionResult, key_pem: bytes
    ) -> bytes:
        """Decrypt data using RSA."""

        # Load private key
        private_key = serialization.load_pem_private_key(key_pem, password=None)

        # Decrypt data
        plaintext = private_key.decrypt(
            encryption_result.encrypted_data,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )

        return plaintext

    def sign_data(self, data: Union[str, bytes], private_key_id: str) -> bytes:
        """
        Create digital signature for data.

        Args:
            data: Data to sign
            private_key_id: ID of private key for signing

        Returns:
            Digital signature
        """

        if private_key_id not in self._keys:
            raise ValueError(f"Private key not found: {private_key_id}")

        key_metadata = self._key_metadata[private_key_id]

        if key_metadata.key_type != KeyType.ASYMMETRIC_PRIVATE:
            raise ValueError(f"Key is not a private key: {private_key_id}")

        # Convert string to bytes
        if isinstance(data, str):
            data = data.encode("utf-8")

        # Load private key
        private_key_pem = self._keys[private_key_id]
        private_key = serialization.load_pem_private_key(private_key_pem, password=None)

        # Create signature
        signature = private_key.sign(
            data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256(),
        )

        return signature

    def verify_signature(
        self, data: Union[str, bytes], signature: bytes, public_key_id: str
    ) -> bool:
        """
        Verify digital signature.

        Args:
            data: Original data
            signature: Digital signature
            public_key_id: ID of public key for verification

        Returns:
            True if signature is valid
        """

        if public_key_id not in self._keys:
            raise ValueError(f"Public key not found: {public_key_id}")

        key_metadata = self._key_metadata[public_key_id]

        if key_metadata.key_type != KeyType.ASYMMETRIC_PUBLIC:
            raise ValueError(f"Key is not a public key: {public_key_id}")

        # Convert string to bytes
        if isinstance(data, str):
            data = data.encode("utf-8")

        # Load public key
        public_key_pem = self._keys[public_key_id]
        public_key = serialization.load_pem_public_key(public_key_pem)

        try:
            # Verify signature
            public_key.verify(
                signature,
                data,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH,
                ),
                hashes.SHA256(),
            )
            return True
        except Exception:
            return False

    def hash_data(self, data: Union[str, bytes], algorithm: str = "sha256") -> str:
        """
        Create cryptographic hash of data.

        Args:
            data: Data to hash
            algorithm: Hash algorithm (sha256, sha512, etc.)

        Returns:
            Hex-encoded hash
        """

        # Convert string to bytes
        if isinstance(data, str):
            data = data.encode("utf-8")

        if algorithm == "sha256":
            hash_obj = hashlib.sha256(data)
        elif algorithm == "sha512":
            hash_obj = hashlib.sha512(data)
        elif algorithm == "sha1":
            hash_obj = hashlib.sha1(data)
        elif algorithm == "md5":
            hash_obj = hashlib.md5(data)
        else:
            raise ValueError(f"Unsupported hash algorithm: {algorithm}")

        return hash_obj.hexdigest()

    def generate_random_bytes(self, length: int) -> bytes:
        """Generate cryptographically secure random bytes."""

        return secrets.token_bytes(length)

    def generate_random_string(self, length: int, alphabet: str = None) -> str:
        """Generate cryptographically secure random string."""

        if alphabet is None:
            # Default alphabet: letters and digits
            alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

        return "".join(secrets.choice(alphabet) for _ in range(length))

    def rotate_key(self, old_key_id: str, purpose: str = None) -> str:
        """
        Rotate an encryption key by generating a new one.

        Args:
            old_key_id: ID of key to rotate
            purpose: Purpose for new key (uses old key's purpose if None)

        Returns:
            New key ID
        """

        if old_key_id not in self._key_metadata:
            raise ValueError(f"Key not found: {old_key_id}")

        old_metadata = self._key_metadata[old_key_id]

        if purpose is None:
            purpose = old_metadata.purpose

        # Generate new key based on old key's type and algorithm
        if old_metadata.key_type == KeyType.SYMMETRIC:
            new_key_id = self.generate_symmetric_key(
                algorithm=old_metadata.algorithm, purpose=purpose
            )
        elif old_metadata.key_type in [
            KeyType.ASYMMETRIC_PRIVATE,
            KeyType.ASYMMETRIC_PUBLIC,
        ]:
            private_key_id, public_key_id = self.generate_asymmetric_key_pair(
                algorithm=old_metadata.algorithm, purpose=purpose
            )
            new_key_id = (
                private_key_id
                if old_metadata.key_type == KeyType.ASYMMETRIC_PRIVATE
                else public_key_id
            )
        else:
            raise ValueError(f"Cannot rotate key of type: {old_metadata.key_type}")

        # Mark old key as expired
        old_metadata.expires_at = datetime.utcnow()

        self.logger.info(f"Rotated key {old_key_id} -> {new_key_id}")
        return new_key_id

    def delete_key(self, key_id: str) -> bool:
        """
        Delete an encryption key.

        Args:
            key_id: ID of key to delete

        Returns:
            True if key was deleted
        """

        if key_id not in self._keys:
            return False

        # Don't allow deletion of master key
        if key_id == "master_key":
            raise ValueError("Cannot delete master key")

        del self._keys[key_id]
        del self._key_metadata[key_id]

        self.logger.info(f"Deleted key: {key_id}")
        return True

    def get_key_metadata(self, key_id: str) -> Optional[EncryptionKey]:
        """Get metadata for a key."""

        return self._key_metadata.get(key_id)

    def list_keys(
        self,
        key_type: KeyType = None,
        purpose: str = None,
        include_expired: bool = False,
    ) -> List[EncryptionKey]:
        """
        List encryption keys with optional filtering.

        Args:
            key_type: Filter by key type
            purpose: Filter by purpose
            include_expired: Include expired keys

        Returns:
            List of EncryptionKey metadata
        """

        keys = []

        for key_metadata in self._key_metadata.values():
            # Apply filters
            if key_type and key_metadata.key_type != key_type:
                continue

            if purpose and key_metadata.purpose != purpose:
                continue

            if (
                not include_expired
                and key_metadata.expires_at
                and datetime.utcnow() > key_metadata.expires_at
            ):
                continue

            keys.append(key_metadata)

        # Sort by creation date (newest first)
        keys.sort(key=lambda x: x.created_at, reverse=True)
        return keys

    def get_encryption_statistics(self) -> Dict[str, Any]:
        """Get encryption service statistics."""

        total_keys = len(self._key_metadata)
        active_keys = len(
            [
                k
                for k in self._key_metadata.values()
                if not k.expires_at or datetime.utcnow() <= k.expires_at
            ]
        )
        expired_keys = total_keys - active_keys

        key_types = {}
        algorithms = {}

        for key_metadata in self._key_metadata.values():
            key_types[key_metadata.key_type.value] = (
                key_types.get(key_metadata.key_type.value, 0) + 1
            )
            algorithms[key_metadata.algorithm.value] = (
                algorithms.get(key_metadata.algorithm.value, 0) + 1
            )

        return {
            "total_keys": total_keys,
            "active_keys": active_keys,
            "expired_keys": expired_keys,
            "key_types": key_types,
            "algorithms": algorithms,
            "last_updated": datetime.utcnow().isoformat(),
        }

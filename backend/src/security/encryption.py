"""
Advanced Encryption Manager for Financial-Grade Security
"""

import os
import hashlib
import secrets
import base64
import json
from datetime import datetime, timezone
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import pyotp
import logging

logger = logging.getLogger(__name__)

class PasswordManager:
    """Enhanced password management with financial-grade security"""
    
    def __init__(self):
        self.min_length = 12
        self.require_uppercase = True
        self.require_lowercase = True
        self.require_digits = True
        self.require_special = True
        self.special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    def hash_password(self, password: str) -> str:
        """Hash password using secure algorithm"""
        return generate_password_hash(
            password,
            method='pbkdf2:sha256:100000',  # 100,000 iterations
            salt_length=32
        )
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        return check_password_hash(password_hash, password)
    
    def validate_password_strength(self, password: str) -> dict:
        """Validate password strength according to financial industry standards"""
        errors = []
        requirements = {
            'min_length': f'At least {self.min_length} characters',
            'uppercase': 'At least one uppercase letter',
            'lowercase': 'At least one lowercase letter',
            'digit': 'At least one digit',
            'special': 'At least one special character',
            'no_common': 'Not a commonly used password'
        }
        
        # Check length
        if len(password) < self.min_length:
            errors.append('min_length')
        
        # Check character requirements
        if self.require_uppercase and not any(c.isupper() for c in password):
            errors.append('uppercase')
        
        if self.require_lowercase and not any(c.islower() for c in password):
            errors.append('lowercase')
        
        if self.require_digits and not any(c.isdigit() for c in password):
            errors.append('digit')
        
        if self.require_special and not any(c in self.special_chars for c in password):
            errors.append('special')
        
        # Check against common passwords
        if self._is_common_password(password):
            errors.append('no_common')
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'requirements': requirements
        }
    
    def _is_common_password(self, password: str) -> bool:
        """Check if password is commonly used"""
        common_passwords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey'
        ]
        return password.lower() in common_passwords

class TokenManager:
    """Enhanced JWT token management with security features"""
    
    def __init__(self):
        self.secret_key = os.environ.get('JWT_SECRET_KEY', self._generate_secret_key())
        self.algorithm = 'HS256'
        self.access_token_expiry = 3600  # 1 hour
        self.refresh_token_expiry = 86400 * 30  # 30 days
        self.blacklisted_tokens = set()  # In production, use Redis
    
    def _generate_secret_key(self) -> str:
        """Generate a secure secret key"""
        return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
    
    def generate_access_token(self, user_id: str, additional_claims: dict = None) -> str:
        """Generate access token"""
        payload = {
            'user_id': str(user_id),
            'type': 'access',
            'iat': datetime.now(timezone.utc),
            'exp': datetime.now(timezone.utc).timestamp() + self.access_token_expiry,
            'jti': secrets.token_urlsafe(16)  # JWT ID for blacklisting
        }
        
        if additional_claims:
            payload.update(additional_claims)
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def generate_refresh_token(self, user_id: str) -> str:
        """Generate refresh token"""
        payload = {
            'user_id': str(user_id),
            'type': 'refresh',
            'iat': datetime.now(timezone.utc),
            'exp': datetime.now(timezone.utc).timestamp() + self.refresh_token_expiry,
            'jti': secrets.token_urlsafe(16)
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def generate_verification_token(self, user_id: str, purpose: str) -> str:
        """Generate verification token for email/phone verification"""
        payload = {
            'user_id': str(user_id),
            'type': 'verification',
            'purpose': purpose,
            'iat': datetime.now(timezone.utc),
            'exp': datetime.now(timezone.utc).timestamp() + 3600,  # 1 hour
            'jti': secrets.token_urlsafe(16)
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def validate_access_token(self, token: str) -> dict:
        """Validate access token"""
        if token in self.blacklisted_tokens:
            raise jwt.InvalidTokenError("Token has been blacklisted")
        
        payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        
        if payload.get('type') != 'access':
            raise jwt.InvalidTokenError("Invalid token type")
        
        return payload
    
    def validate_refresh_token(self, token: str) -> dict:
        """Validate refresh token"""
        if token in self.blacklisted_tokens:
            raise jwt.InvalidTokenError("Token has been blacklisted")
        
        payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        
        if payload.get('type') != 'refresh':
            raise jwt.InvalidTokenError("Invalid token type")
        
        return payload
    
    def blacklist_token(self, token: str):
        """Add token to blacklist"""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm], options={"verify_exp": False})
            jti = payload.get('jti')
            if jti:
                self.blacklisted_tokens.add(jti)
        except jwt.InvalidTokenError:
            pass  # Invalid token, ignore

class DataEncryption:
    """Advanced data encryption for sensitive information"""
    
    def __init__(self):
        self.key = self._get_or_generate_key()
        self.fernet = Fernet(self.key)
    
    def _get_or_generate_key(self) -> bytes:
        """Get encryption key from environment or generate new one"""
        key_env = os.environ.get('ENCRYPTION_KEY')
        if key_env:
            return base64.urlsafe_b64decode(key_env.encode())
        else:
            key = Fernet.generate_key()
            logger.warning("Generated new encryption key. Set ENCRYPTION_KEY environment variable.")
            return key
    
    def encrypt(self, data: str) -> str:
        """Encrypt string data"""
        if not data:
            return data
        
        encrypted_data = self.fernet.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted_data).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Decrypt string data"""
        if not encrypted_data:
            return encrypted_data
        
        try:
            decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = self.fernet.decrypt(decoded_data)
            return decrypted_data.decode()
        except Exception as e:
            logger.error(f"Decryption error: {str(e)}")
            raise ValueError("Failed to decrypt data")
    
    def encrypt_json(self, data: dict) -> str:
        """Encrypt JSON data"""
        json_string = json.dumps(data, separators=(',', ':'))
        return self.encrypt(json_string)
    
    def decrypt_json(self, encrypted_data: str) -> dict:
        """Decrypt JSON data"""
        json_string = self.decrypt(encrypted_data)
        return json.loads(json_string)

class CardTokenizer:
    """Secure card number tokenization"""
    
    def __init__(self):
        self.encryption = DataEncryption()
    
    def generate_card_number(self) -> str:
        """Generate a test card number (for demo purposes)"""
        # Generate a valid Luhn algorithm card number
        prefix = "4000"  # Visa test prefix
        middle = ''.join([str(secrets.randbelow(10)) for _ in range(8)])
        
        # Calculate Luhn check digit
        partial = prefix + middle
        check_digit = self._calculate_luhn_check_digit(partial)
        
        return partial + str(check_digit)
    
    def _calculate_luhn_check_digit(self, partial_number: str) -> int:
        """Calculate Luhn algorithm check digit"""
        digits = [int(d) for d in partial_number]
        
        # Double every second digit from right
        for i in range(len(digits) - 2, -1, -2):
            digits[i] *= 2
            if digits[i] > 9:
                digits[i] -= 9
        
        total = sum(digits)
        return (10 - (total % 10)) % 10
    
    def tokenize_card_number(self, card_number: str) -> str:
        """Tokenize card number for secure storage"""
        # Remove spaces and validate
        clean_number = card_number.replace(' ', '').replace('-', '')
        
        if not clean_number.isdigit() or len(clean_number) < 13 or len(clean_number) > 19:
            raise ValueError("Invalid card number format")
        
        # Encrypt the card number
        encrypted_number = self.encryption.encrypt(clean_number)
        
        # Generate token prefix
        token_prefix = "CTK_"
        token_suffix = secrets.token_urlsafe(20)
        
        return token_prefix + token_suffix
    
    def detokenize_card_number(self, token: str, encrypted_data: str) -> str:
        """Detokenize card number (requires both token and encrypted data)"""
        return self.encryption.decrypt(encrypted_data)
    
    def generate_cvv(self) -> str:
        """Generate CVV for test cards"""
        return ''.join([str(secrets.randbelow(10)) for _ in range(3)])
    
    def hash_cvv(self, cvv: str) -> str:
        """Hash CVV for secure storage"""
        return hashlib.sha256(cvv.encode()).hexdigest()

class PINManager:
    """Secure PIN management"""
    
    def __init__(self):
        self.max_attempts = 3
        self.lockout_duration = 1800  # 30 minutes
    
    def hash_pin(self, pin: str) -> str:
        """Hash PIN using secure algorithm"""
        if not pin.isdigit() or len(pin) != 4:
            raise ValueError("PIN must be exactly 4 digits")
        
        # Use PBKDF2 with high iteration count
        salt = secrets.token_bytes(32)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = kdf.derive(pin.encode())
        
        # Combine salt and key for storage
        return base64.urlsafe_b64encode(salt + key).decode()
    
    def verify_pin(self, pin: str, pin_hash: str) -> bool:
        """Verify PIN against hash"""
        try:
            if not pin.isdigit() or len(pin) != 4:
                return False
            
            # Decode stored hash
            stored_data = base64.urlsafe_b64decode(pin_hash.encode())
            salt = stored_data[:32]
            stored_key = stored_data[32:]
            
            # Derive key from provided PIN
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            derived_key = kdf.derive(pin.encode())
            
            # Compare keys
            return secrets.compare_digest(stored_key, derived_key)
        except Exception:
            return False

class RSAKeyManager:
    """RSA key management for asymmetric encryption"""
    
    def __init__(self):
        self.key_size = 2048
        self.private_key = None
        self.public_key = None
        self._load_or_generate_keys()
    
    def _load_or_generate_keys(self):
        """Load existing keys or generate new ones"""
        try:
            # Try to load from environment variables
            private_key_pem = os.environ.get('RSA_PRIVATE_KEY')
            public_key_pem = os.environ.get('RSA_PUBLIC_KEY')
            
            if private_key_pem and public_key_pem:
                self.private_key = serialization.load_pem_private_key(
                    private_key_pem.encode(),
                    password=None
                )
                self.public_key = serialization.load_pem_public_key(
                    public_key_pem.encode()
                )
            else:
                self._generate_new_keys()
        except Exception as e:
            logger.warning(f"Failed to load RSA keys: {str(e)}. Generating new keys.")
            self._generate_new_keys()
    
    def _generate_new_keys(self):
        """Generate new RSA key pair"""
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=self.key_size
        )
        self.public_key = self.private_key.public_key()
        
        logger.warning("Generated new RSA keys. Consider setting RSA_PRIVATE_KEY and RSA_PUBLIC_KEY environment variables.")
    
    def encrypt_with_public_key(self, data: str) -> str:
        """Encrypt data with public key"""
        encrypted_data = self.public_key.encrypt(
            data.encode(),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return base64.urlsafe_b64encode(encrypted_data).decode()
    
    def decrypt_with_private_key(self, encrypted_data: str) -> str:
        """Decrypt data with private key"""
        decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
        decrypted_data = self.private_key.decrypt(
            decoded_data,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return decrypted_data.decode()
    
    def get_public_key_pem(self) -> str:
        """Get public key in PEM format"""
        pem = self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return pem.decode()

class SecureRandom:
    """Cryptographically secure random number generation"""
    
    @staticmethod
    def generate_token(length: int = 32) -> str:
        """Generate secure random token"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def generate_hex_token(length: int = 32) -> str:
        """Generate secure random hex token"""
        return secrets.token_hex(length)
    
    @staticmethod
    def generate_numeric_code(length: int = 6) -> str:
        """Generate secure numeric code"""
        return ''.join([str(secrets.randbelow(10)) for _ in range(length)])
    
    @staticmethod
    def generate_alphanumeric_code(length: int = 8) -> str:
        """Generate secure alphanumeric code"""
        alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        return ''.join([secrets.choice(alphabet) for _ in range(length)])

class HashManager:
    """Secure hashing utilities"""
    
    @staticmethod
    def sha256_hash(data: str) -> str:
        """Generate SHA-256 hash"""
        return hashlib.sha256(data.encode()).hexdigest()
    
    @staticmethod
    def sha512_hash(data: str) -> str:
        """Generate SHA-512 hash"""
        return hashlib.sha512(data.encode()).hexdigest()
    
    @staticmethod
    def hmac_hash(data: str, key: str) -> str:
        """Generate HMAC hash"""
        import hmac
        return hmac.new(
            key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
    
    @staticmethod
    def verify_hmac(data: str, key: str, signature: str) -> bool:
        """Verify HMAC signature"""
        expected_signature = HashManager.hmac_hash(data, key)
        return secrets.compare_digest(expected_signature, signature)

# Initialize global instances
password_manager = PasswordManager()
token_manager = TokenManager()
data_encryption = DataEncryption()
card_tokenizer = CardTokenizer()
pin_manager = PINManager()
rsa_key_manager = RSAKeyManager()
secure_random = SecureRandom()
hash_manager = HashManager()


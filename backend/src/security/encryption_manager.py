# Enhanced Data Encryption and Tokenization
import os
import base64
import secrets
import hashlib
from typing import Optional, Dict, Any
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import json
import redis
from datetime import datetime, timedelta

class EncryptionManager:
    """Enhanced encryption manager for financial data protection"""
    
    def __init__(self):
        self.master_key = self._get_master_key()
        self.fernet = Fernet(self.master_key)
        self.redis_client = redis.Redis.from_url(
            os.environ.get('REDIS_URL', 'redis://localhost:6379'),
            decode_responses=True
        )
    
    def _get_master_key(self) -> bytes:
        """Get or generate master encryption key"""
        key_env = os.environ.get('MASTER_ENCRYPTION_KEY')
        if key_env:
            return base64.urlsafe_b64decode(key_env.encode())
        
        # Generate new key (in production, this should be stored securely)
        key = Fernet.generate_key()
        print(f"Generated new master key: {key.decode()}")
        print("Store this key securely in MASTER_ENCRYPTION_KEY environment variable")
        return key
    
    def encrypt_field(self, data: str, field_type: str = 'general') -> str:
        """Encrypt sensitive field data"""
        if not data:
            return data
        
        # Add metadata for field type and timestamp
        metadata = {
            'type': field_type,
            'timestamp': datetime.utcnow().isoformat(),
            'data': data
        }
        
        encrypted_data = self.fernet.encrypt(json.dumps(metadata).encode())
        return base64.urlsafe_b64encode(encrypted_data).decode()
    
    def decrypt_field(self, encrypted_data: str) -> Optional[str]:
        """Decrypt sensitive field data"""
        if not encrypted_data:
            return encrypted_data
        
        try:
            decoded_data = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted_data = self.fernet.decrypt(decoded_data)
            metadata = json.loads(decrypted_data.decode())
            return metadata.get('data')
        except Exception:
            return None
    
    def encrypt_pii(self, pii_data: Dict[str, Any]) -> Dict[str, str]:
        """Encrypt personally identifiable information"""
        encrypted_pii = {}
        
        pii_fields = {
            'ssn', 'social_security_number', 'tax_id', 'passport_number',
            'drivers_license', 'date_of_birth', 'full_address'
        }
        
        for field, value in pii_data.items():
            if field.lower() in pii_fields and value:
                encrypted_pii[field] = self.encrypt_field(str(value), 'pii')
            else:
                encrypted_pii[field] = value
        
        return encrypted_pii
    
    def decrypt_pii(self, encrypted_pii: Dict[str, Any]) -> Dict[str, Any]:
        """Decrypt personally identifiable information"""
        decrypted_pii = {}
        
        for field, value in encrypted_pii.items():
            if isinstance(value, str) and self._is_encrypted_field(value):
                decrypted_pii[field] = self.decrypt_field(value)
            else:
                decrypted_pii[field] = value
        
        return decrypted_pii
    
    def _is_encrypted_field(self, value: str) -> bool:
        """Check if a field value is encrypted"""
        try:
            # Try to decode as base64 and check if it's valid encrypted data
            decoded = base64.urlsafe_b64decode(value.encode())
            return len(decoded) > 32  # Fernet adds overhead
        except Exception:
            return False

class TokenizationManager:
    """Enhanced tokenization system for sensitive financial data"""
    
    def __init__(self):
        self.redis_client = redis.Redis.from_url(
            os.environ.get('REDIS_URL', 'redis://localhost:6379'),
            decode_responses=True
        )
        self.encryption_manager = EncryptionManager()
    
    def tokenize_card_number(self, card_number: str, user_id: str) -> Dict[str, str]:
        """Tokenize credit card number"""
        if not card_number:
            return {'token': '', 'last_four': ''}
        
        # Generate secure token
        token = f"card_{secrets.token_urlsafe(24)}"
        
        # Extract last four digits
        last_four = card_number[-4:] if len(card_number) >= 4 else card_number
        
        # Encrypt and store card number
        encrypted_card = self.encryption_manager.encrypt_field(card_number, 'card_number')
        
        # Store in Redis with expiration (1 year)
        token_data = {
            'encrypted_data': encrypted_card,
            'user_id': user_id,
            'type': 'card_number',
            'last_four': last_four,
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.redis_client.setex(
            f"token:{token}",
            365 * 24 * 3600,  # 1 year
            json.dumps(token_data)
        )
        
        # Log tokenization event
        from src.security.audit_logger import AuditLogger
        AuditLogger.log_event(
            user_id=user_id,
            action='tokenize_card_number',
            resource_type='payment_card',
            additional_data={'token_prefix': token[:10], 'last_four': last_four}
        )
        
        return {
            'token': token,
            'last_four': last_four
        }
    
    def detokenize_card_number(self, token: str, user_id: str) -> Optional[str]:
        """Detokenize credit card number"""
        if not token:
            return None
        
        # Retrieve token data
        token_data = self.redis_client.get(f"token:{token}")
        if not token_data:
            return None
        
        try:
            data = json.loads(token_data)
            
            # Verify user ownership
            if data.get('user_id') != user_id:
                # Log unauthorized access attempt
                from src.security.audit_logger import AuditLogger
                AuditLogger.log_event(
                    user_id=user_id,
                    action='unauthorized_detokenization_attempt',
                    resource_type='payment_card',
                    additional_data={'token_prefix': token[:10]},
                    risk_score=80,
                    is_suspicious=True
                )
                return None
            
            # Decrypt card number
            card_number = self.encryption_manager.decrypt_field(data['encrypted_data'])
            
            # Log detokenization event
            from src.security.audit_logger import AuditLogger
            AuditLogger.log_event(
                user_id=user_id,
                action='detokenize_card_number',
                resource_type='payment_card',
                additional_data={'token_prefix': token[:10]}
            )
            
            return card_number
            
        except Exception:
            return None
    
    def tokenize_bank_account(self, account_number: str, routing_number: str, user_id: str) -> Dict[str, str]:
        """Tokenize bank account information"""
        if not account_number or not routing_number:
            return {'token': '', 'masked_account': ''}
        
        # Generate secure token
        token = f"bank_{secrets.token_urlsafe(24)}"
        
        # Create masked account number
        masked_account = f"****{account_number[-4:]}" if len(account_number) >= 4 else account_number
        
        # Encrypt and store account data
        account_data = {
            'account_number': account_number,
            'routing_number': routing_number
        }
        encrypted_data = self.encryption_manager.encrypt_field(json.dumps(account_data), 'bank_account')
        
        # Store in Redis with expiration (1 year)
        token_data = {
            'encrypted_data': encrypted_data,
            'user_id': user_id,
            'type': 'bank_account',
            'masked_account': masked_account,
            'created_at': datetime.utcnow().isoformat()
        }
        
        self.redis_client.setex(
            f"token:{token}",
            365 * 24 * 3600,  # 1 year
            json.dumps(token_data)
        )
        
        # Log tokenization event
        from src.security.audit_logger import AuditLogger
        AuditLogger.log_event(
            user_id=user_id,
            action='tokenize_bank_account',
            resource_type='bank_account',
            additional_data={'token_prefix': token[:10], 'masked_account': masked_account}
        )
        
        return {
            'token': token,
            'masked_account': masked_account
        }
    
    def detokenize_bank_account(self, token: str, user_id: str) -> Optional[Dict[str, str]]:
        """Detokenize bank account information"""
        if not token:
            return None
        
        # Retrieve token data
        token_data = self.redis_client.get(f"token:{token}")
        if not token_data:
            return None
        
        try:
            data = json.loads(token_data)
            
            # Verify user ownership
            if data.get('user_id') != user_id:
                # Log unauthorized access attempt
                from src.security.audit_logger import AuditLogger
                AuditLogger.log_event(
                    user_id=user_id,
                    action='unauthorized_detokenization_attempt',
                    resource_type='bank_account',
                    additional_data={'token_prefix': token[:10]},
                    risk_score=80,
                    is_suspicious=True
                )
                return None
            
            # Decrypt account data
            decrypted_data = self.encryption_manager.decrypt_field(data['encrypted_data'])
            account_data = json.loads(decrypted_data)
            
            # Log detokenization event
            from src.security.audit_logger import AuditLogger
            AuditLogger.log_event(
                user_id=user_id,
                action='detokenize_bank_account',
                resource_type='bank_account',
                additional_data={'token_prefix': token[:10]}
            )
            
            return account_data
            
        except Exception:
            return None
    
    def revoke_token(self, token: str, user_id: str) -> bool:
        """Revoke a token"""
        # Verify token exists and belongs to user
        token_data = self.redis_client.get(f"token:{token}")
        if not token_data:
            return False
        
        try:
            data = json.loads(token_data)
            if data.get('user_id') != user_id:
                return False
            
            # Delete token
            self.redis_client.delete(f"token:{token}")
            
            # Log revocation
            from src.security.audit_logger import AuditLogger
            AuditLogger.log_event(
                user_id=user_id,
                action='revoke_token',
                resource_type=data.get('type', 'unknown'),
                additional_data={'token_prefix': token[:10]}
            )
            
            return True
            
        except Exception:
            return False
    
    def list_user_tokens(self, user_id: str) -> list:
        """List all tokens for a user"""
        tokens = []
        
        # Scan for all tokens (in production, consider using a separate index)
        for key in self.redis_client.scan_iter(match="token:*"):
            token_data = self.redis_client.get(key)
            if token_data:
                try:
                    data = json.loads(token_data)
                    if data.get('user_id') == user_id:
                        token = key.split(':', 1)[1]
                        tokens.append({
                            'token_prefix': token[:10] + '...',
                            'type': data.get('type'),
                            'created_at': data.get('created_at'),
                            'masked_data': data.get('masked_account') or data.get('last_four')
                        })
                except Exception:
                    continue
        
        return tokens

class DatabaseEncryption:
    """Database field encryption for sensitive data"""
    
    def __init__(self):
        self.encryption_manager = EncryptionManager()
    
    def encrypt_before_save(self, model_instance, sensitive_fields: list):
        """Encrypt sensitive fields before saving to database"""
        for field in sensitive_fields:
            value = getattr(model_instance, field, None)
            if value:
                encrypted_value = self.encryption_manager.encrypt_field(str(value), field)
                setattr(model_instance, f"{field}_encrypted", encrypted_value)
                # Optionally clear the original field
                setattr(model_instance, field, None)
    
    def decrypt_after_load(self, model_instance, sensitive_fields: list):
        """Decrypt sensitive fields after loading from database"""
        for field in sensitive_fields:
            encrypted_value = getattr(model_instance, f"{field}_encrypted", None)
            if encrypted_value:
                decrypted_value = self.encryption_manager.decrypt_field(encrypted_value)
                setattr(model_instance, field, decrypted_value)


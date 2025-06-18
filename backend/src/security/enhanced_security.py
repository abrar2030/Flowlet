"""
Enhanced Security Module for Financial Industry Standards
Implements bank-grade security features including encryption, tokenization, and threat detection
"""

import hashlib
import hmac
import secrets
import base64
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum
import jwt
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import redis
import asyncio
from functools import wraps
import ipaddress
import re
import time
from collections import defaultdict, deque
import geoip2.database
import user_agents

# Configure logging for security events
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SecurityLevel(Enum):
    """Security levels for different operations"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class ThreatType(Enum):
    """Types of security threats"""
    BRUTE_FORCE = "brute_force"
    SUSPICIOUS_LOCATION = "suspicious_location"
    UNUSUAL_DEVICE = "unusual_device"
    HIGH_VELOCITY = "high_velocity"
    MALFORMED_REQUEST = "malformed_request"
    INJECTION_ATTEMPT = "injection_attempt"
    PRIVILEGE_ESCALATION = "privilege_escalation"

@dataclass
class SecurityEvent:
    """Security event for logging and monitoring"""
    event_id: str
    event_type: ThreatType
    severity: SecurityLevel
    user_id: Optional[str]
    ip_address: str
    user_agent: str
    timestamp: datetime
    details: Dict[str, Any]
    action_taken: str

@dataclass
class TokenData:
    """Token data structure"""
    original_value: str
    token: str
    token_type: str
    created_at: datetime
    expires_at: Optional[datetime]
    metadata: Dict[str, Any]

class EnhancedEncryption:
    """
    Enhanced encryption service with multiple algorithms and key management
    """
    
    def __init__(self, master_key: Optional[str] = None):
        self.master_key = master_key or self._generate_master_key()
        self.fernet = Fernet(self.master_key.encode()[:44] + b'=')  # Ensure proper base64 format
        self.redis_client = redis.Redis(host='localhost', port=6379, db=1)
        
        # Generate RSA key pair for asymmetric encryption
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        self.public_key = self.private_key.public_key()
    
    def _generate_master_key(self) -> str:
        """Generate a secure master key"""
        return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
    
    def encrypt_symmetric(self, data: str, context: Optional[Dict] = None) -> str:
        """Encrypt data using symmetric encryption"""
        try:
            # Add context for additional security
            if context:
                data_with_context = json.dumps({
                    'data': data,
                    'context': context,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                })
            else:
                data_with_context = data
            
            encrypted = self.fernet.encrypt(data_with_context.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
            
        except Exception as e:
            logger.error(f"Encryption error: {str(e)}")
            raise SecurityException("Encryption failed")
    
    def decrypt_symmetric(self, encrypted_data: str, context: Optional[Dict] = None) -> str:
        """Decrypt data using symmetric encryption"""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.fernet.decrypt(encrypted_bytes)
            decrypted_str = decrypted.decode()
            
            # Handle context if present
            if context:
                try:
                    data_obj = json.loads(decrypted_str)
                    return data_obj['data']
                except (json.JSONDecodeError, KeyError):
                    return decrypted_str
            
            return decrypted_str
            
        except Exception as e:
            logger.error(f"Decryption error: {str(e)}")
            raise SecurityException("Decryption failed")
    
    def encrypt_asymmetric(self, data: str) -> str:
        """Encrypt data using asymmetric encryption"""
        try:
            encrypted = self.public_key.encrypt(
                data.encode(),
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return base64.urlsafe_b64encode(encrypted).decode()
            
        except Exception as e:
            logger.error(f"Asymmetric encryption error: {str(e)}")
            raise SecurityException("Asymmetric encryption failed")
    
    def decrypt_asymmetric(self, encrypted_data: str) -> str:
        """Decrypt data using asymmetric encryption"""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.private_key.decrypt(
                encrypted_bytes,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return decrypted.decode()
            
        except Exception as e:
            logger.error(f"Asymmetric decryption error: {str(e)}")
            raise SecurityException("Asymmetric decryption failed")
    
    def generate_hash(self, data: str, salt: Optional[str] = None) -> Tuple[str, str]:
        """Generate secure hash with salt"""
        if not salt:
            salt = secrets.token_hex(32)
        
        # Use PBKDF2 for password hashing
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt.encode(),
            iterations=100000,
            backend=default_backend()
        )
        
        key = kdf.derive(data.encode())
        hash_value = base64.urlsafe_b64encode(key).decode()
        
        return hash_value, salt
    
    def verify_hash(self, data: str, hash_value: str, salt: str) -> bool:
        """Verify hash against original data"""
        try:
            computed_hash, _ = self.generate_hash(data, salt)
            return hmac.compare_digest(computed_hash, hash_value)
        except Exception:
            return False

class AdvancedTokenization:
    """
    Advanced tokenization service for sensitive data protection
    """
    
    def __init__(self, encryption_service: EnhancedEncryption):
        self.encryption = encryption_service
        self.redis_client = redis.Redis(host='localhost', port=6379, db=2)
        self.token_formats = {
            'card': r'^[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}$',
            'ssn': r'^[0-9]{3}-[0-9]{2}-[0-9]{4}$',
            'account': r'^[0-9]{8,17}$',
            'generic': r'^.*$'
        }
    
    def tokenize(self, sensitive_data: str, token_type: str = 'generic', 
                 ttl: Optional[int] = None, metadata: Optional[Dict] = None) -> str:
        """
        Tokenize sensitive data with format-preserving tokenization
        """
        try:
            # Generate format-preserving token
            if token_type == 'card':
                token = self._generate_card_token()
            elif token_type == 'ssn':
                token = self._generate_ssn_token()
            elif token_type == 'account':
                token = self._generate_account_token(len(sensitive_data))
            else:
                token = self._generate_generic_token()
            
            # Encrypt the original data
            encrypted_data = self.encryption.encrypt_symmetric(sensitive_data)
            
            # Store token mapping
            token_data = TokenData(
                original_value=encrypted_data,
                token=token,
                token_type=token_type,
                created_at=datetime.now(timezone.utc),
                expires_at=datetime.now(timezone.utc) + timedelta(seconds=ttl) if ttl else None,
                metadata=metadata or {}
            )
            
            # Store in Redis with optional TTL
            key = f"token:{token}"
            value = json.dumps({
                'original_value': token_data.original_value,
                'token_type': token_data.token_type,
                'created_at': token_data.created_at.isoformat(),
                'expires_at': token_data.expires_at.isoformat() if token_data.expires_at else None,
                'metadata': token_data.metadata
            })
            
            if ttl:
                self.redis_client.setex(key, ttl, value)
            else:
                self.redis_client.set(key, value)
            
            # Log tokenization event
            logger.info(f"Data tokenized: type={token_type}, token={token[:8]}...")
            
            return token
            
        except Exception as e:
            logger.error(f"Tokenization error: {str(e)}")
            raise SecurityException("Tokenization failed")
    
    def detokenize(self, token: str) -> Optional[str]:
        """
        Detokenize to retrieve original sensitive data
        """
        try:
            key = f"token:{token}"
            token_data_json = self.redis_client.get(key)
            
            if not token_data_json:
                logger.warning(f"Token not found: {token[:8]}...")
                return None
            
            token_data = json.loads(token_data_json)
            
            # Check expiration
            if token_data.get('expires_at'):
                expires_at = datetime.fromisoformat(token_data['expires_at'])
                if datetime.now(timezone.utc) > expires_at:
                    self.redis_client.delete(key)
                    logger.warning(f"Token expired: {token[:8]}...")
                    return None
            
            # Decrypt original data
            original_data = self.encryption.decrypt_symmetric(token_data['original_value'])
            
            # Log detokenization event
            logger.info(f"Data detokenized: token={token[:8]}...")
            
            return original_data
            
        except Exception as e:
            logger.error(f"Detokenization error: {str(e)}")
            return None
    
    def _generate_card_token(self) -> str:
        """Generate format-preserving card token"""
        return f"{secrets.randbelow(9000) + 1000}-{secrets.randbelow(9000) + 1000}-{secrets.randbelow(9000) + 1000}-{secrets.randbelow(9000) + 1000}"
    
    def _generate_ssn_token(self) -> str:
        """Generate format-preserving SSN token"""
        return f"{secrets.randbelow(900) + 100:03d}-{secrets.randbelow(90) + 10:02d}-{secrets.randbelow(9000) + 1000:04d}"
    
    def _generate_account_token(self, length: int) -> str:
        """Generate format-preserving account token"""
        return ''.join([str(secrets.randbelow(10)) for _ in range(length)])
    
    def _generate_generic_token(self) -> str:
        """Generate generic token"""
        return secrets.token_urlsafe(32)

class ThreatDetectionSystem:
    """
    Advanced threat detection system with real-time monitoring
    """
    
    def __init__(self):
        self.redis_client = redis.Redis(host='localhost', port=6379, db=3)
        self.rate_limiters = defaultdict(lambda: deque())
        self.suspicious_patterns = self._load_suspicious_patterns()
        self.geoip_reader = None  # Would be initialized with GeoIP database
        
        # Threat detection rules
        self.detection_rules = {
            'brute_force': {'attempts': 5, 'window': 300},  # 5 attempts in 5 minutes
            'high_velocity': {'requests': 100, 'window': 60},  # 100 requests per minute
            'suspicious_location': {'enabled': True},
            'unusual_device': {'enabled': True}
        }
    
    def _load_suspicious_patterns(self) -> List[re.Pattern]:
        """Load suspicious request patterns"""
        patterns = [
            r'(?i)(union|select|insert|delete|drop|exec|script)',  # SQL injection
            r'(?i)(<script|javascript:|vbscript:)',  # XSS
            r'(?i)(\.\.\/|\.\.\\)',  # Path traversal
            r'(?i)(eval\(|system\(|exec\()',  # Code injection
        ]
        return [re.compile(pattern) for pattern in patterns]
    
    async def analyze_request(self, request_data: Dict[str, Any]) -> List[SecurityEvent]:
        """
        Analyze incoming request for security threats
        """
        threats = []
        
        try:
            # Extract request information
            ip_address = request_data.get('ip_address', '')
            user_agent = request_data.get('user_agent', '')
            user_id = request_data.get('user_id')
            request_path = request_data.get('path', '')
            request_body = request_data.get('body', '')
            headers = request_data.get('headers', {})
            
            # Check for brute force attacks
            brute_force_threat = await self._check_brute_force(ip_address, user_id)
            if brute_force_threat:
                threats.append(brute_force_threat)
            
            # Check for high velocity attacks
            velocity_threat = await self._check_high_velocity(ip_address)
            if velocity_threat:
                threats.append(velocity_threat)
            
            # Check for suspicious location
            location_threat = await self._check_suspicious_location(ip_address, user_id)
            if location_threat:
                threats.append(location_threat)
            
            # Check for unusual device
            device_threat = await self._check_unusual_device(user_agent, user_id)
            if device_threat:
                threats.append(device_threat)
            
            # Check for malicious patterns
            pattern_threats = await self._check_malicious_patterns(request_path, request_body, headers)
            threats.extend(pattern_threats)
            
            # Log all detected threats
            for threat in threats:
                await self._log_security_event(threat)
            
            return threats
            
        except Exception as e:
            logger.error(f"Error in threat analysis: {str(e)}")
            return []
    
    async def _check_brute_force(self, ip_address: str, user_id: Optional[str]) -> Optional[SecurityEvent]:
        """Check for brute force attacks"""
        try:
            key = f"brute_force:{ip_address}:{user_id or 'anonymous'}"
            current_time = time.time()
            window = self.detection_rules['brute_force']['window']
            max_attempts = self.detection_rules['brute_force']['attempts']
            
            # Get recent attempts
            attempts = self.redis_client.zrangebyscore(key, current_time - window, current_time)
            
            if len(attempts) >= max_attempts:
                return SecurityEvent(
                    event_id=secrets.token_hex(16),
                    event_type=ThreatType.BRUTE_FORCE,
                    severity=SecurityLevel.HIGH,
                    user_id=user_id,
                    ip_address=ip_address,
                    user_agent='',
                    timestamp=datetime.now(timezone.utc),
                    details={'attempts': len(attempts), 'window': window},
                    action_taken='rate_limited'
                )
            
            # Record this attempt
            self.redis_client.zadd(key, {str(current_time): current_time})
            self.redis_client.expire(key, window)
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking brute force: {str(e)}")
            return None
    
    async def _check_high_velocity(self, ip_address: str) -> Optional[SecurityEvent]:
        """Check for high velocity attacks"""
        try:
            key = f"velocity:{ip_address}"
            current_time = time.time()
            window = self.detection_rules['high_velocity']['window']
            max_requests = self.detection_rules['high_velocity']['requests']
            
            # Get recent requests
            requests = self.redis_client.zrangebyscore(key, current_time - window, current_time)
            
            if len(requests) >= max_requests:
                return SecurityEvent(
                    event_id=secrets.token_hex(16),
                    event_type=ThreatType.HIGH_VELOCITY,
                    severity=SecurityLevel.MEDIUM,
                    user_id=None,
                    ip_address=ip_address,
                    user_agent='',
                    timestamp=datetime.now(timezone.utc),
                    details={'requests': len(requests), 'window': window},
                    action_taken='rate_limited'
                )
            
            # Record this request
            self.redis_client.zadd(key, {str(current_time): current_time})
            self.redis_client.expire(key, window)
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking velocity: {str(e)}")
            return None
    
    async def _check_suspicious_location(self, ip_address: str, user_id: Optional[str]) -> Optional[SecurityEvent]:
        """Check for suspicious geographic locations"""
        try:
            if not self.detection_rules['suspicious_location']['enabled'] or not user_id:
                return None
            
            # Get user's typical locations
            user_locations_key = f"user_locations:{user_id}"
            known_countries = self.redis_client.smembers(user_locations_key)
            
            # Get current location (would use GeoIP in production)
            current_country = self._get_country_from_ip(ip_address)
            
            if current_country and current_country.encode() not in known_countries:
                # Add to known locations for future reference
                self.redis_client.sadd(user_locations_key, current_country)
                self.redis_client.expire(user_locations_key, 86400 * 30)  # 30 days
                
                return SecurityEvent(
                    event_id=secrets.token_hex(16),
                    event_type=ThreatType.SUSPICIOUS_LOCATION,
                    severity=SecurityLevel.MEDIUM,
                    user_id=user_id,
                    ip_address=ip_address,
                    user_agent='',
                    timestamp=datetime.now(timezone.utc),
                    details={'country': current_country, 'known_countries': len(known_countries)},
                    action_taken='flagged'
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking location: {str(e)}")
            return None
    
    async def _check_unusual_device(self, user_agent: str, user_id: Optional[str]) -> Optional[SecurityEvent]:
        """Check for unusual devices"""
        try:
            if not self.detection_rules['unusual_device']['enabled'] or not user_id:
                return None
            
            # Parse user agent
            parsed_ua = user_agents.parse(user_agent)
            device_signature = f"{parsed_ua.browser.family}_{parsed_ua.os.family}"
            
            # Get user's known devices
            user_devices_key = f"user_devices:{user_id}"
            known_devices = self.redis_client.smembers(user_devices_key)
            
            if device_signature.encode() not in known_devices:
                # Add to known devices
                self.redis_client.sadd(user_devices_key, device_signature)
                self.redis_client.expire(user_devices_key, 86400 * 90)  # 90 days
                
                return SecurityEvent(
                    event_id=secrets.token_hex(16),
                    event_type=ThreatType.UNUSUAL_DEVICE,
                    severity=SecurityLevel.LOW,
                    user_id=user_id,
                    ip_address='',
                    user_agent=user_agent,
                    timestamp=datetime.now(timezone.utc),
                    details={'device': device_signature, 'known_devices': len(known_devices)},
                    action_taken='flagged'
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Error checking device: {str(e)}")
            return None
    
    async def _check_malicious_patterns(self, path: str, body: str, headers: Dict) -> List[SecurityEvent]:
        """Check for malicious patterns in request"""
        threats = []
        
        try:
            # Check all request components
            components = [path, body] + list(headers.values())
            
            for component in components:
                if not isinstance(component, str):
                    continue
                
                for pattern in self.suspicious_patterns:
                    if pattern.search(component):
                        threat = SecurityEvent(
                            event_id=secrets.token_hex(16),
                            event_type=ThreatType.INJECTION_ATTEMPT,
                            severity=SecurityLevel.HIGH,
                            user_id=None,
                            ip_address='',
                            user_agent='',
                            timestamp=datetime.now(timezone.utc),
                            details={'pattern': pattern.pattern, 'matched_text': component[:100]},
                            action_taken='blocked'
                        )
                        threats.append(threat)
                        break  # One threat per component
            
            return threats
            
        except Exception as e:
            logger.error(f"Error checking patterns: {str(e)}")
            return []
    
    def _get_country_from_ip(self, ip_address: str) -> Optional[str]:
        """Get country from IP address (simplified implementation)"""
        try:
            # In production, use GeoIP2 database
            # For now, return mock data
            if ip_address.startswith('192.168.') or ip_address.startswith('10.') or ip_address.startswith('127.'):
                return 'US'  # Local/private IPs
            return 'Unknown'
        except Exception:
            return None
    
    async def _log_security_event(self, event: SecurityEvent):
        """Log security event for monitoring and analysis"""
        try:
            log_entry = {
                'event_id': event.event_id,
                'event_type': event.event_type.value,
                'severity': event.severity.value,
                'user_id': event.user_id,
                'ip_address': event.ip_address,
                'user_agent': event.user_agent,
                'timestamp': event.timestamp.isoformat(),
                'details': event.details,
                'action_taken': event.action_taken
            }
            
            # Log to file and potentially send to SIEM
            logger.warning(f"SECURITY EVENT: {json.dumps(log_entry)}")
            
            # Store in Redis for real-time monitoring
            event_key = f"security_event:{event.event_id}"
            self.redis_client.setex(event_key, 86400, json.dumps(log_entry))  # 24 hours
            
        except Exception as e:
            logger.error(f"Error logging security event: {str(e)}")

class MultiFactorAuthentication:
    """
    Multi-factor authentication implementation
    """
    
    def __init__(self, encryption_service: EnhancedEncryption):
        self.encryption = encryption_service
        self.redis_client = redis.Redis(host='localhost', port=6379, db=4)
    
    def generate_totp_secret(self, user_id: str) -> str:
        """Generate TOTP secret for user"""
        secret = secrets.token_hex(20)
        encrypted_secret = self.encryption.encrypt_symmetric(secret)
        
        # Store encrypted secret
        key = f"totp_secret:{user_id}"
        self.redis_client.set(key, encrypted_secret)
        
        return secret
    
    def verify_totp(self, user_id: str, token: str) -> bool:
        """Verify TOTP token"""
        try:
            # Get user's secret
            key = f"totp_secret:{user_id}"
            encrypted_secret = self.redis_client.get(key)
            
            if not encrypted_secret:
                return False
            
            secret = self.encryption.decrypt_symmetric(encrypted_secret.decode())
            
            # Verify token (simplified implementation)
            # In production, use proper TOTP library like pyotp
            current_time = int(time.time() // 30)
            
            for time_window in [current_time - 1, current_time, current_time + 1]:
                expected_token = self._generate_totp_token(secret, time_window)
                if hmac.compare_digest(token, expected_token):
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"TOTP verification error: {str(e)}")
            return False
    
    def _generate_totp_token(self, secret: str, time_counter: int) -> str:
        """Generate TOTP token (simplified implementation)"""
        # This is a simplified implementation
        # In production, use proper TOTP algorithm
        data = f"{secret}{time_counter}"
        hash_value = hashlib.sha1(data.encode()).hexdigest()
        return hash_value[:6]

class SecurityException(Exception):
    """Custom exception for security-related errors"""
    pass

# Security decorators
def require_security_level(level: SecurityLevel):
    """Decorator to require specific security level"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Implementation would check current security context
            # For now, just log the requirement
            logger.info(f"Function {func.__name__} requires security level: {level.value}")
            return func(*args, **kwargs)
        return wrapper
    return decorator

def rate_limit(requests_per_minute: int = 60):
    """Decorator for rate limiting"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Implementation would check rate limits
            # For now, just log the limit
            logger.info(f"Function {func.__name__} rate limited to {requests_per_minute} requests/minute")
            return func(*args, **kwargs)
        return wrapper
    return decorator

# Export main classes
__all__ = [
    'EnhancedEncryption',
    'AdvancedTokenization',
    'ThreatDetectionSystem',
    'MultiFactorAuthentication',
    'SecurityEvent',
    'SecurityLevel',
    'ThreatType',
    'SecurityException',
    'require_security_level',
    'rate_limit'
]


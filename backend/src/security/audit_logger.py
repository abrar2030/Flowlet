# Enhanced Audit Logging System
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional
from flask import request
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from cryptography.fernet import Fernet
import os

Base = declarative_base()

class AuditLog(Base):
    """Enhanced audit log model for financial compliance"""
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    user_id = Column(String(50), nullable=True)
    session_id = Column(String(100), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100), nullable=True)
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    request_method = Column(String(10), nullable=True)
    request_url = Column(Text, nullable=True)
    request_data = Column(Text, nullable=True)  # Encrypted
    response_status = Column(Integer, nullable=True)
    response_data = Column(Text, nullable=True)  # Encrypted
    additional_data = Column(Text, nullable=True)  # Encrypted
    risk_score = Column(Integer, default=0)
    is_suspicious = Column(Boolean, default=False)
    correlation_id = Column(String(100), nullable=True)
    integrity_hash = Column(String(64), nullable=False)  # SHA-256 hash for integrity
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.generate_integrity_hash()
    
    def generate_integrity_hash(self):
        """Generate integrity hash for tamper detection"""
        data_to_hash = f"{self.timestamp}{self.user_id}{self.action}{self.resource_type}{self.resource_id}"
        self.integrity_hash = hashlib.sha256(data_to_hash.encode()).hexdigest()
    
    def verify_integrity(self) -> bool:
        """Verify log entry integrity"""
        expected_hash = hashlib.sha256(
            f"{self.timestamp}{self.user_id}{self.action}{self.resource_type}{self.resource_id}".encode()
        ).hexdigest()
        return self.integrity_hash == expected_hash

class AuditLogger:
    """Enhanced audit logging system for financial compliance"""
    
    def __init__(self):
        self.encryption_key = os.environ.get('AUDIT_ENCRYPTION_KEY')
        if self.encryption_key:
            self.cipher = Fernet(self.encryption_key.encode())
        else:
            self.cipher = None
    
    def _encrypt_data(self, data: str) -> str:
        """Encrypt sensitive audit data"""
        if self.cipher and data:
            return self.cipher.encrypt(data.encode()).decode()
        return data
    
    def _decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt audit data for authorized access"""
        if self.cipher and encrypted_data:
            try:
                return self.cipher.decrypt(encrypted_data.encode()).decode()
            except Exception:
                return "[DECRYPTION_FAILED]"
        return encrypted_data
    
    @staticmethod
    def log_event(
        user_id: Optional[str] = None,
        action: str = "",
        resource_type: str = "",
        resource_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_data: Optional[Dict[str, Any]] = None,
        response_status: Optional[int] = None,
        response_data: Optional[Dict[str, Any]] = None,
        additional_data: Optional[Dict[str, Any]] = None,
        risk_score: int = 0,
        is_suspicious: bool = False,
        correlation_id: Optional[str] = None
    ):
        """Log audit event with enhanced security"""
        from src.models.database import db
        
        logger = AuditLogger()
        
        # Get request context if available
        if not ip_address and request:
            ip_address = request.remote_addr
        if not user_agent and request:
            user_agent = request.headers.get('User-Agent')
        
        # Sanitize and encrypt sensitive data
        encrypted_request_data = None
        if request_data:
            sanitized_request = logger._sanitize_request_data(request_data)
            encrypted_request_data = logger._encrypt_data(json.dumps(sanitized_request))
        
        encrypted_response_data = None
        if response_data:
            sanitized_response = logger._sanitize_response_data(response_data)
            encrypted_response_data = logger._encrypt_data(json.dumps(sanitized_response))
        
        encrypted_additional_data = None
        if additional_data:
            encrypted_additional_data = logger._encrypt_data(json.dumps(additional_data))
        
        # Create audit log entry
        audit_log = AuditLog(
            user_id=user_id,
            session_id=request.headers.get('X-Session-ID') if request else None,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            user_agent=user_agent,
            request_method=request.method if request else None,
            request_url=request.url if request else None,
            request_data=encrypted_request_data,
            response_status=response_status,
            response_data=encrypted_response_data,
            additional_data=encrypted_additional_data,
            risk_score=risk_score,
            is_suspicious=is_suspicious,
            correlation_id=correlation_id
        )
        
        try:
            db.session.add(audit_log)
            db.session.commit()
        except Exception as e:
            # Critical: Audit logging failure should be handled gracefully
            # but not fail the main operation
            print(f"Audit logging failed: {str(e)}")
            db.session.rollback()
    
    def _sanitize_request_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize request data to remove sensitive information"""
        sensitive_fields = {
            'password', 'pin', 'cvv', 'card_number', 'account_number',
            'ssn', 'social_security_number', 'tax_id', 'passport_number'
        }
        
        sanitized = {}
        for key, value in data.items():
            if key.lower() in sensitive_fields:
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_request_data(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    self._sanitize_request_data(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                sanitized[key] = value
        
        return sanitized
    
    def _sanitize_response_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize response data to remove sensitive information"""
        # Similar to request sanitization but may have different rules
        return self._sanitize_request_data(data)
    
    @staticmethod
    def log_authentication_event(
        user_id: Optional[str],
        action: str,
        success: bool,
        failure_reason: Optional[str] = None,
        additional_context: Optional[Dict[str, Any]] = None
    ):
        """Log authentication-specific events"""
        risk_score = 0
        is_suspicious = False
        
        # Calculate risk score for authentication events
        if not success:
            risk_score = 30
            if failure_reason in ['invalid_credentials', 'account_locked']:
                risk_score = 50
            elif failure_reason in ['brute_force_detected', 'suspicious_location']:
                risk_score = 80
                is_suspicious = True
        
        AuditLogger.log_event(
            user_id=user_id,
            action=f"auth_{action}",
            resource_type="authentication",
            additional_data={
                'success': success,
                'failure_reason': failure_reason,
                **(additional_context or {})
            },
            risk_score=risk_score,
            is_suspicious=is_suspicious
        )
    
    @staticmethod
    def log_financial_transaction(
        user_id: str,
        transaction_id: str,
        transaction_type: str,
        amount: str,
        currency: str,
        status: str,
        additional_context: Optional[Dict[str, Any]] = None
    ):
        """Log financial transaction events"""
        risk_score = 0
        is_suspicious = False
        
        # Calculate risk score for financial transactions
        try:
            amount_float = float(amount)
            if amount_float > 10000:  # Large transaction
                risk_score = 40
            elif amount_float > 50000:  # Very large transaction
                risk_score = 70
                is_suspicious = True
        except ValueError:
            risk_score = 20  # Invalid amount format
        
        if status == 'failed':
            risk_score += 20
        
        AuditLogger.log_event(
            user_id=user_id,
            action=f"transaction_{transaction_type}",
            resource_type="financial_transaction",
            resource_id=transaction_id,
            additional_data={
                'amount': amount,
                'currency': currency,
                'status': status,
                **(additional_context or {})
            },
            risk_score=risk_score,
            is_suspicious=is_suspicious
        )
    
    @staticmethod
    def log_data_access(
        user_id: str,
        resource_type: str,
        resource_id: str,
        action: str,
        data_classification: str = "internal",
        additional_context: Optional[Dict[str, Any]] = None
    ):
        """Log data access events for compliance"""
        risk_score = 0
        is_suspicious = False
        
        # Calculate risk score based on data classification
        if data_classification == "confidential":
            risk_score = 30
        elif data_classification == "restricted":
            risk_score = 50
        elif data_classification == "top_secret":
            risk_score = 70
            is_suspicious = True
        
        AuditLogger.log_event(
            user_id=user_id,
            action=f"data_{action}",
            resource_type=resource_type,
            resource_id=resource_id,
            additional_data={
                'data_classification': data_classification,
                **(additional_context or {})
            },
            risk_score=risk_score,
            is_suspicious=is_suspicious
        )
    
    @staticmethod
    def get_audit_trail(
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        suspicious_only: bool = False,
        limit: int = 100
    ) -> list:
        """Retrieve audit trail with filtering"""
        from src.models.database import db
        
        query = db.session.query(AuditLog)
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        if resource_type:
            query = query.filter(AuditLog.resource_type == resource_type)
        
        if start_date:
            query = query.filter(AuditLog.timestamp >= start_date)
        
        if end_date:
            query = query.filter(AuditLog.timestamp <= end_date)
        
        if suspicious_only:
            query = query.filter(AuditLog.is_suspicious == True)
        
        query = query.order_by(AuditLog.timestamp.desc()).limit(limit)
        
        return query.all()
    
    @staticmethod
    def verify_audit_integrity(audit_log_id: int) -> bool:
        """Verify the integrity of a specific audit log entry"""
        from src.models.database import db
        
        audit_log = db.session.query(AuditLog).get(audit_log_id)
        if not audit_log:
            return False
        
        return audit_log.verify_integrity()


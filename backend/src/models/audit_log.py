"""
Audit log model for comprehensive activity tracking and compliance
"""
import uuid
import json
from datetime import datetime, timezone, timedelta
from enum import Enum as PyEnum
from sqlalchemy import Column, String, DateTime, Text, Boolean, Integer, Index, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base, db # Import Base and db from the local database setup

class AuditEventType(PyEnum):
    """Types of audit events"""
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_REGISTRATION = "user_registration"
    PASSWORD_CHANGE = "password_change"
    ACCOUNT_CREATION = "account_creation"
    ACCOUNT_MODIFICATION = "account_modification"
    TRANSACTION_CREATED = "transaction_created"
    TRANSACTION_MODIFIED = "transaction_modified"
    CARD_CREATED = "card_created"
    CARD_BLOCKED = "card_blocked"
    CARD_UNBLOCKED = "card_unblocked"
    PERMISSION_CHANGE = "permission_change"
    DATA_ACCESS = "data_access"
    DATA_EXPORT = "data_export"
    SECURITY_ALERT = "security_alert"
    COMPLIANCE_CHECK = "compliance_check"
    SYSTEM_ERROR = "system_error"
    API_REQUEST = "api_request"
    ADMIN_ACTION = "admin_action"

class AuditSeverity(PyEnum):
    """Severity levels for audit events"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AuditLog(Base):
    """Comprehensive audit logging for compliance and security monitoring"""
    
    __tablename__ = 'audit_logs'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Event identification
    event_type = Column(db.Enum(AuditEventType), nullable=False, index=True)
    severity = Column(db.Enum(AuditSeverity), default=AuditSeverity.LOW, nullable=False)
    
    # Event details
    description = Column(String(500), nullable=False)
    details = Column(Text)  # JSON string with additional details
    
    # User and session information
    user_id = Column(String(36), ForeignKey('users.id'), nullable=True)
    session_id = Column(String(255))
    
    # Request information
    endpoint = Column(String(200))
    method = Column(String(10))
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(String(500))
    
    # Resource information
    resource_type = Column(String(100))  # account, transaction, card, etc.
    resource_id = Column(String(100))
    
    # Status and outcome
    status_code = Column(Integer)
    success = Column(Boolean, default=True)
    error_message = Column(String(500))
    
    # Compliance and retention
    retention_period_days = Column(Integer, default=2555)  # 7 years default
    is_pii_related = Column(Boolean, default=False)
    is_financial_data = Column(Boolean, default=False)
    
    # Geolocation (if available)
    country_code = Column(String(2))
    region = Column(String(100))
    city = Column(String(100))
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    
    # Indexes
    __table_args__ = (
        Index('idx_audit_event_type', 'event_type'),
        Index('idx_audit_user_id', 'user_id'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_created_at', 'created_at'),
    )

    def set_details(self, details_dict):
        """Set details as JSON string"""
        if details_dict:
            self.details = json.dumps(details_dict, default=str)
    
    def get_details(self):
        """Get details as dictionary"""
        if self.details:
            try:
                return json.loads(self.details)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def is_expired(self):
        """Check if audit log has exceeded retention period"""
        expiry_date = self.created_at + timedelta(days=self.retention_period_days)
        return datetime.now(timezone.utc) > expiry_date
    
    def to_dict(self):
        """Convert audit log to dictionary for API responses"""
        return {
            'id': self.id,
            'event_type': self.event_type.value,
            'severity': self.severity.value,
            'description': self.description,
            'details': self.get_details(),
            'user_id': self.user_id,
            'endpoint': self.endpoint,
            'method': self.method,
            'ip_address': self.ip_address,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'status_code': self.status_code,
            'success': self.success,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat(),
        }
    
    def __repr__(self):
        return f'<AuditLog {self.event_type.value}: {self.description}>'

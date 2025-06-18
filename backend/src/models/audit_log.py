"""
Audit log model for comprehensive activity tracking and compliance
"""

from src.models.database import db, TimestampMixin, UUIDMixin
from datetime import datetime, timezone
from enum import Enum
import json

class AuditEventType(Enum):
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

class AuditSeverity(Enum):
    """Severity levels for audit events"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AuditLog(db.Model, TimestampMixin, UUIDMixin):
    """Comprehensive audit logging for compliance and security monitoring"""
    
    __tablename__ = 'audit_logs'
    
    # Event identification
    event_type = db.Column(db.Enum(AuditEventType), nullable=False, index=True)
    severity = db.Column(db.Enum(AuditSeverity), default=AuditSeverity.LOW, nullable=False)
    
    # Event details
    description = db.Column(db.String(500), nullable=False)
    details = db.Column(db.Text)  # JSON string with additional details
    
    # User and session information
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=True)
    session_id = db.Column(db.String(255))
    
    # Request information
    endpoint = db.Column(db.String(200))
    method = db.Column(db.String(10))
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    user_agent = db.Column(db.String(500))
    
    # Resource information
    resource_type = db.Column(db.String(100))  # account, transaction, card, etc.
    resource_id = db.Column(db.String(100))
    
    # Status and outcome
    status_code = db.Column(db.Integer)
    success = db.Column(db.Boolean, default=True)
    error_message = db.Column(db.String(500))
    
    # Compliance and retention
    retention_period_days = db.Column(db.Integer, default=2555)  # 7 years default
    is_pii_related = db.Column(db.Boolean, default=False)
    is_financial_data = db.Column(db.Boolean, default=False)
    
    # Geolocation (if available)
    country_code = db.Column(db.String(2))
    region = db.Column(db.String(100))
    city = db.Column(db.String(100))
    
    def __init__(self, **kwargs):
        super(AuditLog, self).__init__(**kwargs)
        
        # Set retention period based on event type
        if self.event_type in [AuditEventType.TRANSACTION_CREATED, AuditEventType.TRANSACTION_MODIFIED]:
            self.retention_period_days = 2555  # 7 years for financial records
            self.is_financial_data = True
        elif self.event_type in [AuditEventType.USER_REGISTRATION, AuditEventType.DATA_ACCESS]:
            self.is_pii_related = True
    
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
        from datetime import timedelta
        expiry_date = self.created_at + timedelta(days=self.retention_period_days)
        return datetime.now(timezone.utc) > expiry_date
    
    @staticmethod
    def log_event(event_type, description, user_id=None, details=None, severity=AuditSeverity.LOW, **kwargs):
        """Create a new audit log entry"""
        audit_log = AuditLog(
            event_type=event_type,
            description=description,
            user_id=user_id,
            severity=severity,
            **kwargs
        )
        
        if details:
            audit_log.set_details(details)
        
        db.session.add(audit_log)
        db.session.commit()
        
        return audit_log
    
    @staticmethod
    def log_user_action(user_id, action, resource_type=None, resource_id=None, details=None):
        """Log a user action"""
        return AuditLog.log_event(
            event_type=AuditEventType.DATA_ACCESS,
            description=f"User performed action: {action}",
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            severity=AuditSeverity.LOW
        )
    
    @staticmethod
    def log_security_event(description, user_id=None, severity=AuditSeverity.HIGH, details=None):
        """Log a security-related event"""
        return AuditLog.log_event(
            event_type=AuditEventType.SECURITY_ALERT,
            description=description,
            user_id=user_id,
            severity=severity,
            details=details
        )
    
    @staticmethod
    def log_transaction_event(transaction_id, action, user_id=None, details=None):
        """Log a transaction-related event"""
        return AuditLog.log_event(
            event_type=AuditEventType.TRANSACTION_CREATED if action == 'created' else AuditEventType.TRANSACTION_MODIFIED,
            description=f"Transaction {action}",
            user_id=user_id,
            resource_type='transaction',
            resource_id=str(transaction_id),
            details=details,
            severity=AuditSeverity.MEDIUM
        )
    
    @staticmethod
    def log_api_request(endpoint, method, user_id=None, ip_address=None, user_agent=None, status_code=None, success=True):
        """Log an API request"""
        return AuditLog.log_event(
            event_type=AuditEventType.API_REQUEST,
            description=f"{method} {endpoint}",
            user_id=user_id,
            endpoint=endpoint,
            method=method,
            ip_address=ip_address,
            user_agent=user_agent,
            status_code=status_code,
            success=success,
            severity=AuditSeverity.LOW
        )
    
    def to_dict(self):
        """Convert audit log to dictionary for API responses"""
        return {
            'id': str(self.id),
            'event_type': self.event_type.value,
            'severity': self.severity.value,
            'description': self.description,
            'details': self.get_details(),
            'user_id': str(self.user_id) if self.user_id else None,
            'endpoint': self.endpoint,
            'method': self.method,
            'ip_address': self.ip_address,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'status_code': self.status_code,
            'success': self.success,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat(),
            'country_code': self.country_code,
            'region': self.region,
            'city': self.city
        }
    
    def __repr__(self):
        return f'<AuditLog {self.event_type.value}: {self.description}>'


"""
Comprehensive Audit Logging System for Financial Compliance
"""

import json
import logging
import os
import uuid
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional

from sqlalchemy import (Boolean, Column, DateTime, Integer, String, Text,
                        create_engine)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configure logging
logger = logging.getLogger(__name__)

Base = declarative_base()


class EventType(Enum):
    """Audit event types"""

    # Authentication events
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_REGISTRATION = "user_registration"
    PASSWORD_CHANGE = "password_change"
    TWO_FACTOR_ENABLED = "two_factor_enabled"
    TWO_FACTOR_DISABLED = "two_factor_disabled"
    AUTHENTICATION_FAILED = "authentication_failed"

    # User management events
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_ACTIVATED = "user_activated"
    USER_DEACTIVATED = "user_deactivated"
    EMAIL_VERIFIED = "email_verified"
    PHONE_VERIFIED = "phone_verified"

    # Account events
    ACCOUNT_CREATED = "account_created"
    ACCOUNT_UPDATED = "account_updated"
    ACCOUNT_CLOSED = "account_closed"
    ACCOUNT_FROZEN = "account_frozen"
    ACCOUNT_UNFROZEN = "account_unfrozen"

    # Transaction events
    TRANSACTION_CREATED = "transaction_created"
    TRANSACTION_APPROVED = "transaction_approved"
    TRANSACTION_REJECTED = "transaction_rejected"
    TRANSACTION_CANCELLED = "transaction_cancelled"
    TRANSFER_INITIATED = "transfer_initiated"
    TRANSFER_COMPLETED = "transfer_completed"
    TRANSFER_FAILED = "transfer_failed"

    # Card events
    CARD_ISSUED = "card_issued"
    CARD_ACTIVATED = "card_activated"
    CARD_FROZEN = "card_frozen"
    CARD_UNFROZEN = "card_unfrozen"
    CARD_CANCELLED = "card_cancelled"
    CARD_PIN_CHANGED = "card_pin_changed"
    CARD_LIMITS_UPDATED = "card_limits_updated"
    CARD_CONTROLS_UPDATED = "card_controls_updated"

    # Compliance events
    KYC_VERIFICATION_STARTED = "kyc_verification_started"
    KYC_DOCUMENT_SUBMITTED = "kyc_document_submitted"
    KYC_VERIFICATION_COMPLETED = "kyc_verification_completed"
    AML_SCREENING_PERFORMED = "aml_screening_performed"
    SUSPICIOUS_ACTIVITY_REPORTED = "suspicious_activity_reported"

    # Security events
    UNAUTHORIZED_ACCESS_ATTEMPT = "unauthorized_access_attempt"
    UNAUTHORIZED_CARD_ACCESS = "unauthorized_card_access"
    UNAUTHORIZED_COMPLIANCE_ACCESS = "unauthorized_compliance_access"
    PIN_VERIFICATION_FAILED = "pin_verification_failed"
    TOKEN_BLACKLISTED = "token_blacklisted"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    FRAUD_DETECTED = "fraud_detected"

    # Administrative events
    ADMIN_LOGIN = "admin_login"
    ADMIN_ACTION = "admin_action"
    SYSTEM_CONFIGURATION_CHANGED = "system_configuration_changed"
    BACKUP_CREATED = "backup_created"
    BACKUP_RESTORED = "backup_restored"


class EventSeverity(Enum):
    """Event severity levels"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class AuditEvent:
    """Audit event data structure"""

    event_id: str
    event_type: EventType
    severity: EventSeverity
    timestamp: datetime
    user_id: Optional[str]
    session_id: Optional[str]
    ip_address: Optional[str]
    user_agent: Optional[str]
    resource_type: Optional[str]
    resource_id: Optional[str]
    details: Dict[str, Any]
    outcome: str  # success, failure, pending
    error_message: Optional[str]
    compliance_relevant: bool


class AuditLogRecord(Base):
    """SQLAlchemy model for audit log records"""

    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True)
    event_type = Column(String(100), nullable=False, index=True)
    severity = Column(String(20), nullable=False, index=True)
    timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    user_id = Column(String(36), index=True)
    session_id = Column(String(100), index=True)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    resource_type = Column(String(50), index=True)
    resource_id = Column(String(36), index=True)
    details = Column(Text)  # JSON string
    outcome = Column(String(20), nullable=False, index=True)
    error_message = Column(Text)
    compliance_relevant = Column(Boolean, default=False, index=True)


class AuditLogger:
    """Comprehensive audit logging system"""

    def __init__(self, database_url: Optional[str] = None):
        self.database_url = database_url or os.environ.get(
            "AUDIT_DATABASE_URL", "sqlite:///:memory:"
        )
        self.engine = create_engine(self.database_url)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)

        # Configure file logging as backup
        self.file_logger = self._setup_file_logger()

        # Event severity mapping
        self.severity_mapping = {
            # Authentication events
            EventType.USER_LOGIN: EventSeverity.LOW,
            EventType.USER_LOGOUT: EventSeverity.LOW,
            EventType.USER_REGISTRATION: EventSeverity.MEDIUM,
            EventType.PASSWORD_CHANGE: EventSeverity.MEDIUM,
            EventType.TWO_FACTOR_ENABLED: EventSeverity.MEDIUM,
            EventType.TWO_FACTOR_DISABLED: EventSeverity.HIGH,
            EventType.AUTHENTICATION_FAILED: EventSeverity.MEDIUM,
            # Security events
            EventType.UNAUTHORIZED_ACCESS_ATTEMPT: EventSeverity.HIGH,
            EventType.UNAUTHORIZED_CARD_ACCESS: EventSeverity.HIGH,
            EventType.UNAUTHORIZED_COMPLIANCE_ACCESS: EventSeverity.CRITICAL,
            EventType.PIN_VERIFICATION_FAILED: EventSeverity.MEDIUM,
            EventType.FRAUD_DETECTED: EventSeverity.CRITICAL,
            # Compliance events
            EventType.KYC_VERIFICATION_STARTED: EventSeverity.MEDIUM,
            EventType.KYC_VERIFICATION_COMPLETED: EventSeverity.MEDIUM,
            EventType.AML_SCREENING_PERFORMED: EventSeverity.MEDIUM,
            EventType.SUSPICIOUS_ACTIVITY_REPORTED: EventSeverity.CRITICAL,
            # Transaction events
            EventType.TRANSACTION_CREATED: EventSeverity.LOW,
            EventType.TRANSFER_COMPLETED: EventSeverity.LOW,
            EventType.TRANSFER_FAILED: EventSeverity.MEDIUM,
            # Default
            "default": EventSeverity.LOW,
        }

    def _setup_file_logger(self) -> logging.Logger:
        """Setup file logger as backup"""
        file_logger = logging.getLogger("audit_file_logger")
        file_logger.setLevel(logging.INFO)

        # Create logs directory if it doesn't exist
        os.makedirs("logs", exist_ok=True)

        # Create file handler with rotation
        from logging.handlers import RotatingFileHandler

        handler = RotatingFileHandler(
            "logs/audit.log", maxBytes=50 * 1024 * 1024, backupCount=10  # 50MB
        )

        # Create formatter
        formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        handler.setFormatter(formatter)
        file_logger.addHandler(handler)

        return file_logger

    def log_event(self, event: AuditEvent):
        """Log audit event to database and file"""
        try:
            # Log to database
            with self.Session() as session:
                record = AuditLogRecord(
                    id=event.event_id,
                    event_type=event.event_type.value,
                    severity=event.severity.value,
                    timestamp=event.timestamp,
                    user_id=event.user_id,
                    session_id=event.session_id,
                    ip_address=event.ip_address,
                    user_agent=event.user_agent,
                    resource_type=event.resource_type,
                    resource_id=event.resource_id,
                    details=json.dumps(event.details, default=str),
                    outcome=event.outcome,
                    error_message=event.error_message,
                    compliance_relevant=event.compliance_relevant,
                )
                session.add(record)
                session.commit()

            # Log to file as backup
            log_message = json.dumps(asdict(event), default=str)
            if event.severity in [EventSeverity.HIGH, EventSeverity.CRITICAL]:
                self.file_logger.error(log_message)
            elif event.severity == EventSeverity.MEDIUM:
                self.file_logger.warning(log_message)
            else:
                self.file_logger.info(log_message)

        except Exception as e:
            # Fallback to file logging only
            logger.error(f"Failed to log audit event to database: {str(e)}")
            self.file_logger.error(
                f"AUDIT_DB_ERROR: {json.dumps(asdict(event), default=str)}"
            )

    def log_user_event(
        self,
        user_id: str,
        event_type: EventType,
        details: Dict[str, Any] = None,
        outcome: str = "success",
        error_message: str = None,
        session_id: str = None,
        ip_address: str = None,
        user_agent: str = None,
    ):
        """Log user-related event"""
        event = AuditEvent(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            severity=self.severity_mapping.get(event_type, EventSeverity.LOW),
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            resource_type="user",
            resource_id=user_id,
            details=details or {},
            outcome=outcome,
            error_message=error_message,
            compliance_relevant=self._is_compliance_relevant(event_type),
        )
        self.log_event(event)

    def log_security_event(
        self,
        event_type: EventType,
        details: Dict[str, Any] = None,
        user_id: str = None,
        session_id: str = None,
        ip_address: str = None,
        user_agent: str = None,
        outcome: str = "failure",
        error_message: str = None,
    ):
        """Log security-related event"""
        event = AuditEvent(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            severity=self.severity_mapping.get(event_type, EventSeverity.HIGH),
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=user_agent,
            resource_type="security",
            resource_id=None,
            details=details or {},
            outcome=outcome,
            error_message=error_message,
            compliance_relevant=True,
        )
        self.log_event(event)

    def log_compliance_event(
        self,
        user_id: str,
        event_type: EventType,
        details: Dict[str, Any] = None,
        outcome: str = "success",
        error_message: str = None,
        session_id: str = None,
        ip_address: str = None,
    ):
        """Log compliance-related event"""
        event = AuditEvent(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            severity=self.severity_mapping.get(event_type, EventSeverity.MEDIUM),
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=None,
            resource_type="compliance",
            resource_id=user_id,
            details=details or {},
            outcome=outcome,
            error_message=error_message,
            compliance_relevant=True,
        )
        self.log_event(event)

    def log_transaction_event(
        self,
        user_id: str,
        transaction_id: str,
        event_type: EventType,
        details: Dict[str, Any] = None,
        outcome: str = "success",
        error_message: str = None,
        session_id: str = None,
        ip_address: str = None,
    ):
        """Log transaction-related event"""
        event = AuditEvent(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            severity=self.severity_mapping.get(event_type, EventSeverity.LOW),
            timestamp=datetime.now(timezone.utc),
            user_id=user_id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=None,
            resource_type="transaction",
            resource_id=transaction_id,
            details=details or {},
            outcome=outcome,
            error_message=error_message,
            compliance_relevant=self._is_compliance_relevant(event_type),
        )
        self.log_event(event)

    def log_admin_event(
        self,
        admin_user_id: str,
        event_type: EventType,
        details: Dict[str, Any] = None,
        target_user_id: str = None,
        outcome: str = "success",
        error_message: str = None,
        session_id: str = None,
        ip_address: str = None,
    ):
        """Log administrative event"""
        event_details = details or {}
        if target_user_id:
            event_details["target_user_id"] = target_user_id

        event = AuditEvent(
            event_id=str(uuid.uuid4()),
            event_type=event_type,
            severity=EventSeverity.HIGH,
            timestamp=datetime.now(timezone.utc),
            user_id=admin_user_id,
            session_id=session_id,
            ip_address=ip_address,
            user_agent=None,
            resource_type="admin",
            resource_id=target_user_id or admin_user_id,
            details=event_details,
            outcome=outcome,
            error_message=error_message,
            compliance_relevant=True,
        )
        self.log_event(event)

    def _is_compliance_relevant(self, event_type: EventType) -> bool:
        """Determine if event is compliance-relevant"""
        compliance_events = {
            EventType.USER_REGISTRATION,
            EventType.KYC_VERIFICATION_STARTED,
            EventType.KYC_DOCUMENT_SUBMITTED,
            EventType.KYC_VERIFICATION_COMPLETED,
            EventType.AML_SCREENING_PERFORMED,
            EventType.SUSPICIOUS_ACTIVITY_REPORTED,
            EventType.TRANSACTION_CREATED,
            EventType.TRANSFER_INITIATED,
            EventType.TRANSFER_COMPLETED,
            EventType.CARD_ISSUED,
            EventType.UNAUTHORIZED_ACCESS_ATTEMPT,
            EventType.FRAUD_DETECTED,
            EventType.ADMIN_ACTION,
        }
        return event_type in compliance_events

    def get_user_audit_trail(
        self,
        user_id: str,
        limit: int = 100,
        event_types: List[EventType] = None,
        start_date: datetime = None,
        end_date: datetime = None,
    ) -> List[Dict[str, Any]]:
        """Get audit trail for a specific user"""
        session = self.Session()
        try:
            query = session.query(AuditLogRecord).filter(
                AuditLogRecord.user_id == user_id
            )

            if event_types:
                event_type_values = [et.value for et in event_types]
                query = query.filter(AuditLogRecord.event_type.in_(event_type_values))

            if start_date:
                query = query.filter(AuditLogRecord.timestamp >= start_date)

            if end_date:
                query = query.filter(AuditLogRecord.timestamp <= end_date)

            records = query.order_by(AuditLogRecord.timestamp.desc()).limit(limit).all()

            return [self._record_to_dict(record) for record in records]
        finally:
            session.close()

    def get_security_events(
        self,
        limit: int = 100,
        severity: EventSeverity = None,
        start_date: datetime = None,
        end_date: datetime = None,
    ) -> List[Dict[str, Any]]:
        """Get security events"""
        session = self.Session()
        try:
            query = session.query(AuditLogRecord).filter(
                AuditLogRecord.resource_type == "security"
            )

            if severity:
                query = query.filter(AuditLogRecord.severity == severity.value)

            if start_date:
                query = query.filter(AuditLogRecord.timestamp >= start_date)

            if end_date:
                query = query.filter(AuditLogRecord.timestamp <= end_date)

            records = query.order_by(AuditLogRecord.timestamp.desc()).limit(limit).all()

            return [self._record_to_dict(record) for record in records]
        finally:
            session.close()

    def get_compliance_events(
        self, limit: int = 100, start_date: datetime = None, end_date: datetime = None
    ) -> List[Dict[str, Any]]:
        """Get compliance-relevant events"""
        session = self.Session()
        try:
            query = session.query(AuditLogRecord).filter(
                AuditLogRecord.compliance_relevant == True
            )

            if start_date:
                query = query.filter(AuditLogRecord.timestamp >= start_date)

            if end_date:
                query = query.filter(AuditLogRecord.timestamp <= end_date)

            records = query.order_by(AuditLogRecord.timestamp.desc()).limit(limit).all()

            return [self._record_to_dict(record) for record in records]
        finally:
            session.close()

    def get_user_security_events(
        self, user_id: str, limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get security events for a specific user"""
        session = self.Session()
        try:
            query = session.query(AuditLogRecord).filter(
                AuditLogRecord.user_id == user_id,
                AuditLogRecord.severity.in_(
                    [
                        EventSeverity.MEDIUM.value,
                        EventSeverity.HIGH.value,
                        EventSeverity.CRITICAL.value,
                    ]
                ),
            )

            records = query.order_by(AuditLogRecord.timestamp.desc()).limit(limit).all()

            return [self._record_to_dict(record) for record in records]
        finally:
            session.close()

    def get_failed_login_attempts(
        self, ip_address: str = None, user_id: str = None, time_window_hours: int = 24
    ) -> List[Dict[str, Any]]:
        """Get failed login attempts within time window"""
        session = self.Session()
        try:
            start_time = datetime.now(timezone.utc) - timezone.timedelta(
                hours=time_window_hours
            )

            query = session.query(AuditLogRecord).filter(
                AuditLogRecord.event_type == EventType.AUTHENTICATION_FAILED.value,
                AuditLogRecord.timestamp >= start_time,
            )

            if ip_address:
                query = query.filter(AuditLogRecord.ip_address == ip_address)

            if user_id:
                query = query.filter(AuditLogRecord.user_id == user_id)

            records = query.order_by(AuditLogRecord.timestamp.desc()).all()

            return [self._record_to_dict(record) for record in records]
        finally:
            session.close()

    def _record_to_dict(self, record: AuditLogRecord) -> Dict[str, Any]:
        """Convert audit log record to dictionary"""
        return {
            "id": record.id,
            "event_type": record.event_type,
            "severity": record.severity,
            "timestamp": record.timestamp.isoformat(),
            "user_id": record.user_id,
            "session_id": record.session_id,
            "ip_address": record.ip_address,
            "user_agent": record.user_agent,
            "resource_type": record.resource_type,
            "resource_id": record.resource_id,
            "details": json.loads(record.details) if record.details else {},
            "outcome": record.outcome,
            "error_message": record.error_message,
            "compliance_relevant": record.compliance_relevant,
        }

    def generate_compliance_report(
        self, start_date: datetime, end_date: datetime, user_id: str = None
    ) -> Dict[str, Any]:
        """Generate compliance report for a date range"""
        session = self.Session()
        try:
            query = session.query(AuditLogRecord).filter(
                AuditLogRecord.compliance_relevant == True,
                AuditLogRecord.timestamp >= start_date,
                AuditLogRecord.timestamp <= end_date,
            )

            if user_id:
                query = query.filter(AuditLogRecord.user_id == user_id)

            records = query.all()

            # Aggregate statistics
            event_counts = {}
            severity_counts = {}
            outcome_counts = {}

            for record in records:
                # Count by event type
                event_counts[record.event_type] = (
                    event_counts.get(record.event_type, 0) + 1
                )

                # Count by severity
                severity_counts[record.severity] = (
                    severity_counts.get(record.severity, 0) + 1
                )

                # Count by outcome
                outcome_counts[record.outcome] = (
                    outcome_counts.get(record.outcome, 0) + 1
                )

            return {
                "report_period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                },
                "total_events": len(records),
                "event_type_breakdown": event_counts,
                "severity_breakdown": severity_counts,
                "outcome_breakdown": outcome_counts,
                "events": [self._record_to_dict(record) for record in records],
            }
        finally:
            session.close()


# Global audit logger instance
audit_logger = AuditLogger()

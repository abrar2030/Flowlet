"""
Audit Log model for tracking system and user actions
"""

import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Text,
    Enum,
    Integer,
    ForeignKey,
    Boolean,
)
from sqlalchemy.orm import relationship
from app import db
from .mixins import UUID


class AuditAction(enum.Enum):
    """Types of actions to be logged"""

    LOGIN = "login"
    LOGOUT = "logout"
    CREATE_USER = "create_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"
    CREATE_ACCOUNT = "create_account"
    UPDATE_ACCOUNT = "update_account"
    DELETE_ACCOUNT = "delete_account"
    TRANSACTION = "transaction"
    PASSWORD_CHANGE = "password_change"
    MFA_CHANGE = "mfa_change"
    SYSTEM_CONFIG_CHANGE = "system_config_change"
    DATA_ACCESS = "data_access"
    KYC_UPDATE = "kyc_update"


class AuditLog(db.Model):
    """Audit Log model with detailed tracking of system events"""

    __tablename__ = "audit_logs"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Action details
    action = Column(Enum(AuditAction), nullable=False)
    timestamp = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Actor information
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True
    )
    user_email = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)

    # Target information
    target_type = Column(
        String(50), nullable=False
    )  # e.g., 'User', 'Account', 'Transaction'
    target_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    # Event details
    details = Column(Text, nullable=True)  # JSON string of changes or event data
    status = Column(String(20), nullable=False, default="success")  # success, failure

    # Security and compliance
    risk_level = Column(Integer, nullable=False, default=1)  # 1: Low, 5: Critical
    is_sensitive = Column(Boolean, nullable=False, default=False)

    # Relationships
    user = relationship("User", backref="audit_logs")

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses"""
        return {
            "id": str(self.id),
            "action": self.action.value,
            "timestamp": self.timestamp.isoformat(),
            "user_id": str(self.user_id) if self.user_id else None,
            "user_email": self.user_email,
            "ip_address": self.ip_address,
            "target_type": self.target_type,
            "target_id": str(self.target_id) if self.target_id else None,
            "details": self.details,
            "status": self.status,
            "risk_level": self.risk_level,
            "is_sensitive": self.is_sensitive,
        }

    def __repr__(self):
        return f'<AuditLog {self.action.value} by {self.user_email or "System"} at {self.timestamp}>'

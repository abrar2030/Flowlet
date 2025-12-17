from typing import Any
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from .database import Base, db


class SecurityEventType(PyEnum):
    """Types of security events"""

    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILURE = "login_failure"
    PASSWORD_RESET = "password_reset"
    ACCOUNT_LOCK = "account_lock"
    ACCOUNT_UNLOCK = "account_unlock"
    MFA_ATTEMPT = "mfa_attempt"
    MFA_BYPASS = "mfa_bypass"
    IP_CHANGE = "ip_change"
    UNUSUAL_ACTIVITY = "unusual_activity"
    DATA_BREACH_ATTEMPT = "data_breach_attempt"


class SecurityEvent(Base):
    """Security Event model with detailed tracking of security events"""

    __tablename__ = "security_events"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_type = Column(db.Enum(SecurityEventType), nullable=False)
    timestamp = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    user_email = Column(String(255), nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)
    details = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="success")
    risk_score = Column(Integer, nullable=False, default=0)
    is_alert = Column(db.Boolean, nullable=False, default=False)
    user = relationship("User", backref="security_events")

    def to_dict(self) -> dict:
        """Convert to dictionary for API responses"""
        return {
            "id": str(self.id),
            "event_type": self.event_type.value,
            "timestamp": self.timestamp.isoformat(),
            "user_id": str(self.user_id) if self.user_id else None,
            "user_email": self.user_email,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "details": self.details,
            "status": self.status,
            "risk_score": self.risk_score,
            "is_alert": self.is_alert,
        }

    def __repr__(self) -> Any:
        return f"<SecurityEvent {self.event_type.value} for {self.user_email or 'System'} at {self.timestamp}>"

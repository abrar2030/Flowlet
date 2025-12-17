"""Fraud Alert model"""

from typing import Any
from enum import Enum as PyEnum
from sqlalchemy import Column, String, DateTime, Text, ForeignKey
from .database import Base, db
import uuid
from datetime import datetime, timezone


class FraudAlertStatus(PyEnum):
    """Fraud alert status"""

    PENDING = "pending"
    INVESTIGATING = "investigating"
    CONFIRMED = "confirmed"
    FALSE_POSITIVE = "false_positive"
    RESOLVED = "resolved"


class FraudAlert(Base):
    """Fraud Alert model"""

    __tablename__ = "fraud_alerts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"))
    transaction_id = Column(String(36), nullable=True)
    alert_type = Column(String(50), nullable=False)
    status = Column(db.Enum(FraudAlertStatus), default=FraudAlertStatus.PENDING)
    description = Column(Text)
    risk_score = Column(db.Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def to_dict(self) -> Any:
        return {
            "id": self.id,
            "user_id": self.user_id,
            "transaction_id": self.transaction_id,
            "alert_type": self.alert_type,
            "status": self.status.value if self.status else None,
            "description": self.description,
            "risk_score": self.risk_score,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

"""API Key model"""

from typing import Any
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from .database import Base
import uuid
from datetime import datetime, timezone


class APIKey(Base):
    """API Key model for authentication"""

    __tablename__ = "api_keys"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"))
    key = Column(String(128), unique=True, nullable=False)
    name = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime)

    def to_dict(self) -> Any:
        return {
            "id": self.id,
            "name": self.name,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

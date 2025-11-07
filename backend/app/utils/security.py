"""
Security utility functions
"""

from app.models.security import SecurityEvent, SecurityEventType
from app import db
from datetime import datetime, timezone
from typing import Optional
import uuid

def log_security_event(
    event_type: SecurityEventType, 
    user_id: Optional[uuid.UUID] = None, 
    user_email: Optional[str] = None, 
    ip_address: Optional[str] = None, 
    user_agent: Optional[str] = None, 
    details: Optional[str] = None, 
    status: str = "success", 
    risk_score: int = 0, 
    is_alert: bool = False
) -> None:
    """Logs a security event to the database."""
    try:
        event = SecurityEvent(
            event_type=event_type,
            user_id=user_id,
            user_email=user_email,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details,
            status=status,
            risk_score=risk_score,
            is_alert=is_alert
        )
        db.session.add(event)
        db.session.commit()
    except Exception as e:
        # Log to console if database logging fails
        print(f"ERROR: Failed to log security event to database: {e}")

# Need to import uuid
import uuid

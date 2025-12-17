"""Audit logging utilities"""

from typing import Any
from src.models.audit_log import AuditLog, AuditEventType, AuditSeverity
from src.models import db


def log_audit_event(
    user_id: str,
    event_type: AuditEventType,
    severity: AuditSeverity,
    details: str,
    ip_address: str = None,
) -> Any:
    """Log an audit event"""
    audit_log = AuditLog(
        user_id=user_id,
        event_type=event_type,
        severity=severity,
        description=details,
        ip_address=ip_address,
    )
    db.session.add(audit_log)
    db.session.commit()
    return audit_log

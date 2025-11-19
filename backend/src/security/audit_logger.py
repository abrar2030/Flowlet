"""
Audit Logging Service for Flowlet Financial Backend
This service provides functions to log events to the database using the AuditLog model.
"""
import json
import logging
import os
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.exc import SQLAlchemyError

# Import the model and database instance
from ..models.database import db
from ..models.audit_log import AuditLog, AuditEventType, AuditSeverity

# Configure logging
logger = logging.getLogger(__name__)

class AuditLogger:
    """Service class for logging audit events."""
    
    def __init__(self, app=None):
        # The logger can be initialized without an app, but logging to DB requires app context
        self.app = app

    def _log_to_db(self, audit_log_instance: AuditLog):
        """Internal function to commit the AuditLog instance to the database."""
        if not self.app:
            logger.warning("AuditLogger not initialized with Flask app. Logging only to console.")
            return

        with self.app.app_context():
            try:
                db.session.add(audit_log_instance)
                db.session.commit()
            except SQLAlchemyError as e:
                db.session.rollback()
                logger.error(f"Failed to log audit event to database: {e}")
            except Exception as e:
                db.session.rollback()
                logger.error(f"Unexpected error during audit logging: {e}")

    def log_event(self, 
                  event_type: AuditEventType, 
                  description: str, 
                  user_id: Optional[str] = None, 
                  severity: AuditSeverity = AuditSeverity.LOW, 
                  details: Optional[Dict[str, Any]] = None,
                  **kwargs):
        """
        Creates and logs a new audit event.
        
        :param event_type: The type of the event (from AuditEventType enum).
        :param description: A brief description of the event.
        :param user_id: The ID of the user who performed the action (if applicable).
        :param severity: The severity of the event (from AuditSeverity enum).
        :param details: A dictionary of additional details to store as JSON.
        :param kwargs: Additional fields for the AuditLog model (e.g., ip_address, endpoint).
        """
        
        audit_log = AuditLog(
            event_type=event_type,
            description=description,
            user_id=user_id,
            severity=severity,
            **kwargs
        )
        
        # Set details, which handles JSON serialization
        audit_log.set_details(details)
        
        # Log to console/file for immediate visibility
        log_message = f"AUDIT: [{severity.value.upper()}] {event_type.value} - {description}"
        if user_id:
            log_message += f" (User: {user_id})"
        logger.info(log_message)
        
        # Log to database
        self._log_to_db(audit_log)
        
        return audit_log

    def log_user_action(self, user_id: str, action: str, resource_type: Optional[str] = None, resource_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        """Log a user action."""
        return self.log_event(
            event_type=AuditEventType.DATA_ACCESS,
            description=f"User performed action: {action}",
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            severity=AuditSeverity.LOW
        )

    def log_security_event(self, description: str, user_id: Optional[str] = None, severity: AuditSeverity = AuditSeverity.HIGH, details: Optional[Dict[str, Any]] = None):
        """Log a security-related event."""
        return self.log_event(
            event_type=AuditEventType.SECURITY_ALERT,
            description=description,
            user_id=user_id,
            severity=severity,
            details=details
        )

    def log_transaction_event(self, transaction_id: str, action: str, user_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        """Log a transaction-related event."""
        event_type = AuditEventType.TRANSACTION_CREATED if action.lower() == 'created' else AuditEventType.TRANSACTION_MODIFIED
        return self.log_event(
            event_type=event_type,
            description=f"Transaction {action} for ID: {transaction_id}",
            user_id=user_id,
            resource_type='transaction',
            resource_id=transaction_id,
            details=details,
            severity=AuditSeverity.MEDIUM
        )

# Global instance of the logger (to be initialized with app later)
audit_logger = AuditLogger()

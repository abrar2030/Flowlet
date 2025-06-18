"""
Audit logger for comprehensive activity tracking
"""

from src.models.audit_log import AuditLog, AuditEventType, AuditSeverity
from src.models.database import db
from flask import request, g
from datetime import datetime, timezone
import json

class AuditLogger:
    """Centralized audit logging service"""
    
    def __init__(self, database):
        self.db = database
    
    def log_request(self, user_id=None, endpoint=None, method=None, ip_address=None, 
                   user_agent=None, request_data=None, status_code=None, success=True):
        """Log an API request"""
        try:
            audit_log = AuditLog(
                event_type=AuditEventType.API_REQUEST,
                description=f"{method or 'UNKNOWN'} {endpoint or 'unknown_endpoint'}",
                user_id=user_id,
                endpoint=endpoint,
                method=method,
                ip_address=ip_address,
                user_agent=user_agent,
                status_code=status_code,
                success=success,
                severity=AuditSeverity.LOW
            )
            
            if request_data:
                # Sanitize request data to remove sensitive information
                sanitized_data = self._sanitize_request_data(request_data)
                audit_log.set_details(sanitized_data)
            
            self.db.session.add(audit_log)
            self.db.session.commit()
            
        except Exception as e:
            # Don't let audit logging failures break the application
            print(f"Audit logging failed: {str(e)}")
    
    def log_user_action(self, user_id, action, resource_type=None, resource_id=None, 
                       details=None, severity=AuditSeverity.LOW):
        """Log a user action"""
        try:
            audit_log = AuditLog(
                event_type=AuditEventType.DATA_ACCESS,
                description=f"User action: {action}",
                user_id=user_id,
                resource_type=resource_type,
                resource_id=str(resource_id) if resource_id else None,
                severity=severity,
                ip_address=getattr(request, 'remote_addr', None) if request else None
            )
            
            if details:
                audit_log.set_details(details)
            
            self.db.session.add(audit_log)
            self.db.session.commit()
            
        except Exception as e:
            print(f"Audit logging failed: {str(e)}")
    
    def log_security_event(self, description, user_id=None, severity=AuditSeverity.HIGH, 
                          details=None, ip_address=None):
        """Log a security-related event"""
        try:
            audit_log = AuditLog(
                event_type=AuditEventType.SECURITY_ALERT,
                description=description,
                user_id=user_id,
                severity=severity,
                ip_address=ip_address or (getattr(request, 'remote_addr', None) if request else None)
            )
            
            if details:
                audit_log.set_details(details)
            
            self.db.session.add(audit_log)
            self.db.session.commit()
            
        except Exception as e:
            print(f"Security audit logging failed: {str(e)}")
    
    def log_transaction_event(self, transaction_id, action, user_id=None, details=None):
        """Log a transaction-related event"""
        try:
            event_type = AuditEventType.TRANSACTION_CREATED if action == 'created' else AuditEventType.TRANSACTION_MODIFIED
            
            audit_log = AuditLog(
                event_type=event_type,
                description=f"Transaction {action}",
                user_id=user_id,
                resource_type='transaction',
                resource_id=str(transaction_id),
                severity=AuditSeverity.MEDIUM,
                is_financial_data=True
            )
            
            if details:
                audit_log.set_details(details)
            
            self.db.session.add(audit_log)
            self.db.session.commit()
            
        except Exception as e:
            print(f"Transaction audit logging failed: {str(e)}")
    
    def log_login_attempt(self, user_id=None, email=None, success=True, ip_address=None, 
                         user_agent=None, failure_reason=None):
        """Log a login attempt"""
        try:
            event_type = AuditEventType.USER_LOGIN if success else AuditEventType.SECURITY_ALERT
            description = "Successful login" if success else f"Failed login attempt: {failure_reason}"
            severity = AuditSeverity.LOW if success else AuditSeverity.MEDIUM
            
            audit_log = AuditLog(
                event_type=event_type,
                description=description,
                user_id=user_id,
                severity=severity,
                ip_address=ip_address,
                user_agent=user_agent,
                success=success
            )
            
            details = {'email': email} if email else {}
            if failure_reason:
                details['failure_reason'] = failure_reason
            
            if details:
                audit_log.set_details(details)
            
            self.db.session.add(audit_log)
            self.db.session.commit()
            
        except Exception as e:
            print(f"Login audit logging failed: {str(e)}")
    
    def log_admin_action(self, admin_user_id, action, target_user_id=None, details=None):
        """Log an administrative action"""
        try:
            audit_log = AuditLog(
                event_type=AuditEventType.ADMIN_ACTION,
                description=f"Admin action: {action}",
                user_id=admin_user_id,
                severity=AuditSeverity.HIGH,
                resource_type='user' if target_user_id else None,
                resource_id=str(target_user_id) if target_user_id else None
            )
            
            if details:
                audit_log.set_details(details)
            
            self.db.session.add(audit_log)
            self.db.session.commit()
            
        except Exception as e:
            print(f"Admin audit logging failed: {str(e)}")
    
    def log_compliance_check(self, check_type, result, user_id=None, details=None):
        """Log a compliance check"""
        try:
            audit_log = AuditLog(
                event_type=AuditEventType.COMPLIANCE_CHECK,
                description=f"Compliance check: {check_type} - {result}",
                user_id=user_id,
                severity=AuditSeverity.MEDIUM,
                success=result.lower() in ['passed', 'success', 'compliant']
            )
            
            if details:
                audit_log.set_details(details)
            
            self.db.session.add(audit_log)
            self.db.session.commit()
            
        except Exception as e:
            print(f"Compliance audit logging failed: {str(e)}")
    
    def _sanitize_request_data(self, data):
        """Remove sensitive information from request data"""
        if not data:
            return data
        
        sensitive_fields = [
            'password', 'pin', 'cvv', 'card_number', 'ssn', 'social_security_number',
            'account_number', 'routing_number', 'secret', 'token', 'key'
        ]
        
        if isinstance(data, dict):
            sanitized = {}
            for key, value in data.items():
                if any(field in key.lower() for field in sensitive_fields):
                    sanitized[key] = '[REDACTED]'
                elif isinstance(value, dict):
                    sanitized[key] = self._sanitize_request_data(value)
                elif isinstance(value, list):
                    sanitized[key] = [self._sanitize_request_data(item) if isinstance(item, dict) else item for item in value]
                else:
                    sanitized[key] = value
            return sanitized
        
        return data
    
    @staticmethod
    def get_audit_logs(user_id=None, event_type=None, start_date=None, end_date=None, 
                      limit=100, offset=0):
        """Retrieve audit logs with filtering"""
        query = AuditLog.query
        
        if user_id:
            query = query.filter(AuditLog.user_id == user_id)
        
        if event_type:
            query = query.filter(AuditLog.event_type == event_type)
        
        if start_date:
            query = query.filter(AuditLog.created_at >= start_date)
        
        if end_date:
            query = query.filter(AuditLog.created_at <= end_date)
        
        query = query.order_by(AuditLog.created_at.desc())
        query = query.offset(offset).limit(limit)
        
        return query.all()
    
    @staticmethod
    def cleanup_expired_logs():
        """Remove expired audit logs based on retention policy"""
        try:
            expired_logs = AuditLog.query.filter(
                AuditLog.created_at < datetime.now(timezone.utc) - 
                db.func.make_interval(days=AuditLog.retention_period_days)
            ).all()
            
            for log in expired_logs:
                db.session.delete(log)
            
            db.session.commit()
            return len(expired_logs)
            
        except Exception as e:
            db.session.rollback()
            print(f"Audit log cleanup failed: {str(e)}")
            return 0


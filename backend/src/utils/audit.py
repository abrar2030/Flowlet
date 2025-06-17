# Enhanced Audit Logging and Compliance Utilities
# Financial Industry Standards Compliant

import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from flask import request, g
import uuid
from sqlalchemy.exc import IntegrityError

from ..models.database import db, AuditLog

logger = logging.getLogger(__name__)

class AuditLogger:
    """
    Enhanced Audit Logger implementing financial industry standards
    Provides comprehensive audit trails for regulatory compliance
    """
    
    # Audit event types
    EVENT_TYPES = {
        # Authentication events
        'USER_LOGIN': 'User authentication successful',
        'USER_LOGIN_FAILED': 'User authentication failed',
        'USER_LOGOUT': 'User logout',
        'PASSWORD_CHANGED': 'User password changed',
        'MFA_ENABLED': 'Multi-factor authentication enabled',
        'MFA_DISABLED': 'Multi-factor authentication disabled',
        
        # Account management events
        'ACCOUNT_CREATED': 'User account created',
        'ACCOUNT_UPDATED': 'User account updated',
        'ACCOUNT_SUSPENDED': 'User account suspended',
        'ACCOUNT_CLOSED': 'User account closed',
        'ACCOUNT_REACTIVATED': 'User account reactivated',
        
        # Wallet events
        'WALLET_CREATED': 'Wallet created',
        'WALLET_UPDATED': 'Wallet updated',
        'WALLET_SUSPENDED': 'Wallet suspended',
        'WALLET_CLOSED': 'Wallet closed',
        'WALLET_BALANCE_UPDATED': 'Wallet balance updated',
        
        # Transaction events
        'TRANSACTION_CREATED': 'Transaction created',
        'TRANSACTION_COMPLETED': 'Transaction completed',
        'TRANSACTION_FAILED': 'Transaction failed',
        'TRANSACTION_CANCELLED': 'Transaction cancelled',
        'TRANSACTION_REFUNDED': 'Transaction refunded',
        
        # Payment events
        'PAYMENT_INITIATED': 'Payment initiated',
        'PAYMENT_PROCESSED': 'Payment processed',
        'PAYMENT_FAILED': 'Payment failed',
        'PAYMENT_REFUNDED': 'Payment refunded',
        'PAYMENT_DISPUTED': 'Payment disputed',
        
        # Transfer events
        'FUNDS_TRANSFERRED_OUT': 'Funds transferred out',
        'FUNDS_TRANSFERRED_IN': 'Funds transferred in',
        'TRANSFER_FAILED': 'Transfer failed',
        'TRANSFER_CANCELLED': 'Transfer cancelled',
        
        # Card events
        'CARD_ISSUED': 'Card issued',
        'CARD_ACTIVATED': 'Card activated',
        'CARD_BLOCKED': 'Card blocked',
        'CARD_UNBLOCKED': 'Card unblocked',
        'CARD_CANCELLED': 'Card cancelled',
        'CARD_TRANSACTION': 'Card transaction',
        'CARD_LIMITS_UPDATED': 'Card limits updated',
        
        # KYC/AML events
        'KYC_INITIATED': 'KYC verification initiated',
        'KYC_COMPLETED': 'KYC verification completed',
        'KYC_FAILED': 'KYC verification failed',
        'KYC_UPDATED': 'KYC information updated',
        'AML_SCREENING': 'AML screening performed',
        'SANCTIONS_CHECK': 'Sanctions screening performed',
        
        # Security events
        'SECURITY_ALERT': 'Security alert generated',
        'FRAUD_DETECTED': 'Fraud detected',
        'SUSPICIOUS_ACTIVITY': 'Suspicious activity detected',
        'DATA_BREACH_ATTEMPT': 'Data breach attempt detected',
        'UNAUTHORIZED_ACCESS': 'Unauthorized access attempt',
        
        # Administrative events
        'ADMIN_LOGIN': 'Administrator login',
        'ADMIN_ACTION': 'Administrative action performed',
        'SYSTEM_CONFIG_CHANGED': 'System configuration changed',
        'BACKUP_CREATED': 'System backup created',
        'BACKUP_RESTORED': 'System backup restored',
        
        # API events
        'API_KEY_CREATED': 'API key created',
        'API_KEY_REVOKED': 'API key revoked',
        'API_RATE_LIMIT_EXCEEDED': 'API rate limit exceeded',
        'API_UNAUTHORIZED_ACCESS': 'Unauthorized API access attempt',
        
        # Compliance events
        'REGULATORY_REPORT_GENERATED': 'Regulatory report generated',
        'COMPLIANCE_VIOLATION': 'Compliance violation detected',
        'AUDIT_TRAIL_ACCESSED': 'Audit trail accessed',
        'DATA_EXPORT': 'Data export performed',
        'DATA_DELETION': 'Data deletion performed'
    }
    
    @staticmethod
    def log_event(user_id: Optional[str], action: str, resource_type: str,
                  resource_id: Optional[str] = None, details: Optional[Dict] = None,
                  ip_address: Optional[str] = None, user_agent: Optional[str] = None,
                  request_data: Optional[Dict] = None, response_status: Optional[int] = None) -> bool:
        """
        Log an audit event with comprehensive details
        
        Args:
            user_id: User identifier (None for system events)
            action: Action performed (should be from EVENT_TYPES)
            resource_type: Type of resource affected
            resource_id: Identifier of the affected resource
            details: Additional event details
            ip_address: Client IP address
            user_agent: Client user agent
            request_data: Request data (sensitive data will be masked)
            response_status: HTTP response status code
            
        Returns:
            True if logged successfully, False otherwise
        """
        try:
            # Get request context if available
            if not ip_address and request:
                ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            
            if not user_agent and request:
                user_agent = request.headers.get('User-Agent')
            
            # Mask sensitive data in request_data
            masked_request_data = AuditLogger._mask_sensitive_data(request_data) if request_data else None
            
            # Create audit log entry
            audit_entry = AuditLog(
                id=str(uuid.uuid4()),
                user_id=user_id,
                action=action,
                resource_type=resource_type,
                resource_id=resource_id,
                ip_address=ip_address,
                user_agent=user_agent,
                request_data=json.dumps(masked_request_data) if masked_request_data else None,
                response_status=response_status,
                created_at=datetime.now(timezone.utc)
            )
            
            # Add details as metadata
            if details:
                audit_entry.request_data = json.dumps({
                    'details': details,
                    'request_data': masked_request_data
                })
            
            db.session.add(audit_entry)
            db.session.commit()
            
            logger.info(f"Audit event logged: {action} for user {user_id}")
            return True
            
        except IntegrityError as e:
            db.session.rollback()
            logger.error(f"Database integrity error logging audit event: {str(e)}")
            return False
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error logging audit event: {str(e)}")
            return False
    
    @staticmethod
    def _mask_sensitive_data(data: Dict) -> Dict:
        """
        Mask sensitive data in request/response data
        
        Args:
            data: Data dictionary to mask
            
        Returns:
            Dictionary with sensitive data masked
        """
        if not isinstance(data, dict):
            return data
        
        # Fields to mask completely
        sensitive_fields = {
            'password', 'password_hash', 'pin', 'cvv', 'card_number',
            'account_number', 'routing_number', 'ssn', 'tax_id',
            'api_key', 'secret_key', 'private_key', 'token'
        }
        
        # Fields to partially mask (show first/last few characters)
        partial_mask_fields = {
            'email', 'phone', 'iban', 'swift_code'
        }
        
        masked_data = {}
        
        for key, value in data.items():
            key_lower = key.lower()
            
            if key_lower in sensitive_fields:
                masked_data[key] = '***MASKED***'
            elif key_lower in partial_mask_fields and isinstance(value, str):
                if len(value) > 6:
                    masked_data[key] = value[:2] + '*' * (len(value) - 4) + value[-2:]
                else:
                    masked_data[key] = '*' * len(value)
            elif isinstance(value, dict):
                masked_data[key] = AuditLogger._mask_sensitive_data(value)
            elif isinstance(value, list):
                masked_data[key] = [
                    AuditLogger._mask_sensitive_data(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                masked_data[key] = value
        
        return masked_data
    
    @staticmethod
    def get_audit_trail(user_id: Optional[str] = None, resource_type: Optional[str] = None,
                       resource_id: Optional[str] = None, action: Optional[str] = None,
                       start_date: Optional[datetime] = None, end_date: Optional[datetime] = None,
                       limit: int = 100, offset: int = 0) -> List[Dict]:
        """
        Retrieve audit trail with filtering options
        
        Args:
            user_id: Filter by user ID
            resource_type: Filter by resource type
            resource_id: Filter by resource ID
            action: Filter by action
            start_date: Filter by start date
            end_date: Filter by end date
            limit: Maximum number of records to return
            offset: Number of records to skip
            
        Returns:
            List of audit log entries
        """
        try:
            query = AuditLog.query
            
            # Apply filters
            if user_id:
                query = query.filter(AuditLog.user_id == user_id)
            
            if resource_type:
                query = query.filter(AuditLog.resource_type == resource_type)
            
            if resource_id:
                query = query.filter(AuditLog.resource_id == resource_id)
            
            if action:
                query = query.filter(AuditLog.action == action)
            
            if start_date:
                query = query.filter(AuditLog.created_at >= start_date)
            
            if end_date:
                query = query.filter(AuditLog.created_at <= end_date)
            
            # Order by creation date (newest first)
            query = query.order_by(AuditLog.created_at.desc())
            
            # Apply pagination
            audit_logs = query.offset(offset).limit(limit).all()
            
            # Convert to dictionaries
            result = []
            for log in audit_logs:
                log_dict = {
                    'id': log.id,
                    'user_id': log.user_id,
                    'action': log.action,
                    'resource_type': log.resource_type,
                    'resource_id': log.resource_id,
                    'ip_address': log.ip_address,
                    'user_agent': log.user_agent,
                    'response_status': log.response_status,
                    'created_at': log.created_at.isoformat() + 'Z'
                }
                
                # Parse request data if available
                if log.request_data:
                    try:
                        log_dict['request_data'] = json.loads(log.request_data)
                    except json.JSONDecodeError:
                        log_dict['request_data'] = log.request_data
                
                result.append(log_dict)
            
            return result
            
        except Exception as e:
            logger.error(f"Error retrieving audit trail: {str(e)}")
            return []
    
    @staticmethod
    def generate_compliance_report(start_date: datetime, end_date: datetime,
                                 report_type: str = 'full') -> Dict:
        """
        Generate compliance report for regulatory purposes
        
        Args:
            start_date: Report start date
            end_date: Report end date
            report_type: Type of report (full, security, transactions, kyc)
            
        Returns:
            Compliance report dictionary
        """
        try:
            # Base query for the date range
            base_query = AuditLog.query.filter(
                AuditLog.created_at >= start_date,
                AuditLog.created_at <= end_date
            )
            
            report = {
                'report_id': str(uuid.uuid4()),
                'report_type': report_type,
                'start_date': start_date.isoformat() + 'Z',
                'end_date': end_date.isoformat() + 'Z',
                'generated_at': datetime.now(timezone.utc).isoformat() + 'Z',
                'summary': {},
                'details': {}
            }
            
            if report_type in ['full', 'security']:
                # Security events summary
                security_actions = [
                    'SECURITY_ALERT', 'FRAUD_DETECTED', 'SUSPICIOUS_ACTIVITY',
                    'DATA_BREACH_ATTEMPT', 'UNAUTHORIZED_ACCESS'
                ]
                
                security_events = base_query.filter(
                    AuditLog.action.in_(security_actions)
                ).all()
                
                report['summary']['security_events'] = len(security_events)
                report['details']['security_events'] = [
                    {
                        'action': event.action,
                        'user_id': event.user_id,
                        'ip_address': event.ip_address,
                        'created_at': event.created_at.isoformat() + 'Z'
                    }
                    for event in security_events
                ]
            
            if report_type in ['full', 'transactions']:
                # Transaction events summary
                transaction_actions = [
                    'TRANSACTION_CREATED', 'TRANSACTION_COMPLETED',
                    'TRANSACTION_FAILED', 'PAYMENT_PROCESSED', 'FUNDS_TRANSFERRED_OUT'
                ]
                
                transaction_events = base_query.filter(
                    AuditLog.action.in_(transaction_actions)
                ).all()
                
                report['summary']['transaction_events'] = len(transaction_events)
                report['details']['transaction_summary'] = {
                    'total_transactions': len(transaction_events),
                    'by_action': {}
                }
                
                # Group by action
                for event in transaction_events:
                    action = event.action
                    if action not in report['details']['transaction_summary']['by_action']:
                        report['details']['transaction_summary']['by_action'][action] = 0
                    report['details']['transaction_summary']['by_action'][action] += 1
            
            if report_type in ['full', 'kyc']:
                # KYC/AML events summary
                kyc_actions = [
                    'KYC_INITIATED', 'KYC_COMPLETED', 'KYC_FAILED',
                    'AML_SCREENING', 'SANCTIONS_CHECK'
                ]
                
                kyc_events = base_query.filter(
                    AuditLog.action.in_(kyc_actions)
                ).all()
                
                report['summary']['kyc_events'] = len(kyc_events)
                report['details']['kyc_summary'] = {
                    'total_kyc_events': len(kyc_events),
                    'by_action': {}
                }
                
                # Group by action
                for event in kyc_events:
                    action = event.action
                    if action not in report['details']['kyc_summary']['by_action']:
                        report['details']['kyc_summary']['by_action'][action] = 0
                    report['details']['kyc_summary']['by_action'][action] += 1
            
            # Overall statistics
            total_events = base_query.count()
            unique_users = base_query.filter(AuditLog.user_id.isnot(None)).distinct(AuditLog.user_id).count()
            
            report['summary']['total_events'] = total_events
            report['summary']['unique_users'] = unique_users
            
            # Log the report generation
            AuditLogger.log_event(
                user_id=getattr(g, 'user_id', None),
                action='REGULATORY_REPORT_GENERATED',
                resource_type='compliance_report',
                resource_id=report['report_id'],
                details={
                    'report_type': report_type,
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'total_events': total_events
                }
            )
            
            return report
            
        except Exception as e:
            logger.error(f"Error generating compliance report: {str(e)}")
            return {
                'error': 'Failed to generate compliance report',
                'message': str(e)
            }

# Convenience function for logging audit events
def log_audit_event(user_id: Optional[str], action: str, resource_type: str,
                   resource_id: Optional[str] = None, details: Optional[Dict] = None) -> bool:
    """
    Log an audit event
    
    Args:
        user_id: User identifier
        action: Action performed
        resource_type: Type of resource affected
        resource_id: Identifier of the affected resource
        details: Additional event details
        
    Returns:
        True if logged successfully, False otherwise
    """
    return AuditLogger.log_event(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details
    )


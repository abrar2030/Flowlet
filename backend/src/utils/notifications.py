import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from enum import Enum
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import requests
import uuid

logger = logging.getLogger(__name__)

class NotificationType(Enum):
    """Notification types for different events"""
    # Account notifications
    ACCOUNT_CREATED = "account_created"
    ACCOUNT_VERIFIED = "account_verified"
    ACCOUNT_SUSPENDED = "account_suspended"
    ACCOUNT_REACTIVATED = "account_reactivated"
    
    # Wallet notifications
    WALLET_CREATED = "wallet_created"
    WALLET_FUNDED = "wallet_funded"
    WALLET_LOW_BALANCE = "wallet_low_balance"
    WALLET_SUSPENDED = "wallet_suspended"
    
    # Transaction notifications
    TRANSACTION_COMPLETED = "transaction_completed"
    TRANSACTION_FAILED = "transaction_failed"
    FUNDS_TRANSFERRED_IN = "funds_transferred_in"
    FUNDS_TRANSFERRED_OUT = "funds_transferred_out"
    
    # Payment notifications
    PAYMENT_PROCESSED = "payment_processed"
    PAYMENT_FAILED = "payment_failed"
    PAYMENT_REFUNDED = "payment_refunded"
    PAYMENT_DISPUTED = "payment_disputed"
    
    # Card notifications
    CARD_ISSUED = "card_issued"
    CARD_ACTIVATED = "card_activated"
    CARD_BLOCKED = "card_blocked"
    CARD_TRANSACTION = "card_transaction"
    CARD_DECLINED = "card_declined"
    
    # Security notifications
    LOGIN_SUCCESSFUL = "login_successful"
    LOGIN_FAILED = "login_failed"
    PASSWORD_CHANGED = "password_changed"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    FRAUD_DETECTED = "fraud_detected"
    
    # KYC notifications
    KYC_VERIFICATION_REQUIRED = "kyc_verification_required"
    KYC_VERIFICATION_COMPLETED = "kyc_verification_completed"
    KYC_VERIFICATION_FAILED = "kyc_verification_failed"
    
    # System notifications
    SYSTEM_MAINTENANCE = "system_maintenance"
    SERVICE_DISRUPTION = "service_disruption"
    REGULATORY_UPDATE = "regulatory_update"

class NotificationChannel(Enum):
    """Notification delivery channels"""
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"
    WEBHOOK = "webhook"

class NotificationPriority(Enum):
    """Notification priority levels"""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    CRITICAL = "critical"

class NotificationService:
    """
    Enhanced Notification Service implementing financial industry standards
    Provides multi-channel notifications with compliance and audit trails
    """
    
    def __init__(self):
        self.email_config = {
            'smtp_server': os.environ.get('SMTP_SERVER', 'localhost'),
            'smtp_port': int(os.environ.get('SMTP_PORT', '587')),
            'smtp_username': os.environ.get('SMTP_USERNAME'),
            'smtp_password': os.environ.get('SMTP_PASSWORD'),
            'from_email': os.environ.get('FROM_EMAIL', 'noreply@flowlet.com')
        }
        
        self.sms_config = {
            'provider': os.environ.get('SMS_PROVIDER', 'twilio'),
            'api_key': os.environ.get('SMS_API_KEY'),
            'api_secret': os.environ.get('SMS_API_SECRET'),
            'from_number': os.environ.get('SMS_FROM_NUMBER')
        }
        
        self.push_config = {
            'provider': os.environ.get('PUSH_PROVIDER', 'firebase'),
            'api_key': os.environ.get('PUSH_API_KEY'),
            'project_id': os.environ.get('PUSH_PROJECT_ID')
        }
    
    def send_notification(self, user_id: str, notification_type: str, message: str,
                         metadata: Optional[Dict] = None, channels: Optional[List[str]] = None,
                         priority: str = NotificationPriority.NORMAL.value) -> Dict:
        """
        Send notification through specified channels
        
        Args:
            user_id: User identifier
            notification_type: Type of notification
            message: Notification message
            metadata: Additional notification metadata
            channels: List of channels to send through
            priority: Notification priority
            
        Returns:
            Dict containing notification result
        """
        try:
            notification_id = str(uuid.uuid4())
            
            # Default channels based on notification type and priority
            if not channels:
                channels = self._get_default_channels(notification_type, priority)
            
            # Get user preferences and contact information
            user_preferences = self._get_user_preferences(user_id)
            user_contacts = self._get_user_contacts(user_id)
            
            # Filter channels based on user preferences
            enabled_channels = [
                channel for channel in channels
                if user_preferences.get(f'{channel}_enabled', True)
            ]
            
            results = {}
            
            # Send through each enabled channel
            for channel in enabled_channels:
                try:
                    if channel == NotificationChannel.EMAIL.value:
                        result = self._send_email(
                            user_contacts.get('email'),
                            notification_type,
                            message,
                            metadata
                        )
                    elif channel == NotificationChannel.SMS.value:
                        result = self._send_sms(
                            user_contacts.get('phone'),
                            message,
                            metadata
                        )
                    elif channel == NotificationChannel.PUSH.value:
                        result = self._send_push(
                            user_id,
                            notification_type,
                            message,
                            metadata
                        )
                    elif channel == NotificationChannel.IN_APP.value:
                        result = self._send_in_app(
                            user_id,
                            notification_type,
                            message,
                            metadata
                        )
                    elif channel == NotificationChannel.WEBHOOK.value:
                        result = self._send_webhook(
                            user_id,
                            notification_type,
                            message,
                            metadata
                        )
                    else:
                        result = {'success': False, 'error': 'Unsupported channel'}
                    
                    results[channel] = result
                    
                except Exception as e:
                    logger.error(f"Error sending notification via {channel}: {str(e)}")
                    results[channel] = {'success': False, 'error': str(e)}
            
            # Log notification attempt
            self._log_notification(
                notification_id=notification_id,
                user_id=user_id,
                notification_type=notification_type,
                message=message,
                channels=enabled_channels,
                results=results,
                metadata=metadata
            )
            
            # Determine overall success
            successful_channels = [
                channel for channel, result in results.items()
                if result.get('success', False)
            ]
            
            return {
                'success': len(successful_channels) > 0,
                'notification_id': notification_id,
                'channels_attempted': enabled_channels,
                'channels_successful': successful_channels,
                'results': results
            }
            
        except Exception as e:
            logger.error(f"Error sending notification: {str(e)}")
            return {
                'success': False,
                'error': 'NOTIFICATION_FAILED',
                'message': 'Failed to send notification'
            }
    
    def _get_default_channels(self, notification_type: str, priority: str) -> List[str]:
        """Get default channels based on notification type and priority"""
        
        # Critical notifications go through all channels
        if priority == NotificationPriority.CRITICAL.value:
            return [
                NotificationChannel.EMAIL.value,
                NotificationChannel.SMS.value,
                NotificationChannel.PUSH.value,
                NotificationChannel.IN_APP.value
            ]
        
        # Security notifications
        if notification_type in [
            NotificationType.FRAUD_DETECTED.value,
            NotificationType.SUSPICIOUS_ACTIVITY.value,
            NotificationType.LOGIN_FAILED.value
        ]:
            return [
                NotificationChannel.EMAIL.value,
                NotificationChannel.SMS.value,
                NotificationChannel.IN_APP.value
            ]
        
        # Transaction notifications
        if notification_type in [
            NotificationType.TRANSACTION_COMPLETED.value,
            NotificationType.PAYMENT_PROCESSED.value,
            NotificationType.FUNDS_TRANSFERRED_IN.value,
            NotificationType.FUNDS_TRANSFERRED_OUT.value
        ]:
            return [
                NotificationChannel.EMAIL.value,
                NotificationChannel.IN_APP.value,
                NotificationChannel.PUSH.value
            ]
        
        # Default channels
        return [
            NotificationChannel.EMAIL.value,
            NotificationChannel.IN_APP.value
        ]
    
    def _get_user_preferences(self, user_id: str) -> Dict:
        """Get user notification preferences"""
        # In a real implementation, this would query the database
        # For now, return default preferences
        return {
            'email_enabled': True,
            'sms_enabled': True,
            'push_enabled': True,
            'in_app_enabled': True,
            'webhook_enabled': False
        }
    
    def _get_user_contacts(self, user_id: str) -> Dict:
        """Get user contact information"""
        # In a real implementation, this would query the database
        # For now, return placeholder data
        from ..models.database import User
        
        try:
            user = User.query.get(user_id)
            if user:
                return {
                    'email': user.email,
                    'phone': user.phone
                }
        except Exception as e:
            logger.error(f"Error getting user contacts: {str(e)}")
        
        return {}
    
    def _send_email(self, email: str, notification_type: str, message: str,
                   metadata: Optional[Dict] = None) -> Dict:
        """Send email notification"""
        try:
            if not email:
                return {'success': False, 'error': 'No email address provided'}
            
            # Create email content
            subject = self._get_email_subject(notification_type)
            html_content = self._get_email_template(notification_type, message, metadata)
            
            # Create message
            msg = MimeMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.email_config['from_email']
            msg['To'] = email
            
            # Add HTML content
            html_part = MimeText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.email_config['smtp_server'], self.email_config['smtp_port']) as server:
                server.starttls()
                if self.email_config['smtp_username']:
                    server.login(self.email_config['smtp_username'], self.email_config['smtp_password'])
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {email}")
            return {'success': True, 'channel': 'email'}
            
        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _send_sms(self, phone: str, message: str, metadata: Optional[Dict] = None) -> Dict:
        """Send SMS notification"""
        try:
            if not phone:
                return {'success': False, 'error': 'No phone number provided'}
            
            # Truncate message for SMS
            sms_message = message[:160] if len(message) > 160 else message
            
            # In a real implementation, integrate with SMS provider (Twilio, etc.)
            # For now, just log the attempt
            logger.info(f"SMS would be sent to {phone}: {sms_message}")
            
            return {'success': True, 'channel': 'sms'}
            
        except Exception as e:
            logger.error(f"Error sending SMS: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _send_push(self, user_id: str, notification_type: str, message: str,
                  metadata: Optional[Dict] = None) -> Dict:
        """Send push notification"""
        try:
            # In a real implementation, integrate with push notification service
            # For now, just log the attempt
            logger.info(f"Push notification would be sent to user {user_id}: {message}")
            
            return {'success': True, 'channel': 'push'}
            
        except Exception as e:
            logger.error(f"Error sending push notification: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _send_in_app(self, user_id: str, notification_type: str, message: str,
                    metadata: Optional[Dict] = None) -> Dict:
        """Send in-app notification"""
        try:
            # In a real implementation, store in database for in-app display
            # For now, just log the attempt
            logger.info(f"In-app notification would be stored for user {user_id}: {message}")
            
            return {'success': True, 'channel': 'in_app'}
            
        except Exception as e:
            logger.error(f"Error sending in-app notification: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _send_webhook(self, user_id: str, notification_type: str, message: str,
                     metadata: Optional[Dict] = None) -> Dict:
        """Send webhook notification"""
        try:
            # In a real implementation, send to configured webhook URL
            # For now, just log the attempt
            logger.info(f"Webhook notification would be sent for user {user_id}: {message}")
            
            return {'success': True, 'channel': 'webhook'}
            
        except Exception as e:
            logger.error(f"Error sending webhook notification: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _get_email_subject(self, notification_type: str) -> str:
        """Get email subject based on notification type"""
        subjects = {
            NotificationType.ACCOUNT_CREATED.value: "Welcome to Flowlet - Account Created",
            NotificationType.WALLET_CREATED.value: "New Wallet Created",
            NotificationType.TRANSACTION_COMPLETED.value: "Transaction Completed",
            NotificationType.PAYMENT_PROCESSED.value: "Payment Processed",
            NotificationType.FUNDS_TRANSFERRED_IN.value: "Funds Received",
            NotificationType.FUNDS_TRANSFERRED_OUT.value: "Funds Sent",
            NotificationType.CARD_ISSUED.value: "New Card Issued",
            NotificationType.FRAUD_DETECTED.value: "Security Alert - Fraud Detected",
            NotificationType.SUSPICIOUS_ACTIVITY.value: "Security Alert - Suspicious Activity",
            NotificationType.KYC_VERIFICATION_REQUIRED.value: "Identity Verification Required",
            NotificationType.KYC_VERIFICATION_COMPLETED.value: "Identity Verification Completed"
        }
        
        return subjects.get(notification_type, "Flowlet Notification")
    
    def _get_email_template(self, notification_type: str, message: str,
                           metadata: Optional[Dict] = None) -> str:
        """Get HTML email template"""
        # Basic HTML template
        template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Flowlet Notification</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .header {{ background-color: #1f2937; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9fafb; }}
                .footer {{ padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Flowlet</h1>
                </div>
                <div class="content">
                    <p>{message}</p>
                    {self._format_metadata_for_email(metadata) if metadata else ''}
                </div>
                <div class="footer">
                    <p>This is an automated message from Flowlet. Please do not reply to this email.</p>
                    <p>© 2024 Flowlet. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return template
    
    def _format_metadata_for_email(self, metadata: Dict) -> str:
        """Format metadata for email display"""
        if not metadata:
            return ""
        
        html = "<div style='margin-top: 20px; padding: 15px; background-color: #e5e7eb; border-radius: 5px;'>"
        html += "<h3>Details:</h3>"
        html += "<ul>"
        
        for key, value in metadata.items():
            html += f"<li><strong>{key.replace('_', ' ').title()}:</strong> {value}</li>"
        
        html += "</ul></div>"
        
        return html
    
    def _log_notification(self, notification_id: str, user_id: str, notification_type: str,
                         message: str, channels: List[str], results: Dict,
                         metadata: Optional[Dict] = None):
        """Log notification attempt for audit purposes"""
        try:
            from .audit import log_audit_event
            
            log_audit_event(
                user_id=user_id,
                action='NOTIFICATION_SENT',
                resource_type='notification',
                resource_id=notification_id,
                details={
                    'notification_type': notification_type,
                    'channels': channels,
                    'success_count': len([r for r in results.values() if r.get('success')]),
                    'total_channels': len(channels),
                    'metadata': metadata
                }
            )
            
        except Exception as e:
            logger.error(f"Error logging notification: {str(e)}")

# Global notification service instance
notification_service = NotificationService()

# Convenience function for sending notifications
def send_notification(user_id: str, notification_type: str, message: str,
                     metadata: Optional[Dict] = None, channels: Optional[List[str]] = None,
                     priority: str = NotificationPriority.NORMAL.value) -> Dict:
    """
    Send notification to user
    
    Args:
        user_id: User identifier
        notification_type: Type of notification
        message: Notification message
        metadata: Additional notification metadata
        channels: List of channels to send through
        priority: Notification priority
        
    Returns:
        Dict containing notification result
    """
    return notification_service.send_notification(
        user_id=user_id,
        notification_type=notification_type,
        message=message,
        metadata=metadata,
        channels=channels,
        priority=priority
    )


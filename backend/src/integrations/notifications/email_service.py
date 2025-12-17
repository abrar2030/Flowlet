"""
Email Service Implementation
Handles sending emails for notifications, verification, and alerts
"""

import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional, Dict, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class EmailMessage:
    """Email message data class"""

    to: List[str]
    subject: str
    body: str
    html_body: Optional[str] = None
    from_email: Optional[str] = None
    cc: Optional[List[str]] = None
    bcc: Optional[List[str]] = None


class EmailService:
    """Email service for sending notifications"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize email service with configuration"""
        self.config = config or {}
        self.smtp_server = self.config.get("MAIL_SERVER", "localhost")
        self.smtp_port = self.config.get("MAIL_PORT", 587)
        self.username = self.config.get("MAIL_USERNAME")
        self.password = self.config.get("MAIL_PASSWORD")
        self.use_tls = self.config.get("MAIL_USE_TLS", True)
        self.default_from = self.config.get("DEFAULT_FROM_EMAIL", "noreply@flowlet.com")
        self.enabled = self.config.get("EMAIL_ENABLED", True)

    def send_email(self, message: EmailMessage) -> bool:
        """
        Send an email message

        Args:
            message: EmailMessage object with email details

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.enabled:
            logger.info(
                f"Email service disabled. Would send: {message.subject} to {message.to}"
            )
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = message.subject
            msg["From"] = message.from_email or self.default_from
            msg["To"] = ", ".join(message.to)

            if message.cc:
                msg["Cc"] = ", ".join(message.cc)

            # Attach text and HTML parts
            if message.body:
                text_part = MIMEText(message.body, "plain")
                msg.attach(text_part)

            if message.html_body:
                html_part = MIMEText(message.html_body, "html")
                msg.attach(html_part)

            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                if self.username and self.password:
                    server.login(self.username, self.password)

                recipients = message.to + (message.cc or []) + (message.bcc or [])
                server.sendmail(msg["From"], recipients, msg.as_string())

            logger.info(f"Email sent successfully: {message.subject} to {message.to}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email: {str(e)}")
            return False

    def send_verification_email(self, to_email: str, verification_code: str) -> bool:
        """Send email verification code"""
        message = EmailMessage(
            to=[to_email],
            subject="Verify Your Email - Flowlet",
            body=f"Your verification code is: {verification_code}\n\nThis code will expire in 15 minutes.",
            html_body=f"""
            <html>
                <body>
                    <h2>Email Verification</h2>
                    <p>Your verification code is:</p>
                    <h1 style="color: #007bff;">{verification_code}</h1>
                    <p>This code will expire in 15 minutes.</p>
                </body>
            </html>
            """,
        )
        return self.send_email(message)

    def send_password_reset_email(
        self, to_email: str, reset_token: str, reset_url: str
    ) -> bool:
        """Send password reset email"""
        full_url = f"{reset_url}?token={reset_token}"
        message = EmailMessage(
            to=[to_email],
            subject="Password Reset Request - Flowlet",
            body=f"Click the link to reset your password: {full_url}\n\nThis link will expire in 1 hour.",
            html_body=f"""
            <html>
                <body>
                    <h2>Password Reset Request</h2>
                    <p>Click the button below to reset your password:</p>
                    <a href="{full_url}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
                    <p>Or copy this link: {full_url}</p>
                    <p>This link will expire in 1 hour.</p>
                </body>
            </html>
            """,
        )
        return self.send_email(message)

    def send_transaction_alert(
        self, to_email: str, transaction_details: Dict[str, Any]
    ) -> bool:
        """Send transaction alert email"""
        message = EmailMessage(
            to=[to_email],
            subject="Transaction Alert - Flowlet",
            body=f"Transaction: {transaction_details.get('amount')} {transaction_details.get('currency')}\nStatus: {transaction_details.get('status')}",
            html_body=f"""
            <html>
                <body>
                    <h2>Transaction Alert</h2>
                    <p><strong>Amount:</strong> {transaction_details.get('amount')} {transaction_details.get('currency')}</p>
                    <p><strong>Status:</strong> {transaction_details.get('status')}</p>
                    <p><strong>Date:</strong> {transaction_details.get('timestamp')}</p>
                </body>
            </html>
            """,
        )
        return self.send_email(message)

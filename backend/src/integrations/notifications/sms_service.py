"""
SMS Service Implementation
Handles sending SMS messages for notifications and verification
"""

import logging
from typing import Optional, Dict, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class SMSMessage:
    """SMS message data class"""

    to: str
    body: str
    from_number: Optional[str] = None


class SMSService:
    """SMS service for sending text messages"""

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize SMS service with configuration"""
        self.config = config or {}
        self.provider = self.config.get(
            "SMS_PROVIDER", "console"
        )  # console, twilio, etc.
        self.from_number = self.config.get("SMS_FROM_NUMBER", "+10000000000")
        self.enabled = self.config.get("SMS_ENABLED", True)

        # Twilio config (if needed)
        self.account_sid = self.config.get("TWILIO_ACCOUNT_SID")
        self.auth_token = self.config.get("TWILIO_AUTH_TOKEN")

    def send_sms(self, message: SMSMessage) -> bool:
        """
        Send an SMS message

        Args:
            message: SMSMessage object with SMS details

        Returns:
            bool: True if successful, False otherwise
        """
        if not self.enabled:
            logger.info(
                f"SMS service disabled. Would send: {message.body} to {message.to}"
            )
            return True

        try:
            if self.provider == "console":
                # Console provider for development/testing
                logger.info(f"SMS to {message.to}: {message.body}")
                return True
            elif self.provider == "twilio":
                return self._send_twilio(message)
            else:
                logger.warning(f"Unknown SMS provider: {self.provider}")
                return False

        except Exception as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            return False

    def _send_twilio(self, message: SMSMessage) -> bool:
        """Send SMS via Twilio"""
        try:
            # Import Twilio only if needed
            from twilio.rest import Client

            client = Client(self.account_sid, self.auth_token)
            twilio_message = client.messages.create(
                body=message.body,
                from_=message.from_number or self.from_number,
                to=message.to,
            )

            logger.info(f"SMS sent via Twilio: {twilio_message.sid}")
            return True

        except ImportError:
            logger.error(
                "Twilio library not installed. Install with: pip install twilio"
            )
            return False
        except Exception as e:
            logger.error(f"Twilio SMS failed: {str(e)}")
            return False

    def send_verification_code(self, phone_number: str, code: str) -> bool:
        """Send verification code via SMS"""
        message = SMSMessage(
            to=phone_number,
            body=f"Your Flowlet verification code is: {code}. This code expires in 15 minutes.",
        )
        return self.send_sms(message)

    def send_transaction_alert(
        self, phone_number: str, amount: str, currency: str
    ) -> bool:
        """Send transaction alert via SMS"""
        message = SMSMessage(
            to=phone_number,
            body=f"Flowlet Alert: Transaction of {amount} {currency} processed on your account.",
        )
        return self.send_sms(message)

    def send_security_alert(self, phone_number: str, alert_message: str) -> bool:
        """Send security alert via SMS"""
        message = SMSMessage(
            to=phone_number, body=f"Flowlet Security Alert: {alert_message}"
        )
        return self.send_sms(message)

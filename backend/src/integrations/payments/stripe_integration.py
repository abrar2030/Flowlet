import logging
import os
import uuid
from abc import ABC, abstractmethod
from decimal import Decimal
from typing import Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


class PaymentProcessor(ABC):
    """Abstract base class for payment processors"""

    @abstractmethod
    def process_payment(
        self, amount: Decimal, currency: str, payment_details: Dict
    ) -> Dict:
        """Process a payment"""

    @abstractmethod
    def refund_payment(self, payment_id: str, amount: Optional[Decimal] = None) -> Dict:
        """Refund a payment"""

    @abstractmethod
    def get_payment_status(self, payment_id: str) -> Dict:
        """Get payment status"""


class StripePaymentProcessor(PaymentProcessor):
    """Stripe payment processor implementation"""

    def __init__(self):
        self.api_key = os.environ.get("STRIPE_SECRET_KEY")
        self.webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET")
        self.base_url = "https://api.stripe.com/v1"

    def process_payment(
        self, amount: Decimal, currency: str, payment_details: Dict
    ) -> Dict:
        """Process card payment through Stripe"""
        try:
            if not self.api_key:
                return {
                    "success": False,
                    "error": "STRIPE_NOT_CONFIGURED",
                    "message": "Stripe API key not configured",
                }

            # Convert amount to cents for Stripe
            amount_cents = int(amount * 100)

            # Create payment intent
            payload = {
                "amount": amount_cents,
                "currency": currency.lower(),
                "payment_method": payment_details.get("payment_method_id"),
                "confirmation_method": "manual",
                "confirm": True,
                "metadata": {"flowlet_payment": "true", "processor": "stripe"},
            }

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/x-www-form-urlencoded",
            }

            response = requests.post(
                f"{self.base_url}/payment_intents",
                data=payload,
                headers=headers,
                timeout=30,
            )

            if response.status_code == 200:
                data = response.json()

                return {
                    "success": True,
                    "external_id": data["id"],
                    "status": self._map_stripe_status(data["status"]),
                    "processor": "stripe",
                    "processor_response": data,
                }
            else:
                error_data = response.json()
                return {
                    "success": False,
                    "error": "STRIPE_ERROR",
                    "message": error_data.get("error", {}).get(
                        "message", "Unknown Stripe error"
                    ),
                    "processor": "stripe",
                }

        except Exception as e:
            logger.error(f"Stripe payment processing error: {str(e)}")
            return {
                "success": False,
                "error": "STRIPE_PROCESSING_ERROR",
                "message": "Failed to process payment through Stripe",
            }

    def refund_payment(self, payment_id: str, amount: Optional[Decimal] = None) -> Dict:
        """Refund Stripe payment"""
        try:
            payload = {"payment_intent": payment_id}

            if amount:
                payload["amount"] = int(amount * 100)

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/x-www-form-urlencoded",
            }

            response = requests.post(
                f"{self.base_url}/refunds", data=payload, headers=headers, timeout=30
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "refund_id": data["id"],
                    "status": data["status"],
                    "processor": "stripe",
                }
            else:
                return {
                    "success": False,
                    "error": "STRIPE_REFUND_ERROR",
                    "message": "Failed to process refund",
                }

        except Exception as e:
            logger.error(f"Stripe refund error: {str(e)}")
            return {"success": False, "error": "STRIPE_REFUND_ERROR", "message": str(e)}

    def get_payment_status(self, payment_id: str) -> Dict:
        """Get Stripe payment status"""
        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}

            response = requests.get(
                f"{self.base_url}/payment_intents/{payment_id}",
                headers=headers,
                timeout=30,
            )

            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "status": self._map_stripe_status(data["status"]),
                    "processor": "stripe",
                    "details": data,
                }
            else:
                return {
                    "success": False,
                    "error": "PAYMENT_NOT_FOUND",
                    "message": "Payment not found",
                }

        except Exception as e:
            logger.error(f"Stripe status check error: {str(e)}")
            return {"success": False, "error": "STRIPE_STATUS_ERROR", "message": str(e)}

    def _map_stripe_status(self, stripe_status: str) -> str:
        """Map Stripe status to internal status"""
        status_mapping = {
            "requires_payment_method": "pending",
            "requires_confirmation": "pending",
            "requires_action": "pending",
            "processing": "processing",
            "requires_capture": "processing",
            "canceled": "cancelled",
            "succeeded": "completed",
        }

        return status_mapping.get(stripe_status, "pending")


class ACHPaymentProcessor(PaymentProcessor):
    """ACH payment processor implementation"""

    def __init__(self):
        self.api_key = os.environ.get("ACH_API_KEY")
        self.api_secret = os.environ.get("ACH_API_SECRET")
        self.base_url = os.environ.get("ACH_BASE_URL", "https://api.achprovider.com/v1")

    def process_payment(
        self, amount: Decimal, currency: str, payment_details: Dict
    ) -> Dict:
        """Process ACH payment"""
        try:
            if not self.api_key:
                return {
                    "success": False,
                    "error": "ACH_NOT_CONFIGURED",
                    "message": "ACH processor not configured",
                }

            # ACH payments are typically USD only
            if currency.upper() != "USD":
                return {
                    "success": False,
                    "error": "CURRENCY_NOT_SUPPORTED",
                    "message": "ACH only supports USD",
                }

            payload = {
                "amount": str(amount),
                "currency": currency,
                "account_number": payment_details.get("account_number"),
                "routing_number": payment_details.get("routing_number"),
                "account_type": payment_details.get("account_type", "checking"),
                "description": payment_details.get("description", "Flowlet payment"),
            }

            # In a real implementation, this would make an actual API call
            # For now, simulate a successful ACH initiation
            transaction_id = f"ach_{uuid.uuid4().hex[:16]}"

            return {
                "success": True,
                "external_id": transaction_id,
                "status": "processing",  # ACH payments take time to settle
                "processor": "ach",
                "estimated_settlement": "1-3 business days",
            }

        except Exception as e:
            logger.error(f"ACH payment processing error: {str(e)}")
            return {
                "success": False,
                "error": "ACH_PROCESSING_ERROR",
                "message": "Failed to process ACH payment",
            }

    def refund_payment(self, payment_id: str, amount: Optional[Decimal] = None) -> Dict:
        """Refund ACH payment"""
        try:
            # ACH refunds are typically done as reverse transactions
            refund_id = f"ach_refund_{uuid.uuid4().hex[:16]}"

            return {
                "success": True,
                "refund_id": refund_id,
                "status": "processing",
                "processor": "ach",
            }

        except Exception as e:
            logger.error(f"ACH refund error: {str(e)}")
            return {"success": False, "error": "ACH_REFUND_ERROR", "message": str(e)}

    def get_payment_status(self, payment_id: str) -> Dict:
        """Get ACH payment status"""
        try:
            # In a real implementation, this would query the ACH processor
            # For now, simulate status check
            return {
                "success": True,
                "status": "processing",
                "processor": "ach",
                "details": {
                    "payment_id": payment_id,
                    "estimated_settlement": "1-3 business days",
                },
            }

        except Exception as e:
            logger.error(f"ACH status check error: {str(e)}")
            return {"success": False, "error": "ACH_STATUS_ERROR", "message": str(e)}


class WirePaymentProcessor(PaymentProcessor):
    """Wire transfer payment processor implementation"""

    def __init__(self):
        self.api_key = os.environ.get("WIRE_API_KEY")
        self.base_url = os.environ.get(
            "WIRE_BASE_URL", "https://api.wireprovider.com/v1"
        )

    def process_payment(
        self, amount: Decimal, currency: str, payment_details: Dict
    ) -> Dict:
        """Process wire transfer"""
        try:
            if not self.api_key:
                return {
                    "success": False,
                    "error": "WIRE_NOT_CONFIGURED",
                    "message": "Wire transfer processor not configured",
                }

            # Wire transfers require additional details
            required_fields = [
                "beneficiary_name",
                "beneficiary_account",
                "beneficiary_bank",
            ]
            for field in required_fields:
                if field not in payment_details:
                    return {
                        "success": False,
                        "error": "MISSING_WIRE_DETAILS",
                        "message": f"Missing required field: {field}",
                    }

            # Simulate wire transfer initiation
            wire_id = f"wire_{uuid.uuid4().hex[:16]}"

            return {
                "success": True,
                "external_id": wire_id,
                "status": "processing",
                "processor": "wire",
                "estimated_settlement": "Same day to 1 business day",
            }

        except Exception as e:
            logger.error(f"Wire transfer processing error: {str(e)}")
            return {
                "success": False,
                "error": "WIRE_PROCESSING_ERROR",
                "message": "Failed to process wire transfer",
            }

    def refund_payment(self, payment_id: str, amount: Optional[Decimal] = None) -> Dict:
        """Refund wire transfer (typically done as new outgoing wire)"""
        try:
            refund_id = f"wire_refund_{uuid.uuid4().hex[:16]}"

            return {
                "success": True,
                "refund_id": refund_id,
                "status": "processing",
                "processor": "wire",
            }

        except Exception as e:
            logger.error(f"Wire refund error: {str(e)}")
            return {"success": False, "error": "WIRE_REFUND_ERROR", "message": str(e)}

    def get_payment_status(self, payment_id: str) -> Dict:
        """Get wire transfer status"""
        try:
            return {
                "success": True,
                "status": "processing",
                "processor": "wire",
                "details": {
                    "payment_id": payment_id,
                    "estimated_settlement": "Same day to 1 business day",
                },
            }

        except Exception as e:
            logger.error(f"Wire status check error: {str(e)}")
            return {"success": False, "error": "WIRE_STATUS_ERROR", "message": str(e)}


class SEPAPaymentProcessor(PaymentProcessor):
    """SEPA payment processor implementation"""

    def __init__(self):
        self.api_key = os.environ.get("SEPA_API_KEY")
        self.base_url = os.environ.get(
            "SEPA_BASE_URL", "https://api.sepaprovider.com/v1"
        )

    def process_payment(
        self, amount: Decimal, currency: str, payment_details: Dict
    ) -> Dict:
        """Process SEPA payment"""
        try:
            if not self.api_key:
                return {
                    "success": False,
                    "error": "SEPA_NOT_CONFIGURED",
                    "message": "SEPA processor not configured",
                }

            # SEPA is typically EUR only
            if currency.upper() != "EUR":
                return {
                    "success": False,
                    "error": "CURRENCY_NOT_SUPPORTED",
                    "message": "SEPA only supports EUR",
                }

            # SEPA requires IBAN
            if "iban" not in payment_details:
                return {
                    "success": False,
                    "error": "MISSING_IBAN",
                    "message": "IBAN is required for SEPA payments",
                }

            # Simulate SEPA payment initiation
            sepa_id = f"sepa_{uuid.uuid4().hex[:16]}"

            return {
                "success": True,
                "external_id": sepa_id,
                "status": "processing",
                "processor": "sepa",
                "estimated_settlement": "1-2 business days",
            }

        except Exception as e:
            logger.error(f"SEPA payment processing error: {str(e)}")
            return {
                "success": False,
                "error": "SEPA_PROCESSING_ERROR",
                "message": "Failed to process SEPA payment",
            }

    def refund_payment(self, payment_id: str, amount: Optional[Decimal] = None) -> Dict:
        """Refund SEPA payment"""
        try:
            refund_id = f"sepa_refund_{uuid.uuid4().hex[:16]}"

            return {
                "success": True,
                "refund_id": refund_id,
                "status": "processing",
                "processor": "sepa",
            }

        except Exception as e:
            logger.error(f"SEPA refund error: {str(e)}")
            return {"success": False, "error": "SEPA_REFUND_ERROR", "message": str(e)}

    def get_payment_status(self, payment_id: str) -> Dict:
        """Get SEPA payment status"""
        try:
            return {
                "success": True,
                "status": "processing",
                "processor": "sepa",
                "details": {
                    "payment_id": payment_id,
                    "estimated_settlement": "1-2 business days",
                },
            }

        except Exception as e:
            logger.error(f"SEPA status check error: {str(e)}")
            return {"success": False, "error": "SEPA_STATUS_ERROR", "message": str(e)}


class PaymentProcessorFactory:
    """Factory for creating payment processor instances"""

    @staticmethod
    def get_processor(processor_type: str) -> Optional[PaymentProcessor]:
        """Get payment processor instance"""
        processors = {
            "stripe": StripePaymentProcessor,
            "ach": ACHPaymentProcessor,
            "wire": WirePaymentProcessor,
            "sepa": SEPAPaymentProcessor,
        }

        processor_class = processors.get(processor_type.lower())
        if processor_class:
            return processor_class()

        return None

    @staticmethod
    def get_available_processors() -> List[str]:
        """Get list of available processors"""
        return ["stripe", "ach", "wire", "sepa"]

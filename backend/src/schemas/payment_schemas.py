"""
Payment-related Pydantic schemas for request validation
"""

from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


class ProcessPaymentRequest(BaseModel):
    """Schema for processing external payments"""

    account_id: str = Field(..., description="Account ID to credit")
    amount: Decimal = Field(..., gt=0, description="Payment amount")
    currency: str = Field(default="USD", min_length=3, max_length=3)
    payment_method: str = Field(
        ..., description="Payment method (e.g., credit_card, bank_transfer)"
    )
    description: Optional[str] = Field(None, max_length=500)
    reference: Optional[str] = Field(None, max_length=100)
    metadata: Optional[dict] = None

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        return v.upper()


class InternalTransferRequest(BaseModel):
    """Schema for internal account transfers"""

    from_account_id: str = Field(..., description="Source account ID")
    to_account_id: str = Field(..., description="Destination account ID")
    amount: Decimal = Field(..., gt=0, description="Transfer amount")
    currency: str = Field(default="USD", min_length=3, max_length=3)
    description: Optional[str] = Field(None, max_length=500)
    reference: Optional[str] = Field(None, max_length=100)

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        return v.upper()


class SendPaymentRequest(BaseModel):
    """Schema for sending payments to external recipients"""

    from_account_id: str = Field(..., description="Source account ID")
    recipient: str = Field(
        ..., description="Recipient identifier (email, phone, account)"
    )
    amount: Decimal = Field(..., gt=0, description="Payment amount")
    currency: str = Field(default="USD", min_length=3, max_length=3)
    payment_method: str = Field(..., description="Payment method")
    description: Optional[str] = Field(None, max_length=500)
    reference: Optional[str] = Field(None, max_length=100)

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        return v.upper()


class PaymentRequestCreate(BaseModel):
    """Schema for creating payment requests"""

    account_id: str = Field(..., description="Account ID requesting payment")
    amount: Decimal = Field(..., gt=0, description="Requested amount")
    currency: str = Field(default="USD", min_length=3, max_length=3)
    description: str = Field(..., min_length=1, max_length=500)
    expires_in_hours: Optional[int] = Field(default=24, gt=0, le=168)  # Max 1 week

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        return v.upper()

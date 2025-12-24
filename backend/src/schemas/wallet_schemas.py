"""
Wallet-related Pydantic schemas for request validation
"""

from typing import Optional
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator


class DepositFundsRequest(BaseModel):
    """Schema for depositing funds into an account"""

    account_id: str = Field(..., description="Account ID to deposit into")
    amount: Decimal = Field(..., gt=0, description="Deposit amount")
    currency: str = Field(default="USD", min_length=3, max_length=3)
    source: str = Field(..., description="Source of funds (e.g., bank_transfer, cash)")
    description: Optional[str] = Field(None, max_length=500)
    reference: Optional[str] = Field(None, max_length=100)

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        return v.upper()


class WithdrawFundsRequest(BaseModel):
    """Schema for withdrawing funds from an account"""

    account_id: str = Field(..., description="Account ID to withdraw from")
    amount: Decimal = Field(..., gt=0, description="Withdrawal amount")
    currency: str = Field(default="USD", min_length=3, max_length=3)
    destination: str = Field(..., description="Destination (e.g., bank_account, cash)")
    description: Optional[str] = Field(None, max_length=500)
    reference: Optional[str] = Field(None, max_length=100)

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        return v.upper()


class TransferFundsRequest(BaseModel):
    """Schema for transferring funds between accounts"""

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

    @field_validator("to_account_id")
    @classmethod
    def validate_different_accounts(cls, v: str, info: any) -> str:
        if "from_account_id" in info.data and v == info.data["from_account_id"]:
            raise ValueError("Cannot transfer to the same account")
        return v


class CreateWalletRequest(BaseModel):
    """Schema for creating a new wallet/account"""

    account_name: str = Field(..., min_length=1, max_length=100)
    account_type: str = Field(..., description="Account type (checking, savings, etc.)")
    currency: str = Field(default="USD", min_length=3, max_length=3)
    initial_balance: Optional[Decimal] = Field(default=Decimal("0.00"), ge=0)
    is_primary: Optional[bool] = Field(default=False)

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str) -> str:
        return v.upper()

    @field_validator("account_type")
    @classmethod
    def validate_account_type(cls, v: str) -> str:
        valid_types = ["checking", "savings", "credit", "investment", "business"]
        if v.lower() not in valid_types:
            raise ValueError(f'Account type must be one of: {", ".join(valid_types)}')
        return v.lower()

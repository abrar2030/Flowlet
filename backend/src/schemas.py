from pydantic import BaseModel, Field
from typing import Optional
from decimal import Decimal
from datetime import datetime

# --- Wallet MVP Schemas (for wallet_mvp.py logic) ---


class CreateWalletRequest(BaseModel):
    user_id: str = Field(..., description="ID of the user to create the wallet for.")
    account_name: str = Field(..., description="Name of the new wallet account.")
    account_type: Optional[str] = Field(
        "checking", description="Type of account (e.g., checking, savings)."
    )
    currency: Optional[str] = Field(
        "USD", description="Currency of the account (e.g., USD, EUR)."
    )
    initial_deposit: Optional[Decimal] = Field(
        Decimal("0.00"), ge=Decimal("0.00"), description="Initial deposit amount."
    )


class TransactionRequest(BaseModel):
    amount: Decimal = Field(
        ..., gt=Decimal("0.00"), description="Amount for the transaction."
    )
    description: Optional[str] = Field(
        None, description="Description of the transaction."
    )
    channel: Optional[str] = Field(
        "api", description="Channel through which the transaction is initiated."
    )


class DepositRequest(TransactionRequest):
    payment_method: Optional[str] = Field(
        "bank_transfer", description="Method of payment for the deposit."
    )


class WithdrawRequest(TransactionRequest):
    pass


class TransferRequest(TransactionRequest):
    destination_account_id: str = Field(
        ..., description="ID of the destination account for the transfer."
    )


# --- Wallet Schemas (for wallet.py logic) ---


class DepositFundsRequest(BaseModel):
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Amount to deposit.")
    description: Optional[str] = Field(None, description="Description of the deposit.")
    channel: Optional[str] = Field(
        "api", description="Channel through which the deposit is initiated."
    )


class WithdrawFundsRequest(BaseModel):
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Amount to withdraw.")
    description: Optional[str] = Field(
        None, description="Description of the withdrawal."
    )
    channel: Optional[str] = Field(
        "api", description="Channel through which the withdrawal is initiated."
    )


class TransferFundsRequest(BaseModel):
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Amount to transfer.")
    destination_account_id: str = Field(
        ..., description="ID of the destination account."
    )
    description: Optional[str] = Field(None, description="Description of the transfer.")
    channel: Optional[str] = Field(
        "api", description="Channel through which the transfer is initiated."
    )


# --- Payment Schemas (for payment.py and payment_mvp.py logic) ---


class ProcessPaymentRequest(BaseModel):
    account_id: str = Field(
        ..., description="ID of the user's account to deposit into."
    )
    amount: Decimal = Field(
        ..., gt=Decimal("0.00"), description="Amount of the payment."
    )
    currency: str = Field(..., description="Currency of the payment (e.g., USD, EUR).")
    payment_method: str = Field(
        ..., description="Payment method (e.g., stripe, paypal)."
    )
    payment_details: dict = Field(
        ...,
        description="Details specific to the payment method (e.g., token, card info).",
    )
    description: Optional[str] = Field(None, description="Description of the payment.")


class InternalTransferRequest(BaseModel):
    from_wallet_id: str = Field(..., description="ID of the source wallet.")
    to_wallet_id: str = Field(..., description="ID of the destination wallet.")
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Amount to transfer.")
    description: Optional[str] = Field(None, description="Description of the transfer.")
    reference: Optional[str] = Field(
        None, description="External reference number for the transfer."
    )


class SendPaymentRequest(InternalTransferRequest):
    recipient_identifier: str = Field(
        ..., description="Recipient's identifier (e.g., email, phone)."
    )
    recipient_type: str = Field(
        ..., description="Type of recipient identifier (e.g., email, phone, account)."
    )


class PaymentRequestCreate(BaseModel):
    from_wallet_id: str = Field(
        ..., description="ID of the wallet requesting the payment."
    )
    amount: Decimal = Field(..., gt=Decimal("0.00"), description="Amount requested.")
    description: Optional[str] = Field(
        None, description="Description of the payment request."
    )
    expires_at: Optional[datetime] = Field(
        None, description="Expiration date of the request."
    )

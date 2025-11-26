import random
import string
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    BigInteger,  # Added BigInteger from app/
)
from sqlalchemy.orm import relationship

from .database import Base, db


class TransactionType(PyEnum):
    """Types of transactions - Merged from both"""

    DEBIT = "debit"
    CREDIT = "credit"
    TRANSFER = "transfer"
    PAYMENT = "payment"
    REFUND = "refund"
    FEE = "fee"
    INTEREST = "interest"
    ADJUSTMENT = "adjustment"


class TransactionStatus(PyEnum):
    """Transaction status options - Merged from both"""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REVERSED = "reversed"


class TransactionCategory(PyEnum):
    """Transaction categories for reporting and analysis - Merged from both"""

    TRANSFER = "transfer"
    PAYMENT = "payment"
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    PURCHASE = "purchase"
    REFUND = "refund"
    FEE = "fee"
    INTEREST = "interest"
    OTHER = "other"


class Transaction(Base):
    """Financial transaction model with comprehensive tracking and compliance features"""

    __tablename__ = "transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Relationships
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False)
    card_id = Column(
        String(36), ForeignKey("cards.id"), nullable=True
    )  # If card transaction
    user = relationship("User", backref="transactions")
    account = relationship("Account", back_populates="transactions")
    card = relationship("Card", back_populates="transactions")

    # Transaction identification
    transaction_id = Column(String(50), unique=True, nullable=False, index=True)
    reference_number = Column(String(100), index=True)  # External reference

    # Transaction details
    transaction_type = Column(db.Enum(TransactionType), nullable=False)
    transaction_category = Column(db.Enum(TransactionCategory), nullable=False)
    status = Column(
        db.Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False
    )

    # Amount information (using Numeric/Decimal from src/ for precision)
    amount = Column(Numeric(precision=20, scale=8), nullable=False)
    currency = Column(
        String(3), default="USD", nullable=False
    )  # ISO 4217 currency code

    # Amount information (using BigInteger from app/ for cents - keeping for now)
    amount_cents = Column(BigInteger, nullable=True)

    # Exchange rate information (for multi-currency transactions)
    original_amount = Column(
        Numeric(precision=20, scale=8)
    )  # Original amount in source currency
    original_currency = Column(String(3))  # Source currency
    exchange_rate = Column(Numeric(10, 6))  # Exchange rate used

    # Exchange rate information (using BigInteger from app/ for cents - keeping for now)
    original_amount_cents = Column(BigInteger)

    # Transaction parties
    description = Column(String(500), nullable=False)
    merchant_name = Column(String(200))
    merchant_category_code = Column(String(10))  # MCC code

    # Location information
    transaction_location = Column(String(200))
    country_code = Column(String(2))  # ISO 3166-1 alpha-2

    # Processing information
    processed_at = Column(DateTime(timezone=True))
    settlement_date = Column(Date)
    authorization_code = Column(String(20))

    # Balances after transaction (using Numeric/Decimal from src/)
    balance_before = Column(Numeric(precision=20, scale=8))
    balance_after = Column(Numeric(precision=20, scale=8))

    # Balances after transaction (using BigInteger from app/ for cents - keeping for now)
    balance_before_cents = Column(BigInteger)
    balance_after_cents = Column(BigInteger)

    # Fees and charges (using Numeric/Decimal from src/)
    fee_amount = Column(Numeric(20, 8), default=Decimal("0.00"))
    fee_description = Column(String(200))

    # Fees and charges (using BigInteger from app/ for cents - keeping for now)
    fee_amount_cents = Column(BigInteger, default=0)

    # Risk and compliance
    risk_score = Column(Integer, default=0)
    is_suspicious = Column(Boolean, default=False)
    aml_flagged = Column(Boolean, default=False)
    compliance_notes = Column(Text)

    # Fraud detection
    fraud_score = Column(Integer, default=0)
    fraud_reason = Column(String(500))
    is_disputed = Column(Boolean, default=False)
    dispute_reason = Column(String(500))

    # Technical details
    channel = Column(String(50))  # web, mobile, atm, pos, etc.
    device_fingerprint = Column(String(255))
    ip_address = Column(String(45))  # IPv6 compatible
    user_agent = Column(String(500))

    # Audit fields
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Related transactions (for transfers, reversals, etc.)
    parent_transaction_id = Column(String(36), ForeignKey("transactions.id"))
    related_transactions = relationship(
        "Transaction", backref=db.backref("parent_transaction", remote_side=[id])
    )

    # Indexes
    __table_args__ = (
        Index("idx_transaction_account_date", "account_id", "created_at"),
        Index("idx_transaction_status", "status"),
        Index("idx_transaction_type", "transaction_type"),
        Index("idx_transaction_reference", "reference_number"),
        Index("idx_transaction_risk", "risk_score"),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.transaction_id:
            self.transaction_id = self.generate_transaction_id()

    @staticmethod
    def generate_transaction_id():
        """Generate a unique transaction ID"""
        # Format: TXN-YYYYMMDD-XXXXXXXX (where X is alphanumeric)
        date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        random_str = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=8)
        )
        return f"TXN-{date_str}-{random_str}"

    # Methods from app/ (using cents)
    def get_amount_decimal(self):
        """Get transaction amount as Decimal"""
        if self.amount_cents is not None:
            return Decimal(self.amount_cents) / 100
        return self.amount

    def set_amount(self, amount):
        """Set transaction amount from Decimal"""
        self.amount = amount
        self.amount_cents = int(amount * 100)

    def get_original_amount_decimal(self):
        """Get original amount as Decimal"""
        if self.original_amount_cents is not None:
            return Decimal(self.original_amount_cents) / 100
        return self.original_amount

    def set_original_amount(self, amount):
        """Set original amount from Decimal"""
        self.original_amount = amount
        self.original_amount_cents = int(amount * 100)

    def get_fee_amount_decimal(self):
        """Get fee amount as Decimal"""
        if self.fee_amount_cents is not None:
            return Decimal(self.fee_amount_cents) / 100
        return self.fee_amount

    def set_fee_amount(self, amount):
        """Set fee amount from Decimal"""
        self.fee_amount = amount
        self.fee_amount_cents = int(amount * 100)

    def get_balance_before_decimal(self):
        """Get balance before transaction as Decimal"""
        if self.balance_before_cents is not None:
            return Decimal(self.balance_before_cents) / 100
        return self.balance_before

    def get_balance_after_decimal(self):
        """Get balance after transaction as Decimal"""
        if self.balance_after_cents is not None:
            return Decimal(self.balance_after_cents) / 100
        return self.balance_after

    def mark_as_completed(self):
        """Mark transaction as completed"""
        self.status = TransactionStatus.COMPLETED
        self.processed_at = datetime.now(timezone.utc)

    def mark_as_failed(self, reason=None):
        """Mark transaction as failed"""
        self.status = TransactionStatus.FAILED
        if reason:
            self.compliance_notes = reason

    def reverse_transaction(self, reason=None):
        """Create a reversal transaction"""
        if self.status != TransactionStatus.COMPLETED:
            raise ValueError("Can only reverse completed transactions")

        # Create reversal transaction
        reversal = Transaction(
            transaction_type=TransactionType.ADJUSTMENT,
            transaction_category=TransactionCategory.REFUND,
            status=TransactionStatus.COMPLETED,
            amount=-self.amount,  # Negative amount for reversal
            currency=self.currency,
            description=f"Reversal of {self.transaction_id}",
            user_id=self.user_id,
            account_id=self.account_id,
            parent_transaction_id=self.id,
            processed_at=datetime.now(timezone.utc),
            compliance_notes=reason or "Transaction reversal",
        )

        # Mark original transaction as reversed
        self.status = TransactionStatus.REVERSED

        return reversal

    def flag_as_suspicious(self, reason=None):
        """Flag transaction as suspicious for AML review"""
        self.is_suspicious = True
        self.aml_flagged = True
        if reason:
            self.compliance_notes = reason

    def calculate_risk_score(self):
        """Calculate risk score based on various factors"""
        risk_score = 0

        # Amount-based risk
        amount = self.get_amount_decimal()
        if amount and amount > 10000:  # Large transactions
            risk_score += 30
        elif amount and amount > 5000:
            risk_score += 15
        elif amount and amount > 1000:
            risk_score += 5

        # Time-based risk (transactions outside business hours)
        if self.created_at:
            hour = self.created_at.hour
            if hour < 6 or hour > 22:  # Outside 6 AM - 10 PM
                risk_score += 10

        # Location-based risk (international transactions)
        if self.country_code and self.country_code != "US":
            risk_score += 20

        self.risk_score = min(risk_score, 100)  # Cap at 100
        return self.risk_score

    def is_high_risk(self):
        """Check if transaction is high risk"""
        return self.risk_score >= 70 or self.is_suspicious or self.aml_flagged

    def to_dict(self, include_sensitive=False):
        """Convert transaction to dictionary for API responses"""
        data = {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "transaction_type": self.transaction_type.value,
            "transaction_category": self.transaction_category.value,
            "status": self.status.value,
            "amount": float(self.amount) if self.amount is not None else None,
            "currency": self.currency,
            "description": self.description,
            "merchant_name": self.merchant_name,
            "created_at": self.created_at.isoformat(),
            "processed_at": (
                self.processed_at.isoformat() if self.processed_at else None
            ),
            "channel": self.channel,
        }

        if include_sensitive:
            data.update(
                {
                    "reference_number": self.reference_number,
                    "authorization_code": self.authorization_code,
                    "balance_before": (
                        float(self.balance_before)
                        if self.balance_before is not None
                        else None
                    ),
                    "balance_after": (
                        float(self.balance_after)
                        if self.balance_after is not None
                        else None
                    ),
                    "fee_amount": (
                        float(self.fee_amount) if self.fee_amount is not None else None
                    ),
                    "risk_score": self.risk_score,
                    "fraud_score": self.fraud_score,
                    "is_suspicious": self.is_suspicious,
                    "aml_flagged": self.aml_flagged,
                    "ip_address": self.ip_address,
                    "transaction_location": self.transaction_location,
                    "country_code": self.country_code,
                }
            )

            # Include exchange rate info if applicable
            if self.original_amount:
                data.update(
                    {
                        "original_amount": float(self.original_amount),
                        "original_currency": self.original_currency,
                        "exchange_rate": (
                            float(self.exchange_rate)
                            if self.exchange_rate is not None
                            else None
                        ),
                    }
                )

        return data

    def __repr__(self):
        return f"<Transaction {self.transaction_id} ({self.transaction_type.value}: {self.amount} {self.currency})>"

import random
import string
import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import (
    Base,
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
    Transaction,
)


class TransactionType(PyEnum):
    """Types of transactions"""

    DEBIT = "debit"
    CREDIT = "credit"
    TRANSFER = "transfer"
    PAYMENT = "payment"
    REFUND = "refund"
    FEE = "fee"
    INTEREST = "interest"
    ADJUSTMENT = "adjustment"


class TransactionStatus(PyEnum):
    """Transaction status options"""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REVERSED = "reversed"


class TransactionCategory(PyEnum):
    """Transaction categories for reporting and analysis"""

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

    __tablename__ = (
        "transactions"  # Changed from 'enhanced_transactions' to 'transactions'
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Relationships
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False)
    card_id = Column(
        String(36), ForeignKey("cards.id"), nullable=True
    )  # If card transaction

    # Transaction identification
    transaction_id = Column(String(50), unique=True, nullable=False, index=True)
    reference_number = Column(String(100), index=True)  # External reference

    # Transaction details
    transaction_type = Column(db.Enum(TransactionType), nullable=False)
    transaction_category = Column(db.Enum(TransactionCategory), nullable=False)
    status = Column(
        db.Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False
    )

    # Amount information (using Numeric/Decimal for precision)
    amount = Column(Numeric(precision=20, scale=8), nullable=False)
    currency = Column(
        String(3), default="USD", nullable=False
    )  # ISO 4217 currency code

    # Exchange rate information (for multi-currency transactions)
    original_amount = Column(
        Numeric(precision=20, scale=8)
    )  # Original amount in source currency
    original_currency = Column(String(3))  # Source currency
    exchange_rate = Column(Numeric(10, 6))  # Exchange rate used

    # Transaction parties
    description = Column(String(500), nullable=False)
    merchant_name = Column(String(200))
    merchant_category_code = Column(String(10))  # MCC code

    # Location information
    transaction_location = Column(String(200))
    country_code = Column(String(2))  # ISO 3166-1 alpha-2

    # Processing information
    processed_at = Column(DateTime)
    settlement_date = Column(Date)
    authorization_code = Column(String(20))

    # Balances after transaction
    balance_before = Column(Numeric(precision=20, scale=8))
    balance_after = Column(Numeric(precision=20, scale=8))

    # Fees and charges
    fee_amount = Column(Numeric(20, 8), default=Decimal("0.00"))
    fee_description = Column(String(200))

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
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User")
    account = relationship("Account", back_populates="transactions")
    card = relationship("Card")

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
        date_str = datetime.now().strftime("%Y%m%d")
        random_str = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=8)
        )

        return f"TXN-{date_str}-{random_str}"

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

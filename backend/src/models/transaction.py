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
    BigInteger,
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
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False)
    card_id = Column(String(36), ForeignKey("cards.id"), nullable=True)
    user = relationship("User", backref="transactions")
    account = relationship("Account", back_populates="transactions")
    card = relationship("Card", back_populates="transactions")
    transaction_id = Column(String(50), unique=True, nullable=False, index=True)
    reference_number = Column(String(100), index=True)
    transaction_type = Column(db.Enum(TransactionType), nullable=False)
    transaction_category = Column(db.Enum(TransactionCategory), nullable=False)
    status = Column(
        db.Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False
    )
    amount = Column(Numeric(precision=20, scale=8), nullable=False)
    currency = Column(String(3), default="USD", nullable=False)
    amount_cents = Column(BigInteger, nullable=True)
    original_amount = Column(Numeric(precision=20, scale=8))
    original_currency = Column(String(3))
    exchange_rate = Column(Numeric(10, 6))
    original_amount_cents = Column(BigInteger)
    description = Column(String(500), nullable=False)
    merchant_name = Column(String(200))
    merchant_category_code = Column(String(10))
    transaction_location = Column(String(200))
    country_code = Column(String(2))
    processed_at = Column(DateTime(timezone=True))
    settlement_date = Column(Date)
    authorization_code = Column(String(20))
    balance_before = Column(Numeric(precision=20, scale=8))
    balance_after = Column(Numeric(precision=20, scale=8))
    balance_before_cents = Column(BigInteger)
    balance_after_cents = Column(BigInteger)
    fee_amount = Column(Numeric(20, 8), default=Decimal("0.00"))
    fee_description = Column(String(200))
    fee_amount_cents = Column(BigInteger, default=0)
    risk_score = Column(Integer, default=0)
    is_suspicious = Column(Boolean, default=False)
    aml_flagged = Column(Boolean, default=False)
    compliance_notes = Column(Text)
    fraud_score = Column(Integer, default=0)
    fraud_reason = Column(String(500))
    is_disputed = Column(Boolean, default=False)
    dispute_reason = Column(String(500))
    channel = Column(String(50))
    device_fingerprint = Column(String(255))
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    parent_transaction_id = Column(String(36), ForeignKey("transactions.id"))
    related_transactions = relationship(
        "Transaction", backref=db.backref("parent_transaction", remote_side=[id])
    )
    __table_args__ = (
        Index("idx_transaction_account_date", "account_id", "created_at"),
        Index("idx_transaction_status", "status"),
        Index("idx_transaction_type", "transaction_type"),
        Index("idx_transaction_reference", "reference_number"),
        Index("idx_transaction_risk", "risk_score"),
    )

    def __init__(self, **kwargs) -> Any:
        super().__init__(**kwargs)
        if not self.transaction_id:
            self.transaction_id = self.generate_transaction_id()

    @staticmethod
    def generate_transaction_id() -> Any:
        """Generate a unique transaction ID"""
        date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        random_str = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=8)
        )
        return f"TXN-{date_str}-{random_str}"

    def get_amount_decimal(self) -> Any:
        """Get transaction amount as Decimal"""
        if self.amount_cents is not None:
            return Decimal(self.amount_cents) / 100
        return self.amount

    def set_amount(self, amount: Any) -> Any:
        """Set transaction amount from Decimal"""
        self.amount = amount
        self.amount_cents = int(amount * 100)

    def get_original_amount_decimal(self) -> Any:
        """Get original amount as Decimal"""
        if self.original_amount_cents is not None:
            return Decimal(self.original_amount_cents) / 100
        return self.original_amount

    def set_original_amount(self, amount: Any) -> Any:
        """Set original amount from Decimal"""
        self.original_amount = amount
        self.original_amount_cents = int(amount * 100)

    def get_fee_amount_decimal(self) -> Any:
        """Get fee amount as Decimal"""
        if self.fee_amount_cents is not None:
            return Decimal(self.fee_amount_cents) / 100
        return self.fee_amount

    def set_fee_amount(self, amount: Any) -> Any:
        """Set fee amount from Decimal"""
        self.fee_amount = amount
        self.fee_amount_cents = int(amount * 100)

    def get_balance_before_decimal(self) -> Any:
        """Get balance before transaction as Decimal"""
        if self.balance_before_cents is not None:
            return Decimal(self.balance_before_cents) / 100
        return self.balance_before

    def get_balance_after_decimal(self) -> Any:
        """Get balance after transaction as Decimal"""
        if self.balance_after_cents is not None:
            return Decimal(self.balance_after_cents) / 100
        return self.balance_after

    def mark_as_completed(self) -> Any:
        """Mark transaction as completed"""
        self.status = TransactionStatus.COMPLETED
        self.processed_at = datetime.now(timezone.utc)

    def mark_as_failed(self, reason: Any = None) -> Any:
        """Mark transaction as failed"""
        self.status = TransactionStatus.FAILED
        if reason:
            self.compliance_notes = reason

    def reverse_transaction(self, reason: Any = None) -> Any:
        """Create a reversal transaction"""
        if self.status != TransactionStatus.COMPLETED:
            raise ValueError("Can only reverse completed transactions")
        reversal = Transaction(
            transaction_type=TransactionType.ADJUSTMENT,
            transaction_category=TransactionCategory.REFUND,
            status=TransactionStatus.COMPLETED,
            amount=-self.amount,
            currency=self.currency,
            description=f"Reversal of {self.transaction_id}",
            user_id=self.user_id,
            account_id=self.account_id,
            parent_transaction_id=self.id,
            processed_at=datetime.now(timezone.utc),
            compliance_notes=reason or "Transaction reversal",
        )
        self.status = TransactionStatus.REVERSED
        return reversal

    def flag_as_suspicious(self, reason: Any = None) -> Any:
        """Flag transaction as suspicious for AML review"""
        self.is_suspicious = True
        self.aml_flagged = True
        if reason:
            self.compliance_notes = reason

    def calculate_risk_score(self) -> Any:
        """Calculate risk score based on various factors"""
        risk_score = 0
        amount = self.get_amount_decimal()
        if amount and amount > 10000:
            risk_score += 30
        elif amount and amount > 5000:
            risk_score += 15
        elif amount and amount > 1000:
            risk_score += 5
        if self.created_at:
            hour = self.created_at.hour
            if hour < 6 or hour > 22:
                risk_score += 10
        if self.country_code and self.country_code != "US":
            risk_score += 20
        self.risk_score = min(risk_score, 100)
        return self.risk_score

    def is_high_risk(self) -> Any:
        """Check if transaction is high risk"""
        return self.risk_score >= 70 or self.is_suspicious or self.aml_flagged

    def to_dict(self, include_sensitive: Any = False) -> Any:
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

    def __repr__(self) -> Any:
        return f"<Transaction {self.transaction_id} ({self.transaction_type.value}: {self.amount} {self.currency})>"

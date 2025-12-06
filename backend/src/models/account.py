import random
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum as PyEnum
from sqlalchemy import (
    Boolean,
    Column,
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


class AccountType(PyEnum):
    """Account types - Merged from both"""

    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT = "credit"
    INVESTMENT = "investment"
    BUSINESS = "business"


class AccountStatus(PyEnum):
    """Account status - Merged from both"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    CLOSED = "closed"
    FROZEN = "frozen"
    PENDING_APPROVAL = "pending_approval"


class Account(Base):
    """Account model with merged features"""

    __tablename__ = "accounts"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="wallets")
    transactions = relationship("Transaction", back_populates="account", lazy="dynamic")
    cards = relationship("Card", back_populates="account", lazy="dynamic")
    account_name = Column(String(100), nullable=False)
    account_number = Column(String(20), unique=True, nullable=False, index=True)
    account_type = Column(db.Enum(AccountType), nullable=False)
    status = Column(
        db.Enum(AccountStatus), default=AccountStatus.ACTIVE, nullable=False
    )
    currency = Column(String(3), default="USD", nullable=False)
    is_primary = Column(Boolean, nullable=False, default=False)
    overdraft_protection = Column(Boolean, nullable=False, default=False)
    balance = Column(
        Numeric(precision=20, scale=8), default=Decimal("0.00000000"), nullable=False
    )
    available_balance = Column(
        Numeric(precision=20, scale=8), default=Decimal("0.00000000"), nullable=False
    )
    pending_balance = Column(
        Numeric(precision=20, scale=8), default=Decimal("0.00000000"), nullable=False
    )
    available_balance_cents = Column(BigInteger, nullable=True, default=0)
    current_balance_cents = Column(BigInteger, nullable=True, default=0)
    pending_balance_cents = Column(BigInteger, nullable=True, default=0)
    daily_limit = Column(Numeric(20, 2), default=Decimal("5000.00"), nullable=False)
    monthly_limit = Column(Numeric(20, 2), default=Decimal("50000.00"), nullable=False)
    yearly_limit = Column(Numeric(20, 2), default=Decimal("500000.00"), nullable=False)
    daily_limit_cents = Column(BigInteger, nullable=True)
    monthly_limit_cents = Column(BigInteger, nullable=True)
    yearly_limit_cents = Column(BigInteger, nullable=True)
    interest_rate = Column(Numeric(5, 4), default=Decimal("0.0000"))
    overdraft_limit = Column(Numeric(20, 2), default=Decimal("0.00"))
    minimum_balance = Column(Numeric(20, 2), default=Decimal("0.00"))
    monthly_fee_cents = Column(BigInteger, nullable=False, default=0)
    credit_limit_cents = Column(BigInteger, nullable=True, default=0)
    minimum_payment_cents = Column(BigInteger, nullable=True, default=0)
    routing_number = Column(String(9), nullable=True)
    swift_code = Column(String(11), nullable=True)
    iban = Column(String(34), nullable=True)
    risk_score = Column(Integer, default=0)
    last_activity_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    dormant_since = Column(DateTime(timezone=True), nullable=True)
    opened_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    closed_at = Column(DateTime(timezone=True), nullable=True)
    last_statement_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    __table_args__ = (
        Index("idx_account_user_currency", "user_id", "currency"),
        Index("idx_account_status", "status"),
    )

    def __init__(self, **kwargs) -> Any:
        super().__init__(**kwargs)
        if not self.account_number:
            self.account_number = self.generate_account_number()

    @staticmethod
    def generate_account_number() -> Any:
        return "".join([str(random.randint(0, 9)) for _ in range(16)])

    @property
    def available_balance_cents_prop(self) -> Decimal:
        """Get available balance as Decimal from cents"""
        return Decimal(self.available_balance_cents) / 100

    @available_balance_cents_prop.setter
    def available_balance_cents_prop(self, value: Decimal) -> None:
        """Set available balance from Decimal to cents"""
        self.available_balance_cents = int(Decimal(str(value)) * 100)

    @property
    def current_balance_cents_prop(self) -> Decimal:
        """Get current balance as Decimal from cents"""
        return Decimal(self.current_balance_cents) / 100

    @current_balance_cents_prop.setter
    def current_balance_cents_prop(self, value: Decimal) -> None:
        """Set current balance from Decimal to cents"""
        self.current_balance_cents = int(Decimal(str(value)) * 100)

    @property
    def pending_balance_cents_prop(self) -> Decimal:
        """Get pending balance as Decimal from cents"""
        return Decimal(self.pending_balance_cents) / 100

    @pending_balance_cents_prop.setter
    def pending_balance_cents_prop(self, value: Decimal) -> None:
        """Set pending balance from Decimal to cents"""
        self.pending_balance_cents = int(Decimal(str(value)) * 100)

    @property
    def credit_limit(self) -> Decimal:
        """Get credit limit as Decimal from cents"""
        if self.credit_limit_cents is None:
            return Decimal("0")
        return Decimal(self.credit_limit_cents) / 100

    @credit_limit.setter
    def credit_limit(self, value: Decimal) -> None:
        """Set credit limit from Decimal to cents"""
        self.credit_limit_cents = int(Decimal(str(value)) * 100)

    @property
    def daily_limit_cents_prop(self) -> Decimal:
        """Get daily limit as Decimal from cents"""
        if self.daily_limit_cents is None:
            return Decimal("5000")
        return Decimal(self.daily_limit_cents) / 100

    @daily_limit_cents_prop.setter
    def daily_limit_cents_prop(self, value: Decimal) -> None:
        """Set daily limit from Decimal to cents"""
        self.daily_limit_cents = int(Decimal(str(value)) * 100)

    def format_currency(self, amount_cents: int) -> str:
        """Format currency amount for display"""
        amount = Decimal(amount_cents) / 100
        return f"${amount:,.2f}"

    def can_withdraw(self, amount: Decimal) -> bool:
        """Check if withdrawal is allowed"""
        if self.status != AccountStatus.ACTIVE:
            return False
        if self.account_type == AccountType.CREDIT:
            return amount <= self.credit_limit - self.current_balance_cents_prop
        else:
            return amount <= self.available_balance_cents_prop

    def is_over_limit(self, amount: Decimal) -> bool:
        """Check if transaction would exceed daily limit"""
        return amount > self.daily_limit_cents_prop

    def get_masked_account_number(self) -> str:
        """Get masked account number for display"""
        if len(self.account_number) <= 4:
            return self.account_number
        return f"****{self.account_number[-4:]}"

    def calculate_available_credit(self) -> Decimal:
        """Calculate available credit for credit accounts"""
        if self.account_type != AccountType.CREDIT:
            return Decimal("0")
        return self.credit_limit - self.current_balance_cents_prop

    def is_active(self) -> bool:
        """Check if account is active"""
        return self.status == AccountStatus.ACTIVE and self.deleted_at is None

    def close_account(self, reason: str = None) -> None:
        """Close the account"""
        self.status = AccountStatus.CLOSED
        self.closed_at = datetime.now(timezone.utc)

    def freeze_account(self, reason: str = None) -> None:
        """Freeze the account"""
        self.status = AccountStatus.FROZEN

    def to_dict(self, include_sensitive: Any = False) -> Any:
        """Convert to dictionary with optional sensitive data - Merged from both"""
        data = {
            "id": self.id,
            "account_name": self.account_name,
            "account_number": self.get_masked_account_number(),
            "account_type": self.account_type.value,
            "status": self.status.value,
            "currency": self.currency,
            "balance": float(self.balance),
            "available_balance": float(self.available_balance),
            "created_at": self.created_at.isoformat(),
            "is_primary": self.is_primary,
            "opened_at": self.opened_at.isoformat() if self.opened_at else None,
        }
        if self.account_type == AccountType.CREDIT:
            data.update(
                {
                    "credit_limit": str(self.credit_limit),
                    "available_credit": str(self.calculate_available_credit()),
                }
            )
        if include_sensitive:
            data.update(
                {
                    "account_number": self.account_number,
                    "routing_number": self.routing_number,
                    "swift_code": self.swift_code,
                    "iban": self.iban,
                    "daily_limit": float(self.daily_limit),
                    "monthly_limit": float(self.monthly_limit),
                    "yearly_limit": float(self.yearly_limit),
                    "pending_balance": float(self.pending_balance),
                    "interest_rate": float(self.interest_rate),
                    "overdraft_limit": float(self.overdraft_limit),
                    "minimum_balance": float(self.minimum_balance),
                    "risk_score": self.risk_score,
                }
            )
        return data

    def __repr__(self) -> Any:
        return f"<Account {self.account_number} ({self.account_type.value})>"

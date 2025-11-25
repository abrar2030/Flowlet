import enum
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from app import db
from sqlalchemy import (UUID, Account, BigInteger, Boolean, Column, DateTime,
                        Enum, ForeignKey, String)


class AccountType(enum.Enum):
    """Account types"""

    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT = "credit"
    INVESTMENT = "investment"
    BUSINESS = "business"


class AccountStatus(enum.Enum):
    """Account status"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    FROZEN = "frozen"
    CLOSED = "closed"
    PENDING_APPROVAL = "pending_approval"


class Account(db.Model):
    """Account model with improved financial data handling"""

    __tablename__ = "accounts"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign key to user
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )

    # Account details
    account_name = Column(String(255), nullable=False)
    account_number = Column(String(20), nullable=False, unique=True, index=True)
    account_type = Column(
        Enum(AccountType), nullable=False, default=AccountType.CHECKING
    )
    currency = Column(String(3), nullable=False, default="USD")

    # Balances (stored as cents to avoid floating point issues)
    available_balance_cents = Column(BigInteger, nullable=False, default=0)
    current_balance_cents = Column(BigInteger, nullable=False, default=0)
    pending_balance_cents = Column(BigInteger, nullable=False, default=0)

    # Credit accounts specific fields
    credit_limit_cents = Column(BigInteger, nullable=True, default=0)
    minimum_payment_cents = Column(BigInteger, nullable=True, default=0)

    # Account limits and settings
    daily_limit_cents = Column(BigInteger, nullable=True)
    monthly_limit_cents = Column(BigInteger, nullable=True)
    yearly_limit_cents = Column(BigInteger, nullable=True)

    # Status and flags
    status = Column(
        Enum(AccountStatus), nullable=False, default=AccountStatus.PENDING_APPROVAL
    )
    is_primary = Column(Boolean, nullable=False, default=False)
    overdraft_protection = Column(Boolean, nullable=False, default=False)

    # Banking details
    routing_number = Column(String(9), nullable=True)
    swift_code = Column(String(11), nullable=True)
    iban = Column(String(34), nullable=True)

    # Interest and fees
    interest_rate = Column(db.Numeric(5, 4), nullable=True)  # e.g., 0.0250 for 2.5%
    monthly_fee_cents = Column(BigInteger, nullable=False, default=0)

    # Compliance and audit
    opened_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    closed_at = Column(DateTime(timezone=True), nullable=True)
    last_statement_date = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Soft delete
    deleted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", backref="accounts")

    # Balance property methods
    @property
    def available_balance(self) -> Decimal:
        """Get available balance as Decimal"""
        return Decimal(self.available_balance_cents) / 100

    @available_balance.setter
    def available_balance(self, value: Decimal) -> None:
        """Set available balance from Decimal"""
        self.available_balance_cents = int(Decimal(str(value)) * 100)

    @property
    def current_balance(self) -> Decimal:
        """Get current balance as Decimal"""
        return Decimal(self.current_balance_cents) / 100

    @current_balance.setter
    def current_balance(self, value: Decimal) -> None:
        """Set current balance from Decimal"""
        self.current_balance_cents = int(Decimal(str(value)) * 100)

    @property
    def pending_balance(self) -> Decimal:
        """Get pending balance as Decimal"""
        return Decimal(self.pending_balance_cents) / 100

    @pending_balance.setter
    def pending_balance(self, value: Decimal) -> None:
        """Set pending balance from Decimal"""
        self.pending_balance_cents = int(Decimal(str(value)) * 100)

    @property
    def credit_limit(self) -> Decimal:
        """Get credit limit as Decimal"""
        if self.credit_limit_cents is None:
            return Decimal("0")
        return Decimal(self.credit_limit_cents) / 100

    @credit_limit.setter
    def credit_limit(self, value: Decimal) -> None:
        """Set credit limit from Decimal"""
        self.credit_limit_cents = int(Decimal(str(value)) * 100)

    @property
    def daily_limit(self) -> Decimal:
        """Get daily limit as Decimal"""
        if self.daily_limit_cents is None:
            return Decimal("5000")  # Default $5,000
        return Decimal(self.daily_limit_cents) / 100

    @daily_limit.setter
    def daily_limit(self, value: Decimal) -> None:
        """Set daily limit from Decimal"""
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
            # For credit accounts, check against credit limit
            return amount <= (self.credit_limit - self.current_balance)
        else:
            # For other accounts, check against available balance
            return amount <= self.available_balance

    def is_over_limit(self, amount: Decimal) -> bool:
        """Check if transaction would exceed daily limit"""
        return amount > self.daily_limit

    def get_masked_account_number(self) -> str:
        """Get masked account number for display"""
        if len(self.account_number) <= 4:
            return self.account_number
        return f"****{self.account_number[-4:]}"

    def calculate_available_credit(self) -> Decimal:
        """Calculate available credit for credit accounts"""
        if self.account_type != AccountType.CREDIT:
            return Decimal("0")

        return self.credit_limit - self.current_balance

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

    def to_dict(self, include_sensitive: bool = False) -> dict:
        """Convert to dictionary with optional sensitive data"""
        data = {
            "id": str(self.id),
            "account_name": self.account_name,
            "account_number": self.get_masked_account_number(),
            "account_type": self.account_type.value,
            "currency": self.currency,
            "available_balance": str(self.available_balance),
            "current_balance": str(self.current_balance),
            "status": self.status.value,
            "is_primary": self.is_primary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
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
                    "account_number": self.account_number,  # Full account number
                    "routing_number": self.routing_number,
                    "swift_code": self.swift_code,
                    "iban": self.iban,
                    "daily_limit": str(self.daily_limit),
                    "pending_balance": str(self.pending_balance),
                }
            )

        return data

    def __repr__(self):
        return f"<Account {self.account_number} ({self.account_type.value})>"

"""
Account model for financial account management
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum

from src.models.database import UUID, TimestampMixin, UUIDMixin, db


class AccountType(Enum):
    """Types of financial accounts"""

    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT = "credit"
    INVESTMENT = "investment"
    BUSINESS = "business"


class AccountStatus(Enum):
    """Account status options"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    CLOSED = "closed"
    FROZEN = "frozen"


class Account(db.Model, TimestampMixin, UUIDMixin):
    """Financial account model with enhanced security and compliance features"""

    __tablename__ = "enhanced_accounts"

    # Account identification
    account_number = db.Column(db.String(20), unique=True, nullable=False, index=True)
    account_name = db.Column(db.String(100), nullable=False)
    account_type = db.Column(db.Enum(AccountType), nullable=False)

    # Account status and settings
    status = db.Column(
        db.Enum(AccountStatus), default=AccountStatus.ACTIVE, nullable=False
    )
    currency = db.Column(
        db.String(3), default="USD", nullable=False
    )  # ISO 4217 currency code

    # Balance information (stored as integers to avoid floating point issues)
    # Multiply by 100 for cents, divide by 100 for dollars
    available_balance = db.Column(
        db.BigInteger, default=0, nullable=False
    )  # Available balance in cents
    current_balance = db.Column(
        db.BigInteger, default=0, nullable=False
    )  # Current balance in cents
    pending_balance = db.Column(
        db.BigInteger, default=0, nullable=False
    )  # Pending transactions in cents

    # Limits and restrictions
    daily_limit = db.Column(
        db.BigInteger, default=500000, nullable=False
    )  # $5,000 default daily limit
    monthly_limit = db.Column(
        db.BigInteger, default=5000000, nullable=False
    )  # $50,000 default monthly limit
    yearly_limit = db.Column(
        db.BigInteger, default=50000000, nullable=False
    )  # $500,000 default yearly limit

    # Interest and fees (for savings/credit accounts)
    interest_rate = db.Column(db.Numeric(5, 4), default=0.0000)  # Annual interest rate
    overdraft_limit = db.Column(db.BigInteger, default=0)  # Overdraft limit in cents
    minimum_balance = db.Column(
        db.BigInteger, default=0
    )  # Minimum balance requirement in cents

    # Compliance and risk management
    risk_score = db.Column(db.Integer, default=0)
    last_activity_at = db.Column(db.DateTime)
    dormant_since = db.Column(db.DateTime)  # When account became dormant

    # Relationships
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False)
    transactions = db.relationship(
        "Transaction",
        backref="account",
        lazy="dynamic",
        foreign_keys="Transaction.account_id",
    )

    def __init__(self, **kwargs):
        super(Account, self).__init__(**kwargs)
        if not self.account_number:
            self.account_number = self.generate_account_number()

    @staticmethod
    def generate_account_number():
        """Generate a unique account number"""
        # Generate a 16-digit account number
        import random

        while True:
            account_number = "".join([str(random.randint(0, 9)) for _ in range(16)])
            # Ensure it doesn't already exist
            if not Account.query.filter_by(account_number=account_number).first():
                return account_number

    def get_available_balance_decimal(self):
        """Get available balance as Decimal"""
        return Decimal(self.available_balance) / 100

    def get_current_balance_decimal(self):
        """Get current balance as Decimal"""
        return Decimal(self.current_balance) / 100

    def get_pending_balance_decimal(self):
        """Get pending balance as Decimal"""
        return Decimal(self.pending_balance) / 100

    def set_available_balance(self, amount):
        """Set available balance from Decimal amount"""
        self.available_balance = int(amount * 100)

    def set_current_balance(self, amount):
        """Set current balance from Decimal amount"""
        self.current_balance = int(amount * 100)

    def set_pending_balance(self, amount):
        """Set pending balance from Decimal amount"""
        self.pending_balance = int(amount * 100)

    def can_debit(self, amount):
        """Check if account can be debited for the specified amount"""
        if self.status != AccountStatus.ACTIVE:
            return False, "Account is not active"

        amount_cents = int(amount * 100)

        # Check available balance
        if self.available_balance < amount_cents:
            # Check if overdraft is available
            if self.account_type == AccountType.CHECKING and self.overdraft_limit > 0:
                total_available = self.available_balance + self.overdraft_limit
                if total_available < amount_cents:
                    return False, "Insufficient funds including overdraft"
            else:
                return False, "Insufficient funds"

        return True, "Transaction allowed"

    def debit(self, amount, description="Debit transaction"):
        """Debit the account"""
        can_debit, message = self.can_debit(amount)
        if not can_debit:
            raise ValueError(message)

        amount_cents = int(amount * 100)
        self.available_balance -= amount_cents
        self.current_balance -= amount_cents
        self.last_activity_at = datetime.now(timezone.utc)

        return True

    def credit(self, amount, description="Credit transaction"):
        """Credit the account"""
        amount_cents = int(amount * 100)
        self.available_balance += amount_cents
        self.current_balance += amount_cents
        self.last_activity_at = datetime.now(timezone.utc)

        return True

    def hold_funds(self, amount):
        """Place a hold on funds (reduce available balance but not current balance)"""
        amount_cents = int(amount * 100)
        if self.available_balance < amount_cents:
            raise ValueError("Insufficient available funds for hold")

        self.available_balance -= amount_cents
        self.pending_balance += amount_cents

        return True

    def release_hold(self, amount):
        """Release a hold on funds"""
        amount_cents = int(amount * 100)
        if self.pending_balance < amount_cents:
            raise ValueError("Cannot release more than pending amount")

        self.available_balance += amount_cents
        self.pending_balance -= amount_cents

        return True

    def is_dormant(self, days=365):
        """Check if account is dormant (no activity for specified days)"""
        if not self.last_activity_at:
            return True

        from datetime import timedelta

        dormant_threshold = datetime.now(timezone.utc) - timedelta(days=days)
        return self.last_activity_at < dormant_threshold

    def calculate_interest(self):
        """Calculate interest for savings accounts"""
        if self.account_type != AccountType.SAVINGS or self.interest_rate <= 0:
            return Decimal("0.00")

        # Simple daily interest calculation
        daily_rate = self.interest_rate / 365
        balance = self.get_current_balance_decimal()
        daily_interest = balance * daily_rate

        return daily_interest

    def check_limits(self, amount, period="daily"):
        """Check if transaction amount exceeds limits"""
        amount_cents = int(amount * 100)

        # Get current usage for the period
        from datetime import datetime, timedelta

        now = datetime.now(timezone.utc)

        if period == "daily":
            start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            limit = self.daily_limit
        elif period == "monthly":
            start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            limit = self.monthly_limit
        elif period == "yearly":
            start_date = now.replace(
                month=1, day=1, hour=0, minute=0, second=0, microsecond=0
            )
            limit = self.yearly_limit
        else:
            raise ValueError("Invalid period. Use 'daily', 'monthly', or 'yearly'")

        # Calculate current usage (sum of debits in the period)
        from src.models.transaction import Transaction, TransactionType

        current_usage = (
            db.session.query(db.func.sum(Transaction.amount_cents))
            .filter(
                Transaction.account_id == self.id,
                Transaction.transaction_type == TransactionType.DEBIT,
                Transaction.created_at >= start_date,
            )
            .scalar()
            or 0
        )

        if current_usage + amount_cents > limit:
            return False, f"{period.capitalize()} limit exceeded"

        return True, "Within limits"

    def to_dict(self, include_sensitive=False):
        """Convert account to dictionary for API responses"""
        data = {
            "id": str(self.id),
            "account_number": (
                self.account_number[-4:]
                if not include_sensitive
                else self.account_number
            ),  # Mask account number
            "account_name": self.account_name,
            "account_type": self.account_type.value,
            "status": self.status.value,
            "currency": self.currency,
            "available_balance": float(self.get_available_balance_decimal()),
            "current_balance": float(self.get_current_balance_decimal()),
            "created_at": self.created_at.isoformat(),
            "last_activity_at": (
                self.last_activity_at.isoformat() if self.last_activity_at else None
            ),
        }

        if include_sensitive:
            data.update(
                {
                    "pending_balance": float(self.get_pending_balance_decimal()),
                    "daily_limit": float(Decimal(self.daily_limit) / 100),
                    "monthly_limit": float(Decimal(self.monthly_limit) / 100),
                    "yearly_limit": float(Decimal(self.yearly_limit) / 100),
                    "interest_rate": (
                        float(self.interest_rate) if self.interest_rate else 0.0
                    ),
                    "overdraft_limit": float(Decimal(self.overdraft_limit) / 100),
                    "minimum_balance": float(Decimal(self.minimum_balance) / 100),
                    "risk_score": self.risk_score,
                }
            )

        return data

    def __repr__(self):
        return f"<Account {self.account_number} ({self.account_type.value})>"

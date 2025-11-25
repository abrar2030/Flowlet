import random
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy import Column, String, Integer, DateTime, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from .database import Base, db
from enum import Enum as PyEnum


class AccountType(PyEnum):
    CHECKING = "checking"
    SAVINGS = "savings"
    CREDIT = "credit"
    INVESTMENT = "investment"
    BUSINESS = "business"


class AccountStatus(PyEnum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    CLOSED = "closed"
    FROZEN = "frozen"


class Account(Base):
    __tablename__ = (
        "accounts"  # Changed from 'enhanced_accounts' to 'accounts' for simplicity
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))

    # Account identification
    account_number = Column(String(20), unique=True, nullable=False, index=True)
    account_name = Column(String(100), nullable=False)
    account_type = Column(db.Enum(AccountType), nullable=False)

    # Account status and settings
    status = Column(
        db.Enum(AccountStatus), default=AccountStatus.ACTIVE, nullable=False
    )
    currency = Column(
        String(3), default="USD", nullable=False
    )  # ISO 4217 currency code

    # Balance information (stored as Decimal for precision)
    # Using Numeric/Decimal for financial data is safer than BigInteger for cents
    balance = Column(
        Numeric(precision=20, scale=8), default=Decimal("0.00000000"), nullable=False
    )
    available_balance = Column(
        Numeric(precision=20, scale=8), default=Decimal("0.00000000"), nullable=False
    )
    pending_balance = Column(
        Numeric(precision=20, scale=8), default=Decimal("0.00000000"), nullable=False
    )

    # Limits and restrictions (also using Decimal)
    daily_limit = Column(
        Numeric(precision=20, scale=2), default=Decimal("5000.00"), nullable=False
    )
    monthly_limit = Column(
        Numeric(precision=20, scale=2), default=Decimal("50000.00"), nullable=False
    )
    yearly_limit = Column(
        Numeric(precision=20, scale=2), default=Decimal("500000.00"), nullable=False
    )

    # Interest and fees (for savings/credit accounts)
    interest_rate = Column(
        Numeric(5, 4), default=Decimal("0.0000")
    )  # Annual interest rate
    overdraft_limit = Column(Numeric(20, 2), default=Decimal("0.00"))  # Overdraft limit
    minimum_balance = Column(
        Numeric(20, 2), default=Decimal("0.00")
    )  # Minimum balance requirement

    # Compliance and risk management
    risk_score = Column(Integer, default=0)
    last_activity_at = Column(DateTime, default=datetime.utcnow)
    dormant_since = Column(DateTime, nullable=True)  # When account became dormant

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    user = relationship(
        "User", back_populates="wallets"
    )  # Assuming User model has 'wallets' relationship
    transactions = relationship("Transaction", back_populates="account", lazy="dynamic")

    # Indexes
    __table_args__ = (
        Index("idx_account_user_currency", "user_id", "currency"),
        Index("idx_account_status", "status"),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.account_number:
            self.account_number = self.generate_account_number()

    @staticmethod
    def generate_account_number():
        # In a real system, this would require a database check loop
        return "".join([str(random.randint(0, 9)) for _ in range(16)])

    def to_dict(self, include_sensitive=False):
        data = {
            "id": self.id,
            "account_number": (
                self.account_number[-4:]
                if not include_sensitive
                else self.account_number
            ),
            "account_name": self.account_name,
            "account_type": self.account_type.value,
            "status": self.status.value,
            "currency": self.currency,
            "balance": float(self.balance),
            "available_balance": float(self.available_balance),
            "created_at": self.created_at.isoformat(),
        }

        if include_sensitive:
            data.update(
                {
                    "pending_balance": float(self.pending_balance),
                    "daily_limit": float(self.daily_limit),
                    "monthly_limit": float(self.monthly_limit),
                    "yearly_limit": float(self.yearly_limit),
                    "interest_rate": float(self.interest_rate),
                    "overdraft_limit": float(self.overdraft_limit),
                    "minimum_balance": float(self.minimum_balance),
                    "risk_score": self.risk_score,
                }
            )

        return data

    def __repr__(self):
        return f"<Account {self.account_number} ({self.account_type.value})>"

import enum
import uuid
from datetime import datetime, timezone

from app import db
from sqlalchemy import (
    UUID,
    BigInteger,
    Boolean,
    Card,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
)


class CardType(enum.Enum):
    """Card types"""

    DEBIT = "debit"
    CREDIT = "credit"
    VIRTUAL = "virtual"
    PHYSICAL = "physical"


class CardStatus(enum.Enum):
    """Card status"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class Card(db.Model):
    """Card model with security and control features"""

    __tablename__ = "cards"

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Foreign key to user and account
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True
    )
    account_id = Column(
        UUID(as_uuid=True), ForeignKey("accounts.id"), nullable=False, index=True
    )

    # Card details (tokenized)
    card_type = Column(Enum(CardType), nullable=False, default=CardType.DEBIT)
    card_number_token = Column(
        String(100), nullable=False, unique=True
    )  # Tokenized card number
    last_four_digits = Column(String(4), nullable=False)

    # Card metadata
    expiry_month = Column(Integer, nullable=False)
    expiry_year = Column(Integer, nullable=False)
    card_brand = Column(String(20), nullable=True)  # visa, mastercard, amex

    # Security features
    status = Column(Enum(CardStatus), nullable=False, default=CardStatus.ACTIVE)
    pin_hash = Column(String(255), nullable=True)
    pin_attempts = Column(Integer, default=0)
    pin_locked_until = Column(DateTime(timezone=True), nullable=True)

    # Spending controls (stored as cents)
    spending_limit_daily_cents = Column(BigInteger, nullable=True)
    spending_limit_monthly_cents = Column(BigInteger, nullable=True)
    spending_limit_per_transaction_cents = Column(BigInteger, nullable=True)

    # Transaction controls
    online_transactions_enabled = Column(Boolean, default=True)
    international_transactions_enabled = Column(Boolean, default=False)
    contactless_enabled = Column(Boolean, default=True)
    atm_withdrawals_enabled = Column(Boolean, default=True)

    # Merchant category controls (JSON)
    merchant_categories_blocked = Column(Text, nullable=True)
    merchant_categories_allowed = Column(Text, nullable=True)

    # Usage tracking
    total_spent_today_cents = Column(BigInteger, default=0)
    total_spent_month_cents = Column(BigInteger, default=0)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    last_used_location = Column(String(100), nullable=True)

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

    # Relationships
    user = relationship("User", backref="cards")
    account = relationship("Account", backref="cards")

    def to_dict(self, include_sensitive: bool = False) -> dict:
        """Convert to dictionary with optional sensitive data"""
        data = {
            "id": str(self.id),
            "card_type": self.card_type.value,
            "last_four_digits": self.last_four_digits,
            "card_brand": self.card_brand,
            "expiry_month": self.expiry_month,
            "expiry_year": self.expiry_year,
            "status": self.status.value,
            "online_transactions_enabled": self.online_transactions_enabled,
            "international_transactions_enabled": self.international_transactions_enabled,
            "contactless_enabled": self.contactless_enabled,
            "atm_withdrawals_enabled": self.atm_withdrawals_enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_used_at": (
                self.last_used_at.isoformat() if self.last_used_at else None
            ),
        }

        if include_sensitive:
            data.update(
                {
                    "card_number_token": self.card_number_token,
                    "spending_limit_daily_cents": self.spending_limit_daily_cents,
                    "spending_limit_monthly_cents": self.spending_limit_monthly_cents,
                    "spending_limit_per_transaction_cents": self.spending_limit_per_transaction_cents,
                    "total_spent_today_cents": self.total_spent_today_cents,
                    "total_spent_month_cents": self.total_spent_month_cents,
                    "pin_attempts": self.pin_attempts,
                    "pin_locked_until": (
                        self.pin_locked_until.isoformat()
                        if self.pin_locked_until
                        else None
                    ),
                }
            )

        return data

    def __repr__(self):
        return f"<Card {self.last_four_digits} ({self.card_type.value})>"

from typing import Any
import hashlib
import secrets
import string
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from enum import Enum as PyEnum
from calendar import monthrange
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
)
from sqlalchemy.orm import relationship
from ..security.password_security import check_password, hash_password
from .database import Base, db


class CardType(PyEnum):
    """Types of cards - Merged from both"""

    DEBIT = "debit"
    CREDIT = "credit"
    PREPAID = "prepaid"
    VIRTUAL = "virtual"
    PHYSICAL = "physical"


class CardStatus(PyEnum):
    """Card status options - Merged from both"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"
    EXPIRED = "expired"
    LOST = "lost"
    STOLEN = "stolen"
    CANCELLED = "cancelled"
    DAMAGED = "damaged"


class CardNetwork(PyEnum):
    """Card network providers - From src/"""

    VISA = "visa"
    MASTERCARD = "mastercard"
    AMERICAN_EXPRESS = "amex"
    DISCOVER = "discover"


class Card(Base):
    """Secure card model with merged features"""

    __tablename__ = "cards"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    account_id = Column(String(36), ForeignKey("accounts.id"), nullable=False)
    user = relationship("User", back_populates="cards")
    account = relationship("Account", back_populates="cards")
    transactions = relationship("Transaction", back_populates="card", lazy="dynamic")
    card_token = Column(String(100), unique=True, nullable=False, index=True)
    card_number_token = Column(String(100), nullable=True)
    last_four_digits = Column(String(4), nullable=False)
    card_hash = Column(String(255), nullable=False)
    card_type = Column(db.Enum(CardType), nullable=False)
    card_network = Column(db.Enum(CardNetwork), nullable=True)
    card_brand = Column(String(20), nullable=True)
    card_name = Column(String(100), nullable=False)
    status = Column(db.Enum(CardStatus), default=CardStatus.ACTIVE, nullable=False)
    is_contactless_enabled = Column(Boolean, default=True)
    is_online_enabled = Column(Boolean, default=True)
    is_international_enabled = Column(Boolean, default=False)
    online_transactions_enabled = Column(Boolean, default=True)
    international_transactions_enabled = Column(Boolean, default=False)
    contactless_enabled = Column(Boolean, default=True)
    atm_withdrawals_enabled = Column(Boolean, default=True)
    expiry_month = Column(Integer, nullable=False)
    expiry_year = Column(Integer, nullable=False)
    daily_limit = Column(Numeric(20, 2), default=Decimal("1000.00"))
    monthly_limit = Column(Numeric(20, 2), default=Decimal("10000.00"))
    single_transaction_limit = Column(Numeric(20, 2), default=Decimal("500.00"))
    spending_limit_daily_cents = Column(db.BigInteger, nullable=True)
    spending_limit_monthly_cents = Column(db.BigInteger, nullable=True)
    spending_limit_per_transaction_cents = Column(db.BigInteger, nullable=True)
    merchant_categories_blocked = Column(Text, nullable=True)
    merchant_categories_allowed = Column(Text, nullable=True)
    total_spent_today = Column(Numeric(20, 2), default=Decimal("0.00"))
    total_spent_month = Column(Numeric(20, 2), default=Decimal("0.00"))
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    last_used_location = Column(String(200))
    pin_hash = Column(String(255))
    pin_attempts = Column(Integer, default=0)
    pin_locked_until = Column(DateTime(timezone=True))
    fraud_alerts_enabled = Column(Boolean, default=True)
    velocity_checks_enabled = Column(Boolean, default=True)
    location_verification_enabled = Column(Boolean, default=True)
    is_physical_card = Column(Boolean, default=True)
    card_design = Column(String(50), default="standard")
    delivery_address = Column(Text)
    shipped_at = Column(DateTime(timezone=True))
    delivered_at = Column(DateTime(timezone=True))
    blocked_reason = Column(String(255))
    blocked_at = Column(DateTime(timezone=True))
    cancelled_reason = Column(String(255))
    cancelled_at = Column(DateTime(timezone=True))
    activated_at = Column(DateTime(timezone=True))
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    __table_args__ = (
        Index("idx_card_user", "user_id"),
        Index("idx_card_account", "account_id"),
        Index("idx_card_status", "status"),
        Index("idx_card_token", "card_token"),
        Index("idx_card_last_four", "last_four_digits"),
    )

    def __init__(self, **kwargs) -> Any:
        super().__init__(**kwargs)
        if not self.card_token:
            self.card_token = self.generate_card_token()

    @staticmethod
    def generate_card_token() -> Any:
        """Generate a secure card token"""
        return "CTK_" + "".join(
            (secrets.choice(string.ascii_uppercase + string.digits) for _ in range(32))
        )

    def set_card_number(self, card_number: Any) -> Any:
        """Set card number with proper tokenization and hashing"""
        self.last_four_digits = card_number[-4:]
        self.card_hash = hashlib.sha256(card_number.encode()).hexdigest()
        if not self.card_token:
            self.card_token = self.generate_card_token()

    def verify_card_number(self, card_number: Any) -> Any:
        """Verify card number against stored hash"""
        return hashlib.sha256(card_number.encode()).hexdigest() == self.card_hash

    def set_pin(self, pin: Any) -> Any:
        """Set card PIN with proper hashing"""
        if len(pin) != 4 or not pin.isdigit():
            raise ValueError("PIN must be exactly 4 digits")
        self.pin_hash = hash_password(pin)
        self.pin_attempts = 0
        self.pin_locked_until = None

    def verify_pin(self, pin: Any) -> Any:
        """Verify PIN and handle failed attempts"""
        if self.is_pin_locked():
            return (False, "PIN is locked due to too many failed attempts")
        if not self.pin_hash:
            return (False, "PIN not set")
        is_valid = check_password(self.pin_hash, pin)
        if not is_valid:
            self.pin_attempts += 1
            if self.pin_attempts >= 3:
                self.lock_pin(duration_minutes=30)
                return (False, "PIN locked due to too many failed attempts")
            return (False, f"Invalid PIN. {3 - self.pin_attempts} attempts remaining")
        else:
            self.pin_attempts = 0
            return (True, "PIN verified")

    def is_pin_locked(self) -> Any:
        """Check if PIN is currently locked"""
        if self.pin_locked_until:
            if datetime.now(timezone.utc) < self.pin_locked_until:
                return True
            else:
                self.pin_locked_until = None
                self.pin_attempts = 0
        return False

    def lock_pin(self, duration_minutes: Any = 30) -> Any:
        """Lock PIN for specified duration"""
        self.pin_locked_until = datetime.now(timezone.utc) + timedelta(
            minutes=duration_minutes
        )

    def is_expired(self) -> Any:
        """Check if card is expired"""
        now = datetime.now(timezone.utc)
        last_day = monthrange(self.expiry_year, self.expiry_month)[1]
        expiry_date = datetime(
            self.expiry_year,
            self.expiry_month,
            last_day,
            23,
            59,
            59,
            tzinfo=timezone.utc,
        )
        return now > expiry_date

    def block_card(self, reason: Any = None) -> Any:
        """Block the card"""
        self.status = CardStatus.BLOCKED
        self.blocked_reason = reason
        self.blocked_at = datetime.now(timezone.utc)

    def unblock_card(self) -> Any:
        """Unblock the card"""
        if self.status == CardStatus.BLOCKED:
            self.status = CardStatus.ACTIVE
            self.blocked_reason = None
            self.blocked_at = None

    def record_transaction(self, amount: Any) -> Any:
        """Record a transaction against the card limits"""
        amount_decimal = Decimal(str(amount))
        self.total_spent_today += amount_decimal
        self.total_spent_month += amount_decimal
        self.last_used_at = datetime.now(timezone.utc)

    def reset_daily_limits(self) -> Any:
        """Reset daily spending limits (called by scheduled job)"""
        self.total_spent_today = Decimal("0.00")

    def reset_monthly_limits(self) -> Any:
        """Reset monthly spending limits (called by scheduled job)"""
        self.total_spent_month = Decimal("0.00")

    def to_dict(self, include_sensitive: Any = False) -> Any:
        """Convert card to dictionary for API responses"""
        data = {
            "id": self.id,
            "card_token": self.card_token,
            "last_four_digits": self.last_four_digits,
            "card_type": self.card_type.value,
            "card_network": self.card_network.value if self.card_network else None,
            "card_name": self.card_name,
            "status": self.status.value,
            "expiry_month": self.expiry_month,
            "expiry_year": self.expiry_year,
            "created_at": self.created_at.isoformat(),
        }
        if include_sensitive:
            data.update(
                {
                    "daily_limit": float(self.daily_limit),
                    "monthly_limit": float(self.monthly_limit),
                    "single_transaction_limit": float(self.single_transaction_limit),
                    "total_spent_today": float(self.total_spent_today),
                    "total_spent_month": float(self.total_spent_month),
                    "is_contactless_enabled": self.is_contactless_enabled,
                    "is_online_enabled": self.is_online_enabled,
                    "is_international_enabled": self.is_international_enabled,
                    "is_physical_card": self.is_physical_card,
                    "pin_attempts": self.pin_attempts,
                    "pin_locked_until": (
                        self.pin_locked_until.isoformat()
                        if self.pin_locked_until
                        else None
                    ),
                }
            )
        return data

    def __repr__(self) -> Any:
        return f"<Card {self.last_four_digits} ({self.card_type.value})>"

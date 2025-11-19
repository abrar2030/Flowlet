"""
Card model for secure card management
"""
import uuid
import secrets
import string
import hashlib
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from enum import Enum as PyEnum
from sqlalchemy import Column, String, DateTime, Text, Boolean, Integer, Index, ForeignKey, Numeric
from sqlalchemy.orm import relationship

from .database import Base, db # Import Base and db from the local database setup
from ..security.password_security import hash_password, check_password # Use internal security module

class CardType(PyEnum):
    """Types of cards"""
    DEBIT = "debit"
    CREDIT = "credit"
    PREPAID = "prepaid"
    VIRTUAL = "virtual"

class CardStatus(PyEnum):
    """Card status options"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"
    EXPIRED = "expired"
    LOST = "lost"
    STOLEN = "stolen"
    DAMAGED = "damaged"

class CardNetwork(PyEnum):
    """Card network providers"""
    VISA = "visa"
    MASTERCARD = "mastercard"
    AMERICAN_EXPRESS = "amex"
    DISCOVER = "discover"

class Card(Base):
    """Secure card model with PCI DSS compliance features"""
    
    __tablename__ = 'cards'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Relationships
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    account_id = Column(String(36), ForeignKey('accounts.id'), nullable=False)
    
    # Card identification (PCI DSS compliant - no full PAN storage)
    card_token = Column(String(100), unique=True, nullable=False, index=True)  # Tokenized card number
    last_four_digits = Column(String(4), nullable=False)  # Only store last 4 digits
    card_hash = Column(String(255), nullable=False)  # Hash of full PAN for verification
    
    # Card details
    card_type = Column(db.Enum(CardType), nullable=False)
    card_network = Column(db.Enum(CardNetwork), nullable=False)
    card_name = Column(String(100), nullable=False)  # Name on card
    
    # Card status and settings
    status = Column(db.Enum(CardStatus), default=CardStatus.ACTIVE, nullable=False)
    is_contactless_enabled = Column(Boolean, default=True)
    is_online_enabled = Column(Boolean, default=True)
    is_international_enabled = Column(Boolean, default=False)
    
    # Expiration and security
    expiry_month = Column(Integer, nullable=False)
    expiry_year = Column(Integer, nullable=False)
    # Note: CVV is NEVER stored as per PCI DSS requirements
    
    # Limits and controls (using Numeric/Decimal)
    daily_limit = Column(Numeric(20, 2), default=Decimal('1000.00'))
    monthly_limit = Column(Numeric(20, 2), default=Decimal('10000.00'))
    single_transaction_limit = Column(Numeric(20, 2), default=Decimal('500.00'))
    
    # Usage tracking (using Numeric/Decimal)
    total_spent_today = Column(Numeric(20, 2), default=Decimal('0.00'))
    total_spent_month = Column(Numeric(20, 2), default=Decimal('0.00'))
    last_used_at = Column(DateTime)
    last_used_location = Column(String(200))
    
    # Security features
    pin_hash = Column(String(255))  # Hashed PIN
    pin_attempts = Column(Integer, default=0)
    pin_locked_until = Column(DateTime)
    
    # Fraud prevention
    fraud_alerts_enabled = Column(Boolean, default=True)
    velocity_checks_enabled = Column(Boolean, default=True)
    location_verification_enabled = Column(Boolean, default=True)
    
    # Physical card details
    is_physical_card = Column(Boolean, default=True)
    card_design = Column(String(50), default='standard')
    delivery_address = Column(Text)  # JSON string with address
    shipped_at = Column(DateTime)
    delivered_at = Column(DateTime)
    
    # Relationships
    user = relationship("User")
    account = relationship("Account")
    transactions = relationship('Transaction', back_populates='card', lazy='dynamic')
    
    # Indexes
    __table_args__ = (
        Index('idx_card_user', 'user_id'),
        Index('idx_card_account', 'account_id'),
        Index('idx_card_status', 'status'),
        Index('idx_card_token', 'card_token'),
        Index('idx_card_last_four', 'last_four_digits'),
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.card_token:
            self.card_token = self.generate_card_token()
    
    @staticmethod
    def generate_card_token():
        """Generate a secure card token"""
        return 'CTK_' + ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(32))
    
    def set_card_number(self, card_number):
        """Set card number with proper tokenization and hashing"""
        # Store only last 4 digits
        self.last_four_digits = card_number[-4:]
        
        # Create hash of full PAN for verification
        self.card_hash = hashlib.sha256(card_number.encode()).hexdigest()
        
        # In production, you would call a tokenization service here
        if not self.card_token:
            self.card_token = self.generate_card_token()
    
    def verify_card_number(self, card_number):
        """Verify card number against stored hash"""
        return hashlib.sha256(card_number.encode()).hexdigest() == self.card_hash
    
    def set_pin(self, pin):
        """Set card PIN with proper hashing"""
        if len(pin) != 4 or not pin.isdigit():
            raise ValueError("PIN must be exactly 4 digits")
        
        self.pin_hash = hash_password(pin) # Use internal hash function
        self.pin_attempts = 0
        self.pin_locked_until = None
    
    def verify_pin(self, pin):
        """Verify PIN and handle failed attempts"""
        if self.is_pin_locked():
            return False, "PIN is locked due to too many failed attempts"
        
        if not self.pin_hash:
            return False, "PIN not set"
        
        is_valid = check_password(self.pin_hash, pin) # Use internal check function
        
        if not is_valid:
            self.pin_attempts += 1
            if self.pin_attempts >= 3:  # Lock after 3 failed attempts
                self.lock_pin(duration_minutes=30)
                return False, "PIN locked due to too many failed attempts"
            return False, f"Invalid PIN. {3 - self.pin_attempts} attempts remaining"
        else:
            self.pin_attempts = 0
            return True, "PIN verified"
    
    def is_pin_locked(self):
        """Check if PIN is currently locked"""
        if self.pin_locked_until:
            if datetime.now(timezone.utc) < self.pin_locked_until:
                return True
            else:
                # Unlock PIN if lock period has expired
                self.pin_locked_until = None
                self.pin_attempts = 0
        return False
    
    def lock_pin(self, duration_minutes=30):
        """Lock PIN for specified duration"""
        self.pin_locked_until = datetime.now(timezone.utc) + timedelta(minutes=duration_minutes)
    
    def is_expired(self):
        """Check if card is expired"""
        now = datetime.now(timezone.utc)
        expiry_date = datetime(self.expiry_year, self.expiry_month, 1, tzinfo=timezone.utc)
        # Card expires at the end of the expiry month
        from calendar import monthrange
        last_day = monthrange(self.expiry_year, self.expiry_month)[1]
        expiry_date = expiry_date.replace(day=last_day, hour=23, minute=59, second=59)
        
        return now > expiry_date
    
    def block_card(self, reason=None):
        """Block the card"""
        self.status = CardStatus.BLOCKED
        
    def unblock_card(self):
        """Unblock the card"""
        if self.status == CardStatus.BLOCKED:
            self.status = CardStatus.ACTIVE
    
    def record_transaction(self, amount):
        """Record a transaction against the card limits"""
        amount_decimal = Decimal(str(amount))
        self.total_spent_today += amount_decimal
        self.total_spent_month += amount_decimal
        self.last_used_at = datetime.now(timezone.utc)
    
    def reset_daily_limits(self):
        """Reset daily spending limits (called by scheduled job)"""
        self.total_spent_today = Decimal('0.00')
    
    def reset_monthly_limits(self):
        """Reset monthly spending limits (called by scheduled job)"""
        self.total_spent_month = Decimal('0.00')
    
    def to_dict(self, include_sensitive=False):
        """Convert card to dictionary for API responses"""
        data = {
            'id': self.id,
            'card_token': self.card_token,
            'last_four_digits': self.last_four_digits,
            'card_type': self.card_type.value,
            'card_network': self.card_network.value,
            'card_name': self.card_name,
            'status': self.status.value,
            'expiry_month': self.expiry_month,
            'expiry_year': self.expiry_year,
            'created_at': self.created_at.isoformat()
        }
        
        if include_sensitive:
            data.update({
                'daily_limit': float(self.daily_limit),
                'monthly_limit': float(self.monthly_limit),
                'single_transaction_limit': float(self.single_transaction_limit),
                'total_spent_today': float(self.total_spent_today),
                'total_spent_month': float(self.total_spent_month),
                'is_contactless_enabled': self.is_contactless_enabled,
                'is_online_enabled': self.is_online_enabled,
                'is_international_enabled': self.is_international_enabled,
                'is_physical_card': self.is_physical_card,
            })
        
        return data
    
    def __repr__(self):
        return f'<Card {self.last_four_digits} ({self.card_network.value})>'

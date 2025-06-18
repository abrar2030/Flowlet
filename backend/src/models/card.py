"""
Card model for secure card management
"""

from src.models.database import db, TimestampMixin, UUIDMixin
from datetime import datetime, timezone, timedelta
from enum import Enum
import uuid
import secrets
import string

class CardType(Enum):
    """Types of cards"""
    DEBIT = "debit"
    CREDIT = "credit"
    PREPAID = "prepaid"
    VIRTUAL = "virtual"

class CardStatus(Enum):
    """Card status options"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    BLOCKED = "blocked"
    EXPIRED = "expired"
    LOST = "lost"
    STOLEN = "stolen"
    DAMAGED = "damaged"

class CardNetwork(Enum):
    """Card network providers"""
    VISA = "visa"
    MASTERCARD = "mastercard"
    AMERICAN_EXPRESS = "amex"
    DISCOVER = "discover"

class Card(db.Model, TimestampMixin, UUIDMixin):
    """Secure card model with PCI DSS compliance features"""
    
    __tablename__ = 'cards'
    
    # Card identification (PCI DSS compliant - no full PAN storage)
    card_token = db.Column(db.String(100), unique=True, nullable=False, index=True)  # Tokenized card number
    last_four_digits = db.Column(db.String(4), nullable=False)  # Only store last 4 digits
    card_hash = db.Column(db.String(255), nullable=False)  # Hash of full PAN for verification
    
    # Card details
    card_type = db.Column(db.Enum(CardType), nullable=False)
    card_network = db.Column(db.Enum(CardNetwork), nullable=False)
    card_name = db.Column(db.String(100), nullable=False)  # Name on card
    
    # Card status and settings
    status = db.Column(db.Enum(CardStatus), default=CardStatus.ACTIVE, nullable=False)
    is_contactless_enabled = db.Column(db.Boolean, default=True)
    is_online_enabled = db.Column(db.Boolean, default=True)
    is_international_enabled = db.Column(db.Boolean, default=False)
    
    # Expiration and security
    expiry_month = db.Column(db.Integer, nullable=False)
    expiry_year = db.Column(db.Integer, nullable=False)
    # Note: CVV is NEVER stored as per PCI DSS requirements
    
    # Limits and controls
    daily_limit_cents = db.Column(db.BigInteger, default=100000)    # $1,000 default daily limit
    monthly_limit_cents = db.Column(db.BigInteger, default=1000000) # $10,000 default monthly limit
    single_transaction_limit_cents = db.Column(db.BigInteger, default=50000)  # $500 default single transaction limit
    
    # Usage tracking
    total_spent_today_cents = db.Column(db.BigInteger, default=0)
    total_spent_month_cents = db.Column(db.BigInteger, default=0)
    last_used_at = db.Column(db.DateTime)
    last_used_location = db.Column(db.String(200))
    
    # Security features
    pin_hash = db.Column(db.String(255))  # Hashed PIN
    pin_attempts = db.Column(db.Integer, default=0)
    pin_locked_until = db.Column(db.DateTime)
    
    # Fraud prevention
    fraud_alerts_enabled = db.Column(db.Boolean, default=True)
    velocity_checks_enabled = db.Column(db.Boolean, default=True)
    location_verification_enabled = db.Column(db.Boolean, default=True)
    
    # Physical card details
    is_physical_card = db.Column(db.Boolean, default=True)
    card_design = db.Column(db.String(50), default='standard')
    delivery_address = db.Column(db.Text)  # JSON string with address
    shipped_at = db.Column(db.DateTime)
    delivered_at = db.Column(db.DateTime)
    
    # Relationships
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    account_id = db.Column(UUID(as_uuid=True), db.ForeignKey('accounts.id'), nullable=False)
    transactions = db.relationship('Transaction', backref='card', lazy='dynamic')
    
    def __init__(self, **kwargs):
        super(Card, self).__init__(**kwargs)
        if not self.card_token:
            self.card_token = self.generate_card_token()
    
    @staticmethod
    def generate_card_token():
        """Generate a secure card token"""
        # Generate a random token for card identification
        return 'CTK_' + ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(32))
    
    @staticmethod
    def generate_card_number(card_network):
        """Generate a valid card number for testing (NOT for production use)"""
        # This is for testing only - in production, card numbers would come from card issuer
        import random
        
        if card_network == CardNetwork.VISA:
            prefix = '4'
            length = 16
        elif card_network == CardNetwork.MASTERCARD:
            prefix = '5'
            length = 16
        elif card_network == CardNetwork.AMERICAN_EXPRESS:
            prefix = '37'
            length = 15
        else:
            prefix = '6'
            length = 16
        
        # Generate random digits
        number = prefix + ''.join([str(random.randint(0, 9)) for _ in range(length - len(prefix) - 1)])
        
        # Calculate Luhn check digit
        def luhn_checksum(card_num):
            def digits_of(n):
                return [int(d) for d in str(n)]
            digits = digits_of(card_num)
            odd_digits = digits[-1::-2]
            even_digits = digits[-2::-2]
            checksum = sum(odd_digits)
            for d in even_digits:
                checksum += sum(digits_of(d*2))
            return checksum % 10
        
        check_digit = (10 - luhn_checksum(int(number))) % 10
        return number + str(check_digit)
    
    def set_card_number(self, card_number):
        """Set card number with proper tokenization and hashing"""
        import hashlib
        
        # Store only last 4 digits
        self.last_four_digits = card_number[-4:]
        
        # Create hash of full PAN for verification
        self.card_hash = hashlib.sha256(card_number.encode()).hexdigest()
        
        # In production, you would call a tokenization service here
        # For now, we'll use a simple token
        if not self.card_token:
            self.card_token = self.generate_card_token()
    
    def verify_card_number(self, card_number):
        """Verify card number against stored hash"""
        import hashlib
        return hashlib.sha256(card_number.encode()).hexdigest() == self.card_hash
    
    def set_pin(self, pin):
        """Set card PIN with proper hashing"""
        from werkzeug.security import generate_password_hash
        
        if len(pin) != 4 or not pin.isdigit():
            raise ValueError("PIN must be exactly 4 digits")
        
        self.pin_hash = generate_password_hash(pin)
        self.pin_attempts = 0
        self.pin_locked_until = None
    
    def verify_pin(self, pin):
        """Verify PIN and handle failed attempts"""
        from werkzeug.security import check_password_hash
        
        if self.is_pin_locked():
            return False, "PIN is locked due to too many failed attempts"
        
        if not self.pin_hash:
            return False, "PIN not set"
        
        is_valid = check_password_hash(self.pin_hash, pin)
        
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
        # Log the blocking reason in audit logs
        
    def unblock_card(self):
        """Unblock the card"""
        if self.status == CardStatus.BLOCKED:
            self.status = CardStatus.ACTIVE
    
    def report_lost_or_stolen(self, reason='lost'):
        """Report card as lost or stolen"""
        if reason.lower() == 'stolen':
            self.status = CardStatus.STOLEN
        else:
            self.status = CardStatus.LOST
        
        # Automatically block the card
        self.is_online_enabled = False
        self.is_contactless_enabled = False
        self.is_international_enabled = False
    
    def can_transact(self, amount, transaction_type='purchase'):
        """Check if card can perform a transaction"""
        from decimal import Decimal
        
        # Basic status checks
        if self.status != CardStatus.ACTIVE:
            return False, f"Card is {self.status.value}"
        
        if self.is_expired():
            return False, "Card is expired"
        
        # Amount checks
        amount_cents = int(amount * 100)
        
        # Check single transaction limit
        if amount_cents > self.single_transaction_limit_cents:
            return False, "Amount exceeds single transaction limit"
        
        # Check daily limit
        if self.total_spent_today_cents + amount_cents > self.daily_limit_cents:
            return False, "Amount exceeds daily limit"
        
        # Check monthly limit
        if self.total_spent_month_cents + amount_cents > self.monthly_limit_cents:
            return False, "Amount exceeds monthly limit"
        
        # Check if online transactions are enabled
        if transaction_type == 'online' and not self.is_online_enabled:
            return False, "Online transactions are disabled"
        
        return True, "Transaction allowed"
    
    def record_transaction(self, amount):
        """Record a transaction against the card limits"""
        amount_cents = int(amount * 100)
        self.total_spent_today_cents += amount_cents
        self.total_spent_month_cents += amount_cents
        self.last_used_at = datetime.now(timezone.utc)
    
    def reset_daily_limits(self):
        """Reset daily spending limits (called by scheduled job)"""
        self.total_spent_today_cents = 0
    
    def reset_monthly_limits(self):
        """Reset monthly spending limits (called by scheduled job)"""
        self.total_spent_month_cents = 0
    
    def get_daily_limit_decimal(self):
        """Get daily limit as Decimal"""
        from decimal import Decimal
        return Decimal(self.daily_limit_cents) / 100
    
    def get_monthly_limit_decimal(self):
        """Get monthly limit as Decimal"""
        from decimal import Decimal
        return Decimal(self.monthly_limit_cents) / 100
    
    def get_single_transaction_limit_decimal(self):
        """Get single transaction limit as Decimal"""
        from decimal import Decimal
        return Decimal(self.single_transaction_limit_cents) / 100
    
    def to_dict(self, include_sensitive=False):
        """Convert card to dictionary for API responses"""
        data = {
            'id': str(self.id),
            'card_token': self.card_token,
            'last_four_digits': self.last_four_digits,
            'card_type': self.card_type.value,
            'card_network': self.card_network.value,
            'card_name': self.card_name,
            'status': self.status.value,
            'expiry_month': self.expiry_month,
            'expiry_year': self.expiry_year,
            'is_contactless_enabled': self.is_contactless_enabled,
            'is_online_enabled': self.is_online_enabled,
            'is_international_enabled': self.is_international_enabled,
            'is_physical_card': self.is_physical_card,
            'created_at': self.created_at.isoformat(),
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None
        }
        
        if include_sensitive:
            from decimal import Decimal
            data.update({
                'daily_limit': float(Decimal(self.daily_limit_cents) / 100),
                'monthly_limit': float(Decimal(self.monthly_limit_cents) / 100),
                'single_transaction_limit': float(Decimal(self.single_transaction_limit_cents) / 100),
                'total_spent_today': float(Decimal(self.total_spent_today_cents) / 100),
                'total_spent_month': float(Decimal(self.total_spent_month_cents) / 100),
                'fraud_alerts_enabled': self.fraud_alerts_enabled,
                'velocity_checks_enabled': self.velocity_checks_enabled,
                'location_verification_enabled': self.location_verification_enabled,
                'pin_attempts': self.pin_attempts,
                'is_pin_locked': self.is_pin_locked()
            })
        
        return data
    
    def __repr__(self):
        return f'<Card {self.card_type.value} ending in {self.last_four_digits}>'


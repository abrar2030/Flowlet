import uuid
from datetime import datetime, timezone
from decimal import Decimal

from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()


class User(db.Model):
    """User model"""

    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone_number = db.Column(db.String(20), nullable=True)

    # Account status
    status = db.Column(db.String(20), nullable=False, default="active")
    kyc_status = db.Column(db.String(20), nullable=False, default="pending")
    is_active = db.Column(db.Boolean, nullable=False, default=True)

    # Security
    failed_login_attempts = db.Column(db.Integer, nullable=False, default=0)
    account_locked_until = db.Column(db.DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    last_login = db.Column(db.DateTime(timezone=True), nullable=True)

    def set_password(self, password):
        """Set password with strong hashing"""
        self.password_hash = generate_password_hash(password, method="bcrypt")

    def check_password(self, password):
        """Check password"""
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "phone_number": self.phone_number,
            "status": self.status,
            "kyc_status": self.kyc_status,
            "created_at": self.created_at.isoformat(),
        }


class Account(db.Model):
    """Account model"""

    __tablename__ = "accounts"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )

    # Account details
    account_name = db.Column(db.String(255), nullable=False)
    account_number = db.Column(db.String(20), nullable=False, unique=True, index=True)
    account_type = db.Column(db.String(50), nullable=False, default="checking")
    currency = db.Column(db.String(3), nullable=False, default="USD")

    # Balances (stored as cents to avoid floating point issues)
    available_balance_cents = db.Column(db.BigInteger, nullable=False, default=0)
    current_balance_cents = db.Column(db.BigInteger, nullable=False, default=0)

    # Status
    status = db.Column(db.String(20), nullable=False, default="active")

    # Timestamps
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationship
    user = db.relationship("User", backref="accounts")

    @property
    def available_balance(self):
        """Get available balance as Decimal"""
        return Decimal(self.available_balance_cents) / 100

    @available_balance.setter
    def available_balance(self, value):
        """Set available balance from Decimal"""
        self.available_balance_cents = int(Decimal(str(value)) * 100)

    @property
    def current_balance(self):
        """Get current balance as Decimal"""
        return Decimal(self.current_balance_cents) / 100

    @current_balance.setter
    def current_balance(self, value):
        """Set current balance from Decimal"""
        self.current_balance_cents = int(Decimal(str(value)) * 100)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "account_name": self.account_name,
            "account_number": f"****{self.account_number[-4:]}",
            "account_type": self.account_type,
            "currency": self.currency,
            "available_balance": str(self.available_balance),
            "current_balance": str(self.current_balance),
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }


class Transaction(db.Model):
    """Transaction model"""

    __tablename__ = "transactions"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(
        db.String(36), db.ForeignKey("users.id"), nullable=False, index=True
    )
    account_id = db.Column(
        db.String(36), db.ForeignKey("accounts.id"), nullable=False, index=True
    )

    # Transaction details
    transaction_id = db.Column(db.String(50), nullable=False, unique=True, index=True)
    transaction_type = db.Column(db.String(50), nullable=False)  # credit, debit
    transaction_category = db.Column(
        db.String(50), nullable=False
    )  # deposit, withdrawal, transfer, payment
    amount_cents = db.Column(db.BigInteger, nullable=False)
    currency = db.Column(db.String(3), nullable=False, default="USD")
    description = db.Column(db.Text, nullable=True)

    # Status
    status = db.Column(db.String(20), nullable=False, default="completed")

    # Timestamps
    created_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    processed_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    user = db.relationship("User", backref="transactions")
    account = db.relationship("Account", backref="transactions")

    @property
    def amount(self):
        """Get amount as Decimal"""
        return Decimal(self.amount_cents) / 100

    @amount.setter
    def amount(self, value):
        """Set amount from Decimal"""
        self.amount_cents = int(Decimal(str(value)) * 100)

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "transaction_id": self.transaction_id,
            "transaction_type": self.transaction_type,
            "transaction_category": self.transaction_category,
            "amount": str(self.amount),
            "currency": self.currency,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
            "processed_at": (
                self.processed_at.isoformat() if self.processed_at else None
            ),
        }

"""
Transaction model for financial transaction management
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum

from src.models.database import UUID, TimestampMixin, UUIDMixin, db


class TransactionType(Enum):
    """Types of transactions"""

    DEBIT = "debit"
    CREDIT = "credit"
    TRANSFER = "transfer"
    PAYMENT = "payment"
    REFUND = "refund"
    FEE = "fee"
    INTEREST = "interest"
    ADJUSTMENT = "adjustment"


class TransactionStatus(Enum):
    """Transaction status options"""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REVERSED = "reversed"


class TransactionCategory(Enum):
    """Transaction categories for reporting and analysis"""

    TRANSFER = "transfer"
    PAYMENT = "payment"
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    PURCHASE = "purchase"
    REFUND = "refund"
    FEE = "fee"
    INTEREST = "interest"
    OTHER = "other"


class Transaction(db.Model, TimestampMixin, UUIDMixin):
    """Financial transaction model with comprehensive tracking and compliance features"""

    __tablename__ = "enhanced_transactions"

    # Transaction identification
    transaction_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    reference_number = db.Column(db.String(100), index=True)  # External reference

    # Transaction details
    transaction_type = db.Column(db.Enum(TransactionType), nullable=False)
    transaction_category = db.Column(db.Enum(TransactionCategory), nullable=False)
    status = db.Column(
        db.Enum(TransactionStatus), default=TransactionStatus.PENDING, nullable=False
    )

    # Amount information (stored as integers to avoid floating point issues)
    amount_cents = db.Column(db.BigInteger, nullable=False)  # Amount in cents
    currency = db.Column(
        db.String(3), default="USD", nullable=False
    )  # ISO 4217 currency code

    # Exchange rate information (for multi-currency transactions)
    original_amount_cents = db.Column(
        db.BigInteger
    )  # Original amount in source currency
    original_currency = db.Column(db.String(3))  # Source currency
    exchange_rate = db.Column(db.Numeric(10, 6))  # Exchange rate used

    # Transaction parties
    description = db.Column(db.String(500), nullable=False)
    merchant_name = db.Column(db.String(200))
    merchant_category_code = db.Column(db.String(10))  # MCC code

    # Location information
    transaction_location = db.Column(db.String(200))
    country_code = db.Column(db.String(2))  # ISO 3166-1 alpha-2

    # Processing information
    processed_at = db.Column(db.DateTime)
    settlement_date = db.Column(db.Date)
    authorization_code = db.Column(db.String(20))

    # Balances after transaction
    balance_before_cents = db.Column(db.BigInteger)
    balance_after_cents = db.Column(db.BigInteger)

    # Fees and charges
    fee_amount_cents = db.Column(db.BigInteger, default=0)
    fee_description = db.Column(db.String(200))

    # Risk and compliance
    risk_score = db.Column(db.Integer, default=0)
    is_suspicious = db.Column(db.Boolean, default=False)
    aml_flagged = db.Column(db.Boolean, default=False)
    compliance_notes = db.Column(db.Text)

    # Fraud detection
    fraud_score = db.Column(db.Integer, default=0)
    fraud_reason = db.Column(db.String(500))
    is_disputed = db.Column(db.Boolean, default=False)
    dispute_reason = db.Column(db.String(500))

    # Technical details
    channel = db.Column(db.String(50))  # web, mobile, atm, pos, etc.
    device_fingerprint = db.Column(db.String(255))
    ip_address = db.Column(db.String(45))  # IPv6 compatible
    user_agent = db.Column(db.String(500))

    # Relationships
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False)
    account_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("enhanced_accounts.id"), nullable=False
    )
    card_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("cards.id"), nullable=True
    )  # If card transaction

    # Related transactions (for transfers, reversals, etc.)
    parent_transaction_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("enhanced_transactions.id")
    )
    related_transactions = db.relationship(
        "Transaction", backref=db.backref("parent_transaction", remote_side=[id])
    )

    def __init__(self, **kwargs):
        super(Transaction, self).__init__(**kwargs)
        if not self.transaction_id:
            self.transaction_id = self.generate_transaction_id()

    @staticmethod
    def generate_transaction_id():
        """Generate a unique transaction ID"""
        import random
        import string
        from datetime import datetime

        # Format: TXN-YYYYMMDD-XXXXXXXX (where X is alphanumeric)
        date_str = datetime.now().strftime("%Y%m%d")
        random_str = "".join(
            random.choices(string.ascii_uppercase + string.digits, k=8)
        )

        transaction_id = f"TXN-{date_str}-{random_str}"

        # Ensure uniqueness
        while Transaction.query.filter_by(transaction_id=transaction_id).first():
            random_str = "".join(
                random.choices(string.ascii_uppercase + string.digits, k=8)
            )
            transaction_id = f"TXN-{date_str}-{random_str}"

        return transaction_id

    def get_amount_decimal(self):
        """Get transaction amount as Decimal"""
        return Decimal(self.amount_cents) / 100

    def set_amount(self, amount):
        """Set transaction amount from Decimal"""
        self.amount_cents = int(amount * 100)

    def get_original_amount_decimal(self):
        """Get original amount as Decimal"""
        if self.original_amount_cents is None:
            return None
        return Decimal(self.original_amount_cents) / 100

    def set_original_amount(self, amount):
        """Set original amount from Decimal"""
        self.original_amount_cents = int(amount * 100)

    def get_fee_amount_decimal(self):
        """Get fee amount as Decimal"""
        return Decimal(self.fee_amount_cents) / 100

    def set_fee_amount(self, amount):
        """Set fee amount from Decimal"""
        self.fee_amount_cents = int(amount * 100)

    def get_balance_before_decimal(self):
        """Get balance before transaction as Decimal"""
        if self.balance_before_cents is None:
            return None
        return Decimal(self.balance_before_cents) / 100

    def get_balance_after_decimal(self):
        """Get balance after transaction as Decimal"""
        if self.balance_after_cents is None:
            return None
        return Decimal(self.balance_after_cents) / 100

    def mark_as_completed(self):
        """Mark transaction as completed"""
        self.status = TransactionStatus.COMPLETED
        self.processed_at = datetime.now(timezone.utc)

    def mark_as_failed(self, reason=None):
        """Mark transaction as failed"""
        self.status = TransactionStatus.FAILED
        if reason:
            self.compliance_notes = reason

    def reverse_transaction(self, reason=None):
        """Create a reversal transaction"""
        if self.status != TransactionStatus.COMPLETED:
            raise ValueError("Can only reverse completed transactions")

        # Create reversal transaction
        reversal = Transaction(
            transaction_type=TransactionType.ADJUSTMENT,
            transaction_category=TransactionCategory.REFUND,
            status=TransactionStatus.COMPLETED,
            amount_cents=-self.amount_cents,  # Negative amount for reversal
            currency=self.currency,
            description=f"Reversal of {self.transaction_id}",
            user_id=self.user_id,
            account_id=self.account_id,
            parent_transaction_id=self.id,
            processed_at=datetime.now(timezone.utc),
            compliance_notes=reason or "Transaction reversal",
        )

        # Mark original transaction as reversed
        self.status = TransactionStatus.REVERSED

        return reversal

    def flag_as_suspicious(self, reason=None):
        """Flag transaction as suspicious for AML review"""
        self.is_suspicious = True
        self.aml_flagged = True
        if reason:
            self.compliance_notes = reason

    def calculate_risk_score(self):
        """Calculate risk score based on various factors"""
        risk_score = 0

        # Amount-based risk
        amount = self.get_amount_decimal()
        if amount > 10000:  # Large transactions
            risk_score += 30
        elif amount > 5000:
            risk_score += 15
        elif amount > 1000:
            risk_score += 5

        # Time-based risk (transactions outside business hours)
        if self.created_at:
            hour = self.created_at.hour
            if hour < 6 or hour > 22:  # Outside 6 AM - 10 PM
                risk_score += 10

        # Location-based risk (international transactions)
        if self.country_code and self.country_code != "US":
            risk_score += 20

        # Frequency-based risk would require additional logic
        # to check recent transaction patterns

        self.risk_score = min(risk_score, 100)  # Cap at 100
        return self.risk_score

    def is_high_risk(self):
        """Check if transaction is high risk"""
        return self.risk_score >= 70 or self.is_suspicious or self.aml_flagged

    def to_dict(self, include_sensitive=False):
        """Convert transaction to dictionary for API responses"""
        data = {
            "id": str(self.id),
            "transaction_id": self.transaction_id,
            "transaction_type": self.transaction_type.value,
            "transaction_category": self.transaction_category.value,
            "status": self.status.value,
            "amount": float(self.get_amount_decimal()),
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
                        float(self.get_balance_before_decimal())
                        if self.get_balance_before_decimal()
                        else None
                    ),
                    "balance_after": (
                        float(self.get_balance_after_decimal())
                        if self.get_balance_after_decimal()
                        else None
                    ),
                    "fee_amount": float(self.get_fee_amount_decimal()),
                    "risk_score": self.risk_score,
                    "fraud_score": self.fraud_score,
                    "is_suspicious": self.is_suspicious,
                    "aml_flagged": self.aml_flagged,
                    "ip_address": self.ip_address,
                    "transaction_location": self.transaction_location,
                    "country_code": self.country_code,
                }
            )

            # Include exchange rate info if applicable
            if self.original_amount_cents:
                data.update(
                    {
                        "original_amount": float(self.get_original_amount_decimal()),
                        "original_currency": self.original_currency,
                        "exchange_rate": (
                            float(self.exchange_rate) if self.exchange_rate else None
                        ),
                    }
                )

        return data

    def __repr__(self):
        return f"<Transaction {self.transaction_id} ({self.transaction_type.value}: {self.get_amount_decimal()} {self.currency})>"

"""Ledger Entry Model for Double-Entry Bookkeeping"""

from typing import Any
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum as PyEnum
from sqlalchemy import Column, DateTime, ForeignKey, Index, Numeric, String, Text
from .database import Base


class LedgerAccountType(PyEnum):
    """Ledger account types for double-entry bookkeeping"""

    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


class LedgerEntry(Base):
    """Ledger Entry model for double-entry bookkeeping"""

    __tablename__ = "ledger_entries"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    journal_entry_id = Column(String(36), nullable=False, index=True)
    transaction_id = Column(String(36), ForeignKey("transactions.id"), nullable=True)

    # Account information
    account_type = Column(
        String(20), nullable=False
    )  # ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    account_name = Column(String(100), nullable=False, index=True)

    # Amounts
    debit_amount = Column(
        Numeric(precision=20, scale=8), default=Decimal("0.00000000"), nullable=False
    )
    credit_amount = Column(
        Numeric(precision=20, scale=8), default=Decimal("0.00000000"), nullable=False
    )
    currency = Column(String(3), default="USD", nullable=False)

    # Description and metadata
    description = Column(Text, nullable=True)
    reference_number = Column(String(50), nullable=True)

    # Timestamps
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    posted_at = Column(DateTime(timezone=True), nullable=True)

    # Indexes for better query performance
    __table_args__ = (
        Index("idx_ledger_journal_entry", "journal_entry_id"),
        Index("idx_ledger_account_name", "account_name"),
        Index("idx_ledger_created_at", "created_at"),
    )

    def to_dict(self) -> Any:
        """Convert to dictionary"""
        return {
            "id": self.id,
            "journal_entry_id": self.journal_entry_id,
            "transaction_id": self.transaction_id,
            "account_type": self.account_type,
            "account_name": self.account_name,
            "debit_amount": float(self.debit_amount),
            "credit_amount": float(self.credit_amount),
            "currency": self.currency,
            "description": self.description,
            "reference_number": self.reference_number,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "posted_at": self.posted_at.isoformat() if self.posted_at else None,
        }

    def __repr__(self) -> Any:
        return f"<LedgerEntry {self.account_name} D:{self.debit_amount} C:{self.credit_amount}>"

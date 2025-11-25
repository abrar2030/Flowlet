import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Boolean, Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import relationship

from ..security.password_security import check_password, hash_password
from .database import Base, db  # Import Base and db from the local database setup

"""
User Model for Flowlet Financial Backend
"""


class UserRole(PyEnum):
    ADMIN = "admin"
    USER = "user"
    AUDITOR = "auditor"


class UserStatus(PyEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CLOSED = "closed"


class User(Base):
    """Enhanced User model with security features"""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(100), nullable=True)

    # Enhanced password security
    password_hash = Column(String(255), nullable=False)
    password_history = Column(Text, nullable=True)  # JSON array of previous hashes
    password_changed_at = Column(DateTime, default=datetime.utcnow)
    password_expires_at = Column(DateTime, nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    account_locked_until = Column(DateTime, nullable=True)

    # Personal information (encrypted)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    phone_verified = Column(Boolean, default=False)
    phone_verification_token = Column(String(10), nullable=True)

    # Encrypted PII fields
    date_of_birth_encrypted = Column(Text, nullable=True)
    ssn_encrypted = Column(Text, nullable=True)
    address_encrypted = Column(Text, nullable=True)

    # Account status and security
    role = Column(db.Enum(UserRole), default=UserRole.USER, nullable=False)
    status = Column(db.Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    kyc_status = Column(
        String(20), default="pending"
    )  # pending, verified, rejected, suspended
    account_status = Column(String(20), default="active")  # active, suspended, closed
    risk_score = Column(Integer, default=0)
    is_suspicious = Column(Boolean, default=False)

    # Two-factor authentication
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(32), nullable=True)
    backup_codes = Column(Text, nullable=True)  # JSON array

    # Session management
    max_concurrent_sessions = Column(Integer, default=3)
    force_logout_all = Column(Boolean, default=False)

    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)
    last_login_ip = Column(String(45), nullable=True)

    # Relationships
    wallets = relationship(
        "Wallet", back_populates="user", cascade="all, delete-orphan"
    )
    kyc_records = relationship(
        "KYCRecord", back_populates="user", cascade="all, delete-orphan"
    )

    # Indexes for performance
    __table_args__ = (
        Index("idx_user_email_status", "email", "account_status"),
        Index("idx_user_kyc_status", "kyc_status"),
        Index("idx_user_risk_score", "risk_score"),
    )

    def set_password(self, password):
        """Sets the password hash securely"""
        self.password_hash = hash_password(password)

    def check_password(self, password):
        """Checks the password against the stored hash"""
        return check_password(self.password_hash, password)

    def __repr__(self):
        return f"<User {self.email}>"

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "role": self.role.value,
            "status": self.status.value,
            "kyc_status": self.kyc_status,
            "created_at": self.created_at.isoformat(),
        }

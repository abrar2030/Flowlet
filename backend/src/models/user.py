from typing import Any
import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum
from sqlalchemy import Boolean, Column, DateTime, Index, Integer, String, Text
from sqlalchemy.orm import relationship
from ..security.password_security import check_password, hash_password
from .database import Base, db


class UserRole(PyEnum):
    """User roles for RBAC - Merged from both"""

    ADMIN = "admin"
    USER = "user"
    AUDITOR = "auditor"
    SUPPORT = "support"
    COMPLIANCE = "compliance"


class UserStatus(PyEnum):
    """User account status - Merged from both"""

    ACTIVE = "active"
    SUSPENDED = "suspended"
    CLOSED = "closed"
    INACTIVE = "inactive"
    PENDING_VERIFICATION = "pending_verification"
    LOCKED = "locked"


class KYCStatus(PyEnum):
    """KYC verification status - From app/models/user.py"""

    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"
    EXPIRED = "expired"


class User(Base):
    """User model with merged security and compliance features"""

    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String(100), nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    password_hash = Column(String(255), nullable=False)
    password_history = Column(Text, nullable=True)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    password_expires_at = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(Integer, default=0)
    account_locked_until = Column(DateTime(timezone=True), nullable=True)
    last_failed_login = Column(DateTime(timezone=True), nullable=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    phone_verified = Column(Boolean, default=False)
    phone_verification_token = Column(String(10), nullable=True)
    phone_verified_at = Column(DateTime(timezone=True), nullable=True)
    date_of_birth_encrypted = Column(Text, nullable=True)
    ssn_encrypted = Column(Text, nullable=True)
    address_encrypted = Column(Text, nullable=True)
    street_address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(2), nullable=True, default="US")
    role = Column(db.Enum(UserRole), default=UserRole.USER, nullable=False)
    status = Column(db.Enum(UserStatus), default=UserStatus.ACTIVE, nullable=False)
    kyc_status = Column(
        db.Enum(KYCStatus), default=KYCStatus.NOT_STARTED, nullable=False
    )
    account_status = Column(String(20), default="active")
    risk_score = Column(Integer, default=0)
    is_suspicious = Column(Boolean, default=False)
    is_active = Column(Boolean, nullable=False, default=True)
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String(32), nullable=True)
    backup_codes = Column(Text, nullable=True)
    mfa_enabled = Column(Boolean, nullable=False, default=False)
    mfa_secret = Column(String(32), nullable=True)
    max_concurrent_sessions = Column(Integer, default=3)
    force_logout_all = Column(Boolean, default=False)
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True)
    privacy_accepted_at = Column(DateTime(timezone=True), nullable=True)
    marketing_consent = Column(Boolean, nullable=False, default=False)
    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_login_ip = Column(String(45), nullable=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    wallets = relationship(
        "Account", back_populates="user", cascade="all, delete-orphan"
    )
    kyc_records = relationship(
        "KYCRecord", back_populates="user", cascade="all, delete-orphan"
    )
    __table_args__ = (
        Index("idx_user_email_status", "email", "status"),
        Index("idx_user_kyc_status", "kyc_status"),
        Index("idx_user_risk_score", "risk_score"),
    )

    def set_password(self, password: Any) -> Any:
        """Sets the password hash securely"""
        self.password_hash = hash_password(password)
        self.password_changed_at = datetime.now(timezone.utc)

    def check_password(self, password: Any) -> Any:
        """Checks the password against the stored hash"""
        return check_password(self.password_hash, password)

    def is_password_expired(self, max_age_days: int = 90) -> bool:
        """Check if password has expired"""
        if not self.password_changed_at:
            return True
        age = datetime.now(timezone.utc) - self.password_changed_at
        return age.days > max_age_days

    def increment_failed_login(self) -> None:
        """Increment failed login attempts"""
        self.failed_login_attempts += 1
        self.last_failed_login = datetime.now(timezone.utc)
        if self.failed_login_attempts >= 5:
            self.status = UserStatus.LOCKED

    def reset_failed_login(self) -> None:
        """Reset failed login attempts after successful login"""
        self.failed_login_attempts = 0
        self.last_failed_login = None
        self.last_login_at = datetime.now(timezone.utc)
        if self.status == UserStatus.LOCKED:
            self.status = UserStatus.ACTIVE

    def is_locked(self) -> bool:
        """Check if account is locked"""
        return self.status == UserStatus.LOCKED

    def can_login(self) -> bool:
        """Check if user can login"""
        return (
            self.is_active
            and self.status in [UserStatus.ACTIVE, UserStatus.PENDING_VERIFICATION]
            and (not self.is_locked())
        )

    @property
    def full_name(self) -> str:
        """Get full name"""
        return f"{self.first_name} {self.last_name}"

    @property
    def is_email_verified(self) -> bool:
        """Check if email is verified"""
        return self.email_verified_at is not None or self.email_verified

    @property
    def is_phone_verified(self) -> bool:
        """Check if phone is verified"""
        return self.phone_verified_at is not None or self.phone_verified

    @property
    def is_admin(self) -> bool:
        """Check if user is an admin"""
        return self.role == UserRole.ADMIN

    def has_role(self, role: UserRole) -> bool:
        """Check if user has specific role"""
        return self.role == role

    def to_dict(self, include_sensitive: bool = False) -> dict:
        """Convert to dictionary with optional sensitive data - Merged from both"""
        data = {
            "id": self.id,
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "role": self.role.value,
            "status": self.status.value,
            "kyc_status": self.kyc_status.value,
            "is_active": self.is_active,
            "two_factor_enabled": self.two_factor_enabled,
            "is_email_verified": self.is_email_verified,
            "is_phone_verified": self.is_phone_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login_at": (
                self.last_login_at.isoformat() if self.last_login_at else None
            ),
        }
        if include_sensitive:
            data.update(
                {
                    "phone": self.phone,
                    "street_address": self.street_address,
                    "city": self.city,
                    "state": self.state,
                    "postal_code": self.postal_code,
                    "country": self.country,
                    "failed_login_attempts": self.failed_login_attempts,
                    "password_changed_at": (
                        self.password_changed_at.isoformat()
                        if self.password_changed_at
                        else None
                    ),
                    "risk_score": self.risk_score,
                    "is_suspicious": self.is_suspicious,
                }
            )
        return data

    def __repr__(self) -> Any:
        return f"<User {self.email}>"

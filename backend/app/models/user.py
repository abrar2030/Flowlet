"""
User model with improved security and compliance features
"""

import uuid
import enum
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import Column, String, Boolean, DateTime, Text, Enum
from .mixins import UUID
from app import db

class UserRole(enum.Enum):
    """User roles for RBAC"""
    CUSTOMER = "customer"
    ADMIN = "admin"
    SUPPORT = "support"
    COMPLIANCE = "compliance"
    AUDITOR = "auditor"

class UserStatus(enum.Enum):
    """User account status"""
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"
    LOCKED = "locked"

class KYCStatus(enum.Enum):
    """KYC verification status"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    REJECTED = "rejected"
    EXPIRED = "expired"

class User(db.Model):
    """User model with improved security and compliance"""
    __tablename__ = "users"
    
    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    
    # Personal information (encrypted in production)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    date_of_birth = Column(DateTime, nullable=True)
    
    # Address information
    street_address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    postal_code = Column(String(20), nullable=True)
    country = Column(String(2), nullable=True, default='US')  # ISO country code
    
    # Account status and roles
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CUSTOMER)
    status = Column(Enum(UserStatus), nullable=False, default=UserStatus.PENDING_VERIFICATION)
    kyc_status = Column(Enum(KYCStatus), nullable=False, default=KYCStatus.NOT_STARTED)
    
    # Security settings
    is_active = Column(Boolean, nullable=False, default=True)
    mfa_enabled = Column(Boolean, nullable=False, default=False)
    mfa_secret = Column(String(32), nullable=True)  # TOTP secret
    failed_login_attempts = Column(db.Integer, nullable=False, default=0)
    last_failed_login = Column(DateTime(timezone=True), nullable=True)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Compliance and audit
    terms_accepted_at = Column(DateTime(timezone=True), nullable=True)
    privacy_accepted_at = Column(DateTime(timezone=True), nullable=True)
    marketing_consent = Column(Boolean, nullable=False, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    phone_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Soft delete
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    def set_password(self, password: str) -> None:
        """Set password with strong hashing"""
        self.password_hash = generate_password_hash(
            password, 
            method="pbkdf2:sha256:100000"
        )
        self.password_changed_at = datetime.now(timezone.utc)
    
    def check_password(self, password: str) -> bool:
        """Check password"""
        return check_password_hash(self.password_hash, password)
    
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
        
        # Lock account after 5 failed attempts
        if self.failed_login_attempts >= 5:
            self.status = UserStatus.LOCKED
    
    def reset_failed_login(self) -> None:
        """Reset failed login attempts after successful login"""
        self.failed_login_attempts = 0
        self.last_failed_login = None
        self.last_login_at = datetime.now(timezone.utc)
        
        # Unlock account if it was locked due to failed attempts
        if self.status == UserStatus.LOCKED:
            self.status = UserStatus.ACTIVE
    
    def is_locked(self) -> bool:
        """Check if account is locked"""
        return self.status == UserStatus.LOCKED
    
    def can_login(self) -> bool:
        """Check if user can login"""
        return (
            self.is_active and 
            self.status in [UserStatus.ACTIVE, UserStatus.PENDING_VERIFICATION] and
            not self.is_locked()
        )
    
    @property
    def full_name(self) -> str:
        """Get full name"""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_email_verified(self) -> bool:
        """Check if email is verified"""
        return self.email_verified_at is not None
    
    @property
    def is_phone_verified(self) -> bool:
        """Check if phone is verified"""
        return self.phone_verified_at is not None
    
    def has_role(self, role: UserRole) -> bool:
        """Check if user has specific role"""
        return self.role == role
    
    def has_permission(self, permission: str) -> bool:
        """Check if user has specific permission (simplified RBAC)"""
        role_permissions = {
            UserRole.CUSTOMER: ['view_own_data', 'manage_own_account'],
            UserRole.SUPPORT: ['view_customer_data', 'assist_customers'],
            UserRole.ADMIN: ['manage_users', 'view_all_data', 'system_admin'],
            UserRole.COMPLIANCE: ['view_compliance_data', 'generate_reports'],
            UserRole.AUDITOR: ['view_audit_logs', 'generate_audit_reports']
        }
        
        return permission in role_permissions.get(self.role, [])
    
    def to_dict(self, include_sensitive: bool = False) -> dict:
        """Convert to dictionary with optional sensitive data"""
        data = {
            "id": str(self.id),
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "full_name": self.full_name,
            "role": self.role.value,
            "status": self.status.value,
            "kyc_status": self.kyc_status.value,
            "is_active": self.is_active,
            "mfa_enabled": self.mfa_enabled,
            "is_email_verified": self.is_email_verified,
            "is_phone_verified": self.is_phone_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "last_login_at": self.last_login_at.isoformat() if self.last_login_at else None
        }
        
        if include_sensitive:
            data.update({
                "phone_number": self.phone_number,
                "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
                "street_address": self.street_address,
                "city": self.city,
                "state": self.state,
                "postal_code": self.postal_code,
                "country": self.country,
                "failed_login_attempts": self.failed_login_attempts,
                "password_changed_at": self.password_changed_at.isoformat() if self.password_changed_at else None
            })
        
        return data
    
    def __repr__(self):
        return f'<User {self.email}>'


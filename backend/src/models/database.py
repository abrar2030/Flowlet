from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean, Numeric, ForeignKey, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
from decimal import Decimal
import uuid
import json

Base = declarative_base()

class User(Base):
    """Enhanced User model with security features"""
    __tablename__ = 'users'
    
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
    kyc_status = Column(String(20), default='pending')  # pending, verified, rejected, suspended
    account_status = Column(String(20), default='active')  # active, suspended, closed
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
    wallets = relationship("Wallet", back_populates="user", cascade="all, delete-orphan")
    kyc_records = relationship("KYCRecord", back_populates="user", cascade="all, delete-orphan")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_user_email_status', 'email', 'account_status'),
        Index('idx_user_kyc_status', 'kyc_status'),
        Index('idx_user_risk_score', 'risk_score'),
    )

class Wallet(Base):
    """Enhanced Wallet model with security features"""
    __tablename__ = 'wallets'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    
    wallet_type = Column(String(20), nullable=False)  # user, business, escrow
    currency = Column(String(3), nullable=False)
    
    # Balance fields with high precision
    balance = Column(Numeric(precision=20, scale=8), default=Decimal('0.00000000'))
    available_balance = Column(Numeric(precision=20, scale=8), default=Decimal('0.00000000'))
    pending_balance = Column(Numeric(precision=20, scale=8), default=Decimal('0.00000000'))
    
    # Wallet limits and controls
    daily_limit = Column(Numeric(precision=20, scale=2), nullable=True)
    monthly_limit = Column(Numeric(precision=20, scale=2), nullable=True)
    single_transaction_limit = Column(Numeric(precision=20, scale=2), nullable=True)
    
    # Security features
    status = Column(String(20), default='active')  # active, suspended, closed
    freeze_reason = Column(String(255), nullable=True)
    requires_approval = Column(Boolean, default=False)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_transaction_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="wallets")
    transactions = relationship("Transaction", back_populates="wallet", cascade="all, delete-orphan")
    cards = relationship("Card", back_populates="wallet", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_wallet_user_currency', 'user_id', 'currency'),
        Index('idx_wallet_status', 'status'),
        Index('idx_wallet_type', 'wallet_type'),
    )

class Transaction(Base):
    """Enhanced Transaction model with security features"""
    __tablename__ = 'transactions'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_id = Column(String(36), ForeignKey('wallets.id'), nullable=False)
    
    # Transaction details
    transaction_type = Column(String(20), nullable=False)  # credit, debit
    amount = Column(Numeric(precision=20, scale=8), nullable=False)
    currency = Column(String(3), nullable=False)
    
    # Transaction metadata
    description = Column(Text, nullable=True)
    reference_id = Column(String(100), unique=True, nullable=True)
    external_transaction_id = Column(String(100), nullable=True)
    
    # Payment method and processing
    payment_method = Column(String(50), nullable=True)
    processor_response = Column(Text, nullable=True)  # JSON
    
    # Status and lifecycle
    status = Column(String(20), default='pending')  # pending, completed, failed, cancelled
    failure_reason = Column(String(255), nullable=True)
    
    # Security and compliance
    risk_score = Column(Integer, default=0)
    is_flagged = Column(Boolean, default=False)
    compliance_status = Column(String(20), default='pending')  # pending, approved, rejected
    
    # Balances after transaction
    balance_before = Column(Numeric(precision=20, scale=8), nullable=True)
    balance_after = Column(Numeric(precision=20, scale=8), nullable=True)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    
    # Relationships
    wallet = relationship("Wallet", back_populates="transactions")
    ledger_entries = relationship("LedgerEntry", back_populates="transaction", cascade="all, delete-orphan")
    fraud_alerts = relationship("FraudAlert", back_populates="transaction", cascade="all, delete-orphan")
    
    # Indexes
    __table_args__ = (
        Index('idx_transaction_wallet_date', 'wallet_id', 'created_at'),
        Index('idx_transaction_status', 'status'),
        Index('idx_transaction_type', 'transaction_type'),
        Index('idx_transaction_reference', 'reference_id'),
        Index('idx_transaction_risk', 'risk_score'),
    )

class Card(Base):
    """Enhanced Card model with security features"""
    __tablename__ = 'cards'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_id = Column(String(36), ForeignKey('wallets.id'), nullable=False)
    
    # Card details (tokenized)
    card_type = Column(String(20), nullable=False)  # virtual, physical
    card_number_token = Column(String(100), nullable=False)  # Tokenized card number
    last_four_digits = Column(String(4), nullable=False)
    
    # Card metadata
    expiry_month = Column(Integer, nullable=False)
    expiry_year = Column(Integer, nullable=False)
    card_brand = Column(String(20), nullable=True)  # visa, mastercard, amex
    
    # Security features
    status = Column(String(20), default='active')  # active, blocked, expired, cancelled
    pin_hash = Column(String(255), nullable=True)
    pin_attempts = Column(Integer, default=0)
    pin_locked_until = Column(DateTime, nullable=True)
    
    # Spending controls
    spending_limit_daily = Column(Numeric(precision=20, scale=2), nullable=True)
    spending_limit_monthly = Column(Numeric(precision=20, scale=2), nullable=True)
    spending_limit_per_transaction = Column(Numeric(precision=20, scale=2), nullable=True)
    
    # Transaction controls
    online_transactions_enabled = Column(Boolean, default=True)
    international_transactions_enabled = Column(Boolean, default=False)
    contactless_enabled = Column(Boolean, default=True)
    atm_withdrawals_enabled = Column(Boolean, default=True)
    
    # Merchant category controls (JSON)
    merchant_categories_blocked = Column(Text, nullable=True)
    merchant_categories_allowed = Column(Text, nullable=True)
    
    # Geographic controls
    allowed_countries = Column(Text, nullable=True)  # JSON array
    blocked_countries = Column(Text, nullable=True)  # JSON array
    
    # Usage tracking
    total_spent_today = Column(Numeric(precision=20, scale=2), default=Decimal('0.00'))
    total_spent_month = Column(Numeric(precision=20, scale=2), default=Decimal('0.00'))
    last_used_at = Column(DateTime, nullable=True)
    last_used_location = Column(String(100), nullable=True)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    activated_at = Column(DateTime, nullable=True)
    
    # Relationships
    wallet = relationship("Wallet", back_populates="cards")
    
    # Indexes
    __table_args__ = (
        Index('idx_card_wallet', 'wallet_id'),
        Index('idx_card_status', 'status'),
        Index('idx_card_token', 'card_number_token'),
        Index('idx_card_last_four', 'last_four_digits'),
    )

class KYCRecord(Base):
    """Enhanced KYC Record model"""
    __tablename__ = 'kyc_records'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    
    # Verification details
    verification_level = Column(String(20), nullable=False)  # basic, enhanced, premium
    verification_status = Column(String(20), default='pending')  # pending, verified, rejected, expired
    verification_provider = Column(String(50), nullable=True)
    
    # Document information
    document_type = Column(String(50), nullable=True)
    document_number_encrypted = Column(Text, nullable=True)
    document_expiry_date = Column(DateTime, nullable=True)
    document_country = Column(String(2), nullable=True)
    
    # Verification results
    identity_verified = Column(Boolean, default=False)
    address_verified = Column(Boolean, default=False)
    document_verified = Column(Boolean, default=False)
    biometric_verified = Column(Boolean, default=False)
    
    # Risk assessment
    risk_score = Column(Integer, default=0)
    risk_factors = Column(Text, nullable=True)  # JSON array
    
    # AML screening
    watchlist_screening_status = Column(String(20), default='pending')
    watchlist_matches = Column(Text, nullable=True)  # JSON array
    pep_screening_status = Column(String(20), default='pending')
    sanctions_screening_status = Column(String(20), default='pending')
    
    # Verification metadata
    verification_date = Column(DateTime, nullable=True)
    expiry_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="kyc_records")
    
    # Indexes
    __table_args__ = (
        Index('idx_kyc_user_status', 'user_id', 'verification_status'),
        Index('idx_kyc_level', 'verification_level'),
        Index('idx_kyc_risk_score', 'risk_score'),
    )

class LedgerEntry(Base):
    """Enhanced Ledger Entry model for double-entry accounting"""
    __tablename__ = 'ledger_entries'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(36), ForeignKey('transactions.id'), nullable=False)
    
    # Account information
    account_type = Column(String(20), nullable=False)  # asset, liability, equity, revenue, expense
    account_name = Column(String(100), nullable=False)
    account_code = Column(String(20), nullable=True)
    
    # Entry amounts
    debit_amount = Column(Numeric(precision=20, scale=8), default=Decimal('0.00000000'))
    credit_amount = Column(Numeric(precision=20, scale=8), default=Decimal('0.00000000'))
    currency = Column(String(3), nullable=False)
    
    # Entry metadata
    description = Column(Text, nullable=True)
    reference_number = Column(String(100), nullable=True)
    
    # Reconciliation
    reconciled = Column(Boolean, default=False)
    reconciled_at = Column(DateTime, nullable=True)
    reconciled_by = Column(String(36), nullable=True)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transaction = relationship("Transaction", back_populates="ledger_entries")
    
    # Indexes
    __table_args__ = (
        Index('idx_ledger_transaction', 'transaction_id'),
        Index('idx_ledger_account', 'account_type', 'account_name'),
        Index('idx_ledger_date', 'created_at'),
        Index('idx_ledger_reconciled', 'reconciled'),
    )

class FraudAlert(Base):
    """Enhanced Fraud Alert model"""
    __tablename__ = 'fraud_alerts'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = Column(String(36), ForeignKey('transactions.id'), nullable=True)
    user_id = Column(String(36), ForeignKey('users.id'), nullable=False)
    
    # Alert details
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), default='medium')  # low, medium, high, critical
    risk_score = Column(Integer, nullable=False)
    
    # Alert description and context
    description = Column(Text, nullable=False)
    risk_factors = Column(Text, nullable=True)  # JSON array
    
    # Alert status and resolution
    status = Column(String(20), default='open')  # open, investigating, resolved, false_positive
    assigned_to = Column(String(36), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Machine learning model information
    model_version = Column(String(20), nullable=True)
    model_confidence = Column(Numeric(precision=5, scale=2), nullable=True)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    transaction = relationship("Transaction", back_populates="fraud_alerts")
    user = relationship("User")
    
    # Indexes
    __table_args__ = (
        Index('idx_fraud_alert_user', 'user_id'),
        Index('idx_fraud_alert_status', 'status'),
        Index('idx_fraud_alert_severity', 'severity'),
        Index('idx_fraud_alert_risk_score', 'risk_score'),
    )

class APIKey(Base):
    """Enhanced API Key model"""
    __tablename__ = 'api_keys'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Key information
    key_name = Column(String(100), nullable=False)
    api_key_hash = Column(String(64), nullable=False, unique=True)  # SHA-256 hash
    
    # Permissions and access control
    permissions = Column(Text, nullable=False)  # JSON array
    ip_whitelist = Column(Text, nullable=True)  # JSON array
    allowed_endpoints = Column(Text, nullable=True)  # JSON array
    
    # Rate limiting
    rate_limit = Column(Integer, default=1000)  # requests per hour
    rate_limit_window = Column(String(10), default='hour')  # minute, hour, day
    
    # Key status and lifecycle
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime, nullable=True)
    
    # Usage tracking
    last_used_at = Column(DateTime, nullable=True)
    last_used_ip = Column(String(45), nullable=True)
    total_requests = Column(Integer, default=0)
    
    # Audit fields
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_api_key_hash', 'api_key_hash'),
        Index('idx_api_key_active', 'is_active'),
        Index('idx_api_key_expires', 'expires_at'),
    )

class AuditLog(Base):
    """Enhanced Audit Log model (already defined in audit_logger.py)"""
    __tablename__ = 'audit_logs'
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # User and session context
    user_id = Column(String(36), nullable=True)
    session_id = Column(String(100), nullable=True)
    correlation_id = Column(String(100), nullable=True)
    
    # Action details
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(100), nullable=True)
    
    # Request context
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    request_method = Column(String(10), nullable=True)
    request_url = Column(Text, nullable=True)
    
    # Data (encrypted)
    request_data = Column(Text, nullable=True)
    response_data = Column(Text, nullable=True)
    additional_data = Column(Text, nullable=True)
    
    # Response information
    response_status = Column(Integer, nullable=True)
    response_time_ms = Column(Integer, nullable=True)
    
    # Risk and security
    risk_score = Column(Integer, default=0)
    is_suspicious = Column(Boolean, default=False)
    
    # Data integrity
    integrity_hash = Column(String(64), nullable=False)
    
    # Indexes
    __table_args__ = (
        Index('idx_audit_user_action', 'user_id', 'action'),
        Index('idx_audit_timestamp', 'timestamp'),
        Index('idx_audit_resource', 'resource_type', 'resource_id'),
        Index('idx_audit_suspicious', 'is_suspicious'),
        Index('idx_audit_risk_score', 'risk_score'),
    )


from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    address = db.Column(db.Text, nullable=True)
    kyc_status = db.Column(db.String(20), default='pending')  # pending, verified, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    wallets = db.relationship('Wallet', backref='user', lazy=True)
    kyc_records = db.relationship('KYCRecord', backref='user', lazy=True)

class Wallet(db.Model):
    __tablename__ = 'wallets'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    wallet_type = db.Column(db.String(20), nullable=False)  # user, business, escrow, operating
    currency = db.Column(db.String(3), nullable=False, default='USD')
    balance = db.Column(db.Numeric(15, 2), default=0.00)
    available_balance = db.Column(db.Numeric(15, 2), default=0.00)
    status = db.Column(db.String(20), default='active')  # active, suspended, closed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='wallet', lazy=True)
    cards = db.relationship('Card', backref='wallet', lazy=True)

class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_id = db.Column(db.String(36), db.ForeignKey('wallets.id'), nullable=False)
    transaction_type = db.Column(db.String(20), nullable=False)  # credit, debit, transfer
    amount = db.Column(db.Numeric(15, 2), nullable=False)
    currency = db.Column(db.String(3), nullable=False)
    description = db.Column(db.Text, nullable=True)
    reference_id = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed, cancelled
    payment_method = db.Column(db.String(50), nullable=True)  # card, bank_transfer, wallet
    external_transaction_id = db.Column(db.String(100), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    ledger_entries = db.relationship('LedgerEntry', backref='transaction', lazy=True)

class Card(db.Model):
    __tablename__ = 'cards'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    wallet_id = db.Column(db.String(36), db.ForeignKey('wallets.id'), nullable=False)
    card_type = db.Column(db.String(20), nullable=False)  # virtual, physical
    card_number_token = db.Column(db.String(100), nullable=False)  # Tokenized card number
    last_four_digits = db.Column(db.String(4), nullable=False)
    expiry_month = db.Column(db.Integer, nullable=False)
    expiry_year = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='active')  # active, blocked, expired, cancelled
    spending_limit_daily = db.Column(db.Numeric(15, 2), nullable=True)
    spending_limit_monthly = db.Column(db.Numeric(15, 2), nullable=True)
    merchant_categories_blocked = db.Column(db.Text, nullable=True)  # JSON array
    online_transactions_enabled = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class KYCRecord(db.Model):
    __tablename__ = 'kyc_records'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    verification_level = db.Column(db.String(20), nullable=False)  # basic, enhanced, premium
    document_type = db.Column(db.String(50), nullable=True)  # passport, drivers_license, national_id
    document_number = db.Column(db.String(100), nullable=True)
    verification_status = db.Column(db.String(20), default='pending')  # pending, verified, rejected
    verification_provider = db.Column(db.String(50), nullable=True)
    verification_date = db.Column(db.DateTime, nullable=True)
    risk_score = db.Column(db.Integer, nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LedgerEntry(db.Model):
    __tablename__ = 'ledger_entries'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = db.Column(db.String(36), db.ForeignKey('transactions.id'), nullable=False)
    account_type = db.Column(db.String(50), nullable=False)  # asset, liability, equity, revenue, expense
    account_name = db.Column(db.String(100), nullable=False)
    debit_amount = db.Column(db.Numeric(15, 2), default=0.00)
    credit_amount = db.Column(db.Numeric(15, 2), default=0.00)
    currency = db.Column(db.String(3), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FraudAlert(db.Model):
    __tablename__ = 'fraud_alerts'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    transaction_id = db.Column(db.String(36), nullable=True)
    user_id = db.Column(db.String(36), nullable=True)
    alert_type = db.Column(db.String(50), nullable=False)  # suspicious_transaction, velocity_check, location_anomaly
    risk_score = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text, nullable=True)
    status = db.Column(db.String(20), default='open')  # open, investigating, resolved, false_positive
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime, nullable=True)

class APIKey(db.Model):
    __tablename__ = 'api_keys'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key_name = db.Column(db.String(100), nullable=False)
    api_key_hash = db.Column(db.String(255), nullable=False)
    permissions = db.Column(db.Text, nullable=True)  # JSON array of permissions
    rate_limit = db.Column(db.Integer, default=1000)  # requests per hour
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used_at = db.Column(db.DateTime, nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(50), nullable=False)
    resource_id = db.Column(db.String(36), nullable=True)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.Text, nullable=True)
    request_data = db.Column(db.Text, nullable=True)  # JSON
    response_status = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


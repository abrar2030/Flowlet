from flask import Blueprint, request, jsonify, g
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy import and_, or_, func
from sqlalchemy.exc import IntegrityError
from decimal import Decimal, ROUND_HALF_UP
import uuid
from datetime import datetime, timezone, timedelta
import json
import logging
from typing import Dict, List, Optional, Tuple

from ..models.database import db, Wallet, Transaction, LedgerEntry, User, AuditLog
from ..security.encryption import encrypt_sensitive_data, decrypt_sensitive_data
from ..security.validation import validate_currency, validate_amount, validate_wallet_type
from ..utils.audit import log_audit_event
from ..utils.notifications import send_notification
from src.integrations.currency.exchange_rates import get_exchange_rate, convert_currency

# Create blueprint
wallet_bp = Blueprint(\'wallet\', __name__, url_prefix=\'/api/v1/wallets\')

# Configure rate limiting
limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger(__name__)

class WalletService:
    """
    Wallet Service implementing financial industry standards
    Supports multi-currency, real-time balance updates, and comprehensive audit trails
    """
    
    SUPPORTED_WALLET_TYPES = ['user', 'business', 'escrow', 'operating']
    SUPPORTED_CURRENCIES = [
        'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
        'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'ZAR',
        'BRL', 'INR', 'KRW', 'PLN'
    ]
    
    WALLET_STATUS_TRANSITIONS = {
        'pending': ['active', 'rejected'],
        'active': ['suspended', 'closed'],
        'suspended': ['active', 'closed'],
        'closed': [],  # Terminal state
        'rejected': []  # Terminal state
    }
    
    @staticmethod
    def create_wallet(user_id: str, wallet_type: str, currency: str = 'USD', 
                     initial_balance: Decimal = Decimal('0.00')) -> Dict:
        """
        Create a new wallet with comprehensive validation and audit trail
        
        Args:
            user_id: User identifier
            wallet_type: Type of wallet (user, business, escrow, operating)
            currency: ISO currency code
            initial_balance: Starting balance (default 0.00)
            
        Returns:
            Dict containing wallet information or error details
        """
        try:
            # Validate inputs
            if not validate_wallet_type(wallet_type):
                return {
                    'success': False,
                    'error': 'INVALID_WALLET_TYPE',
                    'message': f'Wallet type must be one of: {WalletService.SUPPORTED_WALLET_TYPES}'
                }
            
            if not validate_currency(currency):
                return {
                    'success': False,
                    'error': 'INVALID_CURRENCY',
                    'message': f'Currency must be one of: {WalletService.SUPPORTED_CURRENCIES}'
                }
            
            if not validate_amount(initial_balance):
                return {
                    'success': False,
                    'error': 'INVALID_AMOUNT',
                    'message': 'Initial balance must be a valid positive amount'
                }
            
            # Check if user exists
            user = User.query.get(user_id)
            if not user:
                return {
                    'success': False,
                    'error': 'USER_NOT_FOUND',
                    'message': 'User does not exist'
                }
            
            # Business logic: Check wallet limits per user
            existing_wallets = Wallet.query.filter_by(user_id=user_id).count()
            if existing_wallets >= 10:  # Financial industry standard limit
                return {
                    'success': False,
                    'error': 'WALLET_LIMIT_EXCEEDED',
                    'message': 'Maximum number of wallets per user exceeded'
                }
            
            # Create wallet
            wallet = Wallet(
                id=str(uuid.uuid4()),
                user_id=user_id,
                wallet_type=wallet_type,
                currency=currency,
                balance=initial_balance,
                available_balance=initial_balance,
                status='active' if initial_balance == 0 else 'pending',  # Pending if funded
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            db.session.add(wallet)
            
            # Create initial ledger entries if there's an initial balance
            if initial_balance > 0:
                # Create funding transaction
                funding_transaction = Transaction(
                    id=str(uuid.uuid4()),
                    wallet_id=wallet.id,
                    transaction_type='credit',
                    amount=initial_balance,
                    currency=currency,
                    description='Initial wallet funding',
                    status='completed',
                    payment_method='initial_funding',
                    created_at=datetime.now(timezone.utc)
                )
                
                db.session.add(funding_transaction)
                
                # Create corresponding ledger entries (double-entry bookkeeping)
                debit_entry = LedgerEntry(
                    id=str(uuid.uuid4()),
                    transaction_id=funding_transaction.id,
                    account_type='asset',
                    account_name=f'wallet_{wallet.id}',
                    debit_amount=initial_balance,
                    credit_amount=Decimal('0.00'),
                    currency=currency,
                    description='Wallet funding - debit to wallet asset',
                    created_at=datetime.now(timezone.utc)
                )
                
                credit_entry = LedgerEntry(
                    id=str(uuid.uuid4()),
                    transaction_id=funding_transaction.id,
                    account_type='liability',
                    account_name='customer_deposits',
                    debit_amount=Decimal('0.00'),
                    credit_amount=initial_balance,
                    currency=currency,
                    description='Wallet funding - credit to customer deposits',
                    created_at=datetime.now(timezone.utc)
                )
                
                db.session.add(debit_entry)
                db.session.add(credit_entry)
            
            db.session.commit()
            
            # Log audit event
            log_audit_event(
                user_id=user_id,
                action='WALLET_CREATED',
                resource_type='wallet',
                resource_id=wallet.id,
                details={
                    'wallet_type': wallet_type,
                    'currency': currency,
                    'initial_balance': str(initial_balance)
                }
            )
            
            # Send notification
            send_notification(
                user_id=user_id,
                notification_type='wallet_created',
                message=f'New {wallet_type} wallet created in {currency}',
                metadata={'wallet_id': wallet.id}
            )
            
            return {
                'success': True,
                'wallet': {
                    'id': wallet.id,
                    'wallet_type': wallet.wallet_type,
                    'currency': wallet.currency,
                    'balance': str(wallet.balance),
                    'available_balance': str(wallet.available_balance),
                    'status': wallet.status,
                    'created_at': wallet.created_at.isoformat() + 'Z'
                }
            }
            
        except IntegrityError as e:
            db.session.rollback()
            logger.error(f"Database integrity error creating wallet: {str(e)}")
            return {
                'success': False,
                'error': 'DATABASE_ERROR',
                'message': 'Failed to create wallet due to database constraint'
            }
        except Exception as e:
            db.session.rollback()
            logger.error(f"Unexpected error creating wallet: {str(e)}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'An unexpected error occurred'
            }
    
    @staticmethod
    def get_wallet_balance(wallet_id: str, include_pending: bool = False) -> Dict:
        """
        Get real-time wallet balance with optional pending transactions
        
        Args:
            wallet_id: Wallet identifier
            include_pending: Whether to include pending transactions in calculation
            
        Returns:
            Dict containing balance information
        """
        try:
            wallet = Wallet.query.with_for_update().get(wallet_id)
            if not wallet:
                return {
                    'success': False,
                    'error': 'WALLET_NOT_FOUND',
                    'message': 'Wallet does not exist'
                }
            
            # Calculate real-time balance from ledger entries
            ledger_balance = db.session.query(
                func.sum(LedgerEntry.debit_amount - LedgerEntry.credit_amount)
            ).join(Transaction).filter(
                Transaction.wallet_id == wallet_id,
                Transaction.status == 'completed'
            ).scalar() or Decimal('0.00')
            
            # Calculate pending balance if requested
            pending_balance = Decimal('0.00')
            if include_pending:
                pending_transactions = db.session.query(
                    func.sum(
                        func.case(
                            (Transaction.transaction_type == 'credit', Transaction.amount),
                            else_=-Transaction.amount
                        )
                    )
                ).filter(
                    Transaction.wallet_id == wallet_id,
                    Transaction.status == 'pending'
                ).scalar() or Decimal('0.00')
                
                pending_balance = pending_transactions
            
            # Update wallet balance if it differs (reconciliation)
            if wallet.balance != ledger_balance:
                logger.warning(f"Balance mismatch for wallet {wallet_id}: "
                             f"wallet={wallet.balance}, ledger={ledger_balance}")
                wallet.balance = new_balance
        db.session.add(wallet) # Explicitly mark as dirty for clarity and safetynce
                wallet.updated_at = datetime.now(timezone.utc)
                db.session.commit()
            
            return {
                'success': True,
                'balance': {
                    'wallet_id': wallet_id,
                    'currency': wallet.currency,
                    'available_balance': str(wallet.balance),
                    'pending_balance': str(pending_balance),
                    'total_balance': str(wallet.balance + pending_balance),
                    'last_updated': wallet.updated_at.isoformat() + 'Z'
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting wallet balance: {str(e)}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'Failed to retrieve wallet balance'
            }
    
   @staticmethod
    def transfer_funds(from_wallet_id: str, to_wallet_id: str, amount: Decimal, description: str, reference_id: str = None) -> Dict:
        """
        Transfer funds between two wallets, handling multi-currency conversion.
        
        Args:
            from_wallet_id: ID of the wallet to debit
            to_wallet_id: ID of the wallet to credit
            amount: Amount to transfer (in source wallet currency)
            description: Description of the transfer
            reference_id: Optional client-provided idempotency key
            
        Returns:
            Dict containing success status or error details
        """
        try:
            # Start a transaction block for atomicity and use row-level locking for race condition prevention
            with db.session.begin_nested():
                # 1. Idempotency Check
                if reference_id:
                    # Check if transaction with this reference_id already exists
                    existing_transaction = Transaction.query.filter_by(reference_id=reference_id).first()
                    if existing_transaction:
                        # Log idempotent request
                        # User ID is not available here, should be passed in a real scenario, using None for now
                        log_audit_event(
                            user_id=None, 
                            action='FUNDS_TRANSFER_IDEMPOTENT',
                            resource_type='transfer',
                            resource_id=existing_transaction.id,
                            details={'reference_id': reference_id}
                        )
                        return {
                            'success': True,
                            'message': 'Transfer already processed (idempotent)',
                            'transfer_id': existing_transaction.id
                        }
                
                # 2. Get wallets with row-level lock (SELECT ... FOR UPDATE)
                # Order by ID to prevent deadlocks
                wallet_ids = sorted([from_wallet_id, to_wallet_id])
                
                # Use .filter(Wallet.id.in_(wallet_ids)) to select both wallets
                wallets = Wallet.query.filter(Wallet.id.in_(wallet_ids)).with_for_update().all()
                
                if len(wallets) != 2:
                    return {'success': False, 'error': 'WALLET_NOT_FOUND', 'message': 'One or both wallets not found'}
                
                from_wallet = next((w for w in wallets if w.id == from_wallet_id), None)
                to_wallet = next((w for w in wallets if w.id == to_wallet_id), None)
                
                if not from_wallet or not to_wallet:
                    return {'success': False, 'error': 'WALLET_NOT_FOUND', 'message': 'One or both wallets not found'}
                
                # 3. Currency Conversion
                transfer_amount = amount
                if from_wallet.currency != to_wallet.currency:
                    # Use Decimal for conversion to maintain precision
                    rate_result = convert_currency(amount, from_wallet.currency, to_wallet.currency)
                    if not rate_result['success']:
                        return {'success': False, 'error': 'CURRENCY_CONVERSION_FAILED', 'message': rate_result['message']}
                    transfer_amount = rate_result['converted_amount']
                
                # 4. Business Rule Validation
                if from_wallet.balance < amount:
                    return {
                        'success': False,
                        'error': 'INSUFFICIENT_FUNDS',
                        'message': 'Insufficient funds in source wallet'
                    }
                
                # 5. Precision Check (Monetary values must use Decimal)
                # Assuming amount and transfer_amount are already Decimal
                
                # 6. Perform debit and credit
                from_wallet.balance -= amount
                from_wallet.available_balance -= amount
                to_wallet.balance += transfer_amount
                to_wallet.available_balance += transfer_amount
                
                from_wallet.updated_at = datetime.now(timezone.utc)
                to_wallet.updated_at = datetime.now(timezone.utc)
                
                # 7. Create transactions and ledger entries
                transfer_id = str(uuid.uuid4())
                
                # Debit Transaction (Source)
                debit_transaction = Transaction(
                    id=transfer_id,
                    wallet_id=from_wallet_id,
                    transaction_type='debit',
                    amount=amount,
                    currency=from_wallet.currency,
                    description=f'Transfer to {to_wallet_id}: {description}',
                    status='completed',
                    reference_id=reference_id,
                    created_at=datetime.now(timezone.utc)
                )
                
                # Credit Transaction (Destination)
                credit_transaction = Transaction(
                    id=str(uuid.uuid4()),
                    wallet_id=to_wallet_id,
                    transaction_type='credit',
                    amount=transfer_amount,
                    currency=to_wallet.currency,
                    description=f'Transfer from {from_wallet_id}: {description}',
                    status='completed',
                    reference_id=reference_id,
                    created_at=datetime.now(timezone.utc)
                )
                
                db.session.add_all([debit_transaction, credit_transaction])
                
                # Ledger Entries (Simplified for example, full double-entry would be more complex)
                # Debit the source wallet asset account
                debit_entry_source = LedgerEntry(
                    id=str(uuid.uuid4()),
                    transaction_id=transfer_id,
                    account_type='asset',
                    account_name=f'wallet_{from_wallet_id}',
                    debit_amount=Decimal('0.00'),
                    credit_amount=amount,
                    currency=from_wallet.currency,
                    description='Transfer out - credit source wallet asset',
                    created_at=datetime.now(timezone.utc)
                )
                
                # Credit the destination wallet asset account
                credit_entry_dest = LedgerEntry(
                    id=str(uuid.uuid4()),
                    transaction_id=credit_transaction.id,
                    account_type='asset',
                    account_name=f'wallet_{to_wallet_id}',
                    debit_amount=transfer_amount,
                    credit_amount=Decimal('0.00'),
                    currency=to_wallet.currency,
                    description='Transfer in - debit destination wallet asset',
                    created_at=datetime.now(timezone.utc)
                )
                
                db.session.add_all([debit_entry_source, credit_entry_dest])
                
                # Commit the transaction
                db.session.commit()
            
            # 8. Audit and Notify
            log_audit_event(
                user_id=from_wallet.user_id,
                action='FUNDS_TRANSFERRED',
                resource_type='transfer',
                resource_id=transfer_id,
                details={
                    'from_wallet': from_wallet_id,
                    'to_wallet': to_wallet_id,
                    'amount': str(amount),
                    'currency': from_wallet.currency
                }
            )
            
            send_notification(
                user_id=from_wallet.user_id,
                notification_type='funds_transferred_out',
                message=f'Transferred {amount} {from_wallet.currency}',
                metadata={'transfer_id': transfer_id, 'to_wallet_id': to_wallet_id}
            )
            
            send_notification(
                user_id=to_wallet.user_id,
                notification_type='funds_transferred_in',
                message=f'Received {transfer_amount} {to_wallet.currency}',
                metadata={'transfer_id': transfer_id, 'from_wallet_id': from_wallet_id}
            )
            
            return {
                'success': True,
                'transfer': {
                    'transfer_id': transfer_id,
                    'from_wallet_id': from_wallet_id,
                    'to_wallet_id': to_wallet_id,
                    'amount': str(amount),
                    'currency': from_wallet.currency,
                    'converted_amount': str(transfer_amount),
                    'converted_currency': to_wallet.currency,
                    'status': 'completed',
                    'created_at': datetime.now(timezone.utc).isoformat() + 'Z'
                }
            }
            
        except IntegrityError as e:
            db.session.rollback()
            logger.error(f"Database integrity error during fund transfer: {str(e)}")
            return {'success': False, 'error': 'DATABASE_ERROR', 'message': 'Failed to complete transfer due to database constraint'}
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error transferring funds: {str(e)}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'Failed to transfer funds'
            }erence_id: str = None) -> Dict:
        """
        Transfer funds between wallets with comprehensive validation and audit trail
        
        Args:
            from_wallet_id: Source wallet identifier
            to_wallet_id: Destination wallet identifier
            amount: Transfer amount
            description: Optional transfer description
            reference_id: Optional external reference
            
        Returns:
            Dict containing transfer result
        """
        try:
            # Validate amount
            if not validate_amount(amount) or amount <= 0:
                return {
                    'success': False,
                    'error': 'INVALID_AMOUNT',
                    'message': 'Transfer amount must be positive'
                }
            
            # Get wallets
            from_wallet = Wallet.query.get(from_wallet_id)
            to_wallet = Wallet.query.get(to_wallet_id)
            
            if not from_wallet:
                return {
                    'success': False,
                    'error': 'SOURCE_WALLET_NOT_FOUND',
                    'message': 'Source wallet does not exist'
                }
            
            if not to_wallet:
                return {
                    'success': False,
                    'error': 'DESTINATION_WALLET_NOT_FOUND',
                    'message': 'Destination wallet does not exist'
                }
            
            # Check wallet statuses
            if from_wallet.status != 'active':
                return {
                    'success': False,
                    'error': 'SOURCE_WALLET_INACTIVE',
                    'message': 'Source wallet is not active'
                }
            
            if to_wallet.status != 'active':
                return {
                    'success': False,
                    'error': 'DESTINATION_WALLET_INACTIVE',
                    'message': 'Destination wallet is not active'
                }
            
            # Handle currency conversion if needed
            transfer_amount = amount
            if from_wallet.currency != to_wallet.currency:
                exchange_rate = get_exchange_rate(from_wallet.currency, to_wallet.currency)
                if not exchange_rate:
                    return {
                        'success': False,
                        'error': 'EXCHANGE_RATE_UNAVAILABLE',
                        'message': 'Currency conversion rate not available'
                    }
                transfer_amount = convert_currency(amount, from_wallet.currency, to_wallet.currency)
            
            # Check sufficient balance
            if from_wallet.available_balance < amount:
                return {
                    'success': False,
                    'error': 'INSUFFICIENT_FUNDS',
                    'message': 'Insufficient funds in source wallet'
                }
            
            # Create transfer transactions
            transfer_id = str(uuid.uuid4())
            
            # Debit transaction (from wallet)
            debit_transaction = Transaction(
                id=str(uuid.uuid4()),
                wallet_id=from_wallet_id,
                transaction_type='debit',
                amount=amount,
                currency=from_wallet.currency,
                description=description or f'Transfer to wallet {to_wallet_id}',
                reference_id=reference_id or transfer_id,
                status='completed',
                payment_method='wallet_transfer',
                external_transaction_id=transfer_id,
                created_at=datetime.now(timezone.utc)
            )
            
            # Credit transaction (to wallet)
            credit_transaction = Transaction(
                id=str(uuid.uuid4()),
                wallet_id=to_wallet_id,
                transaction_type='credit',
                amount=transfer_amount,
                currency=to_wallet.currency,
                description=description or f'Transfer from wallet {from_wallet_id}',
                reference_id=reference_id or transfer_id,
                status='completed',
                payment_method='wallet_transfer',
                external_transaction_id=transfer_id,
                created_at=datetime.now(timezone.utc)
            )
            
            # Update wallet balances
            from_wallet.balance -= amount
            from_wallet.available_balance -= amount
            from_wallet.updated_at = datetime.now(timezone.utc)
            
            to_wallet.balance += transfer_amount
            to_wallet.available_balance += transfer_amount
            to_wallet.updated_at = datetime.now(timezone.utc)
            
            # Create ledger entries
            # From wallet ledger entries
            from_debit_entry = LedgerEntry(
                id=str(uuid.uuid4()),
                transaction_id=debit_transaction.id,
                account_type='liability',
                account_name='customer_deposits',
                debit_amount=amount,
                credit_amount=Decimal('0.00'),
                currency=from_wallet.currency,
                description=f'Transfer debit from wallet {from_wallet_id}',
                created_at=datetime.now(timezone.utc)
            )
            
            from_credit_entry = LedgerEntry(
                id=str(uuid.uuid4()),
                transaction_id=debit_transaction.id,
                account_type='asset',
                account_name=f'wallet_{from_wallet_id}',
                debit_amount=Decimal('0.00'),
                credit_amount=amount,
                currency=from_wallet.currency,
                description=f'Transfer credit from wallet {from_wallet_id}',
                created_at=datetime.now(timezone.utc)
            )
            
            # To wallet ledger entries
            to_debit_entry = LedgerEntry(
                id=str(uuid.uuid4()),
                transaction_id=credit_transaction.id,
                account_type='asset',
                account_name=f'wallet_{to_wallet_id}',
                debit_amount=transfer_amount,
                credit_amount=Decimal('0.00'),
                currency=to_wallet.currency,
                description=f'Transfer debit to wallet {to_wallet_id}',
                created_at=datetime.now(timezone.utc)
            )
            
            to_credit_entry = LedgerEntry(
                id=str(uuid.uuid4()),
                transaction_id=credit_transaction.id,
                account_type='liability',
                account_name='customer_deposits',
                debit_amount=Decimal('0.00'),
                credit_amount=transfer_amount,
                currency=to_wallet.currency,
                description=f'Transfer credit to wallet {to_wallet_id}',
                created_at=datetime.now(timezone.utc)
            )
            
            # Add all to session
            db.session.add(debit_transaction)
            db.session.add(credit_transaction)
            db.session.add(from_debit_entry)
            db.session.add(from_credit_entry)
            db.session.add(to_debit_entry)
            db.session.add(to_credit_entry)
            
            db.session.commit()
            
            # Log audit events
            log_audit_event(
                user_id=from_wallet.user_id,
                action='FUNDS_TRANSFERRED_OUT',
                resource_type='wallet',
                resource_id=from_wallet_id,
                details={
                    'to_wallet_id': to_wallet_id,
                    'amount': str(amount),
                    'currency': from_wallet.currency,
                    'transfer_id': transfer_id
                }
            )
            
            log_audit_event(
                user_id=to_wallet.user_id,
                action='FUNDS_TRANSFERRED_IN',
                resource_type='wallet',
                resource_id=to_wallet_id,
                details={
                    'from_wallet_id': from_wallet_id,
                    'amount': str(transfer_amount),
                    'currency': to_wallet.currency,
                    'transfer_id': transfer_id
                }
            )
            
            # Send notifications
            send_notification(
                user_id=from_wallet.user_id,
                notification_type='funds_transferred_out',
                message=f'Transferred {amount} {from_wallet.currency}',
                metadata={'transfer_id': transfer_id, 'to_wallet_id': to_wallet_id}
            )
            
            send_notification(
                user_id=to_wallet.user_id,
                notification_type='funds_transferred_in',
                message=f'Received {transfer_amount} {to_wallet.currency}',
                metadata={'transfer_id': transfer_id, 'from_wallet_id': from_wallet_id}
            )
            
            return {
                'success': True,
                'transfer': {
                    'transfer_id': transfer_id,
                    'from_wallet_id': from_wallet_id,
                    'to_wallet_id': to_wallet_id,
                    'amount': str(amount),
                    'currency': from_wallet.currency,
                    'converted_amount': str(transfer_amount),
                    'converted_currency': to_wallet.currency,
                    'status': 'completed',
                    'created_at': datetime.now(timezone.utc).isoformat() + 'Z'
                }
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error transferring funds: {str(e)}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'Failed to transfer funds'
            }

# API Routes
@enfrom ..security.token_manager import token_required

@wallet_bp.route('/', methods=['POST'])
@limiter.limit("10 per minute")
@token_required
def create_wallet_route():    """Create a new wallet"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'wallet_type']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': 'MISSING_REQUIRED_FIELD',
                    'message': f'Missing required field: {field}'
                }), 400
        
        result = WalletService.create_wallet(
            user_id=data['user_id'],
            wallet_type=data['wallet_type'],
            currency=data.get('currency', 'USD'),
            initial_balance=Decimal(str(data.get('initial_balance', '0.00')))
        )
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in create_wallet endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'INTERNAL_ERROR',
            'message': 'An unexpected error occurred'
        }), 500

@enhanced_wallet_bp.route('/<wallet_id>/balance', methods=['GET'])
@limiter.limit("100 per minute")
def get_wallet_balance(wallet_id):
    """Get wallet balance"""
    try:
        include_pending = request.args.get('include_pending', 'false').lower() == 'true'
        
        result = WalletService.get_wallet_balance(wallet_id, include_pending)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404 if result['error'] == 'WALLET_NOT_FOUND' else 400
            
    except Exception as e:
        logger.error(f"Error in get_wallet_balance endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'INTERNAL_ERROR',
            'message': 'An unexpected error occurred'
        }), 500

@enhanced_wallet_bp.route('/transfer', methods=['POST'])
@limiter.limit("20 per minute")
def transfer_funds():
    """Transfer funds between wallets"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['from_wallet_id', 'to_wallet_id', 'amount']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': 'MISSING_REQUIRED_FIELD',
                    'message': f'Missing required field: {field}'
                }), 400
        
        result = WalletService.transfer_funds(
            from_wallet_id=data['from_wallet_id'],
            to_wallet_id=data['to_wallet_id'],
            amount=Decimal(str(data['amount'])),
            description=data.get('description'),
            reference_id=data.get('reference_id')
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in transfer_funds endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'INTERNAL_ERROR',
            'message': 'An unexpected error occurred'
        }), 500


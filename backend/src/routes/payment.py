import json
import logging
import uuid
from datetime import datetime, timedelta, timezone
from decimal import ROUND_HALF_UP, Decimal
from enum import Enum
from typing import Dict, List, Optional, Tuple

from flask import Blueprint, g, jsonify, request
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy import and_, func, or_
from sqlalchemy.exc import IntegrityError
from src.integrations.payments.ach_integration import ACHPaymentProcessor
from src.integrations.payments.sepa_integration import SEPAPaymentProcessor
from src.integrations.payments.stripe_integration import StripePaymentProcessor
from src.integrations.payments.wire_integration import WirePaymentProcessor

from ..models.database import (AuditLog, LedgerEntry, Transaction, User,
                               Wallet, db)
from ..security.encryption import (decrypt_sensitive_data,
                                   encrypt_sensitive_data)
from ..security.validation import (validate_amount, validate_currency,
                                   validate_payment_method)
from ..utils.audit import log_audit_event
from ..utils.notifications import send_notification

# Create blueprint
payment_bp = Blueprint(\'payment\', __name__, url_prefix=\'/api/v1/payments\')

# Configure rate limiting
limiter = Limiter(key_func=get_remote_address)

logger = logging.getLogger(__name__)

class PaymentMethod(Enum):
    """Supported payment methods"""
    CARD = "card"
    ACH = "ach"
    WIRE = "wire"
    SEPA = "sepa"
    WALLET = "wallet"
    BANK_TRANSFER = "bank_transfer"
    DIGITAL_WALLET = "digital_wallet"

class PaymentStatus(Enum):
    """Payment status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"

class PaymentService:
    """
    Payment Processing Service implementing financial industry standards
    Supports multiple payment methods, smart routing, and comprehensive audit trails
    """
    
    SUPPORTED_PAYMENT_METHODS = [method.value for method in PaymentMethod]
    SUPPORTED_CURRENCIES = [
        'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY',
        'SEK', 'NZD', 'MXN', 'SGD', 'HKD', 'NOK', 'TRY', 'ZAR',
        'BRL', 'INR', 'KRW', 'PLN'
    ]
    
    # Payment method routing preferences (cost, speed, success_rate)
    PAYMENT_ROUTING_PREFERENCES = {
        PaymentMethod.CARD: {'cost': 3, 'speed': 9, 'success_rate': 8},
        PaymentMethod.ACH: {'cost': 9, 'speed': 3, 'success_rate': 9},
        PaymentMethod.WIRE: {'cost': 1, 'speed': 7, 'success_rate': 9},
        PaymentMethod.SEPA: {'cost': 8, 'speed': 6, 'success_rate': 9},
        PaymentMethod.WALLET: {'cost': 10, 'speed': 10, 'success_rate': 10},
        PaymentMethod.BANK_TRANSFER: {'cost': 7, 'speed': 4, 'success_rate': 8}
    }
    
    @staticmethod
    def process_payment(wallet_id: str, amount: Decimal, currency: str, 
                       payment_method: str, payment_details: Dict,
                       description: str = None, reference_id: str = None,
                       routing_preference: str = 'balanced') -> Dict:
        """
        Process a payment with smart routing and comprehensive validation
        
        Args:
            wallet_id: Destination wallet identifier
            amount: Payment amount
            currency: ISO currency code
            payment_method: Payment method type
            payment_details: Payment method specific details
            description: Optional payment description
            reference_id: Optional external reference
            routing_preference: Routing preference (cost, speed, success_rate, balanced)
            
        Returns:
            Dict containing payment result
        """
        try:
            # Validate inputs
            if not validate_amount(amount) or amount <= 0:
                return {
                    'success': False,
                    'error': 'INVALID_AMOUNT',
                    'message': 'Payment amount must be positive'
                }
            
            if not validate_currency(currency):
                return {
                    'success': False,
                    'error': 'INVALID_CURRENCY',
                    'message': f'Currency must be one of: {PaymentService.SUPPORTED_CURRENCIES}'
                }
            
            if not validate_payment_method(payment_method):
                return {
                    'success': False,
                    'error': 'INVALID_PAYMENT_METHOD',
                    'message': f'Payment method must be one of: {PaymentService.SUPPORTED_PAYMENT_METHODS}'
                }
            
            # Get destination wallet
            wallet = Wallet.query.get(wallet_id)
            if not wallet:
                return {
                    'success': False,
                    'error': 'WALLET_NOT_FOUND',
                    'message': 'Destination wallet does not exist'
                }
            
            if wallet.status != 'active':
                return {
                    'success': False,
                    'error': 'WALLET_INACTIVE',
                    'message': 'Destination wallet is not active'
                }
            
            # Create payment transaction
            payment_id = str(uuid.uuid4())
            
            payment_transaction = Transaction(
                id=payment_id,
                wallet_id=wallet_id,
                transaction_type='credit',
                amount=amount,
                currency=currency,
                description=description or f'Payment via {payment_method}',
                reference_id=reference_id,
                status=PaymentStatus.PENDING.value,
                payment_method=payment_method,
                external_transaction_id=None,  # Will be set by processor
                created_at=datetime.now(timezone.utc)
            )
            
            db.session.add(payment_transaction)
            db.session.flush()  # Get the ID without committing
            
            # Route payment to appropriate processor
            processor_result = PaymentService._route_payment(
                payment_method=payment_method,
                amount=amount,
                currency=currency,
                payment_details=payment_details,
                routing_preference=routing_preference
            )
            
            if not processor_result['success']:
                payment_transaction.status = PaymentStatus.FAILED.value
                db.session.commit()
                return processor_result
            
            # Update transaction with processor response
            payment_transaction.external_transaction_id = processor_result.get('external_id')
            payment_transaction.status = processor_result.get('status', PaymentStatus.PROCESSING.value)
            
            # If payment is immediately completed, update wallet balance
            if processor_result.get('status') == PaymentStatus.COMPLETED.value:
                PaymentService._complete_payment(payment_transaction, wallet)
            
            db.session.commit()
            
            # Log audit event
            log_audit_event(
                user_id=wallet.user_id,
                action='PAYMENT_PROCESSED',
                resource_type='payment',
                resource_id=payment_id,
                details={
                    'payment_method': payment_method,
                    'amount': str(amount),
                    'currency': currency,
                    'status': payment_transaction.status
                }
            )
            
            # Send notification
            send_notification(
                user_id=wallet.user_id,
                notification_type='payment_processed',
                message=f'Payment of {amount} {currency} processed',
                metadata={'payment_id': payment_id, 'status': payment_transaction.status}
            )
            
            return {
                'success': True,
                'payment': {
                    'payment_id': payment_id,
                    'wallet_id': wallet_id,
                    'amount': str(amount),
                    'currency': currency,
                    'payment_method': payment_method,
                    'status': payment_transaction.status,
                    'external_id': payment_transaction.external_transaction_id,
                    'created_at': payment_transaction.created_at.isoformat() + 'Z'
                }
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error processing payment: {str(e)}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'Failed to process payment'
            }
    
    @staticmethod
    def _route_payment(payment_method: str, amount: Decimal, currency: str,
                      payment_details: Dict, routing_preference: str) -> Dict:
        """
        Smart routing logic to select optimal payment processor
        
        Args:
            payment_method: Payment method type
            amount: Payment amount
            currency: ISO currency code
            payment_details: Payment method specific details
            routing_preference: Routing preference
            
        Returns:
            Dict containing processor result
        """
        try:
            # Select processor based on payment method and routing preference
            if payment_method == PaymentMethod.CARD.value:
                processor = StripePaymentProcessor()
            elif payment_method == PaymentMethod.ACH.value:
                processor = ACHPaymentProcessor()
            elif payment_method == PaymentMethod.WIRE.value:
                processor = WirePaymentProcessor()
            elif payment_method == PaymentMethod.SEPA.value:
                processor = SEPAPaymentProcessor()
            else:
                return {
                    'success': False,
                    'error': 'UNSUPPORTED_PAYMENT_METHOD',
                    'message': f'Payment method {payment_method} not supported'
                }
            
            # Process payment through selected processor
            result = processor.process_payment(
                amount=amount,
                currency=currency,
                payment_details=payment_details
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error routing payment: {str(e)}")
            return {
                'success': False,
                'error': 'ROUTING_ERROR',
                'message': 'Failed to route payment'
            }
    
    @staticmethod
    def _complete_payment(payment_transaction: Transaction, wallet: Wallet):
        """
        Complete a payment by updating wallet balance and creating ledger entries
        
        Args:
            payment_transaction: Payment transaction object
            wallet: Destination wallet object
        """
        try:
            # Update wallet balance
            wallet.balance += payment_transaction.amount
            wallet.available_balance += payment_transaction.amount
            wallet.updated_at = datetime.now(timezone.utc)
            
            # Create ledger entries (double-entry bookkeeping)
            debit_entry = LedgerEntry(
                id=str(uuid.uuid4()),
                transaction_id=payment_transaction.id,
                account_type='asset',
                account_name=f'wallet_{wallet.id}',
                debit_amount=payment_transaction.amount,
                credit_amount=Decimal('0.00'),
                currency=payment_transaction.currency,
                description=f'Payment credit to wallet {wallet.id}',
                created_at=datetime.now(timezone.utc)
            )
            
            credit_entry = LedgerEntry(
                id=str(uuid.uuid4()),
                transaction_id=payment_transaction.id,
                account_type='liability',
                account_name='customer_deposits',
                debit_amount=Decimal('0.00'),
                credit_amount=payment_transaction.amount,
                currency=payment_transaction.currency,
                description=f'Payment liability for wallet {wallet.id}',
                created_at=datetime.now(timezone.utc)
            )
            
            db.session.add(debit_entry)
            db.session.add(credit_entry)
            
        except Exception as e:
            logger.error(f"Error completing payment: {str(e)}")
            raise
    
    @staticmethod
    def get_payment_status(payment_id: str) -> Dict:
        """
        Get payment status and details
        
        Args:
            payment_id: Payment identifier
            
        Returns:
            Dict containing payment status
        """
        try:
            payment = Transaction.query.get(payment_id)
            if not payment:
                return {
                    'success': False,
                    'error': 'PAYMENT_NOT_FOUND',
                    'message': 'Payment does not exist'
                }
            
            return {
                'success': True,
                'payment': {
                    'payment_id': payment.id,
                    'wallet_id': payment.wallet_id,
                    'amount': str(payment.amount),
                    'currency': payment.currency,
                    'payment_method': payment.payment_method,
                    'status': payment.status,
                    'description': payment.description,
                    'external_id': payment.external_transaction_id,
                    'created_at': payment.created_at.isoformat() + 'Z',
                    'updated_at': payment.updated_at.isoformat() + 'Z'
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting payment status: {str(e)}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'Failed to retrieve payment status'
            }
    
    @staticmethod
    def refund_payment(payment_id: str, refund_amount: Decimal = None, 
                      reason: str = None) -> Dict:
        """
        Refund a payment (full or partial)
        
        Args:
            payment_id: Payment identifier
            refund_amount: Refund amount (None for full refund)
            reason: Refund reason
            
        Returns:
            Dict containing refund result
        """
        try:
            payment = Transaction.query.get(payment_id)
            if not payment:
                return {
                    'success': False,
                    'error': 'PAYMENT_NOT_FOUND',
                    'message': 'Payment does not exist'
                }
            
            if payment.status != PaymentStatus.COMPLETED.value:
                return {
                    'success': False,
                    'error': 'PAYMENT_NOT_REFUNDABLE',
                    'message': 'Only completed payments can be refunded'
                }
            
            # Determine refund amount
            if refund_amount is None:
                refund_amount = payment.amount
            elif refund_amount > payment.amount:
                return {
                    'success': False,
                    'error': 'INVALID_REFUND_AMOUNT',
                    'message': 'Refund amount cannot exceed payment amount'
                }
            
            # Get wallet
            wallet = Wallet.query.get(payment.wallet_id)
            if not wallet:
                return {
                    'success': False,
                    'error': 'WALLET_NOT_FOUND',
                    'message': 'Associated wallet not found'
                }
            
            # Check sufficient balance for refund
            if wallet.available_balance < refund_amount:
                return {
                    'success': False,
                    'error': 'INSUFFICIENT_FUNDS',
                    'message': 'Insufficient funds in wallet for refund'
                }
            
            # Create refund transaction
            refund_id = str(uuid.uuid4())
            
            refund_transaction = Transaction(
                id=refund_id,
                wallet_id=payment.wallet_id,
                transaction_type='debit',
                amount=refund_amount,
                currency=payment.currency,
                description=reason or f'Refund for payment {payment_id}',
                reference_id=payment_id,
                status=PaymentStatus.COMPLETED.value,
                payment_method=payment.payment_method,
                external_transaction_id=f'refund_{payment.external_transaction_id}',
                created_at=datetime.now(timezone.utc)
            )
            
            # Update wallet balance
            wallet.balance -= refund_amount
            wallet.available_balance -= refund_amount
            wallet.updated_at = datetime.now(timezone.utc)
            
            # Update original payment status
            if refund_amount == payment.amount:
                payment.status = PaymentStatus.REFUNDED.value
            else:
                payment.status = PaymentStatus.PARTIALLY_REFUNDED.value
            payment.updated_at = datetime.now(timezone.utc)
            
            # Create ledger entries for refund
            debit_entry = LedgerEntry(
                id=str(uuid.uuid4()),
                transaction_id=refund_id,
                account_type='liability',
                account_name='customer_deposits',
                debit_amount=refund_amount,
                credit_amount=Decimal('0.00'),
                currency=payment.currency,
                description=f'Refund debit for payment {payment_id}',
                created_at=datetime.now(timezone.utc)
            )
            
            credit_entry = LedgerEntry(
                id=str(uuid.uuid4()),
                transaction_id=refund_id,
                account_type='asset',
                account_name=f'wallet_{wallet.id}',
                debit_amount=Decimal('0.00'),
                credit_amount=refund_amount,
                currency=payment.currency,
                description=f'Refund credit for payment {payment_id}',
                created_at=datetime.now(timezone.utc)
            )
            
            db.session.add(refund_transaction)
            db.session.add(debit_entry)
            db.session.add(credit_entry)
            db.session.commit()
            
            # Log audit event
            log_audit_event(
                user_id=wallet.user_id,
                action='PAYMENT_REFUNDED',
                resource_type='payment',
                resource_id=payment_id,
                details={
                    'refund_id': refund_id,
                    'refund_amount': str(refund_amount),
                    'currency': payment.currency,
                    'reason': reason
                }
            )
            
            # Send notification
            send_notification(
                user_id=wallet.user_id,
                notification_type='payment_refunded',
                message=f'Refund of {refund_amount} {payment.currency} processed',
                metadata={'payment_id': payment_id, 'refund_id': refund_id}
            )
            
            return {
                'success': True,
                'refund': {
                    'refund_id': refund_id,
                    'payment_id': payment_id,
                    'refund_amount': str(refund_amount),
                    'currency': payment.currency,
                    'status': 'completed',
                    'reason': reason,
                    'created_at': refund_transaction.created_at.isoformat() + 'Z'
                }
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error processing refund: {str(e)}")
            return {
                'success': False,
                'error': 'INTERNAL_ERROR',
                'message': 'Failed to process refund'
            }

# API Routes
@enhafrom ..security.token_manager import token_required

@payment_bp.route('/', methods=['POST'])
@limiter.limit("10 per minute")
@token_required
def process_payment_route():  """Process a payment"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['wallet_id', 'amount', 'currency', 'payment_method', 'payment_details']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': 'MISSING_REQUIRED_FIELD',
                    'message': f'Missing required field: {field}'
                }), 400
        
        result = PaymentService.process_payment(
            wallet_id=data['wallet_id'],
            amount=Decimal(str(data['amount'])),
            currency=data['currency'],
            payment_method=data['payment_method'],
            payment_details=data['payment_details'],
            description=data.get('description'),
            reference_id=data.get('reference_id'),
            routing_preference=data.get('routing_preference', 'balanced')
        )
        
        if result['success']:
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in process_payment endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'INTERNAL_ERROR',
            'message': 'An unexpected error occurred'
        }), 500

@enhanced_payment_bp.route('/<payment_id>', methods=['GET'])
@limiter.limit("100 per minute")
def get_payment_status(payment_id):
    """Get payment status"""
    try:
        result = PaymentService.get_payment_status(payment_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404 if result['error'] == 'PAYMENT_NOT_FOUND' else 400
            
    except Exception as e:
        logger.error(f"Error in get_payment_status endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'INTERNAL_ERROR',
            'message': 'An unexpected error occurred'
        }), 500

@enhanced_payment_bp.route('/<payment_id>/refund', methods=['POST'])
@limiter.limit("10 per minute")
def refund_payment(payment_id):
    """Refund a payment"""
    try:
        data = request.get_json() or {}
        
        refund_amount = None
        if 'refund_amount' in data:
            refund_amount = Decimal(str(data['refund_amount']))
        
        result = PaymentService.refund_payment(
            payment_id=payment_id,
            refund_amount=refund_amount,
            reason=data.get('reason')
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in refund_payment endpoint: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'INTERNAL_ERROR',
            'message': 'An unexpected error occurred'
        }), 500


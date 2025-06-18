"""
Enhanced Card Management System with Financial-Grade Security
"""

from flask import Blueprint, request, jsonify, g
from src.models.database import db, User
from src.models.account import Account, AccountStatus
from src.models.card import Card, CardType, CardStatus, CardTransaction
from src.models.transaction import Transaction, TransactionType, TransactionStatus, TransactionCategory
from src.security.encryption import CardTokenizer, PINManager
from src.security.audit_logger import AuditLogger
from src.security.input_validator import InputValidator
from src.security.fraud_detection import FraudDetector
from src.routes.auth import token_required
from datetime import datetime, timezone, timedelta
import uuid
import random
import string
import json
import logging
from decimal import Decimal
from functools import wraps

# Create blueprint
card_bp = Blueprint('card', __name__, url_prefix='/api/v1/cards')

# Configure logging
logger = logging.getLogger(__name__)

# Initialize security components
card_tokenizer = CardTokenizer()
pin_manager = PINManager()
audit_logger = AuditLogger()
input_validator = InputValidator()
fraud_detector = FraudDetector()

def card_access_required(f):
    """Decorator to ensure user has access to the card"""
    @wraps(f)
    @token_required
    def decorated(card_id, *args, **kwargs):
        card = Card.query.get(card_id)
        if not card:
            return jsonify({
                'error': 'Card not found',
                'code': 'CARD_NOT_FOUND'
            }), 404
        
        # Check if user owns the card or is admin
        if card.account.user_id != g.current_user.id and not g.current_user.is_admin:
            audit_logger.log_security_event(
                event_type='unauthorized_card_access',
                details={
                    'user_id': g.current_user.id,
                    'card_id': card_id,
                    'ip': request.remote_addr
                }
            )
            return jsonify({
                'error': 'Access denied',
                'code': 'ACCESS_DENIED'
            }), 403
        
        g.card = card
        return f(card_id, *args, **kwargs)
    return decorated

@card_bp.route('/issue', methods=['POST'])
@token_required
def issue_card():
    """
    Issue a new virtual or physical card
    
    Expected JSON payload:
    {
        "account_id": "string",
        "card_type": "virtual|physical",
        "card_name": "string" (optional),
        "spending_limits": {
            "daily": "decimal",
            "monthly": "decimal",
            "per_transaction": "decimal"
        } (optional),
        "controls": {
            "online_transactions": true,
            "contactless_payments": true,
            "atm_withdrawals": true,
            "international_transactions": false,
            "blocked_merchant_categories": []
        } (optional)
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({
                'error': 'Request body must contain valid JSON',
                'code': 'INVALID_JSON'
            }), 400
        
        # Validate required fields
        required_fields = ['account_id', 'card_type']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing_fields)}',
                'code': 'MISSING_FIELDS'
            }), 400
        
        # Find and validate account
        account = Account.query.get(data['account_id'])
        if not account:
            return jsonify({
                'error': 'Account not found',
                'code': 'ACCOUNT_NOT_FOUND'
            }), 404
        
        # Check if user owns the account or is admin
        if account.user_id != g.current_user.id and not g.current_user.is_admin:
            return jsonify({
                'error': 'Access denied',
                'code': 'ACCESS_DENIED'
            }), 403
        
        # Validate account status
        if account.status != AccountStatus.ACTIVE:
            return jsonify({
                'error': 'Account must be active to issue cards',
                'code': 'ACCOUNT_INACTIVE'
            }), 400
        
        # Validate card type
        try:
            card_type = CardType(data['card_type'].lower())
        except ValueError:
            return jsonify({
                'error': f'Invalid card type. Must be one of: {[t.value for t in CardType]}',
                'code': 'INVALID_CARD_TYPE'
            }), 400
        
        # Check card limits per account
        existing_cards = Card.query.filter_by(account_id=account.id)\
            .filter(Card.status.in_([CardStatus.ACTIVE, CardStatus.BLOCKED])).count()
        
        max_cards_per_account = 5  # Business rule
        if existing_cards >= max_cards_per_account:
            return jsonify({
                'error': f'Maximum {max_cards_per_account} cards allowed per account',
                'code': 'CARD_LIMIT_EXCEEDED'
            }), 400
        
        # Generate card details
        card_number = card_tokenizer.generate_card_number()
        card_token = card_tokenizer.tokenize_card_number(card_number)
        cvv = card_tokenizer.generate_cvv()
        
        # Set expiry date (3 years from now)
        expiry_date = datetime.now(timezone.utc) + timedelta(days=1095)
        
        # Set default spending limits
        spending_limits = data.get('spending_limits', {})
        daily_limit = Decimal(str(spending_limits.get('daily', '1000.00')))
        monthly_limit = Decimal(str(spending_limits.get('monthly', '10000.00')))
        per_transaction_limit = Decimal(str(spending_limits.get('per_transaction', '500.00')))
        
        # Validate spending limits
        if daily_limit <= 0 or monthly_limit <= 0 or per_transaction_limit <= 0:
            return jsonify({
                'error': 'Spending limits must be positive',
                'code': 'INVALID_LIMITS'
            }), 400
        
        if daily_limit > monthly_limit:
            return jsonify({
                'error': 'Daily limit cannot exceed monthly limit',
                'code': 'INVALID_LIMIT_RELATIONSHIP'
            }), 400
        
        # Set default controls
        controls = data.get('controls', {})
        
        # Create new card
        card = Card(
            account_id=account.id,
            card_type=card_type,
            card_name=input_validator.sanitize_string(data.get('card_name', f'{card_type.value.title()} Card')),
            card_number_token=card_token,
            last_four_digits=card_number[-4:],
            expiry_month=expiry_date.month,
            expiry_year=expiry_date.year,
            cvv_hash=card_tokenizer.hash_cvv(cvv),
            status=CardStatus.ACTIVE if card_type == CardType.VIRTUAL else CardStatus.PENDING_ACTIVATION,
            
            # Spending limits
            daily_spending_limit=daily_limit,
            monthly_spending_limit=monthly_limit,
            per_transaction_limit=per_transaction_limit,
            
            # Controls
            online_transactions_enabled=controls.get('online_transactions', True),
            contactless_payments_enabled=controls.get('contactless_payments', True),
            atm_withdrawals_enabled=controls.get('atm_withdrawals', True),
            international_transactions_enabled=controls.get('international_transactions', False),
            blocked_merchant_categories=json.dumps(controls.get('blocked_merchant_categories', [])),
            
            # Security
            pin_hash=None,  # Will be set when user sets PIN
            pin_attempts=0,
            is_pin_locked=False,
            
            # Tracking
            total_spent_today=Decimal('0'),
            total_spent_month=Decimal('0'),
            last_transaction_at=None
        )
        
        db.session.add(card)
        db.session.flush()  # Get card ID
        
        # Log card issuance
        audit_logger.log_user_event(
            user_id=g.current_user.id,
            event_type='card_issued',
            details={
                'card_id': str(card.id),
                'card_type': card_type.value,
                'account_id': str(account.id),
                'ip': request.remote_addr
            }
        )
        
        db.session.commit()
        
        # Prepare response
        response_data = {
            'success': True,
            'card': {
                'id': str(card.id),
                'account_id': str(account.id),
                'card_type': card.card_type.value,
                'card_name': card.card_name,
                'last_four_digits': card.last_four_digits,
                'expiry_month': card.expiry_month,
                'expiry_year': card.expiry_year,
                'status': card.status.value,
                'spending_limits': {
                    'daily': float(card.daily_spending_limit),
                    'monthly': float(card.monthly_spending_limit),
                    'per_transaction': float(card.per_transaction_limit)
                },
                'controls': {
                    'online_transactions_enabled': card.online_transactions_enabled,
                    'contactless_payments_enabled': card.contactless_payments_enabled,
                    'atm_withdrawals_enabled': card.atm_withdrawals_enabled,
                    'international_transactions_enabled': card.international_transactions_enabled,
                    'blocked_merchant_categories': json.loads(card.blocked_merchant_categories)
                },
                'created_at': card.created_at.isoformat()
            }
        }
        
        # Add sensitive data for virtual cards (for immediate use)
        if card_type == CardType.VIRTUAL:
            response_data['card']['card_number'] = card_number
            response_data['card']['cvv'] = cvv
            response_data['card']['ready_for_use'] = True
            response_data['message'] = 'Virtual card issued and ready for use'
        else:
            response_data['card']['estimated_delivery'] = '5-7 business days'
            response_data['card']['ready_for_use'] = False
            response_data['message'] = 'Physical card issued. Activation required upon delivery.'
        
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Card issuance error: {str(e)}")
        return jsonify({
            'error': 'Failed to issue card',
            'code': 'CARD_ISSUANCE_ERROR'
        }), 500

@card_bp.route('/<card_id>', methods=['GET'])
@card_access_required
def get_card(card_id):
    """Get card details"""
    try:
        card = g.card
        
        # Calculate current spending
        today = datetime.now(timezone.utc).date()
        current_month = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Get spending totals
        daily_spent = card.get_daily_spending()
        monthly_spent = card.get_monthly_spending()
        
        # Get recent transactions
        recent_transactions = CardTransaction.query.filter_by(card_id=card.id)\
            .order_by(CardTransaction.created_at.desc())\
            .limit(5).all()
        
        transaction_data = []
        for transaction in recent_transactions:
            transaction_data.append({
                'id': str(transaction.id),
                'amount': float(transaction.amount),
                'currency': transaction.currency,
                'merchant_name': transaction.merchant_name,
                'merchant_category': transaction.merchant_category,
                'transaction_type': transaction.transaction_type.value,
                'status': transaction.status.value,
                'created_at': transaction.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'card': {
                'id': str(card.id),
                'account_id': str(card.account_id),
                'card_type': card.card_type.value,
                'card_name': card.card_name,
                'last_four_digits': card.last_four_digits,
                'expiry_month': card.expiry_month,
                'expiry_year': card.expiry_year,
                'status': card.status.value,
                'spending_limits': {
                    'daily': float(card.daily_spending_limit),
                    'monthly': float(card.monthly_spending_limit),
                    'per_transaction': float(card.per_transaction_limit)
                },
                'current_spending': {
                    'daily': float(daily_spent),
                    'monthly': float(monthly_spent),
                    'daily_remaining': float(card.daily_spending_limit - daily_spent),
                    'monthly_remaining': float(card.monthly_spending_limit - monthly_spent)
                },
                'controls': {
                    'online_transactions_enabled': card.online_transactions_enabled,
                    'contactless_payments_enabled': card.contactless_payments_enabled,
                    'atm_withdrawals_enabled': card.atm_withdrawals_enabled,
                    'international_transactions_enabled': card.international_transactions_enabled,
                    'blocked_merchant_categories': json.loads(card.blocked_merchant_categories)
                },
                'security': {
                    'pin_set': card.pin_hash is not None,
                    'pin_locked': card.is_pin_locked,
                    'failed_pin_attempts': card.pin_attempts
                },
                'created_at': card.created_at.isoformat(),
                'updated_at': card.updated_at.isoformat(),
                'last_transaction_at': card.last_transaction_at.isoformat() if card.last_transaction_at else None
            },
            'recent_transactions': transaction_data
        }), 200
        
    except Exception as e:
        logger.error(f"Get card error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve card details',
            'code': 'GET_CARD_ERROR'
        }), 500

@card_bp.route('/<card_id>/activate', methods=['POST'])
@card_access_required
def activate_card(card_id):
    """
    Activate a card (typically for physical cards)
    
    Expected JSON payload:
    {
        "activation_code": "string" (for physical cards),
        "pin": "string" (4-digit PIN)
    }
    """
    try:
        card = g.card
        data = request.get_json()
        
        if card.status != CardStatus.PENDING_ACTIVATION:
            return jsonify({
                'error': 'Card is not in pending activation status',
                'code': 'INVALID_CARD_STATUS'
            }), 400
        
        # For physical cards, require activation code
        if card.card_type == CardType.PHYSICAL:
            if not data or 'activation_code' not in data:
                return jsonify({
                    'error': 'Activation code is required for physical cards',
                    'code': 'ACTIVATION_CODE_REQUIRED'
                }), 400
            
            activation_code = data['activation_code']
            if not input_validator.validate_activation_code(activation_code):
                return jsonify({
                    'error': 'Invalid activation code format',
                    'code': 'INVALID_ACTIVATION_CODE'
                }), 400
            
            # In production, verify activation code against secure storage
            # For demo, accept any valid format code
        
        # Set PIN if provided
        if data and 'pin' in data:
            pin = data['pin']
            if not input_validator.validate_pin(pin):
                return jsonify({
                    'error': 'PIN must be exactly 4 digits',
                    'code': 'INVALID_PIN_FORMAT'
                }), 400
            
            card.pin_hash = pin_manager.hash_pin(pin)
        
        # Activate card
        card.status = CardStatus.ACTIVE
        card.activated_at = datetime.now(timezone.utc)
        card.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        # Log card activation
        audit_logger.log_user_event(
            user_id=g.current_user.id,
            event_type='card_activated',
            details={
                'card_id': str(card.id),
                'card_type': card.card_type.value,
                'ip': request.remote_addr
            }
        )
        
        return jsonify({
            'success': True,
            'card_id': str(card.id),
            'status': card.status.value,
            'message': 'Card activated successfully',
            'activated_at': card.activated_at.isoformat(),
            'pin_set': card.pin_hash is not None
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Card activation error: {str(e)}")
        return jsonify({
            'error': 'Failed to activate card',
            'code': 'ACTIVATION_ERROR'
        }), 500

@card_bp.route('/<card_id>/freeze', methods=['POST'])
@card_access_required
def freeze_card(card_id):
    """
    Freeze/block a card
    
    Expected JSON payload:
    {
        "reason": "string" (optional)
    }
    """
    try:
        card = g.card
        data = request.get_json() or {}
        
        if card.status not in [CardStatus.ACTIVE]:
            return jsonify({
                'error': 'Only active cards can be frozen',
                'code': 'INVALID_CARD_STATUS'
            }), 400
        
        reason = data.get('reason', 'User requested freeze')
        
        # Freeze card
        card.status = CardStatus.BLOCKED
        card.blocked_reason = reason
        card.blocked_at = datetime.now(timezone.utc)
        card.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        # Log card freeze
        audit_logger.log_user_event(
            user_id=g.current_user.id,
            event_type='card_frozen',
            details={
                'card_id': str(card.id),
                'reason': reason,
                'ip': request.remote_addr
            }
        )
        
        return jsonify({
            'success': True,
            'card_id': str(card.id),
            'status': card.status.value,
            'reason': reason,
            'message': 'Card has been frozen successfully',
            'frozen_at': card.blocked_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Card freeze error: {str(e)}")
        return jsonify({
            'error': 'Failed to freeze card',
            'code': 'FREEZE_ERROR'
        }), 500

@card_bp.route('/<card_id>/unfreeze', methods=['POST'])
@card_access_required
def unfreeze_card(card_id):
    """Unfreeze/unblock a card"""
    try:
        card = g.card
        
        if card.status != CardStatus.BLOCKED:
            return jsonify({
                'error': 'Card is not currently frozen',
                'code': 'CARD_NOT_FROZEN'
            }), 400
        
        if card.status == CardStatus.CANCELLED:
            return jsonify({
                'error': 'Cannot unfreeze a cancelled card',
                'code': 'CARD_CANCELLED'
            }), 400
        
        # Unfreeze card
        card.status = CardStatus.ACTIVE
        card.blocked_reason = None
        card.blocked_at = None
        card.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        # Log card unfreeze
        audit_logger.log_user_event(
            user_id=g.current_user.id,
            event_type='card_unfrozen',
            details={
                'card_id': str(card.id),
                'ip': request.remote_addr
            }
        )
        
        return jsonify({
            'success': True,
            'card_id': str(card.id),
            'status': card.status.value,
            'message': 'Card has been unfrozen successfully',
            'unfrozen_at': card.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Card unfreeze error: {str(e)}")
        return jsonify({
            'error': 'Failed to unfreeze card',
            'code': 'UNFREEZE_ERROR'
        }), 500

@card_bp.route('/<card_id>/cancel', methods=['POST'])
@card_access_required
def cancel_card(card_id):
    """
    Cancel a card permanently
    
    Expected JSON payload:
    {
        "reason": "string",
        "confirmation": "CANCEL" (required for confirmation)
    }
    """
    try:
        card = g.card
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Request body must contain valid JSON',
                'code': 'INVALID_JSON'
            }), 400
        
        # Require explicit confirmation
        if data.get('confirmation') != 'CANCEL':
            return jsonify({
                'error': 'Confirmation required. Set confirmation field to "CANCEL"',
                'code': 'CONFIRMATION_REQUIRED'
            }), 400
        
        if card.status == CardStatus.CANCELLED:
            return jsonify({
                'error': 'Card is already cancelled',
                'code': 'CARD_ALREADY_CANCELLED'
            }), 400
        
        reason = data.get('reason', 'User requested cancellation')
        
        # Cancel card
        card.status = CardStatus.CANCELLED
        card.cancelled_reason = reason
        card.cancelled_at = datetime.now(timezone.utc)
        card.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        # Log card cancellation
        audit_logger.log_user_event(
            user_id=g.current_user.id,
            event_type='card_cancelled',
            details={
                'card_id': str(card.id),
                'reason': reason,
                'ip': request.remote_addr
            }
        )
        
        return jsonify({
            'success': True,
            'card_id': str(card.id),
            'status': card.status.value,
            'reason': reason,
            'message': 'Card has been cancelled permanently',
            'cancelled_at': card.cancelled_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Card cancellation error: {str(e)}")
        return jsonify({
            'error': 'Failed to cancel card',
            'code': 'CANCELLATION_ERROR'
        }), 500

@card_bp.route('/<card_id>/limits', methods=['PUT'])
@card_access_required
def update_spending_limits(card_id):
    """
    Update card spending limits
    
    Expected JSON payload:
    {
        "daily_limit": "decimal" (optional),
        "monthly_limit": "decimal" (optional),
        "per_transaction_limit": "decimal" (optional)
    }
    """
    try:
        card = g.card
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Request body must contain valid JSON',
                'code': 'INVALID_JSON'
            }), 400
        
        if card.status not in [CardStatus.ACTIVE, CardStatus.BLOCKED]:
            return jsonify({
                'error': 'Cannot update limits for cancelled or expired cards',
                'code': 'INVALID_CARD_STATUS'
            }), 400
        
        # Track changes for audit
        changes = {}
        
        # Update limits if provided
        if 'daily_limit' in data:
            try:
                new_limit = Decimal(str(data['daily_limit']))
                if new_limit <= 0:
                    return jsonify({
                        'error': 'Daily limit must be positive',
                        'code': 'INVALID_DAILY_LIMIT'
                    }), 400
                
                old_limit = card.daily_spending_limit
                card.daily_spending_limit = new_limit
                changes['daily_limit'] = {'old': float(old_limit), 'new': float(new_limit)}
            except (ValueError, TypeError):
                return jsonify({
                    'error': 'Invalid daily limit format',
                    'code': 'INVALID_DAILY_LIMIT_FORMAT'
                }), 400
        
        if 'monthly_limit' in data:
            try:
                new_limit = Decimal(str(data['monthly_limit']))
                if new_limit <= 0:
                    return jsonify({
                        'error': 'Monthly limit must be positive',
                        'code': 'INVALID_MONTHLY_LIMIT'
                    }), 400
                
                old_limit = card.monthly_spending_limit
                card.monthly_spending_limit = new_limit
                changes['monthly_limit'] = {'old': float(old_limit), 'new': float(new_limit)}
            except (ValueError, TypeError):
                return jsonify({
                    'error': 'Invalid monthly limit format',
                    'code': 'INVALID_MONTHLY_LIMIT_FORMAT'
                }), 400
        
        if 'per_transaction_limit' in data:
            try:
                new_limit = Decimal(str(data['per_transaction_limit']))
                if new_limit <= 0:
                    return jsonify({
                        'error': 'Per-transaction limit must be positive',
                        'code': 'INVALID_TRANSACTION_LIMIT'
                    }), 400
                
                old_limit = card.per_transaction_limit
                card.per_transaction_limit = new_limit
                changes['per_transaction_limit'] = {'old': float(old_limit), 'new': float(new_limit)}
            except (ValueError, TypeError):
                return jsonify({
                    'error': 'Invalid per-transaction limit format',
                    'code': 'INVALID_TRANSACTION_LIMIT_FORMAT'
                }), 400
        
        # Validate limit relationships
        if card.daily_spending_limit > card.monthly_spending_limit:
            return jsonify({
                'error': 'Daily limit cannot exceed monthly limit',
                'code': 'INVALID_LIMIT_RELATIONSHIP'
            }), 400
        
        card.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        # Log limit changes
        if changes:
            audit_logger.log_user_event(
                user_id=g.current_user.id,
                event_type='card_limits_updated',
                details={
                    'card_id': str(card.id),
                    'changes': changes,
                    'ip': request.remote_addr
                }
            )
        
        return jsonify({
            'success': True,
            'card_id': str(card.id),
            'spending_limits': {
                'daily': float(card.daily_spending_limit),
                'monthly': float(card.monthly_spending_limit),
                'per_transaction': float(card.per_transaction_limit)
            },
            'changes': changes,
            'updated_at': card.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Update spending limits error: {str(e)}")
        return jsonify({
            'error': 'Failed to update spending limits',
            'code': 'UPDATE_LIMITS_ERROR'
        }), 500

@card_bp.route('/<card_id>/controls', methods=['PUT'])
@card_access_required
def update_card_controls(card_id):
    """
    Update card controls
    
    Expected JSON payload:
    {
        "online_transactions": true,
        "contactless_payments": true,
        "atm_withdrawals": true,
        "international_transactions": false,
        "blocked_merchant_categories": ["gambling", "adult_entertainment"]
    }
    """
    try:
        card = g.card
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'Request body must contain valid JSON',
                'code': 'INVALID_JSON'
            }), 400
        
        if card.status not in [CardStatus.ACTIVE, CardStatus.BLOCKED]:
            return jsonify({
                'error': 'Cannot update controls for cancelled or expired cards',
                'code': 'INVALID_CARD_STATUS'
            }), 400
        
        # Track changes for audit
        changes = {}
        
        # Update controls if provided
        if 'online_transactions' in data:
            old_value = card.online_transactions_enabled
            card.online_transactions_enabled = bool(data['online_transactions'])
            if old_value != card.online_transactions_enabled:
                changes['online_transactions'] = {'old': old_value, 'new': card.online_transactions_enabled}
        
        if 'contactless_payments' in data:
            old_value = card.contactless_payments_enabled
            card.contactless_payments_enabled = bool(data['contactless_payments'])
            if old_value != card.contactless_payments_enabled:
                changes['contactless_payments'] = {'old': old_value, 'new': card.contactless_payments_enabled}
        
        if 'atm_withdrawals' in data:
            old_value = card.atm_withdrawals_enabled
            card.atm_withdrawals_enabled = bool(data['atm_withdrawals'])
            if old_value != card.atm_withdrawals_enabled:
                changes['atm_withdrawals'] = {'old': old_value, 'new': card.atm_withdrawals_enabled}
        
        if 'international_transactions' in data:
            old_value = card.international_transactions_enabled
            card.international_transactions_enabled = bool(data['international_transactions'])
            if old_value != card.international_transactions_enabled:
                changes['international_transactions'] = {'old': old_value, 'new': card.international_transactions_enabled}
        
        if 'blocked_merchant_categories' in data:
            # Validate merchant categories
            valid_categories = [
                'gas_stations', 'grocery_stores', 'restaurants', 'entertainment',
                'travel', 'online_retail', 'atm_withdrawals', 'gambling',
                'adult_entertainment', 'cryptocurrency', 'money_transfer'
            ]
            
            blocked_categories = data['blocked_merchant_categories']
            if not isinstance(blocked_categories, list):
                return jsonify({
                    'error': 'Blocked merchant categories must be a list',
                    'code': 'INVALID_CATEGORIES_FORMAT'
                }), 400
            
            for category in blocked_categories:
                if category not in valid_categories:
                    return jsonify({
                        'error': f'Invalid merchant category: {category}',
                        'code': 'INVALID_MERCHANT_CATEGORY',
                        'valid_categories': valid_categories
                    }), 400
            
            old_categories = json.loads(card.blocked_merchant_categories)
            card.blocked_merchant_categories = json.dumps(blocked_categories)
            if old_categories != blocked_categories:
                changes['blocked_merchant_categories'] = {'old': old_categories, 'new': blocked_categories}
        
        card.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        
        # Log control changes
        if changes:
            audit_logger.log_user_event(
                user_id=g.current_user.id,
                event_type='card_controls_updated',
                details={
                    'card_id': str(card.id),
                    'changes': changes,
                    'ip': request.remote_addr
                }
            )
        
        return jsonify({
            'success': True,
            'card_id': str(card.id),
            'controls': {
                'online_transactions_enabled': card.online_transactions_enabled,
                'contactless_payments_enabled': card.contactless_payments_enabled,
                'atm_withdrawals_enabled': card.atm_withdrawals_enabled,
                'international_transactions_enabled': card.international_transactions_enabled,
                'blocked_merchant_categories': json.loads(card.blocked_merchant_categories)
            },
            'changes': changes,
            'updated_at': card.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Update card controls error: {str(e)}")
        return jsonify({
            'error': 'Failed to update card controls',
            'code': 'UPDATE_CONTROLS_ERROR'
        }), 500

@card_bp.route('/<card_id>/pin', methods=['PUT'])
@card_access_required
def update_card_pin(card_id):
    """
    Update card PIN
    
    Expected JSON payload:
    {
        "current_pin": "string" (required if PIN already set),
        "new_pin": "string"
    }
    """
    try:
        card = g.card
        data = request.get_json()
        
        if not data or 'new_pin' not in data:
            return jsonify({
                'error': 'New PIN is required',
                'code': 'NEW_PIN_REQUIRED'
            }), 400
        
        if card.status != CardStatus.ACTIVE:
            return jsonify({
                'error': 'Card must be active to update PIN',
                'code': 'CARD_NOT_ACTIVE'
            }), 400
        
        if card.is_pin_locked:
            return jsonify({
                'error': 'PIN is locked due to too many failed attempts',
                'code': 'PIN_LOCKED'
            }), 423
        
        new_pin = data['new_pin']
        
        # Validate PIN format
        if not input_validator.validate_pin(new_pin):
            return jsonify({
                'error': 'PIN must be exactly 4 digits',
                'code': 'INVALID_PIN_FORMAT'
            }), 400
        
        # If PIN is already set, verify current PIN
        if card.pin_hash:
            if 'current_pin' not in data:
                return jsonify({
                    'error': 'Current PIN is required to change PIN',
                    'code': 'CURRENT_PIN_REQUIRED'
                }), 400
            
            if not pin_manager.verify_pin(data['current_pin'], card.pin_hash):
                # Increment failed attempts
                card.pin_attempts += 1
                if card.pin_attempts >= 3:
                    card.is_pin_locked = True
                    card.pin_locked_at = datetime.now(timezone.utc)
                
                db.session.commit()
                
                audit_logger.log_security_event(
                    event_type='pin_verification_failed',
                    details={
                        'card_id': str(card.id),
                        'user_id': g.current_user.id,
                        'attempts': card.pin_attempts,
                        'ip': request.remote_addr
                    }
                )
                
                return jsonify({
                    'error': 'Current PIN is incorrect',
                    'code': 'INVALID_CURRENT_PIN',
                    'attempts_remaining': max(0, 3 - card.pin_attempts)
                }), 401
        
        # Update PIN
        card.pin_hash = pin_manager.hash_pin(new_pin)
        card.pin_attempts = 0
        card.is_pin_locked = False
        card.pin_locked_at = None
        card.pin_changed_at = datetime.now(timezone.utc)
        card.updated_at = datetime.now(timezone.utc)
        
        db.session.commit()
        
        # Log PIN change
        audit_logger.log_user_event(
            user_id=g.current_user.id,
            event_type='card_pin_changed',
            details={
                'card_id': str(card.id),
                'ip': request.remote_addr
            }
        )
        
        return jsonify({
            'success': True,
            'card_id': str(card.id),
            'message': 'PIN updated successfully',
            'pin_changed_at': card.pin_changed_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Update PIN error: {str(e)}")
        return jsonify({
            'error': 'Failed to update PIN',
            'code': 'PIN_UPDATE_ERROR'
        }), 500

@card_bp.route('/<card_id>/transactions', methods=['GET'])
@card_access_required
def get_card_transactions(card_id):
    """Get transaction history for a specific card"""
    try:
        card = g.card
        
        # Get query parameters
        page = request.args.get('page', 1, type=int)
        per_page = min(request.args.get('per_page', 20, type=int), 100)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        transaction_type = request.args.get('transaction_type')
        merchant_category = request.args.get('merchant_category')
        
        # Build query
        query = CardTransaction.query.filter_by(card_id=card.id)
        
        # Apply filters
        if start_date:
            try:
                start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(CardTransaction.created_at >= start_dt)
            except ValueError:
                return jsonify({
                    'error': 'Invalid start_date format. Use ISO format',
                    'code': 'INVALID_DATE_FORMAT'
                }), 400
        
        if end_date:
            try:
                end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(CardTransaction.created_at <= end_dt)
            except ValueError:
                return jsonify({
                    'error': 'Invalid end_date format. Use ISO format',
                    'code': 'INVALID_DATE_FORMAT'
                }), 400
        
        if transaction_type:
            query = query.filter(CardTransaction.transaction_type == transaction_type)
        
        if merchant_category:
            query = query.filter(CardTransaction.merchant_category == merchant_category)
        
        # Order by creation date (newest first) and paginate
        transactions = query.order_by(CardTransaction.created_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # Format transaction data
        transaction_list = []
        for transaction in transactions.items:
            transaction_data = {
                'id': str(transaction.id),
                'amount': float(transaction.amount),
                'currency': transaction.currency,
                'merchant_name': transaction.merchant_name,
                'merchant_category': transaction.merchant_category,
                'transaction_type': transaction.transaction_type.value,
                'status': transaction.status.value,
                'authorization_code': transaction.authorization_code,
                'reference_number': transaction.reference_number,
                'created_at': transaction.created_at.isoformat(),
                'processed_at': transaction.processed_at.isoformat() if transaction.processed_at else None
            }
            transaction_list.append(transaction_data)
        
        return jsonify({
            'success': True,
            'card_id': str(card.id),
            'transactions': transaction_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': transactions.total,
                'pages': transactions.pages,
                'has_next': transactions.has_next,
                'has_prev': transactions.has_prev
            },
            'filters': {
                'start_date': start_date,
                'end_date': end_date,
                'transaction_type': transaction_type,
                'merchant_category': merchant_category
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get card transactions error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve card transactions',
            'code': 'GET_TRANSACTIONS_ERROR'
        }), 500

@card_bp.route('/account/<account_id>', methods=['GET'])
@token_required
def get_account_cards(account_id):
    """Get all cards for a specific account"""
    try:
        # Find and validate account
        account = Account.query.get(account_id)
        if not account:
            return jsonify({
                'error': 'Account not found',
                'code': 'ACCOUNT_NOT_FOUND'
            }), 404
        
        # Check if user owns the account or is admin
        if account.user_id != g.current_user.id and not g.current_user.is_admin:
            return jsonify({
                'error': 'Access denied',
                'code': 'ACCESS_DENIED'
            }), 403
        
        cards = Card.query.filter_by(account_id=account_id).all()
        
        card_list = []
        for card in cards:
            card_data = {
                'id': str(card.id),
                'card_type': card.card_type.value,
                'card_name': card.card_name,
                'last_four_digits': card.last_four_digits,
                'expiry_month': card.expiry_month,
                'expiry_year': card.expiry_year,
                'status': card.status.value,
                'spending_limits': {
                    'daily': float(card.daily_spending_limit),
                    'monthly': float(card.monthly_spending_limit),
                    'per_transaction': float(card.per_transaction_limit)
                },
                'current_spending': {
                    'daily': float(card.get_daily_spending()),
                    'monthly': float(card.get_monthly_spending())
                },
                'created_at': card.created_at.isoformat(),
                'last_transaction_at': card.last_transaction_at.isoformat() if card.last_transaction_at else None
            }
            card_list.append(card_data)
        
        return jsonify({
            'success': True,
            'account_id': str(account.id),
            'cards': card_list,
            'summary': {
                'total_cards': len(card_list),
                'active_cards': len([c for c in cards if c.status == CardStatus.ACTIVE]),
                'blocked_cards': len([c for c in cards if c.status == CardStatus.BLOCKED]),
                'cancelled_cards': len([c for c in cards if c.status == CardStatus.CANCELLED])
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Get account cards error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve account cards',
            'code': 'GET_ACCOUNT_CARDS_ERROR'
        }), 500


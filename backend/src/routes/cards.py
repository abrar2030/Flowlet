
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Any, Optional
import json
import secrets
import hashlib
from sqlalchemy import and_, or_, func
from src.models.database import Card, Wallet, Transaction
from src.security.audit_logger import AuditLogger
from src.security.input_validator import InputValidator, ValidationError
from src.security.rate_limiter import rate_limit
from src.security.token_manager import token_required, require_permissions
from src.security.encryption_manager import TokenizationManager
from src.security.password_security import PasswordSecurity

cards_bp = Blueprint(\'cards\', __name__)

class CardManager:
    """Card management with advanced security and controls"""
    
    def __init__(self):
        self.tokenization_manager = TokenizationManager()
        self.merchant_categories = {
            'grocery': '5411',
            'gas_station': '5542',
            'restaurant': '5812',
            'retail': '5999',
            'atm': '6011',
            'online': '5816',
            'travel': '4722',
            'entertainment': '7832',
            'healthcare': '8011',
            'education': '8220',
            'gambling': '7995',
            'adult_entertainment': '5967'
        }
    
    def create_virtual_card(
        self, 
        wallet_id: str, 
        card_type: str = 'virtual',
        spending_limits: Optional[Dict[str, Decimal]] = None,
        merchant_controls: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a new virtual card with security"""
        from src.models.database import db, Wallet
        
        # Verify wallet exists and is active
        wallet = db.session.query(Wallet).get(wallet_id)
        if not wallet or wallet.status != 'active':
            raise ValueError("Invalid or inactive wallet")
        
        # Generate secure card number (using Luhn algorithm)
        card_number = self._generate_card_number()
        
        # Tokenize card number
        tokenization_result = self.tokenization_manager.tokenize_card_number(
            card_number, 
            wallet.user_id
        )
        
        # Generate expiry date (3 years from now)
        expiry_date = datetime.utcnow() + timedelta(days=3*365)
        
        # Set default spending limits if not provided
        if not spending_limits:
            spending_limits = {
                'daily': Decimal('1000.00'),
                'monthly': Decimal('5000.00'),
                'per_transaction': Decimal('500.00')
            }
        
        # Set default merchant controls if not provided
        if not merchant_controls:
            merchant_controls = {
                'blocked_categories': [],
                'allowed_categories': [],
                'international_enabled': False,
                'online_enabled': True,
                'contactless_enabled': True,
                'atm_enabled': True
            }
        
        # Create card record
        new_card = Card(
            wallet_id=wallet_id,
            card_type=card_type,
            card_number_token=tokenization_result['token'],
            last_four_digits=tokenization_result['last_four'],
            expiry_month=expiry_date.month,
            expiry_year=expiry_date.year,
            card_brand='FLOWLET',  # Custom brand
            status='active',
            spending_limit_daily=spending_limits['daily'],
            spending_limit_monthly=spending_limits['monthly'],
            spending_limit_per_transaction=spending_limits['per_transaction'],
            online_transactions_enabled=merchant_controls['online_enabled'],
            international_transactions_enabled=merchant_controls['international_enabled'],
            contactless_enabled=merchant_controls['contactless_enabled'],
            atm_withdrawals_enabled=merchant_controls['atm_enabled'],
            merchant_categories_blocked=json.dumps(merchant_controls['blocked_categories']),
            merchant_categories_allowed=json.dumps(merchant_controls['allowed_categories']),
            activated_at=datetime.utcnow()
        )
        
        db.session.add(new_card)
        db.session.commit()
        
        return {
            'card_id': new_card.id,
            'card_type': new_card.card_type,
            'last_four_digits': new_card.last_four_digits,
            'expiry_month': new_card.expiry_month,
            'expiry_year': new_card.expiry_year,
            'card_brand': new_card.card_brand,
            'status': new_card.status,
            'spending_limits': {
                'daily': str(new_card.spending_limit_daily),
                'monthly': str(new_card.spending_limit_monthly),
                'per_transaction': str(new_card.spending_limit_per_transaction)
            },
            'controls': {
                'online_enabled': new_card.online_transactions_enabled,
                'international_enabled': new_card.international_transactions_enabled,
                'contactless_enabled': new_card.contactless_enabled,
                'atm_enabled': new_card.atm_withdrawals_enabled
            },
            'created_at': new_card.created_at.isoformat(),
            'activated_at': new_card.activated_at.isoformat()
        }
    
    def _generate_card_number(self) -> str:
        """Generate a valid card number using Luhn algorithm"""
        # Start with BIN (Bank Identification Number) for virtual cards
        bin_prefix = "4532"  # Visa-like prefix for virtual cards
        
        # Generate random middle digits
        middle_digits = ''.join([str(secrets.randbelow(10)) for _ in range(11)])
        
        # Calculate check digit using Luhn algorithm
        partial_number = bin_prefix + middle_digits
        check_digit = self._calculate_luhn_check_digit(partial_number)
        
        return partial_number + str(check_digit)
    
    def _calculate_luhn_check_digit(self, partial_number: str) -> int:
        """Calculate Luhn check digit"""
        def luhn_sum(card_num):
            def digits_of(n):
                return [int(d) for d in str(n)]
            
            digits = digits_of(card_num)
            odd_digits = digits[-1::-2]
            even_digits = digits[-2::-2]
            checksum = sum(odd_digits)
            for d in even_digits:
                checksum += sum(digits_of(d * 2))
            return checksum
        
        # Find check digit that makes total sum divisible by 10
        for check_digit in range(10):
            if luhn_sum(partial_number + str(check_digit)) % 10 == 0:
                return check_digit
        
        return 0
    
    def update_card_controls(
        self, 
        card_id: str, 
        user_id: str, 
        controls: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Update card controls and spending limits"""
        from src.models.database import db
        card = db.session.query(Card)\
            .join(Card.wallet)\
            .filter(Card.id == card_id)\
            .filter(Wallet.user_id == user_id)\
            .first()
        
        if not card:
            raise ValueError("Card not found or access denied")
        
        # Update spending limits
        if 'spending_limits' in controls:
            limits = controls['spending_limits']
            if 'daily' in limits:
                card.spending_limit_daily = Decimal(str(limits['daily']))
            if 'monthly' in limits:
                card.spending_limit_monthly = Decimal(str(limits['monthly']))
            if 'per_transaction' in limits:
                card.spending_limit_per_transaction = Decimal(str(limits['per_transaction']))
        
        # Update transaction controls
        if 'online_enabled' in controls:
            card.online_transactions_enabled = controls['online_enabled']
        if 'international_enabled' in controls:
            card.international_transactions_enabled = controls['international_enabled']
        if 'contactless_enabled' in controls:
            card.contactless_enabled = controls['contactless_enabled']
        if 'atm_enabled' in controls:
            card.atm_withdrawals_enabled = controls['atm_enabled']
        
        # Update merchant category controls
        if 'blocked_categories' in controls:
            card.merchant_categories_blocked = json.dumps(controls['blocked_categories'])
        if 'allowed_categories' in controls:
            card.merchant_categories_allowed = json.dumps(controls['allowed_categories'])
        
        # Update geographic controls
        if 'allowed_countries' in controls:
            card.allowed_countries = json.dumps(controls['allowed_countries'])
        if 'blocked_countries' in controls:
            card.blocked_countries = json.dumps(controls['blocked_countries'])
        
        card.updated_at = datetime.utcnow()
        db.session.commit()
        
        return {
            'card_id': card.id,
            'updated_controls': controls,
            'updated_at': card.updated_at.isoformat()
        }
    
    def authorize_transaction(
        self, 
        card_id: str, 
        transaction_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Authorize card transaction with real-time controls"""
        from src.models.database import db
        card = db.session.query(Card).get(card_id)
        if not card:
            return {'authorized': False, 'reason': 'Card not found'}
        
        if card.status != 'active':
            return {'authorized': False, 'reason': 'Card not active'}
        
        amount = Decimal(str(transaction_data.get('amount', 0)))
        merchant_category = transaction_data.get('merchant_category', '')
        country_code = transaction_data.get('country_code', 'US')
        transaction_type = transaction_data.get('transaction_type', 'purchase')
        
        # Check spending limits
        auth_result = self._check_spending_limits(card, amount)
        if not auth_result['authorized']:
            return auth_result
        
        # Check transaction controls
        auth_result = self._check_transaction_controls(card, transaction_data)
        if not auth_result['authorized']:
            return auth_result
        
        # Check merchant category controls
        auth_result = self._check_merchant_controls(card, merchant_category)
        if not auth_result['authorized']:
            return auth_result
        
        # Check geographic controls
        auth_result = self._check_geographic_controls(card, country_code)
        if not auth_result['authorized']:
            return auth_result
        
        # Check wallet balance
        if card.wallet.available_balance < amount:
            return {'authorized': False, 'reason': 'Insufficient funds'}
        
        # All checks passed
        return {
            'authorized': True,
            'authorization_code': secrets.token_hex(8).upper(),
            'timestamp': datetime.utcnow().isoformat()
        }
    
    def _check_spending_limits(self, card: Card, amount: Decimal) -> Dict[str, Any]:
        """Check spending limits"""
        # Check per-transaction limit
        if amount > card.spending_limit_per_transaction:
            return {
                'authorized': False, 
                'reason': 'Transaction amount exceeds per-transaction limit',
                'limit': str(card.spending_limit_per_transaction)
            }
        
        # Check daily limit
        today = datetime.utcnow().date()
        daily_spent = card.total_spent_today or Decimal('0.00')
        
        if daily_spent + amount > card.spending_limit_daily:
            return {
                'authorized': False, 
                'reason': 'Transaction would exceed daily spending limit',
                'limit': str(card.spending_limit_daily),
                'current_spent': str(daily_spent)
            }
        
        # Check monthly limit
        monthly_spent = card.total_spent_month or Decimal('0.00')
        
        if monthly_spent + amount > card.spending_limit_monthly:
            return {
                'authorized': False, 
                'reason': 'Transaction would exceed monthly spending limit',
                'limit': str(card.spending_limit_monthly),
                'current_spent': str(monthly_spent)
            }
        
        return {'authorized': True}
    
    def _check_transaction_controls(self, card: Card, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check transaction type controls"""
        transaction_type = transaction_data.get('transaction_type', 'purchase')
        is_online = transaction_data.get('is_online', False)
        is_contactless = transaction_data.get('is_contactless', False)
        country_code = transaction_data.get('country_code', 'US')
        
        # Check online transactions
        if is_online and not card.online_transactions_enabled:
            return {'authorized': False, 'reason': 'Online transactions disabled'}
        
        # Check international transactions
        if country_code != 'US' and not card.international_transactions_enabled:
            return {'authorized': False, 'reason': 'International transactions disabled'}
        
        # Check contactless transactions
        if is_contactless and not card.contactless_enabled:
            return {'authorized': False, 'reason': 'Contactless transactions disabled'}
        
        # Check ATM withdrawals
        if transaction_type == 'atm_withdrawal' and not card.atm_withdrawals_enabled:
            return {'authorized': False, 'reason': 'ATM withdrawals disabled'}
        
        return {'authorized': True}
    
    def _check_merchant_controls(self, card: Card, merchant_category: str) -> Dict[str, Any]:
        """Check merchant category controls"""
        blocked_categories = json.loads(card.merchant_categories_blocked or '[]')
        allowed_categories = json.loads(card.merchant_categories_allowed or '[]')
        
        # If merchant category is blocked
        if merchant_category in blocked_categories:
            return {'authorized': False, 'reason': f'Merchant category {merchant_category} is blocked'}
        
        # If allowed categories are specified and merchant category is not in the list
        if allowed_categories and merchant_category not in allowed_categories:
            return {'authorized': False, 'reason': f'Merchant category {merchant_category} is not allowed'}
        
        return {'authorized': True}
    
    def _check_geographic_controls(self, card: Card, country_code: str) -> Dict[str, Any]:
        """Check geographic controls"""
        allowed_countries = json.loads(card.allowed_countries or '[]')
        blocked_countries = json.loads(card.blocked_countries or '[]')
        
        # If country is blocked
        if country_code in blocked_countries:
            return {'authorized': False, 'reason': f'Transactions from {country_code} are blocked'}
        
        # If allowed countries are specified and country is not in the list
        if allowed_countries and country_code not in allowed_countries:
            return {'authorized': False, 'reason': f'Transactions from {country_code} are not allowed'}
        
        return {'authorized': True}
    
    def get_card_analytics(self, card_id: str, user_id: str, days: int = 30) -> Dict[str, Any]:
        """Get spending analytics for a card"""
        from src.models.database import db
        card = db.session.query(Card)\
            .join(Card.wallet)\
            .filter(Card.id == card_id)\
            .filter(Wallet.user_id == user_id)\
            .first()
        
        if not card:
            raise ValueError("Card not found or access denied")
        
        # Get transactions for the period
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # This would query actual transaction data in production
        # For now, return mock analytics
        analytics = {
            'card_id': card_id,
            'analysis_period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'days': days
            },
            'spending_summary': {
                'total_transactions': 25,
                'total_amount': '1,250.75',
                'average_transaction': '50.03',
                'largest_transaction': '150.00'
            },
            'spending_by_category': {
                'grocery': '450.25',
                'restaurant': '320.50',
                'gas_station': '180.00',
                'retail': '300.00'
            },
            'spending_by_location': {
                'US': '1,200.75',
                'CA': '50.00'
            },
            'spending_trends': {
                'daily_average': '41.69',
                'peak_spending_day': 'Friday',
                'peak_spending_hour': '18:00'
            },
            'security_events': {
                'declined_transactions': 2,
                'fraud_alerts': 0,
                'limit_exceeded': 1
            }
        }
        
        return analytics

@enhanced_cards_bp.route('/cards', methods=['POST'])
@enhanced_token_required
@rate_limit('10 per hour')
def create_card():
    """Create a new virtual card"""
    try:
        data = request.get_json()
        user_id = request.current_user['user_id']
        
        # Validate input
        schema = {
            'wallet_id': {'type': 'string', 'required': True},
            'card_type': {'type': 'string', 'required': False},
            'spending_limits': {'type': 'object', 'required': False},
            'merchant_controls': {'type': 'object', 'required': False}
        }
        
        # Basic validation
        wallet_id = data.get('wallet_id')
        if not wallet_id:
            raise ValidationError('wallet_id', 'Wallet ID is required')
        
        card_type = data.get('card_type', 'virtual')
        if card_type not in ['virtual', 'physical']:
            raise ValidationError('card_type', 'Card type must be virtual or physical')
        
        # Parse spending limits
        spending_limits = None
        if 'spending_limits' in data:
            limits = data['spending_limits']
            spending_limits = {
                'daily': Decimal(str(limits.get('daily', '1000.00'))),
                'monthly': Decimal(str(limits.get('monthly', '5000.00'))),
                'per_transaction': Decimal(str(limits.get('per_transaction', '500.00')))
            }
        
        # Create card
        card_manager = EnhancedCardManager()
        card_data = card_manager.create_virtual_card(
            wallet_id,
            card_type,
            spending_limits,
            data.get('merchant_controls')
        )
        
        # Log card creation
        AuditLogger.log_event(
            user_id=user_id,
            action='create_card',
            resource_type='payment_card',
            resource_id=card_data['card_id'],
            additional_data={
                'card_type': card_type,
                'wallet_id': wallet_id
            }
        )
        
        return jsonify({
            'card': card_data,
            'message': f"{card_type.title()} card created successfully"
        }), 201
        
    except ValidationError as e:
        return jsonify({'error': str(e), 'code': 'VALIDATION_ERROR'}), 400
    except ValueError as e:
        return jsonify({'error': str(e), 'code': 'INVALID_WALLET'}), 400
    except Exception as e:
        return jsonify({'error': str(e), 'code': 'CREATION_ERROR'}), 500

@enhanced_cards_bp.route('/cards/<card_id>/controls', methods=['PUT'])
@enhanced_token_required
@rate_limit('50 per hour')
def update_card_controls(card_id):
    """Update card controls and spending limits"""
    try:
        data = request.get_json()
        user_id = request.current_user['user_id']
        
        # Update controls
        card_manager = EnhancedCardManager()
        result = card_manager.update_card_controls(card_id, user_id, data)
        
        # Log control update
        AuditLogger.log_event(
            user_id=user_id,
            action='update_card_controls',
            resource_type='payment_card',
            resource_id=card_id,
            additional_data=data
        )
        
        return jsonify({
            'result': result,
            'message': 'Card controls updated successfully'
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e), 'code': 'CARD_NOT_FOUND'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'code': 'UPDATE_ERROR'}), 500

@enhanced_cards_bp.route('/cards/<card_id>/authorize', methods=['POST'])
@enhanced_token_required
@require_permissions(['card_processing'])
@rate_limit('1000 per hour')
def authorize_transaction(card_id):
    """Authorize a card transaction"""
    try:
        data = request.get_json()
        
        # Validate transaction data
        required_fields = ['amount', 'merchant_category', 'country_code']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required', 'code': 'MISSING_FIELD'}), 400
        
        # Authorize transaction
        card_manager = EnhancedCardManager()
        auth_result = card_manager.authorize_transaction(card_id, data)
        
        # Log authorization attempt
        AuditLogger.log_event(
            user_id=request.current_user.get('user_id'),
            action='authorize_card_transaction',
            resource_type='payment_card',
            resource_id=card_id,
            additional_data={
                'amount': data['amount'],
                'authorized': auth_result['authorized'],
                'reason': auth_result.get('reason')
            }
        )
        
        return jsonify(auth_result), 200
        
    except Exception as e:
        return jsonify({'error': str(e), 'code': 'AUTHORIZATION_ERROR'}), 500

@enhanced_cards_bp.route('/cards/<card_id>/analytics', methods=['GET'])
@enhanced_token_required
@rate_limit('100 per hour')
def get_card_analytics(card_id):
    """Get card spending analytics"""
    try:
        user_id = request.current_user['user_id']
        days = request.args.get('days', 30, type=int)
        
        if days < 1 or days > 365:
            return jsonify({'error': 'Days must be between 1 and 365', 'code': 'INVALID_RANGE'}), 400
        
        # Get analytics
        card_manager = EnhancedCardManager()
        analytics = card_manager.get_card_analytics(card_id, user_id, days)
        
        return jsonify(analytics), 200
        
    except ValueError as e:
        return jsonify({'error': str(e), 'code': 'CARD_NOT_FOUND'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'code': 'ANALYTICS_ERROR'}), 500

@enhanced_cards_bp.route('/cards/<card_id>/freeze', methods=['POST'])
@enhanced_token_required
@rate_limit('20 per hour')
def freeze_card(card_id):
    """Freeze a card temporarily"""
    try:
        data = request.get_json()
        user_id = request.current_user['user_id']
        
        from src.models.enhanced_database import db, Card, Wallet
        
        # Get card and verify ownership
        card = db.session.query(Card)\
            .join(Card.wallet)\
            .filter(Card.id == card_id)\
            .filter(Wallet.user_id == user_id)\
            .first()
        
        if not card:
            return jsonify({'error': 'Card not found', 'code': 'CARD_NOT_FOUND'}), 404
        
        # Freeze card
        card.status = 'blocked'
        card.freeze_reason = data.get('reason', 'User requested freeze')
        card.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log freeze action
        AuditLogger.log_event(
            user_id=user_id,
            action='freeze_card',
            resource_type='payment_card',
            resource_id=card_id,
            additional_data={'reason': card.freeze_reason}
        )
        
        return jsonify({
            'card_id': card_id,
            'status': card.status,
            'freeze_reason': card.freeze_reason,
            'message': 'Card frozen successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e), 'code': 'FREEZE_ERROR'}), 500

@enhanced_cards_bp.route('/cards/<card_id>/unfreeze', methods=['POST'])
@enhanced_token_required
@rate_limit('20 per hour')
def unfreeze_card(card_id):
    """Unfreeze a card"""
    try:
        user_id = request.current_user['user_id']
        
        from src.models.enhanced_database import db, Card, Wallet
        
        # Get card and verify ownership
        card = db.session.query(Card)\
            .join(Card.wallet)\
            .filter(Card.id == card_id)\
            .filter(Wallet.user_id == user_id)\
            .first()
        
        if not card:
            return jsonify({'error': 'Card not found', 'code': 'CARD_NOT_FOUND'}), 404
        
        # Unfreeze card
        card.status = 'active'
        card.freeze_reason = None
        card.updated_at = datetime.utcnow()
        
        db.session.commit()
        
        # Log unfreeze action
        AuditLogger.log_event(
            user_id=user_id,
            action='unfreeze_card',
            resource_type='payment_card',
            resource_id=card_id
        )
        
        return jsonify({
            'card_id': card_id,
            'status': card.status,
            'message': 'Card unfrozen successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e), 'code': 'UNFREEZE_ERROR'}), 500


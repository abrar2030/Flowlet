from flask import Blueprint, request, jsonify
from src.models.database import db, Card, Wallet, Transaction
from datetime import datetime, timedelta
import uuid
import random
import string
import json
from decimal import Decimal

card_bp = Blueprint('card', __name__)

def generate_card_token():
    """Generate a secure token for card number"""
    return 'CTK_' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=20))

def generate_last_four():
    """Generate last four digits for card display"""
    return ''.join(random.choices(string.digits, k=4))

@card_bp.route('/issue', methods=['POST'])
def issue_card():
    """Issue a new virtual or physical card"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['wallet_id', 'card_type']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        wallet = Wallet.query.get(data['wallet_id'])
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        if wallet.status != 'active':
            return jsonify({'error': 'Wallet is not active'}), 400
        
        card_type = data['card_type']
        if card_type not in ['virtual', 'physical']:
            return jsonify({'error': 'Invalid card type. Must be virtual or physical'}), 400
        
        # Generate card details
        current_date = datetime.utcnow()
        expiry_date = current_date + timedelta(days=1095)  # 3 years from now
        
        # Create new card
        card = Card(
            wallet_id=data['wallet_id'],
            card_type=card_type,
            card_number_token=generate_card_token(),
            last_four_digits=generate_last_four(),
            expiry_month=expiry_date.month,
            expiry_year=expiry_date.year,
            status='active',
            spending_limit_daily=Decimal(data.get('daily_limit', '1000.00')),
            spending_limit_monthly=Decimal(data.get('monthly_limit', '10000.00')),
            merchant_categories_blocked=json.dumps(data.get('blocked_categories', [])),
            online_transactions_enabled=data.get('online_enabled', True)
        )
        
        db.session.add(card)
        db.session.commit()
        
        response_data = {
            'card_id': card.id,
            'wallet_id': card.wallet_id,
            'card_type': card.card_type,
            'last_four_digits': card.last_four_digits,
            'expiry_month': card.expiry_month,
            'expiry_year': card.expiry_year,
            'status': card.status,
            'spending_limits': {
                'daily': str(card.spending_limit_daily),
                'monthly': str(card.spending_limit_monthly)
            },
            'controls': {
                'online_transactions_enabled': card.online_transactions_enabled,
                'blocked_categories': json.loads(card.merchant_categories_blocked)
            },
            'created_at': card.created_at.isoformat()
        }
        
        # Add card token for virtual cards (for immediate use)
        if card_type == 'virtual':
            response_data['card_token'] = card.card_number_token
            response_data['ready_for_use'] = True
        else:
            response_data['estimated_delivery'] = '5-7 business days'
            response_data['ready_for_use'] = False
        
        return jsonify(response_data), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@card_bp.route('/<card_id>', methods=['GET'])
def get_card(card_id):
    """Get card details"""
    try:
        card = Card.query.get(card_id)
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        return jsonify({
            'card_id': card.id,
            'wallet_id': card.wallet_id,
            'card_type': card.card_type,
            'last_four_digits': card.last_four_digits,
            'expiry_month': card.expiry_month,
            'expiry_year': card.expiry_year,
            'status': card.status,
            'spending_limits': {
                'daily': str(card.spending_limit_daily),
                'monthly': str(card.spending_limit_monthly)
            },
            'controls': {
                'online_transactions_enabled': card.online_transactions_enabled,
                'blocked_categories': json.loads(card.merchant_categories_blocked)
            },
            'created_at': card.created_at.isoformat(),
            'updated_at': card.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@card_bp.route('/<card_id>/activate', methods=['POST'])
def activate_card(card_id):
    """Activate a card (typically for physical cards)"""
    try:
        data = request.get_json()
        
        card = Card.query.get(card_id)
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        # For physical cards, might require additional verification
        if card.card_type == 'physical':
            if 'activation_code' not in data:
                return jsonify({'error': 'Activation code required for physical cards'}), 400
            
            # In production, verify activation code
            # For demo, accept any 6-digit code
            activation_code = data['activation_code']
            if len(activation_code) != 6 or not activation_code.isdigit():
                return jsonify({'error': 'Invalid activation code format'}), 400
        
        card.status = 'active'
        card.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'card_id': card.id,
            'status': card.status,
            'message': 'Card activated successfully',
            'activated_at': card.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@card_bp.route('/<card_id>/freeze', methods=['POST'])
def freeze_card(card_id):
    """Freeze/block a card"""
    try:
        card = Card.query.get(card_id)
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        card.status = 'blocked'
        card.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'card_id': card.id,
            'status': card.status,
            'message': 'Card has been frozen successfully',
            'frozen_at': card.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@card_bp.route('/<card_id>/unfreeze', methods=['POST'])
def unfreeze_card(card_id):
    """Unfreeze/unblock a card"""
    try:
        card = Card.query.get(card_id)
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        if card.status == 'cancelled':
            return jsonify({'error': 'Cannot unfreeze a cancelled card'}), 400
        
        card.status = 'active'
        card.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'card_id': card.id,
            'status': card.status,
            'message': 'Card has been unfrozen successfully',
            'unfrozen_at': card.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@card_bp.route('/<card_id>/cancel', methods=['POST'])
def cancel_card(card_id):
    """Cancel a card permanently"""
    try:
        data = request.get_json()
        
        card = Card.query.get(card_id)
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        reason = data.get('reason', 'User requested cancellation')
        
        card.status = 'cancelled'
        card.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'card_id': card.id,
            'status': card.status,
            'reason': reason,
            'message': 'Card has been cancelled permanently',
            'cancelled_at': card.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@card_bp.route('/<card_id>/limits', methods=['PUT'])
def update_spending_limits(card_id):
    """Update card spending limits"""
    try:
        data = request.get_json()
        
        card = Card.query.get(card_id)
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        if card.status not in ['active', 'blocked']:
            return jsonify({'error': 'Cannot update limits for cancelled or expired cards'}), 400
        
        # Update limits if provided
        if 'daily_limit' in data:
            card.spending_limit_daily = Decimal(str(data['daily_limit']))
        
        if 'monthly_limit' in data:
            card.spending_limit_monthly = Decimal(str(data['monthly_limit']))
        
        card.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'card_id': card.id,
            'spending_limits': {
                'daily': str(card.spending_limit_daily),
                'monthly': str(card.spending_limit_monthly)
            },
            'updated_at': card.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@card_bp.route('/<card_id>/controls', methods=['PUT'])
def update_card_controls(card_id):
    """Update card controls (online transactions, merchant categories)"""
    try:
        data = request.get_json()
        
        card = Card.query.get(card_id)
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        if card.status not in ['active', 'blocked']:
            return jsonify({'error': 'Cannot update controls for cancelled or expired cards'}), 400
        
        # Update controls if provided
        if 'online_transactions_enabled' in data:
            card.online_transactions_enabled = data['online_transactions_enabled']
        
        if 'blocked_categories' in data:
            # Validate merchant categories
            valid_categories = [
                'gas_stations', 'grocery_stores', 'restaurants', 'entertainment',
                'travel', 'online_retail', 'atm_withdrawals', 'gambling'
            ]
            blocked_categories = data['blocked_categories']
            
            for category in blocked_categories:
                if category not in valid_categories:
                    return jsonify({'error': f'Invalid merchant category: {category}'}), 400
            
            card.merchant_categories_blocked = json.dumps(blocked_categories)
        
        card.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'card_id': card.id,
            'controls': {
                'online_transactions_enabled': card.online_transactions_enabled,
                'blocked_categories': json.loads(card.merchant_categories_blocked)
            },
            'updated_at': card.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@card_bp.route('/<card_id>/pin', methods=['PUT'])
def update_card_pin(card_id):
    """Update card PIN"""
    try:
        data = request.get_json()
        
        if 'new_pin' not in data:
            return jsonify({'error': 'Missing required field: new_pin'}), 400
        
        card = Card.query.get(card_id)
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        if card.status != 'active':
            return jsonify({'error': 'Card must be active to update PIN'}), 400
        
        new_pin = data['new_pin']
        
        # Validate PIN format
        if len(new_pin) != 4 or not new_pin.isdigit():
            return jsonify({'error': 'PIN must be exactly 4 digits'}), 400
        
        # In production, PIN would be securely hashed and stored
        # For demo purposes, we'll just update the timestamp
        card.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'card_id': card.id,
            'message': 'PIN updated successfully',
            'updated_at': card.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@card_bp.route('/<card_id>/transactions', methods=['GET'])
def get_card_transactions(card_id):
    """Get transaction history for a specific card"""
    try:
        card = Card.query.get(card_id)
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Query transactions related to this card's wallet with card payment method
        transactions = Transaction.query.filter_by(wallet_id=card.wallet_id)\
            .filter(Transaction.payment_method.like('%card%'))\
            .order_by(Transaction.created_at.desc())\
            .paginate(page=page, per_page=per_page, error_out=False)
        
        transaction_list = []
        for transaction in transactions.items:
            transaction_list.append({
                'transaction_id': transaction.id,
                'type': transaction.transaction_type,
                'amount': str(transaction.amount),
                'currency': transaction.currency,
                'description': transaction.description,
                'status': transaction.status,
                'reference_id': transaction.reference_id,
                'created_at': transaction.created_at.isoformat()
            })
        
        return jsonify({
            'card_id': card_id,
            'transactions': transaction_list,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': transactions.total,
                'pages': transactions.pages,
                'has_next': transactions.has_next,
                'has_prev': transactions.has_prev
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@card_bp.route('/wallet/<wallet_id>', methods=['GET'])
def get_wallet_cards(wallet_id):
    """Get all cards for a specific wallet"""
    try:
        wallet = Wallet.query.get(wallet_id)
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        cards = Card.query.filter_by(wallet_id=wallet_id).all()
        
        card_list = []
        for card in cards:
            card_list.append({
                'card_id': card.id,
                'card_type': card.card_type,
                'last_four_digits': card.last_four_digits,
                'expiry_month': card.expiry_month,
                'expiry_year': card.expiry_year,
                'status': card.status,
                'spending_limits': {
                    'daily': str(card.spending_limit_daily),
                    'monthly': str(card.spending_limit_monthly)
                },
                'created_at': card.created_at.isoformat()
            })
        
        return jsonify({
            'wallet_id': wallet_id,
            'cards': card_list,
            'total_cards': len(card_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@card_bp.route('/<card_id>/spending-analysis', methods=['GET'])
def get_spending_analysis(card_id):
    """Get spending analysis for a card"""
    try:
        card = Card.query.get(card_id)
        if not card:
            return jsonify({'error': 'Card not found'}), 404
        
        # Get date range parameters
        days = request.args.get('days', 30, type=int)
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Query transactions for analysis
        transactions = Transaction.query.filter_by(wallet_id=card.wallet_id)\
            .filter(Transaction.payment_method.like('%card%'))\
            .filter(Transaction.created_at >= start_date)\
            .filter(Transaction.transaction_type == 'debit')\
            .filter(Transaction.status == 'completed')\
            .all()
        
        total_spent = sum(t.amount for t in transactions)
        transaction_count = len(transactions)
        
        # Calculate daily average
        daily_average = total_spent / days if days > 0 else 0
        
        # Group by day for trend analysis
        daily_spending = {}
        for transaction in transactions:
            date_key = transaction.created_at.date().isoformat()
            if date_key not in daily_spending:
                daily_spending[date_key] = 0
            daily_spending[date_key] += float(transaction.amount)
        
        return jsonify({
            'card_id': card_id,
            'analysis_period_days': days,
            'summary': {
                'total_spent': str(total_spent),
                'transaction_count': transaction_count,
                'daily_average': str(daily_average),
                'currency': card.wallet.currency
            },
            'daily_spending': daily_spending,
            'spending_limits': {
                'daily_limit': str(card.spending_limit_daily),
                'monthly_limit': str(card.spending_limit_monthly),
                'daily_utilization': str((daily_average / float(card.spending_limit_daily)) * 100) if card.spending_limit_daily > 0 else '0'
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


from flask import Blueprint, request, jsonify
from src.models.database import db, Wallet, Transaction, User
from datetime import datetime
import uuid
from decimal import Decimal

wallet_bp = Blueprint('wallet', __name__)

@wallet_bp.route('/create', methods=['POST'])
def create_wallet():
    """Create a new wallet for a user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'wallet_type', 'currency']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Check if user exists
        user = User.query.get(data['user_id'])
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Create new wallet
        wallet = Wallet(
            user_id=data['user_id'],
            wallet_type=data['wallet_type'],
            currency=data['currency'],
            balance=Decimal('0.00'),
            available_balance=Decimal('0.00'),
            status='active'
        )
        
        db.session.add(wallet)
        db.session.commit()
        
        return jsonify({
            'wallet_id': wallet.id,
            'user_id': wallet.user_id,
            'wallet_type': wallet.wallet_type,
            'currency': wallet.currency,
            'balance': str(wallet.balance),
            'available_balance': str(wallet.available_balance),
            'status': wallet.status,
            'created_at': wallet.created_at.isoformat()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/<wallet_id>', methods=['GET'])
def get_wallet(wallet_id):
    """Get wallet details by ID"""
    try:
        wallet = Wallet.query.get(wallet_id)
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        return jsonify({
            'wallet_id': wallet.id,
            'user_id': wallet.user_id,
            'wallet_type': wallet.wallet_type,
            'currency': wallet.currency,
            'balance': str(wallet.balance),
            'available_balance': str(wallet.available_balance),
            'status': wallet.status,
            'created_at': wallet.created_at.isoformat(),
            'updated_at': wallet.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/<wallet_id>/balance', methods=['GET'])
def get_wallet_balance(wallet_id):
    """Get current wallet balance"""
    try:
        wallet = Wallet.query.get(wallet_id)
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        return jsonify({
            'wallet_id': wallet.id,
            'balance': str(wallet.balance),
            'available_balance': str(wallet.available_balance),
            'currency': wallet.currency,
            'last_updated': wallet.updated_at.isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/<wallet_id>/transactions', methods=['GET'])
def get_wallet_transactions(wallet_id):
    """Get transaction history for a wallet"""
    try:
        wallet = Wallet.query.get(wallet_id)
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Query transactions with pagination
        transactions = Transaction.query.filter_by(wallet_id=wallet_id)\
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
                'payment_method': transaction.payment_method,
                'reference_id': transaction.reference_id,
                'created_at': transaction.created_at.isoformat()
            })
        
        return jsonify({
            'wallet_id': wallet_id,
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

@wallet_bp.route('/<wallet_id>/freeze', methods=['POST'])
def freeze_wallet(wallet_id):
    """Freeze/suspend a wallet"""
    try:
        wallet = Wallet.query.get(wallet_id)
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        wallet.status = 'suspended'
        wallet.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'wallet_id': wallet.id,
            'status': wallet.status,
            'message': 'Wallet has been frozen successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/<wallet_id>/unfreeze', methods=['POST'])
def unfreeze_wallet(wallet_id):
    """Unfreeze/activate a wallet"""
    try:
        wallet = Wallet.query.get(wallet_id)
        if not wallet:
            return jsonify({'error': 'Wallet not found'}), 404
        
        wallet.status = 'active'
        wallet.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'wallet_id': wallet.id,
            'status': wallet.status,
            'message': 'Wallet has been unfrozen successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/user/<user_id>', methods=['GET'])
def get_user_wallets(user_id):
    """Get all wallets for a specific user"""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        wallets = Wallet.query.filter_by(user_id=user_id).all()
        
        wallet_list = []
        for wallet in wallets:
            wallet_list.append({
                'wallet_id': wallet.id,
                'wallet_type': wallet.wallet_type,
                'currency': wallet.currency,
                'balance': str(wallet.balance),
                'available_balance': str(wallet.available_balance),
                'status': wallet.status,
                'created_at': wallet.created_at.isoformat()
            })
        
        return jsonify({
            'user_id': user_id,
            'wallets': wallet_list,
            'total_wallets': len(wallet_list)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@wallet_bp.route('/<wallet_id>/transfer', methods=['POST'])
def internal_transfer(wallet_id):
    """Transfer funds between wallets"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['to_wallet_id', 'amount', 'description']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        from_wallet = Wallet.query.get(wallet_id)
        to_wallet = Wallet.query.get(data['to_wallet_id'])
        
        if not from_wallet:
            return jsonify({'error': 'Source wallet not found'}), 404
        if not to_wallet:
            return jsonify({'error': 'Destination wallet not found'}), 404
        
        amount = Decimal(str(data['amount']))
        
        # Check if source wallet has sufficient balance
        if from_wallet.available_balance < amount:
            return jsonify({'error': 'Insufficient balance'}), 400
        
        # Check if wallets have same currency
        if from_wallet.currency != to_wallet.currency:
            return jsonify({'error': 'Currency mismatch between wallets'}), 400
        
        # Create debit transaction for source wallet
        debit_transaction = Transaction(
            wallet_id=wallet_id,
            transaction_type='debit',
            amount=amount,
            currency=from_wallet.currency,
            description=f"Transfer to wallet {data['to_wallet_id']}: {data['description']}",
            status='completed',
            payment_method='wallet_transfer'
        )
        
        # Create credit transaction for destination wallet
        credit_transaction = Transaction(
            wallet_id=data['to_wallet_id'],
            transaction_type='credit',
            amount=amount,
            currency=to_wallet.currency,
            description=f"Transfer from wallet {wallet_id}: {data['description']}",
            status='completed',
            payment_method='wallet_transfer'
        )
        
        # Update wallet balances
        from_wallet.balance -= amount
        from_wallet.available_balance -= amount
        to_wallet.balance += amount
        to_wallet.available_balance += amount
        
        # Update timestamps
        from_wallet.updated_at = datetime.utcnow()
        to_wallet.updated_at = datetime.utcnow()
        
        # Save all changes
        db.session.add(debit_transaction)
        db.session.add(credit_transaction)
        db.session.commit()
        
        return jsonify({
            'transfer_id': debit_transaction.id,
            'from_wallet_id': wallet_id,
            'to_wallet_id': data['to_wallet_id'],
            'amount': str(amount),
            'currency': from_wallet.currency,
            'status': 'completed',
            'description': data['description'],
            'created_at': debit_transaction.created_at.isoformat()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

